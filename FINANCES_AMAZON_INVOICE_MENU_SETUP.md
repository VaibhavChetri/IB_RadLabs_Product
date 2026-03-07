# Finances > Amazon Invoice – Menu Setup

Use this to create the **Finances** parent menu and **Amazon Invoice** submenu via the backend API.

---

## Option A: Create new Finances parent + Amazon Invoice child (recommended)

Use when the **Finances** menu does not exist yet.

### Request

- **Method:** `POST`
- **URL:** `{{base_url}}/menus/hierarchy`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer {{auth_token}}`

### Body (raw JSON)

```json
{
  "parent": {
    "name": "Finances",
    "slug": "finances",
    "parent_id": null,
    "sort_order": 20,
    "level": 0,
    "badge": null,
    "status": 1
  },
  "children": [
    {
      "name": "Amazon Invoice",
      "slug": "amazon-invoice",
      "parent_id": null,
      "sort_order": 1,
      "level": 1,
      "badge": null,
      "status": 1
    }
  ]
}
```

**Postman:** Body → raw → JSON, paste the above. Replace `{{base_url}}` with your API base (e.g. `http://localhost:3099/v1/api`).

---

## Option B: Add Amazon Invoice under an existing Finances menu

Use when **Finances** already exists and you only need to add the child.

### Step 1: Get Finances menu ID

- **Method:** `GET`
- **URL:** `{{base_url}}/menus`
- **Headers:** `Authorization: Bearer {{auth_token}}`

In the response, find the menu with `"slug": "finances"` and note its `id` (e.g. `42`).

### Step 2: Add Amazon Invoice as child

- **Method:** `POST`
- **URL:** `{{base_url}}/menus/hierarchy`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer {{auth_token}}`

**Body (replace `YOUR_FINANCES_MENU_ID` with the id from Step 1):**

```json
{
  "parent": {
    "id": YOUR_FINANCES_MENU_ID
  },
  "children": [
    {
      "name": "Amazon Invoice",
      "slug": "amazon-invoice",
      "parent_id": null,
      "sort_order": 1,
      "level": 1,
      "badge": null,
      "status": 1
    }
  ]
}
```

---

## After creating the menu

1. **Refresh menu permissions**  
   Call `POST {{base_url}}/menus/permissions` (or your app’s “refresh permissions” flow) so the sidebar reflects the new menu.

2. **Grant access**  
   In Menu Management (or your permissions API), grant the right roles access to:
   - `finances` (parent)
   - `amazon-invoice` (child)

3. **Frontend**  
   The dashboard already has:
   - Route: `/finances/amazon-invoice` (list) and `/finances/amazon-invoice/:invoiceNumber` (detail).
   - Sidebar entry: **Finances → Amazon Invoice** (from `src/config/menuConfig.ts`).

---

## Postman collection snippet (create Finances + Amazon Invoice)

| Key        | Value                          |
|-----------|----------------------------------|
| Method    | POST                            |
| URL       | `http://localhost:3099/v1/api/menus/hierarchy` |
| Body type | raw (JSON)                      |

**Body:**

```json
{
  "parent": {
    "name": "Finances",
    "slug": "finances",
    "parent_id": null,
    "sort_order": 20,
    "level": 0,
    "badge": null,
    "status": 1
  },
  "children": [
    {
      "name": "Amazon Invoice",
      "slug": "amazon-invoice",
      "parent_id": null,
      "sort_order": 1,
      "level": 1,
      "badge": null,
      "status": 1
    }
  ]
}
```

Use the same URL with your environment’s base URL and add header: `Authorization: Bearer <your_jwt>`.
