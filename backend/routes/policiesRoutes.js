/**
 * policiesRoutes.js — Company Policy Library
 * POST /api/policies/upload   — HR uploads policy PDF
 * GET  /api/policies           — list all policies
 * POST /api/policies/:id/acknowledge — employee acknowledges
 * GET  /api/policies/:id/status      — acknowledgement status
 */
const router  = require('express').Router();
const fs      = require('fs');
const multer  = require('../middleware/multerShim');
const { protect, hrOrAbove } = require('../middleware/authMiddleware');
const db      = require('../config/db');
const query = (s,p) => new Promise((res,rej) => {
  db.query(s, p, (err, rows) => err ? rej(err) : res(rows));
});

const { documentExtension, storeUpload, storedPath } = require('../services/uploadFiles');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1, fields: 5 }
});

const { audience, canReadPolicy } = require('../services/policyAudience');

// Upload new policy (HR only)
router.post('/upload', protect, hrOrAbove, upload.single('policy_pdf'), async (req, res) => {
  let stored;
  try {
    if (!req.file || documentExtension(req.file.buffer) !== 'pdf')
      return res.status(400).json({ message: 'PDF file required.' });
    const { title, category, version, acknowledgement_required, applicable_to } = req.body;
    if (typeof title !== 'string' || !title.trim() || title.length > 120) {
      return res.status(400).json({message:'Enter a policy title.'});
    }
    stored = await storeUpload('policies', req.file.buffer, 'pdf');
    const fileUrl = stored.url;
    const result = await query(
      `INSERT INTO company_policies
         (title, policy_name, content, category, version, file_url, acknowledgement_required, applicable_to, uploaded_by, created_by, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,NOW())`,
      [title, title, 'See the attached policy PDF.', category || 'General', version || 'v1.0', fileUrl,
       acknowledgement_required === 'true' ? 1 : 0,
       applicable_to || 'all', req.user.user_id, req.user.user_id]
    );
    res.json({ message: 'Policy published', file_url: '/api/policies/' + result.insertId + '/download' });
  } catch (error) {
    if (stored) fs.unlink(stored.path, () => {});
    console.error('Policy upload:', error.code || error.message);
    res.status(500).json({ message: 'Unable to publish policy.' });
  }
});

// List all policies
router.get('/', protect, async (req, res, next) => {
  try {
    const policies = await query(
      `SELECT p.*,
         (SELECT COUNT(*) FROM policy_acknowledgements pa WHERE pa.policy_id=p.policy_id AND pa.user_id=?) as acknowledged
       FROM company_policies p ${audience} WHERE ${canReadPolicy} ORDER BY p.created_at DESC`,
      [req.user.user_id, req.user.user_id]
    );
    res.json(policies.map(policy => ({
      ...policy,
      file_url: policy.file_url ? '/api/policies/' + policy.policy_id + '/download' : null
    })));
  } catch (error) { next(error); }
});

router.get('/:id/download', protect, async (request, response, next) => {
  try {
    const [policy] = await query(
      `SELECT p.file_url FROM company_policies p ${audience} WHERE p.policy_id=? AND ${canReadPolicy}`,
      [request.user.user_id, request.params.id]);
    const filename = storedPath(policy?.file_url, 'policies');
    if (!filename) return response.status(404).json({ message: 'Policy attachment not found.' });
    response.download(filename, 'policy.pdf', error => {
      if (error && !response.headersSent) next(error);
    });
  } catch (error) { next(error); }
});

// Acknowledge a policy
router.post('/:id/acknowledge', protect, async (req, res, next) => {
  try {
    // Select from the same audience-filtered register used by the list and download.
    const result = await query(
      `INSERT INTO policy_acknowledgements (policy_id, user_id, acknowledged_at)
       SELECT p.policy_id,viewer.user_id,NOW() FROM company_policies p ${audience}
       WHERE p.policy_id=? AND ${canReadPolicy}
       ON DUPLICATE KEY UPDATE acknowledged_at=NOW()`,
      [req.user.user_id, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Policy not found.' });
    res.json({ message: 'Policy acknowledged.' });
  } catch (error) { next(error); }
});

module.exports = router;
