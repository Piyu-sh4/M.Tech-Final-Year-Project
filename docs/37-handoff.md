> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# HANDOFF.md — Workforce Intelligence
## Developer Onboarding & Handoff Guide

---

## 1. Start Here — 15-Minute Orientation

### What This Project Is
A complete HRMS for Indian enterprises. 107 HTML pages covering every HR workflow — payroll, leave, compliance, performance, AI, real-time monitoring. Node.js + Express + MySQL + Docker.

### Key Differentiators
- **Vanilla JS** — no framework, no build step, 107 self-contained pages
- **Indian-specific** — POSH, PF, ESI, LWF, DPDP Act, all Indian labour laws built-in
- **AI-powered** — Claude Sonnet RAG with 27 knowledge chunks + source citations
- **Research-backed** — 39 features from real HR practice gaps
- **Zero defects** — Playwright-verified 0 JS errors across all 107 pages

---

## 2. Quick Start (10 Minutes)

```bash
# 1. Extract
unzip WIP_v12_COMPLETE_FINAL.zip -d wfi && cd wfi/project_v8

# 2. Install
PUPPETEER_SKIP_DOWNLOAD=true npm install

# 3. Configure
cp .env.example .env
# Edit .env: set JWT_SECRET
node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"

# 4. Start
docker compose up -d

# 5. Verify (wait ~60 seconds)
curl http://localhost:5000/api/health

# 6. Open
# http://localhost:5000/login.html — admin@wip.com / P123/
```

---

## 3. Codebase Orientation

### Backend Pattern
```
Request → securityMiddleware → authMiddleware → checkRole → controller → MySQL → JSON
All mutations → auditMiddleware → audit_logs table
```

### Frontend Pattern
```html
<head> CSS variables + page styles
<main> Page content cards
<div id="_sp"> Sidebar ID placeholders (hidden)
<div.toast> Toast notifications
<script> Page-specific JS
<script> Sidebar common JS
```

### localStorage Keys
```javascript
localStorage.getItem("token")   // JWT
localStorage.getItem("apiUrl")  // http://localhost:5000/api
localStorage.getItem("empId")   // Employee ID
localStorage.getItem("role")    // admin | hr | manager | employee
```

---

## 4. Critical Rules

### JavaScript
- NEVER non-ASCII in JS strings → use `\u2705` not `✅`
- NEVER nested backtick template literals in same scope
- ALWAYS use `var tok` not `const tok` across multiple script blocks
- ALWAYS run Playwright audit after frontend changes

### Database
- NEVER `await db.query()` — mysql v2 is callback-based
- ALWAYS: `const query = (sql,p) => new Promise((res,rej) => db.query(sql,p,(e,r) => e?rej(e):res(r)))`

### dlPrint Rule
```javascript
// ✅ CORRECT — array join
w.document.write(["<!DOCTYPE html>...", title, "...", html, "...</html>"].join(""));

// ❌ WRONG — template literal with </body> inside
w.document.write(`...${html}</body></html>`);
```

### Security
- NEVER commit .env
- NEVER raw SQL string concatenation
- NEVER skip authMiddleware on protected routes

---

## 5. Development Workflow

### Backend change
```bash
npm run dev          # nodemon auto-restarts
# OR
docker compose restart wfi_api
```

### Frontend change
```bash
# 1. Edit HTML file
# 2. Refresh browser (no build step)
# 3. Run Playwright audit (see FAILURE.md Prevention Checklist)
```

### New API route
```javascript
// backend/routes/newmodule.routes.js
const router = require("express").Router();
const { protect, hrOrAbove } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/newmoduleController");
router.get("/", protect, ctrl.getAll);
module.exports = router;

// backend/app.js
app.use("/api/newmodule", require("./routes/newmodule.routes"));
```

---

## 6. Production Deployment Checklist

### Security
- [ ] Generate new JWT_SECRET: `node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"`
- [ ] Change DB_PASSWORD from P123/ to strong password
- [ ] Change all 4 default user passwords
- [ ] Set NODE_ENV=production
- [ ] Set CORS_ORIGIN=https://hr.yourcompany.com

### Infrastructure
- [ ] `npm install -g pm2`
- [ ] `pm2 start backend/server.js --name wfi-api --instances 2`
- [ ] `pm2 save && pm2 startup`
- [ ] Configure Nginx + certbot SSL
- [ ] `sudo ufw allow 80,443,22 && sudo ufw deny 3306,6379,5000 && sudo ufw enable`
- [ ] Daily mysqldump backup cron

### Verification
- [ ] `curl https://hr.yourcompany.com/api/health` returns healthy
- [ ] Login as admin — dashboard loads
- [ ] audit-log.html shows recent login

---

## 7. Troubleshooting Quick Reference

| Symptom | Fix |
|---|---|
| `ECONNREFUSED 3306` | `docker compose up -d` or `sudo systemctl start mysql` |
| `ER_ACCESS_DENIED` | Check DB_PASSWORD=P123/ in .env |
| `Cannot find module` | `PUPPETEER_SKIP_DOWNLOAD=true npm install` |
| `EADDRINUSE :5000` | `lsof -ti:5000 | xargs kill -9` |
| `Identifier already declared` | Change `const` to `var` or wrap sidebar in IIFE |
| `Route.post() requires callback` | Add `module.exports.protect = protect` to authMiddleware.js |
| Static pages 404 | Add `app.use(express.static(...))` to app.js |
| AI Copilot not working | Add ANTHROPIC_API_KEY to .env + restart |
| Redis warning | Non-fatal — ignore or `docker compose up -d redis` |

---

## 8. Resources

| Resource | Location |
|---|---|
| Architecture | ARCHITECTURE.md |
| All bug history | FAILURE.md |
| Why decisions were made | DECISION.md |
| Indian HR law reference | KNOWLEDGE.md |
| Design system | DESIGN.md |
| Installation guide | WFI_v12_HowToRun_StepByStep.docx |
| Claude API | https://console.anthropic.com |
| Node.js docs | https://nodejs.org/en/docs |
| MySQL 8.0 docs | https://dev.mysql.com/doc/refman/8.0/en/ |
| Docker docs | https://docs.docker.com/get-started/ |
| PM2 docs | https://pm2.keymetrics.io/docs/usage/quick-start/ |
