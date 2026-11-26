> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# 👥 Define Users — Workforce Intelligence

## User Roles & Personas

---

### 1. 🔴 System Administrator
**Login**: `admin@wip.com` / `P123/`
**Access**: All 121 pages — unrestricted

**Profile**: Priya Sharma, IT Head, 8 years experience
**Goals**:
- Manage all users, roles, and permissions
- Monitor system health, audit logs, session management
- Configure payroll structures, grades, statutory settings
- Run bulk operations (import/export employees)
- Access fraud detection and security dashboards

**Key Pages**: Admin Dashboard, Settings, Audit Log, Session Management,
User Management, Data Export, Fraud Detection, Cybersecurity

**Pain Points Solved**:
- Unified dashboard instead of 6 separate tools
- Real-time fraud and anomaly alerts
- DPDP-compliant data handling with full audit trail

---

### 2. 🟡 HR Manager
**Login**: `hr@wfintelligence.com` / `P123/`
**Access**: HR modules, payroll, compliance, reports, hiring

**Profile**: Ravi Kumar, HR Business Partner, 6 years experience
**Goals**:
- Process monthly payroll with zero errors
- Manage entire employee lifecycle (hire to exit)
- Track compliance (PF, ESI, TDS, LWF, Bonus)
- Run reports, generate letters, handle grievances
- Conduct performance reviews and manage training

**Key Pages**: Payroll, Payslip Portal, Hiring & ATS, Onboarding, Performance,
Training, Compliance, Reports, Letter Management, Investment Declaration

**Pain Points Solved**:
- One-click payroll with automatic statutory deductions
- AI HR Copilot for policy queries and letter drafting
- Automated Form 24Q, LWF challan, bonus calculation
- POSH complaint tracking with ICC dashboard

---

### 3. 🟢 Team Manager
**Login**: `manager@wfintelligence.com` / `P123/`
**Access**: Team management, approvals, performance, analytics

**Profile**: Sneha Reddy, Engineering Manager, 5 years experience
**Goals**:
- Approve leave, expenses, travel, regularisation requests
- Review team performance, set and track goals
- View team analytics, headcount, attrition data
- Conduct 360° reviews, set OKRs
- Manage shift schedules and project allocations

**Key Pages**: Manager Dashboard, Leave (approvals), Performance,
Goals & OKR, Analytics, Attendance, Training, Shift Roster, Projects

**Pain Points Solved**:
- Mobile-friendly approval workflows
- AI-powered team performance insights
- Real-time headcount and attrition dashboards

---

### 4. 🔵 Employee (Self-Service)
**Login**: `employee@wfintelligence.com` / `P123/`
**Access**: Self-service portal — personal HR data only

**Profile**: Arjun Nair, Software Engineer, 2 years experience
**Goals**:
- View and download payslips (₹ amounts, Form 16)
- Apply for leave, check balance, track status
- Submit IT investment declaration
- Book cab for late-night travel (women's safety)
- Access mental health / EAP services
- Submit My Requests (certificates, equipment, WFH)
- Check shift schedule, bid for preferred shifts

**Key Pages**: Employee Dashboard, Payslip Portal, Leave, Employee Self-Service,
Cab Booking, Mental Health, Festival Calendar, Benefits, Investment Declaration

**Pain Points Solved**:
- 24/7 self-service without emailing HR
- Payslip available on mobile with ₹ symbol
- Emergency SOS and women's safety cab at one click
- My Requests tab for all pending/approved requests

---

## User Journey Maps

### Payroll Processing (HR Manager)
```
Month-end → Run Payroll → Review Exceptions → Approve → Generate Payslips
→ Email/Notify Employees → Submit Challans (PF/ESI/TDS) → Archive
```

### Leave Application (Employee)
```
Apply Leave → Select Dates → Check Balance → Submit → Manager Gets Alert
→ Manager Approves/Rejects → Employee Notified → Calendar Updated → Payroll Deducted
```

### New Hire Onboarding (HR + Employee)
```
Offer Letter Sent → Employee Registers → ID Created → Checklist Assigned
→ Documents Collected → Buddy Assigned → Induction Scheduled → Probation Starts
```

### Monthly Compliance (HR Manager)
```
Payroll Locked → Auto-calc PF/ESI/TDS/LWF → Review Dashboard → Generate Challans
→ Download Form 24Q → Upload to TRACES → Mark Compliant → Report to CFO
```

## Accessibility & Inclusivity
- All pages responsive (mobile-first)
- Dark mode toggle on every page
- Cookie consent (GDPR + DPDP compliant)
- Women's safety features: mandatory night cab, 181 helpline, SOS
- Mental health: stigma-free EAP with 12 free sessions/year
- Multi-language ready (i18n hooks in place)
