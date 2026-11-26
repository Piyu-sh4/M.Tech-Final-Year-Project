/**
 * aiController.js — v12.0
 * Advanced AI Module: Attrition Score, Burnout, Leave Forecast, Salary Benchmark
 */
const db = require('../config/db');
const q = (sql, p) => new Promise((r, j) => db.query(sql, p || [], (e, res) => e ? j(e) : r(res)));

// ── ATTRITION SCORE ─────────────────────────────────────────────────────────
// Score 0-100 based on: tenure, leaves, overtime, salary growth, performance, task completion
exports.computeAttritionScore = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const [u] = await q(
      `SELECT u.user_id, u.full_name, u.date_of_joining, u.role_id,
        COALESCE(sr.gross_salary,0) AS gross_salary,
        COALESCE(sr.basic_salary,0) AS basic_salary
       FROM users u LEFT JOIN salary_records sr ON sr.user_id=u.user_id
       WHERE u.user_id=? ORDER BY sr.created_at DESC LIMIT 1`, [employee_id]
    );
    if (!u) return res.status(404).json({ message: 'Employee not found' });

    // Signals
    const [leaveData] = await q(
      `SELECT COUNT(*) AS leaves_taken, SUM(total_days) AS total_leave_days
       FROM leave_requests WHERE user_id=? AND status='approved'
       AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)`, [employee_id]
    );
    const [taskData] = await q(
      `SELECT COUNT(*) AS total, SUM(status='completed') AS completed,
        SUM(status='overdue') AS overdue
       FROM tasks WHERE assigned_to=?`, [employee_id]
    );
    const [perfData] = await q(
      `SELECT AVG(overall_rating) AS avg_rating FROM performance_reviews
       WHERE user_id=? ORDER BY created_at DESC LIMIT 3`, [employee_id]
    );

    const tenure = u.date_of_joining
      ? (Date.now() - new Date(u.date_of_joining)) / (1000 * 60 * 60 * 24 * 365.25)
      : 1;

    // Risk factor calculation (higher = more risk)
    let risk = 0;
    // Tenure < 1 yr → high risk
    if (tenure < 1) risk += 25;
    else if (tenure < 2) risk += 15;
    else if (tenure < 3) risk += 8;
    // High leave frequency
    const leavesPerMonth = (leaveData.leaves_taken || 0) / 6;
    if (leavesPerMonth > 2) risk += 20;
    else if (leavesPerMonth > 1) risk += 10;
    // Overdue tasks
    const overdueRatio = taskData.total > 0 ? (taskData.overdue || 0) / taskData.total : 0;
    if (overdueRatio > 0.3) risk += 20;
    else if (overdueRatio > 0.1) risk += 10;
    // Low performance
    const rating = parseFloat(perfData.avg_rating) || 3;
    if (rating < 2) risk += 25;
    else if (rating < 3) risk += 10;

    const score = Math.min(100, Math.max(0, risk));
    const level = score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';

    res.json({
      employee_id,
      employee_name: u.full_name,
      attrition_score: score,
      risk_level: level,
      factors: {
        tenure_years: parseFloat(tenure.toFixed(1)),
        leaves_last_6m: leaveData.leaves_taken || 0,
        task_completion_rate: taskData.total > 0
          ? Math.round((taskData.completed / taskData.total) * 100) : 100,
        avg_performance_rating: rating,
        overdue_tasks: taskData.overdue || 0
      },
      recommendation: score >= 70
        ? 'Immediate retention conversation recommended'
        : score >= 40 ? 'Schedule a check-in meeting' : 'Employee appears stable',
      computed_at: new Date()
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAttritionDashboard = async (req, res) => {
  try {
    const users = await q(
      `SELECT u.user_id, u.full_name, u.date_of_joining, u.role_id,
        COALESCE((SELECT x.gross_salary FROM salary_records x WHERE x.user_id=u.user_id
                  ORDER BY x.year DESC, x.month DESC LIMIT 1),0) AS gross_salary,
        d.name AS department,
        (SELECT COUNT(*) FROM leave_requests lr WHERE lr.user_id=u.user_id
          AND lr.status='approved' AND lr.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)) AS leaves_6m,
        (SELECT COUNT(*) FROM tasks t WHERE t.assigned_to=u.user_id AND t.status='overdue') AS overdue_tasks,
        (SELECT AVG(pr.overall_rating) FROM performance_reviews pr WHERE pr.user_id=u.user_id) AS avg_rating
       FROM users u
       LEFT JOIN departments d ON d.dept_id=u.department_id
       WHERE u.status='active' AND u.role_id != 1
       GROUP BY u.user_id ORDER BY u.full_name`
    );

    const scored = users.map(u => {
      const tenure = u.date_of_joining
        ? (Date.now() - new Date(u.date_of_joining)) / (1000 * 60 * 60 * 24 * 365.25) : 1;
      let risk = 0;
      if (tenure < 1) risk += 25; else if (tenure < 2) risk += 15;
      if ((u.leaves_6m || 0) / 6 > 2) risk += 20; else if ((u.leaves_6m || 0) / 6 > 1) risk += 10;
      if ((u.overdue_tasks || 0) > 3) risk += 20; else if ((u.overdue_tasks || 0) > 1) risk += 10;
      const rating = parseFloat(u.avg_rating) || 3;
      if (rating < 2) risk += 25; else if (rating < 3) risk += 10;
      return { ...u, attrition_score: Math.min(100, risk), risk_level: risk >= 70 ? 'HIGH' : risk >= 40 ? 'MEDIUM' : 'LOW' };
    });

    const high = scored.filter(s => s.risk_level === 'HIGH');
    const medium = scored.filter(s => s.risk_level === 'MEDIUM');
    res.json({
      total_employees: scored.length,
      high_risk: high.length,
      medium_risk: medium.length,
      low_risk: scored.length - high.length - medium.length,
      avg_score: scored.length ? Math.round(scored.reduce((a, s) => a + s.attrition_score, 0) / scored.length) : 0,
      top_risk: scored.sort((a, b) => b.attrition_score - a.attrition_score).slice(0, 10),
      all_scores: scored
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── BURNOUT SCORE ────────────────────────────────────────────────────────────
exports.computeBurnoutScore = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const [u] = await q('SELECT user_id, full_name FROM users WHERE user_id=?', [employee_id]);
    if (!u) return res.status(404).json({ message: 'Employee not found' });

    const [tasks] = await q(
      `SELECT COUNT(*) AS total, SUM(priority='urgent'||priority='high') AS urgent,
        SUM(DATEDIFF(NOW(), due_date) > 0 AND status != 'completed') AS overdue
       FROM tasks WHERE assigned_to=? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`, [employee_id]
    );
    const [leaves] = await q(
      `SELECT COUNT(*) AS rejected FROM leave_requests
       WHERE user_id=? AND status='rejected' AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)`, [employee_id]
    );
    const [lateClockOuts] = await q(
      `SELECT COUNT(*) AS late_days FROM attendance
       WHERE user_id=? AND TIME(clock_out) > '20:00:00'
       AND date >= DATE_SUB(NOW(), INTERVAL 30 DAY)`, [employee_id]
    );

    let burnout = 0;
    const totalTasks = tasks.total || 0;
    if (totalTasks > 15) burnout += 25;
    else if (totalTasks > 10) burnout += 15;
    const urgentRatio = totalTasks > 0 ? (tasks.urgent || 0) / totalTasks : 0;
    if (urgentRatio > 0.5) burnout += 20;
    if ((tasks.overdue || 0) > 3) burnout += 20;
    if ((leaves.rejected || 0) > 1) burnout += 15;
    if ((lateClockOuts.late_days || 0) > 8) burnout += 20;

    const score = Math.min(100, burnout);
    res.json({
      employee_id, employee_name: u.full_name,
      burnout_score: score,
      risk_level: score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW',
      signals: {
        tasks_last_30d: totalTasks,
        urgent_task_ratio: Math.round(urgentRatio * 100) + '%',
        overdue_tasks: tasks.overdue || 0,
        rejected_leaves_90d: leaves.rejected || 0,
        late_evenings_30d: lateClockOuts.late_days || 0
      },
      action: score >= 70 ? 'Recommend wellness check and workload redistribution'
        : score >= 40 ? 'Monitor workload and check in with manager' : 'No immediate action needed',
      computed_at: new Date()
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── LEAVE FORECAST ───────────────────────────────────────────────────────────
exports.forecastLeave = async (req, res) => {
  try {
    const { employee_id } = req.params;
    // Look at last 12 months leave pattern and project next 3
    const history = await q(
      `SELECT MONTH(start_date) AS month, YEAR(start_date) AS year,
        SUM(total_days) AS days_taken
       FROM leave_requests WHERE user_id=? AND status='approved'
       AND start_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
       GROUP BY YEAR(start_date), MONTH(start_date) ORDER BY year, month`,
      [employee_id]
    );
    const [bal] = await q(
      `SELECT SUM(CASE WHEN leave_type='casual' THEN remaining END) AS cl,
              SUM(CASE WHEN leave_type='sick'   THEN remaining END) AS sl,
              SUM(CASE WHEN leave_type='earned' THEN remaining END) AS el
       FROM leave_balances WHERE user_id=? AND year=YEAR(CURDATE())`,
      [employee_id]
    );

    const avgPerMonth = history.length
      ? history.reduce((a, h) => a + h.days_taken, 0) / history.length : 1.5;

    const forecast = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(); d.setMonth(d.getMonth() + i);
      const monthName = d.toLocaleString('en-IN', { month: 'long' });
      // Seasonal adjustment: Dec/Jan/Aug typically higher leave
      const seasonal = [1, 8, 12].includes(d.getMonth() + 1) ? 1.4 : 1.0;
      forecast.push({
        month: monthName, year: d.getFullYear(),
        predicted_days: parseFloat((avgPerMonth * seasonal).toFixed(1)),
        confidence: history.length >= 6 ? 'High' : history.length >= 3 ? 'Medium' : 'Low'
      });
    }

    res.json({
      employee_id,
      history_months: history.length,
      avg_days_per_month: parseFloat(avgPerMonth.toFixed(1)),
      current_balance: bal || { cl: 0, sl: 0, el: 0 },
      forecast,
      peak_months: history.sort((a, b) => b.days_taken - a.days_taken).slice(0, 3)
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── SALARY BENCHMARK ─────────────────────────────────────────────────────────
exports.getSalaryBenchmark = async (req, res) => {
  try {
    const { department_id, role_id } = req.query;
    // NOTE: PERCENTILE_CONT ... WITHIN GROUP is not supported by MySQL; p25/p75 use PERCENT_RANK()
    // (first salary at or above the percentile) which is valid on MySQL 8.0.
    let where = ' WHERE sr.month = MONTH(NOW()) AND sr.year = YEAR(NOW())';
    const p = [];
    if (department_id) { where += ' AND u.department_id=?'; p.push(department_id); }
    if (role_id) { where += ' AND u.role_id=?'; p.push(role_id); }
    const sql = `SELECT role_id, department,
        AVG(sal) AS avg_salary, MIN(sal) AS min_salary, MAX(sal) AS max_salary, COUNT(*) AS headcount,
        MIN(CASE WHEN pr >= 0.25 THEN sal END) AS p25,
        MIN(CASE WHEN pr >= 0.75 THEN sal END) AS p75
      FROM (
        SELECT u.role_id, d.dept_name AS department, sr.gross_salary AS sal,
               PERCENT_RANK() OVER (PARTITION BY u.role_id, d.dept_name ORDER BY sr.gross_salary) AS pr
        FROM salary_records sr JOIN users u ON u.user_id=sr.user_id
        LEFT JOIN departments d ON d.dept_id=u.department_id${where}
      ) t GROUP BY role_id, department ORDER BY avg_salary DESC`;

    const rows = await q(sql, p);
    // Market benchmarks (illustrative - in production these would come from a data provider)
    const marketBenchmarks = {
      2: { title: 'Employee', market_p50: 45000, market_p75: 65000 },
      3: { title: 'Manager', market_p50: 90000, market_p75: 130000 },
      4: { title: 'HR', market_p50: 60000, market_p75: 90000 }
    };
    const enriched = rows.map(r => ({
      ...r,
      avg_salary: Math.round(r.avg_salary),
      market_benchmark: marketBenchmarks[r.role_id] || null,
      competitive_index: marketBenchmarks[r.role_id]
        ? Math.round((r.avg_salary / marketBenchmarks[r.role_id].market_p50) * 100) : null
    }));
    res.json(enriched);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── AI INSIGHTS (consolidated) ───────────────────────────────────────────────
exports.getAIInsights = async (req, res) => {
  try {
    const [attrition] = await q(
      `SELECT COUNT(*) AS total,
        SUM(CASE WHEN TIMESTAMPDIFF(YEAR,date_of_joining,NOW())<1 THEN 1 ELSE 0 END) AS new_joiners,
        SUM(CASE WHEN TIMESTAMPDIFF(YEAR,date_of_joining,NOW()) BETWEEN 1 AND 2 THEN 1 ELSE 0 END) AS mid_tenure
       FROM users WHERE status='active' AND role_id != 1`
    );
    const [overtime] = await q(
      `SELECT AVG(TIMESTAMPDIFF(MINUTE, clock_in, clock_out)/60) AS avg_hours
       FROM attendance WHERE date >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND clock_out IS NOT NULL`
    );
    const [pending] = await q(
      `SELECT COUNT(*) AS pending_leaves FROM leave_requests WHERE status='pending'`
    );
    const [overdue] = await q(
      `SELECT COUNT(*) AS overdue_tasks FROM tasks WHERE status='overdue'`
    );
    const [hires] = await q(
      `SELECT COUNT(*) AS joined FROM users WHERE date_of_joining >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );

    const avgHours = parseFloat(overtime.avg_hours) || 8;
    const burnoutRisk = avgHours > 10 ? 'HIGH' : avgHours > 9 ? 'MEDIUM' : 'LOW';

    res.json({
      generated_at: new Date(),
      workforce: {
        total_active: attrition.total,
        new_joiners_1yr: attrition.new_joiners,
        mid_tenure_2yr: attrition.mid_tenure,
        hires_last_30d: hires.joined
      },
      burnout: {
        avg_daily_hours: parseFloat(avgHours.toFixed(1)),
        risk_level: burnoutRisk,
        insight: avgHours > 10
          ? `⚠ Avg ${avgHours.toFixed(1)}h/day — employees may be overworked`
          : `✅ Work hours appear balanced at ${avgHours.toFixed(1)}h/day`
      },
      leave_backlog: {
        pending_approvals: pending.pending_leaves,
        insight: pending.pending_leaves > 10
          ? `${pending.pending_leaves} leave requests pending manager approval`
          : 'Leave approvals are up to date'
      },
      task_health: {
        overdue_tasks: overdue.overdue_tasks,
        insight: overdue.overdue_tasks > 20
          ? `${overdue.overdue_tasks} overdue tasks need attention`
          : 'Task completion is on track'
      },
      recommendations: [
        attrition.new_joiners > 5
          ? `${attrition.new_joiners} new joiners in first year — ensure mentorship programs`
          : null,
        burnoutRisk === 'HIGH' ? 'Consider workload distribution review' : null,
        pending.pending_leaves > 5 ? 'Managers should clear leave backlogs' : null,
        overdue.overdue_tasks > 15 ? 'Review task deadlines and capacity planning' : null
      ].filter(Boolean)
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
