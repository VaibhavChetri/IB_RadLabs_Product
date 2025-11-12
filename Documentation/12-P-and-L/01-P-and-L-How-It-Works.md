# P&L: How It Works Step by Step

This document explains exactly what happens when the P&L Summary page loads and how each piece works.

## When Page Loads - Execution Flow

### Step 1: User Opens P&L Summary Page

**File**: `src/pages/PLSummary.tsx`

**Line 1-14**: Imports
```typescript
import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { PageHeader, Tabs, Snackbar } from '../components/ui';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { PLFilters, usePLFilters } from '../features/p-and-l';
import { getPLTabItems } from '../features/p-and-l/config/tabs';
import {
	useExpenditureData,
	useUnitEconomicsData,
	useEBITDAData,
	useClientWisePLData,
	useEscalationData,
} from '../features/p-and-l/hooks/usePLTabData';
```
**What happens**: Code gets ready to use React, Redux, UI components, filters hook, tab config, and all 5 data hooks.

**Why**: We need React for UI, Redux for user data, ErrorBoundary for error handling, filters hook for filter management, tab config for tab structure, and data hooks for API calls.

---

### Step 2: P&L Summary Component Starts

**File**: `src/pages/PLSummary.tsx`

**Line 20**: Component function starts
```typescript
export const PLSummary: React.FC = () => {
```

**What happens**: The P&L Summary component begins to run.

---

### Step 3: Get User Information from Redux

**File**: `src/pages/PLSummary.tsx`

**Line 21**:
```typescript
const { user } = useSelector((state: RootState) => state.auth);
```

**What happens**: 
- Reads user data from Redux store
- Gets user's `city_id` (which city they belong to)
- Gets user's `city_name` (name of the city)

**Why we do this**: 
- We need to know which city the user is in
- This is passed to some APIs (Unit Economics, EBITDA, Client Wise P&L, Escalations)
- City name is displayed in PageHeader

**What we get**:
- `user.city_id` - A number like 3 (for Mumbai)
- `user.city_name` - A string like "Mumbai"

---

### Step 4: Call Custom Hook to Get Filters

**File**: `src/pages/PLSummary.tsx`

**Line 22-31**:
```typescript
const {
	selectedMonth,
	selectedYear,
	selectedFacility,
	monthOptions,
	yearOptions,
	setSelectedMonth,
	setSelectedYear,
	setSelectedFacility,
} = usePLFilters();
```

**What happens**: 
- Calls the `usePLFilters` hook
- This hook does ALL the filter work (we explain this below)
- Gets back filter values and functions to change them

**Why we use a hook**:
- Keeps PLSummary.tsx simple (only 182 lines)
- All filter logic is in one place (`usePLFilters.ts`)
- Easy to test and reuse

**What we get**:
- `selectedMonth` - Current selected month (e.g., "10" for October)
- `selectedYear` - Current selected year (e.g., "2025")
- `selectedFacility` - Current selected facility ID (e.g., "115")
- `monthOptions` - Array of month options for dropdown
- `yearOptions` - Array of year options for dropdown
- `setSelectedMonth`, `setSelectedYear`, `setSelectedFacility` - Functions to update filters

---

### Step 5: Initialize Tab State

**File**: `src/pages/PLSummary.tsx`

**Line 33**:
```typescript
const [activeTab, setActiveTab] = useState<string>('ebitda');
```

**What happens**: 
- Sets initial active tab to 'ebitda'
- Creates state to track which tab is currently selected

**Why**: 
- User needs to see a tab by default
- 'ebitda' is chosen as the default tab

---

### Step 6: Initialize Snackbar State

**File**: `src/pages/PLSummary.tsx`

**Line 34-38**:
```typescript
const [snackbar, setSnackbar] = useState({
	open: false,
	message: '',
	type: 'error' as 'success' | 'error' | 'info',
});
```

**What happens**: 
- Creates state for error notifications
- Initially closed (`open: false`)

**Why**: 
- We need to show API errors to the user
- Snackbar displays error messages at the page level

---

### Step 7: Determine If We Should Fetch Data

**File**: `src/pages/PLSummary.tsx`

**Line 41**:
```typescript
const shouldFetch = !!(selectedMonth && selectedYear && selectedFacility);
```

**What happens**: 
- Checks if all three filters are set
- Returns `true` only if all filters have values
- Returns `false` if any filter is empty

**Why**: 
- We don't want to call APIs with incomplete filters
- Prevents unnecessary API calls
- Ensures data quality

**What we get**:
- `shouldFetch` - Boolean: `true` if all filters set, `false` otherwise

---

### Step 8: Call All 5 API Hooks (Page Level)

**File**: `src/pages/PLSummary.tsx`

**Line 43-82**: All 5 hooks are called
```typescript
const expenditureQuery = useExpenditureData(
	selectedFacility,
	selectedMonth,
	selectedYear,
	shouldFetch
);
const unitEconomicsQuery = useUnitEconomicsData(
	user?.city_id,
	selectedFacility,
	selectedMonth,
	selectedYear,
	shouldFetch
);
const ebitdaQuery = useEBITDAData(
	user?.city_id,
	selectedFacility,
	selectedMonth,
	selectedYear,
	shouldFetch
);
const clientWisePLQuery = useClientWisePLData(
	user?.city_id,
	selectedFacility,
	selectedMonth,
	selectedYear,
	shouldFetch
);
const escalationsQuery = useEscalationData(
	user?.city_id,
	selectedFacility,
	selectedMonth,
	selectedYear,
	shouldFetch
);
```

**What happens**: 
- All 5 React Query hooks are called at page level
- Each hook receives filter values and `shouldFetch` flag
- React Query manages caching, loading states, and errors

**Why page level, not tab level**:
- ✅ Prevents redundant API calls when switching tabs
- ✅ Ensures all data is ready when user switches tabs
- ✅ Optimizes performance by calling once per filter change
- ✅ Better user experience (instant tab switching)

**What each hook does**:
1. **`useExpenditureData`** - Fetches expenditure/revenue data
2. **`useUnitEconomicsData`** - Fetches unit economics data (needs `city_id`)
3. **`useEBITDAData`** - Fetches EBITDA data (needs `city_id`)
4. **`useClientWisePLData`** - Fetches client-wise P&L data (needs `city_id`)
5. **`useEscalationData`** - Fetches escalation data (needs `city_id`)

**React Query behavior**:
- If `shouldFetch` is `false`, hooks don't execute
- If `shouldFetch` is `true`, hooks execute immediately
- React Query caches responses based on `queryKey`
- Same `queryKey` = same cached data (no duplicate calls)

---

### Step 9: Handle API Errors

**File**: `src/pages/PLSummary.tsx`

**Line 84-103**: Error handling useEffect
```typescript
useEffect(() => {
	const errors = [
		expenditureQuery.error,
		unitEconomicsQuery.error,
		ebitdaQuery.error,
		clientWisePLQuery.error,
		escalationsQuery.error,
	].filter(Boolean);

	if (errors.length > 0 && shouldFetch) {
		const firstError = errors[0];
		if (firstError) {
			setSnackbar({
				open: true,
				message: `Failed to load data: ${firstError.message}`,
				type: 'error',
			});
		}
	}
}, [
	expenditureQuery.error,
	unitEconomicsQuery.error,
	ebitdaQuery.error,
	clientWisePLQuery.error,
	escalationsQuery.error,
	shouldFetch,
]);
```

**What happens**: 
- Watches for errors from any of the 5 API hooks
- If any error occurs and `shouldFetch` is true, shows Snackbar
- Displays first error message to user

**Why**: 
- User needs to know when API calls fail
- Snackbar provides non-intrusive error notification
- Only shows errors when APIs are actually called

---

### Step 10: Handle Search (No-Op)

**File**: `src/pages/PLSummary.tsx`

**Line 105-108**:
```typescript
const handleSearch = () => {
	// APIs are already called automatically when filters change
	// This is kept for UI consistency
};
```

**What happens**: 
- Search button click handler
- Does nothing (no-op)

**Why**: 
- APIs are already called automatically when filters change
- Search button is kept for UI consistency with other pages
- User can still click it, but it doesn't trigger additional calls

---

### Step 11: Get Tab Items from Config

**File**: `src/pages/PLSummary.tsx`

**Line 110-125**: Tab items memoization
```typescript
const tabItems = useMemo(
	() =>
		getPLTabItems({
			cityId: user?.city_id,
			facilityId: selectedFacility,
			month: selectedMonth,
			year: selectedYear,
			enabled: true, // Always enabled since we're calling APIs at page level
			onError: (message: string) => {
				setSnackbar({
					open: true,
					message,
					type: 'error',
				});
			},
		}),
	[selectedFacility, selectedMonth, selectedYear, user?.city_id]
);
```

**What happens**: 
- Calls `getPLTabItems` function from `config/tabs.ts`
- Passes filter values, enabled flag, and error handler
- Memoizes result to prevent unnecessary recalculations
- Only recalculates when filters change

**Why memoization**: 
- Prevents recreating tab items on every render
- Improves performance
- Only updates when dependencies change

**What we get**:
- `tabItems` - Array of tab items with id, label, and content components

---

### Step 12: Render Page Structure

**File**: `src/pages/PLSummary.tsx`

**Line 127-181**: JSX return
```typescript
return (
	<ErrorBoundary>
		<div className='space-y-6'>
			<PageHeader
				title='P&L Summary'
				locationName={user?.city_name || 'City'}
				totalItems={0}
				itemType='summary'
				icon='💰'
			/>

			<PLFilters
				selectedMonth={selectedMonth}
				selectedYear={selectedYear}
				selectedFacility={selectedFacility}
				monthOptions={monthOptions}
				yearOptions={yearOptions}
				onMonthChange={setSelectedMonth}
				onYearChange={setSelectedYear}
				onFacilityChange={setSelectedFacility}
				onSearch={handleSearch}
			/>

			<ErrorBoundary>
				<div className='bg-white rounded-lg shadow-sm'>
					<Tabs
						items={tabItems}
						activeTab={activeTab}
						onTabChange={setActiveTab}
						variant='underline'
						className='w-full'
					/>
				</div>
			</ErrorBoundary>

			<Snackbar
				open={snackbar.open}
				onClose={() => setSnackbar({ ...snackbar, open: false })}
				message={snackbar.message}
				type={snackbar.type}
			/>
		</div>
	</ErrorBoundary>
);
```

**What happens**: 
- Renders page structure with ErrorBoundary wrapper
- Renders PageHeader with title and location
- Renders PLFilters with filter dropdowns
- Renders Tabs component with tab items
- Renders Snackbar for error notifications

**Why ErrorBoundary**: 
- Catches rendering errors in child components
- Prevents entire page from crashing
- Shows fallback UI if error occurs

---

## When User Changes Filters - Execution Flow

### Step 1: User Changes Month/Year/Facility

**File**: `src/pages/PLSummary.tsx` → `src/features/p-and-l/components/PLFilters.tsx`

**What happens**: 
- User selects new value in dropdown
- `onMonthChange`, `onYearChange`, or `onFacilityChange` is called
- Filter state is updated in `usePLFilters` hook

---

### Step 2: Filter State Updates

**File**: `src/features/p-and-l/hooks/usePLFilters.ts`

**What happens**: 
- Filter state (`selectedMonth`, `selectedYear`, `selectedFacility`) updates
- Component re-renders with new filter values

---

### Step 3: `shouldFetch` Recalculates

**File**: `src/pages/PLSummary.tsx`

**Line 41**:
```typescript
const shouldFetch = !!(selectedMonth && selectedYear && selectedFacility);
```

**What happens**: 
- `shouldFetch` recalculates based on new filter values
- If all filters are set, `shouldFetch` becomes `true`
- If any filter is empty, `shouldFetch` becomes `false`

---

### Step 4: All 5 API Hooks Re-execute

**File**: `src/pages/PLSummary.tsx`

**What happens**: 
- All 5 React Query hooks receive new `shouldFetch` value
- If `shouldFetch` is `true`, hooks execute with new filter values
- React Query checks `queryKey` to see if data is cached
- If `queryKey` changed, new API call is made
- If `queryKey` is same, cached data is returned

**React Query caching**:
- `queryKey` includes: `['p-and-l', 'tab-name', facilityId, month, year]`
- Same filters = same `queryKey` = cached data
- Different filters = different `queryKey` = new API call

---

### Step 5: Tab Items Recalculate

**File**: `src/pages/PLSummary.tsx`

**Line 110-125**: Tab items memoization

**What happens**: 
- `useMemo` dependencies change (`selectedFacility`, `selectedMonth`, `selectedYear`)
- `getPLTabItems` is called again with new filter values
- Tab content components receive updated props
- Tab components re-render with new data

---

## How Each Tab Component Works

### Expenditure Tab

**File**: `src/features/p-and-l/components/PLTabContents.tsx`

**Component**: `ExpenditureTab`

**What it does**:
1. Calls `useExpenditureData` hook (but data is already fetched at page level)
2. Transforms API response into table format
3. Extracts records from nested structure: `data[0].facilities[0].monthYearData[0].records`
4. Calculates totals for all columns
5. Renders table with columns: SL, Costing Type, Projection, W1, Delta(W1), W2, Delta(W2), W3, Delta(W3), W4, Delta(W4), Total Actual, Total Delta

**Data transformation**:
- Maps records to table rows
- Formats numbers with commas
- Calculates total row with aggregated values
- Formats delta percentages

---

### Unit Economics Tab

**File**: `src/features/p-and-l/components/PLTabContents.tsx`

**Component**: `UnitEconomicsTab`

**What it does**:
1. Calls `useUnitEconomicsData` hook
2. Transforms API response into table format
3. Extracts items from `data.updateUnitEconomics`
4. Extracts totals from `data.total`
5. Renders table with columns: SL, Costing Type, Projection, W1, Delta(W1), W2, Delta(W2), W3, Delta(W3), W4, Delta(W4), Aggr Unit

**Data transformation**:
- Maps items to table rows
- Formats numbers to 2 decimal places
- Shows "-" for zero values (except totals)
- Adds total row with aggregated values

**Styling**:
- Week columns have colored backgrounds (`bg-blue-50`, `bg-pink-50`, etc.)
- Delta columns have lighter shade backgrounds
- First two columns use `text-xs`, rest use `text-[11px]`

---

### EBITDA Tab

**File**: `src/features/p-and-l/components/EBITDATab.tsx`

**Component**: `EBITDATab`

**What it does**:
1. Calls `useEBITDAData` hook
2. Gets month name from month number
3. Extracts report for selected month from `data.report[monthName]`
4. Renders two tables:
   - **Variable Cost Details Table**: Total Revenue, Variable Costs, On Site Manpower, Total Variable Cost, Contribution
   - **Indirect Expense Details Table**: Indirect Expenses, Total Indirect Expense, EBITDA

**Data transformation**:
- Safely accesses nested properties with null checks
- Formats numbers with commas
- Handles missing data gracefully (shows empty tables with message)

**Error handling**:
- Checks if `data` or `data.report` exists
- Checks if `report[monthName]` exists
- Shows "No data available" message if data missing
- Never crashes, always shows table structure

---

### Client Wise P&L Tab

**File**: `src/features/p-and-l/components/PLTabContents.tsx`

**Component**: `ClientWisePLTab`

**What it does**:
1. Calls `useClientWisePLData` hook
2. Transforms API response into table format
3. Extracts clients from `data.clientWiseData.data`
4. Extracts totals from `data.clientWiseData`
5. Renders table with columns: SL, Client, SKU, OPD, Price, Rev/Plate, Manpower, Electricity, Water, Consumables, Chemicals, etc.

**Data transformation**:
- Maps clients to table rows
- Formats numbers with commas
- Adds total row with aggregated values
- Removes "Bill Type" and "Bill Sub Type" columns

**Styling**:
- Shortened column names (e.g., "SL" instead of "SL.No", "Client" instead of "Client Name")
- First two columns use `text-xs`, rest use `text-[11px]`
- Column headers don't wrap (`whitespace-nowrap`)

---

### Escalations Tab

**File**: `src/features/p-and-l/components/PLTabContents.tsx`

**Component**: `EscalationsTab`

**What it does**:
1. Calls `useEscalationData` hook
2. Transforms API response into two tables:
   - **Client Escalation Table**: Shows escalation counts per client per week
   - **Escalation Category Table**: Shows escalation counts per category per week
3. Extracts data from `data.totalEscalationClientWiseByWeek` and `data.totalEscalationWeekWise`

**Data transformation**:
- Parses nested week structure (`week1`, `week2`, `week3`, `week4`)
- Extracts client names and counts from `weekX[clientName]`
- Extracts category names and counts from `weekX[categoryName]`
- Calculates deltas for client escalation table
- Formats values: Shows "0" for totals, "-" for regular rows with zero

**Styling**:
- Week columns have colored backgrounds
- Delta columns have lighter shade backgrounds
- First two columns use `text-xs`, rest use `text-[11px]`

---

## Common Mistakes and Where to Look

### 1. APIs Not Being Called

**Symptom**: No data in any tab, no API calls in Network tab

**Where to check**:
- `src/pages/PLSummary.tsx` Line 41: Is `shouldFetch` true?
- `src/pages/PLSummary.tsx` Line 45-82: Are all 5 hooks called?
- `src/features/p-and-l/hooks/usePLTabData.ts`: Is `enabled` flag passed correctly?

**Common causes**:
- Filter not selected (month/year/facility empty)
- `shouldFetch` is false
- `enabled` flag is false in hook

---

### 2. Only One API Being Called

**Symptom**: Only one tab shows data, others are empty

**Where to check**:
- `src/pages/PLSummary.tsx` Line 45-82: Are all 5 hooks called?
- `src/services/pAndLApi.ts`: Are API methods returning data correctly?
- Browser Network tab: Are all 5 API calls made?

**Common causes**:
- Hooks not called at page level (called in tab components instead)
- API methods returning incorrect format
- React Query deduplication (same `queryKey`)

---

### 3. Date Range Issues (Wrong Month Showing)

**Symptom**: Selecting September shows August data, or dates are off by one day

**Where to check**:
- `src/features/p-and-l/hooks/usePLTabData.ts` Line 22-45: `getDateRangeFromMonthYear` function
- Are UTC methods used? (`Date.UTC`, `getUTCFullYear`, `getUTCMonth`, `getUTCDate`)

**Common causes**:
- Using local timezone methods instead of UTC
- `toISOString()` causing timezone shifts
- Incorrect month calculation (off by one)

**Fix**: Always use UTC methods for date calculation and formatting

---

### 4. Table Not Showing Rows

**Symptom**: Table headers visible but no data rows

**Where to check**:
- Tab component's `tableData` useMemo: Is data transformation correct?
- API response structure: Does it match expected format?
- Browser console: Are there any errors?

**Common causes**:
- Incorrect data path (e.g., `data.result` instead of `data.clientWiseData.data`)
- API response structure changed
- Data transformation returning empty array
- Type mismatch in data access

---

### 5. Tab Switching Triggers API Calls

**Symptom**: API calls made when switching tabs (shouldn't happen)

**Where to check**:
- `src/pages/PLSummary.tsx` Line 45-82: Are hooks called at page level?
- `src/features/p-and-l/components/PLTabContents.tsx`: Are hooks called again in tab components?
- `src/features/p-and-l/hooks/usePLTabData.ts`: Is `refetchOnMount: false` set?

**Common causes**:
- Hooks called in tab components (should be at page level)
- `refetchOnMount: true` in React Query config
- `enabled` flag changing on tab switch

**Fix**: Call all hooks at page level, set `refetchOnMount: false`

---

### 6. Error Handling Not Working

**Symptom**: API errors not shown to user

**Where to check**:
- `src/pages/PLSummary.tsx` Line 84-103: Is error useEffect watching all queries?
- `src/pages/PLSummary.tsx` Line 34-38: Is Snackbar state initialized?
- `src/pages/PLSummary.tsx` Line 170-177: Is Snackbar rendered?

**Common causes**:
- Error useEffect not watching all queries
- Snackbar not rendered in JSX
- Error handler not passed to tab components

---

### 7. Facility Dropdown Not Showing Options

**Symptom**: Facility dropdown is empty

**Where to check**:
- `src/components/FacilityDropdown.tsx`: Is `useFacilityDropdown` hook called?
- `src/hooks/useFacilityDropdown.ts`: Is API call successful?
- Browser Network tab: Is `/api/locations/getLocations?location_type=2` called?

**Common causes**:
- API authentication issue
- API response structure mismatch
- Hook not called or disabled

---

### 8. Font Sizing Inconsistent

**Symptom**: Table fonts look different across tabs

**Where to check**:
- `src/components/ui/DataDisplay.tsx`: Is `cellClassName` supported?
- Tab components: Are `cellClassName` props set correctly?
- First two columns: Should use `text-xs`
- Other columns: Should use `text-[11px]`

**Common causes**:
- `cellClassName` not applied to first two columns
- Default font size overriding custom classes
- Missing `cellClassName` prop in column definitions

---

## Navigation Guide for Developers

### To Add a New Filter

1. **Update `usePLFilters.ts`**:
   - Add state for new filter
   - Add loading logic if needed
   - Add setter function
   - Export from hook

2. **Update `PLFilters.tsx`**:
   - Add dropdown/input component
   - Pass value and onChange handler
   - Add to filter layout

3. **Update `PLSummary.tsx`**:
   - Get new filter from `usePLFilters` hook
   - Pass to API hooks if needed
   - Update `shouldFetch` logic if needed

4. **Update API hooks** (`usePLTabData.ts`):
   - Add new filter parameter to hook signature
   - Include in API params if needed
   - Include in `queryKey` for caching

---

### To Add a New Tab

1. **Create tab content component** (`PLTabContents.tsx`):
   - Create new component function
   - Call corresponding React Query hook
   - Transform data for table
   - Render table with columns

2. **Create React Query hook** (`usePLTabData.ts`):
   - Create hook function
   - Use `useQuery` with proper `queryKey`
   - Set `refetchOnMount: false` and `refetchOnWindowFocus: false`
   - Return `UseQueryResult`

3. **Add API method** (`pAndLApi.ts`):
   - Create API method
   - Define TypeScript interfaces for params and response
   - Return response directly (not wrapped)

4. **Add tab config** (`config/tabs.ts`):
   - Add tab item to `getPLTabItems` array
   - Use `React.createElement` to create content component
   - Pass necessary props

5. **Call hook in `PLSummary.tsx`**:
   - Add hook call at page level (Line 45-82)
   - Add error to error useEffect (Line 84-103)
   - Pass `shouldFetch` flag

---

### To Debug API Issues

1. **Check Network tab**:
   - Are API calls being made?
   - What are the request params?
   - What is the response status?
   - What is the response data?

2. **Check API service** (`pAndLApi.ts`):
   - Is method defined correctly?
   - Are params formatted correctly?
   - Is response structure correct?

3. **Check React Query hook** (`usePLTabData.ts`):
   - Is `queryKey` correct?
   - Is `enabled` flag correct?
   - Is `queryFn` returning correct data?

4. **Check tab component**:
   - Is hook called correctly?
   - Is data transformation correct?
   - Are there any console errors?

---

### To Debug Filter Issues

1. **Check `usePLFilters.ts`**:
   - Is filter state initialized?
   - Is setter function working?
   - Are options loading correctly?

2. **Check `PLFilters.tsx`**:
   - Is component receiving props?
   - Is onChange handler called?
   - Is value displayed correctly?

3. **Check `PLSummary.tsx`**:
   - Is filter value passed to hooks?
   - Is `shouldFetch` calculated correctly?
   - Are hooks receiving updated values?

---

## Summary

The P&L feature follows a **page-level API call pattern** where all 5 APIs are called at the page level (`PLSummary.tsx`), not at the tab level. This ensures:

- ✅ No redundant API calls when switching tabs
- ✅ All data is ready when user switches tabs
- ✅ Better performance and user experience
- ✅ Consistent error handling

The feature uses React Query for data fetching, custom hooks for filter management, and generic table components for consistent UI. All date calculations use UTC methods to prevent timezone issues.

