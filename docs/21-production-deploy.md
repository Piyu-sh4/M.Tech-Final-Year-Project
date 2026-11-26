> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# 🚀 Production Deploy — Workforce Intelligence

## Pre-Deploy Checklist

```
[ ] All WA tests passed and signed off
[ ] npm audit — 0 critical vulnerabilities
[ ] npm run audit:frontend — 116/116 pages pass
[ ] npm run test:statutory — 100% accuracy
[ ] Load test — p95 < 200ms at 200 concurrent users
[ ] .env.production reviewed, all secrets rotated
[ ] SSL certificate valid (> 30 days remaining)
[ ] Database backup taken
[ ] Rollback plan documented
[ ] On-call engineer available during deployment
[ ] Maintenance page ready
```

---

## Infrastructure (AWS — Recommended)

```
┌─────────────────────────────────────────────┐
│  Route 53 (DNS) → CloudFront (CDN + WAF)    │
│       ↓                                     │
│  Application Load Balancer                  │
│       ↓                    ↓                │
│  EC2 Auto-Scaling Group (Node.js × 2)       │
│       ↓                                     │
│  RDS MySQL 8.0 (Multi-AZ)                   │
│  ElastiCache Redis (Cluster)                │
│  S3 (documents, payslips, uploads)          │
│  CloudWatch (logs + alerts)                 │
└─────────────────────────────────────────────┘
```

### Minimum Production Specs
| Service | Spec | Cost (approx/mo) |
|---|---|---|
| EC2 (×2) | t3.medium (2vCPU, 4GB) | ₹12,000 |
| RDS MySQL | db.t3.medium, Multi-AZ | ₹18,000 |
| ElastiCache | cache.t3.micro | ₹4,000 |
| S3 | 100GB | ₹800 |
| CloudFront | 1TB transfer | ₹3,500 |
| **Total** | | **~₹38,300/mo** |

---

## Deployment Steps

### Step 1 — Environment Setup
```bash
# On production server
git clone https://github.com/your-org/workforce-intelligence.git
cd workforce-intelligence

# Copy and configure production env
cp .env.example .env.production
nano .env.production  # Set all production values
```

### Step 2 — Production `.env` Critical Values
```env
NODE_ENV=production
PORT=5000
APP_URL=https://wfi.yourcompany.com
DB_HOST=your-rds-endpoint.rds.amazonaws.com
REDIS_HOST=your-elasticache-endpoint
JWT_SECRET=<generate: openssl rand -hex 32>
ENCRYPTION_KEY=<generate: openssl rand -base64 32>
ANTHROPIC_API_KEY=sk-ant-prod-key
CORS_ORIGIN=https://wfi.yourcompany.com
```

### Step 3 — Database Initialisation
```bash
# First deploy only, on an EMPTY database (as the MySQL admin user):
mysql -u root -p -e "CREATE DATABASE workforce_intelligence CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p workforce_intelligence < database/init/01_init.sql
mysql -u root -p workforce_intelligence < database/init/02_master.sql
```
There is no migration framework. For schema changes after go-live, write and test explicit `ALTER`
statements against a copy of production data first, and take a snapshot before applying them.

> Before going live: change every demo password. `02_master.sql` sets all seeded accounts to `P123/`.

### Step 4 — Build & Start
```bash
# Install production dependencies only
npm ci --omit=dev

# Start with PM2 (process manager)
pm2 start server.js --name wfi-prod --instances 2 --exec-mode cluster
pm2 save
pm2 startup  # auto-restart on server reboot
```

### Step 5 — Nginx Configuration
```nginx
# /etc/nginx/sites-available/wfi
server {
    listen 80;
    server_name wfi.yourcompany.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name wfi.yourcompany.com;

    ssl_certificate     /etc/letsencrypt/live/wfi.yourcompany.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wfi.yourcompany.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    # Static files
    location / {
        root /var/www/wfi/frontend;
        try_files $uri $uri/ /login.html;
        expires 1h;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Step 6 — SSL Certificate
```bash
# Free SSL with Let's Encrypt
sudo certbot --nginx -d wfi.yourcompany.com
# Auto-renewal (already set up by certbot)
sudo certbot renew --dry-run
```

### Step 7 — Verify Deployment
```bash
# Health check
curl https://wfi.yourcompany.com/api/health
# Expected: {"status":"ok","version":"12.0","db":"connected","redis":"connected"}

# Test login
curl -X POST https://wfi.yourcompany.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@wip.com","password":"P123/"}'
# Expected: {"success":true,"data":{"token":"..."}}
```

---

## CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:statutory
      - run: npm run audit:frontend

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to EC2
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_KEY }}
          script: |
            cd /var/www/wfi
            git pull origin main
            npm ci --omit=dev
            pm2 reload wfi-prod --update-env
```

---

## Rollback Plan
```bash
# 1. Immediate rollback (< 5 minutes)
pm2 stop wfi-prod
git checkout v11.9.0  # previous stable tag
npm ci --omit=dev
pm2 start wfi-prod

# 2. Database rollback (if a schema change was applied)
# Restore the pre-deploy snapshot — there is no automatic down-migration

# 3. Full rollback from backup
# Restore RDS snapshot from pre-deploy backup
# Restore S3 files from versioned backup
```

---

## Post-Deploy Verification (30 mins)
```
[ ] Login works for all 4 roles
[ ] Payroll summary loads correctly
[ ] AI Assistant responds
[ ] Real-time attendance feed active
[ ] Email notifications sending
[ ] PDF/print reports working
[ ] SSL certificate valid (A+ on ssllabs.com)
[ ] No errors in CloudWatch logs (15 min watch)
[ ] Response times < 200ms on key endpoints
[ ] All 116 app pages load without JS errors
```
