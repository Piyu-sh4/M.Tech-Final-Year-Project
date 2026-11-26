/**
 * analyticsService.js — Analytics Service v5.1
 * Computes productivity trends: daily, weekly, monthly, annual
 */

const db = require('../config/db');

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

// ── Daily trend (last 30 days) ────────────────────────────
async function getDailyTrend(userId = null) {
  try {
  const userFilter = userId ? 'AND assigned_to = ?' : '';
  const params     = userId ? [userId] : [];

  const rows = await query(`
    SELECT
      DATE(created_at)                  AS day,
      COUNT(*)                          AS total,
      SUM(status = 'Completed')         AS completed,
      SUM(status = 'Overdue')           AS overdue,
      SUM(status = 'In Progress')       AS in_progress,
      SUM(status = 'Pending')           AS pending
    FROM tasks
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    ${userFilter}
    GROUP BY DATE(created_at)
    ORDER BY day ASC
  `, params);

  return rows.map(r => ({
    label:       new Date(r.day).toLocaleDateString('en-IN', { day:'2-digit', month:'short' }),
    day:         r.day,
    total:       Number(r.total),
    completed:   Number(r.completed),
    overdue:     Number(r.overdue),
    in_progress: Number(r.in_progress),
    pending:     Number(r.pending),
    rate:        r.total ? Math.round((r.completed / r.total) * 100) : 0
  }));
  } catch(err) {
    console.error('[analyticsService.getDailyTrend]', err.message);
    throw err;
  }
}

// ── Weekly trend (last 12 weeks) ─────────────────────────
async function getWeeklyTrend(userId = null) {
  try {
  const userFilter = userId ? 'AND assigned_to = ?' : '';
  const params     = userId ? [userId] : [];

  const rows = await query(`
    SELECT
      YEARWEEK(created_at, 1)           AS week_key,
      MIN(DATE(created_at))             AS week_start,
      COUNT(*)                          AS total,
      SUM(status = 'Completed')         AS completed,
      SUM(status = 'Overdue')           AS overdue,
      SUM(status = 'In Progress')       AS in_progress
    FROM tasks
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 WEEK)
    ${userFilter}
    GROUP BY YEARWEEK(created_at, 1)
    ORDER BY week_key ASC
  `, params);

  return rows.map(r => ({
    label:       'W/c ' + new Date(r.week_start).toLocaleDateString('en-IN', { day:'2-digit', month:'short' }),
    week_start:  r.week_start,
    total:       Number(r.total),
    completed:   Number(r.completed),
    overdue:     Number(r.overdue),
    in_progress: Number(r.in_progress),
    rate:        r.total ? Math.round((r.completed / r.total) * 100) : 0
  }));
  } catch(err) {
    console.error('[analyticsService.getWeeklyTrend]', err.message);
    throw err;
  }
}

// ── Monthly trend (last 12 months) ───────────────────────
async function getMonthlyTrend(userId = null) {
  try {
  const userFilter = userId ? 'AND assigned_to = ?' : '';
  const params     = userId ? [userId] : [];

  const rows = await query(`
    SELECT
      DATE_FORMAT(created_at, '%Y-%m')  AS month_key,
      COUNT(*)                          AS total,
      SUM(status = 'Completed')         AS completed,
      SUM(status = 'Overdue')           AS overdue,
      SUM(status = 'In Progress')       AS in_progress,
      SUM(status = 'Pending')           AS pending
    FROM tasks
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
    ${userFilter}
    GROUP BY month_key
    ORDER BY month_key ASC
  `, params);

  return rows.map(r => ({
    label:       new Date(r.month_key + '-01').toLocaleDateString('en-IN', { month:'short', year:'numeric' }),
    month:       r.month_key,
    total:       Number(r.total),
    completed:   Number(r.completed),
    overdue:     Number(r.overdue),
    in_progress: Number(r.in_progress),
    pending:     Number(r.pending),
    rate:        r.total ? Math.round((r.completed / r.total) * 100) : 0
  }));
  } catch(err) {
    console.error('[analyticsService.getMonthlyTrend]', err.message);
    throw err;
  }
}

// ── Annual trend (all years available) ───────────────────
async function getAnnualTrend(userId = null) {
  try {
  const userFilter = userId ? 'AND assigned_to = ?' : '';
    const params     = userId ? [userId] : [];
  
    const rows = await query(`
      SELECT
        YEAR(created_at)                  AS year,
        COUNT(*)                          AS total,
        SUM(status = 'Completed')         AS completed,
        SUM(status = 'Overdue')           AS overdue,
        SUM(status = 'In Progress')       AS in_progress,
        SUM(status = 'Pending')           AS pending
      FROM tasks
      ${userId ? 'WHERE assigned_to = ?' : ''}
      GROUP BY YEAR(created_at)
      ORDER BY year ASC
    `, params);
  
    return rows.map(r => ({
      label:       String(r.year),
      year:        r.year,
      total:       Number(r.total),
      completed:   Number(r.completed),
      overdue:     Number(r.overdue),
      in_progress: Number(r.in_progress),
      pending:     Number(r.pending),
      rate:        r.total ? Math.round((r.completed / r.total) * 100) : 0
    }));
  } catch(err) {
    console.error('[analyticsService]', err.message);
    throw err;
  }
}

// ── Top performers (by completion rate) ──────────────────
async function getTopPerformers() {
  try {
  const rows = await query(`
      SELECT
        u.user_id,
        u.full_name,
        COUNT(t.task_id)                  AS total,
        SUM(t.status = 'Completed')       AS completed,
        SUM(t.status = 'Overdue')         AS overdue,
        CASE WHEN COUNT(t.task_id) > 0
          THEN ROUND((SUM(t.status = 'Completed') / COUNT(t.task_id)) * 100, 1)
          ELSE 0
        END                               AS completion_rate,
        GREATEST(0,
          CASE WHEN COUNT(t.task_id) > 0
            THEN ROUND((SUM(t.status = 'Completed') / COUNT(t.task_id)) * 100, 1) - (SUM(t.status = 'Overdue') * 10)
            ELSE 0
          END
        )                                 AS productivity_score
      FROM users u
      LEFT JOIN tasks t ON t.assigned_to = u.user_id
      WHERE u.role_id = 2
      GROUP BY u.user_id, u.full_name
      ORDER BY productivity_score DESC
      LIMIT 10
    `);
  
    return rows.map(r => ({
      user_id:          r.user_id,
      full_name:        r.full_name,
      total:            Number(r.total),
      completed:        Number(r.completed),
      overdue:          Number(r.overdue),
      completion_rate:  Number(r.completion_rate),
      productivity_score: Number(r.productivity_score)
    }));
  } catch(err) {
    console.error('[analyticsService]', err.message);
    throw err;
  }
}

// ── Summary stats (for chat context) ─────────────────────
async function getSummaryStats() {
  try {
  const [[tasks], [users], [overdue]] = await Promise.all([
      query('SELECT COUNT(*) AS n, SUM(status="Completed") AS done, SUM(status="Overdue") AS od FROM tasks'),
      query('SELECT COUNT(*) AS n FROM users'),
      query("SELECT COUNT(*) AS n FROM tasks WHERE due_date < CURDATE() AND status != 'Completed'")
    ]);
  
    return {
      total_tasks:     Number(tasks.n),
      completed_tasks: Number(tasks.done),
      overdue_tasks:   Number(overdue.n),
      total_users:     Number(users.n),
      completion_rate: tasks.n ? Math.round((tasks.done / tasks.n) * 100) : 0
    };
  } catch(err) {
    console.error('[analyticsService]', err.message);
    throw err;
  }
}

// ── HR Summary stats (— includes attendance + payroll) ──
async function getHRSummaryStats() {
  try {
  const [[tasks], [users], [overdue], [leaves], [attendance], [payroll]] = await Promise.all([
      query('SELECT COUNT(*) AS n, SUM(status="Completed") AS done, SUM(status="Overdue") AS od FROM tasks'),
      query('SELECT COUNT(*) AS n FROM users WHERE status="active" AND role_id != 1'),
      query("SELECT COUNT(*) AS n FROM tasks WHERE due_date < CURDATE() AND status != 'Completed'"),
      query("SELECT COUNT(*) AS n FROM leave_requests WHERE status='pending'"),
      query("SELECT COUNT(*) AS n FROM attendance WHERE work_date=CURDATE() AND clock_in IS NOT NULL"),
      query("SELECT COUNT(*) AS n, COALESCE(SUM(net_salary),0) AS total FROM salary_records WHERE payment_status='pending'")
    ]);
    return {
      total_tasks:      Number(tasks.n),
      completed_tasks:  Number(tasks.done),
      overdue_tasks:    Number(overdue.n),
      total_employees:  Number(users.n),
      completion_rate:  tasks.n ? Math.round((tasks.done / tasks.n) * 100) : 0,
      pending_leaves:   Number(leaves.n),
      clocked_in_today: Number(attendance.n),
      unpaid_salaries:  Number(payroll.n),
      unpaid_total:     parseFloat(payroll.total) || 0
    };
  } catch(err) {
    console.error('[analyticsService]', err.message);
    throw err;
  }
}

module.exports = { getDailyTrend, getWeeklyTrend, getMonthlyTrend, getAnnualTrend, getTopPerformers, getSummaryStats, getHRSummaryStats };
