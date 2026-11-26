/**
 * authController.js — v6.0 FIXED
 *
 * REGISTRATION BUGS FIXED:
 *  1. Added phone field to INSERT so it saves correctly
 *  2. Seeds user_permissions for ALL new users (not just admins)
 *  3. Seeds leave_balances for ALL approved + pending users after admin approves
 *  4. Stronger error logging so DB errors surface clearly
 *  5. Public registration assigns the employee role
 *  6. Trimmed inputs to prevent whitespace issues
 */
const bcrypt = require('bcryptjs');
const SALT_ROUNDS = 12;
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');
const User   = require('../models/userModel');

function query(sql, p) {
  return new Promise((resolve, reject) =>
    db.query(sql, p || [], (err, res) => {
      if (err) {
        console.error('[DB ERROR]', sql.slice(0, 80), err.message);
        reject(err);
      } else {
        resolve(res);
      }
    })
  );
}

const SECRET=()=>{if(!process.env.JWT_SECRET)throw new Error('JWT_SECRET is not configured');return process.env.JWT_SECRET;};
async function issueSession(user,req,existingSession) {
  const session = existingSession || require('node:crypto').randomBytes(32).toString('hex');
  const token = jwt.sign({user_id:user.user_id,email:user.email,role_id:user.role_id,jti:session},SECRET(),
    {expiresIn:process.env.JWT_EXPIRES_IN || '8h'});
  const expiry = jwt.decode(token).exp;
  if (existingSession) {
    const result = await query(`UPDATE user_sessions SET expires_at=FROM_UNIXTIME(?),last_active=NOW()
      WHERE session_id=? AND user_id=? AND revoked_at IS NULL AND expires_at>NOW()`,[expiry,session,user.user_id]);
    if (!result.affectedRows) throw Object.assign(new Error('This session has ended. Please sign in again.'),{status:401});
  } else {
    const agent = String(req.headers['user-agent'] || 'API client').slice(0,300);
    await query(`INSERT INTO user_sessions (session_id,user_id,device_info,browser,os,ip_address,expires_at)
      VALUES (?,?,?,?,?,?,FROM_UNIXTIME(?))`,[session,user.user_id,agent,
      agent.match(/Edg|Chrome|Firefox|Safari/i)?.[0] || 'API client',
      agent.match(/Windows|Android|iPhone|iPad|Macintosh|Linux/i)?.[0] || null,require('../services/requestIdentity').clientIp(req),expiry]);
  }
  return token;
}

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/;

/* ─────────────────────────────────────────────────────────────
   REGISTER — FIXED
   ───────────────────────────────────────────────────────────── */
exports.register = async (req, res) => {
  try {
    if(['full_name','email','password'].some(key=>typeof req.body[key]!=='string'))return res.status(400).json({message:'Name, email and password must be text.'});
    if(req.body.full_name.length>100 || req.body.email.length>120 || Buffer.byteLength(req.body.password)>72)return res.status(400).json({message:'Name or email is too long, or password exceeds 72 bytes.'});
    // 1. Parse and trim all inputs
    const full_name = (req.body.full_name || '').trim();
    const email     = (req.body.email     || '').trim().toLowerCase();
    const password  = (req.body.password  || '');
    const phone     = (req.body.phone     || '').trim() || null;
    const role_id   = 2;

    // 2. Validate required fields
    if (!full_name || !email || !password)
      return res.status(400).json({ message: 'full_name, email and password are required' });

    // 3. Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: 'Invalid email address' });

    // 4. Validate password policy
    if (!PASSWORD_REGEX.test(password))
      return res.status(400).json({
        message: 'Password must be at least 8 characters with at least 1 uppercase letter and 1 number'
      });

    // 6. Check duplicate email
    const existing = await query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length)
      return res.status(409).json({ message: 'This email is already registered. Try logging in.' });

    // 7. Hash password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Public registration always requires approval.
    const status = 'pending';

    // 9. Parse all enhanced registration fields
    const department_id = null;
    const designation            = (req.body.designation            || '').trim() || null;
    const reg_grade_level = null;
    const office_location        = (req.body.office_location        || '').trim() || null;
    const employment_type        = (req.body.employment_type        || 'full_time');
    const work_mode              = (req.body.work_mode              || 'office');
    const reporting_manager_id = null;
    const emergency_contact_name = (req.body.emergency_name         || '').trim() || null;
    const emergency_contact_phone= (req.body.emergency_phone        || '').trim() || null;
    // Legacy single field for backward compat
    const emergency_contact = emergency_contact_name
      ? `${emergency_contact_name}${emergency_contact_phone ? ' — ' + emergency_contact_phone : ''}`
      : null;

    const companyId=Number(req.body.company_id || 1);
    if(!Number.isInteger(companyId)||companyId<1)return res.status(400).json({message:'Select an active company.'});
    const [company]=await query('SELECT company_id FROM companies WHERE company_id=? AND is_active=1',[companyId]);
    if(!company)return res.status(400).json({message:'Select an active company.'});
    // INSERT user — all fields
    const result = await query(
      `INSERT INTO users
         (full_name, email, password_hash, role_id, status, phone,
          department_id, designation, reg_grade_level, office_location,
          employment_type, work_mode, reporting_manager_id,
          emergency_contact, emergency_contact_name, emergency_contact_phone,company_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [full_name, email, password_hash, role_id, status, phone,
       department_id, designation, reg_grade_level, office_location,
       employment_type, work_mode, reporting_manager_id,
       emergency_contact, emergency_contact_name, emergency_contact_phone,companyId]
    );

    const user_id = result.insertId;
    console.log(`[REGISTER] New user: ${full_name} <${email}> role=${role_id} status=${status} id=${user_id}`);

    // 10. Seed user_permissions for EVERY new user (even pending — admin will see them)
    await query(
      `INSERT IGNORE INTO user_permissions (user_id, updated_by) VALUES (?, ?)`,
      [user_id, user_id]
    ).catch(e => console.warn('[REGISTER] permissions seed skipped:', e.message));

    // 11. If immediately active (Admin), seed leave balances too
    if (status === 'active') {
      await seedLeaveBalances(user_id);
    }

    res.status(201).json({
      success: true,
      message: status === 'pending'
        ? 'Registration submitted! An admin will review and approve your account. You can login once approved.'
        : 'Account created successfully! You can now login.',
      user_id,
      status
    });

  } catch (err) {
    console.error('[REGISTER ERROR]', err.message);
    // Return the actual DB error in dev so it's diagnosable
    res.status(500).json({
      message: 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'production' ? undefined : err.message
    });
  }
};

/* Helper: seed leave balances for a newly approved user */
async function seedLeaveBalances(user_id) {
  const year  = new Date().getFullYear();
  const types = [
    ['sick',   12],
    ['casual', 12],
    ['earned', 15],
    ['unpaid',  0],
    ['other',   0]
  ];
  for (const [leave_type, entitled] of types) {
    await query(
      `INSERT IGNORE INTO leave_balances (user_id, year, leave_type, entitled)
       VALUES (?, ?, ?, ?)`,
      [user_id, year, leave_type, entitled]
    ).catch(e => console.warn('[REGISTER] leave_balance seed skipped:', e.message));
  }
}
exports.seedLeaveBalances = seedLeaveBalances; // exported for use in adminController approveUser

/* ─────────────────────────────────────────────────────────────
   LOGIN
   ───────────────────────────────────────────────────────────── */
exports.login = (req, res) => {
  if (typeof req.body.email !== 'string' || typeof req.body.password !== 'string') return res.status(400).json({message:'Enter an email address and password.'});
  const email    = (req.body.email    || '').trim().toLowerCase();
  const password = (req.body.password || '');

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  User.findByEmail(email, async (err, results) => {
    if (err) {
      console.error('Login lookup failed:', err.code);
      return res.status(500).json({ message: 'Login error' });
    }
    const [user] = results;
    // Compare a fixed dummy hash for unknown accounts to keep lookup timing comparable.
    const dummyHash = '$2a$12$5TphvfIW4WIadcniTH2WsuuU.f9QC7qKnR/OnYqCV2w0Cg7NY0uM6';
    if (!(await bcrypt.compare(password, user?.password_hash || dummyHash)) || !user)
      return res.status(401).json({ message: 'Email or password is incorrect.' });

    if (user.status === 'pending')
      return res.status(403).json({
        message: 'Your account is pending admin approval. Please wait or contact your HR team.'
      });
    if (user.status === 'suspended')
      return res.status(403).json({
        message: 'Your account has been suspended. Please contact your administrator.'
      });

    if (user.status !== 'active') return res.status(403).json({message:'This account is not active.'});

    // Update last login
    db.query('UPDATE users SET last_login = NOW() WHERE user_id = ?', [user.user_id], () => {});

    try {
      const token = await issueSession(user,req);

    res.json({
      message: 'Login successful',
      token,
      user: {
        user_id:      user.user_id,
        full_name:    user.full_name,
        email:        user.email,
        role_id:      user.role_id,
        access_level: user.access_level  || 1,
        total_points: user.total_points  || 0,
        designation:  user.designation   || null,
        department_id:user.department_id || null
      }
    });
    } catch (error) { res.status(500).json({message:'Could not create a login session.'}); }
  });
};

/* ─────────────────────────────────────────────────────────────
   GET ME
   ───────────────────────────────────────────────────────────── */
exports.getMe = (req, res) => {
  User.getUserById(req.user.user_id, (err, results) => {
    if (err || !results.length)
      return res.status(500).json({ message: 'Could not fetch profile' });
    const u = results[0];
    res.json({
      user_id:        u.user_id,
      full_name:      u.full_name,
      email:          u.email,
      role_id:        u.role_id,
      role_name:      u.role_name,
      access_level:   u.access_level   || 1,
      total_points:   u.total_points   || 0,
      department_id:  u.department_id  || null,
      dept_name:      u.dept_name      || null,
      department_name:u.dept_name      || null,
      company_id:u.company_id,company_name:u.company_name,
      base_salary:    u.base_salary    || 0,
      phone:          u.phone          || null,
      status:         u.status         || 'active',
      designation:    u.designation    || null,
      join_date:      u.join_date      || null,
      employment_type:u.employment_type|| 'full_time',
      gender:         u.gender         || null,
      date_of_birth:  u.date_of_birth  || null,
      address:        u.address        || null,
      emergency_contact: u.emergency_contact || null,
      shift_name:     u.shift_name     || null,
      last_login:     u.last_login     || null,
      profile_notes:  u.profile_notes  || null,
      photo_url:      u.photo_url ? '/api/auth/profile/photo' : null,
      employee_code: u.employee_code || null
    });
  });
};

/* ─────────────────────────────────────────────────────────────
   GET ALL USERS (admin only, with search/filter)
   ───────────────────────────────────────────────────────────── */
exports.getAllUsers = async (req, res) => {
  try {
    const { search, status, dept } = req.query;
    let sql = `
      SELECT u.user_id, u.full_name, u.email, u.role_id, u.access_level,
             u.total_points, u.status, u.department_id, u.designation,
             u.phone, u.last_login, u.created_at, r.role_name, d.dept_name
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN departments d ON u.department_id = d.dept_id
      WHERE 1=1`;
    const params = [];
    if (search) { sql += ' AND (u.full_name LIKE ? OR u.email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (status) { sql += ' AND u.status = ?'; params.push(status); }
    if (dept)   { sql += ' AND u.department_id = ?'; params.push(dept); }
    sql += ' ORDER BY u.created_at DESC';
    res.json(await query(sql, params));
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch users', error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   UPDATE PROFILE
   ───────────────────────────────────────────────────────────── */
exports.updateProfile = async (req, res) => {
  try {
    const { full_name, phone, profile_notes, gender, address, emergency_contact } = req.body;
    if (typeof full_name !== 'string' || !full_name.trim() || full_name.length > 100)
      return res.status(400).json({ message: 'Enter a name up to 100 characters.' });
    const bankingFields = ['bank_name', 'account_number', 'ifsc_code', 'account_holder_name', 'account_type'];
    if (bankingFields.some(field => Object.hasOwn(req.body, field)))
      return res.status(400).json({ message: 'Manage account details under Banking.' });
    await query(
      `UPDATE users SET full_name=?, phone=?, profile_notes=?, gender=?,
       address=?, emergency_contact=? WHERE user_id=?`,
      [full_name.trim(), phone || null, profile_notes || null, gender || null,
       address || null, emergency_contact || null, req.user.user_id]
    );
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Profile update failed', error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   CHANGE PASSWORD
   ───────────────────────────────────────────────────────────── */
exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password)
      return res.status(400).json({ message: 'current_password and new_password are required' });
    if (!PASSWORD_REGEX.test(new_password))
      return res.status(400).json({
        message: 'New password must be at least 8 characters with 1 uppercase letter and 1 number'
      });
    const rows = await query('SELECT password_hash FROM users WHERE user_id=?', [req.user.user_id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    if (!bcrypt.compareSync(current_password, rows[0].password_hash))
      return res.status(401).json({ message: 'Current password is incorrect' });
    await query('UPDATE users SET password_hash=? WHERE user_id=?',
      [bcrypt.hashSync(new_password, SALT_ROUNDS), req.user.user_id]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Password update failed', error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   REFRESH TOKEN
   ───────────────────────────────────────────────────────────── */
exports.refreshToken = async (req, res) => {
  try {
    const rows = await query('SELECT * FROM users WHERE user_id=?', [req.user.user_id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    const u = rows[0];
    if (u.status !== 'active') return res.status(403).json({ message: 'Account is not active' });
    db.query('UPDATE users SET last_login=NOW() WHERE user_id=?', [u.user_id], () => {});
    const token = await issueSession(u,req,req.user.jti);
    res.json({ token, message: 'Token refreshed successfully' });
  } catch (err) {
    res.status(err.status || 500).json({message:err.status ? err.message : 'Token refresh failed'});
  }
};

exports.logout = async (req,res,next) => {
  try {
    const sessionId = req.user.jti;
    const revoked = sessionId && await query(
      'UPDATE user_sessions SET revoked_at=NOW() WHERE session_id=? AND user_id=? AND revoked_at IS NULL',
      [sessionId, req.user.user_id]
    );
    require('../socketServer').disconnectSession(sessionId);
    const receipt = revoked?.affectedRows && req.body?.offer_feedback === true ?
      require('../services/signOutFeedback').offer(sessionId) : undefined;
    res.json({ message: 'Signed out', receipt });
  } catch (error) { next(error); }
};

exports.revokeSession = async (req,res,next) => {
  try {
    const result = await query('UPDATE user_sessions SET revoked_at=NOW() WHERE session_id=? AND user_id=? AND revoked_at IS NULL',[req.params.id,req.user.user_id]);
    if (!result.affectedRows) return res.status(404).json({message:'Session not found or already revoked.'});
    require('../socketServer').disconnectSession(req.params.id);
    res.json({message:'Session revoked'});
  } catch (error) { next(error); }
};

/* ─────────────────────────────────────────────────────────────
   UPLOAD PROFILE PHOTO
   ───────────────────────────────────────────────────────────── */
const profileFiles = require('../services/uploadFiles');
const unlink = require('node:fs/promises').unlink;

exports.getProfilePhoto = async (request, response, next) => {
  try {
    const [profile] = await query('SELECT photo_url FROM users WHERE user_id=?', [request.user.user_id]);
    const filename = profileFiles.storedPath(profile?.photo_url, 'photos');
    if (!filename) return response.status(404).json({ message: 'No profile photo.' });
    const image = await profileFiles.readFile(filename);
    const format = profileFiles.imageExtension(image);
    if (!format) return response.status(404).json({ message: 'No supported profile photo.' });
    response.type(format === 'jpg' ? 'image/jpeg' : 'image/' + format);
    response.attachment('profile.' + format).send(image);
  } catch (error) {
    if (error.code === 'ENOENT') return response.status(404).json({ message: 'No profile photo.' });
    next(error);
  }
};

exports.uploadProfilePhoto = async (request, response, next) => {
  const bytes = request.file?.buffer;
  const extension = bytes && profileFiles.imageExtension(bytes);
  if (!extension) return response.status(400).json({ message: 'Choose a JPEG, PNG, or WebP image.' });
  let photo;
  try {
    photo = await profileFiles.storeUpload('photos', bytes, extension);
    await query('UPDATE users SET photo_url=? WHERE user_id=?', [photo.url, request.user.user_id]);
    response.json({ message: 'Profile photo updated', photo_url: '/api/auth/profile/photo' });
  } catch (error) {
    if (photo) await unlink(photo.path).catch(() => {});
    next(error);
  }
};

let activeIdCardExports = 0;
exports.downloadIdCard = async (request, response, next) => {
  if (activeIdCardExports >= 2)
    return response.status(503).json({ message: 'ID card downloads are busy. Try again shortly.' });
  activeIdCardExports++;
  try {
    const [profile] = await new Promise((resolve, reject) =>
      User.getUserById(request.user.user_id, (error, rows) => error ? reject(error) : resolve(rows)));
    if (!profile) return response.status(404).json({ message: 'Profile not found.' });
    const pdf = await require('../services/employeeIdCard').renderEmployeeIdCard(profile);
    response.attachment('employee-id-card.pdf').type('application/pdf').send(pdf);
  } catch (error) {
    next(error);
  } finally {
    activeIdCardExports--;
  }
};

// Shared only with verified passkey login; callers must first verify the authenticator.
exports.issueVerifiedSession=issueSession;
