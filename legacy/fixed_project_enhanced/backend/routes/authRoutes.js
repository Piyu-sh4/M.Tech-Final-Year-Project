/**
 * authRoutes.js — Authentication & Profile Routes v6.0
 */
const router  = require('express').Router();
const auth    = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/authMiddleware');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

// ── Photo upload storage ─────────────────────────────────────
const photoDir = path.join(__dirname, '../uploads/photos');
if (!fs.existsSync(photoDir)) fs.mkdirSync(photoDir, { recursive: true });
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, photoDir),
  filename:    (req, file, cb) => cb(null, 'user_'+req.user.user_id+'_'+Date.now()+path.extname(file.originalname))
});
const photoUpload = multer({
  storage: photoStorage,
  limits:  { fileSize: 3 * 1024 * 1024 }, // 3 MB
  fileFilter: (req, file, cb) => {
    if (/image\/(jpeg|png|webp|gif)/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG/PNG/WEBP images allowed'));
  }
});

// Public
router.post('/register',           auth.register);
router.post('/login',              auth.login);

// Protected
router.get('/me',                  protect, auth.getMe);
router.put('/profile',             protect, auth.updateProfile);
router.put('/change-password',     protect, auth.changePassword);
router.post('/refresh',            protect, auth.refreshToken);
router.post('/profile/photo',      protect, photoUpload.single('photo'), auth.uploadProfilePhoto);

// Admin: user listing with filters (?search= &dept= &status=)
router.get('/users',               protect, adminOnly, auth.getAllUsers);

module.exports = router;
