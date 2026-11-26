/**
 * notificationsController.js — v12.2
 * System-wide notifications: get, mark read, clear, count
 */
const db = require('../config/db');
const q  = (sql, p) => new Promise((r, j) => db.query(sql, p || [], (e, res) => e ? j(e) : r(res)));

exports.getMyNotifications = async (req, res) => {
  try {
    const { unread_only, limit = 50 } = req.query;
    let sql = `SELECT * FROM notifications WHERE user_id=?`;
    const p = [req.user.user_id];
    if (unread_only === '1') { sql += ' AND is_read=0'; }
    sql += ` ORDER BY created_at DESC LIMIT ${parseInt(limit)}`;
    const rows = await q(sql, p);
    const [{ unread_count }] = await q(
      'SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id=? AND is_read=0',
      [req.user.user_id]
    );
    res.json({ notifications: rows, unread_count });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.markRead = async (req, res) => {
  try {
    const { notification_ids } = req.body; // array or 'all'
    if (notification_ids === 'all') {
      await q('UPDATE notifications SET is_read=1, read_at=NOW() WHERE user_id=?', [req.user.user_id]);
    } else if (Array.isArray(notification_ids)) {
      await q(
        `UPDATE notifications SET is_read=1, read_at=NOW()
         WHERE user_id=? AND notification_id IN (${notification_ids.map(()=>'?').join(',')})`,
        [req.user.user_id, ...notification_ids]
      );
    } else {
      await q('UPDATE notifications SET is_read=1, read_at=NOW() WHERE notification_id=? AND user_id=?',
        [req.params.id, req.user.user_id]);
    }
    res.json({ message: 'Marked as read' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.markAllRead = async (req, res) => {
  try {
    await q('UPDATE notifications SET is_read=1, read_at=NOW() WHERE user_id=?', [req.user.user_id]);
    res.json({ message: 'All notifications marked as read' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteNotification = async (req, res) => {
  try {
    await q('DELETE FROM notifications WHERE notification_id=? AND user_id=?',
      [req.params.id, req.user.user_id]);
    res.json({ message: 'Notification deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.clearAll = async (req, res) => {
  try {
    await q('DELETE FROM notifications WHERE user_id=? AND is_read=1', [req.user.user_id]);
    res.json({ message: 'Read notifications cleared' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const [row] = await q(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id=? AND is_read=0',
      [req.user.user_id]
    );
    res.json({ count: row.count });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// Admin: broadcast a notification to all or specific users/roles
exports.broadcast = async (req, res) => {
  try {
    const { title, message, type = 'system', action_url, icon = '📢', priority = 'normal',
            target_role_id, target_user_ids } = req.body;
    if (!title) return res.status(400).json({ message: 'title required' });

    if (action_url && (typeof action_url !== 'string' || action_url.length > 255 ||
        !/^\/(?!\/)[a-z0-9][a-z0-9/_?.=&#%-]*$/i.test(action_url)))
      return res.status(400).json({ message: 'Choose an internal application link.' });

    let users = [];
    if (target_user_ids?.length) {
      users = target_user_ids.map(id => ({ user_id: id }));
    } else if (target_role_id) {
      users = await q('SELECT user_id FROM users WHERE role_id=? AND status="active"', [target_role_id]);
    } else {
      users = await q('SELECT user_id FROM users WHERE status="active"');
    }

    if (!users.length) return res.status(400).json({ message: 'No target users found' });

    for (const u of users) {
      await q(
        `INSERT INTO notifications (user_id, type, title, message, action_url, icon, priority)
         VALUES (?,?,?,?,?,?,?)`,
        [u.user_id, type, title, message || null, action_url || null, icon, priority]
      );
    }
    res.json({ message: `Notification sent to ${users.length} user(s)` });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// Helper: create single notification (called internally by other controllers)
exports.createNotification = async (userId, type, title, message, actionUrl = null) => {
  try {
    await q(
      `INSERT INTO notifications (user_id, type, title, message, action_url)
       VALUES (?,?,?,?,?)`,
      [userId, type, title, message, actionUrl]
    );
  } catch (e) { /* silent — notifications are non-critical */ }
};
