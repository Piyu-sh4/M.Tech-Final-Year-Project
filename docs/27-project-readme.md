> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# ⚡ Workforce Intelligence
> Complete HRMS Platform — AI-Powered, Production-Ready, Zero JS Errors

**Node.js 18 · Express 4 · MySQL 8 · Claude Sonnet · Docker Compose · PWA**

[![Pages](https://img.shields.io/badge/Pages-107-2563EB)](#)
[![Tables](https://img.shields.io/badge/DB_Tables-125-059669)](#)
[![JS Errors](https://img.shields.io/badge/JS_Errors-0-059669)](#)
[![Security](https://img.shields.io/badge/Security_Controls-14-DC2626)](#)
[![Research Gaps](https://img.shields.io/badge/Research_Features-39-7C3AED)](#)

---

## 🚀 Quick Start — 5 Minutes with Docker

```bash
# 1. Unzip and enter project
unzip WIP_v12_COMPLETE_FINAL.zip -d wfi && cd wfi/project_v8

# 2. Configure environment
cp .env.example .env
# Edit .env — set JWT_SECRET and optionally ANTHROPIC_API_KEY

# Generate a secure JWT_SECRET:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 3. Start everything (MySQL + Redis + API)
docker-compose up -d

# 4. Verify (wait ~30 seconds for MySQL to initialise)
curl http://localhost:5000/api/health
# Expected: {"status":"healthy","db":"connected"}

# 5. Open the platform
# http://localhost:5000/login.html
```

### Manual Setup (without Docker)

```bash
npm install
npm run db:create && npm run db:import      # local MySQL (or: docker compose up -d)
# Schema + demo data live in database/init/02_master.sql (125 tables, 2 views)
npm start
```

---

## 🔑 Default Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| **Admin** | admin@wip.com | P123/ | All 107 pages |
| **HR Manager** | hr@wfintelligence.com | P123/ | Payroll, compliance, onboarding |
| **Manager** | manager@wfintelligence.com | P123/ | Team, approvals, OKR |
| **Employee** | employee@wfintelligence.com | P123/ | Own payslip, leave, AI chat |

> ⚠️ **Change all default passwords after first login.**

---

## 📊 Platform at a Glance

| Module | Pages | Key Features |
|---|---|---|
| **Payroll & Tax** | 10 | CTC, HRA, TDS, Form 16, Advance Tax, 80EEA/80GG/80TTA |
| **Leave & Attendance** | 8 | COMP-OFF, Sandwich Rule, OT Tracker, Biometric Sync |
| **Performance** | 5 | 9-Box, OKR (Google 0.7), PIP, 360°, Mid-year Review |
| **Compliance** | 7 | PF, ESI, POSH, LWF, Equal Remuneration, DPDP Act 2023 |
| **AI Features** | 3 | HR Copilot (RAG), AI Assistant, Flight Risk Model |
| **Analytics** | 7 | Headcount, DEI, Workforce Planning, Fraud Detection |
| **Communication** | 7 | Team Connect, Chat, SOS, Helpdesk, Announcements |
| **Monitoring** | 4 | Real-Time Monitor, Cybersecurity, Audit Log |
| **Hiring** | 6 | Pipeline, Interview Scheduler, Onboarding, BGV |
| **Employee Ops** | 9 | Assets, Travel, Cab Tracking, Tasks, Welfare |
| **Benefits** | 6 | GTL Nominee, Critical Illness, Top-up, Credit Score |
| **Dashboards** | 3 | Employee, Admin, Manager |

---

## 🧠 AI Features (Claude Sonnet)

### HR Copilot — `/hr-copilot.html`
- 27-chunk TF-IDF RAG knowledge base covering: Leave, Payroll, Tax, PF/ESI, WFH, POSH, DPDP, Exit, FBP, COMP-OFF
- Every answer shows `[Sources: chunk-id]` citations for auditability
- Offline fallback when API is unavailable
- Requires: `ANTHROPIC_API_KEY=sk-ant-...` in `.env`

### AI Assistant — `/ai-assistant.html`
- Upload PDF, DOCX, Image, CSV, Excel → ask questions about it
- 8 quick actions: Summarize, Draft Email, Extract Action Items, Problem Statement Help
- Voice input via Web Speech API
- Chat history sidebar with export

---

## 🔬 Research Gap Features (39 features across 17 pages)

Features added from Indian HR practice gaps and labour law requirements:

| Page | Features Added |
|---|---|
| `leave.html` | COMP-OFF · Sandwich Rule Calculator · Leave Encashment Calc |
| `attendance.html` | OT Tracker + Approval · Core Hours (11AM–4PM) · Biometric Sync |
| `performance.html` | Mid-year Review · Promotion Recommendation Form |
| `posh-compliance.html` | Annual Report (Jan 31 deadline) · ICC Reconstitution · Dept Training % |
| `exit.html` | Knowledge Transfer Checklist · Rehire Eligibility Score |
| `helpdesk.html` | Self-service Knowledge Base with live search |
| `onboarding.html` | Day 30/60/90 Check-in Surveys · Buddy Program |
| `investment-declaration.html` | Sec 80EEA · Sec 80GG · Sec 80TTA/TTB |
| `workforce-planning.html` | Cost of Vacancy Calculator · Internal Mobility Map |
| `compliance.html` | Equal Remuneration Act Dashboard · Payment of Wages Tracker |
| `fraud-detection.html` | Ghost Employee Detection · Expense Fraud Pattern Scanner |
| `diversity.html` | Pay Equity Audit Tool · PWD Tracker (RPWD Act 2016) |
| `ai-insights.html` | Flight Risk Early Warning · Market Benchmark P50/P75/P90 |
| `career-roadmap.html` | Certification Roadmap by Band · Mentorship Program |
| `benefits.html` | GTL Nominee Declaration · Critical Illness Rider · Voluntary Top-up |
| `document-vault.html` | DigiLocker Integration · Document Expiry Alerts |
| `data-export.html` | DPDP Data Portability · Right to Erasure · Consent Audit Log |

---

## 🏗️ Architecture

```
Browser (106 HTML pages — Vanilla JS ES2022, PWA)
    │ HTTPS / WSS
Nginx (production) — SSL termination, reverse proxy
    │
Express API (Node.js 18, port 5000)
  ├── 40 route files
  ├── 37 controllers
  ├── 4 middleware (auth, security, audit, upload)
  └── 5 services (RAG, analytics, cache, PDF, file parser)
    │                    │
MySQL 8.0            Redis 7
(125 tables)         (cache, sessions)
    │
Anthropic Claude API (optional — AI features)
```

**Docker services:** `wfi_mysql` · `wfi_redis` · `wfi_api`

---

## 🔒 Security (14 Controls)

| Control | Implementation |
|---|---|
| Authentication | JWT HS256, 7-day token, role claim |
| Password | bcrypt SALT_ROUNDS=12 |
| Authorisation | RBAC 4 roles, enforced on every route |
| Rate Limiting | 300 API / 10 login / 5 register per 15 min |
| XSS | Input sanitisation on all fields |
| SQL Injection | Parameterised queries only |
| Security Headers | X-Frame-Options, HSTS, CSP, X-Content-Type |
| Audit Trail | Every mutation logged with before/after |
| Brute Force | Account lockout after 5 failed attempts |
| Session Mgmt | View + force-terminate active sessions |
| CORS | Configurable origin whitelist |
| DPDP Compliance | Consent dashboard, data portability, erasure |
| Fraud Detection | Ghost employee scan, payroll anomaly |
| File Uploads | MIME type + extension + 10MB limit |

---

## 📁 Project Structure

```
project_v8/
├── PRD.md                    Product Requirements Document
├── ARCHITECTURE.md           System architecture + diagrams
├── RULES.md                  Coding standards + conventions
├── PHASES.md                 Development roadmap (Phase 1–12)
├── DESIGN.md                 Design system + component library
├── MEMORY.md                 Project memory + session log
├── README.md                 This file
│
├── backend/
│   ├── server.js             Entry point + Socket.io
│   ├── app.js                Express app + all routes
│   ├── config/db.js          MySQL connection pool
│   ├── controllers/          37 controllers (one per HR module)
│   ├── routes/               40 route files
│   ├── middleware/           auth, security, audit, multer
│   └── services/             RAG, analytics, cache, PDF, file parser
│
├── frontend/
│   ├── index.html            Public landing page
│   ├── login.html            JWT auth page
│   ├── showcase.html         Platform showcase (all 107 pages)
│   └── [102 app pages]       All HR modules
│
├── database/
│   ├── init/02_master.sql   Complete schema + demo data (125 tables, 2 views)
│   ├── init/01_init.sql      Docker: create DB + user
│   ├── init/02_master.sql    Docker: all 125 tables + admin seed
│   ├── schema.sql            Tables only
│   └── seed_all_employees.sql  100+ demo employees
│
├── docker-compose.yml        3 containers: MySQL + Redis + API
├── Dockerfile                Production Node.js image
├── .env.example              Environment template
└── package.json              13 dependencies + 16 npm scripts
```

---

## ⚙️ npm Scripts

```bash
npm start              # Start API (production)
npm run dev            # Start with nodemon (auto-restart)
npm run db:init       # Create database + user, then import schema and demo data
npm run db:reset       # ⚠️ Drop + recreate database (WIPES ALL DATA)
npm run db:create     # Create database and wfi_user (needs MySQL root)
npm run db:import     # Import schema + demo data as wfi_user
npm run docker:up      # docker-compose up -d
npm run docker:down    # docker-compose down
npm test               # Run Jest test suite
npm run attrition      # Run Python ML attrition model
```

---

## 🌐 Key URLs

| URL | Description |
|---|---|
| `http://localhost:5000/login.html` | **Start here** — login page |
| `http://localhost:5000/showcase.html` | Platform showcase — all pages |
| `http://localhost:5000/api/health` | API + DB health check |
| `http://localhost:5000/employee-dashboard.html` | Employee home |
| `http://localhost:5000/admin-dashboard.html` | Admin home |
| `http://localhost:5000/hr-copilot.html` | AI HR Copilot (RAG) |
| `http://localhost:5000/ai-assistant.html` | AI document assistant |
| `http://localhost:5000/real-time-monitor.html` | Live employee monitor |

---

## 🔧 Environment Variables

```bash
# Required
JWT_SECRET=<64-char-random>          # node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
DB_HOST=localhost                     # Use 'db' for Docker
DB_USER=wfi_user
DB_PASSWORD=P123/
DB_NAME=workforce_intelligence
PORT=5000
NODE_ENV=production

# Optional — for AI features
ANTHROPIC_API_KEY=sk-ant-api03-...

# Production
CORS_ORIGIN=https://hr.yourcompany.com
SMTP_HOST=smtp.gmail.com
SMTP_USER=you@gmail.com
SMTP_PASS=your_app_password
```

---

## 🐳 Docker Commands

```bash
docker-compose up -d              # Start all 3 containers
docker-compose down               # Stop (data preserved)
docker-compose down -v            # Stop + DELETE all data ⚠️
docker-compose ps                 # Check container status
docker-compose logs -f wfi_api   # Stream API logs
docker-compose restart wfi_api   # Restart only the API
```

---

## 🏭 Production Deployment

```bash
# 1. Install PM2
npm install -g pm2

# 2. Start API in cluster mode
pm2 start backend/server.js --name wfi-api --instances 2
pm2 save && pm2 startup

# 3. Configure Nginx reverse proxy
# See ARCHITECTURE.md Section 9 for full Nginx config

# 4. Get SSL certificate
sudo certbot --nginx -d hr.yourcompany.com
```

---

## 📖 Documentation

| File | Contents |
|---|---|
| [PRD.md](06-PRD.md) | Product requirements, user stories, success metrics |
| [ARCHITECTURE.md](28-architecture.md) | System design, Docker setup, DB schema, security layers |
| [RULES.md](32-rules.md) | Coding standards, conventions, security rules |
| [PHASES.md](30-phases.md) | Development roadmap — 8 complete, 4 planned |
| [DESIGN.md](33-design.md) | Design system — colours, typography, components |
| [MEMORY.md](39-memory-log.md) | Project memory — decisions, bug fixes, session log |

---

## 🧪 Quality Assurance

- **0 JS errors** — Playwright-verified across all 107 pages
- **0 broken onclick handlers** — all functions defined
- **0 missing getElementById targets** — all IDs present
- **0 duplicate variable declarations** — no const/let conflicts
- **0 non-ASCII chars in JS** — all unicode-escaped

---

## 📚 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js v18+ |
| Framework | Express 4.x |
| Database | MySQL 8.0 (125 tables, utf8mb4) |
| Cache | Redis 7 (optional) |
| Real-time | Socket.io 4.x |
| AI | Claude Sonnet (Anthropic API) |
| RAG | TF-IDF — 27 knowledge chunks |
| Auth | JWT HS256 + bcrypt SALT=12 |
| Frontend | Vanilla JS ES2022 (no framework) |
| PWA | Service Worker + manifest |
| Maps | Leaflet 1.9.4 |
| ML | Python + scikit-learn |
| Containers | Docker Compose |
| Production | PM2 + Nginx + Let's Encrypt |

---

*⚡ Workforce Intelligence v12.0 — Complete HRMS Platform*  
*107 Pages · 125 DB Tables · 37 Controllers · 14 Security Controls · 39 Research Features · 0 JS Errors*  
*July 2026 · Confidential*
