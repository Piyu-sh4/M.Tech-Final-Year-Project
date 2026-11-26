> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# 📡 Monitoring — Workforce Intelligence

## Monitoring Stack

```
Application → Winston Logger → CloudWatch Logs → CloudWatch Alarms → SNS → PagerDuty/Slack
             → Prometheus metrics → Grafana dashboards
             → Sentry (error tracking)
```

---

## Key Metrics to Monitor

### Application Health
| Metric | Alert Threshold | Critical |
|---|---|---|
| API response time (p95) | > 500ms | > 2000ms |
| API error rate (5xx) | > 1% | > 5% |
| Active WebSocket connections | > 400 | > 500 |
| Memory usage | > 75% | > 90% |
| CPU usage | > 70% | > 85% |
| Node.js event loop lag | > 100ms | > 500ms |

### Database Health
| Metric | Alert Threshold | Critical |
|---|---|---|
| Query response time (p95) | > 100ms | > 500ms |
| Active connections | > 80% pool | > 95% pool |
| Slow queries (> 1s) | > 5/min | > 20/min |
| Replication lag (Multi-AZ) | > 5s | > 30s |
| Disk usage | > 70% | > 85% |

### Business Metrics (Daily Check)
| Metric | Purpose |
|---|---|
| Payroll runs completed | Verify month-end processing |
| Failed login attempts | Detect brute-force attacks |
| Active sessions | Usage baseline |
| API calls to Claude | AI cost control |
| File uploads | Storage growth rate |
| Leave requests processed | HR activity baseline |

---

## CloudWatch Alarms

```bash
# Create key alarms (run once during setup)

# API 5xx errors
aws cloudwatch put-metric-alarm \
  --alarm-name "WFI-API-5xx-High" \
  --metric-name "HTTPCode_Target_5XX_Count" \
  --threshold 10 \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:ap-south-1:xxx:wfi-alerts

# DB connections near limit
aws cloudwatch put-metric-alarm \
  --alarm-name "WFI-DB-Connections-High" \
  --metric-name "DatabaseConnections" \
  --threshold 80 \
  --evaluation-periods 3 \
  --alarm-actions arn:aws:sns:ap-south-1:xxx:wfi-alerts
```

---

## Application Logging

### Log Levels & Format
```js
// backend/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({ level: 'debug' })  // dev only
  ]
});

// Log format:
// {"timestamp":"2026-10-08T10:30:00Z","level":"info","message":"Payroll run",
//  "user_id":1,"month":"09","year":"2026","employees":47,"total_ms":18420}
```

### What to Log
```js
// ✅ LOG these:
logger.info('Payroll run started', { user_id, month, year });
logger.warn('Failed login attempt', { email, ip, attempt_count });
logger.error('DB connection failed', { error: err.message });

// ❌ NEVER LOG:
logger.info('User logged in', { password: req.body.password }); // BANNED
logger.debug('Employee data', { pan: employee.pan });           // BANNED
```

---

## Health Check Endpoint

```js
// GET /api/health
{
  "status": "ok",
  "version": "12.0",
  "uptime_seconds": 86400,
  "db": "connected",
  "redis": "connected",
  "ai": "ready",
  "memory_mb": 312,
  "cpu_percent": 24,
  "timestamp": "2026-10-08T10:30:00Z"
}
```

Checked every 30s by load balancer. If it fails → instance removed from rotation.

---

## Grafana Dashboards

### Dashboard 1 — Platform Overview
- Active users (real-time)
- API requests/minute
- Error rate %
- Response time heatmap
- Top 10 slowest endpoints

### Dashboard 2 — Payroll Health
- Monthly payroll runs (success/fail)
- Total payroll processed (₹)
- PF/ESI/TDS amounts
- Statutory filing status
- Compliance score %

### Dashboard 3 — Security
- Failed login attempts (map by IP)
- Fraud detection alerts
- Anomaly scores
- Active sessions by role
- Data export events

### Dashboard 4 — AI Usage
- Claude API calls/day
- Average response time
- Token usage (cost tracking)
- Top query categories
- Error rate

---

## Alerting & Incident Response

### Severity Levels
| Level | Example | Response Time | Action |
|---|---|---|---|
| P0 — Critical | Site down, payroll failed | 15 min | All hands, war room |
| P1 — High | API > 5s, DB unreachable | 30 min | On-call engineer |
| P2 — Medium | Memory > 80%, slow queries | 2 hours | Business hours |
| P3 — Low | Log anomaly, disk > 70% | Next day | Scheduled fix |

### Incident Response Steps
```
1. Alert fires → PagerDuty → On-call engineer notified
2. Engineer acknowledges (within SLA)
3. Check /api/health → identify failing component
4. Check CloudWatch logs → find root cause
5. Apply fix or rollback
6. Verify fix (health check green + metrics normal)
7. Write incident report (what, why, fix, prevention)
8. Post-incident review within 48 hours
```

---

## Monthly Health Report (Auto-Generated)
```
Sent to CTO + HR Director on 1st of each month:

Uptime:           99.7% (target 99.5%)
Avg Response:     142ms (target < 200ms)
Errors (P1+P2):   2 incidents
Payroll Runs:     1 successful, 0 failed
Compliance:       All statutory filings on time
Security Events:  3 failed brute-force (blocked)
AI API Cost:      ₹4,200
Storage Used:     87GB (+3GB MoM)
Active Users:     142 (peak: 187)
```
