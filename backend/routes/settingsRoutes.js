/**
 * settingsRoutes.js — Company Settings Center v8.0
 * Mounted at /api/settings
 * Frontend calls: GET /api/settings, POST /api/settings/bulk, etc.
 */
const router  = require('express').Router();
const ctrl    = require('../controllers/settingsController');
const protect = require('../middleware/authMiddleware');
const { adminOnly, staffOrAbove, hrOrAbove } = require('../middleware/authMiddleware');
const audit   = require('../middleware/auditMiddleware');

/* ── Company Settings ───────────────────────────────── */
router.get ('/',              protect, staffOrAbove, ctrl.getAllSettings);
router.post('/',              protect, adminOnly, audit('UPSERT_SETTING','company_settings'), ctrl.upsertSetting);
router.post('/bulk',          protect, adminOnly, audit('BULK_SETTINGS','company_settings'),  ctrl.bulkUpsertSettings);

/* ── Policies ───────────────────────────────────────── */
router.get ('/policies',      protect, ctrl.getPolicies);
router.get ('/policies/:id',  protect, ctrl.getPolicyById);
router.post('/policies',      protect, hrOrAbove, audit('CREATE_POLICY','company_policies'),   ctrl.createPolicy);
router.put ('/policies/:id',  protect, hrOrAbove, audit('UPDATE_POLICY','company_policies'),   ctrl.updatePolicy);
router.delete('/policies/:id',protect, adminOnly,    audit('DELETE_POLICY','company_policies'),   ctrl.deletePolicy);

/* ── Office Locations ───────────────────────────────── */
router.get ('/locations',     protect, ctrl.getLocations);
router.get ('/locations/:id', protect, ctrl.getLocationById);
router.post('/locations',     protect, adminOnly, audit('CREATE_LOCATION','office_locations'), ctrl.createLocation);
router.put ('/locations/:id', protect, adminOnly, audit('UPDATE_LOCATION','office_locations'), ctrl.updateLocation);
router.delete('/locations/:id',protect,adminOnly, audit('DELETE_LOCATION','office_locations'), ctrl.deleteLocation);

router.get ('/:group/:key',   protect, staffOrAbove, ctrl.getSettingByKey);
router.delete('/:group/:key', protect, adminOnly, audit('DELETE_SETTING','company_settings'), ctrl.deleteSetting);

module.exports = router;
