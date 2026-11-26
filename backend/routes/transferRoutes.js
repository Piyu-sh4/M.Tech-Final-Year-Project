const router  = require('express').Router();
const ctrl    = require('../controllers/transferController');
const protect = require('../middleware/authMiddleware');
const { adminOnly, staffOrAbove, hrOrAbove, managerOrAbove } = require('../middleware/authMiddleware');
const audit   = require('../middleware/auditMiddleware');

// Family info
router.get('/family',               protect, ctrl.getMyFamily);
router.post('/family',              protect, audit('UPSERT_FAMILY','family_information'), ctrl.upsertFamily);

// Transfer requests
router.get('/my',                   protect, ctrl.getMyTransfers);
router.get('/',                     protect, staffOrAbove, ctrl.getAllTransfers);
router.post('/',                    protect, audit('APPLY_TRANSFER','transfer_requests'), ctrl.applyTransfer);
router.patch('/:id/manager-review', protect, managerOrAbove, audit('MANAGER_TRANSFER_REVIEW','transfer_requests'), ctrl.managerReview);
router.patch('/:id/hr-review',      protect, hrOrAbove, audit('HR_TRANSFER_REVIEW','transfer_requests'), ctrl.hrReview);
router.patch('/:id/admin-review',   protect, adminOnly, audit('ADMIN_TRANSFER_REVIEW','transfer_requests'), ctrl.adminReview);

// Relocation history
router.get('/history',              protect, ctrl.getRelocationHistory);
router.get('/history/:userId',      protect, staffOrAbove, ctrl.getRelocationHistory);

module.exports = router;
