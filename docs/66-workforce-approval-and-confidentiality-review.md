# Workforce approvals and confidential case review

Build requests 12 and 15 cover reliability across the workspace. The earlier releases delivered the 21 workflow trackers, account appearance choices, role-specific assistant tools, learning and document updates. This pass covers the remaining approval, cancellation and confidentiality gaps identified in those requests.

| Workflow | Behavior verified |
| --- | --- |
| Travel | Employees can cancel their own pending requests. Managers see their own requests and their direct reports. A separate reviewer can approve or reject a pending request within the requested estimate. |
| Night shift | Request and review controls are available in Safety requests. The same direct-report rule applies. Reviewers receive an internal notification and the requester receives the result. The staff register excludes guardian contact information. |
| Resignation | The employee can withdraw a submitted request. A manager acknowledges it before HR or an administrator can approve or reject it. The manager register follows the reporting line. |
| Settlement | HR or administrators can preview and approve a server-calculated balance. Recording payment requires approval and a reference. The app records an existing payment and leaves the employee's login status intact. The app's settlement estimate still requires payroll validation before actual payment. |
| Helpdesk | An assigned manager can review the ticket and participate in its private comments. HR and administrators manage assignments. An owner closure locks the ticket against subsequent status changes. |
| Cab and benefits | An in-progress cab journey cannot be cancelled through the booking action. Cancelled benefit enrollments stay closed to self-service edits. |
| Confidential cases | The legacy PoSH register respects its confidentiality flag. New safety case intake uses the existing HR and administrator roles. Assignment limits review to an eligible reviewer. The named subject and reporting employee cannot review their own case. Anonymous submission stores no reporter ID or general audit entry. SOS details are restricted to HR and administrators. |

The shared pages cover request, approval, cancellation, settlement and confidential assignment actions. Automated checks use seeded accounts in an isolated MySQL volume. Existing roles and intake responsibilities remain the basis for these decisions. Organization-specific committee membership, historical audit retention and any statutory payroll sign-off remain separate governance work.
