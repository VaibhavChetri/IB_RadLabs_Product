# HRMS Leaves & Attendance Feature Matrix

## HR > My HR

| Menu | Feature | What is implemented | API used | Status |
|---|---|---|---|---|
| My Holidays | Holiday self-service | View holidays, choose/cancel restricted holiday | Existing holiday APIs | Existing |
| My Choices | Holiday choice history | View own chosen/cancelled holiday choices | Existing holiday choice APIs | Existing |
| My Leaves | Leave self-service | View balances, apply leave, view own applications, cancel pending leave | `GET /leave-balances/my`, `GET /leave-applications`, `POST /leave-applications`, `PATCH /leave-applications/:id/cancel`, `GET /leave-types` | Implemented |
| My Comp-Off | Comp-off self-service | View own comp-off records, filter by status, expiry highlighting | `GET /comp-off` | Implemented |
| My Attendance | Attendance self-service | View own monthly attendance, summary cards, day list | `GET /attendance/my` | Implemented |
| Regularize | Attendance correction self-service | View eligible attendance rows, submit regularization request, view own requests | `GET /attendance/my`, `GET /attendance/regularize`, `POST /attendance/regularize` | Implemented |

## HR > HR Operations > Team HR

| Menu | Feature | What is implemented | API used | Status |
|---|---|---|---|---|
| Team Choices | Team holiday review | View team holiday choices | Existing holiday choice APIs | Existing |
| Leave Requests | Team leave review | Filter requests, approve/reject, HR cancel, HR revert LOP | `GET /leave-applications`, `PATCH /leave-applications/:id/review`, `PATCH /leave-applications/:id/cancel`, `PATCH /leave-applications/:id/revert-lop`, `GET /leave-types` | Implemented |
| Team Comp-Off | Team comp-off management | Log comp-off for employee, view/filter comp-off records | `GET /comp-off`, `POST /comp-off`, `GET /employees` | Implemented |
| Mark Attendance | Attendance marking | Multi-select employees, date range marking, half-day support, remarks | `POST /attendance/mark`, `GET /employees` | Implemented |
| Team Attendance | Attendance grid | Monthly employee attendance grid, filters, row summaries | `GET /attendance/team`, `GET /employees` | Implemented |
| Attendance Summary | Payroll-style monthly totals | Employee/month summary cards for attendance counts and paid days | `GET /attendance/summary`, `GET /employees` | Implemented |
| Regularization Requests | Attendance correction review | Filter requests, approve/reject regularization | `GET /attendance/regularize`, `PATCH /attendance/regularize/:id`, `GET /employees` | Implemented |

## HR > HR Operations > HR Settings

| Menu | Feature | What is implemented | API used | Status |
|---|---|---|---|---|
| Holiday Master | Holiday master | Manage holidays | Existing holiday APIs | Existing |
| Choices Summary | Holiday analytics | View holiday choice summary | Existing holiday summary APIs | Existing |
| System Config | Holiday config | Manage holiday system config | Existing config APIs | Existing |
| Leave Types | Leave master setup | List, filter, create, edit leave types | `GET /leave-types`, `POST /leave-types`, `PATCH /leave-types/:id` | Implemented |
| Leave Balances | Leave balance admin | Select employee/FY, view balances, initialize balances | `GET /leave-balances/:employee_id`, `POST /leave-balances/:employee_id/initialize`, `GET /employees` | Implemented |

## Notes

- New backend menu leaves created:
  - `my-leaves`
  - `my-comp-off`
  - `my-attendance`
  - `attendance-regularize`
  - `leave-requests`
  - `team-comp-off`
  - `mark-attendance`
  - `team-attendance`
  - `attendance-summary`
  - `regularization-requests`
  - `leave-types`
  - `leave-balances`
- `Team HR` and `HR Settings` are frontend grouping containers inside the existing backend parent `hr-holiday-admin`
- Verified:
  - `npm run type-check`
  - `npm run build`
  - menu ACL visibility
  - list/read API smoke tests
- Known blocker:
  - `ch-mumbai` has no linked `employee_id`, so some self-service happy-path leave flows cannot be fully validated
