# SKU Mapping Section

## Quick Links

- 📘 [Overview](./00-SKU-Mapping-Overview.md) - Start here to understand what this section does
- ➕ [Add Page](./01-Add-Client-SKU-Mapping.md) - How to create new mappings
- ✏️ [Edit Page](./02-Edit-Client-SKU-Mapping.md) - How to change existing mappings
- 📋 [Listing Page](./03-SKU-Map-Listing.md) - How to view all mappings
- 🔌 [API Reference](./04-API-Reference.md) - Technical API documentation

## Start Here

👉 **Read the [SKU Mapping Overview](./00-SKU-Mapping-Overview.md) first**

It explains everything in simple English.

## What is SKU Mapping?

SKU Mapping connects containers to specific clients. Each client has different container needs based on their impact type.

## Pages

### 1. Add Page
Map containers to a client for the first time.

- Select client from dropdown
- Enter container details in table
- Save the mapping
- See: [How to Add Client SKU Mapping](./01-Add-Client-SKU-Mapping.md)

### 2. Edit Page
Change existing mappings between containers and clients.

- Data is pre-filled
- Client is locked
- Update changes
- See: [How to Edit Client SKU Mapping](./02-Edit-Client-SKU-Mapping.md)

### 3. Listing Page
View all mappings for any client.

- Filter by client
- Filter by status
- Edit from table
- See: [SKU Map Listing](./03-SKU-Map-Listing.md)

## Impact Types

Clients are grouped by their impact type:

### Water Inefficiency
- Reusable containers (bowls, plates, crates)
- Tracks washing cycles and distance

### Single use PP
- Disposable containers
- Tracks weight and transportation

### Clamshell
- Clamshell containers
- Tracks weight and quantity

## How to Use

1. Go to SKU Mapping menu
2. Click "Add Mapping" to create new mappings
3. Click "SKU Listing" to view existing mappings
4. Click Edit button to change a mapping

## Workflow Example

```
1. Open "Add Client SKU Mapping" page
2. Select "Client ABC" from dropdown
3. System shows "Water Inefficiency" table
4. Click + button to add rows
5. Choose container types and enter details
6. Click Save
7. Go to "SKU Listing" page
8. Select same client
9. See the mappings you just created
10. Click Edit on any row to make changes
```

## Important Points

- Client dropdown shows all active clients
- Each container type can only be added once per client
- Different tables show based on impact type
- Empty fields become zero when saved
- Client is locked when editing

## Where Data Goes

- **Redux Store**: Stores loaded data temporarily
- **API**: Sends data when you save/update
- **Database**: Stores the final mapping

## Files in Code

- API Service: `src/services/skuApi.ts`
- Add Page: `src/pages/AddClientSkuMapping.tsx`
- Listing Page: `src/pages/SkuMapListing.tsx`
- Routes: `src/config/routes.tsx`
- Menu Config: `src/config/menuConfig.ts`

## API Reference

For detailed API documentation, see:
- [API Reference](./04-API-Reference.md)

## Menu Structure

SKU Mapping appears under "Ops Admin" menu:

```
Ops Admin
  └── SKU Mapping
       ├── Add Mapping (route: /ops-admin/map-sku/add)
       └── SKU Listing (route: /ops-admin/map-sku/listing)
```

Edit page route: `/ops-admin/map-sku/:clientId/edit`

