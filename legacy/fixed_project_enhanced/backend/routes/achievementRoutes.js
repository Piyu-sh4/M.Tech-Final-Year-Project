/**
 * achievementRoutes.js — v6.0
 */
const router  = require('express').Router();
const task    = require('../controllers/taskController');
const protect = require('../middleware/authMiddleware');

router.post('/check/:task_id',  protect, task.checkAchievement);
router.get('/:user_id',         protect, task.getAchievements);

module.exports = router;
