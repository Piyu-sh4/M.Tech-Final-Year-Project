/**
 * adminRoutes.js — v6.0 Complete Admin & Shared Routes
 * Role 1=Admin  2=Employee  3=Manager  4=HR
 */
const router  = require('express').Router();
const admin   = require('../controllers/adminController');
const protect = require('../middleware/authMiddleware');
const { adminOnly, managerOrAbove, hrOrAbove, staffOrAbove } = require('../middleware/authMiddleware');
const audit   = require('../middleware/auditMiddleware');

/* ── Dashboard Stats ───────────────────────────────── */
router.get('/dashboard/stats',               protect, staffOrAbove, admin.getDashboardStats);

/* ── User Management ───────────────────────────────── */
router.get('/users',                         protect, staffOrAbove, admin.getAllUsers);
router.get('/users/pending',                 protect, hrOrAbove, admin.getPendingUsers);
router.patch('/users/:id/approve',           protect, hrOrAbove, audit('APPROVE_USER','users'), admin.approveUser);
router.patch('/users/:id/reject',            protect, hrOrAbove, audit('REJECT_USER','users'),  admin.rejectUser);
router.patch('/users/:id/suspend',           protect, adminOnly,    audit('SUSPEND_USER','users'), admin.suspendUser);
router.delete('/users/:id',                  protect, adminOnly,    audit('DELETE_USER','users'),  admin.deleteUser);
router.patch('/users/:id',                   protect, hrOrAbove, audit('UPDATE_USER','users'),  admin.updateUser);
router.patch('/users/:id/reset-password',    protect, adminOnly,    audit('RESET_PASSWORD','users'), admin.resetPassword);
router.post('/users/:id/reset-link', protect, adminOnly, audit('ISSUE_PASSWORD_RESET_LINK','users'), async (request, response, next) => {
  try {
    if (!/^[1-9][0-9]{0,9}$/.test(request.params.id)) return response.status(400).json({message:'Choose a valid user.'});
    const token = await require('../services/passwordRecovery').issue(Number(request.params.id));
    response.status(201).json({ path: '/reset-password.html#' + token });
  } catch (error) { next(error); }
});
router.get('/users/:id/salary-revisions',    protect, staffOrAbove, admin.getSalaryRevisions);

/* ── Permissions ───────────────────────────────────── */
router.get('/users/:id/permissions',         protect, staffOrAbove, admin.getUserPermissions);
router.put('/users/:id/permissions',         protect, adminOnly,    audit('UPDATE_PERMISSIONS','user_permissions'), admin.updateUserPermissions);

/* ── Departments ───────────────────────────────────── */
router.get('/departments',                   protect, admin.getDepartments);
router.post('/departments',                  protect, adminOnly, audit('CREATE_DEPT','departments'), admin.createDepartment);
router.patch('/departments/:id',             protect, adminOnly, audit('UPDATE_DEPT','departments'), admin.updateDepartment);
router.delete('/departments/:id',            protect, adminOnly, audit('DELETE_DEPT','departments'), admin.deleteDepartment);
router.get('/departments/:id/members',       protect, admin.getDeptMembers);
router.post('/departments/:id/assign',       protect, hrOrAbove, admin.assignDeptMembers);

/* ── Shifts ────────────────────────────────────────── */
router.get('/shifts',                        protect, admin.getShifts);
router.post('/shifts',                       protect, adminOnly, admin.createShift);
router.patch('/shifts/:id',                  protect, adminOnly, admin.updateShift);
router.delete('/shifts/:id',                 protect, adminOnly, admin.deleteShift);

/* ── Holiday Calendar ──────────────────────────────── */
router.get('/holidays',                      protect, admin.getHolidays);
router.post('/holidays',                     protect, hrOrAbove, admin.createHoliday);
router.delete('/holidays/:id',               protect, hrOrAbove, admin.deleteHoliday);

/* ── Attendance ────────────────────────────────────── */
router.get('/attendance/my',                 protect, admin.getMyAttendance);
router.get('/attendance/today',              protect, admin.getTodayAttendance);
router.get('/attendance/summary',            protect, staffOrAbove, admin.getAttendanceSummary);
router.get('/attendance/export',             protect, staffOrAbove, admin.exportAttendance);
router.post('/attendance/clock-in',          protect, require('../services/passkeys').attendanceGuard, admin.clockIn);
router.post('/attendance/clock-out',         protect, require('../services/passkeys').attendanceGuard, admin.clockOut);
router.get('/attendance',                    protect, staffOrAbove, admin.getAttendance);
router.post('/attendance',                   protect, hrOrAbove, admin.markAttendance);

/* ── Leave Management ──────────────────────────────── */
router.get('/leave',                         protect, staffOrAbove, admin.getAllLeaveRequests);
router.post('/leave',                        protect, admin.requestLeave);
router.get('/leave/my',                      protect, admin.getMyLeaveRequests);
router.patch('/leave/:id/approve',           protect, staffOrAbove, audit('APPROVE_LEAVE','leave_requests'), admin.approveLeave);
router.patch('/leave/:id/reject',            protect, staffOrAbove, audit('REJECT_LEAVE','leave_requests'),  admin.rejectLeave);
router.delete('/leave/:id',                  protect, admin.cancelLeave);

/* ── Leave Balances ────────────────────────────────── */
router.get('/leave-balances/my',             protect, (req,res,next)=>{ req.params.user_id=req.user.user_id; next(); }, admin.getLeaveBalances);
router.get('/leave-balances/:user_id',       protect, staffOrAbove, admin.getLeaveBalances);
router.put('/leave-balances',                protect, hrOrAbove, admin.updateLeaveBalance);

/* ── Salary / Payroll ──────────────────────────────── */
router.get('/salary/components',             protect, admin.getSalaryComponents);
router.get('/salary/my',                     protect, admin.getMySalary);
router.get('/salary/export',                 protect, staffOrAbove, admin.exportSalary);
router.post('/salary/generate',              protect, adminOnly, audit('GENERATE_SALARY','salary_records'), admin.generateMonthlySalary);
router.get('/salary',                        protect, staffOrAbove, admin.getSalaryRecords);
router.post('/salary',                       protect, hrOrAbove, audit('UPSERT_SALARY','salary_records'), admin.upsertSalaryRecord);
router.patch('/salary/:id/paid',             protect, hrOrAbove, audit('MARK_SALARY_PAID','salary_records'), admin.markSalaryPaid);
router.delete('/salary/:id',                 protect, adminOnly, audit('DELETE_SALARY','salary_records'), admin.deleteSalaryRecord);

/* ── Salary Advance ────────────────────────────────── */
router.get('/salary-advances/quote',         protect, admin.getAdvanceQuote);
router.get('/salary-advances',               protect, staffOrAbove, admin.getSalaryAdvances);
router.post('/salary-advances',              protect, admin.requestAdvance);
router.patch('/salary-advances/:id/review',  protect, hrOrAbove, audit('REVIEW_ADVANCE','salary_advances'), admin.reviewAdvance);

/* ── Expense Claims ────────────────────────────────── */
router.get('/expense-claims',                protect, staffOrAbove, admin.getExpenseClaims);
router.post('/expense-claims',               protect, admin.submitExpenseClaim);
router.patch('/expense-claims/:id/review',   protect, staffOrAbove, audit('REVIEW_EXPENSE','expense_claims'), admin.reviewExpenseClaim);

/* ── Alerts / Notifications ────────────────────────── */
router.get('/alerts',                        protect, admin.getMyAlerts);
router.post('/alerts',                       protect, hrOrAbove, admin.createAlert);
router.patch('/alerts/read-all',             protect, admin.markAllAlertsRead);
router.patch('/alerts/:id/read',             protect, admin.markAlertRead);

/* ── Leaderboard ───────────────────────────────────── */
router.get('/leaderboard',                   protect, admin.getLeaderboard);

/* ── Audit Log (Admin only) ────────────────────────── */
router.get('/audit-logs',                    protect, adminOnly, admin.getAuditLogs);


/* ── v7.0 — PDF Payslip + Broadcast ───────────────── */
router.get('/salary/:id/payslip-pdf',        protect, admin.downloadPayslipPDF);
router.post('/broadcast',                    protect, adminOnly, audit('BROADCAST','alerts'), admin.broadcastNotification);

/* ── v7.0 — Attendance export ──────────────────────── */

module.exports = router;
