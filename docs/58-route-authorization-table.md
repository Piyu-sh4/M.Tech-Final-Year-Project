> Draft from an unfinished review on 2026-11-19 (commit 46fb3f0). Rows are not independently verified unless listed as Reproduced in [58-e2e-critique.md](58-e2e-critique.md).

# Route authorization table - Workforce Intelligence backend

Generated from backend/app.js mounts + every file in backend/routes/ (static review, branch main @ 46fb3f0). Guards column = middleware actually on the route (router-level `use` folded in). Scope column = how the handler binds data to `req.user`, verified by reading the controller/service. "NONE" = no binding at all.

Roles: 1=Admin 2=Employee 3=Manager 4=HR. protect = valid JWT + active user + live session. adminOnly=[1], managerOrAbove=[1,3], hrOrAbove=[1,4], staffOrAbove=[1,3,4].

**491 router registrations + 6 workflow routes registered from services/workflows.js + 6 app-level entries. 185 router rows carry a concern; 61 rows have no data scoping at all ("NONE").**

## App-level / static

| Source | Method | Path | Guards | Scope | Concern |
|---|---|---|---|---|---|
| app.js:32 | ALL | `/uploads/employee-docs/*, /uploads/docs/*` | NONE (returns 403 for exact prefix only) | blocked by prefix match | bypass: /uploads//employee-docs/x, /uploads/%65mployee-docs/x, /uploads/photos/../employee-docs/x reach express.static |
| app.js:33 | GET | `/uploads/* (photos, policies, demo, root temp files)` | NONE - no auth | public static | profile photos, policy PDFs, seeded demo document and in-flight /api/upload temp files are world-readable; uploaded .html executes on app origin |
| app.js:40 | GET | `/modules.html, /<slug>.html, all frontend files` | NONE - no auth | public static | - |
| app.js:92 | GET | `/api/health` | NONE - no auth | n/a | discloses dbName, dbHost, uptime and raw DB error message |
| app.js:118 | GET | `/api` | NONE - no auth | n/a | - |
| middleware/demoAccess.js:33 | ALL | `* (only when DEMO_ACCESS_CODE is set)` | shared access-code cookie gate in front of everything | n/a | - |

## Workflow tracker routes (21 slugs; registered by services/workflows.js on the /api/modules router)

| Source | Method | Path | Guards | Scope | Concern |
|---|---|---|---|---|---|
| services/workflows.js:259 | GET | `/api/modules/:slug/records` | protect (moduleRoutes L106), workflow gate L234-241 (staff trackers: roles 1,3,4) | own-scope trackers: owner only unless HR/admin; staff-scope trackers: ALL rows to admin/manager/HR | managers read every disciplinary / fraud-detection / threat-monitor / cybersecurity / contract-labour / statutory-bonus record |
| services/workflows.js:280 | GET | `/api/modules/:slug/records/:id/history` | same | same row scope as list | - |
| services/workflows.js:293 | POST | `/api/modules/:slug/records` | same | owner_id = req.user for own-scope; NULL for staff-scope; created_by = req.user | managers can open disciplinary / fraud cases against any employee_id |
| services/workflows.js:321 | PATCH | `/api/modules/:slug/records/:id` | same | author or HR/admin; not after a final state; optimistic version | - |
| services/workflows.js:355 | DELETE | `/api/modules/:slug/records/:id` | same | author or HR/admin; first state only (soft delete) | - |
| services/workflows.js:363 | POST | `/api/modules/:slug/records/:id/transition` | same | decision states (Approved/Verified/Reviewed/Resolved/Cleared/Active/Closed): HR/admin and not the author; other states: anyone who can see the row | non-'decision' end states are self-service: owner can set own probation review 'Completed', goal 'Achieved'; HR decides grievances naming themselves (no conflict check) |

## managerRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 7 | GET | `/api/manager/overview` | protect, staffOrAbove | team: users.reporting_manager_id = req.user (HR/admin see only their own reports too) | - |

## recordPdfRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 6 | POST | `/api/record-pdf` | protect | none needed: renders only caller-supplied fields, reads no DB | any user can mint an official-looking 'Workforce Intelligence - Record export' PDF with arbitrary content (low) |

## moduleRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 108 | GET | `/api/modules` | protect (router.use, L106) | catalog filtered by role via visible() | - |
| 109 | GET | `/api/modules/data/:key` | protect (router.use, L106) | per-dataset: own / team(reporting_manager_id) / HR-all / company-wide for 'simple' datasets | skills, awards, roster, reporting are company-wide to every employee (low); posh visible to every HR/admin (no ICC role) |
| 122 | GET | `/api/modules/:slug/records` | protect (router.use, L106) | all 21 trackers are intercepted by services/workflows.js first (see workflow rows); this generic handler is dead code | - |
| 134 | POST | `/api/modules/:slug/records` | protect (router.use, L106) | dead code (workflow handler answers first) | - |
| 141 | PATCH | `/api/modules/:slug/records/:id` | protect (router.use, L106) | dead code (workflow handler answers first) | - |

## passkeyRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 16 | POST | `/api/passkeys/login/options` | none (public), loginRateLimiter | public (rate limited) | response differs for unknown/inactive email -> account enumeration (low, authn) |
| 35 | POST | `/api/passkeys/login/verify` | none (public), loginRateLimiter | public (rate limited) | - |
| 57 | GET | `/api/passkeys` | protect (router.use, L56) | own credentials | - |
| 69 | DELETE | `/api/passkeys/:id` | protect (router.use, L56) | own credential (user_id AND credential_id) | - |
| 84 | POST | `/api/passkeys/register/options` | protect (router.use, L56) | own; requires current password | - |
| 106 | POST | `/api/passkeys/register/verify` | protect (router.use, L56) | own | - |
| 116 | POST | `/api/passkeys/attendance/options` | protect (router.use, L56) | own | - |
| 128 | POST | `/api/passkeys/attendance/verify` | protect (router.use, L56) | own; proof token bound to user+action, 2 min | - |

## authRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 9 | POST | `/api/auth/logout` | protect | own session | - |
| 10 | DELETE | `/api/auth/sessions/:id` | protect | own session (session_id AND user_id) | - |
| 32 | GET | `/api/auth/companies` | none (public) | PUBLIC - no auth | by design for registration; discloses company list |
| 33 | GET | `/api/auth/attendance-audit` | protect | own (actor_id = req.user) | - |
| 34 | POST | `/api/auth/companies` | protect, adminOnly | admin | - |
| 35 | GET | `/api/auth/session-context` | protect | own | - |
| 36 | GET | `/api/auth/preferences` | protect | own | - |
| 37 | PATCH | `/api/auth/preferences` | protect | own | - |
| 39 | POST | `/api/auth/register` | none (public), registerRateLimiter | PUBLIC - no auth (rate limited) | client-controlled role_id (2/3/4), reporting_manager_id, department_id, company_id, grade_level; always status=pending |
| 40 | POST | `/api/auth/login` | none (public), loginRateLimiter, jwtBruteForceGuard | PUBLIC - no auth (rate limited) | - |
| 43 | GET | `/api/auth/me` | protect | own | - |
| 44 | PUT | `/api/auth/profile` | protect | own | writes users.account_number in plaintext, bypassing /api/banking encryption + HR verification |
| 45 | PUT | `/api/auth/change-password` | protect | own | - |
| 46 | POST | `/api/auth/refresh` | protect | own session | - |
| 47 | POST | `/api/auth/profile/photo` | protect | own | extension taken from client filename, type check uses client mimetype -> .html/.svg stored under public /uploads/photos (stored XSS) |
| 50 | GET | `/api/auth/users` | protect, adminOnly | company-wide; admin | - |
| 54 | GET | `/api/auth/departments` | none (public) | PUBLIC - no auth | by design for registration; discloses department list |

## taskRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 11 | GET | `/api/tasks/alerts/all` | protect | own alerts + global (user_id NULL) | - |
| 12 | GET | `/api/tasks/productivity/:user_id` | protect | NONE - any :user_id | IDOR read of any user's task/productivity stats; GET also upserts productivity_scores for that user |
| 13 | GET | `/api/tasks/my` | protect | own (assigned_to) | - |
| 16 | GET | `/api/tasks/:task_id/logs` | protect, accessTask (router.use /:task_id, L15) | task scope(): own/assigned-by; manager + reports + whole department; HR/admin all | - |
| 19 | POST | `/api/tasks` | protect | employees self-assign only; manager/HR/admin may assign to ANY user | manager assignment not limited to reports; client-controlled status on create (e.g. 'Completed') |
| 20 | GET | `/api/tasks` | protect | task scope() | manager scope = reports OR anyone in same department_id |
| 21 | GET | `/api/tasks/:task_id` | protect, accessTask (router.use /:task_id, L15) | task scope() | - |
| 22 | PATCH | `/api/tasks/:task_id` | protect, accessTask (router.use /:task_id, L15) | task scope() + author or admin (inline check) | - |
| 23 | PUT | `/api/tasks/:task_id` | protect, accessTask (router.use /:task_id, L15) | task scope(): anyone who can see the task may change status | - |
| 24 | DELETE | `/api/tasks/:task_id` | protect, accessTask (router.use /:task_id, L15) | admin only (inline role_id check, not middleware) | inline role check |
| 27 | POST | `/api/tasks/:task_id/extension` | protect, accessTask (router.use /:task_id, L15) | task scope() | - |
| 28 | PUT | `/api/tasks/:task_id/extension` | protect, accessTask (router.use /:task_id, L15), staffOrAbove | task scope() + staffOrAbove | no self-check: a manager/HR assignee can approve their own extension |
| 31 | POST | `/api/tasks/:task_id/achievement` | protect, accessTask (router.use /:task_id, L15), staffOrAbove | task scope() + staffOrAbove | no self-check, no completion check, no dedupe: manager/HR can award themselves unlimited points |
| 34 | GET | `/api/tasks/:task_id/comments` | protect, accessTask (router.use /:task_id, L15) | task scope() | - |
| 35 | POST | `/api/tasks/:task_id/comments` | protect, accessTask (router.use /:task_id, L15) | task scope() | - |
| 36 | DELETE | `/api/tasks/:task_id/comments/:comment_id` | protect, accessTask (router.use /:task_id, L15) | comment author or admin; comment not bound to :task_id | - |

## reportRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 10 | GET | `/api/reports/preview/:type` | protect | NONE - company-wide | any employee gets all tasks, all employees' performance/emails, task logs (bypasses task scope) |
| 11 | POST | `/api/reports` | protect, staffOrAbove | company-wide data; staffOrAbove | - |
| 12 | GET | `/api/reports` | protect | NONE - all saved reports | employees can list every report (modules dataset restricts them to own) |
| 13 | GET | `/api/reports/:id` | protect | NONE - any report id | IDOR: full report_data to any employee |
| 14 | PUT | `/api/reports/:id` | protect, staffOrAbove | any report; staffOrAbove (not owner-bound) | any manager can edit any report |
| 15 | DELETE | `/api/reports/:id` | protect, staffOrAbove | any report; staffOrAbove (not owner-bound) | any manager can delete any report |
| 16 | GET | `/api/reports/:id/export` | protect | NONE - any report id | IDOR export CSV/JSON to any employee |

## chatRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 34 | GET | `/api/chat/providers` | protect, adminOnly, currentAdmin | admin (+DB re-check) | - |
| 37 | PUT | `/api/chat/providers/:provider` | protect, adminOnly, currentAdmin | admin (+DB re-check) | - |
| 41 | PUT | `/api/chat/active-provider` | protect, adminOnly, currentAdmin | admin (+DB re-check) | - |
| 45 | GET | `/api/chat/context` | protect, chatAllowed | own totals; admin org totals; requires can_use_chat | - |
| 46 | POST | `/api/chat/import` | protect, adminOnly, currentAdmin | admin (+DB re-check) | creates ACTIVE users (role up to HR) with default password 'Welcome@123' |
| 47 | POST | `/api/chat/send` | protect, chatAllowed, rateLimit(chat) | own; requires can_use_chat; rate limited | - |

## uploadRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 39 | POST | `/api/upload` | protect | own (RAG index keyed by user) | temp file lands in public /uploads root until parsed |
| 40 | POST | `/api/upload/import/employees` | protect, adminOnly | admin | creates ACTIVE users with hard-coded password 'Welcome@123' |
| 41 | POST | `/api/upload/import/tasks` | protect, adminOnly | admin | - |

## analyticsRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 24 | GET | `/api/analytics/daily` | protect | NONE - company aggregate | any employee; ?refresh=1 lets anyone flush the cache |
| 25 | GET | `/api/analytics/weekly` | protect | NONE - company aggregate | same |
| 26 | GET | `/api/analytics/monthly` | protect | NONE - company aggregate | same |
| 27 | GET | `/api/analytics/annual` | protect | NONE - company aggregate | same |
| 28 | GET | `/api/analytics/performers` | protect | NONE - top-10 employees by name with scores | peer performance visible to every employee |
| 29 | GET | `/api/analytics/summary` | protect | NONE - company aggregate | any employee |
| 30 | GET | `/api/analytics/hr-summary` | protect | NONE - company aggregate incl. unpaid payroll total | payroll totals to every employee |
| 34 | GET | `/api/analytics/attrition` | protect, staffOrAbove | company-wide; staffOrAbove | managers not limited to reports |
| 35 | GET | `/api/analytics/attrition/:user_id` | protect, staffOrAbove | any :user_id; staffOrAbove | managers not limited to reports; :user_id interpolated into internal URL + cache key |

## achievementRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 8 | POST | `/api/achievements/check/:task_id` | protect | own task (assigned_to = req.user) | self-created + self-completed tasks earn points -> unlimited self-award |
| 9 | GET | `/api/achievements/:user_id` | protect | NONE - any :user_id | IDOR read of any user's achievements + task titles |

## suggestionRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 8 | GET | `/api/suggestions/:user_id` | protect | NONE - any :user_id | IDOR read |
| 9 | PATCH | `/api/suggestions/:id/read` | protect | NONE - any suggestion id | IDOR write |
| 10 | PATCH | `/api/suggestions/read-all/:user_id` | protect | NONE - any :user_id | IDOR write |

## buildRequestRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 11 | GET | `/api/build-requests` | protect, adminOnly (router.use, L6) | admin (router.use(protect,adminOnly)) | - |
| 14 | POST | `/api/build-requests` | protect, adminOnly (router.use, L6) | admin | - |
| 18 | POST | `/api/build-requests/claim-next` | protect, adminOnly (router.use, L6) | admin | - |
| 23 | GET | `/api/build-requests/:id` | protect, adminOnly (router.use, L6) | admin | - |
| 26 | PATCH | `/api/build-requests/:id` | protect, adminOnly (router.use, L6) | admin | - |

## adminRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 12 | GET | `/api/admin/dashboard/stats` | protect, staffOrAbove | company aggregate incl. unpaid salary total; staffOrAbove | managers see company payroll total (low) |
| 15 | GET | `/api/admin/users` | protect, staffOrAbove | manager: self + direct reports; HR/admin: all | returns base_salary/phone/profile_notes of reports to managers |
| 16 | GET | `/api/admin/users/pending` | protect, hrOrAbove | all pending; HR/admin | - |
| 17 | PATCH | `/api/admin/users/:id/approve` | protect, hrOrAbove | HR: role-2 registrants only; admin: any | - |
| 18 | PATCH | `/api/admin/users/:id/reject` | protect, hrOrAbove | any pending user; HR/admin | HR may reject staff-role registrations it cannot approve (low) |
| 19 | PATCH | `/api/admin/users/:id/suspend` | protect, adminOnly | any user; admin | - |
| 20 | DELETE | `/api/admin/users/:id` | protect, adminOnly | any user except self; admin | - |
| 21 | PATCH | `/api/admin/users/:id` | protect, hrOrAbove | HR: any non-admin user INCLUDING SELF; admin: any | HR can change own base_salary / reporting manager; can change others' login email |
| 22 | PATCH | `/api/admin/users/:id/reset-password` | protect, adminOnly | any user; admin | - |
| 23 | GET | `/api/admin/users/:id/salary-revisions` | protect, staffOrAbove | manager: self/direct reports; HR/admin all | - |
| 26 | GET | `/api/admin/users/:id/permissions` | protect, staffOrAbove | ANY user id; staffOrAbove | managers not limited to reports; GET inserts a row |
| 27 | PUT | `/api/admin/users/:id/permissions` | protect, adminOnly | admin | 7 of 9 flags are never enforced server-side |
| 30 | GET | `/api/admin/departments` | protect | all | - |
| 31 | POST | `/api/admin/departments` | protect, adminOnly | admin | - |
| 32 | PATCH | `/api/admin/departments/:id` | protect, adminOnly | admin | - |
| 33 | DELETE | `/api/admin/departments/:id` | protect, adminOnly | admin | - |
| 34 | GET | `/api/admin/departments/:id/members` | protect | NONE - any department: names, emails, status, points | low |
| 35 | POST | `/api/admin/departments/:id/assign` | protect, staffOrAbove | ANY user_ids into ANY department; staffOrAbove | manager can re-org anyone (and empty a department with replace) -> widens their own department-based task/dashboard scope |
| 38 | GET | `/api/admin/shifts` | protect | all | - |
| 39 | POST | `/api/admin/shifts` | protect, adminOnly | admin | - |
| 40 | PATCH | `/api/admin/shifts/:id` | protect, adminOnly | admin | - |
| 41 | DELETE | `/api/admin/shifts/:id` | protect, adminOnly | admin | - |
| 44 | GET | `/api/admin/holidays` | protect | all | - |
| 45 | POST | `/api/admin/holidays` | protect, staffOrAbove | staffOrAbove | managers edit the company holiday calendar |
| 46 | DELETE | `/api/admin/holidays/:id` | protect, staffOrAbove | any holiday; staffOrAbove | managers can delete company holidays |
| 49 | GET | `/api/admin/attendance/my` | protect | own | - |
| 50 | GET | `/api/admin/attendance/today` | protect | own | - |
| 51 | GET | `/api/admin/attendance/summary` | protect, staffOrAbove | manager: self + reports; HR/admin all | - |
| 52 | GET | `/api/admin/attendance/export` | protect, staffOrAbove | manager: self + reports; HR/admin all | - |
| 53 | POST | `/api/admin/attendance/clock-in` | protect, attendanceGuard | own; attendanceGuard (can_clock_in_out; passkey proof only if client asks for it) | verification_method is client-chosen |
| 54 | POST | `/api/admin/attendance/clock-out` | protect, attendanceGuard | own; attendanceGuard | same |
| 55 | GET | `/api/admin/attendance` | protect, staffOrAbove | manager: self + reports; HR/admin all | - |
| 56 | POST | `/api/admin/attendance` | protect, staffOrAbove | manager: direct reports, not self; HR/admin: ANY user incl. self | HR can overwrite own attendance; no validation of status/date |
| 59 | GET | `/api/admin/leave` | protect, staffOrAbove | manager: self + reports; HR/admin all | - |
| 60 | POST | `/api/admin/leave` | protect | own | - |
| 61 | GET | `/api/admin/leave/my` | protect | own | - |
| 62 | PATCH | `/api/admin/leave/:id/approve` | protect, staffOrAbove | not own; manager = reporting manager only; HR/admin any | - |
| 63 | PATCH | `/api/admin/leave/:id/reject` | protect, staffOrAbove | same as approve | - |
| 64 | DELETE | `/api/admin/leave/:id` | protect | owner or admin; pending only | - |
| 67 | GET | `/api/admin/leave-balances/my` | protect, (inline: params.user_id=req.user) | own | - |
| 68 | GET | `/api/admin/leave-balances/:user_id` | protect, staffOrAbove | manager: self/reports; HR/admin any | - |
| 69 | PUT | `/api/admin/leave-balances` | protect, hrOrAbove | ANY user_id incl. self; HR/admin | HR can raise own entitlement; no validation |
| 72 | GET | `/api/admin/salary/components` | protect | reference | - |
| 73 | GET | `/api/admin/salary/my` | protect | own | - |
| 74 | GET | `/api/admin/salary/export` | protect, staffOrAbove | manager: self + reports; HR/admin all | - |
| 75 | POST | `/api/admin/salary/generate` | protect, adminOnly | admin | - |
| 76 | GET | `/api/admin/salary` | protect, staffOrAbove | manager: self + reports; HR/admin all | - |
| 77 | POST | `/api/admin/salary` | protect, hrOrAbove | ANY user_id incl. self; HR/admin | HR can write own salary record with arbitrary amounts/payment_status |
| 78 | PATCH | `/api/admin/salary/:id/paid` | protect, hrOrAbove | ANY record incl. own; HR/admin | HR can mark own salary paid |
| 79 | DELETE | `/api/admin/salary/:id` | protect, adminOnly | admin; pending + not downloaded only | - |
| 82 | GET | `/api/admin/salary-advances` | protect, staffOrAbove | manager: self + reports; HR/admin all | - |
| 83 | POST | `/api/admin/salary-advances` | protect | own; amount unbounded | - |
| 84 | PATCH | `/api/admin/salary-advances/:id/review` | protect, hrOrAbove | ANY advance incl. own; HR/admin | self-approval; no status/existence check |
| 87 | GET | `/api/admin/expense-claims` | protect, staffOrAbove | manager: self + reports; HR/admin all | - |
| 88 | POST | `/api/admin/expense-claims` | protect | own | - |
| 89 | PATCH | `/api/admin/expense-claims/:id/review` | protect, staffOrAbove | expenseReview: not own; manager reports only; paid = HR/admin | - |
| 92 | GET | `/api/admin/alerts` | protect | own + global | - |
| 93 | POST | `/api/admin/alerts` | protect, staffOrAbove | any user_id or global (NULL); staffOrAbove; free-form alert_type | managers can broadcast/forge system alerts (admin broadcast is adminOnly) |
| 94 | PATCH | `/api/admin/alerts/read-all` | protect | own + global rows | marks global alerts read for everyone |
| 95 | PATCH | `/api/admin/alerts/:id/read` | protect | NONE - any alert id | IDOR write |
| 98 | GET | `/api/admin/leaderboard` | protect | top-20 employees company-wide | - |
| 101 | GET | `/api/admin/audit-logs` | protect, adminOnly | admin | - |
| 105 | GET | `/api/admin/salary/:id/payslip-pdf` | protect | owner / reporting manager / HR / admin (inline) | - |
| 106 | POST | `/api/admin/broadcast` | protect, adminOnly | admin | - |
| 109 | GET | `/api/admin/attendance/export` | protect, staffOrAbove | manager: self + reports; HR/admin all | - (duplicate registration - unreachable) |

## dashboardRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 12 | GET | `/api/dashboard` | protect | role switch: employee own; manager = department_id (ALL employees if manager has no department); HR/admin company | manager team = department not reports; NULL department -> whole company; manager also receives company payroll totals |
| 13 | GET | `/api/dashboard/widgets` | protect | by role | - |

## meetingRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 6 | GET | `/api/meetings/invitees` | protect | same company_id (only place company is used for scoping) | - |
| 14 | GET | `/api/meetings/rooms` | protect | all rooms | - |
| 15 | GET | `/api/meetings` | protect | host or non-declined participant | - |
| 16 | POST | `/api/meetings` | protect | host = req.user; invitees must be same company | - |
| 17 | POST | `/api/meetings/join-by-code` | protect | any user with the code (returns id/title/host only) | password compared in plaintext |
| 19 | DELETE | `/api/meetings/:id` | protect, meetingAccess (router.use /:id, L18) | meetingAccess: host/admin (method-based) | - |
| 20 | PATCH | `/api/meetings/:id/reschedule` | protect, meetingAccess (router.use /:id, L18) | meetingAccess: host/admin (method-based) | - |
| 21 | GET | `/api/meetings/:id` | protect, meetingAccess (router.use /:id, L18) | meetingAccess: host/admin/participant | - |
| 22 | PATCH | `/api/meetings/:id` | protect, meetingAccess (router.use /:id, L18) | meetingAccess: host/admin (method-based) | - |
| 23 | POST | `/api/meetings/:id/start` | protect, meetingAccess (router.use /:id, L18) | meetingAccess: host/admin by exact path-suffix match | bypass: participant can call /start/ or /START (suffix compare is exact, Express routing is not) |
| 24 | POST | `/api/meetings/:id/end` | protect, meetingAccess (router.use /:id, L18) | meetingAccess: host/admin by exact path-suffix match | same bypass (/end/ , /END) |
| 25 | POST | `/api/meetings/:id/join` | protect, meetingAccess (router.use /:id, L18) | meetingAccess: host/admin/participant | response returns full meeting row incl. plaintext password |
| 26 | POST | `/api/meetings/:id/leave` | protect, meetingAccess (router.use /:id, L18) | own participant row | - |
| 27 | PATCH | `/api/meetings/:id/media` | protect, meetingAccess (router.use /:id, L18) | own participant row | - |
| 28 | GET | `/api/meetings/:id/messages` | protect, meetingAccess (router.use /:id, L18) | meetingAccess: participant | - |
| 29 | POST | `/api/meetings/:id/messages` | protect, meetingAccess (router.use /:id, L18) | meetingAccess: participant | client-controlled msg_type (can forge 'system' messages) |
| 30 | POST | `/api/meetings/:id/notes` | protect, meetingAccess (router.use /:id, L18) | meetingAccess: participant | - |
| 31 | GET | `/api/meetings/:id/report` | protect, meetingAccess (router.use /:id, L18) | meetingAccess: participant | - |
| 32 | POST | `/api/meetings/:id/report/regenerate` | protect, meetingAccess (router.use /:id, L18) | meetingAccess: host/admin by exact path-suffix match | same bypass (/report/regenerate/) |

## cabRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 7 | GET | `/api/cab/routes` | protect | all | - |
| 8 | GET | `/api/cab/vehicles` | protect | all | - |
| 9 | GET | `/api/cab/slots` | protect | all; returns names of colleagues booked on a route/date | low: passenger names per route/date to any employee |
| 12 | POST | `/api/cab/book` | protect | own | - |
| 13 | GET | `/api/cab/my` | protect | own | - |
| 14 | DELETE | `/api/cab/my/:id` | protect | own (booking_id AND user_id) | - |
| 15 | POST | `/api/cab/rate` | protect | own completed booking | - |
| 18 | GET | `/api/cab/track/:booking_id` | protect | NONE - any booking | IDOR: GPS pings of any booking |
| 19 | POST | `/api/cab/ping` | protect | NONE - any booking | any employee can inject fake GPS pings and flip journey_status |
| 20 | PATCH | `/api/cab/journey/:booking_id/complete` | protect | NONE - any booking | any employee can complete any journey; OTP check skipped when otp omitted |
| 21 | PATCH | `/api/cab/journey/:booking_id/acknowledge` | protect | NONE - any booking | any employee can 'driver-acknowledge' |
| 22 | GET | `/api/cab/notifications` | protect | NONE - company-wide | all trips with passenger + driver mobile to any employee |
| 25 | POST | `/api/cab/sos` | protect | NONE - any booking_id | can flip another user's booking to journey_status='sos' |
| 26 | GET | `/api/cab/sos` | protect | NONE - all open SOS | names, phones, coordinates of SOS raisers to any employee |
| 27 | PATCH | `/api/cab/sos/:sos_id/resolve` | protect | NONE | any employee can resolve/silence any SOS |
| 30 | GET | `/api/cab/all` | protect | NONE - company-wide (comment says Admin/Manager) | all bookings incl. name/email/phone and ride OTP to any employee |
| 31 | PATCH | `/api/cab/:id/approve` | protect | NONE (comment says Admin/Manager) | any employee can approve any booking incl. their own |
| 32 | PATCH | `/api/cab/:id/reject` | protect | NONE | any employee can reject anyone's booking, any status |
| 35 | GET | `/api/cab/drivers` | protect | NONE (comment says admin only) | driver PII incl. id_card_number (Aadhaar), address, licence to any employee |
| 36 | GET | `/api/cab/drivers/:id` | protect | NONE | same |
| 37 | POST | `/api/cab/drivers` | protect | NONE (comment says admin only) | any employee can create drivers |
| 38 | PATCH | `/api/cab/drivers/:id` | protect | NONE | any employee can edit/suspend drivers, reassign routes |
| 39 | DELETE | `/api/cab/drivers/:id` | protect | NONE | any employee can deactivate drivers |
| 43 | GET | `/api/cab/sos-alerts` | protect | NONE | alias of GET /sos |
| 44 | PATCH | `/api/cab/sos-alerts/:sos_id/resolve` | protect | NONE | alias of resolve |
| 48 | POST | `/api/cab/issues` | protect | own | - |
| 49 | GET | `/api/cab/issues/my` | protect | own | - |
| 50 | GET | `/api/cab/issues/stats` | protect | NONE - aggregate | low |
| 51 | GET | `/api/cab/issues` | protect | NONE - all issues with reporter name/email | frontend hides via canManageIssues() only |
| 52 | PATCH | `/api/cab/issues/:id` | protect | NONE | any employee can close/assign/resolve any issue |
| 53 | GET | `/api/cab/issues/:id/comments` | protect | NONE - incl. is_internal comments | IDOR + internal notes |
| 54 | POST | `/api/cab/issues/:id/comments` | protect | NONE | any employee; client-controlled is_internal |

## settingsRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 13 | GET | `/api/settings` | protect, staffOrAbove | company settings; staffOrAbove | - |
| 14 | POST | `/api/settings` | protect, adminOnly | admin | - |
| 15 | POST | `/api/settings/bulk` | protect, adminOnly | admin | - |
| 18 | GET | `/api/settings/policies` | protect | all | - |
| 19 | GET | `/api/settings/policies/:id` | protect | all | - |
| 20 | POST | `/api/settings/policies` | protect, staffOrAbove | staffOrAbove | managers can publish company policies (PDF upload path is hrOrAbove) |
| 21 | PUT | `/api/settings/policies/:id` | protect, staffOrAbove | staffOrAbove, any policy | managers can rewrite any company policy |
| 22 | DELETE | `/api/settings/policies/:id` | protect, adminOnly | admin | - |
| 25 | GET | `/api/settings/locations` | protect | all | - |
| 26 | GET | `/api/settings/locations/:id` | protect | all | - |
| 27 | POST | `/api/settings/locations` | protect, adminOnly | admin | - |
| 28 | PUT | `/api/settings/locations/:id` | protect, adminOnly | admin | - |
| 29 | DELETE | `/api/settings/locations/:id` | protect, adminOnly | admin | - |
| 31 | GET | `/api/settings/:group/:key` | protect, staffOrAbove | staffOrAbove | - |
| 32 | DELETE | `/api/settings/:group/:key` | protect, adminOnly | admin | - |

## taxRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 11 | POST | `/api/tax/calculate` | protect | stateless | - |
| 14 | GET | `/api/tax/declaration/my` | protect | own | - |
| 15 | POST | `/api/tax/declaration/draft` | protect | own; server recomputes tax | - |
| 16 | POST | `/api/tax/declaration/submit` | protect | own | - |
| 17 | POST | `/api/tax/declaration/:id/submit` | protect | own (user_id AND declaration_id) | - |
| 20 | GET | `/api/tax/declaration/all` | protect, hrOrAbove | company; HR/admin | - |
| 21 | POST | `/api/tax/declaration/review` | protect, hrOrAbove | HR/admin; self-review blocked | - |
| 24 | GET | `/api/tax/form16/my` | protect | own | - |
| 25 | GET | `/api/tax/form16/all` | protect, hrOrAbove | company; HR/admin | - |
| 26 | POST | `/api/tax/form16/generate` | protect, adminOnly | admin; amounts client-supplied | gross_salary/total_tds taken from request body, not payroll |
| 29 | GET | `/api/tax/tds-summary` | protect | own | - |

## loanRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 11 | GET | `/api/loans/my` | protect | own | - |
| 12 | GET | `/api/loans/eligibility` | protect | own | - |
| 13 | GET | `/api/loans/credit-profile` | protect | own | - |
| 14 | PUT | `/api/loans/credit-profile` | protect | own (self-reported) | - |
| 15 | POST | `/api/loans/calculate-emi` | protect | stateless | - |
| 16 | POST | `/api/loans/apply` | protect | own; manager_id derived server-side | - |
| 17 | GET | `/api/loans/:id/repayments/my` | protect | own loan | - |
| 20 | PATCH | `/api/loans/:id/manager-review` | protect, managerOrAbove | assigned manager (or admin); not own loan; stage enforced | - |
| 23 | PATCH | `/api/loans/:id/hr-review` | protect, hrOrAbove | HR/admin; not own loan; stage enforced | - |
| 26 | GET | `/api/loans` | protect, staffOrAbove | manager: loans assigned to them + own; HR/admin all | - |
| 27 | PATCH | `/api/loans/:id/admin-approve` | protect, adminOnly | admin; not own loan; stage enforced | one admin can perform all three review stages + disbursement on someone else's loan (info) |
| 28 | POST | `/api/loans/:id/disburse` | protect, adminOnly | admin; not own loan | - |
| 29 | GET | `/api/loans/:id/repayments` | protect, staffOrAbove | readable(): owner/assigned manager/HR/admin | - |
| 30 | PATCH | `/api/loans/repayments/:repayment_id/paid` | protect, hrOrAbove | HR/admin; not own loan | - |
| 34 | GET | `/api/loans/bank-partners` | protect | public reference data | - |
| 35 | GET | `/api/loans/bank-offers` | protect | own eligibility | - |
| 36 | POST | `/api/loans/dual-eligibility` | protect | own eligibility | - |
| 37 | POST | `/api/loans/share-eligibility` | protect | readable() loan | - |
| 38 | GET | `/api/loans/:id/foreclose` | protect | readable() loan | - |
| 39 | POST | `/api/loans/:id/foreclose` | protect, adminOnly | admin | no self-check on own loan (low) |

## safetyRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 11 | POST | `/api/safety/sos/trigger` | protect | own | - |
| 12 | GET | `/api/safety/sos/active` | protect, staffOrAbove | company-wide; staffOrAbove | every manager sees all SOS events with phone + coordinates |
| 13 | GET | `/api/safety/sos` | protect, staffOrAbove | company-wide; staffOrAbove | same |
| 14 | PATCH | `/api/safety/sos/:id/respond` | protect, staffOrAbove | any SOS; staffOrAbove | - |
| 15 | PATCH | `/api/safety/sos/:id/resolve` | protect, staffOrAbove | any SOS; staffOrAbove; client-controlled status | free-form status from body |
| 18 | POST | `/api/safety/complaints` | protect | own / anonymous (reporter_id NULL) | audit middleware stores actor_id + body -> anonymous complaints de-anonymised in audit_logs |
| 19 | GET | `/api/safety/complaints/my` | protect | own | - |
| 20 | GET | `/api/safety/complaints` | protect, hrOrAbove | all complaints incl. reporter + accused names; every HR/admin | no ICC role; accused HR/admin can read the complaint against them |
| 21 | PATCH | `/api/safety/complaints/:id` | protect, hrOrAbove | any complaint; HR/admin | no conflict-of-interest check: accused HR/admin can close their own case |
| 24 | POST | `/api/safety/night-shift` | protect | own | - |
| 25 | GET | `/api/safety/night-shift/my` | protect | own | - |
| 26 | GET | `/api/safety/night-shift` | protect, staffOrAbove | company-wide incl. phone + guardian_phone; staffOrAbove | managers not limited to reports |
| 27 | PATCH | `/api/safety/night-shift/:id/review` | protect, staffOrAbove | any request; staffOrAbove | no self-check, no report scope, free-form status |
| 30 | GET | `/api/safety/contacts` | protect | own | - |
| 31 | POST | `/api/safety/contacts` | protect | own | - |
| 32 | PUT | `/api/safety/contacts/:id` | protect | own (contact_id AND user_id) | - |
| 33 | DELETE | `/api/safety/contacts/:id` | protect | own | - |
| 36 | GET | `/api/safety/dashboard` | protect, hrOrAbove | company; HR/admin | - |

## gradesRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 8 | GET | `/api/grades/my` | protect | own | - |
| 9 | GET | `/api/grades/user/:userId` | protect, staffOrAbove | any user; staffOrAbove | managers not limited to reports (salary bands) |
| 10 | GET | `/api/grades` | protect, staffOrAbove | company-wide; staffOrAbove | all grades + salary bands to every manager |
| 11 | POST | `/api/grades` | protect, staffOrAbove | any user_id from body; staffOrAbove | manager/HR can assign a grade + salary band to anyone incl. themselves |
| 12 | PUT | `/api/grades/:id` | protect, staffOrAbove | any grade row; staffOrAbove | same |
| 15 | GET | `/api/grades/promotions/my` | protect | own | - |
| 16 | GET | `/api/grades/promotions` | protect, staffOrAbove | company-wide; staffOrAbove | managers see all promotions + salary_revision |
| 17 | POST | `/api/grades/promotions` | protect, staffOrAbove | user_id from body, defaults to self; staffOrAbove | self-nomination with client-set salary_revision |
| 18 | PATCH | `/api/grades/promotions/:id/review` | protect, hrOrAbove | any promotion; HR/admin | HR can approve own promotion; no status precondition (repeatable) |
| 21 | GET | `/api/grades/skills/all` | protect | reference | - |
| 22 | GET | `/api/grades/skills/my` | protect | own | - |
| 23 | POST | `/api/grades/skills` | protect | own | - |
| 24 | PATCH | `/api/grades/skills/:id/verify` | protect, staffOrAbove | any assessment; staffOrAbove | self-verification possible |
| 27 | GET | `/api/grades/certifications/my` | protect | own | - |
| 28 | POST | `/api/grades/certifications` | protect | own | - |
| 29 | DELETE | `/api/grades/certifications/:id` | protect | own | - |

## transferRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 8 | GET | `/api/transfers/family` | protect | own | - |
| 9 | POST | `/api/transfers/family` | protect | own | - |
| 12 | GET | `/api/transfers/my` | protect | own | - |
| 13 | GET | `/api/transfers` | protect, staffOrAbove | company-wide; staffOrAbove | managers see all transfer requests (family/medical reasons) |
| 14 | POST | `/api/transfers` | protect | own | - |
| 15 | PATCH | `/api/transfers/:id/manager-review` | protect, managerOrAbove | ANY transfer; managerOrAbove | no reporting-line or self check, no stage/status check, free-form action |
| 16 | PATCH | `/api/transfers/:id/hr-review` | protect, hrOrAbove | ANY transfer; HR/admin | no self check, no stage check; can overwrite a final decision |
| 17 | PATCH | `/api/transfers/:id/admin-review` | protect, adminOnly | admin | no stage check; repeat approval duplicates relocation_history |
| 20 | GET | `/api/transfers/history` | protect | own | - |
| 21 | GET | `/api/transfers/history/:userId` | protect, staffOrAbove | any user; staffOrAbove | managers not limited to reports |

## benefitsRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 8 | GET | `/api/benefits/plans` | protect | reference | - |
| 9 | POST | `/api/benefits/plans` | protect, hrOrAbove | HR/admin | - |
| 10 | PUT | `/api/benefits/plans/:id` | protect, hrOrAbove | HR/admin | - |
| 13 | GET | `/api/benefits/summary` | protect | own | - |
| 14 | GET | `/api/benefits/my` | protect | own | - |
| 15 | GET | `/api/benefits/user/:userId` | protect, staffOrAbove | any user; staffOrAbove | managers not limited to reports (nominee, policy no.) |
| 16 | GET | `/api/benefits` | protect, staffOrAbove | company-wide; staffOrAbove | same |
| 17 | POST | `/api/benefits/enroll` | protect | own; no approval step | client-controlled policy_number/enrollment dates |
| 18 | PUT | `/api/benefits/:id` | protect | own (benefit_id AND user_id) | client-controlled status |
| 19 | PATCH | `/api/benefits/:id/cancel` | protect | own | - |
| 22 | GET | `/api/benefits/dependents` | protect | own | - |
| 23 | POST | `/api/benefits/dependents` | protect | own | - |
| 24 | PUT | `/api/benefits/dependents/:id` | protect | own | - |
| 25 | DELETE | `/api/benefits/dependents/:id` | protect | own | - |

## bankingRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 7 | GET | `/api/banking/my` | protect | own (masked) | - |
| 8 | POST | `/api/banking/my` | protect | own; resets is_verified | - |
| 9 | GET | `/api/banking/unverified` | protect, hrOrAbove | company; HR/admin (masked) | - |
| 10 | PATCH | `/api/banking/verify/:userId` | protect, hrOrAbove | any user; HR/admin | HR can verify their own bank details (no self-check) |
| 11 | GET | `/api/banking/user/:userId` | protect, hrOrAbove | any user; HR/admin (masked) | - |
| 12 | GET | `/api/banking/ifsc/:ifsc` | protect | stateless; calls external directory | - |

## announcementsRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 5 | GET | `/api/announcements` | protect | active + target_roles filter | - |
| 6 | GET | `/api/announcements/:id` | protect | NONE - any id | bypasses target_roles / is_active / expiry filter |
| 7 | POST | `/api/announcements` | protect, staffOrAbove | staffOrAbove | - |
| 8 | PUT | `/api/announcements/:id` | protect, staffOrAbove | any announcement; staffOrAbove | any manager can rewrite HR/admin announcements |
| 9 | POST | `/api/announcements/:id/read` | protect | own read marker | - |
| 10 | DELETE | `/api/announcements/:id` | protect, staffOrAbove | any announcement; staffOrAbove | any manager can archive any announcement |

## performanceRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 5 | GET | `/api/performance/my` | protect | own | - |
| 6 | GET | `/api/performance/team` | protect, staffOrAbove | reviews I wrote or of my direct reports | - |
| 7 | GET | `/api/performance/summary` | protect, staffOrAbove | company aggregate; staffOrAbove | - |
| 8 | GET | `/api/performance/all` | protect, staffOrAbove | company-wide; staffOrAbove | every manager reads every review (scores, reviewer_notes) |
| 9 | POST | `/api/performance` | protect, staffOrAbove | user_id from body; staffOrAbove | no self-check or reporting-line check: self-review / review of anyone |
| 10 | PATCH | `/api/performance/:id/acknowledge` | protect | own (review_id AND user_id) | - |

## helpdeskRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 7 | GET | `/api/helpdesk/stats` | protect, staffOrAbove | aggregate; staffOrAbove | - |
| 8 | GET | `/api/helpdesk/sla` | protect | reference | - |
| 9 | GET | `/api/helpdesk/kb` | protect | published articles | - |
| 10 | POST | `/api/helpdesk/kb` | protect, staffOrAbove | staffOrAbove | - |
| 11 | POST | `/api/helpdesk/kb/:id/rate` | protect | any; unlimited | low |
| 14 | GET | `/api/helpdesk/my` | protect | own | - |
| 17 | GET | `/api/helpdesk` | protect, staffOrAbove | company-wide; staffOrAbove | every manager sees every ticket |
| 18 | POST | `/api/helpdesk` | protect | own | - |
| 21 | PATCH | `/api/helpdesk/:id` | protect, staffOrAbove | any ticket; staffOrAbove | agent sets the requester's satisfaction score |
| 22 | GET | `/api/helpdesk/:id/comments` | protect | NONE - any ticket | IDOR incl. is_internal staff notes |
| 23 | POST | `/api/helpdesk/:id/comments` | protect | NONE - any ticket | any employee; client-controlled is_internal |
| 24 | POST | `/api/helpdesk/:id/escalate` | protect, staffOrAbove | any ticket; staffOrAbove | - |

## assetsRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 5 | GET | `/api/assets/stats` | protect, staffOrAbove | aggregate incl. total purchase value; staffOrAbove | - |
| 6 | GET | `/api/assets/my` | protect | own | - |
| 7 | GET | `/api/assets` | protect, staffOrAbove | company; staffOrAbove | - |
| 8 | POST | `/api/assets` | protect, adminOnly | admin | - |
| 9 | POST | `/api/assets/:id/assign` | protect, staffOrAbove | any asset to any user; staffOrAbove | self-assignment; no availability check |
| 10 | PATCH | `/api/assets/:id/return` | protect, staffOrAbove | any asset; staffOrAbove | - |

## trainingRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 5 | GET | `/api/training/stats` | protect, staffOrAbove | aggregate; staffOrAbove | - |
| 6 | GET | `/api/training/courses` | protect | reference | - |
| 7 | GET | `/api/training/my` | protect | own | - |
| 8 | GET | `/api/training/all-enrollments` | protect, staffOrAbove | company-wide; staffOrAbove | managers not limited to reports (low) |
| 9 | POST | `/api/training/courses` | protect, staffOrAbove | staffOrAbove | - |
| 10 | POST | `/api/training/enroll` | protect | own | - |
| 11 | PATCH | `/api/training/progress/:courseId` | protect | own | client-controlled status/score/progress: self-certify mandatory training |

## onboardingRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 4 | GET | `/api/onboarding/my` | protect | own | - |
| 5 | PATCH | `/api/onboarding/task/:taskId` | protect | own | self-complete tasks assigned to HR/IT (low) |
| 6 | GET | `/api/onboarding/team` | protect, staffOrAbove | all users created in last 90 days; staffOrAbove | not team-scoped despite name (low) |

## hiringRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 12 | GET | `/api/hiring/stats` | protect, staffOrAbove | aggregate; staffOrAbove | - |
| 15 | GET | `/api/hiring/jobs` | protect | NONE - all postings incl. draft/cancelled + salary range | low |
| 16 | GET | `/api/hiring/jobs/:id` | protect | NONE | low |
| 17 | POST | `/api/hiring/jobs` | protect, hrOrAbove | HR/admin | - |
| 18 | PATCH | `/api/hiring/jobs/:id` | protect, hrOrAbove | HR/admin | - |
| 19 | DELETE | `/api/hiring/jobs/:id` | protect, hrOrAbove | HR/admin | - |
| 22 | GET | `/api/hiring/candidates` | protect, staffOrAbove | company-wide incl. current/expected CTC, DOB; staffOrAbove | all managers |
| 23 | GET | `/api/hiring/candidates/:id` | protect, staffOrAbove | any candidate; staffOrAbove | returns latest offer letter (CTC) although /offers is HR-only |
| 24 | POST | `/api/hiring/candidates` | protect, staffOrAbove | staffOrAbove | - |
| 25 | PATCH | `/api/hiring/candidates/:id/status` | protect, staffOrAbove | any candidate; staffOrAbove; free-form status | - |
| 28 | GET | `/api/hiring/interviews` | protect | employee: rounds they interview; staff: all | - |
| 29 | POST | `/api/hiring/interviews` | protect, staffOrAbove | staffOrAbove | - |
| 30 | PATCH | `/api/hiring/interviews/:id/feedback` | protect | NONE - any round | any employee can overwrite feedback; result='fail' auto-rejects the candidate |
| 33 | GET | `/api/hiring/offers` | protect, hrOrAbove | HR/admin | - |
| 34 | POST | `/api/hiring/offers` | protect, hrOrAbove | HR/admin | - |
| 35 | PATCH | `/api/hiring/offers/:id/status` | protect, hrOrAbove | HR/admin | - |
| 38 | GET | `/api/hiring/referrals/my` | protect | own | - |
| 39 | GET | `/api/hiring/referrals` | protect, staffOrAbove | company; staffOrAbove | - |
| 40 | POST | `/api/hiring/referrals` | protect | own | - |
| 43 | GET | `/api/hiring/candidates/:id/documents` | protect, staffOrAbove | staffOrAbove | - |
| 44 | POST | `/api/hiring/documents` | protect, staffOrAbove | staffOrAbove; arbitrary file_url | - |
| 45 | PATCH | `/api/hiring/documents/:docId/verify` | protect, hrOrAbove | HR/admin | - |

## complianceRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 4 | GET | `/api/compliance/summary` | protect, staffOrAbove | company payroll aggregate; staffOrAbove | managers |
| 5 | GET | `/api/compliance/pf` | protect, staffOrAbove | EVERY employee's basic salary; staffOrAbove | managers get company-wide salaries (payroll API scopes them to reports) |
| 6 | POST | `/api/compliance/pf/calculate` | protect, staffOrAbove | any employee_id; staffOrAbove | same |
| 7 | GET | `/api/compliance/pf/challan` | protect, hrOrAbove | company; HR/admin | - |
| 8 | GET | `/api/compliance/esi` | protect, staffOrAbove | every low-wage employee's gross; staffOrAbove | same |
| 9 | POST | `/api/compliance/esi/calculate` | protect, staffOrAbove | any employee_id; staffOrAbove | same |
| 10 | GET | `/api/compliance/gratuity` | protect, staffOrAbove | every employee's basic + DOJ; staffOrAbove | same |
| 11 | GET | `/api/compliance/gratuity/:id` | protect | NONE - protect only | role guard missing; handler reads req.params.employee_id (route declares :id) so it always 404s today - fixing the param exposes any user's basic salary to all |
| 12 | POST | `/api/compliance/pt/calculate` | protect, staffOrAbove | any employee_id; staffOrAbove | same as pf/calculate |

## aiRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 4 | GET | `/api/ai/insights` | protect | NONE - company aggregate | low |
| 5 | GET | `/api/ai/attrition` | protect, staffOrAbove | company-wide incl. gross_salary per employee; staffOrAbove | managers get all salaries + risk labels |
| 6 | GET | `/api/ai/attrition/:employee_id` | protect, staffOrAbove | any employee; staffOrAbove | not limited to reports |
| 7 | GET | `/api/ai/burnout/:employee_id` | protect, staffOrAbove | any employee; staffOrAbove | not limited to reports |
| 8 | GET | `/api/ai/leave-forecast/:employee_id` | protect | NONE - protect only | IDOR: any user's leave history + balances |
| 9 | GET | `/api/ai/salary-benchmark` | protect, staffOrAbove | company salary min/max/avg per role+department; staffOrAbove | small groups reveal individual salaries to managers |

## exitRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 7 | POST | `/api/exit/resign` | protect | own | - |
| 8 | GET | `/api/exit/my-resignation` | protect | own | - |
| 9 | POST | `/api/exit/withdraw` | protect | own, status=submitted only | - |
| 10 | POST | `/api/exit/exit-interview` | protect | own | - |
| 13 | GET | `/api/exit/checklist/my` | protect | own (seeds checklist on first GET) | - |
| 14 | PATCH | `/api/exit/checklist/item` | protect | NONE - any item_id | any user can tick/untick any exit-clearance item incl. their own |
| 15 | GET | `/api/exit/checklist/:user_id` | protect | NONE - any :user_id | IDOR read; GET also INSERTs 12 checklist rows for that user |
| 18 | POST | `/api/exit/fnf/approve` | protect, hrOrAbove | any user_id; HR/admin | HR can approve own settlement with client-supplied approved_amount; no status precondition |
| 19 | POST | `/api/exit/fnf/disburse` | protect, hrOrAbove | any user_id; HR/admin | no precondition (approve not required); then sets users.status='resigned' (not in ENUM) for any user id |
| 20 | GET | `/api/exit/fnf/:user_id` | protect, hrOrAbove | any user; HR/admin; GET writes fnf_settlements | - |
| 23 | POST | `/api/exit/bgv/:id/consent` | protect | NONE - any bgv id | anyone can record BGV consent on someone else's behalf |
| 24 | PATCH | `/api/exit/bgv/:id/complete` | protect, hrOrAbove | HR/admin | - |
| 25 | POST | `/api/exit/bgv` | protect, hrOrAbove | HR/admin | - |
| 28 | POST | `/api/exit/document` | protect, hrOrAbove | any user_id; HR/admin | HR can self-issue experience/relieving letters |
| 29 | GET | `/api/exit/dashboard` | protect, staffOrAbove | company; staffOrAbove | - |
| 30 | GET | `/api/exit/all` | protect, staffOrAbove | company-wide resignations incl. comments/hr_note; staffOrAbove | managers not limited to reports |
| 33 | POST | `/api/exit/manager-acknowledge` | protect, staffOrAbove | ANY resignation_id; staffOrAbove | no reporting-line/self/status check; can overwrite withdrawn or hr_approved |
| 34 | POST | `/api/exit/hr-approve` | protect, hrOrAbove | ANY resignation_id; HR/admin | HR can approve/reject own resignation; no status check |

## travelRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 6 | GET | `/api/travel/requests/my` | protect | own | - |
| 7 | GET | `/api/travel/requests` | protect, staffOrAbove | company-wide; staffOrAbove | managers not limited to reports (expenses are) |
| 8 | POST | `/api/travel/requests` | protect | own | - |
| 9 | PATCH | `/api/travel/requests/:id` | protect, staffOrAbove | ANY request; staffOrAbove | self-approval, no reporting-line check, no status check, unbounded approved_amount |
| 12 | GET | `/api/travel/expenses/my` | protect | own | travel_request_id not ownership-checked on submit -> leaks other users' trip destination/date |
| 13 | GET | `/api/travel/expenses/summary` | protect, hrOrAbove | company; HR/admin | - |
| 14 | GET | `/api/travel/expenses` | protect, staffOrAbove | manager: own + reports; HR/admin all | - |
| 15 | POST | `/api/travel/expenses` | protect | own | client-controlled travel_request_id, receipt_url |
| 16 | PATCH | `/api/travel/expenses/:id` | protect, staffOrAbove | expenseReview: not own; manager reports only; paid = HR/admin | - |
| 19 | GET | `/api/travel/batches` | protect, hrOrAbove | HR/admin | - |
| 20 | POST | `/api/travel/batches` | protect, hrOrAbove | HR/admin; own claims excluded | - |
| 21 | POST | `/api/travel/batches/:id/process` | protect, hrOrAbove | HR/admin; own claims excluded | - |

## dependentRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 4 | GET | `/api/dependents/my` | protect | own | - |
| 5 | POST | `/api/dependents/my` | protect | own | - |
| 6 | PATCH | `/api/dependents/my/:id` | protect | own | - |
| 7 | DELETE | `/api/dependents/my/:id` | protect | own | - |
| 8 | GET | `/api/dependents/insurance-plans` | protect | reference | - |
| 9 | POST | `/api/dependents/insurance/enroll` | protect | own; dependent_ids NOT ownership-checked | enrolling another user's dependent_id then GET /insurance/my leaks that dependent's name/relationship |
| 10 | GET | `/api/dependents/insurance/my` | protect | own enrollments | see above |
| 11 | GET | `/api/dependents/health-card` | protect | own (GET writes health_cards) | - |
| 12 | GET | `/api/dependents/health-card/my` | protect | own | - |
| 13 | GET | `/api/dependents/health-card/:user_id` | protect, hrOrAbove | any user; HR/admin | - |
| 14 | GET | `/api/dependents/renewal-alerts` | protect, hrOrAbove | company; HR/admin | - |

## recruitmentRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 4 | GET | `/api/recruitment/requisitions` | protect, staffOrAbove | company; staffOrAbove | - |
| 5 | POST | `/api/recruitment/requisitions` | protect, staffOrAbove | staffOrAbove | - |
| 6 | PATCH | `/api/recruitment/requisitions/:id/status` | protect, hrOrAbove | any; HR/admin; free-form status | HR can approve own requisition (low) |
| 7 | POST | `/api/recruitment/ats-score` | protect | stateless | - |
| 8 | GET | `/api/recruitment/resume-templates` | protect | reference | - |
| 9 | GET | `/api/recruitment/resume-template/:job_id` | protect | reference | - |
| 10 | GET | `/api/recruitment/prep-notes` | protect | reference | - |
| 11 | GET | `/api/recruitment/joining-letters` | protect, staffOrAbove | company incl. candidate email + letter content; staffOrAbove | all managers |
| 12 | POST | `/api/recruitment/joining-letters` | protect, hrOrAbove | HR/admin | - |
| 13 | POST | `/api/recruitment/joining-letters/:id/ack` | protect | NONE - any letter id | any employee can mark any candidate's joining letter acknowledged |
| 14 | POST | `/api/recruitment/mark-joined` | protect, hrOrAbove | HR/admin | - |
| 15 | GET | `/api/recruitment/funnel` | protect, staffOrAbove | aggregate; staffOrAbove | - |

## cabSafetyRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 4 | GET | `/api/cab-safety/vehicle/:booking_id` | protect | NONE - any booking | IDOR: cb.* incl. user_id, OTP, pickup/drop |
| 5 | POST | `/api/cab-safety/assign-driver` | protect, staffOrAbove | any booking; staffOrAbove | - |
| 6 | GET | `/api/cab-safety/driver/:driver_id/id-card` | protect | NONE - any driver | d.* incl. id_card_number, address, mobile to any employee |
| 7 | GET | `/api/cab-safety/driver-cards` | protect, staffOrAbove | staffOrAbove | - |
| 8 | GET | `/api/cab-safety/tracking/:booking_id` | protect | NONE - any booking | IDOR: live lat/lng + OTP + driver phone of anyone's ride |
| 9 | GET | `/api/cab-safety/facilities` | protect | stateless | - |
| 10 | GET | `/api/cab-safety/helplines` | protect | stateless | - |
| 11 | GET | `/api/cab-safety/panel/:booking_id` | protect | NONE - any booking | IDOR: pickup/drop + last GPS + driver phone |

## locationRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 7 | POST | `/api/location/session` | protect | own | - |
| 8 | POST | `/api/location/logout` | protect | own | - |
| 11 | GET | `/api/location/me` | protect | own | - |
| 12 | GET | `/api/location/live` | protect | own (consent checked) | - |
| 13 | GET | `/api/location/weather-widget` | protect | own | - |
| 16 | PATCH | `/api/location/preferences` | protect | own | - |
| 19 | GET | `/api/location/sessions/all` | protect, hrOrAbove | company-wide login sessions (ls.* incl. IP, lat/lng); HR/admin | - |
| 20 | GET | `/api/location/sessions` | protect | own | - |
| 23 | GET | `/api/location/offices` | protect | reference | - |
| 24 | POST | `/api/location/detect-office` | protect | stateless | - |

## projectsRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 7 | GET | `/api/projects/stats` | protect | NONE - company aggregate incl. total budget/spent | budget totals to any employee |
| 8 | GET | `/api/projects/my` | protect | own memberships | - |
| 9 | GET | `/api/projects` | protect | NONE - all projects incl. budget/spent | any employee |
| 10 | GET | `/api/projects/:id` | protect | NONE - any project + ALL its tasks (t.*) and members | bypasses task scope |
| 11 | POST | `/api/projects` | protect, staffOrAbove | staffOrAbove | - |
| 12 | PATCH | `/api/projects/:id` | protect, staffOrAbove | ANY project; staffOrAbove | not limited to project manager/creator (budget, spent, manager_id) |
| 13 | DELETE | `/api/projects/:id` | protect, staffOrAbove | ANY project; staffOrAbove | any manager can cancel any project |
| 14 | POST | `/api/projects/:id/members` | protect, staffOrAbove | ANY project; staffOrAbove | - |
| 15 | DELETE | `/api/projects/:id/members/:userId` | protect, staffOrAbove | ANY project; staffOrAbove | - |
| 16 | POST | `/api/projects/:id/milestones` | protect, staffOrAbove | ANY project; staffOrAbove | - |
| 17 | PATCH | `/api/projects/:id/milestones/:milestoneId` | protect, staffOrAbove | ANY milestone; not bound to :id | - |

## notificationsRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 6 | GET | `/api/notifications/count` | protect | own | - |
| 7 | GET | `/api/notifications` | protect | own | - |
| 8 | POST | `/api/notifications/mark-read` | protect | own | - |
| 9 | PATCH | `/api/notifications/mark-all` | protect | own | - |
| 10 | DELETE | `/api/notifications/clear` | protect | own | - |
| 11 | DELETE | `/api/notifications/:id` | protect | own | - |
| 12 | PATCH | `/api/notifications/:id/read` | protect | own | - |
| 13 | POST | `/api/notifications/broadcast` | protect, staffOrAbove | any users / everyone; staffOrAbove | any manager can push arbitrary title/message/action_url to all users (admin broadcast elsewhere is adminOnly) |

## documentsRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 41 | POST | `/api/documents/upload` | protect | own | - |
| 66 | GET | `/api/documents/:id/download` | protect | owner, or HR/admin when shared_with_hr=1 | - |
| 79 | GET | `/api/documents` | protect | own | - |
| 90 | DELETE | `/api/documents/:id` | protect | own | - |
| 101 | PATCH | `/api/documents/:id/share` | protect | own | - |
| 109 | PATCH | `/api/documents/:id/review` | protect, hrOrAbove | HR/admin (inline require().hrOrAbove); shared, pending, not own | - |

## policiesRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 36 | POST | `/api/policies/upload` | protect, hrOrAbove | HR/admin | PDF stored under public /uploads/policies |
| 58 | GET | `/api/policies` | protect | all policies (ignores applicable_to / is_active) | low |
| 71 | POST | `/api/policies/:id/acknowledge` | protect | own acknowledgement | - |

## letterRoutes.js

| Line | Method | Path | Guards | Scope to req.user | Concern |
|---|---|---|---|---|---|
| 12 | GET | `/api/letters/employees` | protect, hrOrAbove | company incl. gross/net salary; HR/admin | - |
| 13 | POST | `/api/letters/generate` | protect, hrOrAbove | any user_id incl. self; HR/admin | response returns SELECT u.* (password_hash, bank fields) of the target; HR can self-issue salary certificates with client-supplied amounts |
| 14 | GET | `/api/letters/my` | protect | own | - |
| 15 | GET | `/api/letters` | protect, hrOrAbove | company; HR/admin | - |
