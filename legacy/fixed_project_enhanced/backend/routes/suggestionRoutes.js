/**
 * suggestionRoutes.js — v6.0
 */
const router  = require('express').Router();
const task    = require('../controllers/taskController');
const protect = require('../middleware/authMiddleware');

router.get('/:user_id',            protect, task.getSuggestions);
router.patch('/:id/read',          protect, task.markSuggestionRead);
router.patch('/read-all/:user_id', protect, task.markAllSuggestionsRead);

module.exports = router;
