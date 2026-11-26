> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# PHASES.md — Workforce Intelligence
## Development Phases & Roadmap

**Version:** 12.0 | **Date:** July 2026

---

## Phase Summary

| Phase | Name | Status | Pages | Key Deliverable |
|---|---|---|---|---|
| Phase 1 | Foundation | ✅ Complete | 20 | Auth, Employee, Payroll core |
| Phase 2 | HR Operations | ✅ Complete | 40 | Leave, Attendance, Compliance |
| Phase 3 | Performance & Growth | ✅ Complete | 55 | OKR, 360°, Hiring, Onboarding |
| Phase 4 | Analytics & AI | ✅ Complete | 75 | AI Copilot, Analytics, Workforce |
| Phase 5 | Security & Communication | ✅ Complete | 90 | Security, Chat, SOS, POSH |
| Phase 6 | Advanced Features | ✅ Complete | 101 | Real-time, AI Assistant, Team Connect |
| Phase 7 | Research Gap Features | ✅ Complete | 101 | 39 research-backed additions |
| Phase 8 | Quality & Zero Defects | ✅ Complete | 106 | 0 JS errors, full audit |
| **Phase 9** | **Production Deployment** | 🔄 Next | 106 | PM2 + Nginx + HTTPS + CI/CD |
| **Phase 10** | **Advanced AI & ML** | 📋 Planned | — | Predictive models, GenAI workflows |
| **Phase 11** | **Integrations** | 📋 Planned | — | Jira, SAP, Zoho, Banks |
| **Phase 12** | **Mobile App** | 📋 Planned | — | React Native iOS + Android |

---

## ✅ Phase 1 — Foundation (Complete)

**Goal:** Core authentication, employee master, and payroll.

### Delivered
- User registration and login with JWT HS256
- bcrypt password hashing SALT=12
- Employee dashboard with stats cards
- Admin dashboard with full access
- MySQL schema — 50 initial tables
- CTC structure and salary components
- Basic payslip generation

### Pages Created
`login, register, index, employee-dashboard, admin-dashboard, profile, payslip-portal, salary, banking, id-card`

---

## ✅ Phase 2 — HR Operations (Complete)

**Goal:** Leave management, attendance, statutory compliance.

### Delivered
- Leave types: Annual, Sick, Casual, Maternity, COMP-OFF
- LOP calculator: Basic ÷ 26 × LOP days
- Clock-in/out with biometric sync
- Regularisation and WFH workflow
- PF, ESI, Gratuity, PT calculators
- LWF for all states
- Statutory Bonus Act
- Minimum Wages by state

### Pages Created
`leave, attendance, maternity-leave, regularization, wfh-tracker, shifts, shift-roster, time-tracker, compliance, lwf-tracker, statutory-bonus, minimum-wages, contract-labour`

---

## ✅ Phase 3 — Performance & Growth (Complete)

**Goal:** Full performance management lifecycle and talent acquisition.

### Delivered
- 9-Box grid (Performance × Potential)
- OKR tracking with Google 0.7 grading
- PIP 30/60/90 day plans
- 360-degree feedback system
- Career roadmap with skill proficiency (0–4 levels)
- Hiring pipeline — JD → Screening → Interview → Offer
- Employee onboarding checklist
- Background verification workflow
- Probation tracker

### Pages Created
`performance, goals-okr, 360-feedback, career-roadmap, leaderboard, hiring, interview-scheduler, onboarding, background-verification, employee-referral, probation, employee-grades`

---

## ✅ Phase 4 — Analytics & AI (Complete)

**Goal:** Data-driven HR decisions and AI-powered assistance.

### Delivered
- HR Copilot with 27-chunk TF-IDF RAG knowledge base
- Source citations: [Sources: leave-1, payroll-2]
- Headcount analytics by department and location
- Workforce planning with succession and skills gap
- DEI dashboard — gender ratio, diversity score, eNPS
- Pulse survey with engagement metrics
- AI Insights with attrition prediction (Python ML)
- Form 16, Form 24Q, AIS/TIS

### Pages Created
`hr-copilot, ai-insights, analytics, headcount, workforce-planning, diversity, pulse-survey, tax-portal, investment-declaration, form-24q, payslip-portal (enhanced), flexible-benefits`

---

## ✅ Phase 5 — Security & Communication (Complete)

**Goal:** Enterprise security controls and employee communication.

### Delivered
- 14 security controls implemented
- POSH compliance with ICC management
- Grievance escalation L1 → Labour Court
- Disciplinary process — show cause, warning, suspension
- SOS alerts with Leaflet map integration
- Women safety features
- Cybersecurity dashboard with VAPT scores
- Fraud detection — ghost employee, payroll anomaly
- DPDP Act 2023 — consent, data export, erasure
- Audit log with 7-year retention

### Pages Created
`posh-compliance, grievance, disciplinary, sos-alerts, women-safety, cybersecurity, fraud-detection, threat-monitor, privacy-policy, security-policy, session-management, audit-log, data-export`

---

## ✅ Phase 6 — Advanced Features (Complete)

**Goal:** Three major new pages + sidebar navigation updates.

### Delivered

#### Real-Time Employee Monitor (58KB)
- Live 25-employee grid — Active/Idle/Break/Offline
- Pulse animation per status
- Productivity bars (green/amber/red)
- 9AM–7PM work intensity heatmap
- Department productivity breakdown
- Auto-alerts: idle 45+ min, absent, late
- 15-second auto-refresh
- CSV export

#### AI Assistant (64KB)
- Claude Sonnet document Q&A
- PDF, DOCX, Image, CSV, Excel upload
- 8 quick actions: Summarize, Draft Email, Extract Action Items
- Problem Statement structured guide
- Voice input via Web Speech API
- Chat history sidebar
- Export conversation as .txt

#### Team Connect Chat (61KB)
- 3-tab interface: Direct / Groups / Support
- Direct: 6 contacts with online status
- Groups: Engineering (22), HR (142), Project Alpha
- IT Support Bot with ticket IDs and ETA
- Anonymous Feedback channel
- File attachments with preview chips
- Video / Voice call buttons
- Quick reply chips

### Pages Created
`real-time-monitor, ai-assistant, team-connect`

---

## ✅ Phase 7 — Research Gap Features (Complete)

**Goal:** Add 39 features across 17 pages based on HR industry research.

### Wave 1 — Original 9 Pages
| Page | Features Added |
|---|---|
| `leave.html` | COMP-OFF · Sandwich Rule · Encashment Calc |
| `attendance.html` | OT Tracker · Core Hours · Biometric Sync |
| `performance.html` | Mid-year Review · Promotion Recommendation |
| `posh-compliance.html` | Annual Report (Jan 31) · ICC Reconstitution · Dept Training % |
| `exit.html` | KT Checklist · Rehire Score 87/100 |
| `helpdesk.html` | Self-service Knowledge Base with search |
| `onboarding.html` | Day 30/60/90 Surveys · Buddy Program |
| `investment-declaration.html` | 80EEA · 80GG · 80TTA/TTB |
| `workforce-planning.html` | Cost of Vacancy · Internal Mobility Map |

### Wave 2 — 8 More Pages
| Page | Features Added |
|---|---|
| `compliance.html` | Equal Remuneration Act · Payment of Wages Tracker |
| `fraud-detection.html` | Ghost Employee Detection · Expense Fraud Scanner |
| `diversity.html` | Pay Equity Audit · PWD Tracker (RPWD Act 2016) |
| `ai-insights.html` | Flight Risk Warning · P50/P75/P90 Benchmark |
| `career-roadmap.html` | Certification Roadmap by Band · Mentorship Program |
| `benefits.html` | GTL Nominee · Critical Illness · Voluntary Top-up |
| `document-vault.html` | DigiLocker Integration · Document Expiry Alerts |
| `data-export.html` | DPDP Portability · Right to Erasure · Consent Log |

---

## ✅ Phase 8 — Quality & Zero Defects (Complete)

**Goal:** Zero JS errors across all pages.

### Fixes Applied
- Replaced broken sidebar JS on 33 pages (dlPrint template literal issue)
- Fixed duplicate `const token` / `const API` declarations — 15+ pages
- Replaced all non-ASCII chars in JS strings — 67 pages (✅→\u2705)
- Fixed `{{length:31}}` double-brace syntax — hr-calendar.html
- Fixed `async()=>{}` arrow functions — hr-copilot.html
- Added null-guard `getElementById` proxy — 10+ pages
- Fixed `function init()` missing — policy-library.html
- Added `userInput` ID alias — hr-copilot.html
- Fixed all missing `_sp` placeholder IDs — 34 pages
- Added `buildYearOptions()` — holiday-calendar.html
- Removed duplicate sidebar script blocks — 5 pages
- Rebuilt broken `dlPrint()` in onboarding.html (injected HTML inside template literal)
- Added `take60Survey()` function — onboarding.html

### Final Audit Result
```
107 pages checked — 0 JS errors — 100% clean
```

---

## 🔄 Phase 9 — Production Deployment (Next)

**Goal:** Deploy to production server with full security hardening.

### Steps
1. **Server provisioning** — Ubuntu 22.04 VPS (DigitalOcean/AWS EC2 t3.medium)
2. **MySQL** — Install MySQL 8.0, create production DB, load master SQL
3. **Redis** — Install Redis 7, configure persistence (AOF)
4. **Node.js** — Install via nvm, `npm install --production`
5. **PM2** — `pm2 start backend/server.js --instances 2 --name wfi-api`
6. **Nginx** — Configure reverse proxy, WebSocket upgrade
7. **SSL** — Let's Encrypt via certbot, auto-renewal
8. **Environment** — Generate fresh JWT_SECRET, set CORS_ORIGIN to domain
9. **Firewall** — UFW: allow 80, 443 only; block 3306, 6379 externally
10. **Monitoring** — PM2 monit + health check endpoint `/api/health`
11. **Backups** — Daily mysqldump cron + S3 upload
12. **CI/CD** — GitHub Actions: test → build → PM2 reload on merge to main

### Checklist
- [ ] Change all default passwords (admin, hr, manager, employee)
- [ ] Generate new JWT_SECRET with crypto.randomBytes(64)
- [ ] Set NODE_ENV=production
- [ ] Set CORS_ORIGIN=https://hr.yourcompany.com
- [ ] Configure SMTP with real credentials
- [ ] Enable MySQL slow query log
- [ ] Set up automated backups
- [ ] Run `npm audit fix`
- [ ] Configure log rotation

---

## 📋 Phase 10 — Advanced AI & ML (Planned)

**Goal:** Expand AI capabilities with predictive and generative features.

### Planned Features
- **Predictive Absenteeism** — Who is likely absent this week (historical patterns + weather API)
- **Sentiment Analysis** — Free-text pulse survey responses → word cloud + score
- **JD Quality Scorer** — AI rates job descriptions for clarity and bias
- **Interview Transcript Summarizer** — Paste interview notes → structured feedback
- **Policy Chatbot** — Employees ask any HR policy question → instant answer
- **OKR Auto-scoring** — Pull ticket count from Jira → auto-update KR progress
- **Pay Equity ML** — Detect unexplained pay gaps with controlled variables
- **Retention Risk Actions** — AI suggests specific retention actions per employee

### Tech Stack Additions
- LangChain for advanced RAG chains
- Vector database (Pinecone or pgvector) for semantic search
- Python FastAPI microservice for ML models
- OpenAI Whisper for interview audio transcription

---

## 📋 Phase 11 — Third-party Integrations (Planned)

**Goal:** Connect with tools already in use at enterprises.

| Integration | API | Use Case |
|---|---|---|
| Jira | REST API | Auto-score OKR KRs from sprint velocity |
| GitHub | Webhooks | PR count → developer productivity KR |
| Slack | Bolt SDK | HR notifications + approval buttons in Slack |
| Zoho People | REST | Migrate employee data from Zoho |
| SAP HANA | ODBC | Two-way sync with SAP payroll |
| Razorpay | API | Salary advance disbursement |
| NPCI / NACH | API | Bulk salary transfer via NACH mandate |
| DigiLocker | OAuth | Fetch verified Aadhaar, PAN, certificates |
| MCA21 | API | Verify company registration for contractors |
| EPFO | Portal | Auto-file ECR (Electronic Challan cum Return) |

---

## 📋 Phase 12 — Mobile Application (Planned)

**Goal:** Native mobile app for employees (iOS + Android).

### Scope
- React Native cross-platform app
- Employee self-service: payslip, leave, tax, cab booking
- Manager approvals: leave, attendance, expense claims
- Push notifications: leave status, salary credited, OKR due
- Biometric login: Face ID / Fingerprint
- Offline mode: last payslip, leave balance cached
- SOS button: one-tap emergency alert with GPS

### Timeline
- Q1 2027: MVP (payslip, leave, notifications)
- Q2 2027: Manager approvals + performance
- Q3 2027: Full feature parity with web
- Q4 2027: App Store + Play Store release

---

## Future Research Areas

| Topic | Why Important |
|---|---|
| **Gig Worker Compliance** | Platform workers under Code on Social Security 2020 |
| **ESOPs & ESPP Automation** | Complex tax — exercise, holding, sale — different treatment |
| **Hypercare Post-acquisition** | M&A HR integration — harmonising policies and grades |
| **HR Chatbot (WhatsApp)** | 90%+ Indian employees use WhatsApp — meet them there |
| **Carbon Footprint per Employee** | ESG reporting requirement for listed companies |
| **Skills Graph (Neo4j)** | Graph DB for skill adjacency — better redeployment suggestions |
| **Predictive Payroll Audit** | ML flags likely TDS errors before ITR filing season |
