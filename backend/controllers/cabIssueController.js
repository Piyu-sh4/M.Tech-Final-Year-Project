/**
 * cabIssueController.js — v12.0
 * Cab Booking Issue / Complaint Ticket System
 */
const db = require('../config/db');
const { isTransportStaff } = require('../middleware/cabAccess');
const q  = (sql, p) => new Promise((r, j) => db.query(sql, p || [], (e, res) => e ? j(e) : r(res)));

exports.raiseIssue = async (req, res) => {
  try {
    const { booking_id, issue_type, priority, subject, description } = req.body;
    if (!issue_type || !subject || !description)
      return res.status(400).json({ message: 'issue_type, subject and description required' });
    const r = await q(`INSERT INTO cab_issues (user_id,booking_id,issue_type,priority,subject,description)
      VALUES (?,?,?,?,?,?)`,
      [req.user.user_id, booking_id || null, issue_type, priority || 'medium', subject, description]);
    res.json({ message: 'Issue raised successfully', issue_id: r.insertId });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getMyIssues = async (req, res) => {
  try {
    const rows = await q(`SELECT ci.*, cb.booking_date, cb.trip_type,
      u.full_name AS assigned_to_name
      FROM cab_issues ci
      LEFT JOIN cab_bookings cb ON cb.booking_id=ci.booking_id
      LEFT JOIN users u ON u.user_id=ci.assigned_to
      WHERE ci.user_id=? ORDER BY ci.created_at DESC`, [req.user.user_id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAllIssues = async (req, res) => {
  try {
    const { status, issue_type, priority } = req.query;
    let sql = `SELECT ci.*, u.full_name, u.email, cb.booking_date, cb.trip_type,
      u2.full_name AS assigned_to_name
      FROM cab_issues ci
      JOIN users u ON u.user_id=ci.user_id
      LEFT JOIN cab_bookings cb ON cb.booking_id=ci.booking_id
      LEFT JOIN users u2 ON u2.user_id=ci.assigned_to
      WHERE 1=1`;
    const p = [];
    if (status)     { sql += ' AND ci.status=?';     p.push(status); }
    if (issue_type) { sql += ' AND ci.issue_type=?'; p.push(issue_type); }
    if (priority)   { sql += ' AND ci.priority=?';   p.push(priority); }
    sql += ' ORDER BY FIELD(ci.priority,"urgent","high","medium","low"), ci.created_at ASC';
    res.json(await q(sql, p));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateIssue = async (req, res) => {
  try {
    const { status, assigned_to, resolution, satisfaction } = req.body;
    const resolved_at = status === 'resolved' ? new Date() : null;
    await q(`UPDATE cab_issues SET status=?,assigned_to=?,resolution=?,satisfaction=?,resolved_at=?
      WHERE issue_id=?`,
      [status, assigned_to || null, resolution || null, satisfaction || null, resolved_at, req.params.id]);
    res.json({ message: 'Issue updated' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.addComment = async (req, res) => {
  try {
    const { message, is_internal } = req.body;
    if (!message) return res.status(400).json({ message: 'Message required' });
    await q(`INSERT INTO cab_issue_comments (issue_id,user_id,message,is_internal) VALUES (?,?,?,?)`,
      [req.params.id, req.user.user_id, message, isTransportStaff(req.user) && is_internal === true ? 1 : 0]);
    res.json({ message: 'Comment added' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getComments = async (req, res) => {
  try {
    const rows = await q(`SELECT cic.*, u.full_name, u.role_id FROM cab_issue_comments cic
      JOIN users u ON u.user_id=cic.user_id WHERE cic.issue_id=? AND (cic.is_internal=0 OR ?) ORDER BY cic.created_at ASC`,
      [req.params.id, isTransportStaff(req.user)]);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getStats = async (req, res) => {
  try {
    const [s] = await q(`SELECT COUNT(*) AS total, SUM(status='open') AS open_count,
      SUM(status='in_review') AS in_review, SUM(status='resolved') AS resolved,
      SUM(priority='urgent') AS urgent, SUM(priority='high') AS "high_priority",
      AVG(satisfaction) AS avg_satisfaction FROM cab_issues`);
    const by_type = await q(`SELECT issue_type, COUNT(*) AS count FROM cab_issues GROUP BY issue_type ORDER BY count DESC`);
    res.json({ ...s, by_type });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
