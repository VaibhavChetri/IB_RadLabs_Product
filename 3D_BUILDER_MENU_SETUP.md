# 3D Builder Menu Setup Guide

## Overview
The 3D Builder page exists but needs to be registered in the menu management system to appear in the sidebar.

**Page Location**: `src/pages/3d-builder/ThreeDBuilder.tsx`  
**Route**: `/dashboard/3d-builder`  
**Status**: ✅ Page built, ❌ Menu not created

---

## Step 1: Check Current Menu Structure (Execute SQL)

Run these SQL queries on your database to understand the current menu hierarchy:

```sql
-- Get all menus with their hierarchy
SELECT 
    m.id,
    m.name,
    m.slug,
    m.parent_id,
    m.level,
    m.sort_order,
    m.status,
    CASE 
        WHEN m.parent_id IS NULL THEN 'ROOT'
        ELSE (SELECT name FROM menus WHERE id = m.parent_id)
    END as parent_name
FROM menus m
ORDER BY m.level, m.sort_order, m.id;

-- Get the current max ID
SELECT MAX(id) as max_id FROM menus;

-- Check if "Dashboard" menu already exists
SELECT * FROM menus WHERE slug LIKE '%dashboard%' OR name LIKE '%dashboard%';
```

---

## Step 2: Create Menu via API

### Option A: Create Full Hierarchy (Dashboard Parent + 3D Builder Child)

Use this if **NO "Dashboard" parent menu exists**:

**Endpoint**: `POST /api/menus/hierarchy`

**File**: `menu-json-requests/3d-builder-menu-postman.json`

```json
{
  "parent": {
    "name": "Dashboard",
    "slug": "dashboard-menu",
    "parent_id": null,
    "sort_order": 15,
    "level": 0,
    "badge": null,
    "status": 1
  },
  "children": [
    {
      "name": "3D Builder",
      "slug": "3d-builder",
      "parent_id": null,
      "sort_order": 1,
      "level": 1,
      "badge": null,
      "status": 1
    }
  ]
}
```

**cURL Command**:
```bash
curl --location 'https://stage-v2.getinfinitybox.com/v1/api/menus/hierarchy' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_TOKEN' \
--data '{
  "parent": {
    "name": "Dashboard",
    "slug": "dashboard-menu",
    "parent_id": null,
    "sort_order": 15,
    "level": 0,
    "badge": null,
    "status": 1
  },
  "children": [
    {
      "name": "3D Builder",
      "slug": "3d-builder",
      "parent_id": null,
      "sort_order": 1,
      "level": 1,
      "badge": null,
      "status": 1
    }
  ]
}'
```

---

### Option B: Add to Existing Dashboard Parent

Use this if **"Dashboard" parent menu already exists**:

**File**: `menu-json-requests/3d-builder-add-to-existing-parent-postman.json`

1. First, get the parent Dashboard menu ID:
```bash
curl --location 'https://stage-v2.getinfinitybox.com/v1/api/menus' \
--header 'Authorization: Bearer YOUR_TOKEN'
```

2. Find the Dashboard menu ID from the response (e.g., `id: 100`)

3. Use this payload (replace `REPLACE_WITH_DASHBOARD_PARENT_ID` with actual ID):

```json
{
  "parent": {
    "id": 100
  },
  "children": [
    {
      "name": "3D Builder",
      "slug": "3d-builder",
      "sort_order": 1,
      "level": 1,
      "status": 1
    }
  ]
}
```

**cURL Command**:
```bash
curl --location 'https://stage-v2.getinfinitybox.com/v1/api/menus/hierarchy' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_TOKEN' \
--data '{
  "parent": {
    "id": REPLACE_WITH_ACTUAL_ID
  },
  "children": [
    {
      "name": "3D Builder",
      "slug": "3d-builder",
      "sort_order": 1,
      "level": 1,
      "status": 1
    }
  ]
}'
```

---

## Step 3: Verify Menu Creation

After creating the menu, verify it exists:

```bash
curl --location 'https://stage-v2.getinfinitybox.com/v1/api/menus' \
--header 'Authorization: Bearer YOUR_TOKEN'
```

Look for:
- Parent: "Dashboard" (level 0)
- Child: "3D Builder" (level 1, parent_id = Dashboard's ID)

---

## Step 4: Set Menu Permissions

The menu won't appear until permissions are set. Use the Menu Management page:

1. Go to **Menu Management** in the sidebar
2. Find "3D Builder" menu
3. Enable access for required user types (e.g., City Head, Admin)

Or via API (replace `MENU_ID` with the 3D Builder menu ID):

```bash
curl --location 'https://stage-v2.getinfinitybox.com/v1/api/menus/MENU_ID/permissions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_TOKEN' \
--data '{
  "permissions": [
    { "user_type_id": 1, "access": 1 }
  ]
}'
```

---

## Step 5: Frontend Configuration (Already Done)

The following changes have been made to `src/config/menuConfig.ts`:

1. ✅ Added `Box` icon import from lucide-react
2. ✅ Added 3D Builder menu item under Dashboards:

```typescript
{
    id: '3d-builder',
    name: '3D Builder',
    icon: Box,
    href: '/dashboard/3d-builder',
}
```

---

## Expected Menu Structure

After setup, the menu hierarchy will be:

```
Dashboards (Level 0)
├── Impact Home (Level 1)
├── Ops Dashboard (Level 1)
└── 3D Builder (Level 1) ← NEW
```

---

## Troubleshooting

### Menu not appearing in sidebar?
1. Check that permissions are set for your user type
2. Verify the menu status is 1 (active)
3. Check browser console for errors
4. Refresh the page after setting permissions

### Duplicate slug error?
- The slug "3d-builder" might already exist
- Change to: `"slug": "dashboard-3d-builder"` or `"3d-builder-v2"`

### Wrong parent level?
- Ensure parent is Level 0 and child is Level 1
- Check that parent_id is correctly set

---

## Files Modified/Created

1. ✅ `src/config/menuConfig.ts` - Added 3D Builder menu configuration
2. ✅ `menu-json-requests/3d-builder-menu-postman.json` - Full hierarchy payload
3. ✅ `menu-json-requests/3d-builder-add-to-existing-parent-postman.json` - Child-only payload
4. ✅ `3D_BUILDER_MENU_SETUP.md` - This documentation

---

**Last Updated**: 2026-02-18  
**API Endpoint**: `POST /api/menus/hierarchy`  
**Page Route**: `/dashboard/3d-builder`
