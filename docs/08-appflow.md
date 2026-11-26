> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# 🔀 App Flow — Workforce Intelligence

## 1. Authentication Flow

```
┌──────────┐     ┌─────────────┐     ┌───────────────────┐
│  Browser │────▶│ Login Page  │────▶│  POST /api/login  │
└──────────┘     └─────────────┘     └────────┬──────────┘
                                               │ JWT + role
                      ┌────────────────────────▼──────────┐
                      │         Role-Based Redirect        │
                      ├─── admin  ──▶ admin-dashboard.html │
                      ├─── hr     ──▶ admin-dashboard.html │
                      ├─── manager──▶ manager.html         │
                      └─── employee─▶ employee-dashboard.html
```

**Token Storage**: `localStorage.token` (JWT, 8h)  
**Role Storage**: `localStorage.role`, `localStorage.user` (JSON)  
**On Expiry**: Middleware redirects to `login.html` with `?expired=1`

---

## 2. Global App Shell Flow

Every app page follows this shell:

```
Page Load
    │
    ▼
Init Script (S1)
    │── Check localStorage.token → if missing → redirect login.html
    │── Parse localStorage.user → populate sidebar user name
    │── Apply dark mode (localStorage.wfi_dark_mode)
    │── Show cookie banner (if !localStorage.wfi_ck)
    │── Connect Socket.io (real-time notifications)
    │
    ▼
Page-Specific Script (S2)
    │── Fetch API data (with Bearer token)
    │── Render charts / tables / KPIs
    │── Bind tab buttons (showTab)
    │── Bind export buttons (dlPrint, dlCSV)
    │
    ▼
wfi-utils (S3 — always last)
    └── Ensure all global functions defined:
        dlPrint, dlCSV, showTab, switchTab,
        tdm, st, logout, ac, dc + 60 stubs
```

---

## 3. Module Flow Maps

### 3.1 Payroll Processing Flow
```
HR Dashboard
    │
    ▼
salary.html
    │── Select Month + Year
    │── Click "Run Payroll"
    │     └── POST /api/payroll/run
    │          └── Calculate: PF, ESI, TDS, LWF, Net
    │          └── Write payslip records
    │          └── Create audit log
    │
    ├── View KPIs (Total Payroll, Employees, Deductions)
    ├── Print Report ──▶ dlPrint (formatted table, ₹ amounts)
    ├── Export CSV  ──▶ dlCSV (all employees, all fields)
    │
    ▼
payslip-portal.html
    │── Employee self-service view
    │── Download payslip ──▶ dlPrint
    │── Email payslip   ──▶ POST /api/payslip/email
    │
    ▼
tax-portal.html
    │── TDS summary by quarter
    │── Form 24Q generation ──▶ Print / TRACES upload
    │── Investment declarations ──▶ investment-declaration.html
```

### 3.2 Leave Management Flow
```
leave.html (Employee view)
    │── Apply Leave
    │     ├── Select type (Annual/Sick/Casual/Comp-off...)
    │     ├── Select dates
    │     ├── Check balance (GET /api/leave/balance)
    │     └── Submit ──▶ POST /api/leave/apply
    │                └── Notify manager via Socket.io + email
    │
    ▼
leave.html (Manager view) / Manager Dashboard
    │── Pending Approvals widget
    │── Approve/Reject ──▶ PUT /api/leave/:id/approve
    │                  └── Deduct from balance
    │                  └── Notify employee
    │
    ▼
Payroll Integration
    └── Deduct LOP from net salary (if leave without pay)
```

### 3.3 Attendance Flow
```
attendance.html
    │── Select capture method:
    │     ├── Fingerprint (WebAuthn API)
    │     ├── Face ID    (TensorFlow.js + MediaPipe)
    │     ├── QR Code    (camera scan)
    │     ├── PIN        (numeric keypad)
    │     ├── GPS        (Leaflet.js geolocation)
    │     └── RFID       (card tap → API event)
    │
    ├── Mark Attendance ──▶ POST /api/attendance/mark
    │                    └── Log: employee, method, timestamp, location
    │
    ├── Regularisation request (for missed/wrong punch)
    │     └── POST /api/attendance/regularise
    │
    └── Print/CSV report ──▶ dlPrint / dlCSV
```

### 3.4 Hiring & Onboarding Flow
```
hiring.html
    │── Post Job ──▶ POST /api/hiring/jobs
    │── Pipeline view (Applied → Screened → Interviewed → Offered → Joined)
    │── Interview Scheduler ──▶ interview-scheduler.html
    │── Background Check ──▶ background-verification.html
    │── Send Offer ──▶ Generate letter ──▶ Print / Email
    │
    ▼ (Candidate accepts)
    │
onboarding.html
    │── Auto-create employee record
    │── Assign checklist (documents, IT setup, induction)
    │── Buddy assignment
    │── Registration number assigned (EMP-YYYY-NNNN)
    │
    ▼ (Probation period)
    │
probation.html ──▶ confirmation-letter.html
```

### 3.5 Performance Review Flow
```
performance.html
    │── Tab: Overview    ──▶ KPIs, rating distribution
    │── Tab: Self-Assess ──▶ 4-criteria form (Quality, Teamwork, Achievements, Goals)
    │     └── Submit ──▶ POST /api/performance/self-assess
    │
    │── Tab: 360 Review  ──▶ Manager + Peer + Report feedback
    │── Tab: PIP Tracker ──▶ Active improvement plans
    │── Tab: Goals       ──▶ Link to goals-okr.html
    │
    └── Print / PDF ──▶ dlPrint (formatted review summary)
```

### 3.6 AI Assistant Flow
```
ai-assistant.html
    │── User types query (or voice input)
    │── System: Retrieve relevant policy chunks (TF-IDF RAG)
    │── POST /api/ai/assistant
    │     └── {message, context: [policy_chunks], history: [...]}
    │── Stream response from Claude Sonnet
    │── Render markdown in chat bubble
    │── Save to conversation history (localStorage)
```

### 3.7 Employee Self-Service Flow
```
employee-self-service.html
    │── 12 Quick Action tiles:
    │     ├── Apply Leave ──▶ leave.html
    │     ├── View Payslip ──▶ payslip-portal.html
    │     ├── Book Cab ──▶ cab-booking.html
    │     ├── Raise IT Ticket ──▶ helpdesk.html
    │     ├── Download Certificate ──▶ dlPrint
    │     ├── Update Profile ──▶ profile.html
    │     ├── View Benefits ──▶ benefits.html
    │     ├── Submit Expense ──▶ expenses.html
    │     ├── View Salary Revision ──▶ salary-revision.html
    │     ├── Book Training ──▶ training.html
    │     ├── Emergency SOS ──▶ 112-emergency.html
    │     └── Mental Health ──▶ mental-health.html
    │
    │── Tab: My Requests
    │     ├── View: Pending | Approved | Rejected
    │     ├── Download approved docs ──▶ dlPrint
    │     └── New Request ──▶ POST /api/requests/new
```

---

## 4. Navigation Flow (Sidebar)

```
WFI Sidebar
├── 🏠 Dashboards
│   ├── Admin Dashboard
│   ├── Employee Dashboard
│   └── Manager Dashboard
├── 👥 HR Management
│   ├── Attendance
│   ├── Leave
│   ├── Hiring & ATS
│   ├── Onboarding
│   ├── Performance
│   ├── Training & LMS
│   ├── Goals & OKR
│   └── Exit Management
├── 💰 Payroll & Finance
│   ├── Payroll Processing
│   ├── Payslip Portal
│   ├── Salary Revision
│   ├── TDS / Tax Portal
│   ├── IT Declaration
│   ├── Statutory Bonus
│   ├── LWF Tracker
│   └── Benefits
├── ⚖️ Compliance
│   ├── Statutory Compliance
│   ├── Form 24Q
│   └── Privacy Policy
├── 🤖 AI & Intelligence
│   ├── AI Assistant
│   ├── HR Copilot
│   └── AI Insights
├── 🛡️ Security
│   ├── Fraud Detection
│   └── Cybersecurity
├── 📊 Analytics
│   ├── Analytics Dashboard
│   └── Reports Center
├── ✨ New Modules
│   ├── Face Recognition
│   ├── Biometric Enrollment
│   ├── 112 Emergency
│   ├── Visitor Management
│   ├── Mental Health & EAP
│   ├── Women Safety
│   ├── Cab Booking
│   ├── Shift Bidding
│   └── Employee Self-Service
└── ⚙️ Admin
    ├── Settings
    ├── Audit Log
    ├── Session Management
    └── Data Export
```

---

## 5. Error Flow

```
API Error ──▶ window.st("Error message", false)   [red toast]
API Success─▶ window.st("Success message", true)  [green toast]
Auth Expired─▶ redirect to login.html?expired=1
404 Page ───▶ redirect to login.html
JS Error ───▶ caught by try/catch, shown as toast (never silent)
Print Fail──▶ window.st("Print window blocked. Allow popups.", false)
CSV Fail ───▶ window.st("Export failed. Try again.", false)
```
