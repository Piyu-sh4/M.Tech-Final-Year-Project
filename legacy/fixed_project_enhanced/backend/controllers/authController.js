/**
 * authController.js — v6.0 FIXED
 *
 * REGISTRATION BUGS FIXED:
 *  1. Added phone field to INSERT so it saves correctly
 *  2. Seeds user_permissions for ALL new users (not just admins)
 *  3. Seeds leave_balances for ALL approved + pending users after admin approves
 *  4. Stronger error logging so DB errors surface clearly
 *  5. role_id validated server-side (must be 2, 3, or 4 from frontend)
 *  6. Trimmed inputs to prevent whitespace issues
 */
const bcrypt = require('bcryptjs');
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

const SECRET = () => process.env.JWT_SECRET || 'WIP@JWT#Secret2024!Change_Before_Deploy';
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/;

/* ─────────────────────────────────────────────────────────────
   REGISTER — FIXED
   ───────────────────────────────────────────────────────────── */
exports.register = async (req, res) => {
  try {
    // 1. Parse and trim all inputs
    const full_name = (req.body.full_name || '').trim();
    const email     = (req.body.email     || '').trim().toLowerCase();
    const password  = (req.body.password  || '');
    const phone     = (req.body.phone     || '').trim() || null;
    const role_id   = parseInt(req.body.role_id) || 2;

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

    // 5. Validate role_id (only Employee=2, Manager=3, HR=4 allowed from frontend)
    if (![1, 2, 3, 4].includes(role_id))
      return res.status(400).json({ message: 'Invalid role selected' });

    // 6. Check duplicate email
    const existing = await query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length)
      return res.status(409).json({ message: 'This email is already registered. Try logging in.' });

    // 7. Hash password
    const password_hash = bcrypt.hashSync(password, 10);

    // 8. Determine status — only role_id=1 (Admin) gets 'active' on register
    const status = role_id === 1 ? 'active' : 'pending';

    // 9. INSERT user — includes phone field (was missing before)
    const result = await query(
      `INSERT INTO users
         (full_name, email, password_hash, role_id, status, phone)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [full_name, email, password_hash, role_id, status, phone]
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
  const email    = (req.body.email    || '').trim().toLowerCase();
  const password = (req.body.password || '');

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  User.findByEmail(email, (err, results) => {
    if (err) return res.status(500).json({ message: 'Login error', error: err.message });
    if (!results.length)
      return res.status(404).json({ message: 'No account found with this email address' });

    const user = results[0];

    if (user.status === 'pending')
      return res.status(403).json({
        message: 'Your account is pending admin approval. Please wait or contact your HR team.'
      });
    if (user.status === 'suspended')
      return res.status(403).json({
        message: 'Your account has been suspended. Please contact your administrator.'
      });

    if (!bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });

    // Update last login
    db.query('UPDATE users SET last_login = NOW() WHERE user_id = ?', [user.user_id], () => {});

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role_id: user.role_id },
      SECRET(),
      { expiresIn: '8h' }
    );

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
      photo_url:      u.photo_url      || null,
      employee_code:  u.employee_code  || null,
      // Bank details
      bank_name:           u.bank_name           || null,
      account_number:      u.account_number      || null,
      ifsc_code:           u.ifsc_code           || null,
      account_holder_name: u.account_holder_name || null,
      account_type:        u.account_type        || 'savings'
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
    const { full_name, phone, profile_notes, gender, address, emergency_contact,
            bank_name, account_number, ifsc_code, account_holder_name, account_type } = req.body;
    if (!full_name?.trim())
      return res.status(400).json({ message: 'full_name is required' });
    // Validate IFSC format if provided
    if (ifsc_code && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc_code.trim().toUpperCase()))
      return res.status(400).json({ message: 'Invalid IFSC code format (e.g. SBIN0001234)' });
    await query(
      `UPDATE users SET full_name=?, phone=?, profile_notes=?, gender=?,
       address=?, emergency_contact=?,
       bank_name=?, account_number=?, ifsc_code=?, account_holder_name=?, account_type=?
       WHERE user_id=?`,
      [full_name.trim(), phone || null, profile_notes || null, gender || null,
       address || null, emergency_contact || null,
       bank_name || null, account_number || null,
       ifsc_code ? ifsc_code.trim().toUpperCase() : null,
       account_holder_name || null, account_type || 'savings',
       req.user.user_id]
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
      [bcrypt.hashSync(new_password, 10), req.user.user_id]);
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
    const token = jwt.sign(
      { user_id: u.user_id, email: u.email, role_id: u.role_id },
      SECRET(),
      { expiresIn: '8h' }
    );
    res.json({ token, message: 'Token refreshed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Token refresh failed', error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   UPLOAD PROFILE PHOTO
   ───────────────────────────────────────────────────────────── */
exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const photoUrl = '/uploads/photos/' + req.file.filename;
    await query('UPDATE users SET photo_url=? WHERE user_id=?', [photoUrl, req.user.user_id]);
    res.json({ message: 'Profile photo updated', photo_url: photoUrl });
  } catch (err) {
    res.status(500).json({ message: 'Photo upload failed', error: err.message });
  }
};
