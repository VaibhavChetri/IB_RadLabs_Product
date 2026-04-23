# QC Rejection - Pages Documentation

## Page 1: Listing Page (`QCRejectionListing.tsx`)

### Purpose
View all recorded QC rejections with filtering capabilities.

### Route
`/operations-reporting/qc-rejection/listing`

### Sections

#### 1. Header Section
- **Page Title**: "QC Rejection"
- **Location**: User's city name
- **Total Count**: Number of rejection records
- **Add Button**: Navigates to Add page

#### 2. Filter Section
- **Transit Date**: Required date input (defaults to today)
- **Client Dropdown**: Optional client filter (includes "All Clients" option)
- **Search Button**: Triggers API call

**Filter Behavior**:
- Date filter is required
- Client filter is optional (if not selected, shows all clients)
- Search button validates date before triggering API
- API called only when `transitDate` exists

#### 3. Table Section
**Columns**:
- **#**: Serial number (1-based index)
- **Transit Date**: Formatted as DD/MM/YYYY
- **Time**: Transit time
- **Client Name**: Client name
- **SKU**: Container type name
- **Reason**: Rejection reason name
- **Rejected Count**: Number of rejected items
- **Updated By**: Name of user who updated

**Data Source**: `useQCRejectionData` hook

### Key Code Sections

**Date Default** (Lines 39-43):
```typescript
useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setTransitDate(today);
}, []);
```

**Client Loading** (Lines 45-73):
- Fetches clients based on user's `city_id`
- Maps to dropdown options format
- Includes "All Clients" option

**Data Fetching** (Lines 75-84):
- Enabled only if `transitDate` exists
- Includes `client_id` in API call if selected
- Shows skeleton while loading

---

## Page 2: Add Page (`QCRejectionAdd.tsx`)

### Purpose
View QC runs that need rejection entry, with adherence statistics.

### Route
`/operations-reporting/qc-rejection/add`

### Sections

#### 1. Header Section
- **Title**: "Add QC Rejection"
- **Location**: User's city name
- **QC Runs Count**: Number of runs displayed
- **Adherence Stats** (inline, right of header):
  - Total Runs
  - Submitted
  - Adherence %

#### 2. Filter Section
- **Transit Date**: Date input (persisted in localStorage)
- **Client Dropdown**: Optional client filter
- **Search Button**: Triggers API calls

**Filter Behavior**:
- Date filter persisted in `localStorage` key: `qcRejectionFilterDate`
- Restored from `location.state.transitDate` or `localStorage` on mount
- Saved to `localStorage` whenever date changes
- Defaults to today if neither exists

#### 3. Table Section
**Columns**:
- **#**: Serial number
- **Client Name**: Clickable link (navigates to Details page)
- **Transit Date**: Formatted date
- **Time**: Transit time

**Data Source**: `useQCRunsData` hook

**Navigation**:
- Clicking client name navigates to Details page
- Passes state: `clientName`, `clientId`, `transitId`, `transitDate`, `transitTime`, `filterDate`, `runId`

### Key Code Sections

**Date Persistence** (Lines 38-62):
```typescript
// Restore from location.state, localStorage, or default
useEffect(() => {
    const savedDate = location.state?.transitDate;
    if (savedDate) {
        setTransitDate(savedDate);
        localStorage.setItem('qcRejectionFilterDate', savedDate);
    } else {
        const storedDate = localStorage.getItem('qcRejectionFilterDate');
        if (storedDate) {
            setTransitDate(storedDate);
        } else {
            const today = new Date().toISOString().split('T')[0];
            setTransitDate(today);
            localStorage.setItem('qcRejectionFilterDate', today);
        }
    }
}, [location.state]);

// Save whenever date changes
useEffect(() => {
    if (transitDate) {
        localStorage.setItem('qcRejectionFilterDate', transitDate);
    }
}, [transitDate]);
```

**Adherence Stats** (Lines 240-263):
- Fetched via `useQCReportAdherence` hook
- Displayed inline with header (right side)
- Shows: Total Runs, Submitted, Adherence %

---

## Page 3: Details Page (`QCRejectionDetails.tsx`)

### Purpose
Enter rejection counts per SKU and reason for a specific QC run.

### Route
`/operations-reporting/qc-rejection/details/:clientId/:transitId`

### Sections

#### 1. Header Section
- **Back Button**: Navigates to Add page (preserves date filter)
- **Title**: "Add QC Rejection Details"
- **Client Info**: Client name, transit date, transit time

#### 2. Table Section
**Structure**:
- **Sticky SKU Column**: Left side, shows container type names
- **Dynamic Reason Columns**: One column per active rejection reason
- **Total Column**: Right side, shows row-wise totals
- **Grand Total Row**: Bottom row, shows column totals and grand total

**Input Fields**:
- Editable number inputs for rejection counts
- Empty input shows as blank (not 0)
- Values saved to localStorage on every change

**Data Sources**:
- **SKUs**: `SkuApiService.getClientSkuMap(clientId)`
- **Rejection Reasons**: `EscalationTypeService.getEscalationTypes()` (filtered to Active)

#### 3. Submit Section
- **Submit Button**: Saves rejection data
- **Success**: Clears localStorage, shows snackbar, navigates to listing page
- **Error**: Shows error snackbar, form data remains

### Key Code Sections

**Storage Key** (Lines 44-47):
```typescript
const storageKey = useMemo(() => {
    return runId ? `qcRejectionFormData_${runId}` : null;
}, [runId]);
```

**Data Loading** (Lines 49-109):
- Loads SKUs and rejection reasons in parallel
- Initializes formData structure from SKUs
- Restores saved data from localStorage if exists
- Merges saved data with SKU structure

**Form Data Persistence** (Lines 111-128):
```typescript
const handleInputChange = (skuId: string, reasonId: string, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10) || 0;
    setFormData(prev => {
        const newData = {
            ...prev,
            [skuId]: {
                ...prev[skuId],
                [reasonId]: numValue,
            },
        };
        // Save to localStorage immediately
        if (storageKey) {
            localStorage.setItem(storageKey, JSON.stringify(newData));
        }
        return newData;
    });
};
```

**Submit Handler** (Lines 143-200):
- Validates runId exists
- Constructs payload: `{ details: [{ containerTypeId, reasonId, rejectedCount }] }`
- Calls API: `QCRejectionService.submitQCRejections(runId, payload)`
- Clears localStorage on success
- Navigates to listing page

**Back Navigation** (Lines 202-210):
- Navigates to Add page
- Passes `filterDate` in state to preserve date filter

### Table Structure

**Header Row**:
- SKU (sticky left)
- Rejection Reason 1
- Rejection Reason 2
- ...
- Total (right)

**Data Rows**:
- SKU name (sticky left)
- Input field per reason
- Row total (calculated)

**Grand Total Row**:
- "Grand Total" label (sticky left)
- Column totals per reason
- Grand total (sum of all)

---

## Navigation Flow

### Flow 1: Listing → Add
```
User clicks "Add QC Rejection" button
    ↓
Navigate to /operations-reporting/qc-rejection/add
    ↓
Add page loads with today's date (or saved date)
```

### Flow 2: Add → Details
```
User clicks client name in table
    ↓
Navigate to /operations-reporting/qc-rejection/details/{clientId}/{transitId}
    ↓
State passed: clientName, clientId, transitId, transitDate, transitTime, filterDate, runId
    ↓
Details page loads SKUs and reasons
    ↓
Form data restored from localStorage (if exists)
```

### Flow 3: Details → Add (Back)
```
User clicks Back button
    ↓
Navigate to /operations-reporting/qc-rejection/add
    ↓
State passed: filterDate
    ↓
Add page restores date from location.state
    ↓
API calls triggered automatically
```

### Flow 4: Details → Listing (Submit)
```
User clicks Submit button
    ↓
API call succeeds
    ↓
localStorage cleared
    ↓
Navigate to /operations-reporting/qc-rejection/listing
    ↓
Listing page loads with default date (today)
```

---

## Data Persistence

### Date Persistence (Add Page)
- **Key**: `qcRejectionFilterDate`
- **Location**: `localStorage`
- **Restored From**: `location.state.transitDate` → `localStorage` → today
- **Saved**: Whenever date changes

### Form Data Persistence (Details Page)
- **Key**: `qcRejectionFormData_{runId}`
- **Location**: `localStorage`
- **Restored From**: `localStorage` on mount
- **Saved**: On every input change
- **Cleared**: On successful submit

---

## Common Issues

### Issue 1: Date Filter Not Persisting
**Check**: `QCRejectionAdd.tsx` date restoration logic and `localStorage` key

### Issue 2: Form Data Lost on Refresh
**Check**: `QCRejectionDetails.tsx` localStorage save/restore logic and `storageKey` memoization

### Issue 3: Wrong Data in Table
**Check**: API response structure matches expected format, column keys match API fields

### Issue 4: Navigation State Not Passed
**Check**: `navigate()` calls include `state` parameter with required values

---

**Related Documentation**: [How It Works](./01-QC-Rejection-How-It-Works.md) | [API Reference](./03-QC-Rejection-API-Reference.md)

