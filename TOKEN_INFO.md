# Token Information - Which Token is Being Used

## Token Storage Location

The application uses **localStorage** to store tokens with the following keys:

### Storage Keys
- **`auth_token`** - Stores the access token (JWT)
- **`refresh_token`** - Stores the refresh token
- **`token_data`** - Stores complete token data object (includes expiry times)

### Code Location
**File:** `src/utils/tokenManager.ts`

**Constants:**
```typescript
private static readonly AUTH_TOKEN_KEY = 'auth_token';
private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
private static readonly TOKEN_DATA_KEY = 'token_data';
```

## How Token is Retrieved

### Step 1: Get Access Token
```typescript
// Location: src/utils/tokenManager.ts:52
static getAccessToken(): string | null {
    return localStorage.getItem(this.AUTH_TOKEN_KEY);  // Gets from 'auth_token'
}
```

### Step 2: Format as Bearer Token
```typescript
// Location: src/utils/tokenManager.ts:378
static getBearerToken(): string | null {
    const token = this.getAccessToken();
    return token ? `Bearer ${token}` : null;  // Adds "Bearer " prefix
}
```

### Step 3: Add to Request Headers
```typescript
// Location: src/services/api.ts:47
const bearerToken = TokenManager.getBearerToken();
if (bearerToken && config.headers) {
    config.headers.Authorization = bearerToken;  // Sets Authorization header
}
```

## Current Token Being Used

From the debug logs, the token currently being used is:

```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjUyMywiaWF0IjoxNzY5MzE4OTgyLCJleHAiOjE3Njk0MDUzODIsInR5cGUiOiJhY2Nlc3MifQ.gD5E7--sQsJn0FD8PFRx7yobU9qm0slu2npIx02P7Rg
```

**Decoded Payload:**
```json
{
  "sub": 523,
  "iat": 1769318982,
  "exp": 1769405382,
  "type": "access"
}
```

**Token Details:**
- **User ID:** 523
- **Issued At:** 1769318982 (timestamp)
- **Expires At:** 1769405382 (timestamp)
- **Type:** access

## How to Check Token in Browser

### Method 1: Browser Console
```javascript
// Open browser console (F12) and run:
console.log('Access Token:', localStorage.getItem('auth_token'));
console.log('Refresh Token:', localStorage.getItem('refresh_token'));
console.log('Token Data:', JSON.parse(localStorage.getItem('token_data') || 'null'));
```

### Method 2: Application Tab
1. Open browser DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Expand **Local Storage**
4. Click on your domain (e.g., `http://localhost:3000`)
5. Look for keys:
   - `auth_token` - This is the access token being used
   - `refresh_token` - This is used for token refresh
   - `token_data` - Complete token information with expiry times

## Token Flow Summary

```
Login/Token Refresh
    ↓
TokenManager.setTokenData(tokenData)
    ↓
Stored in localStorage:
  - 'auth_token' = tokenData.access_token
  - 'refresh_token' = tokenData.refresh_token
  - 'token_data' = full tokenData object
    ↓
API Request Made
    ↓
Request Interceptor (api.ts)
    ↓
TokenManager.getAccessToken()
  → Reads from localStorage['auth_token']
    ↓
TokenManager.getBearerToken()
  → Returns "Bearer {access_token}"
    ↓
Added to Request Header:
  Authorization: Bearer {access_token}
```

## Token Expiration Check

The code checks token expiration using:
```typescript
// Location: src/utils/tokenManager.ts:74
static isTokenExpired(): boolean {
    const tokenData = this.getTokenData();
    if (!tokenData) return true;
    
    const now = new Date().getTime();
    const expiresAt = new Date(tokenData.access_expires).getTime();
    
    return now >= expiresAt;
}
```

**Expiry is checked from:** `tokenData.access_expires` (stored in `token_data`)

## Current Issue

The token being used is:
- ✅ Retrieved correctly from `localStorage['auth_token']`
- ✅ Formatted correctly as `Bearer {token}`
- ✅ Added to Authorization header
- ❌ **But API returns 401** - This suggests:
  1. Token might be expired (check `token_data.access_expires`)
  2. Backend endpoint might not exist
  3. Backend might have different auth requirements

## How to Verify Token

Run this in browser console:
```javascript
// Check current token
const token = localStorage.getItem('auth_token');
const tokenData = JSON.parse(localStorage.getItem('token_data') || 'null');

console.log('Current Access Token:', token);
console.log('Token Data:', tokenData);
console.log('Token Expires:', tokenData?.access_expires);
console.log('Is Expired?', tokenData ? new Date(tokenData.access_expires) <= new Date() : 'No token data');
```
