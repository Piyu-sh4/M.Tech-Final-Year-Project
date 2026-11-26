> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# DESIGN.md — Workforce Intelligence
## Design System & UI/UX Guidelines

**Version:** 12.0 | **Date:** July 2026

---

## 1. Design Philosophy

### Core Principles
1. **Clarity over cleverness** — Every UI element has one obvious purpose
2. **Data density with readability** — HR pages show a lot of data; never sacrifice clarity for space
3. **Indian context** — Rupee symbol ₹, Indian date formats (DD/MM/YYYY), Indian English spellings
4. **Status at a glance** — Every dashboard shows red/amber/green health indicators immediately
5. **Action-oriented** — Every card has at least one primary action (button)
6. **Accessible defaults** — Minimum 4.5:1 contrast ratio, keyboard navigable

---

## 2. Colour System

### Primary Palette
```css
:root {
  /* Brand */
  --primary:      #2563EB;   /* Blue — primary actions, links */
  --primary-dark: #1D4ED8;   /* Blue dark — hover states */
  --primary-light:#EFF6FF;   /* Blue tint — card backgrounds */

  /* Semantic */
  --success:      #059669;   /* Green — approved, compliant, healthy */
  --warning:      #D97706;   /* Amber — pending, at-risk, review needed */
  --danger:       #DC2626;   /* Red — rejected, critical, overdue */
  --info:         #0891B2;   /* Teal — informational, neutral */
  --purple:       #7C3AED;   /* Violet — AI features, premium */

  /* Neutral */
  --text:         #1E293B;   /* Body text */
  --text-muted:   #475569;   /* Secondary text */
  --text-light:   #94A3B8;   /* Placeholder, disabled */
  --border:       #E2E8F0;   /* Card borders, dividers */
  --bg:           #F8FAFC;   /* Page background */
  --bg-card:      #FFFFFF;   /* Card background */
  --bg-hover:     #F1F5F9;   /* Table row hover */

  /* Status backgrounds (used in status chips and alerts) */
  --success-bg:   #F0FDF4;
  --success-border:#BBFABD;  /* actually #BBF7D0 */
  --warning-bg:   #FFFBEB;
  --warning-border:#FDE68A;
  --danger-bg:    #FEF2F2;
  --danger-border:#FECACA;
  --info-bg:      #EFF6FF;
  --info-border:  #BFDBFE;
}
```

### Usage Rules
| Colour | Use For | Never Use For |
|---|---|---|
| Blue (#2563EB) | Primary buttons, active nav, links | Warnings, errors |
| Green (#059669) | Success states, approved, compliant | Buttons |
| Amber (#D97706) | Pending, at-risk, needs review | Primary actions |
| Red (#DC2626) | Rejected, overdue, critical violation | Text links |
| Violet (#7C3AED) | AI features, analytics, HR Copilot | Standard forms |

---

## 3. Typography

```css
/* Font stack — system fonts only (no external requests) */
font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont,
             'Helvetica Neue', Arial, sans-serif;

/* Scale */
.h1        { font-size: 1.5rem;  font-weight: 800; color: #1E293B; }
.h2        { font-size: 1.15rem; font-weight: 700; color: #1E293B; }
.card-title{ font-size: 0.9rem;  font-weight: 700; color: #1E293B; }
.body      { font-size: 0.85rem; font-weight: 400; color: #475569; }
.label     { font-size: 0.75rem; font-weight: 600; color: #64748B; }
.caption   { font-size: 0.68rem; font-weight: 400; color: #94A3B8; }
.micro     { font-size: 0.60rem; font-weight: 600; color: #64748B; }

/* Monospace (for codes, IDs, values) */
font-family: 'Courier New', 'Consolas', monospace;
```

---

## 4. Spacing & Layout

```css
/* Layout grid — sidebar + main content */
.wiq-sidebar  { width: 240px; position: fixed; left: 0; top: 0; bottom: 0; }
.wiq-main     { margin-left: 240px; padding: 24px; min-height: 100vh; }
.wiq-topbar   { height: 56px; position: sticky; top: 0; z-index: 50; }

/* Card system */
.card {
  background:    white;
  border:        1px solid #E2E8F0;
  border-radius: 10px;
  padding:       20px 24px;
  margin-bottom: 16px;
  box-shadow:    0 1px 3px rgba(0,0,0,.06);
}
.card-title {
  font-size:     0.9rem;
  font-weight:   700;
  color:         #1E293B;
  margin-bottom: 16px;
}

/* Spacing scale */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl:48px;

/* Grid layouts */
.grid-2   { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.grid-3   { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
.grid-4   { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
.grid-auto{ display: grid; grid-template-columns: repeat(auto-fill,minmax(200px,1fr)); gap: 14px; }
```

---

## 5. Component Library

### 5.1 Buttons
```html
<!-- Primary — blue, solid fill -->
<button class="btn btn-primary">Apply Leave</button>

<!-- Outline — transparent, blue border -->
<button class="btn btn-outline">Download CSV</button>

<!-- Danger — red, for destructive actions -->
<button class="btn btn-danger">Delete Record</button>

<!-- Small — for table rows and compact cards -->
<button class="btn btn-primary btn-sm">View</button>
```

```css
.btn {
  padding:       8px 18px;
  border-radius: 7px;
  font-size:     0.82rem;
  font-weight:   700;
  cursor:        pointer;
  border:        none;
  transition:    all 0.2s;
}
.btn-primary { background: #2563EB; color: white; }
.btn-primary:hover { background: #1D4ED8; transform: translateY(-1px); }
.btn-outline { background: transparent; color: #2563EB; border: 1.5px solid #BFDBFE; }
.btn-outline:hover { background: #EFF6FF; }
.btn-danger  { background: #DC2626; color: white; }
.btn-sm      { padding: 4px 10px; font-size: 0.72rem; }
```

### 5.2 Status Badges
```html
<!-- Approved / Active / Compliant -->
<span class="badge badge-success">Approved</span>

<!-- Pending / At Risk -->
<span class="badge badge-warning">Pending</span>

<!-- Rejected / Critical / Overdue -->
<span class="badge badge-danger">Rejected</span>

<!-- Info / Processing -->
<span class="badge badge-info">Processing</span>
```

```css
.badge {
  display:       inline-block;
  padding:       3px 10px;
  border-radius: 999px;
  font-size:     0.62rem;
  font-weight:   800;
  text-transform:uppercase;
  letter-spacing:.04em;
}
.badge-success { background: #DCFCE7; color: #16A34A; }
.badge-warning { background: #FEF9C3; color: #92400E; }
.badge-danger  { background: #FEE2E2; color: #DC2626; }
.badge-info    { background: #DBEAFE; color: #1D4ED8; }
```

### 5.3 Form Elements
```html
<label class="form-label">Employee Name</label>
<input class="form-input" type="text" placeholder="Full name..." />
<select class="form-input">...</select>
<textarea class="form-input" rows="3"></textarea>
```

```css
.form-label {
  display:       block;
  font-size:     0.72rem;
  font-weight:   700;
  color:         #374151;
  margin-bottom: 5px;
  text-transform:uppercase;
  letter-spacing:.03em;
}
.form-input {
  width:         100%;
  padding:       9px 12px;
  border:        1.5px solid #E2E8F0;
  border-radius: 7px;
  font-size:     0.82rem;
  color:         #1E293B;
  background:    white;
  transition:    border-color 0.2s;
  outline:       none;
}
.form-input:focus { border-color: #93C5FD; box-shadow: 0 0 0 3px rgba(59,130,246,.1); }
```

### 5.4 Progress Bars
```html
<!-- Standard progress bar with colour coding -->
<div class="progress-wrap">
  <div class="progress-bar" style="width:78%;background:#2563eb"></div>
</div>

<!-- Colour coding rules:
     90-100% → #16a34a (green)   Excellent
     70-89%  → #2563eb (blue)    Good
     50-69%  → #d97706 (amber)   Needs attention
     0-49%   → #dc2626 (red)     Critical -->
```

```css
.progress-wrap {
  background:    #E2E8F0;
  border-radius: 999px;
  height:        8px;
  overflow:      hidden;
}
.progress-bar {
  height:        100%;
  border-radius: 999px;
  transition:    width 0.6s ease;
}
```

### 5.5 Data Tables
```html
<table class="data-table">
  <thead>
    <tr>
      <th>Column</th>
      <th>Column</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Data</td>
      <td>Data</td>
    </tr>
  </tbody>
</table>
```

```css
.data-table {
  width:           100%;
  border-collapse: collapse;
  font-size:       0.82rem;
}
.data-table th {
  background:    #F8FAFC;
  padding:       10px 14px;
  text-align:    left;
  font-size:     0.70rem;
  font-weight:   800;
  text-transform:uppercase;
  letter-spacing:.05em;
  color:         #6B7280;
  border-bottom: 2px solid #E5E7EB;
}
.data-table td {
  padding:       11px 14px;
  border-bottom: 1px solid #F3F4F6;
  color:         #374151;
}
.data-table tr:hover td { background: #F9FAFB; }
```

### 5.6 Alert Cards
```html
<!-- Info alert — blue left border -->
<div class="alert alert-info">
  ℹ️ <strong>NOTE:</strong> Advance tax must be paid by Sep 15.
</div>

<!-- Warning alert — amber left border -->
<div class="alert alert-warning">
  ⚠️ <strong>WARNING:</strong> LWF due Dec 31. File before the deadline.
</div>

<!-- Danger alert — red left border -->
<div class="alert alert-danger">
  ❌ <strong>CRITICAL:</strong> POSH annual report overdue since Jan 31.
</div>
```

```css
.alert {
  padding:     10px 16px;
  border-radius:8px;
  font-size:   0.78rem;
  line-height: 1.6;
  margin:      12px 0;
}
.alert-info    { background:#EFF6FF; border-left: 4px solid #2563EB; color:#1E40AF; }
.alert-warning { background:#FFFBEB; border-left: 4px solid #D97706; color:#92400E; }
.alert-danger  { background:#FEF2F2; border-left: 4px solid #DC2626; color:#991B1B; }
```

### 5.7 Toast Notifications
```javascript
// Usage
showToast('Leave applied ✅', true);   // success — green
showToast('Please fill all fields', false); // error — red
```

```css
.toast {
  position:    fixed;
  bottom:      24px;
  right:       24px;
  padding:     12px 20px;
  border-radius:9px;
  font-size:   0.82rem;
  font-weight: 600;
  z-index:     9999;
  max-width:   360px;
  box-shadow:  0 8px 24px rgba(0,0,0,.15);
  display:     none;
  animation:   slideUp 0.3s ease;
}
.toast-ok  { background: #059669; color: white; }
.toast-err { background: #DC2626; color: white; }
@keyframes slideUp {
  from { opacity:0; transform:translateY(10px); }
  to   { opacity:1; transform:translateY(0); }
}
```

---

## 6. Graph Explanation Cards

Every page with charts must include a range interpretation card:

```html
<div class="card" style="margin-top:14px;background:linear-gradient(135deg,#f8fafc,#f0f9ff);border:1.5px solid #2563eb22">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
    <div style="width:4px;height:32px;background:#2563eb;border-radius:2px"></div>
    <div>
      <div class="card-title" style="margin-bottom:0;color:#2563eb">📊 Chart Title — Range Guide</div>
      <div style="font-size:.65rem;color:#94a3b8">How to read and interpret this chart</div>
    </div>
  </div>
  <!-- Range rows -->
  <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid #f1f5f9">
    <div style="width:12px;height:12px;border-radius:50%;background:#16a34a;flex-shrink:0"></div>
    <div style="flex:1;font-size:.74rem;font-weight:700;color:#1e293b">Range Label</div>
    <div style="font-size:.7rem;color:#475569;flex:2;line-height:1.5">Interpretation text</div>
  </div>
</div>
```

**Colour coding standard for range indicators:**
- 🟢 `#16a34a` — Excellent / Compliant / Low risk
- 🔵 `#2563eb` — Good / On track / Normal
- 🟡 `#d97706` — Warning / Needs attention / Medium risk
- 🔴 `#dc2626` — Critical / Non-compliant / High risk
- ⚫ `#94a3b8` — Not applicable / No data

---

## 7. Page Layout Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Module Name — Workforce Intelligence</title>
  <style>
    /* 1. CSS Variables (tokens) */
    /* 2. Reset */
    /* 3. Layout (sidebar, main, topbar) */
    /* 4. Card system */
    /* 5. Buttons */
    /* 6. Forms */
    /* 7. Tables */
    /* 8. Badges / Status */
    /* 9. Progress bars */
    /* 10. Alerts */
    /* 11. Toast */
    /* 12. Module-specific styles */
  </style>
</head>
<body>
  <!-- Sidebar navigation -->
  <div class="wiq-sidebar" id="wiqSidebar">
    <!-- Logo -->
    <!-- Nav groups: Payroll, Leave, Performance, etc. -->
  </div>

  <!-- Main content area -->
  <div class="wiq-main">
    <!-- Top bar: breadcrumb, user avatar, notifications -->
    <div class="wiq-topbar">...</div>

    <!-- Page header -->
    <div class="page-header">
      <h1>Module Title</h1>
      <div class="page-actions">
        <button class="btn btn-primary">Primary Action</button>
      </div>
    </div>

    <!-- Stats row (4 KPI cards) -->
    <div class="grid-4">
      <div class="card"><!-- KPI 1 --></div>
      <div class="card"><!-- KPI 2 --></div>
      <div class="card"><!-- KPI 3 --></div>
      <div class="card"><!-- KPI 4 --></div>
    </div>

    <!-- Tab navigation (if needed) -->
    <div class="tabs">
      <button class="tab-btn active" onclick="switchTab('tab1')">Tab 1</button>
      <button class="tab-btn" onclick="switchTab('tab2')">Tab 2</button>
    </div>

    <!-- Main content cards -->
    <div id="tab1" class="card">...</div>
    <div id="tab2" class="card" style="display:none">...</div>

    <!-- Graph explanation card (if page has charts) -->
    <div class="card" style="margin-top:14px;background:linear-gradient(...)">
      <!-- Range guide -->
    </div>
  </div>

  <!-- Hidden placeholder for sidebar IDs -->
  <div style="display:none" id="_sp">
    <span id="userName"></span>
    <button id="composeBtn"></button>
    <div id="annList"></div>
    <div id="composeModal"></div>
  </div>

  <!-- Toast notification -->
  <div class="toast" id="toast"></div>

  <!-- Page scripts -->
  <script>
    // Page-specific functions
    // No non-ASCII chars in JS strings — use unicode escapes
    // No nested backtick template literals
    // null-check all getElementById calls
  </script>

  <!-- Sidebar common JS -->
  <script>
    // showToast(), logout(), toggleGroup(), openMobSidebar()
    // Sidebar username setter
    // Active nav link highlighter
  </script>
</body>
</html>
```

---

## 8. Responsive Breakpoints

```css
/* Mobile first — enhance upward */
@media (max-width: 768px) {
  .wiq-sidebar   { display: none; }
  .wiq-main      { margin-left: 0; padding: 16px; }
  .grid-2,
  .grid-3,
  .grid-4        { grid-template-columns: 1fr; }
  .mob-hide      { display: none; }
}

@media (max-width: 480px) {
  .btn           { padding: 6px 12px; font-size: 0.76rem; }
  .card          { padding: 14px 16px; }
  .data-table th,
  .data-table td { padding: 8px 10px; }
}
```

---

## 9. Icon Convention

Platform uses emoji icons throughout for visual clarity without external dependencies:

| Category | Icons |
|---|---|
| Status | ✅ ❌ ⚠️ ℹ️ 🔄 |
| Payroll | 💰 💳 🏦 📄 |
| Leave | 📅 🏖️ 🏥 |
| Performance | ⭐ 🎯 📈 |
| Compliance | 🛡️ ⚖️ 📋 |
| AI | 🧠 🤖 ⚡ |
| Download | ⬇️ 📥 |
| Upload | ⬆️ 📤 |
| Navigation | →  ← ▶ ◀ |
| People | 👤 👥 |
| Security | 🔒 🔑 |

**Rule:** Use HTML entities in HTML (`&#128200;`) and unicode escapes in JS (`\u{1F4C8}`).

---

## 10. Accessibility Standards

- **Contrast ratio:** Minimum 4.5:1 for body text, 3:1 for large text
- **Focus indicators:** All interactive elements must show visible focus ring
- **Keyboard navigation:** Tab order must be logical left-to-right, top-to-bottom
- **Labels:** Every input must have `<label>` with `for` attribute or `aria-label`
- **Alt text:** Every non-decorative image must have `alt` attribute
- **ARIA:** Use `aria-live="polite"` for dynamic content updates (toast)
- **Headings:** Proper H1 → H2 → H3 hierarchy, one H1 per page
