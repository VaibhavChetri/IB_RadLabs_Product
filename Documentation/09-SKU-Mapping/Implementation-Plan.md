# Client SKU Mapping - Implementation Plan

## What is This?

This plan creates a system for mapping containers to clients. It shows under "Ops Admin" in the menu.

The system has three pages:
1. Add page - Map containers to a client
2. Edit page - Change existing mappings
3. Listing page - See all mappings

## How It Works

Different clients need different containers. For example:
- Some clients use reusable containers (Water Inefficiency)
- Some clients use disposable containers (Single use PP)
- Some clients use clamshell containers

The system shows different forms based on what the client needs.

## Step 1: Create API Service

Create a new file: `src/services/skuApi.ts`

This file will have four functions:
- Get list of clients
- Get mappings for a client
- Save new mappings
- Update existing mappings

**Status**: Done - file created with all functions

## Step 2: Create Menu

Go to Postman and create three menu items under "Ops Admin":

1. First, create "Container SKU Mapping" (parent menu)
2. Then create "Add Client SKU Mapping" (child menu)
3. Then create "SKU Mapping Listing" (child menu)

You need to know the Ops Admin menu ID first. Use `GET /menus` to find it.

See detailed Postman payloads in `Menu-Creation-Payloads.md`

**Status**: Not started

## Step 3: Create Add Page

Create a new file: `src/pages/AddClientSkuMapping.tsx`

### How the page works:

1. User selects a client from dropdown
2. Page shows what type of containers this client uses
3. User enters container details in a table
4. User clicks Save
5. Data is saved to the database

### What fields to show:

**Always show** (for all client types):
- Electricity used per dishwasher (default: 0.4840)
- Water used per cycle (default: 4)

**Show when needed**:
- Water Inefficiency clients: Distance from warehouse, Plates washed per cycle
- Single use PP clients: Distance from vendor, Qty transported
- Clamshell clients: Distance from vendor, Qty transported

### Table columns by type:

**Water Inefficiency:**
- Container Type
- Status
- Price
- Select SKU
- Distance From Warehouse
- Plates washed per cycle
- Delete button

**Single use PP:**
- Container Type
- Status
- Price
- Select SKU
- Disposable weight
- Qty transported in 1 EV
- Delete button

**Clamshell:**
- Container Type
- Status
- Price
- Select SKU
- Weight
- Number of clamshell
- Delete button

**Status**: Not started

## Step 4: Create Edit Page

Use the same page as Add page (`AddClientSkuMapping.tsx`)

But add a mode (edit vs add):
- In edit mode, load existing data
- In edit mode, lock the client dropdown (user cannot change client)
- When user clicks Save, update instead of create

The edit URL will be: `/ops-admin/map-sku/:clientId/edit`

**Status**: Not started

## Step 5: Create Listing Page

Create a new file: `src/pages/SkuMapListing.tsx`

### How the page works:

1. User selects a client from dropdown
2. Page loads all mappings for that client
3. User can filter by status (Enabled/Disabled)
4. User can click Edit on any row to go to Edit page

### What columns to show:

- Edit button
- Client Name
- Container Type
- Impact Type
- Status
- Price
- Distance From Warehouse (if applicable)
- Plates Washed Per Cycle (if applicable)
- Disposable Weight (if applicable)
- Qty Transported in 1 EV (if applicable)

**Status**: Not started

## Step 6: Add Routes

Add these three routes to `src/App.tsx`:

```typescript
/ops-admin/map-sku/add
/ops-admin/map-sku/:clientId/edit
/ops-admin/map-sku/listing
```

**Status**: Not started

## Step 7: Write Documentation

Create these files in `Documentation/09-SKU-Mapping/`:

1. `00-SKU-Mapping-Overview.md` - What is SKU mapping, why it's needed
2. `01-Add-Client-SKU-Mapping.md` - How to use the add page
3. `02-Edit-Client-SKU-Mapping.md` - How to use the edit page
4. `03-SKU-Map-Listing.md` - How to use the listing page
5. `README.md` - Links to all documentation

Write in simple, plain English like KAM documentation.

**Status**: Not started

## What Data to Send

When saving, send this format:

```json
{
  "user_id": 123,
  "clients": [
    {
      "id": 101,
      "containers": [
        {
          "container_type_id": 78,
          "price": 12.50,
          "platesWashedPerCycleByClient": 100,
          "distanceFromWarehouse": 5.5,
          "srcingDistance": 3.2,
          "weight_bagasse": 50,
          "srcQtyTransportedOneTripEv": 100,
          "qtyTransportedOneTrip": 150,
          "numberOfClamshell": 10,
          "electricityConsumedPerCycle": 2.5,
          "disposableWeight": 30,
          "waterConsumedPerCycle": 15,
          "combineSku": 0,
          "impact_type_id": 1
        }
      ]
    }
  ]
}
```

**Key points:**
- Send user_id from Redux
- Send client id
- Send array of containers
- combineSku is 0 or 1 (based on checkbox)
- All numbers should be numbers, not strings

## TODO List

### API Service
- [x] Created `src/services/skuApi.ts`

### Menu
- [ ] Get Ops Admin menu ID
- [ ] Create "Map SKU" menu in Postman
- [ ] Create "Map SKU to Client" menu in Postman
- [ ] Create "SKU Map Listing" menu in Postman
- [ ] Update menu config in code

### Pages
- [ ] Create Add page
- [ ] Create Edit page
- [ ] Create Listing page

### Routes
- [ ] Add routes to App.tsx

### Documentation
- [ ] Write all documentation files

## Important Points

- Each container type can only be added once per client
- Empty fields become zero when saved
- User must select a client before entering data
- Lock client dropdown when editing
- Show different tables based on client impact type
