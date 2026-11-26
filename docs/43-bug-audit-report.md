> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# 43. Bug Audit Report — Workforce Intelligence

This report records what was found when the project was actually *run* (not just read), what was fixed,
and — just as important — what has **not** been verified.

## 1. How it was tested

| Layer | Method |
|---|---|
| Database | Imported `database/init/*.sql` into a real **MySQL 8.0.46** server in default strict `sql_mode`, exactly as `docker-entrypoint-initdb.d` does (root, in order, **no `--force`**) |
| SQL in code | Extracted all **772** static SQL strings from `backend/` with a JS parser and ran `PREPARE` on each against the live schema (validates syntax, tables and columns; executes nothing) |
| Backend | Started the real Node server against that database; logged in as all 4 demo accounts; called **143** `GET` routes as admin; checked the server log for SQL errors |
| Frontend | Playwright load of all **116** app pages (JS errors, navbar/sidebar, footer, export functions, dark mode, cookie banner) |

## 2. Corrections to earlier statements

| Earlier claim | Reality |
|---|---|
| "Database has 174 tables" | **125 base tables + 2 views.** 174 was the number of `CREATE TABLE` *statements*, inflated by duplicate definitions |
| "Database ready / seeded" | The init script **aborted on a real MySQL 8.0** after 25 tables with no data (MariaDB-only syntax). It had never been executed before |
| "Docker setup works" | The API **could not connect** to MySQL 8 (auth-plugin mismatch) |
| "Login with `P123/`" | **No account could log in** with `P123/`; the stored hashes matched other passwords or were malformed |
| `docs/14-setup.md`, `21-production-deploy.md` | Documented npm scripts that never existed (`db:migrate`, `db:seed`, …) and a database called `wfi_hrms` |

## 3. Findings and fixes

### Database

| # | Severity | Problem | Fix |
|---|---|---|---|
| D1 | Critical | `01_init.sql` created `roles(id,name)`; the schema needs `roles(role_id,role_name)`. `IF NOT EXISTS` silently skipped the real table, so `users` and ~100 dependent objects failed | `01_init.sql` now only creates the database and user |
| D2 | Critical | 106 uses of MariaDB-only syntax (`ADD COLUMN/INDEX/CONSTRAINT IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `MODIFY COLUMN IF EXISTS`) — a syntax error on MySQL 8.0, aborting the import | Converted to helper procedures that check `information_schema` first (removed again at the end of the script) |
| D3 | Critical | 13 tables defined more than once with different columns; the first definition won, so 100 columns the backend uses never existed | Missing columns merged into each table (made nullable) |
| D4 | High | Seed data written against older schemas: wrong column names, a `salaries` table that doesn't exist, 8 values for 7 columns, `leave_balances.remaining` is a generated column, reserved word `condition`, FKs to `departments(department_id)` (key is `dept_id`), function inside a `UNIQUE` key | Each statement corrected individually |
| D5 | Critical | **Passwords:** 4 accounts used the hash of `password`; 87 used a hash matching nothing documented; 10 were malformed placeholders | All seeded accounts set to a genuine bcrypt hash (cost 12) of `P123/`, verified with `bcryptjs` |
| D6 | Critical | `loans` table queried by `loanController` but defined nowhere | Created as an updatable view over `loan_applications` |
| D7 | Medium | Two rival "master" databases plus 28 other legacy SQL files beside the real ones; `npm run db:complete` (named in the README) built a *different* schema | Moved to `legacy/`; the dangerous scripts removed |

### Backend

| # | Severity | Problem | Fix |
|---|---|---|---|
| B1 | Critical | `mysql` npm driver cannot use MySQL 8's default `caching_sha2_password`; the API could not connect to the Docker database | `docker-compose.yml` runs MySQL with `--default-authentication-plugin=mysql_native_password`; init SQL and setup scripts create the user with that plugin |
| B2 | High | `socketServer.js`: `log` called itself (infinite recursion). The error was swallowed, so Socket.io was silently disabled | `console.log` |
| B3 | High | `letterController`: query helper returned a pending query object — the **whole Letters feature never worked** | Promise wrapper like every other controller |
| B4 | High | `PERCENTILE_CONT … WITHIN GROUP` is not MySQL | Rewritten with `PERCENT_RANK()` (p25/p75 are "first value at or above the percentile") |
| B5 | High | `aiController` grouped by user while joining a table that now has up to 7 salary rows per user, collapsing them arbitrarily | Latest salary via scalar subquery |
| B6 | Medium | `high_priority` is a reserved word (cab issue stats) | Alias quoted |
| B7 | Medium | Wrong columns in `audit_logs`/`employee_documents` inserts, `insurance_enrollments` (6 columns, 7 values), PDF payslip query, tax history, 10 × `d.department_id` | Corrected |
| B8 | Low | Old product name "WorkforceIQ" printed on generated letters, in an HTTP User-Agent, and in seeded data | Renamed to "Workforce Intelligence" |

### Frontend

| # | Problem | Fix |
|---|---|---|
| F1 | `â‚¹` / `â¤ï¸` garbling on `payslip-portal` and `welfare` (377 occurrences). Root cause: UTF-8 bytes were stored as separate HTML entities (`&#226;&#130;&#185;` instead of `&#8377;`) | Decoded properly |
| F2 | Missing toast element (8 pages), duplicate ids (2), missing `showTab`/print CSS (`assets`), blank heading placeholders (2) | Fixed; page JS now falls back to readable text |

## 4. Result

| Check | Result |
|---|---|
| Strict import on MySQL 8.0 | Exit 0 for both init files; 125 tables + 2 views; 101 users |
| All 4 documented logins | Work (`P123/`); wrong password rejected |
| Backend syntax | 93 files, 0 errors |
| SQL statements validated | 751 exact: 0 real failures (4 reported are fragments/strings, see §5) |
| Live `GET` smoke test | 134 of 143 OK; 6 are 4xx for missing params; 3 are 503 (see §5) |
| SQL errors in server log | 0 |
| Frontend | 116 of 116 pages clean |

## 5. Not verified / known limitations

- **Write paths were validated by `PREPARE` only** (correct tables and columns), not executed. Real `POST/PUT/DELETE` behaviour has not been exercised.
- **Docker itself was not run** (no Docker daemon here). The compose file parses, and the authentication flag was tested on a real `mysqld` 8.0.46, but a full `docker compose up` has not been observed.
- The frontend audit mocks API responses; pages were **not** exercised against the live backend in a browser.
- **21 template-literal queries** (dynamic fragments) cannot be checked statically. Four reported failures are known false positives (the code appends `GROUP BY` on the next lines, or the text is not SQL).
- **Compatibility layer (technical debt):** the backend uses an older column vocabulary than the schema. 14 read-only generated-column aliases bridge them (e.g. `users.date_of_joining` → `join_date`). Unifying the names in the backend code is the better long-term fix.
- Columns added with nothing writing them yet (they will be empty until populated): `cab_bookings.driver_rating`, `pickup_location`, `drop_location`; `cab_vehicles.vehicle_number`, `vehicle_model`, `insurance_expiry`, `puc_expiry`; `salary_records.transaction_ref`.
- **PDF payslips** return 503 because the setup skips the Puppeteer Chrome download; the attrition endpoints return 503 unless the optional Python service runs.
- Tested on MySQL 8.0.46. The schema also loads on MariaDB 10.11, but MySQL 8.4+ removes `mysql_native_password` by default and would need the driver switched to `mysql2`.
- **Security:** every seeded account uses the documented password `P123/`. Change them before any real deployment.
