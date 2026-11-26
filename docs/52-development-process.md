# Contributor process and code structure

The active request path is browser HTML/JavaScript → authenticated Express route → controller/domain service → MySQL. Redis is a cache; MySQL remains the source of truth.

- `backend/config/moduleCatalog.js` defines module columns and forms. `frontend/modules.js` renders safe DOM controls and invokes the corresponding API. `backend/services/workflows.js` handles typed workflow records, version checks, decisions and history.
- `applicationPreferences.js` adds account/company/meeting schema without rebuilding existing records. `demoBootstrap.js` runs versioned seed jobs once under a database lock.
- `passkeys.js` owns challenge verification and attendance proofs. Routes enforce authentication and enrollment password confirmation. `privateSecrets.js` creates durable private keys without exposing them in logs.
- `bankingEncryption.js` migrates plaintext bank values and masks read responses. Preserve private state with backups.
- `requestIdentity.js` distinguishes the socket peer from trusted proxy IP metadata. Location consent is independent of session IP auditing.
- `navigation.js` provides the shared header; `appearance.js` applies account/OS theme preferences. New controls belong in shared components where possible.

Before editing, inspect Git status and fetch the configured remote. Preserve unrelated changes. Use a separate Compose project and port for destructive tests; never reset the live volumes. Add meaningful boundary tests for authorization, persistence, external failures and state transitions. Format changed modules and comment the reason for non-obvious decisions. Prefer descriptive names over abbreviations in new code. Keep historical migration names stable.

After passing isolated checks, rebuild the main stack, verify public access and persistent records, export only synthetic seed data, fetch again and push. Report untested integrations explicitly. Avoid fake success toasts and fallback sample rows: display a real empty/error state instead.
