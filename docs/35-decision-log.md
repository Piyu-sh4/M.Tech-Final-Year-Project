> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# DECISION.md — Workforce Intelligence
## Technical & Product Decision Log

---

## DECISION-001 — Vanilla JS, No Frontend Framework
**Status:** Accepted | **Category:** Frontend

**Decision:** Use plain Vanilla JavaScript ES2022 with no React, Vue, or Angular.

**Rationale:**
1. Zero build toolchain — no webpack, babel, or node_modules in frontend
2. Pages open directly in browser (file://) for testing
3. Each page debuggable in complete isolation
4. No framework upgrade treadmill
5. Simpler for non-framework developers to contribute

**Tradeoffs:** Sidebar HTML duplicated 107 times. No component reuse. No hot module reload.

---

## DECISION-002 — MySQL v2.18.1 (Callback-based)
**Status:** Accepted — Revisit for v13 | **Category:** Backend/Database

**Decision:** Use mysql npm v2.18.1 with Promise wrappers, not mysql2.

**Rationale:** Already in use, very stable, wide community support.

**Tradeoffs:** Must wrap all db.query in Promise manually. mysql2 is faster (binary protocol).

**Fix applied:** documentsRoutes.js and policiesRoutes.js had `await db.query()` silently returning undefined. Fixed by adding `const query = (sql,params) => new Promise((res,rej) => db.query(sql,params,(err,rows) => err?rej(err):res(rows)))`.

**Revisit:** Migrate to mysql2 in Phase 9 — backward compatible.

---

## DECISION-003 — TF-IDF RAG Instead of Vector Database
**Status:** Accepted | **Category:** AI Architecture

**Decision:** Use TF-IDF cosine similarity for RAG knowledge retrieval.

**Rationale:**
- No external service — works fully offline
- No additional API costs
- Deterministic — same query = same chunks
- 27 chunks is small enough for TF-IDF to be fast (<5ms)

**Tradeoffs:** Less semantic than vector embeddings. Synonym/paraphrase matching weaker.

**Revisit:** Migrate to pgvector in Phase 10 if semantic accuracy becomes a complaint.

---

## DECISION-004 — express.static for Frontend Serving
**Status:** Accepted | **Category:** Backend

**Decision:** Serve frontend/ directory from Express: `app.use(express.static(path.join(__dirname, "../frontend")))`.

**Context:** Initially login.html returned 404 at localhost:5000.

**Rationale:** Single server (port 5000) serves API + static files in development. Production: Nginx proxies to port 5000 — no change needed.

---

## DECISION-005 — authMiddleware Named Export Fix
**Status:** Accepted | **Category:** Backend

**Decision:** Export protect as both default AND named export.

**Root Cause:** `module.exports = protect` sets default. `const { protect } = require(...)` looks for property NAMED protect → was undefined → Route.post() got undefined callback → crash.

**Fix:** Added `module.exports.protect = protect; module.exports.verifyToken = protect;`

---

## DECISION-006 — Database Password P123/ (Development)
**Status:** Accepted (dev only) | **Category:** Security

**Decision:** Use P123/ as default development database password.

**Rationale:** Short, memorable, easy to type in terminal commands. The `/` character is unusual enough to avoid accidental matches.

**CRITICAL:** Change to strong password before production deployment.

**Files updated:** .env · .env.example · docker-compose.yml · backend/config/db.js · database/init/01_init.sql · database/setup_user.sql · README.md · RULES.md · MEMORY.md

---

## DECISION-007 — Non-ASCII Characters → Unicode Escapes
**Status:** Accepted | **Category:** Frontend

**Decision:** All non-ASCII in JS strings use unicode escape sequences.

- ✅ → `\u2705` | ₹ → `\u20B9` | ÷ → `/` | — → `--`

**Context:** 67 pages had "Invalid or unexpected token" from emoji in JS strings.

**Root Cause:** Multi-byte UTF-8 characters treated as unexpected tokens in strict JS parsing contexts.

---

## DECISION-008 — dlPrint Safe Concatenation Pattern
**Status:** Accepted | **Category:** Frontend

**Decision:** All dlPrint functions use array-join, never template literals with `</body>` inside.

**Context:** inject_before_body matched `</body>` INSIDE dlPrint JS string, injecting HTML into JavaScript code.

**Safe pattern:**
```javascript
w.document.write([
  "<!DOCTYPE html><html><body>",
  html,
  "</body></html>"
].join(""));
```

---

## DECISION-009 — IIFE Wrapping for Sidebar JS in New Pages
**Status:** Accepted | **Category:** Frontend

**Decision:** When creating new pages combining page JS + sidebar JS, wrap sidebar in IIFE.

**Context:** expenses.html had `const token` in both page JS and sidebar JS → "Identifier already declared".

**Fix:** `(function(){ /* sidebar JS */ })();`

---

## DECISION-010 — Expense Management as Standalone Page
**Status:** Accepted | **Category:** Product

**Decision:** Create expenses.html as standalone module (PRD Section requirement).

**Context:** Travel.html covered travel requests; standalone expense claims (receipts, categories, status filter) were missing.

**Added:** KPI cards · new claim form with receipt upload · status tabs · expense history table · policy summary.

---

## DECISION-011 — Null-guard getElementById Proxy
**Status:** Accepted | **Category:** Frontend

**Decision:** Add null-guard proxy for document.getElementById on pages where sidebar JS accesses elements that may not exist.

**Context:** Sidebar JS sets textContent on userName, composeBtn, annList — not present on every page → "Cannot set properties of null".

**Pattern:** Returns no-op object instead of null when element not found.
