> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# 🛠️ Setup Guide — Workforce Intelligence

## Prerequisites

| Tool | Min Version | Check |
|---|---|---|
| Node.js | 18.0.0 LTS | `node --version` |
| npm | 9.0.0 | `npm --version` |
| Docker | 24.0.0 | `docker --version` |
| Docker Compose | 2.20.0 | `docker compose version` |
| MySQL | 8.0 (via Docker) | — |
| Git | 2.40.0 | `git --version` |

---

## Quick Start (Docker — Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/workforce-intelligence.git
cd workforce-intelligence

# 2. Configure environment
cp .env.example .env
# Edit .env with your values (see Configuration section)

# 3. Install Node dependencies (skip Puppeteer browser download)
PUPPETEER_SKIP_DOWNLOAD=true npm install

# 4. Start all services
docker compose up -d

# 5. Wait ~60-90s on first start. MySQL loads the full schema (125 tables + 2 views)
#    and demo data automatically from database/init/ — there is no separate seed step.
docker compose ps
curl http://localhost:5000/api/health   # expect: "db":"connected"

# 6. Open the app
open http://localhost:5000/login.html
```

---

## Environment Configuration (`.env`)

```env
# ─── Server ───────────────────────────────────────────────
NODE_ENV=development
PORT=5000
APP_URL=http://localhost:5000

# ─── Database ─────────────────────────────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_NAME=workforce_intelligence
DB_USER=wfi_user
DB_PASS=your_secure_password_here
DB_POOL_MIN=2
DB_POOL_MAX=10

# ─── Redis ────────────────────────────────────────────────
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASS=your_redis_password

# ─── Authentication ───────────────────────────────────────
JWT_SECRET=your_256_bit_secret_minimum_32_characters
JWT_EXPIRY=8h
REFRESH_TOKEN_EXPIRY=7d
BCRYPT_SALT_ROUNDS=12

# ─── Anthropic AI ─────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-your-key-here
CLAUDE_MODEL=claude-sonnet-4-6
CLAUDE_MAX_TOKENS=1000

# ─── Email (Nodemailer) ───────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_app_password
EMAIL_FROM="Workforce Intelligence <hr@yourcompany.com>"

# ─── File Storage ─────────────────────────────────────────
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760   # 10MB

# ─── Security ─────────────────────────────────────────────
ENCRYPTION_KEY=your_32_byte_aes_key_here_base64
SESSION_SECRET=your_session_secret
CORS_ORIGIN=http://localhost:5000
RATE_LIMIT_WINDOW_MS=900000   # 15 minutes
RATE_LIMIT_MAX=100

# ─── Company Config ───────────────────────────────────────
COMPANY_NAME="Your Company Pvt. Ltd."
COMPANY_PAN=ABCDE1234F
COMPANY_TAN=ABCD12345E
COMPANY_EPF_CODE=MH/BAN/12345
COMPANY_ESI_CODE=31-00-123456-000-0001
```

---

## Docker Compose Services

```yaml
# docker-compose.yml services:
services:
  app:        Node.js API (port 5000)
  mysql:      MySQL 8.0 (port 3306)
  redis:      Redis 7 (port 6379)
  nginx:      Reverse proxy (port 80/443)
```

**Start**: `docker compose up -d`
**Stop**: `docker compose down`
**Logs**: `docker compose logs -f app`
**Restart**: `docker compose restart app`

---

## Manual Setup (Without Docker)

Requires MySQL 8.0 running locally. Every command below was run and verified.

```bash
cp .env.local .env                          # DB_HOST=localhost
PUPPETEER_SKIP_DOWNLOAD=true npm install

npm run db:create     # as MySQL root: creates workforce_intelligence + wfi_user (mysql_native_password)
npm run db:import     # as wfi_user: loads database/init/02_master.sql (125 tables, 2 views, demo data)
npm run db:verify     # prints table count and user count

npm run dev           # development (nodemon auto-reload)
npm start             # production
```

> **Why `mysql_native_password`?** The backend uses the `mysql` npm driver, which cannot authenticate
> against MySQL 8's default `caching_sha2_password`. `01_init.sql`, `db:create` and docker-compose
> all create the application user with `mysql_native_password`.
>
> **Why is `01_init.sql` not run by `db:import`?** It issues `CREATE USER`/`GRANT`, which only root may do.
> Docker runs it as root automatically; `db:create` does the same job for a local install.

Optional Redis (caching only; the app runs without it):
```bash
sudo apt install redis-server && sudo systemctl start redis
```

---

## Database Initialisation and Reset

There is no migration framework. The whole schema and demo data live in two files that run once,
in order, on an empty database:

| File | Runs as | Purpose |
|---|---|---|
| `database/init/01_init.sql` | root | Creates `workforce_intelligence` and the `wfi_user` account |
| `database/init/02_master.sql` | root (Docker) / `wfi_user` (local) | All tables, views and demo data |

```bash
docker compose down -v && docker compose up -d   # Docker: wipe and rebuild
npm run db:reset                                  # Local MySQL: drop and rebuild
```

Older SQL files from earlier schema generations are kept in `legacy/database/` for reference only.
Do **not** import them: several define the same tables with different columns.

---

## Default Credentials (Post-Seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@wip.com | P123/ |
| HR Manager | hr@wfintelligence.com | P123/ |
| Manager | manager@wfintelligence.com | P123/ |
| Employee | employee@wfintelligence.com | P123/ |

⚠️ **Change all default passwords immediately in production!**

---

## Verify Installation

```bash
# Check all services running
docker compose ps

# Check API health
curl http://localhost:5000/api/health

# Expected response:
# {"status":"ok","version":"12.0","db":"connected","redis":"connected","ai":"ready"}

# Run automated tests
npm test

# Run frontend audit (Playwright)
npm run audit:frontend
```

---

## Common Issues

| Issue | Fix |
|---|---|
| MySQL connection refused | Wait 30s after `docker compose up`, MySQL init takes time |
| Puppeteer crashes | Set `PUPPETEER_SKIP_DOWNLOAD=true` in environment |
| JWT errors | Ensure `JWT_SECRET` is at least 32 characters |
| AI not responding | Check `ANTHROPIC_API_KEY` is valid and has credits |
| File upload fails | Create `./uploads` directory, check permissions (`chmod 755`) |
| Port 5000 in use | Change `PORT=5001` in `.env`, update `docker-compose.yml` |
