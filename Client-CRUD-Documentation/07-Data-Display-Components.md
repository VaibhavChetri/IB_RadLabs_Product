# Data Display Components

This document provides detailed implementation guides for data display components including Table, Pagination, and related data visualization components used in the Client CRUD system.

## 📊 Table Component

### Purpose
Reusable data table component with sorting, custom rendering, responsive design, and accessibility features.

### File Location
`src/components/ui/DataDisplay.tsx`

### Interface Definition
```typescript
export interface TableColumn<T = unknown> {
  key: string;
  label: string;
  title?: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

export interface TableProps<T = unknown> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  className?: string;
}
```

### Implementation Details

#### 1. **Component Structure**
```typescript
export const Table = <T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  sortBy,
  sortOrder,
  onSort,
  className = '',
}: TableProps<T>) => {
  const handleSort = (column: string) => {
    if (onSort) {
      onSort(column);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`
                  px-6 py-4 text-left font-bold text-gray-900
                  ${column.sortable ? 'cursor-pointer hover:bg-gray-50' : ''}
                `}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(column.key)}
                title={column.title}
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {column.sortable && (
                    <div className="flex flex-col">
                      <ChevronUp className={`
                        w-3 h-3 -mb-1
                        ${sortBy === column.key && sortOrder === 'asc' 
                          ? 'text-green-600' 
                          : 'text-gray-400'
                        }
                      `} />
                      <ChevronDown className={`
                        w-3 h-3
                        ${sortBy === column.key && sortOrder === 'desc' 
                          ? 'text-green-600' 
                          : 'text-gray-400'
                        }
                      `} />
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={index}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-6 py-4 font-semibold text-gray-900"
                >
                  {column.render 
                    ? column.render(row[column.key], row, index)
                    : String(row[column.key] || '')
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

#### 2. **Key Features**

##### **Sorting Functionality**
- Visual sort indicators (up/down arrows)
- Clickable column headers for sorting
- Sort state management (asc/desc)
- Custom sort handlers

##### **Custom Rendering**
- Render prop pattern for flexible cell content
- Access to row data, value, and index
- Support for complex cell layouts
- Custom styling per column

##### **Responsive Design**
- Horizontal scroll on mobile devices
- Fixed column widths
- Responsive table layout
- Mobile-friendly interactions

##### **Loading State**
- Centered loading spinner
- Consistent loading experience
- Prevents interaction during loading
- Smooth transitions

##### **Accessibility**
- Proper table semantics
- Screen reader friendly
- Keyboard navigation support
- ARIA attributes

#### 3. **Usage Examples**

##### **Basic Table**
```typescript
const columns: TableColumn[] = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
  },
  {
    key: 'status',
    label: 'Status',
    sortable: false,
  },
];

<Table
  columns={columns}
  data={users}
  loading={loading}
  sortBy={sortBy}
  sortOrder={sortOrder}
  onSort={handleSort}
/>
```

##### **Advanced Table with Custom Rendering**
```typescript
const columns: TableColumn[] = [
  {
    key: 'serial',
    label: '#',
    title: 'Serial Number',
    sortable: false,
    width: '60px',
    render: (_value: unknown, _row: Record<string, unknown>, index: number) => (
      <div className='font-semibold text-gray-600 text-center'>
        {(pagination.currentPage - 1) * pagination.pageSize + index + 1}
      </div>
    ),
  },
  {
    key: 'actions',
    label: 'Actions',
    title: 'Actions',
    sortable: false,
    render: (_value: unknown, row: Record<string, unknown>) => (
      <Button
        variant='ghost'
        size='sm'
        onClick={() => handleEdit(row.id)}
        className='text-green-600 hover:text-green-700 hover:bg-green-50'
      >
        <Edit className='w-4 h-4 mr-1' />
        Edit
      </Button>
    ),
  },
  {
    key: 'restaurant_name',
    label: 'Client',
    title: 'Client',
    sortable: true,
    width: '200px',
    render: (value: unknown) => {
      const clientName = String(value);
      return (
        <div className='relative group'>
          <div
            className='font-semibold text-gray-900'
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '180px',
            }}
          >
            {clientName}
          </div>
          {/* Custom tooltip */}
          <div className='absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap'>
            {clientName}
            <div className='absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900'></div>
          </div>
        </div>
      );
    },
  },
  {
    key: 'billingType',
    label: 'Billing',
    title: 'Billing',
    sortable: true,
    render: (value: unknown, row: Record<string, unknown>) => (
      <div className="text-gray-900">
        <div className="font-medium">{String(value)}</div>
        {(row.subTypeName as string) && (
          <div className="text-xs text-gray-500 mt-1">{String(row.subTypeName)}</div>
        )}
      </div>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    title: 'Active Status',
    sortable: true,
    render: (value: unknown) => (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        String(value).toLowerCase() === 'active'
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}>
        {String(value)}
      </span>
    ),
  },
];
```

## 📄 Pagination Component

### Purpose
Modern pagination component with customizable page sizes, navigation controls, and "All" option support.

### File Location
`src/components/ui/Pagination.tsx`

### Interface Definition
```typescript
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  showItemsPerPage?: boolean;
  className?: string;
}
```

### Implementation Details

#### 1. **Component Structure**
```typescript
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
  className = '',
}) => {
  const itemsPerPageOptions = [5, 10, 25, 50, totalItems];
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Items per page selector - always show */}
      {showItemsPerPage && onItemsPerPageChange && (
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
            <div className='absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none'>
              <ChevronDown className='w-3 h-3 text-gray-500' />
            </div>
          </div>
        </div>
      )}

      {/* Page info */}
      <div className='text-sm font-medium text-gray-700'>
        {itemsPerPage === totalItems ? `All ${totalItems} items` : `${startItem}-${endItem} of ${totalItems}`}
      </div>

      {/* Navigation arrows - only show when there are multiple pages */}
      {totalPages > 1 && (
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
      )}
    </div>
  );
};
```

#### 2. **Key Features**

##### **Items Per Page Selector**
- Always visible for user control
- Options: 5, 10, 25, 50, All
- "All" option shows all items
- Customizable options array

##### **Page Information**
- Shows current range (e.g., "1-10 of 100")
- "All X items" when showing all items
- Clear item count display
- Responsive text sizing

##### **Navigation Controls**
- Left/right arrow buttons
- Disabled state for first/last page
- Hover effects for better UX
- Conditional rendering (only show when multiple pages)

##### **Responsive Design**
- Flexbox layout for proper alignment
- Responsive text and spacing
- Mobile-friendly controls
- Consistent styling

#### 3. **Usage Examples**

##### **Basic Pagination**
```typescript
<Pagination
  currentPage={pagination.currentPage}
  totalPages={pagination.totalPages}
  totalItems={pagination.totalCount}
  itemsPerPage={pagination.pageSize}
  onPageChange={handlePageChange}
  onItemsPerPageChange={handleItemsPerPageChange}
/>
```

##### **With Custom Styling**
```typescript
<Pagination
  currentPage={pagination.currentPage}
  totalPages={pagination.totalPages}
  totalItems={pagination.totalCount}
  itemsPerPage={pagination.pageSize}
  onPageChange={handlePageChange}
  onItemsPerPageChange={handleItemsPerPageChange}
  className="mt-6 border-t border-gray-200 pt-4"
/>
```

##### **Without Items Per Page Selector**
```typescript
<Pagination
  currentPage={pagination.currentPage}
  totalPages={pagination.totalPages}
  totalItems={pagination.totalCount}
  itemsPerPage={pagination.pageSize}
  onPageChange={handlePageChange}
  showItemsPerPage={false}
/>
```

## 🎯 Custom Tooltip Component

### Purpose
Accessibility-focused tooltip component for truncated content and additional information.

### Implementation Details

#### 1. **CSS-Based Tooltip**
```typescript
// Custom tooltip implementation
const CustomTooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ 
  content, 
  children 
}) => {
  return (
    <div className="relative group">
      {children}
      {/* Custom tooltip - accessibility feature */}
      <div className='absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap'>
        {content}
        <div className='absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900'></div>
      </div>
    </div>
  );
};
```

#### 2. **Usage in Table Cells**
```typescript
{
  key: 'restaurant_name',
  label: 'Client',
  title: 'Client',
  sortable: true,
  width: '200px',
  render: (value: unknown) => {
    const clientName = String(value);
    return (
      <div className='relative group'>
        <div
          className='font-semibold text-gray-900'
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '180px',
          }}
        >
          {clientName}
        </div>
        {/* Custom tooltip - accessibility feature */}
        <div className='absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap'>
          {clientName}
          <div className='absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900'></div>
        </div>
      </div>
    );
  },
}
```

## 🔍 Filter Components

### Purpose
Modern filter section with dropdowns, search functionality, and reset capabilities.

### Implementation Details

#### 1. **Filter Section Layout**
```typescript
const renderFilterSection = () => (
  <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-lg p-4 mb-6">
    <div className="flex items-center gap-4">
      <FloatingDropdown
        label="Location Type"
        options={locationTypes.map(type => ({ value: type.value, label: type.label }))}
        value={filters.location_type?.toString() || ''}
        onChange={(value: string) => setFilters(prev => ({ ...prev, location_type: parseInt(value) }))}
        loading={locationTypesLoading}
        placeholder="All Types"
      />

      <FloatingDropdown
        label="Client"
        options={clients.map(client => ({ value: client.id.toString(), label: client.name }))}
        value={filters.client_id?.toString() || ''}
        onChange={(value: string) => setFilters(prev => ({ ...prev, client_id: parseInt(value) }))}
        placeholder="All Clients"
      />

      <Button
        onClick={handleSearch}
        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center gap-1.5 text-sm font-medium"
      >
        <Search className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        onClick={clearFilters}
        className="text-gray-500 hover:text-gray-700 px-2 py-1 text-sm"
      >
        Reset
      </Button>
    </div>
  </div>
);
```

#### 2. **Filter State Management**
```typescript
const [filters, setFilters] = useState<ClientLocationFilters>({
  page: 1,
  limit: 10,
  city_id: user?.city_id,
  location_type: 3, // Default location type
});

const handleSearch = () => {
  setFilters(prev => ({ ...prev, page: 1 }));
  loadClientLocations();
};

const clearFilters = () => {
  setFilters({
    page: 1,
    limit: 10,
    city_id: user?.city_id,
    location_type: 3, // Keep default location type
  });
};
```

## 📊 Data Visualization Patterns

### 1. **Status Badges**
```typescript
const renderStatusBadge = (status: string) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    status.toLowerCase() === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800'
  }`}>
    {status}
  </span>
);
```

### 2. **Type Badges**
```typescript
const renderTypeBadge = (type: string) => (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
    {type}
  </span>
);
```

### 3. **Coordinate Display**
```typescript
const renderCoordinates = (latitude: string, longitude: string) => (
  <div className="text-sm text-gray-600">
    <div className="font-mono text-xs">
      <span className="text-blue-600">Lat:</span> {latitude || 'N/A'}
    </div>
    <div className="font-mono text-xs">
      <span className="text-green-600">Lng:</span> {longitude || 'N/A'}
    </div>
  </div>
);
```

### 4. **Address Display**
```typescript
const renderAddress = (row: Record<string, unknown>) => {
  const address1 = String(row.address_1 || '');
  const address2 = String(row.address_2 || '');
  const landmark = String(row.landmark || '');
  const zipcode = String(row.zipcode || '');
  
  const fullAddress = [address1, address2, landmark, zipcode]
    .filter(part => part.trim())
    .join(', ');
  
  return (
    <div 
      className="text-gray-900 truncate max-w-xs" 
      title={fullAddress}
    >
      {fullAddress || 'N/A'}
    </div>
  );
};
```

## 🚀 Performance Optimizations

### 1. **Memoization**
```typescript
// Memoize column definitions
const columns = useMemo(() => [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    render: (value: unknown) => String(value),
  },
  // ... other columns
], []);

// Memoize filtered data
const filteredData = useMemo(() => {
  return data.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [data, searchTerm]);
```

### 2. **Virtual Scrolling** (Future Enhancement)
```typescript
// For large datasets, implement virtual scrolling
const VirtualizedTable: React.FC<TableProps> = ({ data, ...props }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  
  const visibleData = useMemo(() => {
    return data.slice(visibleRange.start, visibleRange.end);
  }, [data, visibleRange]);
  
  return (
    <Table
      {...props}
      data={visibleData}
    />
  );
};
```

### 3. **Lazy Loading**
```typescript
// Lazy load table data
const LazyTable: React.FC<TableProps> = ({ data, ...props }) => {
  const [loadedData, setLoadedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setLoadedData(data);
      setLoading(false);
    }, 1000);
  }, [data]);
  
  return (
    <Table
      {...props}
      data={loadedData}
      loading={loading}
    />
  );
};
```

## 🔧 Best Practices

### 1. **Component Design**
- **Reusability**: Design components to be reusable across different contexts
- **Flexibility**: Use render props for custom cell content
- **Consistency**: Maintain consistent styling and behavior
- **Accessibility**: Ensure proper ARIA attributes and keyboard navigation

### 2. **Performance**
- **Memoization**: Use React.memo and useMemo for expensive operations
- **Virtual Scrolling**: Implement for large datasets
- **Lazy Loading**: Load data incrementally
- **Debouncing**: Debounce search and filter operations

### 3. **Data Handling**
- **Type Safety**: Use TypeScript interfaces for data structures
- **Error Handling**: Handle loading and error states gracefully
- **Validation**: Validate data before rendering
- **Sorting**: Implement efficient sorting algorithms

### 4. **User Experience**
- **Loading States**: Show loading indicators during data fetching
- **Empty States**: Handle empty data gracefully
- **Error States**: Display meaningful error messages
- **Responsive Design**: Ensure mobile-friendly layouts

---

**Next**: [Authentication & Authorization](./08-Authentication-Authorization.md) - Login, protected routes, and RBAC implementation
