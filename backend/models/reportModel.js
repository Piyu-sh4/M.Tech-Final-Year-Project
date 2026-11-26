/**
 * reportModel.js — Report Database Model v6.0
 */
const db = require('../config/db');

exports.saveReport = (data, cb) =>
  db.query(
    `INSERT INTO reports (report_title, report_type, period, status, generated_by, summary, report_data)
     VALUES (?,?,?,?,?,?,?)`,
    [data.report_title, data.report_type, data.period || 'custom',
     data.status || 'published', data.generated_by,
     data.summary || null,
     data.report_data ? JSON.stringify(data.report_data) : null],
    cb
  );

exports.getReports = (cb) =>
  db.query(
    `SELECT r.report_id, r.report_title, r.report_type, r.period,
            r.status, r.report_date, r.summary, u.full_name AS author_name
     FROM reports r LEFT JOIN users u ON r.generated_by = u.user_id
     ORDER BY r.report_date DESC`,
    cb
  );

exports.getReportById = (report_id, cb) =>
  db.query(
    `SELECT r.*, u.full_name AS author_name
     FROM reports r LEFT JOIN users u ON r.generated_by = u.user_id
     WHERE r.report_id=?`,
    [report_id], cb
  );

exports.deleteReport = (report_id, cb) =>
  db.query('DELETE FROM reports WHERE report_id=?', [report_id], cb);

exports.updateReport = (report_id, data, cb) =>
  db.query(
    'UPDATE reports SET report_title=?, summary=?, status=? WHERE report_id=?',
    [data.report_title, data.summary, data.status || 'published', report_id], cb
  );
