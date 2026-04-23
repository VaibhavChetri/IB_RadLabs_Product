# FRONTEND PROMPT — HRM: Unified Attendance + Leave + Payroll UI

> **Purpose**: Hand this prompt to an AI coding assistant to generate a production-grade React frontend for an integrated HR Management system. The UI challenge here is **merging three modules (attendance, leave, payroll) into one coherent experience** without cognitive overload.

---

## SYSTEM CONTEXT

You are building the **frontend** for an enterprise HRM system. Tech stack: **React 18+, TypeScript, Vite, TailwindCSS, TanStack Query (React Query), React Router v6, Zustand (state), React Hook Form + Zod (forms), date-fns (dates)**.

The backend APIs are already built. This UI serves three personas simultaneously:
1. **Employee** — views own attendance, applies for leave, sees own payslips
2. **Manager** — manages their team's attendance/leave, views team payroll summary
3. **HR/Admin** — runs payroll, manages all employees, configures system

**THE CORE UX CHALLENGE**: Attendance, leave, and payroll are deeply interconnected. An employee marks attendance → requests leave → leave affects attendance → LOP affects salary. The UI must make these connections **visible and navigable** without forcing users to jump between disconnected pages.

---

## DESIGN PHILOSOPHY

### Aesthetic Direction: **"Structured Clarity"**
Think Notion meets Linear meets a well-designed Indian banking dashboard. Clean, dense-but-readable, with a warm neutral palette that works for 8-hour daily use.

- **NOT** generic dashboardy (no gratuitous cards with big numbers and no context)
- **NOT** overly minimal (HR needs density — show data, not whitespace)
- **IS** information-rich with clear visual hierarchy
- **IS** action-oriented (every screen answers: "what do I need to do right now?")

### Typography
- **Display/Headings**: "DM Sans" or "Plus Jakarta Sans" — geometric, modern, professional without being cold
- **Body/Data**: "IBM Plex Sans" — excellent for tabular data, highly legible at small sizes
- **Monospace (employee codes, numbers)**: "JetBrains Mono" — clear digit distinction

### Color System (CSS Variables)
```css
:root {
  /* Base */
  --bg-primary: #FAFAF8;          /* Warm off-white, not clinical */
  --bg-secondary: #F1F0EC;
  --bg-surface: #FFFFFF;
  --text-primary: #1A1A18;
  --text-secondary: #6B6B66;
  --text-muted: #9C9C96;
  --border: #E5E4E0;
  --border-strong: #D1D0CC;

  /* Module Accents — each module gets a distinct but harmonious accent */
  --attendance-accent: #2563EB;   /* Blue — presence/time */
  --leave-accent: #D97706;        /* Amber — absence/away */
  --payroll-accent: #059669;      /* Emerald — money/salary */

  /* Status Colors */
  --status-present: #22C55E;
  --status-absent: #EF4444;
  --status-half-day: #F59E0B;
  --status-leave: #8B5CF6;
  --status-holiday: #06B6D4;
  --status-weekend: #9CA3AF;
  --status-lop: #DC2626;          /* Red — critical, affects salary */
  --status-pending: #F59E0B;
  --status-approved: #22C55E;
  --status-rejected: #EF4444;
}
```

### Layout Philosophy
- **Left sidebar** (collapsible, 64px collapsed / 240px expanded): Navigation + user context
- **Main content**: Max-width 1440px, fluid
- **No modals for primary actions** — use slide-over panels (right-side drawers, 480px wide) for detail views and forms
- **Modals only for confirmations** and quick actions

---

## INFORMATION ARCHITECTURE

### Navigation Structure (Sidebar)

```
┌─────────────────────────┐
│ 🏢 Company Name         │
│ ───────────────────────  │
│                          │
│ 📊 Dashboard             │  ← Unified home
│                          │
│ ATTENDANCE               │  ← Section label (blue dot)
│   📅 My Attendance       │
│   👥 Team Attendance     │  ← Managers only
│                          │
│ LEAVE                    │  ← Section label (amber dot)
│   🏖️ My Leaves           │
│   📋 Team Leaves         │  ← Managers only
│   📊 Leave Balances      │
│   🗓️ Holiday Calendar    │
│                          │
│ PAYROLL                  │  ← Section label (green dot)
│   💰 My Payslips         │
│   📑 Run Payroll         │  ← HR only
│   ⚙️ Salary Structures   │  ← HR only
│                          │
│ ADMIN                    │  ← HR/Admin only
│   👤 Employees           │
│   🏗️ Org Structure       │
│   ⚙️ Settings            │
│                          │
│ ───────────────────────  │
│ 🔔 3 pending approvals   │  ← Action badge
│ 👤 Shreyas K.            │
│    Engineering · TL       │
└─────────────────────────┘
```

The **color-coded section dots** (blue/amber/green) are a subtle but critical UX cue — they thread through the entire UI to orient users about which module they're in.

---

## SCREEN-BY-SCREEN SPECIFICATIONS

### 1. UNIFIED DASHBOARD (`/dashboard`)

This is the **linchpin** screen. It must unite all three modules contextually.

#### Layout: 3-Column Grid (responsive → stacks on mobile)

**Column 1 — "Today" (Left, 33%)**
```
┌─────────────────────────────┐
│ TODAY · Mon, 24 Mar 2026    │
│ ─────────────────────────── │
│                             │
│ ⏰ Check-in: 09:12 AM      │
│ ⏱️ Hours today: 4h 23m     │
│ [Check Out]                 │ ← Primary action button
│                             │
│ ─────────────────────────── │
│ TEAM SNAPSHOT (8 reports)   │
│ ● 6 Present                │
│ ● 1 On Leave (SL)          │
│ ○ 1 Not Checked In ⚠️      │
│                             │
│ ─────────────────────────── │
│ QUICK ACTIONS               │
│ [Apply Leave] [Regularize]  │
│ [Approve Pending (3)]       │ ← Badge with count
└─────────────────────────────┘
```

**Column 2 — "This Month" (Center, 34%)**
```
┌─────────────────────────────┐
│ MARCH 2026                  │
│ ─────────────────────────── │
│                             │
│ Mini calendar (heat-map)    │
│ Each day cell colored:      │
│ ■ green=present             │
│ ■ red=absent/LOP            │
│ ■ amber=half-day            │
│ ■ purple=leave              │
│ ■ cyan=holiday              │
│ ■ gray=weekend              │
│ ■ dot outline=future        │
│                             │
│ ─────────────────────────── │
│ SUMMARY BAR                 │
│ 18/22 days present          │
│ 2 CL · 1 SL · 1 LOP ⚠️    │
│                             │ ← LOP highlighted with warning
│ Click any day → detail      │
└─────────────────────────────┘
```

**Column 3 — "Money" (Right, 33%)**
```
┌─────────────────────────────┐
│ LATEST PAYSLIP · Feb 2026   │
│ ─────────────────────────── │
│                             │
│ Net Pay    ₹  78,432        │ ← Large, prominent
│ Gross      ₹  95,000        │
│ Deductions ₹ -16,568        │
│                             │
│ ─────────────────────────── │
│ IF LOP THIS MONTH:          │
│ ⚠️ 1 LOP day = -₹4,318     │ ← THE BRIDGE: real-time
│    estimated impact         │ ← salary impact of current
│                             │ ← month's LOP
│ ─────────────────────────── │
│ LEAVE BALANCES              │
│ CL: 4/12 · SL: 2/6         │
│ EL: 8/15 · CO: 1           │
│                             │
│ [View Full Payslip →]       │
└─────────────────────────────┘
```

**Key UX Insight**: The right column creates the **"LOP Bridge"** — showing live salary impact of attendance/leave decisions. This is the visual connection that makes the three modules feel unified.

### For Managers — Additional Row Below
```
┌─────────────────────────────────────────────────────────────────┐
│ PENDING APPROVALS                                               │
│ ─────────────────────────────────────────────────────────────── │
│ 🔵 Attendance   │ 🟠 Leave         │ 🟢 Payroll                │
│ 2 regularizations│ 3 leave requests │ Feb payroll: ✅ Approved   │
│ [Review →]       │ [Review →]       │ Mar payroll: ⏳ Draft      │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2. MY ATTENDANCE (`/attendance/me`)

#### Primary View: Calendar + List Hybrid

**Top Bar**: Month/Year picker + View toggle (Calendar | List | Summary)

**Calendar View** (default):
- Full month calendar, each day is a cell
- Cell contents: Status badge + check-in/out times + work hours
- Color coding matches dashboard heat-map
- Click day → right slide-over with full detail + regularization option

**Day Detail Slide-Over** (480px right drawer):
```
┌──────────────────────────────────┐
│ ✕ MONDAY, 24 MARCH 2026         │
│ ──────────────────────────────── │
│                                  │
│ Status: ● Present                │
│ Check-in:  09:12 AM (Biometric)  │
│ Check-out: 06:45 PM (Biometric)  │
│ Work Hours: 9h 33m               │
│ Overtime: 1h 33m                 │
│                                  │
│ ──────────────────────────────── │
│ LINKED LEAVE                     │
│ (none)                           │
│                                  │
│ ──────────────────────────────── │
│ SALARY IMPACT                    │
│ This day: ₹4,318 earned          │ ← Per-day salary context
│ Month so far: ₹69,090 / ₹95,000 │
│                                  │
│ ──────────────────────────────── │
│ [Request Regularization]         │
│                                  │
│ HISTORY                          │
│ 09:12 — Checked in (biometric)   │
│ 06:45 — Checked out (biometric)  │
│ No changes                       │
└──────────────────────────────────┘
```

**Summary View** (tab):
```
┌──────────────────────────────────────────────────────────────┐
│ MARCH 2026 ATTENDANCE SUMMARY                                │
│ ──────────────────────────────────────────────────────────── │
│                                                              │
│ Working Days     22  ████████████████████████████████  100%   │
│ Present          18  ██████████████████████████         82%   │
│ Paid Leave        2  ████                                9%   │
│ LOP               1  ██                                  5%   │ ← RED
│ Half Days         1  ██                                  5%   │
│                                                              │
│ Avg Check-in:  09:08 AM    Avg Check-out: 06:32 PM          │
│ Avg Work Hours: 9h 24m     Total Overtime: 12h 45m          │
│                                                              │
│ ──────────────────────────────────────────────────────────── │
│ SALARY IMPACT                                                │
│ Full month salary:  ₹95,000                                  │
│ LOP deduction:     -₹4,318                                   │ ← RED highlight
│ Projected net:      ₹74,114                                  │
│ (after PF, ESI, PT, TDS)                                     │
└──────────────────────────────────────────────────────────────┘
```

---

### 3. TEAM ATTENDANCE (`/attendance/team`) — Managers Only

**Critical UX**: Manager sees ONLY their subordinates (hierarchy-enforced by API).

#### Layout: Roster Grid

**Top bar**: Month selector + Department filter (only departments they manage) + Search employee

**Grid** (rows = employees, columns = days of month):
```
┌───────────────┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬───────┐
│ Employee      │ 1│ 2│ 3│ 4│ 5│ 6│ 7│ 8│ 9│10│ ...31 │
├───────────────┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼───────┤
│ ● Priya S.    │ P│ P│ W│ W│ P│ P│ P│ H│ P│ L│       │
│   Eng · SDE-2 │  │  │  │  │  │  │  │  │  │SL│       │
├───────────────┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼───────┤
│ ○ Rahul M.    │ P│ A│ W│ W│ P│ P│½ │ H│ P│ P│       │
│   Eng · SDE-1 │  │⚠️│  │  │  │  │  │  │  │  │       │
└───────────────┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴───────┘

Legend: P=Present  A=Absent  L=Leave  ½=Half  H=Holiday  W=Weekend  LOP=Red bg
```

- Each cell is clickable → opens that employee's day detail in slide-over
- Absent cells (A) with no linked leave show ⚠️ (potential LOP candidate)
- Row click → opens employee's full month attendance detail
- **Bulk actions**: Select multiple employees → Mark attendance / Approve regularizations

**Right panel stats** (sticky sidebar, 280px):
```
┌────────────────────────┐
│ TEAM STATS · MAR 2026  │
│ ────────────────────── │
│ Team Size: 8           │
│ Avg Attendance: 91%    │
│ Total LOP Days: 3      │
│ Pending Approvals: 2   │
│                        │
│ ────────────────────── │
│ ALERTS                 │
│ ⚠️ Rahul: 2 absences   │
│    without leave        │
│ ⚠️ Comp-off expiring   │
│    for Anita (3 days)   │
└────────────────────────┘
```

---

### 4. LEAVE MANAGEMENT (`/leaves/me` and `/leaves/team`)

#### My Leaves — Tab Layout

**Tab 1: Apply Leave**
```
┌──────────────────────────────────────────────────────────────┐
│ APPLY FOR LEAVE                                              │
│ ──────────────────────────────────────────────────────────── │
│                                                              │
│ Leave Type   [▼ Casual Leave    ]   Balance: 4 days          │
│                                                              │
│ From Date    [📅 28 Mar 2026    ]                            │
│ To Date      [📅 29 Mar 2026    ]   Duration: 2 days        │
│                                                              │
│ □ Half Day   ○ First Half  ○ Second Half                     │
│                                                              │
│ Reason       [________________________]                      │
│              [________________________]                      │
│                                                              │
│ 📎 Attach Document (required for SL > 2 days)               │
│                                                              │
│ ──────────────────────────────────────────────────────────── │
│ ⚠️ IMPACT PREVIEW                                            │
│ ─────────────────                                            │
│ After this leave:  CL balance → 2 days remaining             │
│ Salary impact:     ₹0 (paid leave)                           │
│                                                              │
│ If CL balance was 0:                                         │
│ ⚠️ Would convert to LOP · Salary impact: -₹8,636            │
│                                                              │
│ [Submit Application]                                         │
└──────────────────────────────────────────────────────────────┘
```

**Key UX**: The **"Impact Preview"** section is the killer feature. Before the employee submits, they see:
1. How their leave balance changes
2. Whether this will become LOP
3. Exact salary deduction if LOP

**Tab 2: My Leave History** — Table with filters (status, type, date range)

**Tab 3: Leave Balances** — Visual bars for each leave type
```
Casual Leave    ████████░░░░░░░░  4/12 used (8 remaining)
Sick Leave      ████░░░░░░░░░░░░  2/6 used  (4 remaining)
Earned Leave    ███████████░░░░░  8/15 used (7 remaining)
Comp-off        █░░░               1 available (expires 15 Apr)
LOP             ██                 2 days this FY
```

#### Team Leaves (Managers)

**Primary view**: Pending approvals list (sortable by date, urgency)

Each pending leave card:
```
┌──────────────────────────────────────────────────────────────┐
│ 🟠 PENDING                                                   │
│ Priya Sharma · SDE-2 · Engineering                           │
│ ──────────────────────────────────────────────────────────── │
│ Sick Leave · 28-29 Mar 2026 (2 days)                         │
│ Reason: "Dental surgery recovery"                            │
│ 📎 Medical certificate attached                              │
│                                                              │
│ Balance: SL 4 → 2 remaining                                  │
│ Team impact: 7/8 available on 28th, 6/8 on 29th             │
│                                                              │
│ [Approve ✓]  [Reject ✕]  [Need More Info]                   │
└──────────────────────────────────────────────────────────────┘
```

**Key UX**: **"Team impact"** line shows how many team members will be available on those dates — helps manager make informed decisions.

---

### 5. PAYROLL (`/payroll/my-payslips` and `/payroll/run`)

#### My Payslips — Employee View

**List view**: Cards for each month, most recent first

**Payslip Detail** (full page, not slide-over — it's dense):
```
┌──────────────────────────────────────────────────────────────┐
│ PAYSLIP · FEBRUARY 2026                          [📥 PDF]    │
│ ──────────────────────────────────────────────────────────── │
│ Shreyas K. · EMP042 · Engineering · Tech Lead                │
│                                                              │
│ Working Days: 20    Present: 18    LOP: 1    Paid Days: 19   │
│                                                              │
│ ═══════════════════════════════════════════════════════════  │
│                                                              │
│ EARNINGS                        │ DEDUCTIONS                 │
│ ────────────────────────────    │ ────────────────────────── │
│ Basic         ₹38,000          │ PF (Employee)    ₹1,800    │
│ HRA           ₹19,000          │ ESI              ₹0        │
│ DA            ₹3,800           │ Professional Tax ₹200      │
│ Special Allow ₹25,200          │ TDS              ₹12,500   │
│ Conveyance    ₹1,600           │ Advance Recovery ₹2,000    │
│ Medical       ₹1,250           │                            │
│ Other         ₹1,150           │                            │
│ Overtime      ₹0               │                            │
│ ────────────────────────────    │ ────────────────────────── │
│ Gross       ₹90,000            │ Total Deductions ₹16,500   │
│                                │                            │
│ ⚠️ LOP Deduction: -₹4,750      │                            │
│ (1 day × ₹4,750/day)           │                            │
│                                │                            │
│ ═══════════════════════════════════════════════════════════  │
│                                                              │
│ NET PAY                                        ₹ 73,500     │
│                                                              │
│ ──────────────────────────────────────────────────────────── │
│ LINKED RECORDS                                               │
│ 📅 Attendance: 18/20 present · 1 LOP (12 Mar) · 1 CL       │
│ 🏖️ Leave used: 1 CL (15 Mar) · 1 LOP (12 Mar - auto)       │
│ 💼 Adjustments: Advance recovery ₹2,000                     │
│                                                              │
│ Click any linked record to view details ↗                    │
└──────────────────────────────────────────────────────────────┘
```

**Critical UX**: The **"Linked Records"** section creates backward traceability. An employee looking at their payslip can click through to see exactly which days were LOP, which leave caused it, and why.

#### Run Payroll — HR View (`/payroll/run`)

This is a **wizard-style** flow, not a single page.

**Step 1: Initiate**
```
Select Month/Year → System shows:
- Total employees: 142
- Attendance finalized: 138/142 ⚠️ 4 pending
- Leave approvals pending: 2 ⚠️
- [Proceed Anyway] [Wait for Completion]
```

**Step 2: Review Pre-computation Warnings**
```
⚠️ ATTENTION REQUIRED BEFORE COMPUTATION
───────────────────────────────────────────
│ ⚠️ 4 employees have unapproved attendance
│ ⚠️ 2 leave applications still pending
│ ⚠️ 3 employees have no tax declarations for FY 2025-26
│ ℹ️ 7 new comp-offs earned this month
│ ✅ All salary structures are current
│ ✅ Holiday calendar is complete
```

**Step 3: Compute** — Progress bar + real-time log

**Step 4: Review** — Sortable table of all payslips with anomaly highlighting
- Flag payslips where LOP > 3 days
- Flag where net pay changed > 20% from last month
- Flag new joiners (pro-rated)

**Step 5: Approve → Lock**

---

### 6. EMPLOYEE MANAGEMENT (`/admin/employees`)

Standard CRUD with the org hierarchy tree visualizer.

**List view**: Searchable, filterable table (department, designation, status)
**Detail view**: Tabbed — Profile | Attendance | Leaves | Salary | Documents

**Org Tree** (`/admin/org-structure`): Interactive tree using D3.js or react-flow
- Department-based grouping
- Click node → slide-over with employee quick view
- Drag-drop to reassign hierarchy (creates new `employee_hierarchy` record with effective_from = today)

---

## CROSS-CUTTING UX PATTERNS

### 1. The "LOP Bridge" Pattern
Wherever LOP appears in the UI, always show its salary impact:
- Attendance screen: "This absence = ₹X salary impact"
- Leave application: "If insufficient balance → LOP → ₹X deduction"
- Payslip: "LOP days linked to [these dates] → ₹X deducted"

This is the **single most important UX pattern** in the system. It's what makes attendance + leave + payroll feel like one system, not three.

### 2. Module Color Threading
- Attendance-related data always has a subtle `--attendance-accent` (blue) left border or dot
- Leave-related data gets `--leave-accent` (amber)
- Payroll-related data gets `--payroll-accent` (green)
- When data crosses modules (e.g., LOP on payslip), show BOTH colors as a gradient or split indicator

### 3. Hierarchy Scoping Indicator
Every team/manager screen must show:
```
👥 Showing: 8 direct reports in Engineering
   [Include skip-level reports ▼]
```
This makes it clear the data is scoped and gives managers the option to expand.

### 4. Pending Action Badges
Global notification system — sidebar shows count of pending:
- Attendance approvals (blue badge)
- Leave approvals (amber badge)
- Payroll actions (green badge)

### 5. Inline Salary Calculator
On any screen where LOP is possible, show a mini "impact calculator":
```
Monthly Gross: ₹95,000
Per Day Rate: ₹4,318
LOP Days: [input: 2]
─────────────────
Estimated Gross: ₹86,364
Estimated Net:   ₹71,200
```

### 6. Toast Notifications
- Success (leave approved, payroll computed): Emerald toast, 3s auto-dismiss
- Warning (LOP conversion, low balance): Amber toast, persists until dismissed
- Error: Red toast, persists

### 7. Empty States
Never show blank screens. Every empty state has:
- Contextual illustration (simple SVG, not cheesy stock)
- Clear message explaining why it's empty
- Primary action button to populate

### 8. Responsive Breakpoints
- **Desktop** (≥1280px): Full sidebar + main content + right panel
- **Tablet** (768-1279px): Collapsed sidebar + full main content
- **Mobile** (< 768px): Bottom nav + stacked layouts, slide-overs become full-screen

---

## COMPONENT ARCHITECTURE

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   ├── SlideOver.tsx           ← Reusable right drawer
│   │   └── PageWrapper.tsx
│   ├── attendance/
│   │   ├── AttendanceCalendar.tsx   ← Month view with heat-map cells
│   │   ├── AttendanceRoster.tsx     ← Team grid (manager view)
│   │   ├── DayDetailSlideOver.tsx
│   │   ├── AttendanceSummaryBar.tsx
│   │   └── RegularizationForm.tsx
│   ├── leave/
│   │   ├── LeaveApplicationForm.tsx ← With impact preview
│   │   ├── LeaveBalanceBars.tsx     ← Visual bar chart
│   │   ├── PendingApprovalCard.tsx
│   │   ├── TeamLeaveCalendar.tsx    ← Who's out view
│   │   └── CompOffTracker.tsx
│   ├── payroll/
│   │   ├── PayslipDetail.tsx        ← Full breakdown with linked records
│   │   ├── PayrollWizard.tsx        ← Multi-step run payroll
│   │   ├── SalaryImpactCalculator.tsx ← Inline LOP impact
│   │   ├── PayrollReviewTable.tsx   ← Anomaly-flagged table
│   │   └── PayslipPDFExport.tsx
│   ├── dashboard/
│   │   ├── TodayCard.tsx
│   │   ├── MonthHeatMap.tsx
│   │   ├── PaySummaryCard.tsx       ← With LOP bridge
│   │   └── PendingActionsBar.tsx
│   ├── employees/
│   │   ├── EmployeeTable.tsx
│   │   ├── EmployeeDetail.tsx       ← Tabbed view
│   │   ├── OrgTree.tsx              ← Interactive hierarchy
│   │   └── HierarchyManager.tsx
│   └── shared/
│       ├── StatusBadge.tsx           ← Attendance/leave/approval statuses
│       ├── ModuleIndicator.tsx       ← Blue/amber/green threading
│       ├── DateRangePicker.tsx
│       ├── ConfirmDialog.tsx
│       ├── EmptyState.tsx
│       ├── DataTable.tsx             ← Sortable, filterable, paginated
│       └── SalaryBreakdownMini.tsx   ← Reusable earnings/deductions view
├── hooks/
│   ├── useHierarchy.ts              ← Fetches subordinates for current user
│   ├── useAttendance.ts
│   ├── useLeaves.ts
│   ├── usePayroll.ts
│   └── useSalaryImpact.ts           ← Computes LOP impact in real-time
├── services/
│   ├── api.ts                        ← Axios instance with interceptors
│   ├── attendance.api.ts
│   ├── leave.api.ts
│   ├── payroll.api.ts
│   └── employee.api.ts
├── stores/
│   ├── authStore.ts                  ← Zustand: user, role, permissions
│   └── uiStore.ts                    ← Sidebar state, active slide-over, etc.
├── utils/
│   ├── salary-calculator.ts          ← Client-side LOP impact math
│   ├── date-helpers.ts               ← Working days, holidays, etc.
│   └── format.ts                     ← Currency, date formatting
├── types/
│   ├── attendance.types.ts
│   ├── leave.types.ts
│   ├── payroll.types.ts
│   └── employee.types.ts
└── pages/
    ├── Dashboard.tsx
    ├── attendance/
    │   ├── MyAttendance.tsx
    │   └── TeamAttendance.tsx
    ├── leaves/
    │   ├── MyLeaves.tsx
    │   ├── TeamLeaves.tsx
    │   └── HolidayCalendar.tsx
    ├── payroll/
    │   ├── MyPayslips.tsx
    │   ├── RunPayroll.tsx
    │   └── SalaryStructures.tsx
    └── admin/
        ├── Employees.tsx
        ├── OrgStructure.tsx
        └── Settings.tsx
```

---

## API INTEGRATION PATTERNS

### TanStack Query Setup
```typescript
// Every module-specific hook follows this pattern:
export function useTeamAttendance(month: number, year: number) {
  return useQuery({
    queryKey: ['attendance', 'team', month, year],
    queryFn: () => attendanceApi.getTeamAttendance(month, year),
    staleTime: 30_000, // 30s — attendance changes frequently
  });
}

// Mutations with optimistic updates for approvals:
export function useApproveLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leaveApi.approve(id),
    onMutate: async (id) => {
      // Optimistically update the pending count
      await queryClient.cancelQueries({ queryKey: ['leaves', 'pending'] });
      // ... optimistic update logic
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] }); // Attendance may change
    },
  });
}
```

### Real-time LOP Impact (Client-side)
```typescript
// useSalaryImpact.ts
export function useSalaryImpact(employeeId: string, month: number, year: number) {
  const { data: salary } = useSalaryStructure(employeeId);
  const { data: attendance } = useAttendanceSummary(employeeId, month, year);

  return useMemo(() => {
    if (!salary || !attendance) return null;
    const perDayRate = salary.grossMonthly / attendance.totalWorkingDays;
    const lopDeduction = perDayRate * attendance.lopDays;
    return {
      perDayRate,
      lopDays: attendance.lopDays,
      lopDeduction,
      projectedGross: salary.grossMonthly - lopDeduction,
      projectedNet: computeNet(salary.grossMonthly - lopDeduction, salary),
    };
  }, [salary, attendance]);
}
```

---

## CRITICAL IMPLEMENTATION NOTES

1. **Hierarchy enforcement is server-side** — the UI requests "my team" and trusts the API to return only authorized employees. The UI should never attempt client-side filtering.

2. **LOP calculation is server-authoritative** — the client-side `useSalaryImpact` hook is for *preview only*. Actual payslip computation happens server-side. Show a "This is an estimate" disclaimer.

3. **Date handling** — use `date-fns` exclusively. Never use `moment.js`. All dates stored as ISO strings, displayed in `dd MMM yyyy` format.

4. **Financial year** — Indian FY runs Apr-Mar. All leave balances, tax declarations, and annual views should respect this.

5. **Accessibility** — WCAG 2.1 AA minimum. All status colors must have text/icon alternatives (not color-only). Calendar cells must be keyboard-navigable.

6. **Performance** — Team attendance roster can be 50+ employees × 31 days = 1500+ cells. Use `react-window` for virtualization if > 30 employees.

7. **Print/PDF** — Payslip must have a clean print stylesheet and PDF export option (use `@react-pdf/renderer` or server-side generation).

Generate all components with proper TypeScript types, error boundaries, loading skeletons (not spinners — use shimmer placeholder matching the layout shape), and empty states. Start with the Dashboard and the LeaveApplicationForm with Impact Preview as these are the highest-impact screens.
