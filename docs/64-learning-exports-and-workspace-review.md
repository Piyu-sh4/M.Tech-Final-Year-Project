# Learning, exports and workspace verification

This release covers the specific learning and export workflows in build requests 11 and 13, the profile and employee ID checks in request 14, and the helpdesk, appearance and assistant improvements in requests 12 and 15.

## Workflows

- HR and administrators can publish one assessment of 15–20 questions per course. The demo includes assessments for the JavaScript, Python and Docker learning paths. Course resources, enrollment, progress, assessment results and certificate issue records persist in MySQL.
- Learners open an assessment after recording 100% learning progress. The server scores submissions and retains the best score. The passing threshold is 80%. For assessed courses, an independent HR or admin reviewer can issue the existing certificate PDF after the learner passes. Previously issued certificates remain available. Courses without a published assessment use the existing completion and review flow.
- Task Manager filters and its completion chart use the same query. The chart counts the filtered records by status. Personal views show tasks assigned to the signed-in user. The empty state and the download action remain usable on a phone.
- The Reports page downloads a styled PDF from the stored report using the catalog's read permissions. Organization-wide KPI fields are included for HR and administrators. Generic record PDFs use the shared print layout. Payroll keeps its existing payslip detail, audit trail and access policy.
- Requesters can open and close their own active helpdesk tickets. The closure preserves the ticket and its comments. The wizard category and ticket detail actions support keyboard activation.
- Application Settings combines five display modes with five account accent choices. Saved choices apply through the central theme and follow the account across devices. Workforce Chat offers role-scoped learning, team task, training review and headcount tools. These tools read MySQL internally. External provider selection remains in AI Chat Settings.

## Verification scope

The browser route survey checks loading, shared typography and navigation, visible controls, encoding and overflow at 320, 768 and 1440 pixels in Chromium and WebKit. The workflow checks exercise the 21 workflow trackers, course publishing through PDF issuance, task editing and filtering, ticket submission and closure, meeting changes and notifications, report and payslip downloads, and employee photo and ID card print/download. Role checks cover employee, manager, HR and administrator assistant tools and module access.

Browser checks use a seeded Compose project. Tests cover demo records, authenticated application actions and handoffs to external links. Live bank or tax submissions, provider account billing, and an exhaustive review of every legacy action require separate verification. The remaining entitlement, approval and privacy work is tracked in the GitHub backlog.
