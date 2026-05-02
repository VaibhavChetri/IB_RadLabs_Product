# Procurement Phase 2 — UI Integration Guide

## 🎯 Overview

Phase 2 implements the **Client Invoice Auto-Draft + Approval Workflow**. When a Delivery Challan (DC) is created, a draft invoice is automatically generated. The team then approves and marks it as sent through API endpoints.

---

## 📋 API Endpoints

### 1. List Client Invoices (Per Lead)

**Endpoint:**
```
GET /v1/api/procurement/leads-tracker/:leadId/client-invoices
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `leadId` | string/number | ✅ | Lead tracker ID |

**Response Example:**
```json
{
  "status": true,
  "statusCode": 200,
  "message": "Client invoices fetched successfully",
  "data": [
    {
      "id": 42,
      "leadId": 5,
      "clientPoId": 10,
      "deliveryChallanId": 3,
      "dcNumber": "DC-2024-001",
      "dcDispatchDate": "2024-04-05",
      "challanStatus": "dispatched",
      "invoiceNumber": null,
      "amount": 125000.00,
      "invoiceDate": null,
      "invoiceStatus": "not_invoiced",
      "approvalStatus": "draft",
      "dueDate": null,
      "computedStatus": "pending",
      "paymentDate": null,
      "invoiceFileUrl": null,
      "remarks": null,
      "createdAt": "2024-04-06T10:30:00Z",
      "updatedAt": "2024-04-06T10:30:00Z"
    },
    {
      "id": 41,
      "leadId": 5,
      "clientPoId": 9,
      "deliveryChallanId": 2,
      "dcNumber": "DC-2024-002",
      "dcDispatchDate": "2024-03-28",
      "challanStatus": "delivered",
      "invoiceNumber": "INV-2024-045",
      "amount": 85000.00,
      "invoiceDate": "2024-03-29",
      "invoiceStatus": "not_invoiced",
      "approvalStatus": "sent",
      "dueDate": "2024-04-15",
      "computedStatus": "pending",
      "paymentDate": null,
      "invoiceFileUrl": "https://...",
      "remarks": "Payment terms: Net 30",
      "createdAt": "2024-03-29T14:20:00Z",
      "updatedAt": "2024-04-02T11:00:00Z"
    }
  ]
}
```

**Key Fields:**
- `approvalStatus`: `draft` | `approved` | `sent` (workflow state)
- `computedStatus`: `paid` | `overdue` | `pending` | `not_invoiced` (calculated status)
- `amount`: Auto-calculated from DC items (qty × rate)
- `dcNumber`: Linked delivery challan number
- `invoiceNumber`: Filled in after approval by team

---

### 2. Approve Invoice (draft → approved)

**Endpoint:**
```
POST /v1/api/procurement/leads-tracker/:leadId/client-invoices/:invoiceId/approve
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `leadId` | string/number | ✅ | Lead tracker ID |
| `invoiceId` | string/number | ✅ | Invoice ID to approve |

**Request Body:**
```json
{}
```
(Empty body)

**Response Example (Success):**
```json
{
  "status": true,
  "statusCode": 200,
  "message": "Invoice approved successfully",
  "data": {
    "id": 42,
    "leadId": 5,
    "clientPoId": 10,
    "deliveryChallanId": 3,
    "invoiceNumber": null,
    "amount": 125000.00,
    "invoiceDate": null,
    "invoiceStatus": "not_invoiced",
    "approvalStatus": "approved",
    "dueDate": null,
    "paymentDate": null,
    "invoiceFileUrl": null,
    "remarks": null,
    "createdAt": "2024-04-06T10:30:00Z",
    "updatedAt": "2024-04-06T10:35:00Z"
  }
}
```

**Error Response (Already Approved):**
```json
{
  "status": false,
  "statusCode": 400,
  "message": "Cannot approve — current status is 'approved'",
  "data": null
}
```

**Error Codes:**
| Code | Message | Meaning |
|------|---------|---------|
| 400 | Cannot approve — current status is 'X' | Invoice not in 'draft' state |
| 404 | Invoice not found | Invalid invoiceId or leadId |
| 400 | Invalid invoiceId | invoiceId is not a number |

---

### 3. Mark Invoice as Sent (approved → sent)

**Endpoint:**
```
POST /v1/api/procurement/leads-tracker/:leadId/client-invoices/:invoiceId/mark-sent
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `leadId` | string/number | ✅ | Lead tracker ID |
| `invoiceId` | string/number | ✅ | Invoice ID to mark sent |

**Request Body:**
```json
{}
```
(Empty body)

**Response Example (Success):**
```json
{
  "status": true,
  "statusCode": 200,
  "message": "Invoice marked as sent",
  "data": {
    "id": 42,
    "leadId": 5,
    "approvalStatus": "sent",
    "invoiceNumber": null,
    "amount": 125000.00,
    "invoiceDate": null,
    "invoiceStatus": "not_invoiced",
    "updatedAt": "2024-04-06T10:40:00Z"
    // ... other fields ...
  }
}
```

**Error Response (Not Approved):**
```json
{
  "status": false,
  "statusCode": 400,
  "message": "Cannot mark sent — current status is 'draft'",
  "data": null
}
```

---

## 🔄 Invoice Workflow State Machine

```
┌─────────────────────────────────────────────────────┐
│  INVOICE APPROVAL WORKFLOW STATE MACHINE            │
└─────────────────────────────────────────────────────┘

    [AUTO-DRAFT]
    On DC Creation
         │
         ▼
    ┌────────────┐
    │   DRAFT    │  ← Invoice auto-created from DC
    │  (awaiting │     Can be reviewed by team
    │ approval)  │
    └────────────┘
         │
         │ POST /approve
         │ (User approves invoice)
         ▼
    ┌────────────┐
    │  APPROVED  │  ← Ready to send to client
    │  (ready to │     Can upload invoice file
    │    send)   │     Can fill in invoice number
    └────────────┘
         │
         │ POST /mark-sent
         │ (User marks as sent to client)
         ▼
    ┌────────────┐
    │    SENT    │  ← Sent to client
    │ (awaiting  │     Awaiting payment
    │  payment)  │
    └────────────┘
```

---

## 💻 UI Implementation Guide

### 1. Invoice List Component

**Purpose:** Display all invoices for a lead with status indicators

**Location:** Suggested in Lead Tracker → Procurement Tab → Client Invoices

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT INVOICES                                    [+ New]     │
├─────────────────────────────────────────────────────────────────┤
│ Filter by: [Status ▼] [DC ▼]                    Search... [🔍]  │
├────────────────────────────────────────────────────────────────┐
│ # │ DC#      │ Amount   │ Status    │ Approval │ Due Date  │ Actions
├───┼──────────┼──────────┼───────────┼──────────┼───────────┼─────────
│ 1 │ DC-001   │ ₹125,000 │ Pending   │ Draft    │ —         │ Approve
│ 2 │ DC-002   │ ₹85,000  │ Pending   │ Approved │ Apr 15    │ Send
│ 3 │ DC-003   │ ₹50,000  │ Pending   │ Sent     │ Apr 22    │ —
│ 4 │ DC-004   │ ₹200,000 │ Paid      │ Sent     │ May 01    │ —
│ 5 │ —        │ ₹35,000  │ Pending   │ Draft    │ —         │ Approve
└──┴──────────┴──────────┴───────────┴──────────┴───────────┴─────────

Legend:
Draft    = 🔵 Gray
Approved = 🟡 Yellow
Sent     = 🟢 Green
```

**Data Mapping:**
```javascript
const invoiceRows = [
  {
    dcNumber: item.dcNumber,
    amount: formatCurrency(item.amount),
    invoiceStatus: item.invoiceStatus,
    approvalStatus: item.approvalStatus,
    dueDate: item.dueDate ? formatDate(item.dueDate) : '—',
    actions: getActionsForStatus(item.approvalStatus)
  }
];
```

**Filters:**
- Status: All, Paid, Overdue, Pending, Not Invoiced
- Approval: All, Draft, Approved, Sent
- Date Range: Last 30 days, Last 90 days, Custom

---

### 2. Invoice Detail / Approval Modal

**Purpose:** View invoice details and perform approval actions

**Trigger:** Click on row in list

**Layout:**
```
╔════════════════════════════════════════════════════╗
║  INVOICE #INV-2024-042                      [✕]   ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║  DC DETAILS                                        ║
║  ├─ DC Number: DC-2024-001                       ║
║  ├─ Dispatch Date: Apr 05, 2024                  ║
║  ├─ Status: Dispatched                           ║
║  └─ Items: 5                                      ║
║                                                    ║
║  INVOICE DETAILS                                   ║
║  ├─ Amount: ₹ 1,25,000                           ║
║  ├─ Status: Not Invoiced                         ║
║  ├─ Approval: DRAFT ← [Approve] [Reject]         ║
║  ├─ Due Date: —                                   ║
║  ├─ Invoice File: [Upload]                       ║
║  └─ Remarks: [Optional notes...]                  ║
║                                                    ║
║  TIMELINE                                          ║
║  ├─ Created: Apr 06, 2024 10:30 AM               ║
║  ├─ Auto-drafted from DC                          ║
║  └─ Last Updated: Apr 06, 2024 10:30 AM          ║
║                                                    ║
║                        [Close] [Approve Invoice]  ║
╚════════════════════════════════════════════════════╝
```

**Actions by Status:**

| Status | Available Actions |
|--------|------------------|
| Draft | [Approve] [View DC] [Download] |
| Approved | [Mark Sent] [Edit] [View DC] [Download] |
| Sent | [View DC] [Download] [View Payments] |

---

### 3. Approval Button States

**Button States & Behavior:**

```javascript
// Draft Status
<button onClick={approveInvoice} disabled={false}>
  ✓ Approve Invoice
</button>

// Approved Status
<button onClick={markSent} disabled={false}>
  📤 Mark as Sent
</button>

// Sent Status
<button disabled={true}>
  ✓ Sent to Client
</button>
```

**Loading State:**
```javascript
<button disabled={isLoading} onClick={approveInvoice}>
  {isLoading ? '⏳ Approving...' : '✓ Approve Invoice'}
</button>
```

**Error Display:**
```javascript
{error && (
  <div className="error-banner">
    ⚠️ {error.message}
    {/* Example: "Cannot approve — current status is 'approved'" */}
  </div>
)}
```

---

## 🧪 Testing Instructions

### Test Scenario 1: Auto-Draft on DC Creation

**Steps:**
1. Navigate to Procurement → Leads Tracker → Select a lead
2. Go to Delivery Challans tab
3. Click "Create Delivery Challan"
4. Fill in:
   - DC Number: `DC-TEST-001`
   - Dispatch Date: Today
   - Proforma Invoice: Check at least one
   - Items: Add at least 1 item with qty and rate
5. Click "Create"

**Expected Result:**
✅ DC created successfully
✅ New invoice appears in "Client Invoices" tab
✅ Invoice amount = sum of (item qty × rate)
✅ Invoice status: Draft
✅ Linked to the DC

**Test Data:**
```json
{
  "dcNumber": "DC-TEST-001",
  "dispatchDate": "2024-04-06",
  "proformaInvoiceNumber": "PO-123",
  "items": [
    {
      "description": "Widget A",
      "qtyDispatched": 100,
      "rate": 500,
      "unit": "pcs"
    },
    {
      "description": "Widget B",
      "qtyDispatched": 50,
      "rate": 1000,
      "unit": "pcs"
    }
  ]
}
```

**Expected Amount:** (100 × 500) + (50 × 1000) = 100,000

---

### Test Scenario 2: Draft to Approved Transition

**Steps:**
1. Go to Client Invoices list
2. Find invoice with status "Draft"
3. Click the invoice row (opens detail modal)
4. Click "Approve Invoice" button
5. Confirm action

**Expected Result:**
✅ Button disabled briefly (loading)
✅ Approval status changes to "Approved"
✅ "Approve" button disappears
✅ "Mark Sent" button appears
✅ updatedAt timestamp updates

**API Call Being Made:**
```
POST /v1/api/procurement/leads-tracker/5/client-invoices/42/approve
```

---

### Test Scenario 3: Approved to Sent Transition

**Steps:**
1. From previous test, invoice is now "Approved"
2. Click "Mark as Sent" button
3. Confirm action

**Expected Result:**
✅ Button disabled briefly (loading)
✅ Approval status changes to "Sent"
✅ "Mark Sent" button disappears
✅ All action buttons disappear
✅ Status badge shows green ("Sent")

**API Call Being Made:**
```
POST /v1/api/procurement/leads-tracker/5/client-invoices/42/mark-sent
```

---

### Test Scenario 4: Error Handling - Invalid Transition

**Steps:**
1. Find an invoice with status "Sent"
2. (Manually or via dev tools) Try to call approve endpoint
   ```javascript
   fetch('/v1/api/procurement/leads-tracker/5/client-invoices/42/approve', {
     method: 'POST'
   })
   ```

**Expected Result:**
✅ API returns 400 error
✅ Error message: "Cannot approve — current status is 'sent'"
✅ UI displays error banner
✅ No state change occurs

**Error Response:**
```json
{
  "status": false,
  "statusCode": 400,
  "message": "Cannot approve — current status is 'sent'"
}
```

---

### Test Scenario 5: List Invoices with Filters

**Steps:**
1. Go to Client Invoices tab
2. Create 3-5 test invoices in different states (draft, approved, sent)
3. Apply filters:
   - Filter by Status: "Pending"
   - Filter by Approval: "Draft"
   - Filter by DC number

**Expected Result:**
✅ List updates to show only matching invoices
✅ Row count reflects filters
✅ Applied filters show as chips/tags
✅ Can clear individual filters or all filters

---

### Test Scenario 6: Computed Status Accuracy

**Steps:**
1. Create invoices with various due dates:
   - Due date in future → should show "pending"
   - Due date in past (and not paid) → should show "overdue"
   - Payment date filled → should show "paid"

2. Verify "computedStatus" field in API response

**Expected Results:**

| invoice_status | due_date | payment_date | computedStatus |
|---|---|---|---|
| not_invoiced | NULL | NULL | not_invoiced |
| not_invoiced | 2024-04-15 | NULL | pending |
| not_invoiced | 2024-03-01 | NULL | overdue |
| not_invoiced | 2024-03-01 | 2024-03-20 | paid |

---

## 🔐 Authentication & Authorization

**Required Permissions:**

| Endpoint | Permission | Notes |
|----------|-----------|-------|
| GET /client-invoices | `getProcurement` | Read-only |
| POST .../approve | `manageProcurement` | Approve action |
| POST .../mark-sent | `manageProcurement` | Send action |

**Implementation:**
```javascript
// In your auth/permissions service
const canApproveInvoices = user.permissions.includes('manageProcurement');
const canViewInvoices = user.permissions.includes('getProcurement');
```

---

## 📊 UI Component Examples

### Invoice List Component (React)

```jsx
import { useState, useEffect } from 'react';

export function ClientInvoicesList({ leadId }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchInvoices();
  }, [leadId]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/v1/api/procurement/leads-tracker/${leadId}/client-invoices`
      );
      const json = await res.json();
      if (json.status) {
        setInvoices(json.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (invoiceId) => {
    try {
      const res = await fetch(
        `/v1/api/procurement/leads-tracker/${leadId}/client-invoices/${invoiceId}/approve`,
        { method: 'POST' }
      );
      const json = await res.json();
      if (json.status) {
        // Update local state
        setInvoices(invoices.map(inv =>
          inv.id === invoiceId ? json.data : inv
        ));
      } else {
        setError(json.message);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusBadgeColor = (status) => {
    return {
      draft: 'gray',
      approved: 'yellow',
      sent: 'green'
    }[status];
  };

  return (
    <div className="invoices-container">
      {error && <div className="alert alert-error">{error}</div>}
      
      {loading ? (
        <div className="spinner">Loading invoices...</div>
      ) : (
        <table className="invoices-table">
          <thead>
            <tr>
              <th>DC#</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Approval</th>
              <th>Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id}>
                <td>{inv.dcNumber || '—'}</td>
                <td>₹ {formatCurrency(inv.amount)}</td>
                <td>
                  <span className={`badge badge-${inv.computedStatus}`}>
                    {inv.computedStatus}
                  </span>
                </td>
                <td>
                  <span className={`badge badge-${getStatusBadgeColor(inv.approvalStatus)}`}>
                    {inv.approvalStatus}
                  </span>
                </td>
                <td>{inv.dueDate || '—'}</td>
                <td>
                  {inv.approvalStatus === 'draft' && (
                    <button onClick={() => handleApprove(inv.id)}>
                      Approve
                    </button>
                  )}
                  {inv.approvalStatus === 'approved' && (
                    <button onClick={() => handleMarkSent(inv.id)}>
                      Mark Sent
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

---

## 📱 Mobile Responsive Design

**For mobile (screens < 768px):**

```
┌──────────────────────────────────┐
│  INVOICES                   [+]  │
├──────────────────────────────────┤
│ 🟵 DC-001 │ ₹1,25,000           │
│ Status: Pending │ Draft          │
│ [Approve >]                      │
├──────────────────────────────────┤
│ 🟡 DC-002 │ ₹85,000             │
│ Status: Pending │ Approved       │
│ [Send >]                         │
├──────────────────────────────────┤
│ 🟢 DC-003 │ ₹50,000             │
│ Status: Pending │ Sent           │
│ [View >]                         │
└──────────────────────────────────┘
```

**Stack layout with expandable details**

---

## 🎨 Color Scheme

**Approval Status Badges:**
```
Draft    = 🔵 Gray (#6B7280)
Approved = 🟡 Yellow (#F59E0B)
Sent     = 🟢 Green (#10B981)
```

**Computed Status Badges:**
```
Paid         = 🟢 Green (#10B981)
Overdue      = 🔴 Red (#EF4444)
Pending      = 🔵 Blue (#3B82F6)
Not Invoiced = ⚪ Gray (#9CA3AF)
```

---

## 🔄 Integration Checklist

- [ ] Add "Client Invoices" tab to Lead Tracker view
- [ ] Implement invoice list component with table/cards
- [ ] Add filter and search functionality
- [ ] Implement approval modal/drawer
- [ ] Add approve button with loading state
- [ ] Add mark-sent button with loading state
- [ ] Display error messages clearly
- [ ] Add refresh/reload functionality
- [ ] Handle empty state (no invoices)
- [ ] Add loading skeleton screens
- [ ] Implement status badge colors
- [ ] Add computed status calculation/display
- [ ] Test all error scenarios
- [ ] Test state transitions
- [ ] Verify permissions check
- [ ] Add to breadcrumb navigation
- [ ] Test on mobile devices
- [ ] Add keyboard shortcuts (optional)
- [ ] Add toast notifications for actions
- [ ] Document in your design system

---

## 💡 Best Practices

### 1. **Error Handling**
```javascript
if (!response.ok) {
  const error = await response.json();
  // Display: "Cannot approve — current status is 'approved'"
  showErrorAlert(error.message);
  return;
}
```

### 2. **Optimistic Updates**
```javascript
// Update UI immediately, revert if error
const oldInvoices = [...invoices];
setInvoices(invoices.map(inv =>
  inv.id === id ? { ...inv, approvalStatus: 'approved' } : inv
));

try {
  await approveAPI(id);
} catch (err) {
  setInvoices(oldInvoices); // Revert on error
  showErrorAlert(err.message);
}
```

### 3. **Loading States**
```javascript
<button 
  disabled={isLoading || !canApprove}
  onClick={handleApprove}
>
  {isLoading ? '⏳ Processing...' : '✓ Approve'}
</button>
```

### 4. **Empty States**
```javascript
{invoices.length === 0 && (
  <div className="empty-state">
    <p>No invoices yet</p>
    <p className="hint">Invoices are auto-created when you create delivery challans</p>
  </div>
)}
```

---

## 📞 Support & Questions

**Common Issues:**

**Q: Invoice not created after DC creation?**
A: Check that DC creation succeeded and returned ID. Refresh the invoices list.

**Q: Approval button doesn't work?**
A: Check user permissions. Verify approvalStatus is 'draft'.

**Q: Amount is 0 or NULL?**
A: Ensure DC items have valid qty and rate. Rate can come from DC item or PO line item.

**Q: Status shows "pending" but due date is in future?**
A: This is correct. Status is "pending" unless overdue.

---

Good luck with implementation! 🚀
