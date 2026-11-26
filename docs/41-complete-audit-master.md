> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# Workforce Intelligence Platform — Complete Numbered Section-by-Section Audit & Requirements

## Numbering Standard
1. Major project sections use whole numbers: `1`, `2`, `3` …
2. Subsections use two levels: `1.1`, `1.2`, `1.3` …
3. Requirements/checks use three levels: `1.1.1`, `1.1.2`, `1.1.3` …
4. Each numbered requirement must have an evidence/result recorded before production sign-off.
5. Status terms remain: AVAILABLE, STATIC VERIFIED, LIVE VERIFIED, PARTIAL, MISSING, CONFIGURATION REQUIRED, LIVE TEST REQUIRED.


## How to Read This Document

- **AVAILABLE** = feature/page/code exists in the project.

- **STATIC VERIFIED** = source-level validation passed; this does not prove live database/browser behavior.

- **PARTIAL** = some implementation exists but the complete workflow is not proven.

- **MISSING** = implementation is required.

- **CONFIGURATION REQUIRED** = code exists but company/state/vendor data must be supplied.

- **LIVE TEST REQUIRED** = requires running database, browser, external service, or production-like environment.

- A success toast alone is never considered proof that a business function completed.


## Master Status Summary

- Frontend pages statically audited: **112**.

- Backend JavaScript syntax: **passed in the static audit**.

- Relative local-page link audit: **passed in the static audit**.

- Branding/theme coverage: **implemented and statically checked**.

- Generic/fallback stub definitions remain and require replacement for production business actions.

- Full live DB + browser E2E certification remains a separate release gate.


## Section Index

1. Project Overview & Architecture
2. Page & Navigation Inventory
3. Authentication & Account Security
4. Authorization, Roles & Permissions
5. Employee Lifecycle
6. Attendance Management
7. Face Camera & Biometric / Passkey
8. Leave Management
9. Calendar & Holiday Management
10. Payroll & Statutory Compliance
11. Employee Policies & Central Rules
12. POSH & Workplace Safety
13. Cab / Transport Booking
14. Expense & Reimbursement
15. Documents & File Management
16. Reports & Exports
17. Notifications & Communication
18. AI Features & AI Security
19. Privacy, Cookies & Consent
20. Security Engineering
21. Audit Logs & Monitoring
22. Database & Data Integrity
23. UI Design System
24. Company Colors & Theming
25. Light / Dark / System Mode
26. Hover / Focus / Active / Disabled States
27. Responsive & Mobile UI
28. Accessibility
29. Search, Filters, Tables & Pagination
30. API & Backend Integration
31. Downloads & File Formats
32. Testing & Quality Assurance
33. CI/CD & Release Management
34. Performance & Scalability
35. Backup & Disaster Recovery
36. Third-Party & Vendor Integrations
37. Localization & Regional Configuration
38. Data Retention, Archival & Deletion
39. Incident Response & Business Continuity
40. Configuration & Administration
41. Function-by-Function Verification
42. Download-by-Format Verification
43. Known Gaps & Required Additions
44. Final Production Acceptance Checklist


## 1. Project Overview & Architecture

**Scope:** Project identity, architecture, directories, frontend/backend separation, configuration and deployment.


### 1.1. Status

1.1.1. AVAILABLE — verify the relevant implementation in source.

1.1.2. STATIC VERIFIED — source/static checks pass.

1.1.3. LIVE VERIFIED — requires integration/browser/database testing.

1.1.4. PARTIAL / MISSING items identified and recorded.


### 1.2. Required Checks

1.2.1. Project structure and entry points
1.2.2. Environment/configuration
1.2.3. Frontend/backend separation
1.2.4. Database and deployment configuration

### 1.3. Evidence / Notes
1.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 2. Page & Navigation Inventory

**Scope:** All frontend pages, navigation, routes, breadcrumbs, redirects, broken links and page-level availability.


### 2.1. Status

2.1.1. AVAILABLE — verify the relevant implementation in source.

2.1.2. STATIC VERIFIED — source/static checks pass.

2.1.3. LIVE VERIFIED — requires integration/browser/database testing.

2.1.4. PARTIAL / MISSING items identified and recorded.


### 2.2. Required Checks

2.2.1. Every page opens
2.2.2. Navigation and active states
2.2.3. Breadcrumbs/redirects
2.2.4. No broken local links
2.2.5. Mobile navigation

### 2.3. Evidence / Notes
2.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 3. Authentication & Account Security

**Scope:** Login, logout, sessions, passwords, MFA, recovery, account lockout, authentication hardening.


### 3.1. Status

3.1.1. AVAILABLE — verify the relevant implementation in source.

3.1.2. STATIC VERIFIED — source/static checks pass.

3.1.3. LIVE VERIFIED — requires integration/browser/database testing.

3.1.4. PARTIAL / MISSING items identified and recorded.


### 3.2. Required Checks

3.2.1. Login/logout
3.2.2. Session expiry
3.2.3. Password policy
3.2.4. MFA/recovery
3.2.5. Rate limiting
3.2.6. Secure cookie/session flags

### 3.3. Evidence / Notes
3.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 4. Authorization, Roles & Permissions

**Scope:** RBAC, tenant isolation, object-level authorization, approval permissions and privilege escalation prevention.


### 4.1. Status

4.1.1. AVAILABLE — verify the relevant implementation in source.

4.1.2. STATIC VERIFIED — source/static checks pass.

4.1.3. LIVE VERIFIED — requires integration/browser/database testing.

4.1.4. PARTIAL / MISSING items identified and recorded.


### 4.2. Required Checks

4.2.1. RBAC
4.2.2. Tenant isolation
4.2.3. Object-level authorization
4.2.4. Admin separation
4.2.5. Direct URL/API bypass tests

### 4.3. Evidence / Notes
4.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 5. Employee Lifecycle

**Scope:** Joining, onboarding, employee records, transfers, promotions, documents, separation, offboarding and access revocation.


### 5.1. Status

5.1.1. AVAILABLE — verify the relevant implementation in source.

5.1.2. STATIC VERIFIED — source/static checks pass.

5.1.3. LIVE VERIFIED — requires integration/browser/database testing.

5.1.4. PARTIAL / MISSING items identified and recorded.


### 5.2. Required Checks

5.2.1. Onboarding
5.2.2. Employee profile
5.2.3. Documents
5.2.4. Transfers/promotions
5.2.5. Offboarding
5.2.6. Access revocation

### 5.3. Evidence / Notes
5.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 6. Attendance Management

**Scope:** Check-in/out, corrections, shifts, overtime, location, audit trail, duplicate prevention and payroll linkage.


### 6.1. Status

6.1.1. AVAILABLE — verify the relevant implementation in source.

6.1.2. STATIC VERIFIED — source/static checks pass.

6.1.3. LIVE VERIFIED — requires integration/browser/database testing.

6.1.4. PARTIAL / MISSING items identified and recorded.


### 6.2. Required Checks

6.2.1. Check-in/out
6.2.2. Shift rules
6.2.3. Corrections
6.2.4. Duplicate prevention
6.2.5. Location/camera evidence
6.2.6. Payroll integration

### 6.3. Evidence / Notes
6.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 7. Face Camera & Biometric / Passkey

**Scope:** Camera consent, presence verification, WebAuthn/passkeys, biometric integration boundaries and privacy controls.


### 7.1. Status

7.1.1. AVAILABLE — verify the relevant implementation in source.

7.1.2. STATIC VERIFIED — source/static checks pass.

7.1.3. LIVE VERIFIED — requires integration/browser/database testing.

7.1.4. PARTIAL / MISSING items identified and recorded.


### 7.2. Required Checks

7.2.1. Camera permission/consent
7.2.2. Presence verification
7.2.3. WebAuthn/passkey
7.2.4. Biometric vendor integration if required
7.2.5. No unsafe biometric-template handling

### 7.3. Evidence / Notes
7.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 8. Leave Management

**Scope:** Leave types, balances, applications, approvals, cancellation, carry-forward, encashment and policy configuration.


### 8.1. Status

8.1.1. AVAILABLE — verify the relevant implementation in source.

8.1.2. STATIC VERIFIED — source/static checks pass.

8.1.3. LIVE VERIFIED — requires integration/browser/database testing.

8.1.4. PARTIAL / MISSING items identified and recorded.


### 8.2. Required Checks

8.2.1. Leave types
8.2.2. Balances
8.2.3. Apply/approve/reject
8.2.4. Cancellation
8.2.5. Carry-forward
8.2.6. Encashment
8.2.7. Payroll linkage

### 8.3. Evidence / Notes
8.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 9. Calendar & Holiday Management

**Scope:** Year selection, Central Government, state, festival, optional/restricted and company/private holidays.


### 9.1. Status

9.1.1. AVAILABLE — verify the relevant implementation in source.

9.1.2. STATIC VERIFIED — source/static checks pass.

9.1.3. LIVE VERIFIED — requires integration/browser/database testing.

9.1.4. PARTIAL / MISSING items identified and recorded.


### 9.2. Required Checks

9.2.1. Automatic year selection
9.2.2. Central Government
9.2.3. State
9.2.4. Festival
9.2.5. Restricted/optional
9.2.6. Company/private
9.2.7. Official-source/version tracking

### 9.3. Evidence / Notes
9.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 10. Payroll & Statutory Compliance

**Scope:** Payroll processing, payslips, tax/statutory configuration, approvals, locking and reporting.


### 10.1. Status

10.1.1. AVAILABLE — verify the relevant implementation in source.

10.1.2. STATIC VERIFIED — source/static checks pass.

10.1.3. LIVE VERIFIED — requires integration/browser/database testing.

10.1.4. PARTIAL / MISSING items identified and recorded.


### 10.2. Required Checks

10.2.1. Payroll calculation
10.2.2. Approvals/locking
10.2.3. Payslips
10.2.4. Tax/statutory rules
10.2.5. Attendance/leave linkage
10.2.6. Export

### 10.3. Evidence / Notes
10.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 11. Employee Policies & Central Rules

**Scope:** Company policies, employee rules, Labour Code baseline, policy versions, acknowledgement and jurisdiction configuration.


### 11.1. Status

11.1.1. AVAILABLE — verify the relevant implementation in source.

11.1.2. STATIC VERIFIED — source/static checks pass.

11.1.3. LIVE VERIFIED — requires integration/browser/database testing.

11.1.4. PARTIAL / MISSING items identified and recorded.


### 11.2. Required Checks

11.2.1. Policy versions
11.2.2. Employee acknowledgement
11.2.3. Central rules baseline
11.2.4. State/company overrides
11.2.5. Effective dates

### 11.3. Evidence / Notes
11.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 12. POSH & Workplace Safety

**Scope:** POSH complaint workflow, Internal Committee, confidentiality, restricted access, inquiry records and safety policies.


### 12.1. Status

12.1.1. AVAILABLE — verify the relevant implementation in source.

12.1.2. STATIC VERIFIED — source/static checks pass.

12.1.3. LIVE VERIFIED — requires integration/browser/database testing.

12.1.4. PARTIAL / MISSING items identified and recorded.


### 12.2. Required Checks

12.2.1. Complaint submission
12.2.2. Internal Committee
12.2.3. Confidentiality
12.2.4. Restricted case access
12.2.5. Inquiry workflow
12.2.6. Safety escalation

### 12.3. Evidence / Notes
12.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 13. Cab / Transport Booking

**Scope:** Company/private cab booking, male/female passenger handling, night safety, driver assignment, tracking and cancellation.


### 13.1. Status

13.1.1. AVAILABLE — verify the relevant implementation in source.

13.1.2. STATIC VERIFIED — source/static checks pass.

13.1.3. LIVE VERIFIED — requires integration/browser/database testing.

13.1.4. PARTIAL / MISSING items identified and recorded.


### 13.2. Required Checks

13.2.1. Booking
13.2.2. Male/female passenger handling
13.2.3. Night safety
13.2.4. Driver assignment
13.2.5. Tracking
13.2.6. Cancellation
13.2.7. Vendor/company distinction

### 13.3. Evidence / Notes
13.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 14. Expense & Reimbursement

**Scope:** Claims, receipts, approvals, reimbursement, limits, audit and payroll/accounting integration.


### 14.1. Status

14.1.1. AVAILABLE — verify the relevant implementation in source.

14.1.2. STATIC VERIFIED — source/static checks pass.

14.1.3. LIVE VERIFIED — requires integration/browser/database testing.

14.1.4. PARTIAL / MISSING items identified and recorded.


### 14.2. Required Checks

14.2.1. Claim
14.2.2. Receipt upload
14.2.3. Approval
14.2.4. Limits
14.2.5. Reimbursement
14.2.6. Audit

### 14.3. Evidence / Notes
14.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 15. Documents & File Management

**Scope:** Uploads, downloads, document ownership, file validation, storage, retention and secure sharing.


### 15.1. Status

15.1.1. AVAILABLE — verify the relevant implementation in source.

15.1.2. STATIC VERIFIED — source/static checks pass.

15.1.3. LIVE VERIFIED — requires integration/browser/database testing.

15.1.4. PARTIAL / MISSING items identified and recorded.


### 15.2. Required Checks

15.2.1. Upload validation
15.2.2. Malware scanning policy
15.2.3. Ownership
15.2.4. Secure download
15.2.5. Retention
15.2.6. Access logging

### 15.3. Evidence / Notes
15.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 16. Reports & Exports

**Scope:** Reports, filters, CSV/JSON/PDF/XLSX/ZIP support, export authorization and audit logging.


### 16.1. Status

16.1.1. AVAILABLE — verify the relevant implementation in source.

16.1.2. STATIC VERIFIED — source/static checks pass.

16.1.3. LIVE VERIFIED — requires integration/browser/database testing.

16.1.4. PARTIAL / MISSING items identified and recorded.


### 16.2. Required Checks

16.2.1. Report generation
16.2.2. Filters
16.2.3. CSV/JSON/PDF
16.2.4. XLSX/ZIP if required
16.2.5. Authorization
16.2.6. Audit logging

### 16.3. Evidence / Notes
16.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 17. Notifications & Communication

**Scope:** Email, SMS, push, in-app notifications, templates, delivery status, retry and failure handling.


### 17.1. Status

17.1.1. AVAILABLE — verify the relevant implementation in source.

17.1.2. STATIC VERIFIED — source/static checks pass.

17.1.3. LIVE VERIFIED — requires integration/browser/database testing.

17.1.4. PARTIAL / MISSING items identified and recorded.


### 17.2. Required Checks

17.2.1. Email/SMS/push
17.2.2. Templates
17.2.3. Retries
17.2.4. Delivery status
17.2.5. Failure handling
17.2.6. Preferences

### 17.3. Evidence / Notes
17.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 18. AI Features & AI Security

**Scope:** AI use cases, consent, minimisation, provider security, human review and employment-decision safeguards.


### 18.1. Status

18.1.1. AVAILABLE — verify the relevant implementation in source.

18.1.2. STATIC VERIFIED — source/static checks pass.

18.1.3. LIVE VERIFIED — requires integration/browser/database testing.

18.1.4. PARTIAL / MISSING items identified and recorded.


### 18.2. Required Checks

18.2.1. Allowed use cases
18.2.2. Consent
18.2.3. PII minimisation
18.2.4. Provider controls
18.2.5. Human review
18.2.6. No solely automated employment decisions

### 18.3. Evidence / Notes
18.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 19. Privacy, Cookies & Consent

**Scope:** Privacy policy, cookie policy, consent capture, withdrawal, data rights, retention and deletion.


### 19.1. Status

19.1.1. AVAILABLE — verify the relevant implementation in source.

19.1.2. STATIC VERIFIED — source/static checks pass.

19.1.3. LIVE VERIFIED — requires integration/browser/database testing.

19.1.4. PARTIAL / MISSING items identified and recorded.


### 19.2. Required Checks

19.2.1. Cookie categories
19.2.2. Consent
19.2.3. Withdrawal
19.2.4. Privacy notice
19.2.5. Data rights
19.2.6. Retention/deletion

### 19.3. Evidence / Notes
19.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 20. Security Engineering

**Scope:** CSRF, XSS, SQL injection, rate limiting, headers, secrets, encryption, secure sessions and threat controls.


### 20.1. Status

20.1.1. AVAILABLE — verify the relevant implementation in source.

20.1.2. STATIC VERIFIED — source/static checks pass.

20.1.3. LIVE VERIFIED — requires integration/browser/database testing.

20.1.4. PARTIAL / MISSING items identified and recorded.


### 20.2. Required Checks

20.2.1. CSRF
20.2.2. XSS
20.2.3. SQL injection
20.2.4. Rate limiting
20.2.5. Security headers
20.2.6. Secret management
20.2.7. Encryption
20.2.8. Secure uploads

### 20.3. Evidence / Notes
20.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 21. Audit Logs & Monitoring

**Scope:** Immutable/auditable events, security logging, monitoring, alerts, incident response and observability.


### 21.1. Status

21.1.1. AVAILABLE — verify the relevant implementation in source.

21.1.2. STATIC VERIFIED — source/static checks pass.

21.1.3. LIVE VERIFIED — requires integration/browser/database testing.

21.1.4. PARTIAL / MISSING items identified and recorded.


### 21.2. Required Checks

21.2.1. Audit events
21.2.2. Tamper resistance
21.2.3. Monitoring
21.2.4. Alerts
21.2.5. Incident escalation
21.2.6. Sensitive-data minimisation

### 21.3. Evidence / Notes
21.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 22. Database & Data Integrity

**Scope:** Schema, migrations, constraints, transactions, concurrency, indexes, backups and recovery.


### 22.1. Status

22.1.1. AVAILABLE — verify the relevant implementation in source.

22.1.2. STATIC VERIFIED — source/static checks pass.

22.1.3. LIVE VERIFIED — requires integration/browser/database testing.

22.1.4. PARTIAL / MISSING items identified and recorded.


### 22.2. Required Checks

22.2.1. Migrations
22.2.2. Constraints
22.2.3. Transactions
22.2.4. Concurrency
22.2.5. Indexes
22.2.6. Backups
22.2.7. Restore tests

### 22.3. Evidence / Notes
22.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 23. UI Design System

**Scope:** Branding, logo, typography, spacing, components, buttons, forms, cards, tables and consistency.


### 23.1. Status

23.1.1. AVAILABLE — verify the relevant implementation in source.

23.1.2. STATIC VERIFIED — source/static checks pass.

23.1.3. LIVE VERIFIED — requires integration/browser/database testing.

23.1.4. PARTIAL / MISSING items identified and recorded.


### 23.2. Required Checks

23.2.1. Logo
23.2.2. Typography
23.2.3. Spacing
23.2.4. Buttons
23.2.5. Forms
23.2.6. Cards
23.2.7. Tables
23.2.8. Component consistency

### 23.3. Evidence / Notes
23.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 24. Company Colors & Theming

**Scope:** Tenant/company colors, design tokens, brand overrides, contrast and safe fallback colors.


### 24.1. Status

24.1.1. AVAILABLE — verify the relevant implementation in source.

24.1.2. STATIC VERIFIED — source/static checks pass.

24.1.3. LIVE VERIFIED — requires integration/browser/database testing.

24.1.4. PARTIAL / MISSING items identified and recorded.


### 24.2. Required Checks

24.2.1. Brand tokens
24.2.2. Company overrides
24.2.3. Contrast
24.2.4. Fallback palette
24.2.5. Tenant isolation

### 24.3. Evidence / Notes
24.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 25. Light / Dark / System Mode

**Scope:** Day/light mode, dark/night mode, system preference, persistence and component coverage.


### 25.1. Status

25.1.1. AVAILABLE — verify the relevant implementation in source.

25.1.2. STATIC VERIFIED — source/static checks pass.

25.1.3. LIVE VERIFIED — requires integration/browser/database testing.

25.1.4. PARTIAL / MISSING items identified and recorded.


### 25.2. Required Checks

25.2.1. Light/day
25.2.2. Dark/night
25.2.3. System preference
25.2.4. Persistence
25.2.5. All components

### 25.3. Evidence / Notes
25.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 26. Hover / Focus / Active / Disabled States

**Scope:** Interaction states, keyboard focus, loading, validation, tooltips and accessible feedback.


### 26.1. Status

26.1.1. AVAILABLE — verify the relevant implementation in source.

26.1.2. STATIC VERIFIED — source/static checks pass.

26.1.3. LIVE VERIFIED — requires integration/browser/database testing.

26.1.4. PARTIAL / MISSING items identified and recorded.


### 26.2. Required Checks

26.2.1. Hover
26.2.2. Focus-visible
26.2.3. Active
26.2.4. Disabled
26.2.5. Loading
26.2.6. Validation
26.2.7. Tooltips

### 26.3. Evidence / Notes
26.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 27. Responsive & Mobile UI

**Scope:** Desktop/tablet/mobile breakpoints, touch targets, navigation, tables and forms.


### 27.1. Status

27.1.1. AVAILABLE — verify the relevant implementation in source.

27.1.2. STATIC VERIFIED — source/static checks pass.

27.1.3. LIVE VERIFIED — requires integration/browser/database testing.

27.1.4. PARTIAL / MISSING items identified and recorded.


### 27.2. Required Checks

27.2.1. Desktop
27.2.2. Tablet
27.2.3. Mobile
27.2.4. Touch targets
27.2.5. Responsive tables/forms
27.2.6. Navigation

### 27.3. Evidence / Notes
27.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 28. Accessibility

**Scope:** WCAG-oriented semantics, keyboard navigation, screen-reader labels, contrast, reduced motion and error messages.


### 28.1. Status

28.1.1. AVAILABLE — verify the relevant implementation in source.

28.1.2. STATIC VERIFIED — source/static checks pass.

28.1.3. LIVE VERIFIED — requires integration/browser/database testing.

28.1.4. PARTIAL / MISSING items identified and recorded.


### 28.2. Required Checks

28.2.1. Keyboard
28.2.2. Screen readers
28.2.3. Contrast
28.2.4. Labels
28.2.5. Errors
28.2.6. Reduced motion

### 28.3. Evidence / Notes
28.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 29. Search, Filters, Tables & Pagination

**Scope:** Search quality, filtering, sorting, pagination, empty states, loading and performance.


### 29.1. Status

29.1.1. AVAILABLE — verify the relevant implementation in source.

29.1.2. STATIC VERIFIED — source/static checks pass.

29.1.3. LIVE VERIFIED — requires integration/browser/database testing.

29.1.4. PARTIAL / MISSING items identified and recorded.


### 29.2. Required Checks

29.2.1. Search
29.2.2. Filters
29.2.3. Sort
29.2.4. Pagination
29.2.5. Empty states
29.2.6. Loading
29.2.7. Performance

### 29.3. Evidence / Notes
29.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 30. API & Backend Integration

**Scope:** API contracts, validation, error handling, status codes, authentication and endpoint consistency.


### 30.1. Status

30.1.1. AVAILABLE — verify the relevant implementation in source.

30.1.2. STATIC VERIFIED — source/static checks pass.

30.1.3. LIVE VERIFIED — requires integration/browser/database testing.

30.1.4. PARTIAL / MISSING items identified and recorded.


### 30.2. Required Checks

30.2.1. API contracts
30.2.2. Authentication
30.2.3. Authorization
30.2.4. Validation
30.2.5. Error status codes
30.2.6. Consistent responses

### 30.3. Evidence / Notes
30.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 31. Downloads & File Formats

**Scope:** Real download wiring, MIME types, filenames, file validity and supported formats.


### 31.1. Status

31.1.1. AVAILABLE — verify the relevant implementation in source.

31.1.2. STATIC VERIFIED — source/static checks pass.

31.1.3. LIVE VERIFIED — requires integration/browser/database testing.

31.1.4. PARTIAL / MISSING items identified and recorded.


### 31.2. Required Checks

31.2.1. Real endpoint
31.2.2. MIME type
31.2.3. Filename
31.2.4. Authorization
31.2.5. File validity
31.2.6. Error handling

### 31.3. Evidence / Notes
31.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 32. Testing & Quality Assurance

**Scope:** Unit, integration, browser E2E, security, accessibility, regression and test data.


### 32.1. Status

32.1.1. AVAILABLE — verify the relevant implementation in source.

32.1.2. STATIC VERIFIED — source/static checks pass.

32.1.3. LIVE VERIFIED — requires integration/browser/database testing.

32.1.4. PARTIAL / MISSING items identified and recorded.


### 32.2. Required Checks

32.2.1. Unit tests
32.2.2. Integration
32.2.3. E2E
32.2.4. Security
32.2.5. Accessibility
32.2.6. Regression

### 32.3. Evidence / Notes
32.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 33. CI/CD & Release Management

**Scope:** Build gates, dependency scanning, secrets checks, environments, deployment and rollback.


### 33.1. Status

33.1.1. AVAILABLE — verify the relevant implementation in source.

33.1.2. STATIC VERIFIED — source/static checks pass.

33.1.3. LIVE VERIFIED — requires integration/browser/database testing.

33.1.4. PARTIAL / MISSING items identified and recorded.


### 33.2. Required Checks

33.2.1. CI build
33.2.2. Dependency scanning
33.2.3. Secret scanning
33.2.4. Environment separation
33.2.5. Rollback

### 33.3. Evidence / Notes
33.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 34. Performance & Scalability

**Scope:** Caching, pagination, database performance, large files, concurrency and capacity.


### 34.1. Status

34.1.1. AVAILABLE — verify the relevant implementation in source.

34.1.2. STATIC VERIFIED — source/static checks pass.

34.1.3. LIVE VERIFIED — requires integration/browser/database testing.

34.1.4. PARTIAL / MISSING items identified and recorded.


### 34.2. Required Checks

34.2.1. Database performance
34.2.2. Pagination
34.2.3. Caching
34.2.4. Large files
34.2.5. Concurrency
34.2.6. Load testing

### 34.3. Evidence / Notes
34.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 35. Backup & Disaster Recovery

**Scope:** Backup schedules, restore testing, RPO/RTO, disaster procedures and recovery ownership.


### 35.1. Status

35.1.1. AVAILABLE — verify the relevant implementation in source.

35.1.2. STATIC VERIFIED — source/static checks pass.

35.1.3. LIVE VERIFIED — requires integration/browser/database testing.

35.1.4. PARTIAL / MISSING items identified and recorded.


### 35.2. Required Checks

35.2.1. Backup schedule
35.2.2. Restore test
35.2.3. RPO/RTO
35.2.4. Disaster procedure
35.2.5. Ownership

### 35.3. Evidence / Notes
35.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 36. Third-Party & Vendor Integrations

**Scope:** Payment, messaging, biometric, maps, storage, AI providers and vendor security.


### 36.1. Status

36.1.1. AVAILABLE — verify the relevant implementation in source.

36.1.2. STATIC VERIFIED — source/static checks pass.

36.1.3. LIVE VERIFIED — requires integration/browser/database testing.

36.1.4. PARTIAL / MISSING items identified and recorded.


### 36.2. Required Checks

36.2.1. Vendor auth
36.2.2. API failure handling
36.2.3. Data sharing
36.2.4. Contract/security review
36.2.5. Credential rotation

### 36.3. Evidence / Notes
36.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 37. Localization & Regional Configuration

**Scope:** Timezone, locale, language, currency, fiscal year, state rules and regional holidays.


### 37.1. Status

37.1.1. AVAILABLE — verify the relevant implementation in source.

37.1.2. STATIC VERIFIED — source/static checks pass.

37.1.3. LIVE VERIFIED — requires integration/browser/database testing.

37.1.4. PARTIAL / MISSING items identified and recorded.


### 37.2. Required Checks

37.2.1. Timezone
37.2.2. Locale
37.2.3. Language
37.2.4. Currency
37.2.5. Fiscal year
37.2.6. State/company rules

### 37.3. Evidence / Notes
37.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 38. Data Retention, Archival & Deletion

**Scope:** Retention schedules, legal holds, archival, deletion, anonymisation and employee data requests.


### 38.1. Status

38.1.1. AVAILABLE — verify the relevant implementation in source.

38.1.2. STATIC VERIFIED — source/static checks pass.

38.1.3. LIVE VERIFIED — requires integration/browser/database testing.

38.1.4. PARTIAL / MISSING items identified and recorded.


### 38.2. Required Checks

38.2.1. Retention
38.2.2. Archive
38.2.3. Legal hold
38.2.4. Deletion
38.2.5. Anonymisation
38.2.6. Employee requests

### 38.3. Evidence / Notes
38.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 39. Incident Response & Business Continuity

**Scope:** Security incidents, escalation, evidence preservation, communication and continuity plans.


### 39.1. Status

39.1.1. AVAILABLE — verify the relevant implementation in source.

39.1.2. STATIC VERIFIED — source/static checks pass.

39.1.3. LIVE VERIFIED — requires integration/browser/database testing.

39.1.4. PARTIAL / MISSING items identified and recorded.


### 39.2. Required Checks

39.2.1. Incident response
39.2.2. Escalation
39.2.3. Evidence
39.2.4. Communication
39.2.5. Business continuity

### 39.3. Evidence / Notes
39.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 40. Configuration & Administration

**Scope:** Company settings, feature flags, policy configuration, roles, holiday setup and system administration.


### 40.1. Status

40.1.1. AVAILABLE — verify the relevant implementation in source.

40.1.2. STATIC VERIFIED — source/static checks pass.

40.1.3. LIVE VERIFIED — requires integration/browser/database testing.

40.1.4. PARTIAL / MISSING items identified and recorded.


### 40.2. Required Checks

40.2.1. Company settings
40.2.2. Feature flags
40.2.3. Roles
40.2.4. Policies
40.2.5. Holiday configuration
40.2.6. Admin audit

### 40.3. Evidence / Notes
40.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 41. Function-by-Function Verification

**Scope:** Button/function/API wiring, real success criteria, stub/fallback identification and live verification.


### 41.1. Status

41.1.1. AVAILABLE — verify the relevant implementation in source.

41.1.2. STATIC VERIFIED — source/static checks pass.

41.1.3. LIVE VERIFIED — requires integration/browser/database testing.

41.1.4. PARTIAL / MISSING items identified and recorded.


### 41.2. Required Checks

41.2.1. Button → function
41.2.2. Function → API
41.2.3. API → authorization
41.2.4. Database transaction
41.2.5. Success/error state
41.2.6. Audit event

### 41.3. Evidence / Notes
41.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 42. Download-by-Format Verification

**Scope:** CSV, JSON, PDF, XLSX, ZIP and document download status and test requirements.


### 42.1. Status

42.1.1. AVAILABLE — verify the relevant implementation in source.

42.1.2. STATIC VERIFIED — source/static checks pass.

42.1.3. LIVE VERIFIED — requires integration/browser/database testing.

42.1.4. PARTIAL / MISSING items identified and recorded.


### 42.2. Required Checks

42.2.1. CSV
42.2.2. JSON
42.2.3. PDF
42.2.4. XLSX
42.2.5. ZIP
42.2.6. Employee documents
42.2.7. File-open validation

### 42.3. Evidence / Notes
42.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 43. Known Gaps & Required Additions

**Scope:** All remaining incomplete, unverified or configuration-dependent requirements.


### 43.1. Status

43.1.1. AVAILABLE — verify the relevant implementation in source.

43.1.2. STATIC VERIFIED — source/static checks pass.

43.1.3. LIVE VERIFIED — requires integration/browser/database testing.

43.1.4. PARTIAL / MISSING items identified and recorded.


### 43.2. Required Checks

43.2.1. List every remaining gap
43.2.2. Assign status
43.2.3. Assign owner
43.2.4. Define acceptance test
43.2.5. Do not mark incomplete work as done

### 43.3. Evidence / Notes
43.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## 44. Final Production Acceptance Checklist

**Scope:** Release gates and final status definitions.


### 44.1. Status

44.1.1. AVAILABLE — verify the relevant implementation in source.

44.1.2. STATIC VERIFIED — source/static checks pass.

44.1.3. LIVE VERIFIED — requires integration/browser/database testing.

44.1.4. PARTIAL / MISSING items identified and recorded.


### 44.2. Required Checks

44.2.1. Static checks
44.2.2. Integration tests
44.2.3. E2E
44.2.4. Security acceptance
44.2.5. Accessibility acceptance
44.2.6. Backup/restore acceptance
44.2.7. Production sign-off

### 44.3. Evidence / Notes
44.3.1. Record exact file, route, endpoint, database table, test result, or configuration source here.


## Appendix A — Existing Detailed Audit Material

## FUNCTION & DOWNLOAD VERIFICATION — IMPORTANT STATUS

### 44.4. Overall conclusion

44.4.1. The project has a large number of pages, routes, controllers, forms, exports, and UI actions.
44.4.2. The complete application **must not yet be marked as “all functions fully working.”**
44.4.3. Static validation is successful:
  - 112 HTML pages checked.
  - 0 HTML parse failures.
  - Backend JavaScript syntax check passed.
  - The project's `node scripts/static_smoke_test.js` passed.
44.4.4. However, static validation does not prove that every business button performs a real backend operation.

### 44.5. Function implementation status

44.5.1. 70 pages still contain fallback/stub function definitions.
44.5.2. Approximately 30,781 textual `stub(...)` calls are present in the current audited source tree; this count includes repeated fallback registrations and is **not** equivalent to 30,781 separate missing features.
44.5.3. A fallback/stub must never display a false success message such as “Downloaded”, “Saved”, “Approved”, “Generated”, or “Submitted” unless the requested operation actually completed.
44.5.4. Critical HR/business operations must be connected to real APIs and database transactions:
  - Employee create/update/delete
  - Leave apply/approve/reject/cancel
  - Attendance check-in/check-out/correction
  - Payroll calculation/approval
  - Payslip generation/download
  - Holiday creation/update
  - Cab booking/assignment/tracking/cancellation
  - POSH complaint/access-controlled case workflow
  - Expense submission/approval/reimbursement
  - Employee documents
  - Policy acknowledgement
  - Data export/erasure
  - User/role/permission administration
  - Audit-log viewing/export
  - Security actions
  - Notifications
44.5.5. Every business button should have one of these states:
  - `Implemented`
  - `API-connected`
  - `Loading`
  - `Success`
  - `Validation error`
  - `Authorization error`
  - `Server error`
  - `Not configured`
44.5.6. A button must not use a generic “done” toast as proof of completion.

### 44.6. Download/export verification

#### Real backend download evidence found

The backend contains real attachment/download response paths for at least:

44.6.1. Report JSON export
44.6.2. Report CSV export
44.6.3. Attendance CSV export
44.6.4. Payroll CSV export
44.6.5. Other response attachments using `Content-Disposition`

These should be tested with an authenticated request and a real database dataset before production.

#### Frontend download evidence

The project contains reusable CSV-generation helpers using browser `Blob` and `<a download>`. These can produce real client-side CSV files when supplied with actual data.

#### Download functions that still require wiring

The source also contains fallback functions such as:

44.6.6. `downloadComplianceReport`
44.6.7. `downloadMyData`
44.6.8. `downloadDiversityReport`
44.6.9. `downloadForm16`
44.6.10. `downloadIDCard`
44.6.11. `downloadLetter`
44.6.12. `downloadPolicy`
44.6.13. `downloadAnnualReport`
44.6.14. `downloadPayslip`
44.6.15. `downloadCertificate`
44.6.16. `downloadMyData`
44.6.17. `downloadPDF`
44.6.18. `downloadAllDocsZip`
44.6.19. `downloadCurrentSlip`

Where these are currently implemented only through a stub/fallback, they are **not verified as real downloads**.

Required behavior:

44.6.20. Request the correct backend endpoint.
44.6.21. Authenticate and authorize the request.
44.6.22. Validate employee/company/tenant ownership.
44.6.23. Generate or retrieve the requested file.
44.6.24. Return the correct MIME type.
44.6.25. Return a safe filename.
44.6.26. Set `Content-Disposition: attachment` where appropriate.
44.6.27. Handle large files safely.
44.6.28. Log the export/download event without storing unnecessary sensitive content.
44.6.29. Show success only after the browser receives the file successfully.
44.6.30. Show a useful error if generation or download fails.
44.6.31. Never expose another employee's document by changing an ID in the URL.
44.6.32. Test PDF, CSV, XLSX, ZIP and document downloads separately.

### 44.7. Function testing matrix required

For every page and important function, verify:

| Area | Must verify |
|---|---|
| Navigation | Page opens, active menu works, back/forward works |
| Buttons | Correct API/function, loading state, error state, success state |
| Forms | Required fields, validation, duplicate handling, server validation |
| Dropdowns | Data loads, empty state, search, keyboard selection |
| Tables | Pagination, sorting, filtering, export, responsive layout |
| Search | Exact/partial search, no-result state, authorization |
| Create | Record really inserted |
| Edit | Record really updated |
| Delete | Authorization, confirmation, soft/hard-delete policy |
| Approvals | Correct role, transaction, audit log |
| Upload | File type/size/content validation and malware scanning policy |
| Download | Real file response and authorization |
| Print | Correct printable content and sensitive-data handling |
| Notifications | Real delivery/status, not only toast |
| Calendar | Correct year, jurisdiction, holiday source and company overrides |
| Attendance | Real attendance transaction, duplicate prevention and audit trail |
| Payroll | Correct calculation, locking, approval and payslip |
| Cab | Real booking, driver assignment, safety controls and cancellation |
| POSH | Confidential role-restricted access and audit trail |
| AI | Consent, minimisation, human review and secure provider handling |
| Logout | Session/token invalidation |
| Permissions | Same URL cannot bypass role restrictions |

### 44.8. Final function-release rule

The application should only be described as **fully functional** after:

44.8.1. Static smoke test passes.
44.8.2. Integration tests pass against a clean MySQL test database.
44.8.3. Authenticated API tests pass.
44.8.4. Browser E2E tests pass for critical workflows.
44.8.5. Real download files are opened/validated after generation.
44.8.6. Stub/fallback handlers for production business operations are removed or replaced by real implementations.
44.8.7. Unauthorized direct API/page access tests pass.
44.8.8. Error, timeout and empty-data states are tested.


## FINAL FUNCTION & DOWNLOAD FORMAT VERIFICATION

### 44.9. Verified from the current Workforce Intelligence Platform source package

**Project inventory**
44.9.1. Frontend HTML pages: **112**
44.9.2. Backend route modules: **41**
44.9.3. Backend controller modules: **38**
44.9.4. Backend JavaScript files: **96**
44.9.5. Frontend pages containing generic/fallback stub definitions: **101**
44.9.6. Therefore, **not every UI function can currently be certified as a real business function**.

### 44.10. Function status

**Static/code-level verified**
44.10.1. HTML pages are present and parseable.
44.10.2. Backend JavaScript files pass syntax validation.
44.10.3. Route/controller structure is present.
44.10.4. Real API-backed functions exist across many modules.
44.10.5. Authentication headers/API helpers exist on real API-driven pages.
44.10.6. Attendance contains real camera capture and API request logic.
44.10.7. Assets, attendance, reports, payroll and other modules have real backend routes/controllers.

**Not fully verified**
44.10.8. Every button/action on all 112 pages has not been proven through live browser execution.
44.10.9. 101 pages contain generic fallback/stub definitions. These fallbacks can make an undefined function appear to work by showing a toast, so they must not be treated as completed business logic.
44.10.10. Full database integration and browser E2E execution require a running MySQL/test environment and installed test dependencies.

### 44.11. Download/export format verification

#### Backend download formats actually present

| Format | Evidence | Current status |
|---|---|---|
| CSV | Attendance export | Backend implementation present |
| CSV | Payroll export | Backend implementation present |
| CSV | Report export | Backend implementation present |
| JSON | Report export | Backend implementation present |
| PDF | Payslip/report-style response with `application/pdf` and attachment disposition | Backend implementation present |
| ZIP | No verified production `res.download/res.attachment` ZIP implementation found in the current static scan | Requires implementation/testing |
| XLSX | No verified backend XLSX response found in the current static scan | Requires implementation/testing |

#### Browser/client-side download

The frontend contains reusable `Blob` + `<a download>` CSV generation functions.

This means **CSV generation is technically implemented on the client for pages using these helpers**, but it is not proof that the underlying business data is correct or that every page's export button is connected to the correct API.

### 44.12. Required download behavior

Every production download function must:
44.12.1. Call the correct backend/API endpoint when business data is involved.
44.12.2. Authenticate the request.
44.12.3. Authorize the employee/company/tenant/document owner.
44.12.4. Validate object ownership to prevent IDOR.
44.12.5. Generate the correct file.
44.12.6. Use the correct MIME type.
44.12.7. Use a safe filename and extension.
44.12.8. Set `Content-Disposition: attachment` when appropriate.
44.12.9. Handle empty-data and generation errors.
44.12.10. Prevent duplicate/partial downloads.
44.12.11. Log the export/download event without storing unnecessary sensitive file contents.
44.12.12. Revoke browser object URLs after client-side Blob downloads.
44.12.13. Work on Chrome, Edge, Firefox and Safari where supported.
44.12.14. Work on desktop and mobile layouts.
44.12.15. Never show “Downloaded successfully” before the actual file response succeeds.

### 44.13. Required format matrix

| Business document | Required format(s) | Verification |
|---|---|---|
| Attendance report | CSV, PDF | API + file-content test |
| Payroll report | CSV, PDF/XLSX if required | API + calculation/content test |
| Payslip | PDF | Real file open/validation test |
| Employee data export | JSON + CSV/ZIP where configured | Privacy/export test |
| HR report | CSV/PDF | API + authorization test |
| Audit log | CSV/JSON/PDF as configured | Security + authorization test |
| Holiday calendar | CSV/PDF/print | Year/jurisdiction test |
| POSH reports | Restricted PDF/CSV where legally appropriate | Confidentiality test |
| Cab/transport report | CSV/PDF | Employee/tenant authorization test |
| Employee documents | Original document format/PDF | Ownership test |
| ID card | PDF/print | Employee identity test |
| Letters/certificates | PDF | Employee/HR authorization test |
| Tax/statutory reports | Government-required format + PDF/CSV where applicable | Jurisdiction-specific test |
| Bulk document archive | ZIP | Requires verified backend ZIP implementation |

### 44.14. Current conclusion

**Do not mark “all functions working” or “all downloads working” yet.**

The correct project status is:
44.14.1. **Static structure:** verified.
44.14.2. **Many real functions:** present.
44.14.3. **Real backend CSV/JSON/PDF downloads:** present.
44.14.4. **Client-side CSV downloads:** present.
44.14.5. **Every UI function:** not verified.
44.14.6. **Every download button:** not verified.
44.14.7. **ZIP/XLSX backend download support:** not verified in the current static scan.
44.14.8. **Live database/browser E2E:** still required.
44.14.9. **Fallback/stub removal or replacement:** required for production business actions.

### 44.15. Production acceptance rule

A function is **FULLY WORKING** only when:
`UI action → validation → authenticated API → authorization → database/business operation → response → UI success state → audit log`

A download is **FULLY WORKING** only when:
`Download button → authenticated/authorized request → file generated → correct MIME type → correct filename → valid file opens → audit event → error handling`

A toast message alone is **not** evidence of a working function.


## Appendix B — Final Function & Download Rules

44.15.1. A function is fully working only when: **UI → validation → authenticated API → authorization → database/business operation → response → UI success/error state → audit log**.

44.15.2. A download is fully working only when: **button → authenticated/authorized request → file generated → correct MIME type → safe filename → valid file opens → audit event → failure handling**.

44.15.3. Do not claim full functionality until live integration/browser tests are completed.

# 45. Function-Based Upload / View / Replace / Delete Audit

1.1.1. Verify whether function-level **Upload, View/Preview, Replace/Update, and Delete/Archive** actions are actually implemented.
1.1.2. Distinguish real UI → API → backend behavior from placeholder/stub/toast-only functions.
1.1.3. Record gaps that must be added before production acceptance.

### 1.2. Evidence Source
1.2.1. Audited package: `WIP_v12_COMPLETE_FINAL (10).zip`.
1.2.2. Static source inspection covered frontend HTML/JavaScript, backend routes/controllers, application mounting, and document/policy flows.
1.2.3. This is a **static audit**. Live MySQL/browser E2E was not used to certify successful runtime operations.

## 2. Status Definitions

2.1. **AVAILABLE / STATIC VERIFIED** — real UI and/or backend implementation is present in source.
2.2. **PARTIAL** — some CRUD actions exist, but one or more required actions are missing or incomplete.
2.3. **STUB / PLACEHOLDER** — function exists mainly to show a toast or simulated success without a real business/API operation.
2.4. **MISSING** — no real implementation found.
2.5. **LIVE TEST REQUIRED** — runtime authorization, database behavior, file integrity, and browser behavior still need verification.

## 3. Master Function Matrix

| Module / Function | Upload | View / Preview | Replace / Update | Delete / Archive | Static Result |
|---|---|---|---|---|---|
| Employee Document Vault | YES | NO real document view | PARTIAL DB upsert only; no explicit replace flow | YES | **PARTIAL** |
| Company Policy Library (PDF) | YES | PARTIAL / synthetic preview, not stored PDF viewer | NO explicit replace | NO delete route in PDF library | **PARTIAL** |
| Settings Policy Management | N/A for content policy | YES | YES | YES / archive semantics | **STATIC VERIFIED** |
| Candidate Documents | PARTIAL; URL is supplied in request body | YES list/API | PARTIAL upsert on duplicate key | NO | **PARTIAL** |
| Generic File Upload / AI Import | YES | YES parsed preview in response | NO | Temporary upload file is deleted after processing | **STATIC VERIFIED for processing, not document storage** |
| Profile Photo | YES | Existing photo URL can be displayed by consumers | YES via same upload/update operation | NO explicit delete | **PARTIAL** |
| Generic UI `attachFile/removeFile/previewFile/downloadFile` functions | STUB/placeholder on many pages | STUB/placeholder | STUB/placeholder | STUB/placeholder | **NOT production CRUD** |

## 4. Employee Document Vault

### 4.1. Upload
4.1.1. Frontend page: `frontend/document-vault.html`.
4.1.2. Real file input accepts PDF/JPG/JPEG/PNG/WEBP.
4.1.3. `submitUpload()` sends `POST /api/documents/upload` using `FormData` and the authenticated bearer token.
4.1.4. Backend route: `POST /api/documents/upload` with `protect` and multipart upload.
4.1.5. Backend stores the file under `backend/uploads/employee-docs` and inserts/updates the `employee_documents` record.
4.1.6. **Status: AVAILABLE / STATIC VERIFIED.**

### 4.2. View / List
4.2.1. `GET /api/documents` is implemented and authenticated.
4.2.2. The UI loads and displays document metadata such as name, category, size, upload date, status, and expiry.
4.2.3. The document cards do **not** provide a real authenticated View/Preview button for the stored file.
4.2.4. The static `/uploads` mount means a file URL can be served directly by Express, but this is not equivalent to a secure per-document View API.
4.2.5. **Status: PARTIAL — metadata view exists; secure file preview/view is missing.**

### 4.3. Replace
4.3.1. The upload SQL uses `ON DUPLICATE KEY UPDATE file_url=...`, so a duplicate-key condition can update the database record.
4.3.2. There is no dedicated `PUT/PATCH /api/documents/:id/replace` endpoint.
4.3.3. There is no document-row-specific Replace button in the Document Vault UI.
4.3.4. The old physical file is not explicitly removed when the database record is replaced.
4.3.5. **Status: PARTIAL — database upsert exists, but explicit replace workflow and file lifecycle management are missing.**

### 4.4. Delete
4.4.1. UI provides a Delete button for each loaded document.
4.4.2. UI calls `DELETE /api/documents/:id`.
4.4.3. Backend verifies the document belongs to `req.user.user_id` before deletion.
4.4.4. Backend attempts to remove the physical file and then deletes the database row.
4.4.5. The frontend catch block currently displays **"Document deleted (offline mode)"** even when the request failed. This must be changed to an error state; failed deletion must never be reported as success.
4.4.6. **Status: AVAILABLE / STATIC VERIFIED, but error-state behavior requires correction.**

### 4.5. Required Document Vault Additions
4.5.1. Add `GET /api/documents/:id/view` or a secure streaming/preview endpoint.
4.5.2. Enforce tenant + employee ownership/role authorization before every file read.
4.5.3. Add a row-level **View / Preview** action.
4.5.4. Add `PUT/PATCH /api/documents/:id/replace` with authenticated multipart upload.
4.5.5. On replace, atomically update metadata and safely remove the previous file after the new file is accepted.
4.5.6. Add audit events for VIEW, UPLOAD, REPLACE, DELETE, and SHARE.
4.5.7. Add malware scanning/quarantine policy before making uploaded files available.
4.5.8. Do not expose sensitive employee documents through an unrestricted static `/uploads` route.

## 5. Company Policy PDF Library

### 5.1. Upload
5.1.1. `POST /api/policies/upload` is implemented for HR-or-above users.
5.1.2. PDF-only validation and a 20 MB limit are present.
5.1.3. Frontend `publishPolicy()` sends the selected PDF to the API.
5.1.4. **Status: AVAILABLE / STATIC VERIFIED.**

### 5.2. View / Preview
5.2.1. Policy Library contains View buttons.
5.2.2. The current `viewPolicy()` function creates a printable HTML representation rather than opening the actual uploaded PDF stored in `file_url`.
5.2.3. Therefore, the button is not a verified real stored-file preview.
5.2.4. **Status: PARTIAL.**

### 5.3. Replace
5.3.1. No explicit `PUT/PATCH /api/policies/:id/file` replace endpoint was found in `policiesRoutes.js`.
5.3.2. No Replace button was found for uploaded PDF records in the Policy Library.
5.3.3. **Status: MISSING.**

### 5.4. Delete
5.4.1. No delete endpoint was found in `policiesRoutes.js` for the uploaded PDF library.
5.4.2. The separate Settings Policy Management module has create/update/delete functionality, but it manages policy content records and is not the same as replacing/deleting the uploaded PDF file.
5.4.3. **Status: MISSING for the PDF library.**

### 5.5. Required Policy PDF Additions
5.5.1. Add authenticated `GET /api/policies/:id/view` or secure file streaming.
5.5.2. Add `PATCH /api/policies/:id/replace-file`.
5.5.3. Add `DELETE /api/policies/:id` with HR/admin authorization, retention rules, and audit logging.
5.5.4. Keep policy version history; replacing a policy must create a new version rather than silently destroying the previous approved version.
5.5.5. View buttons must open the actual approved document, not generated placeholder text.

## 6. Settings Policy Management

### 6.1. View
6.1.1. `GET /api/settings/policies` and `GET /api/settings/policies/:id` exist.
6.1.2. UI has a real View action that loads policy content into a modal.
6.1.3. **Status: STATIC VERIFIED.**

### 6.2. Update / Replace
6.2.1. `PUT /api/settings/policies/:id` exists.
6.2.2. This is a real policy-content update path.
6.2.3. If versioning is required for compliance, the update operation should create a new immutable version rather than overwrite an approved historical version.
6.2.4. **Status: AVAILABLE, with version-history hardening required.**

### 6.3. Delete / Archive
6.3.1. `DELETE /api/settings/policies/:id` exists and is admin-only.
6.3.2. UI labels this action as Archive.
6.3.3. **Status: STATIC VERIFIED.**

## 7. Candidate Documents

### 7.1. View
7.1.1. `GET /api/hiring/candidates/:id/documents` exists for staff-or-above users.
7.1.2. Candidate documents are also returned in the candidate record.
7.1.3. This provides metadata/list access, but a dedicated secure file-stream endpoint was not found.
7.1.4. **Status: PARTIAL.**

### 7.2. Upload / Replace
7.2.1. `POST /api/hiring/documents` exists.
7.2.2. The controller accepts a `file_url` value from the request body rather than performing a multipart file upload itself.
7.2.3. It uses `ON DUPLICATE KEY UPDATE` for duplicate document records, which acts as a partial replace/update.
7.2.4. There is no explicit Replace UI or file lifecycle cleanup.
7.2.5. **Status: PARTIAL.**

### 7.3. Delete
7.3.1. No candidate-document delete route was found.
7.3.2. **Status: MISSING.**

### 7.4. Verify
7.4.1. `PATCH /api/hiring/documents/:docId/verify` exists for HR-or-above users.
7.4.2. This is a verification/status action, not a file replacement or deletion action.

## 8. Generic Upload / AI Import

### 8.1. Upload
8.1.1. `POST /api/upload` accepts a broad set of file types and authenticates the request.
8.1.2. The controller parses the file, indexes content into the RAG service, returns a preview, and detects importable data.

### 8.2. View
8.2.1. The API response contains a text preview of parsed content.
8.2.2. This is a parsed-content preview, not a persistent document viewer.

### 8.3. Replace / Delete
8.3.1. Uploaded temporary files are removed after processing.
8.3.2. There is no persistent document CRUD record, Replace endpoint, or user-facing Delete operation for this generic upload flow.

## 9. Profile Photo

### 9.1. Upload / Replace
9.1.1. `POST /api/auth/profile/photo` accepts an authenticated photo upload.
9.1.2. The controller updates `users.photo_url`, so uploading a new photo replaces the stored URL at database level.
9.1.3. **Status: AVAILABLE / STATIC VERIFIED for update-by-upload.**

### 9.2. View
9.2.1. Consumers can use the stored `photo_url`.
9.2.2. No dedicated authenticated photo-view endpoint was found.
9.2.3. Because `/uploads` is statically exposed, the access-control model requires hardening.

### 9.3. Delete
9.3.1. No dedicated profile-photo delete/reset route was found.
9.3.2. **Status: MISSING.**

## 10. Stub / Placeholder Function Finding

10.1.1. Many frontend pages contain generic functions such as `uploadDocument`, `deleteDocument`, `attachFile`, `removeFile`, `previewFile`, `downloadFile`, `permanentDelete`, and similar names.
10.1.2. These functions frequently resolve to a generic `stub()` implementation that only displays a success toast.
10.1.3. A stub must **not** be counted as Upload/View/Replace/Delete functionality.
10.1.4. Each production action must be replaced with a real API call, validation, authorization, database/file operation, response handling, and audit event.

## 11. Security Requirements for All Four Actions

11.1.1. Upload: authenticate, authorize, validate extension/MIME/content, enforce size limits, scan malware, sanitize filename, store outside executable paths, and audit.
11.1.2. View: authenticate every request, authorize by tenant/employee/role, use secure streaming or signed short-lived URLs, set safe content headers, and audit sensitive access.
11.1.3. Replace: verify ownership/role, upload and validate the new file first, preserve version history where required, remove/retire the old file safely, and audit both old/new versions.
11.1.4. Delete: verify ownership/role, require confirmation for destructive actions, remove or quarantine the physical file, update database state transactionally, and audit the deletion.
11.1.5. Never report success from a frontend catch/fallback when the backend operation failed.
11.1.6. Prevent IDOR by checking the requested record belongs to the user's tenant and authorized scope.
11.1.7. Do not expose sensitive employee files through a broad unauthenticated/static upload directory.

## 12. Final Findings

12.1. **Employee Document Vault:** Upload = YES; View = NO secure file view; Replace = PARTIAL; Delete = YES with frontend false-success error handling.
12.2. **Policy PDF Library:** Upload = YES; View = PARTIAL/synthetic; Replace = NO; Delete = NO.
12.3. **Settings Policy Content:** View = YES; Update = YES; Delete/Archive = YES.
12.4. **Candidate Documents:** View/list = YES; Upload = YES but file URL based; Replace = PARTIAL; Delete = NO.
12.5. **Generic Upload:** Upload + parsed preview = YES; persistent CRUD = NO.
12.6. **Profile Photo:** Upload/replace = YES; Delete = NO.
12.7. **Generic UI stubs:** Must not be accepted as real CRUD functionality.
12.8. **Production status for file CRUD:** **PARTIAL — production hardening and live E2E verification required.**

## 13. Acceptance Checklist

13.1. [ ] Every upload button maps to a real authenticated API.
13.2. [ ] Every View/Preview button opens the actual stored file/content.
13.3. [ ] Every Replace button has an explicit API and old-file lifecycle handling.
13.4. [ ] Every Delete button performs a real backend deletion/archive operation.
13.5. [ ] Failed requests never show success toasts.
13.6. [ ] Tenant/ownership/role authorization is tested for every object ID.
13.7. [ ] File MIME/content validation and malware scanning are tested.
13.8. [ ] Audit events exist for Upload/View/Replace/Delete where sensitive data is involved.
13.9. [ ] Live database/browser E2E tests pass.
13.10. [ ] No production business action depends on a generic `stub()` fallback.

---

# Workforce Intelligence Platform — Function CRUD Audit: Upload / View / Replace / Delete

## 1. Audit Scope

### 1.1. Purpose
1.1.1. Verify whether function-level **Upload, View/Preview, Replace/Update, and Delete/Archive** actions are actually implemented.
1.1.2. Distinguish real UI → API → backend behavior from placeholder/stub/toast-only functions.
1.1.3. Record gaps that must be added before production acceptance.

### 1.2. Evidence Source
1.2.1. Audited package: `WIP_v12_COMPLETE_FINAL (10).zip`.
1.2.2. Static source inspection covered frontend HTML/JavaScript, backend routes/controllers, application mounting, and document/policy flows.
1.2.3. This is a **static audit**. Live MySQL/browser E2E was not used to certify successful runtime operations.

## 2. Status Definitions

2.1. **AVAILABLE / STATIC VERIFIED** — real UI and/or backend implementation is present in source.
2.2. **PARTIAL** — some CRUD actions exist, but one or more required actions are missing or incomplete.
2.3. **STUB / PLACEHOLDER** — function exists mainly to show a toast or simulated success without a real business/API operation.
2.4. **MISSING** — no real implementation found.
2.5. **LIVE TEST REQUIRED** — runtime authorization, database behavior, file integrity, and browser behavior still need verification.

## 3. Master Function Matrix

| Module / Function | Upload | View / Preview | Replace / Update | Delete / Archive | Static Result |
|---|---|---|---|---|---|
| Employee Document Vault | YES | NO real document view | PARTIAL DB upsert only; no explicit replace flow | YES | **PARTIAL** |
| Company Policy Library (PDF) | YES | PARTIAL / synthetic preview, not stored PDF viewer | NO explicit replace | NO delete route in PDF library | **PARTIAL** |
| Settings Policy Management | N/A for content policy | YES | YES | YES / archive semantics | **STATIC VERIFIED** |
| Candidate Documents | PARTIAL; URL is supplied in request body | YES list/API | PARTIAL upsert on duplicate key | NO | **PARTIAL** |
| Generic File Upload / AI Import | YES | YES parsed preview in response | NO | Temporary upload file is deleted after processing | **STATIC VERIFIED for processing, not document storage** |
| Profile Photo | YES | Existing photo URL can be displayed by consumers | YES via same upload/update operation | NO explicit delete | **PARTIAL** |
| Generic UI `attachFile/removeFile/previewFile/downloadFile` functions | STUB/placeholder on many pages | STUB/placeholder | STUB/placeholder | STUB/placeholder | **NOT production CRUD** |

## 4. Employee Document Vault

### 4.1. Upload
4.1.1. Frontend page: `frontend/document-vault.html`.
4.1.2. Real file input accepts PDF/JPG/JPEG/PNG/WEBP.
4.1.3. `submitUpload()` sends `POST /api/documents/upload` using `FormData` and the authenticated bearer token.
4.1.4. Backend route: `POST /api/documents/upload` with `protect` and multipart upload.
4.1.5. Backend stores the file under `backend/uploads/employee-docs` and inserts/updates the `employee_documents` record.
4.1.6. **Status: AVAILABLE / STATIC VERIFIED.**

### 4.2. View / List
4.2.1. `GET /api/documents` is implemented and authenticated.
4.2.2. The UI loads and displays document metadata such as name, category, size, upload date, status, and expiry.
4.2.3. The document cards do **not** provide a real authenticated View/Preview button for the stored file.
4.2.4. The static `/uploads` mount means a file URL can be served directly by Express, but this is not equivalent to a secure per-document View API.
4.2.5. **Status: PARTIAL — metadata view exists; secure file preview/view is missing.**

### 4.3. Replace
4.3.1. The upload SQL uses `ON DUPLICATE KEY UPDATE file_url=...`, so a duplicate-key condition can update the database record.
4.3.2. There is no dedicated `PUT/PATCH /api/documents/:id/replace` endpoint.
4.3.3. There is no document-row-specific Replace button in the Document Vault UI.
4.3.4. The old physical file is not explicitly removed when the database record is replaced.
4.3.5. **Status: PARTIAL — database upsert exists, but explicit replace workflow and file lifecycle management are missing.**

### 4.4. Delete
4.4.1. UI provides a Delete button for each loaded document.
4.4.2. UI calls `DELETE /api/documents/:id`.
4.4.3. Backend verifies the document belongs to `req.user.user_id` before deletion.
4.4.4. Backend attempts to remove the physical file and then deletes the database row.
4.4.5. The frontend catch block currently displays **"Document deleted (offline mode)"** even when the request failed. This must be changed to an error state; failed deletion must never be reported as success.
4.4.6. **Status: AVAILABLE / STATIC VERIFIED, but error-state behavior requires correction.**

### 4.5. Required Document Vault Additions
4.5.1. Add `GET /api/documents/:id/view` or a secure streaming/preview endpoint.
4.5.2. Enforce tenant + employee ownership/role authorization before every file read.
4.5.3. Add a row-level **View / Preview** action.
4.5.4. Add `PUT/PATCH /api/documents/:id/replace` with authenticated multipart upload.
4.5.5. On replace, atomically update metadata and safely remove the previous file after the new file is accepted.
4.5.6. Add audit events for VIEW, UPLOAD, REPLACE, DELETE, and SHARE.
4.5.7. Add malware scanning/quarantine policy before making uploaded files available.
4.5.8. Do not expose sensitive employee documents through an unrestricted static `/uploads` route.

## 5. Company Policy PDF Library

### 5.1. Upload
5.1.1. `POST /api/policies/upload` is implemented for HR-or-above users.
5.1.2. PDF-only validation and a 20 MB limit are present.
5.1.3. Frontend `publishPolicy()` sends the selected PDF to the API.
5.1.4. **Status: AVAILABLE / STATIC VERIFIED.**

### 5.2. View / Preview
5.2.1. Policy Library contains View buttons.
5.2.2. The current `viewPolicy()` function creates a printable HTML representation rather than opening the actual uploaded PDF stored in `file_url`.
5.2.3. Therefore, the button is not a verified real stored-file preview.
5.2.4. **Status: PARTIAL.**

### 5.3. Replace
5.3.1. No explicit `PUT/PATCH /api/policies/:id/file` replace endpoint was found in `policiesRoutes.js`.
5.3.2. No Replace button was found for uploaded PDF records in the Policy Library.
5.3.3. **Status: MISSING.**

### 5.4. Delete
5.4.1. No delete endpoint was found in `policiesRoutes.js` for the uploaded PDF library.
5.4.2. The separate Settings Policy Management module has create/update/delete functionality, but it manages policy content records and is not the same as replacing/deleting the uploaded PDF file.
5.4.3. **Status: MISSING for the PDF library.**

### 5.5. Required Policy PDF Additions
5.5.1. Add authenticated `GET /api/policies/:id/view` or secure file streaming.
5.5.2. Add `PATCH /api/policies/:id/replace-file`.
5.5.3. Add `DELETE /api/policies/:id` with HR/admin authorization, retention rules, and audit logging.
5.5.4. Keep policy version history; replacing a policy must create a new version rather than silently destroying the previous approved version.
5.5.5. View buttons must open the actual approved document, not generated placeholder text.

## 6. Settings Policy Management

### 6.1. View
6.1.1. `GET /api/settings/policies` and `GET /api/settings/policies/:id` exist.
6.1.2. UI has a real View action that loads policy content into a modal.
6.1.3. **Status: STATIC VERIFIED.**

### 6.2. Update / Replace
6.2.1. `PUT /api/settings/policies/:id` exists.
6.2.2. This is a real policy-content update path.
6.2.3. If versioning is required for compliance, the update operation should create a new immutable version rather than overwrite an approved historical version.
6.2.4. **Status: AVAILABLE, with version-history hardening required.**

### 6.3. Delete / Archive
6.3.1. `DELETE /api/settings/policies/:id` exists and is admin-only.
6.3.2. UI labels this action as Archive.
6.3.3. **Status: STATIC VERIFIED.**

## 7. Candidate Documents

### 7.1. View
7.1.1. `GET /api/hiring/candidates/:id/documents` exists for staff-or-above users.
7.1.2. Candidate documents are also returned in the candidate record.
7.1.3. This provides metadata/list access, but a dedicated secure file-stream endpoint was not found.
7.1.4. **Status: PARTIAL.**

### 7.2. Upload / Replace
7.2.1. `POST /api/hiring/documents` exists.
7.2.2. The controller accepts a `file_url` value from the request body rather than performing a multipart file upload itself.
7.2.3. It uses `ON DUPLICATE KEY UPDATE` for duplicate document records, which acts as a partial replace/update.
7.2.4. There is no explicit Replace UI or file lifecycle cleanup.
7.2.5. **Status: PARTIAL.**

### 7.3. Delete
7.3.1. No candidate-document delete route was found.
7.3.2. **Status: MISSING.**

### 7.4. Verify
7.4.1. `PATCH /api/hiring/documents/:docId/verify` exists for HR-or-above users.
7.4.2. This is a verification/status action, not a file replacement or deletion action.

## 8. Generic Upload / AI Import

### 8.1. Upload
8.1.1. `POST /api/upload` accepts a broad set of file types and authenticates the request.
8.1.2. The controller parses the file, indexes content into the RAG service, returns a preview, and detects importable data.

### 8.2. View
8.2.1. The API response contains a text preview of parsed content.
8.2.2. This is a parsed-content preview, not a persistent document viewer.

### 8.3. Replace / Delete
8.3.1. Uploaded temporary files are removed after processing.
8.3.2. There is no persistent document CRUD record, Replace endpoint, or user-facing Delete operation for this generic upload flow.

## 9. Profile Photo

### 9.1. Upload / Replace
9.1.1. `POST /api/auth/profile/photo` accepts an authenticated photo upload.
9.1.2. The controller updates `users.photo_url`, so uploading a new photo replaces the stored URL at database level.
9.1.3. **Status: AVAILABLE / STATIC VERIFIED for update-by-upload.**

### 9.2. View
9.2.1. Consumers can use the stored `photo_url`.
9.2.2. No dedicated authenticated photo-view endpoint was found.
9.2.3. Because `/uploads` is statically exposed, the access-control model requires hardening.

### 9.3. Delete
9.3.1. No dedicated profile-photo delete/reset route was found.
9.3.2. **Status: MISSING.**

## 10. Stub / Placeholder Function Finding

10.1.1. Many frontend pages contain generic functions such as `uploadDocument`, `deleteDocument`, `attachFile`, `removeFile`, `previewFile`, `downloadFile`, `permanentDelete`, and similar names.
10.1.2. These functions frequently resolve to a generic `stub()` implementation that only displays a success toast.
10.1.3. A stub must **not** be counted as Upload/View/Replace/Delete functionality.
10.1.4. Each production action must be replaced with a real API call, validation, authorization, database/file operation, response handling, and audit event.

## 11. Security Requirements for All Four Actions

11.1.1. Upload: authenticate, authorize, validate extension/MIME/content, enforce size limits, scan malware, sanitize filename, store outside executable paths, and audit.
11.1.2. View: authenticate every request, authorize by tenant/employee/role, use secure streaming or signed short-lived URLs, set safe content headers, and audit sensitive access.
11.1.3. Replace: verify ownership/role, upload and validate the new file first, preserve version history where required, remove/retire the old file safely, and audit both old/new versions.
11.1.4. Delete: verify ownership/role, require confirmation for destructive actions, remove or quarantine the physical file, update database state transactionally, and audit the deletion.
11.1.5. Never report success from a frontend catch/fallback when the backend operation failed.
11.1.6. Prevent IDOR by checking the requested record belongs to the user's tenant and authorized scope.
11.1.7. Do not expose sensitive employee files through a broad unauthenticated/static upload directory.

## 12. Final Findings

12.1. **Employee Document Vault:** Upload = YES; View = NO secure file view; Replace = PARTIAL; Delete = YES with frontend false-success error handling.
12.2. **Policy PDF Library:** Upload = YES; View = PARTIAL/synthetic; Replace = NO; Delete = NO.
12.3. **Settings Policy Content:** View = YES; Update = YES; Delete/Archive = YES.
12.4. **Candidate Documents:** View/list = YES; Upload = YES but file URL based; Replace = PARTIAL; Delete = NO.
12.5. **Generic Upload:** Upload + parsed preview = YES; persistent CRUD = NO.
12.6. **Profile Photo:** Upload/replace = YES; Delete = NO.
12.7. **Generic UI stubs:** Must not be accepted as real CRUD functionality.
12.8. **Production status for file CRUD:** **PARTIAL — production hardening and live E2E verification required.**

## 13. Acceptance Checklist

13.1. [ ] Every upload button maps to a real authenticated API.
13.2. [ ] Every View/Preview button opens the actual stored file/content.
13.3. [ ] Every Replace button has an explicit API and old-file lifecycle handling.
13.4. [ ] Every Delete button performs a real backend deletion/archive operation.
13.5. [ ] Failed requests never show success toasts.
13.6. [ ] Tenant/ownership/role authorization is tested for every object ID.
13.7. [ ] File MIME/content validation and malware scanning are tested.
13.8. [ ] Audit events exist for Upload/View/Replace/Delete where sensitive data is involved.
13.9. [ ] Live database/browser E2E tests pass.
13.10. [ ] No production business action depends on a generic `stub()` fallback.

---

# 46. Salary Slip / Payslip — Real Company Structure, Format, Design & Function Verification

## 46.1 Purpose

The Workforce Intelligence Platform salary slip must use a professional payroll-document structure comparable to a real company's employee payslip. It must be generated only from the approved payroll record for the employee and pay period.

The salary slip is not the same document as Form 16. The monthly payslip should show the monthly payroll calculation and payment information; annual tax certificates and statutory returns must remain separate documents.

**Production status:** PARTIAL — an employee payslip UI and PDF generation service exist, but production hardening and removal of hard-coded/demo values are required.

## 46.2 Existing Implementation Found

### 46.2.1 Frontend

1. `salary.html` contains a Salary Slip / Payslip area.
2. A `View` action opens a payslip modal.
3. The UI contains employee information, pay-period information, attendance, earnings, deductions, net pay, bank details, statutory summary and footer sections.
4. A separate `payslip-portal.html` exists.
5. Several generic payslip functions are still registered as fallback/stub functions and must not be counted as real completed operations.

### 46.2.2 Backend

1. `backend/routes/adminRoutes.js` exposes a protected payslip PDF route:
   `GET /api/admin/salary/:id/payslip-pdf`
2. `backend/controllers/adminController.js` contains `downloadPayslipPDF`.
3. `backend/services/pdfService.js` contains PDF payslip generation using Puppeteer.
4. The PDF service reads salary records and salary line items from the database.
5. The PDF is stored/generated under a payslip upload directory and returned as a PDF response.
6. Employee ownership authorization exists in the controller and must remain mandatory for every payslip read/download.

## 46.3 Current Gaps That Must Be Corrected

### 46.3.1 Hard-coded company information

The current frontend contains example company information such as:

- `Workforce Intelligence Pvt Ltd`
- Bengaluru address
- example CIN
- example PAN
- example TAN
- example payroll contact details

These must never be treated as real production company data.

**Required:** load company/legal-entity information from tenant/company configuration.

### 46.3.2 Hard-coded bank information

The current UI contains fallback/example values such as a bank name, account number suffix and IFSC value.

**Required:** use the employee's verified payroll bank record only. Never invent a bank, account number, IFSC or payment reference.

### 46.3.3 Hard-coded statutory calculations

The current UI contains fallback calculations for PF, ESI, professional tax and TDS.

These calculations must not be performed by the display template using arbitrary percentages or sample values.

**Required:** payroll calculation must be performed by the configured payroll/statutory engine, stored in the payroll result, and then displayed exactly as approved.

### 46.3.4 Hard-coded tax-year text

The UI contains a hard-coded tax-regime/year label.

**Required:** tax year, tax regime and applicable legislation/version must come from payroll configuration and the employee's approved tax declaration.

For Tax Year 2026-27, the Income Tax Department states that salary TDS from April 2026 is handled under the new Act's section 392(1), with payroll calculations reset for the new tax year. The implementation must therefore be configuration/version driven rather than hard-coded. Source: Income Tax Department TDS Compliance FAQ.

### 46.3.5 Fake defaults

Fallback values such as:

- 26 working days
- 26 present days
- zero leaves
- default PF/ESI values
- default bank details
- default tax values
- default company details

must not silently appear in an employee's final payslip.

If source data is missing, the system must show a controlled error or mark the field as unavailable during an internal draft stage. A finalized payslip must contain validated payroll data.

---

## 46.4 Required Real-Company Salary Slip Layout

### 46.4.1 Page Header

The production payslip should begin with:

1. Company logo.
2. Legal entity/company name.
3. Registered office or payroll entity address.
4. CIN, where applicable.
5. PAN.
6. TAN, where applicable for the payroll entity.
7. Branch/location, where applicable.
8. Payroll contact/helpdesk.
9. Document title: `SALARY SLIP`.
10. Pay month and year.
11. Payslip/document number.
12. Payroll run/version reference where required.

### 46.4.2 Employee Identity Block

Display:

1. Employee ID / Employee Number.
2. Employee full name.
3. Designation.
4. Department.
5. Business unit.
6. Location.
7. Grade/band, if configured.
8. Date of joining.
9. Employment type.
10. Reporting manager, if company policy requires it.
11. PAN — preferably masked except where the employee/company policy requires full display.
12. UAN, if applicable.
13. ESIC/IP number, if applicable.
14. PF member/UAN reference, subject to privacy policy.

### 46.4.3 Payroll Period Block

Display:

1. Salary month.
2. Payroll period start date.
3. Payroll period end date.
4. Pay date.
5. Payroll status: Draft / Approved / Paid / Reversed, as applicable.
6. Currency.
7. Payroll run ID or payslip ID.

### 46.4.4 Attendance / Payable Days Block

Where payroll depends on attendance, show:

| Field | Required |
|---|---|
| Calendar/working days | Yes |
| Paid days | Yes |
| Present days | Yes |
| Approved leave days | Yes |
| LOP/unpaid days | Yes, when applicable |
| Holiday days | Optional |
| Weekly-off days | Optional |
| Overtime hours | When applicable |
| Payable days used in calculation | Yes |

Attendance values must be linked to the approved attendance/payroll calculation, not independently calculated by the payslip template.

---

## 46.5 Earnings Section

The earnings table should contain:

| Column | Requirement |
|---|---|
| Earnings Component | Yes |
| Monthly/Current Amount | Yes |
| Arrear/Adjustment | If applicable |
| YTD Amount | Recommended |
| Taxable/Non-taxable indicator | Where required |
| Remarks | Optional |

Typical configurable earning components include:

1. Basic Salary.
2. Dearness Allowance, where applicable.
3. House Rent Allowance.
4. Special Allowance.
5. Conveyance/Transport Allowance.
6. Medical/benefit allowance where applicable.
7. Communication allowance.
8. Meal/food benefit where applicable.
9. Shift allowance.
10. Overtime.
11. Incentive.
12. Performance bonus.
13. Commission.
14. Arrears.
15. Leave encashment.
16. Reimbursement components where company policy/payroll treatment requires inclusion.

**Important:** the system must not assume a fixed Basic/HRA percentage for every employee. Salary components must come from the employee's approved compensation structure and payroll rules.

---

## 46.6 Deductions Section

The deductions table should contain:

| Deduction | Requirement |
|---|---|
| Employee PF | If applicable |
| Employee ESI | If applicable |
| Professional Tax | If applicable by jurisdiction |
| Income-tax TDS | If applicable |
| Labour Welfare Fund | If applicable |
| Loan/Salary Advance | If applicable |
| Voluntary PF | If applicable |
| Other approved deductions | If applicable |
| Recovery/adjustment | If applicable |
| Total deductions | Mandatory |

Each deduction should have:

1. Component name.
2. Current-period amount.
3. YTD amount where useful.
4. Rule/source reference internally.
5. Effective date/version.
6. Approval/calculation source.

### 46.6.1 EPF

EPF rules must be configuration driven and periodically reviewed against official EPFO guidance. EPFO publishes contribution rates, wage-ceiling rules and exceptions; the payslip must not permanently hard-code those rules.

### 46.6.2 ESI

Where ESIC coverage applies, employee/employer contribution rates and wage eligibility must come from the statutory configuration for the applicable payroll period and jurisdiction. The current ESIC publication identifies employee contribution at 0.75% and employer contribution at 3.25%; this must still be treated as a configurable statutory rule rather than UI code.

### 46.6.3 Professional Tax

Professional Tax must be jurisdiction-specific. The system must not use one universal ₹200 or other fixed amount for every employee.

### 46.6.4 TDS

TDS must be calculated by the payroll/tax engine using:

1. Applicable tax year.
2. Employee tax regime/declaration.
3. Projected annual taxable income.
4. Eligible deductions/exemptions/benefits.
5. Previous-period TDS.
6. Current-period TDS.
7. Payroll adjustments.

The monthly payslip may display TDS, but Form 16 remains the annual salary TDS certificate.

---

## 46.7 Employer Contribution / CTC Section

For companies that choose to show employer-side information, provide a clearly separated section:

1. Employer PF contribution.
2. Employer EPS contribution, where applicable.
3. Employer ESI contribution, where applicable.
4. EDLI or other applicable statutory employer contribution.
5. Gratuity provision, if company policy displays it.
6. Insurance/benefit cost, if applicable.
7. Other employer benefits.
8. Monthly CTC.
9. Annual CTC, if company policy permits.

Employer contributions must never be included in employee net-pay deductions.

---

## 46.8 Net Salary Section

The most prominent amount should be:

**NET SALARY PAYABLE**

Show:

1. Gross earnings.
2. Total deductions.
3. Net salary.
4. Net salary in words.
5. Payment status.
6. Payment date.
7. Bank payment reference/UTR, when appropriate.
8. Reversal/hold status where applicable.

The formula should be based on the finalized payroll result:

`Net Pay = Approved Gross Earnings + Approved Adjustments − Approved Employee Deductions`

The displayed net amount must equal the stored finalized payroll result.

---

## 46.9 Bank / Payment Section

Display only the minimum necessary information:

1. Bank name.
2. Account holder name.
3. Masked account number.
4. IFSC, if company policy requires it.
5. Payment method.
6. Payment date.
7. UTR/transaction reference when available.

Never expose the full bank account number unnecessarily.

---

## 46.10 Statutory / Tax Summary

Provide an optional summary block containing:

1. PF wage/base.
2. Employee PF.
3. Employer PF.
4. ESI wage/base.
5. Employee ESI.
6. Employer ESI.
7. Professional Tax.
8. TDS.
9. Tax regime.
10. Tax year.
11. YTD gross.
12. YTD deductions.
13. YTD TDS.
14. Statutory identifiers where required.

The detailed annual tax certificate should remain separate from the monthly payslip.

---

## 46.11 Year-to-Date Summary

For a professional enterprise payroll experience, include a compact YTD section where payroll data supports it:

| Metric | Current Month | YTD |
|---|---:|---:|
| Gross Earnings | Amount | Amount |
| Taxable Earnings | Amount | Amount |
| Employee PF | Amount | Amount |
| Employee ESI | Amount | Amount |
| Professional Tax | Amount | Amount |
| TDS | Amount | Amount |
| Other Deductions | Amount | Amount |
| Net Pay | Amount | Amount |

YTD values must be calculated from finalized payroll records, not by multiplying the current month's amount by the month number.

---

## 46.12 Leave / LOP / Attendance Impact

Where applicable, provide a transparent explanation:

1. LOP days.
2. LOP deduction.
3. Unpaid leave dates or summary, where company policy permits.
4. Approved attendance correction reference.
5. Overtime/shift impact.
6. Arrear/retro-pay impact.

Do not expose sensitive attendance or manager comments that are unrelated to payroll.

---

## 46.13 Payslip Design Standard

### 46.13.1 Visual hierarchy

1. Company branding at top.
2. `SALARY SLIP` title clearly visible.
3. Pay month prominently displayed.
4. Employee details in a clean two-column information block.
5. Attendance/payable-days strip.
6. Earnings and deductions side-by-side on desktop.
7. Gross/total rows clearly distinguished.
8. Net salary as the strongest visual element.
9. Bank/payment details below net pay.
10. Statutory/YTD information in a compact secondary section.
11. Footer with confidentiality and system-generated statement.

### 46.13.2 Branding

The payslip must use tenant/company configuration:

1. Company logo.
2. Primary brand color.
3. Secondary brand color.
4. Font family approved by the design system.
5. Footer/contact information.
6. Legal entity details.

No company name, logo, address, CIN, PAN, TAN or contact information should be hard-coded in frontend templates.

### 46.13.3 Light and dark application modes

The interactive web payslip may support light/dark/system application themes.

The official PDF payslip should normally use a print-safe light document design with accessible contrast and company branding.

### 46.13.4 Print/PDF requirements

1. A4 portrait default.
2. Clean page margins.
3. No clipped tables.
4. No horizontal scrolling in print.
5. Repeating table headers where the document spans multiple pages.
6. Footer on every page where needed.
7. Page numbers for multi-page payslips.
8. Correct PDF metadata.
9. Embedded fonts where required.
10. Text must remain selectable/searchable.
11. PDF must open successfully in standard viewers.
12. No sensitive data in the PDF filename.

---

## 46.14 Required Payslip Actions

The salary-slip screen must provide only actions that are actually implemented:

1. **View** — retrieve the authorized payroll record and render the complete payslip.
2. **Download PDF** — generate/download the finalized payslip.
3. **Print** — print the rendered payslip.
4. **Email Payslip** — only after real authenticated mail integration is implemented.
5. **Compare** — only when a real historical comparison API exists.
6. **Download Current Slip** — must return an actual PDF/file response.
7. **Download All Payslips** — must generate a real authenticated multi-file response/archive.
8. **Regenerate** — only for authorized payroll administrators and only with an audit trail.
9. **Void/Reissue** — only through an approved payroll correction workflow.

A toast saying “Payslip downloaded” is not evidence of a successful download.

---

## 46.15 Security and Privacy

1. Employee can view only their own finalized payslips.
2. Payroll administrators require explicit payroll permission.
3. HR access must be role/tenant scoped.
4. Salary IDs must not create an IDOR vulnerability.
5. PDF generation endpoint must re-check authorization.
6. Bank details must be masked.
7. Payslip URLs must not be publicly accessible.
8. Generated files must use controlled storage.
9. File access must be authenticated and authorized.
10. Payslip generation/download should create an audit event where policy requires it.
11. Sensitive payroll data must not be written to normal application logs.
12. Cache headers must prevent unintended browser/proxy caching of sensitive documents.
13. Old/revoked payslips must not remain anonymously accessible.
14. Download filenames must not expose unnecessary personal information.
15. Email delivery must use a secure, verified destination and must not leak payslip data to an unauthorized address.

---

## 46.16 Payroll Approval Workflow

A real-company payroll workflow should support:

1. Draft payroll.
2. Payroll calculation.
3. Validation.
4. Attendance/LOP reconciliation.
5. Payroll review.
6. Approval.
7. Payment processing.
8. Paid status.
9. Payslip publication.
10. Correction/reversal.
11. Re-run/reissue with audit history.

Employees should not receive a finalized payslip before the payroll run reaches the configured publication state.

---

## 46.17 Salary Revision / Arrear Handling

The payslip must support:

1. Effective salary date.
2. Old salary structure.
3. New salary structure.
4. Arrear amount.
5. Arrear period.
6. Retroactive deduction/benefit adjustment.
7. Tax impact.
8. Approval reference.

A salary revision must not silently overwrite historical finalized payslips.

---

## 46.18 Finalized Payroll Immutability

After payroll approval/payment:

1. Finalized salary records should be immutable by normal employee UI.
2. Corrections should create a controlled adjustment/reversal/reissue record.
3. Original payslip should remain traceable.
4. Revised payslip should have a new version/reference.
5. Audit log should capture who changed what, when and why.
6. Payroll-period totals must remain reconcilable.

---

## 46.19 Required Database/API Contract

The payroll result should expose or internally maintain, as applicable:

```text
salary_id
employee_id
pay_period_start
pay_period_end
salary_month
salary_year
pay_date
payroll_run_id
payroll_status
payment_status
employee identifiers
department
designation
employment type
attendance/payable-day metrics
earnings[]
deductions[]
employer_contributions[]
tax_summary
ytd_summary
bank/payment summary
gross_pay
total_deductions
net_pay
net_pay_words
created_at
approved_at
paid_at
version
```

Line items must be stored as structured components rather than parsed from HTML.

---

## 46.20 Function Acceptance Matrix

| Function | Current Evidence | Status | Production Requirement |
|---|---|---|---|
| View payslip | Real modal exists | PARTIAL | Must use finalized authorized payroll data |
| View PDF | Backend PDF generation exists | AVAILABLE/PARTIAL | Live DB/browser verification required |
| Download PDF | Protected backend route exists | AVAILABLE/PARTIAL | Verify MIME, filename, ownership and file validity |
| Print | UI function exists | PARTIAL | Verify actual print output |
| Generate payslip | Some backend generation exists | PARTIAL | Remove fallback/demo generation paths |
| Email payslip | Stub/fallback references exist | MISSING/LIVE TEST REQUIRED | Connect secure mail provider |
| Compare payslip | Stub/fallback exists | MISSING | Build historical comparison API |
| Download all payslips | Fallback function exists | MISSING | Implement authenticated archive generation |
| Reissue payslip | Not verified as complete | MISSING | Implement approval/version/audit workflow |
| Salary correction | Payroll data exists | PARTIAL | Implement controlled correction/reversal |
| Bank details | UI reads employee data | PARTIAL | Remove hard-coded defaults |
| Statutory calculations | Display fallback calculations exist | PARTIAL | Move calculations to configured payroll engine |
| YTD values | Some display logic exists | PARTIAL | Calculate from finalized payroll records |
| Attendance linkage | Attendance fields displayed | PARTIAL | Verify payroll-run source and reconciliation |
| Tax regime | Displayed | PARTIAL | Make year/rule/configuration driven |
| Employer contributions | Displayed in UI | PARTIAL | Use finalized payroll result |
| Audit trail | General audit infrastructure exists | LIVE TEST REQUIRED | Verify payslip view/download/reissue events |

---

## 46.21 Mandatory Production Acceptance Tests

Before production approval, test at least:

1. Employee A cannot view Employee B's payslip.
2. Employee A cannot download Employee B's PDF by changing the salary ID.
3. Payroll admin can view an authorized employee payslip.
4. Finalized payroll amount equals payslip amount.
5. Gross = earnings total after approved adjustments.
6. Net = gross/approved earnings minus approved employee deductions.
7. Attendance/payable days match payroll calculation.
8. LOP deduction matches approved payroll result.
9. PF/ESI/PT/TDS values match the configured statutory engine.
10. Tax year is correct.
11. YTD values reconcile with prior finalized payroll records.
12. Bank account is masked.
13. Company legal information comes from tenant configuration.
14. No sample CIN/PAN/TAN/address appears.
15. No sample bank/IFSC appears.
16. No fake default attendance appears.
17. PDF downloads with `application/pdf`.
18. PDF opens successfully.
19. PDF filename is safe.
20. Print output fits A4.
21. Multi-page payslip has no clipped content.
22. Dark-mode web view remains readable.
23. Payslip access is audited where required.
24. Reissued payslip preserves the original version.
25. Unauthorized or expired access returns an appropriate error instead of a fake success toast.

---

## 46.22 Recommended Final Salary Slip Structure

```text
┌──────────────────────────────────────────────────────────────────┐
│ COMPANY LOGO   LEGAL ENTITY NAME                         SALARY  │
│ Registered Address / CIN / PAN / TAN                     SLIP    │
│ Payroll Contact                                      APR 2026   │
├──────────────────────────────────────────────────────────────────┤
│ Employee ID | Name | Designation | Department | Location        │
│ DOJ | Employment Type | UAN | PAN (masked) | ESIC (if any)      │
├──────────────────────────────────────────────────────────────────┤
│ Pay Period | Pay Date | Payroll Run | Status | Payslip No.      │
├──────────────────────────────────────────────────────────────────┤
│ WORKING DAYS | PRESENT | LEAVE | LOP | PAID DAYS | OVERTIME     │
├──────────────────────────────┬───────────────────────────────────┤
│ EARNINGS                     │ DEDUCTIONS                        │
│ Basic                        │ Employee PF                       │
│ HRA                          │ Employee ESI                      │
│ Special Allowance            │ Professional Tax                 │
│ Conveyance                   │ TDS                               │
│ Bonus/Incentive              │ LWF / Advance / Other             │
│ Arrears                      │                                   │
│ ---------------------------- │ -------------------------------   │
│ GROSS EARNINGS               │ TOTAL DEDUCTIONS                  │
├──────────────────────────────┴───────────────────────────────────┤
│                    NET SALARY PAYABLE                            │
│                    ₹ XX,XXX.XX                                  │
│                    In Words: ...                                │
├──────────────────────────────┬───────────────────────────────────┤
│ BANK / PAYMENT               │ STATUTORY / TAX SUMMARY           │
│ Bank                         │ PF Wage                           │
│ A/c ••••1234                 │ Employee PF                       │
│ IFSC                         │ Employer PF                       │
│ Payment Date / UTR           │ ESI / PT / TDS / Tax Regime       │
├──────────────────────────────┴───────────────────────────────────┤
│ YTD GROSS | YTD DEDUCTIONS | YTD TDS | YTD NET                  │
├──────────────────────────────────────────────────────────────────┤
│ Computer-generated payslip. Confidential payroll document.     │
│ Company payroll contact | Page X of Y | Version / audit ref.   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 46.23 Official Reference Basis

The statutory display/calculation layer should be maintained against current official sources rather than copied permanently into frontend code.

1. EPFO publishes official contribution-rate and wage-ceiling guidance:
   https://www.epfindia.gov.in/site_docs/PDFs/MiscPDFs/ContributionRate.pdf
2. ESIC publishes contribution information:
   https://www.esic.gov.in/
3. Income Tax Department provides current salary/TDS guidance and Form 16 information:
   https://www.incometax.gov.in/
4. Income Tax Department guidance for Tax Year 2026-27 states that salary TDS from April 2026 is handled under the new Act's applicable provisions and payroll systems must reset tax computation for the new tax year.
5. Form 16 remains an annual salary TDS certificate; it must not be represented as the monthly payslip.

**Rule:** statutory rates, ceilings, tax rules and jurisdictional rules must be stored in versioned configuration with an effective date and source/reference, reviewed by the responsible payroll/compliance administrator.

---

## 46.24 Final Status

**SALARY SLIP: PARTIAL / PRODUCTION HARDENING REQUIRED**

### Already present

- Salary Slip page.
- Payslip modal/view.
- Salary line items.
- Earnings/deductions sections.
- Net salary.
- Attendance summary.
- Bank/payment section.
- Statutory summary section.
- Backend PDF generation.
- Protected PDF route.

### Must be corrected before production

- Remove all hard-coded company/legal data.
- Remove all sample bank data.
- Remove all fake statutory fallback calculations.
- Make statutory rules configuration/version driven.
- Make YTD calculations database/payroll-result driven.
- Verify attendance-to-payroll reconciliation.
- Implement real email payslip delivery if offered.
- Implement real historical comparison if offered.
- Implement reissue/version workflow.
- Verify download security and IDOR protection.
- Verify PDF validity, print layout and A4 output.
- Verify live database/browser end-to-end behavior.
- Ensure finalized payslips cannot be silently altered.
- Ensure every displayed amount traces to an approved payroll calculation.

**Acceptance target:** `UI → authorized payroll API → finalized payroll record → validated calculations → payslip renderer → PDF/print/download → audit trail`.

---

# 47. Final Salary Slip Gap Closure — Additional Requirements

## 47.1 Purpose

This section closes additional salary-slip and payroll-document gaps that are easy to miss when validating only the visual payslip.

## 47.2 Payroll Reconciliation

The system must reconcile every finalized payslip against the payroll run:

1. Employee gross total must equal the payroll-run employee gross.
2. Employee deduction total must equal the payroll-run deduction total.
3. Net pay must equal the approved payroll result.
4. Employer contribution totals must reconcile separately.
5. Payroll-run totals must reconcile with the payment file/bank instruction where applicable.
6. Reconciliation differences must block final publication when configured as mandatory.
7. Manual overrides require an authorized reason and audit record.

## 47.3 Salary Slip Versioning

Every finalized payslip should have:

1. Unique payslip number.
2. Payroll run ID.
3. Version number.
4. Original/revised status.
5. Revision reason.
6. Revision timestamp.
7. Approved-by reference.
8. Audit event.
9. Link to the superseded version where applicable.

A corrected payslip must not silently replace the historical document.

## 47.4 Payroll Reversal and Reissue

The platform should support controlled:

1. Payroll reversal.
2. Salary correction.
3. Negative adjustment.
4. Positive adjustment.
5. Re-run.
6. Reissue.
7. Cancellation/voiding.
8. Re-publication.

Each operation must have:

- Permission check.
- Maker/checker or equivalent approval where required.
- Reason.
- Effective date.
- Audit trail.
- Before/after values.
- New document/version reference.

## 47.5 Salary Component Configuration

Salary components should be configurable by company/legal entity and effective date.

Each component should support:

1. Component code.
2. Display name.
3. Earning/deduction/employer contribution classification.
4. Taxable/non-taxable classification.
5. PF applicability.
6. ESI applicability.
7. Professional-tax applicability.
8. TDS treatment.
9. Proration rule.
10. LOP impact.
11. Overtime impact.
12. Arrear eligibility.
13. CTC inclusion.
14. YTD treatment.
15. Effective-from date.
16. Effective-to date.
17. Statutory/configuration reference.

## 47.6 Proration and Partial-Month Salary

The payroll engine must define the approved rule for:

1. New joiners.
2. Employees leaving during a month.
3. Transfers.
4. Salary revisions mid-month.
5. Unpaid leave.
6. Long leave.
7. Location transfer affecting jurisdiction.
8. Change in employment type.

The payslip must display the resulting approved amount, not independently recompute it using an assumed divisor.

## 47.7 Rounding Rules

The payroll system must define:

1. Currency precision.
2. Component-level rounding.
3. Tax rounding.
4. Final net-pay rounding.
5. Negative-value handling.
6. Rounding reconciliation.

The same rounding rules must be used by payroll calculation and payslip rendering.

## 47.8 Multi-Entity and Multi-Location Payroll

For companies with multiple entities/locations, the payslip must identify the correct:

1. Legal entity.
2. Payroll entity.
3. Establishment/branch.
4. State/jurisdiction.
5. Currency.
6. Payroll calendar.
7. Statutory configuration.

An employee transfer must not cause the payslip to display the previous entity's legal or statutory details.

## 47.9 Currency and Number Formatting

The payslip must support:

1. Configured currency.
2. Currency symbol/code.
3. Indian number formatting where applicable.
4. Decimal precision.
5. Amount-in-words conversion.
6. Negative adjustments.
7. Zero-value suppression where appropriate.

Amount-in-words must be generated from the final numeric net pay and independently validated.

## 47.10 Employee Self-Service

Employee self-service should provide:

1. Current payslip.
2. Historical payslips.
3. Search by year/month.
4. View.
5. Download PDF.
6. Print.
7. Secure access.
8. Download history where policy requires it.
9. Payslip availability status.
10. Error/support path when a payslip is missing.

Employees must not be able to edit payroll results from self-service.

## 47.11 Payroll Administrator Controls

Payroll administrators should have separate permissions for:

1. View payroll.
2. Calculate payroll.
3. Edit draft payroll.
4. Approve payroll.
5. Publish payslips.
6. Download bulk payslips.
7. Reissue payslip.
8. Reverse payroll.
9. Modify statutory configuration.
10. Manage salary components.

Sensitive permissions should follow least privilege and segregation of duties.

## 47.12 Bulk Payslip Generation

If bulk generation is offered:

1. It must run asynchronously for large employee populations.
2. Progress must be tracked.
3. Failed employees must be reported separately.
4. Partial completion must not be reported as complete.
5. Generated files must be securely stored.
6. Bulk downloads must use controlled authorization.
7. ZIP/archive generation must be real, not a frontend placeholder.
8. Temporary files must have retention/cleanup rules.
9. Bulk generation must be auditable.

## 47.13 Payslip Email

If email is supported:

1. Employee email must come from verified employee data.
2. The destination must be displayed/confirmed where policy requires.
3. Do not send salary documents to unverified personal addresses without an approved policy.
4. Email delivery must be logged without logging salary contents.
5. Failed delivery must not be reported as successful.
6. Retry behavior must be controlled.
7. Attachment links must expire where appropriate.
8. Email templates must be company-configurable.
9. Email provider credentials must be stored securely.

## 47.14 Payslip Download Controls

Every download should verify:

1. Authentication.
2. Tenant.
3. Employee ownership or payroll permission.
4. Payslip status.
5. Document version.
6. Access policy.
7. File existence.
8. File integrity.

Response must use:

1. Correct MIME type.
2. Safe `Content-Disposition`.
3. Cache-control suitable for sensitive payroll documents.
4. Appropriate content length/streaming behavior.
5. Error response if the document cannot be generated.

## 47.15 PDF Integrity

Automated tests should verify:

1. PDF file signature.
2. Page count.
3. Required employee name/ID.
4. Pay period.
5. Gross amount.
6. Net amount.
7. Required legal entity data.
8. No placeholder/sample values.
9. No blank pages.
10. No clipped content.
11. No overlapping text.
12. Correct footer/page numbering.

## 47.16 Accessibility

The web payslip must support:

1. Keyboard navigation.
2. Visible focus.
3. Screen-reader labels.
4. Logical heading structure.
5. Table headers.
6. Sufficient contrast.
7. Accessible modal behavior.
8. Accessible buttons.
9. No color-only meaning.
10. Responsive layout at desktop/tablet/mobile widths.

The PDF should also be generated with accessibility considerations where the PDF generation stack supports them.

## 47.17 Localization

The payslip must support configurable:

1. Date format.
2. Time zone.
3. Number format.
4. Currency.
5. Language.
6. State/jurisdiction.
7. Fiscal/tax year.
8. Holiday/payroll calendar.

The system must not assume that every employee belongs to the same state, legal entity or payroll calendar.

## 47.18 Data Retention

Define retention for:

1. Finalized payslips.
2. Draft payslips.
3. Reissued payslips.
4. Payroll calculation records.
5. Payment references.
6. Audit events.
7. Temporary generated PDFs.
8. Bulk ZIP files.
9. Email delivery records.

Retention must follow applicable legal/company policy and should distinguish historical payroll records from temporary generated artifacts.

## 47.19 Employee Offboarding

After termination/offboarding:

1. Historical payslips must remain retained according to policy.
2. Employee access must be disabled or transitioned according to offboarding policy.
3. Authorized HR/payroll users must retain required access.
4. Final settlement payslip must be distinguishable.
5. Final salary, leave encashment, deductions and other settlement components must be represented accurately.
6. Former employee download access must follow company policy.

## 47.20 Security Logging

Audit events should cover at least:

1. Payslip viewed.
2. Payslip downloaded.
3. Bulk payslip generated.
4. Payslip emailed.
5. Payslip reissued.
6. Payslip voided/reversed.
7. Salary component changed.
8. Payroll approval.
9. Payroll publication.
10. Statutory configuration changed.

Audit records should contain actor, timestamp, action, target, result and correlation/reference ID without unnecessarily storing salary values or bank secrets in logs.

## 47.21 Error Handling

The UI must distinguish:

1. No payslip exists.
2. Payroll is not yet approved.
3. Payslip is not yet published.
4. Access denied.
5. Document generation failed.
6. Download failed.
7. Temporary service failure.
8. Email delivery failed.

Never display a successful “downloaded/generated” message when the backend operation failed.

## 47.22 Testing Matrix

Add automated tests for:

1. Employee self-view.
2. Cross-employee IDOR.
3. Payroll-admin access.
4. Tenant isolation.
5. Draft payroll visibility.
6. Finalized payroll visibility.
7. Reissued payslip version.
8. Salary correction.
9. Negative adjustment.
10. LOP.
11. New-joiner proration.
12. Exit-month proration.
13. Mid-month revision.
14. Statutory deductions.
15. Tax-year transition.
16. YTD reconciliation.
17. PDF generation.
18. PDF download.
19. Bulk generation.
20. Email failure.
21. Audit logging.
22. Retention cleanup.
23. Mobile/responsive UI.
24. Accessibility.
25. Print output.

## 47.23 Production Sign-Off Rule

A salary-slip feature must not be marked **COMPLETE** merely because the page displays realistic data.

Production completion requires:

`Approved payroll result → authorization → reconciliation → correct payslip rendering → secure view → valid PDF → correct download → audit trail → version control → error handling → live end-to-end verification`.

## 47.24 Final Gap Status

After this gap-closure section, the salary-slip requirements are considered **systematically specified**, but implementation remains:

**PARTIAL / PRODUCTION HARDENING REQUIRED / LIVE E2E TEST REQUIRED**

No production sign-off should be recorded until the acceptance tests in Sections 46 and 47 pass against a real configured payroll database and the configured company/legal entity.


# 48. Salary Slip Company Identity, Salary Transfer Member & Generation Metadata Template

**Scope:** Final salary-slip identity, employee/payroll identifiers, company and branch details, payment metadata, generation metadata, audit trail, security controls, and the complete Generate → Approve → Publish → View → Download → Reissue process.

### 48.1. Status

48.1.1. **REQUIREMENT ADDED** — the salary-slip specification must explicitly contain company name, employee ID, salary transfer member ID, company branch, branch location, branch address, and generation metadata.

48.1.2. **PARTIAL / PRODUCTION HARDENING REQUIRED** — source implementation exists, but final live verification and removal of hard-coded/sample company values remain required.

48.1.3. **LIVE TEST REQUIRED** — generation timestamp, source IP, database persistence, PDF rendering, authorization, and audit events must be verified in a running environment.

### 48.2. Mandatory Company Identity Fields

48.2.1. Legal Company / Employer Name

48.2.2. Display Company Name / Brand Name, where different from the legal entity.

48.2.3. Company logo / approved brand mark.

48.2.4. Legal entity identifier, where applicable (for example CIN or another configured registration identifier).

48.2.5. Registered office address.

48.2.6. Payroll/company contact details, where required by the organization's payslip policy.

48.2.7. Tax/statutory identifiers must come from company configuration and must never be hard-coded in the PDF service.

48.2.8. Historical payslips must use a **snapshot** of the company identity and address applicable at the time the payslip was finalized; later company-address changes must not rewrite historical documents.

### 48.3. Mandatory Branch / Location Fields

48.3.1. Company Branch Name.

48.3.2. Branch Code.

48.3.3. Branch Location / City.

48.3.4. State / Province.

48.3.5. Country.

48.3.6. PIN / Postal Code.

48.3.7. Complete Branch Address.

48.3.8. Work location / payroll location, if different from the legal branch.

48.3.9. Branch contact details, if required by company policy.

48.3.10. Branch values must be taken from tenant/company configuration and snapshotted when the salary slip is finalized.

### 48.4. Mandatory Employee & Salary Transfer Identification

48.4.1. Employee ID — the primary employee identifier used by the company HR system.

48.4.2. Employee name — snapshot the name used for the finalized payroll period.

48.4.3. Department / business unit, where required by the company's payslip format.

48.4.4. Designation / role, where required by the company's payslip format.

48.4.5. Payroll Member ID.

48.4.6. **Salary Transfer Member ID** — explicitly display this field when the company uses a separate salary-transfer/payroll-member identifier.

48.4.7. Do not confuse Salary Transfer Member ID with UAN, PF member ID, bank account number, bank customer ID, or payment UTR/reference.

48.4.8. If the organization uses only one payroll identifier, configure a single canonical label such as **Payroll Member ID** rather than creating duplicate identifiers.

### 48.5. Payroll & Payment Metadata

48.5.1. Payroll Run ID.

48.5.2. Payslip ID / document ID.

48.5.3. Payslip number.

48.5.4. Payslip version.

48.5.5. Payroll period — start date and end date.

48.5.6. Pay date / salary credit date.

48.5.7. Payment method.

48.5.8. Payment reference / UTR, where permitted and required.

48.5.9. Salary transfer status.

48.5.10. Payroll approval status.

48.5.11. Payroll lock/finalization status.

### 48.6. Mandatory Generation Date, Time & System Metadata

48.6.1. **Generated Date** — the date on which the salary-slip document was generated.

48.6.2. **Generated Time** — the time at which generation completed or the document was finalized, according to the configured business rule.

48.6.3. **Timezone** — store and display the timezone used for the generation timestamp.

48.6.4. Store the canonical timestamp in UTC and retain the configured local timestamp for presentation/audit.

48.6.5. **System Source IP Address** — capture the source IP associated with the generate/reissue request in the security/audit record.

48.6.6. If an IP is displayed on an employee-facing payslip, the organization must first establish a documented business/legal basis and privacy justification. Prefer controlled or masked display when full IP exposure is unnecessary.

48.6.7. Never fabricate an IP address, use `127.0.0.1` as a production identity, or expose unnecessary internal infrastructure/network details.

48.6.8. Generation Request ID / Correlation ID.

48.6.9. Audit Event ID.

48.6.10. Generation actor ID and actor type (employee, payroll administrator, HR, system job, etc.).

48.6.11. Generation channel/source (web, API, scheduled payroll job, admin portal, etc.).

48.6.12. For reissue/regeneration, preserve the original generation metadata and add a new generation/reissue timestamp, actor, reason, request ID, and version.

### 48.7. Recommended Salary Slip Header Template

```text
======================================================================
                         [COMPANY LOGO]
                       [LEGAL COMPANY NAME]
                [REGISTERED OFFICE / COMPANY ADDRESS]
             CIN/REGISTRATION: [CONFIGURED VALUE]
----------------------------------------------------------------------
BRANCH / PAYROLL LOCATION
Branch Name       : [BRANCH NAME]
Branch Code       : [BRANCH CODE]
Branch Location   : [CITY, STATE, COUNTRY, PIN]
Branch Address    : [COMPLETE BRANCH ADDRESS]
----------------------------------------------------------------------
                           SALARY SLIP
Payroll Period    : [DD-MMM-YYYY] to [DD-MMM-YYYY]
Pay Date          : [DD-MMM-YYYY]
Payroll Run ID    : [PAYROLL-RUN-ID]
Payslip No.       : [PAYSLIP-NUMBER]
Version           : [VERSION]
----------------------------------------------------------------------
EMPLOYEE DETAILS
Employee ID       : [EMPLOYEE-ID]
Employee Name     : [EMPLOYEE-NAME]
Department        : [DEPARTMENT]
Designation       : [DESIGNATION]
Payroll Member ID : [PAYROLL-MEMBER-ID]
Salary Transfer
Member ID         : [SALARY-TRANSFER-MEMBER-ID]
----------------------------------------------------------------------
ATTENDANCE / PAYABLE DAYS
Payable Days      : [VALUE]
Present Days      : [VALUE]
LOP Days          : [VALUE]
Leave Days        : [VALUE]
Overtime          : [VALUE / HOURS]
----------------------------------------------------------------------
EARNINGS
Basic             : [AMOUNT]
HRA               : [AMOUNT]
Allowances        : [AMOUNT]
Overtime          : [AMOUNT]
Bonus/Incentive   : [AMOUNT]
Arrears           : [AMOUNT]
Gross Earnings    : [AMOUNT]
----------------------------------------------------------------------
DEDUCTIONS
PF                : [AMOUNT]
ESI               : [AMOUNT]
Professional Tax  : [AMOUNT]
TDS               : [AMOUNT]
LOP Deduction     : [AMOUNT]
Other Deductions  : [AMOUNT]
Total Deductions  : [AMOUNT]
----------------------------------------------------------------------
NET SALARY
Net Pay           : [AMOUNT]
Amount in Words   : [CONFIGURED TEXT]
----------------------------------------------------------------------
PAYMENT DETAILS
Payment Method    : [BANK TRANSFER / OTHER CONFIGURED METHOD]
Payment Date      : [DATE]
Payment Reference : [UTR / REFERENCE, IF PERMITTED]
----------------------------------------------------------------------
DOCUMENT GENERATION / AUDIT METADATA
Generated Date    : [DATE]
Generated Time    : [TIME]
Timezone          : [TIMEZONE]
System Source IP  : [FULL OR MASKED VALUE PER POLICY]
Request ID        : [CORRELATION-ID]
Audit Event ID    : [AUDIT-EVENT-ID]
Generated By      : [ACTOR / SYSTEM JOB]
----------------------------------------------------------------------
CONFIDENTIALITY NOTICE
This document contains confidential employee/payroll information and
must be accessed, stored, transmitted and disposed of according to
company security, privacy and retention policies.
======================================================================
```

### 48.8. Complete Generate Salary Slip Process Template

48.8.1. **Step 1 — Select payroll period:** administrator selects the finalized payroll run and employee(s).

48.8.2. **Step 2 — Validate payroll state:** system verifies payroll calculation, attendance/leave inputs, approvals, statutory configuration, and payroll lock state.

48.8.3. **Step 3 — Resolve company identity:** load legal entity, company name, logo, registration/tax identifiers, registered address, branch and payroll-location configuration.

48.8.4. **Step 4 — Resolve employee identity:** load Employee ID, employee name, department/designation and configured payroll identifiers.

48.8.5. **Step 5 — Resolve salary-transfer identity:** load Salary Transfer Member ID / Payroll Member ID from the authoritative payroll record.

48.8.6. **Step 6 — Resolve payment metadata:** load payment method, pay date and payment reference only when authorized and available.

48.8.7. **Step 7 — Snapshot historical identity:** copy company, branch, employee and payroll identity values required to make the finalized document historically stable.

48.8.8. **Step 8 — Generate timestamp:** create UTC timestamp and configured local timestamp/timezone.

48.8.9. **Step 9 — Capture source IP:** record the request source IP in the secure audit trail; apply masking/retention controls as configured.

48.8.10. **Step 10 — Generate document:** render the approved salary-slip template with real payroll values; no sample/demo company values may remain.

48.8.11. **Step 11 — Validate PDF:** confirm MIME type, file integrity, page rendering, employee identity, payroll period, totals, company/branch details and required metadata.

48.8.12. **Step 12 — Persist generation record:** save document/version metadata, request ID, generation timestamp, actor, source IP/audit reference and final status.

48.8.13. **Step 13 — Audit:** create `PAYSLIP_GENERATED` event only after successful generation/persistence.

48.8.14. **Step 14 — Publish:** make the payslip available to authorized employee/admin users according to publication rules.

48.8.15. **Step 15 — Notify:** if enabled, send a notification after successful publication, not before.

### 48.9. Generate / View / Download / Reissue / Delete Rules

48.9.1. **Generate:** authenticated and authorized request → validate payroll → generate PDF → validate file → persist metadata → audit → return success.

48.9.2. **View:** authenticated user → ownership/role/tenant authorization → retrieve permitted payslip → render/preview → audit view if policy requires.

48.9.3. **Download:** authenticated user → authorization → generate/retrieve correct finalized file → return `application/pdf` with safe filename and attachment disposition → audit download.

48.9.4. **Reissue:** never overwrite the original version. Create a new version linked to the original, record reason, actor, timestamp, request ID and source IP in the audit trail.

48.9.5. **Delete:** finalized payroll documents should normally be retained according to payroll/legal retention policy. If deletion is legally/business-approved, require privileged authorization, reason, retention validation and a tamper-resistant audit event.

48.9.6. A UI success toast must never be shown until the underlying operation actually succeeds.

### 48.10. Data Model Requirements

The salary-slip generation record should support at least:

48.10.1. `legal_entity_id`

48.10.2. `legal_entity_name_snapshot`

48.10.3. `company_display_name_snapshot`

48.10.4. `company_address_snapshot`

48.10.5. `branch_id`

48.10.6. `branch_code_snapshot`

48.10.7. `branch_name_snapshot`

48.10.8. `branch_location_snapshot`

48.10.9. `branch_address_snapshot`

48.10.10. `employee_id`

48.10.11. `employee_name_snapshot`

48.10.12. `payroll_member_id`

48.10.13. `salary_transfer_member_id`

48.10.14. `payroll_run_id`

48.10.15. `payslip_id`

48.10.16. `payslip_version`

48.10.17. `payment_method`

48.10.18. `payment_date`

48.10.19. `payment_reference`

48.10.20. `generated_at_utc`

48.10.21. `generated_at_local`

48.10.22. `generated_timezone`

48.10.23. `generation_ip`

48.10.24. `generation_ip_masked`

48.10.25. `generation_request_id`

48.10.26. `generation_actor_id`

48.10.27. `generation_actor_type`

48.10.28. `generation_channel`

48.10.29. `audit_event_id`

48.10.30. `document_status`

48.10.31. `published_at`

48.10.32. `reissued_at`

48.10.33. `reissue_reason`

### 48.11. Audit Event Requirements

48.11.1. Event name: `PAYSLIP_GENERATED`.

48.11.2. Record employee ID, payslip ID, payroll run ID and version.

48.11.3. Record actor/system identity, timestamp, timezone, request/correlation ID and source IP according to the organization's audit policy.

48.11.4. Record result: success/failure and failure category where applicable.

48.11.5. Do not place the salary PDF, bank account number, full payment credentials or unnecessary salary-detail payload into ordinary application logs.

48.11.6. Support related events such as `PAYSLIP_VIEWED`, `PAYSLIP_DOWNLOADED`, `PAYSLIP_REISSUED`, `PAYSLIP_PUBLISHED` and approved retention/deletion events.

### 48.12. Security & Privacy Controls

48.12.1. Enforce tenant isolation and object-level authorization on every payslip endpoint.

48.12.2. Protect salary-transfer identifiers and employee payroll information as confidential data.

48.12.3. Apply least-privilege access to payroll administrators and system jobs.

48.12.4. Encrypt payslip files and sensitive metadata at rest where supported by the deployment architecture; use TLS in transit.

48.12.5. Apply configured retention/deletion schedules to IP and generation metadata.

48.12.6. Do not expose internal IPs, infrastructure hostnames, database details or secrets in the PDF.

48.12.7. Mask identifiers where the employee-facing format does not require full disclosure.

### 48.13. Missing-Field Acceptance Checklist

- [ ] Legal company name present.
- [ ] Company logo present and approved.
- [ ] Registered/company address present.
- [ ] Company legal/statutory identifiers sourced from configuration.
- [ ] Branch name present.
- [ ] Branch code present.
- [ ] Branch location/city/state/PIN present.
- [ ] Complete branch address present.
- [ ] Employee ID present.
- [ ] Employee name present.
- [ ] Payroll Member ID present where configured.
- [ ] Salary Transfer Member ID present where configured.
- [ ] Payroll Run ID present.
- [ ] Payslip number and version present.
- [ ] Payroll period present.
- [ ] Pay date present.
- [ ] Payment method/reference handled according to policy.
- [ ] Generated date present.
- [ ] Generated time present.
- [ ] Timezone present.
- [ ] System/source IP captured securely.
- [ ] IP display policy documented.
- [ ] Request/correlation ID present.
- [ ] Audit Event ID present.
- [ ] Generation actor/system present.
- [ ] Reissue metadata supported.
- [ ] Historical company/branch snapshot supported.
- [ ] PDF integrity validated.
- [ ] Download authorization validated.
- [ ] No hard-coded/sample company values remain.
- [ ] No fake IP address or fake generation timestamp remains.

### 48.14. Production Acceptance Rule

48.14.1. This requirement is complete only when the generated salary slip visibly contains the configured company identity, applicable branch/location/address, Employee ID, configured Salary Transfer Member ID/Payroll Member ID, payroll period, payment metadata, generation date/time/timezone, and the approved treatment of system IP metadata.

48.14.2. Static source inspection alone is insufficient. At least one end-to-end test must generate a real payslip from a test payroll run and verify the database record, PDF contents, authorization, download response and audit event.

48.14.3. Any hard-coded sample company name, address, CIN/PAN/TAN, bank information, `127.0.0.1`, placeholder timestamp or placeholder employee/payroll identifier must fail production acceptance.

48.14.4. **Final status: REQUIREMENT ADDED / LIVE IMPLEMENTATION & VERIFICATION REQUIRED.**

# 49. Complete Download, Export Format, Document Design & Project Documentation Gap Audit

**Scope:** This section performs a second-pass audit of the actual project package for downloadable/exportable file formats, real backend generation, frontend fallback/stub actions, document design requirements, and Markdown documentation coverage.

## 49.1. Audit Basis

49.1.1. The project package was inspected for frontend export/download actions, backend download responses, MIME types, file-generation libraries, project documentation files, templates and design-related implementation.

49.1.2. The audit distinguishes:

- **FORMAT AVAILABLE** — the format can be generated or downloaded through a real implementation path.
- **FORMAT PARTIAL** — supporting library or UI exists, but the complete production download workflow is not verified.
- **FORMAT MISSING** — no real production export path was verified.
- **STUB/FALLBACK** — frontend action exists but can resolve to a generic success function without generating the requested file.
- **LIVE TEST REQUIRED** — actual browser/database/file-open testing is still required.

49.1.3. A parser/import capability is **not** evidence of an export capability. For example, the presence of the `xlsx` package and XLSX parsing code does not prove that XLSX downloads are implemented.

## 49.2. Project Documentation / Markdown Audit

The current project package contains Markdown documentation including:

49.2.1. `README.md` — project overview/run information.

49.2.2. `PROJECT.md` — project description and page/module information.

49.2.3. `ARCHITECTURE.md` — architecture and service structure.

49.2.4. `DESIGN.md` — design documentation.

49.2.5. `DECISION.md` — project decisions.

49.2.6. `FAILURE.md` — failure/known-issue information.

49.2.7. `HANDOFF.md` — handoff/setup information.

49.2.8. `KNOWLEDGE.md` — knowledge/reference documentation.

49.2.9. `MEMORY.md` — project memory/context information.

49.2.10. `PHASES.md` — phase tracking.

49.2.11. `PLAN.md` — project plan.

49.2.12. `PRD.md` — product requirements.

49.2.13. `RULES.md` — project/security/implementation rules.

49.2.14. `STATUS.md` — project status.

49.2.15. `TASKS.md` — task tracking.

49.2.16. `fixed_project_enhanced/README.md` — enhanced/fixed package documentation.

49.2.17. **Documentation requirement:** these Markdown files must be kept synchronized with the final Workforce Intelligence Platform implementation. No obsolete version names, sample credentials, fake completion statements or stale feature claims should remain in production documentation.

49.2.18. **Master documentation requirement:** the complete numbered master audit should remain the canonical audit/requirements document; duplicate older audit files may be retained for history but must not be presented as the current master.

## 49.3. Actual Download / Export Format Matrix

| Format | Current Project Evidence | Status | Required Production Action |
|---|---|---|---|
| **PDF** | Payslip PDF generation and protected PDF response exist; `application/pdf` and attachment disposition are present | **AVAILABLE / PARTIAL** | Live-generate, open, print and authorization-test every PDF type |
| **CSV** | Attendance/payroll/report CSV backend responses exist; frontend CSV Blob helpers also exist | **AVAILABLE / PARTIAL** | Verify authorization, escaping, encoding, filenames and live file contents |
| **JSON** | Report JSON download path exists | **AVAILABLE / PARTIAL** | Verify schema, authorization, safe filename and valid JSON |
| **XLSX** | `xlsx` dependency and XLSX parsing exist, but no verified production XLSX download response was found | **MISSING EXPORT** | Implement real `.xlsx` generation/download with correct MIME type and workbook validation |
| **XLS** | XLS parsing is supported, but no verified XLS export path was found | **MISSING EXPORT** | Only add legacy XLS export if a business requirement exists; prefer XLSX |
| **DOCX** | DOCX parsing and project guide DOCX files exist, but no verified application-generated DOCX export endpoint was found | **MISSING EXPORT** | Implement DOCX generation for document/letter/report functions that advertise Word download |
| **ZIP** | `downloadAllDocsZip`-type frontend actions exist, but no verified backend ZIP archive generation was found | **MISSING EXPORT** | Implement authenticated archive generation, streaming, cleanup and per-file authorization |
| **PNG/JPG/image** | `exportImage`/chart-related frontend actions are referenced, but no verified production image-export backend path was established | **MISSING/PARTIAL** | Implement only for features that explicitly support image export; validate image generation and download |
| **TXT** | Text/document parsing support exists; no general report-download path was verified | **NOT VERIFIED AS EXPORT** | Add only where a business use case requires plain-text export |
| **MD** | Markdown project documentation exists | **DOCUMENTATION FORMAT AVAILABLE** | Keep documentation current; do not claim generic application data export unless implemented |
| **HTML/Print** | Print functions and printable UI patterns exist | **PARTIAL** | Treat browser print as a print workflow, not proof of downloadable HTML/PDF generation |

## 49.4. Required Download Formats by Business Function

### 49.4.1. Reports

Recommended supported formats:

1. PDF — presentation/print format.
2. CSV — tabular/raw data exchange.
3. XLSX — business analysis/spreadsheet format.
4. JSON — API/system-to-system format where appropriate.
5. ZIP — only for authorized bulk/multi-file export.

### 49.4.2. Payroll

Required where applicable:

1. PDF payslip.
2. CSV payroll register.
3. XLSX payroll register/export.
4. JSON only for approved integration/API use cases.
5. ZIP for authorized bulk payslip packages.
6. Bank/payment files only in the exact bank-approved format; never label a generic CSV as a bank transfer file.

### 49.4.3. Employee Documents

Required where offered:

1. PDF for final letters/certificates/ID documents where a fixed document is required.
2. DOCX for editable Word-template workflows where the business requires editing.
3. ZIP for authorized bulk document download.
4. Original uploaded file format for user-owned source documents, subject to authorization and malware/storage controls.

### 49.4.4. Compliance / Statutory Reports

Where applicable:

1. PDF for human-readable report.
2. CSV/XLSX for working registers.
3. JSON for structured integrations.
4. Exact statutory upload/download format where the external authority specifies a schema.

## 49.5. Mandatory MIME-Type and HTTP Download Contract

Every real download endpoint must set the correct content type.

49.5.1. PDF:

```text
Content-Type: application/pdf
Content-Disposition: attachment; filename="safe-name.pdf"
```

49.5.2. CSV:

```text
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="safe-name.csv"
```

49.5.3. JSON:

```text
Content-Type: application/json; charset=utf-8
Content-Disposition: attachment; filename="safe-name.json"
```

49.5.4. XLSX:

```text
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="safe-name.xlsx"
```

49.5.5. DOCX:

```text
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename="safe-name.docx"
```

49.5.6. ZIP:

```text
Content-Type: application/zip
Content-Disposition: attachment; filename="safe-name.zip"
```

49.5.7. Image exports must use the actual generated format, for example `image/png` or `image/jpeg`, rather than returning a placeholder response.

49.5.8. Sensitive payroll/HR documents should use appropriate cache-control headers and must not be publicly cacheable.

## 49.6. Universal Download Acceptance Workflow

Every download button/function must follow:

`Button → validation → authentication → tenant check → object authorization → business-state check → file generation/retrieval → file integrity validation → correct MIME type → safe filename → Content-Disposition → successful response → audit event → UI success state`.

49.6.1. Failure at any stage must return a real error.

49.6.2. The frontend must not show “Downloaded”, “Generated” or “Exported” merely because a JavaScript function was called.

49.6.3. The frontend must verify the HTTP response before showing a success message.

49.6.4. A response containing JSON error data must never be saved as if it were a PDF/XLSX/DOCX/ZIP file.

49.6.5. Large exports should use streaming/asynchronous jobs rather than blocking a web request indefinitely.

49.6.6. Temporary generated files must have cleanup/retention controls.

49.6.7. Every download must prevent IDOR by re-checking ownership/role/tenant on the server.

## 49.7. Document Design Requirements — PDF

Every generated PDF must use the Workforce Intelligence Platform design system and, where relevant, company/tenant branding.

49.7.1. Approved company logo.

49.7.2. Legal company/entity name.

49.7.3. Correct company/branch address.

49.7.4. Document title.

49.7.5. Document number/reference where applicable.

49.7.6. Generation date/time/timezone where required.

49.7.7. Employee/document owner identity only where appropriate.

49.7.8. Consistent typography, spacing and table hierarchy.

49.7.9. A4/Letter page configuration according to document type and company configuration.

49.7.10. Header/footer and page numbering for multi-page documents.

49.7.11. No clipping, overlap, blank accidental pages or broken table rows.

49.7.12. Print-safe margins.

49.7.13. Confidentiality notice for sensitive HR/payroll documents.

49.7.14. Accessibility features where supported by the PDF generation stack.

49.7.15. No sample company values, fake addresses, fake statutory numbers, fake bank details or development-only labels.

## 49.8. Document Design Requirements — XLSX

Every generated workbook must have intentional business formatting rather than raw JSON-to-sheet dumping.

49.8.1. Workbook title and report name.

49.8.2. Company/tenant name.

49.8.3. Report period/filter summary.

49.8.4. Generation date/time/timezone.

49.8.5. Generated-by/audit reference where appropriate.

49.8.6. Freeze header row.

49.8.7. Consistent column widths.

49.8.8. Correct number/date/currency formats.

49.8.9. Currency values stored as numeric cells, not formatted strings.

49.8.10. Totals/subtotals clearly distinguished.

49.8.11. Filters enabled for tabular reports where useful.

49.8.12. Separate sheets for summary/detail where the report requires it.

49.8.13. Hidden technical fields must not be used to bypass authorization or expose secrets.

49.8.14. No formulas that unexpectedly fetch external data.

49.8.15. Workbook must open successfully in a standard spreadsheet application.

49.8.16. Sensitive exports must be authorized and audited.

## 49.9. Document Design Requirements — CSV

CSV is a data-exchange format, so visual design is intentionally limited.

49.9.1. UTF-8 encoding.

49.9.2. Stable column order.

49.9.3. Header row.

49.9.4. Correct escaping of commas, quotes and line breaks.

49.9.5. Consistent date/time format.

49.9.6. Consistent timezone convention.

49.9.7. Numeric values must not be accidentally converted into misleading formatted strings.

49.9.8. Formula-injection protection for spreadsheet applications when user-controlled text can begin with formula characters.

49.9.9. Safe filename.

49.9.10. Export metadata should be included only where useful and must not expose secrets.

## 49.10. Document Design Requirements — JSON

49.10.1. Valid UTF-8 JSON.

49.10.2. Stable schema/version where the export is an integration contract.

49.10.3. Machine-readable dates/timestamps.

49.10.4. Explicit null handling.

49.10.5. No password, token, session secret or unnecessary sensitive infrastructure information.

49.10.6. Include report metadata only when required by the API/export contract.

49.10.7. Validate the generated output before returning it.

## 49.11. Document Design Requirements — DOCX

For Word documents such as letters, certificates, policies and editable HR templates:

49.11.1. Company logo/header.

49.11.2. Legal company name and configured address.

49.11.3. Document title and reference number where applicable.

49.11.4. Employee identity fields appropriate to the document.

49.11.5. Effective date/version for policies.

49.11.6. Professional typography and paragraph styles.

49.11.7. Consistent headings.

49.11.8. Page margins and page numbering.

49.11.9. Signature/approval blocks where applicable.

49.11.10. Confidentiality notice where applicable.

49.11.11. No hard-coded sample company/legal information.

49.11.12. DOCX must be generated as a valid Office Open XML document and must open successfully in a standard Word-compatible application.

## 49.12. Document Design Requirements — ZIP / Bulk Download

ZIP is a container, not a document design format.

49.12.1. Archive must contain only files the requesting user is authorized to access.

49.12.2. No absolute filesystem paths.

49.12.3. No executable files unless explicitly required and separately controlled.

49.12.4. Safe entry names to prevent archive path traversal.

49.12.5. Clear top-level naming convention.

49.12.6. Include a manifest/readme only where useful.

49.12.7. Preserve source document formats.

49.12.8. Validate that every archive entry was successfully generated.

49.12.9. Failed items must be reported instead of silently omitted.

49.12.10. Temporary archives must expire and be deleted according to retention policy.

## 49.13. Design Requirements for Printable Reports and Letters

49.13.1. Print layout must be separate from normal interactive UI where necessary.

49.13.2. Hide navigation/sidebar controls during print.

49.13.3. Use print-safe colors and borders.

49.13.4. Avoid content clipping at page boundaries.

49.13.5. Repeat table headers on multi-page output where supported.

49.13.6. Use page-break rules for sections that must remain together.

49.13.7. Show company logo/name and document identity on every page when required.

49.13.8. Never treat `window.print()` alone as proof of a production PDF export.

## 49.14. Frontend Export/Download Gap Findings

49.14.1. The project contains numerous export/download function names, including `exportExcel`, `exportWord`, `exportImage`, `exportJSON`, `exportPDF`, `downloadPDF`, `downloadCurrentSlip`, `downloadAllDocsZip`, `downloadPayslip`, `downloadForm16`, `downloadIDCard`, `downloadLetter`, `downloadPolicy`, `downloadAnnualReport`, `downloadMyData` and related actions.

49.14.2. Several pages contain generic fallback/stub registrations for download/export functions. These must be treated as **NOT IMPLEMENTED** until a real authenticated business/API path is demonstrated.

49.14.3. A generic success toast such as “CSV downloaded”, “Report exported” or “downloadAllDocsZip done” is not evidence of file generation.

49.14.4. `exportExcel` must not be marked complete merely because the `xlsx` library exists; the project currently has XLSX parsing support but no verified production XLSX export endpoint.

49.14.5. `exportWord` must not be marked complete merely because DOCX parsing or a DOCX installation guide exists.

49.14.6. `downloadAllDocsZip` must not be marked complete until a real server-side archive is generated and authorization is enforced for every file in the archive.

49.14.7. `exportImage` must not be marked complete until an actual image is generated and downloaded successfully.

## 49.15. Backend Download Evidence and Gaps

49.15.1. Attendance CSV backend response exists with `text/csv` and attachment disposition.

49.15.2. Payroll CSV backend response exists with `text/csv` and attachment disposition.

49.15.3. Report JSON backend response exists with `application/json` and attachment disposition.

49.15.4. Report CSV backend response exists with `text/csv` and attachment disposition.

49.15.5. Payslip PDF backend response exists with `application/pdf` and attachment disposition.

49.15.6. XLSX backend export was **not verified** in the audited backend controllers/routes.

49.15.7. DOCX backend export was **not verified** in the audited backend controllers/routes.

49.15.8. ZIP backend archive generation was **not verified** in the audited backend controllers/routes.

49.15.9. Therefore, the current project should not be represented as supporting all advertised download formats until the missing implementations are added and tested.

## 49.16. XLSX Export Implementation Requirement

Add a real server-side XLSX export service using the already available spreadsheet library or another approved library.

Required flow:

`Authorized request → query filtered data → validate tenant/permissions → generate workbook → apply design → validate workbook → stream/download → audit event`.

Required tests:

1. Workbook opens successfully.
2. Sheet names are correct.
3. Headers are correct.
4. Numeric cells are numeric.
5. Dates are dates/consistent values.
6. Currency formatting is correct.
7. Filters/frozen headers work where required.
8. Totals reconcile with the source report.
9. Unauthorized records are absent.
10. Filename and MIME type are correct.

## 49.17. DOCX Export Implementation Requirement

Add a real DOCX generation service for functions that advertise Word downloads.

Required flow:

`Authorized request → load approved template → merge company/employee/report data → validate permissions → generate DOCX → validate document → download → audit`.

Required tests:

1. DOCX opens successfully.
2. Company logo appears.
3. Company legal name/address are configuration driven.
4. Employee fields are correct.
5. Dates and document references are correct.
6. Page layout is correct.
7. No placeholder tokens remain.
8. No sample company data remains.
9. Unauthorized data cannot be merged.
10. Download MIME type and filename are correct.

## 49.18. ZIP Export Implementation Requirement

Add a secure archive service for bulk downloads.

Required controls:

1. Server-side authorization per requested file.
2. Tenant isolation.
3. Safe archive entry names.
4. Archive size/timeout limits.
5. Asynchronous generation for large archives.
6. Progress/status reporting.
7. Failed-entry reporting.
8. Temporary storage cleanup.
9. Audit event.
10. Expiration of generated archive links.

## 49.19. File-Type Verification Matrix for Release

| Function | PDF | CSV | XLSX | JSON | DOCX | ZIP | Print | Status Gate |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Attendance report | Required | Required | Recommended | Optional | No | Optional | Required | LIVE TEST REQUIRED |
| Payroll register | Required | Required | Required | Optional | No | Optional | Required | LIVE TEST REQUIRED |
| Payslip | Required | No | Optional | No | Optional | Bulk only | Required | LIVE TEST REQUIRED |
| Employee data export | Optional | Required | Required | Required | No | Optional | No | LIVE TEST REQUIRED |
| Compliance report | Required | Required | Required | Optional | Optional | Optional | Required | LIVE TEST REQUIRED |
| HR letters/certificates | Required | No | No | No | Required if editable | Optional | Required | LIVE TEST REQUIRED |
| Bulk documents | Optional | No | No | No | Preserve originals | Required | No | LIVE TEST REQUIRED |
| Audit/activity export | Optional | Required | Required | Required | No | Optional | Optional | LIVE TEST REQUIRED |

**Note:** “Required” in this matrix means the format is required by the documented product capability/use case, not that it is currently implemented.

## 49.20. Missing Download/Export Functions Requiring Real Implementation

At minimum, the following advertised functions require individual verification and real API wiring before being called complete:

1. `downloadComplianceReport`
2. `downloadMyData`
3. `downloadDiversityReport`
4. `downloadForm16`
5. `downloadIDCard`
6. `downloadLetter`
7. `downloadPolicy`
8. `downloadAnnualReport`
9. `downloadPayslip`
10. `downloadCertificate`
11. `downloadAllDocsZip`
12. `downloadCurrentSlip`
13. `exportExcel`
14. `exportWord`
15. `exportImage`
16. `exportJSON`
17. `exportPDF`
18. `exportReport`
19. `exportAnalytics`
20. `exportSkillMatrix`
21. `exportActivityLog`
22. `exportMonitor`
23. `exportAlerts`
24. `exportGrievances`
25. `exportThreatLog`
26. `exportDEIReport`
27. `exportJoiningChecklist`
28. `downloadBonusRegister`
29. `downloadMinWagesReport`
30. `downloadOrgChart`

Each function must be classified individually as **REAL**, **PARTIAL**, **STUB/FALLBACK**, **MISSING**, or **LIVE TEST REQUIRED** after endpoint-level verification.

## 49.21. Upload Format vs Download Format — Do Not Confuse

49.21.1. The project supports upload/import formats including CSV, XLSX/XLS, PDF, DOC/DOCX and image/audio types in the file parser/upload layer.

49.21.2. Upload support does not automatically create a matching download/export capability.

49.21.3. The product requirements must maintain separate matrices for:

- Upload/import.
- Preview/view.
- Edit.
- Replace.
- Download/export.
- Print.
- Share.
- Delete/retention.

49.21.4. Every row must have a real implementation status and evidence.

## 49.22. Design-System Requirements Across All Downloadable Documents

All company-facing documents must inherit the same configured design system where applicable:

49.22.1. Company logo.

49.22.2. Legal entity name.

49.22.3. Brand colors with contrast-safe alternatives.

49.22.4. Typography.

49.22.5. Consistent heading hierarchy.

49.22.6. Consistent table borders and spacing.

49.22.7. Company/branch address.

49.22.8. Document title/reference.

49.22.9. Generated date/time/timezone where required.

49.22.10. Confidentiality/privacy notice for sensitive documents.

49.22.11. Footer/page number/version where applicable.

49.22.12. No development labels, stale version names, fake data or placeholder tokens.

49.22.13. Light/dark UI themes must not change the underlying official PDF/DOCX corporate document identity unless the document format explicitly supports a user-selectable theme.

49.22.14. Print output must remain readable in grayscale as well as color where operationally necessary.

## 49.23. Final Gap Closure Checklist

Before marking downloads/exports complete:

- [ ] Every download button maps to a real implementation or is clearly marked unavailable.
- [ ] No generic stub can report a false download success.
- [ ] PDF generation verified.
- [ ] CSV generation verified.
- [ ] JSON generation verified.
- [ ] XLSX generation implemented and verified.
- [ ] DOCX generation implemented and verified where advertised.
- [ ] ZIP generation implemented and verified where advertised.
- [ ] Image export implemented and verified where advertised.
- [ ] Correct MIME types verified.
- [ ] Safe filenames verified.
- [ ] Authorization/tenant/ownership checks verified.
- [ ] IDOR tests passed.
- [ ] File integrity/openability tests passed.
- [ ] Totals reconcile with database/business records.
- [ ] Sensitive documents are not publicly cacheable.
- [ ] Audit events are generated after successful operations.
- [ ] Temporary files are cleaned up.
- [ ] Bulk operations handle partial failure correctly.
- [ ] UI success messages are tied to actual HTTP/file success.
- [ ] Document design is company-configurable and consistent.
- [ ] All project Markdown documentation is synchronized with the implementation.
- [ ] Final `.md` master is the canonical audit/requirements document.

## 49.24. Final Status

**DOWNLOAD / EXPORT AUDIT: PARTIAL — CSV, JSON and PDF have real implementation evidence; XLSX, DOCX and ZIP export require implementation or endpoint-level proof.**

**DOCUMENT DESIGN AUDIT: REQUIREMENTS EXPANDED — PDF, XLSX, CSV, JSON, DOCX, ZIP, print and image-export design/validation requirements are now explicitly specified.**

**MARKDOWN DOCUMENTATION AUDIT: AVAILABLE — the project contains multiple `.md` documentation files and this master remains the canonical consolidated audit.**

**PRODUCTION RULE:** No download/export function may be marked COMPLETE from a button name, dependency, parser, UI toast, or stub registration alone. It must pass the full `UI → authenticated API → authorization → generation/retrieval → valid file → correct MIME/filename → audit → error handling` acceptance chain.


# 50. Second-Pass Remaining Project Gaps Found During Format/Design Audit

## 50.1. Version / Branding Cleanup

50.1.1. The audited project still contains visible and code-comment references to `v12`, including UI logo/version labels and printable report headings.

50.1.2. Production branding requirement: use **Workforce Intelligence Platform** as the product name and remove obsolete development/version labels from user-facing screens, printable documents, generated reports and production documentation unless a controlled document-version field is specifically required.

50.1.3. Internal release/build identifiers may remain in technical deployment metadata, but must not be confused with the company/product display name.

## 50.2. Universal Stub / Fallback Cleanup

50.2.1. The second-pass project scan confirms numerous frontend generic fallback/stub registrations.

50.2.2. These are especially important for export/download actions because a fallback can display a successful toast without generating a file.

50.2.3. Replace every production business stub with:

`UI action → validation → authenticated API → authorization → database/business operation → real response → UI state → audit event`.

50.2.4. For unsupported functions, the UI must explicitly show **Not available / Configuration required** rather than falsely reporting success.

## 50.3. Format Capability Boundary

50.3.1. The project has a strong file **input/parser** capability for PDF, DOCX, XLSX/XLS, CSV, text/JSON and several media types.

50.3.2. The project has real evidence for selected **output** formats: PDF, CSV and JSON.

50.3.3. XLSX, DOCX and ZIP must be implemented as true output capabilities before those buttons are advertised as production-ready.

50.3.4. This distinction must be preserved in future audits so that import support is never counted as export support.

## 50.4. Documentation Synchronization

50.4.1. All project Markdown files must be reviewed for stale version labels, obsolete feature claims, old setup instructions and claims of completed features that remain stubs.

50.4.2. The master audit must remain synchronized with actual code evidence.

50.4.3. If a function is marked COMPLETE in documentation, there must be a corresponding verified implementation and test evidence.

50.4.4. Installation/setup documentation must use the current product name and current commands/configuration.

## 50.5. Final Second-Pass Status

**REMAINING GAPS CONFIRMED:**

1. XLSX export implementation/verification.
2. DOCX export implementation/verification where advertised.
3. ZIP bulk export implementation/verification.
4. Image export implementation/verification where advertised.
5. Individual verification of every frontend download/export function.
6. Replacement/removal of generic success stubs for production actions.
7. Removal of obsolete user-facing `v12` branding/version labels.
8. Synchronization of all Markdown documentation with actual implementation.
9. Live browser/database/file-open verification for every production download format.
10. Final security/authorization/IDOR testing for every export endpoint.

**Overall status:** `SYSTEMATICALLY AUDITED / GAPS ADDED TO MASTER / IMPLEMENTATION AND LIVE VERIFICATION REQUIRED`.

# 51. Employee Loan & Salary Advance Application Facility

**Scope:** Employee loan / salary advance application, eligibility, approval, disbursement, repayment, payroll deduction, outstanding balance, statements, documents, notifications, security, audit, and employee/admin self-service.

## 51.1 Availability Result

51.1.1. **CURRENT DOCUMENTATION RESULT: MISSING AS A FUNCTIONAL FACILITY.**

51.1.2. The master audit previously mentioned `Loan/Salary Advance` only as a possible payroll deduction line. That does **not** establish that an employee can actually apply for, track, approve, disburse, repay, or manage a loan/salary advance through the platform.

51.1.3. No verified end-to-end loan facility was found in the master documentation covering application → eligibility → approval → disbursement → repayment schedule → payroll deduction → outstanding balance → closure.

51.1.4. Therefore the facility must be treated as **MISSING / REQUIREMENT ADDED / IMPLEMENTATION REQUIRED**, unless live project evidence later proves otherwise.

51.1.5. The platform must not display a working Loan/Salary Advance button that only opens a placeholder or reports a false success.

## 51.2 Supported Facility Types

The company configuration should be able to enable one or more of the following:

1. Salary advance.
2. Employee emergency advance.
3. Employee welfare loan.
4. Company personal loan, where company policy permits.
5. Festival/seasonal advance, where company policy permits.
6. Medical/emergency assistance advance, where company policy permits.
7. Education or relocation advance, where company policy permits.
8. Other configurable employer-funded loan/advance products.

**Rule:** The platform must not imply that a company offers a loan product unless that facility is enabled by authorized company/payroll/HR configuration.

## 51.3 Employee Application

The employee self-service area should provide:

1. `Apply for Loan / Salary Advance` action.
2. Facility/product selection.
3. Requested amount.
4. Purpose/reason.
5. Requested disbursement date.
6. Preferred repayment tenure.
7. Proposed EMI/installment amount, where applicable.
8. Bank/payment destination from verified employee records.
9. Supporting-document upload where required.
10. Employee declaration and consent.
11. Policy acknowledgement.
12. Application preview before submission.
13. Submit application.
14. Application reference number.
15. Application status tracking.
16. Withdraw/cancel application before approval where policy permits.

The employee must not be able to modify an approved amount or repayment schedule directly.

## 51.4 Eligibility Rules

Eligibility must be configurable rather than hard-coded. Possible rules include:

1. Minimum length of service.
2. Employment status.
3. Permanent/contract/other employment category.
4. Probation status.
5. Minimum salary.
6. Maximum advance/loan amount.
7. Maximum amount as a percentage of salary.
8. Maximum number of active loans.
9. Existing outstanding loan balance.
10. Existing payroll deductions.
11. Maximum permissible deduction percentage.
12. Prior repayment/default history, where legally and contractually appropriate.
13. Department/location/legal entity eligibility.
14. Company-specific employee grade eligibility.
15. Required manager/HR/payroll approval.
16. Required supporting documents.
17. Cooling-off/reapplication period.

Eligibility failure must return a clear reason and must not expose sensitive information about other employees.

## 51.5 Loan/Advance Application Status

Each application should support controlled statuses such as:

1. Draft.
2. Submitted.
3. Eligibility Check.
4. Pending Manager Approval.
5. Pending HR Approval.
6. Pending Payroll Approval.
7. Approved.
8. Partially Approved.
9. Rejected.
10. Cancelled.
11. Disbursement Pending.
12. Disbursed.
13. Active Repayment.
14. Fully Repaid.
15. Written Off/Closed, only through an authorized workflow where permitted.

Every status transition must be timestamped and auditable.

## 51.6 Approval Workflow

The platform should support configurable approval chains:

1. Employee submits application.
2. System performs automated eligibility checks.
3. Manager reviews where required.
4. HR reviews where required.
5. Payroll/Finance reviews financial impact.
6. Authorized approver approves or rejects.
7. Maker-checker/segregation-of-duties controls apply for sensitive approvals.
8. Approved amount and repayment terms are locked.
9. Disbursement is authorized.
10. Employee is notified.

Approvers must see only the information necessary for their role.

## 51.7 Approval Controls

1. No employee may approve their own loan/advance.
2. A payroll administrator must not bypass configured approval rules without an audited emergency procedure.
3. Changes to eligibility rules or loan limits require privileged configuration access.
4. Changes to an approved application require a controlled amendment/reapproval process.
5. Rejection requires a configurable reason category and optional comments.
6. Approval must create an immutable decision record.

## 51.8 Loan Terms

The approved loan/advance record should contain:

1. Loan/application ID.
2. Employee ID.
3. Facility/product code.
4. Approved amount.
5. Disbursed amount.
6. Interest rate, if applicable.
7. Interest type, if applicable.
8. Processing fee, if applicable.
9. Repayment start date.
10. Repayment end date.
11. Tenure in months/pay periods.
12. EMI/installment amount.
13. Number of installments.
14. Final installment amount, if rounding creates a difference.
15. Repayment frequency.
16. Payroll deduction component.
17. Legal entity/company.
18. Branch/location, where relevant.
19. Currency.
20. Approved-by reference.
21. Approval date.
22. Disbursement date.
23. Current status.

## 51.9 Repayment Schedule

A real facility must generate a repayment schedule instead of only storing a total balance.

The schedule should identify for every installment:

1. Installment number.
2. Due/payroll date.
3. Opening principal.
4. Interest, if applicable.
5. Fees, if applicable.
6. Principal repayment.
7. Total installment.
8. Payroll deduction reference.
9. Amount actually recovered.
10. Remaining principal.
11. Remaining total balance.
12. Status: scheduled, deducted, paid, partially paid, missed, adjusted, waived, or reversed.

Rounding rules must be deterministic and the final installment must reconcile exactly to the outstanding balance.

## 51.10 Payroll Integration

Loan/advance repayment must integrate with payroll as a controlled deduction component.

Required controls:

1. Approved repayment schedule feeds the payroll calculation.
2. Payroll must not independently invent an installment amount.
3. Deduction must reference the loan/advance ID.
4. Payslip should show the approved loan/advance deduction where company policy requires it.
5. Payroll deduction must reduce the outstanding balance only after the payroll result is finalized according to the configured rule.
6. Reversed payroll must reverse or reconcile the associated repayment transaction.
7. Multiple active loans must remain separately identifiable.
8. Deduction limits must be validated against company/legal configuration.
9. LOP, unpaid leave, final settlement and insufficient-pay scenarios require defined recovery rules.

## 51.11 Disbursement

If the platform performs or records disbursement:

1. Verify the employee's approved payment destination.
2. Do not expose full bank account credentials in ordinary UI/logs.
3. Record approved amount and actual disbursed amount separately.
4. Record disbursement date/time.
5. Record payment reference/UTR where applicable.
6. Record disbursement status.
7. Handle failed/reversed payments.
8. Prevent duplicate disbursement.
9. Require reconciliation between approved, disbursed and payment-file amounts.
10. Audit every disbursement action.

If actual bank transfer is performed by an external finance/banking system, the platform must clearly distinguish `Approved`, `Payment Initiated`, `Disbursed`, `Failed`, and `Reconciled` rather than claiming the money was transferred merely because approval succeeded.

## 51.12 Employee Loan Dashboard

Employee self-service should provide:

1. Active loans/advances.
2. Application history.
3. Current outstanding principal.
4. Total outstanding balance.
5. Next installment.
6. Next deduction date.
7. Remaining installments.
8. Original approved amount.
9. Amount disbursed.
10. Amount repaid.
11. Repayment progress.
12. Current status.
13. Application/loan reference.
14. View repayment schedule.
15. Download statement/document where enabled.
16. Support/contact path for disputes.

## 51.13 Admin / HR / Payroll Dashboard

Authorized users should be able to:

1. Search applications.
2. Filter by status, company, branch, department, employee, date and facility.
3. Review eligibility results.
4. Approve/reject according to permission.
5. View repayment schedules.
6. Record disbursement/reconciliation status.
7. Correct controlled data through an audited workflow.
8. Pause deductions where authorized.
9. Process approved waivers/adjustments.
10. View outstanding balances.
11. Export authorized loan reports.
12. Generate reconciliation reports.
13. Audit application and approval history.

## 51.14 Early Repayment / Closure

Where company policy permits:

1. Employee may request early settlement.
2. System calculates the approved settlement amount.
3. Payroll/Finance approves settlement.
4. Payment/recovery is recorded.
5. Outstanding balance becomes zero after reconciliation.
6. Loan status changes to `Fully Repaid`/`Closed`.
7. Future payroll deductions are stopped.
8. Closure statement can be generated.
9. The original repayment history remains immutable.

## 51.15 Final Settlement / Employee Exit

When an employee is offboarded:

1. Active loan/advance status must be checked.
2. Outstanding amount must be calculated from the authoritative ledger.
3. Final payroll/settlement must apply only authorized recovery rules.
4. Any balance not recoverable from final settlement must follow company policy.
5. Employee must receive the applicable statement/communication.
6. Offboarding must not delete historical loan records required for retention.
7. Former employee access must follow the company's offboarding policy.

## 51.16 Supporting Documents

If documents are required, support:

1. Upload.
2. View.
3. Replace before approval, where permitted.
4. Delete before approval, where permitted.
5. Download.
6. File type/size validation.
7. Malware/security scanning policy.
8. Access control.
9. Document version/history.
10. Audit event.

Sensitive supporting documents must not be publicly accessible through predictable URLs.

## 51.17 Loan Documents / Download Formats

Where the company offers formal loan/advance documents, the system should support the formats actually implemented and verified:

| Document | PDF | DOCX | XLSX/CSV | ZIP | Status Rule |
|---|---|---|---|---|---|
| Loan/Advance Approval Letter | Required where offered | Optional template generation | No | No | Must be real file generation |
| Repayment Schedule | Required | Optional | Recommended | No | Values must reconcile with ledger |
| Loan Statement | Recommended | Optional | Recommended | No | Must contain authorized employee data only |
| Closure/Settlement Letter | Recommended | Optional | No | No | Generated only after closure/reconciliation |
| Bulk Loan Report | Optional | No | Recommended | Optional | Large exports should be asynchronous |
| Supporting Documents Archive | No | No | No | Optional | ZIP only if securely implemented |

A format must not be shown as available merely because a frontend button exists.

## 51.18 Download / Export Acceptance

Every loan-related download must verify:

1. Authentication.
2. Tenant/company authorization.
3. Employee ownership or authorized HR/payroll role.
4. Document status.
5. File generation success.
6. Correct MIME type.
7. Safe filename.
8. `Content-Disposition`.
9. Sensitive-data cache controls.
10. File integrity/openability.
11. Audit event where required.
12. Failure response when generation fails.

## 51.19 Notifications

The facility should support configurable notifications for:

1. Application submitted.
2. Eligibility failed.
3. Approval requested.
4. Approved.
5. Rejected.
6. Disbursement initiated.
7. Disbursement completed.
8. Disbursement failed.
9. Upcoming installment.
10. Payroll deduction posted.
11. Missed/failed recovery.
12. Loan fully repaid.
13. Closure statement available.

Notifications must not disclose unnecessary salary, bank or sensitive financial details.

## 51.20 Security & Privacy

1. Enforce tenant isolation.
2. Enforce object-level authorization on every loan/application endpoint.
3. Prevent IDOR by never trusting employee/loan IDs supplied only by the browser.
4. Protect bank/payment information.
5. Encrypt sensitive data in transit and at rest according to the deployment architecture.
6. Apply least privilege.
7. Use maker-checker controls for approval/disbursement where required.
8. Rate-limit sensitive application endpoints.
9. Validate uploaded documents.
10. Do not log full bank credentials or unnecessary financial payloads.
11. Audit view, approval, rejection, amendment, disbursement, repayment, reversal and closure.
12. Define retention/deletion rules for loan applications and financial records.

## 51.21 Audit Events

Recommended event names include:

- `LOAN_APPLICATION_CREATED`
- `LOAN_APPLICATION_SUBMITTED`
- `LOAN_ELIGIBILITY_CHECKED`
- `LOAN_APPROVED`
- `LOAN_REJECTED`
- `LOAN_AMENDED`
- `LOAN_DISBURSEMENT_INITIATED`
- `LOAN_DISBURSED`
- `LOAN_DISBURSEMENT_FAILED`
- `LOAN_REPAYMENT_POSTED`
- `LOAN_REPAYMENT_REVERSED`
- `LOAN_EARLY_SETTLEMENT_REQUESTED`
- `LOAN_CLOSED`
- `LOAN_DOCUMENT_DOWNLOADED`

Each event should contain actor, target ID, timestamp, result, reason/reference and correlation ID without unnecessarily storing full financial payloads in ordinary logs.

## 51.22 Data Model Requirements

A minimum implementation should define entities/tables equivalent to:

1. `loan_products`
2. `loan_eligibility_rules`
3. `loan_applications`
4. `loan_approvals`
5. `employee_loans`
6. `loan_repayment_schedule`
7. `loan_repayment_transactions`
8. `loan_disbursements`
9. `loan_documents`
10. `loan_audit_events` or the central audit-log system

Key fields should include:

- `loan_application_id`
- `loan_id`
- `employee_id`
- `legal_entity_id`
- `branch_id`
- `product_code`
- `requested_amount`
- `approved_amount`
- `disbursed_amount`
- `interest_rate`
- `tenure`
- `installment_amount`
- `repayment_frequency`
- `start_date`
- `end_date`
- `outstanding_principal`
- `outstanding_balance`
- `status`
- `approved_by`
- `approved_at`
- `disbursed_at`
- `closed_at`
- `created_at`
- `updated_at`

## 51.23 API / Function Requirements

Illustrative authenticated API capabilities:

1. `POST /api/loans/applications`
2. `GET /api/loans/applications`
3. `GET /api/loans/applications/:id`
4. `POST /api/loans/applications/:id/submit`
5. `POST /api/loans/applications/:id/cancel`
6. `POST /api/loans/applications/:id/approve`
7. `POST /api/loans/applications/:id/reject`
8. `GET /api/loans/:id`
9. `GET /api/loans/:id/schedule`
10. `GET /api/loans/:id/statement`
11. `POST /api/loans/:id/disburse` or external-payment reconciliation endpoint
12. `POST /api/loans/:id/repayments`
13. `POST /api/loans/:id/settlement`
14. `POST /api/loans/:id/close`
15. `GET /api/loans/:id/documents/:documentId/download`

These are requirements, not proof that the current project already contains the routes. Existing routes must be mapped and verified before being marked implemented.

## 51.24 UI Requirements

Employee UI should include:

1. Loan & Salary Advance menu item.
2. Product cards with policy/eligibility summary.
3. Application form.
4. Eligibility result.
5. Application timeline/status.
6. Approval/decision information.
7. Active-loan dashboard.
8. Repayment schedule table.
9. Outstanding balance.
10. Downloadable statement/documents.
11. Accessible error and success states.
12. Mobile-responsive layout.
13. Light/dark/system theme support consistent with the main design system.
14. Keyboard/focus/hover/disabled states.
15. No misleading enabled button where the company has disabled the facility.

## 51.25 Payroll / Payslip Integration

When an approved repayment is deducted from salary, the payslip should identify the configured deduction label, for example:

`Employee Loan / Salary Advance Recovery — [Installment Amount]`

The payslip should not expose unnecessary internal loan data. The deduction must reconcile with the repayment ledger and payroll run.

## 51.26 Reporting

Authorized reporting should include:

1. Applications by status.
2. Approved/disbursed totals.
3. Outstanding principal.
4. Outstanding balance.
5. Monthly recovery.
6. Delinquent/missed recovery cases, where applicable.
7. Early settlements.
8. Closed loans.
9. Department/company/branch summaries subject to access control.
10. Payroll reconciliation.

Exports must follow the master download-format and security requirements.

## 51.27 Testing & Acceptance Matrix

Before marking the facility COMPLETE, test at minimum:

1. Eligible employee can submit an application.
2. Ineligible employee is correctly blocked with a reason.
3. Employee cannot submit duplicate active applications where prohibited.
4. Employee cannot approve their own application.
5. Manager/HR/payroll permissions are enforced.
6. Cross-employee IDOR is blocked.
7. Cross-tenant access is blocked.
8. Approved amount is immutable without controlled amendment.
9. Repayment schedule reconciles exactly to approved terms.
10. Payroll deduction matches the repayment schedule.
11. Payroll reversal correctly reconciles repayment.
12. Outstanding balance is correct after each repayment.
13. Early settlement closes the loan correctly.
14. Final settlement handles outstanding recovery according to policy.
15. Failed disbursement is not reported as successful.
16. Duplicate disbursement is prevented.
17. Loan statement contains correct transactions.
18. PDF/document download is valid and authorized.
19. Unauthorized document download is blocked.
20. Audit events are generated for sensitive actions.
21. Notifications reflect the actual transaction result.
22. Mobile/accessibility requirements pass.
23. No fake success toast appears after failed operations.
24. Retention/deletion rules are enforced.

## 51.28 Availability Decision

**Current result: `MISSING / NOT VERIFIED AS AVAILABLE`.**

The existing documentation only establishes that `Loan/Salary Advance` can appear as a payroll deduction. It does **not** establish a complete employee loan application facility.

Therefore:

- **Loan application:** MISSING.
- **Salary advance application:** MISSING.
- **Eligibility engine:** MISSING / NOT VERIFIED.
- **Approval workflow:** MISSING / NOT VERIFIED.
- **Disbursement workflow:** MISSING / NOT VERIFIED.
- **Repayment schedule:** MISSING / NOT VERIFIED.
- **EMI/installment tracking:** MISSING / NOT VERIFIED.
- **Outstanding balance:** MISSING / NOT VERIFIED.
- **Loan statement:** MISSING / NOT VERIFIED.
- **Early settlement:** MISSING / NOT VERIFIED.
- **Loan closure:** MISSING / NOT VERIFIED.
- **Loan documents/downloads:** MISSING / NOT VERIFIED.
- **Loan notifications:** MISSING / NOT VERIFIED.
- **Loan-specific audit events:** MISSING / NOT VERIFIED.
- **Payroll deduction integration:** PARTIAL concept only; live implementation must be verified.

**Production acceptance rule:** Do not mark Loan/Salary Advance as COMPLETE until the full workflow passes live database/browser tests from application through approval, disbursement, payroll recovery, statement generation and closure, with authorization, audit, download and reconciliation tests passing.

## 52. CIBIL / Credit-Readiness, Future Loan Eligibility & Maximum Loan Facility

### 52.1 Availability Result

**Current result: `MISSING / NOT VERIFIED AS AVAILABLE`.**

The existing loan section does not provide a CIBIL/credit-readiness facility that allows an employee to understand, before submitting a future employer loan or salary-advance application:

1. Whether the employee appears eligible.
2. Why the employee may be eligible or ineligible.
3. The maximum amount the employee may be eligible to request under company policy.
4. The estimated affordable EMI.
5. Whether the current profile is likely to pass the configured employer credit policy.
6. Which conditions must be improved before applying.
7. Whether the employee has a complete application profile.
8. Whether an actual bureau check is required and, if so, whether the employee has provided the required consent.

This facility must be added as a **pre-application credit-readiness and eligibility feature**, not as an automatic loan approval engine.

### 52.2 CIBIL Definition and Correct System Interpretation

TransUnion CIBIL states that a CIBIL Score is a three-digit numeric summary derived from credit-history information and ranges from **300 to 900**. A higher score generally improves the chances of a loan being reviewed/approved, but the lending decision is made by the lender and is not decided by CIBIL. citeturn0search0turn0search2

Therefore the Workforce Intelligence Platform must use the following terminology:

- `CIBIL Score` — the reported bureau score when legitimately obtained.
- `CIBIL Report` — the associated credit-information report, where the authorized integration permits access.
- `Credit Readiness` — an internal assessment based on configured policy and available information.
- `Pre-Eligibility` — a preliminary policy result before final approval.
- `Maximum Eligible Amount` — the maximum amount calculated by the employer's configured loan policy and affordability rules.
- `Estimated Approval Likelihood` — optional internal guidance only; it must never be represented as a guaranteed sanction.
- `Final Approval` — a controlled decision by the authorized employer/loan committee/HR/payroll authority according to policy.

The application must explicitly state that a CIBIL score alone does not guarantee approval, interest rate, tenure, or maximum loan amount. CIBIL itself does not decide whether a loan is sanctioned. citeturn0search0

### 52.3 Employee Self-Service Credit-Readiness Dashboard

Add a self-service page/card such as:

**Loan & Credit Readiness**

Display, where legally and technically permitted:

1. CIBIL Score — masked or fully shown according to privacy policy.
2. Score source.
3. Score/report retrieval date.
4. Report freshness/status.
5. CIBIL Score range: 300–900.
6. Credit-readiness status.
7. Current employer-loan exposure.
8. Current salary-advance exposure.
9. Existing payroll deductions relevant to affordability.
10. Maximum policy-eligible loan amount.
11. Maximum estimated EMI.
12. Maximum policy tenure.
13. Current estimated EMI capacity.
14. Existing outstanding loan balance.
15. Number of active employer loans.
16. Eligibility blockers.
17. Missing documents/profile information.
18. Recommended next action.
19. Last eligibility calculation timestamp.
20. Policy version used for the calculation.

Example status labels:

- `READY TO APPLY`
- `ELIGIBLE — SUBJECT TO FINAL APPROVAL`
- `PARTIALLY ELIGIBLE`
- `NOT CURRENTLY ELIGIBLE`
- `CREDIT INFORMATION REQUIRED`
- `CIBIL CONSENT REQUIRED`
- `PROFILE INFORMATION INCOMPLETE`
- `MANUAL REVIEW REQUIRED`

### 52.4 CIBIL Consent and Authorized Access

The system must never silently retrieve, scrape, purchase, or infer a CIBIL report on behalf of an employee.

If an actual bureau integration is implemented, require:

1. Explicit employee consent before the bureau request.
2. Clear disclosure of why the information is being requested.
3. Identification of the organization/service making the request.
4. Consent timestamp.
5. Consent version.
6. Consent purpose.
7. Scope of requested information.
8. Consent withdrawal handling where applicable.
9. Provider/API transaction reference.
10. Retrieval timestamp.
11. Data-retention period.
12. Access audit trail.
13. Encryption in transit and at rest.
14. Strict employee/HR/payroll authorization.
15. No exposure of the complete report to users who do not need it.

Use an approved, contractually authorized credit-information provider/API. Do not implement browser scraping of a consumer CIBIL account.

### 52.5 No-Bureau / NA / NH Handling

The system must support cases where a bureau score is unavailable or the report indicates insufficient/no scorable credit history.

Do not automatically treat `NA` or `NH` as a bad credit score. CIBIL explains that such results can indicate no or insufficient credit history or limited recent credit activity, although some lenders may have policies that restrict lending where there is no established credit track record. citeturn0search6

Required statuses:

1. `NO SCORE / NA`
2. `NO HISTORY / NH`
3. `REPORT UNAVAILABLE`
4. `CONSENT NOT PROVIDED`
5. `BUREAU SERVICE TEMPORARILY UNAVAILABLE`
6. `REPORT DATA STALE`
7. `REPORT DISPUTED`
8. `SCORE AVAILABLE`

The employer policy must decide how each status affects eligibility; the UI must explain the reason rather than simply displaying `Rejected`.

### 52.6 CIBIL Score Bands Must Be Configurable

Do not hard-code a universal company rule such as `750 = automatic approval`.

CIBIL describes the score as ranging from 300 to 900 and notes that higher scores improve the chances of approval; its current educational material also describes 700+ as generally good. citeturn0search1turn0search2

The platform must instead allow authorized administrators to configure company/product-specific policy bands, for example:

| Configurable Band | Example System Interpretation | Final Decision |
|---|---|---|
| 800–900 | Strong credit profile | Policy + affordability + approval workflow |
| 750–799 | Good/strong profile | Policy + affordability + approval workflow |
| 700–749 | Review/standard profile | Policy + affordability + possible manual review |
| 650–699 | Higher-risk review | Additional rules/manual review |
| 300–649 | High-risk review | Policy may restrict or require manual review |
| NA/NH | No/insufficient score | Apply company-specific no-score policy |

These values are illustrative policy defaults only and must not be presented as CIBIL approval guarantees.

### 52.7 Future Loan Pre-Eligibility — Employee Flow

The employee should be able to use a **Check My Future Loan Eligibility** function before creating a formal application.

Process:

1. Employee opens `Loan & Credit Readiness`.
2. Employee selects loan/advance product.
3. System loads the current product rules.
4. System checks employee status and service eligibility.
5. System checks salary and payroll information.
6. System checks existing employer loans and salary advances.
7. System checks current payroll deductions.
8. System checks affordability/FOIR or the configured employer affordability metric.
9. System checks configured tenure limits.
10. System checks requested amount against the product maximum.
11. If authorized CIBIL data is available, system applies the configured credit-policy rule.
12. System calculates the maximum policy-eligible amount.
13. System calculates an indicative EMI range.
14. System identifies blockers and conditions.
15. System displays a preliminary result.
16. Employee may proceed to application if eligible.
17. Formal submission starts the controlled approval workflow.

The pre-check should not silently create a formal loan application.

### 52.8 Maximum Eligible Loan Amount Calculation

The platform must calculate the maximum eligible amount using a transparent, configurable policy engine rather than using CIBIL alone.

At minimum, the calculation should consider:

1. Product maximum.
2. Employee salary/basic salary as configured by policy.
3. Net salary or eligible income.
4. Existing employer-loan balance.
5. Existing salary advances.
6. Existing payroll deductions.
7. Maximum permissible deduction/FOIR threshold.
8. Minimum take-home salary requirement.
9. Employee service duration.
10. Employment status.
11. Probation status.
12. Notice/exit status.
13. Grade/designation, if legitimately used by policy.
14. Legal entity/company.
15. Branch/location, if policy requires it.
16. Product-specific maximum.
17. Product-specific minimum.
18. Maximum tenure.
19. Interest rate, if applicable.
20. Fees/charges, if applicable.
21. CIBIL/credit-policy threshold where the employer has chosen to use it.
22. Current outstanding exposure.
23. Existing application exposure.
24. Recovery capacity.
25. Any legally required restrictions applicable to the product.

Conceptual calculation:

`Maximum Eligible Amount = MIN(Product Cap, Policy Cap, Affordability Cap, Employee Exposure Cap, Risk/Eligibility Cap)`

The actual formula must be configurable by product and documented in the policy version used for each decision.

### 52.9 EMI / Affordability Calculation

The pre-eligibility engine must calculate an indicative EMI or recovery amount before the employee submits the application.

Required inputs:

1. Requested/max eligible principal.
2. Interest rate, if applicable.
3. Tenure.
4. Repayment frequency.
5. Existing deductions.
6. Maximum permissible payroll deduction.
7. Minimum take-home salary.
8. Existing loan repayments.
9. Grace period, if applicable.
10. Fees, if applicable.

Display:

- Requested amount.
- Maximum eligible amount.
- Estimated EMI/installment.
- Existing deductions.
- Estimated total deductions after new loan.
- Estimated take-home after deduction.
- Maximum permitted deduction.
- Remaining affordability headroom.

All monetary calculations must use decimal-safe financial arithmetic and defined rounding rules.

### 52.10 Approval Prediction Must Be Clearly Labeled

If the platform provides an employee-facing prediction, it must not say:

`Loan Approved` before the actual approval workflow completes.

Instead use:

`Pre-Eligible — Final Approval Required`

or:

`Likely Meets Current Policy — Subject to Verification and Approval`

The system must explain that the result can change after:

1. Verification of documents.
2. Payroll changes.
3. Changes in outstanding liabilities.
4. Credit-report updates.
5. Policy changes.
6. Manual review.
7. Fraud/security checks.
8. Final approval authority decision.

### 52.11 Explain Why the Employee Is Eligible or Ineligible

Every pre-eligibility result should contain a reason list.

Examples:

**Eligible conditions**

- Minimum service period satisfied.
- Employment status eligible.
- Salary threshold satisfied.
- Existing exposure within policy limit.
- Estimated EMI within deduction capacity.
- Required documents available.
- Credit-policy threshold satisfied, where applicable.

**Ineligible/blocking conditions**

- Minimum service period not satisfied.
- Employee is in an excluded employment status.
- Existing loan exposure is above policy limit.
- Maximum permissible payroll deduction would be exceeded.
- Requested amount exceeds product limit.
- Required documents are missing.
- Active application already exists.
- Required credit information is unavailable.
- Configured CIBIL threshold is not met.
- Employee is under notice/exit restriction.
- Manual review is required.

Do not expose confidential risk-rule internals beyond what the policy and privacy design permit.

### 52.12 Credit-Readiness Improvement Guidance

If an employee is not currently eligible, provide actionable non-financial guidance such as:

1. Reduce existing employer-loan exposure.
2. Complete missing employment/profile information.
3. Clear overdue employer-loan recovery items where applicable.
4. Wait until the required service period is completed.
5. Resolve inaccurate credit-report information through the appropriate bureau dispute process.
6. Avoid unnecessary repeated loan applications where appropriate.
7. Maintain timely repayment behavior.
8. Re-run the eligibility check after the defined cooling/recalculation period.

CIBIL identifies payment history, credit utilization, age of credit and credit enquiries among major factors affecting the score. citeturn0search2turn0search10

The platform must not promise that following a recommendation will produce a specific future CIBIL score.

### 52.13 Credit Report Data Model

If an authorized CIBIL/bureau integration is implemented, add controlled records such as:

- `credit_profile`
- `credit_bureau_consent`
- `credit_bureau_request`
- `credit_bureau_response_metadata`
- `credit_score_snapshot`
- `credit_account_summary`
- `credit_enquiry_summary`
- `credit_dispute_reference`
- `loan_eligibility_calculation`
- `loan_eligibility_reason`
- `loan_policy_version`

Do not unnecessarily store a complete bureau report if a smaller, purpose-limited data set is sufficient.

### 52.14 Credit Score Snapshot Requirements

Every eligibility calculation using a credit score must record:

1. Employee ID.
2. Tenant/company ID.
3. Score value or permitted no-score status.
4. Source/provider.
5. Report date, if supplied.
6. Retrieval date/time.
7. Data freshness status.
8. Consent reference.
9. Bureau request reference.
10. Product evaluated.
11. Policy version.
12. Calculation version.
13. Result.
14. Maximum eligible amount.
15. Indicative EMI.
16. Reason codes.
17. Calculation timestamp.
18. Expiry/revalidation date.

### 52.15 Credit Data Security and Privacy

Credit information is highly sensitive financial information and must receive stronger access controls than ordinary employee profile data.

Required controls:

1. Encryption in transit.
2. Encryption at rest.
3. Field-level protection for sensitive identifiers where appropriate.
4. Strict tenant isolation.
5. Object-level authorization.
6. Employee self-access only to their own permitted information.
7. HR access only where policy permits.
8. Payroll access limited to required repayment/affordability data.
9. Managers must not automatically receive complete CIBIL reports.
10. No CIBIL data in browser URLs.
11. No CIBIL data in client-side logs.
12. No CIBIL data in analytics events.
13. No CIBIL data in email subject lines.
14. Mask sensitive identifiers in normal UI.
15. No unnecessary report downloads.
16. Download actions audited.
17. Retention/deletion rules documented.
18. Secure deletion where legally/policy permitted.
19. Access monitoring and anomaly alerts.
20. Breach/incident response procedures.

### 52.16 IDOR / Authorization Tests

The implementation must prove that:

1. Employee A cannot view Employee B's score.
2. Employee A cannot view Employee B's report.
3. Employee A cannot run a credit check for Employee B.
4. Employee A cannot change another employee's consent.
5. Employee A cannot change another employee's eligibility result.
6. A manager cannot access complete credit reports unless explicitly authorized.
7. A payroll user cannot access unnecessary bureau data.
8. Cross-tenant access is blocked.
9. Guessing an employee ID does not expose credit information.
10. Download endpoints enforce ownership/role authorization.

### 52.17 API / Function Requirements

Illustrative authenticated endpoints/functions:

- `GET /api/me/loan-credit-readiness`
- `POST /api/me/loan-eligibility/check`
- `GET /api/me/loan-eligibility/history`
- `POST /api/me/credit-bureau/consent`
- `DELETE /api/me/credit-bureau/consent` where withdrawal is supported
- `POST /api/me/credit-bureau/check` through an authorized provider integration
- `GET /api/me/credit-score/latest`
- `GET /api/me/loan-products`
- `GET /api/me/loan-products/:id/eligibility-rules`
- `POST /api/admin/loan-products`
- `PUT /api/admin/loan-products/:id`
- `POST /api/admin/loan-policy/versions`
- `GET /api/admin/loan-eligibility/calculations`
- `GET /api/admin/loan-credit-audit`

All endpoints require authentication, authorization, validation, rate limiting where appropriate, audit logging, and tenant isolation.

### 52.18 Rate Limiting and Abuse Prevention

Credit-readiness checks and bureau calls must be rate limited.

Required controls:

1. Limit repeated eligibility calculations.
2. Prevent repeated bureau requests within a defined validity period.
3. Cache permitted score snapshots rather than repeatedly requesting the bureau.
4. Require fresh consent where the provider requires it.
5. Detect automated abuse.
6. Prevent enumeration of employee IDs.
7. Audit unusual access patterns.
8. Fail safely when the bureau provider is unavailable.

### 52.19 Credit Data Freshness

A CIBIL score/report should never be displayed as current merely because it exists in the database.

Display:

- `Retrieved on`
- `Report date`, when available
- `Freshness status`
- `Next refresh/check date`

Eligibility calculations must record the exact credit snapshot used.

If the policy requires a recent report and the stored score is stale, the result must be:

`CREDIT INFORMATION REFRESH REQUIRED`

rather than silently using stale data.

### 52.20 Dispute / Incorrect Credit Information Handling

The platform must allow the employee to record that credit information is disputed and provide the relevant external dispute reference where permitted.

The system must not directly edit a CIBIL score.

Required states:

- `DISPUTE REPORTED`
- `DISPUTE UNDER REVIEW`
- `DISPUTE RESOLVED`
- `ELIGIBILITY RECHECK REQUIRED`

After a material credit-information correction, the employee should be able to request a new eligibility calculation subject to rate limits and policy.

### 52.21 Loan Application Integration

The credit-readiness facility must connect directly to Section 51's loan application workflow.

Required transition:

`Credit Readiness → Product Selection → Maximum Eligible Amount → Employee Application → Eligibility Verification → Approval Workflow → Disbursement → Repayment → Closure`

The employee should be able to choose:

- `Apply for maximum eligible amount`
- `Apply for a lower amount`
- `Change tenure`
- `Recalculate EMI`
- `Save as draft`
- `Continue later`

The system must prevent the employee from submitting an amount greater than the current policy-eligible maximum unless an authorized override workflow exists.

### 52.22 Maximum Amount and Requested Amount Must Be Different Fields

Never store only one generic `loan_amount` value.

At minimum distinguish:

1. `requested_amount`
2. `maximum_eligible_amount`
3. `approved_amount`
4. `disbursed_amount`
5. `outstanding_principal`
6. `total_repaid`
7. `early_settlement_amount`, where applicable

This prevents confusion between what the employee requested, what the policy permitted, and what the approver actually sanctioned.

### 52.23 Manual Override / Exception Workflow

If an authorized committee may approve an amount outside the normal eligibility calculation, implement an explicit exception workflow.

Required fields:

1. Original maximum eligible amount.
2. Requested amount.
3. Override amount.
4. Override reason.
5. Supporting evidence.
6. Approver.
7. Independent reviewer, where required.
8. Policy exception reference.
9. Timestamp.
10. Audit event.

Employees must never be able to override their own eligibility result.

### 52.24 Decision Reason Codes

Use machine-readable reason codes so the UI, audit log and reports remain consistent.

Examples:

- `CREDIT_SCORE_BELOW_POLICY_THRESHOLD`
- `NO_CREDIT_SCORE`
- `CREDIT_REPORT_STALE`
- `CREDIT_CONSENT_REQUIRED`
- `SERVICE_PERIOD_NOT_MET`
- `SALARY_THRESHOLD_NOT_MET`
- `FOIR_LIMIT_EXCEEDED`
- `EXISTING_EXPOSURE_TOO_HIGH`
- `ACTIVE_APPLICATION_EXISTS`
- `PRODUCT_LIMIT_EXCEEDED`
- `DOCUMENTS_INCOMPLETE`
- `NOTICE_PERIOD_RESTRICTION`
- `MANUAL_REVIEW_REQUIRED`
- `ELIGIBLE_SUBJECT_TO_FINAL_APPROVAL`

### 52.25 Notifications

Notify the employee only about actual state changes, for example:

1. Credit-readiness calculation completed.
2. Consent requested.
3. Consent recorded.
4. Credit check completed.
5. Pre-eligibility result available.
6. Application submitted.
7. Additional information required.
8. Approval/rejection decision completed.
9. Disbursement completed.
10. Repayment schedule generated.
11. Repayment posted.
12. Credit-readiness result expired and requires refresh.

Do not include the full CIBIL score/report or sensitive financial details in insecure notification channels unless specifically justified and protected.

### 52.26 Audit Events

Add dedicated audit events:

- `CREDIT_BUREAU_CONSENT_GRANTED`
- `CREDIT_BUREAU_CONSENT_WITHDRAWN`
- `CREDIT_BUREAU_CHECK_REQUESTED`
- `CREDIT_BUREAU_CHECK_COMPLETED`
- `CREDIT_BUREAU_CHECK_FAILED`
- `CREDIT_SCORE_VIEWED`
- `CREDIT_REPORT_VIEWED`
- `CREDIT_REPORT_DOWNLOADED`
- `LOAN_ELIGIBILITY_CHECKED`
- `LOAN_ELIGIBILITY_FAILED`
- `LOAN_MAXIMUM_AMOUNT_CALCULATED`
- `LOAN_MANUAL_OVERRIDE_REQUESTED`
- `LOAN_MANUAL_OVERRIDE_APPROVED`
- `LOAN_MANUAL_OVERRIDE_REJECTED`
- `LOAN_PREAPPLICATION_CREATED`

Audit records must include actor, target employee, tenant, timestamp, action, outcome, correlation/request ID, policy version and relevant non-sensitive reason codes.

### 52.27 Reporting and Administration

Authorized administrators should be able to report:

1. Number of eligibility checks.
2. Eligible vs ineligible counts.
3. Maximum eligible amount distribution.
4. Requested vs approved amount.
5. CIBIL-readiness status distribution without exposing unnecessary individual scores.
6. No-score/NA/NH cases.
7. Manual review rates.
8. Policy exception rates.
9. Average processing time.
10. Application-to-approval conversion.
11. Disbursement-to-repayment performance.
12. Failed bureau requests.
13. Stale credit-profile counts.
14. Credit-data access audit events.

Reports must be role-restricted and must minimize sensitive credit information.

### 52.28 UI / Accessibility Requirements

The credit-readiness page must follow the master UI requirements:

1. Company branding.
2. Light/day theme.
3. Dark/night theme.
4. System theme.
5. Responsive mobile layout.
6. Keyboard navigation.
7. Visible focus states.
8. Accessible labels.
9. Error messages associated with fields.
10. Screen-reader-friendly score/status presentation.
11. No color-only eligibility indication.
12. Print/download controls only where authorized.
13. No sensitive information displayed in browser page titles.
14. No sensitive information embedded in URLs.

### 52.29 Download Requirements

If the product provides a credit-readiness or loan-eligibility report download, it must satisfy the master download standard:

1. Authenticated request.
2. Object-level authorization.
3. Tenant authorization.
4. Correct employee ownership.
5. Secure file generation.
6. Correct MIME type.
7. Safe filename.
8. Correct `Content-Disposition`.
9. Cache-control appropriate for sensitive data.
10. File-integrity verification.
11. Audit event.
12. Error handling.
13. No fake success toast.
14. No IDOR.
15. No unauthorized bulk download.

### 52.30 Test Matrix

Before marking the CIBIL/credit-readiness facility COMPLETE, test at minimum:

| Test | Expected Result |
|---|---|
| Employee opens readiness dashboard | Only own permitted data appears |
| No CIBIL consent | No bureau request occurs |
| Consent granted | Authorized bureau request can proceed |
| Bureau unavailable | Safe failure; no false score/result |
| Score 300–900 returned | Correct score snapshot stored |
| NA/NH returned | Handled as no/insufficient score, not automatic bad score |
| Stale score | Refresh/recheck requirement shown when policy requires |
| Eligibility check | Policy version recorded |
| Maximum amount calculation | Deterministic and reproducible |
| Existing loan deduction high | Maximum amount reduced or blocked |
| FOIR/affordability exceeded | Correct blocker shown |
| Requested amount below maximum | Application may proceed subject to remaining rules |
| Requested amount above maximum | Blocked or controlled exception workflow |
| Employee tries another employee ID | IDOR blocked |
| Manager requests unauthorized report | Access denied |
| Cross-tenant request | Access denied |
| Repeated bureau requests | Rate-limited/cached |
| Manual override | Maker-checker/SoD enforced |
| Final approval | Only authorized approver can approve |
| Rejection | Reason/status recorded |
| Disbursement | Success only after actual transaction result |
| Payroll recovery | Matches repayment schedule |
| Early closure | Balance reconciles to zero when fully settled |
| Credit-data download | Authorized and audited |
| Consent withdrawal | Future access follows provider/policy rules |
| Credit dispute | Dispute state does not falsely alter bureau score |
| Policy version change | Historical calculations remain reproducible |
| UI failure/API failure | No false success message |

### 52.31 Production Acceptance Criteria

The CIBIL/credit-readiness feature may be marked COMPLETE only when all of the following are true:

1. Authorized CIBIL/bureau integration is implemented, or the product explicitly operates in a no-bureau mode.
2. Consent and privacy controls pass review.
3. CIBIL score is treated as one input rather than an automatic approval decision.
4. Employee can run a future-loan pre-eligibility check.
5. Employee can see the maximum policy-eligible amount.
6. Employee can see indicative affordability/EMI information.
7. Employee can understand the principal reasons for eligibility/ineligibility.
8. Employee can proceed to a formal loan application when eligible.
9. Maximum eligible amount and approved amount are separate values.
10. Manual exception workflow is controlled and audited.
11. Existing loans and payroll deductions are included in affordability calculations.
12. NA/NH/no-score cases are handled correctly.
13. Stale/disputed credit information is handled correctly.
14. IDOR/cross-tenant tests pass.
15. Sensitive credit data is protected.
16. All credit and eligibility events are audited.
17. Downloads are authorized and verified.
18. Browser/database integration tests pass.
19. Real application → approval → disbursement → repayment tests pass.
20. No UI action reports success unless the underlying operation actually succeeded.

### 52.32 Final Decision — CIBIL / Future Loan Facility

**CIBIL score facility:** MISSING / NOT VERIFIED AS AVAILABLE.

**Future loan self-service eligibility check:** MISSING / NOT VERIFIED.

**Maximum eligible loan calculation:** MISSING / NOT VERIFIED.

**CIBIL consent and authorized bureau integration:** MISSING / NOT VERIFIED.

**Credit-readiness dashboard:** MISSING / NOT VERIFIED.

**Approval-likelihood/readiness guidance:** MISSING / NOT VERIFIED.

**Affordability/EMI pre-calculation:** MISSING / NOT VERIFIED.

**CIBIL/credit reason codes:** MISSING / NOT VERIFIED.

**Credit-data privacy/IDOR controls:** MISSING / NOT VERIFIED.

**Manual exception workflow:** MISSING / NOT VERIFIED.

**Integration with Section 51 loan application:** REQUIRED / NOT VERIFIED.

**Important:** The system must never promise that a particular CIBIL score guarantees approval or a particular maximum loan amount. The correct product behavior is to calculate a **policy-based pre-eligibility and maximum eligible amount**, use CIBIL as one configured input where law, policy, consent and an authorized bureau integration permit it, and then route the employee through the actual approval workflow.

### 52.33 Research Basis

The CIBIL documentation confirms that its score ranges from 300 to 900, is based on credit-history information, and is used by lenders as part of loan evaluation. CIBIL also states that the final sanction decision is made by the lender rather than by CIBIL. citeturn0search0turn0search2

CIBIL's current consumer material identifies payment history, credit utilization, age of credit and enquiries among the major factors affecting the score. citeturn0search2turn0search10

Accordingly, the Workforce Intelligence Platform must not reduce its loan decision to a single score. The stronger design is a transparent **Credit Readiness → Eligibility → Maximum Amount → Application → Verification → Approval → Disbursement → Repayment → Closure** lifecycle with configurable employer policy, affordability checks, authorization, consent, auditability and privacy controls.
