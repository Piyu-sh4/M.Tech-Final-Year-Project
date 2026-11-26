/**
 * dashboardController.js — Role-Based Dashboard (4th Semester)
 * ═════════════════════════════════════════════════════════════
 * Returns customised dashboard data based on the requesting user's role.
 *
 *   Role 1 (Admin)    → full admin stats + all widgets
 *   Role 2 (Employee) → personal tasks, attendance, leave balance, payslip
 *   Role 3 (Manager)  → team tasks, team attendance, leave queue, KPIs
 *   Role 4 (HR)       → payroll panel, all leaves, shifts, salary advances
 *
 * Routes (add to adminRoutes.js or a new dashboardRoutes.js):
 *   GET /api/dashboard          → auto-routes by role
 *   GET /api/dashboard/widgets  → returns widget layout config for this role
 */

const db       = require('../config/db');
const analytics = require('../services/analyticsService');

function query(sql, p = []) {
  return new Promise((res, rej) =>
    db.query(sql, p, (e, rows) => e ? rej(e) : res(rows))
  );
}

// ══════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD (role_id = 1) — complete existing implementation
// ══════════════════════════════════════════════════════════════════════
async function getAdminDashboard(userId) {
  const [
    stats, recentUsers, pendingLeaves, pendingApprovals,
    taskStats, recentTasks, deptStats, recentAudit
  ] = await Promise.all([
    analytics.getHRSummaryStats(),

    query(`SELECT u.user_id, u.full_name, u.email, r.role_name, u.status, u.created_at
           FROM users u JOIN roles r ON u.role_id = r.role_id
           WHERE u.status = 'active' AND u.role_id != 1
           ORDER BY u.created_at DESC LIMIT 10`),

    query(`SELECT lr.*, u.full_name, u.designation FROM leave_requests lr
           JOIN users u ON lr.user_id = u.user_id
           WHERE lr.status = 'pending' ORDER BY lr.created_at DESC LIMIT 5`),

    query(`SELECT user_id, full_name, email, role_id, created_at FROM users
           WHERE status = 'pending' ORDER BY created_at DESC LIMIT 5`),

    query(`SELECT
             COUNT(*) AS total,
             SUM(status='Completed') AS completed,
             SUM(status='Overdue')   AS overdue,
             SUM(status='In Progress') AS in_progress,
             SUM(status='Pending')   AS pending
           FROM tasks`),

    query(`SELECT t.task_id, t.title, t.status, t.priority, t.due_date,
                  u.full_name AS assigned_to_name
           FROM tasks t JOIN users u ON t.assigned_to = u.user_id
           ORDER BY t.created_at DESC LIMIT 8`),

    query(`SELECT d.dept_name, COUNT(u.user_id) AS staff_count
           FROM departments d
           LEFT JOIN users u ON u.department_id = d.dept_id AND u.status = 'active'
           GROUP BY d.dept_id, d.dept_name ORDER BY staff_count DESC`),

    query(`SELECT al.action, al.entity_type, al.created_at, u.full_name AS actor_name
           FROM audit_logs al LEFT JOIN users u ON al.actor_id = u.user_id
           ORDER BY al.created_at DESC LIMIT 5`)
  ]);

  return {
    role: 'Admin',
    stats: stats,
    task_stats:       taskStats[0],
    recent_employees: recentUsers,
    pending_leaves:   pendingLeaves,
    pending_approvals:pendingApprovals,
    recent_tasks:     recentTasks,
    departments:      deptStats,
    recent_audit:     recentAudit
  };
}

// ══════════════════════════════════════════════════════════════════════
// EMPLOYEE DASHBOARD (role_id = 2) — personal data only
// ══════════════════════════════════════════════════════════════════════
async function getEmployeeDashboard(userId) {
  const [
    myTasks, myAttendance, leaveBalances, recentSalary,
    myRank, notifications
  ] = await Promise.all([
    query(`SELECT t.task_id, t.title, t.status, t.priority, t.due_date,
                  t.timer_deadline, t.achievement_level
           FROM tasks t
           WHERE t.assigned_to = ?
           ORDER BY
             CASE t.status
               WHEN 'Overdue'     THEN 0
               WHEN 'In Progress' THEN 1
               WHEN 'Pending'     THEN 2
               ELSE 3
             END,
             t.due_date ASC
           LIMIT 10`, [userId]),

    query(`SELECT work_date, clock_in, clock_out, total_hours, ot_hours, status
           FROM attendance WHERE user_id = ?
           ORDER BY work_date DESC LIMIT 7`, [userId]),

    query(`SELECT leave_type, entitled, used, (entitled - used) AS remaining
           FROM leave_balances WHERE user_id = ? AND year = YEAR(CURDATE())`, [userId]),

    query(`SELECT salary_id, month, year, base_salary, bonus, net_salary,
                  payment_status, paid_on
           FROM salary_records WHERE user_id = ?
           ORDER BY year DESC, month DESC LIMIT 3`, [userId]),

    query(`SELECT rank_pos, full_name, total_points, productivity_score
           FROM (
             SELECT u.user_id, u.full_name, u.total_points,
                    RANK() OVER (ORDER BY u.total_points DESC) AS rank_pos,
                    COALESCE((
                      SELECT ps.productivity_score FROM productivity_scores ps
                      WHERE ps.user_id = u.user_id
                      ORDER BY ps.score_date DESC LIMIT 1
                    ), 0) AS productivity_score
             FROM users u WHERE u.status = 'active' AND u.role_id = 2
           ) ranked WHERE user_id = ?`, [userId]),

    query(`SELECT alert_id, type, title, message, created_at, is_read
           FROM alerts WHERE user_id = ? AND is_read = 0
           ORDER BY created_at DESC LIMIT 5`, [userId])
  ]);

  // Task summary
  const taskSummary = {
    total:       myTasks.length,
    completed:   myTasks.filter(t => t.status === 'Completed').length,
    overdue:     myTasks.filter(t => t.status === 'Overdue').length,
    in_progress: myTasks.filter(t => t.status === 'In Progress').length,
    pending:     myTasks.filter(t => t.status === 'Pending').length,
  };
  taskSummary.completion_rate = taskSummary.total
    ? Math.round(taskSummary.completed / taskSummary.total * 100) : 0;

  return {
    role:           'Employee',
    my_tasks:       myTasks,
    task_summary:   taskSummary,
    attendance:     myAttendance,
    leave_balances: leaveBalances,
    recent_salary:  recentSalary,
    my_rank:        myRank[0] || null,
    notifications:  notifications
  };
}

// ══════════════════════════════════════════════════════════════════════
// MANAGER DASHBOARD (role_id = 3) — team-focused
// ══════════════════════════════════════════════════════════════════════
async function getManagerDashboard(userId) {
  // Find manager's department
  const [manager] = await query(
    'SELECT department_id FROM users WHERE user_id = ?', [userId]
  );
  const deptId = manager?.department_id;

  const teamFilter = 'AND u.reporting_manager_id = ?';
  const teamParams = [userId];

  const [
    teamMembers, teamTasks, teamAttendanceToday,
    pendingLeaves, teamKPIs, leaderboard
  ] = await Promise.all([
    query(`SELECT u.user_id, u.full_name, u.designation, u.status,
                  COUNT(t.task_id) AS total_tasks,
                  SUM(t.status='Completed') AS completed
           FROM users u
           LEFT JOIN tasks t ON t.assigned_to = u.user_id
           WHERE u.role_id = 2 ${teamFilter}
           GROUP BY u.user_id, u.full_name, u.designation, u.status
           ORDER BY u.full_name`, teamParams),

    query(`SELECT t.task_id, t.title, t.status, t.priority, t.due_date,
                  u.full_name AS assigned_to_name
           FROM tasks t
           JOIN users u ON t.assigned_to = u.user_id
           WHERE u.role_id = 2 ${teamFilter}
           ORDER BY
             CASE t.status WHEN 'Overdue' THEN 0 WHEN 'In Progress' THEN 1 ELSE 2 END,
             t.due_date ASC
           LIMIT 20`, teamParams),

    query(`SELECT COUNT(*) AS clocked_in
           FROM attendance a
           JOIN users u ON a.user_id = u.user_id
           WHERE a.work_date = CURDATE() AND a.clock_in IS NOT NULL
           AND u.role_id = 2 ${teamFilter}`, teamParams),

    query(`SELECT lr.*, u.full_name, u.designation
           FROM leave_requests lr
           JOIN users u ON lr.user_id = u.user_id
           WHERE lr.status = 'pending'
           AND u.role_id = 2 ${teamFilter}
           ORDER BY lr.created_at DESC LIMIT 8`, teamParams),

    query(`SELECT COUNT(DISTINCT u.user_id) AS total_employees, COUNT(t.task_id) AS total_tasks,
                  COALESCE(SUM(t.status='Completed'),0) AS completed_tasks,
                  COALESCE(SUM(t.status='Overdue'),0) AS overdue_tasks,
                  COALESCE(ROUND(100 * SUM(t.status='Completed') / NULLIF(COUNT(t.task_id),0),1),0) AS completion_rate
           FROM users u LEFT JOIN tasks t ON t.assigned_to=u.user_id
           WHERE u.role_id=2 ${teamFilter}`, teamParams).then(([summary]) => summary),

    query(`SELECT u.full_name, u.total_points,
                  RANK() OVER (ORDER BY u.total_points DESC) AS rank_pos
           FROM users u
           WHERE u.role_id = 2 AND u.status = 'active' ${teamFilter}
           ORDER BY u.total_points DESC LIMIT 5`, teamParams)
  ]);

  return {
    role:                 'Manager',
    department_id:        deptId,
    team_members:         teamMembers,
    team_tasks:           teamTasks,
    team_attendance_today:teamAttendanceToday[0]?.clocked_in || 0,
    pending_leaves:       pendingLeaves,
    kpis:                 teamKPIs,
    team_leaderboard:     leaderboard
  };
}

// ══════════════════════════════════════════════════════════════════════
// HR DASHBOARD (role_id = 4) — payroll + leave + shifts
// ══════════════════════════════════════════════════════════════════════
async function getHRDashboard(userId) {
  const [
    payrollSummary, allPendingLeaves, salaryAdvances,
    expenseClaims, shiftSummary, newEmployees, leaveStats
  ] = await Promise.all([
    query(`SELECT
             SUM(payment_status='pending') AS unpaid_count,
             SUM(payment_status='paid')    AS paid_count,
             COALESCE(SUM(CASE WHEN payment_status='pending' THEN net_salary END), 0) AS unpaid_total,
             COALESCE(SUM(CASE WHEN payment_status='paid'    THEN net_salary END), 0) AS paid_total
           FROM salary_records
           WHERE year = YEAR(CURDATE()) AND month = MONTH(CURDATE())`),

    query(`SELECT lr.*, u.full_name, u.designation, d.dept_name
           FROM leave_requests lr
           JOIN users u ON lr.user_id = u.user_id
           LEFT JOIN departments d ON u.department_id = d.dept_id
           WHERE lr.status = 'pending'
           ORDER BY lr.created_at DESC LIMIT 10`),

    query(`SELECT sa.*, u.full_name, u.designation
           FROM salary_advances sa JOIN users u ON sa.user_id = u.user_id
           WHERE sa.status = 'pending'
           ORDER BY sa.created_at DESC LIMIT 5`),

    query(`SELECT ec.*, u.full_name
           FROM expense_claims ec JOIN users u ON ec.user_id = u.user_id
           WHERE ec.status = 'pending'
           ORDER BY ec.created_at DESC LIMIT 5`),

    query(`SELECT s.shift_name, COUNT(u.user_id) AS employee_count
           FROM shifts s
           LEFT JOIN users u ON u.shift_id = s.shift_id AND u.status = 'active'
           GROUP BY s.shift_id, s.shift_name ORDER BY employee_count DESC`),

    query(`SELECT user_id, full_name, email, designation, created_at
           FROM users WHERE status = 'active'
           ORDER BY created_at DESC LIMIT 5`),

    query(`SELECT leave_type, SUM(used) AS total_used, SUM(entitled) AS total_entitled
           FROM leave_balances WHERE year = YEAR(CURDATE())
           GROUP BY leave_type`)
  ]);

  return {
    role:            'HR',
    payroll_summary: payrollSummary[0] || {},
    pending_leaves:  allPendingLeaves,
    salary_advances: salaryAdvances,
    expense_claims:  expenseClaims,
    shifts:          shiftSummary,
    new_employees:   newEmployees,
    leave_stats:     leaveStats
  };
}

// ══════════════════════════════════════════════════════════════════════
// MAIN ROUTE HANDLER — auto-routes by role
// ══════════════════════════════════════════════════════════════════════
exports.getDashboard = async (req, res) => {
  try {
    const { user_id, role_id } = req.user;
    let data;

    switch (role_id) {
      case 1:  data = await getAdminDashboard(user_id);    break;
      case 2:  data = await getEmployeeDashboard(user_id); break;
      case 3:  data = await getManagerDashboard(user_id);  break;
      case 4:  data = await getHRDashboard(user_id);       break;
      default: return res.status(400).json({ message: 'Unknown role' });
    }

    res.json({ ...data, generated_at: new Date().toISOString() });
  } catch (err) {
    console.error('[DASHBOARD]', err.message);
    res.status(500).json({ message: 'Dashboard load failed', error: err.message });
  }
};

// ── Return widget layout config for the requesting role ───────────────
exports.getWidgetLayout = async (req, res) => {
  try {
    const { role_id } = req.user;
    const widgets = await query(
      `SELECT widget_key, position, is_visible, config
       FROM role_dashboards WHERE role_id = ? AND is_visible = 1
       ORDER BY position ASC`,
      [role_id]
    );
    res.json(widgets);
  } catch (err) {
    res.status(500).json({ message: 'Widget layout fetch failed', error: err.message });
  }
};
