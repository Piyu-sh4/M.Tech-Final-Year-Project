/**
 * locationController.js — v12.1
 * Login Location Detection, Weather, Session Tracking & User Preferences
 */
const db = require('../config/db');
const https = require('https');
const q = (sql, p) => new Promise((r, j) => db.query(sql, p || [], (e, res) => e ? j(e) : r(res)));

// ── HTTP helper (no external deps) ──────────────────────────────────────────
const httpGet = (url) => new Promise((resolve, reject) => {
  const request = https.get(url, { headers: { 'User-Agent': 'WorkforceIntelligence' } }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try { resolve(JSON.parse(data)); } catch { resolve(null); }
    });
  }).on('error', reject);
  request.setTimeout(5000, () => request.destroy(new Error('Location service timed out')));
});

// ── Weather emoji mapper ─────────────────────────────────────────────────────
function weatherEmoji(condition = '') {
  const c = condition.toLowerCase();
  if (c.includes('thunder') || c.includes('storm')) return '⛈️';
  if (c.includes('snow') || c.includes('blizzard'))  return '❄️';
  if (c.includes('rain') || c.includes('drizzle'))   return '🌧️';
  if (c.includes('shower'))                           return '🌦️';
  if (c.includes('fog') || c.includes('mist'))        return '🌫️';
  if (c.includes('cloud') || c.includes('overcast'))  return '⛅';
  if (c.includes('sunny') || c.includes('clear'))     return '☀️';
  if (c.includes('partly'))                           return '🌤️';
  if (c.includes('wind'))                             return '💨';
  if (c.includes('haze') || c.includes('smoke'))      return '🌫️';
  return '🌡️';
}

// ── Detect device type from user-agent ──────────────────────────────────────
function detectDevice(ua = '') {
  if (/mobile|android|iphone|ipad/i.test(ua)) return /ipad|tablet/i.test(ua) ? 'tablet' : 'mobile';
  return 'desktop';
}
function detectBrowser(ua = '') {
  if (/edg/i.test(ua))    return 'Edge';
  if (/chrome/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua)) return 'Safari';
  if (/firefox/i.test(ua))return 'Firefox';
  if (/opera/i.test(ua))  return 'Opera';
  return 'Unknown';
}
function detectOS(ua = '') {
  if (/windows nt 10/i.test(ua)) return 'Windows 10/11';
  if (/windows/i.test(ua))        return 'Windows';
  if (/mac os x/i.test(ua))       return 'macOS';
  if (/android/i.test(ua))        return 'Android';
  if (/ios|iphone|ipad/i.test(ua))return 'iOS';
  if (/linux/i.test(ua))          return 'Linux';
  return 'Unknown';
}

// ── Fetch weather from Open-Meteo (FREE, no API key) ────────────────────────
async function fetchWeather(lat, lng) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&wind_speed_unit=kmh&temperature_unit=celsius`;
    const data = await httpGet(url);
    if (!data?.current) return null;

    // WMO Weather codes → description
    const wmoDescriptions = {
      0:'Clear sky', 1:'Mainly clear', 2:'Partly cloudy', 3:'Overcast',
      45:'Foggy', 48:'Freezing fog', 51:'Light drizzle', 53:'Drizzle',
      55:'Heavy drizzle', 61:'Slight rain', 63:'Rain', 65:'Heavy rain',
      71:'Slight snow', 73:'Snow', 75:'Heavy snow', 80:'Rain showers',
      81:'Rain showers', 82:'Violent rain showers', 85:'Snow showers',
      86:'Heavy snow showers', 95:'Thunderstorm', 96:'Thunderstorm + hail',
      99:'Severe thunderstorm'
    };
    const code = data.current.weather_code;
    const condition = wmoDescriptions[code] || 'Clear sky';
    const tempC = data.current.temperature_2m;
    return {
      temperature_c: tempC,
      temperature_f: Math.round((tempC * 9/5 + 32) * 10) / 10,
      feels_like_c:  data.current.apparent_temperature,
      humidity_pct:  data.current.relative_humidity_2m,
      wind_kph:      data.current.wind_speed_10m,
      weather_condition: condition,
      weather_icon:  weatherEmoji(condition)
    };
  } catch (e) {
    console.warn('[Weather]', e.message);
    return null;
  }
}

// ── Reverse geocode from Nominatim (FREE) ───────────────────────────────────
async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`;
    const data = await httpGet(url);
    if (!data?.address) return null;
    const a = data.address;
    return {
      city:     a.city || a.town || a.village || a.county || '',
      district: a.county || a.state_district || '',
      state:    a.state || '',
      country:  a.country || 'India',
      pincode:  a.postcode || '',
      full_address: data.display_name || ''
    };
  } catch (e) {
    console.warn('[Geocode]', e.message);
    return null;
  }
}

// Look up an IP only after the account explicitly selects IP-based location.
async function geoFromIP(ip) {
  try {
    const cleanIP = ip.replace('::ffff:', '');
    if (cleanIP === '127.0.0.1' || cleanIP === '::1') return null;
    const data = await httpGet(`https://ipwho.is/${encodeURIComponent(cleanIP)}`);
    if (data?.success !== true) return null;
    return {
      latitude:  data.latitude,
      longitude: data.longitude,
      city:      data.city || '',
      state:     data.region || '',
      country:   data.country || '',
      pincode:   data.postal || ''
    };
  } catch (e) {
    return null;
  }
}

// ════════════════════════════════════════════════════════════════
// POST /location/session  —  called right after login with GPS coords
// ════════════════════════════════════════════════════════════════
exports.recordLoginLocation = async (req, res) => {
  try {
    const { latitude, longitude, manual_city, manual_state } = req.body;
    const [preferences]=await q('SELECT * FROM user_location_prefs WHERE user_id=?',[req.user.user_id]);
    const location_source=preferences?.location_enabled === 1 ? preferences.location_source : 'disabled';
    if (location_source !== 'disabled' && req.body.location_source && location_source !== req.body.location_source)
      return res.status(409).json({message:'Save the location source before using it.'});
    if(!['gps','manual','ip','disabled'].includes(location_source))return res.status(400).json({message:'Choose a supported location source.'});
    const weatherEnabled=preferences?.weather_enabled===1;
    const ua      = req.headers['user-agent'] || '';
    const ip      = require('../services/requestIdentity').clientIp(req);
    const user_id = req.user.user_id;

    let geo = null, weather = null;
    let lat = parseFloat(latitude), lng = parseFloat(longitude);

    // 1. Resolve location
    if (location_source === 'disabled') {
      // Disabled means coordinates are discarded even if a caller submits them.
      lat=NaN;lng=NaN;
    } else if (location_source === 'manual' && manual_city) {
      geo = { city: manual_city, state: manual_state || '', country: 'India', district: '', pincode: '', full_address: manual_city };
    } else if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat)<=90 && Math.abs(lng)<=180 && location_source === 'gps') {
      // Parallel: geocode + weather
      const [geoResult, weatherResult] = await Promise.allSettled([
        reverseGeocode(lat, lng),
        weatherEnabled ? fetchWeather(lat, lng) : Promise.resolve(null)
      ]);
      geo     = geoResult.status     === 'fulfilled' ? geoResult.value     : null;
      weather = weatherResult.status === 'fulfilled' ? weatherResult.value : null;
    } else if(location_source==='ip') {
      // Approximate IP location is requested explicitly; it is never GPS proof.
      const ipGeo = await geoFromIP(ip);
      if (ipGeo) {
        lat = ipGeo.latitude; lng = ipGeo.longitude;
        geo = { city: ipGeo.city, state: ipGeo.state, country: ipGeo.country, district: '', pincode: ipGeo.pincode, full_address: `${ipGeo.city}, ${ipGeo.state}` };
        if (weatherEnabled && Number.isFinite(lat) && Number.isFinite(lng)) weather = await fetchWeather(lat, lng);
      }
    }

    if(location_source==='gps' && (!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180))return res.status(400).json({message:'Browser location requires valid coordinates.'});
    if(location_source==='manual' && (!manual_city || typeof manual_city!=='string' || manual_city.length>100))return res.status(400).json({message:'Enter your manual city.'});
    // 2. Insert session record
    const r = await q(
      `INSERT INTO login_sessions (user_id, ip_address, latitude, longitude,
        city, district, state, country, pincode, location_source, full_address,
        temperature_c, temperature_f, weather_condition, weather_icon,
        humidity_pct, wind_kph, feels_like_c,
        user_agent, device_type, browser, os)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        user_id, ip, Number.isFinite(lat) ? lat : null, Number.isFinite(lng) ? lng : null,
        geo?.city || null, geo?.district || null, geo?.state || null,
        geo?.country || null, geo?.pincode || null,
        location_source, geo?.full_address || null,
        weather?.temperature_c ?? null, weather?.temperature_f ?? null,
        weather?.weather_condition || null, weather?.weather_icon || null,
        weather?.humidity_pct ?? null, weather?.wind_kph ?? null, weather?.feels_like_c ?? null,
        ua, detectDevice(ua), detectBrowser(ua), detectOS(ua)
      ]
    );

    // 3. Update user_location_prefs last known
    if (geo || weather) {
      await q(
        `INSERT INTO user_location_prefs (user_id, last_city, last_state, last_temp_c, last_weather, last_weather_icon, last_updated)
         VALUES (?,?,?,?,?,?,NOW())
         ON DUPLICATE KEY UPDATE last_city=VALUES(last_city), last_state=VALUES(last_state),
           last_temp_c=VALUES(last_temp_c), last_weather=VALUES(last_weather),
           last_weather_icon=VALUES(last_weather_icon), last_updated=NOW()`,
        [user_id, geo?.city || null, geo?.state || null,
         weather?.temperature_c ?? null, weather?.weather_condition || null, weather?.weather_icon || null]
      );
    }

    res.json({
      session_id: r.insertId,
      location: geo,
      weather,
      device: { type: detectDevice(ua), browser: detectBrowser(ua), os: detectOS(ua) },
      message: 'Session recorded'
    });
  } catch (e) {
    console.error('[Location]', e.message);
    res.status(500).json({ message: e.message });
  }
};

// ════════════════════════════════════════════════════════════════
// GET /location/me  —  current user's last location + live weather
// ════════════════════════════════════════════════════════════════
exports.getMyLocation = async (req, res) => {
  try {
    const [pref] = await q('SELECT * FROM user_location_prefs WHERE user_id=?', [req.user.user_id]);
    const [lastSession] = await q(
      `SELECT * FROM login_sessions WHERE user_id=? ORDER BY login_at DESC LIMIT 1`,
      [req.user.user_id]
    );
    res.json({ preferences: pref || null, last_session: lastSession || null });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ════════════════════════════════════════════════════════════════
// GET /location/live?lat=&lng=  —  live weather for given coords
// ════════════════════════════════════════════════════════════════
exports.getLiveWeather = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const [consent] = await q('SELECT location_enabled,weather_enabled,location_source FROM user_location_prefs WHERE user_id=?',[req.user.user_id]);
    if (!consent?.location_enabled || !consent.weather_enabled || consent.location_source === 'ip')
      return res.status(403).json({message:'Enable coordinate-based location and weather in settings first.'});
    if (![lat,lng].every(value => typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) || Math.abs(Number(lat))>90 || Math.abs(Number(lng))>180)
      return res.status(400).json({message:'Valid latitude and longitude required.'});
    const [weather, geo] = await Promise.allSettled([
      fetchWeather(parseFloat(lat), parseFloat(lng)),
      reverseGeocode(parseFloat(lat), parseFloat(lng))
    ]);
    res.json({
      weather: weather.value || null,
      location: geo.value || null,
      coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) }
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ════════════════════════════════════════════════════════════════
// PATCH /location/preferences  —  update location on/off/manual
// ════════════════════════════════════════════════════════════════
exports.updatePreferences = async (req, res) => {
  try {
    const { location_enabled, weather_enabled, location_source, manual_city, manual_state, manual_lat, manual_lng, temp_unit } = req.body;
    if(location_source && !['gps','manual','ip'].includes(location_source) || temp_unit && !['celsius','fahrenheit'].includes(temp_unit))return res.status(400).json({message:'Invalid location source or temperature unit.'});
    for(const value of [location_enabled,weather_enabled])if(value!==undefined && ![true,false,0,1].includes(value))return res.status(400).json({message:'Location switches must be boolean values.'});
    for(const value of [manual_city,manual_state])if(value!=null && (typeof value!=='string' || value.length>100))return res.status(400).json({message:'Enter a valid city and state.'});
    const fields = {location_enabled,weather_enabled,location_source,manual_city,manual_state,manual_lat,manual_lng,temp_unit};
    const patch = Object.fromEntries(Object.entries(fields).filter(([,value]) => value !== undefined));
    if (!Object.keys(patch).length) return res.status(400).json({message:'No preferences supplied.'});
    // New accounts start with both switches off. Only submitted keys change on existing rows.
    const defaults = {location_enabled:0,weather_enabled:0,location_source:'manual',temp_unit:'celsius'};
    await q('INSERT INTO user_location_prefs SET ? ON DUPLICATE KEY UPDATE ?', [{user_id:req.user.user_id,...defaults,...patch},patch]);
    res.json({ message: 'Location preferences updated' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ════════════════════════════════════════════════════════════════
// GET /location/sessions  —  login history with locations
// ════════════════════════════════════════════════════════════════
exports.getMySessions = async (req, res) => {
  try {
    const rows = await q(
      `SELECT session_id, ip_address, city, state, country,
        temperature_c, temperature_f, weather_condition, weather_icon,
        feels_like_c, humidity_pct, wind_kph,
        device_type, browser, os, location_source,
        login_at, logout_at, duration_minutes, is_active
       FROM login_sessions WHERE user_id=?
       ORDER BY login_at DESC LIMIT 20`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ════════════════════════════════════════════════════════════════
// GET /location/sessions/all  —  admin: all users' login locations
// ════════════════════════════════════════════════════════════════
exports.getAllSessions = async (req, res) => {
  try {
    const { date, city } = req.query;
    let sql = `SELECT ls.*, u.full_name, u.email, u.designation
      FROM login_sessions ls JOIN users u ON u.user_id=ls.user_id WHERE 1=1`;
    const p = [];
    if (date) { sql += ' AND DATE(ls.login_at)=?'; p.push(date); }
    if (city) { sql += ' AND ls.city LIKE ?'; p.push(`%${city}%`); }
    sql += ' ORDER BY ls.login_at DESC LIMIT 100';
    res.json(await q(sql, p));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ════════════════════════════════════════════════════════════════
// POST /location/logout  —  mark session as ended
// ════════════════════════════════════════════════════════════════
exports.recordLogout = async (req, res) => {
  try {
    await q(
      `UPDATE login_sessions SET logout_at=NOW(), is_active=0,
        duration_minutes=TIMESTAMPDIFF(MINUTE, login_at, NOW())
       WHERE user_id=? AND is_active=1 ORDER BY login_at DESC LIMIT 1`,
      [req.user.user_id]
    );
    res.json({ message: 'Session closed' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ════════════════════════════════════════════════════════════════
// GET /location/offices  —  list office locations
// ════════════════════════════════════════════════════════════════
exports.getOffices = async (req, res) => {
  try {
    res.json(await q('SELECT * FROM office_locations WHERE is_active=1 ORDER BY name'));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ════════════════════════════════════════════════════════════════
// POST /location/detect-office  —  check if user is at an office
// ════════════════════════════════════════════════════════════════
exports.detectOffice = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) return res.status(400).json({ message: 'Coordinates required' });
    const offices = await q('SELECT * FROM office_locations WHERE is_active=1');
    const R = 6371000; // Earth radius in meters
    const toRad = d => d * Math.PI / 180;
    const haversine = (lat1, lng1, lat2, lng2) => {
      const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
      const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    };
    const nearby = offices.map(o => ({
      ...o,
      distance_m: Math.round(haversine(latitude, longitude, o.latitude, o.longitude))
    })).filter(o => o.distance_m <= o.radius_meters).sort((a,b) => a.distance_m - b.distance_m);
    res.json({ at_office: nearby.length > 0, nearest_office: nearby[0] || null, all_nearby: nearby });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ════════════════════════════════════════════════════════════════
// GET /location/weather-widget  —  lightweight widget data
// ════════════════════════════════════════════════════════════════
exports.getWeatherWidget = async (req, res) => {
  try {
    const [pref] = await q(
      `SELECT ulp.*, ls.city, ls.state, ls.temperature_c, ls.temperature_f,
        ls.weather_condition, ls.weather_icon, ls.feels_like_c,
        ls.humidity_pct, ls.wind_kph, ls.login_at
       FROM user_location_prefs ulp
       LEFT JOIN login_sessions ls ON ls.user_id=ulp.user_id
       WHERE ulp.user_id=? ORDER BY ls.login_at DESC LIMIT 1`,
      [req.user.user_id]
    );
    if (!pref) {
      // No prefs yet — return empty
      return res.json({ enabled: false, data: null });
    }
    res.json({
      enabled: pref.location_enabled == 1,
      weather_enabled: pref.weather_enabled == 1,
      temp_unit: pref.temp_unit || 'celsius',
      data: {
        city:              pref.last_city || pref.city,
        state:             pref.last_state || pref.state,
        temperature_c:     pref.last_temp_c || pref.temperature_c,
        temperature_f:     pref.temperature_f,
        feels_like_c:      pref.feels_like_c,
        weather_condition: pref.last_weather || pref.weather_condition,
        weather_icon:      pref.last_weather_icon || pref.weather_icon,
        humidity_pct:      pref.humidity_pct,
        wind_kph:          pref.wind_kph,
        as_of:             pref.last_updated || pref.login_at
      }
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
