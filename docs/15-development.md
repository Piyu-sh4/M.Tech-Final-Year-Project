> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# 👨‍💻 Development Guide — Workforce Intelligence

## Project Structure

```
workforce-intelligence/
├── frontend/                  # 121 HTML pages (Vanilla JS, no build step)
│   ├── admin-dashboard.html
│   ├── employee-dashboard.html
│   ├── salary.html
│   └── ... (118 more pages)
├── backend/
│   ├── routes/                # Express route handlers
│   │   ├── auth.routes.js
│   │   ├── payroll.routes.js
│   │   ├── attendance.routes.js
│   │   └── ... (20+ route files)
│   ├── controllers/           # Business logic
│   ├── models/                # MySQL table models
│   ├── middleware/            # Auth, rate limit, upload, etc.
│   ├── services/              # Payroll calculator, AI service, email
│   ├── utils/                 # Helpers: date, currency, validators
│   └── config/                # DB, Redis, environment config
├── docs/                      # Project documentation (this folder)
├── migrations/                # Database migration files
├── seeds/                     # Sample data seeders
├── tests/                     # Unit + integration + E2E tests
├── uploads/                   # User uploaded files (gitignored)
├── .env.example               # Environment template
├── docker-compose.yml         # Docker services
├── package.json
└── server.js                  # Express app entry point
```

## Development Workflow

### Starting Dev Environment
```bash
# Terminal 1: Start Docker services (MySQL + Redis)
docker compose up mysql redis -d

# Terminal 2: Start Node.js in dev mode (auto-reload)
npm run dev

# Terminal 3: Watch frontend changes (optional live reload)
npx browser-sync start --server frontend --files "frontend/**/*"
```

### Adding a New Page
```bash
# 1. Copy the template page
cp frontend/_template.html frontend/my-new-page.html

# 2. The template includes:
#    - WFI sidebar with all nav links
#    - Dark mode toggle (#dmt)
#    - Cookie banner (#ckb)
#    - Toast notification (#toast)
#    - wfi-utils script (dlPrint, dlCSV, showTab, etc.)

# 3. Add your content inside <div class="wiq-main">

# 4. Add to sidebar nav (in _template.html and propagate)
# 5. Add backend route if needed
# 6. Run audit to verify
npm run audit:page my-new-page.html
```

### Page Template Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Page Title — Workforce Intelligence</title>
  <style>/* page-specific styles */</style>
</head>
<body>
  <!-- Mobile sidebar toggle -->
  <button class="wiq-mob-toggle" onclick="openMobSidebar()">☰</button>

  <div class="wiq-wrap">
    <!-- Sidebar (copy from any existing page) -->
    <div class="wiq-sidebar" id="wiqSidebar">...</div>

    <!-- Main content -->
    <div class="wiq-main">
      <!-- Export bar (optional) -->
      <div class="export-bar">
        <button onclick="window.dlPrint('Title','<table>...</table>')">🖨️ Print</button>
        <button onclick="window.dlCSV(rows,headers,'filename')">⬇️ CSV</button>
      </div>

      <!-- Your content here -->
    </div>
  </div>

  <!-- Toast -->
  <div id="toast" class="toast"></div>

  <!-- Cookie banner -->
  <div id="ckb" class="cookie-banner">...</div>

  <!-- wfi-utils (always last) -->
  <script id="wfi-utils">...</script>
</body>
</html>
```

## API Development

### Route Pattern
```js
// backend/routes/payroll.routes.js
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { runPayroll, getPayslip } = require('../controllers/payroll.controller');

router.post('/run',     auth(['admin','hr']), runPayroll);
router.get('/payslip/:empId/:month', auth(), getPayslip);

module.exports = router;
```

### Controller Pattern
```js
// backend/controllers/payroll.controller.js
const db = require('../config/database');

exports.runPayroll = async (req, res) => {
  try {
    const { month, year } = req.body;
    // validation
    if (!month || !year) return res.status(400).json({ success: false, error: 'Month and year required' });

    // business logic
    const result = await payrollService.calculate(month, year);

    // audit log
    await db.query('INSERT INTO audit_log (action, user_id, details) VALUES (?,?,?)',
      ['PAYROLL_RUN', req.user.id, JSON.stringify({ month, year, total: result.total })]);

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Payroll run error:', err);
    res.status(500).json({ success: false, error: 'Payroll processing failed' });
  }
};
```

### Auth Middleware
```js
// Usage: auth(['admin', 'hr']) — role array
// Usage: auth() — any authenticated user
// Usage: auth(['admin']) — admin only
```

## Frontend Development

### Using Global Utilities
```js
// Toast notification
window.st('Payroll processed successfully!', true);   // success (green)
window.st('Error: Invalid payroll period', false);    // error (red)

// Print report
window.dlPrint('Payroll Report — Sep 2026',
  '<table><tr><th>Employee</th><th>Net Pay</th></tr>...</table>');

// Download CSV
window.dlCSV(
  [{name:'Priya', net:'80900'}, {name:'Ravi', net:'101800'}],
  ['name', 'net'],
  'payroll_sep_2026'
);

// Tab switching (works with camelCase IDs like tabOverview, tabDetails)
window.showTab('overview', buttonElement);

// Logout
window.logout();  // clears localStorage, redirects to login.html
```

### Dark Mode
```js
// Toggle via button
window.tdm();  // or window.toggleDarkMode()

// Check current state
const isDark = document.body.classList.contains('dark-mode');

// Auto-apply saved preference (already in wfi-utils)
if(localStorage.getItem('wfi_dark_mode')==='1') document.body.classList.add('dark-mode');
```

### Making API Calls
```js
// Standard pattern used across all pages
async function loadPayrollData() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/payroll/summary?month=09&year=2026', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    renderPayrollTable(data.data);
  } catch (err) {
    window.st('Failed to load payroll data: ' + err.message, false);
  }
}
```

## Payroll Service (Critical)

```js
// backend/services/payroll.service.js

// PF calculation
const PF_EMPLOYEE_RATE = 0.12;      // 12% of Basic+DA
const PF_EMPLOYER_RATE = 0.1361;    // 13.61% (EPF+EPS+EDLI+admin)
const PF_WAGE_CEILING  = 15000;     // Statutory ceiling

// ESI calculation
const ESI_EMPLOYEE_RATE = 0.0075;   // 0.75%
const ESI_EMPLOYER_RATE = 0.0325;   // 3.25%
const ESI_WAGE_CEILING  = 21000;    // Eligible if gross ≤ ₹21,000

// Gratuity
// (Basic + DA) × 15/26 × Years_of_Service

// All monetary values in paise (integers) to avoid floating-point errors
// Display with: (paise / 100).toFixed(2) → "₹ 80,900.00"
```
