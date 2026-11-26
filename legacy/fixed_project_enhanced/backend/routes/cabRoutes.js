const express = require('express');
const router  = express.Router();
const protect = require('../middleware/authMiddleware');
const cab = require('../controllers/cabController');

// ── Routes & vehicles ─────────────────────────────
router.get('/routes',                    protect, cab.getRoutes);
router.get('/vehicles',                  protect, cab.getVehicles);
router.get('/slots',                     protect, cab.getAvailableSlots);

// ── Employee booking ──────────────────────────────
router.post('/book',                     protect, cab.createBooking);
router.get('/my',                        protect, cab.getMyBookings);
router.delete('/my/:id',                 protect, cab.cancelBooking);
router.post('/rate',                     protect, cab.rateDriver);

// ── Tracking ──────────────────────────────────────
router.get('/track/:booking_id',         protect, cab.getTracking);
router.post('/ping',                     protect, cab.postPing);
router.patch('/journey/:booking_id/complete',  protect, cab.completeJourney);
router.patch('/journey/:booking_id/acknowledge', protect, cab.driverAcknowledge);
router.get('/notifications',                     protect, cab.getTravelNotifications);

// ── SOS ───────────────────────────────────────────
router.post('/sos',                      protect, cab.triggerSOS);
router.get('/sos',                       protect, cab.getSOSAlerts);
router.patch('/sos/:sos_id/resolve',     protect, cab.resolvesSOS);

// ── Admin/Manager ─────────────────────────────────
router.get('/all',                       protect, cab.getAllBookings);
router.patch('/:id/approve',             protect, cab.approveBooking);
router.patch('/:id/reject',              protect, cab.rejectBooking);

// ── Drivers (admin only) ──────────────────────────
router.get('/drivers',                   protect, cab.getDrivers);
router.get('/drivers/:id',               protect, cab.getDriver);
router.post('/drivers',                  protect, cab.createDriver);
router.patch('/drivers/:id',             protect, cab.updateDriver);
router.delete('/drivers/:id',            protect, cab.deleteDriver);

module.exports = router;

// SOS alias routes (used by sos-alerts.html frontend)
router.get('/sos-alerts',                    protect, cab.getSOSAlerts);
router.patch('/sos-alerts/:sos_id/resolve',  protect, cab.resolvesSOS);
