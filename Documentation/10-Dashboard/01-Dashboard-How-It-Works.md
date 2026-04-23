# Dashboard: How It Works Step by Step

This document explains exactly what happens when the Dashboard page loads and how each piece works.

## When Page Loads - Execution Flow

### Step 1: User Opens Dashboard Page

**File**: `src/pages/Dashboard.tsx`

**Line 1-2**: Imports
```typescript
import React from 'react';
import { useSelector } from 'react-redux';
```
**What happens**: Code gets ready to use React and Redux.

**Why**: We need React to show UI and Redux to get user information.

---

### Step 2: Dashboard Component Starts

**File**: `src/pages/Dashboard.tsx`

**Line 9**: Component function starts
```typescript
export const Dashboard: React.FC = () => {
```

**What happens**: The Dashboard component begins to run.

---

### Step 3: Get User Information from Redux

**File**: `src/pages/Dashboard.tsx`

**Line 10**:
```typescript
const { user } = useSelector((state: RootState) => state.auth);
```

**What happens**: 
- Reads user data from Redux store
- Gets user's city_id (which city they belong to)
- Gets user's city_name (name of the city)

**Why we do this**: 
- We need to know which city the user is in
- This filters which clients and facilities they can see
- Different cities have different clients

**What we get**:
- `user.city_id` - A number like 3 (for Mumbai)
- `user.city_name` - A string like "Mumbai"

---

### Step 4: Call Custom Hook to Get Filters

**File**: `src/pages/Dashboard.tsx`

**Line 11-20**:
```typescript
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
```

**What happens**: 
- Calls the `useDashboardFilters` hook
- This hook does ALL the work (we explain this below)
- Gets back filter values and functions to change them

**Why we use a hook**:
- Keeps Dashboard.tsx simple (only 49 lines)
- All logic is in one place (the hook)
- Easy to test and reuse

---

### Step 5: Custom Hook Starts Working

**File**: `src/features/dashboard/hooks/useDashboardFilters.ts`

#### Step 5a: Hook Function Starts

**Line 11**:
```typescript
export const useDashboardFilters = (): UseDashboardFiltersReturn => {
```

**What happens**: The hook function begins.

#### Step 5b: Get User from Redux (Again)

**Line 13**:
```typescript
const { user } = useSelector((state: RootState) => state.auth);
```

**What happens**: Gets user information again (needed inside hook).

**Why**: Hook needs city_id to load clients and facilities.

---

### Step 6: Initialize Filter States

**File**: `src/features/dashboard/hooks/useDashboardFilters.ts`

**Line 18**: Month state
```typescript
const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth().toString());
```

**What happens**: 
- Creates state for selected month
- Sets default value to current month (1-12)
- If today is December, value is "12"
- If today is January, value is "1"

**Why**: Users usually want to see current month's data.

**Line 19**: Client state
```typescript
const [selectedClient, setSelectedClient] = useState<string>(CLIENT_ALL_OPTION.value);
```

**What happens**: 
- Creates state for selected client
- Sets default value to "all" (means show all clients)

**Why**: Default is "All" so users see data for all clients, not just one.

**Line 20**: Facility state
```typescript
const [selectedFacility, setSelectedFacility] = useState<string>('');
```

**What happens**: 
- Creates state for selected facility
- Starts empty (no facility selected)

**Why**: User must choose a facility (unless only one exists).

---

### Step 7: Initialize Options States

**File**: `src/features/dashboard/hooks/useDashboardFilters.ts`

**Line 24**: Client options
```typescript
const [clientOptions, setClientOptions] = useState<DropdownOption[]>([CLIENT_ALL_OPTION]);
```

**What happens**: 
- Creates state for client dropdown list
- Starts with "All" option already in the list
- More clients will be added when API call completes

**Why**: "All" option always exists, even before clients load.

**Line 25**: Facility options
```typescript
const [facilityOptions, setFacilityOptions] = useState<DropdownOption[]>([]);
```

**What happens**: 
- Creates state for facility dropdown list
- Starts empty

**Why**: We need to load facilities from API first.

**Line 26-27**: Loading states
```typescript
const [loadingClients, setLoadingClients] = useState(false);
const [loadingFacilities, setLoadingFacilities] = useState(false);
```

**What happens**: 
- Creates states to track if data is loading
- Both start as `false` (not loading yet)

**Why**: We show "Loading..." in dropdowns while fetching data.

---

### Step 8: Load Clients from API

**File**: `src/features/dashboard/hooks/useDashboardFilters.ts`

**Line 43-66**: useEffect for loading clients

**Line 43**: useEffect starts
```typescript
useEffect(() => {
```

**What happens**: React runs this code when component loads AND when `user?.city_id` changes.

**Why**: We need city_id to load clients. If it changes, we reload.

**Line 44-45**: Define async function
```typescript
const loadClients = async () => {
  if (user?.city_id) {
```

**What happens**: 
- Creates a function to load clients
- Checks if user has city_id (safety check)

**Why**: We only load if we have city_id. If no city, we skip.

**Line 46**: Set loading to true
```typescript
setLoadingClients(true);
```

**What happens**: Sets `loadingClients` to `true`.

**Why**: Shows "Loading..." in dropdown so user knows data is coming.

**Line 47-48**: Try to call API
```typescript
try {
  const response = await SkuApiService.getClientByCity(user.city_id);
```

**What happens**: 
- Calls API: `GET /inventory/getClientByCity?location_id=3`
- Waits for response (this can take 1-2 seconds)
- Response contains list of clients for this city

**Why**: We need to know which clients exist in this city.

**Line 49**: Check if response is good
```typescript
if (response.status_code === 200 && response.result) {
```

**What happens**: 
- Checks if API call succeeded (status_code 200 = success)
- Checks if response has data (result exists)

**Why**: We only process data if API call worked.

**Line 50-53**: Transform API data
```typescript
const clientList = response.result.map((client: any) => ({
  value: client.clientId.toString(),
  label: client.clientName,
}));
```

**What happens**: 
- Takes API response data
- Changes it to format our dropdown needs
- Each client becomes: `{ value: "243", label: "Cafe 97 IIT B" }`

**API gives us**:
```json
{
  "clientId": 243,
  "clientName": "Cafe 97 IIT B"
}
```

**We transform to**:
```typescript
{
  value: "243",    // Dropdown needs string
  label: "Cafe 97 IIT B"  // What user sees
}
```

**Why**: Dropdown component expects this format (value + label).

**Line 59**: Add "All" option at beginning
```typescript
setClientOptions([CLIENT_ALL_OPTION, ...clientList]);
```

**What happens**: 
- Creates new array: ["All", client1, client2, ...]
- "All" is always first
- Updates state, which updates the dropdown

**Why**: "All" should always be first option so users can see all clients.

**Line 55**: Handle errors
```typescript
} catch (error) {
  console.error('Failed to load clients:', error);
}
```

**What happens**: If API call fails, log error to console.

**Why**: Helps developers debug if something breaks.

**Line 58**: Always set loading to false
```typescript
} finally {
  setLoadingClients(false);
}
```

**What happens**: Whether success or error, stop showing "Loading...".

**Why**: User should know loading finished.

**Line 62**: Tell React when to run
```typescript
loadClients();
}, [user?.city_id]);
```

**What happens**: 
- Runs `loadClients()` immediately
- Runs again if `user?.city_id` changes

**Why**: Load clients on page load and reload if user changes.

---

### Step 9: Load Facilities from API

**File**: `src/features/dashboard/hooks/useDashboardFilters.ts`

**Line 68-88**: useEffect for loading facilities

**Line 68**: useEffect starts
```typescript
useEffect(() => {
```

**What happens**: Runs when component loads.

**Line 70**: Set loading to true
```typescript
setLoadingFacilities(true);
```

**What happens**: Shows "Loading..." in facility dropdown.

**Line 73**: Call API
```typescript
const response = await CommonApiService.getFacilities(user?.city_id);
```

**What happens**: 
- Calls: `GET /locations/getLocations?location_type=2&city_id=3`
- Gets washing facilities for this city
- Waits for response

**Why**: User must choose which facility to analyze.

**Line 74**: Check response
```typescript
if (response.statusCode === 200 && response.data) {
```

**What happens**: Checks if API succeeded.

**Line 75-78**: Transform facility data
```typescript
const options = response.data.map((facility: any) => ({
  value: facility.id.toString(),
  label: facility.location,
}));
```

**What happens**: Changes API data to dropdown format.

**API gives**:
```json
{
  "id": 115,
  "location": "Mumbai - Bhandup Facility"
}
```

**We make**:
```typescript
{
  value: "115",
  label: "Mumbai - Bhandup Facility"
}
```

**Line 79**: Update state
```typescript
setFacilityOptions(options);
```

**What happens**: Updates dropdown with facility list.

---

### Step 10: Auto-Select Facility (If Only One)

**File**: `src/features/dashboard/hooks/useDashboardFilters.ts`

**Line 90-95**: Auto-select effect

**Line 91**: useEffect starts
```typescript
useEffect(() => {
```

**What happens**: Runs when `facilityOptions` changes.

**Line 92**: Check if only one facility
```typescript
if (facilityOptions.length === 1 && !selectedFacility) {
```

**What happens**: 
- Checks if exactly 1 facility exists
- Checks if no facility is selected yet

**Why**: If only one choice, auto-select it (user convenience).

**Line 93**: Auto-select it
```typescript
setSelectedFacility(facilityOptions[0].value);
```

**What happens**: Sets selected facility to the one facility.

**Why**: Saves user from clicking when there's only one option.

---

### Step 11: Return Values from Hook

**File**: `src/features/dashboard/hooks/useDashboardFilters.ts`

**Line 97-110**: Return statement

**What happens**: Hook returns all the values Dashboard component needs:

```typescript
return {
  selectedMonth,      // Current month (1-12)
  selectedClient,     // Current client ("all" or client ID)
  selectedFacility,   // Current facility (ID or empty)
  clientOptions,      // List of clients for dropdown
  facilityOptions,    // List of facilities for dropdown
  loadingClients,     // true/false - are clients loading?
  loadingFacilities,  // true/false - are facilities loading?
  setSelectedMonth,   // Function to change month
  setSelectedClient,  // Function to change client
  setSelectedFacility,// Function to change facility
};
```

**Why**: Dashboard component gets everything it needs in one place.

---

### Step 12: Dashboard Renders UI

**File**: `src/pages/Dashboard.tsx`

**Line 22**: Return JSX
```typescript
return (
```

**What happens**: Starts rendering the page.

**Line 23**: Main container
```typescript
<div className='space-y-6'>
```

**What happens**: Creates a container with spacing between sections.

**Line 24-29**: PageHeader component
```typescript
<PageHeader
  title='Inventory Analysis'
  locationName={user?.city_name || 'City'}
  totalItems={0}
  itemType='analysis'
  icon='📊'
/>
```

**What happens**: 
- Shows page title "Inventory Analysis"
- Shows user's city name
- Shows emoji icon

**Why**: Users need to know what page they're on.

**Line 31-45**: DashboardFilters component
```typescript
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
```

**What happens**: 
- Passes all filter data to Filters component
- Filters component shows three dropdowns
- When user changes a dropdown, calls the setter function

**Why**: Separates filter UI from main page (clean code).

**Line 28-34**: Fetch dashboard data
```typescript
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
```

**What happens**: 
- Calls `useDashboardDataQuery` hook
- This hook fetches dashboard data from API
- Only fetches when both facility and month are selected (enabled flag)
- Gets back stats (5 metrics) and chart data (time series)

**Why**: We need dashboard data to show stat cards and chart. Uses React Query for caching.

**Line 47**: DashboardContent component
```typescript
<DashboardContent stats={stats} chartData={chartData} loading={loading} error={error} />
```

**What happens**: 
- Passes stats, chart data, loading state, and error to content component
- Content component shows 5 stat cards and chart

**Why**: Separates data fetching from display. Content component handles rendering stats/chart.

---

### Step 13: Filters Component Renders

**File**: `src/features/dashboard/components/DashboardFilters.tsx`

**What happens inside**:

**Line 20**: Component function receives props
```typescript
export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
```

**What happens**: Gets all the data passed from Dashboard.

**Line 38**: Render Card container
```typescript
<Card className='p-4 sm:p-6'>
```

**What happens**: Creates a card box with padding.

**Line 39**: Grid layout
```typescript
<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
```

**What happens**: 
- On mobile: 1 column (dropdowns stack)
- On desktop: 3 columns (dropdowns side by side)
- Gap between them

**Line 42-48**: Month dropdown
```typescript
<FloatingDropdown
  label='Month'
  options={MONTH_OPTIONS}
  value={selectedMonth}
  onChange={onMonthChange}
  placeholder='Select month'
  className='w-full'
/>
```

**What happens**: 
- Shows month dropdown
- Displays current month (from selectedMonth)
- When user selects, calls `onMonthChange` (which is `setSelectedMonth`)

**Line 50-59**: Client dropdown
```typescript
<FloatingDropdown
  label='Client'
  options={clientOptions}
  value={selectedClient}
  onChange={onClientChange}
  placeholder='Select client'
  loading={loadingClients}
  className='w-full'
  searchable
/>
```

**What happens**: 
- Shows client dropdown
- If loading, shows "Loading..."
- User can search through clients (searchable prop)
- Displays "All" by default
- When user selects, calls `onClientChange`

**Line 61-71**: Facility dropdown
```typescript
<FloatingDropdown
  label='Washing Facility'
  options={facilityOptions}
  value={selectedFacility}
  onChange={onFacilityChange}
  placeholder='Select facility'
  loading={loadingFacilities}
  className='w-full'
  searchable
/>
```

**What happens**: 
- Shows facility dropdown
- Shows "Loading..." while fetching
- User can search facilities
- If only one, auto-selected already
- When user selects, calls `onFacilityChange`

---

### Step 14: Fetch Dashboard Data

**File**: `src/pages/Dashboard.tsx`

**Line 28-34**: useDashboardDataQuery hook call
```typescript
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
```

**What happens**: 
- Calls React Query hook to fetch dashboard data
- Only runs when both `selectedFacility` and `selectedMonth` have values (enabled flag)
- Returns stats (for cards), chart data, loading state, and error state

**Why**: Dashboard data depends on filters. Only fetch when filters are ready.

---

### Step 15: Inside useDashboardDataQuery Hook

**File**: `src/features/dashboard/hooks/useDashboardDataQuery.ts`

**What happens inside the hook**:

1. **Calculate Date Range** (Line 41)
   ```typescript
   const dateRange = month ? getMonthDateRange(parseInt(month, 10)) : null;
   ```
   - Converts month number to start_date and end_date
   - Example: Month 10 → start_date: "2025-10-01", end_date: "2025-10-31"

2. **React Query Setup** (Line 44)
   - Uses `useQuery` hook from React Query
   - Query key includes all filter values for proper caching
   - Only runs when `enabled` is true

3. **API Call** (Line 46-58)
   ```typescript
   const response = await InventoryApiService.getSentCountKAM({
     location_id: parseInt(locationId, 10),
     client_id: clientId === 'all' ? 'All' : clientId,
     start_date: dateRange.start_date,
     end_date: dateRange.end_date,
   });
   ```
   - Calls API: `GET /inventory/getSentCountKAM?location_id=115&client_id=All&start_date=2025-10-01&end_date=2025-10-31`
   - Gets dashboard summary and time series data

4. **Transform Data** (Line 74-75)
   ```typescript
   const stats = transformToStats(queryResult.data ?? null);
   const chartData = transformToMonthlyChartData(queryResult.data ?? null);
   ```
   - Converts API response to stats format (5 metrics)
   - Converts API response to chart format (day → count pairs)

5. **Return Values**
   - Returns stats, chartData, loading, error states

**Why React Query**: Handles caching, automatic refetching, retry logic, and error states automatically.

---

### Step 16: DashboardContent Component Renders

**File**: `src/features/dashboard/components/DashboardContent.tsx`

**Line 19-27**: Error handling
```typescript
if (error) {
  return (
    <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
      <p className='text-red-800'>{error}</p>
    </div>
  );
}
```

**What happens**: If API call failed, shows error message.

**Line 29-36**: Render stats and chart
```typescript
return (
  <div className='space-y-6'>
    {stats && <DashboardStats stats={stats} loading={loading} />}
    <DashboardChart data={chartData} loading={loading} />
  </div>
);
```

**What happens**: 
- Shows DashboardStats component if stats exist
- Shows DashboardChart component (always, even if no data)
- Both components receive loading state to show skeletons

---

### Step 17: DashboardStats Component Renders

**File**: `src/features/dashboard/components/DashboardStats.tsx`

**What happens**:

1. **Build Stat Cards** (Line 11-49)
   - Creates array of 5 stat card configurations
   - Each card has: title, value, suffix (unit), icon, accent color

2. **Format Values** (Line 14, 21, etc.)
   - Formats numbers with commas (1,000 instead of 1000)
   - Limits decimal places to 2

3. **Show Loading State** (Line 62-78)
   - If loading, shows 5 skeleton cards with animation

4. **Render Cards** (Line 80-129)
   - Renders grid: 1 column on mobile, 2 on tablet, 5 on desktop
   - Each card shows icon, title, value, and unit
   - Cards have hover effects and accessibility labels

**The 5 Stats Shown**:
1. Total Container Units (blue)
2. Average Container Units (emerald)
3. Plastic Saved (kg) (amber)
4. Water Saved (Liters) (cyan)
5. GHG Emissions Reduced (kg CO₂e) (purple)

---

### Step 18: DashboardChart Component Renders

**File**: `src/features/dashboard/components/DashboardChart.tsx`

**What happens**:

1. **Show Loading State** (Line 73-78)
   - If loading, shows "Loading chart data..." message

2. **Show Empty State** (Line 80-88)
   - If no data, shows "No data available" message

3. **Calculate Chart Data** (Line 24)
   ```typescript
   const chartData = useChartData({ data, filter });
   ```
   - Transforms API data based on filter (monthly/week1/week2/etc.)

4. **Calculate Y-Axis Ticks** (Line 42-44)
   - Generates evenly spaced Y-axis labels (8-10 ticks)
   - Rounds to nearest thousand for readability

5. **Build Filter Options** (Line 47-55)
   - Creates dropdown options: Monthly, Week 1, Week 2, etc.
   - Only shows weeks that exist in data (some months have only 4 weeks)

6. **Render Chart** (Line 91-227)
   - Uses Recharts LineChart component
   - Shows X-axis (day of month), Y-axis (SKU count)
   - Includes tooltip on hover
   - Responsive design (mobile/desktop)
   - Accessibility labels for screen readers

**Why**: Chart visualizes SKU count trends over time, helping users see patterns.

---

## When User Changes a Filter

### Example: User Changes Client from "All" to "Cafe 97"

**Step 1**: User clicks client dropdown and selects "Cafe 97"

**Step 2**: `onClientChange` function called (which is `setSelectedClient`)

**Step 3**: Inside hook, state updates:
```typescript
setSelectedClient("243"); // ID of Cafe 97
```

**Step 4**: React re-renders Dashboard component

**Step 5**: Hook returns new `selectedClient` value ("243")

**Step 6**: DashboardFilters receives new value

**Step 7**: FloatingDropdown shows "Cafe 97" instead of "All"

**Step 8**: React Query automatically refetches dashboard data
- Since `selectedClient` changed, React Query detects the dependency change
- Automatically calls API again with new client filter
- Updates stats and chart data
- UI re-renders with new data

---

## Summary: Why This Structure?

### Why Custom Hook?
- **Keep Dashboard.tsx simple**: Only 49 lines, just UI
- **Reuse logic**: Can use `useDashboardFilters` in other pages
- **Test easily**: Test hook logic without rendering UI
- **Maintain easily**: All filter logic in one file

### Why Separate Components?
- **DashboardFilters.tsx**: Only handles filter UI
- **DashboardContent.tsx**: Only handles body content
- **Easy to change**: Modify filters without touching content

### Why Constants File?
- **Month options**: Never change, so put in constants
- **Reuse**: Use same months in other places
- **Easy to update**: Change month names in one place

### Why index.ts Export File?
- **Easy imports**: `import { DashboardFilters } from '../features/dashboard'`
- **Clean**: One import instead of many
- **Standard**: Common pattern in React projects

---

## Visual Flow Diagram

```
User Opens Dashboard Page
    ↓
Dashboard.tsx loads
    ↓
Gets user from Redux (city_id)
    ↓
Calls useDashboardFilters hook
    ↓
Hook initializes states (month, client, facility)
    ↓
Hook calls API to load clients (parallel)
Hook calls API to load facilities (parallel)
    ↓
API returns client list
API returns facility list
    ↓
Hook transforms data to dropdown format
    ↓
Hook adds "All" to client list
Hook auto-selects facility if only one
    ↓
Hook returns all values to Dashboard
    ↓
Dashboard calls useDashboardDataQuery hook
    ↓
Hook fetches data from API (if facility + month selected)
    ↓
API returns stats and chart data
    ↓
Hook transforms data (API format → UI format)
    ↓
Dashboard renders:
  - PageHeader (title)
  - DashboardFilters (3 dropdowns)
  - DashboardContent:
      - DashboardStats (5 stat cards)
      - DashboardChart (trend chart)
    ↓
User sees page with filters and dashboard data
```

---

## Files and Their Jobs

| File | Job | Lines | Why Separated |
|------|-----|-------|---------------|
| Dashboard.tsx | Main page composition | 72 | Keeps it simple, orchestrates components |
| useDashboardFilters.ts | Filter logic | 110 | Testable, reusable business logic |
| useDashboardDataQuery.ts | Data fetching (React Query) | 80 | Caching, retries, error handling |
| DashboardFilters.tsx | Filter UI | 67 | Separate UI from logic |
| DashboardContent.tsx | Body container | 38 | Routes data to stats/chart |
| DashboardStats.tsx | 5 stat cards | 133 | Reusable stat display |
| DashboardChart.tsx | Trend chart | 233 | Chart visualization logic |
| useChartData.ts | Chart filtering | 45 | Weekly/monthly data transformation |
| dataTransformers.ts | Data transformation | 80 | API → UI format conversion |
| dateUtils.ts | Date helpers | 45 | Month ranges, day extraction |
| chartConstants.ts | Chart styling | 100 | Centralized chart config |
| constants.ts | Fixed values | 26 | Reusable constants |

**Total**: ~1000+ lines, organized into focused, maintainable modules.

