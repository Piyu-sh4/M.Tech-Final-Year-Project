/**
 * adminController.js — v6.0 Complete Admin Controller
 * NEW in v6.0:
 *   - Leave balance tracking + auto-deduct on approval
 *   - Salary components (itemized: HRA, PF, TDS, etc.)
 *   - Salary advance / loan management
 *   - Salary revision history
 *   - Attendance: OT hours, total_hours, shift awareness
 *   - Holiday calendar CRUD
 *   - Shift management
 *   - Expense / reimbursement claims
 *   - Audit log viewer
 *   - Admin dashboard summary stats
 *   - Employee designation field
 *   - Payslip PDF token generation
 */
const db     = require('../config/db');
const bcrypt = require('bcryptjs');

function query(sql, params) {
  return new Promise((resolve, reject) =>
    db.query(sql, params || [], (err, res) => err ? reject(err) : resolve(res))
  );
}

/* ══════════════════════════════════════════════════════
   USER MANAGEMENT
══════════════════════════════════════════════════════ */

exports.getAllUsers = async (req, res) => {
  try {
    const users = await query(`
      SELECT u.user_id, u.full_name, u.email, u.role_id, u.access_level,
             u.total_points, u.status, u.base_salary, u.phone, u.profile_notes,
             u.designation, u.join_date, u.employment_type, u.gender,
             u.created_at, r.role_name, d.dept_name, d.dept_id,
             s.shift_name
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN departments d ON u.department_id = d.dept_id
      LEFT JOIN shifts s ON u.shift_id = s.shift_id
      ORDER BY u.created_at DESC
    `);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch users', error: err.message });
  }
};

exports.getPendingUsers = async (req, res) => {
  try {
    const users = await query(`
      SELECT u.user_id, u.full_name, u.email, u.role_id, u.created_at, r.role_name
      FROM users u JOIN roles r ON u.role_id = r.role_id
      WHERE u.status = 'pending' ORDER BY u.created_at DESC
    `);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch pending users', error: err.message });
  }
};

exports.approveUser = async (req, res) => {
  try {
    const uid = parseInt(req.params.id);
    await query(`UPDATE users SET status='active' WHERE user_id=?`, [uid]);
    // Ensure permissions row exists
    await query(`INSERT IGNORE INTO user_permissions (user_id, updated_by) VALUES (?,?)`,
      [uid, req.user.user_id]);
    // Seed leave balances for current year
    const year  = new Date().getFullYear();
    const types = [['sick',12],['casual',12],['earned',15],['unpaid',0],['other',0]];
    for (const [lt, ent] of types) {
      await query(
        `INSERT IGNORE INTO leave_balances (user_id, year, leave_type, entitled) VALUES (?,?,?,?)`,
        [uid, year, lt, ent]
      ).catch(() => {});
    }
    // Notify the user their account is approved
    await query(
      `INSERT INTO alerts (user_id, alert_message, alert_type) VALUES (?,?,?)`,
      [uid, '🎉 Your account has been approved! You can now log in to the Workforce Intelligence Platform.', 'general']
    ).catch(() => {});
    res.json({ message: 'User approved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Could not approve user', error: err.message });
  }
};

exports.rejectUser = async (req, res) => {
  try {
    const { reason } = req.body;
    await query(`UPDATE users SET status='suspended', profile_notes=? WHERE user_id=? AND status='pending'`,
      [reason ? `Rejected: ${reason}` : 'Registration rejected by admin', req.params.id]);
    res.json({ message: 'Registration rejected' });
  } catch (err) {
    res.status(500).json({ message: 'Could not reject user', error: err.message });
  }
};

exports.suspendUser = async (req, res) => {
  try {
    await query(`UPDATE users SET status='suspended' WHERE user_id=?`, [req.params.id]);
    res.json({ message: 'User suspended' });
  } catch (err) {
    res.status(500).json({ message: 'Could not suspend user', error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    if (parseInt(id) === req.user.user_id)
      return res.status(400).json({ message: 'Cannot delete your own account' });
    await query(`DELETE FROM user_permissions WHERE user_id=?`, [id]);
    await query(`DELETE FROM leave_balances WHERE user_id=?`, [id]);
    await query(`DELETE FROM salary_advances WHERE user_id=?`, [id]);
    await query(`DELETE FROM salary_revisions WHERE user_id=?`, [id]);
    await query(`DELETE FROM expense_claims WHERE user_id=?`, [id]);
    await query(`DELETE FROM attendance WHERE user_id=?`, [id]);
    await query(`DELETE FROM salary_records WHERE user_id=?`, [id]);
    await query(`DELETE FROM users WHERE user_id=?`, [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete user', error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const {
      full_name, email, role_id, department_id, base_salary, phone,
      profile_notes, designation, join_date, employment_type, gender, shift_id
    } = req.body;

    const current = await query('SELECT base_salary FROM users WHERE user_id=?', [req.params.id]);
    const oldSalary = current[0]?.base_salary || 0;
    const newSalary = parseFloat(base_salary) || 0;

    await query(`
      UPDATE users SET full_name=?, email=?, role_id=?, department_id=?,
             base_salary=?, phone=?, profile_notes=?, designation=?,
             join_date=?, employment_type=?, gender=?, shift_id=?
      WHERE user_id=?
    `, [full_name, email, role_id, department_id || null, newSalary,
        phone || null, profile_notes || null, designation || null,
        join_date || null, employment_type || 'full_time', gender || null,
        shift_id || null, req.params.id]);

    // Auto-log salary revision if salary changed
    if (oldSalary !== newSalary && newSalary > 0) {
      await query(
        `INSERT INTO salary_revisions (user_id, old_salary, new_salary, effective_date, reason, revised_by)
         VALUES (?,?,?,CURDATE(),'Admin update',?)`,
        [req.params.id, oldSalary, newSalary, req.user.user_id]
      );
    }
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Could not update user', error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 8)
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    const hashed = bcrypt.hashSync(new_password, 10);
    await query(`UPDATE users SET password_hash=? WHERE user_id=?`, [hashed, req.params.id]);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Could not reset password', error: err.message });
  }
};

/* ── Salary Revision History ──────────────────────── */
exports.getSalaryRevisions = async (req, res) => {
  try {
    const rows = await query(`
      SELECT sr.*, u.full_name AS revised_by_name
      FROM salary_revisions sr
      LEFT JOIN users u ON sr.revised_by = u.user_id
      WHERE sr.user_id=?
      ORDER BY sr.effective_date DESC`, [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch revisions', error: err.message });
  }
};

/* ── Dashboard Summary Stats ──────────────────────── */
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      [headcount], [pendingLeaves], [todayPresent], [unpaidSalaries],
      [pendingUsers], [openTasks], [overdueCount]
    ] = await Promise.all([
      query(`SELECT COUNT(*) AS n FROM users WHERE status='active' AND role_id != 1`),
      query(`SELECT COUNT(*) AS n FROM leave_requests WHERE status='pending'`),
      query(`SELECT COUNT(*) AS n FROM attendance WHERE work_date=CURDATE() AND status='present'`),
      query(`SELECT COUNT(*) AS n, COALESCE(SUM(net_salary),0) AS total FROM salary_records WHERE payment_status='pending'`),
      query(`SELECT COUNT(*) AS n FROM users WHERE status='pending'`),
      query(`SELECT COUNT(*) AS n FROM tasks WHERE status IN ('Pending','In Progress')`),
      query(`SELECT COUNT(*) AS n FROM tasks WHERE due_date < CURDATE() AND status NOT IN ('Completed')`)
    ]);
    res.json({
      headcount: headcount.n,
      pending_leaves: pendingLeaves.n,
      today_present: todayPresent.n,
      unpaid_salary_count: unpaidSalaries.n,
      unpaid_salary_total: parseFloat(unpaidSalaries.total) || 0,
      pending_registrations: pendingUsers.n,
      open_tasks: openTasks.n,
      overdue_tasks: overdueCount.n
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch stats', error: err.message });
  }
};

/* ══════════════════════════════════════════════════════
   PERMISSIONS
══════════════════════════════════════════════════════ */
exports.getUserPermissions = async (req, res) => {
  try {
    let rows = await query(`SELECT * FROM user_permissions WHERE user_id=?`, [req.params.id]);
    if (!rows.length) {
      await query(`INSERT IGNORE INTO user_permissions (user_id, updated_by) VALUES (?,?)`,
        [req.params.id, req.user.user_id]);
      rows = await query(`SELECT * FROM user_permissions WHERE user_id=?`, [req.params.id]);
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch permissions', error: err.message });
  }
};

exports.updateUserPermissions = async (req, res) => {
  try {
    const {
      can_view_analytics, can_view_reports, can_use_chat,
      can_request_extension, can_view_salary, can_view_team,
      can_view_attendance, can_clock_in_out, can_request_advance
    } = req.body;
    await query(`
      INSERT INTO user_permissions
        (user_id, can_view_analytics, can_view_reports, can_use_chat,
         can_request_extension, can_view_salary, can_view_team,
         can_view_attendance, can_clock_in_out, can_request_advance, updated_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE
        can_view_analytics=VALUES(can_view_analytics),
        can_view_reports=VALUES(can_view_reports),
        can_use_chat=VALUES(can_use_chat),
        can_request_extension=VALUES(can_request_extension),
        can_view_salary=VALUES(can_view_salary),
        can_view_team=VALUES(can_view_team),
        can_view_attendance=VALUES(can_view_attendance),
        can_clock_in_out=VALUES(can_clock_in_out),
        can_request_advance=VALUES(can_request_advance),
        updated_by=VALUES(updated_by)
    `, [req.params.id,
        can_view_analytics ? 1:0, can_view_reports ? 1:0, can_use_chat ? 1:0,
        can_request_extension ? 1:0, can_view_salary ? 1:0, can_view_team ? 1:0,
        can_view_attendance !== false ? 1:0,
        can_clock_in_out !== false ? 1:0,
        can_request_advance ? 1:0,
        req.user.user_id]);
    res.json({ message: 'Permissions updated' });
  } catch (err) {
    res.status(500).json({ message: 'Could not update permissions', error: err.message });
  }
};

/* ══════════════════════════════════════════════════════
   DEPARTMENTS
══════════════════════════════════════════════════════ */
exports.getDepartments = async (req, res) => {
  try {
    const depts = await query(`
      SELECT d.*, u.full_name AS manager_name,
             COUNT(emp.user_id) AS member_count
      FROM departments d
      LEFT JOIN users u ON d.manager_id = u.user_id
      LEFT JOIN users emp ON emp.department_id = d.dept_id AND emp.status != 'suspended'
      GROUP BY d.dept_id ORDER BY d.dept_name
    `);
    res.json(depts);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch departments', error: err.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { dept_name, description, manager_id } = req.body;
    if (!dept_name) return res.status(400).json({ message: 'Department name required' });
    const result = await query(
      `INSERT INTO departments (dept_name, description, manager_id) VALUES (?,?,?)`,
      [dept_name, description || null, manager_id || null]
    );
    res.status(201).json({ message: 'Department created', dept_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Could not create department', error: err.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { dept_name, description, manager_id } = req.body;
    await query(`UPDATE departments SET dept_name=?, description=?, manager_id=? WHERE dept_id=?`,
      [dept_name, description || null, manager_id || null, req.params.id]);
    res.json({ message: 'Department updated' });
  } catch (err) {
    res.status(500).json({ message: 'Could not update department', error: err.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    await query(`UPDATE users SET department_id=NULL WHERE department_id=?`, [req.params.id]);
    await query(`DELETE FROM departments WHERE dept_id=?`, [req.params.id]);
    res.json({ message: 'Department deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete department', error: err.message });
  }
};

exports.getDeptMembers = async (req, res) => {
  try {
    const members = await query(`
      SELECT u.user_id, u.full_name, u.email, u.status, u.access_level,
             u.total_points, u.designation, r.role_name
      FROM users u JOIN roles r ON u.role_id = r.role_id
      WHERE u.department_id=? ORDER BY u.full_name
    `, [req.params.id]);
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch members', error: err.message });
  }
};

exports.assignDeptMembers = async (req, res) => {
  try {
    const { user_ids, replace } = req.body;
    if (!Array.isArray(user_ids) || !user_ids.length)
      return res.status(400).json({ message: 'user_ids array is required' });
    if (replace)
      await query(`UPDATE users SET department_id=NULL WHERE department_id=?`, [req.params.id]);
    for (const uid of user_ids)
      await query(`UPDATE users SET department_id=? WHERE user_id=?`, [req.params.id, uid]);
    res.json({ message: `${user_ids.length} employees assigned to department` });
  } catch (err) {
    res.status(500).json({ message: 'Assignment failed', error: err.message });
  }
};

/* ══════════════════════════════════════════════════════
   SHIFTS
══════════════════════════════════════════════════════ */
exports.getShifts = async (req, res) => {
  try {
    res.json(await query(`SELECT * FROM shifts ORDER BY start_time`));
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch shifts', error: err.message });
  }
};

exports.createShift = async (req, res) => {
  try {
    const { shift_name, start_time, end_time, grace_minutes } = req.body;
    if (!shift_name || !start_time || !end_time)
      return res.status(400).json({ message: 'shift_name, start_time, end_time required' });
    const result = await query(
      `INSERT INTO shifts (shift_name, start_time, end_time, grace_minutes) VALUES (?,?,?,?)`,
      [shift_name, start_time, end_time, grace_minutes || 10]
    );
    res.status(201).json({ message: 'Shift created', shift_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Could not create shift', error: err.message });
  }
};

exports.updateShift = async (req, res) => {
  try {
    const { shift_name, start_time, end_time, grace_minutes, is_active } = req.body;
    await query(
      `UPDATE shifts SET shift_name=?, start_time=?, end_time=?, grace_minutes=?, is_active=? WHERE shift_id=?`,
      [shift_name, start_time, end_time, grace_minutes || 10, is_active !== false ? 1 : 0, req.params.id]
    );
    res.json({ message: 'Shift updated' });
  } catch (err) {
    res.status(500).json({ message: 'Could not update shift', error: err.message });
  }
};

exports.deleteShift = async (req, res) => {
  try {
    await query(`UPDATE users SET shift_id=NULL WHERE shift_id=?`, [req.params.id]);
    await query(`DELETE FROM shifts WHERE shift_id=?`, [req.params.id]);
    res.json({ message: 'Shift deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete shift', error: err.message });
  }
};

/* ══════════════════════════════════════════════════════
   HOLIDAY CALENDAR
══════════════════════════════════════════════════════ */
exports.getHolidays = async (req, res) => {
  try {
    const { year } = req.query;
    let sql = `SELECT * FROM holiday_calendar WHERE 1=1`;
    const params = [];
    if (year) { sql += ` AND YEAR(holiday_date)=?`; params.push(year); }
    sql += ` ORDER BY holiday_date`;
    res.json(await query(sql, params));
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch holidays', error: err.message });
  }
};

exports.createHoliday = async (req, res) => {
  try {
    const { name, holiday_date, holiday_type, description } = req.body;
    if (!name || !holiday_date)
      return res.status(400).json({ message: 'name and holiday_date required' });
    const result = await query(
      `INSERT INTO holiday_calendar (name, holiday_date, holiday_type, description, created_by)
       VALUES (?,?,?,?,?)`,
      [name, holiday_date, holiday_type || 'public', description || null, req.user.user_id]
    );
    res.status(201).json({ message: 'Holiday created', holiday_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Could not create holiday', error: err.message });
  }
};

exports.deleteHoliday = async (req, res) => {
  try {
    await query(`DELETE FROM holiday_calendar WHERE holiday_id=?`, [req.params.id]);
    res.json({ message: 'Holiday deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete holiday', error: err.message });
  }
};

/* ══════════════════════════════════════════════════════
   ATTENDANCE
══════════════════════════════════════════════════════ */
exports.getAttendance = async (req, res) => {
  try {
    const { user_id, date_from, date_to } = req.query;
    let sql = `
      SELECT a.*, u.full_name, u.email, u.designation, d.dept_name,
             s.shift_name, s.start_time AS shift_start
      FROM attendance a
      JOIN users u ON a.user_id = u.user_id
      LEFT JOIN departments d ON u.department_id = d.dept_id
      LEFT JOIN shifts s ON u.shift_id = s.shift_id
      WHERE 1=1`;
    const params = [];
    if (user_id)   { sql += ` AND a.user_id=?`;        params.push(user_id); }
    if (date_from) { sql += ` AND a.work_date >= ?`;    params.push(date_from); }
    if (date_to)   { sql += ` AND a.work_date <= ?`;    params.push(date_to); }
    sql += ` ORDER BY a.work_date DESC, u.full_name LIMIT 500`;
    res.json(await query(sql, params));
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch attendance', error: err.message });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const { user_id, work_date, clock_in, clock_out, status, remarks } = req.body;
    if (!user_id || !work_date)
      return res.status(400).json({ message: 'user_id and work_date required' });

    // Auto-calc total_hours and ot_hours if both times present
    let total_hours = null, ot_hours = 0;
    if (clock_in && clock_out) {
      const ci = new Date(`${work_date}T${clock_in}`);
      const co = new Date(`${work_date}T${clock_out}`);
      total_hours = parseFloat(((co - ci) / 3600000).toFixed(2));
      ot_hours = Math.max(0, parseFloat((total_hours - 8).toFixed(2)));
    }

    await query(`
      INSERT INTO attendance (user_id, work_date, clock_in, clock_out, status, remarks, total_hours, ot_hours)
      VALUES (?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE
        clock_in=VALUES(clock_in), clock_out=VALUES(clock_out),
        status=VALUES(status), remarks=VALUES(remarks),
        total_hours=VALUES(total_hours), ot_hours=VALUES(ot_hours)
    `, [user_id, work_date, clock_in || null, clock_out || null,
        status || 'present', remarks || null, total_hours, ot_hours]);
    res.json({ message: 'Attendance marked', total_hours, ot_hours });
  } catch (err) {
    res.status(500).json({ message: 'Could not mark attendance', error: err.message });
  }
};

exports.clockIn = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const today   = new Date().toISOString().slice(0, 10);
    const now     = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Check if already clocked in
    const existing = await query(
      `SELECT clock_in FROM attendance WHERE user_id=? AND work_date=?`, [user_id, today]
    );
    if (existing.length && existing[0].clock_in)
      return res.status(400).json({ message: 'Already clocked in today' });

    // Check shift for late status
    const userShift = await query(
      `SELECT s.start_time, s.grace_minutes FROM users u
       LEFT JOIN shifts s ON u.shift_id = s.shift_id WHERE u.user_id=?`, [user_id]
    );
    let status = 'present';
    if (userShift.length && userShift[0].start_time) {
      const [h, m] = userShift[0].start_time.split(':').map(Number);
      const grace  = userShift[0].grace_minutes || 15;
      const shiftStart = new Date(); shiftStart.setHours(h, m + grace, 0, 0);
      if (new Date() > shiftStart) status = 'late';
    }

    await query(`
      INSERT INTO attendance (user_id, work_date, clock_in, status)
      VALUES (?,?,?,?)
      ON DUPLICATE KEY UPDATE clock_in=IF(clock_in IS NULL, VALUES(clock_in), clock_in), status=VALUES(status)
    `, [user_id, today, now, status]);

    res.json({ message: `Clocked in at ${now.slice(11, 16)}`, status });
  } catch (err) {
    res.status(500).json({ message: 'Clock in failed', error: err.message });
  }
};

exports.clockOut = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const today   = new Date().toISOString().slice(0, 10);
    const now     = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const rows = await query(`SELECT * FROM attendance WHERE user_id=? AND work_date=?`, [user_id, today]);
    if (!rows.length || !rows[0].clock_in)
      return res.status(400).json({ message: 'You have not clocked in today' });
    if (rows[0].clock_out)
      return res.status(400).json({ message: 'Already clocked out today' });

    const ci = new Date(rows[0].clock_in);
    const co = new Date(now.replace(' ', 'T'));
    const total_hours = parseFloat(((co - ci) / 3600000).toFixed(2));
    const ot_hours    = Math.max(0, parseFloat((total_hours - 8).toFixed(2)));

    await query(
      `UPDATE attendance SET clock_out=?, total_hours=?, ot_hours=? WHERE user_id=? AND work_date=?`,
      [now, total_hours, ot_hours, user_id, today]
    );
    res.json({ message: `Clocked out at ${now.slice(11, 16)}`, total_hours, ot_hours });
  } catch (err) {
    res.status(500).json({ message: 'Clock out failed', error: err.message });
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const rows = await query(`
      SELECT * FROM attendance WHERE user_id=?
      ORDER BY work_date DESC LIMIT 60
    `, [req.user.user_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch attendance', error: err.message });
  }
};

exports.getTodayAttendance = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const rows  = await query(`SELECT * FROM attendance WHERE user_id=? AND work_date=?`,
      [req.user.user_id, today]);
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch today attendance', error: err.message });
  }
};

exports.getAttendanceSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year)  || new Date().getFullYear();

    // Count working days excl. holidays
    const holidays = await query(
      `SELECT COUNT(*) AS n FROM holiday_calendar
       WHERE MONTH(holiday_date)=? AND YEAR(holiday_date)=?`, [m, y]
    );
    const holidayCount = holidays[0].n || 0;

    const rows = await query(`
      SELECT u.user_id, u.full_name, u.designation, d.dept_name,
             COUNT(a.attendance_id)  AS days_recorded,
             SUM(a.status='present') AS days_present,
             SUM(a.status='absent')  AS days_absent,
             SUM(a.status='late')    AS days_late,
             SUM(a.status='half_day') AS days_half,
             SUM(a.status='leave')   AS days_leave,
             COALESCE(SUM(a.total_hours),0) AS total_hours,
             COALESCE(SUM(a.ot_hours),0)    AS total_ot_hours
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.dept_id
      LEFT JOIN attendance a ON a.user_id = u.user_id
        AND MONTH(a.work_date)=? AND YEAR(a.work_date)=?
      WHERE u.status='active' AND u.role_id != 1
      GROUP BY u.user_id ORDER BY u.full_name
    `, [m, y]);

    res.json({ month: m, year: y, holiday_count: holidayCount, summary: rows });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch summary', error: err.message });
  }
};

exports.exportAttendance = async (req, res) => {
  try {
    const { month, year, user_id } = req.query;
    let sql = `SELECT u.full_name, u.email, u.designation, d.dept_name,
                      a.work_date, a.clock_in, a.clock_out,
                      a.total_hours, a.ot_hours, a.status, a.remarks
               FROM attendance a
               JOIN users u ON a.user_id=u.user_id
               LEFT JOIN departments d ON u.department_id=d.dept_id
               WHERE 1=1`;
    const params = [];
    if (user_id) { sql += ` AND a.user_id=?`;           params.push(user_id); }
    if (month)   { sql += ` AND MONTH(a.work_date)=?`;  params.push(month); }
    if (year)    { sql += ` AND YEAR(a.work_date)=?`;   params.push(year); }
    sql += ` ORDER BY a.work_date DESC, u.full_name LIMIT 5000`;

    const rows = await query(sql, params);
    const headers = ['Employee','Email','Designation','Department','Date','Clock In','Clock Out','Total Hours','OT Hours','Status','Remarks'];
    const csv = [
      `# Attendance Export — ${month||'All'}/${year||'All'}`, '',
      headers.join(','),
      ...rows.map(r => [
        r.full_name, r.email, r.designation||'', r.dept_name||'',
        r.work_date, r.clock_in||'', r.clock_out||'',
        r.total_hours||'', r.ot_hours||'', r.status, r.remarks||''
      ].map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(','))
    ].join('\n');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-${month||'all'}-${year||'all'}.csv"`);
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Export failed', error: err.message });
  }
};

/* ══════════════════════════════════════════════════════
   LEAVE MANAGEMENT
══════════════════════════════════════════════════════ */
exports.getAllLeaveRequests = async (req, res) => {
  try {
    const { status, user_id } = req.query;
    let sql = `SELECT lr.*, u.full_name, u.email, d.dept_name, r.full_name AS reviewer_name
               FROM leave_requests lr
               JOIN users u ON lr.user_id=u.user_id
               LEFT JOIN departments d ON u.department_id=d.dept_id
               LEFT JOIN users r ON lr.reviewed_by=r.user_id
               WHERE 1=1`;
    const params = [];
    if (status)  { sql += ` AND lr.status=?`;  params.push(status); }
    if (user_id) { sql += ` AND lr.user_id=?`; params.push(user_id); }
    sql += ` ORDER BY lr.created_at DESC LIMIT 200`;
    res.json(await query(sql, params));
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch leave requests', error: err.message });
  }
};

exports.requestLeave = async (req, res) => {
  try {
    const { leave_type, from_date, to_date, reason } = req.body;
    if (!from_date || !to_date)
      return res.status(400).json({ message: 'from_date and to_date are required' });

    const lt   = leave_type || 'casual';
    const days = lt === 'half_day' ? 0.5
      : Math.max(1, Math.ceil((new Date(to_date) - new Date(from_date)) / 86400000) + 1);

    // Check leave balance (skip for unpaid/other/half_day)
    if (!['unpaid','other','half_day'].includes(lt)) {
      const year = new Date(from_date).getFullYear();
      const balance = await query(
        `SELECT remaining FROM leave_balances WHERE user_id=? AND year=? AND leave_type=?`,
        [req.user.user_id, year, lt]
      );
      if (balance.length && parseFloat(balance[0].remaining) < days)
        return res.status(400).json({
          message: `Insufficient ${lt} leave balance. Available: ${balance[0].remaining} days`
        });
      // Reserve (pending) quota
      await query(
        `UPDATE leave_balances SET pending=pending+? WHERE user_id=? AND year=? AND leave_type=?`,
        [days, req.user.user_id, year, lt]
      );
    }

    const result = await query(
      `INSERT INTO leave_requests (user_id, leave_type, from_date, to_date, days, reason)
       VALUES (?,?,?,?,?,?)`,
      [req.user.user_id, lt, from_date, to_date, days, reason || null]
    );
    res.status(201).json({ message: 'Leave request submitted', leave_id: result.insertId, days });
  } catch (err) {
    res.status(500).json({ message: 'Could not submit leave request', error: err.message });
  }
};

exports.getMyLeaveRequests = async (req, res) => {
  try {
    const rows = await query(`
      SELECT lr.*, r.full_name AS reviewer_name
      FROM leave_requests lr
      LEFT JOIN users r ON lr.reviewed_by=r.user_id
      WHERE lr.user_id=? ORDER BY lr.created_at DESC LIMIT 50`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch leave requests', error: err.message });
  }
};

exports.approveLeave = async (req, res) => {
  try {
    const rows = await query('SELECT * FROM leave_requests WHERE leave_id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Leave request not found' });
    const lr = rows[0];
    if (lr.status !== 'pending')
      return res.status(400).json({ message: `Leave is already ${lr.status}` });

    await query(
      `UPDATE leave_requests SET status='approved', reviewed_by=?, reviewed_at=NOW() WHERE leave_id=?`,
      [req.user.user_id, req.params.id]
    );

    // Mark attendance days as leave
    const cur = new Date(lr.from_date), end = new Date(lr.to_date);
    while (cur <= end) {
      const d = cur.toISOString().slice(0, 10);
      await query(
        `INSERT INTO attendance (user_id, work_date, status) VALUES (?,?,'leave')
         ON DUPLICATE KEY UPDATE status='leave'`, [lr.user_id, d]
      ).catch(() => {});
      cur.setDate(cur.getDate() + 1);
    }

    // Commit taken days, release pending
    const year = new Date(lr.from_date).getFullYear();
    const lt   = lr.leave_type;
    if (!['unpaid','other','half_day'].includes(lt)) {
      await query(
        `UPDATE leave_balances SET taken=taken+?, pending=GREATEST(0,pending-?)
         WHERE user_id=? AND year=? AND leave_type=?`,
        [lr.days, lr.days, lr.user_id, year, lt]
      );
    }

    // In-app notification to employee
    await query(
      `INSERT INTO alerts (user_id, alert_message, alert_type) VALUES (?,?,?)`,
      [lr.user_id,
       `✅ Your ${lt} leave from ${lr.from_date} to ${lr.to_date} has been approved.`,
       'leave_approved']
    ).catch(() => {});

    res.json({ message: 'Leave approved' });
  } catch (err) {
    res.status(500).json({ message: 'Could not approve leave', error: err.message });
  }
};

exports.rejectLeave = async (req, res) => {
  try {
    const rows = await query('SELECT * FROM leave_requests WHERE leave_id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Leave not found' });
    const lr = rows[0];

    const { reject_reason } = req.body;
    await query(
      `UPDATE leave_requests SET status='rejected', reviewed_by=?, reviewed_at=NOW(), reject_reason=? WHERE leave_id=?`,
      [req.user.user_id, reject_reason || null, req.params.id]
    );

    // Release pending quota
    const year = new Date(lr.from_date).getFullYear();
    if (!['unpaid','other','half_day'].includes(lr.leave_type)) {
      await query(
        `UPDATE leave_balances SET pending=GREATEST(0,pending-?) WHERE user_id=? AND year=? AND leave_type=?`,
        [lr.days, lr.user_id, year, lr.leave_type]
      );
    }

    // Notify employee
    await query(
      `INSERT INTO alerts (user_id, alert_message, alert_type) VALUES (?,?,?)`,
      [lr.user_id,
       `❌ Your ${lr.leave_type} leave request was rejected${reject_reason ? ': ' + reject_reason : ''}.`,
       'leave_rejected']
    ).catch(() => {});

    res.json({ message: 'Leave rejected' });
  } catch (err) {
    res.status(500).json({ message: 'Could not reject leave', error: err.message });
  }
};

exports.cancelLeave = async (req, res) => {
  try {
    const rows = await query('SELECT * FROM leave_requests WHERE leave_id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Leave not found' });
    const lr = rows[0];
    if (lr.user_id !== req.user.user_id && req.user.role_id !== 1)
      return res.status(403).json({ message: 'Not authorized' });
    if (lr.status === 'approved')
      return res.status(400).json({ message: 'Cannot cancel an already approved leave' });

    await query(`UPDATE leave_requests SET status='cancelled' WHERE leave_id=?`, [req.params.id]);

    // Release pending if it was pending
    if (lr.status === 'pending' && !['unpaid','other','half_day'].includes(lr.leave_type)) {
      const year = new Date(lr.from_date).getFullYear();
      await query(
        `UPDATE leave_balances SET pending=GREATEST(0,pending-?) WHERE user_id=? AND year=? AND leave_type=?`,
        [lr.days, lr.user_id, year, lr.leave_type]
      );
    }
    res.json({ message: 'Leave request cancelled' });
  } catch (err) {
    res.status(500).json({ message: 'Could not cancel leave', error: err.message });
  }
};

/* ── Leave Balances ───────────────────────────────── */
exports.getLeaveBalances = async (req, res) => {
  try {
    const user_id = req.params.user_id || req.user.user_id;
    const year    = req.query.year || new Date().getFullYear();
    const rows    = await query(
      `SELECT * FROM leave_balances WHERE user_id=? AND year=? ORDER BY leave_type`,
      [user_id, year]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch balances', error: err.message });
  }
};

exports.updateLeaveBalance = async (req, res) => {
  try {
    const { user_id, year, leave_type, entitled, carry_forward } = req.body;
    await query(`
      INSERT INTO leave_balances (user_id, year, leave_type, entitled, carry_forward)
      VALUES (?,?,?,?,?)
      ON DUPLICATE KEY UPDATE entitled=VALUES(entitled), carry_forward=VALUES(carry_forward)
    `, [user_id, year, leave_type, entitled || 0, carry_forward || 0]);
    res.json({ message: 'Leave balance updated' });
  } catch (err) {
    res.status(500).json({ message: 'Could not update balance', error: err.message });
  }
};

/* ══════════════════════════════════════════════════════
   SALARY / PAYROLL
══════════════════════════════════════════════════════ */
exports.getSalaryComponents = async (req, res) => {
  try {
    res.json(await query(`SELECT * FROM salary_components WHERE is_active=1 ORDER BY component_type, name`));
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch components', error: err.message });
  }
};

exports.getSalaryRecords = async (req, res) => {
  try {
    const { user_id, month, year } = req.query;
    let sql = `
      SELECT s.*, u.full_name, u.email, u.designation, d.dept_name
      FROM salary_records s
      JOIN users u ON s.user_id = u.user_id
      LEFT JOIN departments d ON u.department_id = d.dept_id
      WHERE 1=1`;
    const params = [];
    if (user_id) { sql += ` AND s.user_id=?`; params.push(user_id); }
    if (month)   { sql += ` AND s.month=?`;   params.push(month); }
    if (year)    { sql += ` AND s.year=?`;    params.push(year); }
    sql += ` ORDER BY s.year DESC, s.month DESC, u.full_name LIMIT 500`;
    const records = await query(sql, params);

    // Attach line items
    for (const rec of records) {
      rec.line_items = await query(`
        SELECT sli.*, sc.name AS component_name, sc.component_type
        FROM salary_line_items sli
        JOIN salary_components sc ON sli.component_id = sc.component_id
        WHERE sli.salary_id=?`, [rec.salary_id]);
    }
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch salary records', error: err.message });
  }
};

exports.upsertSalaryRecord = async (req, res) => {
  try {
    const { user_id, month, year, base_salary, bonus, deductions, payment_status, paid_on, remarks, line_items } = req.body;
    if (!user_id || !month || !year)
      return res.status(400).json({ message: 'user_id, month, year required' });

    // Auto-calc from line items if provided
    let earnings = 0, deductionTotal = 0;
    if (Array.isArray(line_items) && line_items.length) {
      for (const li of line_items) {
        const comp = await query('SELECT component_type FROM salary_components WHERE component_id=?', [li.component_id]);
        if (comp.length) {
          if (comp[0].component_type === 'earning')   earnings      += parseFloat(li.amount) || 0;
          if (comp[0].component_type === 'deduction') deductionTotal += parseFloat(li.amount) || 0;
        }
      }
    }

    const base = parseFloat(base_salary) || earnings;
    const bon  = parseFloat(bonus) || 0;
    const ded  = parseFloat(deductions) || deductionTotal;
    const net  = base + bon - ded;

    const result = await query(`
      INSERT INTO salary_records
        (user_id, month, year, base_salary, bonus, deductions, net_salary, payment_status, paid_on, remarks, created_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE
        base_salary=VALUES(base_salary), bonus=VALUES(bonus), deductions=VALUES(deductions),
        net_salary=VALUES(net_salary), payment_status=VALUES(payment_status),
        paid_on=VALUES(paid_on), remarks=VALUES(remarks)
    `, [user_id, month, year, base, bon, ded, net,
        payment_status || 'pending', paid_on || null, remarks || null, req.user.user_id]);

    const salary_id = result.insertId || (await query(
      'SELECT salary_id FROM salary_records WHERE user_id=? AND month=? AND year=?',
      [user_id, month, year]
    ))[0]?.salary_id;

    // Insert/replace line items
    if (Array.isArray(line_items) && line_items.length && salary_id) {
      await query('DELETE FROM salary_line_items WHERE salary_id=?', [salary_id]);
      for (const li of line_items) {
        await query('INSERT INTO salary_line_items (salary_id, component_id, amount) VALUES (?,?,?)',
          [salary_id, li.component_id, parseFloat(li.amount) || 0]);
      }
    }

    res.json({ message: 'Salary record saved', net_salary: net, salary_id });
  } catch (err) {
    res.status(500).json({ message: 'Could not save salary record', error: err.message });
  }
};

exports.markSalaryPaid = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { payment_method, transaction_ref } = req.body || {};

    // Add payment_method and transaction_ref columns if they don't exist (safe ALTER)
    try {
      await query(`ALTER TABLE salary_records ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT NULL`);
      await query(`ALTER TABLE salary_records ADD COLUMN IF NOT EXISTS transaction_ref VARCHAR(100) DEFAULT NULL`);
    } catch(_) {}

    await query(
      `UPDATE salary_records SET payment_status='paid', paid_on=?, payment_method=?, transaction_ref=? WHERE salary_id=?`,
      [today, payment_method || null, transaction_ref || null, req.params.id]
    );

    // Notify employee
    const rec = await query(
      `SELECT sr.*, u.user_id FROM salary_records sr JOIN users u ON sr.user_id=u.user_id WHERE sr.salary_id=?`,
      [req.params.id]
    );
    if (rec.length) {
      const methodStr = payment_method ? ` via ${payment_method}` : '';
      await query(
        `INSERT INTO alerts (user_id, alert_message, alert_type) VALUES (?,?,?)`,
        [rec[0].user_id,
         `💰 Your salary for ${rec[0].month}/${rec[0].year} has been credited${methodStr}. Net: ₹${rec[0].net_salary}`,
         'salary_paid']
      ).catch(() => {});
    }

    res.json({ message: 'Salary marked as paid' });
  } catch (err) {
    res.status(500).json({ message: 'Could not update salary', error: err.message });
  }
};

exports.getMySalary = async (req, res) => {
  try {
    const records = await query(`
      SELECT * FROM salary_records WHERE user_id=?
      ORDER BY year DESC, month DESC LIMIT 24
    `, [req.user.user_id]);

    for (const rec of records) {
      rec.line_items = await query(`
        SELECT sli.amount, sc.name AS component_name, sc.component_type
        FROM salary_line_items sli
        JOIN salary_components sc ON sli.component_id = sc.component_id
        WHERE sli.salary_id=?`, [rec.salary_id]);
    }
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch salary', error: err.message });
  }
};

exports.generateMonthlySalary = async (req, res) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) return res.status(400).json({ message: 'month and year required' });

    const employees  = await query(`SELECT user_id, base_salary FROM users WHERE status='active' AND role_id != 1`);
    const components = await query(`SELECT * FROM salary_components WHERE is_active=1`);
    let created = 0;

    for (const emp of employees) {
      const base = parseFloat(emp.base_salary) || 0;

      // Get absent days for this month to auto-deduct
      const absent = await query(
        `SELECT COUNT(*) AS n FROM attendance
         WHERE user_id=? AND MONTH(work_date)=? AND YEAR(work_date)=?
           AND status IN ('absent')`, [emp.user_id, month, year]
      );
      const absentDays   = absent[0].n || 0;
      const workingDays  = 26; // standard working days per month
      const perDayRate   = base / workingDays;
      const leaveDeduction = parseFloat((absentDays * perDayRate).toFixed(2));

      // Standard component calculations
      const hra     = parseFloat((base * 0.40).toFixed(2));
      const travel  = 1600;
      const medical = 1250;
      const special = parseFloat((base * 0.10).toFixed(2));
      const pf      = parseFloat((base * 0.12).toFixed(2));
      const esi     = base <= 21000 ? parseFloat((base * 0.0075).toFixed(2)) : 0;
      const pt      = base > 25000 ? 200 : base > 15000 ? 150 : 80;
      const gross   = base + hra + travel + medical + special;
      const totalDed = pf + esi + pt + leaveDeduction;
      const net     = parseFloat((gross - totalDed).toFixed(2));

      const ins = await query(`
        INSERT IGNORE INTO salary_records
          (user_id, month, year, base_salary, bonus, deductions, net_salary, created_by)
        VALUES (?,?,?,?,?,?,?,?)
      `, [emp.user_id, month, year, gross, 0, totalDed, net, req.user.user_id]);

      if (ins.insertId) {
        // Insert line items
        const compMap = {};
        components.forEach(c => { compMap[c.name] = c.component_id; });
        const items = [
          [compMap['Basic Salary'],     base],
          [compMap['HRA'],              hra],
          [compMap['Travel Allowance'], travel],
          [compMap['Medical Allowance'],medical],
          [compMap['Special Allowance'],special],
          [compMap['Provident Fund'],   pf],
          [compMap['ESI'],              esi],
          [compMap['Professional Tax'], pt],
          [compMap['Leave Deduction'],  leaveDeduction],
        ];
        for (const [cid, amt] of items) {
          if (cid && amt > 0)
            await query('INSERT INTO salary_line_items (salary_id, component_id, amount) VALUES (?,?,?)',
              [ins.insertId, cid, amt]);
        }
        created++;
      }
    }

    res.json({ message: `Generated salary records for ${created} employees`, created });
  } catch (err) {
    res.status(500).json({ message: 'Could not generate salaries', error: err.message });
  }
};

exports.deleteSalaryRecord = async (req, res) => {
  try {
    await query('DELETE FROM salary_line_items WHERE salary_id=?', [req.params.id]);
    const result = await query('DELETE FROM salary_records WHERE salary_id=?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Salary record not found' });
    res.json({ message: 'Salary record deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed', error: err.message });
  }
};

exports.exportSalary = async (req, res) => {
  try {
    const { month, year } = req.query;
    let sql = `SELECT u.full_name, u.email, u.designation, d.dept_name,
                      s.month, s.year, s.base_salary, s.bonus,
                      s.deductions, s.net_salary, s.payment_status, s.paid_on, s.remarks
               FROM salary_records s
               JOIN users u ON s.user_id=u.user_id
               LEFT JOIN departments d ON u.department_id=d.dept_id
               WHERE 1=1`;
    const params = [];
    if (month) { sql += ` AND s.month=?`; params.push(month); }
    if (year)  { sql += ` AND s.year=?`;  params.push(year); }
    sql += ` ORDER BY s.year DESC, s.month DESC, u.full_name`;

    const rows = await query(sql, params);
    const headers = ['Employee','Email','Designation','Department','Month','Year','Gross','Bonus','Deductions','Net Salary','Status','Paid On','Remarks'];
    const csv = [
      `# Payroll Export — ${month||'All'}/${year||'All'}`, '',
      headers.join(','),
      ...rows.map(r => [
        r.full_name, r.email, r.designation||'', r.dept_name||'',
        r.month, r.year, r.base_salary, r.bonus,
        r.deductions, r.net_salary, r.payment_status,
        r.paid_on||'', r.remarks||''
      ].map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(','))
    ].join('\n');
    res.setHeader('Content-Disposition', `attachment; filename="payroll-${month||'all'}-${year||'all'}.csv"`);
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Export failed', error: err.message });
  }
};

/* ── Salary Advance ───────────────────────────────── */
exports.getSalaryAdvances = async (req, res) => {
  try {
    const { user_id, status } = req.query;
    let sql = `SELECT sa.*, u.full_name, a.full_name AS approved_by_name
               FROM salary_advances sa
               JOIN users u ON sa.user_id=u.user_id
               LEFT JOIN users a ON sa.approved_by=a.user_id WHERE 1=1`;
    const params = [];
    if (user_id) { sql += ` AND sa.user_id=?`; params.push(user_id); }
    if (status)  { sql += ` AND sa.status=?`;  params.push(status); }
    sql += ` ORDER BY sa.created_at DESC`;
    res.json(await query(sql, params));
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch advances', error: err.message });
  }
};

exports.requestAdvance = async (req, res) => {
  try {
    const { amount, reason, repay_months } = req.body;
    if (!amount || amount <= 0)
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    const result = await query(
      `INSERT INTO salary_advances (user_id, amount, reason, repay_months) VALUES (?,?,?,?)`,
      [req.user.user_id, amount, reason || null, repay_months || 1]
    );
    res.status(201).json({ message: 'Advance request submitted', advance_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Could not request advance', error: err.message });
  }
};

exports.reviewAdvance = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved','rejected'].includes(status))
      return res.status(400).json({ message: 'status must be approved or rejected' });
    await query(
      `UPDATE salary_advances SET status=?, approved_by=?, approved_at=NOW() WHERE advance_id=?`,
      [status, req.user.user_id, req.params.id]
    );
    res.json({ message: `Advance ${status}` });
  } catch (err) {
    res.status(500).json({ message: 'Could not update advance', error: err.message });
  }
};

/* ── Expense Claims ───────────────────────────────── */
exports.getExpenseClaims = async (req, res) => {
  try {
    const { user_id, status } = req.query;
    let sql = `SELECT ec.*, u.full_name, r.full_name AS reviewed_by_name
               FROM expense_claims ec
               JOIN users u ON ec.user_id=u.user_id
               LEFT JOIN users r ON ec.reviewed_by=r.user_id WHERE 1=1`;
    const params = [];
    if (user_id) { sql += ` AND ec.user_id=?`; params.push(user_id); }
    if (status)  { sql += ` AND ec.status=?`;  params.push(status); }
    sql += ` ORDER BY ec.created_at DESC`;
    res.json(await query(sql, params));
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch claims', error: err.message });
  }
};

exports.submitExpenseClaim = async (req, res) => {
  try {
    const { claim_date, category, amount, description } = req.body;
    if (!claim_date || !amount)
      return res.status(400).json({ message: 'claim_date and amount required' });
    const result = await query(
      `INSERT INTO expense_claims (user_id, claim_date, category, amount, description) VALUES (?,?,?,?,?)`,
      [req.user.user_id, claim_date, category || 'other', amount, description || null]
    );
    res.status(201).json({ message: 'Expense claim submitted', claim_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Could not submit claim', error: err.message });
  }
};

exports.reviewExpenseClaim = async (req, res) => {
  try {
    const { status, paid_on } = req.body;
    if (!['approved','rejected','paid'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });
    await query(
      `UPDATE expense_claims SET status=?, reviewed_by=?, reviewed_at=NOW(), paid_on=? WHERE claim_id=?`,
      [status, req.user.user_id, paid_on || null, req.params.id]
    );
    res.json({ message: `Expense claim ${status}` });
  } catch (err) {
    res.status(500).json({ message: 'Could not update claim', error: err.message });
  }
};

/* ══════════════════════════════════════════════════════
   ALERTS / NOTIFICATIONS
══════════════════════════════════════════════════════ */
exports.getMyAlerts = async (req, res) => {
  try {
    const rows = await query(`
      SELECT a.*, t.title AS task_title
      FROM alerts a LEFT JOIN tasks t ON a.task_id=t.task_id
      WHERE a.user_id=? OR a.user_id IS NULL
      ORDER BY a.created_at DESC LIMIT 50`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch alerts', error: err.message });
  }
};

exports.createAlert = async (req, res) => {
  try {
    const { user_id, task_id, alert_message, alert_type } = req.body;
    if (!alert_message) return res.status(400).json({ message: 'alert_message is required' });
    const result = await query(
      `INSERT INTO alerts (user_id, task_id, alert_message, alert_type) VALUES (?,?,?,?)`,
      [user_id || null, task_id || null, alert_message, alert_type || 'general']
    );
    res.status(201).json({ message: 'Alert created', alert_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Could not create alert', error: err.message });
  }
};

exports.markAlertRead = async (req, res) => {
  try {
    await query(`UPDATE alerts SET is_read=1 WHERE alert_id=?`, [req.params.id]);
    res.json({ message: 'Alert marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Failed', error: err.message });
  }
};

exports.markAllAlertsRead = async (req, res) => {
  try {
    await query(`UPDATE alerts SET is_read=1 WHERE user_id=? OR user_id IS NULL`, [req.user.user_id]);
    res.json({ message: 'All alerts marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Failed', error: err.message });
  }
};

/* ══════════════════════════════════════════════════════
   AUDIT LOG
══════════════════════════════════════════════════════ */
exports.getAuditLogs = async (req, res) => {
  try {
    const { entity_type, actor_id, from_date, to_date, limit } = req.query;
    let sql = `SELECT al.*, u.full_name AS actor_name
               FROM audit_logs al
               LEFT JOIN users u ON al.actor_id=u.user_id WHERE 1=1`;
    const params = [];
    if (entity_type) { sql += ` AND al.entity_type=?`;           params.push(entity_type); }
    if (actor_id)    { sql += ` AND al.actor_id=?`;              params.push(actor_id); }
    if (from_date)   { sql += ` AND DATE(al.created_at)>=?`;     params.push(from_date); }
    if (to_date)     { sql += ` AND DATE(al.created_at)<=?`;     params.push(to_date); }
    sql += ` ORDER BY al.created_at DESC LIMIT ?`;
    params.push(parseInt(limit) || 200);
    res.json(await query(sql, params));
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch audit logs', error: err.message });
  }
};

/* ══════════════════════════════════════════════════════
   LEADERBOARD
══════════════════════════════════════════════════════ */
exports.getLeaderboard = async (req, res) => {
  try {
    const rows = await query(`
      SELECT u.user_id, u.full_name, u.total_points, u.access_level, u.designation, d.dept_name,
             COUNT(DISTINCT ach.achievement_id) AS total_achievements,
             SUM(ach.level='outstanding') AS outstanding_count,
             SUM(ach.level='excellent')   AS excellent_count,
             SUM(ach.level='good')        AS good_count,
             COUNT(t.task_id)             AS total_tasks,
             SUM(t.status='Completed')    AS completed_tasks,
             CASE WHEN COUNT(t.task_id)>0
               THEN ROUND(SUM(t.status='Completed')/COUNT(t.task_id)*100,1) ELSE 0
             END AS completion_rate
      FROM users u
      LEFT JOIN departments d ON u.department_id=d.dept_id
      LEFT JOIN achievements ach ON ach.user_id=u.user_id
      LEFT JOIN tasks t ON t.assigned_to=u.user_id
      WHERE u.role_id=2 AND u.status='active'
      GROUP BY u.user_id
      ORDER BY u.total_points DESC, completion_rate DESC LIMIT 20
    `);
    res.json(rows.map((r, i) => ({ rank: i + 1, ...r })));
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch leaderboard', error: err.message });
  }
};


/* ═══════════════════════════════════════════════
   v7.0 — 4th Semester Additions
═══════════════════════════════════════════════ */

/**
 * GET /api/admin/salary/:id/payslip-pdf
 * Generates and streams a PDF payslip for the given salary record.
 */
exports.downloadPayslipPDF = async (req, res) => {
  try {
    const { id }             = req.params;
    const { user_id, role_id } = req.user;

    // Employees can only download their own payslip
    if (role_id === 2) {
      const [rec] = await query('SELECT user_id FROM salary_records WHERE salary_id = ?', [id]);
      if (!rec || rec.user_id !== user_id)
        return res.status(403).json({ message: 'Access denied' });
    }

    const { generatePayslipPDF } = require('../services/pdfService');
    const { buffer, filename }   = await generatePayslipPDF(id, user_id);

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length':       buffer.length,
      'Cache-Control':        'private, no-cache'
    });
    res.send(buffer);
  } catch (err) {
    console.error('[PDF]', err.message);
    // If puppeteer not installed, return graceful error
    if (err.message.includes('puppeteer') || err.message.includes('Cannot find module')) {
      return res.status(503).json({
        message: 'PDF service unavailable',
        hint:    'Run: npm install puppeteer',
        error:   err.message
      });
    }
    res.status(500).json({ message: 'PDF generation failed', error: err.message });
  }
};

/**
 * POST /api/admin/broadcast
 * Send a push notification to all employees (or one department).
 * Body: { message: string, dept_id?: number }
 */
exports.broadcastNotification = async (req, res) => {
  try {
    const { message, dept_id } = req.body;
    if (!message || !message.trim())
      return res.status(400).json({ message: 'message is required' });

    // Try Socket.io broadcast if available
    const io = req.app.get('io');
    if (io) {
      // Persist alert to DB for each active user
      const sql = dept_id
        ? 'SELECT user_id FROM users WHERE status="active" AND department_id = ?'
        : 'SELECT user_id FROM users WHERE status="active"';
      const users = await query(sql, dept_id ? [dept_id] : []);

      for (const { user_id } of users) {
        await query(
          'INSERT INTO alerts (user_id, type, title, message) VALUES (?,?,?,?)',
          [user_id, 'admin_broadcast', '📢 Announcement', message.trim()]
        ).catch(() => {});
        io.to(`user:${user_id}`).emit('wip:admin_broadcast', {
          type:       'admin_broadcast',
          title:      '📢 Announcement',
          message:    message.trim(),
          created_at: new Date().toISOString()
        });
      }
      res.json({ message: 'Broadcast sent via Socket.io', recipients: users.length });
    } else {
      // Fallback: save to alerts table only
      const users = await query('SELECT user_id FROM users WHERE status="active"');
      for (const { user_id } of users) {
        await query(
          'INSERT INTO alerts (user_id, type, title, message) VALUES (?,?,?,?)',
          [user_id, 'admin_broadcast', '📢 Announcement', message.trim()]
        ).catch(() => {});
      }
      res.json({ message: 'Broadcast saved (Socket.io not running)', recipients: users.length });
    }
  } catch (err) {
    res.status(500).json({ message: 'Broadcast failed', error: err.message });
  }
};

/**
 * GET /api/admin/attendance/export
 * Alias for exportAttendance — CSV export for v7 route.
 */
exports.exportAttendanceCSV = exports.exportAttendance;


// Alias for backward-compatibility and v7 tests
exports.generateSalary = exports.generateMonthlySalary;
