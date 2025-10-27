# KAM Section

## Start Here
👉 **Read the [KAM Overview](./00-KAM-Overview.md) first**

It explains everything in simple English.

## Pages

1. **Client Listing** - See all clients
   - Shows clients you need to enter data for
   - Shows how many are done and how many are pending
   - Click on client name to enter details
   - See: [Client Listing Details](./01-Client-Listing.md)

2. **Client Inventory Details** - Enter container data
   - Shows containers for one client
   - Enter opening stock, dispatch, and returned numbers
   - Closing is calculated automatically
   - Your data is saved even if you refresh the page
   - See: [Client Inventory Details](./02-Client-Inventory-Details.md)

3. **Inventory Client Listing** - View historical data
   - See all inventory data for any date range
   - Filter by client
   - See dispatch and returned statistics
   - See: [Inventory Client Listing](./03-Inventory-Client-Listing.md)

## How to Use

1. Go to Client page
2. Pick a date
3. See your clients
4. Click on a client
5. Enter the numbers
6. Click Save
7. Done!

## Where Data Goes

- **Redux Store**: All data stored in Redux (application memory)
- **Local Storage**: Your draft is saved as you type
- **API**: Data is sent to the server when you click Save

## Files in Code

- Pages: `src/pages/ClientListing.tsx`, `ClientInventoryDetails.tsx`, `InventoryListing.tsx`
- API: `src/services/kamApi.ts`
- Redux: `src/store/slices/kamSlice.ts`
- Menu Config: `src/config/menuConfig.ts`
