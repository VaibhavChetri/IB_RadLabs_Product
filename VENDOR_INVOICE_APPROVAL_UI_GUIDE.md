# Vendor Invoice Approval System — UI Integration Guide

## 🎯 Overview

When IB receives a Client PO, they contact vendors who raise invoices. Before any vendor is paid, their invoice must go through a structured approval workflow.

This guide covers **everything the UI needs to implement** — every button, badge, alert, loading state, error message, and API call.

---

## 👥 Approver Routing (Who Gets Notified)

| Invoice Amount | Approvers |
|----------------|-----------|
| < ₹1,00,000 | Priyanka only |
| ≥ ₹1,00,000 | Priyanka + Piyush + Shashwat |

All assigned approvers must approve before the invoice is marked **Approved**. Any single rejection immediately marks it **Rejected**.

---

## 🔄 Approval Status Lifecycle

```
draft
  │
  │  [Send for Approval button clicked]
  ▼
pending_approval  ◄─────────────────────────────┐
  │                                               │
  ├── any approver rejects ──► rejected           │
  │                               │               │
  └── ALL approvers approve ──► approved          │
                                  │               │
                             [Re-submit] ─────────┘
```

**Status meanings for UI:**

| Status | Badge Color | Label | Action Available |
|--------|-------------|-------|-----------------|
| `draft` | Grey | Draft | Send for Approval button |
| `pending_approval` | Yellow/Amber | Pending Approval | None (waiting) |
| `approved` | Green | Approved | None (terminal) |
| `rejected` | Red | Rejected | Re-submit for Approval button |

---

## 📋 API Endpoints Reference

### Base URL
```
/v1/api/procurement
```

---

### 1. Get Vendor Invoices with Approval Status

Use this to render the vendor list on a lead with current approval state.

```
GET /leads-tracker/:leadId/vendor-invoices/approval-status
Auth: getProcurement
```

**Response:**
```json
{
  "status": true,
  "data": [
    {
      "id": 5,
      "vendorName": "ABC Kitchen",
      "invoiceAmount": 220000,
      "invoiceStatus": "unpaid",
      "approvalStatus": "pending_approval",
      "approvalSubmittedAt": "2026-04-15T10:00:00",
      "approvedAt": null,
      "rejectedAt": null,
      "approvals": [
        {
          "approverId": 622,
          "approverName": "priyanka-agarwal",
          "approverRole": "default_approver",
          "decision": "approved",
          "decidedAt": "2026-04-15T10:30:00",
          "rejectionReason": null
        },
        {
          "approverId": 621,
          "approverName": "piyush-gangwal",
          "approverRole": "senior_approver",
          "decision": "pending",
          "decidedAt": null,
          "rejectionReason": null
        },
        {
          "approverId": 620,
          "approverName": "shashwat-gangwal",
          "approverRole": "senior_approver",
          "decision": "pending",
          "decidedAt": null,
          "rejectionReason": null
        }
      ]
    }
  ]
}
```

> **Note:** `approvals` array is empty when `approvalStatus = 'draft'`. Always shows only the **latest approval batch** — old rejection history is not shown.

---

### 2. Upload Vendor Invoice File

```
POST /leads-tracker/:leadId/vendors/:vendorId/upload-invoice
Auth: manageProcurement
Content-Type: multipart/form-data
Field: invoiceFile (required)
```

**Allowed file types:** PDF, DOCX, JPG, JPEG, PNG, WEBP
**Max file size:** 15 MB

**Success Response (200):**
```json
{
  "status": true,
  "data": { "invoiceFileUrl": "https://s3.amazonaws.com/..." }
}
```

**Error Responses:**

| HTTP | When | Message to Show User |
|------|------|----------------------|
| 400 | Wrong file type | "Only PDF, DOCX, and image files are allowed" |
| 400 | File > 15 MB | "File size must be under 15 MB" |
| 404 | Wrong lead/vendor combo | "Vendor invoice not found" |
| 409 | Status is `pending_approval` | "Invoice file cannot be replaced while approval is pending" |
| 409 | Status is `approved` | "Invoice file cannot be replaced on an approved invoice" |

---

### 3. Send for Approval

```
POST /leads-tracker/:leadId/vendor-invoices/send-for-approval
Auth: manageProcurement
Content-Type: application/json
```

**Request Body:**
```json
{ "vendorIds": [5] }
```

> You can send multiple vendor IDs in one shot: `"vendorIds": [5, 6, 7]`

**Success Response (200):**
```json
{
  "status": true,
  "data": {
    "batchId": 3,
    "submittedVendors": [
      {
        "vendorId": 5,
        "approverCount": 3,
        "approvers": [
          { "adminId": 622, "approverRole": "default_approver" },
          { "adminId": 621, "approverRole": "senior_approver" },
          { "adminId": 620, "approverRole": "senior_approver" }
        ]
      }
    ]
  }
}
```

**Error Responses:**

| HTTP | When | Message to Show User |
|------|------|----------------------|
| 400 | `vendorIds` is empty | "Please select at least one vendor invoice" |
| 400 | Duplicate vendor IDs | "Duplicate vendor IDs in request" |
| 400 | One or more not in draft/rejected | "Invoice [ID] is already in '[status]' state" |
| 404 | Vendor belongs to different lead | "One or more vendor invoices not found for this lead" |
| 503 | No approvers configured | "Approval system not configured. Contact admin." |

---

### 4. Submit Approval Decision (Approver's action)

```
POST /leads-tracker/:leadId/vendors/:vendorId/approval-decision
Auth: getProcurement
Content-Type: application/json
```

**Request Body:**
```json
{ "decision": "approved" }
```
```json
{ "decision": "rejected", "rejectionReason": "Amount does not match PO" }
```

**Success Response (200):**
```json
{
  "status": true,
  "data": {
    "vendor": {
      "id": 5,
      "approval_status": "approved",
      "approved_at": "2026-04-15T11:30:00"
    }
  }
}
```

**Error Responses:**

| HTTP | When | Message to Show User |
|------|------|----------------------|
| 400 | Rejected without reason | "Please provide a reason for rejection" |
| 403 | User is not an approver | "You are not an approver for this invoice" |
| 409 | Already decided | "You have already submitted a decision for this invoice" |

---

### 5. Get My Pending Approvals

For the approver's dashboard / notification badge.

```
GET /vendor-invoices/pending-my-approval?page=1&perPage=20
Auth: getProcurement
```

**Response:**
```json
{
  "status": true,
  "data": [...],
  "pagination": { "page": 1, "perPage": 20, "total": 4, "pages": 1 }
}
```

---

### 6. Vendor Invoice Dashboard

```
GET /vendor-invoices/dashboard?page=1&perPage=20&leadStatus=won&approvalStatus=pending_approval&search=Compass
Auth: getProcurement
```

**Query Params:**

| Param | Default | Options |
|-------|---------|---------|
| `page` | 1 | any |
| `perPage` | 20 | max 100 |
| `leadStatus` | `won` | `won`, `lost`, etc. |
| `approvalStatus` | (all) | `draft`, `pending_approval`, `approved`, `rejected` |
| `search` | (none) | searches client name |

---

## 🖥️ UI Component Breakdown

### Vendor Invoice Row — State Machine

Each vendor invoice row in the lead detail view must render differently based on `approvalStatus`:

---

#### State: `draft`

```
┌─────────────────────────────────────────────────────────────┐
│ 🏢 ABC Kitchen           ₹2,20,000       ● Draft            │
│ Invoice: INV-2024-001    [📎 View File]  [Send for Approval]│
└─────────────────────────────────────────────────────────────┘
```

**UX rules:**
- Show **"Send for Approval"** button (primary/blue)
- If `invoiceFileUrl` is null → show warning tooltip on the button: _"No invoice file uploaded. Consider uploading before sending."_ (not a hard block — let them proceed)
- If `invoiceAmount` is null or 0 → show warning: _"Invoice amount is ₹0. It will be routed to Priyanka only. Update the amount if needed."_
- Clicking the button → show confirmation dialog (see below)

---

#### State: `pending_approval`

```
┌─────────────────────────────────────────────────────────────┐
│ 🏢 ABC Kitchen           ₹2,20,000    🟡 Pending Approval   │
│ Submitted: 15 Apr 2026   [👁 View Approvals]                │
└─────────────────────────────────────────────────────────────┘
```

**UX rules:**
- No Send/Re-submit button
- Show **"View Approvals"** button → opens a side panel or modal showing per-approver status (see Approvals Panel below)
- File upload button is **disabled** with tooltip: _"Cannot replace file while approval is in progress"_

---

#### State: `approved`

```
┌─────────────────────────────────────────────────────────────┐
│ 🏢 ABC Kitchen           ₹2,20,000    ✅ Approved           │
│ Approved: 15 Apr 2026    [👁 View Approvals]                │
└─────────────────────────────────────────────────────────────┘
```

**UX rules:**
- No buttons — terminal state
- Show green badge with approved date
- File upload disabled with tooltip: _"Invoice has been approved and cannot be modified"_

---

#### State: `rejected`

```
┌─────────────────────────────────────────────────────────────┐
│ 🏢 ABC Kitchen           ₹2,20,000    🔴 Rejected           │
│ Rejected: 15 Apr 2026    [👁 View Approvals] [Re-submit]    │
└─────────────────────────────────────────────────────────────┘
```

**UX rules:**
- Show **"Re-submit for Approval"** button (amber/warning color)
- Show **"View Approvals"** to see who rejected and why
- File upload is allowed — team may want to upload a corrected invoice before re-submitting
- Clicking Re-submit → same confirmation dialog as Send for Approval

---

### Confirmation Dialog — Send / Re-submit

Show this before calling the API:

```
┌─────────────────────────────────────────────────────────────┐
│  Send Invoice for Approval?                                  │
│                                                              │
│  Vendor: ABC Kitchen                                         │
│  Amount: ₹2,20,000                                          │
│  File: invoice_abc.pdf ✓                                     │
│                                                              │
│  Will be sent to:                                           │
│  • Priyanka (Finance)                                        │
│  • Piyush (Senior Approver)                                  │
│  • Shashwat (Senior Approver)                               │
│                                                              │
│  ⚠️  Once submitted, the invoice file cannot be replaced    │
│     until the approval is completed.                         │
│                                                              │
│          [Cancel]          [Send for Approval →]            │
└─────────────────────────────────────────────────────────────┘
```

> **How to know who will be notified before calling the API:**
> If `invoiceAmount >= 100000` → show Priyanka + Piyush + Shashwat
> If `invoiceAmount < 100000` → show Priyanka only
> (This mirrors the backend logic — hardcode the threshold from config or call GET /procurement-config)

---

### Approvals Panel / Modal — "View Approvals"

Opens when user clicks "View Approvals". Shows per-approver status from the `approvals` array:

```
┌─────────────────────────────────────────────────────────────┐
│  Approval Status — ABC Kitchen                               │
│  Submitted: 15 Apr 2026, 10:00 AM                           │
│                                                              │
│  ✅  Priyanka Agarwal      Approved    15 Apr, 10:30 AM     │
│  ⏳  Piyush Gangwal        Pending     —                    │
│  ⏳  Shashwat Gangwal      Pending     —                    │
│                                                              │
│                                           [Close]           │
└─────────────────────────────────────────────────────────────┘
```

If rejected, show rejection reason inline:
```
│  🔴  Piyush Gangwal    Rejected    15 Apr, 11:00 AM         │
│      Reason: "Amount does not match PO value"               │
```

---

### Approver View — My Pending Approvals

Approvers (Priyanka, Piyush, Shashwat) need a dedicated section / tab showing invoices waiting for their decision.

```
┌─────────────────────────────────────────────────────────────┐
│  📋 Pending My Approval  (4)                                │
├─────────────────────────────────────────────────────────────┤
│  Lead: Compass Group         ABC Kitchen    ₹2,20,000       │
│  Submitted: 15 Apr 2026                                     │
│                    [Reject ✕]           [Approve ✓]         │
├─────────────────────────────────────────────────────────────┤
│  Lead: ITC Hotels            XYZ Supplies  ₹45,000          │
│  Submitted: 14 Apr 2026                                     │
│                    [Reject ✕]           [Approve ✓]         │
└─────────────────────────────────────────────────────────────┘
```

**UX rules for Approve / Reject:**

**Approve flow:**
1. Click Approve → small confirmation: _"Approve invoice from ABC Kitchen for ₹2,20,000?"_
2. Confirm → call API → show success toast: _"Invoice approved successfully"_
3. Row disappears from the pending list

**Reject flow:**
1. Click Reject → open a modal with a **required** text area:
```
┌─────────────────────────────────────────────────────────────┐
│  Reject Invoice                                              │
│  ABC Kitchen — ₹2,20,000                                    │
│                                                              │
│  Reason for rejection (required):                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│          [Cancel]              [Confirm Rejection]          │
└─────────────────────────────────────────────────────────────┘
```
2. Cannot submit without reason — show inline error: _"Please provide a reason for rejection"_
3. On confirm → call API → show toast: _"Invoice rejected. The team has been notified."_
4. Row disappears from pending list

---

## 🚨 Alert & Toast Reference

All alerts/toasts the UI must implement:

### Success Toasts (Green)
| Trigger | Message |
|---------|---------|
| File uploaded | "Invoice file uploaded successfully" |
| Sent for approval | "Invoice sent for approval. Approvers have been notified." |
| Re-submitted | "Invoice re-submitted for approval." |
| Approved | "Invoice approved successfully" |
| Rejected | "Invoice rejected. The team has been notified." |

### Warning Alerts (Amber — non-blocking)
| Trigger | Message |
|---------|---------|
| Send for approval, no file uploaded | "No invoice file has been uploaded. You can still proceed, but approvers won't have a file to review." |
| Send for approval, amount is ₹0 or null | "Invoice amount is ₹0. This will be routed to Priyanka only. Please update the amount if this is incorrect." |

### Error Toasts (Red — from API failures)
| HTTP | Message to Show |
|------|----------------|
| 400 | Show the error message from API response directly |
| 403 | "You don't have permission to perform this action" |
| 404 | "Invoice not found. Please refresh and try again." |
| 409 (file upload) | "Invoice file cannot be replaced at this stage" |
| 409 (already decided) | "You have already submitted a decision for this invoice" |
| 503 | "Approval system is not configured. Please contact your administrator." |
| 500 | "Something went wrong. Please try again or contact support." |

### Inline Validation (before API call)
| Condition | Inline message |
|-----------|---------------|
| Reject without reason | "Rejection reason is required" |
| vendorIds array empty | "Please select at least one invoice" |

---

## 🔒 Permission-Based Rendering

| Role | Can see approval status | Can send for approval | Can approve/reject |
|------|------------------------|----------------------|-------------------|
| `getProcurement` | ✅ | ❌ | ✅ (if they are an approver) |
| `manageProcurement` | ✅ | ✅ | ✅ (if they are an approver) |

> The backend does not restrict `getProcurement` from calling the approval decision endpoint — it validates internally whether that user is actually an assigned approver. The UI should still only show the Approve/Reject buttons to users who are known approvers (Priyanka, Piyush, Shashwat).

---

## 📊 Vendor Invoice Dashboard

A standalone page showing all vendor invoices across all won leads.

```
GET /v1/api/procurement/vendor-invoices/dashboard
```

**Filters to expose in UI:**
- Search bar → searches by client name
- Status dropdown → All / Draft / Pending Approval / Approved / Rejected
- Lead status filter (default: Won)
- Pagination (20 per page default)

**Columns to show:**
| Column | Field |
|--------|-------|
| Client | from lead |
| Lead ID | `leadId` |
| Vendor | `vendorName` |
| Invoice Amount | `invoiceAmount` (format as ₹) |
| Approval Status | badge (color-coded) |
| Submitted At | `approvalSubmittedAt` |
| Approved/Rejected At | `approvedAt` or `rejectedAt` |
| Total Paid | `totalPaid` |

---

## 🧪 Test Scenarios for QA

Run these in order:

### Group 1 — File Upload
1. Upload a valid PDF → expect success toast + file URL saved
2. Upload a `.exe` file → expect error: unsupported file type
3. Upload a file > 15 MB → expect error: file too large
4. Upload file on `pending_approval` invoice → expect 409 error
5. Upload file on `approved` invoice → expect 409 error

### Group 2 — Send for Approval
6. Send invoice with amount ₹50,000 → only Priyanka in approver list
7. Send invoice with amount ₹2,00,000 → Priyanka + Piyush + Shashwat in approver list
8. Send invoice with no file → warning shown but allowed to proceed
9. Send invoice with amount ₹0 → warning about routing shown
10. Try to send an already `pending_approval` invoice → expect 400 error
11. Try to send an `approved` invoice → expect 400 error

### Group 3 — Approval Decision
12. Approver approves (not last) → status stays `pending_approval`
13. Last approver approves → status changes to `approved`, green badge shown
14. Any approver rejects with reason → status immediately `rejected`, red badge shown
15. Reject without providing reason → inline validation error shown
16. Non-approver tries to approve → 403 error toast shown
17. Same approver tries to approve twice → 409 "already decided" toast shown

### Group 4 — Re-submission
18. After rejection, upload new file → allowed
19. After rejection, click Re-submit → new batch created, status back to `pending_approval`
20. View approvals panel → shows only latest batch decisions

### Group 5 — Edge Cases
21. Refresh page mid-approval → status persists correctly from API
22. Two approvers approve simultaneously → both succeed, status flips to `approved` exactly once
23. `GET /pending-my-approval` for a non-approver → empty list, no error

---

## ⚙️ Procurement Config (Admin Only)

Admins can view and update approval routing config:

```
GET  /v1/api/procurement/procurement-config
PUT  /v1/api/procurement/procurement-config/:key
```

**Keys:**

| Key | Current Value | Description |
|-----|---------------|-------------|
| `vendor_invoice_high_value_threshold` | `100000` | Amount above which Piyush + Shashwat are added |
| `default_approver_ids` | `622` | Admin IDs who approve all invoices (Priyanka) |
| `senior_approver_ids` | `620,621` | Admin IDs added for high-value invoices (Shashwat, Piyush) |

> Changes take effect immediately — no server restart needed when updated via API.

---

## 📁 Audit Log

Every approval action is logged automatically. For future UI timeline feature, use:

```
GET /v1/api/procurement/leads-tracker/:leadId/audit-log
```

> This endpoint is not yet exposed — backend table is ready. Will be wired in next phase.

Logged actions:
- `FILE_UPLOADED` — who uploaded, file name, size
- `APPROVAL_SUBMITTED` — who submitted, batch ID, which approvers were notified
- `APPROVAL_RESUBMITTED` — re-submission after rejection
- `APPROVAL_DECISION` — who decided, what decision, rejection reason if any
- `CONFIG_CHANGED` — which config key changed, old value → new value

---

*Last updated: 2026-04-15 | Backend: `codex/hrm-linkage-attendance-fixes`*
