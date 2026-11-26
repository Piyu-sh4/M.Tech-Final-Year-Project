/**
 * uploadController.js — File Upload Controller v5.1
 * Handles: file uploads, content parsing, RAG indexing, DB import
 */

const { parseFile, detectImportableData } = require('../services/fileParserService');
const { indexFileContent }                = require('../services/ragService');
const db                                  = require('../config/db');
const fs                                  = require('fs');

exports.uploadFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { path: filePath, originalname, mimetype } = req.file;

  try {
    // 1. Parse the file
    const parsed   = await parseFile(filePath, mimetype);

    // 2. Index text into RAG
    const chunks   = indexFileContent(originalname, parsed.text, mimetype);

    // 3. Detect importable data
    const importable = detectImportableData(parsed);

    // 4. Clean up temp file
    try { fs.unlinkSync(filePath); } catch (_) {}

    res.json({
      filename:   originalname,
      type:       parsed.type,
      totalRows:  parsed.totalRows,
      columns:    parsed.columns || [],
      ragChunks:  chunks,
      importable,
      preview:    parsed.text?.slice(0, 600),
      message:    `File parsed successfully. ${chunks} context chunks indexed for AI.`
    });
  } catch (err) {
    try { fs.unlinkSync(filePath); } catch (_) {}
    console.error('Upload error:', err.message);
    res.status(500).json({ error: 'File processing failed: ' + err.message });
  }
};

// ── Bulk import employees from parsed file data ───────────
exports.importEmployees = (req, res) => {
  const { rows } = req.body;
  if (!rows?.length) return res.status(400).json({ error: 'No rows to import' });

  const bcrypt = require('bcryptjs');
  let imported = 0;
  let errors   = [];

  const process = (idx) => {
    if (idx >= rows.length) {
      return res.json({ imported, errors, total: rows.length });
    }

    const row   = rows[idx];
    const name  = row.name || row.full_name || row['Full Name'] || '';
    const email = row.email || row.Email || '';
    if (!name || !email) {
      errors.push(`Row ${idx + 1}: missing name or email`);
      return process(idx + 1);
    }

    const hash    = bcrypt.hashSync('Welcome@123', 10);
    const role_id = (row.role || row.Role || '').toLowerCase().includes('admin') ? 1 : 2;

    db.query(
      'INSERT IGNORE INTO users (full_name, email, password_hash, role_id) VALUES (?,?,?,?)',
      [name, email, hash, role_id],
      (err, result) => {
        if (err) errors.push(`Row ${idx + 1}: ${err.message}`);
        else if (result.affectedRows > 0) imported++;
        process(idx + 1);
      }
    );
  };

  process(0);
};

// ── Bulk import tasks from parsed file data ───────────────
exports.importTasks = (req, res) => {
  const { rows, assigned_by } = req.body;
  if (!rows?.length) return res.status(400).json({ error: 'No rows to import' });

  let imported = 0;
  let errors   = [];

  const process = (idx) => {
    if (idx >= rows.length) {
      return res.json({ imported, errors, total: rows.length });
    }

    const row   = rows[idx];
    const title = row.title || row.Title || row.task || '';
    if (!title) {
      errors.push(`Row ${idx + 1}: missing title`);
      return process(idx + 1);
    }

    const data = {
      title,
      description:  row.description || row.Description || '',
      assigned_by:  assigned_by || 1,
      assigned_to:  parseInt(row.assigned_to || row.employee_id || 1) || 1,
      priority:     ['Low','Medium','High'].includes(row.priority) ? row.priority : 'Medium',
      status:       ['Pending','In Progress','Completed','Overdue'].includes(row.status) ? row.status : 'Pending',
      due_date:     row.due_date || row.deadline || null
    };

    db.query(
      'INSERT INTO tasks (title, description, assigned_by, assigned_to, priority, status, due_date) VALUES (?,?,?,?,?,?,?)',
      [data.title, data.description, data.assigned_by, data.assigned_to, data.priority, data.status, data.due_date],
      (err, result) => {
        if (err) errors.push(`Row ${idx + 1}: ${err.message}`);
        else imported++;
        process(idx + 1);
      }
    );
  };

  process(0);
};
