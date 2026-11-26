> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# PLAN.md — Workforce Intelligence
## Product Strategy, Architecture Plan & Roadmap

**Version:** 12.0 | **Date:** August 2026

---

## 1. Product Vision

Build the most complete, production-ready HRMS for Indian mid-market enterprises — one that handles the full employee lifecycle, statutory compliance, AI-powered insights, and real-time monitoring — in a single unified platform with zero external SaaS dependencies.

### Strategic Pillars

| Pillar | Goal |
|---|---|
| Completeness | Every HR workflow in one platform |
| Compliance | Indian labour laws built-in — PF, ESI, LWF, POSH, DPDP, Bonus Act |
| AI-first | Claude Sonnet RAG answers policy questions with cited sources |
| Research-backed | 39 features from real HR practice gaps |
| Zero defects | Playwright-verified 0 JS errors across all 107 pages |
| Rapid deployment | Docker setup in under 10 minutes |

---

## 2. Architecture Decisions

### Frontend: Vanilla JS, No Framework
- Zero build toolchain — pages open directly in browser
- Each page self-contained — debug in isolation
- 107 HTML pages, one per module
- Sidebar JS shared via common script block (copy-paste pattern)

### Backend: Express 4 + MySQL v2.18.1
- Callback-based MySQL with Promise wrappers in routes
- express.static serves all 107 frontend pages
- Socket.io 4.x for real-time events
- Route pattern: `/api/[module]/[action]`

### Auth flow:
```
Request → securityMiddleware → authMiddleware → checkRole → controller → MySQL → Response
All mutations → auditMiddleware → audit_logs table
```

### AI: TF-IDF RAG
- 27 knowledge chunks (leave, payroll, tax, PF/ESI, POSH, DPDP, WFH, exit, FBP, COMP-OFF)
- Cosine similarity → top 3 chunks → Claude Sonnet prompt
- Offline fallback when API unavailable

### Security: 14 Controls
JWT HS256 · bcrypt SALT=12 · RBAC 4 roles · Rate limiting · XSS · SQL injection · Helmet headers · Audit trail · Brute force block · Session management · CORS · DPDP consent · Fraud detection · File upload validation

---

## 3. Development Roadmap

### Completed (Phase 1–8)
- Phase 1: Foundation — Auth, Employee, Payroll core
- Phase 2: HR Operations — Leave, Attendance, Compliance
- Phase 3: Performance & Talent — OKR, 360°, Hiring, Onboarding
- Phase 4: Analytics & AI — HR Copilot RAG, Analytics
- Phase 5: Security & Comms — POSH, Grievance, SOS, Fraud
- Phase 6: Advanced — Real-time Monitor, AI Assistant, Team Connect
- Phase 7: Research Gaps — 39 features across 17 pages
- Phase 8: Quality — 0 JS errors, 4 bugs fixed, expenses page

### Planned (Phase 9–12)
- **Phase 9:** PM2 + Nginx + SSL + CI/CD production deployment
- **Phase 10:** Advanced AI — predictive models, sentiment analysis, JD scorer
- **Phase 11:** Integrations — Jira, Slack, SAP, NACH, DigiLocker, EPFO
- **Phase 12:** Mobile — React Native iOS + Android

---

## 4. Testing Plan

### Current
- Playwright smoke test: 107 pages, 0 JS errors
- node --check: 89 backend files, 0 syntax errors
- Runtime: 12 endpoint tests, 12/12 passed
- Password config: 8 files verified

### Target (Phase 9)
- Jest unit tests: all 37 controllers, 70% coverage
- Supertest integration: all 40 routes
- E2E Playwright: login→feature→logout flows, all 4 roles
- Load test k6: 500 concurrent users, <300ms response

---

## 5. Deployment Plan

### Development
```bash
docker compose up -d
# → http://localhost:5000/login.html
```

### Production
```bash
pm2 start backend/server.js --name wfi-api --instances 2
pm2 save && pm2 startup
# Nginx reverse proxy + certbot SSL
# UFW: allow 80, 443, 22 — deny 3306, 6379, 5000
# Daily mysqldump to S3
```
