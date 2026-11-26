/**
 * uploadRoutes.js — File Upload Routes v5.1
 */
const router   = require('express').Router();
const upload_c = require('../controllers/uploadController');
const protect  = require('../middleware/authMiddleware');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s/g,'_'))
});

// expanded allowed extensions to match all formats the UI accepts
const ALLOWED = [
  '.csv','.xlsx','.xls',     // spreadsheets
  '.pdf',                     // PDF
  '.txt','.md','.json','.log',// text
  '.docx','.doc',             // Word documents
  '.png','.jpg','.jpeg',      // images
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
router.post('/import/employees', protect, upload_c.importEmployees);
router.post('/import/tasks',     protect, upload_c.importTasks);

module.exports = router;
