# Procurement Phase 2 — Testing Guide

## 🧪 Complete Testing Instructions

### Prerequisites
- Backend running on `http://localhost:3000`
- Valid JWT token for authentication
- A lead with ID (e.g., 5)
- At least one delivery challan created for that lead

---

## 1️⃣ Test: Auto-Draft Invoice on DC Creation

### Step A: Create a Delivery Challan

**Using Postman/Insomnia:**
```
POST http://localhost:3000/v1/api/procurement/leads-tracker/5/delivery-challans
```

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "clientPoId": 10,
  "dcNumber": "DC-TEST-2024-001",
  "dispatchDate": "2024-04-06",
  "proformaInvoiceNumber": "PO-FORM-001",
  "status": "draft",
  "items": [
    {
      "description": "Widget Type A",
      "qtyDispatched": 100,
      "rate": 500,
      "unit": "pcs"
    },
    {
      "description": "Widget Type B",
      "qtyDispatched": 50,
      "rate": 1000,
      "unit": "pcs"
    }
  ]
}
```

**Expected Amount:** (100 × 500) + (50 × 1000) = **100,000**

**Expected Response:**
```json
{
  "status": true,
  "statusCode": 201,
  "message": "Delivery challan created successfully",
  "data": {
    "id": 42,
    "dcNumber": "DC-TEST-2024-001",
    "amount": 100000,
    "status": "draft"
  }
}
```

### Step B: Verify Auto-Draft Invoice Was Created

**Using cURL:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/v1/api/procurement/leads-tracker/5/client-invoices
```

**Expected Response:**
```json
{
  "status": true,
  "statusCode": 200,
  "message": "Client invoices fetched successfully",
  "data": [
    {
      "id": 99,
      "leadId": 5,
      "deliveryChallanId": 42,
      "dcNumber": "DC-TEST-2024-001",
      "amount": 100000,
      "approvalStatus": "draft",
      "createdAt": "2024-04-06T10:30:00Z"
    }
  ]
}
```

**Verification Checklist:**
- ✅ Invoice ID created
- ✅ Amount = 100000 (sum of qty × rate)
- ✅ approvalStatus = 'draft'
- ✅ deliveryChallanId = 42 (the DC we created)
- ✅ createdAt timestamp is recent

---

## 2️⃣ Test: List Client Invoices

**Using cURL:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/v1/api/procurement/leads-tracker/5/client-invoices
```

**Using JavaScript/Fetch:**
```javascript
fetch('/v1/api/procurement/leads-tracker/5/client-invoices', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => console.log(data));
```

**Expected Fields in Response:**
```javascript
{
  id: 99,
  leadId: 5,
  clientPoId: 10,
  deliveryChallanId: 42,
  dcNumber: 'DC-TEST-2024-001',
  dcDispatchDate: '2024-04-06',
  challanStatus: 'draft',
  invoiceNumber: null,
  amount: 100000.00,
  invoiceDate: null,
  invoiceStatus: 'not_invoiced',
  approvalStatus: 'draft',
  dueDate: null,
  computedStatus: 'pending',       // AUTO-CALCULATED
  paymentDate: null,
  invoiceFileUrl: null,
  remarks: null,
  createdAt: '2024-04-06T10:30:00Z',
  updatedAt: '2024-04-06T10:30:00Z'
}
```

**Test Variations:**
1. Get all invoices for lead
2. Check computedStatus is correct
3. Verify DC details are populated
4. Check timestamps are recent

---

## 3️⃣ Test: Approve Invoice (Draft → Approved)

### Scenario: Invoice is in 'draft' status

**Using cURL:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:3000/v1/api/procurement/leads-tracker/5/client-invoices/99/approve \
  -d '{}'
```

**Using JavaScript:**
```javascript
async function approveInvoice(leadId, invoiceId, token) {
  const response = await fetch(
    `/v1/api/procurement/leads-tracker/${leadId}/client-invoices/${invoiceId}/approve`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.json();
}

// Usage
approveInvoice(5, 99, token).then(data => console.log(data));
```

**Expected Success Response (200 OK):**
```json
{
  "status": true,
  "statusCode": 200,
  "message": "Invoice approved successfully",
  "data": {
    "id": 99,
    "approvalStatus": "approved",
    "updatedAt": "2024-04-06T10:35:00Z"
  }
}
```

**Verification Checklist:**
- ✅ HTTP status = 200
- ✅ response.status = true
- ✅ approvalStatus changed to 'approved'
- ✅ updatedAt timestamp is newer than before
- ✅ All other fields remain unchanged

### Test: Error Case - Already Approved

**Call approve again on same invoice:**

**Expected Error Response (400 Bad Request):**
```json
{
  "status": false,
  "statusCode": 400,
  "message": "Cannot approve — current status is 'approved'",
  "data": null
}
```

**Verification Checklist:**
- ✅ HTTP status = 400
- ✅ response.status = false
- ✅ Error message explains what went wrong
- ✅ Invoice not modified

---

## 4️⃣ Test: Mark as Sent (Approved → Sent)

### Scenario: Invoice is in 'approved' status

**Using cURL:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:3000/v1/api/procurement/leads-tracker/5/client-invoices/99/mark-sent \
  -d '{}'
```

**Expected Success Response:**
```json
{
  "status": true,
  "statusCode": 200,
  "message": "Invoice marked as sent",
  "data": {
    "id": 99,
    "approvalStatus": "sent",
    "updatedAt": "2024-04-06T10:40:00Z"
  }
}
```

**Verification Checklist:**
- ✅ HTTP status = 200
- ✅ approvalStatus = 'sent'
- ✅ updatedAt timestamp updated
- ✅ Invoice details preserved

### Test: Error Case - Not Approved

**Call mark-sent on draft invoice:**

**Expected Error Response:**
```json
{
  "status": false,
  "statusCode": 400,
  "message": "Cannot mark sent — current status is 'draft'",
  "data": null
}
```

---

## 5️⃣ Test: Error Handling

### Test 5A: Invalid Lead ID

**Using cURL:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/v1/api/procurement/leads-tracker/99999/client-invoices
```

**Expected Response:**
```json
{
  "status": false,
  "statusCode": 404,
  "message": "Lead not found",
  "data": null
}
```

### Test 5B: Invalid Invoice ID

**Using cURL:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/v1/api/procurement/leads-tracker/5/client-invoices/99999/approve \
  -d '{}'
```

**Expected Response:**
```json
{
  "status": false,
  "statusCode": 404,
  "message": "Invoice not found",
  "data": null
}
```

### Test 5C: Invalid Invoice ID Format

**Using cURL:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/v1/api/procurement/leads-tracker/5/client-invoices/invalid/approve
```

**Expected Response:**
```json
{
  "status": false,
  "statusCode": 400,
  "message": "Invalid invoiceId",
  "data": null
}
```

---

## 6️⃣ Test: Computed Status Logic

### Setup: Create Invoices with Different Dates

**Invoice 1: No due date (not_invoiced)**
```json
{
  "invoiceStatus": "not_invoiced",
  "dueDate": null,
  "amount": 100000,
  "computedStatus": "not_invoiced"  // Expected
}
```

**Invoice 2: Due date in future (pending)**
```json
{
  "invoiceStatus": "not_invoiced",
  "dueDate": "2024-05-01",
  "amount": 100000,
  "computedStatus": "pending"  // Expected (today is 2024-04-06)
}
```

**Invoice 3: Due date in past, not paid (overdue)**
```json
{
  "invoiceStatus": "not_invoiced",
  "dueDate": "2024-03-01",
  "amount": 100000,
  "computedStatus": "overdue"  // Expected
}
```

**Invoice 4: Payment date filled (paid)**
```json
{
  "invoiceStatus": "paid",
  "dueDate": "2024-03-01",
  "paymentDate": "2024-03-25",
  "amount": 100000,
  "computedStatus": "paid"  // Expected
}
```

**Verification:**
```javascript
// Call list endpoint and verify each
fetch('/v1/api/procurement/leads-tracker/5/client-invoices')
  .then(res => res.json())
  .then(data => {
    data.data.forEach(inv => {
      console.assert(
        computeStatus(inv) === inv.computedStatus,
        `Status mismatch for invoice ${inv.id}`
      );
    });
  });

function computeStatus(inv) {
  if (inv.invoiceStatus === 'paid') return 'paid';
  if (inv.dueDate && new Date(inv.dueDate) < new Date()) return 'overdue';
  if (inv.amount) return 'pending';
  return 'not_invoiced';
}
```

---

## 7️⃣ Test: State Machine Validation

### Complete Workflow Test

```
✅ Create DC
  ↓
✅ Verify Auto-Draft Invoice Created
  ↓
✅ Call /approve endpoint
  ↓
✅ Verify Status Changed to 'approved'
  ↓
✅ Call /approve again → Expect Error 400
  ↓
✅ Call /mark-sent endpoint
  ↓
✅ Verify Status Changed to 'sent'
  ↓
✅ Try /mark-sent again → Expect Error 400
  ✅ TEST PASSED
```

**Test Script (JavaScript):**
```javascript
async function completeWorkflowTest() {
  const leadId = 5;
  const token = 'YOUR_TOKEN';
  
  try {
    // 1. List invoices
    const listRes = await fetch(
      `/v1/api/procurement/leads-tracker/${leadId}/client-invoices`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const listData = await listRes.json();
    console.assert(listData.status, 'List failed');
    
    // Get first draft invoice
    const invoice = listData.data.find(i => i.approvalStatus === 'draft');
    console.assert(invoice, 'No draft invoice found');
    
    // 2. Approve
    const approveRes = await fetch(
      `/v1/api/procurement/leads-tracker/${leadId}/client-invoices/${invoice.id}/approve`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    const approveData = await approveRes.json();
    console.assert(approveData.status, 'Approve failed');
    console.assert(approveData.data.approvalStatus === 'approved', 'Status not approved');
    
    // 3. Verify can't approve again
    const approveAgainRes = await fetch(
      `/v1/api/procurement/leads-tracker/${leadId}/client-invoices/${invoice.id}/approve`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    const approveAgainData = await approveAgainRes.json();
    console.assert(!approveAgainData.status, 'Should error on second approve');
    console.assert(approveAgainRes.status === 400, 'Should be 400');
    
    // 4. Mark sent
    const sentRes = await fetch(
      `/v1/api/procurement/leads-tracker/${leadId}/client-invoices/${invoice.id}/mark-sent`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    const sentData = await sentRes.json();
    console.assert(sentData.status, 'Mark sent failed');
    console.assert(sentData.data.approvalStatus === 'sent', 'Status not sent');
    
    console.log('✅ ALL TESTS PASSED');
  } catch (err) {
    console.error('❌ TEST FAILED:', err);
  }
}
```

---

## 🔐 Test: Authorization

### Test: Missing Authorization Header

**Using cURL:**
```bash
curl http://localhost:3000/v1/api/procurement/leads-tracker/5/client-invoices
```

**Expected Response (401 Unauthorized):**
```json
{
  "code": 401,
  "message": "Please authenticate"
}
```

### Test: Invalid Token

**Using cURL:**
```bash
curl -H "Authorization: Bearer INVALID_TOKEN" \
  http://localhost:3000/v1/api/procurement/leads-tracker/5/client-invoices
```

**Expected Response (401 Unauthorized):**
```json
{
  "code": 401,
  "message": "Please authenticate"
}
```

### Test: Insufficient Permissions (for write operations)

**Using cURL (as user without manageProcurement):**
```bash
curl -X POST \
  -H "Authorization: Bearer LIMITED_TOKEN" \
  http://localhost:3000/v1/api/procurement/leads-tracker/5/client-invoices/99/approve \
  -d '{}'
```

**Expected Response (403 Forbidden):**
```json
{
  "code": 403,
  "message": "Forbidden"
}
```

---

## 📊 Postman Collection

### Setup in Postman:

1. **Create Environment:**
   - Variable: `base_url` = `http://localhost:3000`
   - Variable: `token` = `YOUR_JWT_TOKEN`
   - Variable: `leadId` = `5`
   - Variable: `invoiceId` = `99`

2. **Request 1: List Invoices**
   ```
   GET {{base_url}}/v1/api/procurement/leads-tracker/{{leadId}}/client-invoices
   Header: Authorization: Bearer {{token}}
   ```

3. **Request 2: Approve**
   ```
   POST {{base_url}}/v1/api/procurement/leads-tracker/{{leadId}}/client-invoices/{{invoiceId}}/approve
   Header: Authorization: Bearer {{token}}
   Body: {}
   ```

4. **Request 3: Mark Sent**
   ```
   POST {{base_url}}/v1/api/procurement/leads-tracker/{{leadId}}/client-invoices/{{invoiceId}}/mark-sent
   Header: Authorization: Bearer {{token}}
   Body: {}
   ```

---

## ✅ Manual Testing Checklist

- [ ] Auto-draft creates invoice with correct amount
- [ ] List returns all invoices for lead
- [ ] List includes DC details (dcNumber, dcDispatchDate, challanStatus)
- [ ] List includes computed status (pending/overdue/paid/not_invoiced)
- [ ] Approve changes status to 'approved'
- [ ] Approve fails on non-draft invoices
- [ ] Mark sent changes status to 'sent'
- [ ] Mark sent fails on non-approved invoices
- [ ] Error messages are clear
- [ ] Timestamps update correctly
- [ ] Authorization works (with token)
- [ ] Authorization fails (without token)
- [ ] Permissions enforced (getProcurement for read, manageProcurement for write)
- [ ] Invalid IDs return 404
- [ ] Invalid formats return 400
- [ ] State machine logic enforced (can't skip steps)
- [ ] All response fields present
- [ ] Multiple invoices per lead supported
- [ ] Concurrent requests handled correctly

---

## 🐛 Debugging Tips

### Check Database State
```sql
SELECT id, lead_id, approval_status, amount, delivery_challan_id
FROM client_invoices
WHERE lead_id = 5
ORDER BY id DESC;
```

### Enable Logging
```javascript
// In your API route handler
console.log('Approving invoice:', invoiceId, 'for lead:', leadId);
console.log('Current approval_status:', currentStatus);
console.log('Attempting transition to:', 'approved');
```

### Test with Different Amounts
- Amount 0 → computedStatus should be 'not_invoiced'
- Amount > 0 with due date → computedStatus should be 'pending'
- Amount > 0 with past due date → computedStatus should be 'overdue'

---

**Done!** All tests should pass. Report any failures with:
- Endpoint called
- Request body
- Response received
- Expected response
