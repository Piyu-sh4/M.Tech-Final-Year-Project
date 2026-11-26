/**
 * loanRoutes.js — Employee Loan Portal v8.0
 */
const router  = require('express').Router();
const ctrl    = require('../controllers/loanController');
const protect = require('../middleware/authMiddleware');
const { adminOnly, staffOrAbove, hrOrAbove, managerOrAbove } = require('../middleware/authMiddleware');
const audit   = require('../middleware/auditMiddleware');

/* ── Employee ──────────────────────────────────────── */
router.get ('/my',                       protect, ctrl.getMyLoans);
router.get ('/eligibility',              protect, ctrl.checkEligibility);
router.get ('/credit-profile',           protect, ctrl.getCreditProfile);
router.put ('/credit-profile',           protect, ctrl.saveCreditProfile);
router.post('/calculate-emi',            protect, ctrl.calculateEMIRoute);
router.post('/apply',                    protect, audit('APPLY_LOAN','loan_applications'), ctrl.applyLoan);
router.get ('/:id/repayments/my',        protect, ctrl.getMyRepayments);

/* ── Manager ───────────────────────────────────────── */
router.patch('/:id/manager-review',      protect, managerOrAbove, audit('MANAGER_REVIEW_LOAN','loan_applications'), ctrl.managerReview);

/* ── HR ────────────────────────────────────────────── */
router.patch('/:id/hr-review',           protect, hrOrAbove, audit('HR_REVIEW_LOAN','loan_applications'), ctrl.hrReview);

/* ── Admin ─────────────────────────────────────────── */
router.get ('/',                         protect, staffOrAbove, ctrl.getAllLoans);
router.patch('/:id/admin-approve',       protect, adminOnly, audit('ADMIN_APPROVE_LOAN','loan_applications'), ctrl.adminApprove);
router.post ('/:id/disburse',            protect, adminOnly, audit('DISBURSE_LOAN','loan_applications'), ctrl.disburseLoan);
router.get  ('/:id/repayments',          protect, staffOrAbove, ctrl.getLoanRepayments);
router.patch('/repayments/:repayment_id/paid', protect, hrOrAbove, audit('MARK_REPAYMENT_PAID','loan_repayments'), ctrl.markRepaymentPaid);


// Advanced Loan Features —
router.get('/bank-partners',          protect,           ctrl.getBankPartners);
router.get('/bank-offers',            protect,           ctrl.getBankOffers);
router.post('/dual-eligibility',      protect,           ctrl.verifyDualEligibility);
router.post('/share-eligibility',     protect,           ctrl.shareEligibilityResult);
router.get('/:id/foreclose',          protect,           ctrl.forecloseLoan);
router.post('/:id/foreclose',         protect, adminOnly, ctrl.forecloseLoan);

module.exports = router;
