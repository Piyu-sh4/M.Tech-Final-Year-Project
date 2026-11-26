/**
 * userModel.js — User Database Model v6.0
 * Added: designation, join_date, employment_type, gender, shift
 */
const db = require('../config/db');

exports.findByEmail = (email, cb) =>
  db.query('SELECT * FROM users WHERE email=?', [email], cb);

exports.createUser = (data, cb) =>
  db.query(
    `INSERT INTO users (full_name, email, password_hash, role_id, status,
       designation, join_date, employment_type, gender, phone)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [data.full_name, data.email, data.password_hash, data.role_id,
     data.status || 'pending', data.designation || null,
     data.join_date || null, data.employment_type || 'full_time',
     data.gender || null, data.phone || null],
    cb
  );

exports.getAllUsers = (cb) =>
  db.query(
    `SELECT u.user_id, u.full_name, u.email, u.role_id, u.access_level,
            u.total_points, u.status, u.designation, u.department_id,
            u.join_date, u.employment_type, u.gender, u.last_login,
            u.created_at, r.role_name, d.dept_name
     FROM users u
     JOIN roles r ON u.role_id = r.role_id
     LEFT JOIN departments d ON u.department_id = d.dept_id
     ORDER BY u.created_at DESC`,
    cb
  );

exports.getUserById = (user_id, cb) =>
  db.query(
    `SELECT u.user_id, u.full_name, u.email, u.role_id, u.access_level,
            u.total_points, u.created_at, u.status, u.department_id,
            u.base_salary, u.phone, u.last_login, u.profile_notes, u.photo_url,
            u.designation, u.join_date, u.employment_type, u.gender,
            u.date_of_birth, u.address, u.emergency_contact,
            r.role_name, d.dept_name, s.shift_name,u.company_id,companies.name company_name
     FROM users u
     JOIN roles r ON u.role_id = r.role_id
     LEFT JOIN departments d ON u.department_id = d.dept_id
     LEFT JOIN companies ON companies.company_id=u.company_id
     LEFT JOIN shifts s ON u.shift_id = s.shift_id
     WHERE u.user_id = ?`,
    [user_id], cb
  );

exports.updateUser = (user_id, data, cb) =>
  db.query(
    `UPDATE users SET full_name=?, phone=?, profile_notes=?,
       gender=?, designation=?, join_date=?,
       employment_type=?, shift_id=?
     WHERE user_id=?`,
    [data.full_name, data.phone || null, data.profile_notes || null,
     data.gender || null, data.designation || null,
     data.join_date || null, data.employment_type || 'full_time',
     data.shift_id || null, user_id],
    cb
  );

exports.updatePassword = (user_id, hash, cb) =>
  db.query('UPDATE users SET password_hash=? WHERE user_id=?', [hash, user_id], cb);

exports.updateLastLogin = (user_id) =>
  db.query('UPDATE users SET last_login=NOW() WHERE user_id=?', [user_id], () => {});
