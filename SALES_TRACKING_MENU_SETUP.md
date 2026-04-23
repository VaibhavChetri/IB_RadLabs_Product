# Sales Menu - Tracking Submenus Setup

## Step 1: Get Sales Menu ID

**GET Request:**
```
GET http://localhost:3099/v1/api/menus
Authorization: Bearer YOUR_TOKEN
```

**Find in response:**
Look for menu with `slug: "sales"` and note its `id` (e.g., `id: 25`)

---

## Step 2: Add Tracking Submenus to Sales

**POST Request:**
```
POST http://localhost:3099/v1/api/menus/hierarchy
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**Body (replace `YOUR_SALES_MENU_ID` with the ID from Step 1):**

```json
{
	"parent": {
		"id": YOUR_SALES_MENU_ID
	},
	"children": [
		{
			"name": "My Leads",
			"slug": "my-leads",
			"parent_id": null,
			"sort_order": 2,
			"level": 1,
			"badge": null,
			"status": 1
		},
		{
			"name": "Today's Callbacks",
			"slug": "callbacks",
			"parent_id": null,
			"sort_order": 3,
			"level": 1,
			"badge": null,
			"status": 1
		},
		{
			"name": "Reports",
			"slug": "lead-reports",
			"parent_id": null,
			"sort_order": 4,
			"level": 1,
			"badge": null,
			"status": 1
		}
	]
}
```

---

## Step 3: Verify Menu Structure

After creating, the Sales menu should have:
- Sales (parent)
  - Leads (existing - sort_order: 1)
  - My Leads (new - sort_order: 2)
  - Today's Callbacks (new - sort_order: 3)
  - Reports (new - sort_order: 4)

---

## Step 4: Grant Permissions

After menu creation, grant permissions via Menu Management page or API:
- `sales` (parent) - access: true
- `leads` (existing child) - access: true
- `my-leads` (new child) - access: true
- `callbacks` (new child) - access: true
- `lead-reports` (new child) - access: true
