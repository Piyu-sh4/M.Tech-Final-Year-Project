/**
 * reportRoutes.js — v6.0
 */
const router  = require('express').Router();
const report  = require('../controllers/reportController');
const protect = require('../middleware/authMiddleware');
const { staffOrAbove } = require('../middleware/authMiddleware');
const audit   = require('../middleware/auditMiddleware');
const { query } = require('../services/database');
const database = require('../config/db');

async function reportAuthorOrAdmin(request, response, next) {
  try {
    const [report] = await query(database, 'SELECT generated_by FROM reports WHERE report_id=?', [request.params.id]);
    if (!report) return response.status(404).json({ message: 'Report not found.' });
    if (request.user.role_id !== 1 && report.generated_by !== request.user.user_id)
      return response.status(403).json({ message: 'Only the author or an administrator can change this report.' });
    next();
  } catch (error) { next(error); }
}

router.get('/preview/:type',  protect, staffOrAbove, report.previewReport);
router.post('/',              protect, staffOrAbove, audit('CREATE_REPORT','reports'), report.createReport);
router.get('/',               protect, staffOrAbove, report.getReports);
router.get('/:id',            protect, staffOrAbove, report.getReport);
router.put('/:id',            protect, staffOrAbove, reportAuthorOrAdmin, report.updateReport);
router.delete('/:id',         protect, staffOrAbove, reportAuthorOrAdmin, audit('DELETE_REPORT','reports'), report.deleteReport);
router.get('/:id/pdf',         protect, report.downloadPdf);
router.get('/:id/export',     protect, staffOrAbove, report.exportReport);

module.exports = router;
