# P&L (Profit & Loss) Documentation

## Overview

The P&L feature provides comprehensive profit and loss analysis with tabbed interface for viewing expenditure, unit economics, EBITDA, client-wise P&L, and escalations data.

## Documentation Files

### 00-P-and-L-Overview.md
Basic introduction:
- What the P&L feature is
- Why we need it
- How it works at a high level
- What tabs exist
- Where files are located
- Sections in the feature

### 01-P-and-L-How-It-Works.md
Detailed step-by-step guide:
- Exact execution flow when page loads
- Line-by-line explanation of code
- What each function does and why
- What happens when user changes filters
- What happens in each tab component
- Common mistakes and where to look
- Navigation guide for developers

## Quick Links

- **Main Page**: `src/pages/PLSummary.tsx`
- **Feature Code**: `src/features/p-and-l/`
- **Filters Hook**: `src/features/p-and-l/hooks/usePLFilters.ts`
- **Data Hooks**: `src/features/p-and-l/hooks/usePLTabData.ts`
- **Filters Component**: `src/features/p-and-l/components/PLFilters.tsx`
- **Tab Contents**: `src/features/p-and-l/components/PLTabContents.tsx`
- **EBITDA Tab**: `src/features/p-and-l/components/EBITDATab.tsx`
- **Tab Config**: `src/features/p-and-l/config/tabs.ts`
- **API Service**: `src/services/pAndLApi.ts`

## Key Concepts

### Tab-Based Architecture
The P&L feature uses a tabbed interface with 5 tabs:
1. **Expenditure** - Revenue and expenditure breakdown
2. **Unit Economics** - Cost analysis in units
3. **EBITDA** - Earnings Before Interest, Taxes, Depreciation, and Amortization
4. **Client Wise P&L** - Per-client profit and loss analysis
5. **Escalations** - Client escalation tracking

### Page-Level API Calls
All 5 APIs are called at the page level (`PLSummary.tsx`), not at the tab level:
- ✅ **Prevents redundant calls** when switching tabs
- ✅ **Ensures all data is ready** when user switches tabs
- ✅ **Optimizes performance** by calling once per filter change
- Uses React Query's `enabled` flag to control fetching

### Filter Management
Filters are managed via `usePLFilters` hook:
- **Month** - Selected month (1-12)
- **Year** - Selected year
- **Facility** - Selected washing facility (from `FacilityDropdown`)

### Date Range Calculation
Date ranges are calculated using UTC methods to avoid timezone issues:
- `start_date`: First day of selected month (YYYY-MM-DD)
- `end_date`: Last day of selected month (YYYY-MM-DD)
- Uses `Date.UTC()` to prevent timezone shifts

### React Query Hooks
Each tab has its own React Query hook:
- `useExpenditureData` - Fetches expenditure data
- `useUnitEconomicsData` - Fetches unit economics data
- `useEBITDAData` - Fetches EBITDA data
- `useClientWisePLData` - Fetches client-wise P&L data
- `useEscalationData` - Fetches escalation data

All hooks share:
- Same `enabled` flag (from page level)
- Same `refetchOnMount: false` and `refetchOnWindowFocus: false`
- Same caching strategy (5min stale time, 10min garbage collection)

### Generic Table Component
All tabs use the generic `Table` component from `src/components/ui/DataDisplay.tsx`:
- Consistent styling and behavior
- Customizable columns with `TableColumn` interface
- Support for custom rendering, sorting, and formatting
- Font sizing: First two columns (`text-xs`), rest (`text-[11px]`)

### Error Handling
- **Snackbar** for API errors (displayed at page level)
- **ErrorBoundary** wrapping tabs for rendering errors
- **Null-safe data access** in tab components
- **Graceful empty states** when no data available

## For Developers

### When you need to:

**Add new filter**:
- Modify `usePLFilters.ts` to add state and loading logic
- Modify `PLFilters.tsx` to add UI component
- Pass filter value to API hooks if needed

**Add new API**:
- Add method in `src/services/pAndLApi.ts`
- Add interface for response type
- Add hook in `usePLTabData.ts`
- Add hook call in `PLSummary.tsx`
- Add tab content component in `PLTabContents.tsx`
- Add tab config in `config/tabs.ts`

**Add new tab**:
- Create tab content component in `PLTabContents.tsx`
- Add React Query hook in `usePLTabData.ts`
- Add tab config in `config/tabs.ts`
- Add hook call in `PLSummary.tsx`

**Change table columns**:
- Update column definitions in tab content component
- Update data transformation in `tableData` useMemo
- Ensure column titles are shortened and make sense

**Debug API issues**:
- Check browser Network tab for API calls
- Check `src/services/pAndLApi.ts` for API method
- Check `usePLTabData.ts` for query configuration
- Check response structure matches interface
- Check date range calculation (UTC methods)

**Debug filter issues**:
- Check `usePLFilters.ts` for filter logic
- Check `PLFilters.tsx` for UI rendering
- Check `FacilityDropdown` for facility selection
- Check date range calculation in `getDateRangeFromMonthYear`

## File Structure

```
src/
├── pages/
│   └── PLSummary.tsx                          # Main page component
├── features/
│   └── p-and-l/
│       ├── components/
│       │   ├── PLFilters.tsx                  # Filter inputs
│       │   ├── PLTabContents.tsx             # Tab content components
│       │   └── EBITDATab.tsx                  # EBITDA tab (separate file)
│       ├── config/
│       │   ├── constants.ts                   # Feature constants
│       │   └── tabs.ts                       # Tab configuration
│       ├── hooks/
│       │   ├── usePLFilters.ts               # Filter management hook
│       │   └── usePLTabData.ts               # Data fetching hooks
│       └── index.ts                           # Feature exports
└── services/
    └── pAndLApi.ts                            # P&L API service
```

## API Endpoints

1. **Expenditure**: `GET /api/review/getRevenue`
2. **Unit Economics**: `GET /api/review/getRevenueInUnits`
3. **EBITDA**: `GET /api/review/getEBITDA`
4. **Client Wise P&L**: `GET /api/review/getClientWisePL`
5. **Escalations**: `GET /api/ops/getEscalation`

## Common Patterns

### Filter Change Triggers All APIs
When any filter (month, year, facility) changes:
- All 5 APIs are called automatically
- Uses `shouldFetch` flag to ensure all filters are set
- React Query deduplicates identical requests

### Tab Switching Doesn't Trigger APIs
Switching tabs only changes the displayed content:
- No API calls on tab switch
- Data is already cached from page load
- Instant tab switching experience

### Date Range Format
All APIs expect dates in `YYYY-MM-DD` format:
- Calculated using UTC methods
- Prevents timezone conversion issues
- Consistent across all API calls

### Table Font Sizing
Consistent font sizing across all tables:
- **Headers**: `text-xs font-bold` (12px, bold)
- **First two columns**: `text-xs font-normal` (12px, normal)
- **Other columns**: `text-[11px] font-normal` (11px, normal)

### Week Column Colors
Week columns use consistent background colors:
- **W1**: `bg-blue-50`
- **W2**: `bg-pink-50`
- **W3**: `bg-green-50`
- **W4**: `bg-orange-50`
- **Delta columns**: Lighter shade of corresponding week color

