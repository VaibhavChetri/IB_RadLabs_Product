# QC Rejection - How It Works

## Execution Flow

### 1. Listing Page Load Flow

```
User navigates to /operations-reporting/qc-rejection/listing
    ↓
QCRejectionListing component mounts
    ↓
useEffect sets default date to today
    ↓
useEffect loads clients by city (if user.city_id exists)
    ↓
useQCRejectionData() enabled only if transitDate exists
    ↓
API call: GET /api/transit-plan/getQCRejections?transit_date={date}&client_id={id}
    ↓
Table renders with rejection data (or skeleton if loading)
```

### 2. Add Page Load Flow

```
User navigates to /operations-reporting/qc-rejection/add
    ↓
QCRejectionAdd component mounts
    ↓
useEffect restores date from location.state or localStorage
    ↓
useEffect saves date to localStorage whenever it changes
    ↓
useEffect loads clients by city
    ↓
useQCRunsData() fetches QC runs (enabled if transitDate exists)
    ↓
useQCReportAdherence() fetches stats (enabled if transitDate exists)
    ↓
Table renders with QC runs (or skeleton if loading)
    ↓
Adherence stats displayed inline with header
```

### 3. Details Page Load Flow

```
User clicks client name on Add page
    ↓
Navigate to /operations-reporting/qc-rejection/details/{clientId}/{transitId}
    ↓
QCRejectionDetails component mounts
    ↓
useMemo creates storageKey: qcRejectionFormData_{runId}
    ↓
useEffect loads SKUs and rejection reasons
    ↓
useEffect restores formData from localStorage (if exists)
    ↓
Table renders with SKUs and reasons (editable inputs)
    ↓
Form data initialized (empty or restored from localStorage)
```

### 4. Form Input Flow

```
User enters rejection count in input field
    ↓
handleInputChange() called
    ↓
Form data updated in state
    ↓
Form data saved to localStorage immediately
    ↓
Row total recalculated
    ↓
Grand total recalculated
    ↓
UI updates instantly
```

### 5. Submit Flow

```
User clicks Submit button
    ↓
handleSubmit() validates runId exists
    ↓
Payload constructed from formData
    ↓
API call: POST /api/transit-plan/qcRejections/{runId}
    ↓
On success:
    - localStorage cleared (storageKey)
    - Success snackbar shown
    - Navigate to listing page
    ↓
On error:
    - Error snackbar shown
    - Form data remains in localStorage
```

### 6. Back Navigation Flow

```
User clicks Back button on Details page
    ↓
Navigate to /operations-reporting/qc-rejection/add
    ↓
location.state.filterDate passed in navigation state
    ↓
QCRejectionAdd useEffect restores date from location.state
    ↓
Date filter restored to previous value
    ↓
API calls triggered automatically
```

## Code Navigation

### Listing Page (`QCRejectionListing.tsx`)

**Key Sections**:

1. **State Management** (Lines 23-37):
   - `transitDate`: Date filter (defaults to today)
   - `selectedClientId`: Client filter (optional)
   - `clientOptions`: Client dropdown options
   - `snackbar`: Error/success notifications

2. **Client Loading** (Lines 45-73):
   - Loads clients based on user's city_id
   - Maps to dropdown options format
   - Handles errors with snackbar

3. **Data Fetching** (Lines 75-84):
   - `useQCRejectionData`: Fetches rejection listing
   - Enabled only if `transitDate` exists
   - Includes `client_id` if selected

4. **Search Handler** (Lines 101-111):
   - Validates date is selected
   - Triggers API refetch via React Query

5. **Table Columns** (Lines 126-202):
   - Serial number, Transit Date, Time, Client Name, SKU, Reason, Rejected Count, Updated By
   - Date formatting helper function

### Add Page (`QCRejectionAdd.tsx`)

**Key Sections**:

1. **Date Persistence** (Lines 38-62):
   - Restores from `location.state.transitDate` or `localStorage`
   - Saves to `localStorage` whenever date changes
   - Defaults to today if neither exists

2. **Client Loading** (Lines 64-92):
   - Same as Listing page

3. **Data Fetching** (Lines 94-114):
   - `useQCRunsData`: Fetches QC runs needing rejection entry
   - `useQCReportAdherence`: Fetches adherence stats
   - Both enabled only if `transitDate` exists

4. **Navigation to Details** (Lines 168-193):
   - Client name column renders as clickable button
   - Navigates with state: `clientName`, `clientId`, `transitId`, `transitDate`, `transitTime`, `filterDate`, `runId`

5. **Adherence Stats Display** (Lines 240-263):
   - Inline stats: Total Runs, Submitted, Adherence %
   - Displayed right of header

### Details Page (`QCRejectionDetails.tsx`)

**Key Sections**:

1. **Storage Key** (Lines 44-47):
   - Memoized key: `qcRejectionFormData_{runId}`
   - Unique per run for data isolation

2. **Data Loading** (Lines 49-109):
   - Loads SKUs for client
   - Loads active rejection reasons
   - Restores formData from localStorage if exists
   - Merges saved data with SKU structure

3. **Form Data Management** (Lines 111-128):
   - `handleInputChange`: Updates state and localStorage
   - Immediate persistence on every input change

4. **Total Calculations** (Lines 130-141):
   - `calculateTotal`: Row-wise total per SKU
   - `grandTotal`: Sum of all SKU totals

5. **Submit Handler** (Lines 143-200):
   - Validates runId exists
   - Constructs payload from formData
   - Calls API: `submitQCRejections(runId, payload)`
   - Clears localStorage on success
   - Navigates to listing page

6. **Table Rendering** (Lines 202-374):
   - Sticky SKU column (left)
   - Dynamic columns for each rejection reason
   - Editable inputs for rejection counts
   - Row totals and grand total row

## Common Mistakes and Where to Look

### ❌ Mistake 1: Date Filter Resets on Refresh

**Symptom**: Date filter resets to today after page refresh

**Where to Check**:
- `QCRejectionAdd.tsx` - Date restoration logic
- `localStorage` key: `qcRejectionFilterDate`
- `location.state` handling

**Solution**: Ensure date is restored from `location.state` first, then `localStorage`, then default

### ❌ Mistake 2: Form Data Lost on Refresh

**Symptom**: Entered rejection counts disappear on page refresh

**Where to Check**:
- `QCRejectionDetails.tsx` - localStorage save/restore logic
- `storageKey` memoization
- Form data initialization

**Solution**: Ensure formData is saved on every input change and restored on mount

### ❌ Mistake 3: Date Not Preserved on Back Navigation

**Symptom**: Date filter resets when navigating back from Details page

**Where to Check**:
- `QCRejectionDetails.tsx` - Back button navigation
- `location.state.filterDate` passing
- `QCRejectionAdd.tsx` - Date restoration from state

**Solution**: Ensure `filterDate` is passed in navigation state and restored in Add page

### ❌ Mistake 4: API Not Called on Search

**Symptom**: Search button doesn't trigger API call

**Where to Check**:
- `QCRejectionListing.tsx` - `handleSearch` function
- React Query `enabled` flag
- Query key dependencies

**Solution**: Ensure `transitDate` is in query key and `enabled` flag is correct

### ❌ Mistake 5: Wrong Parent IDs in Grandchildren

**Symptom**: Menu hierarchy broken

**Where to Check**:
- `menu_inserts.sql` - Parent ID references
- ID sequence calculations

**Solution**: Verify parent IDs match actual Level 1 menu IDs

## Debugging Tips

1. **Check localStorage**: Verify keys and values are saved correctly
2. **Check Navigation State**: Verify `location.state` values are passed correctly
3. **Check React Query**: Use DevTools to see query keys and cache state
4. **Check Network Tab**: Verify API calls are made with correct params
5. **Check Console**: Look for errors in data loading or form submission

## Key Dependencies

- **React Query**: Data fetching and caching
- **React Router**: Navigation and state passing
- **Redux**: User data (city_id, city_name)
- **localStorage**: Date and form data persistence

