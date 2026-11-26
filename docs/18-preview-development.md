> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# 👁️ Preview & Development Review — Workforce Intelligence

## Preview Environments

### Local Preview
```bash
# Start full stack locally
docker compose up -d
open http://localhost:5000/login.html

# Frontend-only preview (no backend needed)
npx serve frontend -p 3000
open http://localhost:3000/admin-dashboard.html
```

### Staging Preview
```bash
# Deploy to staging
git push origin develop
# GitHub Actions auto-deploys to: https://staging.wfi.yourcompany.com

# Credentials (staging)
admin@wip.com / P123/
```

### Feature Preview (Per-PR)
Each PR automatically spins up an isolated preview URL:
```
https://pr-{number}.preview.wfi.yourcompany.com
```
Available for 48 hours after last commit. Uses anonymised seed data.

---

## Frontend Preview Checklist

### Every Page Must Pass
```bash
npm run audit:frontend   # Playwright — 116/116 pages
```

| Check | Tool | Expected |
|---|---|---|
| JS runtime errors | Playwright | 0 errors |
| dlPrint works | Playwright | Opens print window |
| dlCSV works | Playwright | Creates anchor + downloads |
| Dark mode toggle | Playwright | Toggles body.dark-mode |
| Cookie banner | Playwright | Element exists |
| Tab switching | Playwright | Panels show/hide correctly |
| ₹ symbol | Visual check | No Rs or â‚¹ visible |
| Mobile layout | DevTools 375px | No horizontal scroll |
| Print layout | @media print | Sidebar hidden, content full-width |

### Visual Review Steps
1. Open page in Chrome
2. Toggle dark mode → check all text readable, no invisible elements
3. Resize to 375px → check no overflow, touch targets ≥ 44px
4. Open DevTools Console → 0 errors
5. Click all tab buttons → correct panels shown
6. Click Print Report → formatted window opens with ₹ amounts
7. Click Export CSV → file downloads with correct data
8. `Ctrl+P` → print preview → sidebar hidden, table visible

---

## API Preview (Postman Collection)

```
File: /docs/WFI_v12_Postman_Collection.json

Key flows to preview:
1. Auth: POST /api/auth/login → copy token
2. Set header: Authorization: Bearer {token}
3. GET /api/payroll/summary → verify ₹ amounts
4. POST /api/leave/apply → verify workflow
5. GET /api/compliance/pf-summary → verify calculations
6. GET /api/audit-log → verify entries exist
```

---

## Development Review Sessions

### Weekly Dev Review (Every Friday)
**Agenda** (30 mins):
1. Pages completed this week — demo walkthrough
2. JS errors found — root causes, fixes applied
3. Statutory accuracy check — any calculation concerns
4. Performance review — API response times
5. Next week priorities

### Pre-Release Review (Before each version)
**Agenda** (2 hours):
1. Full frontend audit run (`npm run audit:all`)
2. Walk through every new page in browser
3. Test all payroll calculations with sample data
4. Security scan results review
5. Load test results review
6. Sign-off from: Dev Lead, HR domain expert, Security lead

---

## Development Preview Screenshots
Run after every significant change:
```bash
npm run screenshots          # Takes 43 screenshots → /screenshots/
npm run showcase:rebuild     # Rebuilds WFI_v12_Showcase.html
```

This auto-updates the showcase with fresh screenshots showing current state.

---

## Browser Compatibility Matrix

| Browser | Version | Status |
|---|---|---|
| Chrome | 110+ | ✅ Full support |
| Firefox | 110+ | ✅ Full support |
| Edge | 110+ | ✅ Full support |
| Safari | 16+ | ✅ Full support |
| Chrome Mobile | 110+ | ✅ Full support |
| Safari iOS | 16+ | ✅ Full support |
| IE 11 | — | ❌ Not supported |

---

## WA (Walkthrough Acceptance) Testing

### WA Test Protocol
Each feature must pass a structured walkthrough before marking complete:

**Payroll WA**:
1. Login as HR Manager
2. Navigate to Payroll Processing
3. Select month: September 2026
4. Click "Run Payroll" → verify KPIs update
5. Click "Print Report" → verify ₹ amounts, employee count
6. Click "Export CSV" → verify file downloads, open in Excel
7. Navigate to Payslip Portal → verify payslip generated
8. Click "Download Payslip" → verify PDF opens with ₹ amounts

**Self-Assessment WA**:
1. Login as Employee
2. Navigate to Performance Reviews
3. Click "Self Assessment" tab
4. Rate all 4 criteria (1–5 stars)
5. Add comments in each text area
6. Click "Save Draft" → verify toast success
7. Click "Submit Assessment" → verify toast + confirmation
8. Click "Print" → verify formatted print window

**My Requests WA**:
1. Login as Employee
2. Navigate to Employee Self-Service
3. Click "My Requests" tab
4. Verify pending/approved requests visible
5. Click "Download" on approved salary certificate → print window opens
6. Click "+ New Request" → verify toast response

**Emergency SOS WA**:
1. Navigate to 112 Emergency page
2. Click "Call 112" → verify link/action
3. Click "SOS Alert" → verify broadcast confirmed
4. Navigate to Incident tab → verify form works
5. Print report → verify formatted output
