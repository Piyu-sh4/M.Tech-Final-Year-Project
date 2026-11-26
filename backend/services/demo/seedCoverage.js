const bcrypt = require('bcryptjs');
const catalog = require('../../config/moduleCatalog');
const seedOperations = require('./seedOperations');
const seedTalent = require('./seedTalent');

const MARK = 'Demo v3';
const EMPLOYEE_PREFIX = 'demo-v3-staff-';
const DEMO_EMAILS = {
  admin: 'admin@wip.com',
  hr: 'hr@wfintelligence.com',
  manager: 'manager@wfintelligence.com',
  employee: 'employee@wfintelligence.com',
  secondEmployee: 'piyush.sharma@wip.com',
};

const dayMs = 86_400_000;
const dateString = date => date.toISOString().slice(0, 10);
const pad = n => String(n).padStart(3, '0');
const choose = (values, index) => values[index % values.length];

async function seedCoverage(conn, query) {
  const q = (sql, params) => query(conn, sql, params);
  const [{ today }] = await q("SELECT DATE_FORMAT(CURRENT_DATE, '%Y-%m-%d') AS today");
  const anchor = new Date(today + 'T00:00:00Z');
  const day = offset => dateString(new Date(anchor.getTime() + offset * dayMs));
  const at = (offset, time = '10:00:00') => day(offset) + ' ' + time;
  const year = anchor.getUTCFullYear();
  const stamp = prefix => prefix + ' ' + MARK;

  async function insert(table, columns, rows, preserveColumn) {
    const names = columns.map(name => '`' + name + '`').join(', ');
    const preserve = preserveColumn ? ' ON DUPLICATE KEY UPDATE ' + preserveColumn + '=' + preserveColumn : '';
    for (let start = 0; start < rows.length; start += 250) {
      try {
        await q('INSERT INTO `' + table + '` (' + names + ') VALUES ?' + preserve, [rows.slice(start, start + 250)]);
      } catch (error) {
        throw new Error('Seed ' + table + ': ' + error.message, { cause: error });
      }
    }
  }

  const accounts = await q('SELECT user_id, email, base_salary, shift_id FROM users WHERE email IN (?)', [Object.values(DEMO_EMAILS)]);
  const personas = Object.fromEntries(Object.entries(DEMO_EMAILS).map(([role, email]) => [role, accounts.find(user => user.email === email)]));
  const admin = personas.admin?.user_id ?? personas.hr?.user_id ?? personas.manager?.user_id;
  if (!admin) throw new Error('Demo coverage requires one of the original administrator, HR, or manager accounts');
  const hr = personas.hr?.user_id ?? admin;
  const manager = personas.manager?.user_id ?? admin;
  const departments = await q('SELECT dept_id, dept_name FROM departments ORDER BY dept_id');
  const shifts = await q('SELECT shift_id, start_time, end_time FROM shifts WHERE is_active = 1 ORDER BY shift_id LIMIT 8');
  if (!departments.length || !shifts.length) throw new Error('Demo coverage requires seeded departments and active shifts');

  const given = ['Avery','Casey','Devon','Emery','Harper','Jordan','Kai','Morgan','Parker','Riley','Rowan','Sam','Skyler','Taylor'];
  const family = ['Ash','Blair','Cove','Dale','Ellis','Finch','Grove','Hale'];
  const designations = ['Analyst','Engineer','Coordinator','Specialist','Associate','Technician','Advisor','Team Lead'];
  // Generated employees are data fixtures. Only the three named QA personas below get a known password.
  const disabledHash = 'disabled-demo-account';
  const personaHash = await bcrypt.hash('P123/', 10);
  const roster = Array.from({ length: 112 }, (_, index) => {
    const department = choose(departments, index);
    const status = index % 19 === 0 ? 'pending' : index % 23 === 0 ? 'suspended' : 'active';
    const email = EMPLOYEE_PREFIX + pad(index + 1) + '@example.test';
    return {
      index, department, email, status,
      shift: choose(shifts, index),
      name: 'Demo ' + choose(given, index) + ' ' + family[Math.floor(index / given.length)],
      designation: choose(designations, index + Math.floor(index / designations.length)),
      salary: 28_000 + (index % 16) * 4_250,
      joined: day(index % 9 === 0 ? -(index % 24 + 1) : -(150 + index * 7)),
    };
  });
  const userColumns = ['full_name','email','password_hash','role_id','status','department_id','base_salary','employee_code','designation',
    'office_location','work_mode','reporting_manager_id','join_date','gender','employment_type','shift_id','created_at'];
  await insert('users', userColumns, roster.map(employee => [
    employee.name, employee.email, disabledHash, 2, employee.status, employee.department.dept_id, employee.salary,
    'WFI-V3-' + pad(employee.index + 1), employee.designation, choose(['Demo HQ','Demo North','Demo South'], employee.index),
    choose(['office','hybrid','remote'], employee.index), manager, employee.joined,
    choose(['female','male','other','prefer_not_to_say'], employee.index), choose(['full_time','full_time','contract','part_time','intern'], employee.index),
    employee.shift.shift_id, employee.joined + ' 09:00:00',
  ]));
  await insert('users', ['full_name','email','password_hash','role_id','status','employee_code'], [
    ['Demo Empty State','demo-empty@example.test',personaHash,2,'active','WFI-V3-EMPTY'],
    ['Demo Pending Sign-in','demo-pending@example.test',personaHash,2,'pending','WFI-V3-PENDING'],
    ['Demo Suspended Sign-in','demo-suspended@example.test',personaHash,2,'suspended','WFI-V3-SUSPEND'],
  ]);
  const ids = await q('SELECT user_id, email FROM users WHERE email IN (?)', [roster.map(employee => employee.email)]);
  const idByEmail = new Map(ids.map(user => [user.email, user.user_id]));
  for (const employee of roster) employee.id = idByEmail.get(employee.email);
  const active = roster.filter(employee => employee.status === 'active');
  const ownAccounts = Object.values(personas).filter(Boolean).map((user, index) => ({
    id: user.user_id,
    salary: Number(user.base_salary) || 58_000,
    index: active.length + index,
    isTester: true,
    shift: shifts.find(shift => shift.shift_id === user.shift_id) ?? shifts[0],
    joined: day(-365),
  }));
  const people = [...active, ...ownAccounts];
  const primary = personas.employee?.user_id ?? active[0].id;

  await insert('user_permissions', ['user_id','can_view_analytics','can_view_reports','can_use_chat','can_view_salary','can_view_team',
    'can_view_attendance','can_clock_in_out','can_request_advance','updated_by'],
  roster.map(({id, index}) => [id,index % 3 === 0,index % 4 === 0,index % 5 !== 0,1,index % 6 === 0,1,1,index % 7 !== 0,admin]));
  await insert('employee_grades', ['user_id','grade_level','designation','department','effective_date','salary_band_min','salary_band_max','assigned_by'],
    active.map(employee => [employee.id,'L' + (1 + employee.index % 8),employee.designation,employee.department.dept_name,
      employee.joined,employee.salary - 5_000,employee.salary + 12_000,hr]));

  const attendance = [];
  for (const employee of people) {
    for (let offset = 0; offset >= -120; offset--) {
      if (offset === 0 && (employee.isTester || employee.index % 3 === 0)) continue;
      const workDate = day(offset);
      const weekday = new Date(workDate + 'T00:00:00Z').getUTCDay();
      if (workDate < employee.joined || (offset && (weekday === 0 || weekday === 6))) continue;
      const pattern = (employee.index + Math.abs(offset) * 7) % 28;
      const status = pattern === 0 ? 'absent' : pattern === 1 ? 'leave' : pattern === 2 ? 'half_day' : pattern < 6 ? 'late' : 'present';
      const recorded = status !== 'absent' && status !== 'leave';
      const open = offset === 0 && recorded && employee.index % 2 === 0;
      const start = employee.shift.start_time;
      const startTime = at(offset, start);
      const clockIn = recorded ? (status === 'late' ? addMinutes(startTime, 24) : startTime) : null;
      const hours = status === 'half_day' ? 4 : status === 'late' ? 7.6 : pattern === 7 ? 9 : 8;
      attendance.push([employee.id, workDate, clockIn, recorded && !open ? addMinutes(clockIn, Math.round(hours * 60)) : null,
        status, recorded && !open ? hours : null, recorded && !open && hours === 9 ? 1 : 0, stamp('Attendance'), at(offset, '07:00:00')]);
    }
  }
  await insert('attendance', ['user_id','work_date','clock_in','clock_out','status','total_hours','ot_hours','remarks','created_at'], attendance, 'attendance_id');
  await seedPay({ q, insert, people, anchor, day, at, admin });
  await seedLeave({ insert, active, primary, day, at, year, manager });
  await seedOperations({ q, insert, people, active, personas, departments, primary, admin, hr, manager, anchor, day, at, year, stamp, pad, choose });
  await seedTalent({ q, insert, people, active, personas, departments, primary, admin, hr, manager, anchor, day, at, year, stamp, pad, choose });

  const registers = [];
  for (const entry of Object.values(catalog).filter(item => item.states)) {
    const owners = entry.scope === 'own' ? [...ownAccounts.map(user => user.id), ...active.slice(0, 12).map(user => user.id)] : [null];
    for (const owner of owners) {
      for (const [index, status] of entry.states.entries()) {
        const variants = ['Initial request','Follow-up','Quarterly review','Exception review','Closeout'];
        registers.push([entry.slug, owner, entry.example + ' · ' + variants[index], entry.details,
          status, index === 1 ? null : day(index * 11 - 13), at(index - 10)]);
      }
    }
  }
  await insert('demo_module_records', ['module_slug','owner_id','title','details','status','target_date','updated_at'], registers);
}

function addMinutes(value, minutes) {
  const date = new Date(value.replace(' ', 'T') + 'Z');
  return new Date(date.getTime() + minutes * 60_000).toISOString().slice(0, 19).replace('T', ' ');
}

async function seedPay({ q, insert, people, anchor, day, at, admin }) {
  const salaries = [];
  const allocations = new Map();
  const components = await q('SELECT name, MIN(component_id) AS id FROM salary_components GROUP BY name');
  const componentIds = new Map(components.map(component => [component.name, component.id]));
  for (const employee of people) {
    for (let ago = 0; ago < 8; ago++) {
      const monthEnd = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - ago + 1, 0));
      const paidOn = dateString(monthEnd);
      if (employee.joined > paidOn) continue;
      const month = monthEnd.getUTCMonth() + 1;
      const year = monthEnd.getUTCFullYear();
      const basic = employee.salary;
      const bonus = employee.index % 6 === ago % 6 ? 2_500 : 0;
      const pf = 1_800, tax = employee.salary >= 60_000 ? 2_450 : 0, leave = (employee.index + ago) % 13 === 0 ? 675 : 0;
      const deductions = pf + tax + leave;
      const ref = 'WFI-V3-' + employee.id + '-' + year + '-' + month;
      const paid = ago > 0 && (ago > 1 || employee.index % 8 !== 0);
      salaries.push([employee.id, month, year, basic, bonus, deductions, basic + bonus - deductions, paid ? 'paid' : 'pending',
        paid ? paidOn : null, MARK + ' payroll', admin, paid ? 'bank_transfer' : null, ref,
        paid ? paidOn + ' 18:00:00' : at(-1)]);
      allocations.set(ref, [['Basic Salary',basic],['Special Allowance',bonus],['Provident Fund',pf],['TDS',tax],['Leave Deduction',leave]]);
    }
  }
  await insert('salary_records', ['user_id','month','year','base_salary','bonus','deductions','net_salary','payment_status','paid_on','remarks',
    'created_by','payment_method','transaction_ref','created_at'], salaries, 'salary_id');
  const seeded = await q('SELECT salary_id, transaction_ref FROM salary_records WHERE remarks=? AND transaction_ref LIKE ?', [MARK + ' payroll','WFI-V3-%']);
  const lines = seeded.flatMap(salary => (allocations.get(salary.transaction_ref) || [])
    .filter(([name, amount]) => amount > 0 && componentIds.has(name))
    .map(([name, amount]) => [salary.salary_id,componentIds.get(name),amount]));
  await insert('salary_line_items', ['salary_id','component_id','amount'], lines);

  const cohort = people.filter((employee, index) => index % 5 === 0 || index >= people.length - 5);
  await insert('salary_revisions', ['user_id','old_salary','new_salary','effective_date','reason','revised_by','status','created_at'],
    cohort.map(employee => [employee.id,employee.salary - 3_200,employee.salary,day(-75),MARK + ' annual review',admin,'approved',at(-90)]));
  await insert('salary_advances', ['user_id','amount','reason','status','approved_by','approved_at','repay_months','repaid_amount','created_at'],
    cohort.flatMap(employee => ['pending','approved','rejected','repaid'].map((status,index) =>
      [employee.id,3_000 + index * 2_000,MARK + ' advance scenario',status,index ? admin : null,index ? at(-6-index) : null,3,index === 3 ? 9_000 : 0,at(-10-index)])));
}

async function seedLeave({ insert, active, primary, day, at, year, manager }) {
  const dates = [-24,-9,12,19];
  const states = ['approved','cancelled','pending','rejected'];
  const balances = [];
  const requests = [];
  for (const employee of active) {
    const types = ['earned','casual','sick','casual'];
    const ledger = new Map();
    for (const [index, status] of states.entries()) {
      const offset = dates[index] + employee.index % 4;
      const from = day(offset);
      const days = index === 0 ? 2 : 1;
      const type = types[index];
      const leaveYear = Number(from.slice(0,4));
      if (from < employee.joined || Number(day(offset + days - 1).slice(0,4)) !== leaveYear) continue;
      const key = leaveYear + ':' + type;
      const usage = ledger.get(key) || [0,0];
      if (status === 'approved') usage[0] += days;
      if (status === 'pending') usage[1] += days;
      ledger.set(key, usage);
      requests.push([employee.id,type,from,day(offset + days - 1),days,MARK + ' ' + status + ' leave',status,
        index === 0 || index === 3 ? manager : null,index === 0 || index === 3 ? at(Math.min(-2, offset - 5)) : null,
        status === 'rejected' ? 'Coverage unavailable for the sample dates' : null,at(Math.min(-3, offset - 6))]);
    }
    const years = new Set([year,...Array.from(ledger.keys(), key => Number(key.slice(0,4)))]);
    for (const leaveYear of years) {
      for (const [type, entitled] of [['earned',15],['casual',12],['sick',12],['unpaid',0]]) {
        const [taken,pending] = ledger.get(leaveYear + ':' + type) || [0,0];
        balances.push([employee.id,leaveYear,type,entitled,taken,pending,0]);
      }
    }
  }
  // Existing tester balances and their in-progress requests are already populated by v1/v2.
  requests.push([primary,'half_day',day(-14),day(-14),0.5,MARK + ' half-day example','cancelled',null,null,null,at(-17)]);
  await insert('leave_balances', ['user_id','year','leave_type','entitled','taken','pending','carry_forward'], balances);
  await insert('leave_requests', ['user_id','leave_type','from_date','to_date','days','reason','status','reviewed_by','reviewed_at','reject_reason','created_at'], requests);
}

module.exports = seedCoverage;
