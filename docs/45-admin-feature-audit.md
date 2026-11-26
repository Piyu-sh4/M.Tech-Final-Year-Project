> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# Workforce Intelligence admin audit — November 10, 2026

Historical audit. See the [November 12 senior developer review](46-senior-review.md) for subsequent fixes, deployment validation and the current module matrix.

The demo has working data and write paths for core HR operations. The largest gaps are misleading dashboard examples, domain workflows whose screens only list records, and external services represented by placeholders. The AI Chat Settings page is now deployed.

## What was tested

- Inspected the live admin dashboard and the new AI Chat Settings page in the existing signed-in Chrome session.
- Loaded 117 existing pages in an automated admin browser session. There were no unexpected redirects or uncaught page errors. This covers navigation and initial rendering; it does not count every button as tested.
- Ran 191 GET checks against a separate seeded stack. 189 returned success. Cab availability correctly required route and date inputs and succeeded when supplied. A company policy detail request failed for a policy returned by the list. Four calls with external, service, or document-generation dependencies were omitted from the broad read run.
- Passed 17 state-changing API workflows on the separate stack. Each checked the resulting state. Browser verification also passed an employee-to-admin leave approval, objective create and edit, expense submission, role restriction, CSV export, and PDF download.
- OpenAI, Anthropic, Gemini, and OpenRouter were tested with simulated provider responses on the separate stack. Saved profiles and active selection survived API container recreation. The public deployment has no key or active provider configured.

## Feature coverage and gaps

| Area | Verified working | Gaps and next improvement |
| --- | --- | --- |
| Admin dashboard | Main cards, pending registration list, task feed and extension queue read from the database. | The Executive KPI, Action Center and proactive insight panels contain hard-coded figures and narratives. The live dashboard showed 216 user records and 111 pending leave requests while those panels showed 142 employees and six pending leaves. Use a single source and clearly distinguish active employee headcount from total accounts. The live task list also needs filters and pagination. |
| Users, access and teams | Employee registration → approval → sign-in, department create/edit/delete, role restriction, directory and org data. | Test rejected and suspended accounts across every protected route. Add a clearer employee selector for admin task assignment. Review access by record and department across legacy endpoints. Public signup and bulk employee import can no longer create administrators, and a non-admin staff user cannot change account roles or edit an administrator. |
| Attendance and leave | Clock in/out, leave submission and approval, employee-visible status, attendance CSV read. | The register for attendance corrections, WFH requests and shift bidding saves data, but it has its own records and no link to attendance or leave balances. Add review, reconciliation and audit history. |
| Payroll and finance | Payroll record, paid status, PDF payslip, expense claim approval, travel approval, loan and tax reads. | Paid status is a database update. Bank transfer, statutory filing and reconciliation integrations were not verified. Loan offers and bank lookups contain demo constants. Banking uses a demo encoding for account numbers. The tax, investment, and Form 24Q screens are mostly read views. Establish correct financial calculations, exports and protected storage before using real data. |
| Hiring, training and performance | Recruiting and interview reads, course creation, enrollment and completion, onboarding checklist completion, performance review reads. | Hiring and interview pages expose lists while write APIs exist. Add job and candidate management, interview scheduling and feedback, offer and joining transitions, and a review creation flow. Goals and probation are standalone demo registers. |
| Projects, tasks and support | Task assignment, comments, completion and deletion, project creation/member/milestone/status, helpdesk resolution, asset assignment/return, announcement publish/read/archive. | Use server-side pagination and actionable filters. Make assignee selection accessible by name and surface linked records and status history in the corresponding UI. |
| Documents, policies and settings | Document and policy lists, report lists, company settings reads. | A valid multipart PNG sent to the document upload API returned HTTP 400. The current multipart shim misreads the file field, and the insert also omits the required file path. Policy detail returned 404 because the generic settings route matches first. The public document register lacks upload, approval and download actions. Enforce owner and role authorization on uploaded file retrieval before adding those actions. |
| Meetings, transport and safety | Meeting scheduling and invitee visibility, cab availability, booking and cancellation, driver and vehicle reads. | Cab safety currently substitutes empty expiry and driver fields and can return a positive safety status for incomplete data. Require evidence before showing a positive state. Vehicle tracking, video meetings, emergency dispatch and outbound alerts require live integrations and were outside this audit. |
| Analytics and AI insights | Live workforce totals, task trends, report previews and rule-based insight data. | Some market benchmarks and dashboard narratives are examples. Display the source, date, and coverage for each metric. Pulse survey has a read view but no full participation/results workflow in the current module. |
| Demo registers and static content | 21 demo registers support persisted records and status edits. Privacy, cookie and security policy text is static by design. | Fraud, security incidents, biometrics, credit score, vendor/visitor workflows and several HR registers need domain-specific workflows or data sources. Distinguish information pages, simple registers, and operational features in navigation. |

The shared catalog has 92 modules. Seventy-one read from domain tables or APIs, and 19 of those expose a form, action, or record download. The other 52 offer search and CSV over a read view. Some, like a directory, only need reads. The table above identifies the read views where a workflow is missing.

## AI Chat Settings

Open [Settings → AI Chat Settings](https://workforce.bharatmedha.com/ai-chat-settings.html). Choose a provider, enter its model ID and API key, select **Save configuration**, then **Make active**. Full chat and the floating chat use the active choice immediately. Only administrators can manage the settings. The API never returns stored keys, and keys are encrypted at rest. Keeping the MySQL and AI key volumes together preserves those settings across rebuilds.

The chat sends conversation messages to the selected provider. Including workforce totals or an uploaded file preview requires a selection in full chat. Organization totals are available to admins, and other users receive totals for their own records. Provider settings affect chat; meeting report generation continues to use its environment configuration. Live key validity, provider quota and model access require testing with the administrator's own credential.

Provider API references: [OpenAI](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create), [Anthropic](https://platform.claude.com/docs/en/api/messages/create), [Gemini](https://ai.google.dev/gemini-api/docs/openai), [OpenRouter](https://openrouter.ai/docs/api/api-reference/chat/send-chat-completion-request).

## Suggested order

1. Replace or label the fabricated dashboard figures. Fix policy detail and document upload. Treat incomplete cab safety data as unknown and review authorization for document access.
2. Wire missing workflow controls to existing APIs for hiring, leave operations, payroll review, tax declarations, and document lifecycle.
3. Add pagination and better empty/error states, then add external providers only for workflows that need them. Verify with sandbox credentials and tests for failure, retry and audit history.
