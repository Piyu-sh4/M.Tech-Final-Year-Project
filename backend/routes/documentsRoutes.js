/**
 * documentsRoutes.js — Employee Document Vault
 * POST /api/documents/upload  — upload personal doc (Aadhaar, PAN, Degree etc)
 * GET  /api/documents          — list my documents
 * DELETE /api/documents/:id    — delete a document
 * PATCH /api/documents/:id/share — share with HR
 */
const router  = require('express').Router();
const path    = require('path');
const fs      = require('fs');
const multer  = require('../middleware/multerShim');
const { protect } = require('../middleware/authMiddleware');
const db      = require('../config/db');
const query = (s,p) => new Promise((res,rej) => {
  db.query(s, p, (err, rows) => err ? rej(err) : res(rows));
});

const { documentExtension, storeUpload } = require('../services/uploadFiles');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 4 }
});

// Upload document
router.post('/upload', protect, upload.single('document'), async (req, res) => {
  let stored;
  try {
    const extension = req.file && documentExtension(req.file.buffer);
    if (!extension) return res.status(400).json({ message: 'Choose a PDF, JPEG, PNG, or WebP file.' });
    const { category, doc_name, expiry_date, notes } = req.body;
    if ((category && !['identity','educational','employment','financial','medical','address','other'].includes(category)) ||
        (doc_name && (typeof doc_name !== 'string' || doc_name.length > 200))) {
      return res.status(400).json({message:'Enter a valid category and document name.'});
    }
    stored = await storeUpload('employee-docs', req.file.buffer, extension);
    const fileUrl = stored.url;
    await query(
      `INSERT INTO employee_documents
         (user_id, category, doc_name, file_url, file_path, uploaded_by, file_size, expiry_date, notes, status, uploaded_at)
       VALUES (?,?,?,?,?,?,?,?,?,'pending',NOW())
       ON DUPLICATE KEY UPDATE file_url=VALUES(file_url), uploaded_at=NOW(), status='pending'`,
      [req.user.user_id, category || 'other', doc_name || req.file.originalname,
       fileUrl, fileUrl, req.user.user_id, req.file.size, expiry_date || null, notes || null]
    );
    res.json({ message: 'Document uploaded and awaiting review', file_url: fileUrl });
  } catch (e) {
    if (stored) fs.unlink(stored.path, () => {});
    res.status(500).json({ message: 'Unable to save the document.' });
  }
});

router.get('/:id/download', protect, async (req,res,next) => {
  try {
    const [doc] = await query(`SELECT * FROM employee_documents WHERE doc_id=?
      AND (user_id=? OR (shared_with_hr=1 AND ? IN (1,4)))`,[req.params.id,req.user.user_id,req.user.role_id]);
    if (!doc?.file_url) return res.status(404).json({message:'Document file not found.'});
    const file = path.resolve(__dirname,'..',doc.file_url.replace(/^\/+/,''));
    const uploads = path.resolve(__dirname,'../uploads') + path.sep;
    if (!file.startsWith(uploads) || !fs.existsSync(file)) return res.status(404).json({message:'Document file not found.'});
    res.download(file,error => { if (error && !res.headersSent) next(error); });
  } catch (error) { next(error); }
});

// List my documents
router.get('/', protect, async (req, res) => {
  try {
    const docs = await query(
      `SELECT * FROM employee_documents WHERE user_id=? ORDER BY uploaded_at DESC`,
      [req.user.user_id]
    );
    res.json(docs);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Delete document
router.delete('/:id', protect, async (req, res) => {
  try {
    const [doc] = await query('SELECT * FROM employee_documents WHERE doc_id=? AND user_id=?', [req.params.id, req.user.user_id]);
    if (!doc) return res.status(404).json({ message: 'Document not found.' });
    await query('DELETE FROM employee_documents WHERE doc_id=?', [req.params.id]);
    if (doc.file_url?.startsWith('/uploads/employee-docs/')) fs.unlink(path.join(__dirname, '..', doc.file_url), () => {});
    res.json({ message: 'Document deleted.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Share with HR
router.patch('/:id/share', protect, async (req, res) => {
  try {
    const result = await query('UPDATE employee_documents SET shared_with_hr=1 WHERE doc_id=? AND user_id=?', [req.params.id, req.user.user_id]);
    if (!result.affectedRows) return res.status(404).json({message:'Document not found.'});
    res.json({ message: 'Document shared with HR.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.patch('/:id/review', protect, require('../middleware/authMiddleware').hrOrAbove, async (req,res,next) => {
  try {
    const {status,reason=''} = req.body;
    if (!['verified','rejected'].includes(status) || typeof reason !== 'string' || reason.length>1500) return res.status(400).json({message:'Enter a valid review status and reason.'});
    const result = await query(`UPDATE employee_documents SET status=?,verified_by=?,verified_at=NOW(),reject_reason=?
      WHERE doc_id=? AND user_id<>? AND shared_with_hr=1 AND status='pending'`,[status,req.user.user_id,reason || null,req.params.id,req.user.user_id]);
    if (!result.affectedRows) return res.status(409).json({message:'No shared document is awaiting this review.'});
    res.json({message:status === 'verified' ? 'Document verified' : 'Document returned for correction'});
  } catch (error) { next(error); }
});

module.exports = router;
