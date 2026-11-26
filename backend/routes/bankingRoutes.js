const router  = require('express').Router();
const ctrl    = require('../controllers/bankingController');
const protect = require('../middleware/authMiddleware');
const { hrOrAbove } = require('../middleware/authMiddleware');
const audit   = require('../middleware/auditMiddleware');

router.get('/my',                    protect, ctrl.getMyBanking);
router.post('/my',                   protect, audit('SAVE_BANKING','employee_banking'), ctrl.saveBanking);
router.get('/unverified',            protect, hrOrAbove, ctrl.getUnverified);
router.patch('/verify/:userId',      protect, hrOrAbove, audit('VERIFY_BANKING','employee_banking'), ctrl.verifyBanking);
router.get('/user/:userId',          protect, hrOrAbove, ctrl.getUserBanking);
router.get('/ifsc/:ifsc',            protect, ctrl.lookupIFSC);

module.exports = router;
