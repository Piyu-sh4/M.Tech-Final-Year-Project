/**
 * cacheService.js — Redis Cache Layer (FIXED)
 * ─────────────────────────────────────────────
 * FIXES:
 *  - Stops infinite Redis reconnect spam (was flooding console)
 *  - Gives up after 3 retries, disables cache gracefully
 *  - App works perfectly without Redis (all cache calls are no-ops)
 */

let client    = null;
let connected = false;
let disabled  = false;   // set true permanently when Redis is absent

// ── Connect (called once at startup) ──────────────────────────────────
async function connect() {
  // Lazy-require so missing redis package won't crash the server
  let redis;
  try { redis = require('redis'); }
  catch(e) {
    console.warn('[CACHE] redis package not installed — cache disabled');
    disabled = true; return;
  }

  const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    client = redis.createClient({
      url: REDIS_URL,
      socket: {
        // Give up after 3 retries — stops the infinite spam
        reconnectStrategy: (retries) => {
          if (retries >= 3) {
            console.warn('[CACHE] Redis unavailable after 3 attempts — cache disabled. App runs fine without it.');
            disabled   = true;
            connected  = false;
            return false;          // returning false stops all reconnection
          }
          return Math.min(retries * 500, 2000); // 500ms, 1s, 2s
        },
        connectTimeout: 3000
      }
    });

    // Silent error handler (errors already handled by reconnectStrategy)
    client.on('error', () => { connected = false; });
    client.on('connect', () => {
      connected = true;
      disabled  = false;
      console.log('[CACHE] Redis connected ✅');
    });
    client.on('end', () => { connected = false; });

    await client.connect();
  } catch (e) {
    console.warn('[CACHE] Redis unavailable — cache disabled. App runs fine without it.');
    disabled  = true;
    connected = false;
  }
}

const isReady = () => connected && !disabled && client;

// ── GET ────────────────────────────────────────────────────────────────
async function get(key) {
  if (!isReady()) return null;
  try {
    const raw = await client.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ── SET with TTL (seconds) ─────────────────────────────────────────────
async function set(key, value, ttlSeconds = 300) {
  if (!isReady()) return false;
  try {
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch { return false; }
}

// ── DELETE ─────────────────────────────────────────────────────────────
async function del(key) {
  if (!isReady()) return false;
  try { await client.del(key); return true; }
  catch { return false; }
}

// ── INVALIDATE by pattern ──────────────────────────────────────────────
async function invalidate(pattern) {
  if (!isReady()) return 0;
  try {
    const keys = await client.keys(pattern);
    if (keys.length === 0) return 0;
    await client.del(keys);
    return keys.length;
  } catch { return 0; }
}

// ── WRAP: cache-aside helper ───────────────────────────────────────────
async function wrap(key, ttlSeconds, fetchFn) {
  const cached = await get(key);
  if (cached !== null) return cached;
  const fresh = await fetchFn();
  await set(key, fresh, ttlSeconds);
  return fresh;
}

// A fixed-window counter must set its expiry in the same operation as its first increment.
async function incrementWindow(key, windowMs) {
  if (!isReady()) return null;
  return client.eval(
    "local count = redis.call('INCR', KEYS[1]); " +
    "if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]); end; " +
    "return {count, redis.call('PTTL', KEYS[1])}",
    { keys: [key], arguments: [String(windowMs)] }
  );
}

const TTL = {
  LEADERBOARD:    300,
  KPI_TRENDS:     300,
  TOP_PERFORMERS: 300,
  HR_SUMMARY:      60,
  DEPT_STATS:     600,
  ATTRITION:     3600,
};

module.exports = { connect, get, set, del, invalidate, wrap, incrementWindow, TTL };
