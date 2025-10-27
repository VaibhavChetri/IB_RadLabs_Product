# Inventory Client Listing Page

## Overview
The Inventory Client Listing page (`/kam/inventory`) provides a comprehensive view of all inventory entries across all clients for a selected date range. This page includes stats cards, client filtering, and a detailed table with full column management.

## Route
`/kam/inventory`

## API Integration

### GET Request (Main Data)
**Endpoint**: `/billing/getEverydayClientInventoryValues`

**Query Parameters**:
- `start_date`: string (YYYY-MM-DD) - From date
- `end_date`: string (YYYY-MM-DD) - To date
- `page`: number - Page number
- `limit`: number - Items per page

**Example**:
```
GET /billing/getEverydayClientInventoryValues?start_date=2024-09-03&end_date=2024-09-03&page=1&limit=100
```

**Response Structure**:
```json
{
  "status_code": 200,
  "status": "Success",
  "data": [
    {
      "id": 862,
      "clientId": 123,
      "clientName": "Star Union Dai-ichi Life Insurance Company Limited",
      "cityId": 3,
      "cityName": "Mumbai",
      "containerTypeId": 83,
      "containerType": "3CP Open Yellow PP (09\")",
      "openingStock": 123,
      "dispatch": 120,
      "returned": 126,
      "closing": 117,
      "has_entered": "Yes",
      "created_at": "2024-09-03 00:00:00"
    }
  ],
  "totals": { "totalDispatch": "5383", "totalReturned": "4470" },
  "pagination": { "page": 1, "limit": 100, "totalItems": 67, "totalPages": 1 }
}
```

### GET Request (Client Dropdown)
**Endpoint**: `/inventory/getClientByCity`

**Query Parameters**:
- `location_id`: number - City ID (from user.city_id)

**Example**:
```
GET /inventory/getClientByCity?location_id=3
```

**Response Structure**:
```json
{
  "status": "Success",
  "status_code": 200,
  "result": [
    {
      "clientName": "Piramal Agastya Offices Private Limited",
      "clientId": 95,
      "impactTypes": [...]
    }
  ]
}
```

## Redux State

**Slice**: `kamSlice`
**State Path**: `state.kam.inventoryListing`

**Structure**:
```typescript
{
  data: InventoryValueRow[];
  totals: { totalDispatch: string; totalReturned: string };
  pagination: { page: number; limit: number; totalItems: number; totalPages: number };
  loading: boolean;
}
```

## Features

### Stats Cards (4 Cards)
Displayed in a responsive grid above the table.

#### 1. Total Dispatch
- **Icon**: 📦
- **Color**: Blue
- **Value**: `totals.totalDispatch`
- **Label**: "Total Dispatch"

#### 2. Total Returned
- **Icon**: 🔄
- **Color**: Green
- **Value**: `totals.totalReturned`
- **Label**: "Total Returned"

#### 3. Net Change
- **Icon**: 📊
- **Color**: Green (positive) or Red (negative)
- **Value**: `parseInt(totals.totalReturned) - parseInt(totals.totalDispatch)`
- **Label**: "Net Change"

#### 4. Pending Entries
- **Icon**: ⏳
- **Color**: Orange
- **Value**: Count of rows where `has_entered === "No"`
- **Label**: "Pending Entries"

### Date Range Filter
- **Components**: Two `FloatingInput` (type='date')
- **Labels**: "From Date" and "To Date"
- **Default**: Today's date for both
- **Behavior**: Refetch data on date change

### Client Dropdown Filter
- **Component**: `FloatingDropdown`
- **Options**: Loaded from `/inventory/getClientByCity`
- **Default**: "All Clients" (value: '')
- **Behavior**: Client-side filtering (not sent to API)
- **Filtering Logic**: `data.filter(row => !selectedClientId || row.clientId === Number(selectedClientId))`

### Column Management
- **Component**: `MultiSelectDropdown`
- **Label**: "Show Columns"
- **Options**: All available columns
- **Selected**: Managed via `visibleColumns` state
- **Behavior**: Hide/show columns dynamically

### Table Columns

All columns (not all visible by default):

1. **#** (Serial Number)
   - Auto-calculated
   - Not sortable
   - Width: 80px

2. **Client Name**
   - Sortable
   - Direct from API

3. **Container Type**
   - Sortable
   - Direct from API

4. **Opening Stock**
   - Sortable
   - Number value

5. **Dispatch**
   - Sortable
   - Number value

6. **Returned**
   - Sortable
   - Number value

7. **Closing**
   - Sortable
   - Number value

8. **Data Entered**
   - Sortable
   - Badge component:
     - Green badge for "Yes"
     - Red badge for "No"

9. **Date**
   - Sortable
   - Extracted from `created_at` (first part before space)
   - Example: "2024-09-03"

### Default Visible Columns
```typescript
[
  'serial',
  'clientName',
  'containerType',
  'openingStock',
  'dispatch',
  'returned',
  'closing',
  'has_entered',
  'created_at'
]
```

## Component Structure

```tsx
<div className='space-y-6'>
  <PageHeader title='Inventory Client Listing' locationName={city} totalItems={totalItems} itemType='inventory entries' icon='📦' />
  
  {/* Stats Cards */}
  <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
    <StatCard icon='📦' label='Total Dispatch' value={totals.totalDispatch} color='blue' />
    <StatCard icon='🔄' label='Total Returned' value={totals.totalReturned} color='green' />
    <StatCard icon='📊' label='Net Change' value={netChange} color={netChange >= 0 ? 'green' : 'red'} />
    <StatCard icon='⏳' label='Pending Entries' value={pendingCount} color='orange' />
  </div>
  
  {/* Filters */}
  <div className='bg-white p-4 shadow-sm rounded-lg flex flex-wrap gap-4'>
    <FloatingInput type='date' label='From Date' ... />
    <FloatingInput type='date' label='To Date' ... />
    <FloatingDropdown label='Client' options={clients} ... />
    <SearchButton onClick={fetchData} />
  </div>
  
  {/* Column Management */}
  <div className='bg-white p-4 shadow-sm rounded-lg'>
    <MultiSelectDropdown label='Show Columns' options={columns} selected={visibleColumns} onChange={setVisibleColumns} />
  </div>
  
  {/* Table */}
  {loading ? <div>Loading...</div> : 
    <Table columns={allColumns.filter(col => visibleColumns.includes(col.key))} data={filteredData} sortable />}
  
  {/* Pagination */}
  {totalPages > 1 && <Pagination ... />}
</div>
```

## Data Flow

1. **Mount**: Fetch inventory data and client dropdown options
2. **Date Change**: Update dates, refetch data
3. **Client Filter**: Update selectedClientId, filter data client-side
4. **Column Toggle**: Update visibleColumns state
5. **Search Click**: Manual refetch trigger
6. **Pagination**: Update page number, refetch data
7. **Sorting**: Table-level sorting (handled by Table component)

## Stats Calculations

### Net Change
```typescript
const netChange = parseInt(totals.totalReturned) - parseInt(totals.totalDispatch);
// Positive = more returned than dispatched (good)
// Negative = more dispatched than returned (stock depletion)
```

### Pending Entries
```typescript
const pendingCount = filteredData.filter(row => row.has_entered === 'No').length;
```

## Badge Component Usage

```tsx
<Badge variant={row.has_entered === 'Yes' ? 'success' : 'danger'}>
  {row.has_entered}
</Badge>
```

**Variants**:
- `success` - Green badge for "Yes"
- `danger` - Red badge for "No"

## Client-Side Filtering

Since the API doesn't support client filtering, we filter the results client-side:

```typescript
const filteredData = useMemo(() => {
  if (!selectedClientId) return data;
  return data.filter(row => row.clientId === Number(selectedClientId));
}, [data, selectedClientId]);
```

**Benefits**:
- No additional API calls
- Instant filtering
- Works with pagination from API

**Limitations**:
- Only filters currently loaded page
- For true client-filtered pagination, backend support needed

## Column Definition

```typescript
const allColumns = [
  {
    key: 'serial',
    title: '#',
    width: '80px',
    sortable: false,
    render: (_: unknown, __: InventoryValueRow, index: number) =>
      (pageNumber - 1) * itemsPerPage + index + 1,
  },
  { key: 'clientName', title: 'Client Name', sortable: true },
  { key: 'containerType', title: 'Container Type', sortable: true },
  { key: 'openingStock', title: 'Opening Stock', sortable: true },
  { key: 'dispatch', title: 'Dispatch', sortable: true },
  { key: 'returned', title: 'Returned', sortable: true },
  { key: 'closing', title: 'Closing', sortable: true },
  {
    key: 'has_entered',
    title: 'Data Entered',
    sortable: true,
    render: (_: unknown, row: InventoryValueRow) => (
      <Badge variant={row.has_entered === 'Yes' ? 'success' : 'danger'}>
        {row.has_entered}
      </Badge>
    ),
  },
  {
    key: 'created_at',
    title: 'Date',
    sortable: true,
    render: (_: unknown, row: InventoryValueRow) => row.created_at.split(' ')[0],
  },
];
```

## User Flow

1. Navigate to KAM → Inventory Client Listing
2. View stats cards at top
3. Select date range
4. Optionally filter by client
5. Toggle column visibility as needed
6. Use pagination to browse results
7. Sort columns for better analysis

## Key Points

- **Comprehensive View**: All inventory across all clients
- **Stats Dashboard**: Key metrics at a glance
- **Flexible Filtering**: Date range and client selection
- **Customizable Columns**: Show/hide based on needs
- **Full Sorting**: All columns are sortable
- **Industry Standard**: Redux state management with pagination

