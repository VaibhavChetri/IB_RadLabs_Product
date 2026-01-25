# Backend API Specifications - Lead Tracking System

## 📋 Overview
This document lists ALL backend APIs to build for the lead tracking system. Build these in your backend repo. Test each with Postman/Insomnia before connecting to frontend.

**Total APIs**: 14  
**Estimated Time**: 2-3 days (full-time)

---

## 🗂️ API Groups

1. **Reveal APIs** (2) - Reveal contact information from Lusha
2. **Tracking APIs** (4) - Start/stop tracking contacts  
3. **Outreach APIs** (3) - Log outreach attempts
4. **Callback APIs** (2) - Manage scheduled callbacks
5. **List/Filter APIs** (2) - Get tracking lists
6. **Reports APIs** (1) - Analytics and metrics

---

# GROUP 1: REVEAL APIS

## API 1: Reveal Contact (Single)
**Purpose**: Reveal email/phone for a single contact from Lusha  
**Note**: This might already exist - verify and update if needed

### Endpoint
```
POST /api/lusha/reveal
```

### Headers
```
Authorization: Bearer {token}
Content-Type: application/json
```

### Request Body
```json
{
  "contact_id": "lusha_contact_abc123",
  "reveal_type": "email"
}
```

**Fields**:
- `contact_id` (string, required): Lusha contact ID
- `reveal_type` (enum, required): "email" | "phone" | "both"

### Response - Success (200)
```json
{
  "success": true,
  "data": {
    "contact_id": "lusha_contact_abc123",
    "email": "john@company.com",
    "phone": null,
    "credits_used": 1,
    "remaining_credits": 99
  }
}
```

### Response - Already Revealed (200)
```json
{
  "success": true,
  "data": {
    "contact_id": "lusha_contact_abc123",
    "email": "john@company.com",
    "already_revealed": true,
    "credits_used": 0
  }
}
```

### Response - Error (422/500)
```json
{
  "success": false,
  "message": "Contact not found"
}
```

### Database Operations
1. Check if already revealed in `lusha_contacts`
2. If not, call Lusha API
3. Update `lusha_contacts` table:
   - Set `email` or `phone`
   - Set `email_revealed_at` / `phone_revealed_at`
   - Set `email_revealed_by` / `phone_revealed_by`
4. Insert into `lusha_reveal_log`:
   - contact_id, user_id, reveal_type, revealed_value, cost_credits

### Files to Create/Modify
- Service: `app/Services/LushaRevealService.php`
  - Method: `revealContact($contactId, $revealType, $userId)`
- Controller: `app/Http/Controllers/LushaController.php`
  - Method: `reveal(Request $request)`
- Route: `routes/api.php`
  - `Route::post('/lusha/reveal', [LushaController::class, 'reveal'])`

---

## API 2: Bulk Reveal Contacts
**Purpose**: Reveal email/phone for multiple contacts at once

### Endpoint
```
POST /api/lusha/reveal/bulk
```

### Request Body
```json
{
  "contact_ids": [
    "lusha_contact_1",
    "lusha_contact_2",
    "lusha_contact_3"
  ],
  "reveal_type": "email"
}
```

**Fields**:
- `contact_ids` (array of strings, required): Array of Lusha contact IDs
- `reveal_type` (enum, required): "email" | "phone" | "both"

### Response - Success (200)
```json
{
  "success": true,
  "data": {
    "total_requested": 3,
    "total_revealed": 2,
    "total_failed": 1,
    "credits_used": 2,
    "remaining_credits": 97,
    "results": [
      {
        "contact_id": "lusha_contact_1",
        "success": true,
        "email": "john@company.com"
      },
      {
        "contact_id": "lusha_contact_2",
        "success": true,
        "email": "jane@company.com"
      },
      {
        "contact_id": "lusha_contact_3",
        "success": false,
        "error": "Email not available"
      }
    ]
  }
}
```

### Database Operations
- Loop through each contact_id
- Call `revealContact()` for each
- Collect results, success/failure counts
- All database operations same as API 1

### Files to Create/Modify
- Service: `LushaRevealService.php`
  - Method: `bulkReveal($contactIds, $revealType, $userId)`
- Controller: `LushaController.php`
  - Method: `bulkReveal(Request $request)`
- Route: `routes/api.php`
  - `Route::post('/lusha/reveal/bulk', [LushaController::class, 'bulkReveal'])`

---

# GROUP 2: TRACKING APIS

## API 3: Check if Can Track
**Purpose**: Validate if a contact can be tracked (has email/phone revealed)

### Endpoint
```
GET /api/leads/can-track/{contact_id}
```

### URL Parameters
- `contact_id` (string): Lusha contact ID

### Response - Can Track (200)
```json
{
  "success": true,
  "can_track": true,
  "reason": null,
  "has_email": true,
  "has_phone": true,
  "is_tracking": false
}
```

### Response - Cannot Track (200)
```json
{
  "success": true,
  "can_track": false,
  "reason": "No contact info revealed. Please reveal email or phone first.",
  "has_email": false,
  "has_phone": false,
  "is_tracking": false
}
```

### Logic
- Can track if: (has_email OR has_phone) AND is_tracking = 0
- Cannot track if: no email/phone OR already tracking

### Database Operations
- Query `lusha_contacts` table
- Check `email` and `phone` columns
- Check `is_tracking` flag

### Files to Create/Modify
- Service: `app/Services/LeadTrackingService.php`
  - Method: `canTrack($contactId)`
- Controller: `app/Http/Controllers/LeadTrackingController.php`
  - Method: `canTrack($contactId)`
- Route: `routes/api.php`
  - `Route::get('/leads/can-track/{contact_id}', [LeadTrackingController::class, 'canTrack'])`

---

## API 4: Start Tracking (Single)
**Purpose**: Start tracking a single contact

### Endpoint
```
POST /api/leads/start-tracking
```

### Request Body
```json
{
  "contact_id": "lusha_contact_abc123",
  "assign_to": 45
}
```

**Fields**:
- `contact_id` (string, required): Lusha contact ID
- `assign_to` (integer, optional): Admin ID to assign to (defaults to current user)

### Response - Success (200)
```json
{
  "success": true,
  "message": "Contact is now being tracked",
  "data": {
    "contact_id": "lusha_contact_abc123",
    "is_tracking": true,
    "tracking_started_at": "2026-01-25 10:30:00",
    "assigned_to": 45
  }
}
```

### Response - Error (422)
```json
{
  "success": false,
  "message": "No contact info revealed. Please reveal email or phone first."
}
```

### Database Operations (in transaction)
1. Validate contact exists in `lusha_contacts`
2. Validate has email OR phone
3. Update `lusha_contacts`:
   - `is_tracking = 1`
   - `tracking_started_at = NOW()`
   - `tracking_started_by = user_id`
4. Get company_id from `lusha_companies` (match by company_name)
5. Get default status_id from `lead_outreach_status` (status_name = 'Not Contacted Yet')
6. Insert into `lead_tracking_summary`:
   - contact_id, company_id, tracking_started_at, assigned_to, current_status_id, is_active=1

### Files to Create/Modify
- Service: `LeadTrackingService.php`
  - Method: `startTracking($contactId, $userId, $assignTo = null)`
- Controller: `LeadTrackingController.php`
  - Method: `startTracking(Request $request)`
- Route: `routes/api.php`
  - `Route::post('/leads/start-tracking', [LeadTrackingController::class, 'startTracking'])`

---

## API 5: Start Tracking (Bulk)
**Purpose**: Start tracking multiple contacts at once

### Endpoint
```
POST /api/leads/start-tracking/bulk
```

### Request Body
```json
{
  "contact_ids": [
    "lusha_contact_1",
    "lusha_contact_2",
    "lusha_contact_3"
  ],
  "assign_to": 45
}
```

**Fields**:
- `contact_ids` (array of strings, required): Array of contact IDs
- `assign_to` (integer, optional): Admin ID to assign all to

### Response - Success (200)
```json
{
  "success": true,
  "data": {
    "total_requested": 3,
    "total_tracked": 2,
    "total_failed": 1,
    "results": [
      {
        "contact_id": "lusha_contact_1",
        "success": true
      },
      {
        "contact_id": "lusha_contact_2",
        "success": true
      },
      {
        "contact_id": "lusha_contact_3",
        "success": false,
        "reason": "No contact info revealed"
      }
    ]
  }
}
```

### Database Operations
- Loop through contact_ids
- Call `startTracking()` for each
- Collect results

### Files to Create/Modify
- Service: `LeadTrackingService.php`
  - Method: `bulkStartTracking($contactIds, $userId, $assignTo = null)`
- Controller: `LeadTrackingController.php`
  - Method: `bulkStartTracking(Request $request)`
- Route: `routes/api.php`
  - `Route::post('/leads/start-tracking/bulk', [LeadTrackingController::class, 'bulkStartTracking'])`

---

## API 6: Stop Tracking
**Purpose**: Stop tracking a contact (mark as inactive)

### Endpoint
```
POST /api/leads/stop-tracking
```

### Request Body
```json
{
  "contact_id": "lusha_contact_abc123",
  "reason": "Not interested anymore"
}
```

**Fields**:
- `contact_id` (string, required): Lusha contact ID
- `reason` (string, optional): Why tracking was stopped

### Response - Success (200)
```json
{
  "success": true,
  "message": "Tracking stopped for this contact"
}
```

### Database Operations
1. Update `lusha_contacts`: `is_tracking = 0`
2. Update `lead_tracking_summary`: `is_active = 0`

### Files to Create/Modify
- Service: `LeadTrackingService.php`
  - Method: `stopTracking($contactId, $reason = null)`
- Controller: `LeadTrackingController.php`
  - Method: `stopTracking(Request $request)`
- Route: `routes/api.php`
  - `Route::post('/leads/stop-tracking', [LeadTrackingController::class, 'stopTracking'])`

---

# GROUP 3: OUTREACH APIS

## API 7: Get Outreach Statuses
**Purpose**: Get list of all available status options for dropdown

### Endpoint
```
GET /api/leads/statuses
```

### Query Parameters (optional)
- `active_only` (boolean): If true, return only active statuses (default: true)

### Response - Success (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "status_name": "Not Contacted Yet",
      "status_category": "pending",
      "requires_callback": false,
      "status_color": "#9CA3AF",
      "status_order": 1
    },
    {
      "id": 5,
      "status_name": "Call Later",
      "status_category": "follow_up",
      "requires_callback": true,
      "status_color": "#60A5FA",
      "status_order": 5
    }
    // ... more statuses
  ]
}
```

### Database Operations
- Query `lead_outreach_status` table
- Filter by `is_active = 1` if active_only
- Order by `status_order`

### Files to Create/Modify
- Service: `LeadTrackingService.php`
  - Method: `getStatuses($activeOnly = true)`
- Controller: `LeadTrackingController.php`
  - Method: `getStatuses(Request $request)`
- Route: `routes/api.php`
  - `Route::get('/leads/statuses', [LeadTrackingController::class, 'getStatuses'])`

---

## API 8: Log Outreach Attempt
**Purpose**: Record an outreach attempt (email/call) with status update

### Endpoint
```
POST /api/leads/log-outreach
```

### Request Body
```json
{
  "contact_id": "lusha_contact_abc123",
  "outreach_type": "phone",
  "status_id": 5,
  "notes": "Left voicemail, will call back tomorrow at 2pm",
  "callback_scheduled_at": "2026-01-26 14:00:00"
}
```

**Fields**:
- `contact_id` (string, required): Lusha contact ID
- `outreach_type` (enum, required): "email" | "phone" | "both" | "meeting" | "other"
- `status_id` (integer, required): FK to lead_outreach_status.id
- `notes` (text, optional): Notes about the interaction
- `callback_scheduled_at` (datetime, conditional): Required if status.requires_callback = 1

### Validation Rules
- If status.requires_callback = 1, callback_scheduled_at is REQUIRED
- callback_scheduled_at must be future datetime
- contact must be tracking (is_tracking = 1)

### Response - Success (200)
```json
{
  "success": true,
  "message": "Outreach logged successfully",
  "data": {
    "outreach_id": 123,
    "contact_id": "lusha_contact_abc123",
    "status_name": "Call Later",
    "callback_scheduled_at": "2026-01-26 14:00:00"
  }
}
```

### Response - Validation Error (422)
```json
{
  "success": false,
  "message": "Callback date/time required for this status"
}
```

### Database Operations (in transaction)
1. Validate contact is tracking
2. Get status record, check requires_callback
3. Insert into `lead_outreach_log`:
   - All fields from request
   - performed_by = current user
   - outreach_date = NOW()
4. Update `lead_tracking_summary`:
   - last_outreach_date = NOW()
   - last_outreach_type = request.outreach_type
   - current_status_id = request.status_id
   - total_outreach_count += 1
   - email_count += 1 (if outreach_type = 'email' or 'both')
   - phone_count += 1 (if outreach_type = 'phone' or 'both')
   - meeting_count += 1 (if outreach_type = 'meeting')
   - next_callback_at = request.callback_scheduled_at

### Files to Create/Modify
- Service: `LeadTrackingService.php`
  - Method: `logOutreach($data, $userId)`
- Controller: `LeadTrackingController.php`
  - Method: `logOutreach(Request $request)`
- Route: `routes/api.php`
  - `Route::post('/leads/log-outreach', [LeadTrackingController::class, 'logOutreach'])`

---

## API 9: Update Outreach Entry
**Purpose**: Update an existing outreach log (mainly for marking callback as completed)

### Endpoint
```
PUT /api/leads/outreach/{id}
```

### URL Parameters
- `id` (integer): Outreach log ID

### Request Body
```json
{
  "callback_completed": true,
  "notes": "Called back, person interested. Scheduling demo."
}
```

**Fields**:
- `callback_completed` (boolean, optional): Mark callback as done
- `notes` (text, optional): Update notes

### Response - Success (200)
```json
{
  "success": true,
  "message": "Outreach updated successfully"
}
```

### Database Operations
- Update `lead_outreach_log` where id = {id}
- If callback_completed = true, update `lead_tracking_summary`.next_callback_at = NULL

### Files to Create/Modify
- Service: `LeadTrackingService.php`
  - Method: `updateOutreach($outreachId, $data)`
- Controller: `LeadTrackingController.php`
  - Method: `updateOutreach($id, Request $request)`
- Route: `routes/api.php`
  - `Route::put('/leads/outreach/{id}', [LeadTrackingController::class, 'updateOutreach'])`

---

# GROUP 4: CALLBACK APIS

## API 10: Get Today's Callbacks
**Purpose**: Get list of all callbacks scheduled for today

### Endpoint
```
GET /api/leads/callbacks/today
```

### Query Parameters (optional)
- `user_id` (integer): Filter by assigned user (defaults to current user)
- `include_overdue` (boolean): Include overdue callbacks (default: true)

### Response - Success (200)
```json
{
  "success": true,
  "data": {
    "today_count": 5,
    "overdue_count": 2,
    "callbacks": [
      {
        "outreach_id": 123,
        "contact_id": "lusha_contact_abc123",
        "contact_name": "John Doe",
        "company_name": "Acme Corp",
        "job_title": "CEO",
        "phone": "+1234567890",
        "email": "john@acme.com",
        "callback_scheduled_at": "2026-01-25 09:00:00",
        "is_overdue": false,
        "status_name": "Call Later",
        "last_notes": "Left voicemail yesterday",
        "assigned_to_name": "Jane Smith"
      }
      // ... more callbacks
    ]
  }
}
```

### Database Operations
```sql
SELECT 
  lo.id as outreach_id,
  lc.contact_id,
  lc.full_name as contact_name,
  lc.company_name,
  lc.job_title,
  lc.phone,
  lc.email,
  lo.callback_scheduled_at,
  CASE WHEN lo.callback_scheduled_at < NOW() THEN 1 ELSE 0 END as is_overdue,
  los.status_name,
  lo.notes as last_notes,
  CONCAT(a.first_name, ' ', a.last_name) as assigned_to_name
FROM lead_outreach_log lo
JOIN lusha_contacts lc ON lc.contact_id = lo.contact_id
JOIN lead_outreach_status los ON los.id = lo.status_id
LEFT JOIN lead_tracking_summary lts ON lts.contact_id = lo.contact_id
LEFT JOIN admins a ON a.id = lts.assigned_to
WHERE lo.callback_completed = 0
  AND DATE(lo.callback_scheduled_at) <= CURDATE()
  AND (lts.assigned_to = {user_id} OR {user_id} IS NULL)
ORDER BY lo.callback_scheduled_at ASC
```

### Files to Create/Modify
- Service: `LeadTrackingService.php`
  - Method: `getTodaysCallbacks($userId = null, $includeOverdue = true)`
- Controller: `LeadTrackingController.php`
  - Method: `getTodaysCallbacks(Request $request)`
- Route: `routes/api.php`
  - `Route::get('/leads/callbacks/today', [LeadTrackingController::class, 'getTodaysCallbacks'])`

---

## API 11: Complete Callback
**Purpose**: Mark a scheduled callback as completed

### Endpoint
```
POST /api/leads/callbacks/{outreach_id}/complete
```

### URL Parameters
- `outreach_id` (integer): Outreach log ID

### Request Body (optional)
```json
{
  "notes": "Successfully reached, scheduling meeting for next week"
}
```

### Response - Success (200)
```json
{
  "success": true,
  "message": "Callback marked as completed"
}
```

### Database Operations
1. Update `lead_outreach_log`:
   - callback_completed = 1
   - notes = concat existing notes + new notes (if provided)
2. Update `lead_tracking_summary`:
   - next_callback_at = NULL

### Files to Create/Modify
- Service: `LeadTrackingService.php`
  - Method: `completeCallback($outreachId, $notes = null)`
- Controller: `LeadTrackingController::class`
  - Method: `completeCallback($outreachId, Request $request)`
- Route: `routes/api.php`
  - `Route::post('/leads/callbacks/{id}/complete', [LeadTrackingController::class, 'completeCallback'])`

---

# GROUP 5: LIST/FILTER APIS

## API 12: Get Tracking List
**Purpose**: Get list of all tracked contacts with filtering

### Endpoint
```
GET /api/leads/tracking
```

### Query Parameters (all optional)
- `assigned_to` (integer): Filter by assigned user
- `status_id` (integer): Filter by status
- `status_category` (string): Filter by status category (pending, positive, etc.)
- `has_callback` (boolean): Filter contacts with scheduled callbacks
- `search` (string): Search in name, company, email
- `page` (integer): Page number (default: 1)
- `per_page` (integer): Items per page (default: 25)

### Response - Success (200)
```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "per_page": 25,
    "total": 47,
    "total_pages": 2,
    "contacts": [
      {
        "contact_id": "lusha_contact_abc123",
        "full_name": "John Doe",
        "job_title": "CEO",
        "company_name": "Acme Corp",
        "company_id": "lusha_company_xyz",
        "email": "john@acme.com",
        "phone": "+1234567890",
        "location": "San Francisco, CA",
        "tracking_started_at": "2026-01-20 10:00:00",
        "last_outreach_date": "2026-01-24 15:30:00",
        "last_outreach_type": "phone",
        "current_status": {
          "id": 5,
          "status_name": "Call Later",
          "status_color": "#60A5FA",
          "status_category": "follow_up"
        },
        "total_outreach_count": 3,
        "email_count": 1,
        "phone_count": 2,
        "next_callback_at": "2026-01-26 14:00:00",
        "assigned_to": {
          "id": 45,
          "name": "Jane Smith"
        },
        "is_active": true
      }
      // ... more contacts
    ]
  }
}
```

### Database Operations
- Complex JOIN query on lusha_contacts, lead_tracking_summary, lead_outreach_status, admins
- Apply all filters from query params
- Paginate results
- Order by last_outreach_date DESC

### Files to Create/Modify
- Service: `LeadTrackingService.php`
  - Method: `getTrackingList($filters = [], $page = 1, $perPage = 25)`
- Controller: `LeadTrackingController.php`
  - Method: `getTrackingList(Request $request)`
- Route: `routes/api.php`
  - `Route::get('/leads/tracking', [LeadTrackingController::class, 'getTrackingList'])`

---

## API 13: Get Contact Timeline
**Purpose**: Get complete outreach history for a specific contact

### Endpoint
```
GET /api/leads/{contact_id}/timeline
```

### URL Parameters
- `contact_id` (string): Lusha contact ID

### Response - Success (200)
```json
{
  "success": true,
  "data": {
    "contact": {
      "contact_id": "lusha_contact_abc123",
      "full_name": "John Doe",
      "job_title": "CEO",
      "company_name": "Acme Corp",
      "email": "john@acme.com",
      "phone": "+1234567890"
    },
    "summary": {
      "tracking_started_at": "2026-01-20 10:00:00",
      "total_outreach_count": 5,
      "email_count": 2,
      "phone_count": 3,
      "current_status": "Interested - Follow Up"
    },
    "timeline": [
      {
        "id": 125,
        "outreach_type": "phone",
        "outreach_date": "2026-01-24 15:30:00",
        "status_name": "Interested - Follow Up",
        "status_color": "#34D399",
        "notes": "Spoke with John, very interested. Sending proposal.",
        "callback_scheduled_at": null,
        "callback_completed": null,
        "performed_by": {
          "id": 45,
          "name": "Jane Smith"
        }
      },
      {
        "id": 123,
        "outreach_type": "phone",
        "outreach_date": "2026-01-23 10:00:00",
        "status_name": "Call Later",
        "status_color": "#60A5FA",
        "notes": "Left voicemail",
        "callback_scheduled_at": "2026-01-24 14:00:00",
        "callback_completed": true,
        "performed_by": {
          "id": 45,
          "name": "Jane Smith"
        }
      }
      // ... more timeline entries (ordered newest first)
    ]
  }
}
```

### Database Operations
- Get contact details from `lusha_contacts`
- Get summary from `lead_tracking_summary`
- Get all outreach logs from `lead_outreach_log` where contact_id = {id}
- JOIN with lead_outreach_status and admins
- Order by outreach_date DESC

### Files to Create/Modify
- Service: `LeadTrackingService.php`
  - Method: `getContactTimeline($contactId)`
- Controller: `LeadTrackingController.php`
  - Method: `getContactTimeline($contactId)`
- Route: `routes/api.php`
  - `Route::get('/leads/{contact_id}/timeline', [LeadTrackingController::class, 'getContactTimeline'])`

---

# GROUP 6: REPORTS API

## API 14: Get Reports Data
**Purpose**: Get analytics and metrics for dashboard/reports

### Endpoint
```
GET /api/leads/reports
```

### Query Parameters (optional)
- `user_id` (integer): Filter by user (null = all users)
- `date_from` (date): Start date (default: 30 days ago)
- `date_to` (date): End date (default: today)

### Response - Success (200)
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_tracked": 47,
      "active_leads": 35,
      "inactive_leads": 12,
      "total_outreach_attempts": 156,
      "avg_outreach_per_lead": 3.3
    },
    "status_distribution": [
      {
        "status_name": "Interested - Follow Up",
        "status_category": "positive",
        "status_color": "#34D399",
        "count": 12,
        "percentage": 34.3
      },
      {
        "status_name": "Call Later",
        "status_category": "follow_up",
        "status_color": "#60A5FA",
        "count": 8,
        "percentage": 22.9
      }
      // ... more statuses
    ],
    "outreach_by_type": {
      "email": 45,
      "phone": 89,
      "both": 15,
      "meeting": 7
    },
    "user_performance": [
      {
        "user_id": 45,
        "user_name": "Jane Smith",
        "contacts_tracked": 15,
        "total_outreach": 52,
        "positive_responses": 8,
        "conversion_rate": 53.3
      }
      // ... more users
    ],
    "callback_metrics": {
      "total_scheduled": 23,
      "completed": 18,
      "pending": 5,
      "overdue": 2,
      "completion_rate": 78.3
    }
  }
}
```

### Database Operations
Multiple aggregation queries:
1. Summary stats from lead_tracking_summary
2. Status distribution with counts
3. Outreach type breakdown from lead_outreach_log
4. User performance metrics (joins across multiple tables)
5. Callback completion stats

### Files to Create/Modify
- Service: `app/Services/LeadReportsService.php`
  - Method: `getReportsData($filters = [])`
- Controller: `app/Http/Controllers/LeadReportsController.php`
  - Method: `getReports(Request $request)`
- Route: `routes/api.php`
  - `Route::get('/leads/reports', [LeadReportsController::class, 'getReports'])`

---

# TESTING CHECKLIST

Test each API with Postman/Insomnia before integrating with frontend:

## Reveal APIs
- [ ] API 1: Reveal single email - returns email
- [ ] API 1: Reveal already revealed email - shows already_revealed: true
- [ ] API 2: Bulk reveal 5 contacts - all succeed
- [ ] API 2: Bulk reveal with 1 invalid - shows partial success

## Tracking APIs
- [ ] API 3: Check can track for contact with email - returns true
- [ ] API 3: Check can track for contact without email/phone - returns false
- [ ] API 4: Start tracking - creates tracking_summary record
- [ ] API 5: Bulk start tracking - tracks multiple
- [ ] API 6: Stop tracking - sets is_active = 0

## Outreach APIs
- [ ] API 7: Get statuses - returns 16 statuses
- [ ] API 8: Log outreach without callback - succeeds
- [ ] API 8: Log outreach with "Call Later" status but no callback_scheduled_at - fails validation
- [ ] API 8: Log outreach with callback - updates summary.next_callback_at
- [ ] API 9: Update outreach - mark callback complete

## Callback APIs
- [ ] API 10: Get today's callbacks - returns correct list
- [ ] API 10: Filter by user - shows only assigned user's callbacks
- [ ] API 11: Complete callback - clears next_callback_at

## List/Filter APIs
- [ ] API 12: Get tracking list - returns paginated results
- [ ] API 12: Filter by status - shows filtered results
- [ ] API 12: Search by name - shows matching contacts
- [ ] API 13: Get contact timeline - shows all outreach history

## Reports API
- [ ] API 14: Get reports - returns all metrics
- [ ] API 14: Filter by date range - shows filtered data
- [ ] API 14: Filter by user - shows user-specific data

---

# API ROUTE SUMMARY

Add these routes to `routes/api.php`:

```php
// Reveal APIs
Route::post('/lusha/reveal', [LushaController::class, 'reveal']);
Route::post('/lusha/reveal/bulk', [LushaController::class, 'bulkReveal']);

// Tracking APIs
Route::get('/leads/can-track/{contact_id}', [LeadTrackingController::class, 'canTrack']);
Route::post('/leads/start-tracking', [LeadTrackingController::class, 'startTracking']);
Route::post('/leads/start-tracking/bulk', [LeadTrackingController::class, 'bulkStartTracking']);
Route::post('/leads/stop-tracking', [LeadTrackingController::class, 'stopTracking']);

// Outreach APIs
Route::get('/leads/statuses', [LeadTrackingController::class, 'getStatuses']);
Route::post('/leads/log-outreach', [LeadTrackingController::class, 'logOutreach']);
Route::put('/leads/outreach/{id}', [LeadTrackingController::class, 'updateOutreach']);

// Callback APIs
Route::get('/leads/callbacks/today', [LeadTrackingController::class, 'getTodaysCallbacks']);
Route::post('/leads/callbacks/{id}/complete', [LeadTrackingController::class, 'completeCallback']);

// List/Filter APIs
Route::get('/leads/tracking', [LeadTrackingController::class, 'getTrackingList']);
Route::get('/leads/{contact_id}/timeline', [LeadTrackingController::class, 'getContactTimeline']);

// Reports API
Route::get('/leads/reports', [LeadReportsController::class, 'getReports']);
```

---

# FILES TO CREATE

## Services
1. `app/Services/LushaRevealService.php` (may already exist - update)
2. `app/Services/LeadTrackingService.php` (new)
3. `app/Services/LeadReportsService.php` (new)

## Controllers
1. `app/Http/Controllers/LushaController.php` (may already exist - update)
2. `app/Http/Controllers/LeadTrackingController.php` (new)
3. `app/Http/Controllers/LeadReportsController.php` (new)

## Models (create if needed)
1. `app/Models/LushaContact.php` (may already exist)
2. `app/Models/LushaCompany.php` (may already exist)
3. `app/Models/LushaRevealLog.php` (may already exist)
4. `app/Models/LeadOutreachStatus.php` (new)
5. `app/Models/LeadOutreachLog.php` (new)
6. `app/Models/LeadTrackingSummary.php` (new)

---

# BACKEND COMPLETE ✅

Once all 14 APIs are built and tested:
- ✅ All routes defined
- ✅ All controllers created
- ✅ All services implemented
- ✅ All APIs tested with Postman
- ✅ Database operations verified

**Next Step**: Proceed to `03_FRONTEND_STRUCTURE.md`
