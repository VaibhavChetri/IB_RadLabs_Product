# Integration Checklist - Connect Backend to Frontend

## 📋 Overview
This is Phase 4 - connecting your working backend APIs to your built frontend pages. Complete **one module at a time**, test thoroughly, then move to the next.

**Total Modules**: 7  
**Approach**: One feature fully integrated and tested before moving to next

---

## ⚙️ Prerequisites

Before starting ANY module:

### Backend Checklist
- ✅ All 14 APIs built and tested in Postman
- ✅ All APIs return correct response format
- ✅ Database tables populated correctly
- ✅ Authentication working

### Frontend Checklist
- ✅ All pages accessible via menu
- ✅ All components display with mock data
- ✅ Buttons and interactions work (without API)
- ✅ No console errors

### Configuration
- ✅ API base URL configured in frontend (e.g., `https://api.yourdomain.com`)
- ✅ Auth token handling set up (headers, interceptors)
- ✅ Error handling utilities ready (toast, alerts, etc.)

---

## 🔧 API Service Setup

**Before Module 1**, create a centralized API service:

### File: `src/services/leadApi.js`

```javascript
import axios from 'axios';

const API_BASE = process.env.VUE_APP_API_URL || 'http://localhost:3000/v1/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token'); // Or however you store it
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Lead API methods
export const leadApi = {
  // Reveal APIs (single reveal uses existing Lusha endpoint with camelCase)
  revealContact(contactId, revealType) {
    return apiClient.post('/lusha/reveal', { contactId, revealType });
  },

  // Bulk reveal uses the leads endpoint with snake_case
  bulkReveal(contactIds, revealType) {
    return apiClient.post('/leads/reveal/bulk', { contact_ids: contactIds, reveal_type: revealType });
  },
  
  // Tracking APIs
  canTrack(contactId) {
    return apiClient.get(`/leads/can-track/${contactId}`);
  },
  
  startTracking(contactId, assignTo = null) {
    return apiClient.post('/leads/start-tracking', { contact_id: contactId, assign_to: assignTo });
  },
  
  bulkStartTracking(contactIds, assignTo = null) {
    return apiClient.post('/leads/start-tracking/bulk', { contact_ids: contactIds, assign_to: assignTo });
  },
  
  stopTracking(contactId, reason = null) {
    return apiClient.post('/leads/stop-tracking', { contact_id: contactId, reason });
  },
  
  // Outreach APIs
  getStatuses(activeOnly = true) {
    return apiClient.get('/leads/statuses', { params: { active_only: activeOnly } });
  },
  
  logOutreach(data) {
    return apiClient.post('/leads/log-outreach', data);
  },
  
  updateOutreach(outreachId, data) {
    return apiClient.put(`/leads/outreach/${outreachId}`, data);
  },
  
  // Callback APIs
  getTodaysCallbacks(userId = null, includeOverdue = true) {
    return apiClient.get('/leads/callbacks/today', { 
      params: { user_id: userId, include_overdue: includeOverdue } 
    });
  },
  
  completeCallback(outreachId, notes = null) {
    return apiClient.post(`/leads/callbacks/${outreachId}/complete`, { notes });
  },
  
  // List/Filter APIs
  getTrackingList(filters = {}, page = 1, perPage = 25) {
    return apiClient.get('/leads/tracking', { 
      params: { ...filters, page, per_page: perPage } 
    });
  },
  
  getContactTimeline(contactId) {
    return apiClient.get(`/leads/${contactId}/timeline`);
  },
  
  // Reports API
  getReports(filters = {}) {
    return apiClient.get('/leads/reports', { params: filters });
  }
};

export default leadApi;
```

✅ **Checkpoint**: API service file created

---

## 📑 API Endpoints Reference

| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| 1 | POST | `/v1/api/lusha/reveal` | Reveal single contact (existing Lusha endpoint) |
| 2 | POST | `/v1/api/leads/reveal/bulk` | Bulk reveal contacts |
| 3 | GET | `/v1/api/leads/can-track/:contact_id` | Check if contact can be tracked |
| 4 | POST | `/v1/api/leads/start-tracking` | Start tracking a contact |
| 5 | POST | `/v1/api/leads/start-tracking/bulk` | Bulk start tracking |
| 6 | POST | `/v1/api/leads/stop-tracking` | Stop tracking a contact |
| 7 | GET | `/v1/api/leads/statuses` | Get outreach statuses |
| 8 | POST | `/v1/api/leads/log-outreach` | Log an outreach attempt |
| 9 | PUT | `/v1/api/leads/outreach/:id` | Update an outreach entry |
| 10 | GET | `/v1/api/leads/callbacks/today` | Get today's callbacks |
| 11 | POST | `/v1/api/leads/callbacks/:id/complete` | Mark callback complete |
| 12 | GET | `/v1/api/leads/tracking` | Get tracking list (paginated) |
| 13 | GET | `/v1/api/leads/:contact_id/timeline` | Get contact timeline |
| 14 | GET | `/v1/api/leads/reports` | Get reports data |

> **Note**: All endpoints require `Authorization: Bearer <token>` header.

> **Important**: Single reveal (endpoint #1) uses **camelCase** payload (`contactId`, `revealType`) because it's the existing Lusha API. All other leads endpoints use **snake_case** (`contact_id`, `reveal_type`).

---

## 📋 API Payload Formats

### 1. Single Reveal (existing Lusha endpoint)
```
POST /v1/api/lusha/reveal
```
**Request Body** (camelCase):
```json
{
  "contactId": "lusha_contact_id_here",
  "revealType": "email"
}
```
> `revealType` options: `"email"`, `"phone"`, or `"both"`

**Response**:
```json
{
  "status": "Success",
  "status_code": 200,
  "data": {
    "contact_id": "...",
    "email": "revealed@email.com",
    "phone": "+1234567890",
    "already_revealed": false
  }
}
```

### 2. Bulk Reveal
```
POST /v1/api/leads/reveal/bulk
```
**Request Body** (snake_case):
```json
{
  "contact_ids": ["id1", "id2", "id3"],
  "reveal_type": "email"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "total_requested": 3,
    "total_revealed": 2,
    "total_failed": 1,
    "results": [
      { "contact_id": "id1", "success": true, "email": "a@b.com" },
      { "contact_id": "id2", "success": true, "email": "c@d.com" },
      { "contact_id": "id3", "success": false, "error": "No email found" }
    ]
  }
}
```

### 3. Can Track
```
GET /v1/api/leads/can-track/:contact_id
```
**Response**:
```json
{
  "success": true,
  "can_track": true,
  "reason": null
}
```

### 4. Start Tracking
```
POST /v1/api/leads/start-tracking
```
**Request Body**:
```json
{
  "contact_id": "lusha_contact_id",
  "assign_to": 5
}
```
> `assign_to` is optional (user ID to assign the lead to)

**Response**:
```json
{
  "success": true,
  "message": "Contact is now being tracked",
  "data": {
    "contact_id": "...",
    "tracking_started_at": "2026-01-25T10:00:00Z",
    "summary_id": 42
  }
}
```

### 5. Bulk Start Tracking
```
POST /v1/api/leads/start-tracking/bulk
```
**Request Body**:
```json
{
  "contact_ids": ["id1", "id2", "id3"],
  "assign_to": 5
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "total_requested": 3,
    "total_tracked": 2,
    "total_failed": 1,
    "results": [
      { "contact_id": "id1", "success": true },
      { "contact_id": "id2", "success": true },
      { "contact_id": "id3", "success": false, "error": "Already tracking" }
    ]
  }
}
```

### 6. Stop Tracking
```
POST /v1/api/leads/stop-tracking
```
**Request Body**:
```json
{
  "contact_id": "lusha_contact_id"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Tracking stopped"
}
```

### 7. Get Statuses
```
GET /v1/api/leads/statuses?active_only=true
```
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "status_name": "New Lead",
      "status_category": "new",
      "color_code": "#3B82F6",
      "requires_callback": 0,
      "sort_order": 1,
      "is_active": 1
    }
  ]
}
```

### 8. Log Outreach
```
POST /v1/api/leads/log-outreach
```
**Request Body**:
```json
{
  "contact_id": "lusha_contact_id",
  "outreach_type": "phone",
  "status_id": 5,
  "notes": "Left voicemail, will call back tomorrow",
  "callback_scheduled_at": "2026-01-26 14:00:00"
}
```
> `outreach_type` options: `"email"`, `"phone"`, `"linkedin"`, `"meeting"`, `"other"`
> `callback_scheduled_at` is optional (required only if the selected status has `requires_callback = 1`)

**Response**:
```json
{
  "success": true,
  "message": "Outreach logged successfully",
  "data": {
    "outreach_id": 123,
    "contact_id": "...",
    "status_name": "Call Later",
    "callback_scheduled_at": "2026-01-26 14:00:00"
  }
}
```

### 9. Update Outreach
```
PUT /v1/api/leads/outreach/:id
```
**Request Body** (all fields optional):
```json
{
  "notes": "Updated notes",
  "status_id": 6,
  "callback_scheduled_at": "2026-01-27 10:00:00"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Outreach updated"
}
```

### 10. Get Today's Callbacks
```
GET /v1/api/leads/callbacks/today?user_id=5&include_overdue=true
```
> `user_id` (optional): Filter by assigned user
> `include_overdue` (optional, default: true): Include past-due callbacks

**Response**:
```json
{
  "success": true,
  "data": {
    "today_count": 3,
    "overdue_count": 1,
    "callbacks": [
      {
        "outreach_id": 123,
        "contact_id": "...",
        "full_name": "John Doe",
        "company_name": "Acme Inc",
        "email": "john@acme.com",
        "phone": "+1234567890",
        "callback_scheduled_at": "2026-01-25 14:00:00",
        "notes": "Follow up on proposal",
        "outreach_type": "phone",
        "is_overdue": false
      }
    ]
  }
}
```

### 11. Complete Callback
```
POST /v1/api/leads/callbacks/:id/complete
```
**Request Body**:
```json
{
  "notes": "Completed the callback"
}
```
> `notes` is optional

**Response**:
```json
{
  "success": true,
  "message": "Callback completed"
}
```

### 12. Get Tracking List
```
GET /v1/api/leads/tracking?page=1&per_page=25&assigned_to=5&status_id=3&status_category=active&has_callback=true&search=john
```
> Query params: `page`, `per_page`, `assigned_to`, `status_id`, `status_category`, `has_callback`, `search`

**Response**:
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "contact_id": "...",
        "full_name": "John Doe",
        "company_name": "Acme Inc",
        "email": "john@acme.com",
        "phone": "+1234567890",
        "current_status": "Call Later",
        "status_color": "#F59E0B",
        "last_outreach_date": "2026-01-24",
        "total_outreach_count": 5,
        "next_callback_at": "2026-01-25 14:00:00",
        "assigned_to_name": "Sales Rep",
        "tracking_started_at": "2026-01-20 09:00:00"
      }
    ],
    "current_page": 1,
    "per_page": 25,
    "total": 150,
    "total_pages": 6
  }
}
```

### 13. Contact Timeline
```
GET /v1/api/leads/:contact_id/timeline
```
**Response**:
```json
{
  "success": true,
  "data": {
    "contact": {
      "contact_id": "...",
      "full_name": "John Doe",
      "company_name": "Acme Inc",
      "email": "john@acme.com",
      "phone": "+1234567890"
    },
    "summary": {
      "total_outreach_count": 5,
      "email_count": 2,
      "phone_count": 3,
      "last_outreach_date": "2026-01-24",
      "current_status": "Interested",
      "next_callback_at": null
    },
    "timeline": [
      {
        "id": 123,
        "outreach_type": "phone",
        "status_name": "Interested",
        "status_color": "#10B981",
        "notes": "Very interested in the product",
        "callback_scheduled_at": null,
        "callback_completed": 0,
        "created_by_name": "Sales Rep",
        "created_at": "2026-01-24 15:30:00"
      }
    ]
  }
}
```

### 14. Reports
```
GET /v1/api/leads/reports?user_id=5&date_from=2026-01-01&date_to=2026-01-31
```
> Query params: `user_id`, `date_from` (YYYY-MM-DD), `date_to` (YYYY-MM-DD)

**Response**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_tracking": 150,
      "total_outreach": 450,
      "pending_callbacks": 12,
      "completed_callbacks": 38
    },
    "status_distribution": [
      { "status_name": "New Lead", "status_color": "#3B82F6", "count": 30 },
      { "status_name": "Interested", "status_color": "#10B981", "count": 45 }
    ],
    "outreach_by_type": {
      "email": 120,
      "phone": 200,
      "linkedin": 50,
      "meeting": 30,
      "other": 10
    },
    "user_performance": [
      {
        "user_id": 5,
        "user_name": "Sales Rep",
        "total_outreach": 100,
        "leads_assigned": 30,
        "callbacks_completed": 15
      }
    ],
    "callback_metrics": {
      "total_scheduled": 50,
      "completed_on_time": 38,
      "overdue": 5,
      "completion_rate": 76
    }
  }
}
```

---

# MODULE 1: Contact Reveal & Selection

**Goal**: Enable revealing emails/phones (single and bulk) from search results

**Estimated Time**: 2-3 hours

---

## Step 1.1: Update SearchResults Component

**File**: `src/components/Lusha/SearchResults.vue`

### Import API Service
```javascript
import { leadApi } from '@/services/leadApi';
```

### Update Methods

**Replace mock `handleRevealSingle` with**:
```javascript
async handleRevealSingle(contactId, type) {
  try {
    // Show loading state
    this.revealingContacts[contactId] = true;
    
    // Call API
    const response = await leadApi.revealContact(contactId, type);
    
    // Update contact in list
    const contact = this.contacts.find(c => c.contact_id === contactId);
    if (type === 'email' || type === 'both') {
      contact.email = response.data.data.email;
    }
    if (type === 'phone' || type === 'both') {
      contact.phone = response.data.data.phone;
    }
    
    // Show success message
    this.$toast.success(`${type} revealed successfully!`);
    
  } catch (error) {
    console.error('Reveal error:', error);
    this.$toast.error(error.response?.data?.message || `Failed to reveal ${type}`);
  } finally {
    this.revealingContacts[contactId] = false;
  }
}
```

**Replace mock `handleBulkReveal` with**:
```javascript
async handleBulkReveal(type) {
  const count = this.selectedContacts.length;
  
  if (!confirm(`Reveal ${type} for ${count} contact(s)? This will use ${count} credits.`)) {
    return;
  }
  
  try {
    // Show loading
    this.bulkRevealing = true;
    
    // Call API
    const response = await leadApi.bulkReveal(this.selectedContacts, type);
    
    // Update contacts in list
    response.data.data.results.forEach(result => {
      if (result.success) {
        const contact = this.contacts.find(c => c.contact_id === result.contact_id);
        if (contact) {
          if (type === 'email' || type === 'both') {
            contact.email = result.email;
          }
          if (type === 'phone' || type === 'both') {
            contact.phone = result.phone;
          }
        }
      }
    });
    
    // Show results
    const { total_revealed, total_failed } = response.data.data;
    this.$toast.success(`${total_revealed} ${type}(s) revealed successfully!`);
    
    if (total_failed > 0) {
      this.$toast.warning(`${total_failed} failed to reveal`);
    }
    
    // Clear selection
    this.clearSelection();
    
  } catch (error) {
    console.error('Bulk reveal error:', error);
    this.$toast.error('Bulk reveal failed');
  } finally {
    this.bulkRevealing = false;
  }
}
```

### Add Loading States to Data
```javascript
data() {
  return {
    selectedContacts: [],
    revealingContacts: {},  // { contactId: true/false }
    bulkRevealing: false
  }
}
```

### Update Template for Loading States
```html
<!-- Single reveal button -->
<button 
  @click="revealSingle(contact.contact_id, 'email')"
  :disabled="revealingContacts[contact.contact_id]"
  class="btn-reveal"
>
  <span v-if="revealingContacts[contact.contact_id]">Revealing...</span>
  <span v-else>Reveal Email (1 credit)</span>
</button>

<!-- Bulk reveal button -->
<button 
  @click="bulkReveal('email')" 
  :disabled="bulkRevealing"
  class="btn-primary"
>
  <span v-if="bulkRevealing">Revealing...</span>
  <span v-else>Reveal Emails ({{ selectedContacts.length }} credits)</span>
</button>
```

---

## Step 1.2: Test Module 1

### Test Cases
- [ ] Select single contact, click "Reveal Email"
  - **Expected**: Email appears in table, success toast shown
  
- [ ] Select 3 contacts, click "Reveal Emails"
  - **Expected**: Confirmation dialog, all 3 emails revealed, success message
  
- [ ] Try to reveal already revealed email
  - **Expected**: API returns already_revealed: true, no credits charged
  
- [ ] Test with invalid contact ID
  - **Expected**: Error toast shown, no crash
  
- [ ] Check database
  - **Expected**: `lusha_reveal_log` has new entries, `lusha_contacts` updated

### Verification Queries
```sql
-- Check reveal logs
SELECT * FROM lusha_reveal_log ORDER BY created_at DESC LIMIT 5;

-- Check updated contacts
SELECT contact_id, full_name, email, phone, email_revealed_at 
FROM lusha_contacts 
WHERE email IS NOT NULL 
ORDER BY email_revealed_at DESC LIMIT 5;
```

✅ **Checkpoint**: Reveal functionality working

---

# MODULE 2: Start Tracking

**Goal**: Enable "Track Lead" button to start tracking contacts

**Estimated Time**: 2-3 hours

---

## Step 2.1: Update SearchResults Component

### Add Method for Single Track
```javascript
async handleStartTracking(contactId) {
  try {
    // Check if can track first
    const canTrackResponse = await leadApi.canTrack(contactId);
    
    if (!canTrackResponse.data.can_track) {
      this.$toast.warning(canTrackResponse.data.reason);
      return;
    }
    
    // Start tracking
    this.trackingContacts[contactId] = true;
    
    const response = await leadApi.startTracking(contactId);
    
    // Update contact in list
    const contact = this.contacts.find(c => c.contact_id === contactId);
    contact.is_tracking = true;
    
    this.$toast.success('Contact is now being tracked!');
    
  } catch (error) {
    console.error('Track error:', error);
    this.$toast.error(error.response?.data?.message || 'Failed to start tracking');
  } finally {
    this.trackingContacts[contactId] = false;
  }
}
```

### Add Method for Bulk Track
```javascript
async handleBulkStartTracking() {
  // Filter to only trackable contacts
  const trackableContacts = this.selectedContacts.filter(contactId => {
    const contact = this.contacts.find(c => c.contact_id === contactId);
    return this.canTrack(contact);
  });
  
  if (trackableContacts.length === 0) {
    this.$toast.warning('No contacts can be tracked. Please reveal contact info first.');
    return;
  }
  
  if (!confirm(`Start tracking ${trackableContacts.length} contact(s)?`)) {
    return;
  }
  
  try {
    this.bulkTracking = true;
    
    const response = await leadApi.bulkStartTracking(trackableContacts);
    
    // Update contacts
    response.data.data.results.forEach(result => {
      if (result.success) {
        const contact = this.contacts.find(c => c.contact_id === result.contact_id);
        if (contact) {
          contact.is_tracking = true;
        }
      }
    });
    
    const { total_tracked, total_failed } = response.data.data;
    this.$toast.success(`${total_tracked} contact(s) now being tracked!`);
    
    if (total_failed > 0) {
      this.$toast.warning(`${total_failed} could not be tracked`);
    }
    
    this.clearSelection();
    
  } catch (error) {
    console.error('Bulk tracking error:', error);
    this.$toast.error('Bulk tracking failed');
  } finally {
    this.bulkTracking = false;
  }
}
```

### Add Helper Method
```javascript
canTrack(contact) {
  return (contact.email || contact.phone) && !contact.is_tracking;
}
```

### Update Template
```html
<button 
  v-if="!contact.is_tracking"
  @click="handleStartTracking(contact.contact_id)"
  :disabled="!canTrack(contact) || trackingContacts[contact.contact_id]"
  class="btn-track"
>
  <span v-if="trackingContacts[contact.contact_id]">Tracking...</span>
  <span v-else>Track Lead</span>
</button>

<span v-else class="badge-tracking">
  ✓ Tracking
</span>
```

---

## Step 2.2: Test Module 2

### Test Cases
- [ ] Click "Track Lead" on contact with email
  - **Expected**: Button changes to "Tracking" badge, success toast
  
- [ ] Click "Track Lead" on contact without email/phone
  - **Expected**: Button disabled, tooltip shows why
  
- [ ] Select 5 contacts (3 with email, 2 without), bulk track
  - **Expected**: Only 3 tracked, warning about 2 failed
  
- [ ] Try to track already tracking contact
  - **Expected**: Shows "Tracking" badge, button not clickable

### Verification Queries
```sql
-- Check tracking started
SELECT contact_id, full_name, is_tracking, tracking_started_at, tracking_started_by
FROM lusha_contacts 
WHERE is_tracking = 1 
ORDER BY tracking_started_at DESC;

-- Check summary created
SELECT * FROM lead_tracking_summary ORDER BY created_at DESC LIMIT 5;
```

✅ **Checkpoint**: Tracking functionality working

---

# MODULE 3: Log Outreach

**Goal**: Enable logging outreach attempts with status updates

**Estimated Time**: 3-4 hours

---

## Step 3.1: Load Statuses on Mount

**File**: `src/components/Leads/OutreachLogModal.vue`

### Add Created Hook
```javascript
async created() {
  await this.loadStatuses();
}

async loadStatuses() {
  try {
    const response = await leadApi.getStatuses();
    this.statuses = response.data.data;
  } catch (error) {
    console.error('Load statuses error:', error);
    this.$toast.error('Failed to load status options');
  }
}
```

---

## Step 3.2: Connect Submit Handler

### Update Submit Method
```javascript
async submit() {
  // Validate callback requirement
  if (this.selectedStatus?.requires_callback && !this.form.callback_scheduled_at) {
    this.$toast.error('Callback date/time required for this status');
    return;
  }
  
  try {
    this.submitting = true;
    
    const payload = {
      contact_id: this.contactId,
      outreach_type: this.form.outreach_type,
      status_id: this.form.status_id,
      notes: this.form.notes,
      callback_scheduled_at: this.form.callback_scheduled_at
    };
    
    const response = await leadApi.logOutreach(payload);
    
    this.$toast.success('Outreach logged successfully!');
    
    // Emit success event
    this.$emit('success', response.data.data);
    
    // Close modal
    this.$emit('close');
    
    // Reset form
    this.resetForm();
    
  } catch (error) {
    console.error('Log outreach error:', error);
    this.$toast.error(error.response?.data?.message || 'Failed to log outreach');
  } finally {
    this.submitting = false;
  }
}

resetForm() {
  this.form = {
    outreach_type: 'phone',
    status_id: null,
    notes: '',
    callback_scheduled_at: null
  };
}
```

---

## Step 3.3: Update Parent Components

**File**: `src/pages/Leads/TrackingList.vue`

### Add Modal State
```javascript
data() {
  return {
    // ... existing data
    outreachModalVisible: false,
    selectedContactForOutreach: null
  }
}
```

### Add Methods
```javascript
openOutreachModal(contact) {
  this.selectedContactForOutreach = contact;
  this.outreachModalVisible = true;
}

closeOutreachModal() {
  this.outreachModalVisible = false;
  this.selectedContactForOutreach = null;
}

async handleOutreachLogged(data) {
  // Refresh the tracking list
  await this.loadTrackingList();
  this.$toast.success('Lead updated successfully');
}
```

### Add to Template
```html
<OutreachLogModal
  :visible="outreachModalVisible"
  :contact-id="selectedContactForOutreach?.contact_id"
  :contact-name="selectedContactForOutreach?.full_name"
  @close="closeOutreachModal"
  @success="handleOutreachLogged"
/>
```

---

## Step 3.4: Test Module 3

### Test Cases
- [ ] Click "Log Outreach" button
  - **Expected**: Modal opens with empty form
  
- [ ] Fill form, select "Email", select "Email Sent - No Response"
  - **Expected**: Callback field hidden (not required)
  
- [ ] Submit form
  - **Expected**: Success toast, modal closes, list refreshes
  
- [ ] Select "Call Later" status without callback date
  - **Expected**: Validation error, form doesn't submit
  
- [ ] Log outreach with callback
  - **Expected**: Callback appears in summary table

### Verification Queries
```sql
-- Check outreach logged
SELECT * FROM lead_outreach_log ORDER BY created_at DESC LIMIT 5;

-- Check summary updated
SELECT 
  contact_id, 
  last_outreach_date, 
  current_status_id, 
  total_outreach_count,
  email_count, 
  phone_count,
  next_callback_at
FROM lead_tracking_summary 
ORDER BY updated_at DESC LIMIT 5;
```

✅ **Checkpoint**: Outreach logging working

---

# MODULE 4: Callback System

**Goal**: Display today's callbacks and mark as complete

**Estimated Time**: 2 hours

---

## Step 4.1: Load Callbacks

**File**: `src/pages/Leads/CallbacksList.vue`

### Add Created Hook
```javascript
async created() {
  await this.loadCallbacks();
}

async loadCallbacks() {
  try {
    this.loading = true;
    
    const response = await leadApi.getTodaysCallbacks();
    
    this.callbacks = response.data.data.callbacks;
    this.stats.today_count = response.data.data.today_count;
    this.stats.overdue_count = response.data.data.overdue_count;
    
  } catch (error) {
    console.error('Load callbacks error:', error);
    this.$toast.error('Failed to load callbacks');
  } finally {
    this.loading = false;
  }
}
```

---

## Step 4.2: Complete Callback

### Add Method
```javascript
async handleCompleteCallback(outreachId) {
  if (!confirm('Mark this callback as completed?')) {
    return;
  }
  
  try {
    await leadApi.completeCallback(outreachId);
    
    this.$toast.success('Callback marked as completed');
    
    // Remove from list
    this.callbacks = this.callbacks.filter(c => c.outreach_id !== outreachId);
    this.stats.today_count--;
    
  } catch (error) {
    console.error('Complete callback error:', error);
    this.$toast.error('Failed to complete callback');
  }
}
```

---

## Step 4.3: Test Module 4

### Test Cases
- [ ] Open Callbacks page
  - **Expected**: Shows list of today's callbacks + overdue
  
- [ ] Callbacks grouped (overdue first, then today)
  - **Expected**: Overdue highlighted in red
  
- [ ] Click phone number
  - **Expected**: Opens phone dialer (tel: link)
  
- [ ] Click "Mark Done"
  - **Expected**: Confirmation, callback removed from list, count updated

### Verification Queries
```sql
-- Check completed callbacks
SELECT * FROM lead_outreach_log 
WHERE callback_completed = 1 
ORDER BY updated_at DESC LIMIT 5;

-- Check summary cleared
SELECT contact_id, next_callback_at 
FROM lead_tracking_summary 
WHERE next_callback_at IS NULL;
```

✅ **Checkpoint**: Callback system working

---

# MODULE 5: Tracking List with Filters

**Goal**: Display paginated list of tracked leads with filtering

**Estimated Time**: 2-3 hours

---

## Step 5.1: Load Tracking List

**File**: `src/pages/Leads/TrackingList.vue`

### Add Created Hook
```javascript
async created() {
  await this.loadTrackingList();
}

async loadTrackingList() {
  try {
    this.loading = true;
    
    const response = await leadApi.getTrackingList(
      this.filters,
      this.pagination.current_page,
      this.pagination.per_page
    );
    
    this.leads = response.data.data.contacts;
    this.pagination = {
      current_page: response.data.data.current_page,
      per_page: response.data.data.per_page,
      total: response.data.data.total,
      total_pages: response.data.data.total_pages
    };
    
  } catch (error) {
    console.error('Load tracking list error:', error);
    this.$toast.error('Failed to load leads');
  } finally {
    this.loading = false;
  }
}
```

---

## Step 5.2: Connect Filters

### Add Method
```javascript
async applyFilters(filters) {
  this.filters = filters;
  this.pagination.current_page = 1; // Reset to page 1
  await this.loadTrackingList();
}

async clearFilters() {
  this.filters = {
    assigned_to: null,
    status_id: null,
    has_callback: false,
    search: ''
  };
  await this.loadTrackingList();
}
```

### Listen to Filter Events
```html
<TrackingFilters
  @filter-changed="applyFilters"
  @clear="clearFilters"
/>
```

---

## Step 5.3: Connect Pagination

### Add Method
```javascript
async changePage(page) {
  this.pagination.current_page = page;
  await this.loadTrackingList();
}
```

---

## Step 5.4: Test Module 5

### Test Cases
- [ ] Open Tracking List page
  - **Expected**: Shows paginated list of tracked leads
  
- [ ] Filter by status
  - **Expected**: List updates, only matching leads shown
  
- [ ] Search for contact name
  - **Expected**: List filters by search term
  
- [ ] Change page
  - **Expected**: Next page of results loads
  
- [ ] Clear filters
  - **Expected**: Shows all leads again

✅ **Checkpoint**: Tracking list working

---

# MODULE 6: Contact Timeline

**Goal**: View complete outreach history for a contact

**Estimated Time**: 1-2 hours

---

## Step 6.1: Load Timeline

**File**: `src/components/Leads/ContactTimelineModal.vue`

### Add Watch for Visibility
```javascript
watch: {
  visible(newVal) {
    if (newVal && this.contactId) {
      this.loadTimeline();
    }
  }
}

async loadTimeline() {
  try {
    this.loading = true;
    
    const response = await leadApi.getContactTimeline(this.contactId);
    
    this.contact = response.data.data.contact;
    this.summary = response.data.data.summary;
    this.timeline = response.data.data.timeline;
    
  } catch (error) {
    console.error('Load timeline error:', error);
    this.$toast.error('Failed to load timeline');
  } finally {
    this.loading = false;
  }
}
```

---

## Step 6.2: Connect to Parent

**File**: `src/pages/Leads/TrackingList.vue`

### Add Modal State
```javascript
data() {
  return {
    // ... existing
    timelineModalVisible: false,
    selectedContactForTimeline: null
  }
}
```

### Add Methods
```javascript
openTimelineModal(contact) {
  this.selectedContactForTimeline = contact;
  this.timelineModalVisible = true;
}

closeTimelineModal() {
  this.timelineModalVisible = false;
  this.selectedContactForTimeline = null;
}
```

### Add to Template
```html
<button @click="openTimelineModal(lead)">View Timeline</button>

<ContactTimelineModal
  :visible="timelineModalVisible"
  :contact-id="selectedContactForTimeline?.contact_id"
  @close="closeTimelineModal"
/>
```

---

## Step 6.3: Test Module 6

### Test Cases
- [ ] Click "View" button on a lead
  - **Expected**: Timeline modal opens
  
- [ ] Timeline shows all outreach entries
  - **Expected**: Newest first, with colors, notes, dates
  
- [ ] Contact info displayed at top
  - **Expected**: Name, company, email, phone shown
  
- [ ] Close modal
  - **Expected**: Modal closes, no errors

✅ **Checkpoint**: Timeline working

---

# MODULE 7: Reports Dashboard

**Goal**: Display analytics and performance metrics

**Estimated Time**: 3-4 hours

---

## Step 7.1: Load Reports Data

**File**: `src/pages/Leads/ReportsDashboard.vue`

### Add Created Hook
```javascript
async created() {
  await this.loadReports();
}

async loadReports() {
  try {
    this.loading = true;
    
    const filters = {
      user_id: this.selectedUserId,
      date_from: this.dateFrom,
      date_to: this.dateTo
    };
    
    const response = await leadApi.getReports(filters);
    
    this.summary = response.data.data.summary;
    this.status_distribution = response.data.data.status_distribution;
    this.outreach_by_type = response.data.data.outreach_by_type;
    this.user_performance = response.data.data.user_performance;
    this.callback_metrics = response.data.data.callback_metrics;
    
    // Render charts after data loaded
    this.$nextTick(() => {
      this.renderCharts();
    });
    
  } catch (error) {
    console.error('Load reports error:', error);
    this.$toast.error('Failed to load reports');
  } finally {
    this.loading = false;
  }
}
```

---

## Step 7.2: Render Charts

### Add Method
```javascript
renderCharts() {
  this.renderStatusDistributionChart();
  this.renderOutreachTypeChart();
}

renderStatusDistributionChart() {
  const ctx = this.$refs.statusChart.getContext('2d');
  
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: this.status_distribution.map(s => s.status_name),
      datasets: [{
        data: this.status_distribution.map(s => s.count),
        backgroundColor: this.status_distribution.map(s => s.status_color)
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

renderOutreachTypeChart() {
  const ctx = this.$refs.outreachChart.getContext('2d');
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Email', 'Phone', 'Both', 'Meeting'],
      datasets: [{
        label: 'Outreach Attempts',
        data: [
          this.outreach_by_type.email,
          this.outreach_by_type.phone,
          this.outreach_by_type.both,
          this.outreach_by_type.meeting
        ],
        backgroundColor: '#3B82F6'
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}
```

---

## Step 7.3: Test Module 7

### Test Cases
- [ ] Open Reports page
  - **Expected**: All metrics displayed
  
- [ ] Summary cards show correct numbers
  - **Expected**: Total tracked, active, outreach count
  
- [ ] Status distribution chart renders
  - **Expected**: Donut chart with correct colors
  
- [ ] Outreach type chart renders
  - **Expected**: Bar chart with counts
  
- [ ] User performance table displays
  - **Expected**: Shows all users with stats
  
- [ ] Filter by date range
  - **Expected**: Reports update

✅ **Checkpoint**: Reports working

---

# FINAL INTEGRATION TESTING

Once all 7 modules complete, test the complete workflow:

## End-to-End Test Scenario

1. **Search Lusha**
   - Search for contacts
   - Select 3 contacts
   - Bulk reveal emails ✓
   - Bulk start tracking ✓

2. **My Leads Page**
   - View tracked leads ✓
   - Filter by status ✓
   - Click "Log Outreach" on one lead ✓
   - Select "Call Later", set callback for tomorrow ✓

3. **Today's Callbacks**
   - See scheduled callback ✓
   - Mark as done ✓

4. **Timeline**
   - View contact timeline ✓
   - See all logged outreach ✓

5. **Reports**
   - View dashboard ✓
   - See updated metrics ✓
   - Charts display data ✓

---

# DEPLOYMENT CHECKLIST

Before deploying to production:

### Backend
- [ ] All API endpoints tested
- [ ] Error handling in place
- [ ] Rate limiting configured
- [ ] Database indexes verified
- [ ] Backup strategy in place
- [ ] Logging configured
- [ ] Environment variables set

### Frontend
- [ ] All console.logs removed
- [ ] API base URL points to production
- [ ] Error messages user-friendly
- [ ] Loading states on all buttons
- [ ] Responsive design tested
- [ ] Build optimized (minified)
- [ ] Environment variables set

### Database
- [ ] Migrations run on production
- [ ] Seed data added
- [ ] Foreign keys verified
- [ ] Indexes created
- [ ] Backup taken before migration

---

# TROUBLESHOOTING

## Common Issues

### API calls fail with 401
- **Cause**: Auth token not being sent
- **Fix**: Check interceptor setup in API service

### CORS errors
- **Cause**: Backend not allowing frontend origin
- **Fix**: Update CORS configuration in backend

### Data not updating in UI
- **Cause**: Not refreshing list after mutation
- **Fix**: Call load method after create/update/delete

### Charts not rendering
- **Cause**: Chart.js not loaded or data format wrong
- **Fix**: Verify Chart.js import, check data structure

### Filters not working
- **Cause**: Query parameters not matching backend expectations
- **Fix**: Use snake_case params: `assigned_to`, `status_id`, `per_page`, `has_callback`

### Single reveal vs Bulk reveal payload mismatch
- **Cause**: Single reveal uses existing Lusha endpoint (camelCase), bulk uses leads endpoint (snake_case)
- **Fix**: Single reveal: `{ contactId, revealType }` → `POST /v1/api/lusha/reveal` | Bulk reveal: `{ contact_ids, reveal_type }` → `POST /v1/api/leads/reveal/bulk`

---

# CONGRATULATIONS! 🎉

If you've completed all 7 modules:

✅ Database tables created  
✅ 14 backend APIs built  
✅ 4 frontend pages created  
✅ All features integrated and working  

**Your lead tracking system is complete and ready to use!**

---

**Next Steps**:
- Train users on the new system
- Monitor for bugs/issues
- Gather feedback for improvements
- Plan future enhancements (email templates, advanced scoring, etc.)
