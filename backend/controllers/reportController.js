/**
 * reportController.js — Report Controller v5.1
 * Handles: NLP report generation, CRUD, export
 */

const Report    = require('../models/reportModel');
const analytics = require('../services/analyticsService');
const db        = require('../config/db');

function query(sql, params = []) {
  return new Promise((resolve, reject) =>
    db.query(sql, params, (e, r) => e ? reject(e) : resolve(r))
  );
}

function fmt(n) { return Number(n) || 0; }

async function buildReportData(type, period) {
  if (type === 'Productivity') {
    const [performers, summary, trend] = await Promise.all([
      analytics.getTopPerformers(),
      analytics.getSummaryStats(),
      period === 'annual' ? analytics.getAnnualTrend() :
      period === 'monthly' ? analytics.getMonthlyTrend() :
      period === 'weekly' ? analytics.getWeeklyTrend() :
      analytics.getDailyTrend()
    ]);
    const avgScore = performers.length
      ? Math.round(performers.reduce((s, p) => s + p.productivity_score, 0) / performers.length) : 0;
    return {
      type, period,
      kpis: { total_tasks: fmt(summary.total_tasks), completed_tasks: fmt(summary.completed_tasks),
              overdue_tasks: fmt(summary.overdue_tasks), completion_rate: fmt(summary.completion_rate),
              avg_productivity: avgScore, total_employees: performers.length },
      top_performers: performers, trend, generated_at: new Date().toISOString()
    };
  }

  if (type === 'Task Summary') {
    const [tasks, byStatus, byPriority, recentOverdue] = await Promise.all([
      query(`SELECT t.task_id, t.title, t.status, t.priority, t.due_date, t.created_at,
                    u.full_name AS assigned_to_name
             FROM tasks t LEFT JOIN users u ON t.assigned_to = u.user_id
             ORDER BY t.created_at DESC LIMIT 100`),
      query(`SELECT status, COUNT(*) AS count FROM tasks GROUP BY status`),
      query(`SELECT priority, COUNT(*) AS count FROM tasks GROUP BY priority`),
      query(`SELECT t.task_id, t.title, t.due_date, t.priority, u.full_name AS assigned_to_name
             FROM tasks t LEFT JOIN users u ON t.assigned_to = u.user_id
             WHERE t.due_date < CURDATE() AND t.status != 'Completed'
             ORDER BY t.due_date ASC LIMIT 20`)
    ]);
    const statusMap = {}; byStatus.forEach(r => { statusMap[r.status] = fmt(r.count); });
    const priorityMap = {}; byPriority.forEach(r => { priorityMap[r.priority] = fmt(r.count); });
    return {
      type, period,
      kpis: { total: tasks.length, completed: statusMap['Completed'] || 0,
              pending: statusMap['Pending'] || 0, in_progress: statusMap['In Progress'] || 0,
              overdue: statusMap['Overdue'] || 0, high_priority: priorityMap['High'] || 0 },
      by_status: statusMap, by_priority: priorityMap,
      overdue_tasks: recentOverdue, task_list: tasks.slice(0, 50),
      generated_at: new Date().toISOString()
    };
  }

  if (type === 'Employee Performance') {
    const [employees, recentLogs] = await Promise.all([
      query(`SELECT u.user_id, u.full_name, u.email, u.created_at,
                    COUNT(t.task_id) AS total, SUM(t.status='Completed') AS completed,
                    SUM(t.status='Overdue') AS overdue, SUM(t.status='Pending') AS pending,
                    SUM(t.status='In Progress') AS in_progress,
                    ROUND(SUM(t.status='Completed')/NULLIF(COUNT(t.task_id),0)*100,1) AS completion_rate,
                    GREATEST(0, ROUND(SUM(t.status='Completed')/NULLIF(COUNT(t.task_id),0)*100,1)
                      - (SUM(t.status='Overdue')*10)) AS productivity_score
             FROM users u LEFT JOIN tasks t ON t.assigned_to = u.user_id
             WHERE u.role_id = 2
             GROUP BY u.user_id, u.full_name, u.email, u.created_at
             ORDER BY productivity_score DESC`),
      query(`SELECT tl.*, u.full_name AS updated_by_name, t.title AS task_title
             FROM task_logs tl LEFT JOIN users u ON tl.updated_by = u.user_id
             LEFT JOIN tasks t ON tl.task_id = t.task_id
             ORDER BY tl.updated_at DESC LIMIT 30`)
    ]);
    return {
      type, period,
      kpis: { total_employees: employees.length,
              avg_completion: employees.length
                ? Math.round(employees.reduce((s,e)=>s+fmt(e.completion_rate),0)/employees.length) : 0,
              top_performer: employees[0]?.full_name || '—',
              total_tasks_assigned: employees.reduce((s,e)=>s+fmt(e.total),0) },
      employees, recent_activity: recentLogs,
      generated_at: new Date().toISOString()
    };
  }

  if (type === 'Overdue Alert') {
    const [overdue, byEmployee] = await Promise.all([
      query(`SELECT t.task_id, t.title, t.description, t.priority, t.due_date,
                    t.created_at, t.status, u1.full_name AS assigned_to_name,
                    u2.full_name AS assigned_by_name,
                    DATEDIFF(CURDATE(), t.due_date) AS days_overdue
             FROM tasks t LEFT JOIN users u1 ON t.assigned_to=u1.user_id
             LEFT JOIN users u2 ON t.assigned_by=u2.user_id
             WHERE t.due_date < CURDATE() AND t.status != 'Completed'
             ORDER BY t.due_date ASC`),
      query(`SELECT u.full_name, COUNT(t.task_id) AS overdue_count
             FROM tasks t JOIN users u ON t.assigned_to=u.user_id
             WHERE t.due_date < CURDATE() AND t.status != 'Completed'
             GROUP BY u.user_id, u.full_name ORDER BY overdue_count DESC`)
    ]);
    const highPriority = overdue.filter(t => t.priority === 'High').length;
    const avgDaysOver  = overdue.length
      ? Math.round(overdue.reduce((s,t)=>s+fmt(t.days_overdue),0)/overdue.length) : 0;
    return {
      type, period,
      kpis: { total_overdue: overdue.length, high_priority: highPriority,
              employees_affected: byEmployee.length, avg_days_overdue: avgDaysOver },
      overdue_tasks: overdue, by_employee: byEmployee,
      generated_at: new Date().toISOString()
    };
  }

  return { type, period, generated_at: new Date().toISOString() };
}

function generateSummaryText(data) {
  const { type, kpis } = data;
  if (type === 'Productivity') {
    const h = kpis.completion_rate >= 75 ? 'healthy' : kpis.completion_rate >= 50 ? 'moderate' : 'needs attention';
    return `Productivity Report (${data.period}): Team completion rate is ${kpis.completion_rate}% — ${h}. ${kpis.total_tasks} tasks tracked, ${kpis.completed_tasks} completed, ${kpis.overdue_tasks} overdue. Avg productivity score: ${kpis.avg_productivity}%.`;
  }
  if (type === 'Task Summary')
    return `Task Summary: ${kpis.total} tasks — ${kpis.completed} completed, ${kpis.in_progress} in progress, ${kpis.pending} pending, ${kpis.overdue} overdue. ${kpis.high_priority} high-priority tasks.`;
  if (type === 'Employee Performance')
    return `Employee Performance: ${kpis.total_employees} employees, avg completion ${kpis.avg_completion}%, top performer: ${kpis.top_performer}, ${kpis.total_tasks_assigned} total tasks assigned.`;
  if (type === 'Overdue Alert')
    return `Overdue Alert: ${kpis.total_overdue} tasks past deadline (${kpis.high_priority} high-priority). ${kpis.employees_affected} employees affected. Avg ${kpis.avg_days_overdue} days overdue.`;
  return 'Custom report generated.';
}

// POST /api/reports
exports.createReport = async (req, res) => {
  const { report_title, report_type, period, summary, auto_generate } = req.body;
  const generated_by = req.user.user_id;
  try {
    let report_data  = null;
    let finalSummary = summary;
    if (auto_generate !== false && report_type !== 'Custom') {
      report_data  = await buildReportData(report_type, period || 'all');
      finalSummary = summary || generateSummaryText(report_data);
    }
    Report.saveReport({ report_title, report_type, period: period || 'all', status: 'published', generated_by, summary: finalSummary, report_data },
      (err, result) => {
        if (err) return res.status(500).json({ message: 'Report save failed', error: err.message });
        res.status(201).json({ message: 'Report generated', report_id: result.insertId, report_data, summary: finalSummary });
      }
    );
  } catch (err) {
    res.status(500).json({ message: 'Report generation failed', error: err.message });
  }
};

// GET /api/reports
exports.getReports = (req, res) => {
  Report.getReports((err, results) => {
    if (err) return res.status(500).json({ message: 'Could not fetch reports', error: err.message });
    res.json(results.map(r => ({
      ...r,
      report_data: r.report_data
        ? (typeof r.report_data === 'string' ? JSON.parse(r.report_data) : r.report_data) : null
    })));
  });
};

// GET /api/reports/:id
exports.getReport = (req, res) => {
  Report.getReportById(req.params.id, (err, results) => {
    if (err)             return res.status(500).json({ message: 'Could not fetch', error: err.message });
    if (!results.length) return res.status(404).json({ message: 'Not found' });
    const r = results[0];
    res.json({ ...r, report_data: r.report_data
      ? (typeof r.report_data === 'string' ? JSON.parse(r.report_data) : r.report_data) : null });
  });
};

// DELETE /api/reports/:id
exports.deleteReport = (req, res) => {
  Report.deleteReport(req.params.id, (err) => {
    if (err) return res.status(500).json({ message: 'Delete failed', error: err.message });
    res.json({ message: 'Report deleted' });
  });
};

// PUT /api/reports/:id
exports.updateReport = (req, res) => {
  Report.updateReport(req.params.id, req.body, (err) => {
    if (err) return res.status(500).json({ message: 'Update failed', error: err.message });
    res.json({ message: 'Report updated' });
  });
};

// Download the stored report using the same read scope as the reports catalog.
exports.downloadPdf = async (request, response, next) => {
  try {
    const filters = [request.params.id];
    const staff = [1, 3, 4].includes(request.user.role_id);
    if (!staff) filters.push(request.user.user_id);
    const [report] = await query(`SELECT report_id,report_title,report_type,period,status,summary,
      DATE_FORMAT(report_date,'%Y-%m-%d') AS report_date,report_data
      FROM reports WHERE report_id=?${staff ? '' : ' AND generated_by=?'}`, filters);
    if (!report) return response.status(404).json({ message: 'Report not found.' });
    const fields = [
      ['Report reference', report.report_id], ['Report type', report.report_type],
      ['Period', report.period], ['Report date', report.report_date],
      ['Status', report.status], ['Summary', report.summary],
    ];
    // Organization-wide indicators are shown only to HR and administrators.
    if ([1, 4].includes(request.user.role_id) && report.report_data) {
      const data = typeof report.report_data === 'string' ? JSON.parse(report.report_data) : report.report_data;
      const indicators = Object.entries(data?.kpis || {}).filter(([, value]) => typeof value === 'number');
      for (const [name, value] of indicators.slice(0, 16)) {
        const label = name.replaceAll('_', ' ').replace(/^./, character => character.toUpperCase());
        fields.push([label, value]);
      }
    }
    const buffer = await require('../services/recordPdf').renderRecordPdf(report.report_title, fields, 'Report');
    response.attachment('report-' + report.report_id + '.pdf').type('application/pdf').send(buffer);
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/:id/export?format=csv|json
exports.exportReport = (req, res) => {
  const format = req.query.format || 'json';
  Report.getReportById(req.params.id, (err, results) => {
    if (err || !results.length) return res.status(404).json({ message: 'Not found' });
    const r    = results[0];
    const data = r.report_data
      ? (typeof r.report_data === 'string' ? JSON.parse(r.report_data) : r.report_data) : {};

    if (format === 'json') {
      res.setHeader('Content-Disposition', `attachment; filename="report-${r.report_id}.json"`);
      res.setHeader('Content-Type', 'application/json');
      return res.send(JSON.stringify({ ...r, report_data: data }, null, 2));
    }

    if (format === 'csv') {
      let headers = [], rows = [];
      if (data.top_performers?.length) {
        headers = ['Name','Total','Completed','Overdue','Completion Rate %','Score'];
        rows    = data.top_performers.map(p => [p.full_name,p.total,p.completed,p.overdue,p.completion_rate,p.productivity_score]);
      } else if (data.employees?.length) {
        headers = ['Name','Email','Total','Completed','Overdue','Completion %','Score'];
        rows    = data.employees.map(e => [e.full_name,e.email,e.total,e.completed,e.overdue,e.completion_rate,e.productivity_score]);
      } else if (data.overdue_tasks?.length) {
        headers = ['ID','Title','Priority','Due Date','Days Overdue','Assigned To'];
        rows    = data.overdue_tasks.map(t => [t.task_id,t.title,t.priority,t.due_date,t.days_overdue,t.assigned_to_name]);
      } else if (data.task_list?.length) {
        headers = ['ID','Title','Status','Priority','Due Date','Assigned To'];
        rows    = data.task_list.map(t => [t.task_id,t.title,t.status,t.priority,t.due_date,t.assigned_to_name]);
      }
      const csv = [
        `# ${r.report_title}`,
        `# Type: ${r.report_type} | Period: ${r.period} | Date: ${new Date(r.report_date).toDateString()}`,
        `# ${r.summary || ''}`, '',
        headers.join(','),
        ...rows.map(row => row.map(v => `"${String(v??'').replace(/"/g,'""')}"`).join(','))
      ].join('\n');
      res.setHeader('Content-Disposition', `attachment; filename="report-${r.report_id}.csv"`);
      res.setHeader('Content-Type', 'text/csv');
      return res.send(csv);
    }

    res.status(400).json({ message: 'Use format=csv or format=json' });
  });
};

// GET /api/reports/preview/:type?period=monthly
exports.previewReport = async (req, res) => {
  try {
    const data    = await buildReportData(req.params.type, req.query.period || 'all');
    const summary = generateSummaryText(data);
    res.json({ data, summary });
  } catch (err) {
    res.status(500).json({ message: 'Preview failed', error: err.message });
  }
};
