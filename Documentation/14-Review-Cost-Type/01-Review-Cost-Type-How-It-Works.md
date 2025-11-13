# Review Cost Type - How It Works

## Execution Flow

### 1. Page Load Flow

```
User navigates to /ops-admin/revenue/review-cost-type
    ↓
ReviewCostType component mounts
    ↓
useURLFilters() reads URL params (or defaults)
    ↓
useCostCategories() fetches categories (cached for 10 min)
    ↓
useDebounce() debounces filter values (300ms delay)
    ↓
useReviewCostTypeData() fetches listing data
    ↓
Table renders with data (or skeleton if loading)
```

### 2. Filter Change Flow

```
User changes Cost Category dropdown
    ↓
handleFilterChange() called
    ↓
updateFilters() updates URL params
    ↓
useDebounce() waits 300ms
    ↓
Debounced value changes
    ↓
useReviewCostTypeData() queryKey changes
    ↓
React Query automatically refetches
    ↓
Table updates with new data
```

### 3. Add Flow

```
User clicks "Add Cost Type" button
    ↓
ReviewCostTypeModal opens (empty form)
    ↓
User fills form and clicks "Add"
    ↓
handleSubmit() validates inputs
    ↓
addMutation.mutateAsync() called
    ↓
onMutate: Optimistic update (adds item to cache)
    ↓
API call: POST /api/review/addReviewCostingType
    ↓
onSuccess: Invalidates cache → Refetches listing
    ↓
onError: Rollback optimistic update
    ↓
Modal closes, success snackbar shows
```

### 4. Edit Flow

```
User clicks Edit button on a row
    ↓
ReviewCostTypeModal opens (pre-filled form)
    ↓
User modifies data and clicks "Update"
    ↓
handleSubmit() validates inputs
    ↓
updateMutation.mutateAsync() called
    ↓
onMutate: Optimistic update (updates item in cache)
    ↓
API call: PUT /api/review/updateReviewCostingType
    ↓
onSuccess: Invalidates cache → Refetches listing
    ↓
onError: Rollback optimistic update
    ↓
Modal closes, success snackbar shows
```

### 5. Pagination Flow

```
User clicks page number or changes items per page
    ↓
handlePageChange() or handleItemsPerPageChange() called
    ↓
updateFilters() updates URL params
    ↓
useReviewCostTypeData() queryKey changes
    ↓
React Query automatically refetches
    ↓
Table updates with new page data
```

## Code Flow Details

### URL State Management

**File**: `src/features/review-cost-type/hooks/useURLFilters.ts`

```typescript
// Reads filters from URL
const filters = useMemo(() => {
  return {
    costCategoryId: searchParams.get('costCategoryId') || '',
    status: searchParams.get('status') || '',
    page: parseInt(searchParams.get('page') || '1', 10),
    pageSize: parseInt(searchParams.get('pageSize') || '10', 10),
  };
}, [searchParams]);

// Updates URL when filters change
const updateFilters = useCallback((updates) => {
  const newParams = new URLSearchParams(searchParams);
  // Update or remove params based on values
  setSearchParams(newParams, { replace: true });
}, [searchParams, setSearchParams]);
```

### Debouncing Filters

**File**: `src/pages/ReviewCostType.tsx`

```typescript
// Debounce filter values to prevent rapid API calls
const debouncedCostCategoryId = useDebounce(urlFilters.costCategoryId, 300);
const debouncedStatus = useDebounce(urlFilters.status, 300);

// Use debounced values in API call
useReviewCostTypeData({
  costCategoryId: debouncedCostCategoryId ? parseInt(debouncedCostCategoryId) : undefined,
  status: debouncedStatus ? parseInt(debouncedStatus) : undefined,
  // ...
});
```

### Optimistic Updates

**File**: `src/features/review-cost-type/hooks/useReviewCostTypeMutations.ts`

```typescript
onMutate: async (newItem) => {
  // 1. Cancel outgoing refetches
  await queryClient.cancelQueries({ queryKey: ['reviewCostType', 'listing'] });
  
  // 2. Snapshot previous value
  const previousData = queryClient.getQueriesData({ queryKey: ['reviewCostType', 'listing'] });
  
  // 3. Optimistically update cache
  queryClient.setQueriesData({ queryKey: ['reviewCostType', 'listing'] }, (old) => {
    return {
      ...old,
      data: [optimisticItem, ...(old.data || [])],
    };
  });
  
  return { previousData };
},
onError: (err, newItem, context) => {
  // Rollback on error
  if (context?.previousData) {
    context.previousData.forEach(([queryKey, data]) => {
      queryClient.setQueryData(queryKey, data);
    });
  }
},
```

### Loading States

**File**: `src/pages/ReviewCostType.tsx`

```typescript
// Show skeleton while loading
{loadingCategories ? (
  <FilterSkeleton />
) : (
  <FloatingDropdown ... />
)}

{loading ? (
  <TableSkeleton rows={pagination.pageSize} columns={5} />
) : (
  <Table columns={columns} data={tableData} loading={false} />
)}
```

## Table and Filter Integration

### Table Component Usage

The table displays data from the API response:

```typescript
// Data transformation
const tableData = (listingData?.data || []) as unknown as Record<string, unknown>[];

// Column definitions (memoized)
const columns = useMemo(
  () => getReviewCostTypeColumns({ pagination, onEdit: handleEdit }),
  [pagination, handleEdit]
);

// Conditional rendering
{loading ? (
  <TableSkeleton rows={pagination.pageSize} columns={5} />
) : (
  <Table columns={columns} data={tableData} loading={false} size='sm' />
)}
```

### Filter Integration

Filters automatically trigger table updates:

1. **Filter Change** → Updates URL → Debounces → React Query refetches → Table updates
2. **No manual refetch needed** - React Query handles it automatically
3. **URL state preserved** - Filters persist across page refreshes

### Filter Types

- **Cost Category Filter**: Dropdown with "All" option + dynamic options from API
- **Status Filter**: Dropdown with "All", "Active", "Inactive" options from constants

### Table Columns

- **Actions**: Edit button (center-aligned)
- **Serial Number**: Calculated based on pagination (center-aligned)
- **Cost Type**: Name field (center-aligned, bold)
- **Cost Category**: Category name (center-aligned)
- **Status**: Badge with color coding (center-aligned)

## Common Mistakes and Debugging

### 1. Filters Not Triggering API Calls

**Problem**: API not called when filters change

**Check**:
- Are filters debounced? Check `useDebounce` usage
- Is `queryKey` in `useQuery` including filter values?
- Is `enabled` prop set to `true`?

**Solution**:
```typescript
// Ensure queryKey includes all filter dependencies
queryKey: ['reviewCostType', 'listing', page, limit, costCategoryId || 'all', status ?? 'all']
```

### 2. URL Params Not Updating

**Problem**: URL doesn't reflect filter changes

**Check**:
- Is `updateFilters` being called?
- Are URL params being read correctly in `useURLFilters`?

**Solution**:
```typescript
// Ensure updateFilters is called with correct values
handleFilterChange('costCategoryId', value);
// Inside handleFilterChange:
updateFilters({ [key]: value, page: 1 });
```

### 3. Optimistic Update Not Showing

**Problem**: UI doesn't update immediately after add/edit

**Check**:
- Is `onMutate` implemented correctly?
- Is cache being updated with correct queryKey?
- Is `onError` rolling back correctly?

**Solution**:
```typescript
// Ensure queryKey matches exactly
queryKey: ['reviewCostType', 'listing', ...]
// In onMutate:
queryClient.setQueriesData({ queryKey: ['reviewCostType', 'listing'] }, ...)
```

### 4. Multiple API Calls

**Problem**: API called multiple times on filter change

**Check**:
- Is debounce delay appropriate? (300ms recommended)
- Are there multiple `useQuery` hooks with same queryKey?
- Is `refetchOnMount` set correctly?

**Solution**:
```typescript
// Use debounce
const debouncedValue = useDebounce(value, 300);

// Set appropriate React Query options
refetchOnMount: true,
refetchOnWindowFocus: false,
```

### 5. Skeleton Not Showing

**Problem**: Generic spinner shows instead of skeleton

**Check**:
- Is `loading` state from React Query being used?
- Is skeleton component imported correctly?

**Solution**:
```typescript
// Use isLoading from React Query
const { data, isLoading: loading } = useReviewCostTypeData(...);

// Conditionally render skeleton
{loading ? <TableSkeleton /> : <Table data={data} />}
```

## Performance Considerations

1. **Debouncing**: Prevents excessive API calls (300ms delay)
2. **React Query Caching**: Reduces redundant network requests
3. **Memoization**: Columns memoized to prevent re-renders
4. **Optimistic Updates**: Instant UI feedback without waiting for API
5. **URL State**: No need to refetch on browser back/forward

## Error Handling

1. **API Errors**: Shown in snackbar, optimistic updates rolled back
2. **Validation Errors**: Shown inline in modal form
3. **Network Errors**: React Query retries automatically (configured in query)
4. **Cache Errors**: Rollback to previous state

---

**Next**: Read [Implementation Guide](./02-Review-Cost-Type-Implementation-Guide.md) to build your own admin page.

