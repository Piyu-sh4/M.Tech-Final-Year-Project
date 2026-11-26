/**
 * safetyRoutes.js — Women Safety Module v8.0
 */
const router  = require('express').Router();
const ctrl    = require('../controllers/safetyController');
const protect = require('../middleware/authMiddleware');
const { adminOnly, staffOrAbove, hrOrAbove } = require('../middleware/authMiddleware');
const audit   = require('../middleware/auditMiddleware');

/* ── SOS ───────────────────────────────────────────── */
router.post('/sos/trigger',              protect, audit('SOS_TRIGGER','safety_sos_events'), ctrl.triggerSOS);
router.get ('/sos/active',               protect, hrOrAbove, ctrl.getActiveSOS);
router.get ('/sos',                      protect, hrOrAbove, ctrl.getAllSOS);
router.patch('/sos/:id/respond',         protect, hrOrAbove, ctrl.respondSOS);
router.patch('/sos/:id/resolve',         protect, hrOrAbove, audit('RESOLVE_SOS','safety_sos_events'), ctrl.resolveSOS);

/* ── Complaints (POSH) ─────────────────────────────── */
router.post('/complaints',               protect, ctrl.fileComplaint);
router.get ('/complaints/my',            protect, ctrl.getMyComplaints);
router.get ('/complaints',               protect, hrOrAbove, ctrl.getAllComplaints);
router.patch('/complaints/:id',          protect, hrOrAbove, ctrl.updateComplaint);

/* ── Night Shift Approvals ─────────────────────────── */
router.post('/night-shift',              protect, ctrl.requestNightShiftApproval);
router.get ('/night-shift/my',           protect, ctrl.getMyNightShiftRequests);
router.get ('/night-shift',              protect, staffOrAbove, ctrl.getAllNightShiftRequests);
router.post('/night-shift/:id/cancel',   protect, ctrl.cancelNightShift);
router.patch('/night-shift/:id/review',  protect, staffOrAbove, audit('REVIEW_NIGHT_SHIFT','safety_night_shift_approvals'), ctrl.reviewNightShift);

/* ── Emergency Contacts ────────────────────────────── */
router.get ('/contacts',                 protect, ctrl.getMyEmergencyContacts);
router.post('/contacts',                 protect, ctrl.addEmergencyContact);
router.put ('/contacts/:id',             protect, ctrl.updateEmergencyContact);
router.delete('/contacts/:id',           protect, ctrl.deleteEmergencyContact);

/* ── Dashboard ─────────────────────────────────────── */
router.get ('/dashboard',                protect, hrOrAbove, ctrl.getSafetyDashboard);

module.exports = router;
