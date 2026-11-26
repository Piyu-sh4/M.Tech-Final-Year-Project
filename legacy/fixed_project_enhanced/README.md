# ⚡ Workforce Intelligence Platform v6.0

> AI-Powered HR, Payroll, Attendance & Task Management  
> Node.js · Express · MySQL · Claude AI

---

## 🚀 Quick Start (5 Minutes)

### Step 1 — Install Dependencies
```bash
npm install
```

### Step 2 — Configure Environment
```bash
cp .env.example .env
# Open .env and fill in your MySQL password and JWT secret
```

### Step 3 — Create Database & Run Migrations
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS workforce_intelligence;"
mysql -u root -p workforce_intelligence < database/schema.sql
mysql -u root -p workforce_intelligence < database/migrate_v5.1.sql
mysql -u root -p workforce_intelligence < database/migrate_v6.0.sql
```

### Step 4 — Seed the Admin User (⚠️ Required First!)
```bash
# Creates admin@wip.com / Admin@123  (role_id=1, status=active)
# Must run BEFORE seed_all_employees.sql
mysql -u root -p workforce_intelligence < database/seed_admin.sql
```

### Step 4b — Seed All 10 Team Members
```bash
# Seeds all employees: Piyush, Harsh, Kartik, Riya, Divya + original 5
mysql -u root -p workforce_intelligence < database/seed_all_employees.sql
```

### Step 5 — Start the Server
```bash
npm start          # production
npm run dev        # development (auto-restart on file changes)
```

### Step 6 — Open the App
Open `frontend/login.html` in your browser — **no build step needed**.

---

## 🐛 Registration Fix (v6.0)

The registration bug where form data was not saving to the database has been fixed:

| Bug | Root Cause | Fix Applied |
|-----|-----------|------------|
| Data not saved | `mysql2` pool incompatible with callback-style model | Reverted `db.js` to `mysql` package |
| CORS error on file:// | CORS not handling pre-flight requests | Added `app.options('*', cors())` |
| Missing phone field | INSERT query didn't include `phone` column | Added `phone` to INSERT statement |
| No error feedback | Errors silently swallowed | Added `console.error` + full error in dev mode |
| Password hint unclear | Hint text too vague | Added example: `Piyush@123` |
| No strength meter | - | Added real-time password strength indicator |
| UX: no loading state | Button not disabled during submit | Added spinner + disabled state |

---

## 👥 Team — 10 Employees Seeded

| # | Name | Role | Dept | Salary | Points | Login |
|---|------|------|------|--------|--------|-------|
| 1 | **Harsh Vardhan** | Manager | Engineering | ₹1,35,000 | 2,980 🥇 | harsh.vardhan@wip.com |
| 2 | **Priya Sharma** | Employee | Engineering | ₹85,000 | 2,840 | priya.sharma@wip.com |
| 3 | **Piyush Sharma** ⭐ | Employee | Engineering | ₹72,000 | 2,200 | piyush.sharma@wip.com |
| 4 | **Rahul Mehta** | Manager | Product | ₹1,20,000 | 2,640 | rahul.mehta@wip.com |
| 5 | **Sneha Patel** | Employee | Engineering | ₹78,000 | 2,480 | sneha.patel@wip.com |
| 6 | **Vikram Nair** | HR | HR | ₹95,000 | 2,110 | vikram.nair@wip.com |
| 7 | **Riya Kapoor** | Employee | Marketing | ₹70,000 | 2,050 | riya.kapoor@wip.com |
| 8 | **Divya Menon** | Employee | Finance | ₹75,000 | 1,980 | divya.menon@wip.com |
| 9 | **Kartik Jaiswal** | Employee | Product | ₹68,000 | 1,850 | kartik.jaiswal@wip.com |
| 10 | **Aisha Khan** | Employee | Design | ₹65,000 | 1,920 | aisha.khan@wip.com |

**Default password pattern:** `Name@123` — e.g. `Piyush@123`, `Harsh@123`

---

## 👤 Mr. Piyush Sharma — Complete Data

`seed_piyush_sharma.sql` populates **every table** in the database:

| Table | Records | Details |
|-------|---------|---------|
| `users` | 1 | Full profile: DOB 22 Jul 1998, Noida address, emergency contact, joined 14 Nov 2022 |
| `user_permissions` | 1 | All 9 permission flags enabled |
| `attendance` | 23 | Apr–May 2025 with OT hours, late marks, half-day |
| `leave_requests` | 4 | Approved, rejected, pending, half-day |
| `leave_balances` | 5 | Sick/Casual/Earned with carry-forward |
| `salary_records` | 6 | Nov 2024 – Apr 2025. Gross ₹79,800, Net ₹69,000 |
| `salary_line_items` | 10 | Basic, HRA, Travel, Medical, Special, PF, PT, Advance deduction |
| `salary_revisions` | 4 | ₹60K → ₹72K → ₹78K → current |
| `salary_advances` | 2 | ₹20K approved, ₹15K pending |
| `expense_claims` | 5 | Cab, lunch, keyboard, Pune travel, AWS exam |
| `tasks` | 9 | 4 completed, 2 in progress, 2 pending, 1 overdue |
| `task_logs` | 10 | Full status history |
| `task_comments` | 8 | Back-and-forth with Harsh Vardhan |
| `task_suggestions` | 3 | AI recommendations |
| `achievements` | 4 | Outstanding, Excellent, Weekly Star, Monthly Star |
| `productivity_scores` | 6 | Monthly scores Nov 2024–May 2025 |
| `alerts` | 8 | Salary paid, leave approved/rejected, overdue task, achievements |
| `employee_documents` | 7 | Offer letter, contract, Aadhaar, PAN, B.Tech, AWS cert, increment letter |
| `audit_logs` | 10 | All admin actions on Piyush's account |
| `reports` | 1 | Full HR profile report with JSON summary |

---

## 📁 Project Structure

```
workforce-intelligence-platform-v6.0/
├── backend/
│   ├── server.js                    ← Entry point (port 5000)
│   ├── app.js                       ← Express + CORS + routes (FIXED)
│   ├── config/
│   │   └── db.js                    ← MySQL pool (FIXED: uses mysql not mysql2)
│   ├── controllers/
│   │   ├── adminController.js       ← 61 functions
│   │   ├── authController.js        ← FIXED: registration saves correctly
│   │   ├── taskController.js        ← Full task management
│   │   ├── chatController.js        ← AI chat (salary permission-gated)
│   │   ├── reportController.js      ← Report generation + CSV export
│   │   ├── analyticsController.js   ← 7 endpoints
│   │   └── uploadController.js      ← File uploads
│   ├── middleware/
│   │   ├── authMiddleware.js        ← JWT + 4 role guards
│   │   └── auditMiddleware.js       ← Auto audit logging
│   ├── models/
│   │   ├── userModel.js             ← All v6.0 fields
│   │   ├── taskModel.js             ← Task operations
│   │   └── reportModel.js           ← Report CRUD
│   ├── routes/
│   │   ├── adminRoutes.js           ← 62 routes
│   │   ├── authRoutes.js            ← Auth + profile
│   │   ├── taskRoutes.js            ← Tasks + comments
│   │   └── ...6 more route files
│   └── services/
│       ├── analyticsService.js      ← Productivity engine
│       ├── ragService.js            ← AI context builder
│       └── fileParserService.js     ← CSV/XLSX/PDF parser
├── frontend/                        ← 20 HTML pages (no build step)
│   ├── register.html                ← FIXED: data now saves correctly
│   ├── login.html                   ← Glassmorphism design
│   ├── admin-dashboard.html         ← 8 HR stat cards
│   ├── employee-dashboard.html      ← Leave balance widget
│   ├── salary.html                  ← Payroll + advances + expenses
│   ├── leave.html                   ← Balance tracking + holidays
│   ├── shifts.html                  ← Shift CRUD + OT summary
│   ├── audit-log.html               ← Admin action trail
│   └── ...12 more pages
└── database/
    ├── schema.sql                   ← Base schema
    ├── migrate_v5.1.sql             ← Attendance, salary, leave
    ├── migrate_v6.0.sql             ← 10 new tables
    ├── seed_piyush_sharma.sql       ← Piyush: all 20 tables
    └── seed_all_employees.sql       ← Full 10-person team
```

---

## 🔌 Key API Endpoints

### Public
```
POST /api/auth/register     ← Registration (FIXED)
POST /api/auth/login
```

### Authenticated
```
GET  /api/auth/me
PUT  /api/auth/profile
PUT  /api/auth/change-password
GET  /api/admin/dashboard/stats
GET  /api/admin/salary
POST /api/admin/salary/generate
GET  /api/admin/leave
GET  /api/admin/attendance/summary
GET  /api/admin/shifts
GET  /api/admin/holidays
GET  /api/admin/leave-balances/:user_id
GET  /api/admin/salary-advances
GET  /api/admin/expense-claims
GET  /api/admin/audit-logs
GET  /api/tasks/my
POST /api/tasks
```

---

## 🔒 Roles & Access

| ID | Role | Access |
|----|------|--------|
| 1 | Admin | Full access |
| 2 | Employee | Own data only |
| 3 | Manager | Team management |
| 4 | HR | HR & payroll |

---

## 🔐 Security

- JWT tokens expire in **8 hours** (enforced server-side)
- Password policy: **8+ chars, 1 uppercase, 1 number**
- All admin mutations logged to `audit_logs`
- AI chat: salary data only shown to users with `can_view_salary = 1`
- Change `JWT_SECRET` in `.env` before any deployment

---

*Workforce Intelligence Platform v6.0*  
*Node.js + Express + MySQL + Claude AI*  
*10 employees · 20 frontend pages · 62 API routes · 20+ database tables*
