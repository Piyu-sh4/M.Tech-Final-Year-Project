const db = require('../config/db');
const { query } = require('../services/database');
const run = (sql, params) => query(db, sql, params);

const { oversight, participation, readScope, writeScope } = require('../services/projectAccess');
const missingProject = response => response.status(404).json({ message: 'Project not found' });

function serializeTags(tags) {
  if (tags == null) return null;
  if (Array.isArray(tags) && tags.every(tag => typeof tag === 'string')) {
    tags = JSON.stringify(tags.filter(Boolean));
  }
  if (typeof tags !== 'string' || tags.length > 255) {
    throw Object.assign(new Error('Keep project tags under 255 characters in total.'), { status: 400 });
  }
  return tags;
}

exports.getAll = async (req, res, next) => {
  try {
    const { status, department_id, search } = req.query;
    const [scope, params] = readScope(req.user);
    let sql = `SELECT p.*, d.dept_name AS department_name,
      u.full_name AS manager_name,
      COUNT(DISTINCT pm.user_id) AS team_size,
      COUNT(DISTINCT t.task_id) AS total_tasks,
      COUNT(DISTINCT CASE WHEN t.status='completed' THEN t.task_id END) AS completed_tasks
      FROM projects p
      LEFT JOIN departments d ON d.dept_id = p.department_id
      LEFT JOIN users u ON u.user_id = p.manager_id
      LEFT JOIN project_members pm ON pm.project_id = p.project_id
      LEFT JOIN tasks t ON t.project_id = p.project_id
      WHERE ${scope}`;
    if (status) { sql += ' AND p.status=?'; params.push(status); }
    if (department_id) { sql += ' AND p.department_id=?'; params.push(department_id); }
    if (search) { sql += ' AND p.name LIKE ?'; params.push(`%${search}%`); }
    sql += ' GROUP BY p.project_id ORDER BY p.updated_at DESC';
    res.json(await run(sql, params));
  } catch (error) { next(error); }
};

exports.getOne = async (req, res, next) => {
  try {
    const [scope, params] = readScope(req.user);
    const [project] = await run(
      `SELECT p.*, d.dept_name, u.full_name AS manager_name
       FROM projects p
       LEFT JOIN departments d ON d.dept_id=p.department_id
       LEFT JOIN users u ON u.user_id=p.manager_id
       WHERE p.project_id=? AND ${scope}`, [req.params.id, ...params]
    );
    if (!project) return missingProject(res);
    const [members, milestones, tasks] = await Promise.all([
      run(`SELECT pm.*, u.full_name, u.designation FROM project_members pm
         JOIN users u ON u.user_id=pm.user_id WHERE pm.project_id=?`, [req.params.id]),
      run(`SELECT * FROM project_milestones WHERE project_id=? ORDER BY due_date`, [req.params.id]),
      run(`SELECT t.*, u.full_name AS assignee_name FROM tasks t
         LEFT JOIN users u ON u.user_id=t.assigned_to
         WHERE t.project_id=? ORDER BY t.due_date`, [req.params.id])
    ]);
    res.json({ ...project, members, milestones, tasks });
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, description, department_id, manager_id, status, priority,
            start_date, due_date, budget, tags, completion_pct } = req.body;
    if (!name) return res.status(400).json({ message: 'Project name required' });
    // A manager's new projects stay under their own management.
    const manager = oversight(req.user) ? manager_id || null : req.user.user_id;
    const result = await run(
      `INSERT INTO projects (name, description, department_id, manager_id, status, priority,
        start_date, due_date, budget, tags, created_by, completion_pct)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [name, description||null, department_id||null, manager,
       status||'planning', priority||'medium', start_date||null, due_date||null,
       budget??null, serializeTags(tags), req.user.user_id, completion_pct??0]
    );
    res.json({ message: 'Project created', project_id: result.insertId });
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const ALLOWED = ['name','description','department_id','manager_id','status',
                     'priority','start_date','due_date','budget','tags','completion_pct','spent'];
    const sets = [], vals = [];
    for (const f of ALLOWED) {
      if (req.body[f] !== undefined) { sets.push(`${f}=?`); vals.push(f === 'tags' ? serializeTags(req.body[f]) : req.body[f]); }
    }
    if (!sets.length) return res.status(400).json({ message: 'Nothing to update' });
    vals.push(req.params.id);
    const result = await run(`UPDATE projects SET ${sets.join(',')} WHERE project_id=?`, vals);
    if (!result.affectedRows) return missingProject(res);
    res.json({ message: 'Project updated' });
  } catch (error) { next(error); }
};

exports.remove = async (req, res, next) => {
  try {
    const result = await run('UPDATE projects SET status="cancelled" WHERE project_id=?', [req.params.id]);
    if (!result.affectedRows) return missingProject(res);
    res.json({ message: 'Project cancelled' });
  } catch (error) { next(error); }
};

exports.addMember = async (req, res, next) => {
  try {
    const { user_id, role } = req.body;
    const [scope, params] = writeScope(req.user);
    const result = await run(`INSERT INTO project_members (project_id, user_id, role)
      SELECT p.project_id, ?, ? FROM projects p WHERE p.project_id=? AND ${scope}
      ON DUPLICATE KEY UPDATE user_id=project_members.user_id`,
      [user_id, role || 'member', req.params.id, ...params]);
    if (!result.affectedRows) return missingProject(res);
    res.json({ message: 'Member added' });
  } catch (error) { next(error); }
};

exports.removeMember = async (req, res, next) => {
  try {
    const [scope, params] = writeScope(req.user);
    const result = await run(`DELETE membership FROM project_members membership
      JOIN projects p ON p.project_id=membership.project_id
      WHERE p.project_id=? AND membership.user_id=? AND ${scope}`,
      [req.params.id, req.params.userId, ...params]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Project member not found' });
    res.json({ message: 'Member removed' });
  } catch (error) { next(error); }
};

exports.addMilestone = async (req, res, next) => {
  try {
    const { title, description, due_date } = req.body;
    if (!title) return res.status(400).json({ message: 'Title required' });
    const [scope, params] = writeScope(req.user);
    const result = await run(`INSERT INTO project_milestones (project_id, title, description, due_date)
      SELECT p.project_id,?,?,? FROM projects p WHERE p.project_id=? AND ${scope}`,
      [title, description || null, due_date || null, req.params.id, ...params]);
    if (!result.affectedRows) return missingProject(res);
    res.json({ message: 'Milestone added', milestone_id: result.insertId });
  } catch (error) { next(error); }
};

exports.updateMilestone = async (req, res, next) => {
  try {
    const { status, title, due_date } = req.body;
    const [scope, params] = writeScope(req.user);
    // Bind the milestone to the route's parent and authorize the write in the same statement.
    const result = await run(`UPDATE project_milestones milestone JOIN projects p USING (project_id)
      SET milestone.title=COALESCE(?,milestone.title), milestone.due_date=COALESCE(?,milestone.due_date),
          milestone.completed_at=CASE WHEN ? IS NULL THEN milestone.completed_at
            WHEN ?='completed' THEN COALESCE(milestone.completed_at,NOW()) ELSE NULL END,
          milestone.status=COALESCE(?,milestone.status)
      WHERE p.project_id=? AND milestone.milestone_id=? AND ${scope}`,
      [title || null, due_date || null, status ?? null, status ?? null, status ?? null,
        req.params.id, req.params.milestoneId, ...params]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Project milestone not found' });
    res.json({ message: 'Milestone updated' });
  } catch (error) { next(error); }
};

exports.getMyProjects = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const rows = await run(
      `SELECT p.*, d.dept_name AS department_name, u.full_name AS manager_name, pm.role AS my_role,
       (SELECT COUNT(*) FROM project_members WHERE project_id=p.project_id) AS team_size,
       (SELECT COUNT(*) FROM tasks WHERE project_id=p.project_id) AS total_tasks,
       (SELECT COUNT(*) FROM tasks WHERE project_id=p.project_id AND status='Completed') AS completed_tasks
       FROM projects p
       LEFT JOIN project_members pm ON pm.project_id=p.project_id AND pm.user_id=?
       LEFT JOIN users u ON u.user_id=p.manager_id
       LEFT JOIN departments d ON d.dept_id=p.department_id
       WHERE ${participation} AND p.status != 'cancelled'
       ORDER BY p.updated_at DESC`, [userId, userId, userId, userId]);
    res.json(rows);
  } catch (error) { next(error); }
};

exports.getStats = async (req, res, next) => {
  try {
    const [scope, params] = readScope(req.user);
    const [stats] = await run(
      `SELECT COUNT(*) AS total,
        COALESCE(SUM(status='active'),0) AS active,
        COALESCE(SUM(status='planning'),0) AS planning,
        COALESCE(SUM(status='completed'),0) AS completed,
        COALESCE(SUM(status='on_hold'),0) AS on_hold,
        AVG(completion_pct) AS avg_completion,
        SUM(budget) AS total_budget,
        SUM(spent) AS total_spent
       FROM projects p WHERE status != 'cancelled' AND ${scope}`, params
    );
    res.json(stats);
  } catch (error) { next(error); }
};
