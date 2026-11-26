const security = require('../middleware/securityMiddleware');
/**
 * authRoutes.js — Authentication & Profile Routes v6.0
 */
const router  = require('express').Router();
const auth    = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/authMiddleware');
const feedback = require('../services/signOutFeedback');
const passwordRecovery = require('../services/passwordRecovery');
router.post('/password-reset/request', security.createRateLimiter('passwordRecovery'),
  security.createRateLimiter('passwordRecoveryAccount'), (request, response, next) => {
    try {
      passwordRecovery.requestReset(request.body?.email);
      response.status(202).json({ message: 'If an active account matches, a reset link will arrive by email.' });
    } catch (error) {
      if (error.status === 503) return response.status(503).json({ message: error.message });
      next(error);
    }
  });
router.post('/password-reset/confirm', security.createRateLimiter('passwordRecoveryRedeem'), async (request, response, next) => {
  try {
    await passwordRecovery.redeem(request.body);
    response.json({ message: 'Password updated. Sign in with your new password.' });
  } catch (error) { next(error); }
});
router.post('/logout', protect, auth.logout);
router.post('/sign-out-feedback', security.createRateLimiter('signOutFeedback'), async (request, response, next) => {
  try { response.json(await feedback.submit(request.body)); }
  catch (error) { next(error); }
});
router.get('/sign-out-feedback', protect, adminOnly, async (request, response, next) => {
  try { response.json(await feedback.list()); }
  catch (error) { next(error); }
});
router.patch('/sign-out-feedback/:id', protect, adminOnly, async (request, response, next) => {
  try { response.json(await feedback.review(request.params.id, request.user, request.body)); }
  catch (error) { next(error); }
});
router.delete('/sessions/:id', protect, auth.revokeSession);
const multer = require('../middleware/multerShim');
const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024, files: 1, fields: 0 }
});

// Public registration choices come from configured companies, not client-supplied names.
router.get('/companies', async(req,res,next)=>{try{const database=require('../config/db');const {query}=require('../services/database');res.json(await query(database,'SELECT company_id,name FROM companies WHERE is_active=1 ORDER BY name'));}catch(error){next(error);}});
router.get('/attendance-audit',protect,async(req,res,next)=>{try{res.json(await require('../services/database').query(require('../config/db'),'SELECT action,verification_method,ip_address,created_at FROM attendance_security_audit WHERE actor_id=? ORDER BY audit_id DESC LIMIT 30',[req.user.user_id]));}catch(error){next(error);}});
router.post('/companies',protect,adminOnly,async(req,res,next)=>{try{const name=req.body.name;if(typeof name!=='string'||!name.trim()||name.length>150)return res.status(400).json({message:'Enter a company name up to 150 characters.'});const result=await require('../services/database').query(require('../config/db'),'INSERT INTO companies(name) VALUES (?)',[name.trim()]);res.status(201).json({company_id:result.insertId,message:'Company added'});}catch(error){if(error.code==='ER_DUP_ENTRY')return res.status(409).json({message:'This company already exists.'});next(error);}});
router.get('/session-context',protect,(req,res)=>res.json({ip_address:require('../services/requestIdentity').clientIp(req),note:'IP is recorded for security audit. It does not prove physical location.'}));
router.get('/preferences',protect,async(req,res,next)=>{try{res.json(await require('../services/applicationPreferences').get(req.user.user_id));}catch(error){next(error);}});
router.patch('/preferences', protect, async (request, response, next) => {
  try {
    const preferences = await require('../services/applicationPreferences').save(request.user.user_id, request.body);
    response.json({ message: 'Preferences saved', ...preferences });
  } catch (error) {
    next(error);
  }
});
// Public
router.post('/register', security.registerRateLimiter,           auth.register);
router.post('/login', security.loginRateLimiter, security.passwordAccountRateLimiter,              auth.login);

// Protected
router.get('/permissions', protect, (request, response, next) =>
  require('../services/database').query(require('../config/db'),
    'SELECT can_request_extension FROM user_permissions WHERE user_id=?', [request.user.user_id])
    .then(([permissions]) => response.json(permissions || { can_request_extension: 0 }))
    .catch(next));
router.get('/me',                  protect, auth.getMe);
router.put('/profile',             protect, auth.updateProfile);
router.put('/change-password',     protect, auth.changePassword);
router.post('/refresh',            protect, auth.refreshToken);
router.get('/profile/id-card.pdf', protect, auth.downloadIdCard);
router.get('/profile/photo', protect, auth.getProfilePhoto);
router.post('/profile/photo',      protect, photoUpload.single('photo'), auth.uploadProfilePhoto);

// Admin: user listing with filters (?search= &dept= &status=)
router.get('/users',               protect, adminOnly, auth.getAllUsers);


// Public endpoint — departments list for registration dropdown (no auth required)
router.get('/departments', async (req, res) => {
  try {
    const db  = require('../config/db');
    const q   = (sql) => new Promise((r,j) => db.query(sql,[],(e,rows)=>e?j(e):r(rows)));
    const rows = await q('SELECT dept_id, dept_name FROM departments WHERE 1=1 ORDER BY dept_name');
    res.json(rows);
  } catch(e) { res.status(500).json({ message: 'Could not fetch departments' }); }
});

module.exports = router;
