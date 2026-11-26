/**
 * uploadController.js — File Upload Controller v5.1
 * Handles: file uploads, content parsing, RAG indexing, DB import
 */

const { parseFile, detectImportableData } = require('../services/fileParserService');
const { indexFileContent }                = require('../services/ragService');
const db                                  = require('../config/db');
const fs                                  = require('fs');
const path                                = require('node:path');
const { documentExtension }               = require('../services/uploadFiles');

const { createPendingEmployee } = require('../services/employeeImport');

exports.uploadFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { path: filePath, originalname } = req.file;

  try {
    const extension = path.extname(filePath).slice(1);
    if (['jpg','jpeg','png','webp','pdf'].includes(extension)) {
      const file = await fs.promises.open(filePath);
      let detected;
      try {
        const header = Buffer.alloc(16);
        const { bytesRead } = await file.read(header, 0, header.length, 0);
        detected = documentExtension(header.subarray(0, bytesRead));
      } finally { await file.close(); }
      if (detected !== (extension === 'jpeg' ? 'jpg' : extension))
        return res.status(400).json({ message: 'The file does not match its declared format.' });
    }
    // Dispatch using the allowlisted temporary filename, not the client MIME header.
    const parsed = await parseFile(filePath);

    // 2. Index text into RAG
    const document = indexFileContent(req.user.user_id, originalname, parsed.text);

    // 3. Detect importable data
    const importable = detectImportableData(parsed);

    res.json({
      filename:   originalname,
      type:       parsed.type,
      totalRows:  parsed.totalRows,
      columns:    parsed.columns || [],
      ragChunks:  document.count,
      documentId: document.id,
      importable,
      rows: req.user.role_id === 1 && importable?.type === 'tasks' && parsed.rows.length <= 500 ? parsed.rows : undefined,
      preview:    parsed.text?.slice(0, 600),
      message:    `File parsed successfully. ${document.count} context chunks indexed for AI.`
    });
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ error: 'File processing failed.' });
  } finally {
    await fs.promises.unlink(filePath).catch(() => {});
  }
};

// ── Bulk import employees from parsed file data ───────────
exports.importEmployees = async (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || !rows.length || rows.length > 500)
    return res.status(400).json({ message: 'Provide up to 500 rows to import.' });

  let imported = 0;
  const errors = [];
  for (const [index, row] of rows.entries()) {
    try {
      await createPendingEmployee(row);
      imported++;
    } catch (error) {
      const message = error.status === 400 ? error.message : 'Could not import this record. Check for duplicates and invalid references.';
      errors.push(`Row ${index + 1}: ${message}`);
    }
  }
  res.json({ imported, errors, total: rows.length });
};

// ── Bulk import tasks from parsed file data ───────────────
exports.importTasks = (req, res) => {
  const { rows } = req.body;
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
      assigned_by:  req.user.user_id,
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
