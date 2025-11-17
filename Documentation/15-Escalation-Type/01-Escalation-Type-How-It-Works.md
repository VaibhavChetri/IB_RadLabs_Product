# Escalation Type - How It Works

## Execution Flow

### 1. Page Load Flow

```
User navigates to /ops-admin/escalations/escalation-type
    ↓
EscalationType component mounts
    ↓
useURLFilters() reads URL params (or defaults)
    ↓
useDebounce() debounces filter values (300ms delay)
    ↓
useEscalationTypeData() fetches listing data
    ↓
Client-side filtering applied if status filter exists
    ↓
Table renders with data (or skeleton if loading)
```

### 2. Filter Change Flow

```
User changes Status dropdown
    ↓
handleFilterChange() called
    ↓
updateFilters() updates URL params
    ↓
useDebounce() waits 300ms
    ↓
Debounced value changes
    ↓
useEscalationTypeData() queryKey changes (but API doesn't refetch)
    ↓
Client-side filter applied to existing data
    ↓
Table updates with filtered data
```

**Note**: Status filter is applied client-side, so API doesn't refetch. All data is already loaded.

### 3. Add Flow

```
User clicks "Add Escalation Type" button
    ↓
EscalationTypeModal opens (empty form)
    ↓
User fills form (name, status) and clicks "Add"
    ↓
handleSubmit() validates inputs
    ↓
addMutation.mutateAsync() called
    ↓
onMutate: Optimistic update (adds item to cache)
    ↓
API call: POST /api/transit-plan/createComplaintType
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
EscalationTypeModal opens (pre-filled form)
    ↓
User modifies data and clicks "Update"
    ↓
handleSubmit() validates inputs
    ↓
updateMutation.mutateAsync() called
    ↓
onMutate: Optimistic update (updates item in cache)
    ↓
API call: PUT /api/transit-plan/updateComplaintType/{id}
    ↓
onSuccess: Invalidates cache → Refetches listing
    ↓
onError: Rollback optimistic update
    ↓
Modal closes, success snackbar shows
```

## Code Navigation

### Main Page Component (`EscalationType.tsx`)

**Line-by-Line Flow**:

1. **State Initialization** (Lines 17-29):
   - `urlFilters`: Filter values from URL
   - `showModal`: Controls modal visibility
   - `editingItem`: Item being edited (null for add)
   - `snackbar`: Snackbar state

2. **Filter Management** (Lines 31-32):
   - `debouncedStatus`: Debounced status filter (300ms delay)

3. **Data Fetching** (Lines 34-41):
   - `useEscalationTypeData`: Fetches all escalation types
   - Filters applied client-side if `debouncedStatus` exists

4. **Error Handling** (Lines 43-52):
   - Shows error snackbar if API fails

5. **Modal Handlers** (Lines 54-80):
   - `handleAdd`: Opens modal for adding new item
   - `handleEdit`: Opens modal for editing existing item
   - `handleModalClose`: Closes modal and resets state
   - `handleModalSuccess`: Shows success snackbar and closes modal

6. **Filter Change Handler** (Lines 82-84):
   - Updates URL filters when dropdown changes

7. **Table Columns** (Lines 86-92):
   - Memoized columns with edit handler

8. **Render** (Lines 96-149):
   - PageHeader with title and location
   - Add button
   - Filter section (Status dropdown)
   - Table (or skeleton if loading)
   - Modal (conditionally rendered)
   - Snackbar

### Data Hook (`useEscalationTypeData.ts`)

**Purpose**: Fetch escalation types with optional client-side filtering

**Flow**:
1. React Query fetches all escalation types
2. If `status` param provided, filters data client-side
3. Returns filtered or unfiltered data

**Key Points**:
- `staleTime: 0` - Always refetch on mount
- `gcTime: 0` - Don't cache
- Client-side filtering prevents unnecessary API calls

### Mutations Hook (`useEscalationTypeMutations.ts`)

**Purpose**: Handle add and update operations with optimistic updates

**Add Mutation**:
- Optimistic update: Adds item to cache immediately
- API call: POST `/api/transit-plan/createComplaintType`
- On success: Invalidates cache, refetches listing
- On error: Rolls back optimistic update

**Update Mutation**:
- Optimistic update: Updates item in cache immediately
- API call: PUT `/api/transit-plan/updateComplaintType/{id}`
- Status conversion: String ('Active'/'Inactive') → Number (1/0)
- On success: Invalidates cache, refetches listing
- On error: Rolls back optimistic update

### URL Filters Hook (`useURLFilters.ts`)

**Purpose**: Manage filter state in URL params

**Flow**:
1. Reads filters from URL on mount
2. Updates URL when filters change
3. Provides `filters` object and `updateFilters` function

**URL Format**: `/ops-admin/escalations/escalation-type?status=Active`

## Common Mistakes and Where to Look

### ❌ Mistake 1: Status Filter Not Working

**Symptom**: Filter changes but table doesn't update

**Where to Check**:
- `useEscalationTypeData.ts` - Client-side filtering logic
- `EscalationType.tsx` - Debounce implementation
- Browser console for filter value changes

**Solution**: Ensure `debouncedStatus` is used in filtering logic

### ❌ Mistake 2: Optimistic Update Shows Wrong Status

**Symptom**: Status shows as number instead of string after update

**Where to Check**:
- `useEscalationTypeMutations.ts` - Optimistic update logic
- Status conversion in `onMutate` callback

**Solution**: Ensure status is converted back to string in optimistic update:
```typescript
status: updatedItem.status === 1 ? 'Active' : 'Inactive'
```

### ❌ Mistake 3: Modal Not Closing After Success

**Symptom**: Modal stays open after successful add/edit

**Where to Check**:
- `EscalationType.tsx` - `handleModalSuccess` function
- Modal component's `onSuccess` prop

**Solution**: Ensure `setShowModal(false)` is called in success handler

### ❌ Mistake 4: URL Filters Not Persisting

**Symptom**: Filters reset on page refresh

**Where to Check**:
- `useURLFilters.ts` - URL reading logic
- Browser URL bar to verify params are set

**Solution**: Ensure URL params are read on component mount

## Debugging Tips

1. **Check React Query DevTools**: See query keys, cache state, and refetch triggers
2. **Check Browser URL**: Verify filter values are in URL params
3. **Check Console Logs**: Look for API errors or filter value changes
4. **Check Network Tab**: Verify API calls are made with correct params
5. **Check localStorage**: Not used in this feature, but check if accidentally added

## Key Dependencies

- **React Query**: Data fetching and caching
- **React Router**: URL state management
- **Redux**: User data (city_name)
- **Custom Hooks**: Debounce, URL filters

