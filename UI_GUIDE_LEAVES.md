# UI Integration Guide — Leave Management

> Feed this document directly to the UI LLM.
> Base URL for all APIs: `http://localhost:3099/v1/api/hrm`
> All requests require: `Authorization: Bearer <token>`

---

## Role Definitions

| Role | Who | Leave powers |
|---|---|---|
| `employee` | Any staff member | Apply leave, view own applications + balances, cancel own pending leaves |
| `manager` | Reporting manager | Approve/reject reportees' leave requests, view team leaves, log comp-offs for reportees |
| `hr` | HR team | Approve any leave, cancel any leave, revert LOP, manage leave type master, initialize balances |

---

## Navigation / Menu Placement

```
HRMS
├── My Space (visible to ALL roles)
│   ├── My Leaves           ← Apply leave + view own applications + leave balance
│   └── My Comp-Off         ← View comp-offs earned and their expiry
│
├── Team (visible to: manager, hr)
│   ├── Leave Requests      ← Manager approves/rejects reportees' leave requests
│   └── Team Comp-Off       ← Manager logs comp-off for reportees who worked on holiday
│
└── Settings (visible to: hr only)
    ├── Leave Types         ← HR manages leave type master (CL, SL, EL, LOP, etc.)
    ├── Leave Balances      ← HR initializes/views balances per employee per FY
    └── All Leave Requests  ← HR sees all requests org-wide, can approve/cancel/revert LOP
```

---

## Key Business Rules (UI must enforce / communicate)

1. **Leave request always goes to manager first** — not HR. HR can see all but the primary flow is employee → manager.
2. **If manager approves → auto-approved.** No second HR approval needed.
3. **LOP auto-conversion** — if employee applies leave with insufficient balance, system auto-converts to LOP. Show a warning: _"Insufficient leave balance. This will be marked as Loss of Pay (LOP)."_
4. **Half-day** — `is_half_day: true` requires `half_day_type: "first_half"` or `"second_half"`.
5. **Working days only** — weekends, national/company holidays, and the employee's chosen restricted holidays are excluded from leave day count automatically.
6. **Cancellation** — employee can cancel only `pending` applications. HR can cancel any.
7. **LOP revert** — only HR can revert an auto-LOP application to a different leave type.

---

## Page 1: My Leaves (`My Space > My Leaves`)

**Visible to:** All roles

### Section A — Leave Balance Summary (show at top of page)

```
GET /leave-balances/my
GET /leave-balances/my?financial_year=2025-2026
```

**Response:**
```json
{
  "data": {
    "employee_id": 193,
    "financial_year": "2025-2026",
    "balances": [
      {
        "leave_type_id": 1, "leave_type_name": "Casual Leave", "leave_type_code": "CL",
        "annual_quota": 12, "opening_balance": 12.0, "accrued": 0.0,
        "used": 3.0, "lapsed": 0.0, "closing_balance": 9.0
      },
      {
        "leave_type_id": 2, "leave_type_name": "Sick Leave", "leave_type_code": "SL",
        "annual_quota": 12, "opening_balance": 12.0, "accrued": 0.0,
        "used": 1.0, "lapsed": 0.0, "closing_balance": 11.0
      },
      {
        "leave_type_id": 5, "leave_type_name": "Loss of Pay", "leave_type_code": "LOP",
        "annual_quota": 0, "opening_balance": 0.0, "accrued": 0.0,
        "used": 0.0, "lapsed": 0.0, "closing_balance": 0.0
      }
    ]
  }
}
```

**UI:** Show as a balance card row per leave type. Do NOT show LOP in balance cards (it has no quota).

---

### Section B — Apply Leave

```
POST /leave-applications
Body:
{
  "leave_type_id": 1,
  "from_date": "2026-04-10",
  "to_date": "2026-04-11",
  "is_half_day": false,
  "half_day_type": null,
  "reason": "Personal work",
  "document_url": null
}
```

| Field | Input type | Required | Notes |
|---|---|---|---|
| `leave_type_id` | Dropdown (from leave types list) | ✅ | Do not show LOP in dropdown — it's auto-assigned |
| `from_date` | Date picker | ✅ | |
| `to_date` | Date picker | ✅ | ≥ from_date |
| `is_half_day` | Checkbox | ❌ | If checked, show half_day_type dropdown |
| `half_day_type` | Dropdown: First Half / Second Half | Conditional | Required if `is_half_day` is checked |
| `reason` | Textarea | ✅ | Min 3 chars |
| `document_url` | File upload / URL | ❌ | Show only for SL (requires_document = true) |

**Before submitting:** Call `GET /leave-balances/my` and compare `closing_balance` vs `total_days`. If insufficient — show warning: _"You have X days available. This leave will be marked as Loss of Pay (LOP)."_ Let the employee confirm before submitting.

**Successful response includes** `auto_lop_converted: true` if LOP was applied.

### Error messages

| API error | Show as |
|---|---|
| `"No working days found in the selected date range"` | "No working days in the selected range. Weekends and holidays are excluded." |
| `"You already have a pending or approved leave overlapping this date range"` | "You already have a leave application for this period." |
| `"This leave type requires N day(s) advance notice"` | "This leave type requires at least N day(s) advance notice." |
| `"Maximum N consecutive days allowed for this leave type"` | "You can apply a maximum of N consecutive days for this leave type." |

---

### Section C — My Leave Applications

```
GET /leave-applications
GET /leave-applications?status=pending
GET /leave-applications?year=2026
GET /leave-applications?status=approved&month=3&year=2026
```

**Filters:**
| Param | Options |
|---|---|
| `status` | `pending` / `approved` / `rejected` / `cancelled` |
| `month` | 1–12 |
| `year` | e.g. 2026 |
| `page`, `limit` | Pagination |

**Response per item:**
```json
{
  "id": 10,
  "employee_name": "Sunita Pallai",
  "leave_type_name": "Casual Leave",
  "leave_type_code": "CL",
  "from_date": "2026-04-10",
  "to_date": "2026-04-11",
  "total_days": 2.0,
  "is_half_day": false,
  "reason": "Personal work",
  "status": "pending",
  "auto_lop_converted": false,
  "applied_at": "2026-03-30T10:00:00Z",
  "reviewed_by_name": null,
  "reviewer_remarks": null
}
```

**Status badge colors:**
| Status | Color |
|---|---|
| `pending` | Orange |
| `approved` | Green |
| `rejected` | Red |
| `cancelled` | Grey |

**Show "Cancel" button** only when `status = "pending"` and the leave is the employee's own.

---

### Cancel Leave

```
PATCH /leave-applications/:id/cancel
Body: { "cancellation_reason": "Plans changed" }
```

---

## Page 2: My Comp-Off (`My Space > My Comp-Off`)

**Visible to:** All roles

```
GET /comp-off
```

**Filters:** `status` (`available` / `used` / `expired`), `page`, `limit`

**Response per item:**
```json
{
  "id": 3,
  "employee_name": "Sunita Pallai",
  "earned_date": "2026-03-29",
  "expiry_date": "2026-04-28",
  "status": "available",
  "remarks": "Worked on Holi"
}
```

Show `expiry_date` prominently — highlight in red if expiring within 7 days.

---

## Page 3: Leave Requests (`Team > Leave Requests`)

**Visible to:** `manager`, `hr`

**Purpose:** Manager reviews pending leave requests from their reportees.

### Load requests

```
GET /leave-applications?status=pending
GET /leave-applications?employee_id=101
GET /leave-applications?month=3&year=2026
```

Manager sees only their reportees. HR sees all.

**Filters:** `status`, `employee_id`, `leave_type_id`, `month`, `year`, `page`, `limit`

---

### Approve / Reject

```
PATCH /leave-applications/:id/review
Body:
{
  "status": "approved",
  "remarks": "Approved"
}
```

| Field | Required | Notes |
|---|---|---|
| `status` | ✅ | `"approved"` or `"rejected"` |
| `remarks` | ❌ | Reviewer comment shown to employee |

**On approval:** Backend automatically deducts from leave balance and updates attendance records to `on_leave`.

---

### HR only: Revert LOP

When `auto_lop_converted = true` on a pending application, HR can change it to a proper leave type:

```
PATCH /leave-applications/:id/revert-lop
Body:
{
  "new_leave_type_id": 1,
  "remarks": "Employee had CL balance, reverting LOP"
}
```

Show "Revert LOP" button only when: `auto_lop_converted = true` AND `status = "pending"` AND role is `hr`.

---

## Page 4: Team Comp-Off (`Team > Team Comp-Off`)

**Visible to:** `manager`, `hr`

**Purpose:** Manager logs a comp-off for an employee who worked on a holiday/weekend.

### Log comp-off earned

```
POST /comp-off
Body:
{
  "employee_id": 101,
  "earned_date": "2026-03-29",
  "expiry_date": "2026-04-28",
  "remarks": "Worked on Holi"
}
```

| Field | Required | Notes |
|---|---|---|
| `employee_id` | ✅ | Manager restricted to own reportees |
| `earned_date` | ✅ | The holiday/weekend date they worked |
| `expiry_date` | ❌ | Auto-calculated from system config if not provided (default: earned_date + 30 days) |
| `remarks` | ❌ | |

### View team comp-offs

```
GET /comp-off?status=available
GET /comp-off?employee_id=101
```

---

## Page 5: Leave Types (`Settings > Leave Types`)

**Visible to:** `hr` only

### List leave types

```
GET /leave-types
GET /leave-types?is_active=true
```

### Create leave type

```
POST /leave-types
Body:
{
  "name": "Paternity Leave",
  "code": "PL",
  "annual_quota": 5,
  "max_carry_forward": 0,
  "is_paid": true,
  "requires_document": false,
  "min_days_advance": 0,
  "is_active": true
}
```

| Field | Required | Notes |
|---|---|---|
| `name` | ✅ | Max 50 chars |
| `code` | ✅ | Unique, uppercase, max 10 chars (e.g. `"PL"`) |
| `annual_quota` | ❌ | Default 0 |
| `max_carry_forward` | ❌ | Days that carry to next FY. Default 0 |
| `max_consecutive_days` | ❌ | Max days in one application. null = unlimited |
| `is_paid` | ❌ | Default true. Set false for LOP |
| `requires_document` | ❌ | Default false. Set true for SL with medical cert |
| `min_days_advance` | ❌ | Advance notice days. Default 0 |
| `is_active` | ❌ | Default true |

### Update leave type

```
PATCH /leave-types/:id
Body: { "annual_quota": 15 }
```

> **Note:** Do not show a delete button. Leave types are only deactivated (`is_active: false`), never deleted.

---

## Page 6: Leave Balances (`Settings > Leave Balances`)

**Visible to:** `hr` only

**Purpose:** HR views and initializes leave balances for employees at the start of a financial year.

### View balances for an employee

```
GET /leave-balances/:employee_id
GET /leave-balances/:employee_id?financial_year=2025-2026
```

### Initialize balances for an employee (start of FY)

```
POST /leave-balances/:employee_id/initialize
Body: { "financial_year": "2026-2027" }
```

Creates one balance row per active leave type using `annual_quota` as `opening_balance`. Safe to call multiple times — uses `INSERT IGNORE` so existing records are not overwritten.

---

## Access Control Summary

| Feature | `employee` | `manager` | `hr` |
|---|---|---|---|
| View own leave balance | ✅ | ✅ | ✅ |
| Apply leave | ✅ | ✅ | ✅ |
| View own applications | ✅ | ✅ | ✅ |
| Cancel own pending leave | ✅ | ✅ | ✅ |
| View team leave requests | ❌ | ✅ (reportees) | ✅ (all) |
| Approve / reject leave | ❌ | ✅ (reportees) | ✅ (all) |
| Cancel any leave | ❌ | ❌ | ✅ |
| Revert LOP | ❌ | ❌ | ✅ |
| Log comp-off | ❌ | ✅ (reportees) | ✅ |
| View comp-offs | ✅ (own) | ✅ (reportees) | ✅ (all) |
| Manage leave types | ❌ | ❌ | ✅ |
| Initialize leave balances | ❌ | ❌ | ✅ |

---

## Default Leave Types (seeded)

| Code | Name | Annual Quota | Paid | Notes |
|---|---|---|---|---|
| `CL` | Casual Leave | 12 | Yes | |
| `SL` | Sick Leave | 12 | Yes | Medical certificate required |
| `EL` | Earned Leave | 15 | Yes | 7 days advance notice, 15 days carry forward |
| `CO` | Comp Off | 0 | Yes | Balance driven by comp_off_earned |
| `LOP` | Loss of Pay | 0 | No | Auto-assigned by system, do NOT show in apply dropdown |
