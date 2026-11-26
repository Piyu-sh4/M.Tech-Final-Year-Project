> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# RULES.md — Workforce Intelligence
## Coding Standards, Conventions & Development Rules

**Version:** 12.0 | **Date:** July 2026  
**Applies to:** All contributors and AI code generation

---

## 1. General Rules

### 1.1 Non-negotiable Rules
- **NEVER** store passwords in plain text — always bcrypt SALT=12
- **NEVER** use raw SQL string concatenation — always parameterised queries
- **NEVER** commit `.env` file to version control
- **NEVER** expose JWT_SECRET, DB_PASSWORD, or ANTHROPIC_API_KEY in frontend code
- **NEVER** disable CORS for all origins in production (`*` only allowed in dev)
- **NEVER** skip `authMiddleware` on any protected route
- **ALWAYS** run Playwright audit after any frontend change — must show 0 JS errors
- **ALWAYS** sanitise user input before storing or returning it

### 1.2 File Naming
```
Backend:
  controllers/  → camelCase + Controller suffix    e.g. leaveController.js
  routes/       → camelCase + .routes.js suffix    e.g. leave.routes.js
  services/     → camelCase + Service suffix       e.g. ragService.js
  middleware/   → camelCase + Middleware suffix     e.g. authMiddleware.js

Frontend:
  Pages         → kebab-case.html                  e.g. leave-portal.html
  Sections      → descriptive name                 e.g. <!-- Leave Application Form -->
```

---

## 2. JavaScript / Node.js Rules

### 2.1 Syntax
```javascript
// ✅ CORRECT — ES2022, async/await, const/let
const getEmployee = async (req, res) => {
  try {
    const { empId } = req.params;
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [empId]);
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ❌ WRONG — var, callback hell, string concatenation
var empId = req.params.empId;
pool.query('SELECT * FROM users WHERE id = ' + empId, function(err, rows) { ... });
```

### 2.2 Error Handling
```javascript
// Every async controller must have try/catch
// Every catch must return a proper HTTP error code

try {
  // ... logic
} catch (err) {
  console.error('[MODULE_NAME]', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
}
```

### 2.3 MySQL Queries
```javascript
// ✅ Parameterised — always
const [rows] = await pool.query(
  'SELECT * FROM leave_requests WHERE user_id = ? AND status = ?',
  [userId, 'pending']
);

// ✅ Transactions for multi-table writes
const conn = await pool.getConnection();
await conn.beginTransaction();
try {
  await conn.query('INSERT INTO ...', [...]);
  await conn.query('UPDATE ...', [...]);
  await conn.commit();
} catch (e) {
  await conn.rollback();
  throw e;
} finally {
  conn.release();
}
```

### 2.4 Response Format
```javascript
// Success
res.json({ success: true, data: rows, message: 'Records fetched' });

// Error
res.status(400).json({ success: false, error: 'Validation failed', details: '...' });

// List
res.json({ success: true, data: rows, total: rows.length, page: 1 });
```

---

## 3. Frontend Rules

### 3.1 JavaScript
```javascript
// ✅ Non-ASCII chars in JS strings — use unicode escapes
showToast('Leave applied \u2705', true);      // NOT: 'Leave applied ✅'
showToast('Cost: \u20b944,000', true);        // NOT: 'Cost: ₹44,000'
showToast('Formula: Basic \u00f7 26', true);  // NOT: 'Formula: Basic ÷ 26'

// ✅ getElementById — always null-check
const el = document.getElementById('myInput');
if (el) el.value = 'hello';

// ✅ Template literals — no nested backticks in same scope
// ❌ WRONG:
const html = `<span>${items.map(i => `<b>${i}</b>`).join('')}</span>`;
// ✅ CORRECT: break out inner template
const innerHtml = items.map(i => '<b>' + i + '</b>').join('');
const html = `<span>${innerHtml}</span>`;

// ✅ Declare variables — const/let, never var in modern code
// Exception: when re-declaration might occur across script blocks → use var
```

### 3.2 API Calls
```javascript
// Standard API call pattern
const API = localStorage.getItem('apiUrl') || 'http://localhost:5000/api';
const token = localStorage.getItem('token');

async function fetchData(endpoint) {
  try {
    const res = await fetch(`${API}${endpoint}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (err) {
    showToast('Error loading data', false);
    console.error(err);
    return null;
  }
}
```

### 3.3 CSV Export (standard pattern)
```javascript
// Every data table must have a CSV export function
function dlCSV(data, headers, filename) {
  const rows = [headers.join(',')];
  data.forEach(row => {
    rows.push(headers.map(h => '"' + (row[h] || '') + '"').join(','));
  });
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename + '_' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
}
```

### 3.4 Toast Notifications
```javascript
// Standard toast — must exist on every page
function showToast(msg, ok, type) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast ' + (ok ? 'toast-ok' : 'toast-err');
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 3500);
}
```

### 3.5 Print/PDF (dlPrint)
```javascript
// Standard dlPrint — safe string concatenation, no long template literals
function dlPrint(title, html) {
  var w = window.open('', '_blank', 'width=1000,height=750');
  if (!w) { showToast('Allow pop-ups for PDF', false); return; }
  w.document.write(['<!DOCTYPE html><html><head><meta charset="UTF-8"><title>',
    title, '</title><style>body{font-family:Arial,sans-serif;padding:24px}',
    '@media print{button{display:none}}</style></head><body>',
    '<h2>', title, '</h2><hr>', html, '</body></html>'].join(''));
  w.document.close();
}
```

---

## 4. Security Rules

### 4.1 Authentication
```javascript
// Every protected route MUST use verifyToken middleware
router.get('/salary/:id', verifyToken, checkRole(['admin','hr']), controller.getSalary);

// JWT verification in middleware — always verify, never trust client
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded;
```

### 4.2 Input Validation
```javascript
// Validate and sanitise all inputs
const { email, password } = req.body;
if (!email || !validator.isEmail(email)) {
  return res.status(400).json({ error: 'Valid email required' });
}
if (!password || password.length < 8) {
  return res.status(400).json({ error: 'Password min 8 characters' });
}
const sanitisedEmail = validator.normalizeEmail(email);
```

### 4.3 File Uploads
```javascript
// Allowed MIME types only
const ALLOWED = ['image/jpeg','image/png','application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

if (!ALLOWED.includes(file.mimetype)) {
  return res.status(400).json({ error: 'File type not allowed' });
}
if (file.size > 10 * 1024 * 1024) {
  return res.status(400).json({ error: 'File too large (max 10MB)' });
}
```

---

## 5. Database Rules

### 5.1 Table Conventions
```sql
-- All tables: snake_case, plural
CREATE TABLE leave_requests (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  user_id      INT NOT NULL,
  leave_type   VARCHAR(50) NOT NULL,
  from_date    DATE NOT NULL,
  to_date      DATE NOT NULL,
  status       ENUM('pending','approved','rejected') DEFAULT 'pending',
  reason       TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 5.2 Mandatory Columns
Every table must have:
- `id INT PRIMARY KEY AUTO_INCREMENT`
- `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- `updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`

### 5.3 Audit Rule
Every INSERT/UPDATE/DELETE via API must:
1. Be intercepted by `auditMiddleware.js`
2. Written to `audit_logs` with: actor_id, action, table_name, record_id, before, after, ip, timestamp

---

## 6. Git / Version Control Rules

```bash
# Branch naming
feature/leave-comp-off-feature
bugfix/hr-calendar-double-brace
hotfix/jwt-expiry-fix

# Commit message format
feat: add COMP-OFF application with sandwich rule calculator
fix: remove non-ASCII chars from js strings in 67 pages
docs: add ARCHITECTURE.md and PRD.md
chore: update docker-compose.yml with env_file

# Never commit
.env
node_modules/
*.log
uploads/
```

---

## 7. Testing Rules

```javascript
// Unit test — every controller function
describe('leaveController', () => {
  it('should return 400 if from_date > to_date', async () => {
    const res = await request(app)
      .post('/api/leaves')
      .set('Authorization', 'Bearer ' + mockToken)
      .send({ from_date: '2026-07-25', to_date: '2026-07-20' });
    expect(res.status).toBe(400);
  });
});

// Frontend — Playwright smoke test after every change
// Run: npx playwright test
// Must show: 0 JS errors across all 107 pages
```

---

## 8. Performance Rules

| Rule | Limit |
|---|---|
| API response time | < 300ms for simple queries |
| MySQL query time | < 100ms — add INDEX if slower |
| File size per page | < 150KB HTML |
| Image optimisation | < 100KB per image, WebP preferred |
| JS bundle | Vanilla only — no framework (no React, no Vue, no jQuery) |
| CSS | Inline or `<style>` block — no external CSS file requests |
| Fonts | System fonts only — `'Segoe UI', system-ui, sans-serif` |

---

## 9. Environment Rules

```bash
# .env.example — required variables
JWT_SECRET=<64-char-random-string>      # REQUIRED
DB_HOST=localhost                        # 'db' for Docker
DB_PORT=3306
DB_USER=wfi_user
DB_PASSWORD=P123/                  # Change in production
DB_NAME=workforce_intelligence
PORT=5000
NODE_ENV=production                      # 'development' shows stack traces
ANTHROPIC_API_KEY=sk-ant-...            # Optional — for AI features
CORS_ORIGIN=https://hr.yourcompany.com  # '*' only in dev
RATE_LIMIT_API=300                       # Per 15 min window
RATE_LIMIT_LOGIN=10
MAX_FILE_SIZE_MB=10
SMTP_HOST=smtp.gmail.com               # For email notifications
SMTP_USER=you@gmail.com
SMTP_PASS=app_password
```
