# Ops Dashboard: How It Works Step by Step

This document explains exactly what happens when the Ops Dashboard page loads and how each piece works.

## When Page Loads - Execution Flow

### Step 1: User Opens Ops Dashboard Page

**File**: `src/pages/OpsDashboard.tsx`

**Line 1-12**: Imports
```typescript
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { PageHeader } from '../components/ui';
import { ErrorBoundary } from '../components/ErrorBoundary';
import {
	OpsDashboardFilters,
	OpsDashboardContent,
	useOpsDashboardFilters,
	useOpsDashboardData,
} from '../features/ops-dashboard';
```
**What happens**: Code gets ready to use React, Redux, UI components, and ops dashboard hooks.

**Why**: We need React to show UI, Redux to get user information, ErrorBoundary to catch errors, and hooks to manage filters and data.

---

### Step 2: Ops Dashboard Component Starts

**File**: `src/pages/OpsDashboard.tsx`

**Line 13**: Component function starts
```typescript
export const OpsDashboard: React.FC = () => {
```

**What happens**: The Ops Dashboard component begins to run.

---

### Step 3: Get User Information from Redux

**File**: `src/pages/OpsDashboard.tsx`

**Line 14**:
```typescript
const { user } = useSelector((state: RootState) => state.auth);
```

**What happens**: 
- Reads user data from Redux store
- Gets user's `city_id` (which city they belong to)
- Gets user's `city_name` (name of the city)
- Gets user's `userTypeId` (determines if city filter should be shown)

**Why we do this**: 
- We need to know which city the user is in
- This filters which clients they can see
- User type determines if they can see city filter (types 1, 2, 3, 4 can see it)

**What we get**:
- `user.city_id` - A number like 3 (for Mumbai)
- `user.city_name` - A string like "Mumbai"
- `user.userTypeId` - A number like 1, 2, 3, 4, or 5

---

### Step 4: Call Custom Hook to Get Filters

**File**: `src/pages/OpsDashboard.tsx`

**Line 15-29**:
```typescript
const {
	startDate,
	endDate,
	selectedClient,
	selectedCity,
	clientOptions,
	cityOptions,
	loadingClients,
	loadingCities,
	showCityFilter,
	onStartDateChange,
	onEndDateChange,
	onClientChange,
	onCityChange,
} = useOpsDashboardFilters();
```

**What happens**: 
- Calls the `useOpsDashboardFilters` hook
- This hook does ALL the filter work (we explain this below)
- Gets back filter values and functions to change them

**Why we use a hook**:
- Keeps OpsDashboard.tsx simple (only 99 lines)
- All filter logic is in one place (the hook)
- Easy to test and reuse

---

### Step 5: Custom Hook Starts Working - Filters Hook

**File**: `src/features/ops-dashboard/hooks/useOpsDashboardFilters.ts`

#### Step 5a: Hook Function Starts

**Line 71**:
```typescript
export const useOpsDashboardFilters = (): UseOpsDashboardFiltersReturn => {
```

**What happens**: The hook function starts running.

---

#### Step 5b: Get User from Redux

**Line 72**:
```typescript
const { user } = useSelector((state: RootState) => state.auth);
```

**What happens**: Gets user information from Redux store.

**Why**: We need user's `userTypeId` and `city_id` to determine filter visibility and default values.

---

#### Step 5c: Determine if City Filter Should Show

**Line 75**:
```typescript
const showCityFilter = user?.userTypeId !== undefined && [1, 2, 3, 4].includes(user.userTypeId);
```

**What happens**: 
- Checks if user's `userTypeId` is 1, 2, 3, or 4
- If yes, `showCityFilter` is `true`
- If no, `showCityFilter` is `false`

**Why**: Only certain user types can see the city filter. Other users see only their city's data.

**What we get**:
- `showCityFilter` - `true` or `false`

---

#### Step 5d: Load Initial Dates from localStorage

**Line 78-80**:
```typescript
const storedFilters = loadFiltersFromStorage();
const [startDate, setStartDate] = useState<string>(storedFilters.startDate);
const [endDate, setEndDate] = useState<string>(storedFilters.endDate);
```

**What happens**:
- Calls `loadFiltersFromStorage()` which reads from localStorage key `'ops-dashboard-filters'`
- If found, uses stored dates
- If not found, uses current date (from `getCurrentDate()`)
- Creates state variables for `startDate` and `endDate`

**Why**: We want dates to persist across page refreshes so users don't have to re-enter them.

**What we get**:
- `startDate` - String like "2025-09-01"
- `endDate` - String like "2025-09-05"

---

#### Step 5e: Initialize Other Filter States

**Line 81-88**:
```typescript
const [selectedClient, setSelectedClient] = useState<string>('all');
const [selectedCity, setSelectedCity] = useState<string>('all');
const [clientOptions, setClientOptions] = useState<DropdownOption[]>([
	{ value: 'all', label: 'All' },
]);
const [cityOptions, setCityOptions] = useState<DropdownOption[]>([
	{ value: 'all', label: 'All' },
]);
const [loadingClients, setLoadingClients] = useState(false);
const [loadingCities, setLoadingCities] = useState(false);
```

**What happens**: 
- Creates state for selected client and city (both default to "all")
- Creates state for dropdown options (both start with "All" option)
- Creates loading states (both start as `false`)

**Why**: We need state to track what user selected and what options are available.

---

#### Step 5f: Save Dates to localStorage When They Change

**Line 93-97**:
```typescript
useEffect(() => {
	if (startDate && endDate) {
		saveFiltersToStorage(startDate, endDate);
	}
}, [startDate, endDate]);
```

**What happens**: 
- Watches `startDate` and `endDate` for changes
- When either changes, saves both to localStorage

**Why**: We want dates to persist so users don't lose them on refresh.

**When this runs**: Every time `startDate` or `endDate` changes.

---

#### Step 5g: Load Cities from API (If User Type Allows)

**Line 100-124**:
```typescript
useEffect(() => {
	const loadCities = async () => {
		if (!showCityFilter) return;

		setLoadingCities(true);
		try {
			const response = await LocationApiService.getCities();
			if (response.status_code === 200 && response.data) {
				const cityList: DropdownOption[] = response.data.map(
					(city: { id: number; name: string }) => ({
						value: city.id.toString(),
						label: city.name,
					})
				);
				setCityOptions([{ value: 'all', label: 'All' }, ...cityList]);
			}
		} catch (error) {
			console.error('Failed to load cities:', error);
		} finally {
			setLoadingCities(false);
		}
	};

	loadCities();
}, [showCityFilter]);
```

**What happens**:
1. Checks if `showCityFilter` is `true`
2. If yes, sets `loadingCities` to `true`
3. Calls `LocationApiService.getCities()` API
4. Maps response to dropdown options format
5. Adds "All" option at the beginning
6. Sets `cityOptions` state
7. Sets `loadingCities` to `false`

**Why**: Only users with types 1, 2, 3, or 4 can see city filter, so we only load cities for them.

**When this runs**: When component mounts AND when `showCityFilter` changes.

**API Called**: `GET /api/locations/getCities`

---

#### Step 5h: Load Clients from API

**Line 127-154**:
```typescript
useEffect(() => {
	const loadClients = async () => {
		const cityId =
			showCityFilter && selectedCity !== 'all' ? parseInt(selectedCity, 10) : user?.city_id;

		if (!cityId) return;

		setLoadingClients(true);
		try {
			const response = await InventoryApiService.getClientByCity(cityId);
			if (response.status_code === 200 && response.result) {
				const clientList: DropdownOption[] = response.result.map(client => ({
					value: client.clientId.toString(),
					label: client.clientName,
				}));
				setClientOptions([{ value: 'all', label: 'All' }, ...clientList]);
			}
		} catch (error) {
			console.error('Failed to load clients:', error);
		} finally {
			setLoadingClients(false);
		}
	};

	loadClients();
}, [user?.city_id, selectedCity, showCityFilter]);
```

**What happens**:
1. Determines which `cityId` to use:
   - If city filter is shown AND a city is selected, use that city
   - Otherwise, use user's `city_id`
2. If no `cityId`, returns early
3. Sets `loadingClients` to `true`
4. Calls `InventoryApiService.getClientByCity(cityId)` API
5. Maps response to dropdown options format
6. Adds "All" option at the beginning
7. Sets `clientOptions` state
8. Sets `loadingClients` to `false`

**Why**: Clients are city-specific, so we need to load clients based on selected city (or user's city).

**When this runs**: When component mounts AND when `user?.city_id`, `selectedCity`, or `showCityFilter` changes.

**API Called**: `GET /api/inventory/getClientByCity?location_id={cityId}`

---

#### Step 5i: Return Filter Values and Functions

**Line 156-170**:
```typescript
return {
	startDate,
	endDate,
	selectedClient,
	selectedCity,
	clientOptions,
	cityOptions,
	loadingClients,
	loadingCities,
	showCityFilter,
	onStartDateChange: setStartDate,
	onEndDateChange: setEndDate,
	onClientChange: setSelectedClient,
	onCityChange: setSelectedCity,
};
```

**What happens**: Returns all filter values and setter functions.

**Why**: The page component needs these to display filters and handle user interactions.

---

### Step 6: Call Custom Hook to Get Data

**File**: `src/pages/OpsDashboard.tsx`

**Line 31-47**:
```typescript
const {
	kamEodData,
	transitPlanData,
	qcEodData,
	dispatchDelayData,
	shiftStatusData,
	loading,
	error,
	refetch,
} = useOpsDashboardData({
	cityId: user?.city_id,
	selectedCityId: showCityFilter ? selectedCity : undefined,
	clientId: selectedClient,
	startDate,
	endDate,
	enabled: !!startDate && !!endDate,
});
```

**What happens**: 
- Calls the `useOpsDashboardData` hook
- Passes filter values as parameters
- This hook fetches all 5 APIs (we explain this below)
- Gets back data, loading state, error state, and refetch function

**Why we use a hook**:
- Keeps OpsDashboard.tsx simple
- All data fetching logic is in one place
- Uses React Query for caching and error handling

---

### Step 7: Custom Hook Starts Working - Data Hook

**File**: `src/features/ops-dashboard/hooks/useOpsDashboardData.ts`

#### Step 7a: Hook Function Starts

**Line 41-48**:
```typescript
export const useOpsDashboardData = ({
	cityId,
	selectedCityId,
	clientId: _clientId,
	startDate,
	endDate,
	enabled = true,
}: UseOpsDashboardDataParams): UseOpsDashboardDataReturn => {
```

**What happens**: The hook function starts running with parameters from the page.

**Note**: `clientId` is renamed to `_clientId` because it's not used yet (prefixed with `_` to suppress linter warning).

---

#### Step 7b: Determine Which City ID to Use in API Calls

**Line 49-58**:
```typescript
const apiCityId: number | undefined =
	selectedCityId && selectedCityId !== 'all'
		? parseInt(selectedCityId, 10)
		: selectedCityId === 'all'
			? undefined
			: cityId;
```

**What happens**: 
- If `selectedCityId` is a number (not "all"), use that
- If `selectedCityId` is "all", use `undefined` (don't pass `city_ids` to API)
- Otherwise, fallback to user's `cityId`

**Why**: When "All" is selected, we don't want to pass `city_ids` to the API. The API then returns data for all cities.

**What we get**:
- `apiCityId` - A number like `3` or `undefined`

---

#### Step 7c: Determine if We Should Fetch Data

**Line 61**:
```typescript
const shouldFetch = enabled && !!startDate && !!endDate;
```

**What happens**: 
- Checks if `enabled` is `true` AND both dates are set
- Only fetch if both conditions are true

**Why**: We don't want to fetch data if dates aren't set yet.

**What we get**:
- `shouldFetch` - `true` or `false`

---

#### Step 7d: Setup React Query for KAM EOD Report

**Line 64-85**:
```typescript
const kamEodQuery: UseQueryResult<KAMEodReportResponse, Error> = useQuery({
	queryKey: ['ops-dashboard', 'kam-eod', apiCityId, startDate, endDate],
	queryFn: async (): Promise<KAMEodReportResponse> => {
		if (!startDate || !endDate) {
			throw new Error('Missing required parameters');
		}
		if (apiCityId !== undefined) {
			return await OpsDashboardApiService.getKAMEodReport(apiCityId, startDate, endDate);
		}
		const searchParams = new URLSearchParams();
		searchParams.set('start_date', startDate);
		searchParams.set('end_date', endDate);
		return apiService.get(
			`/inventory/getKAMEodReport?${searchParams.toString()}`
		) as unknown as Promise<KAMEodReportResponse>;
	},
	enabled: shouldFetch,
	staleTime: 5 * 60 * 1000,
	gcTime: 10 * 60 * 1000,
});
```

**What happens**:
1. Creates a React Query query with:
   - `queryKey`: Unique key for caching (includes `apiCityId`, `startDate`, `endDate`)
   - `queryFn`: Function that makes the API call
     - If `apiCityId` is defined, calls `getKAMEodReport` with city ID
     - If `apiCityId` is undefined (All selected), calls API directly without `city_ids`
   - `enabled`: Only fetch if `shouldFetch` is `true`
   - `staleTime`: Data is fresh for 5 minutes
   - `gcTime`: Cache data for 10 minutes

**Why**: React Query handles caching, refetching, and error states automatically.

**API Called**: `GET /api/inventory/getKAMEodReport?city_ids={apiCityId}&start_date={startDate}&end_date={endDate}`

**When this runs**: When `shouldFetch` becomes `true` AND when `queryKey` values change.

---

#### Step 7e: Setup React Query for Transit Plan Summary

**Line 88-112**:
```typescript
const transitPlanQuery: UseQueryResult<TransitPlanDispatchPickupSummaryResponse, Error> =
	useQuery({
		queryKey: ['ops-dashboard', 'transit-plan', apiCityId, startDate, endDate],
		queryFn: async (): Promise<TransitPlanDispatchPickupSummaryResponse> => {
			if (!startDate || !endDate) {
				throw new Error('Missing required parameters');
			}
			if (apiCityId !== undefined) {
				return await OpsDashboardApiService.getTransitPlanDispatchPickupSummary(
					apiCityId,
					startDate,
					endDate
				);
			}
			const searchParams = new URLSearchParams();
			searchParams.set('start_date', startDate);
			searchParams.set('end_date', endDate);
			return apiService.get(
				`/transit-plan/getTransitPlanDispatchPickupSummary?${searchParams.toString()}`
			) as unknown as Promise<TransitPlanDispatchPickupSummaryResponse>;
		},
		enabled: shouldFetch,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
```

**What happens**: Same pattern as KAM EOD query, but for Transit Plan data.

**API Called**: `GET /api/transit-plan/getTransitPlanDispatchPickupSummary?city_ids={apiCityId}&start_date={startDate}&end_date={endDate}`

---

#### Step 7f: Setup React Query for QC EOD Report

**Line 115-134**:
```typescript
const qcEodQuery: UseQueryResult<QCEodReportResponse, Error> = useQuery({
	queryKey: ['ops-dashboard', 'qc-eod', apiCityId, startDate, endDate],
	queryFn: async (): Promise<QCEodReportResponse> => {
		if (!startDate || !endDate) {
			throw new Error('Missing required parameters');
		}
		if (apiCityId !== undefined) {
			return await OpsDashboardApiService.getQCEodReport(apiCityId, startDate, endDate);
		}
		const searchParams = new URLSearchParams();
		searchParams.set('start_date', startDate);
		searchParams.set('end_date', endDate);
		return apiService.get(
			`/inventory/getQCEodReport?${searchParams.toString()}`
		) as unknown as Promise<QCEodReportResponse>;
	},
	enabled: shouldFetch,
	staleTime: 5 * 60 * 1000,
	gcTime: 10 * 60 * 1000,
});
```

**What happens**: Same pattern as KAM EOD query, but for QC EOD data.

**API Called**: `GET /api/inventory/getQCEodReport?city_ids={apiCityId}&start_date={startDate}&end_date={endDate}`

---

#### Step 7g: Setup React Query for Dispatch Delay Report

**Line 137-156**:
```typescript
const dispatchDelayQuery: UseQueryResult<DispatchDelayReportResponse, Error> = useQuery({
	queryKey: ['ops-dashboard', 'dispatch-delay', apiCityId, startDate, endDate],
	queryFn: async (): Promise<DispatchDelayReportResponse> => {
		if (!startDate || !endDate) {
			throw new Error('Missing required parameters');
		}
		if (apiCityId !== undefined) {
			return await OpsDashboardApiService.getDispatchDelayReport(apiCityId, startDate, endDate);
		}
		const searchParams = new URLSearchParams();
		searchParams.set('start_date', startDate);
		searchParams.set('end_date', endDate);
		return apiService.get(
			`/inventory/getDispatchDelayReport?${searchParams.toString()}`
		) as unknown as Promise<DispatchDelayReportResponse>;
	},
	enabled: shouldFetch,
	staleTime: 5 * 60 * 1000,
	gcTime: 10 * 60 * 1000,
});
```

**What happens**: Same pattern as KAM EOD query, but for Dispatch Delay data.

**API Called**: `GET /api/inventory/getDispatchDelayReport?city_ids={apiCityId}&start_date={startDate}&end_date={endDate}`

---

#### Step 7h: Setup React Query for Shift Status Report

**Line 159-170**:
```typescript
const shiftStatusQuery: UseQueryResult<ShiftStatusReportResponse, Error> = useQuery({
	queryKey: ['ops-dashboard', 'shift-status', startDate, endDate],
	queryFn: async (): Promise<ShiftStatusReportResponse> => {
		if (!startDate || !endDate) {
			throw new Error('Missing required parameters');
		}
		return await OpsDashboardApiService.getShiftStatusReport(startDate, endDate);
	},
	enabled: enabled && !!startDate && !!endDate,
	staleTime: 5 * 60 * 1000,
	gcTime: 10 * 60 * 1000,
});
```

**What happens**: Same pattern, but this API doesn't need `city_ids` parameter.

**API Called**: `GET /api/shift/getShiftStatusReport?start_date={startDate}&end_date={endDate}`

**Note**: This query doesn't include `apiCityId` in `queryKey` because it doesn't use city filtering.

---

#### Step 7i: Aggregate Loading and Error States

**Line 173-191**:
```typescript
const loading =
	kamEodQuery.isLoading ||
	transitPlanQuery.isLoading ||
	qcEodQuery.isLoading ||
	dispatchDelayQuery.isLoading ||
	shiftStatusQuery.isLoading ||
	kamEodQuery.isFetching ||
	transitPlanQuery.isFetching ||
	qcEodQuery.isFetching ||
	dispatchDelayQuery.isFetching ||
	shiftStatusQuery.isFetching;

const error =
	kamEodQuery.error?.message ||
	transitPlanQuery.error?.message ||
	qcEodQuery.error?.message ||
	dispatchDelayQuery.error?.message ||
	shiftStatusQuery.error?.message ||
	null;
```

**What happens**: 
- Checks if ANY query is loading or fetching
- Checks if ANY query has an error
- Returns combined loading and error states

**Why**: The page needs to know if data is loading or if there's an error.

**What we get**:
- `loading` - `true` if ANY query is loading/fetching
- `error` - Error message if ANY query failed, or `null`

---

#### Step 7j: Create Refetch Function

**Line 193-199**:
```typescript
const refetch = () => {
	kamEodQuery.refetch();
	transitPlanQuery.refetch();
	qcEodQuery.refetch();
	dispatchDelayQuery.refetch();
	shiftStatusQuery.refetch();
};
```

**What happens**: Creates a function that refetches all 5 queries when called.

**Why**: The Search button calls this to manually refresh data.

**When this runs**: When user clicks the Search button.

---

#### Step 7k: Return Data and States

**Line 201-210**:
```typescript
return {
	kamEodData: kamEodQuery.data ?? null,
	transitPlanData: transitPlanQuery.data ?? null,
	qcEodData: qcEodQuery.data ?? null,
	dispatchDelayData: dispatchDelayQuery.data ?? null,
	shiftStatusData: shiftStatusQuery.data ?? null,
	loading,
	error,
	refetch,
};
```

**What happens**: Returns all API data (or `null` if not loaded yet), loading state, error state, and refetch function.

**Why**: The page component needs these to display content.

---

### Step 8: Create Search Handler

**File**: `src/pages/OpsDashboard.tsx`

**Line 49-53**:
```typescript
const handleSearch = () => {
	if (startDate && endDate) {
		refetch();
	}
};
```

**What happens**: 
- When user clicks Search button, checks if dates are set
- If yes, calls `refetch()` to reload all data

**Why**: User might want to manually refresh data after changing filters.

---

### Step 9: Render Page Header

**File**: `src/pages/OpsDashboard.tsx`

**Line 58-64**:
```typescript
<PageHeader
	title='Ops Dashboard'
	locationName={user?.city_name || 'City'}
	totalItems={0}
	itemType='dashboard'
	icon='📊'
/>
```

**What happens**: Displays page header with title, city name, and icon.

**Why**: Consistent page header across all pages.

---

### Step 10: Render Filters Component

**File**: `src/pages/OpsDashboard.tsx`

**Line 66-81**:
```typescript
<OpsDashboardFilters
	startDate={startDate}
	endDate={endDate}
	selectedClient={selectedClient}
	selectedCity={selectedCity}
	clientOptions={clientOptions}
	cityOptions={cityOptions}
	loadingClients={loadingClients}
	loadingCities={loadingCities}
	showCityFilter={showCityFilter}
	onStartDateChange={onStartDateChange}
	onEndDateChange={onEndDateChange}
	onClientChange={onClientChange}
	onCityChange={onCityChange}
	onSearch={handleSearch}
/>
```

**What happens**: 
- Renders the filters component
- Passes all filter values and handlers as props

**Why**: Separates filter UI from page logic.

---

### Step 11: Render Content Component

**File**: `src/pages/OpsDashboard.tsx`

**Line 84-94**:
```typescript
<OpsDashboardContent
	kamEodData={kamEodData}
	transitPlanData={transitPlanData}
	qcEodData={qcEodData}
	dispatchDelayData={dispatchDelayData}
	shiftStatusData={shiftStatusData}
	loading={loading}
	error={error}
	selectedCity={selectedCity}
	showCityFilter={showCityFilter}
/>
```

**What happens**: 
- Renders the content component
- Passes all API data, loading state, error state, and city filter info

**Why**: Separates content UI from page logic.

---

## What Happens in Content Component

**File**: `src/features/ops-dashboard/components/OpsDashboardContent.tsx`

### Step 12a: Transform API Data to Table Format

**Line 43-53**:
```typescript
const tableRows = useMemo(
	() =>
		transformToTableData(
			kamEodData,
			transitPlanData,
			qcEodData,
			dispatchDelayData,
			shiftStatusData
		),
	[kamEodData, transitPlanData, qcEodData, dispatchDelayData, shiftStatusData]
);
```

**What happens**: 
- Calls `transformToTableData` function
- Converts all 5 API responses into a single table row format
- Uses `useMemo` to only recalculate when data changes

**Why**: Table needs a specific format, so we transform API data to match it.

**File**: `src/features/ops-dashboard/utils/tableDataTransformers.ts`

**What it does**:
1. Collects all unique cities from all APIs
2. For each city, extracts:
   - Facility Report (from Shift Status API)
   - QC Rejection (shows "--")
   - Transit Delay (from Shift Status API)
   - Washing Efficiency (from Transit Plan API - sent only)
   - Transit Plan Filled (from Dispatch Delay API - avgDelay)
   - Driver Checkin (shows "--")
   - KAM EOD Report (from KAM EOD API)

---

### Step 12b: Handle Error State

**Line 55-61**:
```typescript
if (error) {
	return (
		<div className='bg-red-50 border border-red-200 rounded-lg p-4' role='alert'>
			<p className='text-red-800'>{error}</p>
		</div>
	);
}
```

**What happens**: If there's an error, shows error message and stops rendering.

**Why**: User needs to know if data failed to load.

---

### Step 12c: Handle Loading State

**Line 63-69**:
```typescript
if (loading) {
	return (
		<div className='text-center py-8'>
			<p className='text-gray-600'>Loading dashboard data...</p>
		</div>
	);
}
```

**What happens**: If data is loading, shows loading message and stops rendering.

**Why**: User needs to know data is loading.

---

### Step 12d: Render Table and Metrics Sections

**Line 72-96**:
```typescript
return (
	<div className='space-y-6' role='region' aria-label='Ops Dashboard Content'>
		{/* Table Section - Always at top */}
		<OpsDashboardTable rows={tableRows} />

		{/* KAM Metrics Section */}
		<KAMMetrics
			kamData={kamEodData}
			selectedCity={selectedCity}
			showCityFilter={showCityFilter}
		/>

		{/* Sent Transit Metrics Section */}
		<SentTransitMetrics
			transitPlanData={transitPlanData}
			selectedCity={selectedCity}
			showCityFilter={showCityFilter}
		/>

		{/* Transit Delay Metrics Section */}
		<TransitDelayMetrics
			dispatchDelayData={dispatchDelayData}
			selectedCity={selectedCity}
			showCityFilter={showCityFilter}
		/>
	</div>
);
```

**What happens**: 
- Renders table first (always at top)
- Then renders KAM metrics section
- Then renders Sent Transit metrics section
- Then renders Transit Delay metrics section

**Why**: Table shows overview, then detailed metrics sections below.

---

## What Happens in Metrics Components

Each metrics component (KAMMetrics, SentTransitMetrics, TransitDelayMetrics) follows the same pattern:

### Step 13: Determine UI Mode

**File**: `src/features/ops-dashboard/components/metrics/KAMMetrics.tsx`

**Logic**:
- If `showCityFilter` is `false`: Show individual city view (circular progress + daily bar chart)
- If `showCityFilter` is `true` AND `selectedCity === 'all'`: Show stacked bar chart view
- If `showCityFilter` is `true` AND `selectedCity !== 'all'`: Show individual city view

**Why**: Different visualizations for single city vs. all cities.

---

### Step 14: Render Circular Progress Indicators

**For single city**: Shows one circular progress indicator
**For all cities**: Shows multiple circular progress indicators in a row

**Component**: `src/components/charts/CircularProgress.tsx`

**Props**:
- `label`: City name
- `percentage`: Percentage value (0-100)
- `color`: Color for the progress arc (from `cityColorUtils`)
- `displayValue`: Value to show in center (e.g., "97.4%" or "1.91 hrs")
- `displayUnit`: Unit to show (e.g., "%" or "hrs")
- `daysEntered`: Days entered count
- `totalDays`: Total days count

---

### Step 15: Render Charts

**For single city**: Shows daily bar chart
**For all cities**: Shows stacked bar chart (100% stacked)

**Components**:
- Daily Bar Chart: `src/components/charts/DailyBarChart.tsx` (uses Recharts)
- Stacked Bar Chart: `src/components/charts/StackedBarChart.tsx` (uses ApexCharts)

**Feature-Specific Wrappers**:
- `KAMDailyBarChart.tsx` - Transforms KAM data for DailyBarChart
- `KAMStackedBarChart.tsx` - Transforms KAM data for StackedBarChart
- `SentTransitDailyBarChart.tsx` - Transforms Sent Transit data for DailyBarChart
- `SentTransitStackedBarChart.tsx` - Transforms Sent Transit data for StackedBarChart
- `TransitDelayDailyBarChart.tsx` - Transforms Transit Delay data for DailyBarChart
- `TransitDelayStackedBarChart.tsx` - Transforms Transit Delay data for StackedBarChart

**Why wrappers**: Generic components need specific data formats, so wrappers transform API data.

---

## Industry Standard: Chart Component Separation Pattern

### Why Charts Are Separated

**Industry Best Practice**: Separate generic, reusable components from feature-specific logic.

**Pattern Used**:
1. **Generic Components** (`src/components/charts/`): Handle rendering only, no business logic
2. **Feature-Specific Wrappers** (`src/features/ops-dashboard/components/charts/`): Transform API data → generic format

### Generic vs Feature-Specific Pattern

#### Generic Components (`src/components/charts/`)

**Purpose**: Reusable, framework-agnostic chart components

**Characteristics**:
- ✅ Accept standardized data formats (interfaces)
- ✅ No API knowledge
- ✅ No business logic
- ✅ Can be used by ANY feature
- ✅ Easy to test (just pass data)

**Example**: `CircularProgress.tsx`
```typescript
interface CircularProgressProps {
  label: string;
  percentage: number;
  color?: string;
  displayValue?: string;
  displayUnit?: string;
  // ... other generic props
}
```

**Why**: This component can be used for KAM metrics, Sent Transit metrics, Transit Delay metrics, or ANY future feature that needs circular progress.

#### Feature-Specific Wrappers (`src/features/ops-dashboard/components/charts/`)

**Purpose**: Transform feature-specific API data into generic format

**Characteristics**:
- ✅ Know about API response structure
- ✅ Transform API data → generic component props
- ✅ Handle feature-specific business logic
- ✅ One wrapper per feature's data type

**Example**: `KAMDailyBarChart.tsx`
```typescript
// Transforms KAMEodReportResponse → DailyBarChart props
const KAMDailyBarChart = ({ kamData }: { kamData: KAMEodReportResponse }) => {
  const transformedData = useMemo(() => {
    // Transform API data to DailyDataPoint[]
    return kamData.dailyEntryStatus.map(day => ({
      date: day.entry_date,
      value: parseFloat(day.overallEntryPercentage),
      // ... transform logic
    }));
  }, [kamData]);

  return <DailyBarChart data={transformedData} ... />;
};
```

**Why**: Each feature has different API structures. Wrappers isolate transformation logic, keeping generic components clean.

### Benefits of This Pattern

1. **DRY (Don't Repeat Yourself)**: Write chart logic once, use everywhere
2. **Single Source of Truth**: Chart styling/behavior defined in one place
3. **Easy Updates**: Update `StackedBarChart.tsx` once, all features benefit
4. **Testability**: Test generic components with mock data, test wrappers separately
5. **Maintainability**: Clear separation makes code easier to understand

### Industry Examples

**Similar patterns used by**:
- **Material-UI**: Generic `<TextField>` → Feature-specific `<EmailInput>`
- **Ant Design**: Generic `<Table>` → Feature-specific `<UserTable>`
- **React Router**: Generic `<Route>` → Feature-specific route configurations

### Alignment with Component Development Standards

This pattern follows **P1: Separation of Concerns** from [Component Development Standards](../COMPONENT_DEVELOPMENT_STANDARDS.md#3-separation-of-concerns):

- ✅ **Components**: Only handle rendering (`CircularProgress`, `DailyBarChart`, `StackedBarChart`)
- ✅ **Feature Wrappers**: Handle data transformation (`KAMDailyBarChart`, `SentTransitStackedBarChart`)
- ✅ **Utils**: Handle pure transformations (`cityColorUtils`, `tableDataTransformers`)
- ✅ **Hooks**: Handle business logic (`useOpsDashboardData`, `useOpsDashboardFilters`)

### When to Use This Pattern

**Use Generic Components When**:
- Component can be reused across multiple features
- Component has no business logic
- Component accepts standardized data format

**Use Feature Wrappers When**:
- Need to transform API data → generic format
- Feature-specific business logic required
- Need to customize generic component behavior per feature

### File Structure Reference

```
src/
├── components/
│   └── charts/                    # Generic, reusable charts
│       ├── CircularProgress.tsx   # ✅ Generic
│       ├── DailyBarChart.tsx      # ✅ Generic
│       └── StackedBarChart.tsx   # ✅ Generic
└── features/
    └── ops-dashboard/
        └── components/
            └── charts/           # Feature-specific wrappers
                ├── KAMDailyBarChart.tsx           # Transforms KAM data
                ├── KAMStackedBarChart.tsx         # Transforms KAM data
                ├── SentTransitDailyBarChart.tsx   # Transforms Sent Transit data
                └── TransitDelayStackedBarChart.tsx # Transforms Transit Delay data
```

---

## Common Mistakes and Where to Look

### Mistake 1: APIs Not Loading on Page Load

**Symptoms**: Page loads but no data appears.

**Where to check**:
1. `src/pages/OpsDashboard.tsx` line 46: Is `enabled` set correctly? Should be `!!startDate && !!endDate`
2. `src/features/ops-dashboard/hooks/useOpsDashboardFilters.ts` line 78-80: Are dates initialized correctly?
3. Browser console: Check for API errors

**Fix**: Ensure dates are set and `enabled` flag is `true`.

---

### Mistake 2: City Filter Not Showing

**Symptoms**: City dropdown doesn't appear for user types 1, 2, 3, or 4.

**Where to check**:
1. `src/features/ops-dashboard/hooks/useOpsDashboardFilters.ts` line 75: Is `showCityFilter` calculated correctly?
2. Redux store: Is `user.userTypeId` set correctly?

**Fix**: Check user's `userTypeId` in Redux store.

---

### Mistake 3: Clients Not Loading

**Symptoms**: Client dropdown is empty or shows "All" only.

**Where to check**:
1. `src/features/ops-dashboard/hooks/useOpsDashboardFilters.ts` line 127-154: Is `cityId` calculated correctly?
2. API response: Check browser Network tab for `getClientByCity` response
3. `selectedCity` state: Is it set correctly when city changes?

**Fix**: Ensure `cityId` is calculated correctly based on selected city or user's city.

---

### Mistake 4: Wrong City Data Showing

**Symptoms**: Data shows for wrong city when "All" is selected.

**Where to check**:
1. `src/features/ops-dashboard/hooks/useOpsDashboardData.ts` line 49-58: Is `apiCityId` calculated correctly?
2. API calls: Check Network tab - are `city_ids` passed correctly?

**Fix**: Ensure `apiCityId` is `undefined` when "All" is selected.

---

### Mistake 5: Dates Not Persisting

**Symptoms**: Dates reset to current date on refresh.

**Where to check**:
1. `src/features/ops-dashboard/hooks/useOpsDashboardFilters.ts` line 41-58: Is `loadFiltersFromStorage` working?
2. Browser localStorage: Check if `'ops-dashboard-filters'` key exists
3. `saveFiltersToStorage` function: Is it being called?

**Fix**: Ensure localStorage functions are working correctly.

---

### Mistake 6: Chart Colors Not Consistent

**Symptoms**: Same city shows different colors across charts.

**Where to check**:
1. `src/features/ops-dashboard/utils/cityColorUtils.ts`: Is `getCityColorById` being used?
2. Chart components: Are they passing `city_id` (not `cityName`) to color function?

**Fix**: Always use `getCityColorById(city_id)` with `city_id` from API, not city name.

---

### Mistake 7: Stacked Chart Showing Wrong Data

**Symptoms**: Stacked chart shows incorrect percentages or wrong cities.

**Where to check**:
1. `src/components/charts/StackedBarChart.tsx`: Is data transformation correct?
2. Feature-specific wrappers (e.g., `KAMStackedBarChart.tsx`): Is data being transformed correctly?
3. City order: Are cities sorted correctly (Hyderabad, Gurgaon, Mumbai, Bangalore)?

**Fix**: Check data transformation in feature-specific wrapper components.

---

### Mistake 8: Table Showing Wrong Data

**Symptoms**: Table cells show incorrect values or "--".

**Where to check**:
1. `src/features/ops-dashboard/utils/tableDataTransformers.ts`: Are helper functions extracting correct fields?
2. API responses: Check actual API response structure matches expected format
3. Table component: Are columns mapped correctly?

**Fix**: Verify API response structure matches expected interfaces in `opsDashboardApi.ts`.

---

## Navigation Guide

### To Add a New Filter:
1. Add state in `useOpsDashboardFilters.ts`
2. Add UI component in `OpsDashboardFilters.tsx`
3. Pass filter value to `useOpsDashboardData.ts`
4. Update API calls if needed

### To Add a New API:
1. Add method in `src/services/opsDashboardApi.ts`
2. Add interface for response type
3. Add query in `useOpsDashboardData.ts`
4. Add data to return object
5. Use data in `OpsDashboardContent.tsx`

### To Add a New Metric Section:
1. Create new metrics component in `src/features/ops-dashboard/components/metrics/`
2. Add API query in `useOpsDashboardData.ts`
3. Transform data in feature-specific chart wrapper
4. Render in `OpsDashboardContent.tsx`

### To Change Table Columns:
1. Update `OpsDashboardTableRow` interface in `tableDataTransformers.ts`
2. Update `transformToTableData` function
3. Update `OpsDashboardTable.tsx` columns configuration

### To Debug API Issues:
1. Check browser Network tab for API calls
2. Check `src/services/opsDashboardApi.ts` for API method
3. Check `useOpsDashboardData.ts` for query configuration
4. Check response structure matches interface

### To Debug Filter Issues:
1. Check `useOpsDashboardFilters.ts` for filter logic
2. Check `OpsDashboardFilters.tsx` for UI rendering
3. Check localStorage for persisted values
4. Check Redux store for user data

