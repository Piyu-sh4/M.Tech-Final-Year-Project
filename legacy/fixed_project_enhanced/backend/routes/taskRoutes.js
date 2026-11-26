/**
 * taskRoutes.js — Task Management Routes v6.0
 */
const router  = require('express').Router();
const task    = require('../controllers/taskController');
const protect = require('../middleware/authMiddleware');
const { staffOrAbove } = require('../middleware/authMiddleware');
const audit   = require('../middleware/auditMiddleware');

// Static routes BEFORE /:task_id
router.get('/alerts/all',                         protect, task.getAlerts);
router.get('/productivity/:user_id',              protect, task.calculateProductivity);
router.get('/my',                                 protect, task.getMyTasks);

// Core task CRUD
router.post('/',                                  protect, audit('CREATE_TASK','tasks'), task.createTask);
router.get('/',                                   protect, task.getTasks);
router.get('/:task_id',                           protect, task.getTaskById);
router.put('/:task_id',                           protect, audit('UPDATE_TASK','tasks'), task.updateStatus);
router.delete('/:task_id',                        protect, audit('DELETE_TASK','tasks'), task.deleteTask);

// Timer extension
router.post('/:task_id/extension',                protect, task.requestExtension);
router.put('/:task_id/extension',                 protect, staffOrAbove, audit('REVIEW_EXTENSION','tasks'), task.reviewExtension);

// Achievement (admin/manager/HR)
router.post('/:task_id/achievement',              protect, staffOrAbove, audit('AWARD_ACHIEVEMENT','achievements'), task.awardAchievement);

// Comments
router.get('/:task_id/comments',                  protect, task.getComments);
router.post('/:task_id/comments',                 protect, task.addComment);
router.delete('/:task_id/comments/:comment_id',   protect, task.deleteComment);

module.exports = router;
