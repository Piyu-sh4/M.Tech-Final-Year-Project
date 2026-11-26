const database = require('../config/db');
const { query } = require('./database');
const { participation, readScope } = require('./projectAccess');

const run = (sql, values) => query(database, sql, values);
const maximumRows = 8;
const prompt = /^\s*(?:(?:please\s+)?(?:show(?: me)?|list|get|find|what are|what is|what's|do i have|tell me about|how many)\s+)?(.*?)[?.!]?\s*$/i;

function recordList(heading, rows, format) {
  if (!rows.length) return heading + '\nNo matching records.';
  const shown = rows.slice(0, maximumRows);
  return heading + '\n' + shown.map((row, index) => (index + 1) + '. ' + format(row)).join('\n') +
    (rows.length > maximumRows ? '\nMore records are available in the workspace.' : '');
}

async function tasks(user, status, count) {
  const conditions = {
    overdue: " AND t.status <> 'Completed' AND (t.status='Overdue' OR t.due_date<CURRENT_DATE)",
    open: " AND t.status <> 'Completed'",
    pending: " AND t.status='Pending'",
    completed: " AND t.status='Completed'",
    'in progress': " AND t.status='In Progress'",
  };
  const filter = conditions[status] || '';
  if (count) {
    const [row] = await run('SELECT COUNT(*) AS total FROM tasks t WHERE t.assigned_to=?' + filter, [user.user_id]);
    return 'Tasks assigned to you' + (status ? ' (' + status + ')' : '') + ': ' + row.total + '.';
  }
  const rows = await run(`SELECT t.title,t.status,DATE_FORMAT(t.due_date,'%Y-%m-%d') due
    FROM tasks t WHERE t.assigned_to=? ${filter}
    ORDER BY t.due_date IS NULL,t.due_date,t.task_id DESC LIMIT ?`, [user.user_id, maximumRows + 1]);
  return recordList('Tasks assigned to you' + (status ? ' (' + status + ')' : ''), rows,
    row => row.title + ' · ' + (status === 'overdue' ? 'Overdue' : row.status) + (row.due ? ' · due ' + row.due : ''));
}

async function projects(user, mine, active, count) {
  const [scope, values] = mine ? [participation, [user.user_id,user.user_id,user.user_id]] : readScope(user);
  const predicate = active ? "p.status='active'" : "p.status<>'cancelled'";
  const heading = (active ? 'Active projects' : 'Projects') + (mine ? ' you participate in' : ' you can access');
  if (count) {
    const [row] = await run(`SELECT COUNT(*) AS total FROM projects p WHERE ${predicate} AND ${scope}`, values);
    return heading + ': ' + row.total + '.';
  }
  const rows = await run(`SELECT p.name,p.status,p.completion_pct FROM projects p
    WHERE ${predicate} AND ${scope} ORDER BY p.updated_at DESC,p.project_id DESC LIMIT ?`,
  [...values, maximumRows + 1]);
  return recordList(heading, rows,
    row => row.name + ' · ' + row.status.replaceAll('_', ' ') + ' · ' + (row.completion_pct || 0) + '% complete');
}

async function leaveRequests(user, status, count) {
  const filter = status ? ' AND status=?' : '';
  const values = status ? [user.user_id, status] : [user.user_id];
  if (count) {
    const [row] = await run('SELECT COUNT(*) AS total FROM leave_requests WHERE user_id=?' + filter, values);
    return 'Your leave requests' + (status ? ' (' + status + ')' : '') + ': ' + row.total + '.';
  }
  const rows = await run(`SELECT leave_type,status,DATE_FORMAT(from_date,'%Y-%m-%d') start_date,
    DATE_FORMAT(to_date,'%Y-%m-%d') end_date FROM leave_requests WHERE user_id=? ${filter}
    ORDER BY created_at DESC,leave_id DESC LIMIT ?`, [...values, maximumRows + 1]);
  return recordList('Your leave requests' + (status ? ' (' + status + ')' : ''), rows,
    row => row.leave_type.replaceAll('_', ' ') + ' · ' + row.start_date + ' to ' + row.end_date + ' · ' + row.status);
}

async function attendanceToday(user) {
  const [row] = await run(`SELECT status,DATE_FORMAT(work_date,'%Y-%m-%d') day,
    DATE_FORMAT(clock_in,'%H:%i') clock_in,DATE_FORMAT(clock_out,'%H:%i') clock_out
    FROM attendance WHERE user_id=? AND work_date=CURRENT_DATE`, [user.user_id]);
  if (!row) return 'There is no attendance record for you today.';
  return 'Your attendance for ' + row.day + ': ' + row.status.replaceAll('_', ' ') +
    '. Clock in: ' + (row.clock_in || 'not recorded') + '. Clock out: ' + (row.clock_out || 'not recorded') + '.';
}

async function reports(user, count) {
  if (count) {
    const [row] = await run('SELECT COUNT(*) AS total FROM reports WHERE generated_by=?', [user.user_id]);
    return 'Reports you generated: ' + row.total + '.';
  }
  const rows = await run(`SELECT report_title,status,DATE_FORMAT(report_date,'%Y-%m-%d') day
    FROM reports WHERE generated_by=? ORDER BY report_date DESC,report_id DESC LIMIT ?`, [user.user_id, maximumRows + 1]);
  return recordList('Reports you generated', rows, row => row.report_title + ' · ' + row.status + ' · ' + row.day);
}

const roleTools = [
  {
    label: 'My learning progress', question: 'My learning progress', roles: [1, 2, 3, 4],
    async answer(user) {
      const [summary] = await run(`SELECT COUNT(*) AS enrolled,
        COALESCE(SUM(progress_pct=100),0) AS finished
        FROM training_enrollments WHERE user_id=?`, [user.user_id]);
      return 'Your learning: ' + summary.finished + ' of ' + summary.enrolled + ' courses have 100% recorded progress.';
    },
  },
  {
    label: 'Team overdue task count', question: 'Team overdue task count', roles: [3],
    async answer(user) {
      const [summary] = await run(`SELECT COUNT(*) AS overdue
        FROM tasks task JOIN users employee ON employee.user_id=task.assigned_to
        WHERE employee.reporting_manager_id=? AND task.status<>'Completed'
          AND (task.status='Overdue' OR task.due_date<CURRENT_DATE)`, [user.user_id]);
      return 'Overdue tasks assigned to your direct reports: ' + summary.overdue + '.';
    },
  },
  {
    label: 'Training certificates awaiting review', question: 'Training certificates awaiting review', roles: [1, 4],
    async answer(user) {
      const [summary] = await run(`SELECT COUNT(*) AS awaiting
        FROM training_enrollments enrollment
        LEFT JOIN training_assessments assessment USING(course_id)
        LEFT JOIN training_assessment_results result USING(enrollment_id)
        LEFT JOIN training_certificates certificate USING(enrollment_id)
        WHERE enrollment.status='completed' AND enrollment.progress_pct=100 AND enrollment.completed_at IS NOT NULL
          AND enrollment.user_id<>? AND certificate.enrollment_id IS NULL
          AND (assessment.course_id IS NULL OR result.passed_at IS NOT NULL)`, [user.user_id]);
      return 'Training certificates available for your review: ' + summary.awaiting + '.';
    },
  },
  {
    label: 'Active employee count', question: 'Active employee count', roles: [1],
    async answer() {
      const [summary] = await run("SELECT COUNT(*) AS active FROM users WHERE role_id=2 AND status='active'");
      return 'Active employee accounts: ' + summary.active + '.';
    },
  },
];

function toolsFor(roleId) {
  return roleTools.filter(tool => tool.roles.includes(roleId)).map(({ label, question }) => ({ label, question }));
}

async function answerFromWorkforce(user, message) {
  if (message.length > 160) return null;
  const normalized = message.toLowerCase().trim().replace(/\s+/g, ' ');
  const [, question] = normalized.match(prompt) || [];
  if (!question) return null;
  const tool = roleTools.find(candidate => candidate.question.toLowerCase() === question);
  if (tool) return tool.roles.includes(user.role_id) ? tool.answer(user) : 'This workforce tool is unavailable for your role.';
  const count = /^(?:how many|do i have) /.test(normalized);
  // Match supported read-only questions or return control to the assistant. Text
  // determines the intent only. Table names, filters and user scope come from the app.
  const task = question.match(/^(?:my |any )?(?:(overdue|open|pending|completed|in progress) )?tasks(?: (?:do i have|are assigned to me))?$/);
  if (task) return tasks(user, task[1], count);
  const project = question.match(/^(my )?(active )?projects(?: (?:do i have|can i access))?$/);
  if (project) return projects(user, Boolean(project[1]), Boolean(project[2]), count);
  const leave = question.match(/^(?:my )?(?:(pending|approved|rejected|cancelled) )?leave requests(?: do i have)?$/);
  if (leave) return leaveRequests(user, leave[1], count);
  if (/^(?:my )?(?:(?:today's attendance)|(?:attendance today)|(?:attendance status today))$/.test(question))
    return attendanceToday(user);
  if (/^(?:my )?(?:recent )?reports(?: (?:did i generate|do i have))?$/.test(question))
    return reports(user, count);
  return null;
}

module.exports = { answerFromWorkforce, toolsFor };
