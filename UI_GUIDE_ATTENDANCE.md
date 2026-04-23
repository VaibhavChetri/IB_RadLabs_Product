# UI Integration Guide — Attendance

> Feed this document directly to the UI LLM.
> Base URL for all APIs: `http://localhost:3099/v1/api/hrm`
> All requests require: `Authorization: Bearer <token>`

---

## Role Definitions

| Role value | Who is this |
|---|---|
| `hr` | HR team — full access, can mark/overwrite anyone's attendance |
| `manager` | Reporting manager — can mark attendance for their direct + indirect reportees only. May also mark their own. |
| `employee` | Any staff member — can only view their own attendance, cannot mark |

---

## Navigation / Menu Placement

```
HRMS
├── My Space (visible to ALL roles)
│   ├── My Attendance       ← Employee views own monthly attendance + summary
│   └── Regularize          ← Employee requests correction for a wrongly marked day
│
├── Team (visible to: manager, hr)
│   ├── Mark Attendance     ← Manager marks attendance for reportees (single/week/month)
│   ├── Team Attendance     ← Manager views monthly grid for all reportees
│   └── Regularization Requests ← Manager/HR reviews pending correction requests
│
└── HR Tools (visible to: hr only)
    ├── Mark Attendance     ← HR can mark for any employee (overwrite power)
    └── Regularization Requests ← HR sees all pending requests across org
```

---

## Page 1: My Attendance (`My Space > My Attendance`)

**Visible to:** All roles

**Purpose:** Employee sees their own attendance for any month — day-by-day records + monthly summary.

### API Call
```
GET /attendance/my?month=3&year=2026
```

**Optional filters:**
| Param | Type | Description |
|---|---|---|
| `month` | number | Required. 1–12 |
| `year` | number | Required |
| `status` | string | Filter by status (see status values below) |
| `page` | number | Default 1 |
| `limit` | number or `"all"` | Default 20 |

### Response
```json
{
  "data": [
    {
      "id": 101,
      "employee_id": 193,
      "employee_name": "Sunita Pallai",
      "attendance_date": "2026-03-01",
      "status": "present",
      "source": "manager_override",
      "approval_status": "approved",
      "remarks": null
    },
    {
      "id": 102,
      "employee_id": 193,
      "attendance_date": "2026-03-02",
      "status": "weekend",
      "source": "system"
    }
  ],
  "summary": {
    "present": 20,
    "absent": 1,
    "half_day": 1,
    "on_leave": 2,
    "holiday": 3,
    "weekend": 9,
    "comp_off": 0
  },
  "pagination": { "page": 1, "limit": 20, "total": 31, "totalPages": 2 }
}
```

### UI Rendering

**Summary bar (top of page):**
```
Present: 20  |  Absent: 1  |  Half Day: 1  |  On Leave: 2  |  Holiday: 3
```

**Calendar / List view per day:**

| Status | Badge color | Meaning |
|---|---|---|
| `present` | Green | Full day present |
| `absent` | Red | Absent (may become LOP) |
| `half_day` | Yellow | Half day |
| `on_leave` | Blue | Approved leave |
| `holiday` | Purple | Public or restricted holiday |
| `weekend` | Grey | Saturday / Sunday |
| `comp_off` | Teal | Comp-off day |

---

## Page 2: My Regularization Requests (`My Space > Regularize`)

**Visible to:** All roles (for own records only)

**Purpose:** Employee raises a correction request when their attendance was marked incorrectly.

### View my requests
```
GET /attendance/regularize?page=1&limit=20
```
*(Without `employee_id` filter — backend scopes to self)*

### Submit a regularization request
```
POST /attendance/regularize
Body:
{
  "attendance_id": 101,
  "requested_status": "present",
  "reason": "I was present but attendance was not marked"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `attendance_id` | number | ✅ | ID from the attendance record the employee wants corrected |
| `requested_status` | string | ✅ | What the employee wants it changed to (see status values) |
| `reason` | string | ✅ | Min 5 chars, max 500 chars |

**Cannot regularize:** `weekend` or `holiday` records — these are system-set.

### Error messages to handle

| API error | Show to user as |
|---|---|
| `"Weekends and holidays cannot be regularized"` | "This day cannot be changed — weekends and holidays are set automatically." |
| `"A pending regularization request already exists for this date"` | "You already have a pending request for this date. Wait for it to be reviewed." |
| `"You can only request regularization for your own attendance"` | "You can only request corrections for your own attendance." |

---

## Page 3: Mark Attendance (`Team > Mark Attendance`)

**Visible to:** `manager`, `hr`

**Purpose:** Mark attendance for one or more employees — for a single day, a week, or a full month at once.

### API Call
```
POST /attendance/mark
Body:
{
  "employee_ids": [101, 102, 103],
  "from_date": "2026-03-01",
  "to_date": "2026-03-31",
  "status": "present",
  "half_day_session": null,
  "remarks": "Marked for March"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `employee_ids` | number[] | ✅ | One or more employee IDs. Manager restricted to own reportees. |
| `from_date` | date (ISO) | ✅ | Start date |
| `to_date` | date (ISO) | ✅ | Same as `from_date` for single day marking |
| `status` | string | ✅ | See status values below |
| `half_day_session` | string | Conditional | Required when `status = "half_day"`. Value: `"first_half"` or `"second_half"` |
| `remarks` | string | ❌ | Optional note |

### UI: Three marking modes

**Single Day:**
```
from_date = to_date = "2026-03-15"
```

**Week:**
```
from_date = "2026-03-09"  (Monday)
to_date   = "2026-03-15"  (Sunday)
```
Backend auto-skips weekends — no need to filter in UI.

**Full Month:**
```
from_date = "2026-03-01"
to_date   = "2026-03-31"
```
Backend auto-skips weekends + national/company holidays + each employee's chosen restricted holidays.

### Response
```json
{
  "data": {
    "created": 60,
    "updated": 12,
    "total_dates": 23,
    "total_employees": 3
  }
}
```
Show: `"Attendance marked for 3 employees across 23 working days."`

### Important rules for UI
- Manager can only select employees from their reportee list — do NOT show all employees
- HR sees all employees in the dropdown
- `holiday` and `weekend` cannot be manually set via this form — backend overwrites them automatically with the correct system status
- If marking `half_day`, show a second dropdown: **First Half** / **Second Half**

### Status values (for dropdown)
| Value | Label |
|---|---|
| `present` | Present |
| `absent` | Absent |
| `half_day` | Half Day |
| `comp_off` | Comp Off |

> `on_leave`, `holiday`, `weekend` are set by the system — do NOT show these in the mark attendance dropdown.

---

## Page 4: Team Attendance Grid (`Team > Team Attendance`)

**Visible to:** `manager`, `hr`

**Purpose:** Manager sees a monthly grid showing attendance status per day for all their reportees.

### API Call
```
GET /attendance/team?month=3&year=2026
GET /attendance/team?month=3&year=2026&employee_id=101
GET /attendance/team?month=3&year=2026&status=absent
```

**Filters:**
| Param | Type | Description |
|---|---|---|
| `month` | number | Required. 1–12 |
| `year` | number | Required |
| `employee_id` | number | Filter to one employee |
| `status` | string | Filter records by status |
| `page` | number | Pagination over employees |
| `limit` | number or `"all"` | Default 20 per page |

### Response
```json
{
  "data": [
    {
      "employee_id": 101,
      "employee_code": "IB-001481",
      "employee_name": "Sunita Pallai",
      "records": [
        { "date": "2026-03-01", "status": "present", "source": "manager_override" },
        { "date": "2026-03-02", "status": "weekend", "source": "system" },
        { "date": "2026-03-03", "status": "absent",  "source": "manager_override" }
      ],
      "summary": {
        "present": 18, "absent": 2, "half_day": 1,
        "on_leave": 1, "holiday": 2, "weekend": 9, "comp_off": 0
      }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
}
```

**UI:** Render as a spreadsheet-style grid — employees as rows, dates as columns, status as colored cells.

---

## Page 5: Attendance Summary

**Visible to:** `manager`, `hr` (for any employee in their scope)

**Purpose:** View aggregate stats for one employee for a month — used in payroll review.

### API Call
```
GET /attendance/summary?employee_id=101&month=3&year=2026
```

### Response
```json
{
  "data": {
    "employee_id": 101,
    "month": 3,
    "year": 2026,
    "total_calendar_days": 31,
    "total_working_days": 22,
    "present": 18,
    "absent": 2,
    "half_day": 1,
    "on_leave": 1,
    "holiday": 2,
    "weekend": 9,
    "comp_off": 0,
    "paid_days": 19.5,
    "lop_days": 2
  }
}
```

`paid_days = present + (half_day × 0.5) + on_leave + comp_off`
`lop_days = absent`

---

## Page 6: Regularization Requests (`Team > Regularization Requests`)

**Visible to:** `manager` (own reportees), `hr` (all)

**Purpose:** Review pending correction requests from employees.

### List requests
```
GET /attendance/regularize?review_status=pending
GET /attendance/regularize?review_status=pending&month=3&year=2026
GET /attendance/regularize?employee_id=101
```

**Filters:**
| Param | Type | Description |
|---|---|---|
| `review_status` | string | `pending` \| `approved` \| `rejected` |
| `employee_id` | number | Filter to one employee |
| `month` | number | Filter by attendance month |
| `year` | number | |
| `page`, `limit` | | Pagination |

### Response
```json
{
  "data": [
    {
      "id": 5,
      "attendance_id": 101,
      "employee_id": 193,
      "employee_name": "Sunita Pallai",
      "employee_code": "IB-001481",
      "attendance_date": "2026-03-10",
      "original_status": "absent",
      "requested_status": "present",
      "reason": "I was present but not marked",
      "review_status": "pending",
      "requested_at": "2026-03-12T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 3, "totalPages": 1 }
}
```

### Approve / Reject a request
```
PATCH /attendance/regularize/:id
Body:
{
  "review_status": "approved",
  "remarks": "Verified with entry log"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `review_status` | string | ✅ | `"approved"` or `"rejected"` |
| `remarks` | string | ❌ | Optional reviewer comment |

**On approval:** Backend automatically updates the attendance record to `requested_status`. No extra call needed.

---

## Access Control Summary

| Feature | `employee` | `manager` | `hr` |
|---|---|---|---|
| View own attendance | ✅ | ✅ | ✅ |
| Request regularization (own records) | ✅ | ✅ | ✅ |
| Mark attendance | ❌ | ✅ (reportees only) | ✅ (anyone) |
| View team attendance grid | ❌ | ✅ (reportees only) | ✅ (all) |
| View attendance summary | ❌ | ✅ (reportees only) | ✅ (all) |
| Review regularization requests | ❌ | ✅ (reportees only) | ✅ (all) |

---

## Attendance Status Reference

| Status | Set by | Meaning |
|---|---|---|
| `present` | Manager / HR | Full day present |
| `absent` | Manager / HR | Absent — may become LOP if no leave balance |
| `half_day` | Manager / HR | Half day (first or second half) |
| `on_leave` | System (on leave approval) | On approved leave |
| `holiday` | System (from holiday calendar) | Public holiday or employee's chosen restricted holiday |
| `weekend` | System | Saturday / Sunday |
| `comp_off` | Manager / HR | Comp-off taken |
