# 🏗️ Reusable Components Architecture

## 📋 Overview
This document outlines the architectural patterns and design principles used for creating reusable components in the IB Dashboard project. It covers component composition, state management, performance optimization, and maintainability strategies.

---

## 🎯 Architecture Principles

### 🔄 Component Composition
The project follows a **composition-over-inheritance** approach, where complex UI elements are built by combining smaller, focused components.

#### Example: Filter Section Composition
```tsx
// Instead of one monolithic FilterSection component
const FilterSection = () => {
  return (
    <div className="filter-container">
      <FloatingDropdown {...facilityProps} />
      <FloatingDropdown {...clientProps} />
      <FloatingDropdown {...transitProps} />
      <MultiSelectDropdown {...columnProps} />
      <SearchButton onClick={handleSearch} />
    </div>
  );
};
```

### 📦 Single Responsibility Principle
Each component has one clear purpose:

- **SearchButton**: Handles search interactions with consistent styling
- **FloatingDropdown**: Provides dropdown functionality with floating labels
- **MultiSelectDropdown**: Manages multi-selection with search capabilities
- **Table**: Displays tabular data with sorting and pagination
- **Pagination**: Handles page navigation and size selection

---

## 🏛️ Component Hierarchy

### 📊 Component Layers

```
📁 src/components/
├── 🎨 ui/                    # Reusable UI components
│   ├── SearchButton.tsx      # Action components
│   ├── FloatingDropdown.tsx  # Form components
│   ├── MultiSelectDropdown.tsx # Selection components
│   ├── Table.tsx            # Data display components
│   ├── Pagination.tsx       # Navigation components
│   └── index.ts             # Barrel exports
├── 📄 pages/                 # Page-level components
│   ├── MasterPlanListing.tsx # Business logic + UI composition
│   ├── ManageClients.tsx    # Business logic + UI composition
│   └── AddClient.tsx        # Business logic + UI composition
└── 🔧 services/             # Business logic layer
    ├── transitPlanApi.ts    # API service layer
    ├── clientApi.ts         # API service layer
    └── authApi.ts           # API service layer
```

### 🎯 Component Categories

#### 1. **Primitive Components** (Building Blocks)
- Basic UI elements with minimal logic
- Highly reusable across different contexts
- Focus on presentation and basic interaction

```tsx
// Example: SearchButton (Primitive)
interface SearchButtonProps {
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}
```

#### 2. **Composite Components** (Feature Components)
- Combine multiple primitive components
- Handle specific business logic
- Provide higher-level abstractions

```tsx
// Example: FilterChips (Composite)
interface FilterChipsProps {
  filterGroups: FilterChipGroup[];
  activeFilters: Record<string, string>;
  onFilterChange: (groupId: string, value: string) => void;
}
```

#### 3. **Page Components** (Application Components)
- Orchestrate multiple composite components
- Handle page-level state and business logic
- Connect to services and global state

```tsx
// Example: MasterPlanListing (Page)
const MasterPlanListing = () => {
  // Page-level state management
  // Service integration
  // Component composition
};
```

---

## 🔧 State Management Patterns

### 📊 State Distribution Strategy

#### **Local State** (Component Level)
```typescript
// UI interaction state
const [isOpen, setIsOpen] = useState(false);
const [searchTerm, setSearchTerm] = useState('');
const [loading, setLoading] = useState(false);
```

#### **Page State** (Page Level)
```typescript
// Business data state
const [rows, setRows] = useState<MasterPlanRow[]>([]);
const [filters, setFilters] = useState<FilterState>({});
const [pagination, setPagination] = useState({ page: 1, size: 10 });
```

#### **Global State** (Application Level)
```typescript
// Shared application state
const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
const { locations, selectedLocation } = useSelector((state: RootState) => state.client);
```

### 🎯 State Management Rules

1. **Keep UI state local** - Component-specific interactions
2. **Lift business state up** - Data that affects multiple components
3. **Use global state sparingly** - Only for truly shared data
4. **Derive state when possible** - Use `useMemo` for computed values

---

## ⚡ Performance Optimization Patterns

### 🧠 Memoization Strategies

#### **Component Memoization**
```tsx
// Prevent unnecessary re-renders
const MemoizedDropdown = React.memo(FloatingDropdown, (prevProps, nextProps) => {
  return prevProps.value === nextProps.value && 
         prevProps.options === nextProps.options;
});
```

#### **Hook Memoization**
```tsx
// Memoize expensive calculations
const filteredOptions = useMemo(() => {
  return options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [options, searchTerm]);

// Memoize event handlers
const handleFilterChange = useCallback((value: string) => {
  setFilters(prev => ({ ...prev, [name]: value }));
}, [name]);
```

#### **Column Definition Memoization**
```tsx
// Prevent table re-renders on every render
const columns = useMemo(() => [
  { key: 'actions', label: 'Actions', render: ActionsRenderer },
  { key: 'name', label: 'Name', render: NameRenderer },
  // ... more columns
], [pageNumber, itemsPerPage]); // Dependencies
```

### 🎯 Rendering Optimization

#### **Conditional Rendering**
```tsx
// Only render when needed
{loading && <LoadingSpinner />}
{error && <ErrorMessage error={error} />}
{rows.length === 0 && !loading && <EmptyState />}
```

#### **Virtual Scrolling** (For Large Lists)
```tsx
// For future implementation with large datasets
const VirtualizedTable = ({ data, height = 400 }) => {
  return (
    <FixedSizeList
      height={height}
      itemCount={data.length}
      itemSize={50}
      itemData={data}
    >
      {RowRenderer}
    </FixedSizeList>
  );
};
```

---

## 🎨 Design System Integration

### 🎯 Consistent Styling Patterns

#### **CSS-in-JS with TailwindCSS**
```tsx
// Consistent class patterns
const buttonClasses = cn(
  'px-4 py-2 rounded-lg transition-all duration-200',
  'hover:scale-105 focus:ring-2 focus:ring-green-500',
  variant === 'primary' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700',
  disabled && 'opacity-50 cursor-not-allowed'
);
```

#### **Theme Integration**
```tsx
// CSS custom properties for theming
const theme = {
  colors: {
    primary: 'var(--color-primary)',
    secondary: 'var(--color-secondary)',
    background: 'var(--color-background)',
  },
  spacing: {
    sm: 'var(--spacing-sm)',
    md: 'var(--spacing-md)',
    lg: 'var(--spacing-lg)',
  },
};
```

### 🎨 Component Variants

#### **Size Variants**
```tsx
interface ComponentProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};
```

#### **Style Variants**
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
}

const variantClasses = {
  primary: 'bg-green-500 text-white hover:bg-green-600',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-50',
};
```

---

## 🔌 API Integration Patterns

### 📡 Service Layer Architecture

#### **Centralized API Services**
```typescript
// TransitPlanApi.ts
export const TransitPlanApi = {
  async getFacilities(cityId: number): Promise<ApiResponse<FacilityOption[]>> {
    return api.get(`/locations/getLocations?location_type=2&city_id=${cityId}`);
  },
  
  async getMasterPlanListing(params: ListingParams): Promise<ApiResponse<MasterPlanResponse>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value));
    });
    return api.get(`/plan/getMasterPlanListing?${searchParams.toString()}`);
  },
};
```

#### **Custom Hooks for API Integration**
```typescript
// useApi.ts
export const useApi = <T>(apiCall: () => Promise<ApiResponse<T>>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiCall();
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  return { data, loading, error, execute };
};
```

### 🔄 Data Flow Patterns

#### **Unidirectional Data Flow**
```
User Action → Component Event → State Update → API Call → Data Update → UI Re-render
```

#### **Error Handling Pattern**
```tsx
const DataComponent = () => {
  const { data, loading, error, execute } = useApi(() => api.getData());
  
  useEffect(() => {
    execute();
  }, [execute]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <EmptyState />;
  
  return <DataDisplay data={data} />;
};
```

---

## 🧪 Testing Strategies

### 🔍 Component Testing Patterns

#### **Unit Testing**
```typescript
// SearchButton.test.tsx
describe('SearchButton', () => {
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<SearchButton onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('applies disabled state correctly', () => {
    render(<SearchButton onClick={jest.fn()} disabled />);
    
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

#### **Integration Testing**
```typescript
// MasterPlanListing.test.tsx
describe('MasterPlanListing Integration', () => {
  it('filters data when search button is clicked', async () => {
    const mockApi = jest.spyOn(TransitPlanApi, 'getMasterPlanListing');
    mockApi.mockResolvedValue({ data: { rows: mockData } });
    
    render(<MasterPlanListing />);
    
    // Select filter
    fireEvent.change(screen.getByLabelText('Client'), { target: { value: '1' } });
    
    // Click search
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    
    await waitFor(() => {
      expect(mockApi).toHaveBeenCalledWith(
        expect.objectContaining({ restaurantId: 1 })
      );
    });
  });
});
```

### 🎯 Testing Best Practices

1. **Test Behavior, Not Implementation** - Focus on user interactions
2. **Mock External Dependencies** - APIs, services, and external libraries
3. **Test Edge Cases** - Empty states, error conditions, loading states
4. **Accessibility Testing** - Keyboard navigation, screen reader support
5. **Performance Testing** - Large datasets, memory leaks, render performance

---

## 📚 Documentation Standards

### 📝 Component Documentation Template

```markdown
## ComponentName

### Purpose
Brief description of what the component does and when to use it.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| prop1 | string | - | Description of prop1 |
| prop2 | boolean | false | Description of prop2 |

### Usage Examples
```tsx
// Basic usage
<ComponentName prop1="value" prop2={true} />

// Advanced usage
<ComponentName 
  prop1="value" 
  prop2={true}
  customProp="custom"
/>
```

### Accessibility
- Keyboard navigation support
- Screen reader compatibility
- Focus management

### Performance Notes
- Memoization strategies used
- Re-render optimization
- Memory considerations
```

### 🎯 Documentation Requirements

1. **Clear Purpose** - What problem does it solve?
2. **Complete Props** - All props with types and descriptions
3. **Usage Examples** - Basic and advanced usage patterns
4. **Accessibility Info** - Keyboard and screen reader support
5. **Performance Notes** - Optimization strategies and considerations
6. **Related Components** - Links to related or complementary components

---

## 🚀 Future Enhancements

### 🔮 Planned Improvements

#### **Component Library Expansion**
- **DataTable**: Advanced table with sorting, filtering, and virtualization
- **FormBuilder**: Dynamic form generation from JSON schemas
- **Chart Components**: Reusable chart components for data visualization
- **Modal System**: Consistent modal and dialog management

#### **Performance Optimizations**
- **Code Splitting**: Lazy loading for page components
- **Bundle Optimization**: Tree shaking and dead code elimination
- **Caching Strategies**: API response caching and memoization
- **Virtual Scrolling**: For large data sets

#### **Developer Experience**
- **Storybook Integration**: Component documentation and testing
- **Design Tokens**: Centralized design system tokens
- **Automated Testing**: Visual regression testing
- **Performance Monitoring**: Component performance metrics

### 🎯 Migration Strategy

#### **Backward Compatibility**
- Maintain existing component APIs
- Gradual migration to new patterns
- Deprecation warnings for old patterns
- Clear migration guides

#### **Version Management**
- Semantic versioning for component library
- Breaking change communication
- Migration tools and scripts
- Documentation updates

---

## 📖 Related Documentation
- [UI Components Guide](./12-UI-Components.md)
- [Master Plan Listing Implementation](../Master-plan-listing.md)
- [API Integration Patterns](./02-API-Integration.md)
- [State Management Architecture](./03-Redux-Architecture.md)
