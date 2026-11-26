/**
 * taskController.js — Task Management Controller v5.1
 * Handles: Task CRUD, timers, achievements, suggestions, comments
 */
const Task = require('../models/taskModel');
const db   = require('../config/db');

function query(sql, p){ return new Promise((r,j)=>db.query(sql,p||[],(e,res)=>e?j(e):r(res))); }

exports.createTask = (req, res) => {
  const d = req.body;
  if(!d.assigned_by) d.assigned_by = req.user.user_id;

  // Compute timer_deadline if timer_hours set
  let timer_deadline = null;
  if(d.timer_hours){
    const dl = new Date();
    dl.setHours(dl.getHours() + parseInt(d.timer_hours));
    timer_deadline = dl.toISOString().slice(0,19).replace('T',' ');
  }

  db.query(
    `INSERT INTO tasks
     (title,description,written_note,voice_note_path,assigned_by,assigned_to,priority,status,due_date,timer_hours,timer_deadline)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [d.title, d.description||null, d.written_note||null, d.voice_note_path||null,
     d.assigned_by, d.assigned_to,
     ['Low','Medium','High'].includes(d.priority)?d.priority:'Medium',
     d.status||'Pending', d.due_date||null,
     d.timer_hours||null, timer_deadline],
    (err, result) => {
      if(err) return res.status(500).json({message:'Task creation failed',error:err.message});
      // push alert notification to assignee
      pushAlert(d.assigned_to, result.insertId,
        `📋 New task assigned: "${d.title}"${d.timer_hours ? ` — ${d.timer_hours}h timer started` : ''}`,
        'task_assigned').catch(()=>{});
      res.status(201).json({message:'Task created',task_id:result.insertId,timer_deadline});
    }
  );
};

exports.getMyTasks = (req, res) => {
  Task.getTasksByUserFull(req.user.user_id, (err, results) => {
    if(err) return res.status(500).json({message:'Could not fetch tasks',error:err.message});
    res.json(results);
  });
};

exports.updateStatus = (req, res) => {
  const { task_id }         = req.params;
  const { status, remarks } = req.body;
  const updated_by          = req.user.user_id;

  Task.updateTaskStatus(task_id, status, (err) => {
    if(err) return res.status(500).json({message:'Status update failed',error:err.message});
    Task.addTaskLog({task_id, status, remarks, updated_by}, ()=>{});

    // Auto-mark completed_at if status = Completed
    if(status === 'Completed'){
      db.query('UPDATE tasks SET completed_at=NOW() WHERE task_id=?',[task_id],()=>{});
      // Trigger AI suggestions for next tasks
      generateSuggestionsForUser(updated_by, task_id);
    }

    res.json({message:'Task status updated'});
  });
};

exports.getAlerts = (req, res) => {
  Task.getOverdueTasks((err, results) => {
    if(err) return res.status(500).json({message:'Could not fetch alerts',error:err.message});
    res.json(results);
  });
};

exports.calculateProductivity = (req, res) => {
  db.query(
    `SELECT COUNT(*) AS total, SUM(status='Completed') AS completed, SUM(status='Overdue') AS overdue
     FROM tasks WHERE assigned_to=?`,
    [req.params.user_id],
    (err, results) => {
      if(err) return res.status(500).json({message:'Calculation failed',error:err.message});
      const total     = Number(results[0].total)     || 0;
      const completed = Number(results[0].completed) || 0;
      const overdue   = Number(results[0].overdue)   || 0;
      const rate      = total ? (completed/total)*100 : 0;
      const score     = Math.max(0, rate - overdue*10);
      res.json({user_id:req.params.user_id, total_tasks:total, completed_tasks:completed,
        overdue_tasks:overdue, completion_rate:parseFloat(rate.toFixed(2)),
        productivity_score:parseFloat(score.toFixed(2))});
    }
  );
};

// POST /api/tasks/:id/extension  (employee requests)
exports.requestExtension = (req, res) => {
  const { extension_hours, extension_reason } = req.body;
  const hours = [24,48,72].includes(parseInt(extension_hours)) ? parseInt(extension_hours) : 24;
  Task.requestExtension(req.params.task_id, {extension_hours:hours, extension_reason}, (err) => {
    if(err) return res.status(500).json({message:'Extension request failed',error:err.message});
    res.json({message:`Extension of ${hours}h requested — awaiting manager approval.`});
  });
};

// PUT /api/tasks/:id/extension  (admin approves/rejects)
exports.reviewExtension = (req, res) => {
  const { extension_status } = req.body;
  const reviewed_by = req.user.user_id;
  if(!['approved','rejected'].includes(extension_status))
    return res.status(400).json({message:'Status must be approved or rejected'});

  Task.reviewExtension(req.params.task_id, extension_status, reviewed_by, (err) => {
    if(err) return res.status(500).json({message:'Review failed',error:err.message});
    res.json({message:`Extension ${extension_status}.`});
  });
};

// POST /api/tasks/:id/achievement (admin awards)
exports.awardAchievement = async (req, res) => {
  const { level } = req.body;
  const task_id   = req.params.task_id;
  const awarded_by = req.user.user_id;

  if(!['good','excellent','outstanding'].includes(level))
    return res.status(400).json({message:'Level must be good, excellent, or outstanding'});

  try {
    // Get task info
    const rows = await query('SELECT * FROM tasks WHERE task_id=?',[task_id]);
    if(!rows.length) return res.status(404).json({message:'Task not found'});
    const task = rows[0];

    // Set achievement on task
    await query('UPDATE tasks SET achievement_level=? WHERE task_id=?',[level,task_id]);

    // Points map
    const pts = {good:10, excellent:25, outstanding:50}[level];
    const msgs = {
      good:'🥉 Good work completing your task!',
      excellent:'🥈 Excellent performance! Outstanding dedication.',
      outstanding:'🏆 Outstanding achievement! You\'re a star performer!'
    };

    // Insert achievement record
    await query(
      `INSERT INTO achievements (user_id,task_id,achievement_type,level,points,message,awarded_by)
       VALUES (?,?,'task_complete',?,?,?,?)`,
      [task.assigned_to, task_id, level, pts, msgs[level], awarded_by]
    );

    // Update user points + possibly upgrade access level
    await query('UPDATE users SET total_points=total_points+? WHERE user_id=?',[pts, task.assigned_to]);

    // Auto-upgrade access_level: 100pts→2, 300pts→3
    await query(
      `UPDATE users SET access_level=CASE
         WHEN total_points>=300 THEN 3
         WHEN total_points>=100 THEN 2
         ELSE 1 END
       WHERE user_id=?`,
      [task.assigned_to]
    );

    res.json({message:`${level} achievement awarded! +${pts} points`, level, points:pts, awarded:true});
  } catch(e) {
    res.status(500).json({message:'Award failed',error:e.message});
  }
};

// POST /api/achievements/check/:task_id  (auto-check on completion)
exports.checkAchievement = async (req, res) => {
  const task_id = req.params.task_id;
  const user_id = req.user.user_id;

  try {
    const tasks = await query('SELECT * FROM tasks WHERE task_id=? AND assigned_to=?',[task_id,user_id]);
    if(!tasks.length) return res.json({awarded:false});

    const task = tasks[0];
    if(task.status !== 'Completed') return res.json({awarded:false});
    if(task.achievement_level && task.achievement_level !== 'none') return res.json({awarded:false, already:true});

    // Auto-level logic
    const now = new Date();
    const due = task.due_date ? new Date(task.due_date) : null;
    const createdAt = new Date(task.created_at);
    const completedAt = task.completed_at ? new Date(task.completed_at) : now;
    const daysEarly = due ? (due - completedAt) / 86400000 : null;
    const hoursToComplete = (completedAt - createdAt) / 3600000;
    const timerHours = task.timer_hours || 72;

    let level = 'good';
    if(daysEarly !== null && daysEarly >= 2 && hoursToComplete < timerHours * 0.5) level = 'outstanding';
    else if(daysEarly !== null && daysEarly >= 1) level = 'excellent';

    const pts = {good:10, excellent:25, outstanding:50}[level];
    const msg = {
      good:`🥉 Task "${task.title}" completed — Good Work! +${pts}pts`,
      excellent:`🥈 Task "${task.title}" completed ahead of schedule — Excellent! +${pts}pts`,
      outstanding:`🏆 Task "${task.title}" completed way ahead of schedule — Outstanding! +${pts}pts`
    }[level];

    await query('UPDATE tasks SET achievement_level=? WHERE task_id=?',[level,task_id]);
    await query(
      `INSERT INTO achievements (user_id,task_id,achievement_type,level,points,message)
       VALUES (?,?,'task_complete',?,?,?)`,
      [user_id, task_id, level, pts, msg]
    );
    await query('UPDATE users SET total_points=total_points+? WHERE user_id=?',[pts,user_id]);
    await query(
      `UPDATE users SET access_level=CASE WHEN total_points>=300 THEN 3 WHEN total_points>=100 THEN 2 ELSE 1 END
       WHERE user_id=?`,
      [user_id]
    );

    res.json({awarded:true, level, message:msg, points:pts});
  } catch(e) {
    res.status(500).json({message:'Check failed',error:e.message});
  }
};

// GET /api/achievements/:user_id
exports.getAchievements = async (req, res) => {
  try {
    const rows = await query(
      `SELECT a.*, t.title AS task_title
       FROM achievements a LEFT JOIN tasks t ON a.task_id=t.task_id
       WHERE a.user_id=? ORDER BY a.created_at DESC`,
      [req.params.user_id]
    );
    res.json(rows);
  } catch(e) { res.status(500).json({message:'Could not fetch',error:e.message}); }
};

// GET /api/suggestions/:user_id
exports.getSuggestions = async (req, res) => {
  try {
    const rows = await query(
      `SELECT ts.*, t.title AS task_title
       FROM task_suggestions ts LEFT JOIN tasks t ON ts.task_id=t.task_id
       WHERE ts.user_id=? AND ts.is_read=0 ORDER BY ts.created_at DESC LIMIT 10`,
      [req.params.user_id]
    );
    res.json(rows);
  } catch(e) { res.status(500).json({message:'Could not fetch',error:e.message}); }
};

// Auto-generate AI suggestions after task completion
async function generateSuggestionsForUser(user_id, completed_task_id) {
  try {
    // Find pending tasks for user and insert a helpful suggestion
    const pending = await query(
      `SELECT task_id, title, priority, due_date FROM tasks
       WHERE assigned_to=? AND status IN ('Pending','In Progress') ORDER BY due_date ASC LIMIT 3`,
      [user_id]
    );
    for(const t of pending){
      const daysToDue = t.due_date ? Math.ceil((new Date(t.due_date)-Date.now())/86400000) : null;
      const urgency = t.priority==='High'?'⚡ High priority — ':'';
      const timeMsg = daysToDue!==null?(daysToDue<=1?' — due TODAY!':(daysToDue<=3?' — due in '+daysToDue+' days!':'')):'';
      await query(
        `INSERT INTO task_suggestions (task_id,user_id,suggestion,source)
         VALUES (?,?,?,?)`,
        [t.task_id, user_id,
         urgency+'Focus on "'+t.title+'" next'+timeMsg+'. Keep up the momentum from your last completion!',
         'system']
      ).catch(()=>{});
    }
  } catch(_){}
}


// GET /api/tasks/:task_id — fetch single task
exports.getTaskById = async (req, res) => {
  try {
    const rows = await query(
      `SELECT t.*, u1.full_name AS assigned_by_name, u2.full_name AS assigned_to_name
       FROM tasks t
       LEFT JOIN users u1 ON t.assigned_by=u1.user_id
       LEFT JOIN users u2 ON t.assigned_to=u2.user_id
       WHERE t.task_id=?`,
      [req.params.task_id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Task not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ message: 'Could not fetch task', error: e.message }); }
};

// DELETE /api/tasks/:task_id
exports.deleteTask = async (req, res) => {
  try {
    // Only admin (role_id=1) can delete tasks
    if (req.user.role_id !== 1)
      return res.status(403).json({ message: 'Only admins can delete tasks' });
    await query('DELETE FROM task_comments WHERE task_id=?', [req.params.task_id]);
    await query('DELETE FROM task_suggestions WHERE task_id=?', [req.params.task_id]);
    await query('DELETE FROM task_logs WHERE task_id=?', [req.params.task_id]);
    await query('DELETE FROM achievements WHERE task_id=?', [req.params.task_id]);
    const result = await query('DELETE FROM tasks WHERE task_id=?', [req.params.task_id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted successfully' });
  } catch (e) { res.status(500).json({ message: 'Delete failed', error: e.message }); }
};

exports.getTasks = async (req, res) => {
  try {
    const { status, priority, assigned_to, q, from_date, to_date } = req.query;
    let sql = `SELECT t.*, u1.full_name AS assigned_by_name, u2.full_name AS assigned_to_name
               FROM tasks t
               LEFT JOIN users u1 ON t.assigned_by=u1.user_id
               LEFT JOIN users u2 ON t.assigned_to=u2.user_id
               WHERE 1=1`;
    const params = [];
    if (status)      { sql += ` AND t.status=?`;              params.push(status); }
    if (priority)    { sql += ` AND t.priority=?`;            params.push(priority); }
    if (assigned_to) { sql += ` AND t.assigned_to=?`;         params.push(assigned_to); }
    if (q)           { sql += ` AND (t.title LIKE ? OR t.description LIKE ?)`; params.push(`%${q}%`, `%${q}%`); }
    if (from_date)   { sql += ` AND t.due_date >= ?`;         params.push(from_date); }
    if (to_date)     { sql += ` AND t.due_date <= ?`;         params.push(to_date); }
    sql += ` ORDER BY t.created_at DESC`;
    const results = await query(sql, params);
    res.json(results);
  } catch (e) { res.status(500).json({ message: 'Could not fetch tasks', error: e.message }); }
};

// PATCH /api/suggestions/:id/read
exports.markSuggestionRead = async (req, res) => {
  try {
    await query('UPDATE task_suggestions SET is_read=1 WHERE suggestion_id=?', [req.params.id]);
    res.json({ message: 'Suggestion marked as read' });
  } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
};

exports.markAllSuggestionsRead = async (req, res) => {
  try {
    await query('UPDATE task_suggestions SET is_read=1 WHERE user_id=?', [req.params.user_id]);
    res.json({ message: 'All suggestions marked as read' });
  } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
};

// Task Comments
exports.getComments = async (req, res) => {
  try {
    const rows = await query(
      `SELECT tc.*, u.full_name, u.role_id
       FROM task_comments tc JOIN users u ON tc.user_id=u.user_id
       WHERE tc.task_id=? ORDER BY tc.created_at ASC`,
      [req.params.task_id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ message: 'Could not fetch comments', error: e.message }); }
};

exports.addComment = async (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment || !comment.trim())
      return res.status(400).json({ message: 'Comment text is required' });
    // Verify task exists
    const tasks = await query('SELECT task_id FROM tasks WHERE task_id=?', [req.params.task_id]);
    if (!tasks.length) return res.status(404).json({ message: 'Task not found' });
    const result = await query(
      'INSERT INTO task_comments (task_id, user_id, comment) VALUES (?,?,?)',
      [req.params.task_id, req.user.user_id, comment.trim()]
    );
    // Notify assignee if commenter is not the assignee
    const taskRow = tasks[0];
    res.status(201).json({ message: 'Comment added', comment_id: result.insertId });
  } catch (e) { res.status(500).json({ message: 'Could not add comment', error: e.message }); }
};

exports.deleteComment = async (req, res) => {
  try {
    const rows = await query('SELECT * FROM task_comments WHERE comment_id=?', [req.params.comment_id]);
    if (!rows.length) return res.status(404).json({ message: 'Comment not found' });
    // Only author or admin can delete
    if (rows[0].user_id !== req.user.user_id && req.user.role_id !== 1)
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    await query('DELETE FROM task_comments WHERE comment_id=?', [req.params.comment_id]);
    res.json({ message: 'Comment deleted' });
  } catch (e) { res.status(500).json({ message: 'Delete failed', error: e.message }); }
};

/* ── Helper: push a system alert ─────────────────────────── */
async function pushAlert(user_id, task_id, message, type) {
  try {
    await query(
      `INSERT INTO alerts (user_id, task_id, alert_message, alert_type) VALUES (?,?,?,?)`,
      [user_id, task_id || null, message, type || 'general']
    );
  } catch (_) {}
}

/* ── Productivity ────────────────────────────────────────── */
exports.calculateProductivity = async (req, res) => {
  try {
    const uid  = req.params.user_id || req.user.user_id;
    const rows = await query(
      `SELECT COUNT(*) AS total,
              SUM(status='Completed')  AS completed,
              SUM(status='Overdue')    AS overdue,
              SUM(status='Completed' AND completed_at <= due_date) AS on_time,
              COALESCE(AVG(TIMESTAMPDIFF(HOUR,created_at,completed_at)),0) AS avg_hours
       FROM tasks WHERE assigned_to=?`, [uid]
    );
    const r     = rows[0] || {};
    const total = Number(r.total)     || 0;
    const done  = Number(r.completed) || 0;
    const ot    = Number(r.on_time)   || 0;
    const cRate = total ? parseFloat((done/total*100).toFixed(1)) : 0;
    const score = parseFloat(Math.min(100, cRate*0.6 + (ot/Math.max(done,1))*40).toFixed(1));
    // persist
    const d = new Date(); d.setDate(1);
    await query(
      `INSERT INTO productivity_scores (user_id,score_date,completion_rate,delay_count,productivity_score)
       VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE
       completion_rate=VALUES(completion_rate),delay_count=VALUES(delay_count),
       productivity_score=VALUES(productivity_score)`,
      [uid, d.toISOString().slice(0,10), cRate, Number(r.overdue)||0, score]
    ).catch(()=>{});
    res.json({ user_id:parseInt(uid), total_tasks:total, completed:done,
               overdue:Number(r.overdue)||0, on_time:ot, completion_rate:cRate,
               avg_hours:parseFloat((r.avg_hours||0).toFixed(1)), productivity_score:score });
  } catch (err) { res.status(500).json({ message: 'Productivity calc failed', error: err.message }); }
};

/* ── Suggestions ─────────────────────────────────────────── */
exports.getSuggestions = async (req, res) => {
  try {
    res.json(await query(
      `SELECT ts.*, t.title AS task_title FROM task_suggestions ts
       LEFT JOIN tasks t ON ts.task_id=t.task_id
       WHERE ts.user_id=? AND ts.is_read=0 ORDER BY ts.created_at DESC LIMIT 20`,
      [req.params.user_id]
    ));
  } catch (err) { res.status(500).json({ message: 'Could not fetch suggestions', error: err.message }); }
};
exports.markSuggestionRead = async (req, res) => {
  try { await query('UPDATE task_suggestions SET is_read=1 WHERE suggestion_id=?', [req.params.id]); res.json({ message: 'Marked read' }); }
  catch (err) { res.status(500).json({ message: 'Failed', error: err.message }); }
};
exports.markAllSuggestionsRead = async (req, res) => {
  try { await query('UPDATE task_suggestions SET is_read=1 WHERE user_id=?', [req.params.user_id]); res.json({ message: 'All read' }); }
  catch (err) { res.status(500).json({ message: 'Failed', error: err.message }); }
};

/* ── Alerts ──────────────────────────────────────────────── */
exports.getAlerts = async (req, res) => {
  try {
    res.json(await query(
      `SELECT a.*, t.title AS task_title FROM alerts a
       LEFT JOIN tasks t ON a.task_id=t.task_id
       WHERE a.user_id=? OR a.user_id IS NULL
       ORDER BY a.created_at DESC LIMIT 50`,
      [req.user.user_id]
    ));
  } catch (err) { res.status(500).json({ message: 'Could not fetch alerts', error: err.message }); }
};
