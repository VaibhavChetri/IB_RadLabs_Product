# Procurement Phase 2 — Quick Reference

## 🚀 Quick Start

### Endpoints
```
GET  /v1/api/procurement/leads-tracker/{leadId}/client-invoices
POST /v1/api/procurement/leads-tracker/{leadId}/client-invoices/{invoiceId}/approve
POST /v1/api/procurement/leads-tracker/{leadId}/client-invoices/{invoiceId}/mark-sent
```

### Workflow
```
DC Created → Auto-Draft Invoice → Approve → Mark Sent
```

---

## 📋 API Calls (Copy-Paste)

### 1. List Invoices
```javascript
const fetchInvoices = async (leadId) => {
  const res = await fetch(
    `/v1/api/procurement/leads-tracker/${leadId}/client-invoices`
  );
  return res.json();
};
```

### 2. Approve Invoice
```javascript
const approveInvoice = async (leadId, invoiceId) => {
  const res = await fetch(
    `/v1/api/procurement/leads-tracker/${leadId}/client-invoices/${invoiceId}/approve`,
    { method: 'POST' }
  );
  return res.json();
};
```

### 3. Mark as Sent
```javascript
const markSent = async (leadId, invoiceId) => {
  const res = await fetch(
    `/v1/api/procurement/leads-tracker/${leadId}/client-invoices/${invoiceId}/mark-sent`,
    { method: 'POST' }
  );
  return res.json();
};
```

---

## 📊 Response Structure

```javascript
{
  status: true,                        // Success flag
  statusCode: 200,                     // HTTP status
  message: 'Invoice approved...',      // Human-readable message
  data: {                              // The actual data
    id: 42,
    leadId: 5,
    approvalStatus: 'approved',        // 'draft' | 'approved' | 'sent'
    computedStatus: 'pending',         // 'paid' | 'overdue' | 'pending' | 'not_invoiced'
    amount: 125000.00,
    invoiceNumber: null,
    deliveryChallanId: 3,
    dcNumber: 'DC-2024-001',
    dueDate: null,
    createdAt: '2024-04-06T10:30:00Z',
    updatedAt: '2024-04-06T10:35:00Z'
    // ... more fields
  }
}
```

---

## ✅ Status Transitions

| From | To | Endpoint | Condition |
|------|----|---------| --------|
| draft | approved | POST /approve | approvalStatus === 'draft' |
| approved | sent | POST /mark-sent | approvalStatus === 'approved' |

---

## 🔴 Error Handling

```javascript
try {
  const result = await approveInvoice(leadId, invoiceId);
  if (!result.status) {
    // Error occurred
    console.error(result.message);
    // Examples:
    // "Cannot approve — current status is 'approved'"
    // "Invoice not found"
    // "Invalid invoiceId"
  } else {
    // Success
    updateInvoiceInUI(result.data);
  }
} catch (err) {
  console.error('Network error:', err.message);
}
```

---

## 🎨 UI States

```javascript
// Show approve button
{approvalStatus === 'draft' && <button onClick={approve}>Approve</button>}

// Show mark sent button
{approvalStatus === 'approved' && <button onClick={markSent}>Mark Sent</button>}

// Show status badge
<span className={`badge-${computedStatus}`}>
  {computedStatus}  // 'paid', 'overdue', 'pending', 'not_invoiced'
</span>
```

---

## 📐 Data Types

| Field | Type | Notes |
|-------|------|-------|
| leadId | number | Lead tracker ID |
| invoiceId | number | Invoice ID |
| approvalStatus | enum | 'draft' \| 'approved' \| 'sent' |
| computedStatus | enum | 'paid' \| 'overdue' \| 'pending' \| 'not_invoiced' |
| amount | decimal | Calculated: SUM(qty × rate) |
| dueDate | date | ISO 8601 format or null |
| dcNumber | string | Delivery challan number |

---

## 🔐 Permissions

```javascript
// List invoices (read-only)
auth('getProcurement')

// Approve and Mark Sent (write)
auth('manageProcurement')
```

---

## 💾 Auto-Draft Details

Auto-draft happens **when DC is created**:
- `amount` = SUM(qtyDispatched × rate) from all DC items
- `approvalStatus` = 'draft'
- `deliveryChallanId` = linked DC ID
- `clientPoId` = linked PO ID
- `invoiceNumber` = null (filled in later)

---

## 🧪 Quick Test Commands

### Test List
```bash
curl http://localhost:3000/v1/api/procurement/leads-tracker/5/client-invoices
```

### Test Approve
```bash
curl -X POST \
  http://localhost:3000/v1/api/procurement/leads-tracker/5/client-invoices/42/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{}'
```

### Test Mark Sent
```bash
curl -X POST \
  http://localhost:3000/v1/api/procurement/leads-tracker/5/client-invoices/42/mark-sent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{}'
```

---

## 🐛 Common Errors

```
400: "Cannot approve — current status is 'approved'"
  → Invoice not in draft state

400: "Cannot mark sent — current status is 'draft'"
  → Invoice not approved yet

404: "Invoice not found"
  → Invalid invoiceId or leadId

400: "Invalid invoiceId"
  → invoiceId is not a valid number
```

---

## 📝 Quick Implementation

```jsx
// Minimal component
export function InvoiceActions({ invoice, leadId, onUpdate }) {
  const handleApprove = async () => {
    const res = await fetch(
      `/v1/api/procurement/leads-tracker/${leadId}/client-invoices/${invoice.id}/approve`,
      { method: 'POST' }
    );
    const json = await res.json();
    if (json.status) onUpdate(json.data);
  };

  const handleMarkSent = async () => {
    const res = await fetch(
      `/v1/api/procurement/leads-tracker/${leadId}/client-invoices/${invoice.id}/mark-sent`,
      { method: 'POST' }
    );
    const json = await res.json();
    if (json.status) onUpdate(json.data);
  };

  return (
    <>
      {invoice.approvalStatus === 'draft' && (
        <button onClick={handleApprove}>Approve</button>
      )}
      {invoice.approvalStatus === 'approved' && (
        <button onClick={handleMarkSent}>Mark Sent</button>
      )}
    </>
  );
}
```

---

## 🎯 Checklist

- [ ] List invoices endpoint working
- [ ] Approve button shows for draft invoices
- [ ] Approve endpoint working
- [ ] Status updates to 'approved'
- [ ] Mark sent button shows for approved invoices
- [ ] Mark sent endpoint working
- [ ] Status updates to 'sent'
- [ ] Error messages display
- [ ] Loading states work
- [ ] Permissions checked
- [ ] Mobile responsive
- [ ] Tested on real data

---

**Full docs:** See `docs/PROCUREMENT_PHASE_2_UI_GUIDE.md`
