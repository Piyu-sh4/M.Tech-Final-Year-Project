# Assistant guide and draft archive

This follow-up addresses build request 7 for workforce information and activity in the AI Assistant, and build request 8 for reviewing and completing record actions across the workspace. The earlier section-by-section module review is recorded in [the module and learning review](62-module-and-learning-review.md).

## AI Assistant

- The workspace guide uses the same role rules as the module directory. Search and module links work without calling an AI provider. The guide supplied to the model contains module names, groups and application paths.
- The activity panel displays the signed-in user's most recent audit actions. It excludes raw request data, IP addresses and activity of other users. Activity entries stay in the application.
- Workforce totals include projects the caller can view. The mobile and desktop composer offers an explicit choice to send those totals and relevant uploaded excerpts to the active provider. Chat provides guidance and has no record-editing capability.

## Workflow records

- All 21 shared trackers offer an archive for drafts that were removed. The author, HR or an administrator can review and restore them within the existing module scope. Restoration checks the current revision, records an attributed history event, and returns the draft to the active list. Reviewed records retain their existing protections.
- Review and decision actions prompt for a meaningful note. The note is recorded in the existing history rather than a generic UI message.

## Verification scope

MySQL tests cover role-filtered guide data, personal activity visibility, provider payload boundaries, archive access and stale revisions. Chromium and WebKit exercise assistant navigation and consent and the shared record lifecycle at phone and desktop widths. The 128-route survey checks responsiveness and page loading. This follows the section-by-section review and does not certify every role and operation in each specialist module. Decisions and approvals within those modules continue to follow their own policies.

## Live workforce answers

The assistant answers supported record questions directly from MySQL before loading a chat provider. Examples include “Show my overdue tasks,” “How many active projects can I access?”, “Show my pending leave requests,” “What’s my attendance today?”, and “List my recent reports.”

Task, leave, attendance and report answers use the signed-in user’s records. Project answers follow the existing project visibility rules, while “my projects” means projects the user manages, created, or joined. Lists show up to eight records. The answer is read-only and labeled **Source: Workforce database**. These questions work with no active provider.

General questions and file-assisted questions use the selected provider. The browser starts a fresh provider conversation after a database answer so it does not automatically include the internal record text. Sharing workforce totals or relevant uploaded excerpts remains an explicit choice. Internal record queries support the categories above. Other modules continue to be available through the workspace guide.
