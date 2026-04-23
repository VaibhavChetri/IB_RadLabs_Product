# 🎨 UI Components Documentation

## 📋 Overview
This document covers the reusable UI components created for the IB Dashboard project, focusing on modern design patterns, accessibility, and consistent user experience across the application.

---

## 🔍 SearchButton Component

### 📁 Location
`src/components/ui/SearchButton.tsx`

### 🎯 Purpose
A reusable search button component that provides consistent styling and interaction patterns across all pages that require search functionality.

### ✨ Features
- **Consistent Styling**: Modern design with hover effects and animations
- **Size Variants**: Small, medium, and large sizes
- **Accessibility**: Proper focus management and keyboard support
- **Auto-blur**: Automatically removes focus after click to prevent persistent borders
- **Icon Integration**: Built-in search icon with hover animations

### 🔧 Props Interface
```typescript
interface SearchButtonProps {
  onClick: () => void;           // Required click handler
  title?: string;                // Tooltip text (default: 'Search')
  disabled?: boolean;            // Disabled state (default: false)
  size?: 'sm' | 'md' | 'lg';     // Size variant (default: 'md')
  className?: string;            // Additional CSS classes
}
```

### 🎨 Styling Features
- **Rounded Rectangle**: `rounded-lg` for modern appearance
- **Gradient Background**: Subtle white-to-gray gradient
- **Hover Effects**: Green gradient with border and shadow
- **Focus Ring**: Green focus ring for accessibility
- **Active Scale**: `scale-95` on click for tactile feedback
- **Ripple Effect**: Subtle hover circle animation

### 📝 Usage Examples

#### Basic Usage
```tsx
import { SearchButton } from '../components/ui';

<SearchButton 
  onClick={() => handleSearch()} 
  title="Search locations" 
/>
```

#### With Custom Size
```tsx
<SearchButton 
  onClick={() => handleSearch()} 
  size="lg" 
  title="Search all records" 
/>
```

#### Disabled State
```tsx
<SearchButton 
  onClick={() => handleSearch()} 
  disabled={loading} 
  title="Search" 
/>
```

### 🎯 Implementation Details
- Uses `lucide-react` Search icon
- Implements `forwardRef` for ref forwarding
- Auto-blur functionality prevents focus persistence
- TailwindCSS classes for responsive design
- Smooth transitions with `duration-300`

---

## 🎛️ ModernFilter Component

### 📁 Location
`src/components/ui/ModernFilter.tsx`

### 🎯 Purpose
An advanced filter component that provides a modern, pill-based filtering interface with search capabilities and dynamic filter management.

### ✨ Features
- **Smart Search**: Global search across all filter options
- **Floating Filter Pills**: Active filters displayed as removable pills
- **Add Filter Dropdown**: Collapsible filter selection panel
- **Glass Morphism**: Modern backdrop blur effect
- **Responsive Design**: Grid layout that adapts to screen size

### 🔧 Props Interface
```typescript
interface ModernFilterProps {
  filters: FilterOption[];           // Available filter options
  activeFilters: ActiveFilter[];      // Currently active filters
  onFilterAdd: (id: string, value: string) => void;    // Add filter handler
  onFilterRemove: (id: string) => void;                // Remove filter handler
  onClearAll: () => void;             // Clear all filters handler
  onSearch: () => void;               // Search button handler
  searchPlaceholder?: string;         // Search input placeholder
  className?: string;                 // Additional CSS classes
}

interface FilterOption {
  id: string;
  label: string;
  value: string;
  type: 'dropdown' | 'multiselect';
  options: Array<{ label: string; value: string }>;
}

interface ActiveFilter {
  id: string;
  label: string;
  value: string;
  displayValue: string;
}
```

### 🎨 Design Features
- **Glass Morphism**: `bg-white/90 backdrop-blur-sm`
- **Rounded Corners**: `rounded-2xl` for modern appearance
- **Subtle Shadows**: `shadow-lg` with gray tint
- **Green Accents**: Consistent with app theme
- **Smooth Animations**: `animate-in slide-in-from-left`

### 📝 Usage Examples

#### Basic Implementation
```tsx
import { ModernFilter } from '../components/ui';

const filterOptions = [
  {
    id: 'facility_id',
    label: 'Washing Facility',
    value: '',
    type: 'dropdown',
    options: facilities,
  },
  // ... more filters
];

<ModernFilter
  filters={filterOptions}
  activeFilters={activeFilters}
  onFilterAdd={handleFilterAdd}
  onFilterRemove={handleFilterRemove}
  onClearAll={handleClearAll}
  onSearch={handleSearch}
  searchPlaceholder="Search clients, facilities, or types..."
/>
```

### 🎯 Implementation Details
- Uses `useState` for local search term management
- Implements `useMemo` for filtered options optimization
- Responsive grid layout with `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Conditional rendering for filter dropdown panel

---

## 🏷️ FilterChips Component

### 📁 Location
`src/components/ui/FilterChips.tsx`

### 🎯 Purpose
A chip-based filter component that displays all available filter options as clickable chips, providing an always-visible filtering interface.

### ✨ Features
- **Always-Visible Filters**: All filter options displayed as chips
- **Smart Search**: Real-time filtering of available chips
- **Visual Feedback**: Active/inactive chip states with animations
- **Filter Summary**: Shows applied filters with remove buttons
- **Grouped Layout**: Filters organized by category

### 🔧 Props Interface
```typescript
interface FilterChipsProps {
  filterGroups: FilterChipGroup[];    // Filter groups with options
  activeFilters: Record<string, string>; // Active filter values
  onFilterChange: (groupId: string, value: string) => void; // Filter change handler
  onClearAll: () => void;             // Clear all filters handler
  onSearch: () => void;               // Search button handler
  searchPlaceholder?: string;         // Search input placeholder
  className?: string;                 // Additional CSS classes
}

interface FilterChipGroup {
  id: string;
  label: string;
  options: FilterChipOption[];
}

interface FilterChipOption {
  id: string;
  label: string;
  value: string;
}
```

### 🎨 Design Features
- **Chip States**: Gray (inactive) vs Green (active) with scale effects
- **Hover Animations**: `hover:scale-105` for interactive feedback
- **Active Summary**: Green background with remove buttons
- **Responsive Layout**: Flexible chip wrapping

### 📝 Usage Examples

#### Basic Implementation
```tsx
import { FilterChips } from '../components/ui';

const filterGroups = [
  {
    id: 'facility_id',
    label: 'Washing Facility',
    options: facilities,
  },
  {
    id: 'client_id',
    label: 'Client',
    options: clients,
  },
];

<FilterChips
  filterGroups={filterGroups}
  activeFilters={activeFilters}
  onFilterChange={handleFilterChange}
  onClearAll={handleClearAll}
  onSearch={handleSearch}
/>
```

### 🎯 Implementation Details
- Uses `Record<string, string>` for simple active filter state
- Implements real-time search filtering
- Conditional rendering for active filter summary
- Optimized with `useMemo` for filtered groups

---

## 🏗️ Component Architecture Patterns

### 📦 Barrel Exports
All components are exported through `src/components/ui/index.ts` for clean imports:

```typescript
// Barrel exports for UI components
export { SearchButton } from './SearchButton';
export { ModernFilter } from './ModernFilter';
export { FilterChips } from './FilterChips';
export { FloatingDropdown } from './FloatingDropdown';
export { MultiSelectDropdown } from './MultiSelectDropdown';
// ... other components
```

### 🎨 Design System Consistency

#### Color Palette
- **Primary Green**: `text-green-600`, `bg-green-500`, `border-green-400`
- **Gray Scale**: `text-gray-600`, `bg-gray-100`, `border-gray-300`
- **Background**: `bg-white`, `bg-white/90` for transparency

#### Spacing System
- **Small**: `p-2`, `px-3 py-1.5`
- **Medium**: `p-4`, `px-4 py-2`
- **Large**: `p-6`, `px-6 py-3`

#### Border Radius
- **Small**: `rounded-lg` (8px)
- **Medium**: `rounded-xl` (12px)
- **Large**: `rounded-2xl` (16px)

### 🔧 Performance Optimizations

#### Memoization Patterns
```typescript
// Component-level memoization
const MemoizedComponent = React.memo(Component);

// Hook-level optimization
const memoizedValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

const memoizedCallback = useCallback(() => {
  handleAction();
}, [dependency]);
```

#### State Management
- **Local State**: `useState` for component-specific data
- **Derived State**: `useMemo` for computed values
- **Event Handlers**: `useCallback` for stable references

### 🎯 Accessibility Features

#### Keyboard Navigation
- **Tab Order**: Logical tab sequence
- **Focus Management**: Proper focus handling
- **Keyboard Shortcuts**: Enter/Space for activation

#### Screen Reader Support
- **ARIA Labels**: Descriptive labels for interactive elements
- **Role Attributes**: Proper semantic roles
- **Live Regions**: Dynamic content announcements

#### Visual Accessibility
- **Color Contrast**: WCAG AA compliant contrast ratios
- **Focus Indicators**: Clear focus rings
- **Hover States**: Visual feedback for interactions

---

## 🚀 Best Practices

### ✅ Do's
1. **Use Barrel Exports**: Import from `../components/ui` for consistency
2. **Implement forwardRef**: For components that need ref forwarding
3. **Add PropTypes/TypeScript**: Strong typing for better development experience
4. **Optimize Performance**: Use memoization for expensive operations
5. **Test Accessibility**: Ensure keyboard navigation and screen reader support

### ❌ Don'ts
1. **Don't Hardcode Styles**: Use TailwindCSS classes consistently
2. **Don't Skip Error Handling**: Always handle edge cases and errors
3. **Don't Ignore Performance**: Avoid unnecessary re-renders
4. **Don't Forget Accessibility**: Always consider users with disabilities
5. **Don't Duplicate Logic**: Extract common patterns into reusable components

---

## 🔧 Development Guidelines

### 📝 Component Creation Checklist
- [ ] Define TypeScript interfaces for props
- [ ] Implement forwardRef if needed
- [ ] Add proper error handling
- [ ] Include accessibility features
- [ ] Add hover and focus states
- [ ] Test with different screen sizes
- [ ] Document usage examples
- [ ] Export through barrel file

### 🎨 Styling Guidelines
- [ ] Use TailwindCSS utility classes
- [ ] Follow design system color palette
- [ ] Implement consistent spacing
- [ ] Add smooth transitions
- [ ] Ensure responsive design
- [ ] Test dark mode compatibility (if applicable)

### 🧪 Testing Considerations
- [ ] Unit tests for component logic
- [ ] Integration tests for user interactions
- [ ] Accessibility tests with screen readers
- [ ] Visual regression tests
- [ ] Performance tests for large datasets

---

## 📚 Related Documentation
- [Master Plan Listing Implementation](./Master-plan-listing.md)
- [Client CRUD Documentation](./01-Overview.md)
- [API Integration Guide](./02-API-Integration.md)
- [State Management Patterns](./03-Redux-Architecture.md)
