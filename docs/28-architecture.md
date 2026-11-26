> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# ARCHITECTURE.md — Workforce Intelligence
## System Architecture Document

**Version:** 12.0 | **Date:** July 2026

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  Browser / PWA — 106 HTML pages (Vanilla JS ES2022)            │
│  localStorage JWT · CSS3 · Chart.js · Leaflet · Socket.io-client│
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS / WSS
┌──────────────────────────▼──────────────────────────────────────┐
│                     REVERSE PROXY (Production)                  │
│  Nginx 1.24 — SSL termination, static serving, WebSocket proxy  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP
┌──────────────────────────▼──────────────────────────────────────┐
│                  NODE.JS API SERVER (PM2 Cluster)               │
│  Express 4.x  │  Port 5000  │  NODE_ENV=production             │
│                                                                 │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌───────────────┐  │
│  │ Routes  │  │Controllers│  │Middleware │  │   Services    │  │
│  │ 40 files│  │ 37 files  │  │ 4 files   │  │ 5 files       │  │
│  └─────────┘  └──────────┘  └───────────┘  └───────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Socket.io 4.x — Real-time: notifications, overdue alerts│   │
│  └─────────────────────────────────────────────────────────┘   │
└──────┬───────────────────────────────────────┬─────────────────┘
       │                                       │
┌──────▼──────┐                    ┌───────────▼───────────┐
│  MySQL 8.0  │                    │   Redis 7             │
│  125 tables │                    │   Cache + Sessions    │
│  Port 3306  │                    │   Port 6379           │
└─────────────┘                    └───────────────────────┘
       │
┌──────▼──────────────────────────────────┐
│  External APIs (optional)               │
│  • Anthropic Claude Sonnet — AI Copilot │
│  • SMTP (Gmail) — Email notifications   │
└─────────────────────────────────────────┘
```

---

## 2. Docker Architecture

```yaml
services:
  wfi_mysql:          # MySQL 8.0 — workforce_intelligence DB
    image: mysql:8.0
    ports: ["3306:3306"]
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/init:/docker-entrypoint-initdb.d  # auto-init SQL
    healthcheck: mysqladmin ping

  wfi_redis:          # Redis 7 — caching + sessions
    image: redis:7-alpine
    ports: ["6379:6379"]
    healthcheck: redis-cli ping

  wfi_api:            # Node.js 18 — Express API
    build: .
    ports: ["5000:5000"]
    depends_on:
      wfi_mysql: {condition: service_healthy}
      wfi_redis: {condition: service_healthy}
    env_file: .env
```

**Startup order:** MySQL (health) → Redis (health) → Node.js API

---

## 3. Frontend Architecture

```
frontend/
├── index.html          Public landing page
├── login.html          JWT auth — sets localStorage token
├── register.html       New user registration
├── offline.html        PWA service worker fallback
└── [102 app pages]     Protected — redirect to login if no token

Page structure (every app page):
┌─────────────────────────────────────────────────────┐
│ <head>: Meta, CSS, Chart.js CDN (if needed)         │
│ <body>:                                             │
│   <nav> Fixed top bar — logo, user, notifications   │
│   <div.wiq-sidebar> Left nav — 60+ links by module  │
│   <div.wiq-main> Page content — cards, tables, forms│
│   <div#_sp> Hidden placeholder — sidebar IDs       │
│   <div.toast> Toast notifications                   │
│   <script> Page-specific JS (ES2022)                │
│   <script> Sidebar common JS (auth, nav, showToast) │
└─────────────────────────────────────────────────────┘

Authentication flow:
1. login.html → POST /api/auth/login
2. Server returns { token, user }
3. localStorage.setItem('token', token)
4. All pages: authMiddleware.js verifies JWT on every API call
5. Expired/missing token → 401 → redirect to login.html
```

---

## 4. Backend Architecture

### 4.1 Directory Structure
```
backend/
├── server.js               Entry point — http.createServer + Socket.io
├── app.js                  Express app — all middleware + routes registered
├── config/
│   └── db.js               MySQL connection pool (mysql v2.18.1 callbacks)
├── controllers/            37 controllers — one per HR module
│   ├── authController.js       Login, register, JWT issue
│   ├── payrollController.js    Payslip, salary, CTC
│   ├── leaveController.js      Apply, approve, balance
│   ├── attendanceController.js Clock-in, report, regularisation
│   ├── performanceController.js Reviews, OKR, PIP
│   ├── complianceController.js PF, ESI, LWF, POSH
│   ├── hiringController.js     JD, pipeline, offers
│   ├── aiController.js         RAG, Claude API, file parsing
│   └── ... (29 more)
├── routes/                 40 route files
│   └── [module].routes.js  Express Router — maps HTTP verbs to controllers
├── middleware/
│   ├── authMiddleware.js   verifyToken() — JWT decode + role attach
│   ├── securityMiddleware.js Rate limiting, CORS, Helmet, XSS
│   ├── auditMiddleware.js  Log every mutating request to audit_logs table
│   └── multerShim.js       File upload handler — MIME + size validation
└── services/
    ├── ragService.js       TF-IDF RAG — 27 knowledge chunks, cosine similarity
    ├── analyticsService.js Headcount trends, attrition, DEI calculations
    ├── cacheService.js     Redis get/set/del wrapper with TTL
    ├── fileParserService.js PDF (pdf-parse), DOCX (mammoth), Excel (xlsx)
    └── pdfService.js       Puppeteer — payslip PDF generation
```

### 4.2 Request Lifecycle
```
Client Request
    │
    ▼
Nginx (SSL, rate limit)
    │
    ▼
Express App (app.js)
    │
    ├── securityMiddleware → CORS, Helmet, rate limit, XSS sanitise
    │
    ├── authMiddleware → JWT verify, role check, req.user populated
    │
    ├── auditMiddleware → log mutation to audit_logs (POST/PUT/DELETE)
    │
    ├── Router (routes/[module].routes.js)
    │       └── Controller method (controllers/[module]Controller.js)
    │               └── MySQL query (parameterised)
    │               └── Redis cache (read/write)
    │               └── Response JSON
    │
    └── Error handler → { error, message } with appropriate HTTP code
```

---

## 5. Database Architecture

### 5.1 Schema Overview
```
Database: workforce_intelligence (utf8mb4, utf8mb4_unicode_ci)
Tables: 125

Core Tables:
├── users                   Employee master — all roles
├── departments             Dept hierarchy
├── designations            Role/grade definitions
├── employee_grades         L1–L8 band definitions
│
├── payroll                 Monthly payroll runs
├── payslips                Generated payslip PDFs
├── salary_structures       CTC component breakdown
├── salary_revisions        Increment history
├── tax_declarations        80C/80D/80EEA/HRA declarations
├── form24q                 TDS quarterly returns
│
├── leave_types             Annual/Sick/Casual/COMP-OFF/MBA
├── leave_requests          Applied leaves
├── leave_balances          Per-employee per-type balance
├── attendance_records      Daily clock-in/out
├── regularizations         Attendance correction requests
├── wfh_requests            WFH applications
├── shifts                  Shift definitions
├── shift_roster            Employee-to-shift assignments
│
├── performance_reviews     Annual/mid-year review data
├── okr_objectives          OKR objective headers
├── okr_key_results         KR details with progress
├── feedback_360            Peer/manager/subordinate ratings
├── pip_records             PIP plans
│
├── job_requisitions        Open positions
├── candidates              Applicant tracking
├── interview_schedules     Panel interview slots
├── offers                  Offer letters issued
├── onboarding_tasks        Joining checklist
├── exit_records            Resignation and FnF
│
├── compliance_pf           PF deduction records
├── compliance_esi          ESI deduction records
├── compliance_lwf          LWF per state
├── posh_complaints         POSH filing and status
├── audit_logs              Full immutable audit trail
├── consent_logs            DPDP consent events
│
└── ... (70+ more tables)
```

### 5.2 Key Relationships
```
users ──────┬──── leave_requests (user_id FK)
            ├──── attendance_records (user_id FK)
            ├──── payslips (user_id FK)
            ├──── performance_reviews (reviewee_id FK)
            ├──── okr_objectives (owner_id FK)
            └──── audit_logs (actor_id FK)

departments ─── users (dept_id FK)
employee_grades ─── users (grade_id FK)
```

---

## 6. AI Architecture

### 6.1 HR Copilot (RAG)
```
User Query
    │
    ▼
ragService.js
    │
    ├── 1. Pre-process query (lowercase, stop words removed)
    │
    ├── 2. TF-IDF vectorisation against 27 knowledge chunks:
    │       [leave-1 through leave-5]
    │       [payroll-1 through payroll-4]
    │       [tax-1 through tax-4]
    │       [pf-esi-1 through pf-esi-3]
    │       [posh-1, posh-2]
    │       [dpdp-1, dpdp-2]
    │       [wfh-1, wfh-2]
    │       [exit-1, exit-2]
    │       [fbp-1, comp-off-1]
    │
    ├── 3. Cosine similarity → top 3 chunks
    │
    ├── 4. Build prompt with context:
    │       System: "You are an expert Indian HR assistant..."
    │       Context: [chunk-1 text] [chunk-2 text] [chunk-3 text]
    │       User: original query
    │
    ├── 5. Claude Sonnet API call (max_tokens: 1000)
    │
    └── 6. Return response + [Sources: chunk-ids]
```

### 6.2 AI Assistant (Document Q&A)
```
File Upload → fileParserService.js
    ├── PDF → pdf-parse → text extraction
    ├── DOCX → mammoth → markdown conversion
    ├── Image → base64 → Claude vision
    └── Excel/CSV → xlsx → JSON rows

Text → Claude Sonnet → Answer + summary
```

---

## 7. Security Architecture

```
Layer 1: Network
  Nginx rate limiting + IP whitelist (production)

Layer 2: Transport
  HTTPS everywhere — Let's Encrypt TLS 1.3

Layer 3: Authentication
  JWT HS256 — 7 day expiry
  bcrypt SALT=12 — password hash
  Brute force: lockout after 5 failures / 15 min

Layer 4: Authorisation
  RBAC — 4 roles (admin/hr/manager/employee)
  Every route checks: verifyToken() → checkRole()

Layer 5: Input
  XSS sanitisation on all user inputs
  SQL injection: parameterised queries only
  File upload: MIME type + extension + 10MB limit

Layer 6: Transport Headers
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Strict-Transport-Security
  Content-Security-Policy
  Referrer-Policy
  Permissions-Policy

Layer 7: Audit
  Every POST/PUT/DELETE → audit_logs table
  Before + after values stored
  DPDP consent log — immutable

Layer 8: Data
  MySQL at-rest encryption (production)
  Sensitive fields masked by role
  PII data masking in logs
```

---

## 8. Real-time Architecture (Socket.io)

```
Server: socketServer.js
  ├── Overdue task poller (every 5 min)
  │     → emit('task:overdue', {taskId, assignee})
  ├── SOS alert broadcast
  │     → emit('sos:alert', {empId, location, time})
  └── Real-time monitor refresh (every 15s)
        → emit('rtm:update', {employees[]})

Client: real-time-monitor.html
  socket.on('rtm:update', renderGrid)
  socket.on('task:overdue', showAlert)
```

---

## 9. Deployment Architecture (Production)

```
                    [Internet]
                         │
                    [Cloudflare DNS]
                         │
                    [VPS / EC2]
                         │
              ┌──────────▼──────────┐
              │   Nginx 1.24        │
              │   Port 80 → 443     │
              │   Let's Encrypt SSL │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │   PM2 Cluster       │
              │   wfi-api (2 cores) │
              │   Port 5000         │
              └──────────┬──────────┘
                    ┌────┴────┐
         ┌──────────▼──┐  ┌──▼──────────┐
         │  MySQL 8.0  │  │  Redis 7    │
         │  Port 3306  │  │  Port 6379  │
         └─────────────┘  └─────────────┘
```

**PM2 Commands:**
```bash
pm2 start backend/server.js --name wfi-api --instances 2
pm2 save && pm2 startup
pm2 monit
```
