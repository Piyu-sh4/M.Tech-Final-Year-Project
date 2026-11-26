> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# 🔍 Missing, Known Gaps & Backlog — Workforce Intelligence

This document tracks everything that was identified as missing, incomplete,
or needing improvement — with status and planned resolution.

---

## 1. Features Not Yet Built (Planned)

### Mobile App
- **Status**: Not started — planned v12.1
- **Gap**: No native iOS/Android app
- **Impact**: Employees on mobile use browser PWA (works but not native-feel)
- **Plan**: React Native app, push notifications, biometric login, quick leave

### Google / Azure SSO
- **Status**: Not started — planned v12.1
- **Gap**: Only email+password login; no enterprise SSO
- **Impact**: Large enterprises with G Suite / Azure AD cannot use SSO
- **Plan**: OAuth 2.0 (Google), SAML 2.0 (Azure AD), Okta integration

### WhatsApp Notifications
- **Status**: Not started — planned v12.2
- **Gap**: Only email notifications; no WhatsApp
- **Impact**: Most Indian employees prefer WhatsApp for approvals
- **Plan**: Twilio WhatsApp API, template messages for leave/payslip alerts

### Form 16 Auto-Email
- **Status**: PDF generation works; bulk email dispatch not built
- **Gap**: HR must manually email Form 16 to each employee
- **Impact**: Manual effort at year-end
- **Plan**: Puppeteer batch generation + Nodemailer bulk send

### Bank SFTP Integration
- **Status**: CSV export works; SFTP push not built
- **Gap**: Salary transfer files must be manually uploaded to bank portal
- **Impact**: Extra manual step for HR/Finance
- **Plan**: HDFC/ICICI/SBI SFTP API integration in v12.1

### Multi-Tenant / Multi-Company
- **Status**: Single-tenant only
- **Gap**: One deployment = one company
- **Impact**: Cannot serve multiple companies from one instance
- **Plan**: Schema-per-tenant approach in v13.0

---

## 2. Pages with Known Incomplete Sections

### `analytics.html`
- **Gap**: Charts are static/mocked; no live API data
- **Fix**: Connect to `/api/analytics/*` endpoints (backend built, frontend not wired)
- **Priority**: P1 — v12.1

### `ai-insights.html`
- **Gap**: Predictive attrition uses dummy data; real ML model not trained
- **Fix**: Train model on anonymised HR data; connect to prediction API
- **Priority**: P2 — v12.2

### `workforce-planning.html`
- **Gap**: Forecast charts are static; no hiring plan integration
- **Fix**: Wire to headcount and hiring data APIs
- **Priority**: P2 — v12.1

### `real-time-monitor.html`
- **Gap**: Socket.io real-time feed partially working
- **Fix**: Complete event emission from attendance and payroll events
- **Priority**: P1 — v12.1

### `chat.html`
- **Gap**: Chat UI built; WebSocket messaging not implemented
- **Fix**: Implement Socket.io room-based messaging
- **Priority**: P3 — v12.2

### `projects.html`
- **Gap**: Page exists; no backend project management API
- **Fix**: Build project CRUD + time tracking integration
- **Priority**: P3 — v12.2

### `helpdesk.html`
- **Gap**: Ticket creation works; assignment and SLA tracking not built
- **Fix**: Add assignment workflow, SLA timers, escalation
- **Priority**: P2 — v12.1

---

## 3. Known UI/UX Issues

| Issue | Page | Severity | Fix |
|---|---|---|---|
| Sidebar collapses on some mobile pages | All new pages | Medium | Add `wiq-mob-toggle` CSS |
| Tab panels don't animate on switch | All tabbed pages | Low | Add CSS transition |
| Long table rows overflow on mobile | salary.html, payslip | Medium | Add overflow-x:auto wrapper |
| Print header missing on new pages | 14 new pages | Low | Add `.print-header` div |
| Empty states missing on some tables | 8 pages | Low | Add empty state component |
| Search/filter not working on 3 pages | directory, assets, training | Medium | Wire filter inputs to JS |

---

## 4. Performance Issues

| Issue | Impact | Fix |
|---|---|---|
| Large pages (>200KB HTML) load slowly on 2G | Employee Dashboard, Admin Dashboard | Lazy-load non-critical sections |
| No API response caching on analytics | Repeated DB queries | Add Redis 5-min cache |
| Payroll run blocks main thread | UI freezes during 500-emp run | Move to background worker |
| Chart.js re-renders on every tab switch | Performance hit | Cache rendered charts |

---

## 5. Security Gaps (Non-Critical)

| Gap | Severity | Plan |
|---|---|---|
| No automated CVE scanning on dependencies | Medium | Add `npm audit` to CI/CD |
| Biometric data not encrypted in staging env | Low | Add staging encryption config |
| Missing rate limit on `/api/ai/*` endpoints | Medium | Add 20 req/min per user |
| No honeypot fields on login form | Low | Add hidden input trap |
| Session doesn't invalidate on password change | Medium | Add session_version to JWT |

---

## 6. Accessibility Gaps (WCAG 2.1 AA)

| Gap | Priority | Fix |
|---|---|---|
| Icon-only buttons missing aria-label | P1 | Add aria-label to all icon buttons |
| Tables missing `<caption>` | P2 | Add descriptive captions |
| Form errors not announced to screen readers | P1 | Add role="alert" to error messages |
| Focus trap not implemented in modals | P2 | Trap Tab/Shift+Tab inside modals |
| Colour contrast < 4.5:1 on some muted text | P2 | Increase contrast on `--text-muted` |

---

## 7. Compliance Gaps

| Gap | Regulation | Plan |
|---|---|---|
| DPDP data erasure API not exposed to employees | DPDP 2023 | Add self-service erasure request in v12.1 |
| Breach notification system not automated | DPDP 2023 | Build 72h auto-notification pipeline |
| Annual PoSH report generator missing | PoSH 2013 | Add annual report PDF in v12.1 |
| PT (Professional Tax) rates incomplete (5 states) | State Acts | Add remaining states |
| Gratuity auto-trigger on 5-year anniversary | Payment of Gratuity Act | Build anniversary alert |

---

## 8. Documentation Gaps

| Gap | Priority |
|---|---|
| API documentation (Swagger/OpenAPI) | P1 — generate from route handlers |
| Database ERD diagram | P1 — generate from schema |
| Postman collection for all 96 API endpoints | P2 |
| Video walkthrough of each module | P3 |
| Onboarding guide for new developers | P2 |
| Changelog (CHANGELOG.md) | P1 |

---

## 9. Test Coverage Gaps

| Area | Current Coverage | Target |
|---|---|---|
| Payroll calculations | 85% | 100% |
| Statutory compliance | 90% | 100% |
| Auth middleware | 70% | 95% |
| Leave balance logic | 60% | 90% |
| File upload validation | 40% | 80% |
| Email sending | 20% | 70% |
| WebSocket events | 10% | 60% |

---

## 10. Third-Party Integrations Missing

| Integration | Use Case | Priority |
|---|---|---|
| TRACES (TDS portal) | Direct Form 24Q submission | P1 |
| EPFO Unified Portal | ECR file direct upload | P1 |
| ESIC Portal | Monthly ESI return | P1 |
| DigiLocker | Employee document verification | P2 |
| Aadhaar eKYC | Identity verification at onboarding | P2 |
| Naukri / LinkedIn | Job posting sync | P3 |
| Tally ERP | Payroll journal export | P2 |
| QuickBooks / Zoho Books | Accounting integration | P3 |

---

## 11. Fixed This Session (v12.0 Fixes)

| Issue | Was Missing | Now Fixed |
|---|---|---|
| Self-assessment form | Missing from performance.html | ✅ Added 4-criteria form |
| My Requests tab | Missing from employee-self-service | ✅ Added with table + actions |
| Registration number field | Missing from register.html | ✅ Added EMP-YYYY-NNNN field |
| EAP cards not clickable | mental-health.html | ✅ Added click handlers |
| ₹ symbol encoding | Rs shown instead of ₹ | ✅ Fixed on 9 financial pages |
| dlPrint syntax error (54 pages) | Multiline JS string | ✅ All 116/116 now working |
| Tab switching broken (28 pages) | camelCase ID mismatch | ✅ Robust showTab added |
| Unclosed div tags (43 pages) | Missing </div> | ✅ Fixed |
| Print layout broken | No @media print | ✅ Added to all 117 pages |
| Assets.html JS error | Multiline dlPrint | ✅ Fixed |
| Flexible-benefits orphan catch | Bad injection | ✅ Fixed |
| Missing onclick stubs (60+) | Functions not on window | ✅ wfi-utils added |
