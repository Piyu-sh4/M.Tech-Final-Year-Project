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
const cashAdvances = require('../services/cashAdvances');
const { withCreditDeadline } = require('../services/payrollSchedule');

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
      WHERE (?<>3 OR u.reporting_manager_id=? OR u.user_id=?)
      ORDER BY u.created_at DESC
    `,[req.user.role_id,req.user.user_id,req.user.user_id]);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch users', error: err.message });
  }
};

exports.getPendingUsers = async (req, res) => {
  try {
    const users = await query(`
      SELECT u.user_id, u.full_name, u.email, u.phone, u.role_id, u.status, u.created_at,
             r.role_name, d.dept_name,u.company_id,companies.name company_name,
             u.designation, u.reg_grade_level, u.office_location,
             u.employment_type, u.work_mode, u.reporting_manager_id,
             u.emergency_contact_name, u.emergency_contact_phone,
             m.full_name AS manager_name
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN departments d ON d.dept_id = u.department_id
      LEFT JOIN companies ON companies.company_id=u.company_id
      LEFT JOIN users m ON m.user_id = u.reporting_manager_id
      WHERE u.status = 'pending'
      ORDER BY u.created_at DESC
    `);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch pending users', error: err.message });
  }
};

exports.approveUser = async (req, res) => {
  try {
    const uid = parseInt(req.params.id);
    const [candidate]=await query('SELECT role_id,status FROM users WHERE user_id=?',[uid]);
    if(!candidate)return res.status(404).json({message:'User not found'});
    if(candidate.role_id!==2 && req.user.role_id!==1)return res.status(403).json({message:'Only an administrator can approve a staff role.'});
    if(candidate.status!=='pending')return res.status(409).json({message:'This registration has already been reviewed.'});
    await query(
      `UPDATE users SET status='active', account_approved_by=?, account_approved_at=NOW() WHERE user_id=?`,
      [req.user.user_id, uid]
    );
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
    // Auto-create grade entry if reg_grade_level was provided
    const [usr] = await query(
      `SELECT reg_grade_level, designation, department_id FROM users WHERE user_id=?`, [uid]
    ).catch(() => [null]);
    if (usr && usr.reg_grade_level) {
      const deptName = usr.department_id
        ? (await query(`SELECT dept_name FROM departments WHERE dept_id=?`, [usr.department_id]).catch(()=>[{dept_name:null}]))[0]?.dept_name
        : null;
      await query(
        `INSERT IGNORE INTO employee_grades (user_id, grade_level, designation, department, effective_date, assigned_by)
         VALUES (?,?,?,?,CURDATE(),?)`,
        [uid, usr.reg_grade_level, usr.designation || null, deptName || null, req.user.user_id]
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
    await require('../services/database').transaction(async run => {
      const [user] = await run('SELECT user_id FROM users WHERE user_id=? FOR UPDATE',[id]);
      if (!user) throw Object.assign(new Error('User not found'),{status:404});
      const settled = await run("SELECT salary_id FROM salary_records WHERE user_id=? AND payment_status='paid' LIMIT 1",[id]);
      if (settled.length) throw Object.assign(new Error('Suspend accounts with paid salary history.'),{status:409});
      for (const table of ['user_permissions','leave_balances','salary_advances','salary_revisions','expense_claims','attendance','salary_records']) {
        await run('DELETE FROM ?? WHERE user_id=?',[table,id]);
      }
      await run('DELETE FROM users WHERE user_id=?',[id]);
    });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({message:'This account owns linked records. Reassign them or suspend the account instead.'});
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Could not delete user' });
  }
};

exports.updateUser = async (req,res,next) => {
  try {
    await require('../services/database').transaction(async run => {
      const [current] = await run('SELECT * FROM users WHERE user_id=? FOR UPDATE',[req.params.id]);
      if (!current) throw Object.assign(new Error('User not found'),{status:404});
      const value = {...current,...req.body};
      const role = Number(value.role_id);
      const salary = Number(value.base_salary || 0);
      if (req.user.role_id !== 1 && (current.role_id === 1 || role !== current.role_id)) throw Object.assign(new Error('Administrator access required to edit administrators or change account roles.'),{status:403});
      if (typeof value.full_name !== 'string' || !value.full_name.trim() || value.full_name.length>100 ||
          typeof value.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) || value.email.length>120 ||
          ![1,2,3,4].includes(role) || !Number.isFinite(salary) || salary<0 || salary>100000000) throw Object.assign(new Error('Enter a valid name, email, role and nonnegative salary.'),{status:400});
      await run(`UPDATE users SET full_name=?,email=?,role_id=?,department_id=?,base_salary=?,phone=?,profile_notes=?,
        designation=?,join_date=?,employment_type=?,gender=?,shift_id=?,reporting_manager_id=? WHERE user_id=?`,
        [value.full_name.trim(),value.email.trim().toLowerCase(),role,value.department_id || null,salary,value.phone || null,
         value.profile_notes || null,value.designation || null,value.join_date || null,value.employment_type || 'full_time',
         value.gender || null,value.shift_id || null,value.reporting_manager_id || null,req.params.id]);
      if (Number(current.base_salary) !== salary) await run(`INSERT INTO salary_revisions
        (user_id,old_salary,new_salary,effective_date,reason,revised_by) VALUES (?,?,?,CURRENT_DATE,'Admin update',?)`,
        [req.params.id,Number(current.base_salary),salary,req.user.user_id]);
    });
    res.json({message:'User updated successfully'});
  } catch (error) { next(error); }
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
    if(req.user.role_id===3){const [owner]=await query('SELECT user_id FROM users WHERE user_id=? AND (user_id=? OR reporting_manager_id=?)',[req.params.id,req.user.user_id,req.user.user_id]);if(!owner)return res.status(404).json({message:'User not found'});}
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
    if (typeof name !== 'string' || !name.trim() || name.length>150 || !require('../services/validation').isISODate(holiday_date) ||
        (holiday_type && !['public','company','optional'].includes(holiday_type)))
      return res.status(400).json({ message: 'Enter a holiday name, valid date, and listed holiday type.' });
    const result = await query(
      `INSERT INTO holiday_calendar (name, holiday_date, holiday_type, description, created_by)
       VALUES (?,?,?,?,?)`,
      [name, holiday_date, holiday_type || 'public', description || null, req.user.user_id]
    );
    res.status(201).json({ message: 'Holiday created', holiday_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({message:'A holiday already exists on this date. Choose another date or review the existing holiday.'});
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
    if (req.user.role_id === 3) { sql += ' AND (u.user_id=? OR u.reporting_manager_id=?)'; params.push(req.user.user_id, req.user.user_id); }
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
    const { isISODate } = require('../services/validation');
    const validTime = (value) => !value || (typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value));
    if (!/^[1-9]\d*$/.test(String(user_id)) || !isISODate(work_date) ||
        !['present','absent','half_day','late','leave'].includes(status || 'present') ||
        !validTime(clock_in) || !validTime(clock_out) || (clock_out && (!clock_in || clock_out < clock_in)))
      return res.status(400).json({ message: 'Enter a valid employee, date, attendance status and clock times.' });

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

/** Serialize punches per employee. Attendance and its security audit commit together. */
exports.clockIn=async(request,response,next)=>{
 try{const result=await require('../services/database').transaction(async run=>{
 const userId=request.user.user_id;await run('SELECT user_id FROM users WHERE user_id=? FOR UPDATE',[userId]);
 const date=new Date().toISOString().slice(0,10),timestamp=new Date().toISOString().slice(0,19).replace('T',' ');
 const [existing]=await run('SELECT attendance_id,clock_in FROM attendance WHERE user_id=? AND work_date=? FOR UPDATE',[userId,date]);
 if(existing?.clock_in)throw Object.assign(new Error('Already clocked in today'),{status:400});
 const [shift]=await run('SELECT shifts.start_time,shifts.grace_minutes FROM users LEFT JOIN shifts ON shifts.shift_id=users.shift_id WHERE users.user_id=?',[userId]);
 let status='present';if(shift?.start_time){const [hours,minutes]=shift.start_time.split(':').map(Number);const start=new Date();start.setUTCHours(hours,minutes+(shift.grace_minutes || 0),0,0);if(new Date()>start)status='late';}
 await run("INSERT INTO attendance(user_id,work_date,clock_in,status) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE clock_in=VALUES(clock_in),status=VALUES(status)",[userId,date,timestamp,status]);
 const [attendance]=await run('SELECT attendance_id FROM attendance WHERE user_id=? AND work_date=?',[userId,date]);await attendanceAudit(run,request,attendance.attendance_id,'clock_in');
 return {message:'Clocked in at '+timestamp.slice(11,16),status};});response.json(result);
 }catch(error){next(error);}
};
exports.clockOut=async(request,response,next)=>{
 try{const result=await require('../services/database').transaction(async run=>{
 const userId=request.user.user_id;await run('SELECT user_id FROM users WHERE user_id=? FOR UPDATE',[userId]);
 const date=new Date().toISOString().slice(0,10),now=new Date();
 const [attendance]=await run('SELECT * FROM attendance WHERE user_id=? AND work_date=? FOR UPDATE',[userId,date]);
 if(!attendance?.clock_in)throw Object.assign(new Error('You have not clocked in today'),{status:400});
 if(attendance.clock_out)throw Object.assign(new Error('Already clocked out today'),{status:400});
 const totalHours=Math.max(0,Math.round((now-new Date(attendance.clock_in))/36000)/100),overtime=Math.max(0,Math.round((totalHours-8)*100)/100);
 const timestamp=now.toISOString().slice(0,19).replace('T',' ');await run('UPDATE attendance SET clock_out=?,total_hours=?,ot_hours=? WHERE attendance_id=?',[timestamp,totalHours,overtime,attendance.attendance_id]);await attendanceAudit(run,request,attendance.attendance_id,'clock_out');
 return {message:'Clocked out at '+timestamp.slice(11,16),total_hours:totalHours,ot_hours:overtime};});response.json(result);
 }catch(error){next(error);}
};
async function attendanceAudit(run,request,attendanceId,action){await run('INSERT INTO attendance_security_audit(attendance_id,actor_id,action,verification_method,ip_address) VALUES (?,?,?,?,?)',[attendanceId,request.user.user_id,action,request.body?.verification_method==='passkey'?'passkey':'self',require('../services/requestIdentity').clientIp(request)]);}

exports.getMyAttendance = async (req, res) => {
  try {
    const rows = await query(`
      SELECT * FROM attendance WHERE user_id=?
      ORDER BY work_date DESC LIMIT 60
    `, [req.user.user_id]);
    res.json(rows.map(row => ({...row,full_name:req.user.full_name})));
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
        ${req.user.role_id === 3 ? 'AND (u.user_id=? OR u.reporting_manager_id=?)' : ''}
      GROUP BY u.user_id ORDER BY u.full_name
    `, req.user.role_id === 3 ? [m, y, req.user.user_id, req.user.user_id] : [m, y]);

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
    if (req.user.role_id === 3) { sql += ' AND (u.user_id=? OR u.reporting_manager_id=?)'; params.push(req.user.user_id, req.user.user_id); }
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
    if(req.user.role_id===3){sql+=' AND (u.reporting_manager_id=? OR u.user_id=?)';params.push(req.user.user_id,req.user.user_id);}
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

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (![from_date,to_date].every(value => datePattern.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().startsWith(value)) || to_date < from_date)
      return res.status(400).json({message:'Choose a valid leave date range.'});
    const result = await require('../services/database').transaction(async run => {
      // Check leave balance (skip for unpaid/other/half_day)
      if (!['unpaid','other','half_day'].includes(lt)) {
        const year = Number(from_date.slice(0,4));
        const balance = await run(
          `SELECT remaining - pending AS remaining FROM leave_balances WHERE user_id=? AND year=? AND leave_type=? FOR UPDATE`,
          [req.user.user_id, year, lt]
        );
        if (balance.length && parseFloat(balance[0].remaining) < days)
          throw Object.assign(new Error( `Insufficient ${lt} leave balance. Available: ${balance[0].remaining} days`), {status:400});
        // Reserve (pending) quota
        await run(
          `UPDATE leave_balances SET pending=pending+? WHERE user_id=? AND year=? AND leave_type=?`,
          [days, req.user.user_id, year, lt]
        );
      }

      return run(
        `INSERT INTO leave_requests (user_id, leave_type, from_date, to_date, days, reason)
         VALUES (?,?,?,?,?,?)`,
        [req.user.user_id, lt, from_date, to_date, days, reason || null]
      );
    });
    res.status(201).json({ message: 'Leave request submitted', leave_id: result.insertId, days });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Could not submit leave request' });
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
    res.json(rows.map(row => ({...row,full_name:req.user.full_name})));
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch leave requests', error: err.message });
  }
};

function decideLeave(decision) {
  return async (request, response, next) => {
    try {
      await require('../services/leaveDecisions').decide(request.params.id, request.user, decision, request.body?.reject_reason);
      response.json({message: 'Leave ' + decision});
    } catch (error) { next(error); }
  };
}
exports.approveLeave = decideLeave('approved');
exports.rejectLeave = decideLeave('rejected');
exports.cancelLeave = decideLeave('cancelled');

/* ── Leave Balances ───────────────────────────────── */
exports.getLeaveBalances = async (req, res) => {
  try {
    const user_id = req.params.user_id || req.user.user_id;
    if (req.user.role_id === 3 && Number(user_id) !== req.user.user_id) {
      const team = await query('SELECT user_id FROM users WHERE user_id=? AND reporting_manager_id=?',[user_id,req.user.user_id]);
      if (!team.length) return res.status(403).json({message:'Choose someone in your team.'});
    }
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
    const { user_id, month, year, status } = req.query;
    let sql = `
      SELECT s.*, u.full_name, u.email, u.designation, d.dept_name
      FROM salary_records s
      JOIN users u ON s.user_id = u.user_id
      LEFT JOIN departments d ON u.department_id = d.dept_id
      WHERE 1=1`;
    const params = [];
    if(req.user.role_id===3){sql+=' AND (u.reporting_manager_id=? OR u.user_id=?)';params.push(req.user.user_id,req.user.user_id);}
    if (user_id) { sql += ` AND s.user_id=?`; params.push(user_id); }
    if (month)   { sql += ` AND s.month=?`;   params.push(month); }
    if (year)    { sql += ` AND s.year=?`;    params.push(year); }
    if (status && ['pending','paid'].includes(status)) { sql += ' AND s.payment_status=?'; params.push(status); }
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
    res.json(records.map(withCreditDeadline));
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch salary records', error: err.message });
  }
};

exports.upsertSalaryRecord = async (req, res) => {
  try {
    const { user_id, month, year, base_salary, bonus, deductions, payment_status, paid_on, remarks, line_items } = req.body;
    if (!user_id || !month || !year)
      return res.status(400).json({ message: 'user_id, month, year required' });
    if (Number(user_id) === req.user.user_id)
      return res.status(403).json({ message: 'Ask another payroll reviewer to update your salary record.' });

    const {net,salary_id} = await require('../services/database').transaction(async run => {
      await cashAdvances.lockEmployee(run, user_id);
      const [previous] = await run('SELECT * FROM salary_records WHERE user_id=? AND month=? AND year=? FOR UPDATE',[user_id,month,year]);
      if (previous) {
        const issued = await run('SELECT download_id FROM payslip_downloads WHERE salary_id=? LIMIT 1',[previous.salary_id]);
        if (previous.payment_status === 'paid' || issued.length) {
          const reason = req.body.correction_reason?.trim();
          if (!reason || reason.length > 500) throw Object.assign(new Error('Enter a correction reason (up to 500 characters) for an issued payslip.'),{status:409});
          const items = await run('SELECT * FROM salary_line_items WHERE salary_id=?',[previous.salary_id]);
          await run('INSERT INTO payslip_corrections(salary_id,actor_id,reason,previous_record,previous_items) VALUES (?,?,?,?,?)',
            [previous.salary_id,req.user.user_id,reason,JSON.stringify(previous),JSON.stringify(items)]);
        }
      }
      // Payroll owns the cash advance item. A manual line cannot override it.
      const [recoveryComponent] = await run('SELECT component_id FROM salary_components WHERE name=?', [cashAdvances.recoveryComponent]);
      const manualItems = Array.isArray(line_items) ? line_items.filter(item => Number(item.component_id) !== recoveryComponent.component_id) : [];
      let earnings = 0, deductionTotal = 0;
      if (manualItems.length) {
        for (const li of manualItems) {
          const comp = await run('SELECT component_type FROM salary_components WHERE component_id=?', [li.component_id]);
          if (comp.length) {
            if (comp[0].component_type === 'earning')   earnings      += parseFloat(li.amount) || 0;
            if (comp[0].component_type === 'deduction') deductionTotal += parseFloat(li.amount) || 0;
          }
        }
      }

      const base = parseFloat(base_salary) || earnings;
      const bon  = parseFloat(bonus) || 0;
      const ordinaryDeductions = parseFloat(deductions) || deductionTotal;
      const alreadyPaid = previous?.payment_status === 'paid';
      const { approved } = await cashAdvances.commitments(run, user_id, cashAdvances.periodOf(year, month));
      const recovery = alreadyPaid ? cashAdvances.cents(previous.cash_advance_deduction) : approved;
      const ded = cashAdvances.money(cashAdvances.cents(ordinaryDeductions) + recovery);
      const net = cashAdvances.money(cashAdvances.cents(base) + cashAdvances.cents(bon) - cashAdvances.cents(ded));
      if (recovery > 0 && net < 0)
        throw Object.assign(new Error('Approved cash advances exceed this payout.'), { status: 409 });
      const status = alreadyPaid ? 'paid' : payment_status || 'pending';
      if (!alreadyPaid && status === 'paid')
        await cashAdvances.checkPayoutOrder(run, user_id, cashAdvances.periodOf(year, month));

      const result = await run(`
        INSERT INTO salary_records
          (user_id, month, year, base_salary, bonus, deductions, net_salary, payment_status, paid_on, remarks, created_by, cash_advance_deduction)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE
          base_salary=VALUES(base_salary), bonus=VALUES(bonus), deductions=VALUES(deductions),
          net_salary=VALUES(net_salary), payment_status=VALUES(payment_status),
          cash_advance_deduction=VALUES(cash_advance_deduction),
          paid_on=VALUES(paid_on), remarks=VALUES(remarks)
      `, [user_id, month, year, base, bon, ded, net,
          status, previous?.paid_on || paid_on || null, remarks || null, req.user.user_id, cashAdvances.money(recovery)]);

      const salary_id = result.insertId || (await run(
        'SELECT salary_id FROM salary_records WHERE user_id=? AND month=? AND year=?',
        [user_id, month, year]
      ))[0]?.salary_id;

      // Insert/replace line items
      if (manualItems.length && salary_id) {
        await run('DELETE FROM salary_line_items WHERE salary_id=?', [salary_id]);
        for (const li of manualItems) {
          await run('INSERT INTO salary_line_items (salary_id, component_id, amount) VALUES (?,?,?)',
            [salary_id, li.component_id, parseFloat(li.amount) || 0]);
        }
      }

      if (recovery || Number(previous?.cash_advance_deduction))
        await cashAdvances.writeRecoveryItem(run, salary_id, recovery);
      if (!alreadyPaid && status === 'paid' && recovery)
        await cashAdvances.recoverApproved(run, { user_id, year, month });

      return {net,salary_id};
    });
    res.json({ message: 'Salary record saved', net_salary: net, salary_id });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Could not save salary record' });
  }
};

exports.markSalaryPaid = async (request, response, next) => {
  try {
    const salaryId = request.params.id;
    const { payment_method, transaction_ref, paid_on } = request.body || {};
    if ((paid_on != null && !require('../services/validation').isISODate(paid_on)) ||
        (payment_method != null && (typeof payment_method !== 'string' || payment_method.length > 30)) ||
        (transaction_ref != null && (typeof transaction_ref !== 'string' || transaction_ref.length > 100)))
      return response.status(400).json({ message: 'Enter a valid credit date, payment method and reference.' });
    const paid = await require('../services/database').transaction(async run => {
      const [reference] = await run('SELECT user_id FROM salary_records WHERE salary_id=?', [salaryId]);
      if (!reference) throw Object.assign(new Error('Salary record not found.'), { status: 404 });
      if (reference.user_id === request.user.user_id)
        throw Object.assign(new Error('Ask another payroll reviewer to record your payment.'), { status: 403 });
      await cashAdvances.lockEmployee(run, reference.user_id);
      const [salary] = await run('SELECT * FROM salary_records WHERE salary_id=? FOR UPDATE', [salaryId]);
      if (!salary) throw Object.assign(new Error('Salary record not found.'), { status: 404 });
      if (salary.payment_status === 'paid') return { net: salary.net_salary, updated: false };
      const [today] = await run("SELECT DATE_FORMAT(CURRENT_DATE, '%Y-%m-%d') AS date");
      if (paid_on && paid_on > today.date)
        throw Object.assign(new Error('The recorded credit date cannot be in the future.'), { status: 400 });
      await cashAdvances.checkPayoutOrder(run, salary.user_id, cashAdvances.periodOf(salary.year, salary.month));
      await cashAdvances.reconcileDraft(run, salary, request.user.user_id);
      await run(`UPDATE salary_records SET payment_status='paid', paid_on=?,
        payment_method=?, transaction_ref=? WHERE salary_id=?`, [paid_on || today.date, payment_method || null, transaction_ref || null, salaryId]);
      await cashAdvances.recoverApproved(run, salary);
      const [record] = await run('SELECT net_salary FROM salary_records WHERE salary_id=?', [salaryId]);
      return { net: record.net_salary, salary, updated: true };
    });
    if (paid.updated) {
      const { salary } = paid;
      await query(
        'INSERT INTO alerts (user_id, alert_message, alert_type) VALUES (?,?,?)',
        [salary.user_id, `Salary for ${salary.month}/${salary.year} marked as paid. Net: ₹${paid.net}`, 'salary_paid']
      ).catch(() => {});
    }
    response.json({ message: 'Salary marked as paid in payroll records', net_salary: paid.net });
  } catch (error) { next(error); }
};

exports.getMySalary = async (req, res) => {
  try {
    const records = await query(`
      SELECT salary_records.*, users.full_name FROM salary_records JOIN users USING(user_id) WHERE user_id=?
      ORDER BY year DESC, month DESC LIMIT 24
    `, [req.user.user_id]);

    for (const rec of records) {
      rec.line_items = await query(`
        SELECT sli.amount, sc.name AS component_name, sc.component_type
        FROM salary_line_items sli
        JOIN salary_components sc ON sli.component_id = sc.component_id
        WHERE sli.salary_id=?`, [rec.salary_id]);
    }
    res.json(records.map(withCreditDeadline));
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch salary', error: err.message });
  }
};

exports.generateMonthlySalary = async (request, response, next) => {
  const month = Number(request.body.month);
  const year = Number(request.body.year);
  if (!Number.isInteger(month) || month < 1 || month > 12 ||
      !Number.isInteger(year) || year < 1900 || year > 9999)
    return response.status(400).json({ message: 'Choose a valid payroll month and year.' });

  try {
    const employees = await query("SELECT user_id,full_name FROM users WHERE status='active' AND role_id != 1");
    const components = await query('SELECT name,component_id FROM salary_components WHERE is_active=1');
    const componentIds = new Map(components.map(component => [component.name, component.component_id]));
    let created = 0;
    let updated = 0;
    const blocked = [];

    for (const employee of employees) {
      try {
        const result = await require('../services/database').transaction(async run => {
          const person = await cashAdvances.lockEmployee(run, employee.user_id);
          if (person.status !== 'active' || person.role_id === 1) return null;
          const [salary] = await run('SELECT * FROM salary_records WHERE user_id=? AND month=? AND year=? FOR UPDATE',
            [person.user_id, month, year]);
          if (salary) {
            if (salary.payment_status === 'paid') return null;
            return await cashAdvances.reconcileDraft(run, salary, request.user.user_id) ? 'updated' : null;
          }

          const payroll = await cashAdvances.calculatePayroll(run, person, year, month);
          const { approved } = await cashAdvances.commitments(run, person.user_id, cashAdvances.periodOf(year, month));
          if (approved > 0 && approved > payroll.net)
            throw Object.assign(new Error('Approved cash advances exceed this payout.'), { status: 409 });

          const { money } = cashAdvances;
          const record = await run(`INSERT INTO salary_records
            (user_id,month,year,base_salary,bonus,deductions,net_salary,created_by,cash_advance_deduction)
            VALUES (?,?,?,?,0,?,?,?,?)`,
          [person.user_id, month, year, money(payroll.gross), money(payroll.deductions + approved),
            money(payroll.net - approved), request.user.user_id, money(approved)]);
          const items = payroll.items
            .filter(([name, amount]) => componentIds.has(name) && amount > 0)
            .map(([name, amount]) => [record.insertId, componentIds.get(name), money(amount)]);
          if (items.length) await run('INSERT INTO salary_line_items (salary_id,component_id,amount) VALUES ?', [items]);
          if (approved) await cashAdvances.writeRecoveryItem(run, record.insertId, approved);
          return 'created';
        });
        if (result === 'created') created++;
        if (result === 'updated') updated++;
      } catch (error) {
        if (error.status !== 409) throw error;
        blocked.push({ user_id: employee.user_id, full_name: employee.full_name, reason: error.message });
      }
    }

    let message = `Generated ${created} salary records and updated ${updated} with cash advance recovery.`;
    if (blocked.length) message += ` Review the payout for ${blocked.map(employee => employee.full_name).join(', ')} before paying.`;
    response.json({ message, created, updated, blocked });
  } catch (error) { next(error); }
};

exports.deleteSalaryRecord = async (request, response, next) => {
  try {
    await require('../services/database').transaction(async run => {
      const [reference] = await run('SELECT user_id FROM salary_records WHERE salary_id=?', [request.params.id]);
      if (!reference) throw Object.assign(new Error('Salary record not found'), { status: 404 });
      await cashAdvances.lockEmployee(run, reference.user_id);
      const [salary] = await run('SELECT payment_status FROM salary_records WHERE salary_id=? FOR UPDATE',[request.params.id]);
      if (!salary) throw Object.assign(new Error('Salary record not found'),{status:404});
      const downloads = await run('SELECT download_id FROM payslip_downloads WHERE salary_id=? LIMIT 1',[request.params.id]);
      if (salary.payment_status !== 'pending' || downloads.length) throw Object.assign(new Error('Paid or issued payslips must be retained.'),{status:409});
      await run('DELETE FROM salary_records WHERE salary_id=?',[request.params.id]); // Line items cascade with the parent.
    });
    response.json({message:'Draft salary record deleted'});
  } catch (error) { next(error); }
};

exports.exportSalary = async (req, res) => {
  try {
    const { month, year, status } = req.query;
    let sql = `SELECT u.full_name, u.email, u.designation, d.dept_name,
                      s.month, s.year, s.base_salary, s.bonus,
                      s.deductions, s.net_salary, s.payment_status, s.paid_on, s.remarks
               FROM salary_records s
               JOIN users u ON s.user_id=u.user_id
               LEFT JOIN departments d ON u.department_id=d.dept_id
               WHERE 1=1`;
    const params = [];
    if(req.user.role_id===3){sql+=' AND (u.reporting_manager_id=? OR u.user_id=?)';params.push(req.user.user_id,req.user.user_id);}
    if (month) { sql += ` AND s.month=?`; params.push(month); }
    if (year)  { sql += ` AND s.year=?`;  params.push(year); }
    if (status && ['pending','paid'].includes(status)) { sql += ' AND s.payment_status=?'; params.push(status); }
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
    if (req.user.role_id === 3) { sql += ' AND (u.user_id=? OR u.reporting_manager_id=?)'; params.push(req.user.user_id, req.user.user_id); }
    if (user_id) { sql += ` AND sa.user_id=?`; params.push(user_id); }
    if (status)  { sql += ` AND sa.status=?`;  params.push(status); }
    sql += ` ORDER BY sa.created_at DESC`;
    res.json(await query(sql, params));
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch advances', error: err.message });
  }
};

exports.getAdvanceQuote = async (request, response, next) => {
  try {
    response.json(await cashAdvances.getQuote(request.user.user_id));
  } catch (error) { next(error); }
};

exports.requestAdvance = async (request, response, next) => {
  try {
    const { percentage, reason, expected_payout } = request.body;
    const advance = await cashAdvances.requestAdvance(request.user.user_id, percentage, reason, expected_payout);
    response.status(201).json({ message: 'Advance request submitted', ...advance });
  } catch (error) { next(error); }
};

exports.reviewAdvance = async (request, response, next) => {
  try {
    const { status } = request.body;
    await cashAdvances.reviewAdvance(request.params.id, request.user.user_id, status);
    response.json({ message: `Advance ${status}` });
  } catch (error) { next(error); }
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
    if (req.user.role_id === 3) { sql += ' AND (u.user_id=? OR u.reporting_manager_id=?)'; params.push(req.user.user_id, req.user.user_id); }
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

exports.reviewExpenseClaim = require('../services/expenseReview').review;

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
    const result = await query('UPDATE alerts SET is_read=1 WHERE alert_id=? AND user_id=?',
      [req.params.id, req.user.user_id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Alert not found.' });
    res.json({ message: 'Alert marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Failed', error: err.message });
  }
};

exports.markAllAlertsRead = async (req, res) => {
  try {
    await query(`UPDATE alerts SET is_read=1 WHERE user_id=?`, [req.user.user_id]);
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

    // Staff download scope is explicit: employees own records, managers their
    // direct reports, HR and administrators all records. IP is audit-only.
    const {buffer,filename} = await require('../services/database').transaction(async run => {
    const [record]=await run(`SELECT salary.user_id,employee.reporting_manager_id FROM salary_records salary JOIN users employee ON employee.user_id=salary.user_id WHERE salary.salary_id=? FOR UPDATE`,[id]);
    if(!record)throw Object.assign(new Error('Payslip not found.'),{status:404});
    if(record.user_id!==user_id && ![1,4].includes(role_id) && !(role_id===3 && record.reporting_manager_id===user_id))throw Object.assign(new Error('Access denied'),{status:403});
    const { generatePayslipPDF } = require('../services/pdfService');
    const { buffer, filename }   = await generatePayslipPDF(id,run);
    await run('INSERT INTO payslip_downloads(salary_id,actor_id,ip_address) VALUES (?,?,?)',[id,user_id,require('../services/requestIdentity').clientIp(req)]);

      return {buffer,filename};
    });
    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length':       buffer.length,
      'Cache-Control':        'private, no-cache'
    });
    res.send(buffer);
  } catch (err) {
    if (err.status) return res.status(err.status).json({message:err.message});
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


// Alias for backward-compatibility andtests
exports.generateSalary = exports.generateMonthlySalary;
