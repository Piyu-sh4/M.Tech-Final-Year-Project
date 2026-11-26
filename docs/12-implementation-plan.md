> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# 🗓️ Implementation Plan — Workforce Intelligence

**Timeline**: 22 Weeks (Jan 2026 – Oct 2026)  
**Team**: 3 Full-Stack Devs · 1 HR Domain Expert · 1 QA · 1 DevOps  
**Methodology**: 2-week Agile sprints, CI/CD to staging on every merge

---

## Phase 1 — Foundation (Weeks 1–3) ✅

| Week | Task | Owner | Status |
|---|---|---|---|
| 1 | Project scaffold: Node.js + Express + MySQL + Redis | Backend | ✅ |
| 1 | Docker Compose setup (app + db + redis + nginx) | DevOps | ✅ |
| 1 | Database schema v1: users, roles, companies | Backend | ✅ |
| 2 | JWT auth: login, refresh, logout, role middleware | Backend | ✅ |
| 2 | Base HTML shell: sidebar, topbar, dark mode, cookie | Frontend | ✅ |
| 2 | Global utilities: dlPrint, dlCSV, showTab, st, tdm | Frontend | ✅ |
| 3 | Login page + Register page (with reg number field) | Frontend | ✅ |
| 3 | Admin Dashboard: KPIs, charts, activity feed | Frontend | ✅ |
| 3 | Employee Dashboard: widgets, quick actions | Frontend | ✅ |

## Phase 2 — Attendance & Leave (Weeks 4–6) ✅

| Week | Task | Owner | Status |
|---|---|---|---|
| 4 | Attendance schema + API (mark, history, regularise) | Backend | ✅ |
| 4 | Attendance page: 6 capture methods, real-time feed | Frontend | ✅ |
| 4 | Biometric enrollment page: fingerprint, face, PIN | Frontend | ✅ |
| 5 | Leave schema + API (apply, approve, balance) | Backend | ✅ |
| 5 | Leave management page: apply, approve, calendar | Frontend | ✅ |
| 5 | Holiday/Festival calendar (30 Indian holidays) | Frontend | ✅ |
| 6 | Shift roster + WFH tracker + time tracker | Frontend | ✅ |
| 6 | Face recognition page (TensorFlow.js + liveness) | Frontend | ✅ |

## Phase 3 — Payroll Core (Weeks 7–10) ✅

| Week | Task | Owner | Status |
|---|---|---|---|
| 7 | Payroll schema: salary_structures, payroll_runs, payslips | Backend | ✅ |
| 7 | Payroll calculator: gross, PF, ESI, TDS, LWF, Net | Backend | ✅ |
| 7 | Payroll run API: transaction-safe, audit logged | Backend | ✅ |
| 8 | Salary processing page: run, hold, reverse, lock | Frontend | ✅ |
| 8 | Payslip portal: self-service, download, email | Frontend | ✅ |
| 9 | Salary revision + salary advance pages | Frontend | ✅ |
| 9 | Investment declaration (80C/80D/HRA/LTA) | Frontend | ✅ |
| 10 | TDS / Tax portal + Form 24Q | Frontend | ✅ |
| 10 | Statutory bonus + LWF tracker | Frontend | ✅ |

## Phase 4 — Compliance & Statutory (Weeks 9–12) ✅

| Week | Task | Owner | Status |
|---|---|---|---|
| 9 | Statutory rates table (PF/ESI/LWF/PT multi-state) | Backend | ✅ |
| 9 | Compliance dashboard: challan status, filing tracker | Frontend | ✅ |
| 10 | Benefits management page | Frontend | ✅ |
| 11 | DPDP Act 2023 privacy policy page | Frontend | ✅ |
| 11 | Cookie policy (GDPR + DPDP, granular consent) | Frontend | ✅ |
| 12 | POSH complaints & ICC module | Frontend+Backend | ✅ |
| 12 | Company policies page (47 policies, acknowledge) | Frontend | ✅ |

## Phase 5 — Hiring & Onboarding (Weeks 11–13) ✅

| Week | Task | Owner | Status |
|---|---|---|---|
| 11 | Hiring schema + ATS API | Backend | ✅ |
| 11 | Hiring & ATS page: pipeline, interview scheduling | Frontend | ✅ |
| 12 | Background verification + employee referral | Frontend | ✅ |
| 12 | Onboarding: checklist, document collection, buddy | Frontend | ✅ |
| 13 | Registration tracker + confirmation letter gen | Frontend | ✅ |

## Phase 6 — Performance & Development (Weeks 12–15) ✅

| Week | Task | Owner | Status |
|---|---|---|---|
| 12 | Performance schema + review API | Backend | ✅ |
| 13 | Performance page: tabs + review cards | Frontend | ✅ |
| 13 | Self-assessment form (4-criteria, rating buttons) | Frontend | ✅ |
| 14 | Goals & OKR page: objectives, key results, check-ins | Frontend | ✅ |
| 14 | Training & LMS: catalog, progress, certificates | Frontend | ✅ |
| 15 | Skills matrix + career roadmap + probation | Frontend | ✅ |
| 15 | Leaderboard + awards & recognition | Frontend | ✅ |
| 15 | Exit management: FnF, clearance, experience letter | Frontend | ✅ |

## Phase 7 — AI & Intelligence (Weeks 13–16) ✅

| Week | Task | Owner | Status |
|---|---|---|---|
| 13 | Anthropic Claude API integration | Backend | ✅ |
| 13 | TF-IDF RAG pipeline for policy retrieval | Backend | ✅ |
| 14 | AI Assistant page: chat, voice mode, streaming | Frontend | ✅ |
| 15 | HR Copilot: policy queries, letter drafting | Frontend | ✅ |
| 16 | AI Insights: attrition risk, predictive analytics | Frontend | ✅ |

## Phase 8 — Security & Fraud (Weeks 14–17) ✅

| Week | Task | Owner | Status |
|---|---|---|---|
| 14 | Fraud detection engine: ghost employee, anomalies | Backend | ✅ |
| 15 | Fraud detection dashboard: alerts, cases, CSV | Frontend | ✅ |
| 16 | Cybersecurity SIEM dashboard: incidents, blocking | Frontend | ✅ |
| 16 | Threat monitor + audit log + session management | Frontend | ✅ |
| 17 | IT security policy page + security policy | Frontend | ✅ |

## Phase 9 — Safety & Welfare (Weeks 15–18) ✅

| Week | Task | Owner | Status |
|---|---|---|---|
| 15 | 112 Emergency & SOS page | Frontend | ✅ |
| 16 | Women safety policy + cab booking (night safety) | Frontend | ✅ |
| 17 | Mental health & EAP (12 free sessions, crisis) | Frontend | ✅ |
| 17 | Visitor management system | Frontend | ✅ |
| 18 | Pulse survey + team connect + welfare hub | Frontend | ✅ |

## Phase 10 — Analytics & Reports (Weeks 16–18) ✅

| Week | Task | Owner | Status |
|---|---|---|---|
| 16 | Analytics dashboard: headcount, attrition heatmaps | Frontend | ✅ |
| 17 | Reports center: 40+ templates, CSV/PDF | Frontend | ✅ |
| 18 | Workforce planning + real-time monitor | Frontend | ✅ |
| 18 | Diversity dashboard + DEI analytics | Frontend | ✅ |

## Phase 11 — Employee Self-Service (Weeks 17–19) ✅

| Week | Task | Owner | Status |
|---|---|---|---|
| 17 | Employee self-service portal: 12 quick actions | Frontend | ✅ |
| 18 | My Requests tab: table, status, download cert | Frontend | ✅ |
| 18 | Employee requests API: submit, approve, download | Backend | ✅ |
| 19 | Document vault + profile management | Frontend | ✅ |

## Phase 12 — New Feature Pages (Weeks 17–20) ✅

| Week | Task | Owner | Status |
|---|---|---|---|
| 17 | Shift bidding & exchange system | Frontend | ✅ |
| 18 | Biometric enrollment center (full flow) | Frontend | ✅ |
| 19 | Manager dashboard: team view, approvals | Frontend | ✅ |
| 19 | Activity history: 6-tab audit trail | Frontend | ✅ |
| 20 | Helpdesk + tasks + notifications + chat | Frontend | ✅ |

## Phase 13 — Bug Fixes & Quality (Weeks 20–22) ✅

| Week | Task | Root Cause | Status |
|---|---|---|---|
| 20 | Fix multiline dlPrint JS string (54 pages) | Newline inside `'...'` | ✅ |
| 20 | Fix injection point (wfi-utils in wrong position) | `</body>` inside JS string | ✅ |
| 20 | Fix ₹ symbol (Rs → ₹ on 9 financial pages) | ASCII Rs not converted | ✅ |
| 21 | Fix tab switching (camelCase ID mismatch, 28 pages) | `tabTimeline` vs `tabtimeline` | ✅ |
| 21 | Fix unclosed div tags (43 pages) | Extra divs not closed | ✅ |
| 21 | Add 60+ missing onclick stubs via wfi-utils | Functions not on window | ✅ |
| 21 | Fix assets.html + flexible-benefits.html syntax | Orphan catch, multiline | ✅ |
| 22 | Add self-assessment form to performance.html | Feature gap | ✅ |
| 22 | Add My Requests tab to employee-self-service | Feature gap | ✅ |
| 22 | Add registration number field to register.html | Feature gap | ✅ |
| 22 | Add EAP click handlers to mental-health.html | UX improvement | ✅ |
| 22 | Add @media print CSS to all 117 pages | Print layout broken | ✅ |
| 22 | Final audit: 116/116 clean, 0 JS errors | — | ✅ |

---

## Resource Allocation

| Role | Weeks Active | Primary Responsibility |
|---|---|---|
| Full-Stack Dev 1 | 1–22 | Backend API, payroll engine, compliance |
| Full-Stack Dev 2 | 1–22 | Frontend pages, UI components |
| Full-Stack Dev 3 | 4–22 | AI integration, security, new pages |
| HR Domain Expert | 1–22 | Statutory accuracy review, WA testing |
| QA Engineer | 8–22 | Testing, Playwright audits, bug reports |
| DevOps Engineer | 1–4, 18–22 | Docker, CI/CD, production setup |

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Statutory rate changes mid-project | Medium | High | Rate table in DB (not hardcoded), easy update |
| Claude API outage | Low | Medium | Graceful fallback, AI sections degrade silently |
| MySQL performance at scale | Low | High | Redis caching, indexed queries, connection pool |
| JS multiline string bugs | High (happened) | High | All dlPrint strings single-line, linter rule |
| DPDP compliance gaps | Medium | Critical | Legal review each sprint, privacy-first design |
| Browser compatibility | Low | Medium | Playwright tests on Chrome + Firefox + Safari |

---

## Definition of Done

A feature/page is **DONE** when:
- [ ] Functionality works as per PRD acceptance criteria
- [ ] 0 JS runtime errors in Playwright audit
- [ ] dlPrint opens formatted print window with ₹ amounts
- [ ] dlCSV downloads correct CSV file
- [ ] Dark mode toggle works
- [ ] Cookie banner present
- [ ] Mobile responsive at 375px (no horizontal scroll)
- [ ] Print layout correct (@media print)
- [ ] Unit tests written (for calculations)
- [ ] Code reviewed and approved
- [ ] WA test signed off by HR domain expert
- [ ] Audit log entry created for data mutations
- [ ] Merged to develop, deployed to staging
