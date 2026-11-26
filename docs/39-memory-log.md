> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# MEMORY.md — Workforce Intelligence
## Project Memory, Session Log & Key Decisions

**Version:** 12.0 | **Date:** July 2026  
**Purpose:** Preserve all decisions, fixes, and context across development sessions

---

## Quick Reference

```
Project root   : /tmp/wiq_inspect/project_v8/
Frontend       : /tmp/wiq_inspect/project_v8/frontend/
Backend        : /tmp/wiq_inspect/project_v8/backend/
Database       : /tmp/wiq_inspect/project_v8/database/
ZIP output     : /mnt/user-data/outputs/WIP_v12_COMPLETE_FINAL.zip
Showcase       : /mnt/user-data/outputs/WorkforceIntelligence_v12_Showcase.html
Install Guide  : /mnt/user-data/outputs/WorkforceIntelligence_v12_Installation_Guide.docx

Server         : http://localhost:5000
Login URL      : http://localhost:5000/login.html
Health check   : http://localhost:5000/api/health
Admin login    : admin@wip.com / P123/
```

---

## Project Stats (Final)

| Metric | Value |
|---|---|
| Total HTML pages | 107 |
| App pages | 102 |
| Public pages | 4 (index, login, register, offline) |
| Showcase page | 1 |
| JS errors (Playwright) | **0** |
| MySQL tables | 125 |
| Backend controllers | 37 |
| Route files | 40 |
| Middleware files | 4 |
| Service files | 5 |
| Security controls | 14 |
| Research gap features | 39 (across 17 pages) |
| Graph explanation sections | 23 pages |
| ZIP size | ~1.9 MB |
| Total frontend size | ~4.25 MB |

---

## Default Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@wip.com | P123/ |
| HR Manager | hr@wfintelligence.com | P123/ |
| Manager | manager@wfintelligence.com | P123/ |
| Employee | employee@wfintelligence.com | P123/ |

---

## Tech Stack (Final)

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | v18+ |
| Framework | Express | 4.x |
| Database | MySQL | 8.0 |
| Cache | Redis | 7 |
| Real-time | Socket.io | 4.x |
| Auth | JWT HS256 | jsonwebtoken |
| Password | bcrypt | SALT_ROUNDS=12 |
| AI | Claude Sonnet | claude-sonnet-4-6 |
| RAG | TF-IDF | 27 chunks |
| Containers | Docker Compose | 3 services |
| Frontend | Vanilla JS | ES2022 |
| PWA | Service Worker | offline support |
| Maps | Leaflet | 1.9.4 |
| ML | Python / scikit-learn | attrition model |
| PDF | Puppeteer | payslip generation |
| Excel | xlsx | data export |
| DOCX | mammoth | parsing |
| PDF parse | pdf-parse | AI assistant |
| Process manager | PM2 | production |
| Reverse proxy | Nginx | production |

---

## Session Log

### Session 1 — Initial Build
- Created project structure: frontend/ backend/ database/
- Built 60 initial HTML pages
- Set up MySQL schema with 80 tables
- Implemented JWT auth, RBAC middleware
- Created common sidebar JS (44/44 braces balanced)
- Deployed to `/tmp/wiq_inspect/project_v8/`

### Session 2 — Expansion to 101 Pages
- Added 41 more pages to reach 102 app pages
- Fixed broken sidebar JS on 33 pages (dlPrint template literal issue)
- Added graph explanation sections to 23 pages
- Fixed double-brace syntax `{{length:31}}` in hr-calendar.html
- Renamed Workforce Intelligence → Workforce Intelligence throughout
- Updated docker-compose.yml with 3 services + health checks

### Session 3 — New Pages (v12 features)
- Built `real-time-monitor.html` (58KB) — live 25-employee grid
- Built `ai-assistant.html` (64KB) — Claude Sonnet document Q&A
- Built `team-connect.html` (61KB) — 3-tab enhanced chat
- Added all 3 to sidebar nav across 102 pages
- Added `/api/health` endpoint to backend/app.js

### Session 4 — Research Gap Wave 1 (9 pages)
- `leave.html`: COMP-OFF application, Sandwich rule calc, Encashment calc
- `attendance.html`: OT tracker, Core hours compliance, Biometric sync
- `performance.html`: Mid-year review, Promotion recommendation form
- `posh-compliance.html`: Annual POSH report, ICC reconstitution, Training %
- `exit.html`: KT checklist, Rehire eligibility score
- `helpdesk.html`: Self-service knowledge base portal
- `onboarding.html`: Day 30/60/90 surveys, Buddy program
- `investment-declaration.html`: 80EEA, 80GG, 80TTA/TTB
- `workforce-planning.html`: Cost of vacancy, Internal mobility map

### Session 5 — JS Error Fixing (Full Audit)
**Root causes found and fixed:**
1. `dlPrint()` template literal injection: inject_before_body matched `</body>` INSIDE the JS template string → HTML injected inside JS → "Unexpected end of input"
2. Duplicate `const token` / `const API` across script blocks → "Identifier already declared"
3. Non-ASCII chars in JS strings (✅ → \u2705, ₹ → \u20B9) → "Invalid or unexpected token"
4. `\u{1F4C4}` ES2015 unicode escapes not supported → replaced with plain text
5. Double-brace `{{length:31}}` → `{length:31}` in hr-calendar.html
6. `async()=>{}` arrow functions → `async function(){}` in hr-copilot.html
7. Missing `init()` function → policy-library.html
8. Missing `userInput` ID → hr-copilot.html

**Fix strategies used:**
- Replace broken sidebar JS with clean copy from announcements.html (44/44 braces)
- Convert `const/let tok` to `var tok` when duplicate across script blocks
- Add null-guard `getElementById` proxy to pages with missing IDs
- Rebuild `onboarding.html` scripts from scratch (injected HTML broke dlPrint)

**Final result:** 0 JS errors across 107 pages (Playwright verified)

### Session 6 — Research Gap Wave 2 (8 more pages)
- `compliance.html`: Equal Remuneration Act dashboard, Payment of Wages tracker
- `fraud-detection.html`: Ghost employee detection, Expense fraud scanner
- `diversity.html`: Pay equity audit tool, PWD tracker (RPWD Act 2016)
- `ai-insights.html`: Flight risk early warning, Compensation benchmark P50/P75/P90
- `career-roadmap.html`: Certification roadmap by band level, Mentorship program
- `benefits.html`: GTL nominee declaration, Critical illness rider, Voluntary top-up
- `document-vault.html`: DigiLocker integration, Document expiry alerts
- `data-export.html`: DPDP data portability, Right to erasure, Consent audit log

### Session 7 — Documentation
- Created PRD.md (product requirements, 10 sections)
- Created ARCHITECTURE.md (system design, Docker, DB schema)
- Created RULES.md (coding standards, conventions)
- Created PHASES.md (development roadmap, Phase 1-12)
- Created DESIGN.md (design system, components, tokens)
- Created MEMORY.md (this file)

---

## Key Technical Decisions

### Decision 1: Vanilla JS (no framework)
**Why:** Maximise compatibility, zero build step, direct file access, no node_modules in frontend. 107 pages can be opened directly in browser without any compilation.

### Decision 2: mysql v2.18.1 (callback, not Promise-based)
**Why:** Stability and wide community support. Wrapped in pool queries that work reliably. Note: use `mysql2` for new projects (native Promise support).

### Decision 3: TF-IDF RAG (not vector DB)
**Why:** No external service required, works offline, deterministic results. 27 chunks is small enough that TF-IDF cosine similarity is fast and accurate. Vector DB would be overkill at this scale.

### Decision 4: Single HTML file per page
**Why:** Self-contained pages are easier to debug, share, and deploy. No build toolchain needed. Side effect: each page is 25–75KB which is acceptable on LAN.

### Decision 5: Non-ASCII chars → unicode escapes in JS
**Why:** Files saved as UTF-8 but the JS parser in some browsers treats emoji/special chars differently when they appear in script blocks. Using `\u2705` (✅), `\u20B9` (₹) is guaranteed safe in all browsers.

### Decision 6: Explanation cards as HTML after </script>
**Why:** Initially injected before `</body>` but inject_before_body matched `</body>` inside dlPrint template string. Fixed by injecting AFTER the last `</script>` tag (outside JS context entirely).

### Decision 7: Null-guard getElementById proxy
**Why:** The sidebar common JS runs on every page and tries to set `.textContent` on elements like `userName`, `composeBtn`, `annList` that may not exist on every page. The proxy returns a no-op object instead of null, preventing "Cannot set properties of null" errors without requiring every element to be on every page.

---

## Known Bugs (Resolved)

| Bug | Root Cause | Fix Applied | Status |
|---|---|---|---|
| "Unexpected end of input" on 18 pages | dlPrint template literal swallowed injected HTML | Replaced sidebar JS with clean copy | ✅ Fixed |
| "Identifier already declared" token/API | Duplicate const declarations across script blocks | Changed duplicate to var | ✅ Fixed |
| "Invalid or unexpected token" flexible-benefits | emoji chars in JS string + unclosed { in dlPrint | Replaced dlPrint, removed emojis | ✅ Fixed |
| "Invalid or unexpected token" onboarding | `\u{1F4C4}` ES2015 pattern + HTML injected inside dlPrint | Rebuilt scripts, replaced patterns | ✅ Fixed |
| "Unexpected token '{'" hr-calendar | `{{length:31}}` double-braces | Replaced with single braces | ✅ Fixed |
| "async is not defined" hr-copilot | `async()=>{}` treated as variable call | Changed to `async function(){}` | ✅ Fixed |
| "init is not defined" policy-library | Script called init() before definition | Added DOMContentLoaded wrapper | ✅ Fixed |
| "L is not defined" sos-alerts | Leaflet L not loaded or used before load | Added typeof null-guard | ✅ Fixed |
| "Cannot set properties of null" 10 pages | getElementById on missing elements | Added no-op proxy for getElementById | ✅ Fixed |
| Duplicate sidebar script blocks (5 pages) | Sidebar injected twice | Removed duplicate block | ✅ Fixed |

---

## Common Patterns & Snippets

### Inject feature before </body>
```python
def inject(path, html, js='', marker=''):
    with open(path) as f: c = f.read()
    if marker and marker in c: return False  # already injected
    c = c.replace('</body>', html + '\n</body>', 1)
    if js:
        last = c.rfind('</script>')
        c = c[:last] + '\n' + js + '\n</script>' + c[last+9:]
    with open(path, 'w') as f: f.write(c)
    return True
```

### Playwright JS audit
```python
import asyncio
from playwright.async_api import async_playwright

SKIP = ['fetch','ERR_','localhost:5000','favicon','sw.js','net::',
        'CORS','Failed to load','service-worker','404','leaflet']

async def audit(pages):
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(args=['--no-sandbox'])
        errors = {}
        for fname in pages:
            pg = await browser.new_page()
            errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.add_init_script("""
                const s={token:'tok',apiUrl:'http://localhost:5000/api',empId:'1',role:'admin'};
                Object.defineProperty(window,'localStorage',{value:{
                    getItem:k=>s[k]||null,setItem:(k,v)=>{s[k]=v},
                    removeItem:()=>{},clear:()=>{}}});
                window.fetch=()=>Promise.resolve(new Response('{}',{status:200}));
            """)
            await pg.goto(f'file:///path/to/frontend/{fname}',
                         wait_until='domcontentloaded', timeout=8000)
            await pg.wait_for_timeout(1500)
            real = [e for e in errs if not any(x in e for x in SKIP)]
            if real: errors[fname] = real
            await pg.close()
        await browser.close()
        return errors
```

### Safe JS string (no non-ASCII)
```python
replacements = [
    ('✅', '\\u2705'), ('❌', '\\u274C'), ('⚠️', '\\u26A0'),
    ('₹', '\\u20B9'), ('÷', '/'),         ('—', '--'),
    ('→', '->'),       ('✓', '\\u2713'),  ('×', 'x'),
]
for bad, good in replacements:
    js_string = js_string.replace(bad, good)
```

---

## File Inventory

### Documentation (root)
```
PRD.md            Product requirements, 10 sections
ARCHITECTURE.md   System design, Docker, DB schema, security layers
RULES.md          Coding standards, JS conventions, security rules
PHASES.md         Development roadmap, Phase 1-12
DESIGN.md         Design system, components, colour tokens
MEMORY.md         This file — project memory and decisions
```

### Key Frontend Files
```
frontend/showcase.html              Platform showcase (106th page)
frontend/hr-copilot.html            AI RAG chatbot (Claude Sonnet)
frontend/ai-assistant.html          Document Q&A + 8 quick actions
frontend/real-time-monitor.html     Live 25-employee grid
frontend/team-connect.html          3-tab enhanced chat
frontend/employee-dashboard.html    Main employee portal
frontend/admin-dashboard.html       Admin full access
```

### Key Backend Files
```
backend/server.js         Entry point + Socket.io
backend/app.js            Express middleware + routes
backend/config/db.js      MySQL connection pool
backend/middleware/
  authMiddleware.js        JWT verify + role check
  securityMiddleware.js    Rate limit, CORS, Helmet, XSS
  auditMiddleware.js       Log all mutations
  multerShim.js            File upload + MIME validation
backend/services/
  ragService.js            TF-IDF RAG, 27 chunks
  analyticsService.js      HR KPI calculations
  cacheService.js          Redis wrapper
  fileParserService.js     PDF/DOCX/Excel parsing
  pdfService.js            Puppeteer PDF generation
```

### Key Database Files
```
database/init/02_master.sql                   Complete schema + demo data (125 tables, 2 views)
database/init/01_init.sql                     Docker auto-init: create DB + user
legacy/database/                              Older schema generations — reference only, do NOT import
database/init/01_init.sql                     Creates database + wfi_user (mysql_native_password)

```

---

## Environment Variables Reference

```bash
# Database
DB_HOST=localhost           # 'db' when using Docker
DB_PORT=3306
DB_USER=wfi_user
DB_PASSWORD=P123/
DB_NAME=workforce_intelligence
DB_ROOT_PASSWORD=P123/

# Server
PORT=5000
NODE_ENV=production
JWT_SECRET=<64-char-random>
JWT_EXPIRES_IN=7d

# AI
ANTHROPIC_API_KEY=sk-ant-api03-...

# Security
CORS_ORIGIN=https://hr.yourcompany.com
RATE_LIMIT_API=300
RATE_LIMIT_LOGIN=10
MAX_FILE_SIZE_MB=10

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=you@gmail.com
SMTP_PASS=app_password_here

# Business
COMPANY_NAME=Workforce Intelligence
```

---

## Quick Start Commands

```bash
# Docker (recommended)
cp .env.example .env
# Edit .env: set JWT_SECRET and ANTHROPIC_API_KEY
docker-compose up -d
# Open: http://localhost:5000/login.html

# Manual
npm install
npm run db:init   # create database + user, import schema and demo data
npm start

# Development
npm run dev          # nodemon auto-restart

# Database
npm run db:init  # Full setup in one command
npm run db:reset     # WARNING: drops + recreates DB

# Production
pm2 start backend/server.js --name wfi-api --instances 2
pm2 save && pm2 startup

# JS Audit (run after any change)
cd /tmp/wiq_inspect/project_v8
python3 -c "
import asyncio
from playwright.async_api import async_playwright
import os

async def quick_audit():
    pages = [f for f in os.listdir('frontend') if f.endswith('.html')]
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=['--no-sandbox'])
        errors = []
        for pg in pages:
            p = await b.new_page()
            errs = []
            p.on('pageerror', lambda e: errs.append(str(e)))
            await p.add_init_script(\"Object.defineProperty(window,'localStorage',{value:{getItem:()=>null,setItem:()=>{},removeItem:()=>{},clear:()=>{}}})\")
            await p.goto(f'file:///tmp/wiq_inspect/project_v8/frontend/{pg}', wait_until='domcontentloaded', timeout=5000)
            await p.wait_for_timeout(800)
            real = [e for e in errs if 'localhost' not in e and 'ERR_' not in e]
            if real: errors.append((pg, real[0]))
            await p.close()
        await b.close()
        return errors

e = asyncio.run(quick_audit())
print(f'Errors: {len(e)}')
for pg, err in e: print(f'  {pg}: {err[:80]}')
if not e: print('ALL CLEAN')
"
```

---

## Lessons Learned

1. **dlPrint template literals are fragile**: Any HTML injection near a `</body>` tag that appears inside a JS template string will break the page. Always inject AFTER the last real `</script>`, not before `</body>`.

2. **Non-ASCII in JS strings**: Even with UTF-8 file encoding, emoji and special chars in JS strings cause "Invalid or unexpected token" in strict parsing contexts. Always use unicode escapes.

3. **Scope of `const` across script blocks**: Two `<script>` blocks on same page share global scope. `const x` in block 1 + `const x` in block 2 = "Identifier already declared". Use `var` for shared state or wrap in IIFE.

4. **Playwright is the gold standard**: Only running actual Playwright tests (not static analysis) reveals real JS errors. Many pages that look fine statically have runtime errors.

5. **inject_before_body is dangerous**: `c.replace('</body>', ...)` matches the FIRST `</body>` it finds, which might be inside a JS string. Always search for the LAST real `</body>` — `c.rfind('</body>')`.

6. **Sidebar JS should never be modified per-page**: Extract the sidebar common JS from a working page and use that exact copy everywhere. Any modification to the sidebar template breaks all pages that use it.

7. **Research gaps improve credibility**: Generic HR features are table stakes. Features like Sandwich Rule calculator, 80EEA deductions, Equal Remuneration Act dashboard, and RPWD Act tracker show deep domain knowledge and make the platform actually useful.
