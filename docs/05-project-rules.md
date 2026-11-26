> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# 📐 Project Rules — Workforce Intelligence

## Code Standards

### Naming Conventions
```
Files:          kebab-case      → admin-dashboard.html, salary-revision.html
JS variables:   camelCase       → empId, payrollMonth, dlPrint
CSS classes:    kebab-case      → wiq-sidebar, tab-btn, export-bar
DB tables:      snake_case      → employee_records, payroll_runs, attendance_logs
API routes:     kebab-case      → /api/payroll/run, /api/leave/apply
Constants:      UPPER_SNAKE     → SALT_ROUNDS, JWT_EXPIRY, API_VERSION
```

### JavaScript Rules
- **ES2022** — use const/let, arrow functions, async/await, optional chaining
- **No frameworks** on frontend — Vanilla JS only (performance + simplicity)
- **Global utilities** via `window.wfi.*` namespace on every page
- **All onclick functions** must be defined on `window` object (not local scope)
- **No inline `eval()`**, `innerHTML` with untrusted data, or `document.write()`
- **Error handling**: every async function must have try/catch with `window.st()` toast
- **dlPrint strings**: single-line only — no multiline JS string literals

### HTML Rules
- Every page: `<meta charset="UTF-8">` as first head element
- Every page: `<meta name="viewport" content="width=device-width,initial-scale=1">`
- Every app page: cookie banner (`id="cookieBanner"` or `id="ckb"`)
- Every app page: dark mode toggle (`id="dmt"` or `id="dmToggle"`)
- Every app page: `<div id="toast">` for notifications
- Tab panels: use `id="tab{Name}"` camelCase pattern
- Images: always include `alt` attribute
- No deprecated HTML tags: no `<font>`, `<center>`, `<marquee>`, `<blink>`

### CSS Rules
- Use CSS custom properties (variables) for theming
- Dark mode via `body.dark-mode` class toggle
- Mobile-first: base styles → `@media(min-width:768px)`
- Print styles in `@media print` — hide sidebar, expand content
- Card margins: `margin-bottom: 12px` minimum
- No `!important` except in global utility overrides
- Currency: always use `₹` symbol, never `Rs` or `Rs.`

### API Rules
- All endpoints require JWT authentication (except `/api/auth/login`)
- Response format: `{ success: true, data: {...} }` or `{ success: false, error: "message" }`
- HTTP status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error
- All inputs: validated and sanitised server-side
- Pagination: `?page=1&limit=25` on all list endpoints
- No raw SQL — parameterised queries only

## Git Workflow

### Branch Strategy
```
main          → production-ready code only
develop       → integration branch
feature/*     → new features (feature/payroll-calculator)
fix/*         → bug fixes (fix/dlprint-multiline)
hotfix/*      → production urgent fixes
release/*     → pre-release staging
```

### Commit Format
```
type(scope): description

Types: feat | fix | docs | style | refactor | test | chore | perf | security
Scope: payroll | attendance | leave | auth | ai | compliance | frontend | api

Examples:
feat(payroll): add ₹ symbol to all financial report exports
fix(frontend): resolve multiline string in dlPrint across 54 pages
security(auth): increase bcrypt salt rounds from 10 to 12
docs: add tech-stack.md and project-rules.md
```

### PR Rules
- Minimum 1 reviewer before merge to `develop`
- All CI checks must pass (lint, tests, security scan)
- PR description must include: What changed, Why, Screenshots if UI change, Test steps
- No force-push to `main` or `develop`
- Delete branch after merge

## Security Rules
1. **Never** commit `.env` files, API keys, or credentials to git
2. **Never** log sensitive data (PAN, Aadhaar, passwords, tokens) to console
3. **Always** validate and sanitise all user inputs server-side
4. **Always** use parameterised SQL queries — no string concatenation
5. **Always** rate-limit authentication endpoints (max 5 failed attempts → 15min lockout)
6. **Always** encrypt biometric data (AES-256-GCM) before storage
7. **Always** use HTTPS in staging and production (never HTTP for auth flows)
8. **Review** all third-party dependencies for CVEs before adding

## Performance Rules
- API responses: target < 200ms (p95)
- Frontend: no synchronous blocking operations on main thread
- Images: compress to < 100KB, use lazy loading
- Database: index all foreign keys and frequently queried columns
- Redis: cache all read-heavy queries (employee list, org chart) with 5-min TTL
- Payroll run: must complete within 30s for 500 employees

## Compliance Rules
- All employee data changes must create an audit log entry
- PAN and Aadhaar must be masked in display (`ABCDE****F`, `****-****-1234`)
- DPDP consent must be obtained before collecting biometric data
- Employee data deletion requests must be fulfilled within 30 days (DPDP Art. 7)
- All financial calculations must match government statutory rates exactly
- PoSH complaints: maintain strict confidentiality, only ICC members can view

## Testing Rules
- Unit tests required for: all payroll calculation functions, all statutory calculators
- Integration tests required for: auth flows, payroll run, leave approval workflow
- Browser tests (Playwright): all 121 HTML pages must pass: dlPrint, dlCSV, DM toggle, cookie banner, 0 JS errors
- Security tests: OWASP Top 10 checks before each release
- Performance tests: load test with 200 concurrent users before major release
