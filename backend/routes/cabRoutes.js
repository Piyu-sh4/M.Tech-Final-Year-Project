const express = require('express');
const router  = express.Router();
const protect = require('../middleware/authMiddleware');
const { staffOrAbove } = protect;
const { readBooking, passengerBooking, optionalPassengerBooking, issueAccess } = require('../middleware/cabAccess');
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
router.get('/track/:booking_id',         protect, readBooking, cab.getTracking);
router.post('/ping',                     protect, staffOrAbove, cab.postPing);
router.patch('/journey/:booking_id/complete',  protect, staffOrAbove, cab.completeJourney);
router.patch('/journey/:booking_id/acknowledge', protect, staffOrAbove, cab.driverAcknowledge);
router.get('/notifications',                     protect, staffOrAbove, cab.getTravelNotifications);

// ── SOS ───────────────────────────────────────────
router.post('/sos',                      protect, passengerBooking, cab.triggerSOS);
router.get('/sos',                       protect, staffOrAbove, cab.getSOSAlerts);
router.patch('/sos/:sos_id/resolve',     protect, staffOrAbove, cab.resolvesSOS);

// ── Admin/Manager ─────────────────────────────────
router.get('/all',                       protect, staffOrAbove, cab.getAllBookings);
router.patch('/:id/approve',             protect, staffOrAbove, cab.approveBooking);
router.patch('/:id/reject',              protect, staffOrAbove, cab.rejectBooking);

// ── Drivers (admin only) ──────────────────────────
router.get('/drivers',                   protect, staffOrAbove, cab.getDrivers);
router.get('/drivers/:id',               protect, staffOrAbove, cab.getDriver);
router.post('/drivers',                  protect, staffOrAbove, cab.createDriver);
router.patch('/drivers/:id',             protect, staffOrAbove, cab.updateDriver);
router.delete('/drivers/:id',            protect, staffOrAbove, cab.deleteDriver);


// SOS alias routes (used by sos-alerts.html frontend)
router.get('/sos-alerts',                    protect, staffOrAbove, cab.getSOSAlerts);
router.patch('/sos-alerts/:sos_id/resolve',  protect, staffOrAbove, cab.resolvesSOS);

// ── Cab Issue / Complaint Tickets ─────────────────────────────
const cabIssue = require('../controllers/cabIssueController');
router.post('/issues',              protect, optionalPassengerBooking, cabIssue.raiseIssue);
router.get('/issues/my',            protect, cabIssue.getMyIssues);
router.get('/issues/stats',         protect, staffOrAbove, cabIssue.getStats);
router.get('/issues',               protect, staffOrAbove, cabIssue.getAllIssues);
router.patch('/issues/:id',         protect, staffOrAbove, cabIssue.updateIssue);
router.get('/issues/:id/comments',  protect, issueAccess, cabIssue.getComments);
router.post('/issues/:id/comments', protect, issueAccess, cabIssue.addComment);

module.exports = router;
