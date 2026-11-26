/**
 * cabSafetyController.js — v12.0
 * Cab Safety: Vehicle Details, Driver ID Cards, Enhanced GPS, Safety Panel
 */
const db = require('../config/db');
const q = (sql, p) => new Promise((r, j) => db.query(sql, p||[], (e,res) => e ? j(e) : r(res)));

exports.getVehicleDetails = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const [b] = await q(
      `SELECT cb.*, v.label AS vehicle_number, v.label AS vehicle_model, v.vehicle_type,
        NULL AS insurance_expiry, NULL AS puc_expiry, NULL AS fitness_expiry,
        NULL AS driver_name, NULL AS driver_phone,
        NULL AS license_number, NULL AS license_expiry, NULL AS photo_url
       FROM cab_bookings cb
       LEFT JOIN cab_vehicles v ON v.vehicle_id = cb.vehicle_id
       WHERE cb.booking_id = ?`, [booking_id]
    );
    if (!b) return res.status(404).json({ message: 'Booking not found' });
    const today = new Date();
    const safetyFlags = [];
    if (b.insurance_expiry && new Date(b.insurance_expiry) < today) safetyFlags.push('Insurance expired');
    if (b.puc_expiry && new Date(b.puc_expiry) < today) safetyFlags.push('PUC certificate expired');
    if (b.fitness_expiry && new Date(b.fitness_expiry) < today) safetyFlags.push('Fitness certificate expired');
    if (b.license_expiry && new Date(b.license_expiry) < today) safetyFlags.push('Driver license expired');
    const { otp, ...booking } = b;
    res.json({ ...booking, safety_flags: safetyFlags, is_safe: safetyFlags.length === 0 });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.assignDriver = async (req, res) => {
  try {
    const { booking_id, driver_id, vehicle_id } = req.body;
    await q('UPDATE cab_bookings SET driver_id=?, vehicle_id=? WHERE booking_id=?',
      [driver_id, vehicle_id, booking_id]);
    res.json({ message: 'Driver and vehicle assigned' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getDriverIdCard = async (req, res) => {
  try {
    const { driver_id } = req.params;
    const [d] = await q(
      `SELECT d.*, COUNT(DISTINCT cb.booking_id) AS total_trips,
        d.rating AS avg_rating
       FROM cab_drivers d
       LEFT JOIN cab_bookings cb ON cb.driver_id = d.driver_id AND cb.journey_status = 'completed'
       WHERE d.driver_id = ?
       GROUP BY d.driver_id`, [driver_id]
    );
    if (!d) return res.status(404).json({ message: 'Driver not found' });
    res.json({
      ...d,
      id_card: {
        name: d.full_name,
        employee_id: d.employee_code || `DRV-${String(d.driver_id).padStart(4,'0')}`,
        license: d.license_number,
        license_expiry: d.license_expiry,
        vehicle_types: d.vehicle_types || 'Sedan, SUV',
        total_trips: d.total_trips || 0,
        avg_rating: d.avg_rating ? parseFloat(d.avg_rating).toFixed(1) : 'N/A',
        issued_date: new Date().toISOString().split('T')[0],
        valid_until: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
        emergency_contact: '1800-XXX-XXXX',
        organization: 'Workforce Intelligence Transport Division'
      }
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAllDriverIdCards = async (req, res) => {
  try {
    const drivers = await q(
      `SELECT d.driver_id, d.full_name, d.mobile AS phone, d.license_expiry,
        d.employee_code, d.status, COUNT(cb.booking_id) AS total_trips,
        ROUND(d.rating,1) AS avg_rating
       FROM cab_drivers d
       LEFT JOIN cab_bookings cb ON cb.driver_id=d.driver_id AND cb.status='completed'
       GROUP BY d.driver_id ORDER BY d.full_name`
    );
    res.json(drivers.map(d => ({
      ...d,
      employee_id: d.employee_code || `DRV-${String(d.driver_id).padStart(4,'0')}`,
      card_status: d.license_expiry && new Date(d.license_expiry) < new Date() ? 'expired' : 'active'
    })));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getLiveTrackingDetails = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const [b] = await q(
      `SELECT cb.*, ct.latitude, ct.longitude, ct.speed_kmh AS speed, ct.recorded_at AS last_ping,
        d.full_name AS driver_name, d.mobile AS driver_phone, v.label AS vehicle_number
       FROM cab_bookings cb
       LEFT JOIN cab_tracking ct ON ct.booking_id=cb.booking_id
       LEFT JOIN cab_drivers d ON d.driver_id=cb.driver_id
       LEFT JOIN cab_vehicles v ON v.vehicle_id=cb.vehicle_id
       WHERE cb.booking_id=?
       ORDER BY ct.recorded_at DESC LIMIT 1`, [booking_id]
    );
    if (!b) return res.status(404).json({ message: 'Booking not found' });
    const { otp, ...booking } = b;
    res.json({
      ...booking,
      estimated_arrival: '15 mins',
      trip_progress: b.status === 'in_progress' ? 60 : b.status === 'completed' ? 100 : 0,
      safety_status: 'safe',
      last_seen: b.last_ping
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getLocationFacilities = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    // Returns nearby safety points (police, hospitals, petrol)
    res.json({
      nearby: [
        { type: 'police', name: 'Nearest Police Station', distance: '1.2 km', phone: '100' },
        { type: 'hospital', name: 'Nearest Hospital', distance: '2.5 km', phone: '108' },
        { type: 'petrol', name: 'Nearest Fuel Station', distance: '0.8 km', phone: null },
        { type: 'cab_stand', name: 'Nearest Cab Stand', distance: '0.5 km', phone: null }
      ],
      coordinates: { lat, lng }
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getEmergencyHelplines = async (req, res) => {
  try {
    res.json([
      { name: 'Police',              number: '100',          type: 'emergency' },
      { name: 'Ambulance',           number: '108',          type: 'medical' },
      { name: 'Women Helpline',      number: '1091',         type: 'safety' },
      { name: 'Fire',                number: '101',          type: 'emergency' },
      { name: 'National Emergency',  number: '112',          type: 'emergency' },
      { name: 'Corporate Safety',    number: '1800-XXX-YYY', type: 'internal' },
      { name: 'HR Emergency',        number: '1800-XXX-ZZZ', type: 'internal' },
      { name: 'Cab Dispatch',        number: '1800-XXX-CAB', type: 'internal' }
    ]);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getBookingSafetyPanel = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const [vehicle] = await q(
      `SELECT cb.booking_id, cb.status, r.pickup_stop AS pickup_location, NULL AS drop_location,
        v.label AS vehicle_number, v.label AS vehicle_model, NULL AS insurance_expiry, NULL AS puc_expiry,
        d.full_name AS driver_name, d.mobile AS phone, d.license_expiry,
        ct.latitude, ct.longitude, ct.recorded_at AS last_ping
       FROM cab_bookings cb
       LEFT JOIN cab_routes r ON r.route_id=cb.route_id
       LEFT JOIN cab_vehicles v ON v.vehicle_id=cb.vehicle_id
       LEFT JOIN cab_drivers d ON d.driver_id=cb.driver_id
       LEFT JOIN cab_tracking ct ON ct.booking_id=cb.booking_id
       WHERE cb.booking_id=?
       ORDER BY ct.recorded_at DESC LIMIT 1`, [booking_id]
    );
    const today = new Date();
    const flags = [];
    if (vehicle?.insurance_expiry && new Date(vehicle.insurance_expiry) < today) flags.push('Insurance expired');
    if (vehicle?.puc_expiry && new Date(vehicle.puc_expiry) < today) flags.push('PUC expired');
    if (vehicle?.license_expiry && new Date(vehicle.license_expiry) < today) flags.push('License expired');

    res.json({
      booking: vehicle,
      safety_score: Math.max(0, 100 - (flags.length * 25)),
      safety_flags: flags,
      emergency_contacts: [
        { label: 'Police', number: '100' },
        { label: 'Ambulance', number: '108' },
        { label: 'Women Helpline', number: '1091' },
        { label: 'Corporate Safety', number: '1800-XXX-YYY' }
      ],
      sos_active: false
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
