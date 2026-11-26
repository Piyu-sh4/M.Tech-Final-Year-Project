# GitHub issue backlog review

Reviewed issues 1–23 against main at `07392af`, issue acceptance criteria, and the findings and route inventory in chapter 58. The original audit's reproduced, code-read and flagged labels carry different levels of evidence. Review decisions below describe the design, and the delivery section records which changes were verified.

| Issue | Critique and build decision |
| --- | --- |
| #1 Cab | Treat booking ownership, transport operations and passenger secrets as separate policies. Existing driver records have no authenticated driver identity, so operational writes require staff until that relationship exists. Limit staff responses to the information needed for the action. |
| #2 Upload validation | A multipart MIME type and filename are assertions from the client. Derive photo formats from bytes, and apply separate allowlists to document and import endpoints because their supported formats differ. |
| #3 Uploaded files | The entire upload tree should be outside static serving. Inventory each consumer before removing the mount, including authenticated profile image rendering and policy attachments. |
| #4 Reports and analytics | Report authorship controls edits. A generated organization-wide report remains sensitive regardless of authorship. Require staff for organization reports and put payroll aggregates behind HR/admin access. |
| #5 Object ownership | A role check cannot replace resource ownership. Share the authorization decision and use route-specific lookups or query predicates. Separate calculation and checklist presentation from writes. |
| #6 Approvals | Self-approval and invalid transitions need separate checks. Each workflow must define the current state, actor and source of amounts before enabling transitions. Use conditional writes or transactions and test retries. |
| #7 Manager scope | Department membership gives broader access than the reporting hierarchy. Use direct reports where managers need team data, with separate HR/admin permissions for payroll and other company-wide data. |
| #8 SQL errors | Validate against supported values at the API boundary. Preserve actionable errors for user correction and log database failures server-side. Treat existing validation exceptions separately from driver errors. |
| #9 Record changes | Apply assignment checks to interview and onboarding actions. Training progress and outcome certification have different trust requirements and need distinct permissions. Apply server-owned flags to comments and messages. |
| #10 Registration and imports | Registration should preserve valid company selection while assigning only the employee role. Imports should enroll pending accounts without shared credentials, with an activation path. Banking belongs in the encrypted workflow. |
| #11 Complaints | HR/admin roles alone are too broad for case access. Committee authorization needs an explicit grant, with an accused-party exclusion and separate handling for anonymous audit events. |
| #12 Input sanitization | The sanitizer currently runs before JSON parsing, so its mounted body pass generally sees no data. Replace it after output sinks are safe. Blanket decoding of stored data would alter literal entity text and needs a field-level migration decision. |
| #13 Frontend output | Use text and attribute APIs by context. Escaping HTML does not make inline JavaScript or arbitrary URL schemes safe. Start from a sink inventory and verify with inert literal-text fixtures. |
| #14 Rate limiting | Correct forwarded-IP trust before depending on IP-based limits. Use Redis counters for deployments with multiple workers and bound account and IP attempts separately. |
| #15 Public errors | Preserve health status codes used by Docker and remove public database details. Give password failures one status and message, with account-state messages only after verification. Passkey options need their own review. |
| #16 Perimeter and sessions | Same-origin UI can run without broad CORS. Inline scripts need migration before strict CSP can ship. Any session changes need HTTP and Socket.IO regression checks. |
| #17 Company operations | Apply HR/admin guards to company-wide changes and preserve explicit ownership for delegated work where the UI supports it. Review notification destinations and attendance inputs independently. |
| #18 Meetings | Bind host checks to named handlers. Hash new passwords and preserve existing protected meetings with a migration path. Reserve system messages for server events. |
| #19 Test infrastructure | Use ephemeral Compose projects and require a browser testing target. Start CI with repeatable commands and include authorization tests when the complete intended role matrix is defined. |
| #20 Configuration | Separate explicit demo configuration from deployment defaults. Preserve existing data volumes. Treat a driver migration and dependency licensing as separate reviewable changes. |
| #21 Repository hygiene | Verify references before removing dead routes and middleware. Preserve historical materials until retention and replacement decisions are recorded. |
| #22 UX | Separate broken permission requests and time presentation from layout and catalog redesign. Test visual changes on phone, tablet and desktop and preserve access to role-specific features. |
| #23 Remaining audit | Break the open-ended audit into independent verification areas. Financial calculations need independent reference cases, workflow coverage needs lifecycle tests, and privacy and performance need separate evidence. |

## Delivery status

| Issue | Result in this change |
| --- | --- |
| #1 | Cab management routes require staff. Passenger routes enforce booking or ticket access. Staff listings and driver notifications omit the OTP, and journey completion requires it. |
| #2 | Profile, personal document and policy uploads use file signatures and generated names. The generic parser verifies photo and PDF signatures and stores temporary files outside the app. Full validation of archive, audio and legacy Office formats remains open. |
| #3 | Removed public upload serving. Protected profile, policy and employee document download routes serve attachments. Policy attachments enforce the intended audience. |
| #4 | Reports and analytics enforce staff roles, with HR/admin for payroll and attrition data. Report changes check authorship, and cache refresh checks for an admin. Employee-authored report summaries remain scoped in the catalog. |
| #5 | Scoped the originally reported user-ID routes, plus suggestions, helpdesk comments, announcement reads and alert updates. Preserved read-only GET behavior for productivity and exit checklists. The rest of the object inventory remains open. |
| #6 | Blocked self-issued HR letters. The remaining approval and payment state machines need separate transactional changes. |
| #7 | Scoped manager dashboards and tasks to reporting lines and limited statutory compliance and department reassignment. Other routes from this issue still need review. |
| #8 | Added field validation for the helpdesk and letter examples and removed detail from the global error response. Controllers that return their own SQL errors still need a sweep. |
| #9 | Enforced interviewer assignment and allowed interview states. Separated the hiring decision from interview feedback. Scoped checklist updates, verification consent, joining-letter acknowledgment and internal comments. Training and benefit mutations remain open. |
| #10 | Registration assigns the employee role and retains company selection. Profile edits use the encrypted banking workflow. The invitation and initial password flow for imports and remaining permission flags are open. |
| #11 | Stopped copying complaint content and actor metadata into broad audit logs. Excluded the named party from the complaint list, updates and notifications. Committee authorization, past log retention and the remaining trackers need separate work. |
| #12 | Deferred the data migration and sanitizer removal until the output audit is complete. |
| #13 | Removed unsafe HTML interpolation from the profile photo path. The full context-specific output audit remains open. |
| #14 | Disabled implicit private-network proxy trust. Password login now uses independent configurable per-IP and per-account limits, shared through Redis in Compose. Limits count attempts, including failures, so simultaneous requests cannot pass a check before the failure is recorded. |
| #15 | Health returns only a status. Invalid password and unknown-account responses match. Passkey account discovery remains open. |
| #16 | Same-origin defaults for API and socket CORS, an eight-hour default token lifetime, and removal of private API responses from the browser cache. Remaining CSP, body-limit and session-lifecycle work stays open. |
| #17 | Added HR/admin role guards for the specified company-wide actions, attendance validation and an internal-only notification destination. The UI still needs to align manager controls with the authorization policy. |
| #18 | Host permission is attached to management routes. Old meeting passwords migrate to hashes at startup. Meeting responses omit credentials and client messages are always classified as chat. |
| #19 | Added Compose CI, isolated test projects with cleanup, and explicit browser test targets. Linting and a complete role-matrix inventory are still open. |
| #20 | Made demo mode and proxy configuration explicit, removed startup credential logging and moved registration/login hashing off synchronous calls. Remaining configuration and driver work stays open. |
| #21 | Removed unused security middleware exports and the duplicate attendance export route. Corrected gratuity routing. The wider archive and maintainability review remains open. |
| #22 | Employee dashboard uses its own permissions endpoint. Layout tested at three widths. Formatting, duplicate modules, timezone consistency and chat placement remain open. |
| #23 | Exercised all workflow trackers and finance flows through the browser. Full accessibility, independent financial arithmetic, load, schema and privacy reviews remain open. |

The browser page audit covered 126 URLs in Chromium at 320, 768 and 1440 CSS pixels. The finance and tracker workflow suites ran at 390 and 1440 CSS pixels against an isolated Compose instance populated with the synthetic snapshot. These checks cover functionality and layout under local conditions.
