# Client Inventory Details

## Overview
The Client Inventory Details page allows users to view and update inventory data for a specific client on a selected date. This page is accessed by clicking on a client name from the Client Listing page.

## Page Flow
1. User selects a date in **Client Listing** page
2. User clicks on a client name (hyperlinked)
3. Navigates to **Client Inventory Details** page with the selected date
4. Page displays container types with input fields for inventory operations
5. User can update values and submit changes

## Page Structure

### Header
- **Title**: Client name (e.g., "V Cateres Kitchen Bandra")
- **Location**: User's city name from Redux (e.g., "Mumbai")
- **Total Items**: Number of container types
- **Icon**: 📦

### Main Content
A table displaying container types and their inventory values:

| Column | Description | Editable |
|--------|-------------|----------|
| Container Type | Name of the container | No (display only) |
| Opening | Opening stock quantity | Yes |
| Dispatch | Dispatch quantity | Yes |
| Returned | Returned quantity | Yes |
| Closing | Closing stock (auto-calculated) | No (disabled) |

### Footer
- **Submit Button**: Saves changes and navigates back to Client Listing

## Data Flow

### Loading Data
1. Page receives `clientId` from URL params
2. Page receives `selectedDate` from navigation state (from Client Listing)
3. API call: `GET /billing/getEverydayClientInventory?client_id={clientId}&start_date={date}&end_date={date}`
4. Response is stored in Redux (`state.kam.clientInventory`)

### Displaying Data
1. Data is rendered in a table using the `Table` component
2. Input fields are pre-filled with existing values or "0" if empty
3. Any edits are stored in `editedData` state
4. Edits are persisted to localStorage using key `kam_client_inventory_draft_{clientId}`

### Submitting Data
1. User clicks "Submit" button
2. Data validation converts **empty/null values to 0**
3. Payload is formatted as:
```json
{
  "clients": [
    {
      "id": 127847,
      "client_id": 88,
      "container_type_id": 142,
      "opening_stock": 0,
      "dispatch": 0,
      "returned": 30,
      "closing": 30
    }
  ]
}
```
4. API call: `PUT /billing/updateEverydayClientInventory`
5. On success:
   - Clear localStorage draft
   - Show success message
   - Navigate back to Client Listing after 1.5 seconds

## Technical Details

### State Management
- **Redux**: Inventory data and loading state
- **Local State**: 
  - `editedData` - User modifications
  - `snackbar` - Success/error messages

### Key Features
1. **Local Storage Persistence**: Form data persists across page refreshes
2. **Auto-calculation**: Closing stock is calculated automatically (disabled field)
3. **Null Safety**: All empty/null values are converted to 0 before submission
4. **Date Inheritance**: Date is passed from Client Listing, not editable on this page

### API Endpoints

#### Get Inventory Data
```
GET /billing/getEverydayClientInventory
Query Params:
- client_id: number
- start_date: string (YYYY-MM-DD)
- end_date: string (YYYY-MM-DD)
```

#### Update Inventory Data
```
PUT /billing/updateEverydayClientInventory
Body: { "clients": [...] }
```

## Error Handling
- If inventory data is not available, shows error message in snackbar
- Failed API submissions display error details in the snackbar
- All errors are logged to console for debugging
