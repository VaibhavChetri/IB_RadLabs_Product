# Log Outreach Button - Complete Flow Documentation

## Overview
This document describes the complete flow of the "Log Outreach" button functionality, from user click to API call and error handling.

---

## Flow Diagram

```
User Clicks "Log Outreach" Button
    ↓
handleSubmit() called (OutreachLogModal.tsx)
    ↓
Form Validation (validateForm)
    ↓
Prepare Payload (contact_id, outreach_type, status_id, notes, callback_scheduled_at)
    ↓
LeadApiService.logOutreach(payload) called
    ↓
apiService.post('/leads/log-outreach', data) called
    ↓
Request Interceptor (api.ts) - Adds Bearer Token
    ↓
HTTP POST Request to Backend
    ↓
Response Interceptor (api.ts) - Handles Response/Errors
    ↓
Success: onSuccess() callback → Close Modal
Error: Catch block → Display Error Message
```

---

## Detailed Step-by-Step Flow

### 1. User Interaction
**Location:** `src/components/leads/OutreachLogModal.tsx`

**Trigger:** User clicks "Log Outreach" button in the modal

**Code:**
```typescript
<Button type='submit' disabled={submitting} variant='primary'>
    {submitting ? 'Logging...' : 'Log Outreach'}
</Button>
```

---

### 2. Form Submission Handler
**Location:** `src/components/leads/OutreachLogModal.tsx:126`

**Function:** `handleSubmit(e: React.FormEvent)`

**Steps:**
1. **Prevent Default:** `e.preventDefault()` - Prevents page refresh
2. **Clear Errors:** `setError(null)` - Clears any previous error messages
3. **Validate Form:** Calls `validateForm()` to check:
   - Status is selected (`status_id > 0`)
   - If status requires callback, callback date/time must be provided
   - Callback date/time must be in the future
4. **Prepare Payload:**
   ```typescript
   {
     contact_id: string,
     outreach_type: 'email' | 'phone' | 'both' | 'meeting' | 'other',
     status_id: number,
     notes?: string,  // Optional
     callback_scheduled_at?: string  // Optional, ISO format
   }
   ```
5. **Set Loading State:** `setSubmitting(true)`

---

### 3. API Service Call
**Location:** `src/services/leadApi.ts:388`

**Function:** `LeadApiService.logOutreach(data: LogOutreachRequest)`

**Code:**
```typescript
static async logOutreach(
    data: LogOutreachRequest
): Promise<ApiResponse<LogOutreachResponse>> {
    return apiService.post(`${this.BASE_PATH}/log-outreach`, data);
}
```

**Endpoint:** `POST /api/leads/log-outreach`

**Base Path:** `/leads` (defined as `BASE_PATH`)

**Full URL:** `{API_BASE_URL}/leads/log-outreach`

---

### 4. Request Interceptor - Authentication
**Location:** `src/services/api.ts:45`

**Function:** Request interceptor adds Bearer token to all requests

**Steps:**
1. Get Bearer Token:**
   ```typescript
   const bearerToken = TokenManager.getBearerToken();
   // Returns: "Bearer {access_token}" or null
   ```

2. **Add to Headers:**
   ```typescript
   if (bearerToken && config.headers) {
       config.headers.Authorization = bearerToken;
   }
   ```

3. **Update User Activity:** `TokenManager.updateUserActivity()`

4. **Add Metadata:** Request timestamp for debugging

**Result:** Request now includes `Authorization: Bearer {token}` header

---

### 5. HTTP Request to Backend
**Method:** `POST`

**URL:** `{API_BASE_URL}/leads/log-outreach`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {access_token}
```

**Body:**
```json
{
  "contact_id": "f5fd6572-93a0-5ef9-9423-6e4bd3b8e206",
  "outreach_type": "phone",
  "status_id": 1,
  "notes": "Optional notes here",
  "callback_scheduled_at": "2026-01-26T10:00:00.000Z"  // Optional
}
```

---

### 6. Response Handling

#### 6A. Success Response (200/201)
**Flow:**
1. Response interceptor receives success response
2. Returns response data to `LeadApiService.logOutreach()`
3. Component's try block receives response
4. Calls `onSuccess()` callback
5. Calls `onClose()` to close modal
6. Parent component refreshes leads list

**Expected Response Format:**
```json
{
  "status": "Success",
  "status_code": 200,
  "message": "Outreach logged successfully",
  "data": {
    "outreach_id": 123,
    "contact_id": "f5fd6572-93a0-5ef9-9423-6e4bd3b8e206",
    "status_name": "Meeting Scheduled",
    "callback_scheduled_at": "2026-01-26T10:00:00.000Z"
  }
}
```

#### 6B. Error Response (401 Unauthorized)
**Flow:**
1. Response interceptor detects 401 status
2. **Token Refresh Attempt:**
   - Gets refresh token from `TokenManager`
   - Calls `POST /api/auth/refresh` with refresh token
   - If successful: Updates tokens and retries original request
   - If failed: Proceeds to error handling

3. **Error Handling:**
   - If `skipAuthRedirect` flag is set: Skip redirect, reject promise
   - If `skipAuthRedirect` is NOT set: Schedule redirect to `/login` after 100ms

4. **Component Error Handling:**
   - Catch block receives error
   - Extracts error message from response
   - Sets error state: `setError(errorMessage)`
   - Displays error in modal

**Error Response Format:**
```json
{
  "success": false,
  "message": "Authentication required. Please ensure you are logged in."
}
```

#### 6C. Other Error Responses (400, 403, 500+)
**Flow:**
1. Response interceptor receives error
2. Creates `ApiError` object with message and status
3. Rejects promise with error
4. Component catch block handles error
5. Displays appropriate error message

---

## Error Handling Details

### Authentication Errors (401)
**Current Behavior:**
- Token refresh is attempted automatically
- If refresh fails (404 - endpoint not found), redirect is scheduled
- Component catch block receives error but redirect happens after 100ms

**Issue:** The redirect happens even though we catch the error, because:
- Redirect is scheduled with `setTimeout(100ms)`
- This happens in the interceptor before component can prevent it
- Component catch block runs, but redirect executes 100ms later

### Validation Errors (400)
**Behavior:**
- Error message extracted from `error.response.data.message`
- Displayed in modal: "Invalid data. Please check your input and try again."

### Permission Errors (403)
**Behavior:**
- Error message: "You do not have permission to perform this action."

### Server Errors (500+)
**Behavior:**
- Error message: "Server error. Please try again later."

---

## Key Files and Functions

### Component
- **File:** `src/components/leads/OutreachLogModal.tsx`
- **Main Function:** `handleSubmit(e: React.FormEvent)`
- **Validation:** `validateForm(): boolean`
- **State Management:** `useState` for form data, errors, loading

### API Service
- **File:** `src/services/leadApi.ts`
- **Function:** `LeadApiService.logOutreach(data: LogOutreachRequest)`
- **Endpoint:** `POST /api/leads/log-outreach`

### API Base Service
- **File:** `src/services/api.ts`
- **Request Interceptor:** Adds Bearer token to all requests
- **Response Interceptor:** Handles 401 errors, token refresh, redirects

### Token Management
- **File:** `src/utils/tokenManager.ts`
- **Function:** `TokenManager.getBearerToken()` - Returns "Bearer {token}"
- **Function:** `TokenManager.getRefreshToken()` - Returns refresh token
- **Function:** `TokenManager.getTokenData()` - Returns full token data

---

## Current Issues

### Issue 1: Redirect on 401 Error
**Problem:** When API returns 401, the interceptor attempts token refresh. If refresh fails (404), it redirects to login even though the component catches the error.

**Root Cause:** 
- Token refresh endpoint `/api/auth/refresh` returns 404 (endpoint doesn't exist)
- Interceptor schedules redirect with `setTimeout(100ms)`
- Component catch block runs but can't prevent the scheduled redirect

**Evidence from Logs:**
- Line 6-8: Token IS being sent correctly
- Line 9: API returns 401
- Line 12: Token refresh fails with 404
- Line 72: `skipRedirect: false` (no flag set after removing special config)
- Line 77: Redirect executes

### Issue 2: API Returns 401 Despite Valid Token
**Problem:** The API returns 401 even though:
- Token exists and is valid
- Token is being sent in Authorization header
- Token format is correct ("Bearer {token}")

**Possible Causes:**
1. Token is expired (but refresh should handle this)
2. Backend endpoint `/api/leads/log-outreach` doesn't exist or has different auth requirements
3. Token doesn't have permission for this endpoint
4. Backend expects different token format or header name

---

## Data Flow

### Request Payload Structure
```typescript
interface LogOutreachRequest {
    contact_id: string;                    // Required
    outreach_type: 'email' | 'phone' | 'both' | 'meeting' | 'other';  // Required
    status_id: number;                       // Required
    notes?: string;                         // Optional
    callback_scheduled_at?: string;         // Optional, ISO datetime string
}
```

### Response Structure
```typescript
interface LogOutreachResponse {
    outreach_id: number;
    contact_id: string;
    status_name: string;
    callback_scheduled_at?: string | null;
}
```

---

## Authentication Flow

### Token Addition Process
1. **Request Interceptor Triggered:**
   - Every API request goes through interceptor
   - Location: `src/services/api.ts:45`

2. **Token Retrieval:**
   ```typescript
   const bearerToken = TokenManager.getBearerToken();
   // Returns: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   ```

3. **Header Addition:**
   ```typescript
   config.headers.Authorization = bearerToken;
   ```

4. **Request Sent:**
   - HTTP POST with Authorization header
   - Backend validates token

### Token Refresh Process (on 401)
1. **401 Detected:** Response interceptor catches 401 status
2. **Refresh Attempt:**
   - Gets refresh token: `TokenManager.getRefreshToken()`
   - Calls: `POST /api/auth/refresh` with `{ refresh_token: "..." }`
3. **Success Path:**
   - Receives new access_token and refresh_token
   - Updates TokenManager with new tokens
   - Retries original request with new token
4. **Failure Path:**
   - Refresh endpoint returns 404 (doesn't exist)
   - Checks `skipAuthRedirect` flag
   - If false: Schedules redirect to `/login` after 100ms
   - If true: Skips redirect, rejects promise with error

---

## Component State Management

### State Variables
```typescript
const [formData, setFormData] = useState<LogOutreachRequest>({
    contact_id: contactId,
    outreach_type: 'phone',
    status_id: 0,
    notes: '',
    callback_scheduled_at: undefined,
});

const [statuses, setStatuses] = useState<OutreachStatus[]>([]);
const [loadingStatuses, setLoadingStatuses] = useState(false);
const [submitting, setSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### Form Fields
1. **Outreach Type:** Dropdown (email, phone, both, meeting, other)
2. **Status:** Dropdown (loaded from API or fallback mock data)
3. **Notes:** Textarea (optional)
4. **Callback Date/Time:** DateTime input (shown if status requires callback)

---

## API Endpoints Used

### Primary Endpoint
- **POST** `/api/leads/log-outreach`
  - **Purpose:** Log an outreach attempt
  - **Auth:** Bearer token required
  - **Payload:** `LogOutreachRequest`
  - **Response:** `LogOutreachResponse`

### Supporting Endpoints
- **GET** `/api/leads/statuses?active_only=true`
  - **Purpose:** Load available outreach statuses
  - **Auth:** Bearer token required
  - **Response:** Array of `OutreachStatus`

- **POST** `/api/auth/refresh` (used by interceptor)
  - **Purpose:** Refresh access token
  - **Payload:** `{ refresh_token: string }`
  - **Response:** `{ access_token: string, refresh_token: string }`
  - **Status:** Currently returns 404 (endpoint doesn't exist)

---

## Error Messages

### User-Facing Error Messages
- **401 (Session Expired):** "Your session has expired. Please refresh the page and try again."
- **403 (Permission Denied):** "You do not have permission to perform this action."
- **400 (Validation Error):** Error message from API or "Invalid data. Please check your input and try again."
- **500+ (Server Error):** "Server error. Please try again later."
- **Generic:** "Failed to log outreach"

### Console Logs (Debug Mode)
- `=== LOG OUTREACH API CALL ===` - Payload being sent
- `=== API RESPONSE RECEIVED ===` - Success response
- `=== API ERROR CAUGHT ===` - Error details

---

## Debugging Information

### Log Points
1. **Component Entry:** `handleSubmit ENTRY` - Form data
2. **Before API Call:** `BEFORE API CALL` - Prepared payload
3. **Request Interceptor:** `REQUEST INTERCEPTOR - TOKEN CHECK` - Token status
4. **Token Added:** `TOKEN ADDED TO HEADERS` - Authorization header value
5. **Error Handler:** `INTERCEPTOR ERROR HANDLER` - Error status and URL
6. **401 Detection:** `401 DETECTED - STARTING TOKEN REFRESH`
7. **Token Refresh:** `BEFORE TOKEN REFRESH`, `TOKEN REFRESH FAILED`
8. **Redirect Decision:** `REDIRECT DECISION` - skipRedirect flag status
9. **Catch Block:** `CATCH BLOCK REACHED` - Error details
10. **Component Exit:** `handleSubmit EXIT`

### Key Log Data Points
- `hasBearerToken`: Boolean - Whether token exists
- `bearerTokenLength`: Number - Token string length
- `authorizationHeader`: String - Full "Bearer {token}" value
- `errorStatus`: Number - HTTP status code (401, 404, etc.)
- `skipRedirect`: Boolean - Whether redirect should be skipped
- `willRedirect`: Boolean - Whether redirect will execute

---

## Current Status

### Working
✅ Token is being retrieved correctly
✅ Token is being added to Authorization header
✅ Form validation works
✅ Error messages are displayed in modal
✅ Component catch block is reached
✅ Token is valid (verified with `/api/leads/tracking` endpoint - returns 200)

### Issues
❌ **API returns 401 despite valid token being sent**
   - **Evidence from curl test:**
     - Same token works for `GET /api/leads/tracking` → Returns 200 with data
     - Same token fails for `POST /api/leads/log-outreach` → Returns 401
   - **Conclusion:** This is a **backend issue**, not a frontend issue
   - **Possible causes:**
     1. Endpoint `/api/leads/log-outreach` is not implemented in backend
     2. Endpoint has different authentication middleware
     3. Endpoint requires different permissions/roles
     4. Endpoint expects different request format
❌ Token refresh endpoint doesn't exist (404)
❌ Redirect happens even when error is caught (fixed with skipAuthRedirect flag)

---

## Recommendations

### Immediate Fix (Backend Required)
1. **✅ VERIFIED:** Token is valid and being sent correctly
2. **✅ VERIFIED:** Endpoint URL is correct (`POST /api/leads/log-outreach`)
3. **❌ BACKEND ISSUE:** Endpoint returns 401 even with valid token
   - **Action Required:** Backend team needs to:
     - Verify endpoint is implemented
     - Check authentication middleware for this route
     - Verify route is registered in `routes/api.php`
     - Check if endpoint requires specific permissions
     - Compare with working endpoint (`/api/leads/tracking`) to see auth differences

### Curl Test Results
**Test performed:** `./test-log-outreach-curl.sh`

**Results:**
- ✅ `GET /api/leads/tracking` → **200 OK** (token works)
- ❌ `POST /api/leads/log-outreach` → **401 Unauthorized** (same token fails)
- ❌ `HEAD /api/leads/log-outreach` → **404 Not Found** (endpoint might not exist)

**Conclusion:** Backend endpoint is either:
1. Not implemented
2. Has different auth requirements
3. Not registered in routes

### Long-term Improvements
1. **Token Refresh Endpoint:** Implement `/api/auth/refresh` endpoint
2. **Error Handling:** Add option to skip redirect for specific API calls
3. **User Feedback:** Show loading state during token refresh
4. **Retry Logic:** Add retry mechanism for transient failures

---

## Related Files

- `src/components/leads/OutreachLogModal.tsx` - Main component
- `src/services/leadApi.ts` - API service methods
- `src/services/api.ts` - Base API service with interceptors
- `src/utils/tokenManager.ts` - Token management utilities
- `src/pages/leads/TrackingList.tsx` - Parent component that uses the modal

---

## Last Updated
2026-01-25 - Based on debug logs and code analysis
