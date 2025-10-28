# Edit Client SKU Mapping

## What is This Page?

This page lets you change existing mappings between containers and clients. The page is the same as Add page, but in "edit mode".

## How to Get Here

1. Go to SKU Mapping Listing page
2. Find the client you want to edit
3. Click **Edit** button on any row
4. Edit page opens with data already filled

## How It's Different from Add Page

### Client Dropdown is Locked

- You **cannot** change which client
- Dropdown shows the client name but it's disabled
- This prevents mistakes

### Data is Pre-filled

- All fields already have values
- You can change any value
- Changes are saved when you click Update

### Update Instead of Create

- Button says "Update" instead of "Save"
- Makes a PUT request instead of POST
- Updates the existing mapping

## How to Use

### Step 1: Page Loads

1. Edit page opens automatically
2. Client is locked
3. Constant fields show with current values
4. Table shows with all current rows

### Step 2: Modify Values

1. Change any field you want
2. Values update as you type
3. Changes are saved locally

### Step 3: Add More Rows

1. Click **+** button to add new row
2. New empty row appears
3. Fill in details for new container

**Note**: You still cannot add container types that already exist

### Step 4: Delete a Row

1. Click delete button on any row
2. Row is removed
3. This container won't be in the mapping anymore

### Step 5: Update the Mapping

1. Click the **Update** button
2. Data is sent to server
3. Success message appears
4. Redirects back to listing page

## Example Workflow

```
1. From listing page, click Edit on "Client ABC - Black Bowl" row
2. Edit page opens with current data
3. Change price from 7.80 to 8.50
4. Change plates per cycle from 12 to 15
5. Add new row for "White Bowl" container
6. Click Update button
7. Success! Redirected to listing page
```

## What Can You Change?

### Can Change

- Price of any container
- Distance values
- Weight values
- Plates per cycle
- Qty transported values
- Add new containers (if not already added)
- Delete existing containers

### Cannot Change

- Which client it belongs to
- Container type of existing row (must delete and re-add)
- Status (comes from API)

## Important Notes

- Client is locked to prevent changing the wrong mapping
- All other fields can be edited
- Changes are immediate (no draft state)
- Success means mapping is updated in database

## URL Format

Edit page URL looks like this:
```
/ops-admin/map-sku/:clientId/edit
```

For example: `/ops-admin/map-sku/149/edit`

## How It Works Behind the Scenes

1. Page loads with client ID from URL
2. API call fetches existing mapping data
3. Data is displayed in form
4. User makes changes
5. User clicks Update
6. Data is formatted and sent to API
7. Server updates the mapping
8. Success message shows

## File Location

- Page: `src/pages/AddClientSkuMapping.tsx` (edit mode)
- API: `src/services/skuApi.ts`
- Route: `/ops-admin/map-sku/:clientId/edit`

