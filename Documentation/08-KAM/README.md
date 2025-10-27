# KAM (Key Account Management) Section

## Overview

The KAM section provides comprehensive client inventory management capabilities for tracking and managing container inventory across all clients. This section includes three interconnected pages designed for efficient data entry and monitoring.

## Navigation Flow

```
📊 KAM Menu
├─ 👥 Client                    → /kam/clients
└─ 📦 Inventory Client Listing  → /kam/inventory

Client Listing Page:
├─ Click client name
└─ → Client Inventory Details Page (/kam/clients/:clientId)
```

## Pages

### 1. Client Listing (`/kam/clients`)
- **Purpose**: List all clients with pending inventory entries
- **Key Features**:
  - Single date filter (defaults to today)
  - Displays client statistics (pending/total)
  - Clickable client names for navigation
  - Pagination support

**Related Documentation**: [Client Listing Details](./01-Client-Listing.md)

### 2. Client Inventory Details (`/kam/clients/:clientId`)
- **Purpose**: Enter and edit inventory values for a specific client
- **Key Features**:
  - Date range filter (from/to dates)
  - Grid layout of container types
  - Editable fields: Opening Stock, Dispatch, Returned
  - Auto-calculated Closing stock
  - Local storage persistence (prevents data loss on refresh)
  - PUT API submission

**Related Documentation**: [Client Inventory Details](./02-Client-Inventory-Details.md)

### 3. Inventory Client Listing (`/kam/inventory`)
- **Purpose**: Comprehensive listing of all inventory entries across all clients
- **Key Features**:
  - Date range filter
  - Client dropdown filter (from `/inventory/getClientByCity`)
  - Stats cards (Total Dispatch, Total Returned, Net Change, Pending Entries)
  - Full table with column management
  - Sorting and pagination

**Related Documentation**: [Inventory Client Listing](./03-Inventory-Client-Listing.md)

## Technical Architecture

### State Management (Redux Toolkit)
- All API responses stored in Redux for global access
- Separate loading states for each page
- Type-safe with TypeScript interfaces

**Redux Slice**: `src/store/slices/kamSlice.ts`
**Store Integration**: `src/store/index.ts` (kamReducer)

### API Services
**File**: `src/services/kamApi.ts`

**Methods**:
- `getInventoryClientPlan()` - Fetch client listing
- `getEverydayClientInventory()` - Fetch client inventory details
- `updateEverydayClientInventory()` - Update inventory (PUT)
- `getEverydayClientInventoryValues()` - Fetch inventory listing

### Local Storage
**Client Inventory Details Page**:
- Key format: `kam_client_inventory_draft_${clientId}`
- Auto-saves on every input change
- Loads on page mount
- Clears after successful submission

## Data Flow

```
User Action
    ↓
API Call
    ↓
Dispatch to Redux
    ↓
Component Re-renders
    ↓
[Forms Only] Local Storage
```

## Key Features

### Redux Integration
✅ All API responses stored in Redux
✅ Centralized state accessible anywhere
✅ Separation of concerns (state vs UI)
✅ Loading states for each data set
✅ Type-safe with TypeScript interfaces

### Local Storage Persistence
✅ Form data auto-saved on every change
✅ Prevents data loss on accidental refresh
✅ Client-specific storage keys
✅ Cleared after successful submission
✅ JSON serialization for complex data

### Industry Best Practices
✅ Redux Toolkit for state management
✅ Consistent API service pattern
✅ Type-safe TypeScript interfaces
✅ Loading and error states
✅ Optimistic updates with rollback
✅ Data validation before submission

## Creating the KAM Menu in Database

The KAM menu is created using the `/menus/hierarchy` endpoint which creates the entire menu hierarchy (parent + children) in a single API call.

### cURL Command

```bash
curl --location 'localhost:3099/v1/api/menus/hierarchy' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_TOKEN_HERE' \
--header 'Cookie: refreshToken=YOUR_REFRESH_TOKEN_HERE' \
--data '{
  "parent": {
    "name": "KAM",
    "slug": "kam",
    "parent_id": null,
    "sort_order": 10,
    "level": 0,
    "badge": null,
    "status": 1
  },
  "children": [
    {
      "name": "Client",
      "slug": "kam-clients",
      "parent_id": null,
      "sort_order": 1,
      "level": 1,
      "badge": null,
      "status": 1
    },
    {
      "name": "Inventory Client Listing",
      "slug": "kam-inventory",
      "parent_id": null,
      "sort_order": 2,
      "level": 1,
      "badge": null,
      "status": 1
    }
  ]
}'
```

### Postman Request Format

**Endpoint**: `POST /menus/hierarchy`

**Headers**:
- `Content-Type: application/json`
- `Authorization: Bearer <access_token>`
- `Cookie: refreshToken=<refresh_token>`

**Body** (raw JSON):
```json
{
  "parent": {
    "name": "KAM",
    "slug": "kam",
    "parent_id": null,
    "sort_order": 10,
    "level": 0,
    "badge": null,
    "status": 1
  },
  "children": [
    {
      "name": "Client",
      "slug": "kam-clients",
      "parent_id": null,
      "sort_order": 1,
      "level": 1,
      "badge": null,
      "status": 1
    },
    {
      "name": "Inventory Client Listing",
      "slug": "kam-inventory",
      "parent_id": null,
      "sort_order": 2,
      "level": 1,
      "badge": null,
      "status": 1
    }
  ]
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Display name in menu |
| `slug` | string | Yes | URL-friendly identifier (unique) |
| `parent_id` | null | Yes | Always null for hierarchy endpoint (backend handles linking) |
| `sort_order` | number | No | Display order (lower = appears first) |
| `level` | number | Yes | Hierarchy level (0=parent, 1=child, 2=grandchild) |
| `badge` | null | No | Optional badge text (use null) |
| `status` | number | No | 1 = Active, 0 = Inactive (default: 1) |

### Creating Other Menu Hierarchies

For 3-level hierarchies (parent → child → grandchild), add `grandchildren` array:

```json
{
  "parent": {
    "name": "Parent Menu",
    "slug": "parent-menu",
    "parent_id": null,
    "sort_order": 1,
    "level": 0,
    "badge": null,
    "status": 1
  },
  "children": [
    {
      "name": "Child Menu",
      "slug": "child-menu",
      "parent_id": null,
      "sort_order": 1,
      "level": 1,
      "badge": null,
      "status": 1,
      "grandchildren": [
        {
          "name": "Grandchild Menu",
          "slug": "grandchild-menu",
          "parent_id": null,
          "sort_order": 1,
          "level": 2,
          "badge": null,
          "status": 1
        }
      ]
    }
  ]
}
```

## Getting Started

1. **Access Client Listing**: Navigate to `/kam/clients`
2. **Select a date**: Choose the date for pending clients
3. **View client list**: See all clients with pending entries
4. **Click client name**: Navigate to inventory details
5. **Enter inventory values**: Fill in opening stock, dispatch, returned
6. **Closing is auto-calculated**: Formula: `openingStock + returned - dispatch`
7. **Submit**: Data is saved via PUT API and page navigates back

## Related Documentation

- [Client Listing Documentation](./01-Client-Listing.md)
- [Client Inventory Details Documentation](./02-Client-Inventory-Details.md)
- [Inventory Client Listing Documentation](./03-Inventory-Client-Listing.md)

