> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# Docker demo verification — November 10, 2026

The working demo is served through the dedicated `workforce-demo` Cloudflare Tunnel at `https://workforce.bharatmedha.com/login.html`. On the host, the same app listens at `http://127.0.0.1:5500/login.html`. The macOS user launch agent `com.workforce-intelligence.demo-tunnel` runs the tunnel; Docker Desktop and the host must stay available.

The starting point was an Express/MySQL application with missing Compose environment configuration, browser API URLs pointing to localhost, and pages containing sample HTML or scripts for unrelated features. Keeping MySQL preserves its existing schema and APIs. Compose now waits for the base import marker; the API then applies demo migrations once before it listens. The shared module UI covers 92 routes, including 21 demo registers for features without an external service. Policy text and informational pages remain static.

Checks against the running stack:

- First-run import produced 101 users. Both demo migrations ran once. MySQL and Redis are accessible only on the Compose network.
- The Chromium audit visited 117 pages without uncaught page errors. It loaded real API responses; no response mocks were used.
- The browser created and edited an objective, exported a CSV, submitted an expense and a leave request, approved that leave as admin, and verified that the employee saw the approval.
- After `docker compose down` and `docker compose up -d --wait`, the same database IDs, status values and fixture counts were present. Browser verification through Cloudflare repeated the persistence, role restriction, CSV and PDF checks. The unauthenticated external API returned 401.
- The tunnel protects this synthetic demo with a private access code. The seeded application logins are demo accounts. No Anthropic key or external biometric, credit or incident provider is configured.

See [the README](../README.md) for startup and test commands.
