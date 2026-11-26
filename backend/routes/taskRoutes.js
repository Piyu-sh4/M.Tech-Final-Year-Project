const { userScope } = require('../middleware/userScope');
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
router.get('/productivity/:user_id',              protect, userScope('user_id', { allowStaff: true }), task.calculateProductivity);
router.get('/my',                                 protect, task.getMyTasks);

router.use('/:task_id', protect, task.accessTask);
router.get('/:task_id/logs', task.getTaskLogs);

// Core task CRUD
router.post('/',                                  protect, audit('CREATE_TASK','tasks'), task.createTask);
router.get('/',                                   protect, task.getTasks);
router.get('/:task_id',                           task.getTaskById);
router.patch('/:task_id', audit('EDIT_TASK_DETAILS','tasks'), task.editDetails);
router.put('/:task_id',                           audit('UPDATE_TASK','tasks'), task.updateStatus);
router.delete('/:task_id',                        audit('DELETE_TASK','tasks'), task.deleteTask);

// Timer extension
router.post('/:task_id/extension',                task.requestExtension);
router.put('/:task_id/extension',                 staffOrAbove, audit('REVIEW_EXTENSION','tasks'), task.reviewExtension);

// Achievement (admin/manager/HR)
router.post('/:task_id/achievement',              staffOrAbove, audit('AWARD_ACHIEVEMENT','achievements'), task.awardAchievement);

// Comments
router.get('/:task_id/comments',                  task.getComments);
router.post('/:task_id/comments',                 task.addComment);
router.delete('/:task_id/comments/:comment_id',   task.deleteComment);

module.exports = router;
