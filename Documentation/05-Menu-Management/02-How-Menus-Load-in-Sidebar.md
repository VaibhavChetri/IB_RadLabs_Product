# How Menus Load in Sidebar

## Overview

This document explains how the menu system works - from when a user logs in until they see menus in the sidebar.

## Simple Explanation

When you log in:
1. System gets what menus you can see from the API
2. System saves them in memory (Redux) and browser storage (localStorage)
3. Every time page loads, system checks these permissions
4. Sidebar only shows menus you have permission to see

## The Flow

### Step 1: User Logs In

When user enters email and password and clicks login:

**File**: `src/pages/Login.tsx`

```typescript
// User data includes menu permissions
menuPermissions: result.data.menu_permissions || {}
```

This goes to Redux store.

### Step 2: Menu Permissions Saved

**File**: `src/services/authApi.ts`

```typescript
// Store menu permissions from login response
if (response.data.menu_permissions) {
  TokenManager.setMenuPermissions(response.data.menu_permissions);
}
```

Two places get updated:
- **Redux Store**: In memory, fast access
- **localStorage**: In browser storage, saved between sessions

### Step 3: Page Loads or Refreshes

**File**: `src/App.tsx`

When app starts:

1. Check if user is logged in (from localStorage)
2. If logged in, fetch fresh menu permissions from API
3. Restore user data with those permissions

```typescript
// Fetch fresh menu permissions from API
const response = await MenuApiService.getUserMenuPermissions();
menuPermissions = response.data?.menu_permissions || {};
```

**Why fetch fresh?** Because permissions might have changed while you were away.

### Step 4: Sidebar Renders Menus

**File**: `src/components/Sidebar.tsx`

Sidebar uses `useUserMenus` hook:

```typescript
const { menus, loading, error } = useUserMenus();
```

This hook:
1. Gets permissions from Redux store
2. Filters out menus user can't access
3. Returns only menus with access = true

### Step 5: Filtering Happens

**File**: `src/utils/menuPermissions.ts`

The `filterMenusByPermissions` function does the work:

1. Looks at each menu in the config
2. Checks if user has permission
3. If yes, keeps the menu
4. If no, hides the menu
5. Does the same for child menus

**Key Rule**: If a parent has no accessible children, the parent is hidden too.

## Files Involved

### Core Files

1. **Login**: `src/pages/Login.tsx`
   - Receives menu permissions from login API
   - Saves them to Redux

2. **App**: `src/App.tsx`
   - Fetches fresh permissions on page load
   - Restores auth state with permissions

3. **Sidebar**: `src/components/Sidebar.tsx`
   - Uses `useUserMenus` to get filtered menus
   - Renders only accessible menus

4. **useUserMenus Hook**: `src/hooks/useUserMenus.ts`
   - Gets permissions from Redux
   - Filters menus based on permissions
   - Returns filtered menu list

5. **Filter Function**: `src/utils/menuPermissions.ts`
   - Recursively filters menus
   - Handles parent-child relationships

### API Files

1. **Menu API**: `src/services/menuApi.ts`
   - Fetches permissions from `/menus/permissions`

2. **Auth API**: `src/services/authApi.ts`
   - Login includes menu permissions in response

### Config Files

1. **Menu Config**: `src/config/menuConfig.ts`
   - Defines all menus in the system
   - Includes IDs, names, icons, routes

2. **Types**: `src/types/menu.ts`
   - Defines MenuItem and MenuPermission interfaces

## Permission Structure

### What Permissions Look Like

Permissions come from API as a nested structure:

```json
{
  "dashboard": {
    "access": true,
    "children": {}
  },
  "ops-admin": {
    "access": true,
    "children": {
      "clients": {
        "access": true,
        "children": {
          "clients-add": {
            "access": true,
            "children": {}
          }
        }
      }
    }
  }
}
```

### How It Works

- Each menu has `access: true` or `access: false`
- Each menu has `children` object with child permissions
- If parent has no access, children can't be shown
- If parent has access but children don't, parent shows but children are hidden

## Example Flow

### Scenario: KAM User

1. KAM logs in
2. Backend returns permissions for KAM role
3. KAM sees: Dashboard, KAM clients, Transit Plan
4. KAM doesn't see: Ops Admin, Users, Settings

### What Happens

```
1. Login → API returns permissions
2. Permissions saved to Redux and localStorage
3. Sidebar checks permissions
4. filterMenusByPermissions runs
5. Only allowed menus shown
```

### Scenario: After Bulk Update

1. Admin updates menu permissions in Menu Management page
2. Bulk update API called
3. Fresh permissions fetched from API
4. Redux updated with new permissions
5. Sidebar re-renders with new menus

**File**: `src/pages/MenuManagement.tsx`

```typescript
// After bulk update, fetch fresh permissions
const permissionResponse = await MenuApiService.getUserMenuPermissions();
const freshPermissions = permissionResponse.data?.menu_permissions || {};

// Update Redux state
await refreshPermissions(freshPermissions);
```

## Important Points

### Why API Fetch?

After bulk updates, we call `/menus/permissions` to get the latest permissions from the database.

### Why localStorage?

So that when user refreshes page or closes browser, their permissions are saved.

### Why Redux?

Fast access without API calls on every render.

### Why Filter?

So users only see what they can access. Security and clarity.

## Common Questions

**Q: What if permissions change while I'm using the app?**
A: Permissions are fetched on page load. To see changes, refresh the page.

**Q: What if API call fails?**
A: System falls back to localStorage permissions.

**Q: What if a parent has no accessible children?**
A: Parent menu is hidden completely.

**Q: Can permissions be updated without logout?**
A: Yes, via Menu Management page's bulk update feature.

## Debugging

### See What Permissions Are Loaded

Open browser console, you'll see:
```
✅ dashboard
✅ ops-admin
  ✅ clients
    ✅ clients-add
❌ users (hidden)
```

### Check Redux Store

In Redux DevTools, look at `auth.user.menuPermissions`.

### Check localStorage

In browser console:
```javascript
JSON.parse(localStorage.getItem('menu_permissions'))
```

## Summary

1. Login gets permissions from API
2. Permissions saved to Redux and localStorage  
3. Sidebar filters menus based on permissions
4. Only accessible menus are shown
5. After bulk update, permissions refreshed automatically

