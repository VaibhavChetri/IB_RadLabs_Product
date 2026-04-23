# SKU Map Listing

## What is This Page?

This page shows all mappings between containers and clients. You can see what containers belong to which client and filter by client or status.

## How to Use

### Step 1: Select a Client

1. Open the client dropdown
2. See list of all clients
3. Select a client
4. Table shows all mappings for that client

**Note**: You must select a client to see the data.

### Step 2: Filter by Status (Optional)

1. Open the status dropdown
2. Choose one:
   - **Enabled**: Shows only active mappings
   - **Disabled**: Shows only inactive mappings
3. Table updates to show filtered results

**Note**: If no status selected, shows all mappings.

### Step 3: View the Data

Table shows these columns:

- **Edit button** - Click to open edit page
- **Client Name** - Name of the client
- **Container Type** - Name of the container
- **Impact Type** - Water Inefficiency, Single use PP, or Clamshell
- **Status** - Enabled or Disabled
- **Price** - Price of the container
- **Distance From Warehouse** - If applicable (Water Inefficiency only)
- **Plates Washed Per Cycle** - If applicable (Water Inefficiency only)
- **Disposable Weight** - If applicable (Single use PP only)
- **Qty Transported in 1 EV** - If applicable (Single use PP only)
- **Weight** - If applicable (Clamshell only)
- **Number of Clamshell** - If applicable (Clamshell only)

**Note**: Only relevant columns show based on impact type.

### Step 4: Edit a Mapping

1. Click the **Edit** button on any row
2. Edit page opens with data pre-filled
3. Make your changes
4. Click Update
5. Page redirects back to listing

### Step 5: Change Filters

1. Select different client from dropdown
2. Or change status filter
3. Table updates to show new data

## Example Workflow

```
1. Open "SKU Mapping Listing" page
2. Select "Client ABC" from client dropdown
3. Select "Enabled" from status dropdown
4. Table shows 5 mappings for Client ABC
5. Click Edit on "Black Bowl Melamine" row
6. Change price from 7.80 to 8.50
7. Click Update
8. Redirected back to listing page
9. Table shows updated price
```

## What the Table Shows

### For Water Inefficiency Clients

- Container Type
- Status
- Price
- Distance From Warehouse
- Plates Washed Per Cycle

### For Single use PP Clients

- Container Type
- Status
- Price
- Disposable Weight
- Qty Transported in 1 EV

### For Clamshell Clients

- Container Type
- Status
- Price
- Weight
- Number of Clamshell

## Understanding the Data

### Status Field

- **Enabled**: Mapping is active and used in calculations
- **Disabled**: Mapping exists but is not active

### Impact Type

Shows which type of mapping:

- **Water Inefficiency** - Reusable containers (bowls, plates)
- **Single use PP** - Disposable containers
- **Clamshell** - Clamshell containers

## Important Notes

- Client dropdown required to see any data
- One row per container type per client
- Status filter is optional
- Edit button appears on every row
- Table updates when filters change

## API Call

When you select a client, the page calls:
```
GET /api/inventory/getClientSkuMap?clientId={clientId}
```

Response shows all mappings for that client.

## File Location

- Page: `src/pages/SkuMapListing.tsx`
- API: `src/services/skuApi.ts`
- Route: `/ops-admin/map-sku/listing`

