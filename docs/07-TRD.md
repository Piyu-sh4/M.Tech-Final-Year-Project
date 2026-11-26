> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# 🔧 Technical Requirements Document (TRD)
# Workforce Intelligence

**Version**: 12.0 | **Date**: October 2026 | **Status**: Production

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  Browser (Chrome/Firefox/Safari/Edge) · PWA · Service Worker     │
│  Vanilla JS ES2022 · 121 HTML Pages · CSS3 · Chart.js           │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS/WSS
┌────────────────────────▼────────────────────────────────────────┐
│                      GATEWAY LAYER                               │
│  Nginx 1.24 · TLS 1.3 · WAF · Rate Limit · Static Files        │
│  CORS · CSP Headers · HSTS · Gzip Compression                  │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/WS
┌────────────────────────▼────────────────────────────────────────┐
│                   APPLICATION LAYER                              │
│  Node.js 18+ LTS · Express 4.x · Socket.io 4.x                 │
│  JWT Auth · RBAC · Rate Limiting · Input Validation             │
│  Payroll Engine · Compliance Calculator · AI Service            │
└──────┬──────────────┬──────────────┬───────────────────────────┘
       │              │              │
┌──────▼──────┐ ┌─────▼──────┐ ┌────▼───────────────────────────┐
│  MySQL 8.0  │ │  Redis 7   │ │  Anthropic Claude Sonnet API   │
│  Primary DB │ │  Cache +   │ │  AI Assistant · HR Copilot     │
│  ACID Trans │ │  Sessions  │ │  TF-IDF RAG · Streaming        │
└─────────────┘ └────────────┘ └────────────────────────────────┘
```

---

## 2. Technical Requirements

### 2.1 Frontend

| Requirement | Specification |
|---|---|
| Language | Vanilla JavaScript ES2022 |
| Framework | None (zero-dependency frontend) |
| Pages | 121 HTML5 pages |
| PWA | Service Worker, offline fallback, installable |
| Real-time | Socket.io client 4.x for live updates |
| Charts | Chart.js 4.x, inline SVG |
| Maps | Leaflet.js 1.9 (GPS attendance) |
| Biometrics | TensorFlow.js + MediaPipe (client-side) |
| Dark mode | CSS custom properties, `body.dark-mode` |
| Mobile | Responsive 375px–1440px, touch-targets ≥ 44px |
| Print | @media print — sidebar hidden, full-width content |
| Currency | ₹ symbol throughout (never Rs or encoding errors) |
| Tab IDs | camelCase pattern: `id="tab{Name}"` |
| Utilities | `window.dlPrint`, `window.dlCSV`, `window.showTab`, `window.st`, `window.tdm`, `window.logout` |

### 2.2 Backend

| Requirement | Specification |
|---|---|
| Runtime | Node.js 18.0.0+ LTS |
| Framework | Express 4.18.x |
| Database | MySQL 8.0 (ACID, InnoDB, utf8mb4) |
| Cache | Redis 7.x (sessions, rate limits, API cache) |
| Auth | JWT HS256, 8h access / 7d refresh |
| Password | bcryptjs SALT_ROUNDS=12 (~250ms) |
| Real-time | Socket.io 4.x (attendance, notifications) |
| File upload | Multer, max 10MB, type-validated |
| Email | Nodemailer SMTP (payslips, alerts, OTPs) |
| PDF | Puppeteer (Form 16, detailed reports) |
| Scheduler | node-cron (payroll reminders, reports) |
| Encryption | AES-256-GCM (biometrics, PAN, bank data) |

### 2.3 API Design

| Requirement | Specification |
|---|---|
| Style | REST (JSON) |
| Versioning | `/api/v1/...` (v1 default) |
| Auth | Bearer token in Authorization header |
| Response | `{ success: bool, data: {}, error: "msg", meta: { page, total } }` |
| Pagination | `?page=1&limit=25` on all list endpoints |
| Filtering | `?search=`, `?status=`, `?from=`, `?to=` |
| Sorting | `?sort=created_at&order=desc` |
| Rate limit | 100 req/15min (API), 5 req/15min (auth) |
| Validation | Server-side, parameterised queries only |
| CORS | Whitelist-only origins |
| Errors | HTTP status codes + descriptive error message |

### 2.4 Database Requirements

| Requirement | Specification |
|---|---|
| Engine | MySQL 8.0, InnoDB, utf8mb4_unicode_ci |
| Connections | Pool min=2, max=10 |
| Transactions | All payroll operations in transactions |
| Indexing | All FKs + frequently queried columns indexed |
| Backup | Daily automated snapshots (RDS), 30-day retention |
| Encryption | At-rest encryption enabled |
| Audit | Append-only audit_log table (no UPDATE/DELETE) |
| Amounts | All monetary values stored as INTEGER (paise) |

### 2.5 Security Requirements

| Requirement | Specification |
|---|---|
| Transport | TLS 1.3 minimum |
| Auth | JWT HS256, secret ≥ 256 bits |
| Passwords | bcryptjs, SALT=12, min 8 chars |
| Biometrics | AES-256-GCM, per-record IV, never in logs |
| PAN/Aadhaar | Masked display, encrypted storage |
| SQL | Parameterised queries only, no string concat |
| XSS | helmet.js, Content-Security-Policy |
| CSRF | csurf tokens |
| Rate limiting | express-rate-limit, auth endpoints strict |
| Sessions | Redis store, HTTP-only refresh cookie |
| Audit | Every data mutation logged with user + IP |
| DPDP | Consent management, erasure API, 72h breach notif |

### 2.6 Performance Requirements

| Metric | Requirement |
|---|---|
| API response (p95) | < 200ms under 200 concurrent users |
| Page load (3G) | < 3 seconds |
| Payroll run (500 employees) | < 30 seconds |
| DB query (p95) | < 100ms |
| WebSocket latency | < 50ms |
| Uptime SLA | ≥ 99.5% |
| Error rate (5xx) | < 0.5% |
| Cache hit rate | > 80% for read-heavy endpoints |

### 2.7 Infrastructure Requirements

| Component | Specification |
|---|---|
| Container | Docker 24+, Docker Compose 2.20+ |
| Reverse proxy | Nginx 1.24+ |
| Process manager | PM2 (production) |
| OS | Ubuntu 22.04 LTS |
| Min RAM | 4GB (app server) |
| Min CPU | 2 vCPU |
| Min Storage | 50GB SSD |
| Cloud (optional) | AWS EC2 + RDS + ElastiCache + S3 |

---

## 3. Integration Requirements

### 3.1 Anthropic Claude API
```
Endpoint : https://api.anthropic.com/v1/messages
Model    : claude-sonnet-4-6
Auth     : x-api-key header
Usage    : HR Assistant chat, HR Copilot RAG, AI Insights
Fallback : "AI temporarily unavailable" — no hard failure
```

### 3.2 SMTP Email
```
Protocol : SMTP with STARTTLS
Port     : 587
Usage    : Payslip delivery, leave notifications, OTP, alerts
Retry    : 3 attempts with exponential backoff
```

### 3.3 WebAuthn (Fingerprint)
```
API      : navigator.credentials (browser native)
Usage    : Biometric attendance, passwordless login
Fallback : PIN-based attendance
```

---

## 4. Data Flow Requirements

### Payroll Processing Flow
```
1. HR triggers payroll run (month + year)
2. System locks the payroll period (prevents duplicate)
3. Fetch all active employees + salary structures
4. For each employee (parallel, worker threads):
   a. Calculate gross = basic + allowances + variables
   b. Calculate PF (12% employee, 13.61% employer, ≤₹15K)
   c. Calculate ESI (if gross ≤ ₹21,000: 0.75%/3.25%)
   d. Calculate TDS (slab-based, new regime default)
   e. Apply LWF (state-specific rates)
   f. Apply any loans/advances deductions
   g. Calculate net = gross - all deductions
5. Write all records in single transaction
6. Generate payslip PDFs (Puppeteer)
7. Create audit log entry
8. Return summary to HR dashboard
9. (Optional) Trigger payslip email notification
```

### Authentication Flow
```
1. User submits email + password
2. Server finds user by email (parameterised query)
3. bcryptjs.compare(password, hash) — timing-safe
4. If match: generate JWT (HS256) + refresh token
5. Store refresh token in Redis (7-day TTL)
6. Return JWT in response body (8h expiry)
7. Client stores JWT in localStorage (no cookies for access token)
8. Every API request: Authorization: Bearer {token}
9. Middleware verifies JWT + checks blacklist in Redis
10. On logout: add token to Redis blacklist (TTL = remaining expiry)
```

---

## 5. Compliance Technical Requirements

### DPDP Act 2023
- Consent collected before any data processing begins
- Separate consent for biometric data (explicit opt-in)
- Data erasure API: marks records as deleted, purges in 30 days
- Breach detection → auto-notification to CERT-In within 72h
- Data minimisation: API returns only fields needed for role

### Statutory Calculations (India-Specific)
```js
// All rates as of FY 2026-27

PF_EMPLOYEE = 0.12          // 12% of Basic+DA
PF_EMPLOYER = 0.1361        // 13.61% (EPF 12% + EPS 8.33% ≤₹1,250 + EDLI 0.5% + Admin 0.5%)
PF_CEILING  = 15000         // Maximum wage for PF calculation

ESI_EMPLOYEE = 0.0075       // 0.75% of gross
ESI_EMPLOYER = 0.0325       // 3.25% of gross
ESI_CEILING  = 21000        // Gross ≤ ₹21,000 to be eligible

// TDS: New Regime Slabs FY 2026-27
// ≤₹3L: 0%, ₹3-7L: 5%, ₹7-10L: 10%, ₹10-12L: 15%
// ₹12-15L: 20%, >₹15L: 30%

GRATUITY = (basic_da / 26) * 15 * years_of_service
BONUS_MIN = basic * 0.0833  // min 8.33%
BONUS_MAX = basic * 0.20    // max 20%
BONUS_WAGE_CEILING = 7000   // or minimum wage, whichever is higher
```

---

## 6. Browser & Device Support

| Browser/Device | Min Version | Support Level |
|---|---|---|
| Chrome Desktop | 110 | Full |
| Firefox Desktop | 110 | Full |
| Edge | 110 | Full |
| Safari macOS | 16 | Full |
| Chrome Android | 110 | Full |
| Safari iOS | 16 | Full |
| IE 11 | — | Not supported |
| Screen reader | NVDA/VoiceOver | Partial (accessibility backlog) |

---

## 7. Non-Functional Requirements

| NFR | Requirement |
|---|---|
| Scalability | Horizontal scaling via PM2 cluster mode |
| Availability | 99.5% uptime (≤ 3.6h downtime/month) |
| Recoverability | RTO < 1 hour, RPO < 24 hours |
| Maintainability | Modular architecture, documented APIs |
| Observability | Structured logs, health endpoint, metrics |
| Portability | Docker-based, runs on any Linux host |
| Internationalization | i18n hooks in place, English-first |
| Accessibility | WCAG 2.1 AA — roadmap item |
