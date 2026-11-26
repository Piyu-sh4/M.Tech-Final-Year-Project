> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# TASKS.md — Workforce Intelligence
## Task Registry — Completed & Outstanding

---

## ✅ COMPLETED

### Phase 1-8 Core Development
- [x] Node.js + Express project structure
- [x] MySQL connection pool + RBAC middleware
- [x] JWT HS256 auth + bcrypt SALT=12
- [x] 107 HTML pages across all HR modules
- [x] 37 controllers + 40 routes + 4 middleware + 5 services
- [x] 125 MySQL tables (utf8mb4)
- [x] Docker Compose — 3 services (MySQL + Redis + Node.js)
- [x] 14 security controls implemented
- [x] Socket.io real-time events
- [x] TF-IDF RAG service (27 knowledge chunks)
- [x] Claude Sonnet API integration

### Research Gap Features (39 across 17 pages)
- [x] leave.html — COMP-OFF, Sandwich Rule, Leave Encashment
- [x] attendance.html — OT Tracker, Core Hours, Biometric Sync
- [x] performance.html — Mid-year Review, Promotion Recommendation, Competency Framework, IDP
- [x] posh-compliance.html — Annual Report, ICC Reconstitution, Dept Training %
- [x] exit.html — KT Checklist, Rehire Score 87/100
- [x] helpdesk.html — Self-service Knowledge Base
- [x] onboarding.html — Day 30/60/90 Surveys, Buddy Program
- [x] investment-declaration.html — 80EEA, 80GG, 80TTA/TTB
- [x] workforce-planning.html — Cost of Vacancy, Internal Mobility Map
- [x] compliance.html — Equal Remuneration Act, Payment of Wages
- [x] fraud-detection.html — Ghost Employee Detection, Expense Fraud Scanner
- [x] diversity.html — Pay Equity Audit, PWD Tracker (RPWD Act 2016)
- [x] ai-insights.html — Flight Risk Warning, Compensation Benchmark P50/P75/P90
- [x] career-roadmap.html — Certification Roadmap, Mentorship Program
- [x] benefits.html — GTL Nominee, Critical Illness, Voluntary Top-up
- [x] document-vault.html — DigiLocker Integration, Document Expiry Alerts
- [x] data-export.html — DPDP Portability, Right to Erasure, Consent Audit Log

### PRD Gap Additions
- [x] admin-dashboard.html — Executive KPIs, Action Center, AI Proactive Insights
- [x] expenses.html — NEW standalone expense management page
- [x] performance.html — Competency Framework, Individual Development Plan


### All 102 App Pages — Build Completion
*(All pages built, JS-error-free, and Playwright-verified)*

**Payroll & Tax:**
- [x] payslip-portal.html
- [x] salary-revision.html
- [x] salary-advance.html
- [x] salary-transfer.html
- [x] tax-portal.html
- [x] flexible-benefits.html
- [x] banking.html
- [x] form-24q.html

**Leave & Attendance:**
- [x] wfh-tracker.html
- [x] regularization.html
- [x] shifts.html
- [x] shift-roster.html
- [x] time-tracker.html
- [x] maternity-leave.html
- [x] hr-calendar.html
- [x] holiday-calendar.html

**Performance & Career:**
- [x] goals-okr.html
- [x] 360-feedback.html
- [x] leaderboard.html
- [x] skills-matrix.html
- [x] training.html

**Hiring & Talent:**
- [x] hiring.html
- [x] interview-scheduler.html
- [x] employee-referral.html
- [x] background-verification.html
- [x] probation.html

**Compliance:**
- [x] lwf-tracker.html
- [x] statutory-bonus.html
- [x] minimum-wages.html
- [x] contract-labour.html
- [x] registration-tracker.html

**AI & Analytics:**
- [x] hr-copilot.html
- [x] ai-assistant.html
- [x] analytics.html
- [x] headcount.html
- [x] pulse-survey.html
- [x] audit-log.html
- [x] reports.html

**Communication & Safety:**
- [x] announcements.html
- [x] chat.html
- [x] sos-alerts.html
- [x] women-safety.html
- [x] grievance.html
- [x] team-connect.html

**Operations:**
- [x] assets.html
- [x] asset-disposal.html
- [x] travel.html
- [x] tasks.html
- [x] projects.html
- [x] meetings.html
- [x] awards.html
- [x] vendor-management.html
- [x] cab-tracking.html
- [x] cab-driver-panel.html
- [x] cab-drivers.html
- [x] cab-issues.html

**Employee Profile & Admin:**
- [x] profile.html
- [x] id-card.html
- [x] employee-directory.html
- [x] org-chart.html
- [x] employee-grades.html
- [x] dependents.html
- [x] letter-management.html
- [x] confirmation-letter.html
- [x] policy-library.html
- [x] disciplinary.html
- [x] emergency-center.html
- [x] family-transfer.html
- [x] location-settings.html
- [x] settings.html

**Benefits & Welfare:**
- [x] welfare.html
- [x] credit-score.html
- [x] loan-portal.html

**Monitoring & Security:**
- [x] real-time-monitor.html
- [x] cybersecurity.html
- [x] threat-monitor.html
- [x] session-management.html

**Dashboards:**
- [x] employee-dashboard.html
- [x] manager.html

**Compliance & Policy:**
- [x] privacy-policy.html
- [x] security-policy.html

### Bug Fixes
- [x] documentsRoutes.js — promisify callback db.query
- [x] policiesRoutes.js — promisify callback db.query
- [x] authMiddleware.js — add named exports (protect, verifyToken)
- [x] app.js — add frontend static file serving
- [x] expenses.html — IIFE scope fix for sidebar JS

### Documentation
- [x] README.md · PRD.md · ARCHITECTURE.md · RULES.md · PHASES.md · DESIGN.md · MEMORY.md
- [x] PROJECT.md · PLAN.md · TASKS.md · KNOWLEDGE.md · DECISION.md · STATUS.md · HANDOFF.md · FAILURE.md
- [x] WFI_v12_HowToRun_StepByStep.docx (28-page guide with download links)
- [x] WorkforceIntelligence_v12_Setup_Guide.docx (33-page setup guide)
- [x] WorkforceIntelligence_v12_Showcase.html (interactive showcase)

---

## 📋 OUTSTANDING

### Phase 9 — Production Deployment
- [ ] Provision Ubuntu 22.04 VPS (4GB RAM, 2 vCPU minimum)
- [ ] Install PM2, configure cluster mode (2 instances)
- [ ] Configure Nginx reverse proxy with WebSocket support
- [ ] Obtain Let's Encrypt SSL via certbot
- [ ] Configure UFW firewall (block 3306, 6379, 5000 from internet)
- [ ] Set up daily mysqldump to S3/Dropbox backup
- [ ] Configure GitHub Actions CI/CD
- [ ] Generate fresh JWT_SECRET for production
- [ ] Change all default passwords from P123/
- [ ] Set NODE_ENV=production, CORS_ORIGIN=your.domain

### Phase 10 — Advanced AI
- [ ] Predictive absenteeism model (Python + weather API)
- [ ] Sentiment analysis on pulse survey open-text
- [ ] JD quality scorer with bias detection
- [ ] OKR auto-scoring from Jira API
- [ ] Expand RAG to 50+ knowledge chunks

### Phase 11 — Integrations
- [ ] Jira REST API → OKR KR auto-scoring
- [ ] Slack Bolt → notifications + approvals
- [ ] DigiLocker OAuth → government document fetch
- [ ] EPFO portal → auto ECR filing
- [ ] NACH → bulk salary transfer

### Phase 12 — Mobile
- [ ] React Native scaffold (iOS + Android)
- [ ] Employee self-service screens
- [ ] Manager approval screens
- [ ] FCM push notifications
- [ ] Biometric login

### Technical Debt
- [ ] Upgrade mysql v2.18.1 → mysql2 (native Promise)
- [ ] Write Jest unit tests for all 37 controllers (target 70%)
- [ ] Write supertest integration tests for all 40 routes
- [ ] Implement proper logging (Winston/Pino)
- [ ] Add request validation middleware (Joi or Zod)
- [ ] Add API versioning (/api/v1/)
- [ ] Implement refresh token rotation
