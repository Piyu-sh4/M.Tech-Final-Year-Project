const { readScope: projectReadScope } = require('../services/projectAccess');
const { audience, canReadPolicy } = require('../services/policyAudience');
const express = require('express');
const db = require('../config/db');
const protect = require('../middleware/authMiddleware');
const { query } = require('../services/demoBootstrap');
const catalog = require('../config/moduleCatalog');
const router = express.Router();
const elevated = req => [1,3,4].includes(req.user.role_id);
const hr = req => [1,4].includes(req.user.role_id);
const actor = req => req.user.user_id;
const owner = req => [actor(req)];
const self = (sql, staffCheck = elevated) => req => [sql + (staffCheck(req) ? '' : ' AND x.user_id = ?'), staffCheck(req) ? [] : owner(req)];
const staff = sql => req => elevated(req) ? [sql, []] : null;
const simple = sql => () => [sql, []];
// Managers see their own attendance and direct reports; HR and administrators see all.
const teamAttendance = sql => request => elevated(request) ? [sql.replace('/*team*/', request.user.role_id === 3 ? '(u.user_id=? OR u.reporting_manager_id=?)' : '1=1'), request.user.role_id === 3 ? [actor(request), actor(request)] : []] : null;

const data = {
  directory: simple(`SELECT u.full_name, u.designation, d.dept_name department, u.employment_type FROM users u
    LEFT JOIN departments d ON d.dept_id=u.department_id WHERE u.status='active' ORDER BY u.full_name`),
  reporting: simple(`SELECT u.full_name,u.designation,d.dept_name department,m.full_name manager FROM users u
    LEFT JOIN departments d ON d.dept_id=u.department_id LEFT JOIN users m ON m.user_id=u.reporting_manager_id WHERE u.status='active' ORDER BY department,manager,u.full_name`),
  headcount: simple(`SELECT COALESCE(d.dept_name,'Unassigned') department, SUM(u.status='active') active, SUM(u.status='pending') pending, COUNT(*) total
    FROM users u LEFT JOIN departments d ON d.dept_id=u.department_id GROUP BY d.dept_id,d.dept_name ORDER BY total DESC`),
  diversity: staff(`SELECT COALESCE(gender,'Unspecified') AS \`group\`, COUNT(*) headcount FROM users WHERE status='active' GROUP BY gender`),
  attendance: teamAttendance(`SELECT a.work_date,u.full_name,a.clock_in,a.clock_out,a.total_hours,a.status FROM attendance a
    JOIN users u ON u.user_id=a.user_id WHERE /*team*/ ORDER BY a.work_date DESC,a.attendance_id DESC LIMIT 300`),
  today: teamAttendance(`SELECT u.full_name,a.work_date,a.clock_in,a.clock_out,a.status FROM attendance a
    JOIN users u ON u.user_id=a.user_id WHERE a.work_date=CURRENT_DATE AND /*team*/ ORDER BY a.clock_in DESC`),
  revisions: self(`SELECT x.effective_date,u.full_name,x.old_salary,x.new_salary,x.reason FROM salary_revisions x
    JOIN users u ON u.user_id=x.user_id WHERE 1=1`, hr),
  advances: self(`SELECT x.advance_id,x.user_id,x.created_at,u.full_name,x.requested_percentage,x.amount,x.payroll_period,x.reason,x.status,x.repay_months FROM salary_advances x
    JOIN users u ON u.user_id=x.user_id WHERE 1=1`, hr),
  holidays: simple('SELECT holiday_date,name,holiday_type,description FROM holiday_calendar ORDER BY holiday_date DESC'),
  calendar: req => {
    const [scope, params] = projectReadScope(req.user);
    return [`SELECT holiday_date event_date,name title,holiday_type category,'Scheduled' status FROM holiday_calendar
      UNION ALL SELECT p.due_date,p.name,'Project',p.status FROM projects p
      WHERE p.due_date IS NOT NULL AND ${scope} ORDER BY event_date DESC`, params];
  },
  roster: simple(`SELECT u.full_name,s.shift_name,s.start_time,s.end_time,d.dept_name department FROM users u
    JOIN shifts s ON s.shift_id=u.shift_id LEFT JOIN departments d ON d.dept_id=u.department_id
    WHERE u.status='active' ORDER BY s.shift_name,u.full_name`),
  feedback: self(`SELECT u.full_name,x.review_cycle,x.review_type,x.overall_score,x.rating,x.status
    FROM performance_reviews x JOIN users u ON u.user_id=x.user_id WHERE x.review_type IN ('peer','360')`, hr),
  skills: simple(`SELECT u.full_name,s.skill_id,s.skill_name,a.proficiency,a.verified,
    EXISTS(SELECT 1 FROM training_skill_resources resource WHERE resource.skill_id=s.skill_id) has_training FROM skill_assessments a
    JOIN users u ON u.user_id=a.user_id JOIN skills s ON s.skill_id=a.skill_id ORDER BY s.skill_name,u.full_name`),
  interviews: staff(`SELECT i.scheduled_at,j.title,i.round_name,i.mode,i.status FROM interview_rounds i
    JOIN job_postings j ON j.job_id=i.job_id ORDER BY i.scheduled_at DESC`),
  bgv: self(`SELECT u.full_name,x.agency_name,x.checks_requested,x.status,x.result FROM bgv_requests x
    JOIN users u ON u.user_id=x.user_id WHERE 1=1`, hr),
  confirmations: self(`SELECT x.ref_no,u.full_name,x.letter_type,x.issued_date FROM hr_letters x
    JOIN users u ON u.user_id=x.user_id WHERE x.letter_type='confirmation_letter'`, hr),
  'retired-assets': staff("SELECT asset_code,asset_name,category,location,status,notes FROM assets WHERE status IN ('retired','disposed')"),
  cabs: req => [`SELECT b.booking_id,b.booking_date,r.route_name,r.pickup_stop,b.trip_type,b.status FROM cab_bookings b
    JOIN cab_routes r ON r.route_id=b.route_id WHERE b.user_id=? ORDER BY b.booking_date DESC`,owner(req)],
  drivers: staff(`SELECT d.full_name,r.route_name,v.vehicle_type,d.rating,d.status FROM cab_drivers d
    LEFT JOIN cab_routes r ON r.route_id=d.assigned_route LEFT JOIN cab_vehicles v ON v.vehicle_id=d.vehicle_id`),
  dispatch: staff(`SELECT b.booking_date,d.full_name,r.route_name,b.trip_type,b.status,b.journey_status FROM cab_bookings b
    LEFT JOIN cab_drivers d ON d.driver_id=b.driver_id JOIN cab_routes r ON r.route_id=b.route_id ORDER BY b.booking_date DESC`),
  teams: simple(`SELECT d.dept_name department,m.full_name manager,COUNT(u.user_id) headcount
    FROM departments d LEFT JOIN users m ON m.user_id=d.manager_id LEFT JOIN users u ON u.department_id=d.dept_id AND u.status='active'
    GROUP BY d.dept_id,d.dept_name,m.full_name ORDER BY d.dept_name`),
  activity: req => ['SELECT created_at,action,entity_type,entity_id FROM audit_logs WHERE actor_id=? ORDER BY created_at DESC LIMIT 200',owner(req)],
  sessions: req => [`SELECT session_id,user_id,device_info,browser,os,ip_address,city,(session_id=?) is_current,
    (revoked_at IS NULL AND expires_at>NOW()) is_active,last_active,expires_at,revoked_at
    FROM user_sessions WHERE user_id=? ORDER BY last_active DESC LIMIT 200`,[req.user.jti || '',actor(req)]],
  compliance: staff(`SELECT 'Company policies' register, COUNT(*) records FROM company_policies WHERE is_active=1
    UNION ALL SELECT 'Wage references',COUNT(*) FROM minimum_wages
    UNION ALL SELECT 'PoSH training records',COUNT(*) FROM posh_training
    UNION ALL SELECT 'Tax declarations',COUNT(*) FROM tax_declarations`),
  policies: req => [`SELECT p.policy_name,p.category,p.version,p.effective_date,p.content
    FROM company_policies p ${audience} WHERE p.is_active=1 AND ${canReadPolicy} ORDER BY p.effective_date DESC`, owner(req)],
  posh: req => ['SELECT reference_no,incident_date,nature,status,filed_at FROM posh_complaints' +
    (hr(req) ? ' WHERE (complainant_id=? OR is_confidential=0)' : ' WHERE complainant_id=?') + ' ORDER BY filed_at DESC', owner(req)],
  'posh-training': self('SELECT x.training_type,x.training_date,x.mode,x.completed,x.valid_until FROM posh_training x WHERE 1=1', hr),
  wages: simple('SELECT state,skill_category,daily_wage,monthly_wage,effective_from FROM minimum_wages ORDER BY state,skill_category,effective_from DESC'),
  tax: self(`SELECT x.declaration_id,x.user_id,x.financial_year,x.regime,x.gross_income,x.tax_liability,x.status,u.full_name
    FROM tax_declarations x JOIN users u ON u.user_id=x.user_id WHERE 1=1`,hr),
  investments: self('SELECT x.financial_year,x.tax_regime regime,x.status,x.total_deductions total_declared,x.submitted_at FROM investment_declarations x WHERE 1=1',hr),
  tds: staff('SELECT year,month,COUNT(*) payroll_records FROM salary_records GROUP BY year,month ORDER BY year DESC,month DESC'),
  reports: req => ['SELECT report_id,report_date,report_title,report_type,period,status,summary FROM reports'+
    (elevated(req) ? '' : ' WHERE generated_by=?')+' ORDER BY report_date DESC LIMIT 100',elevated(req) ? [] : owner(req)],
  surveys: simple('SELECT title,frequency,start_date,close_date,is_active FROM pulse_surveys ORDER BY start_date DESC'),
  awards: simple(`SELECT u.full_name,a.achievement_type,a.level,a.points,a.message FROM achievements a
    JOIN users u ON u.user_id=a.user_id ORDER BY a.achievement_id DESC LIMIT 150`),
  emergency: req => ['SELECT name,relation,is_primary FROM safety_emergency_contacts WHERE user_id=?',owner(req)],
  documents: req => [`SELECT d.doc_id,d.user_id,d.doc_name,d.doc_type,d.status,d.file_url,d.created_at,d.shared_with_hr,u.full_name
    FROM employee_documents d JOIN users u ON u.user_id=d.user_id
    WHERE d.user_id=?${hr(req) ? ' OR d.shared_with_hr=1' : ''} ORDER BY d.created_at DESC,d.doc_id DESC`,owner(req)],
  analytics: staff(`SELECT 'Active users' metric,COUNT(*) value FROM users WHERE status='active'
    UNION ALL SELECT 'Open tasks',COUNT(*) FROM tasks WHERE status IN ('Pending','In Progress')
    UNION ALL SELECT 'Leave awaiting review',COUNT(*) FROM leave_requests WHERE status='pending'
    UNION ALL SELECT 'Open helpdesk tickets',COUNT(*) FROM helpdesk_tickets WHERE status NOT IN ('resolved','closed')
    UNION ALL SELECT 'Active projects',COUNT(*) FROM projects WHERE status='active'`),
  overview: req => elevated(req) ? [`SELECT 'Active workforce' metric,COUNT(*) value,'employee-directory' destination FROM users WHERE status='active' AND role_id<>1
    UNION ALL SELECT 'Pending registrations',COUNT(*),'registration-tracker' FROM users WHERE status='pending'
    UNION ALL SELECT 'Leave awaiting review',COUNT(*),'leave' FROM leave_requests WHERE status='pending'
    UNION ALL SELECT 'Loan applications awaiting review',COUNT(*),'loan-portal' FROM loan_applications WHERE status IN ('pending','under_review')
    UNION ALL SELECT 'Tax declarations awaiting review',COUNT(*),'tax-portal' FROM tax_declarations WHERE status='submitted'
    UNION ALL SELECT 'Overdue tasks',COUNT(*),'tasks' FROM tasks WHERE due_date<CURRENT_DATE AND status<>'Completed'
    ${hr(req) ? "UNION ALL SELECT 'Issued training certificates',COUNT(*),'certificate-register' FROM training_certificates WHERE revoked_at IS NULL" : ''}`,[]] : null,
  sos: req => hr(req) ? ['SELECT created_at,trigger_type,status FROM safety_sos_events ORDER BY created_at DESC LIMIT 100', []] : null,
};

const { visibleTo } = require('../services/moduleAccess');
const visible = (item, req) => visibleTo(item, req.user);
const publicInfo = ({ example, details, ...item }) => item;
const ownScope = (item, req) => item.scope === 'own' ? [actor(req)] : [];
const where = item => item.scope === 'own' ? ' AND owner_id=?' : ' AND owner_id IS NULL';
const withErrors = handler => (req,res,next) => Promise.resolve(handler(req,res)).catch(next);

router.use(protect);
require('../services/workflows').routes(router,catalog,db);
router.get('/', (req,res) => res.json(Object.values(catalog).filter(item => visible(item, req)).map(publicInfo)));
router.get('/data/:key', withErrors(async (req,res) => {
  if (!Object.hasOwn(data, req.params.key)) return res.status(404).json({message:'Unknown dataset'});
  const args = data[req.params.key](req);
  if (!args) return res.status(403).json({message:'This register requires an elevated role.'});
  res.json(await query(db, ...args));
}));
router.use('/:slug/records', (req,res,next) => {
  const item = Object.hasOwn(catalog,req.params.slug) && catalog[req.params.slug];
  if (!item?.states) return res.status(404).json({message:'Unknown register'});
  if (!visible(item, req)) return res.status(403).json({message:'This register requires an elevated role.'});
  req.module = item;
  next();
});
router.get('/:slug/records', withErrors(async (req,res) => {
  res.json(await query(db, 'SELECT record_id,title,details,status,target_date,updated_at FROM demo_module_records WHERE module_slug=?'+
    where(req.module)+' ORDER BY record_id DESC LIMIT 300',[req.module.slug,...ownScope(req.module,req)]));
}));
function input(req) {
  const { title, details = '', status, target_date = null } = req.body || {};
  if (typeof title !== 'string' || !title.trim() || title.length > 150 ||
      typeof details !== 'string' || details.length > 1500 || !req.module.states.includes(status)) return null;
  if (target_date && (typeof target_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(target_date) ||
      Number.isNaN(Date.parse(target_date)) || new Date(target_date).toISOString().slice(0,10) !== target_date)) return null;
  return [title.trim(),details.trim(),status,target_date || null];
}
router.post('/:slug/records', withErrors(async (req,res) => {
  const values = input(req);
  if (!values) return res.status(400).json({message:'Enter a valid title, status and target date.'});
  const r = await query(db,'INSERT INTO demo_module_records (module_slug,owner_id,title,details,status,target_date) VALUES (?,?,?,?,?,?)',
    [req.module.slug,ownScope(req.module,req)[0] || null,...values]);
  res.status(201).json({record_id:r.insertId});
}));
router.patch('/:slug/records/:id', withErrors(async (req,res) => {
  const values = input(req);
  if (!values || !/^\d+$/.test(req.params.id)) return res.status(400).json({message:'Enter a valid title, status and target date.'});
  const r = await query(db,'UPDATE demo_module_records SET title=?,details=?,status=?,target_date=? WHERE module_slug=? AND record_id=?'+
    where(req.module),[...values,req.module.slug,req.params.id,...ownScope(req.module,req)]);
  res.status(r.affectedRows ? 200 : 404).json(r.affectedRows ? {message:'Saved'} : {message:'Record not found'});
}));
module.exports = router;
