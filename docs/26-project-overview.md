> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# PROJECT.md — Workforce Intelligence
## Project Identity & Overview

**Product Name:** Workforce Intelligence (WFI)
**Version:** 12.0.0
**Type:** Enterprise HRMS Web Application
**Stack:** Node.js 18 · Express 4 · MySQL 8.0 · Redis 7 · Docker · Claude Sonnet AI
**Status:** Production Ready — 107 pages · 0 JS errors · All features verified
**Last Updated:** August 2026

---

## Quick Facts

| Item | Value |
|---|---|
| Total HTML pages | 107 |
| App pages (login-protected) | 102 |
| Backend controllers | 37 |
| Route files | 40 |
| Middleware files | 4 |
| Service files | 5 |
| MySQL tables | 125 |
| Security controls | 14 |
| Research gap features | 39 |
| JS errors (Playwright) | **0** |
| Database password | P123/ |
| Default login | admin@wip.com / P123/ |

---

## Repository Structure

```
project_v8/
├── PROJECT.md      ← You are here
├── PLAN.md         ← Strategy, architecture decisions, roadmap
├── TASKS.md        ← All tasks completed and outstanding
├── KNOWLEDGE.md    ← Domain knowledge, HR laws, business rules
├── DECISION.md     ← All key technical and product decisions
├── STATUS.md       ← Current project health and metrics
├── HANDOFF.md      ← Onboarding guide for new developers
├── FAILURE.md      ← Bug registry, root causes, fixes
├── PRD.md          ← Product Requirements Document
├── ARCHITECTURE.md ← System design and infrastructure
├── RULES.md        ← Coding standards and conventions
├── PHASES.md       ← Development roadmap Phase 1-12
├── DESIGN.md       ← Design system and component library
├── MEMORY.md       ← Session log and key decisions
├── README.md       ← Quick start and platform overview
├── backend/        ← 37 controllers, 40 routes, 4 middleware, 5 services
├── frontend/       ← 107 HTML pages
├── database/       ← Master SQL + init files
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── package.json
```

---

## User Roles

| Role | Email | Password | Access |
|---|---|---|---|
| Admin | admin@wip.com | P123/ | All 102 pages |
| HR Manager | hr@wfintelligence.com | P123/ | Payroll, compliance, hiring |
| Manager | manager@wfintelligence.com | P123/ | Team, approvals, OKR |
| Employee | employee@wfintelligence.com | P123/ | Own payslip, leave, AI chat |

---

## Module Catalogue — All 100 App Pages

### Payroll & Tax (10 pages)
- **payslip-portal.html** — Download payslips, Form 16, YTD summary, arrears
- **salary.html** — CTC breakdown, HRA calculation, perquisite tax u/s 17(2)
- **salary-revision.html** — Increment history and appraisal letter generation
- **salary-advance.html** — Salary advance application and EMI repayment plan
- **salary-transfer.html** — Bank account management for salary credit
- **tax-portal.html** — IT calculator, advance tax 4 instalments, AIS/TIS
- **investment-declaration.html** — 80C/80D/80EEA/80GG/80TTA declarations, NPS
- **flexible-benefits.html** — FBP restructuring — meal, fuel, phone, LTA, NPS
- **banking.html** — Bank account management
- **form-24q.html** — Quarterly TDS return and challan generation

### Leave & Attendance (8 pages)
- **leave.html** — Apply leave, COMP-OFF, Sandwich Rule, Encashment calc
- **attendance.html** — Clock in/out, OT Tracker, Core Hours, Biometric Sync, heatmap
- **maternity-leave.html** — MBA 2017 — 26-week, adoption, surrogacy, crèche
- **wfh-tracker.html** — WFH requests, approval workflow, team visibility
- **regularization.html** — Regularise late arrivals with manager approval
- **shifts.html** — Shift definitions — Day, Evening, Night, Rotational
- **shift-roster.html** — Shift assignments and swap requests
- **time-tracker.html** — Project-wise time logging and billable hours

### Performance (6 pages)
- **performance.html** — Reviews, 9-Box, PIP, Mid-year Review, Promotion, Competency, IDP
- **goals-okr.html** — OKR with Google 0.7 grading and KR weighting
- **360-feedback.html** — Multi-rater feedback — peer, manager, subordinate
- **leaderboard.html** — Gamified recognition leaderboard with points
- **career-roadmap.html** — Skill levels, cert roadmap by band, mentorship
- **skills-matrix.html** — Skill proficiency matrix and gap analysis

### Hiring & Talent (7 pages)
- **hiring.html** — Job requisitions, pipeline Kanban, JD builder
- **interview-scheduler.html** — Panel interview slots and coordination
- **onboarding.html** — Checklist, Day 30/60/90 surveys, Buddy program
- **background-verification.html** — BGV initiation, vendor tracking, risk score
- **employee-referral.html** — Referral program and bonus tracking
- **probation.html** — Probation timeline and extension workflow
- **training.html** — L&D catalog, budget tracker, external courses

### Exit & Letters (3 pages)
- **exit.html** — Resignation, FnF, KT Checklist, Rehire Score 87/100
- **letter-management.html** — Generate offer, experience, increment letters
- **confirmation-letter.html** — Probation confirmation letter

### Compliance (7 pages)
- **compliance.html** — PF, ESI, Gratuity, Equal Remuneration, Payment of Wages
- **posh-compliance.html** — POSH — ICC, Annual Report Jan 31, Dept Training %
- **lwf-tracker.html** — LWF all states — challan generation and compliance
- **statutory-bonus.html** — Bonus Act — Form A/B/C/D, set-on/set-off
- **minimum-wages.html** — State-wise minimum wages — DA auto-update, zone checker
- **contract-labour.html** — CLPRA registers and contractor compliance
- **registration-tracker.html** — PAN, Aadhaar, PF, ESI registration status

### AI Features (3 pages)
- **hr-copilot.html** — HR Copilot RAG — 27 chunks, Claude Sonnet, source citations
- **ai-assistant.html** — AI document Q&A — PDF/DOCX/Image upload, 8 quick actions, voice
- **ai-insights.html** — Flight Risk Warning, attrition prediction, P50/P75/P90 benchmark

### Analytics & Reporting (8 pages)
- **analytics.html** — KPI dashboard — revenue per employee, headcount, trends
- **headcount.html** — Headcount by dept, location, grade with sparklines
- **workforce-planning.html** — Cost of Vacancy, Succession, Internal Mobility Map
- **diversity.html** — DEI score, Pay Equity Audit, PWD Tracker (RPWD Act 2016)
- **pulse-survey.html** — Employee engagement survey and eNPS calculation
- **fraud-detection.html** — Ghost Employee Detection, Expense Fraud Scanner
- **audit-log.html** — Immutable audit trail — 7-year retention, CSV export
- **reports.html** — Custom reports — headcount, payroll, attendance, compliance

### Communication (8 pages)
- **team-connect.html** — 3-tab chat: Direct, Groups, IT Support Bot
- **chat.html** — Live 1:1 and group messaging
- **announcements.html** — Company-wide announcement publishing
- **notifications.html** — All notifications — filter, mark read, settings
- **helpdesk.html** — Tickets, SLA, Self-service Knowledge Base with search
- **grievance.html** — L1 → mediation → Labour Court escalation
- **women-safety.html** — Safety features, POSH link, emergency contacts
- **sos-alerts.html** — Emergency SOS with Leaflet map geolocation

### Safety & Security Monitoring (5 pages)
- **real-time-monitor.html** — Live 25-employee status grid with 15-second refresh
- **cybersecurity.html** — Security score, VAPT results, threat levels
- **threat-monitor.html** — Live threat feed, incident log, SIEM integration
- **session-management.html** — View active sessions, force logout remotely
- **disciplinary.html** — Show cause notice, warning letter, suspension workflow

### Operations (9 pages)
- **tasks.html** — Task management with priority and due-date tracking
- **projects.html** — Project allocation, utilisation bar, overallocation alerts
- **meetings.html** — Room booking, video links, action item tracking
- **travel.html** — Travel requests, expense claims, hotel rate check
- **expenses.html** — Expense claim submission, receipt upload, status tracking
- **assets.html** — IT asset tracking, BYOD, MDM compliance
- **asset-disposal.html** — End-of-life IT asset disposal and replacement
- **vendor-management.html** — Vendor onboarding, PO workflow, MSME compliance, scorecard
- **awards.html** — Spot awards, peer recognition, monthly winners

### Cab & Transport (4 pages)
- **cab-tracking.html** — Cab booking, live GPS tracking, SOS, 2-hour return rule
- **cab-driver-panel.html** — Driver-side portal — assigned routes and trip status
- **cab-drivers.html** — Fleet management — driver profiles and vehicle assignments
- **cab-issues.html** — Cab incident and complaint reporting

### Benefits & Welfare (4 pages)
- **benefits.html** — Health plans, GTL Nominee, Critical Illness, Voluntary Top-up
- **welfare.html** — EAP sessions, wellbeing pulse (6 dimensions), fitness reimbursement
- **credit-score.html** — Financial health score, debt-to-income, investment overview
- **loan-portal.html** — Company loan application, EMI calculator, foreclosure

### Employee Profile (4 pages)
- **profile.html** — Personal details, photo, emergency contact, PAN/Aadhaar
- **id-card.html** — Digital employee ID with QR code and download
- **document-vault.html** — DigiLocker integration, personal docs, expiry alerts
- **dependents.html** — Family details and insurance nominee management

### HR Administration (9 pages)
- **employee-directory.html** — Search and view all employees with filters
- **org-chart.html** — Organisation hierarchy — click to expand departments
- **employee-grades.html** — Band/grade L1-L8 definitions and pay scale
- **policy-library.html** — Company policies with digital acknowledgement tracking
- **data-export.html** — DPDP portability, Right to Erasure, Consent Audit Log
- **emergency-center.html** — Mass alert broadcast, emergency contact directory
- **family-transfer.html** — Relocation request and family expense reimbursement
- **location-settings.html** — Office locations, geofence config, WFH rules
- **settings.html** — Platform settings, white-label branding, notification rules

### Dashboards (3 pages)
- **employee-dashboard.html** — Employee main portal — payslip, leave, attendance, AI chat
- **admin-dashboard.html** — Admin full access — KPIs, Action Center, AI Insights
- **manager.html** — Manager portal — team view, approvals, OKR tracking

### Security & Policy (2 pages)
- **privacy-policy.html** — DPDP Act 2023 policy and employee consent dashboard
- **security-policy.html** — Company IT and data security policy acknowledgement

## Technology Choices

| Technology | Reason |
|---|---|
| Vanilla JS | Zero build step, direct file access, all pages work offline |
| MySQL 8.0 v2.18.1 | Stable callbacks, wide community, production-proven |
| TF-IDF RAG | No external vector DB, works offline, deterministic |
| Docker Compose | One command starts MySQL + Redis + Node.js |
| Claude Sonnet | Best-in-class HR Q&A with source citations |
| Playwright | Only tool that catches real runtime JS errors |
