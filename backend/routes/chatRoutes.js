const router = require('express').Router();
const chat = require('../controllers/chatController');
const protect = require('../middleware/authMiddleware');
const db = require('../config/db');
const { adminOnly } = require('../middleware/authMiddleware');
const providers = require('../services/chatProviders');
const { createRateLimiter } = require('../middleware/securityMiddleware');

function currentAdmin(req, res, next) {
  db.query("SELECT user_id FROM users WHERE user_id=? AND role_id=1 AND status='active'", [req.user.user_id], (error, rows) => {
    if (error) return next(error);
    if (!rows.length) return res.status(403).json({ message: 'Administrator access required.' });
    next();
  });
}
function chatAllowed(req,res,next) {
  if (req.user.role_id === 1) return next();
  db.query('SELECT can_use_chat FROM user_permissions WHERE user_id=?',[req.user.user_id],(error,rows) => {
    if (error) return next(error);
    if (!rows[0]?.can_use_chat) return res.status(403).json({message:'Chat is disabled for this account.'});
    next();
  });
}

const handle = handler => async (req, res) => {
  try { await handler(req, res); }
  catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    // Do not pass SQL errors containing secret material to application logging.
    res.status(500).json({ message: 'Unable to update or read AI Chat Settings.' });
  }
};

router.get('/providers', protect, adminOnly, currentAdmin, handle(async (req, res) => {
  res.json(await providers.describe());
}));
router.put('/providers/:provider', protect, adminOnly, currentAdmin, handle(async (req, res) => {
  await providers.save(req.params.provider, req.body || {});
  res.json(await providers.describe());
}));
router.put('/active-provider', protect, adminOnly, currentAdmin, handle(async (req, res) => {
  await providers.select(req.body?.provider);
  res.json(await providers.describe());
}));
router.get('/context', protect, chatAllowed, chat.getContext);
router.post('/import', protect, adminOnly, currentAdmin, chat.importData);
router.post('/send', protect, chatAllowed, createRateLimiter('chat'), chat.sendMessage);

module.exports = router;
