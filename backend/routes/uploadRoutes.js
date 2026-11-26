/**
 * uploadRoutes.js — File Upload Routes v5.1
 */
const router   = require('express').Router();
const upload_c = require('../controllers/uploadController');
const protect  = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/authMiddleware');
const multer = require('../middleware/multerShim');
const path     = require('path');
const fs       = require('fs');

const { randomUUID } = require('node:crypto');
const uploadDir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'workforce-upload-'));
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, randomUUID() + path.extname(file.originalname).toLowerCase())
});

// expanded allowed extensions to match all formats the UI accepts
const ALLOWED = [
  '.csv','.xlsx','.xls',     // spreadsheets
  '.pdf',                     // PDF
  '.txt','.md','.json','.log',// text
  '.docx','.doc',             // Word documents
  '.png','.jpg','.jpeg','.webp',      // images
  '.mp3','.wav','.m4a','.ogg' // audio / voice notes
];

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, ALLOWED.includes(ext));
  }
});

router.post('/',                 protect, upload.single('file'), upload_c.uploadFile);
router.post('/import/employees', protect, adminOnly, upload_c.importEmployees);
const { inspectEmployees, importEmployeeBatch } = require('../services/employeeImport');
router.post('/employee-intake/preview', protect, adminOnly, async (req, res, next) => {
  try {
    const rows = await inspectEmployees(req.body?.rows);
    res.json({ rows });
  } catch (error) { next(error); }
});
router.post('/employee-intake', protect, adminOnly, async (req, res, next) => {
  try {
    const imported = await importEmployeeBatch(req.body?.rows);
    res.status(201).json({ imported });
  } catch (error) { next(error); }
});
router.post('/import/tasks',     protect, adminOnly, upload_c.importTasks);

module.exports = router;
