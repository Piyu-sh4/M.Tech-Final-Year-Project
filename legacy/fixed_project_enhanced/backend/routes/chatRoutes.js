/**
 * chatRoutes.js — v6.0
 * Chat context is permission-gated (salary data requires can_view_salary)
 */
const router  = require('express').Router();
const chat    = require('../controllers/chatController');
const protect = require('../middleware/authMiddleware');

router.get('/context', protect, chat.getContext);
router.post('/import', protect, chat.importData);
router.post('/send',   protect, chat.sendMessage);  // Proxies to Anthropic — keeps API key server-side

module.exports = router;
