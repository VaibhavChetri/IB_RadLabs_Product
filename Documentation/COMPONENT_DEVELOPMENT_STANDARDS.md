# Component Development Standards

## Overview

This document defines industry-standard best practices for developing React components in the IB Dashboard. These standards ensure consistent code quality, maintainability, performance, and accessibility across all features.

**When to use this**: Reference this document when:
- Building new components
- Refactoring existing components
- Reviewing code
- Onboarding new developers

---

## Table of Contents

1. [P0: Critical Fixes (Must Have)](#p0-critical-fixes-must-have)
2. [P1: High Priority (Should Have)](#p1-high-priority-should-have)
3. [P2: Medium Priority (Nice to Have)](#p2-medium-priority-nice-to-have)
4. [P3: Low Priority (Quality of Life)](#p3-low-priority-quality-of-life)
5. [Quick Checklist](#quick-checklist)
6. [Examples](#examples)

---

## P0: Critical Fixes (Must Have)

These must be addressed before merging code. They prevent bugs, ensure type safety, and follow React best practices.

### 1. Fix useEffect Dependencies

**Problem**: Missing or incorrect dependencies cause stale closures and bugs.

**Standard**:
- All dependencies must be in the dependency array
- If a function is used, it should be memoized with `useCallback`
- Use ESLint rule `react-hooks/exhaustive-deps` (do not disable)

**❌ Bad**:
```typescript
useEffect(() => {
  fetchData(userId, filters);
}, []); // Missing dependencies!
```

**✅ Good**:
```typescript
const fetchData = useCallback(async (id: string, f: FilterType) => {
  // ... fetch logic
}, []); // Only if fetchData has no dependencies

useEffect(() => {
  fetchData(userId, filters);
}, [userId, filters, fetchData]);
```

**File Pattern**: All hook files with `useEffect`

---

### 2. Implement Request Cancellation

**Problem**: Unmounted components or changing filters cause race conditions and memory leaks.

**Standard**:
- Use `AbortController` for all async operations (API calls, data fetching)
- Cancel requests when component unmounts or dependencies change
- Handle `AbortError` gracefully (don't show it as user error)

**✅ Good**:
```typescript
const fetchData = useCallback(async () => {
  // Cancel previous request
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }

  // Create new controller
  const abortController = new AbortController();
  abortControllerRef.current = abortController;

  try {
    const response = await ApiService.getData(params, abortController.signal);
    // ... handle response
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return; // Ignore abort errors
    }
    // Handle other errors
  }
}, [params]);

useEffect(() => {
  fetchData();
  
  // Cleanup
  return () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };
}, [fetchData]);
```

**Alternative for React Query**: React Query handles cancellation automatically. Just use `useQuery` hook.

**File Pattern**: All custom hooks with API calls

---

### 3. Replace window.innerWidth Checks

**Problem**: `window.innerWidth` checks are fragile, not accessible, and don't align with Tailwind breakpoints.

**Standard**:
- Use `useBreakpoint` hook (custom hook for Tailwind breakpoints)
- Never use `window.innerWidth` directly
- Use Tailwind responsive classes when possible

**❌ Bad**:
```typescript
const isMobile = window.innerWidth < 768;
```

**✅ Good**:
```typescript
import { useBreakpoint } from '../../../hooks/useBreakpoint';

const { isMobile, isTablet, isDesktop } = useBreakpoint();
```

**When to use hook vs classes**:
- **Hook**: When you need logic based on breakpoint (conditional rendering, calculations)
- **Classes**: When styling only (use Tailwind responsive prefixes: `sm:`, `md:`, `lg:`)

**File Pattern**: Any component with responsive behavior

---

### 4. Add TypeScript Types (Remove `any`)

**Problem**: `any` types defeat TypeScript's purpose and hide bugs.

**Standard**:
- Zero `any` types in production code
- Define interfaces for all API responses
- Use union types for string literals
- Type all function parameters and return values

**❌ Bad**:
```typescript
const processData = (data: any) => {
  return data.map((item: any) => item.value);
};
```

**✅ Good**:
```typescript
interface ApiResponse {
  status_code: number;
  data: DataItem[];
}

interface DataItem {
  id: number;
  value: string;
}

const processData = (data: ApiResponse): string[] => {
  return data.data.map((item: DataItem) => item.value);
};
```

**File Pattern**: All TypeScript files

**Check**: Run `npm run type-check` before committing

---

## P1: High Priority (Should Have)

These significantly improve performance, reliability, and user experience. Implement for all production components.

### 1. Memoize Components with React.memo

**Problem**: Components re-render unnecessarily when parent re-renders with same props.

**Standard**:
- Wrap export with `React.memo()` for components that:
  - Receive props and render complex UI
  - Are rendered frequently (in lists, dashboards)
  - Have expensive rendering logic
- Don't memoize simple presentational components (just a div with text)

**✅ Good**:
```typescript
const MyComponent: React.FC<Props> = ({ data, onAction }) => {
  // ... component logic
};

// Memoize to prevent unnecessary re-renders
export const MyComponent = React.memo(MyComponentComponent);
```

**When NOT to memoize**:
- Simple wrapper components
- Components with frequently changing props
- Components that are already optimized

**File Pattern**: Complex components, list items, chart components

---

### 2. Integrate React Query for API Data

**Problem**: Manual `useState` + `useEffect` for API calls lacks caching, retries, and automatic refetching.

**Standard**:
- Use `useQuery` from `@tanstack/react-query` for all data fetching
- Create custom hooks that wrap `useQuery`
- Configure appropriate `staleTime` and `cacheTime` (now `gcTime`)
- Use query keys that include all dependencies

**❌ Bad**:
```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);

useEffect(() => {
  setLoading(true);
  fetch('/api/data').then(r => r.json()).then(setData).finally(() => setLoading(false));
}, []);
```

**✅ Good**:
```typescript
export const useMyData = (params: Params) => {
  return useQuery({
    queryKey: ['myData', params],
    queryFn: () => ApiService.getData(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!params.id, // Only fetch when ID exists
  });
};
```

**Configuration** (in `src/main.tsx`):
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

**File Pattern**: All hooks that fetch data from APIs

---

### 3. Add Error Boundaries and Retry Logic

**Problem**: Unhandled errors crash the entire app. Network errors need retry logic.

**Standard**:
- Wrap route-level components with `<ErrorBoundary>`
- Wrap data-dependent sections separately
- Implement retry logic in React Query (automatic) or manually for critical operations

**✅ Good**:
```typescript
// In page component
return (
  <ErrorBoundary>
    <div>
      <Filters />
      <ErrorBoundary>
        <DataContent data={data} />
      </ErrorBoundary>
    </div>
  </ErrorBoundary>
);

// ErrorBoundary shows user-friendly error with "Try Again" button
```

**Retry Logic**:
- React Query: Configured globally (see above)
- Manual: Use exponential backoff for critical operations

**File Pattern**: Page components, data-dependent sections

---

## P2: Medium Priority (Nice to Have)

These improve maintainability and code organization. Implement during refactoring or when time permits.

### 1. Extract Magic Numbers/Strings to Constants

**Problem**: Hardcoded values scattered throughout code make updates difficult.

**Standard**:
- Create `constants.ts` or `config.ts` files in feature folder
- Extract:
  - Magic numbers (margins, font sizes, timeouts)
  - String literals used as keys/values
  - Color values (if not using design system)
  - Configuration objects

**❌ Bad**:
```typescript
<div style={{ margin: '10px', padding: '20px' }}>
  <Chart height={320} width={640} />
</div>
```

**✅ Good**:
```typescript
// config/chartConstants.ts
export const CHART_DIMENSIONS = {
  height: 320,
  width: 640,
  margin: {
    top: 10,
    right: 20,
    bottom: 30,
    left: 20,
  },
} as const;

// Component
<div style={{ margin: `${CHART_DIMENSIONS.margin.top}px` }}>
  <Chart height={CHART_DIMENSIONS.height} width={CHART_DIMENSIONS.width} />
</div>
```

**File Pattern**: Components with styling configs, chart components, form components

---

### 2. Extract Data Transformation Logic to Utils

**Problem**: Business logic mixed with component code is hard to test and reuse.

**Standard**:
- Create `utils/` folder in feature directory
- Move data transformation functions to separate files
- Pure functions (no side effects)
- Easy to unit test

**❌ Bad**:
```typescript
const MyComponent = () => {
  const processedData = useMemo(() => {
    // Complex transformation logic here
    return rawData.map(item => ({
      ...item,
      calculated: item.value * 2,
      formatted: formatCurrency(item.price),
    }));
  }, [rawData]);
  
  // ... render
};
```

**✅ Good**:
```typescript
// utils/dataTransformers.ts
export const transformToDisplayFormat = (data: RawData[]): DisplayData[] => {
  return data.map(item => ({
    ...item,
    calculated: item.value * 2,
    formatted: formatCurrency(item.price),
  }));
};

// Component
const MyComponent = () => {
  const processedData = useMemo(
    () => transformToDisplayFormat(rawData),
    [rawData]
  );
  // ... render
};
```

**File Pattern**: Components that transform API data, complex calculations

---

### 3. Separation of Concerns

**Problem**: Components doing too much (fetching, transforming, rendering) are hard to maintain.

**Standard**:
- **Components**: Only handle rendering and user interactions
- **Hooks**: Handle business logic and data fetching
- **Utils**: Handle pure transformations and calculations
- **Services**: Handle API calls

**Architecture Pattern**:
```
feature/
├── components/     # UI only
├── hooks/         # Business logic
├── utils/         # Pure functions
├── services/      # API calls (if feature-specific)
└── config/        # Constants
```

**Example Structure**:
```
dashboard/
├── components/
│   ├── DashboardStats.tsx      # Renders stats cards
│   └── DashboardChart.tsx      # Renders chart
├── hooks/
│   ├── useDashboardFilters.ts # Filter logic
│   └── useDashboardData.ts     # Data fetching
├── utils/
│   ├── dataTransformers.ts    # Transform API → UI
│   └── dateUtils.ts           # Date calculations
└── config/
    └── constants.ts            # Fixed values
```

**File Pattern**: All features should follow this structure

---

## P3: Low Priority (Quality of Life)

These improve accessibility and testability. Important for production-ready components.

### 1. Accessibility (a11y)

**Standard**: All interactive components must be accessible.

#### ARIA Labels

**Required for**:
- Charts and graphs
- Custom interactive elements
- Icon-only buttons
- Form inputs without visible labels

**✅ Good**:
```typescript
<div
  role='region'
  aria-label='Dashboard statistics'
  aria-describedby='stats-description'
>
  <div id='stats-description' className='sr-only'>
    Statistics showing key metrics for the selected period
  </div>
</div>

<button
  aria-label='Close dialog'
  onClick={onClose}
>
  <Icon name='close' />
</button>
```

#### Keyboard Navigation

**Required**:
- All interactive elements focusable with Tab
- Enter/Space activates buttons
- Escape closes modals/dropdowns
- Arrow keys navigate lists/dropdowns

**✅ Good**:
```typescript
<div
  role='button'
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  className='focus:ring-2 focus:ring-primary'
>
  Clickable card
</div>
```

#### Screen Reader Support

**Required**:
- Semantic HTML (`<button>`, `<nav>`, `<article>`, etc.)
- Descriptive text for screen readers (`.sr-only` class)
- Proper heading hierarchy (`<h1>` → `<h2>` → `<h3>`)

**File Pattern**: All components with interactive elements or data displays

**Resources**:
- See `Documentation/10-Dashboard/02-Dashboard-Accessibility.md` for detailed examples

---

### 2. Unit Test Coverage

**Standard**: Critical paths must be tested.

**Coverage Targets**:
- **Hooks**: >90% line coverage
- **Utilities**: >90% line coverage
- **Components**: >80% line coverage (critical paths)
- **Complex logic**: 100% coverage

**Test Structure**:
```
feature/
├── components/
│   └── __tests__/
│       └── ComponentName.test.tsx
├── hooks/
│   └── __tests__/
│       └── useHookName.test.ts
└── utils/
    └── __tests__/
        └── utilityName.test.ts
```

**What to Test**:
- ✅ Happy path (normal usage)
- ✅ Edge cases (null, empty, missing data)
- ✅ Error handling
- ✅ Loading states
- ✅ User interactions (clicks, form submissions)

**✅ Good Test Example**:
```typescript
describe('transformToStats', () => {
  it('should return null when data is null', () => {
    const result = transformToStats(null);
    expect(result).toBeNull();
  });

  it('should extract stats from valid response', () => {
    const mockData = { /* ... */ };
    const result = transformToStats(mockData);
    expect(result).toEqual(expectedStats);
  });

  it('should return zeros when optional fields are missing', () => {
    const mockData = { status_code: 200 };
    const result = transformToStats(mockData);
    expect(result).toEqual({ /* zeros */ });
  });
});
```

**File Pattern**: All hooks, utils, and complex components

**Resources**:
- See `Documentation/10-Dashboard/03-Dashboard-Testing.md` for detailed examples

---

## Quick Checklist

Use this checklist when building or reviewing components:

### P0: Critical (Must Have)
- [ ] All `useEffect` dependencies declared
- [ ] `AbortController` used for async operations (or React Query)
- [ ] No `window.innerWidth` checks (use `useBreakpoint` hook)
- [ ] No `any` types (run `npm run type-check`)

### P1: High Priority (Should Have)
- [ ] Component memoized with `React.memo` (if appropriate)
- [ ] API calls use React Query (`useQuery`)
- [ ] Error boundaries wrap route/data sections
- [ ] Retry logic implemented (React Query or manual)

### P2: Medium Priority (Nice to Have)
- [ ] Magic numbers in constants file
- [ ] Data transformations in utils
- [ ] Clear separation: components/hooks/utils/services

### P3: Low Priority (Quality of Life)
- [ ] ARIA labels on interactive elements
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader descriptions added
- [ ] Unit tests written (>80% coverage)

---

## Examples

### Complete Example: Dashboard Component

See `Documentation/10-Dashboard/` for a complete implementation following all standards:

**Files**:
- `src/features/dashboard/components/DashboardStats.tsx` - P1 (memoized), P3 (accessibility)
- `src/features/dashboard/components/DashboardChart.tsx` - P0 (types, dependencies), P1 (memoized), P3 (accessibility)
- `src/features/dashboard/hooks/useDashboardDataQuery.ts` - P0 (dependencies, types), P1 (React Query)
- `src/features/dashboard/utils/dataTransformers.ts` - P2 (extracted logic)
- `src/features/dashboard/utils/__tests__/dataTransformers.test.ts` - P3 (tests)

**Review these files** to see standards in practice.

---

## Implementation Order

When building a new feature, follow this order:

1. **P0 First** (before any PR)
   - Type safety
   - Dependencies
   - Request cancellation

2. **P1 Next** (before production merge)
   - React Query
   - Error boundaries
   - Memoization

3. **P2 During Refactoring** (when time permits)
   - Extract constants
   - Extract utils
   - Organize structure

4. **P3 Before Release** (important for quality)
   - Accessibility
   - Tests

---

## Related Documentation

- [Dashboard Implementation](../10-Dashboard/README.md) - Complete example
- [Dashboard Accessibility](../10-Dashboard/02-Dashboard-Accessibility.md) - Detailed a11y guide
- [Dashboard Testing](../10-Dashboard/03-Dashboard-Testing.md) - Testing patterns
- [Code Review Guidelines](../CODE_REVIEW_GUIDELINES.md) - General code standards

---

## Questions?

If you're unsure about a standard:
1. Check the Dashboard implementation (`src/features/dashboard/`)
2. Review the related documentation links above
3. Ask the team lead for clarification

---

**Last Updated**: After Dashboard P0/P1/P2/P3 implementation  
**Maintained By**: Development Team  
**Review Frequency**: Quarterly

