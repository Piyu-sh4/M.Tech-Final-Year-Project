/**
 * taskModel.js — Task Database Model v6.0
 * Added: designation-aware queries, achievement with task_id FK
 */
const db = require('../config/db');

exports.createTask = (data, cb) =>
  db.query(
    `INSERT INTO tasks (title, description, written_note, assigned_by, assigned_to,
       priority, status, due_date, timer_hours, timer_deadline)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [data.title, data.description || null, data.written_note || null,
     data.assigned_by, data.assigned_to,
     ['Low','Medium','High'].includes(data.priority) ? data.priority : 'Medium',
     data.status || 'Pending', data.due_date || null,
     data.timer_hours || null, data.timer_deadline || null],
    cb
  );

exports.getAllTasksFull = (cb) =>
  db.query(
    `SELECT t.*, u1.full_name AS assigned_by_name, u2.full_name AS assigned_to_name,
            u2.designation AS assigned_to_designation
     FROM tasks t
     LEFT JOIN users u1 ON t.assigned_by = u1.user_id
     LEFT JOIN users u2 ON t.assigned_to = u2.user_id
     ORDER BY t.created_at DESC`,
    cb
  );

exports.getTasksByUserFull = (user_id, cb) =>
  db.query(
    `SELECT t.*, u1.full_name AS assigned_by_name, u2.full_name AS assigned_to_name
     FROM tasks t
     LEFT JOIN users u1 ON t.assigned_by = u1.user_id
     LEFT JOIN users u2 ON t.assigned_to = u2.user_id
     WHERE t.assigned_to = ? ORDER BY t.created_at DESC`,
    [user_id], cb
  );

exports.updateTaskStatus = (task_id, status, cb) =>
  db.query('UPDATE tasks SET status=? WHERE task_id=?', [status, task_id], cb);

exports.addTaskLog = (data, cb) =>
  db.query(
    'INSERT INTO task_logs (task_id, status, remarks, updated_by) VALUES (?,?,?,?)',
    [data.task_id, data.status, data.remarks || null, data.updated_by],
    cb
  );

exports.getOverdueTasks = (cb) =>
  db.query(
    `SELECT t.*, u.full_name AS assigned_to_name
     FROM tasks t LEFT JOIN users u ON t.assigned_to = u.user_id
     WHERE t.due_date < CURDATE() AND t.status != 'Completed'
     ORDER BY t.due_date ASC`,
    cb
  );

exports.requestExtension = (task_id, data, cb) =>
  db.query(
    `UPDATE tasks SET extension_requested=TRUE, extension_hours=?,
       extension_reason=?, extension_status='pending' WHERE task_id=?`,
    [data.extension_hours, data.extension_reason || null, task_id], cb
  );

exports.reviewExtension = (task_id, status, reviewed_by, cb) =>
  db.query(
    `UPDATE tasks SET extension_status=?, extension_reviewed_by=?,
       extension_reviewed_at=NOW(),
       timer_deadline=CASE WHEN ?='approved'
         THEN DATE_ADD(IFNULL(timer_deadline,NOW()), INTERVAL extension_hours HOUR)
         ELSE timer_deadline END
     WHERE task_id=?`,
    [status, reviewed_by, status, task_id], cb
  );

exports.setAchievement = (task_id, level, cb) =>
  db.query(
    `UPDATE tasks SET achievement_level=?,
       completed_at=IF(?!='none',NOW(),completed_at) WHERE task_id=?`,
    [level, level, task_id], cb
  );

exports.getTaskWithTimer = (task_id, cb) =>
  db.query('SELECT * FROM tasks WHERE task_id=?', [task_id], cb);
