# Component Architecture

This document provides comprehensive details about the component architecture, including reusable vs specific components, component patterns, and best practices used in the Client CRUD system.

## 🏗️ Component Architecture Overview

### Component Classification

```
Components/
├── UI Components (Reusable)           # Generic, configurable components
│   ├── FloatingInput.tsx
│   ├── FloatingDropdown.tsx
│   ├── DataDisplay.tsx
│   ├── Pagination.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   └── Alert.tsx
├── Layout Components (Structural)     # Application structure
│   ├── Sidebar.tsx
│   ├── ProtectedRoute.tsx
│   └── Navigation.tsx
└── Page Components (Specific)         # Business logic components
    ├── Login.tsx
    ├── AddClient.tsx
    ├── EditClient.tsx
    └── ManageClients.tsx
```

## 🎨 Reusable UI Components

### 1. **FloatingInput Component** (`src/components/ui/FloatingInput.tsx`)

#### Purpose
Material UI-style floating label input component with validation support.

#### Interface
```typescript
export interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
}
```

#### Implementation Highlights
```typescript
export const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, value, onChange, error, required, disabled, className, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value.length > 0;
    const showLabel = isFocused || hasValue;

    return (
      <div className={`relative ${className}`}>
        <input
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          className={`
            w-full px-4 pt-6 pb-2 border rounded-lg transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
            ${error ? 'border-red-500' : 'border-gray-300 focus:border-green-500'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
          {...props}
        />
        
        <label
          className={`
            absolute left-4 transition-all duration-200 pointer-events-none
            ${showLabel 
              ? 'top-2 text-xs text-gray-600' 
              : 'top-1/2 transform -translate-y-1/2 text-gray-500'
            }
            ${error ? 'text-red-500' : ''}
            ${required ? "after:content-['*'] after:text-red-500 after:ml-1" : ''}
          `}
        >
          {label}
        </label>
        
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);
```

#### Usage Examples
```typescript
// Basic usage
<FloatingInput
  label="Client Name"
  value={formData.name}
  onChange={(value) => handleInputChange('name', value)}
  required
/>

// With error handling
<FloatingInput
  label="Email Address"
  value={formData.email}
  onChange={(value) => handleInputChange('email', value)}
  type="email"
  error={errors.email}
  required
/>

// Disabled state
<FloatingInput
  label="City"
  value={formData.city}
  onChange={(value) => handleInputChange('city', value)}
  disabled={user?.userTypeId ? user.userTypeId > 4 : false}
/>
```

### 2. **FloatingDropdown Component** (`src/components/ui/FloatingDropdown.tsx`)

#### Purpose
Searchable dropdown component with floating labels and API integration support.

#### Interface
```typescript
export interface DropdownOption {
  value: string;
  label: string;
}

export interface FloatingDropdownProps {
  label: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  searchable?: boolean;
}
```

#### Implementation Highlights
```typescript
export const FloatingDropdown: React.FC<FloatingDropdownProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  loading = false,
  error,
  required = false,
  disabled = false,
  searchable = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  const selectedOption = options.find(option => option.value === value);
  const hasValue = Boolean(selectedOption);
  const showLabel = isFocused || hasValue || isOpen;

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <div
        className={`
          relative w-full px-4 pt-6 pb-2 border rounded-lg cursor-pointer
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500
          ${error ? 'border-red-500' : 'border-gray-300 focus:border-green-500'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          ${isOpen ? 'ring-2 ring-green-500 border-transparent' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        <span className={`block ${hasValue ? 'text-gray-900' : 'text-gray-500'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        
        <label className={`
          absolute left-4 transition-all duration-200 pointer-events-none
          ${showLabel 
            ? 'top-2 text-xs text-gray-600' 
            : 'top-1/2 transform -translate-y-1/2 text-gray-500'
          }
          ${error ? 'text-red-500' : ''}
          ${required ? "after:content-['*'] after:text-red-500 after:ml-1" : ''}
        `}>
          {label}
        </label>
        
        <ChevronDown className={`
          absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400
          transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}
        `} />
      </div>

      {isOpen && (
        <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-center text-gray-500">Loading...</div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-gray-500">No options found</div>
            )}
          </div>
        </div>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
```

#### Usage Examples
```typescript
// Basic dropdown
<FloatingDropdown
  label="Location Type"
  options={locationTypes.map(type => ({ value: type.value, label: type.label }))}
  value={formData.locationType}
  onChange={(value) => handleInputChange('locationType', value)}
  loading={locationTypesLoading}
  required
/>

// With API integration
<FloatingDropdown
  label="Facility"
  options={facilities.map((facility: unknown) => ({
    value: (facility as any).id.toString(),
    label: (facility as any).location || `Facility ${(facility as any).id}`,
  }))}
  value={formData.facility || ''}
  onChange={(value) => handleInputChange('facility', value)}
  loading={facilitiesApi.loading}
  placeholder="Select Facility"
  required
/>

// Disabled dropdown
<FloatingDropdown
  label="Country"
  options={countries.map(country => ({ value: country.value, label: country.label }))}
  value={formData.country}
  onChange={(value) => handleInputChange('country', value)}
  disabled={user?.userTypeId ? user.userTypeId > 4 : false}
  required
/>
```

### 3. **DataTable Component** (`src/components/ui/DataDisplay.tsx`)

#### Purpose
Reusable data table component with sorting, custom rendering, and responsive design.

#### Interface
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

#### Implementation Highlights
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

#### Usage Examples
```typescript
// Basic table
<Table
  columns={columns}
  data={clientLocations}
  loading={loading}
  sortBy={sortBy}
  sortOrder={sortOrder}
  onSort={handleSort}
/>

// With custom column rendering
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
];
```

### 4. **Pagination Component** (`src/components/ui/Pagination.tsx`)

#### Purpose
Modern pagination component with customizable page sizes and navigation.

#### Interface
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

#### Implementation Highlights
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

#### Usage Examples
```typescript
<Pagination
  currentPage={pagination.currentPage}
  totalPages={pagination.totalPages}
  totalItems={pagination.totalCount}
  itemsPerPage={pagination.pageSize}
  onPageChange={handlePageChange}
  onItemsPerPageChange={handleItemsPerPageChange}
  showItemsPerPage={true}
  className="mt-4"
/>
```

## 🏠 Layout Components

### 1. **Sidebar Component** (`src/components/Sidebar.tsx`)

#### Purpose
Responsive navigation sidebar with role-based menu permissions and state persistence.

#### Key Features
- **Role-Based Access**: Menu items filtered by user permissions
- **State Persistence**: Expanded menus saved to localStorage
- **Responsive Design**: Collapsible on mobile devices
- **User Profile**: Displays user initials and logout option

#### Implementation Highlights
```typescript
export const Sidebar: React.FC = () => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { userMenus } = useUserMenus();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // Restore expanded menus from localStorage
  useEffect(() => {
    const savedExpandedMenus = localStorage.getItem('expandedMenus');
    if (savedExpandedMenus) {
      try {
        const parsed = JSON.parse(savedExpandedMenus);
        setExpandedMenus(new Set(parsed));
      } catch (error) {
        console.error('Failed to parse expanded menus:', error);
      }
    }
  }, []);

  // Save expanded menus to localStorage
  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      
      // Save to localStorage
      localStorage.setItem('expandedMenus', JSON.stringify([...newSet]));
      return newSet;
    });
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
            {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name || 'User'}</p>
            <p className="text-sm text-gray-500">{user?.role || 'Role'}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <MenuRenderer
          menus={userMenus}
          expandedMenus={expandedMenus}
          onToggleMenu={toggleMenu}
        />
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
};
```

### 2. **ProtectedRoute Component** (`src/components/ProtectedRoute.tsx`)

#### Purpose
Route protection component that ensures authentication before rendering protected pages.

#### Implementation Highlights
```typescript
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isInitialized } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isInitialized, navigate]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
```

## 📄 Page Components

### 1. **AddClient Component** (`src/pages/AddClient.tsx`)

#### Purpose
Complete form for creating new client locations with dynamic fields and validation.

#### Key Features
- **Dynamic Form Fields**: Conditional rendering based on billing type
- **API Integration**: Real-time data fetching for dropdowns
- **Validation**: Client-side validation with error display
- **User Restrictions**: Disabled fields for non-super admins
- **State Preloading**: Auto-fill city/state for non-super admins

#### Component Structure
```typescript
export const AddClient: React.FC = () => {
  // State management
  const [formData, setFormData] = useState<ClientFormData>({...});
  const [errors, setErrors] = useState<Partial<ClientFormData>>({});
  const [facilities, setFacilities] = useState<unknown[]>([]);

  // Redux integration
  const { user } = useSelector((state: RootState) => state.auth);

  // API hooks
  const { countries, loading: countriesLoading } = useCountries();
  const { states, loading: statesLoading } = useStates();
  const { cities, loading: citiesLoading } = useCities();
  const facilitiesApi = useApi('facilities', async () => {...});

  // Form handlers
  const handleInputChange = (field: keyof ClientFormData, value: string | boolean) => {...};
  const handleSubmit = async (e: React.FormEvent) => {...};

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Client Information Section */}
          <Card className="p-8">
            {/* Form fields */}
          </Card>
          
          {/* Location Details Section */}
          <Card className="p-8">
            {/* Location fields */}
          </Card>
          
          {/* Billing Type Section */}
          <Card className="p-8">
            {/* Billing fields with conditional rendering */}
          </Card>
          
          {/* Impact Type Section */}
          <Card className="p-8">
            {/* Impact type fields */}
          </Card>
        </form>
      </div>
    </div>
  );
};
```

### 2. **EditClient Component** (`src/pages/EditClient.tsx`)

#### Purpose
Form for editing existing client locations with pre-filled data and persistence.

#### Key Features
- **Data Pre-filling**: Form populated from Redux state
- **Persistence**: Data survives page refresh via localStorage
- **Same Logic**: Reuses AddClient form logic with modifications
- **Navigation**: Back button to return to manage page

#### Implementation Highlights
```typescript
export const EditClient: React.FC = () => {
  const { selectedLocation } = useSelector((state: RootState) => state.client);

  // Restore selected location from localStorage on page refresh
  useEffect(() => {
    if (!selectedLocation) {
      const savedLocation = localStorage.getItem('selectedClientLocation');
      if (savedLocation) {
        try {
          const location = JSON.parse(savedLocation);
          dispatch(restoreSelectedLocation(location));
        } catch (error) {
          console.error('Failed to parse saved location:', error);
          navigate('/clients/manage');
        }
      } else {
        navigate('/clients/manage');
      }
    }
  }, [selectedLocation, dispatch, navigate]);

  // Pre-fill form data
  useEffect(() => {
    if (selectedLocation) {
      setFormData({
        name: selectedLocation.restaurant_name || '',
        address1: selectedLocation.address_1 || '',
        // ... other fields
      });
    }
  }, [selectedLocation]);

  // Rest of component similar to AddClient
};
```

### 3. **ManageClients Component** (`src/pages/ManageClients.tsx`)

#### Purpose
Data table for managing client locations with filtering, sorting, and pagination.

#### Key Features
- **Data Table**: Sortable columns with custom rendering
- **Filtering**: Location type and client filters
- **Pagination**: Modern pagination with "All" option
- **Search**: Real-time search functionality
- **Actions**: Edit button for each row
- **Responsive**: Horizontal scroll on mobile

#### Implementation Highlights
```typescript
export const ManageClients: React.FC = () => {
  // State management
  const [clientLocations, setClientLocations] = useState<ClientLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ClientLocationFilters>({
    page: 1,
    limit: 10,
    city_id: user?.city_id,
    location_type: 3, // Default location type
  });

  // API integration
  const clientLocationsApi = useApi('clientLocations', async (filters: ClientLocationFilters) => {
    return await ClientApiService.getLocations(filters);
  });

  // Data loading
  const loadClientLocations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await clientLocationsApi.execute(filtersToUse);
      
      if (response.statusCode === 200) {
        const locations = (response.data as unknown as ClientLocation[]) || [];
        setClientLocations(locations);
        dispatch(setLocations(locations));
      }
    } catch (error) {
      setError('Failed to load client locations');
    } finally {
      setLoading(false);
    }
  }, [clientLocationsApi, filtersToUse, dispatch]);

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manage Clients</h1>
          {/* City and count info */}
        </div>

        {/* Filter Section */}
        <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <FloatingDropdown {...locationTypeProps} />
            <FloatingDropdown {...clientProps} />
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="ghost" onClick={clearFilters}>Reset</Button>
          </div>
        </div>

        {/* Data Table */}
        <Table
          columns={columns}
          data={clientLocations}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />

        {/* Pagination */}
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalCount}
          itemsPerPage={pagination.pageSize}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>
    </div>
  );
};
```

## 🎯 Component Design Patterns

### 1. **Composition Pattern**
```typescript
// Composing complex components from simpler ones
<Card className="p-8">
  <div className="flex items-center gap-3 mb-6">
    <Building className="w-6 h-6 text-green-600" />
    <h2 className="text-xl font-semibold text-gray-900">Client Information</h2>
  </div>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <FloatingInput {...nameProps} />
    <FloatingInput {...addressProps} />
    <FloatingDropdown {...locationProps} />
    <FloatingDropdown {...billingProps} />
  </div>
</Card>
```

### 2. **Render Props Pattern**
```typescript
// Custom rendering in table columns
{
  key: 'billing',
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
}
```

### 3. **Higher-Order Component Pattern**
```typescript
// ProtectedRoute wraps other components
<ProtectedRoute>
  <ManageClients />
</ProtectedRoute>
```

### 4. **Custom Hook Pattern**
```typescript
// Encapsulating component logic in custom hooks
const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
const { locations, loading } = useClientLocations(filters);
const { countries, states, cities } = useLocationData();
```

## 🔧 Best Practices

### 1. **Component Organization**
- **UI Components**: Pure presentation, highly reusable
- **Layout Components**: Application structure and routing
- **Page Components**: Business logic and state management
- **Custom Hooks**: Reusable logic extraction

### 2. **Props Design**
- **Consistent Interfaces**: Similar props across similar components
- **Optional Props**: Sensible defaults for optional properties
- **Type Safety**: Comprehensive TypeScript interfaces
- **Documentation**: Clear prop descriptions and examples

### 3. **State Management**
- **Local State**: Component-specific state
- **Redux State**: Global application state
- **Form State**: Controlled components with validation
- **API State**: Loading, error, and success states

### 4. **Performance Optimization**
- **Memoization**: React.memo for expensive components
- **Callback Optimization**: useCallback for event handlers
- **Effect Dependencies**: Proper dependency arrays
- **Conditional Rendering**: Efficient re-render prevention

---

**Next**: [Client Management Pages](./05-Client-Management-Pages.md) - Detailed page implementations
