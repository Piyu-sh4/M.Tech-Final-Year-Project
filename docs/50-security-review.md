# Security review and operational boundaries

Read [the current review](49-current-review.md) for scope and remaining work. This is a local code review, not a penetration-test or compliance certificate. CodeRabbit was not executed.

## Controls added

- WebAuthn verifies origin, relying party, signature, challenge expiry, user verification and replay protection. Enrollment requires the current password. Only public credentials are stored; device biometric templates never reach this server.
- Attendance proofs are bound to user/action and expire after two minutes. Challenge records are single-use. The attendance row and audit event commit together.
- Cloudflare client IP is accepted only through the expected private/local proxy peer and accompanying edge header; arbitrary forwarded headers are ignored. Origin is bound to the configured application allowlist.
- Bank account values use AES-256-GCM. Provider keys are separately encrypted. Private key files reside in the persistent `ai_keys` volume. JWT fallback secrets are generated once and persisted for demo restarts; non-demo deployments require JWT_SECRET.
- Manager payroll and attendance reads are restricted to self/direct reports. HR/admin handle privileged payroll writes. Meeting hosts/admin manage meetings; participants cannot edit another host's meeting.

## Backups and Git

The committed SQL snapshot is a **synthetic demonstration dataset**, not a backup destination for real employee data. The export excludes provider credentials, sessions, passkeys, challenges, attendance proofs, device registrations, location preferences and IP download/attendance audit data. Never commit `.env` or private state files.

Back up the database, uploads and private state volume together. Account ciphertext in a restored snapshot is deliberately not accompanied by the original private key. Demo accounts can replace their bank details; recovering real encrypted values requires the original private key backup. Do not rotate/delete private keys without a migration plan.

Keep the demo access gate enabled on the public tunnel. Change demo credentials before using real data. Production deployments require a separate secrets manager, HTTPS/proxy configuration, access review, monitoring, backup restoration evidence and external security review.
