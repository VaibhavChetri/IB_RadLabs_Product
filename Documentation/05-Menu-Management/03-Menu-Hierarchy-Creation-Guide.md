# Menu Hierarchy Creation Guide

**Complete guide for creating menu hierarchies using the `/api/menus/hierarchy` endpoint**

## 📋 Table of Contents

1. [Quick Start](#quick-start) ⭐ **Start here for most common use case**
2. [Prerequisites](#prerequisites)
3. [API Endpoint](#api-endpoint)
4. [Scenario 1: Full Hierarchy (Parent + Children + Grandchildren)](#scenario-1-full-hierarchy-parent--children--grandchildren)
5. [Scenario 2: Parent + Children (with or without Grandchildren)](#scenario-2-parent--children-with-or-without-grandchildren)
6. [Scenario 3: Adding Children to Existing Parent](#scenario-3-adding-children-to-existing-parent)
7. [Scenario 4: Adding Grandchildren to Existing Child](#scenario-4-adding-grandchildren-to-existing-child)
8. [API Response Format](#api-response-format)
9. [Field Reference](#field-reference)
10. [Common Mistakes](#common-mistakes)
11. [Troubleshooting](#troubleshooting)

---

## Quick Start ⭐

**Most Common Use Case**: Adding a child menu to an existing parent (e.g., adding Review Category Type under Revenue)

### Step-by-Step:

1. **Get parent menu ID**:
   ```bash
   curl --location 'localhost:3099/v1/api/menus' \
   --header 'Authorization: Bearer YOUR_TOKEN'
   ```
   Find the parent ID (e.g., Revenue = `id: 39`)

2. **Use this format**:
   ```json
   {
     "parent": {
       "id": 39
     },
     "children": [
       {
         "name": "Review Category Type",
         "slug": "review-category-type",
         "sort_order": 2,
         "level": 2,
         "status": 1
       }
     ]
   }
   ```

3. **POST to `/api/menus/hierarchy`**

4. **Update frontend**: Add to `menuConfig.ts` and `routes.tsx`

**For other scenarios**, see detailed sections below.

---

## Prerequisites

### Step 1: Get Menu IDs

Before creating menus, you need to know the parent menu ID. Call the menus API:

```bash
curl --location 'localhost:3099/v1/api/menus' \
--header 'Authorization: Bearer YOUR_TOKEN' \
--header 'Cookie: refreshToken=YOUR_REFRESH_TOKEN'
```

Find the menu ID from the response. Example:
- Ops Admin: `id: 13`
- Revenue (under Ops Admin): `id: 39`

### Step 2: Understand Menu Levels

**Important**: Level values represent hierarchy depth:
- **Level 0**: Root menus (parent_id = null) - Top-level menus
- **Level 1**: Child menus (parent_id = root menu ID) - Direct children of root
- **Level 2**: Grandchild menus (parent_id = child menu ID) - Children of level 1 menus

**Level Calculation Rule**: 
- Child's level = Parent's level + 1
- Example: If parent is level 1, child must be level 2

**Note**: API response may show different level values than database schema. Always calculate based on parent's level + 1.

---

## API Endpoint

**Endpoint**: `POST /api/menus/hierarchy`

**Base URL**: `localhost:3099/v1/api`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN
Cookie: refreshToken=YOUR_REFRESH_TOKEN
```

**Important Notes**:
- Backend matches existing menus by `slug` - if slug exists, it updates; if not, it creates
- Slugs must be **globally unique** across all menus
- All `parent_id` fields should be `null` - backend sets them automatically
- Use `parent.id` when parent exists, full `parent` object when creating new parent

---

## Scenario 1: Full Hierarchy (Parent + Children + Grandchildren)

**Use Case**: Creating a **NEW** parent menu from scratch with complete hierarchy (e.g., creating Revenue menu with Monthly Estimate and its children)

**When to Use**: Parent menu doesn't exist yet - you're creating everything from scratch

### Example: Revenue Menu with Monthly Estimate

```json
{
	"parent": {
		"name": "Revenue",
		"slug": "revenue",
		"parent_id": null,
		"sort_order": 13,
		"level": 0,
		"badge": null,
		"status": 1
	},
	"children": [
		{
			"name": "Monthly Estimate",
			"slug": "monthly-estimate",
			"parent_id": null,
			"sort_order": 1,
			"level": 1,
			"badge": null,
			"status": 1,
			"grandchildren": [
				{
					"name": "Add",
					"slug": "monthly-estimate-add",
					"parent_id": null,
					"sort_order": 1,
					"level": 2,
					"badge": null,
					"status": 1
				},
				{
					"name": "List",
					"slug": "monthly-estimate-list",
					"parent_id": null,
					"sort_order": 2,
					"level": 2,
					"badge": null,
					"status": 1
				}
			]
		}
	]
}
```

### Key Points:
- Use **full parent object** (with `name`, `slug`) when creating NEW parent
- `children` array contains level 1 menus
- `grandchildren` array (inside each child) contains level 2 menus
- All `parent_id` fields should be `null` - backend sets them automatically
- Backend matches existing menus by `slug` - if slug exists, it updates; if not, it creates
- **Maximum 3 levels supported**: Parent (0) → Child (1) → Grandchild (2)

---

## Scenario 2: Parent + Children (with or without Grandchildren)

**Use Case**: Adding children (with optional grandchildren) to an **EXISTING** parent menu

**When to Use**: Parent menu already exists - you're adding new children under it

**Key Difference from Scenario 1**: 
- Scenario 1: Creating NEW parent from scratch
- Scenario 2: Adding to EXISTING parent (use `parent.id`)

### Example 1: SKU Mapping under Ops Admin (with grandchildren)

```json
{
	"parent": {
		"id": 13
	},
	"children": [
		{
			"name": "SKU Mapping",
			"slug": "sku-mapping",
			"sort_order": 2,
			"level": 1,
			"status": 1,
			"grandchildren": [
				{
					"name": "Add Mapping",
					"slug": "add-sku-mapping",
					"sort_order": 1,
					"level": 2,
					"status": 1
				},
				{
					"name": "SKU Listing",
					"slug": "sku-listing",
					"sort_order": 2,
					"level": 2,
					"status": 1
				}
			]
		}
	]
}
```

**Key Rules**:
- Use `parent.id` when parent **already exists** (most common case)
- Use full `parent` object only when creating **new parent**
- The `grandchildren` array goes **inside** the child object, not as a separate array
- If child slug already exists, backend will update it with new grandchildren

### Alternative: Creating New Parent with Children Only (No Grandchildren)

```json
{
	"parent": {
		"name": "Analytics",
		"slug": "analytics",
		"parent_id": null,
		"sort_order": 5,
		"level": 0,
		"badge": null,
		"status": 1
	},
	"children": [
		{
			"name": "Revenue Reports",
			"slug": "analytics-revenue",
			"parent_id": null,
			"sort_order": 1,
			"level": 1,
			"badge": null,
			"status": 1
		},
		{
			"name": "Trend Analysis",
			"slug": "analytics-trends",
			"parent_id": null,
			"sort_order": 2,
			"level": 1,
			"badge": null,
			"status": 1
		}
	]
}
```

**Note**: This example shows parent + children only (no grandchildren). If you need grandchildren, add the `grandchildren` array **inside** each child object.

---

## Scenario 3: Adding Children to Existing Parent

**Use Case**: Parent menu already exists, you want to add new children (e.g., adding Review Category Type under Revenue)

### Example: Adding Review Category Type under Revenue

```json
{
	"parent": {
		"id": 39
	},
	"children": [
		{
			"name": "Review Category Type",
			"slug": "review-category-type",
			"sort_order": 2,
			"level": 2,
			"status": 1
		}
	]
}
```

### Key Points:
- **Always use `parent.id`** when parent already exists (never use full parent object)
- **Only include NEW menus** in `children` array (don't include existing siblings)
- Backend will automatically set `parent_id` to the parent's ID
- `level` calculation: Child level = Parent level + 1
  - Example: Revenue (level 1) → Review Category Type (level 2)
- `sort_order` determines display order (2 places it after Review Cost Type which has sort_order: 1)
- If child slug already exists, backend will update it (may overwrite existing data)

### Real-World Example Structure:

```
Ops Admin (id: 13, level: 1)
└── Revenue (id: 39, level: 1)
    ├── Review Cost Type (id: 40, level: 2, sort_order: 1)
    └── Review Category Type (new, level: 2, sort_order: 2) ← Adding this
```

---

## Scenario 4: Adding Grandchildren to Existing Child

**Use Case**: Parent and child menus exist, you want to add grandchildren (e.g., adding "Edit" under Monthly Estimate)

### Example: Adding "Edit" under Monthly Estimate

```json
{
	"parent": {
		"id": 34
	},
	"children": [
		{
			"name": "Monthly Estimate",
			"slug": "monthly-estimate",
			"sort_order": 1,
			"level": 1,
			"status": 1,
			"grandchildren": [
				{
					"name": "Edit",
					"slug": "monthly-estimate-edit",
					"sort_order": 3,
					"level": 2,
					"status": 1
				}
			]
		}
	]
}
```

### Key Points:
- Use `parent.id` to reference the existing child menu (Monthly Estimate has id: 34)
- **Must include the child menu** in `children` array with its `slug` (backend matches by slug)
- Add **only NEW grandchildren** in the `grandchildren` array
- Backend will match existing child by slug and add the new grandchildren
- If grandchild slug already exists, backend will update it (may overwrite existing data)
- **Important**: You must include the child's `slug` even though it exists - this is how backend identifies which child to add grandchildren to

### Real-World Example Structure:

```
Revenue (id: 33, level: 0)
└── Monthly Estimate (id: 34, level: 1)
    ├── Add (id: 35, level: 2, sort_order: 1)
    ├── List (id: 36, level: 2, sort_order: 2)
    └── Edit (new, level: 2, sort_order: 3) ← Adding this
```

---

## API Response Format

### Success Response

```json
{
  "status_code": 200,
  "status": "Success",
  "message": "Menu hierarchy created successfully",
  "data": {
    "parent": {
      "id": 39,
      "name": "Revenue",
      "slug": "ops-admin-revenue",
      "parent_id": 13,
      "level": 1,
      "status": 1
    },
    "children": [
      {
        "id": 41,
        "name": "Review Category Type",
        "slug": "review-category-type",
        "parent_id": 39,
        "level": 2,
        "status": 1
      }
    ]
  }
}
```

### Error Responses

| Status Code | Error | Cause | Solution |
|-------------|-------|-------|----------|
| `400` | Bad Request | Invalid payload structure or missing required fields | Check JSON structure, ensure all required fields present |
| `401` | Unauthorized | Invalid or expired token | Refresh token, check Authorization header |
| `404` | Not Found | `parent.id` doesn't exist | Verify parent ID from `/api/menus` endpoint |
| `409` | Conflict | Slug already exists globally | Use different slug or update existing menu via different endpoint |
| `500` | Internal Server Error | Server-side error | Check server logs, contact backend team |

### Duplicate Slug Behavior

**What Happens**: If a slug already exists:
- Backend will **update** the existing menu with new values from your payload
- This applies to parent, children, and grandchildren
- **Warning**: This may overwrite existing menu data unintentionally

**Best Practice**: Always check if slug exists before creating, or use unique slugs.

---

## Field Reference

### Parent Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | Conditional | Use when parent exists. Get from `/api/menus` |
| `name` | string | Conditional | Use when creating new parent |
| `slug` | string | Conditional | Use when creating new parent. Must be unique |
| `parent_id` | number \| null | Optional | Set to `null` for root menus |
| `sort_order` | number | Optional | Display order (default: 1) |
| `level` | number | Optional | 0=root, 1=child, 2=grandchild |
| `badge` | string \| null | Optional | Badge text (default: null) |
| `status` | number | Optional | 1=Active, 0=Inactive (default: 1) |

### Child Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Required | Menu display name |
| `slug` | string | Required | Unique identifier. Backend matches existing by slug |
| `parent_id` | number \| null | Optional | Set to `null` - backend sets automatically |
| `sort_order` | number | Required | Display order within same level |
| `level` | number | Required | 1=child, 2=grandchild |
| `badge` | string \| null | Optional | Badge text (default: null) |
| `status` | number | Optional | 1=Active, 0=Inactive (default: 1) |
| `grandchildren` | array | Optional | Array of grandchild objects (only if adding grandchildren) |

### Grandchild Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Required | Menu display name |
| `slug` | string | Required | Unique identifier |
| `parent_id` | number \| null | Optional | Set to `null` - backend sets automatically |
| `sort_order` | number | Required | Display order within same level |
| `level` | number | Required | Always `2` for grandchildren |
| `badge` | string \| null | Optional | Badge text (default: null) |
| `status` | number | Optional | 1=Active, 0=Inactive (default: 1) |

---

## Common Mistakes

### ❌ Mistake 1: Using Wrong Parent ID

**Wrong**:
```json
{
	"parent": {
		"id": 13  // Ops Admin ID
	},
	"children": [
		{
			"name": "Review Category Type",
			"slug": "review-category-type",
			"level": 2  // Wrong! Should be child of Revenue, not Ops Admin
		}
	]
}
```

**Correct**:
```json
{
	"parent": {
		"id": 39  // Revenue ID (child of Ops Admin)
	},
	"children": [
		{
			"name": "Review Category Type",
			"slug": "review-category-type",
			"level": 2  // Correct! Grandchild of Ops Admin
		}
	]
}
```

### ❌ Mistake 2: Including Existing Menus in Children Array

**Wrong**:
```json
{
	"parent": {
		"id": 39
	},
	"children": [
		{
			"name": "Review Cost Type",  // Already exists!
			"slug": "review-cost-type",
			"sort_order": 1,
			"level": 2,
			"status": 1
		},
		{
			"name": "Review Category Type",  // New menu
			"slug": "review-category-type",
			"sort_order": 2,
			"level": 2,
			"status": 1
		}
	]
}
```

**Correct**: Only include the new menu
```json
{
	"parent": {
		"id": 39
	},
	"children": [
		{
			"name": "Review Category Type",
			"slug": "review-category-type",
			"sort_order": 2,
			"level": 2,
			"status": 1
		}
	]
}
```

### ❌ Mistake 3: Wrong Level Value

**Wrong**:
```json
{
	"parent": {
		"id": 39  // Revenue (level 1)
	},
	"children": [
		{
			"name": "Review Category Type",
			"slug": "review-category-type",
			"level": 1  // Wrong! Should be 2 (grandchild)
		}
	]
}
```

**Correct**:
```json
{
	"parent": {
		"id": 39
	},
	"children": [
		{
			"name": "Review Category Type",
			"slug": "review-category-type",
			"level": 2  // Correct! Grandchild level
		}
	]
}
```

### ❌ Mistake 4: Setting parent_id Manually

**Wrong**:
```json
{
	"children": [
		{
			"name": "Review Category Type",
			"slug": "review-category-type",
			"parent_id": 39,  // Don't set this manually!
			"level": 2,
			"status": 1
		}
	]
}
```

**Correct**: Let backend set it automatically
```json
{
	"parent": {
		"id": 39
	},
	"children": [
		{
			"name": "Review Category Type",
			"slug": "review-category-type",
			"parent_id": null,  // Or omit it - backend sets automatically
			"level": 2,
			"status": 1
		}
	]
}
```

### ❌ Mistake 5: Missing Child Slug in Scenario 4

**Wrong**: When adding grandchildren, forgetting to include child's slug
```json
{
	"parent": {
		"id": 34
	},
	"children": [
		{
			"grandchildren": [  // Missing child name/slug!
				{
					"name": "Edit",
					"slug": "monthly-estimate-edit",
					"sort_order": 3,
					"level": 2,
					"status": 1
				}
			]
		}
	]
}
```

**Correct**: Must include child menu with slug so backend can match it
```json
{
	"parent": {
		"id": 34
	},
	"children": [
		{
			"name": "Monthly Estimate",  // Required!
			"slug": "monthly-estimate",   // Required! Backend matches by this
			"sort_order": 1,
			"level": 1,
			"status": 1,
			"grandchildren": [
				{
					"name": "Edit",
					"slug": "monthly-estimate-edit",
					"sort_order": 3,
					"level": 2,
					"status": 1
				}
			]
		}
	]
}
```

---

## Quick Reference: Decision Tree

```
Do you want to create a NEW parent menu?
├─ YES → Use Scenario 1 (include full parent object with name/slug)
└─ NO → Parent already exists
    ├─ Do you want to add grandchildren to existing child?
    │   ├─ YES → Use Scenario 4 (include child with slug + grandchildren)
    │   └─ NO → Use Scenario 3 (just add new children)
    └─ Do you want to add children with grandchildren to existing parent?
        └─ YES → Use Scenario 2 (use parent.id + children with grandchildren)
```

## When to Use parent.id vs Full Parent Object

**Use `parent.id`** ✅:
- Parent menu already exists in database
- You're adding children or grandchildren to it
- Example: Adding Review Category Type under Revenue (Revenue exists)

**Use Full Parent Object** ✅:
- Creating a completely new parent menu
- Parent doesn't exist yet
- Example: Creating new "Analytics" menu from scratch

**Rule of Thumb**: If you got the ID from `/api/menus`, use `parent.id`. If parent doesn't exist, use full object.

---

## After Creating Menus

### Step 1: Update Frontend Config

Update `src/config/menuConfig.ts` to add the new menu items:

```typescript
{
	id: 'review-category-type',
	name: 'Review Category Type',
	icon: FileText,
	href: '/ops-admin/revenue/review-category-type',
}
```

### Step 2: Add Route

Update `src/config/routes.tsx`:

```typescript
import { ReviewCategoryType } from '../pages/ReviewCategoryType';

// Add to routes array
{ path: '/ops-admin/revenue/review-category-type', component: ReviewCategoryType },
```

### Step 3: Verify Menu Permissions

Check that menu permissions are set correctly for user types via the Menu Management page.

---

## Troubleshooting

### Issue: 404 - Parent Not Found

**Symptoms**: API returns 404 error

**Causes**:
- Invalid `parent.id` (ID doesn't exist)
- Wrong parent ID used

**Solution**:
1. Call `GET /api/menus` to verify parent exists
2. Check the `id` field in the response
3. Ensure you're using the correct parent level (don't use grandparent ID for parent)

### Issue: 409 - Slug Already Exists

**Symptoms**: API returns 409 Conflict error

**Causes**:
- Slug is already used by another menu (globally unique constraint)

**Solution**:
1. Check existing menus: `GET /api/menus`
2. Use a different slug (e.g., `review-category-type-v2`)
3. Or update existing menu via different endpoint if that's the intent

### Issue: Wrong Level Value

**Symptoms**: Menu created but appears at wrong hierarchy level

**Causes**:
- Level value doesn't match parent's level + 1

**Solution**:
1. Check parent's level from `/api/menus` response
2. Child level = Parent level + 1
3. Example: Parent level 1 → Child level 2

### Issue: Menu Not Appearing in Sidebar

**Symptoms**: Menu created successfully but doesn't show in UI

**Causes**:
- Not added to `menuConfig.ts`
- Route not added to `routes.tsx`
- Menu permissions not set

**Solution**:
1. Add menu to `src/config/menuConfig.ts`
2. Add route to `src/config/routes.tsx`
3. Set menu permissions via Menu Management page
4. Refresh browser and check user permissions

### Issue: Duplicate Menus Created

**Symptoms**: Same menu appears multiple times

**Causes**:
- Included existing menus in `children` array
- Called API multiple times with same payload

**Solution**:
- Only include NEW menus in `children` array
- Check existing menus before creating

---

## Examples Summary

| Scenario | Parent Format | Children Format | When to Use |
|----------|---------------|-----------------|-------------|
| **Full Hierarchy** | Full object with name/slug | Array with grandchildren | Creating NEW parent from scratch |
| **Parent + Children (with grandchildren)** | `{ "id": number }` | Array with grandchildren inside child objects | Adding to EXISTING parent with grandchildren |
| **Parent + Children (no grandchildren)** | Full object or `{ "id": number }` | Array without grandchildren | Simple 2-level menu (new or existing parent) |
| **Add to Existing Parent** | `{ "id": number }` | Array with new children only | Adding siblings to existing menu |
| **Add Grandchildren** | `{ "id": number }` | Array with child + grandchildren | Adding children to existing child |

---

**Last Updated**: 2025-01-XX  
**API Endpoint**: `POST /api/menus/hierarchy`  
**Backend Function**: `createMenuHierarchy`

