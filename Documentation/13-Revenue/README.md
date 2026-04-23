# Revenue Documentation

## Overview

The Revenue feature provides monthly revenue estimation and tracking functionality, allowing users to add, view, and edit revenue estimates with weekly actuals for washing facilities.

## Documentation Files

### 00-Revenue-Overview.md
Basic introduction:
- What the Revenue feature is
- Why we need it
- How it works at a high level
- What pages exist
- Where files are located
- Sections in each page

### 01-Revenue-How-It-Works.md
Detailed step-by-step guide:
- Exact execution flow when each page loads
- Line-by-line explanation of code
- What each function does and why
- What happens when user changes filters
- What happens when user submits forms
- Redux persistence flow
- Common mistakes and where to look
- Navigation guide for developers

## Quick Links

- **Add Page**: `src/pages/MonthlyEstimateAdd.tsx`
- **List Page**: `src/pages/MonthlyEstimateList.tsx`
- **Edit Page**: `src/pages/MonthlyEstimateEdit.tsx`
- **Feature Code**: `src/features/revenue/`
- **Filters Hook**: `src/features/revenue/hooks/useRevenueFilters.ts`
- **Listing Hook**: `src/features/revenue/hooks/useRevenueListingData.ts`
- **Filters Components**: `src/features/revenue/components/RevenueFilters.tsx` and `RevenueAddFilters.tsx`
- **Table Components**: `src/features/revenue/components/CostingBudgetTable.tsx`, `OnSiteManPowerTable.tsx`, `EditableBudgetTable.tsx`, `EditableOnSiteManPowerTable.tsx`
- **API Service**: `src/services/pAndLApi.ts`
- **Redux Slice**: `src/store/slices/revenueSlice.ts`

## Key Concepts

### Three-Page Architecture
The Revenue feature consists of three pages:
1. **Add Page** (`MonthlyEstimateAdd`) - Create new monthly revenue estimates
2. **List Page** (`MonthlyEstimateList`) - View all revenue estimates in a table
3. **Edit Page** (`MonthlyEstimateEdit`) - Edit existing revenue estimates with weekly actuals

### Redux Persistence
Both Add and Edit pages use Redux Persist to save user input:
- **Add Page**: Persists `budgets` and `onSiteManPowerEstimates` across page refreshes
- **Edit Page**: Persists `editBudgetWeekValues` and `editManPowerWeekValues` across page refreshes
- Data is cleared after successful submission
- Persisted data is keyed by `month`, `year`, and `facility_id`

### Filter Management
Filters are managed via `useRevenueFilters` hook:
- **Month** - Selected month (1-12)
- **Year** - Selected year
- **Facility** - Selected washing facility (from `FacilityDropdown`)
- **Cost Category** (List page only) - Optional filter for revenue listing

### Date Format
All APIs expect dates in specific formats:
- **`date_year`**: `YYYY-MM-01` format (first day of month)
- **`start_date` / `end_date`**: `YYYY-MM-DD` format (calculated using UTC methods)
- Uses `Date.UTC()` to prevent timezone conversion issues

### React Query Hooks
Different hooks for different purposes:
- `useReviewCostingTypes` - Fetches costing types for budget table
- `useProjectedCosting` - Fetches existing projected costing data
- `useOnSiteManPowerClients` - Fetches clients for on-site manpower table
- `useRevenueListingData` - Fetches revenue listing data (for List and Edit pages)

All hooks use React Query for caching and automatic refetching.

### Table Components
Four specialized table components:
1. **`CostingBudgetTable`** - 2-column table (Costing Type, Budget) for Add page
2. **`OnSiteManPowerTable`** - Client listing table for Add page
3. **`EditableBudgetTable`** - Editable weekly actuals table for Edit page
4. **`EditableOnSiteManPowerTable`** - Editable weekly actuals table for Edit page

### API Endpoints

1. **Get Cost Categories**: `GET /api/review/getCostCategories?status=1`
2. **Get Review Costing Types**: `GET /api/review/getReviewCostingType?page=1&limit=22&showAll=true`
3. **Get Projected Costing**: `GET /api/review/getProjectedCosting?date_year=YYYY-MM-01&facility_id=ID`
4. **Get On-Site Manpower Clients**: `GET /api/review/getOnSiteManPowerClients?facility_id=ID`
5. **Get Revenue Listing**: `GET /api/review/getRevenue?city_id=ID&facility_id=ID&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&page=1&limit=100&allResults=true`
6. **Add Projected Actual Costing**: `POST /api/review/addProjectedActualCosting`
7. **Update Revenue**: `PUT /api/review/updateRevenue`

## For Developers

### When you need to:

**Add new filter**:
- Modify `useRevenueFilters.ts` to add state and loading logic
- Modify `RevenueFilters.tsx` or `RevenueAddFilters.tsx` to add UI component
- Pass filter value to API hooks if needed

**Add new API**:
- Add method in `src/services/pAndLApi.ts`
- Add interface for request/response types
- Add React Query hook in appropriate hooks file
- Use hook in page component

**Add new table column**:
- Update column definitions in table component
- Update data transformation logic
- Ensure column titles are shortened and make sense

**Debug API issues**:
- Check browser Network tab for API calls
- Check `src/services/pAndLApi.ts` for API method
- Check React Query hook for query configuration
- Check response structure matches interface
- Check date format (UTC methods)

**Debug filter issues**:
- Check `useRevenueFilters.ts` for filter logic
- Check filter component for UI rendering
- Check `FacilityDropdown` for facility selection
- Check date format calculation

**Debug Redux persistence**:
- Check `src/store/slices/revenueSlice.ts` for state structure
- Check `src/store/index.ts` for persist config
- Check browser localStorage for persisted data
- Check if `clearEditRevenueData` or `clearRevenueData` is called after submit

**Debug edit page not loading data**:
- Check URL parameters (`month`, `year`, `facility_id`)
- Check `useRevenueListingData` hook is enabled
- Check `shouldLoadFromAPI` logic
- Check API response structure matches expected format
- Check null value handling for week fields

## File Structure

```
src/
├── pages/
│   ├── MonthlyEstimateAdd.tsx              # Add page component
│   ├── MonthlyEstimateList.tsx             # List page component
│   └── MonthlyEstimateEdit.tsx             # Edit page component
├── features/
│   └── revenue/
│       ├── components/
│       │   ├── RevenueFilters.tsx          # List page filters
│       │   ├── RevenueAddFilters.tsx       # Add page filters
│       │   ├── CostingBudgetTable.tsx      # Budget table (Add page)
│       │   ├── OnSiteManPowerTable.tsx     # Manpower table (Add page)
│       │   ├── EditableBudgetTable.tsx     # Editable budget table (Edit page)
│       │   └── EditableOnSiteManPowerTable.tsx  # Editable manpower table (Edit page)
│       ├── hooks/
│       │   ├── useRevenueFilters.ts        # Filter management hook
│       │   ├── useRevenueListingData.ts    # Listing data hook
│       │   ├── useReviewCostingTypes.ts    # Costing types hook
│       │   ├── useProjectedCosting.ts      # Projected costing hook
│       │   └── useOnSiteManPowerClients.ts # Manpower clients hook
│       └── index.ts                        # Feature exports
├── services/
│   └── pAndLApi.ts                         # Revenue API service
└── store/
    └── slices/
        └── revenueSlice.ts                 # Redux slice with persistence
```

## Common Patterns

### Filter Change Triggers API
When any filter (month, year, facility) changes:
- APIs are called automatically (React Query)
- Uses `enabled` flag to ensure all required filters are set
- React Query deduplicates identical requests

### Redux Persistence Pattern
1. User enters data in form
2. Data is saved to Redux state immediately
3. Redux Persist saves to localStorage
4. On page refresh, data is loaded from localStorage
5. If filters match persisted data, use persisted data
6. If filters changed, fetch fresh data from API
7. After successful submit, clear persisted data

### Edit Page Data Loading
1. Get `month`, `year`, `facility_id` from URL params
2. Always load from API (ignore persisted data for initial load)
3. Populate form fields with API data
4. User edits trigger Redux state updates
5. On refresh, load persisted edits if filters match
6. On submit, send updates to API and clear persisted data

### Null Value Handling
Week values in API responses can be `null`:
- Convert `null` to `'0'` for display in input fields
- Convert empty string or `'0'` to `null` when submitting to API
- Use `formatWeekValue` helper function for consistent conversion

### Table Column Styling
Consistent styling across all tables:
- **Headers**: Center-aligned, bold
- **Week columns**: Center-aligned (W1, W2, W3, W4)
- **Data cells**: Right-aligned for numbers
- **First column**: Left-aligned, slightly larger font (`text-xs`)
- **Other columns**: Smaller font (`text-[11px]`)

## Common Mistakes

### 1. Multiple API Calls
**Problem**: API is called multiple times on page load
**Solution**: 
- Remove manual `refetch()` calls
- Use `refetchOnMount: true` instead of `'always'`
- Check React Query queryKey for uniqueness

### 2. Values Not Auto-Populating
**Problem**: Form fields don't populate with API data
**Solution**:
- Check `shouldLoadFromAPI` is `true`
- Check API response structure matches interface
- Check null value handling (`null` → `'0'` conversion)
- Check `useEffect` dependencies

### 3. Redux Persistence Not Working
**Problem**: Data lost on page refresh
**Solution**:
- Check `revenueSlice` is added to Redux store
- Check `revenuePersistConfig` whitelist includes correct fields
- Check localStorage for persisted data
- Check `clearRevenueData` / `clearEditRevenueData` not called prematurely

### 4. Edit Page Not Loading
**Problem**: Edit page shows "Missing required parameters"
**Solution**:
- Check URL has `month`, `year`, `facility_id` params
- Check `handleEdit` in List page passes correct params
- Check `useSearchParams` is reading params correctly
- Check `user.city_id` is available

### 5. Date Format Issues
**Problem**: Wrong dates sent to API (timezone shifts)
**Solution**:
- Use `Date.UTC()` for date creation
- Use UTC-specific methods (`getUTCFullYear`, `getUTCMonth`, `getUTCDate`)
- Format dates as `YYYY-MM-DD` strings

