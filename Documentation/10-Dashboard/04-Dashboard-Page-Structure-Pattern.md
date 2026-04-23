# Dashboard Page Structure Pattern

## Overview

This document defines the standard page structure pattern used in Dashboard.tsx. **All new dashboard-style pages should follow this pattern** for consistency, maintainability, and scalability.

---

## Pattern Structure

### Visual Architecture

```
Dashboard Page (src/pages/Dashboard.tsx)
├── ErrorBoundary (outer)
│   └── Page Container (div.space-y-6)
│       ├── PageHeader Component
│       ├── Filters Component (from feature folder)
│       └── ErrorBoundary (inner)
│           └── Content Component (from feature folder)
```

### Code Structure

```typescript
// src/pages/Dashboard.tsx - 72 lines total
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { PageHeader } from '../components/ui';
import { ErrorBoundary } from '../components/ErrorBoundary';
import {
  DashboardFilters,        // Separate component
  DashboardContent,         // Separate component
  useDashboardFilters,      // Custom hook for logic
  useDashboardDataQuery,    // Custom hook for data
} from '../features/dashboard';

export const Dashboard: React.FC = () => {
  // 1. Get user from Redux
  const { user } = useSelector((state: RootState) => state.auth);

  // 2. Use filter hook (handles all filter logic)
  const {
    selectedMonth,
    selectedClient,
    selectedFacility,
    clientOptions,
    facilityOptions,
    loadingClients,
    loadingFacilities,
    setSelectedMonth,
    setSelectedClient,
    setSelectedFacility,
  } = useDashboardFilters();

  // 3. Use data hook (handles all data fetching)
  const {
    stats,
    data: chartData,
    loading,
    error,
  } = useDashboardDataQuery({
    locationId: selectedFacility,
    clientId: selectedClient,
    month: selectedMonth,
    enabled: !!selectedFacility && !!selectedMonth,
  });

  // 4. Render minimal JSX - just orchestration
  return (
    <ErrorBoundary>
      <div className='space-y-6'>
        <PageHeader
          title='Inventory Analysis'
          locationName={user?.city_name || 'City'}
          totalItems={0}
          itemType='analysis'
          icon='📊'
        />

        <DashboardFilters
          selectedMonth={selectedMonth}
          selectedClient={selectedClient}
          selectedFacility={selectedFacility}
          clientOptions={clientOptions}
          facilityOptions={facilityOptions}
          loadingClients={loadingClients}
          loadingFacilities={loadingFacilities}
          onMonthChange={setSelectedMonth}
          onClientChange={setSelectedClient}
          onFacilityChange={setSelectedFacility}
        />

        <ErrorBoundary>
          <DashboardContent
            stats={stats}
            chartData={chartData}
            loading={loading}
            error={error}
          />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
};
```

---

## Key Principles

### 1. **Minimal Page Component**

The page component should:
- ✅ Be **70-80 lines maximum**
- ✅ Only orchestrate hooks and components
- ✅ Have **no business logic**
- ✅ Have **no UI rendering** (delegated to components)
- ✅ Only handle composition and data passing

**❌ Bad** (Too much logic in page):
```typescript
export const Dashboard: React.FC = () => {
  // ❌ Don't put filter logic here
  const [month, setMonth] = useState('');
  const loadClients = async () => { /* ... */ };
  
  // ❌ Don't put data fetching here
  const [data, setData] = useState(null);
  const fetchData = async () => { /* ... */ };
  
  // ❌ Don't render filters inline
  return (
    <div>
      <input value={month} onChange={...} />
      {/* ... */}
    </div>
  );
};
```

**✅ Good** (Logic in hooks, UI in components):
```typescript
export const Dashboard: React.FC = () => {
  // ✅ Logic in hook
  const { month, setMonth, ... } = useDashboardFilters();
  
  // ✅ Data in hook
  const { data, loading } = useDashboardData(...);
  
  // ✅ UI in component
  return <DashboardFilters {...filterProps} />;
};
```

### 2. **Separate Filters Component**

Filters should be:
- ✅ In `src/features/your-feature/components/YourFeatureFilters.tsx`
- ✅ Only render UI (no logic)
- ✅ Receive all data and callbacks as props
- ✅ Use `Card` component for container

**Example:**
```typescript
// src/features/dashboard/components/DashboardFilters.tsx
export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  selectedMonth,
  selectedClient,
  clientOptions,
  onMonthChange,
  onClientChange,
}) => {
  return (
    <Card className='p-4 sm:p-6'>
      <div className='flex flex-wrap gap-4 items-end'>
        <FloatingDropdown
          label='Month'
          options={MONTH_OPTIONS}
          value={selectedMonth}
          onChange={onMonthChange}
        />
        {/* ... */}
      </div>
    </Card>
  );
};
```

### 3. **Separate Content Component**

Content should be:
- ✅ In `src/features/your-feature/components/YourFeatureContent.tsx`
- ✅ Handle loading, error, and success states
- ✅ Render stats, charts, tables, etc.

**Example:**
```typescript
// src/features/dashboard/components/DashboardContent.tsx
export const DashboardContent: React.FC<DashboardContentProps> = ({
  stats,
  chartData,
  loading,
  error,
}) => {
  if (error) return <ErrorDisplay error={error} />;
  if (loading) return <LoadingSpinner />;

  return (
    <div className='space-y-6'>
      <DashboardStats stats={stats} />
      <DashboardChart data={chartData} />
    </div>
  );
};
```

### 4. **Custom Hooks for Logic**

Hooks should:
- ✅ Be in `src/features/your-feature/hooks/`
- ✅ Handle all business logic
- ✅ Handle API calls
- ✅ Handle state management
- ✅ Return only what page needs

**Example Structure:**
```typescript
// src/features/dashboard/hooks/useDashboardFilters.ts
export const useDashboardFilters = () => {
  const [month, setMonth] = useState('');
  const [client, setClient] = useState('all');
  const [facilities, setFacilities] = useState([]);
  
  // Load facilities from API
  useEffect(() => {
    loadFacilities();
  }, []);
  
  return {
    selectedMonth: month,
    selectedClient: client,
    facilityOptions: facilities,
    setSelectedMonth: setMonth,
    setSelectedClient: setClient,
    // ...
  };
};
```

---

## File Organization

### Feature Folder Structure

```
src/features/dashboard/
├── components/
│   ├── DashboardFilters.tsx      # Filter UI only
│   ├── DashboardContent.tsx      # Content container
│   ├── DashboardStats.tsx        # Stat cards (if needed)
│   └── DashboardChart.tsx       # Chart (if needed)
├── hooks/
│   ├── useDashboardFilters.ts   # Filter logic + state
│   ├── useDashboardDataQuery.ts # Data fetching (React Query)
│   └── useChartData.ts          # Chart data transformation
├── utils/
│   ├── dataTransformers.ts       # API → UI format
│   └── dateUtils.ts              # Date calculations
├── config/
│   └── constants.ts              # Fixed values
└── index.ts                      # Exports all public APIs
```

### Page File

```
src/pages/
└── Dashboard.tsx                 # Minimal orchestration (72 lines)
```

---

## Step-by-Step: Creating a New Dashboard Page

### Step 1: Create Feature Folder

```bash
mkdir -p src/features/your-dashboard/{components,hooks,utils,config}
```

### Step 2: Create Filters Component

```typescript
// src/features/your-dashboard/components/YourDashboardFilters.tsx
export const YourDashboardFilters: React.FC<YourDashboardFiltersProps> = ({
  // ... props
}) => {
  return (
    <Card className='p-4 sm:p-6'>
      {/* Filter UI */}
    </Card>
  );
};
```

### Step 3: Create Content Component

```typescript
// src/features/your-dashboard/components/YourDashboardContent.tsx
export const YourDashboardContent: React.FC<YourDashboardContentProps> = ({
  data,
  loading,
  error,
}) => {
  if (error) return <ErrorDisplay />;
  if (loading) return <LoadingSpinner />;
  
  return (
    <div>
      {/* Content UI */}
    </div>
  );
};
```

### Step 4: Create Filter Hook

```typescript
// src/features/your-dashboard/hooks/useYourDashboardFilters.ts
export const useYourDashboardFilters = () => {
  // Filter logic here
  return { /* ... */ };
};
```

### Step 5: Create Data Hook

```typescript
// src/features/your-dashboard/hooks/useYourDashboardData.ts
export const useYourDashboardData = (params) => {
  // Use React Query
  const query = useQuery({ ... });
  return { data, loading, error };
};
```

### Step 6: Create Index File

```typescript
// src/features/your-dashboard/index.ts
export { YourDashboardFilters } from './components/YourDashboardFilters';
export { YourDashboardContent } from './components/YourDashboardContent';
export { useYourDashboardFilters } from './hooks/useYourDashboardFilters';
export { useYourDashboardData } from './hooks/useYourDashboardData';
```

### Step 7: Create Page Component

```typescript
// src/pages/YourDashboard.tsx
import {
  YourDashboardFilters,
  YourDashboardContent,
  useYourDashboardFilters,
  useYourDashboardData,
} from '../features/your-dashboard';

export const YourDashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const filters = useYourDashboardFilters();
  const data = useYourDashboardData({ ...filters });

  return (
    <ErrorBoundary>
      <div className='space-y-6'>
        <PageHeader title="Your Dashboard" ... />
        <YourDashboardFilters {...filters} />
        <ErrorBoundary>
          <YourDashboardContent {...data} />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
};
```

---

## Benefits of This Pattern

### 1. **Maintainability**
- Logic separated from UI
- Easy to find and fix bugs
- Clear file responsibilities

### 2. **Testability**
- Test hooks independently
- Test components with mock data
- Easy to write unit tests

### 3. **Reusability**
- Hooks can be used in multiple pages
- Components can be reused
- Logic can be shared

### 4. **Scalability**
- Add new features without touching page
- Easy to extend filters or content
- Clear upgrade path

### 5. **Readability**
- Page file is simple and clear
- Easy for new developers to understand
- Self-documenting structure

---

## Real-World Example: Ops Dashboard

The Ops Dashboard follows this exact pattern:

```
src/pages/OpsDashboard.tsx (79 lines)
├── useOpsDashboardFilters hook
├── useOpsDashboardData hook
├── OpsDashboardFilters component
└── OpsDashboardContent component
```

**See**: `src/pages/OpsDashboard.tsx` and `src/features/ops-dashboard/`

---

## Checklist for New Dashboard Pages

- [ ] Page component is **70-80 lines maximum**
- [ ] Filters extracted to separate component
- [ ] Content extracted to separate component
- [ ] All logic in custom hooks
- [ ] Feature folder follows standard structure
- [ ] Components exported from `index.ts`
- [ ] Error boundaries wrap components
- [ ] Loading and error states handled
- [ ] TypeScript interfaces defined
- [ ] Follows P0/P1/P2/P3 standards

---

## Related Documentation

- **Dashboard Implementation**: `Documentation/10-Dashboard/01-Dashboard-How-It-Works.md`
- **Component Standards**: `Documentation/COMPONENT_DEVELOPMENT_STANDARDS.md`
- **Feature Structure**: `Documentation/COMPONENT_DEVELOPMENT_STANDARDS.md` (Lines 409-436)
- **Quick Reference**: `Documentation/QUICK_REFERENCE_INDEX.md`

---

**Last Updated**: After Ops Dashboard implementation
**Status**: ✅ Production Standard


