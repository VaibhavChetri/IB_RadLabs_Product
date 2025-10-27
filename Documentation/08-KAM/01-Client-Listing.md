# Client Listing Page

## Overview
The Client Listing page (`/kam/clients`) displays all clients with pending inventory entries for a selected date. Users can view client statistics and navigate to individual client inventory details pages.

## Route
`/kam/clients`

## API Integration

### GET Request
**Endpoint**: `/billing/getInventoryClientPlan`

**Query Parameters**:
- `startDate`: string (YYYY-MM-DD) - Single date selection
- `endDate`: string (YYYY-MM-DD) - Same as startDate
- `page`: number - Page number (default: 1)
- `limit`: number - Items per page (default: 10)

**Example**:
```
GET /billing/getInventoryClientPlan?startDate=2025-10-20&endDate=2025-10-20&page=1&limit=10
```

**Response Structure**:
```json
{
  "status_code": 200,
  "status": "Success",
  "data": [
    { "clientId": 95, "clientName": "Piramal Agastya Offices Private Limited" }
  ],
  "stats": { "pending": 13, "total": 13, "display": "13/13" },
  "pagination": { "page": 1, "limit": 10, "totalItems": 13, "totalPages": 1 }
}
```

## Redux State

**Slice**: `kamSlice`
**State Path**: `state.kam.clientListing`

**Structure**:
```typescript
{
  data: ClientPlanRow[];
  stats: { pending: number; total: number; display: string };
  pagination: { page: number; limit: number; totalItems: number; totalPages: number };
  loading: boolean;
}
```

## Features

### Date Filter
- **Component**: `FloatingInput` (type='date')
- **Default**: Today's date
- **Behavior**: Single date selection (passed as both startDate and endDate to API)

### Date Storage (localStorage)
- **Feature**: Selected date is automatically saved to localStorage
- **Key**: `clientListing_selectedDate`
- **Purpose**: Allows back-dated entry without losing the selected date
- **How it works**:
  1. User selects a date
  2. Date is saved to localStorage immediately
  3. User navigates away and comes back
  4. The same date is still selected (loaded from localStorage)
  5. User can work on old dates without having to select again
- **When it clears**: 
  - When user logs out
  - When user selects a different date (that becomes the new default)
- **Default on page load**: 
  - If a date was selected before, that date loads
  - If no date was selected, defaults to today

### Statistics Display

**UI**: Creative gradient card with three metrics displayed side-by-side

**Format**: 
- Large numbers for Pending Clients and Total Clients
- Status display (e.g., "13/13") in blue
- Gradient background: `from-blue-50 to-purple-50`
- Border: `border-blue-200`
- Vertical separators between metrics

**Example**:
```
┌─────────────────────────────────────┐
│  Pending    |  Total    |  Status │
│    13       |    13     |   13/13 │
└─────────────────────────────────────┘
```

**Location Name**: Uses `user?.city_name` from Redux auth state (e.g., "Mumbai", "Gurgaon", "Bangalore") - this is provided by the backend in the login response and stored in the User interface.

### Client List
- **Component**: `Table`
- **Columns**:
  1. **#** (Serial Number) - Auto-calculated based on page and index
  2. **Client Name** - Clickable hyperlink

### Client Name Hyperlink
- **Color**: Blue (`text-blue-600`)
- **Hover**: Darker blue (`hover:text-blue-800`)
- **Underline**: Yes
- **On Click**: Navigate to `/kam/clients/:clientId`
- **State Passed**: `{ clientName }` for page header

### Pagination
- **Component**: `Pagination`
- **Props**:
  - `currentPage`: pageNumber state
  - `totalPages`: pagination.totalPages from API
  - `totalItems`: pagination.totalItems from API
  - `itemsPerPage`: Fixed at 10

## Component Structure

```tsx
<div className='space-y-6'>
  <PageHeader title='Client Listing' locationName={city} totalItems={totalItems} itemType='clients' icon='📊' />
  
  <div className='bg-white p-4 shadow-sm rounded-lg flex flex-wrap gap-4 items-center mb-6'>
    <FloatingInput type='date' label='Date' value={selectedDate} onChange={setSelectedDate} className='w-48' />
    <SearchButton onClick={fetchData} disabled={loading} />
  </div>
  
  {stats.total > 0 && <div>Stats: {stats.display} (Pending: {stats.pending}, Total: {stats.total})</div>}
  
  {loading ? <div>Loading...</div> : <Table columns={columns} data={data} sortable />}
  
  {totalPages > 1 && <Pagination ... />}
</div>
```

## Data Flow

1. **Mount**: Fetch data on component mount
2. **Date Change**: Update state and refetch
3. **Search Click**: Manual refetch trigger
4. **Pagination**: Update page number and refetch
5. **Client Click**: Navigate to details page with client ID

## Implementation Details

### Redux Integration
```typescript
const dispatch = useDispatch();
const { user } = useSelector((state: RootState) => state.auth);
const { data, stats, pagination, loading } = useSelector(
  (state: RootState) => state.kam.clientListing
);

// IMPORTANT: 
// - Location Name: Uses user?.city_name from Redux (provided by backend in login response)
// - Icon: 👥 (not 📊) for clients
// - Stats displayed in gradient card (see Statistics Display section)

const fetchData = async () => {
  dispatch(setClientListingLoading(true));
  try {
    const response = await KamApiService.getInventoryClientPlan({
      startDate: selectedDate,
      page: pageNumber,
      limit: itemsPerPage,
    });
    dispatch(setClientListing({
      data: response.data,
      stats: response.stats,
      pagination: response.pagination,
      loading: false,
    }));
  } finally {
    dispatch(setClientListingLoading(false));
  }
};
```

### Column Definition
```typescript
const allColumns = [
  {
    key: 'serial',
    title: '#',
    width: '80px',
    sortable: false,
    render: (_: unknown, __: ClientPlanRow, index: number) =>
      (pageNumber - 1) * itemsPerPage + index + 1,
  },
  {
    key: 'clientName',
    title: 'Client Name',
    sortable: true,
    render: (_: unknown, row: ClientPlanRow) => (
      <button
        className='text-blue-600 hover:text-blue-800 underline cursor-pointer font-medium'
        onClick={() => navigate(`/kam/clients/${row.clientId}`, { 
          state: { clientName: row.clientName } 
        })}
      >
        {row.clientName}
      </button>
    ),
  },
];
```

## User Flow

1. Navigate to KAM → Client menu item
2. Page loads with today's date
3. View list of clients with pending entries
4. Click client name to view/edit inventory
5. Navigate to Client Inventory Details page

## Key Points

- **Simple Interface**: Only 2 columns for quick scanning
- **Client Statistics**: Clear visibility of pending vs total clients
- **Quick Navigation**: One-click access to inventory details
- **Date-Based Filtering**: Focus on specific date's pending entries

