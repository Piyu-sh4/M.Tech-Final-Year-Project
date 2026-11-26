/**
 * taxRoutes.js — Income Tax Portal v8.0
 */
const router  = require('express').Router();
const ctrl    = require('../controllers/taxController');
const protect = require('../middleware/authMiddleware');
const { adminOnly, staffOrAbove, hrOrAbove } = require('../middleware/authMiddleware');
const audit   = require('../middleware/auditMiddleware');

/* ── Tax Calculator (open to all authenticated users) ── */
router.post('/calculate',                protect, ctrl.calculateTax);

/* ── Employee: own declaration ─────────────────────── */
router.get ('/declaration/my',           protect, ctrl.getMyDeclaration);
router.post('/declaration/draft',        protect, ctrl.saveDraft);
router.post('/declaration/submit',       protect, audit('SUBMIT_TAX_DECL','tax_declarations'), ctrl.submitDeclaration);
router.post('/declaration/:id/submit',   protect, audit('SUBMIT_TAX_DECL','tax_declarations'), ctrl.submitDeclaration);

/* ── HR/Admin: all declarations ───────────────────── */
router.get ('/declaration/all',          protect, hrOrAbove, ctrl.getAllDeclarations);
router.post('/declaration/review',       protect, hrOrAbove, audit('REVIEW_TAX_DECL','tax_declarations'), ctrl.reviewDeclaration);

/* ── Form 16 ───────────────────────────────────────── */
router.get ('/form16/my',                protect, ctrl.getMyForm16);
router.get ('/form16/all',               protect, hrOrAbove, ctrl.getAllForm16);
router.post('/form16/generate',          protect, adminOnly, audit('GENERATE_FORM16','form16_records'), ctrl.generateForm16);

/* ── TDS Summary ───────────────────────────────────── */
router.get ('/tds-summary',              protect, ctrl.getTdsSummary);

module.exports = router;
