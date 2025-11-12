# Revenue: How It Works Step by Step

This document explains exactly what happens when each Revenue page loads and how each piece works.

## Table of Contents

1. [Add Page Flow](#add-page-flow)
2. [List Page Flow](#list-page-flow)
3. [Edit Page Flow](#edit-page-flow)
4. [Redux Persistence Flow](#redux-persistence-flow)
5. [Common Mistakes and Debugging](#common-mistakes-and-debugging)

---

## Add Page Flow

### Step 1: User Opens Add Page

**File**: `src/pages/MonthlyEstimateAdd.tsx`

**Line 1-26**: Imports
```typescript
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Snackbar } from '../components/ui';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import {
	setBudget,
	setBudgets,
	setOnSiteManPowerEstimate,
	setOnSiteManPowerEstimates,
	setLastUpdated,
} from '../store/slices/revenueSlice';
import { RevenueAddFilters } from '../features/revenue/components/RevenueAddFilters';
import { useRevenueFilters } from '../features/revenue/hooks/useRevenueFilters';
import { useReviewCostingTypes } from '../features/revenue/hooks/useReviewCostingTypes';
import { useProjectedCosting } from '../features/revenue/hooks/useProjectedCosting';
import { useOnSiteManPowerClients } from '../features/revenue/hooks/useOnSiteManPowerClients';
import { CostingBudgetTable } from '../features/revenue/components/CostingBudgetTable';
import { OnSiteManPowerTable } from '../features/revenue/components/OnSiteManPowerTable';
```

**What happens**: Code gets ready to use React, Redux, UI components, filters hook, data hooks, and table components.

**Why**: We need React for UI, Redux for persistence, hooks for data fetching, and components for display.

---

### Step 2: Component Starts and Gets User Data

**File**: `src/pages/MonthlyEstimateAdd.tsx`

**Line 45-48**:
```typescript
export const MonthlyEstimateAdd: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { user } = useSelector((state: RootState) => state.auth);
```

**What happens**: 
- Component function starts
- Gets `navigate` function for routing
- Gets `dispatch` function for Redux actions
- Reads user data from Redux store

**Why**: 
- Need user's `city_id` for some API calls
- Need `dispatch` to update Redux state
- Need `navigate` to redirect after submit

---

### Step 3: Get Persisted Data from Redux

**File**: `src/pages/MonthlyEstimateAdd.tsx`

**Line 49-53**:
```typescript
const {
	budgets: persistedBudgets,
	onSiteManPowerEstimates: persistedEstimates,
	lastUpdated,
} = useSelector((state: RootState) => state.revenue);
```

**What happens**: 
- Reads persisted budgets and estimates from Redux store
- Gets `lastUpdated` timestamp to check if filters match

**Why**: 
- If user refreshed page, we want to restore their input
- `lastUpdated` tells us which filters the persisted data belongs to

---

### Step 4: Call Filters Hook

**File**: `src/pages/MonthlyEstimateAdd.tsx`

**Line 55-64**:
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
} = useRevenueFilters();
```

**What happens**: 
- Calls `useRevenueFilters` hook
- Gets filter values and setter functions
- Gets dropdown options

**Why**: 
- Centralizes filter logic in one place
- Handles facility loading and auto-selection
- Provides consistent filter behavior

---

### Step 5: Initialize Local State from Persisted Data

**File**: `src/pages/MonthlyEstimateAdd.tsx`

**Line 73-75**:
```typescript
const [budgets, setBudgetsLocal] = useState<Record<number, string>>(persistedBudgets);
const [onSiteManPowerEstimates, setOnSiteManPowerEstimatesLocal] =
	useState<Record<number, string>>(persistedEstimates);
```

**What happens**: 
- Initializes local state with persisted values
- If no persisted data, starts with empty objects

**Why**: 
- Local state is used for form inputs
- Persisted data is source of truth for initial values
- Changes to local state trigger Redux updates

---

### Step 6: Fetch Costing Types and Clients

**File**: `src/pages/MonthlyEstimateAdd.tsx`

**Line 66-72**:
```typescript
const {
	data: costingTypes,
	isLoading: isLoadingCostingTypes,
	error: costingTypesError,
} = useReviewCostingTypes();
```

**Line 115-119**:
```typescript
const {
	data: onSiteManPowerClients,
	isLoading: isLoadingOnSiteClients,
	error: onSiteClientsError,
} = useOnSiteManPowerClients(facilityId, !!facilityId);
```

**What happens**: 
- Fetches costing types immediately (no dependencies)
- Fetches on-site manpower clients when facility is selected

**Why**: 
- Need costing types to populate budget table
- Need clients to populate manpower table
- Both are required before user can enter data

---

### Step 7: Check if Should Load from API

**File**: `src/pages/MonthlyEstimateAdd.tsx`

**Line 94-103**:
```typescript
const shouldLoadFromAPI = useMemo(() => {
	if (!projectedCostingParams) return false;
	// Load from API if filters changed (different month/year/facility)
	return (
		!lastUpdated.date_year ||
		!lastUpdated.facility_id ||
		lastUpdated.date_year !== projectedCostingParams.date_year ||
		lastUpdated.facility_id !== projectedCostingParams.facility_id
	);
}, [projectedCostingParams, lastUpdated]);
```

**What happens**: 
- Compares current filters with persisted data filters
- Returns `true` if filters changed or no persisted data exists

**Why**: 
- Avoids unnecessary API calls if data already exists
- Only fetches when filters change
- Uses persisted data if filters match

---

### Step 8: Fetch Projected Costing Data

**File**: `src/pages/MonthlyEstimateAdd.tsx`

**Line 106-111**:
```typescript
const {
	data: projectedCostingData,
	manPowerResults,
	isLoading: isLoadingProjectedCosting,
	error: projectedCostingError,
} = useProjectedCosting(projectedCostingParams, !!projectedCostingParams);
```

**What happens**: 
- Fetches existing projected costing data if filters are set
- Gets both `projectedCostingData` (budgets) and `manPowerResults` (manpower estimates)

**Why**: 
- Pre-populates form if data already exists for selected month/year/facility
- User can edit existing data instead of starting from scratch

---

### Step 9: Populate Budgets from API Response

**File**: `src/pages/MonthlyEstimateAdd.tsx`

**Line 138-163**:
```typescript
useEffect(() => {
	if (!shouldLoadFromAPI) return; // Don't overwrite if using persisted data

	if (projectedCostingData && projectedCostingData.length > 0) {
		const budgetsMap: Record<number, string> = {};
		projectedCostingData.forEach(item => {
			const value = parseFloat(item.projected_value);
			budgetsMap[item.costing_type_id] = value.toString();
		});
		setBudgetsLocal(budgetsMap);
		dispatch(setBudgets(budgetsMap));
		if (projectedCostingParams) {
			dispatch(
				setLastUpdated({
					date_year: projectedCostingParams.date_year,
					facility_id: projectedCostingParams.facility_id,
				})
			);
		}
	} else if (projectedCostingData && projectedCostingData.length === 0) {
		setBudgetsLocal({});
		dispatch(setBudgets({}));
	}
}, [projectedCostingData, shouldLoadFromAPI, dispatch, projectedCostingParams]);
```

**What happens**: 
- When API data arrives and `shouldLoadFromAPI` is true:
  - Transforms API response into budgets map
  - Updates local state and Redux state
  - Updates `lastUpdated` timestamp
- If empty array, clears budgets

**Why**: 
- Only runs when filters changed (not when using persisted data)
- Keeps local state and Redux in sync
- Updates timestamp so we know which filters this data belongs to

---

### Step 10: Populate Manpower Estimates from API Response

**File**: `src/pages/MonthlyEstimateAdd.tsx`

**Line 166-182**:
```typescript
useEffect(() => {
	if (!shouldLoadFromAPI) return; // Don't overwrite if using persisted data

	if (manPowerResults && manPowerResults.length > 0) {
		const estimatesMap: Record<number, string> = {};
		manPowerResults.forEach(item => {
			const value = parseFloat(item.est);
			estimatesMap[item.client_id] = value.toString();
		});
		setOnSiteManPowerEstimatesLocal(estimatesMap);
		dispatch(setOnSiteManPowerEstimates(estimatesMap));
	} else if (manPowerResults && manPowerResults.length === 0) {
		setOnSiteManPowerEstimatesLocal({});
		dispatch(setOnSiteManPowerEstimates({}));
	}
}, [manPowerResults, shouldLoadFromAPI, dispatch]);
```

**What happens**: 
- Similar to budgets population
- Transforms `manPowerResults` into estimates map
- Updates both local state and Redux

**Why**: 
- Same pattern as budgets for consistency
- Keeps data synchronized

---

### Step 11: Handle User Input Changes

**File**: `src/pages/MonthlyEstimateAdd.tsx`

**Line 184-191**:
```typescript
const handleOnSiteManPowerEstimateChange = (clientId: number, value: string) => {
	const updatedEstimates = {
		...onSiteManPowerEstimates,
		[clientId]: value,
	};
	setOnSiteManPowerEstimatesLocal(updatedEstimates);
	dispatch(setOnSiteManPowerEstimate({ clientId, value }));
};
```

**What happens**: 
- When user changes a value in form:
  - Updates local state immediately (for UI responsiveness)
  - Updates Redux state (for persistence)

**Why**: 
- Local state update = instant UI update
- Redux update = data persists across refreshes
- Both happen on every change

---

### Step 12: Handle Submit

**File**: `src/pages/MonthlyEstimateAdd.tsx`

**Line 210-270**:
```typescript
const handleSubmit = async () => {
	if (!projectedCostingParams || !facilityId) {
		setSnackbar({
			open: true,
			message: 'Please select month, year, and facility before submitting.',
			type: 'error',
		});
		return;
	}

	setIsSubmitting(true);

	try {
		// Transform budgets into projectedValues array
		const projectedValues = costingTypes?.map(costingType => {
			const budgetValue = budgets[costingType.id] || '0';
			return {
				costing_type_id: costingType.id,
				projected_value: parseFloat(budgetValue) || 0,
			};
		});

		// Transform estimates into onSiteManPower_clients array
		const onSiteManPower_clients = onSiteManPowerClients?.map(client => {
			const estimateValue = onSiteManPowerEstimates[client.client_id] || '0';
			return {
				client_id: client.client_id,
				value: parseFloat(estimateValue) || 0,
			};
		});

		const payload: AddProjectedActualCostingRequest = {
			projectedValues: projectedValues || [],
			date_year: projectedCostingParams.date_year,
			facility_id: facilityId,
			onSiteManPower_clients: onSiteManPower_clients || [],
		};

		const response = await ProjectedActualCostingService.addProjectedActualCosting(payload);

		if (response.status_code === 200 || response.status === 'Success') {
			setSnackbar({
				open: true,
				message: 'Revenue data saved successfully!',
				type: 'success',
			});
			// Clear persisted data after successful submission
			dispatch(clearRevenueData());
			// Navigate to listing page after a short delay
			setTimeout(() => {
				navigate('/revenue/monthly-estimate/list');
			}, 1500);
		}
	} catch (error: any) {
		setSnackbar({
			open: true,
			message: error?.message || 'Failed to save revenue data. Please try again.',
			type: 'error',
		});
	} finally {
		setIsSubmitting(false);
	}
};
```

**What happens**: 
1. Validates required fields
2. Transforms local state into API payload format
3. Calls API
4. On success: Shows success message, clears persisted data, navigates to List page
5. On error: Shows error message

**Why**: 
- Validation prevents invalid submissions
- Transformation ensures correct API format
- Clearing persisted data prevents stale data
- Navigation provides user feedback

---

## List Page Flow

### Step 1: User Opens List Page

**File**: `src/pages/MonthlyEstimateList.tsx`

**Line 1-9**: Imports
```typescript
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Table, Snackbar } from '../components/ui';
import { TableColumn } from '../components/ui/DataDisplay';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { RevenueFilters, useRevenueFilters } from '../features/revenue';
import { useRevenueListingData } from '../features/revenue/hooks/useRevenueListingData';
```

**What happens**: Code gets ready to use React, routing, UI components, Redux, filters, and data hook.

---

### Step 2: Component Starts and Gets User Data

**File**: `src/pages/MonthlyEstimateList.tsx`

**Line 52-54**:
```typescript
export const MonthlyEstimateList: React.FC = () => {
	const navigate = useNavigate();
	const { user } = useSelector((state: RootState) => state.auth);
```

**What happens**: 
- Component starts
- Gets `navigate` for routing
- Gets user data (needs `city_id` for API)

---

### Step 3: Call Filters Hook

**File**: `src/pages/MonthlyEstimateList.tsx`

**Line 56-66**:
```typescript
const {
	selectedMonth,
	selectedYear,
	selectedFacility,
	selectedCostCategory,
	monthOptions,
	yearOptions,
	costCategoryOptions,
	setSelectedMonth,
	setSelectedYear,
	setSelectedFacility,
	setSelectedCostCategory,
} = useRevenueFilters();
```

**What happens**: 
- Gets all filter values including Cost Category (unique to List page)

**Why**: 
- List page needs Cost Category filter for filtering revenue records

---

### Step 4: Calculate Should Fetch

**File**: `src/pages/MonthlyEstimateList.tsx`

**Line 68-70**:
```typescript
const shouldFetch = !!(
	selectedFacility &&
	selectedMonth &&
	selectedYear &&
	user?.city_id
);
```

**What happens**: 
- Checks if all required filters are set
- Returns `true` only if all are present

**Why**: 
- Prevents API call with incomplete filters
- Ensures data is valid

---

### Step 5: Fetch Revenue Listing Data

**File**: `src/pages/MonthlyEstimateList.tsx`

**Line 72-78**:
```typescript
const { data, isLoading, error } = useRevenueListingData(
	user?.city_id,
	selectedFacility,
	selectedMonth,
	selectedYear,
	selectedCostCategory || undefined,
	shouldFetch
);
```

**What happens**: 
- Calls React Query hook to fetch revenue listing
- Passes all filter values including optional Cost Category
- Only executes if `shouldFetch` is true

**Why**: 
- React Query handles caching and refetching
- Cost Category is optional (can be empty string for "All")

---

### Step 6: Transform Data for Table

**File**: `src/pages/MonthlyEstimateList.tsx`

**Line 80-150**: `transformDataForTable` function
```typescript
const transformDataForTable = useMemo(() => {
	if (!data?.data || data.data.length === 0) {
		return [];
	}

	const cityData = data.data[0];
	if (!cityData.facilities || cityData.facilities.length === 0) {
		return [];
	}

	const facilityData = cityData.facilities[0];
	if (!facilityData.monthYearData || facilityData.monthYearData.length === 0) {
		return [];
	}

	const monthYearData = facilityData.monthYearData[0];
	const records = monthYearData.records || [];

	// Transform records into table rows
	return records.map(record => ({
		id: record.id,
		costingTypeName: record.costingTypeName,
		projectedValue: record.projected_value,
		week1Actual: record.week1_actual_value,
		week1Delta: record.week1_delta_with_percentage,
		// ... more week columns
		totalActual: record.total_actual_value,
		totalDelta: record.total_delta_with_percentage,
	}));
}, [data]);
```

**What happens**: 
- Extracts nested API response structure
- Transforms records into flat table row format
- Handles empty data gracefully

**Why**: 
- API response is deeply nested
- Table component expects flat row structure
- Memoization prevents unnecessary recalculations

---

### Step 7: Define Table Columns

**File**: `src/pages/MonthlyEstimateList.tsx`

**Line 152-250**: Column definitions
```typescript
const columns: TableColumn<RevenueTableRow>[] = useMemo(
	() => [
		{
			key: 'costingTypeName',
			title: 'Costing Type',
			align: 'left',
			cellClassName: 'text-xs',
		},
		{
			key: 'week1Actual',
			title: 'W1',
			align: 'center',
			headerClassName: getWeekBgColor('w1'),
			// ... render function with colored background
		},
		// ... more columns
	],
	[handleEdit]
);
```

**What happens**: 
- Defines table column structure
- Sets alignment, styling, and render functions
- Includes Edit button column

**Why**: 
- Consistent column definitions
- Custom rendering for colors and formatting
- Edit functionality per row

---

### Step 8: Handle Edit Click

**File**: `src/pages/MonthlyEstimateList.tsx`

**Line 252-280**:
```typescript
const handleEdit = React.useCallback(
	(recordId: number) => {
		if (!selectedFacility || !selectedMonth || !selectedYear) {
			setSnackbar({
				open: true,
				message: 'Please select a facility from the dropdown filter first.',
				type: 'error',
			});
			return;
		}

		navigate(
			`/revenue/monthly-estimate/edit?month=${selectedMonth}&year=${selectedYear}&facility_id=${selectedFacility}`
		);
	},
	[selectedFacility, selectedMonth, selectedYear, navigate, setSnackbar]
);
```

**What happens**: 
- Validates filters are set
- Navigates to Edit page with URL parameters
- Shows error if filters missing

**Why**: 
- Edit page needs filters to fetch data
- URL params are reliable way to pass data
- Validation prevents navigation errors

---

## Edit Page Flow

### Step 1: User Opens Edit Page

**File**: `src/pages/MonthlyEstimateEdit.tsx`

**Line 1-21**: Imports
```typescript
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader, Snackbar, Button } from '../components/ui';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import {
	setEditBudgetWeekValues,
	setEditManPowerWeekValues,
	setEditLastUpdated,
	clearEditRevenueData,
} from '../store/slices/revenueSlice';
```

**What happens**: Code gets ready to use React, routing, Redux, and edit-specific actions.

---

### Step 2: Read URL Parameters

**File**: `src/pages/MonthlyEstimateEdit.tsx`

**Line 48-52**:
```typescript
const month = searchParams.get('month') || '';
const year = searchParams.get('year') || '';
const facilityId = searchParams.get('facility_id') || '';
const cityId = user?.city_id;
```

**What happens**: 
- Reads `month`, `year`, `facility_id` from URL
- Gets `city_id` from user data

**Why**: 
- Edit page is accessed via URL with params
- Need all these values to fetch data

---

### Step 3: Get Persisted Edit Data

**File**: `src/pages/MonthlyEstimateEdit.tsx`

**Line 42-46**:
```typescript
const {
	editBudgetWeekValues: persistedBudgetWeekValues,
	editManPowerWeekValues: persistedManPowerWeekValues,
	editLastUpdated,
} = useSelector((state: RootState) => state.revenue);
```

**What happens**: 
- Reads persisted edit data from Redux
- Gets `editLastUpdated` to check filter match

**Why**: 
- If user refreshed page, restore their edits
- But we always load fresh data from API first

---

### Step 4: Always Load from API

**File**: `src/pages/MonthlyEstimateEdit.tsx`

**Line 81-83**:
```typescript
// Always load from API on edit page - don't use persisted data
// This ensures we always have the latest data from the server
const shouldLoadFromAPI = true;
```

**What happens**: 
- Always set to `true` (unlike Add page)

**Why**: 
- Edit page should always show latest server data
- Persisted data is only for user edits, not initial load

---

### Step 5: Fetch Revenue Data

**File**: `src/pages/MonthlyEstimateEdit.tsx`

**Line 100-107**:
```typescript
const { data, isLoading, error } = useRevenueListingData(
	cityId,
	facilityId,
	month,
	year,
	undefined, // No cost category filter for edit
	shouldFetch
);
```

**What happens**: 
- Fetches revenue listing data
- Uses `allResults: true` to get all records
- No cost category filter

**Why**: 
- Need all records for edit page
- Cost category filter not needed

---

### Step 6: Extract Records and Manpower Details

**File**: `src/pages/MonthlyEstimateEdit.tsx`

**Line 118-139**:
```typescript
const { records, onSiteManPowerDetails } = useMemo(() => {
	if (!data?.data || data.data.length === 0) {
		return { records: [], onSiteManPowerDetails: [] };
	}

	const cityData = data.data[0];
	if (!cityData.facilities || cityData.facilities.length === 0) {
		return { records: [], onSiteManPowerDetails: [] };
	}

	const facilityData = cityData.facilities[0];
	if (!facilityData.monthYearData || facilityData.monthYearData.length === 0) {
		return { records: [], onSiteManPowerDetails: [] };
	}

	const monthYearData = facilityData.monthYearData[0];
	return {
		records: monthYearData.records || [],
		onSiteManPowerDetails: monthYearData.onSiteManPowerDetails || [],
	};
}, [data]);
```

**What happens**: 
- Extracts nested API response
- Gets `records` (budget items) and `onSiteManPowerDetails` (manpower items)
- Handles empty data gracefully

**Why**: 
- API response is deeply nested
- Need flat arrays for table components
- Memoization prevents recalculation

---

### Step 7: Populate Budget Week Values from API

**File**: `src/pages/MonthlyEstimateEdit.tsx`

**Line 150-179**:
```typescript
useEffect(() => {
	if (!shouldLoadFromAPI) return; // Don't overwrite if using persisted data

	if (records.length > 0) {
		const initialBudgetValues: Record<
			number,
			{ week1: string; week2: string; week3: string; week4: string }
		> = {};
		records.forEach(record => {
			initialBudgetValues[record.id] = {
				week1: record.week1_actual_value || '0',
				week2: record.week2_actual_value || '0',
				week3: record.week3_actual_value || '0',
				week4: record.week4_actual_value || '0',
			};
		});
		setBudgetWeekValuesLocal(initialBudgetValues);
		dispatch(setEditBudgetWeekValues(initialBudgetValues));
		if (month && year && facilityId) {
			dispatch(
				setEditLastUpdated({
					month,
					year,
					facility_id: facilityId,
				})
			);
		}
	}
}, [records, shouldLoadFromAPI, dispatch, month, year, facilityId]);
```

**What happens**: 
- When API data arrives:
  - Transforms records into week values map
  - Updates local state and Redux
  - Updates `editLastUpdated` timestamp

**Why**: 
- Only runs when `shouldLoadFromAPI` is true (always true for Edit page)
- Populates form with server data
- Keeps state synchronized

---

### Step 8: Populate Manpower Week Values from API

**File**: `src/pages/MonthlyEstimateEdit.tsx`

**Line 181-215**:
```typescript
useEffect(() => {
	if (!shouldLoadFromAPI) return; // Don't overwrite if using persisted data

	if (onSiteManPowerDetails.length > 0) {
		const initialManPowerValues: Record<
			number,
			{ week1: string; week2: string; week3: string; week4: string }
		> = {};
		onSiteManPowerDetails.forEach((item: ExtendedOnSiteManPowerItem) => {
			// Handle null values properly - convert null to '0', otherwise convert to string
			const formatWeekValue = (value: string | number | null | undefined): string => {
				if (value === null || value === undefined) return '0';
				return String(value);
			};
			initialManPowerValues[item.client_id] = {
				week1: formatWeekValue(item.week1),
				week2: formatWeekValue(item.week2),
				week3: formatWeekValue(item.week3),
				week4: formatWeekValue(item.week4),
			};
		});
		setManPowerWeekValuesLocal(initialManPowerValues);
		dispatch(setEditManPowerWeekValues(initialManPowerValues));
	}
}, [onSiteManPowerDetails, shouldLoadFromAPI, dispatch]);
```

**What happens**: 
- Similar to budget population
- **Important**: Handles `null` values (converts to `'0'`)

**Why**: 
- API returns `null` for empty week values
- Input fields need strings
- `formatWeekValue` ensures consistent conversion

---

### Step 9: Handle User Edits

**File**: `src/pages/MonthlyEstimateEdit.tsx`

**Line 222-237**:
```typescript
const handleBudgetWeekChange = (
	recordId: number,
	week: 'week1' | 'week2' | 'week3' | 'week4',
	value: string
) => {
	const updatedValues = {
		...budgetWeekValues,
		[recordId]: {
			...budgetWeekValues[recordId],
			[week]: value,
		},
	};
	setBudgetWeekValuesLocal(updatedValues);
	dispatch(setEditBudgetWeekValues(updatedValues));
};
```

**What happens**: 
- When user edits a value:
  - Updates local state immediately
  - Updates Redux state for persistence

**Why**: 
- Instant UI feedback
- Data persists across refreshes

---

### Step 10: Handle Submit

**File**: `src/pages/MonthlyEstimateEdit.tsx`

**Line 284-370**:
```typescript
const handleSubmit = async () => {
	// ... validation ...

	try {
		// Transform budgetWeekValues into weeklyValue array
		const weeklyValue = records.map(record => {
			const weekValues = budgetWeekValues[record.id] || { /* defaults */ };
			return {
				id: record.id,
				week1_actual_value: parseFloat(weekValues.week1) || 0,
				week2_actual_value: parseFloat(weekValues.week2) || 0,
				week3_actual_value: parseFloat(weekValues.week3) || 0,
				week4_actual_value: parseFloat(weekValues.week4) || 0,
			};
		});

		// Transform manPowerWeekValues into onSiteManPowerDetails array
		const onSiteManPowerDetailsPayload = onSiteManPowerDetails.map((item) => {
			const weekValues = manPowerWeekValues[item.client_id] || { /* defaults */ };
			const parseWeekValue = (value: string): number | null => {
				if (!value || value.trim() === '' || value === '0') {
					return null;
				}
				const num = parseFloat(value);
				return isNaN(num) ? null : num;
			};
			return {
				id: item.id,
				client_id: item.client_id,
				costing_type_id: item.costing_type_id,
				est: item.est || '0.00',
				week1: parseWeekValue(weekValues.week1),
				week2: parseWeekValue(weekValues.week2),
				week3: parseWeekValue(weekValues.week3),
				week4: parseWeekValue(weekValues.week4),
				date_year: date_year,
				client_name: item.client_name,
			};
		});

		const payload: UpdateRevenueRequest = {
			weeklyValue,
			onSiteManPowerDetails: onSiteManPowerDetailsPayload,
		};

		const response = await PAndLApiService.updateRevenue(payload);

		if (response.status_code === 200 || response.status === 'Success') {
			setSnackbar({
				open: true,
				message: 'Revenue data updated successfully!',
				type: 'success',
			});
			// Clear persisted edit data after successful submission
			dispatch(clearEditRevenueData());
			setTimeout(() => {
				navigate('/revenue/monthly-estimate/list');
			}, 1500);
		}
	} catch (error: any) {
		// ... error handling ...
	}
};
```

**What happens**: 
1. Validates required fields
2. Transforms state into API payload:
   - Budget: Converts strings to numbers
   - Manpower: Converts empty/zero strings to `null`, others to numbers
3. Calls `PUT /api/review/updateRevenue`
4. On success: Clears persisted data, navigates to List page

**Why**: 
- API expects `number | null` for manpower week values
- Empty/zero values should be `null`, not `0`
- Clearing persisted data prevents stale data

---

## Redux Persistence Flow

### Add Page Persistence

1. **User enters data** → Saved to local state → Saved to Redux → Persisted to localStorage
2. **User refreshes page** → Redux rehydrates from localStorage → Local state initialized from Redux
3. **Filters match persisted data** → Use persisted data (no API call)
4. **Filters changed** → Fetch fresh data from API → Overwrite persisted data
5. **User submits** → Clear persisted data → Navigate to List page

### Edit Page Persistence

1. **Page loads** → Always fetch fresh data from API → Populate form
2. **User edits** → Saved to local state → Saved to Redux → Persisted to localStorage
3. **User refreshes page** → Redux rehydrates → But still fetch fresh API data first → Merge persisted edits if filters match
4. **User submits** → Clear persisted data → Navigate to List page

### Key Difference

- **Add Page**: Uses persisted data if filters match (avoids API call)
- **Edit Page**: Always fetches fresh API data first, then applies persisted edits

---

## Common Mistakes and Debugging

### 1. Multiple API Calls

**Problem**: API is called multiple times on page load

**Solution**: 
- Remove manual `refetch()` calls
- Use `refetchOnMount: true` instead of `'always'`
- Check React Query `queryKey` for uniqueness
- Check `useEffect` dependencies

**Where to look**:
- `src/pages/MonthlyEstimateEdit.tsx` - Check for manual refetch calls
- `src/features/revenue/hooks/useRevenueListingData.ts` - Check query config

### 2. Values Not Auto-Populating

**Problem**: Form fields don't populate with API data

**Solution**:
- Check `shouldLoadFromAPI` is `true` (Edit page) or correct logic (Add page)
- Check API response structure matches interface
- Check null value handling (`null` → `'0'` conversion)
- Check `useEffect` dependencies include data

**Where to look**:
- `src/pages/MonthlyEstimateEdit.tsx` - Check `useEffect` for data population
- `src/pages/MonthlyEstimateAdd.tsx` - Check `shouldLoadFromAPI` logic
- `src/services/pAndLApi.ts` - Check interface matches API response

### 3. Redux Persistence Not Working

**Problem**: Data lost on page refresh

**Solution**:
- Check `revenueSlice` is added to Redux store
- Check `revenuePersistConfig` whitelist includes correct fields
- Check browser localStorage for persisted data
- Check `clearRevenueData` / `clearEditRevenueData` not called prematurely

**Where to look**:
- `src/store/slices/revenueSlice.ts` - Check state structure
- `src/store/index.ts` - Check persist config whitelist
- Browser DevTools → Application → Local Storage → `persist:revenue`

### 4. Edit Page Not Loading

**Problem**: Edit page shows "Missing required parameters"

**Solution**:
- Check URL has `month`, `year`, `facility_id` params
- Check `handleEdit` in List page passes correct params
- Check `useSearchParams` is reading params correctly
- Check `user.city_id` is available

**Where to look**:
- `src/pages/MonthlyEstimateList.tsx` - Check `handleEdit` function
- `src/pages/MonthlyEstimateEdit.tsx` - Check URL param reading
- Browser URL bar - Check params are present

### 5. Date Format Issues

**Problem**: Wrong dates sent to API (timezone shifts)

**Solution**:
- Use `Date.UTC()` for date creation
- Use UTC-specific methods (`getUTCFullYear`, `getUTCMonth`, `getUTCDate`)
- Format dates as `YYYY-MM-DD` strings

**Where to look**:
- `src/features/revenue/hooks/useRevenueListingData.ts` - Check `getDateRangeFromMonthYear`
- `src/pages/MonthlyEstimateAdd.tsx` - Check `getDateYearFromMonthYear`

### 6. Null Value Handling Issues

**Problem**: Week values showing as "null" or not submitting correctly

**Solution**:
- Check `formatWeekValue` function converts `null` to `'0'` for display
- Check `parseWeekValue` function converts empty/zero strings to `null` for API
- Check interface allows `string | number | null`

**Where to look**:
- `src/pages/MonthlyEstimateEdit.tsx` - Check `formatWeekValue` and `parseWeekValue`
- `src/services/pAndLApi.ts` - Check `OnSiteManPowerItem` interface

### 7. Edit Page Always Refreshing

**Problem**: Edit page refetches data on every render

**Solution**:
- Check `shouldLoadFromAPI` is not recalculating unnecessarily
- Check React Query `queryKey` is stable
- Check `useEffect` dependencies

**Where to look**:
- `src/pages/MonthlyEstimateEdit.tsx` - Check `shouldLoadFromAPI` logic
- `src/features/revenue/hooks/useRevenueListingData.ts` - Check query config

---

## Navigation Guide for Developers

### When you need to:

**Add new filter**:
1. Modify `useRevenueFilters.ts` to add state
2. Modify filter component to add UI
3. Pass filter value to API hooks

**Add new API**:
1. Add method in `src/services/pAndLApi.ts`
2. Add interfaces for request/response
3. Add React Query hook
4. Use hook in page component

**Change table columns**:
1. Update column definitions in table component
2. Update data transformation logic
3. Ensure column titles are shortened

**Debug API issues**:
1. Check Network tab for API calls
2. Check `src/services/pAndLApi.ts` for method
3. Check React Query hook config
4. Check response structure matches interface

**Debug persistence issues**:
1. Check Redux DevTools for state
2. Check localStorage for persisted data
3. Check `revenueSlice` actions
4. Check `revenuePersistConfig` whitelist

**Debug edit page issues**:
1. Check URL parameters
2. Check `shouldLoadFromAPI` logic
3. Check API response structure
4. Check null value handling

---

*This documentation covers the complete Revenue feature flow. For specific implementation details, refer to the source code files listed in the [README](./README.md).*

