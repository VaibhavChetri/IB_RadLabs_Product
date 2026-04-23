# Add Client SKU Mapping

## What is This Page?

This page lets you map containers to a client. You tell the system which containers this client uses and what details are needed.

## How to Use

### Step 1: Select a Client

1. Open the client dropdown
2. See list of all clients
3. Click on a client name
4. Page shows what type of containers this client uses

**Note**: Page shows nothing until you select a client.

### Step 2: Enter Constant Fields

These fields appear for every client at the top of the form:

- **Electricity consumed per dishwasher**: Default is 0.4840 (you can change it)
- **Water consumed per cycle**: Default is 4 (you can change it)

### Step 3: See What Table Shows

Based on the client's impact type, you see different tables:

#### Water Inefficiency Clients

**Header fields** (shown above table):
- None (uses constant fields only)

**Table columns**:
1. Container type - Dropdown to choose container
2. Status - Shows from API (you cannot change)
3. Price - Enter the price
4. Select SKU - Checkbox to combine containers
5. Distance From Warehouse - Enter distance in km
6. Plates washed per cycle - Enter number of plates

#### Single use PP Clients

**Header fields** (shown above table):
- Distance travelled from vendor - Enter distance
- Qty transported in one trip - Enter quantity

**Table columns**:
1. Container type - Dropdown to choose container
2. Status - Shows from API
3. Price - Enter the price
4. Select SKU - Checkbox to combine containers
5. Disposable weight - Enter weight in grams
6. Qty transported in 1 EV - Enter quantity

#### Clamshell Clients

**Header fields** (shown above table):
- Distance travelled from vendor - Enter distance
- Qty transported in one trip - Enter quantity

**Table columns**:
1. Container type - Dropdown to choose container
2. Status - Shows from API
3. Price - Enter the price
4. Select SKU - Checkbox to combine containers
5. Weight - Enter weight in grams
6. Number of clamshell - Enter count

### Step 4: Add Rows to Table

1. Click the **+** button at the top of the table
2. New empty row appears
3. Fill in the details for that row

### Step 5: Enter Details

1. Choose container type from dropdown
2. Status appears automatically (from API)
3. Enter price
4. Check "Select SKU" if you want to combine this container
5. Enter the impact-specific fields

**Important**: You can only add each container type once. If already added, it won't show in the dropdown.

### Step 6: Delete a Row

1. Click the delete button on any row
2. Row is removed from the table
3. You can add a different container type

### Step 7: Save the Mapping

1. Click the **Save** button
2. Data is sent to the server
3. Success message appears
4. You can add more containers or go to listing page

## Example Workflow

```
1. Open "Add Client SKU Mapping" page
2. Select "Client ABC" from dropdown
3. System shows "Water Inefficiency" table
4. Click + button to add row
5. Select "Black Bowl Melamine (530ml)" from dropdown
6. Enter price: 7.80
7. Enter distance: 60
8. Enter plates per cycle: 12
9. Check "Select SKU" checkbox
10. Click Save
11. Success! Mapping saved
```

## Common Fields Explained

- **Container type**: What kind of container (bowl, plate, etc.)
- **Status**: Whether container is active (from API)
- **Price**: Cost of the container
- **Select SKU**: If checked, multiple containers combined into one SKU
- **Distance**: How far from warehouse or vendor in kilometers
- **Weight**: How heavy in grams
- **Plates per cycle**: How many items washed at once
- **Qty transported**: How many fit in one vehicle

## What Happens When You Save?

1. Data is validated (empty fields become 0)
2. Data is formatted for API
3. API call is made to save the mapping
4. If successful, success message shows
5. If error, error message shows

## Important Notes

- Client dropdown filters to active clients only
- Cannot add same container type twice
- Empty fields are saved as 0
- Price should be a number
- All distance fields are in kilometers
- All weight fields are in grams

## File Location

- Page: `src/pages/AddClientSkuMapping.tsx`
- API: `src/services/skuApi.ts`
- Route: `/ops-admin/map-sku/add`

