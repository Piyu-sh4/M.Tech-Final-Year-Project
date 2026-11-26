const r = require('express').Router();
const c = require('../controllers/notificationsController');
const p = require('../middleware/authMiddleware');
const { staffOrAbove, hrOrAbove } = require('../middleware/authMiddleware');

r.get('/count',          p, c.getUnreadCount);       // ← static before /:id
r.get('/',               p, c.getMyNotifications);
r.post('/mark-read',     p, c.markRead);
r.patch('/mark-all',     p, c.markAllRead);
r.delete('/clear',       p, c.clearAll);
r.delete('/:id',         p, c.deleteNotification);
r.patch('/:id/read',     p, c.markRead);
r.post('/broadcast',     p, hrOrAbove, c.broadcast);
module.exports = r;
