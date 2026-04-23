# Universal Listing Page Template

## Overview
This document provides a comprehensive template for creating any listing page components. It includes detailed specifications for the header, filter section, and table components with exact styling, behavior, and implementation details. This template can be adapted for any data listing page (clients, users, orders, etc.).

## Page Structure

### 1. Page Header Section

#### Layout Structure
```tsx
<PageHeader
  title={pageTitle}
  locationName={locationName}
  totalItems={totalItems}
  itemType={itemType}
  icon={icon}
/>
```

#### Component Props
- **title**: `string` - Page title (e.g., "Client Listing", "User Management")
- **locationName**: `string` (optional) - City, region, or geographic identifier
- **totalItems**: `number` - Total number of items to display
- **itemType**: `string` - Type of items (e.g., "clients", "users", "orders")
- **icon**: `string` (optional) - Emoji icon (default: 🏢)
- **className**: `string` (optional) - Additional CSS classes

#### Specifications
- **Container**: `mb-6` (24px bottom margin)
- **Title**: 
  - Font: `text-2xl font-semibold text-gray-900`
  - Margin: `mb-2` (8px bottom margin)
  - Content: Dynamic page title
- **Info Row**:
  - Layout: `flex items-center gap-4`
  - Location: 📍 icon with location name
  - Separator: • (elegant dot)
  - Count: Custom icon with total items and item type

#### Implementation Notes
- Use the reusable `PageHeader` component for consistency
- Page title should be descriptive (e.g., "Client Listing", "User Management", "Order History")
- Location name can be city, region, or any relevant geographic identifier
- Total items count updates dynamically with filter results
- Icon should be relevant to the content type (🏢 for buildings, 🚛 for vehicles, 👥 for users, etc.)

#### PageHeader Component
The `PageHeader` component is a reusable UI component that provides consistent header styling across all listing pages.

**Location**: `/src/components/ui/PageHeader.tsx`

**Import**:
```tsx
import { PageHeader } from '../components/ui';
```

**Props Interface**:
```tsx
interface PageHeaderProps {
  title: string;
  locationName?: string;
  totalItems: number;
  itemType: string;
  icon?: string;
  className?: string;
}
```

**Example Usage**:
```tsx
<PageHeader
  title="Transit Plan Listing"
  locationName="Mumbai"
  totalItems={1182}
  itemType="transit plans"
  icon="🚛"
/>
```

---

### 2. Filter Section

#### Layout Structure
```tsx
<div className='bg-white p-4 shadow-sm rounded-lg flex flex-wrap gap-4 items-center mb-6'>
  {/* Filter Components */}
</div>
```

#### Container Specifications
- **Background**: `bg-white`
- **Padding**: `p-4` (16px all around)
- **Shadow**: `shadow-sm` (subtle shadow)
- **Border Radius**: `rounded-lg` (8px)
- **Layout**: `flex flex-wrap gap-4 items-center`
- **Margin**: `mb-6` (24px bottom margin)

#### Filter Components

### 2.1 Floating Dropdown Filters

#### Example: Category Filter
```tsx
<FloatingDropdown
  label='Category'
  options={categories}
  value={filters.category_id ?? ''}
  onChange={v => handleFilterChange('category_id', v)}
  className='w-56'
/>
```

#### Example: Status Filter
```tsx
<FloatingDropdown
  label='Status'
  options={statuses}
  value={filters.status ?? ''}
  onChange={v => handleFilterChange('status', v)}
  className='w-56'
/>
```

#### Example: Date Range Filter
```tsx
<FloatingDropdown
  label='Date Range'
  options={dateRanges}
  value={filters.date_range ?? ''}
  onChange={v => handleFilterChange('date_range', v)}
  className='w-56'
/>
```

#### FloatingDropdown Specifications
- **Width**: `w-56` (224px fixed width)
- **Label**: Always visible above the input field
- **Options**: Array of `{label: string, value: string}` objects
- **Default Option**: First option is always "All" with empty string value
- **Searchable**: `true` by default
- **Behavior**: 
  - Floating label animation on focus/selection
  - Search functionality when opened
  - Outside click to close
  - Keyboard navigation support

#### FloatingDropdown Styling Details
- **Label**: 
  - Position: `absolute left-4 bg-white px-1`
  - Animation: `transition-all duration-200 ease-in-out`
  - Float state: `-top-2 text-xs text-green-600 font-medium z-50`
  - Default state: `top-4 text-sm text-gray-500 z-30`
- **Input Field**:
  - Base: `w-full px-4 py-4 text-left bg-white border border-gray-300 rounded-md`
  - Focus: `border-green-400 ring-1 ring-green-200`
  - Hover: `hover:border-gray-400`
- **Dropdown Menu**:
  - Position: `absolute z-[9999] w-full bg-white border border-gray-200`
  - Shadow: `shadow-md`
  - Max height: `max-h-[180px] overflow-y-auto`
- **Search Input** (when opened):
  - Icon: `Search` icon at `left-4`
  - Close button: `X` icon at `right-4`
  - Styling: `pl-10 pr-10 py-4 text-sm bg-white border rounded-t-md`

### 2.2 Multi-Select Dropdown

#### Component: Column Visibility Filter
```tsx
<MultiSelectDropdown
  label='Show Columns'
  options={columnOptions}
  value={visibleColumns.filter(col => !['actions', 'serial'].includes(col))}
  onChange={selectedValues => {
    setVisibleColumns(['actions', 'serial', ...selectedValues]);
  }}
  className='w-56'
  searchable={true}
  showSelectedCount={true}
/>
```

#### MultiSelectDropdown Specifications
- **Width**: `w-56` (224px fixed width)
- **Searchable**: `true`
- **Show Selected Count**: `true` (displays "X selected" format)
- **Behavior**:
  - Always keeps 'actions' and 'serial' columns visible
  - Filters out system columns from display
  - Shows count badge when items are selected

#### MultiSelectDropdown Styling Details
- **Selected Count Badge**:
  - Style: `inline-flex px-1.5 pb-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full border border-green-200`
- **Selected Items Display**:
  - Container: `flex flex-wrap gap-1`
  - Item: `inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md`
  - Remove button: `hover:text-primary/70` with `X` icon

### 2.3 Search Button

#### Component: Search Button
```tsx
<SearchButton
  onClick={() => {
    setPageNumber(1);
    fetchData(true); // Apply filters
  }}
  title='Search'
  size='md'
/>
```

#### SearchButton Specifications
- **Size**: `md` (medium)
- **Behavior**: 
  - Resets pagination to page 1
  - Triggers data fetch with current filters
  - Blurs button after click

#### SearchButton Styling Details
- **Base**: `inline-flex items-center justify-center rounded-[10px] relative overflow-hidden group transition-all duration-300`
- **Background**: `border border-gray-300 bg-gradient-to-br from-white to-gray-50 shadow-sm`
- **Hover**: `hover:from-green-50 hover:to-green-100 hover:border-green-400 hover:shadow-md`
- **Focus**: `focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2`
- **Active**: `active:scale-95`
- **Icon**: `Search` icon with `text-green-600` and hover scale effect
- **Ripple Effect**: Subtle background circle animation on hover

---

### 3. Table Section

#### Layout Structure
```tsx
<div className='overflow-x-auto'>
  <Table
    columns={columns as any}
    data={rows as any}
    loading={loading}
    emptyText='No items found.'
    className='min-w-max'
    sortBy={sortBy}
    sortOrder={sortOrder}
    onSort={handleSort}
  />
</div>
```

#### Container Specifications
- **Wrapper**: `overflow-x-auto` for horizontal scrolling
- **Table Class**: `min-w-max` to prevent column compression

#### Table Specifications
- **Loading State**: Shows skeleton animation
- **Empty State**: Custom message (e.g., "No items found.", "No data available.")
- **Data**: Array of data objects (generic type)
- **Columns**: Dynamically filtered based on visibility settings

### 3.1 Column Definitions

#### Actions Column
```tsx
{
  key: 'actions',
  label: 'Actions',
  title: 'Actions',
  width: '110px',
  render: (_: unknown, row: DataRow) => (
    <div className='flex items-center gap-2'>
      <button
        className='p-1.5 rounded hover:bg-gray-100'
        title='Edit'
        onClick={() => {
          dispatch(setEditData(row));
          navigate(`/${moduleName}/edit`);
        }}
      >
        <Pencil className='h-4 w-4 text-green-600' />
      </button>
      <button className='p-1.5 rounded hover:bg-gray-100' title='Delete'>
        <Trash2 className='h-4 w-4 text-red-600' />
      </button>
    </div>
  ),
}
```

#### Actions Column Specifications
- **Width**: `110px` (fixed width for consistent layout)
- **Edit Button**:
  - **Icon**: `Pencil` icon with `h-4 w-4` size
  - **Color**: `text-green-600` (green color for edit action)
  - **Hover**: `hover:bg-gray-100` (subtle background on hover)
  - **Padding**: `p-1.5` (6px padding for comfortable click area)
  - **Behavior**: 
    - Dispatches action to store edit data in Redux
    - Navigates to edit page using dynamic route
    - Uses `title='Edit'` for accessibility
- **Delete Button**:
  - **Icon**: `Trash2` icon with `h-4 w-4` size
  - **Color**: `text-red-600` (red color for delete action)
  - **Hover**: `hover:bg-gray-100` (subtle background on hover)
  - **Padding**: `p-1.5` (6px padding for comfortable click area)
  - **Behavior**: 
    - Uses `title='Delete'` for accessibility
    - Should implement confirmation dialog before deletion
    - Should handle error states and success feedback

#### Edit Button Implementation Notes
- **Redux Integration**: Store edit data in Redux state for edit page access
- **Navigation**: Use dynamic routes based on module name
- **Data Passing**: Pass complete row data for pre-populating edit form
- **Error Handling**: Handle navigation errors and missing data scenarios

#### Serial Number Column
```tsx
{
  key: 'serial',
  label: '#',
  title: 'Sl. No',
  width: '60px',
  render: (_: unknown, __: DataRow, index: number) =>
    (pageNumber - 1) * itemsPerPage + index + 1,
}
```

#### Data Columns Examples
```tsx
// Example for different data types
{ key: 'name', label: 'Name', title: 'Name', sortable: true },
{ key: 'email', label: 'Email', title: 'Email', sortable: true },
{ key: 'status', label: 'Status', title: 'Status', sortable: true },
{ key: 'created_at', label: 'Created', title: 'Created Date', sortable: true },
{ key: 'updated_at', label: 'Updated', title: 'Last Updated', sortable: true },
{ key: 'category', label: 'Category', title: 'Category', sortable: false },
{ key: 'priority', label: 'Priority', title: 'Priority', sortable: true },
```

#### Column Sorting Specifications
- **Sortable Property**: `sortable: boolean` - enables/disables sorting for each column
- **Default Behavior**: Most data columns should be sortable (`sortable: true`)
- **Non-Sortable Columns**: Actions, serial numbers, and complex rendered content (`sortable: false`)
- **Sort Icons**: 
  - Default: `ArrowUpDown` icon (indicates sortable)
  - Ascending: `ArrowUp` icon with primary color
  - Descending: `ArrowDown` icon with primary color

### 3.2 Table Styling Details

#### Header Row
- **Background**: `border-b border-gray-200`
- **Font**: `px-6 py-2 text-left font-bold text-gray-900`
- **Size**: `text-sm` (14px)

#### Data Rows
- **Base**: `border-b border-gray-200 transition-colors`
- **Hover**: `hover:bg-gray-50`
- **Font**: `px-6 py-2 font-semibold text-gray-900`
- **Size**: `text-sm` (14px)

#### Loading State
- **Container**: `animate-pulse`
- **Background**: `bg-background-secondary rounded-lg p-8`
- **Skeleton**: Multiple `h-4 bg-border rounded` elements with varying widths

#### Empty State
- **Container**: `px-4 py-8 text-center text-foreground-muted`
- **Message**: Customizable message (e.g., "No items found.", "No data available.")

---

### 4. Pagination Section

#### Layout Structure
```tsx
<Pagination
  currentPage={pageNumber}
  totalPages={Math.ceil(totalItems / itemsPerPage)}
  totalItems={totalItems}
  itemsPerPage={itemsPerPage}
  onPageChange={setPageNumber}
  onItemsPerPageChange={setItemsPerPage}
  className='mt-4'
/>
```

#### Pagination Specifications
- **Container**: `flex items-center justify-between`
- **Margin**: `mt-4` (16px top margin)
- **Items Per Page**: Always visible with dropdown
- **Navigation**: Only shows when multiple pages exist

#### Pagination Components

### 4.1 Items Per Page Selector
```tsx
<div className='flex items-center gap-3'>
  <span className='text-sm font-medium text-gray-700'>Rows per page:</span>
  <div className='relative'>
    <select
      value={itemsPerPage}
      onChange={e => onItemsPerPageChange(Number(e.target.value))}
      className='appearance-none bg-transparent border-none text-sm font-medium text-gray-700 cursor-pointer focus:outline-none pr-6'
    >
      {itemsPerPageOptions.map(option => (
        <option key={option} value={option}>
          {option === totalItems ? 'All' : option}
        </option>
      ))}
    </select>
    {/* Custom dropdown arrow */}
  </div>
</div>
```

### 4.2 Page Info
```tsx
<div className='text-sm font-medium text-gray-700'>
  {itemsPerPage === totalItems
    ? `All ${totalItems} items`
    : `${startItem}-${endItem} of ${totalItems}`}
</div>
```

### 4.3 Navigation Arrows
```tsx
<div className='flex items-center gap-2'>
  <button
    onClick={() => onPageChange(currentPage - 1)}
    disabled={currentPage === 1}
    className={`p-1 rounded transition-colors ${
      currentPage === 1
        ? 'text-gray-300 cursor-not-allowed'
        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
    }`}
  >
    <ChevronLeft className='w-4 h-4' />
  </button>
  <button
    onClick={() => onPageChange(currentPage + 1)}
    disabled={currentPage === totalPages}
    className={`p-1 rounded transition-colors ${
      currentPage === totalPages
        ? 'text-gray-300 cursor-not-allowed'
        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
    }`}
  >
    <ChevronRight className='w-4 h-4' />
  </button>
</div>
```

---

## State Management

### Filter State
```tsx
// Example filter state - customize based on your data
const [filters, setFilters] = useState<{
  category_id?: string;
  status?: string;
  date_range?: string;
  // Add more filter fields as needed
}>({});
```

### Column Visibility State
```tsx
// Example column visibility - customize based on your data columns
const [visibleColumns, setVisibleColumns] = useState<string[]>([
  'actions',
  'serial',
  'name',
  'email',
  'status',
  'created_at',
  // Add more columns as needed
]);
```

### Pagination State
```tsx
const [pageNumber, setPageNumber] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);
const [totalItems, setTotalItems] = useState(0);
```

### Sorting State
```tsx
const [sortBy, setSortBy] = useState<string>('');
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

// Handle column sorting
const handleSort = (key: string, order: 'asc' | 'desc') => {
  setSortBy(key);
  setSortOrder(order);
  setPageNumber(1); // Reset to first page when sorting
  fetchData(true); // Fetch data with new sorting
};
```

---

## Data Flow

### 1. Initial Load
- Load dropdown options from APIs
- Fetch initial data without filters
- Set default column visibility

### 2. Filter Changes
- Update filter state only (no API calls)
- User clicks Search button to apply filters
- Reset pagination to page 1
- Fetch data with applied filters

### 3. Pagination Changes
- Update page number or items per page
- Automatically fetch new data
- Maintain current filter state

### 4. Column Sorting
- User clicks on sortable column header
- Update sort state (sortBy, sortOrder)
- Reset pagination to page 1
- Fetch data with new sorting parameters
- Update sort icons in table header

### 5. Column Visibility
- Update visible columns state
- Filter column definitions
- Re-render table with new columns

---

## API Integration

### Dropdown Data APIs
```tsx
// Example API calls - customize based on your data sources
const [categoryRes, statusRes, dateRes] = await Promise.all([
  ApiService.getCategories(),
  ApiService.getStatuses(),
  ApiService.getDateRanges(),
]);
```

### Listing Data API
```tsx
// Example API call - customize based on your data endpoint
const res = await ApiService.getListing({
  pageNumber,
  pageSize: itemsPerPage,
  sortBy: sortBy || 'created_at', // Default sort field
  sortOrder: sortOrder,
  categoryId: useFilters && filters.category_id ? parseInt(filters.category_id) : undefined,
  status: useFilters && filters.status ? filters.status : undefined,
  dateRange: useFilters && filters.date_range ? filters.date_range : undefined,
});
```

---

## Responsive Behavior

### Filter Section
- **Desktop**: All filters in single row with `flex-wrap`
- **Mobile**: Filters wrap to multiple rows
- **Gap**: Consistent `gap-4` (16px) between elements

### Table
- **Horizontal Scroll**: `overflow-x-auto` on container
- **Minimum Width**: `min-w-max` prevents column compression
- **Fixed Columns**: Actions and serial columns always visible
- **Sorting**: Clickable column headers with visual feedback
- **Sort Icons**: Responsive icon sizing and positioning

### Pagination
- **Layout**: `justify-between` spreads elements
- **Mobile**: Stacks vertically if needed
- **Arrows**: Only visible when multiple pages exist

---

## Accessibility Features

### Keyboard Navigation
- **Dropdowns**: Enter/Space to open, Escape to close
- **Search**: Enter key support
- **Table**: Tab navigation through cells
- **Pagination**: Arrow key navigation

### Screen Reader Support
- **Labels**: Proper label associations
- **Titles**: Descriptive button titles
- **ARIA**: Appropriate ARIA attributes
- **Semantic HTML**: Proper heading hierarchy

### Focus Management
- **Focus Indicators**: Visible focus rings
- **Focus Trapping**: Dropdown menus trap focus
- **Focus Restoration**: Returns focus after interactions

---

## Performance Considerations

### Lazy Loading
- **Initial Load**: Load data without filters first
- **Filter Application**: Only fetch when Search button clicked
- **Pagination**: Load data on page change

### Memoization
- **Columns**: `useMemo` for column definitions
- **Filtered Columns**: `useMemo` for visible columns
- **Column Options**: `useMemo` for dropdown options

### State Updates
- **Debounced Filters**: No immediate API calls on filter change
- **Batch Updates**: Single state update for multiple filter changes
- **Optimistic Updates**: Immediate UI updates with rollback on error

---

## Error Handling

### API Errors
- **Loading States**: Show skeleton during API calls
- **Error States**: Display error messages
- **Retry Logic**: Allow retry on failed requests

### Validation
- **Filter Values**: Validate before API calls
- **Pagination**: Ensure valid page numbers
- **Column Visibility**: Prevent hiding all columns

---

## Testing Considerations

### Unit Tests
- **Component Rendering**: Test all component states
- **User Interactions**: Test clicks, keyboard events
- **State Updates**: Test state management logic

### Integration Tests
- **API Integration**: Test data fetching
- **Filter Application**: Test filter-to-API flow
- **Pagination**: Test pagination behavior

### E2E Tests
- **User Workflows**: Complete user journeys
- **Cross-browser**: Test in multiple browsers
- **Responsive**: Test on different screen sizes

---

This template provides everything needed to recreate any listing page components with exact styling, behavior, and functionality. Each section includes detailed specifications, implementation notes, and styling details to ensure consistent implementation across different modules.

## Usage Examples

### Client Listing Page
```tsx
<PageHeader
  title="Client Management"
  locationName="Mumbai"
  totalItems={clients.length}
  itemType="clients"
  icon="🏢"
/>
```
- **Page Title**: "Client Management"
- **Item Type**: "clients"
- **Filters**: Status, Category, Date Range
- **Columns**: Name, Email, Phone, Status, Created Date

### User Listing Page
```tsx
<PageHeader
  title="User Management"
  totalItems={users.length}
  itemType="users"
  icon="👥"
/>
```
- **Page Title**: "User Management"
- **Item Type**: "users"
- **Filters**: Role, Status, Department
- **Columns**: Name, Email, Role, Status, Last Login

### Transit Plan Listing Page
```tsx
<PageHeader
  title="Transit Plan Listing"
  locationName={rows[0]?.city_name}
  totalItems={totalItems}
  itemType="transit plans"
  icon="🚛"
/>
```
- **Page Title**: "Transit Plan Listing"
- **Item Type**: "transit plans"
- **API Method**: GET with query parameters
- **Filters**: Date Range, Transit Status, Restaurant ID
- **Columns**: Type, Status, Driver, Facility, Vehicle Type, etc.

### Order Listing Page
```tsx
<PageHeader
  title="Order History"
  totalItems={orders.length}
  itemType="orders"
  icon="📦"
/>
```
- **Page Title**: "Order History"
- **Item Type**: "orders"
- **Filters**: Status, Payment Method, Date Range
- **Columns**: Order ID, Customer, Amount, Status, Date
