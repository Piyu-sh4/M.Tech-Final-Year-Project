const router=require('express').Router(),ctrl=require('../controllers/onboardingController');
const protect=require('../middleware/authMiddleware');
const {staffOrAbove}=require('../middleware/authMiddleware');
router.get('/my',protect,ctrl.getMyChecklist);
router.patch('/task/:taskId',protect,ctrl.updateTask);
router.get('/team',protect,staffOrAbove,ctrl.getTeamOnboarding);
module.exports=router;
