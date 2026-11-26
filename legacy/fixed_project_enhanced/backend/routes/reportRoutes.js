/**
 * reportRoutes.js — v6.0
 */
const router  = require('express').Router();
const report  = require('../controllers/reportController');
const protect = require('../middleware/authMiddleware');
const { staffOrAbove } = require('../middleware/authMiddleware');
const audit   = require('../middleware/auditMiddleware');

router.get('/preview/:type',  protect, report.previewReport);
router.post('/',              protect, staffOrAbove, audit('CREATE_REPORT','reports'), report.createReport);
router.get('/',               protect, report.getReports);
router.get('/:id',            protect, report.getReport);
router.put('/:id',            protect, staffOrAbove, report.updateReport);
router.delete('/:id',         protect, staffOrAbove, audit('DELETE_REPORT','reports'), report.deleteReport);
router.get('/:id/export',     protect, report.exportReport);

module.exports = router;
