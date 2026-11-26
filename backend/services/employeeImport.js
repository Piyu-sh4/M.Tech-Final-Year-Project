const bcrypt = require('bcryptjs');
const { randomBytes } = require('node:crypto');
const database = require('../config/db');
const { query } = require('./database');

const failure = (status, message) => Object.assign(new Error(message), { status });
const lockedPassword = () => bcrypt.hash(randomBytes(32).toString('base64url'), 10);

function employeeIdentity(row) {
  const name = row?.full_name || row?.name || row?.['Full Name'];
  const email = row?.email || row?.Email;
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100 ||
      typeof email !== 'string' || email.trim().length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw failure(400, 'Enter a valid name and email.');
  }
  return { full_name: name.trim(), email: email.trim().toLowerCase() };
}

async function createPendingEmployee(row) {
  const employee = employeeIdentity(row);
  const { password } = row;
  if (password !== undefined && (typeof password !== 'string' || password.length < 8 ||
      Buffer.byteLength(password) > 72 || !/[A-Z]/.test(password) || !/\d/.test(password))) {
    throw Object.assign(new Error('Use at least 8 characters with an uppercase letter and a number.'), { status: 400 });
  }

  // File imports may omit passwords. A unique, undisclosed value keeps those accounts
  // inaccessible until an administrator explicitly sets their first password.
  const hash = password === undefined ? await lockedPassword() : await bcrypt.hash(password, 10);
  await query(database, `INSERT INTO users (full_name,email,password_hash,role_id,status,designation,department_id)
    VALUES (?,?,?,2,'pending',?,?)`,
    [employee.full_name, employee.email, hash, row.designation || null, row.department_id || null]);
}

const importColumns = new Set(['full_name', 'email', 'designation', 'department', 'company']);

function optionalText(value, label) {
  if (value == null) return '';
  if (typeof value !== 'string' || value.trim().length > 100)
    throw failure(400, label + ' must be text up to 100 characters.');
  return value.trim();
}

async function inspectEmployees(rows) {
  if (!Array.isArray(rows) || !rows.length || rows.length > 50)
    throw failure(400, 'Choose a spreadsheet with 1 to 50 employee rows.');

  const [departments, companies] = await Promise.all([
    query(database, 'SELECT dept_id,dept_name FROM departments'),
    query(database, 'SELECT company_id,name FROM companies WHERE is_active=1')
  ]);
  const departmentByName = new Map(departments.map(item => [item.dept_name.toLowerCase(), item]));
  const companyByName = new Map(companies.map(item => [item.name.toLowerCase(), item]));
  const seen = new Set();
  const preview = rows.map((row, index) => {
    const item = { row_number: index + 1 };
    try {
      if (!row || typeof row !== 'object' || Array.isArray(row) || Object.keys(row).some(key => !importColumns.has(key)))
        throw failure(400, 'Use only the columns in the employee template.');
      Object.assign(item, employeeIdentity(row));
      if (seen.has(item.email)) throw failure(400, 'This email is repeated in the file.');
      seen.add(item.email);
      item.designation = optionalText(row.designation, 'Job title');
      const department = optionalText(row.department, 'Department');
      const company = optionalText(row.company, 'Company');
      const departmentRecord = departmentByName.get(department.toLowerCase());
      const companyRecord = companyByName.get(company.toLowerCase());
      if (department && !departmentRecord) throw failure(400, 'Department was not found.');
      if (company && !companyRecord) throw failure(400, 'Active company was not found.');
      item.department = departmentRecord?.dept_name || '';
      item.company = companyRecord?.name || '';
      item.department_id = departmentRecord?.dept_id ?? null;
      item.company_id = companyRecord?.company_id ?? null;
    } catch (error) {
      if (error.status !== 400) throw error;
      item.error = error.message;
    }
    return item;
  });

  if (seen.size) {
    const existing = new Set((await query(database, 'SELECT email FROM users WHERE email IN (?)', [[...seen]]))
      .map(row => row.email.toLowerCase()));
    for (const row of preview) {
      if (!row.error && existing.has(row.email)) row.error = 'This email already has an account.';
    }
  }
  return preview;
}

async function importEmployeeBatch(rows) {
  const preview = await inspectEmployees(rows);
  if (preview.some(row => row.error)) throw failure(409, 'Correct the spreadsheet errors and preview the file again.');
  const values = [];
  for (const {full_name, email, designation, department_id, company_id} of preview) {
    values.push([full_name, email, await lockedPassword(), 2, 'pending', designation || null, department_id, company_id]);
  }
  try {
    // One INSERT makes the batch atomic, including a duplicate created after preview.
    const result = await query(database, `INSERT INTO users
      (full_name,email,password_hash,role_id,status,designation,department_id,company_id) VALUES ?`, [values]);
    return result.affectedRows;
  } catch (error) {
    if (['ER_DUP_ENTRY','ER_NO_REFERENCED_ROW_2'].includes(error.code))
      throw failure(409, 'The employee directory changed. Preview the file again before importing.');
    throw error;
  }
}

module.exports = { createPendingEmployee, inspectEmployees, importEmployeeBatch };
