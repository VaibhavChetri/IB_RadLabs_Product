# Client Inventory Details Page

## Overview
The Client Inventory Details page (`/kam/clients/:clientId`) allows users to enter and edit inventory values (opening stock, dispatch, returned, closing) for all container types belonging to a specific client.

## Route
`/kam/clients/:clientId`

## API Integration

### GET Request (Load Data)
**Endpoint**: `/billing/getEverydayClientInventory`

**Query Parameters**:
- `client_id`: number - Client ID from route
- `start_date`: string (YYYY-MM-DD) - From date
- `end_date`: string (YYYY-MM-DD) - To date

**Example**:
```
GET /billing/getEverydayClientInventory?client_id=101&start_date=2024-09-03&end_date=2024-09-03
```

**Response Structure**:
```json
{
  "status_code": 200,
  "status": "Success",
  "data": [
    {
      "id": 903,
      "clientId": 101,
      "clientName": "Mahindra Finance Agastya",
      "openingStock": 6,
      "dispatch": 194,
      "returned": 31,
      "closing": 169,
      "containerTypeId": 78,
      "containerType": "3CP Packed Meal"
    }
  ]
}
```

### PUT Request (Submit Data)
**Endpoint**: `/billing/updateEverydayClientInventory`

**Request Payload**:
```json
[
  {
    "id": 903,
    "client_id": 101,
    "container_type_id": 78,
    "opening_stock": 6,
    "dispatch": 194,
    "returned": 31,
    "closing": 169
  }
]
```

**Expected Response**:
```json
{
  "status_code": 200,
  "status": "Success",
  "message": "Inventory updated successfully"
}
```

## Redux State

**Slice**: `kamSlice`
**State Path**: `state.kam.clientInventory`

**Structure**:
```typescript
{
  data: ClientInventoryRow[];
  loading: boolean;
}
```

## Local Storage

**Key Format**: `kam_client_inventory_draft_${clientId}`

**Purpose**: Persist form edits across page refreshes

**Storage Data**:
```json
{
  "903": {
    "openingStock": 6,
    "dispatch": 194,
    "returned": 31,
    "closing": 169
  }
}
```

**Lifecycle**:
1. **Load**: On component mount, check for existing draft
2. **Save**: On every input change, update local storage
3. **Clear**: On successful submit, remove from local storage

## Features

### Date Range Filter
- **Components**: Two `FloatingInput` (type='date')
- **Labels**: "From Date" and "To Date"
- **Default**: Today's date for both
- **Behavior**: Refetch data on date change

### Container Grid Layout
- **Layout**: Responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- **Component**: Card-based layout for each container type
- **Style**: White background, rounded corners, border, shadow

### Editable Fields
Each container card displays:
1. **Container Type Name** (header, non-editable)
2. **Opening Stock** (editable number input)
3. **Dispatch** (editable number input)
4. **Returned** (editable number input)
5. **Closing** (read-only, auto-calculated)

### Auto-Calculation
**Formula**: `closing = openingStock + returned - dispatch`

**Implementation**:
```typescript
const closing = Math.max(0, updatedValues.openingStock + updatedValues.returned - updatedValues.dispatch);
```

**Constraints**: 
- Result cannot be negative (Math.max(0, ...))
- Recalculates on every field change

### Input Validation
- **Type**: Number inputs only
- **Non-negative**: All values must be >= 0
- **Real-time**: Updates happen immediately
- **Visual Feedback**: Closing field has disabled appearance

## Component Structure

```tsx
<div className='space-y-6'>
  <PageHeader title={clientName} locationName={city} totalItems={data.length} itemType='container types' icon='📦' />
  
  <div className='bg-white p-4 shadow-sm rounded-lg flex flex-wrap gap-4'>
    <FloatingInput type='date' label='From Date' value={startDate} onChange={setStartDate} />
    <FloatingInput type='date' label='To Date' value={endDate} onChange={setEndDate} />
  </div>
  
  {loading ? <div>Loading...</div> : (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
      {data.map((item) => (
        <div className='bg-white p-6 rounded-lg shadow-sm border'>
          <h3>{item.containerType}</h3>
          <FloatingInput type='number' label='Opening Stock' value={...} onChange={...} />
          <FloatingInput type='number' label='Dispatch' value={...} onChange={...} />
          <FloatingInput type='number' label='Returned' value={...} onChange={...} />
          <FloatingInput type='number' label='Closing' value={...} disabled className='bg-gray-50' />
        </div>
      ))}
    </div>
  )}
  
  <Button onClick={handleSubmit}>Submit</Button>
  
  <Snackbar open={snackbar.open} message={snackbar.message} type={snackbar.type} />
</div>
```

## Data Flow

1. **Mount**: Load client name from navigation state
2. **Fetch Data**: Load container types and existing values
3. **Load Draft**: Check local storage for existing edits
4. **User Edits**: Update editedData state and local storage
5. **Real-time Calculation**: Closing stock updates automatically
6. **Submit**: Transform data and call PUT API
7. **Success**: Clear local storage, show success message, navigate back
8. **Error**: Show error message, keep local storage

## Input Change Handler

```typescript
const handleInputChange = (id: number, field: 'openingStock' | 'dispatch' | 'returned', value: number) => {
  const currentItem = data.find(item => item.id === id);
  const currentEdited = editedData[id] || {};
  
  // Get current values
  const opening = currentEdited.openingStock ?? currentItem.openingStock ?? 0;
  const dispatch = currentEdited.dispatch ?? currentItem.dispatch ?? 0;
  const returned = currentEdited.returned ?? currentItem.returned ?? 0;
  
  // Update changed field
  const updatedValues = {
    openingStock: field === 'openingStock' ? value : opening,
    dispatch: field === 'dispatch' ? value : dispatch,
    returned: field === 'returned' ? value : returned,
  };
  
  // Calculate closing
  const closing = Math.max(0, updatedValues.openingStock + updatedValues.returned - updatedValues.dispatch);
  
  // Update state and local storage
  const newEditedData = { ...editedData, [id]: { ...updatedValues, closing } };
  setEditedData(newEditedData);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newEditedData));
};
```

## Submit Handler

```typescript
const handleSubmit = async () => {
  const payload = data.map((item) => {
    const edited = editedData[item.id];
    return {
      id: item.id,
      client_id: item.clientId,
      container_type_id: item.containerTypeId,
      opening_stock: Math.max(0, Number(edited?.openingStock ?? item.openingStock ?? 0)),
      dispatch: Math.max(0, Number(edited?.dispatch ?? item.dispatch ?? 0)),
      returned: Math.max(0, Number(edited?.returned ?? item.returned ?? 0)),
      closing: Math.max(0, Number(edited?.closing ?? item.closing ?? 0)),
    };
  });
  
  await KamApiService.updateEverydayClientInventory(payload);
  localStorage.removeItem(STORAGE_KEY);
  // Show success, navigate back
};
```

## User Experience Features

### Local Storage Persistence
- **Prevents Data Loss**: Form data survives page refresh
- **Auto-save**: Every change is immediately saved
- **Auto-restore**: Draft data loads on page mount
- **Auto-clear**: Successfully submitted data is cleared

### Visual Feedback
- **Loading State**: Shows "Loading..." during API calls
- **Disabled Closing**: Closing field has subtle gray background
- **Success Message**: Green snackbar on successful submit
- **Error Message**: Red snackbar on failed submit

### Navigation
- **Back Navigation**: Returns to Client Listing after submit
- **State Preservation**: Client name passed via navigation state
- **URL-based**: Client ID in URL for bookmark support

## Key Points

- **Real-time Updates**: Closing stock updates instantly
- **Data Safety**: Local storage prevents accidental data loss
- **Industry Standard**: Follows modern form persistence patterns
- **User-Friendly**: Clear labels and visual hierarchy
- **Validation**: Non-negative values enforced
- **API Integration**: Proper payload transformation for PUT request

