# End-to-end critique — findings log

Date: 2026-11-19 · Commit reviewed: `46fb3f0` (main)

This is a backlog of problems to work through, not a record of fixes. Nothing in the application was changed.

## How this was produced, and its limits

- A full multi-reviewer sweep was started and then stopped early to save cost. No reviewer finished. This log is what could be salvaged plus what was checked by hand afterwards.
- Live checks ran against a throwaway copy of the app built from this commit (fresh demo snapshot), never against the real demo.
- Each finding carries a status:
  - **Reproduced** — confirmed with a real request against the throwaway copy.
  - **Code-read** — confirmed by reading the code; not exercised live.
  - **Flagged** — raised by the partial route review; plausible, not independently confirmed. Check before fixing.
- The per-route detail behind section A is in [58-route-authorization-table.md](58-route-authorization-table.md) (491 routes; 185 carry a concern). That table is a draft from an unfinished review: treat rows not listed below as Flagged.

**Not covered at all:** payroll/tax/loan arithmetic, the 21 workflow trackers end to end, visual design and accessibility, performance and load, database schema quality, the test suite's quality, privacy-policy claims versus behaviour, and the HR and admin browser journeys. These need a separate pass.

Baseline: `npm run test:docker` passes (9 suites) and `npm audit` reports 0 known vulnerabilities. Passing tests did not catch any of the issues below.

## Fix first

1. **A1** — any employee can read and control the whole cab module (approve bookings, read ride OTPs and driver ID numbers).
2. **B1** — any user can upload an HTML file as a profile photo and it is served publicly from the app's own origin.
3. **A2, A3** — any employee can read all reports, organisation-wide analytics and other users' records by changing an id.
4. **A4** — managers and HR can approve their own requests and change their own pay, grade and leave across many modules.
5. **C1** — raw database error text is returned to clients, and ordinary input triggers it.

---

## A. Authorization (who can see and do what)

The common cause: most routes check only "is signed in" (`protect`) or "is staff" (`staffOrAbove`), and the handler does not check that the record belongs to the caller or to their team. Role checks in the frontend hide buttons but the API does not enforce them.

### A1 · Critical · Cab module has no role checks — Reproduced
- **Where:** `backend/routes/cabRoutes.js`, `backend/controllers/cabController.js`, `backend/routes/cabSafetyRoutes.js`
- **Evidence:** signed in as the demo employee:
  - `GET /api/cab/all` → 200, 57 bookings including other users' `email`, `phone`, `driver_mobile` and the ride `otp`.
  - `GET /api/cab/drivers` → 200, drivers' `address`, `license_number`, `id_card_number`.
  - `PATCH /api/cab/52/approve` → 200 "Booking approved" for a booking owned by another user.
- **Flagged, same module:** employee can reject any booking, create/edit/deactivate drivers, inject GPS pings, complete any journey (OTP check skipped when `otp` is omitted), resolve or silence any SOS alert, read live tracking and OTP for any ride, and close any cab issue.
- **Fix:** add role guards to every admin-style cab route; scope booking, tracking and SOS reads to the owner or staff; never return the OTP to anyone but the passenger.

### A2 · High · Reports and analytics are readable by every employee — Reproduced
- **Where:** `backend/routes/reportRoutes.js`, `backend/routes/analyticsRoutes.js`
- **Evidence:** as employee, `GET /api/reports` → 25 reports with full `report_data`; `GET /api/reports/preview/performance` → 200; `GET /api/analytics/hr-summary` → 200 with `unpaid_salaries` and `unpaid_total`.
- **Flagged:** `GET /api/reports/:id` and `/export` for any id; any manager can edit or delete any report; `?refresh=1` lets anyone flush the analytics cache.
- **Fix:** restrict organisation-wide reports and analytics to staff; scope employees to their own.

### A3 · High · Reading other users' records by changing the id — Reproduced
- **Evidence:** as employee, all returned 200 with user 1's data: `GET /api/ai/leave-forecast/1`, `GET /api/tasks/productivity/1`, `GET /api/achievements/1`, `GET /api/exit/checklist/1`.
- **Side effect:** `GET /api/exit/checklist/:user_id` inserts 12 checklist rows for that user, and `GET /api/tasks/productivity/:user_id` writes a score row — reads that change data.
- **Flagged, same pattern:** suggestions (read and mark-read), helpdesk ticket comments including internal staff notes, cab tracking, projects, announcements by id (bypasses audience filter), dependents' insurance, travel expenses.
- **Fix:** one shared ownership helper (owner, or staff with a defined scope) applied to every `/:user_id` and `/:id` route.

### A4 · High · Self-approval and self-service pay changes for managers and HR — Flagged
Route review found no "not your own record" check and often no status precondition on:
- HR: own salary record and "mark paid", own leave entitlement, own salary advance, own promotion, own bank verification, own resignation and final settlement (with a client-supplied amount), own experience/salary letters, own `base_salary` via `PATCH /api/admin/users/:id`.
- Managers/HR: assign a grade and salary band to anyone including themselves, self-review in performance, self-verify skills, approve own task extension, award themselves achievement points repeatedly, approve own travel request with an unbounded amount, assign assets to themselves.
- Transfers and exit: review stages can be repeated, skipped or applied over a final decision.
- **Fix:** block acting on your own record at the service layer; enforce stage order and "pending only" preconditions in one place.

### A5 · High · Managers are not limited to their own reports — Reproduced in part
- **Evidence:** as manager, `GET /api/compliance/pf` → 200 (company-wide salary data), `GET /api/grades` → 185 rows with salary bands, `GET /api/performance/all` → 434 reviews.
- **Flagged:** same for helpdesk tickets, transfers (family/medical reasons), benefits (nominee, policy number), exit, travel, hiring candidates and offers, AI attrition and salary benchmark, night-shift safety, SOS events with phone and coordinates.
- **Related:** dashboard and task scope use department, not reporting line, and a manager with no department sees the whole company. A manager can reassign anyone's department (`POST /api/admin/departments/:id/assign`), which widens their own scope.
- **Fix:** define "my team" once (reporting line) and use it everywhere.

### A6 · Medium · Managers can do company-wide admin actions — Flagged
Edit or delete company holidays, publish or rewrite company policies, rewrite or archive any announcement, broadcast notifications with an arbitrary link to all users, forge system alerts, edit or cancel any project.

### A7 · Medium · Employees can change records that are not theirs — Reproduced in part
- **Evidence:** as employee, `PATCH /api/hiring/interviews/1/feedback` with an empty body → 200 "Feedback submitted".
- **Flagged:** a `result` of "fail" auto-rejects the candidate; tick any exit-clearance item; record background-check consent for someone else; acknowledge any joining letter; self-certify mandatory training (client sets status/score); post helpdesk and cab comments flagged as internal; enrol in benefits with client-chosen policy number and status.

### A8 · Medium · Confidential complaints are open to all HR and admins — Flagged
- No committee role for PoSH complaints; an accused HR user or admin can read and close the complaint against them.
- The audit middleware stores the actor and request body, which de-anonymises "anonymous" complaints in `audit_logs`.
- Managers can read every disciplinary and fraud-case record and open cases against any employee.

### A9 · Medium · Registration and imports — Flagged
- `POST /api/auth/register` accepts client-chosen `role_id` (2/3/4), `reporting_manager_id`, `department_id`, `company_id`, `grade_level`. Status is always pending, so approval is the only gate.
- Employee import (`POST /api/upload/import/employees`, `POST /api/chat/import`) creates active users with the hard-coded password `Welcome@123`.
- `PUT /api/auth/profile` writes the bank account number in plaintext, bypassing the encrypted banking path and HR verification.
- 7 of the 9 per-user permission flags are stored but never enforced by the server.

### A10 · Low · Meetings — Flagged
Meeting password compared and returned in plaintext; `/start/`, `/END` style paths bypass the exact-match host check; clients can post messages typed as `system`.

---

## B. Uploads and injection

### B1 · Critical · HTML can be uploaded as a profile photo and is served publicly — Reproduced
- **Where:** `backend/routes/authRoutes.js:19-28` (extension from the client filename, type check on the client-supplied mimetype); `backend/app.js:32` (`/uploads` served statically with no auth).
- **Evidence:** employee uploaded `salvage.html` declared as `image/png` → 200, stored as `/uploads/photos/user_113_….html`; an anonymous `GET` returned 200 `text/html`.
- **Impact:** stored script on the app's own origin. The session token lives in `localStorage`, so a victim who opens the link can have their session stolen. The file is also world-readable.
- **Fix:** derive the extension from sniffed content, allow-list image types, serve uploads with `Content-Disposition: attachment` and `nosniff` from behind authentication (or a separate origin).

### B2 · High · Everything under `/uploads` except two folders is public — Code-read
- **Where:** `backend/app.js:31-32`
- Profile photos, policy PDFs and temporary files from `/api/upload` are readable without signing in. The block on `employee-docs` and `docs` is an exact-prefix check; variants such as `/uploads//employee-docs/x` reach the static handler (returned 404 only because the test file did not exist). Bypass with a real file is **Flagged**.
- **Fix:** remove the static mount; serve all uploads through authenticated download handlers.

### B3 · Medium · Global input "sanitizer" rewrites user data — Code-read
- **Where:** `backend/middleware/securityMiddleware.js:89-118`, applied to every body and query in `backend/app.js:29`.
- It strips text matching `on\w+\s*=` (so "on leave = sick" loses words), removes `eval(`, and HTML-encodes `& < > "` before storage. Data is stored encoded, so exports and any correctly-escaping view show `&amp;`; re-saving can double-encode. It is not a reliable XSS defence either, since it never touches multipart fields or route params.
- **Fix:** remove it; validate per field and escape on output.

### B4 · Medium · Unescaped values in page templates — Flagged
A scan of the frontend listed many template substitutions without escaping (for example `ai-insights.html:1109`, `announcements.html:888`, `banking.html:939-941`). Most are protected today only by B3's encoding, which is the wrong layer. Also `escHtml` in `frontend/app.js:29` does not escape single quotes. Needs a proper pass.

---

## C. Error handling and information leaks

### C1 · High · Raw database errors returned to clients — Reproduced
- **Evidence:** `POST /api/helpdesk` with `category: "it"` → 500 `WARN_DATA_TRUNCATED: Data truncated for column 'category' at row 1`. `POST /api/letters/generate` with an unknown `letter_type` → the same kind of 500.
- **Impact:** invalid enum values are not validated and surface as server errors with schema details. Many handlers return `err.message` directly (for example `authController.js:195, 304, 334, 358`).
- **Fix:** validate enums before the query; return a generic message and log the detail server-side.

### C2 · Medium · Public health endpoint discloses internals — Reproduced
- **Where:** `backend/app.js:86-110`
- Anonymous `GET /api/health` returns `dbName`, `dbHost`, uptime, and on failure the raw DB error message. Return only a status.

### C3 · Medium · Login reveals whether an account exists — Code-read
- **Where:** `backend/controllers/authController.js:197-212`
- Unknown email → 404 "No account found"; wrong password → 401; pending and suspended have their own messages. The passkey login options endpoint differs the same way (Flagged). Use one generic failure message.

---

## D. Authentication and perimeter

### D1 · Medium · Brute-force guard never triggers — Code-read
`recordFailedAuth` in `securityMiddleware.js` is exported but nothing calls it, so the 20-failure block in `jwtBruteForceGuard` can never fire. Only the 10-per-15-minutes login limiter is active.

### D2 · Medium · Rate limits are in memory, per IP, and not configurable — Code-read
- `RATE_WINDOWS` is hard-coded (`securityMiddleware.js:43-50`); `RATE_LIMIT_API`, `RATE_LIMIT_LOGIN`, `RATE_LIMIT_REGISTER` in `.env.example` are never read. The general `apiRateLimiter` is exported but not mounted.
- Limits reset on restart and would not work across more than one API instance.
- `requestIdentity.js` trusts `cf-connecting-ip` whenever the peer address is private and a `cf-ray` header is present. Behind Docker's bridge every peer is private, so a client that can reach the port directly could rotate its apparent IP and evade the limiters. **Flagged** — depends on deployment; confirm.

### D3 · Medium · Cross-origin and header settings — Code-read
- CORS defaults to `*` for the API and socket.io (`app.js:17`, `socketServer.js:50`).
- CSP allows `'unsafe-inline'` scripts and three CDNs (`securityMiddleware.js:24-31`), which removes most of its XSS protection.
- HSTS is sent over plain HTTP.
- JSON body limit is 20 MB on every route (`app.js:30`).

### D4 · Medium · Session token in `localStorage`, 7-day default lifetime — Code-read
`frontend/app.js:10-15`; Compose sets `JWT_EXPIRES_IN` to `7d` while the code default is 8h. Combined with B1 this makes token theft practical. Whether a password change or suspension ends other live sessions was not tested.

### D5 · Low · Blocking password hashing — Code-read
`bcrypt.hashSync` / `compareSync` on the request path (`authController.js:92, 211, 352, 355`) block the server for every login.

### D6 · Low · No password reset, email verification or second factor
Not present in the routes. Passkeys exist but are optional.

---

## E. Configuration, operations and repository

### E1 · Medium · Stale and misleading configuration — Code-read
- `.env.example` is headed "v12.0", sets `DB_PASSWORD=P123/` and lists variables the code never reads (`SMTP_*`, `RATE_LIMIT_*`, `UPLOAD_DIR`, `MAX_FILE_SIZE_MB`, `SESSION_TIMEOUT_HOURS` — confirm each with a grep before deleting).
- `package.json` scripts hard-code the password `P123/` and `mysql_native_password`.
- Compose runs `NODE_ENV=production` with `DEMO_MODE: 'true'` hard-coded, and the boot banner prints demo credentials (`server.js:77-82`).
- `package.json` declares MIT but there is no LICENSE file.

### E2 · Medium · Dependencies — Code-read
The `mysql` driver is unmaintained and is the reason MySQL is forced to `mysql_native_password`; `xlsx` is installed from a CDN tarball rather than the registry; Puppeteer and Chromium ship in the runtime image for PDF export.

### E3 · Medium · No CI, linter or formatter
No `.github` directory. The 11 `tests/browser-*.cjs` scripts are run by hand, need Playwright installed separately, and default to `http://127.0.0.1:5500` — the real demo — while creating records. `jest.config.js` sets coverage thresholds that nothing enforces.

### E4 · Low · Test run leaves containers behind
`npm run test:docker` leaves exited `workforce_tests-*` containers.

### E5 · Low · Repository hygiene
- `docs/` has 57 numbered files; the index still says "Total: 48 documents" and many older documents describe things that are not in the repo.
- `docx/` holds 46 binary copies of older docs; `legacy/` holds a full earlier application and SQL seeds inside the main tree.
- Backend style is inconsistent: some route files are dense one-line handlers with inline SQL (`authRoutes.js:32-37`, `moduleRoutes.js`), others use controllers; response shapes vary (`{message}`, `{success,error}`).
- Dead exports in `securityMiddleware.js`: `requestSizeLimiter`, `validateColumnNames`, `apiRateLimiter`, `recordFailedAuth`; `exports.auditLog` is assigned after `module.exports` is replaced, so it is never exported.

---

## F. Product and UX observations (light; not a full review)

- Two navigation systems appear together on dashboards: the dark sidebar and the white top bar, with both "Sign out" and "Logout".
- Employee dashboard requests `/api/admin/users/113/permissions` and gets a 403 on every load (console error).
- Clock-in time displayed as `11/20/2026, 4:48:24 AM` for work date `2026-11-19` — a time-zone mismatch between the stored time and the display. Needs investigation.
- Module tables show raw values: money without currency or grouping (`70750`), ISO dates, lowercase enum values (`full_time`).
- Several catalog modules show identical data under different names (headcount and workforce-planning; welfare and flexible-benefits; attendance and time-tracker).
- The floating chat bubble is fixed over page content on phone widths.

---

## Suggested order of work

1. A1, B1, B2 — close the public and employee-level holes.
2. A2, A3 — add a shared ownership check and apply it route by route using the route table.
3. A4, A5 — define "my team" and "not my own record" once, then apply.
4. C1, B3 — input validation per field; remove the global sanitizer; generic error responses.
5. D1–D4 — authentication hardening.
6. Add API tests that sign in as an employee and assert 403 on each staff route, so these cannot regress.
7. Commission the uncovered areas listed at the top.
