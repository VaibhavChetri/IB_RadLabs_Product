# HRMS Leaves & Attendance Implementation Plan

## Objective
Implement the new Leave Management and Attendance modules in the existing HR area of IB Dashboard using the already-available backend APIs under `/v1/api/hrm`.

This plan covers:
- where the menus should live
- which pages/features should be built
- which APIs each page should call
- how ACL/role visibility should work
- which frontend files should be added or updated
- the recommended implementation order

---

## Implementation Status

### Completed on 2026-03-30
- extended `src/services/hrmApi.ts` with leave and attendance service methods
- added new React Query hooks for leave types, leave balances, leave applications, comp-off, attendance, and attendance regularization
- built all planned leave and attendance pages for:
  - self-service
  - team operations
  - HR settings
- wired the routes in `src/config/routes.tsx`
- updated the sidebar structure in `src/config/menuConfig.ts`
- created live backend menu leaves under:
  - `hr-self-service`
  - `hr-holiday-admin`
- granted the new menu leaves to `City Head` and `HR`
- verified:
  - `npm run type-check`
  - `npm run build`
  - `POST /oauth/access_token`
  - `GET /menus/permissions`

### Still pending
- browser-based role verification for users other than `ch-mumbai`
- true happy-path mutation testing with a user that has a linked `employee_id`

---

## Current HR Navigation State

Current live HR groups:
- `Organization`
- `Recruitment`
- `My HR`
- `Holiday Admin`

Current child items:
- `Organization`
  - `Employees`
  - `Departments`
  - `Designations`
  - `Salary Structures`
- `Recruitment`
  - `Job Posting`
- `My HR`
  - `My Holidays`
  - `My Choices`
- `Holiday Admin`
  - `Team Choices`
  - `Holiday Master`
  - `Choices Summary`
  - `Holiday Config`

---

## Recommended Navigation Design

### Recommendation
Keep the current top-level HR structure, but expand it so it supports both self-service and admin workflows cleanly.

### Target HR Structure
- `Organization`
  - `Employees`
  - `Departments`
  - `Designations`
  - `Salary Structures`

- `Recruitment`
  - `Job Posting`

- `My HR`
  - `My Holidays`
  - `My Choices`
  - `My Leaves`
  - `My Comp-Off`
  - `My Attendance`
  - `Regularize`

- `Team HR`
  - `Leave Requests`
  - `Team Comp-Off`
  - `Mark Attendance`
  - `Team Attendance`
  - `Attendance Summary`
  - `Regularization Requests`
  - `Team Choices`

- `HR Settings`
  - `Holiday Master`
  - `Choices Summary`
  - `Holiday Config`
  - `Leave Types`
  - `Leave Balances`

---

## Why This Structure

- `My HR` keeps all employee self-service items in one place.
- `Team HR` groups manager/HR operational review actions.
- `HR Settings` keeps masters/config/setup pages together.
- This avoids mixing employee-facing pages with admin setup pages in the same flat list.

### Note on existing `Holiday Admin`
For this implementation, the live backend parent `hr-holiday-admin` was intentionally kept in place to avoid another risky ACL migration.

Instead, the frontend now groups its children into:
- `Team HR`
- `HR Settings`

This preserves the backend ACL tree while giving users the cleaner navigation model.

### Note on `Attendance Summary`
This can be:
- a dedicated page under `Team HR`, or
- a detail drawer/modal launched from `Team Attendance`

Recommended approach:
- implement it first as a dedicated page/filterable listing for speed and clarity

---

## Role Visibility Matrix

### Employee
Visible:
- `My Holidays`
- `My Choices`
- `My Leaves`
- `My Comp-Off`
- `My Attendance`
- `Regularize`

Not visible:
- `Team HR`
- `HR Settings`

### Manager
Visible:
- all `My HR` pages
- all `Team HR` pages

Not visible:
- `HR Settings`

### HR
Visible:
- all `My HR` pages
- all `Team HR` pages
- all `HR Settings` pages

---

## Backend APIs Confirmed Available

Base path:
- `/hrm`

### Attendance APIs
- `POST /attendance/mark`
- `GET /attendance/team`
- `GET /attendance/my`
- `GET /attendance/summary`
- `GET /attendance/regularize`
- `POST /attendance/regularize`
- `GET /attendance/regularize/:id`
- `PATCH /attendance/regularize/:id`
- `GET /attendance/:id`

### Leave APIs
- `GET /leave-types`
- `POST /leave-types`
- `GET /leave-types/:id`
- `PATCH /leave-types/:id`

- `GET /leave-balances/my`
- `GET /leave-balances/:employee_id`
- `POST /leave-balances/:employee_id/initialize`

- `GET /leave-applications`
- `POST /leave-applications`
- `GET /leave-applications/:id`
- `PATCH /leave-applications/:id/review`
- `PATCH /leave-applications/:id/cancel`
- `PATCH /leave-applications/:id/revert-lop`

- `GET /comp-off`
- `POST /comp-off`

### Existing HR support APIs we can reuse
- `GET /employees`
- manager/user option hooks in current HRM module
- holiday APIs already used for holiday/working-day context

---

## Page-by-Page Implementation Plan

## Leaves

### 1. My Leaves
Menu:
- `My HR > My Leaves`

Purpose:
- view leave balances
- apply leave
- view own applications
- cancel own pending applications

APIs:
- `GET /leave-balances/my`
- `GET /leave-applications`
- `POST /leave-applications`
- `PATCH /leave-applications/:id/cancel`
- `GET /leave-types`

Core UI sections:
- leave balance summary cards
- apply leave form
- applications list with filters
- cancel action on pending rows

Important UI rules:
- do not show `LOP` in apply dropdown
- if `is_half_day = true`, require `half_day_type`
- if selected leave type requires document, show upload/URL field
- if balance is insufficient, warn that it will become LOP before submit

### 2. My Comp-Off
Menu:
- `My HR > My Comp-Off`

Purpose:
- view earned/available/used/expired comp-offs

APIs:
- `GET /comp-off`

Core UI sections:
- filter bar
- comp-off cards/table
- expiry highlighting

### 3. Leave Requests
Menu:
- `Team HR > Leave Requests`

Purpose:
- managers review reportee leave
- HR reviews all leave
- HR can also revert LOP

APIs:
- `GET /leave-applications`
- `PATCH /leave-applications/:id/review`
- `PATCH /leave-applications/:id/revert-lop`
- `GET /leave-types`

Core UI sections:
- request list with filters
- approve/reject modal
- HR-only revert LOP action

### 4. Team Comp-Off
Menu:
- `Team HR > Team Comp-Off`

Purpose:
- manager/HR logs comp-off for eligible employees
- view team comp-offs

APIs:
- `GET /comp-off`
- `POST /comp-off`
- `GET /employees` or manager option list

Core UI sections:
- log form
- team comp-off table

### 5. Leave Types
Menu:
- `HR Settings > Leave Types`

Purpose:
- HR manages leave master data

APIs:
- `GET /leave-types`
- `POST /leave-types`
- `PATCH /leave-types/:id`

Core UI sections:
- listing table
- add/edit modal
- toggle active/inactive

### 6. Leave Balances
Menu:
- `HR Settings > Leave Balances`

Purpose:
- HR initializes and views balances by employee and financial year

APIs:
- `GET /leave-balances/:employee_id`
- `POST /leave-balances/:employee_id/initialize`
- `GET /employees`

Core UI sections:
- employee selector
- FY selector
- balance table/cards
- initialize balance action

---

## Attendance

### 7. My Attendance
Menu:
- `My HR > My Attendance`

Purpose:
- employee views own monthly attendance and summary

APIs:
- `GET /attendance/my`

Core UI sections:
- summary strip
- month/year filter
- list or calendar/grid of attendance records

### 8. Regularize
Menu:
- `My HR > Regularize`

Purpose:
- employee raises own attendance correction request
- employee views own submitted requests

APIs:
- `GET /attendance/my`
- `GET /attendance/regularize`
- `POST /attendance/regularize`

Core UI sections:
- attendance rows eligible for regularization
- request form/modal
- request history table

### 9. Mark Attendance
Menu:
- `Team HR > Mark Attendance`

Purpose:
- manager/HR marks attendance for one or more employees across date ranges

APIs:
- `POST /attendance/mark`
- `GET /employees`

Core UI sections:
- employee multi-select
- date range picker
- marking mode helper text
- status dropdown
- half-day session dropdown when needed

### 10. Team Attendance
Menu:
- `Team HR > Team Attendance`

Purpose:
- monthly attendance grid for reportees/all employees in scope

APIs:
- `GET /attendance/team`
- `GET /employees`

Core UI sections:
- month/year filters
- employee filter
- spreadsheet-style grid

### 11. Attendance Summary
Menu:
- `Team HR > Attendance Summary`

Purpose:
- aggregate monthly attendance summary for one employee

APIs:
- `GET /attendance/summary`
- `GET /employees`

Core UI sections:
- employee selector
- month/year selector
- summary cards
- payroll-style totals

### 12. Regularization Requests
Menu:
- `Team HR > Regularization Requests`

Purpose:
- manager/HR reviews correction requests

APIs:
- `GET /attendance/regularize`
- `PATCH /attendance/regularize/:id`

Core UI sections:
- request list with filters
- approve/reject modal

---

## Frontend File Structure Plan

### Extend existing service
Update:
- `src/services/hrmApi.ts`

Add:
- leave type interfaces + methods
- leave balance interfaces + methods
- leave application interfaces + methods
- comp-off interfaces + methods
- attendance interfaces + methods
- regularization interfaces + methods

### New hooks
Add:
- `src/features/hrm/hooks/useLeaveTypeData.ts`
- `src/features/hrm/hooks/useLeaveBalanceData.ts`
- `src/features/hrm/hooks/useLeaveApplicationData.ts`
- `src/features/hrm/hooks/useCompOffData.ts`
- `src/features/hrm/hooks/useAttendanceData.ts`
- `src/features/hrm/hooks/useAttendanceRegularizationData.ts`

### New page folders
Add:
- `src/pages/hr/leaves/MyLeaves.tsx`
- `src/pages/hr/leaves/MyCompOff.tsx`
- `src/pages/hr/leaves/LeaveRequests.tsx`
- `src/pages/hr/leaves/TeamCompOff.tsx`
- `src/pages/hr/leaves/LeaveTypes.tsx`
- `src/pages/hr/leaves/LeaveBalances.tsx`

- `src/pages/hr/attendance/MyAttendance.tsx`
- `src/pages/hr/attendance/RegularizeAttendance.tsx`
- `src/pages/hr/attendance/MarkAttendance.tsx`
- `src/pages/hr/attendance/TeamAttendance.tsx`
- `src/pages/hr/attendance/AttendanceSummary.tsx`
- `src/pages/hr/attendance/RegularizationRequests.tsx`

### Optional shared config/components
Add if useful:
- `src/features/hrm/config/leaveColumns.tsx`
- `src/features/hrm/config/attendanceColumns.tsx`
- `src/features/hrm/components/AttendanceStatusBadge.tsx`
- `src/features/hrm/components/LeaveStatusBadge.tsx`
- `src/features/hrm/components/LeaveBalanceCards.tsx`

### Update barrel exports
Update:
- `src/features/hrm/index.ts`

### Update routes
Update:
- `src/config/routes.tsx`

### Update menu config
Update:
- `src/config/menuConfig.ts`

Required new menu IDs/slugs in frontend config:
- `my-leaves`
- `my-comp-off`
- `my-attendance`
- `attendance-regularize`
- `team-hr`
- `leave-requests`
- `team-comp-off`
- `mark-attendance`
- `team-attendance`
- `attendance-summary`
- `regularization-requests`
- `hr-settings`
- `leave-types`
- `leave-balances`

---

## Recommended Route Map

### Leave routes
- `/hr/leaves`
- `/hr/comp-off`
- `/hr/leave-requests`
- `/hr/team-comp-off`
- `/hr/leave-types`
- `/hr/leave-balances`

### Attendance routes
- `/hr/attendance`
- `/hr/attendance/regularize`
- `/hr/attendance/mark`
- `/hr/attendance/team`
- `/hr/attendance/summary`
- `/hr/attendance/regularization-requests`

---

## ACL / Menu Strategy

### Frontend visibility
Use existing ACL filtering model already used for HR.

### Backend menu strategy used
The backend write route is not `POST /menus`; it is `POST /menus/hierarchy`.

The implementation used:
- existing parent `83` (`hr-self-service`) for self-service leaf menus
- existing parent `82` (`hr-holiday-admin`) for team/settings leaf menus
- frontend synthetic grouping containers for:
  - `Team HR`
  - `HR Settings`

This keeps the ACL model stable while still giving a much cleaner HR sidebar.

---

## Recommended Delivery Phases

### Phase 1: Foundation
- extend `hrmApi.ts`
- add hooks
- add constants/status maps
- add menu config
- add routes

### Phase 2: Self-service first
- My Leaves
- My Comp-Off
- My Attendance
- Regularize

Reason:
- fastest visible value
- least ACL complexity

### Phase 3: Manager workflows
- Leave Requests
- Team Comp-Off
- Mark Attendance
- Team Attendance
- Regularization Requests
- Attendance Summary

### Phase 4: HR admin workflows
- Leave Types
- Leave Balances
- polish HR-only actions like revert LOP

### Phase 5: QA and hardening
- role-based visibility checks
- empty states
- validation messages
- pagination behavior
- date filtering
- pending/approved/rejected/cancelled badge consistency

---

## Reuse Opportunities From Existing HR Screens

Reuse patterns from:
- holiday pages for:
  - year/month filters
  - role-aware actions
  - status badge handling
  - card/list hybrid layouts
- employee pages for:
  - dropdown loading
  - table skeletons
  - CRUD hooks and invalidation patterns

---

## API-to-Page Mapping Summary

### Leaves
- My Leaves
  - `GET /leave-balances/my`
  - `GET /leave-applications`
  - `POST /leave-applications`
  - `PATCH /leave-applications/:id/cancel`
  - `GET /leave-types`

- My Comp-Off
  - `GET /comp-off`

- Leave Requests
  - `GET /leave-applications`
  - `PATCH /leave-applications/:id/review`
  - `PATCH /leave-applications/:id/revert-lop`
  - `GET /leave-types`

- Team Comp-Off
  - `GET /comp-off`
  - `POST /comp-off`

- Leave Types
  - `GET /leave-types`
  - `POST /leave-types`
  - `PATCH /leave-types/:id`

- Leave Balances
  - `GET /leave-balances/:employee_id`
  - `POST /leave-balances/:employee_id/initialize`

### Attendance
- My Attendance
  - `GET /attendance/my`

- Regularize
  - `GET /attendance/my`
  - `GET /attendance/regularize`
  - `POST /attendance/regularize`

- Mark Attendance
  - `POST /attendance/mark`

- Team Attendance
  - `GET /attendance/team`

- Attendance Summary
  - `GET /attendance/summary`

- Regularization Requests
  - `GET /attendance/regularize`
  - `PATCH /attendance/regularize/:id`

---

## Implementation Recommendation

If we start now, the best order is:
1. add all service methods and hooks
2. add routes + menus
3. build self-service leave pages
4. build self-service attendance pages
5. build manager review pages
6. build HR settings pages

This gives working value early and keeps the rollout manageable.

---

## Execution Status

Completed in this planning pass:
- reviewed `UI_GUIDE_LEAVES.md`
- reviewed `UI_GUIDE_ATTENDANCE.md`
- verified live backend HRM routes in `smart-bin-backend`
- mapped pages to APIs
- mapped recommended menu placement
- prepared phased frontend implementation plan

Not yet implemented in this pass:
- new leave/attendance pages
- hrm service extensions
- menu additions for leaves/attendance
- new routes
- backend menu creation for new leave/attendance nodes
