const { userScope } = require('../middleware/userScope');
/**
 * suggestionRoutes.js — v6.0
 */
const router  = require('express').Router();
const task    = require('../controllers/taskController');
const protect = require('../middleware/authMiddleware');

router.get('/:user_id',            protect, userScope('user_id'), task.getSuggestions);
router.patch('/:id/read',          protect, task.markSuggestionRead);
router.patch('/read-all/:user_id', protect, userScope('user_id'), task.markAllSuggestionsRead);

module.exports = router;
