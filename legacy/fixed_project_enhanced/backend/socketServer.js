/**
 * socketServer.js — Real-Time Notifications (4th Semester)
 * ═══════════════════════════════════════════════════════════
 * Implements WebSocket-based push notifications using Socket.io.
 * Replaces the polling-based alert system in v6.0.
 *
 * Events emitted TO clients:
 *   wip:leave_approved      — employee's leave was approved
 *   wip:leave_rejected      — employee's leave was rejected
 *   wip:task_assigned       — new task assigned to user
 *   wip:task_overdue        — task passed deadline
 *   wip:salary_paid         — salary marked as paid
 *   wip:admin_broadcast     — admin message to all/dept
 *   wip:notification_count  — updated unread count badge
 *
 * Integration: imported in server.js and passed the HTTP server.
 *
 * Usage in server.js:
 *   const { createSocketServer, emitToUser, broadcastToAll } = require('./socketServer');
 *   createSocketServer(httpServer);
 */

const { Server }  = require('socket.io');
const jwt         = require('jsonwebtoken');
const db          = require('./config/db');

function query(sql, p = []) {
  return new Promise((res, rej) =>
    db.query(sql, p, (err, rows) => err ? rej(err) : res(rows))
  );
}

const SECRET  = () => process.env.JWT_SECRET || 'WIP@JWT#Secret2024!Change_Before_Deploy';

// ── In-memory map: user_id → Set of socket IDs ──────────────────────
const userSockets = new Map();  // { 5: Set{'abc', 'def'}, 12: Set{'xyz'} }

let io = null;

/**
 * Initialise Socket.io on the given HTTP server.
 * Call once from server.js after app.listen().
 */
function createSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin:  process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST']
    },
    pingInterval: 25000,
    pingTimeout:  60000
  });

  // ── JWT Authentication middleware for socket connections ────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
      || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token)
      return next(new Error('Authentication required — provide JWT token'));

    try {
      socket.user = jwt.verify(token, SECRET());
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  // ── Connection handler ───────────────────────────────────────────────
  io.on('connection', async (socket) => {
    const { user_id, role_id } = socket.user;
    console.log(`[WS] User ${user_id} (role ${role_id}) connected — socket ${socket.id}`);

    // Register socket for this user
    if (!userSockets.has(user_id)) userSockets.set(user_id, new Set());
    userSockets.get(user_id).add(socket.id);

    // Join role-based rooms for targeted broadcasts
    socket.join(`role:${role_id}`);         // e.g. 'role:1' for admins
    socket.join(`user:${user_id}`);         // personal room

    // ── Send unread notification count on connect ──────────────────
    try {
      const [{ count }] = await query(
        `SELECT COUNT(*) AS count FROM alerts
         WHERE user_id = ? AND is_read = 0`, [user_id]
      );
      socket.emit('wip:notification_count', { count });
    } catch (_) {}

    // ── Client requests mark-as-read ───────────────────────────────
    socket.on('wip:mark_read', async ({ alert_id }) => {
      try {
        await query(
          `UPDATE alerts SET is_read = 1
           WHERE alert_id = ? AND user_id = ?`, [alert_id, user_id]
        );
        const [{ count }] = await query(
          `SELECT COUNT(*) AS count FROM alerts
           WHERE user_id = ? AND is_read = 0`, [user_id]
        );
        socket.emit('wip:notification_count', { count });
      } catch (e) {
        console.error('[WS] mark_read error:', e.message);
      }
    });

    // ── Client requests mark ALL as read ───────────────────────────
    socket.on('wip:mark_all_read', async () => {
      try {
        await query(
          `UPDATE alerts SET is_read = 1 WHERE user_id = ?`, [user_id]
        );
        socket.emit('wip:notification_count', { count: 0 });
      } catch (e) {
        console.error('[WS] mark_all_read error:', e.message);
      }
    });

    // ── Disconnection ──────────────────────────────────────────────
    socket.on('disconnect', () => {
      const sockets = userSockets.get(user_id);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) userSockets.delete(user_id);
      }
      console.log(`[WS] User ${user_id} disconnected — socket ${socket.id}`);
    });
  });

  console.log('[WS] Socket.io server ready');
  return io;
}

// ── Helper: persist alert to DB + emit to user ──────────────────────
async function createAndEmitAlert(targetUserId, type, title, message, meta = {}) {
  try {
    const result = await query(
      `INSERT INTO alerts (user_id, type, title, message, meta)
       VALUES (?, ?, ?, ?, ?)`,
      [targetUserId, type, title, message, JSON.stringify(meta)]
    );
    const alert_id = result.insertId;

    const payload = { alert_id, type, title, message, meta, created_at: new Date().toISOString() };

    // Push to all sockets of this user
    if (io) {
      io.to(`user:${targetUserId}`).emit(`wip:${type}`, payload);

      // Update badge count
      const [{ count }] = await query(
        `SELECT COUNT(*) AS count FROM alerts WHERE user_id = ? AND is_read = 0`,
        [targetUserId]
      );
      io.to(`user:${targetUserId}`).emit('wip:notification_count', { count });
    }

    return alert_id;
  } catch (err) {
    console.error('[WS] createAndEmitAlert error:', err.message);
    return null;
  }
}

// ── Public emitter functions (called from controllers) ───────────────

/** Emit to a single user by user_id */
function emitToUser(userId, event, data) {
  if (io) io.to(`user:${userId}`).emit(event, data);
}

/** Broadcast to all connected clients */
function broadcastToAll(event, data) {
  if (io) io.emit(event, data);
}

/** Broadcast to all users of a given role */
function emitToRole(roleId, event, data) {
  if (io) io.to(`role:${roleId}`).emit(event, data);
}

// ── Domain-specific notification functions ───────────────────────────

async function notifyLeaveApproved(userId, leaveDates) {
  return createAndEmitAlert(userId, 'leave_approved',
    '✅ Leave Approved',
    `Your leave request for ${leaveDates} has been approved.`,
    { dates: leaveDates }
  );
}

async function notifyLeaveRejected(userId, reason) {
  return createAndEmitAlert(userId, 'leave_rejected',
    '❌ Leave Rejected',
    `Your leave request was rejected. Reason: ${reason || 'See HR for details'}.`,
    { reason }
  );
}

async function notifyTaskAssigned(userId, taskTitle, assignedBy) {
  return createAndEmitAlert(userId, 'task_assigned',
    '📋 New Task Assigned',
    `"${taskTitle}" has been assigned to you by ${assignedBy}.`,
    { taskTitle, assignedBy }
  );
}

async function notifyTaskOverdue(userId, taskTitle, taskId) {
  return createAndEmitAlert(userId, 'task_overdue',
    '⏰ Task Overdue',
    `"${taskTitle}" passed its deadline and is now marked Overdue.`,
    { taskId, taskTitle }
  );
}

async function notifySalaryPaid(userId, month, year, netSalary) {
  return createAndEmitAlert(userId, 'salary_paid',
    '💰 Salary Credited',
    `Your salary of ₹${netSalary?.toLocaleString('en-IN')} for ${month}/${year} has been processed.`,
    { month, year, netSalary }
  );
}

async function broadcastAdminMessage(message, deptId = null) {
  if (!io) return;
  const payload = {
    type: 'admin_broadcast',
    title: '📢 Announcement',
    message,
    created_at: new Date().toISOString()
  };

  // Fetch users to persist alert in DB
  const sql = deptId
    ? `SELECT user_id FROM users WHERE status='active' AND department_id = ?`
    : `SELECT user_id FROM users WHERE status='active'`;
  const users = await query(sql, deptId ? [deptId] : []);

  for (const { user_id } of users) {
    await createAndEmitAlert(user_id, 'admin_broadcast', payload.title, message, { deptId });
  }
}

// ── Scheduled: check overdue tasks every 5 minutes ──────────────────
function startOverdueTaskPoller() {
  setInterval(async () => {
    try {
      const overdue = await query(`
        SELECT t.task_id, t.title, t.assigned_to, t.due_date
        FROM tasks t
        WHERE t.due_date < CURDATE()
          AND t.status NOT IN ('Completed', 'Overdue')
      `);

      for (const task of overdue) {
        // Update status to Overdue
        await query(
          `UPDATE tasks SET status = 'Overdue' WHERE task_id = ?`,
          [task.task_id]
        );
        // Notify assignee
        await notifyTaskOverdue(task.assigned_to, task.title, task.task_id);
      }

      if (overdue.length > 0)
        console.log(`[WS] Marked ${overdue.length} tasks as Overdue and notified assignees`);
    } catch (err) {
      console.error('[WS] Overdue poller error:', err.message);
    }
  }, 5 * 60 * 1000); // every 5 minutes
}

module.exports = {
  createSocketServer,
  emitToUser,
  broadcastToAll,
  emitToRole,
  notifyLeaveApproved,
  notifyLeaveRejected,
  notifyTaskAssigned,
  notifyTaskOverdue,
  notifySalaryPaid,
  broadcastAdminMessage,
  startOverdueTaskPoller,
  createAndEmitAlert
};
