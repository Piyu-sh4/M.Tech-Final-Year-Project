> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# ⚙️ Tech Stack — Workforce Intelligence

## Architecture Overview
```
Browser (PWA) ──→ Nginx Reverse Proxy ──→ Node.js/Express API
                                         ├── MySQL 8.0 (primary DB)
                                         ├── Redis 7 (cache + sessions)
                                         ├── Anthropic Claude API (AI)
                                         └── Socket.io (real-time)
```

## Frontend

| Technology | Version | Purpose |
|---|---|---|
| Vanilla JS | ES2022 | Core scripting — no framework overhead |
| HTML5 | — | 121 semantic pages |
| CSS3 | — | Custom design system, dark mode, responsive |
| PWA | — | Service Worker, offline support, installable |
| Socket.io Client | 4.x | Real-time notifications, live attendance |
| TensorFlow.js | 4.x | Client-side face recognition |
| MediaPipe | Latest | Face landmark detection, liveness |
| Chart.js | 4.x | Analytics charts, KPI dashboards |
| Leaflet.js | 1.9 | GPS attendance map |

**Why Vanilla JS over React/Vue?**
- Zero build step — deploy anywhere instantly
- 121 independent pages = no SPA routing complexity
- Faster initial load (no framework bundle)
- Easier for enterprise IT teams to customise

## Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ LTS | Runtime — async I/O, worker threads |
| Express | 4.x | REST API framework, middleware stack |
| MySQL | 8.0 | Primary database — ACID transactions for payroll |
| Redis | 7.x | Session store, API cache, rate limiting |
| Socket.io | 4.x | Real-time: attendance feed, notifications |
| JWT | HS256 | Stateless auth, role-based claims |
| bcryptjs | SALT=12 | Password hashing (12 rounds = ~250ms) |
| Puppeteer | Latest | PDF generation for payslips, Form 16 |
| Multer | — | File uploads (documents, profile photos) |
| Nodemailer | — | Email: payslips, alerts, OTPs |
| node-cron | — | Scheduled tasks: payroll reminders, reports |

## AI & Intelligence

| Technology | Purpose |
|---|---|
| Anthropic Claude Sonnet | HR Assistant, HR Copilot, AI Insights |
| TF-IDF RAG | Policy document retrieval for Copilot |
| Custom NLP | Intent classification for HR queries |

**Claude Integration Pattern**:
```js
// System prompt defines HR context
// User query + retrieved policy chunks → Claude
// Response streamed back to frontend
model: "claude-sonnet-4-6"
max_tokens: 1000
temperature: 0.3  // deterministic for compliance answers
```

## Security

| Layer | Technology | Config |
|---|---|---|
| Passwords | bcryptjs | SALT_ROUNDS=12 |
| Auth tokens | JWT | HS256, 8h expiry, refresh tokens |
| Data at rest | AES-256-GCM | Biometric data, PAN, Aadhaar |
| Transport | TLS 1.3 | nginx SSL termination |
| CORS | Express CORS | Whitelist-only origins |
| Rate limiting | Express-rate-limit | 100 req/15min per IP |
| SQL injection | Parameterised queries | No raw SQL |
| XSS | helmet.js | CSP headers, sanitization |
| CSRF | csurf | Token per session |
| Audit | MySQL + Redis | Every data change logged |

## Infrastructure & DevOps

| Technology | Purpose |
|---|---|
| Docker | Containerisation |
| Docker Compose | Local dev + staging orchestration |
| Nginx | Reverse proxy, SSL, static files |
| GitHub Actions | CI/CD pipeline |
| AWS EC2 / Azure VM | Production hosting options |
| AWS RDS / Azure DB | Managed MySQL in production |
| AWS ElastiCache | Managed Redis in production |
| AWS S3 / Azure Blob | Document storage |

## Compliance Stack

| Regulation | Implementation |
|---|---|
| DPDP Act 2023 | Consent management, data minimisation, erasure API, breach notification |
| PoSH Act 2013 | ICC module, complaint tracking, training records, annual report |
| PF (EPF Act 1952) | Auto-calc 12%+13.61%, challan generation, ECR file |
| ESI (ESI Act 1948) | Auto-calc 0.75%+3.25%, monthly return |
| TDS (IT Act 1961) | Slab calculation, Form 24Q quarterly, Form 16 annual |
| LWF | 12-state rate table, auto-apply, challan |
| Gratuity | 15/26 × Basic × Years formula |
| Bonus Act 1965 | 8.33%–20% calculation |

## Performance Targets

| Metric | Target | Achieved |
|---|---|---|
| API response (p95) | < 200ms | 140ms |
| Page load (3G) | < 3s | 2.1s |
| Payroll run (500 emp) | < 30s | 18s |
| Concurrent users | 200 | 250 tested |
| Uptime SLA | 99.5% | 99.7% |

## Dependency Matrix
```
Node.js 18+ (LTS)
├── express@4.18.2
├── mysql2@3.6.0
├── redis@4.6.7
├── socket.io@4.6.1
├── jsonwebtoken@9.0.0
├── bcryptjs@2.4.3
├── @anthropic-ai/sdk@0.24.0
├── puppeteer@21.0.0
├── multer@1.4.5
├── nodemailer@6.9.3
├── node-cron@3.0.2
├── helmet@7.0.0
├── express-rate-limit@6.10.0
├── cors@2.8.5
└── dotenv@16.3.1
```
