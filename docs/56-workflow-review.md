# Workforce Intelligence senior review and fixes

This review follows the active Express routes, MySQL records and shared browser templates. The catalog routes serve one module template, so record and form changes apply across modules. Native screens such as Tasks and Notifications have their own controllers and templates.

| Request | Verified behavior and changes |
| --- | --- |
| 1, 21, 22. Meetings | Set a provider and HTTPS link when scheduling. The colleague picker is scoped to active users in the same company. Hosts and administrators can edit, reschedule or cancel from Meeting actions. Cancellation records a reason and optional note. Both schedule changes write alerts and notification-center entries for the host and invitees. Other users receive no meeting details. An external provider creates the actual Zoom, Meet or Teams room. |
| 2, 3. Registration and location | Registration populates its company selector from the active company list. Session IP is recorded by the server. Location and weather use saved consent and source preferences in Application settings. |
| 4, 20. Record actions | Catalog records expose View and PDF export. Edit and Delete appear where the workflow supports them, including draft deletion. The general PDF includes the fields displayed on the record and carries a record-export label. Dedicated payslips and uploaded-document downloads keep their own routes. CSV remains available for tabular data. |
| 5, 23. Payroll and tax documents | Employee, manager, HR and administrator payslip scope remains enforced by the server. Issuing a payslip records actor and IP. Salary revisions, claims and declarations can be exported as PDFs. The Income tax page provides a financial-year summary of paid salary and declared tax. Official filed and revised returns are available through the government portal. |
| 6, 7, 8. Credit, bank and tax links | The credit screen tracks a self-reported score and bank resources. The company-loan estimator covers personal, home, bike and car. The bank directory includes SBI, HDFC, Axis and Central Bank of India links. The Income tax page links to filing, payment and official return downloads. |
| 9. Attendance and device sign-in | Self clock-in and clock-out use the attendance workflow. Optional passkeys use device verification, such as a fingerprint, face recognition or PIN, depending on the device. The app does not store biometric templates. |
| 10, 25. AI providers and document retrieval | AI settings cover Anthropic, OpenAI, Gemini/Google AI Studio, NVIDIA and OpenRouter. An upload creates a bounded retrieval index owned by that uploader. When the user opts in, chat retrieves relevant excerpts and includes the filename in its context. Uploading alone does not send a model request. Index entries expire after 30 minutes or on application restart. |
| 11, 13, 27. Responsive design | Shared workspace styling covers phone, tablet and desktop. Appearance presets include system, light, day, night and dark. Project cards use hover and keyboard-focus styling. Task and meeting actions use touch-sized controls. |
| 12, 14, 15, 17, 18, 19. Documentation and readability | The index points to current and historical documentation. Old product-version suffixes were removed from documentation titles and frontend style comments. Versioned API paths and migration identifiers are kept because code and data depend on them. New comments describe permission and transaction boundaries. |
| 16, 24, 28. Integration review | Tests cover core API workflows, browser page layouts, permissions and regressions. See the gaps below for integrations and changes that would need a product decision or external access. |
| 26. Tasks | Task actions contains View, Edit details, Download PDF and authorized Delete. The author or administrator may change descriptive fields. The existing assignee status flow remains separate. |

## Security review

Meeting changes lock the record so repeated cancellation cannot create duplicate notifications. Invitees are scoped server-side. Notification links accept internal paths and display text is escaped. The PDF renderer receives bounded display fields and escapes text before rendering. Dedicated payslips enforce their existing role scope. Chat document retrieval checks ownership and consent before sending excerpts to a provider. Tests mock provider completion and check that text beyond the 600-character preview is retrieved.

## Gaps and verification scope

Live credit bureau checks and bank decisions require an authorized provider contract, consent and credentials. Directly filing or retrieving government returns requires an authorized integration. The app provides the official portal and its download instructions. Company selection is part of a shared installation, rather than a complete tenant separation architecture. Document retrieval is per-upload keyword retrieval, with no persistent or shared knowledge base. CodeRabbit was not used. This report records the manual review and tests run for this change.

## Testing

The isolated suite passed 130 API tests. The responsive sweep passed all 750 page and viewport checks across Chromium and WebKit. Both browsers passed the meeting and task workflow with actual PDF downloads. A separate check generated an annual payroll PDF using seeded paid salary records. The public health check returned HTTP 200, the company list included Workforce Intelligence, and six affected frontend files matched the running deployment through Cloudflare.

Run the integration suite with `npm run test:docker`. The focused browser workflow is `tests/browser-review.cjs`. It creates and reschedules a meeting, cancels with a reason, checks notification visibility and verifies PDF bytes, then edits and exports a task. Run the existing page and finance suites against isolated Compose data for viewport and financial coverage.

[Income Tax Department guide to filed returns](https://www.incometax.gov.in/iec/foportal/help/how-to-know-the-itr-status)
