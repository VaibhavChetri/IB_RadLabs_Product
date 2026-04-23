# HRM Frontend Implementation Roadmap

> **Purpose**: This document is a plain-English, step-by-step guide for junior developers to implement the **HRM module (Attendance + Leave + Payroll)** into the **existing IB-Dashboard**. Each phase builds on the previous one. Do NOT skip ahead.
>
> **Important**: The dashboard already has Layout, Auth, Routing, and a design system. **We are NOT rebuilding these.** We are integrating the HRM feature into this existing project.
Also when implementing.. ensure.. neat folders are created.. and for each feature.. there should be documentation, testing, backend api's connected to and response. This is a must!
---

## Current Project State

✅ **Already Exists**:
- React 18 + TypeScript + Vite setup
- Redux store (auth, dashboard, etc.) in `src/store/`
- Layout components (Sidebar, Header) in `src/components/`
- Routes and navigation in `src/routes/` and `src/config/routes.tsx`
- Design tokens and styling in `src/design-system/`
- API integration pattern in `src/services/`
- Auth slice in `src/store/slices/authSlice.ts`

❌ **Does NOT Exist Yet**:
- HRM-specific pages (My Attendance, Team Leaves, Payroll, etc.)
- HRM-specific components (attendance calendar, leave form, payslip detail)
- HRM API services (attendanceApi, leaveApi, payrollApi)
- HRM types (Attendance, Leave, Payslip, etc.)
- HRM hooks (useAttendance, useLeaves, useSalaryImpact)
- HRM routes (we need to add these to the routing config)

---

## Overview: Three Core Modules, One Unified System

The HRM system has **three interconnected modules**:
1. **Attendance** — Track when employees come to work, their work hours
2. **Leave** — Manage leave applications and approvals
3. **Payroll** — Calculate salaries, show impact of absences (LOP = Loss of Pay)

These three are deeply linked. **An absence → becomes LOP → reduces salary.** The UI must visually show these connections at every step.

**The "LOP Bridge"** is the most critical UX pattern. Wherever an absence appears, show its salary impact in real-time. This makes the system feel unified instead of three disconnected modules.

---

## Phase 1: HRM Types & Mock Data (Week 1)

**Goal**: Define the data structures for HRM and create realistic mock data that other phases will use.

### 1.1 Create HRM Type Definitions
Create files in `src/types/hrm/`:

**attendance.types.ts**:
- `AttendanceRecord` — date, status (present/absent/half-day/etc.), check-in time, check-out time, work hours, notes
- `AttendanceSummary` — total working days, present days, absent days, half-days, LOP days, average check-in time, etc.

**leave.types.ts**:
- `LeaveApplication` — type (CL/SL/EL/etc.), from date, to date, status (pending/approved/rejected), reason, balance before/after
- `LeaveBalance` — leave type, used, available, expiry date
- `LeaveApproval` — employee, dates, balance impact, team impact

**payroll.types.ts**:
- `Payslip` — month, employee, gross, deductions, net, LOP details, linked attendance/leave
- `SalaryStructure` — basic, HRA, DA, allowances, deductions per employee
- `PayrollRun` — month, status (draft/computed/approved/locked), total payslips, warnings

**employee.types.ts** (HRM-specific):
- `HRMEmployee` — id, name, email, department, designation, reporting manager, hire date, status

### 1.2 Create Mock Data
Create `src/mocks/hrmMockData.ts`:
- Sample employee list (10-15 employees with hierarchy)
- Sample attendance records (30 days worth)
- Sample leave applications (pending, approved, rejected)
- Sample salary structures
- Sample payslips
- Use realistic Indian salary numbers and leave types (CL, SL, EL, Comp-off)

**Deliverable**: No TypeScript errors when importing mock data. Types compile correctly.

---

## Phase 2: HRM API Services Layer (Week 1)

**Goal**: Create API service methods (using mock data for now) that match the existing project's service pattern.

### 2.1 Create HRM API Services
Create files in `src/services/hrm/`:

**attendanceApi.ts**:
- `getMyAttendance(month, year)` → returns AttendanceRecord[]
- `getTeamAttendance(month, year)` → returns attendance data for all team members
- `getAttendanceSummary(month, year)` → returns AttendanceSummary
- `requestRegularization(date, reason)` → submits a request

**leaveApi.ts**:
- `getMyLeaves()` → returns LeaveApplication[]
- `getLeaveBalances()` → returns LeaveBalance[]
- `applyForLeave(form)` → submits leave application
- `getTeamPendingLeaves()` → returns pending leave applications (managers only)
- `approveLeave(id)` → manager approves
- `rejectLeave(id, reason)` → manager rejects

**payrollApi.ts**:
- `getMyPayslips()` → returns Payslip[]
- `getPayslip(id)` → returns full Payslip with linked records
- `initializePayrollRun(month, year)` → starts HR payroll run
- `computePayroll(month, year)` → computes salaries
- `getPayrollReview(month, year)` → returns all payslips with anomalies flagged

**employeeApi.ts** (HRM-specific):
- `getTeamMembers()` → returns subordinates (for managers)
- `getOrgTree()` → returns organization hierarchy structure

For now, these use mock data. Point them to `src/mocks/hrmMockData.ts`.

**Deliverable**: API methods exist and can be imported. No real HTTP calls yet (mock data only).

---

## Phase 3: HRM Utility & Helper Functions (Week 1)

**Goal**: Create reusable helpers for date/salary calculations that will be used across components.

### 3.1 Date Helpers (`src/utils/hrmDateHelpers.ts`)
- `getWorkingDaysInMonth(year, month)` — count working days (excluding weekends/holidays)
- `isWeekend(date)` — check if date is Saturday/Sunday
- `isHoliday(date)` — check if date is in holiday calendar
- `getDaysBetween(startDate, endDate)` — count days between two dates
- `formatDate(date)` — format as "dd MMM yyyy"
- `getMonthYear(date)` — format as "Mar 2026"

### 3.2 Salary Calculator (`src/utils/salaryCalculator.ts`)
- `calculatePerDayRate(grossMonthly, workingDaysInMonth)` — compute daily salary
- `calculateLOPImpact(lopDays, perDayRate)` — compute LOP deduction
- `calculateProjectedGross(grossMonthly, lopDays, perDayRate)` — what gross will be after LOP
- `calculateProjectedNet(projectedGross, deductions)` — what net will be (estimates)

### 3.3 Format Helpers (`src/utils/hrmFormatters.ts`)
- `formatCurrency(amount)` — format as "₹95,000"
- `formatPercentage(value)` — format as "82%"
- `formatHours(minutes)` — format as "9h 33m"

**Deliverable**: All helpers are testable and work with mock data.

---

## Phase 4: HRM Shared Components (Week 2)

**Goal**: Build reusable UI components that will be used across attendance, leave, and payroll modules.

### 4.1 Status & Badge Components

**StatusBadge** (`src/components/hrm/shared/StatusBadge.tsx`)
- Shows attendance status with icon + text (not color-only)
- States: Present, Absent, Half Day, Leave, Holiday, Weekend, LOP
- Used across attendance calendar, team roster, etc.

**ModuleIndicator** (`src/components/hrm/shared/ModuleIndicator.tsx`)
- Left colored border (blue/amber/green) indicating module type
- Used on cards, list items to visually thread modules together

**ApprovalStatusBadge** (`src/components/hrm/shared/ApprovalStatusBadge.tsx`)
- Shows leave/attendance approval status: Pending, Approved, Rejected, More Info Needed

### 4.2 Data Display Components

**SalaryImpactCard** (`src/components/hrm/shared/SalaryImpactCard.tsx`)
- Displays salary impact numbers
- Shows LOP deduction with warning styling
- Used on dashboard, leave form, payslip
- **This is the "LOP Bridge" — most critical component**

**LeaveBalanceBar** (`src/components/hrm/shared/LeaveBalanceBar.tsx`)
- Visual bar showing leave balance
- Format: `Casual Leave ████████░░░░░░░░  4/12 used (8 remaining)`
- Supports expiry date display

**AttendanceStatCard** (`src/components/hrm/shared/AttendanceStatCard.tsx`)
- Card showing single attendance stat (present days, absent days, LOP days, etc.)
- Title, icon, number, percentage

### 4.3 Form Components

**LeaveTypeSelector** (`src/components/hrm/shared/LeaveTypeSelector.tsx`)
- Dropdown to select leave type (CL, SL, EL, etc.)
- Shows current balance next to it
- Updates in real-time as user selects

**DateRangeSelector** (`src/components/hrm/shared/DateRangeSelector.tsx`)
- Start date + end date pickers
- Auto-calculates duration
- Validates weekends/holidays

**HalfDaySelector** (`src/components/hrm/shared/HalfDaySelector.tsx`)
- Checkbox for half day
- If checked, show radio buttons: First Half / Second Half

### 4.4 Data Display Tables

**AttendanceTable** (`src/components/hrm/shared/AttendanceTable.tsx`)
- Generic table for listing attendance records
- Columns: Date, Status, Check-in, Check-out, Hours, Actions
- Sortable, filterable, paginated
- Click row → opens day detail slide-over

**LeaveHistoryTable** (`src/components/hrm/shared/LeaveHistoryTable.tsx`)
- Lists past leave applications
- Columns: Dates, Type, Duration, Reason, Status
- Filterable by status and type

**Deliverable**: All components exist as stubs with mock data. They render without errors.

---

## Phase 5: HRM Shared Hooks (Week 2)

**Goal**: Create React hooks that encapsulate HRM business logic and data fetching.

### 5.1 Data Fetching Hooks

**useMyAttendance(month, year)**
- Fetches user's attendance records
- Returns { data, isLoading, error, refetch }
- Uses attendanceApi.getMyAttendance()

**useTeamAttendance(month, year)**
- Fetches team's attendance (managers only)
- Enforces role-based access
- Returns team attendance data

**useLeaveBalances()**
- Fetches current leave balances for user
- Caches result (doesn't change often)

**useMyLeaves()**
- Fetches user's leave applications
- Sorted by date (most recent first)

**useTeamPendingLeaves()**
- Fetches pending leaves for manager's team
- Sorted by urgency/date

**useMyPayslips()**
- Fetches list of user's payslips

**usePayslip(id)**
- Fetches full payslip detail with linked records

### 5.2 Computation Hooks

**useSalaryImpact(employeeId, month, year)**
- **THIS IS THE LOP BRIDGE HOOK**
- Combines salary structure + attendance data
- Calculates per-day rate, LOP deduction, projected gross/net
- Returns estimate with disclaimer
- Real-time updates when attendance changes

**useAttendanceSummary(month, year)**
- Aggregates attendance data for summary view
- Calculates percentages, averages, totals

**useLeaveImpactPreview(fromDate, toDate, leaveType)**
- Shows what balance will be after applying for this leave
- Shows if it will convert to LOP
- Shows exact salary impact if LOP

**Deliverable**: All hooks return mock data. No real API calls. Loading states work.

---

## Phase 6: HRM Color Theming (Week 2)

**Goal**: Add HRM-specific colors to the design system so modules are visually distinct.

### 6.1 Update Design Tokens
Modify `src/design-system/tokens.ts` to add:
- `--hrm-attendance-accent: #2563EB` (blue)
- `--hrm-leave-accent: #D97706` (amber)
- `--hrm-payroll-accent: #059669` (green)
- Status colors: `--status-present`, `--status-absent`, `--status-lop`, `--status-leave`, `--status-holiday`, `--status-weekend`, `--status-half-day`

### 6.2 Create HRM Color Utilities
Create `src/utils/hrmColors.ts`:
- `getStatusColor(status)` → returns CSS color for attendance status
- `getModuleColor(module)` → returns color for module (attendance/leave/payroll)
- `getStatusIcon(status)` → returns icon name for status

**Deliverable**: Colors are consistent across all HRM components. Design system is extended without breaking existing components.

---

## Phase 7: HRM Navigation & Routes (Week 2)

**Goal**: Add HRM routes to the existing navigation structure.

### 7.1 Add HRM Routes
Update `src/config/routes.tsx`:
- `/hrm/dashboard` — HRM Dashboard (unified view)
- `/hrm/attendance/my` — My Attendance
- `/hrm/attendance/team` — Team Attendance (manager only)
- `/hrm/leaves/my` — My Leaves
- `/hrm/leaves/team` — Team Leaves (manager only)
- `/hrm/leaves/balances` — Leave Balances View
- `/hrm/leaves/holidays` — Holiday Calendar
- `/hrm/payroll/my-payslips` — My Payslips
- `/hrm/payroll/run` — Run Payroll (HR only)
- `/hrm/payroll/structures` — Salary Structures (HR only)
- `/hrm/admin/employees` — Employee Management (HR only)
- `/hrm/admin/org-structure` — Organization Structure (HR only)

### 7.2 Update Sidebar Navigation
Modify `src/data/navigation.ts` to add:
- HRM section with sub-items
- Color-coded icons (blue dot for Attendance, amber for Leave, green for Payroll)
- Show/hide based on user role
- Link to HRM dashboard as primary entry point

### 7.3 Create Route Stubs
Create empty `.tsx` files for all HRM pages with just a heading:
- `src/pages/hrm/HRMDashboard.tsx`
- `src/pages/hrm/attendance/MyAttendance.tsx`
- `src/pages/hrm/attendance/TeamAttendance.tsx`
- `src/pages/hrm/leaves/MyLeaves.tsx`
- `src/pages/hrm/leaves/TeamLeaves.tsx`
- etc.

**Deliverable**: User can navigate to HRM section. Routes exist but pages show "Coming soon". Role-based access works.

---

## Phase 8: HRM Dashboard (Week 3-4)

**Goal**: Build the main landing page that unifies all three modules.

### 8.1 Dashboard Layout
Build `src/pages/hrm/HRMDashboard.tsx`:
- 3-column grid (responsive → stacks on mobile)
- Column 1: "Today" card
- Column 2: "This Month" card with mini calendar heatmap
- Column 3: "Money" card with payslip summary + LOP Bridge
- For managers: Additional row showing pending approvals

### 8.2 Today Card Component
**TodayCard** (`src/components/hrm/dashboard/TodayCard.tsx`)
- Shows today's check-in/out times
- Work hours today
- [Check Out] button
- If manager: Team snapshot (6 present, 1 on leave, 1 not checked in)
- Quick action buttons: Apply Leave, Regularize, Approve Pending

### 8.3 Month Card with Heatmap
**MonthHeatMap** (`src/components/hrm/dashboard/MonthHeatMap.tsx`)
- Mini calendar for entire month
- Each day colored: green (present), red (absent/LOP), amber (half-day), purple (leave), cyan (holiday), gray (weekend)
- Click day → opens slide-over with day details
- Below calendar: summary line "18/22 present, 2 CL, 1 SL, 1 LOP ⚠️"

### 8.4 Money Card with LOP Bridge
**PaySummaryCard** (`src/components/hrm/dashboard/PaySummaryCard.tsx`)
- Latest payslip summary: Net Pay, Gross, Deductions
- **CRITICAL: LOP Bridge section**
  - "If 1 LOP day this month = -₹4,318" (real-time calculation)
  - Updates as current month's attendance changes
- Leave balances: CL 4/12, SL 2/6, etc.
- [View Full Payslip] button

### 8.5 Day Detail Slide-Over
**DayDetailSlideOver** (`src/components/hrm/dashboard/DayDetailSlideOver.tsx`)
- Opens when clicking calendar day
- Shows: Date, status, check-in/out times, work hours, overtime
- Linked leave info
- Salary impact (per-day earnings)
- Salary impact compared to month-to-date
- [Request Regularization] button
- Change history

### 8.6 Pending Approvals Row (Manager Only)
**ManagerPendingApprovalsBar** (`src/components/hrm/dashboard/ManagerPendingApprovalsBar.tsx`)
- Shows counts: "🔵 2 attendance, 🟠 3 leaves, 🟢 Feb approved, Mar draft"
- Each section has [Review] button

**Deliverable**: Dashboard looks professional. Data is populated from mock data. LOP Bridge shows real-time calculations. Day detail slide-over works.

---

## Phase 9: Attendance Module (Week 4-5)

**Goal**: Build attendance viewing and regularization feature.

### 9.1 My Attendance (`/hrm/attendance/my`)
**MyAttendance** (`src/pages/hrm/attendance/MyAttendance.tsx`)
- Top bar: Month/Year picker + View toggle (Calendar | List | Summary)
- Three views:

**Calendar View** (default):
- Full month calendar with heat-map cells
- Click day → opens day detail slide-over (same as dashboard)

**List View**:
- Chronological table of attendance records
- Columns: Date, Status, Check-in, Check-out, Hours
- Sortable, filterable

**Summary View**:
- Bar chart: working days, present, paid leave, LOP, half-days
- Statistics: avg check-in, avg check-out, total overtime
- **Salary Impact section** (in red): LOP deduction and projected net

### 9.2 Team Attendance (`/hrm/attendance/team`)
**TeamAttendance** (`src/pages/hrm/attendance/TeamAttendance.tsx`)
- Manager-only page
- Top bar: Month selector, Department filter, Search
- Main grid: Rows = employees, Columns = days of month
- Each cell: Status with icon (P/A/L/½/H/W)
- Absent (A) without linked leave: Show ⚠️ warning
- Click cell → day detail for that employee
- Click row → full month view for that employee
- Right sidebar: Team stats and alerts

### 9.3 Regularization Flow
**RegularizationForm** (`src/components/hrm/attendance/RegularizationForm.tsx`)
- Appears in slide-over when clicking [Request Regularization]
- Fields: Reason (text area), Document upload
- Submit → shows confirmation message

**Deliverable**: Attendance can be viewed in multiple ways. Managers see team roster. Regularizations can be requested.

---

## Phase 10: Leave Module (Week 5-6)

**Goal**: Build leave application and approval features.

### 10.1 My Leaves (`/hrm/leaves/my`)
**MyLeaves** (`src/pages/hrm/leaves/MyLeaves.tsx`)
- 3 tabs: Apply | History | Balances

**Tab 1: Apply Leave**
- Form fields: Leave Type, From Date, To Date, Half Day (yes/no), Reason, Document upload
- **CRITICAL: Impact Preview Section**
  - Shows balance before/after
  - Shows if it will convert to LOP
  - Shows exact salary impact if LOP
  - Updates real-time as user changes dates
- [Submit Application] button

Build `src/components/hrm/leave/LeaveApplicationForm.tsx`

**Tab 2: Leave History**
- Table of past leave applications
- Columns: Dates, Type, Duration, Reason, Status
- Filterable by status and type

**Tab 3: Leave Balances**
- Visual bars for each leave type
- Format: `Casual Leave ████████░░░░░░░░  4/12 used (8 remaining)`
- Show expiry dates

Build `src/components/hrm/leave/LeaveBalanceBars.tsx`

### 10.2 Team Leaves (`/hrm/leaves/team`)
**TeamLeaves** (`src/pages/hrm/leaves/TeamLeaves.tsx`)
- Manager-only page
- List of pending leave applications (sorted by urgency)
- Each card: Employee, leave type, dates, duration, reason, docs
- **Team impact line**: "7/8 available on 28th, 6/8 on 29th"
- Action buttons: [Approve] [Reject] [Need More Info]

Build `src/components/hrm/leave/PendingApprovalCard.tsx`

### 10.3 Holiday Calendar (`/hrm/leaves/holidays`)
- Full year view of holidays
- Color-coded by type
- Read-only (HR sets these up)

**Deliverable**: Employees see real-time salary impact before submitting leave. Managers can approve/reject with team context. Holiday calendar is visible.

---

## Phase 11: Payroll Module (Week 6-7)

**Goal**: Build payslip viewing and payroll run features.

### 11.1 My Payslips (`/hrm/payroll/my-payslips`)
**MyPayslips** (`src/pages/hrm/payroll/MyPayslips.tsx`)
- List of payslips (most recent first)
- Each card: Month, Net Pay, Status
- Click → opens full detail page

**Payslip Detail Page** (`src/pages/hrm/payroll/PayslipDetail.tsx`)
- Header: Employee, ID, department, month
- Attendance summary line
- Two-column layout:
  - Left: Earnings (Basic, HRA, DA, allowances, etc.)
  - Right: Deductions (PF, ESI, Tax, etc.)
- Both columns total to Gross
- **LOP Deduction section** (red, prominent)
  - "1 day × ₹4,750/day = -₹4,750"
- **Net Pay** (large)
- **Linked Records** section
  - Linked attendance days, leave records, adjustments
  - Each clickable to see full detail (traceability!)

Build `src/components/hrm/payroll/PayslipDetail.tsx`

### 11.2 Run Payroll (`/hrm/payroll/run`)
**HR-only page**
- **5-step wizard** (not single page):

**Step 1: Initiate**
- Select Month/Year
- Show: Total employees, finalized attendance (with ⚠️ if pending), pending leaves
- Buttons: [Proceed Anyway] [Wait for Completion]

**Step 2: Review Warnings**
- List of pre-computation warnings/checks
- ⚠️ 4 employees have unapproved attendance
- ⚠️ 2 leave applications pending
- ⚠️ 3 no tax declarations
- ℹ️ 7 new comp-offs earned
- ✅ Salary structures current
- [Proceed] button

**Step 3: Compute**
- Progress bar + real-time log
- Shows "Computing Shreyas K...", "Computing Priya S...", etc.

**Step 4: Review**
- Table of all payslips
- Anomalies highlighted in red: LOP > 3 days, net pay changed > 20%, pro-rated
- Sortable and clickable

**Step 5: Approve & Lock**
- Final confirmation
- [Approve and Lock] button

Build `src/components/hrm/payroll/PayrollWizard.tsx`

### 11.3 Salary Structures (`/hrm/payroll/structures`)
**HR-only page**
- Table of all employees with salary components
- Columns: Employee, Basic, HRA, DA, Total Gross
- Click row → slide-over showing full breakdown
- [Edit] button for HR to modify

**Deliverable**: Employees see how their salary is calculated with LOP impact. HR can run full payroll process with safeguards.

---

## Phase 12: PDF Export & Print (Week 7)

**Goal**: Allow payslips to be downloaded/printed.

### 12.1 Payslip PDF Export
Add [📥 Download PDF] button to payslip detail.
- Use existing project's PDF generation method
- Generates clean PDF matching on-screen layout
- Includes company header, employee info, all salary details

Build export function in `src/utils/payslipPdfExport.ts`

### 12.2 Print Stylesheet
Add print CSS for payslip (black text, no nav, clean layout)

**Deliverable**: Users can download payslip as PDF.

---

## Phase 13: Polish & Responsive Design (Week 7-8)

**Goal**: Make HRM module work on all devices and handle edge cases.

### 13.1 Mobile Responsiveness
- Test on mobile (< 768px): grids stack, slide-overs become full-screen
- Test on tablet (768-1279px): sidebar collapses
- Test on desktop: full layout

### 13.2 Loading States
- Replace spinners with skeleton screens matching layout
- Dashboard: skeleton cards while loading
- Tables: skeleton rows while loading

### 13.3 Error Handling
- Wrap pages in error boundaries
- Show friendly error messages (not technical errors)
- Add retry buttons

### 13.4 Empty States
- "No attendance records for this month" with illustration + [Create Now] button
- "No leave applications" with [Apply Now] button
- "No payslips yet" with message

### 13.5 Accessibility
- All status colors have text/icon alternatives (not color-only)
- Calendar cells are keyboard-navigable
- Forms have proper labels and ARIA attributes
- Color contrast meets WCAG AA standards

**Deliverable**: App works smoothly on all devices. No crashes or errors. Accessible to all users.

---

## Phase 14: Integration with Real Backend (Week 8+)

**Goal**: Replace mock API calls with real backend.

### 14.1 Update API Services
Replace mock data in each API service with real HTTP calls:
- `attendanceApi.ts` → real endpoints
- `leaveApi.ts` → real endpoints
- `payrollApi.ts` → real endpoints
- `employeeApi.ts` → real endpoints

### 14.2 Handle Authentication
Ensure API calls include auth tokens from Redux auth store.

### 14.3 Error Handling
Handle network errors, timeouts, 401/403 responses properly.

### 14.4 Testing
End-to-end testing with real backend. Verify all flows work.

**Deliverable**: App works with real backend.

---

## Development Tips for Junior Developers

### Before You Start
1. Understand the **LOP Bridge** — this is what makes the system unified
2. Know the color system — colors communicate module identity
3. Read through component architecture — each component has one responsibility

### As You Code
1. **Start with Phase 1** — don't jump to pages before types/data exist
2. **Use mock data** — don't hit real backend until Phase 14
3. **Build components in isolation** — test with different props
4. **Keep it simple** — a working simple component is better than elegant non-working code
5. **Test as you go** — every feature should be visually testable in browser

### Common Pitfalls
1. **Skipping phases** — each builds on previous. Skipping breaks things.
2. **Color-only status** — always add text/icon. Not everyone can see colors.
3. **Hardcoding dates** — always use date-fns helpers. Never use `new Date()` directly.
4. **Forgetting error handling** — every API call can fail. Show friendly messages.
5. **Ignoring mobile** — test early and often on all devices.

### When Stuck
1. Check the hrm-frontend-prompt.md for design specs
2. Check mock data to understand data structure
3. Check existing project patterns (how they do forms, tables, etc.)
4. Ask: "What's the simplest thing I can build to make this work?"

---

## Checkpoints for Each Phase

- **After Phase 1**: No TypeScript errors. Mock data is realistic.
- **After Phase 2**: API methods exist and return mock data.
- **After Phase 3**: All helpers work with test inputs.
- **After Phase 4**: All components render without errors.
- **After Phase 5**: All hooks return mock data without errors.
- **After Phase 6**: Colors are consistent across HRM.
- **After Phase 7**: User can navigate to all HRM pages. Routes are protected by role.
- **After Phase 8**: Dashboard looks professional. LOP Bridge works.
- **After Phase 9**: Attendance can be viewed in multiple ways. Regularizations work.
- **After Phase 10**: Leave form shows impact preview. Managers can approve/reject.
- **After Phase 11**: Payslips show linked records. Payroll run completes.
- **After Phase 12**: Payslips can be downloaded as PDF.
- **After Phase 13**: App works on all devices. No crashes.
- **After Phase 14**: Everything works with real backend.

---

## Success Criteria

When all phases are complete, the system should:

1. **Unified Experience**: Clicking from attendance → pay impact feels like one system, not three modules
2. **Clear Data Flow**: Every absence shows salary impact in real-time (LOP Bridge)
3. **Role-Based Access**: Employees see only their data. Managers see their team. HR sees everything.
4. **Backward Traceability**: Can click from payslip → attendance day → leave record and back
5. **Accessible Design**: All colors have text alternatives. Works with keyboard navigation.
6. **Mobile Ready**: Works on phones, tablets, desktops without issues
7. **Performance**: No lag scrolling team rosters. Snappy interactions.
8. **Error Recovery**: Friendly error messages. User never sees white screen.

---

**Happy coding! Break it down into small pieces, test each piece, then connect them together.**
