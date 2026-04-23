# P&L (Profit & Loss) Overview

## What is P&L?

The P&L (Profit & Loss) feature provides comprehensive financial analysis for washing facilities, showing revenue, expenses, and profitability metrics across different time periods and clients.

## Why Do We Need It?

- **Financial Visibility**: Track revenue and expenses for each facility
- **Performance Analysis**: Compare projected vs actual values
- **Client-Level Insights**: Understand profitability per client
- **Operational Metrics**: Monitor escalations and operational issues
- **Decision Making**: Data-driven decisions for facility management

## How It Works

The P&L feature uses a **tabbed interface** with 5 tabs, each showing different financial metrics:

1. **Expenditure** - Revenue and expenditure breakdown by costing type
2. **Unit Economics** - Cost analysis in units (per plate/unit)
3. **EBITDA** - Earnings Before Interest, Taxes, Depreciation, and Amortization
4. **Client Wise P&L** - Per-client profit and loss analysis
5. **Escalations** - Client escalation tracking and categorization

### High-Level Flow

1. User selects **Month**, **Year**, and **Facility** from filters
2. All 5 APIs are called automatically (page-level, not tab-level)
3. Data is fetched and cached using React Query
4. User switches tabs to view different metrics
5. Each tab displays data in a table format with specific columns

## Pages

### PLSummary (`src/pages/PLSummary.tsx`)
Main page component that:
- Renders `PageHeader` with title and location
- Renders `PLFilters` for month/year/facility selection
- Renders `Tabs` component with 5 tab items
- Calls all 5 API hooks at page level
- Handles errors with `Snackbar` and `ErrorBoundary`

## Sections

### 1. Page Header
- Title: "P&L Summary"
- Location name from user's city
- Icon: 💰

### 2. Filters Section
- **Month Dropdown**: Select month (1-12)
- **Year Dropdown**: Select year
- **Facility Dropdown**: Select washing facility (auto-selects first)
- **Search Button**: Triggers API calls (though APIs auto-fetch on filter change)

### 3. Tabs Section
Five tabs with different content:
- **Expenditure**: Revenue and expenditure table
- **Unit Economics**: Unit cost analysis table
- **EBITDA**: Two tables (Variable Cost Details, Indirect Expense Details)
- **Client Wise P&L**: Per-client P&L table
- **Escalations**: Two tables (Client Escalation, Escalation Category)

## File Locations

### Main Page
- `src/pages/PLSummary.tsx` - Main page component

### Feature Code
- `src/features/p-and-l/components/PLFilters.tsx` - Filter component
- `src/features/p-and-l/components/PLTabContents.tsx` - Tab content components
- `src/features/p-and-l/components/EBITDATab.tsx` - EBITDA tab (separate file)
- `src/features/p-and-l/config/tabs.ts` - Tab configuration
- `src/features/p-and-l/config/constants.ts` - Feature constants
- `src/features/p-and-l/hooks/usePLFilters.ts` - Filter management hook
- `src/features/p-and-l/hooks/usePLTabData.ts` - Data fetching hooks

### API Service
- `src/services/pAndLApi.ts` - P&L API service methods

### Shared Components
- `src/components/ui/Tabs.tsx` - Generic tabs component
- `src/components/ui/DataDisplay.tsx` - Generic table component
- `src/components/ui/Snackbar.tsx` - Error notification component
- `src/components/FacilityDropdown.tsx` - Facility dropdown component
- `src/components/ErrorBoundary.tsx` - Error boundary component

## Key Features

### Page-Level API Calls
- All 5 APIs are called at page level, not tab level
- Prevents redundant API calls when switching tabs
- Ensures all data is ready when user switches tabs

### Filter-Based Fetching
- APIs are called automatically when filters change
- Uses `shouldFetch` flag to ensure all filters are set
- React Query handles caching and deduplication

### Tab Configuration
- Tab items are defined in `config/tabs.ts`
- Uses `React.createElement` to create tab content components
- Passes props (filters, enabled flag, error handler) to each tab

### Error Handling
- **Snackbar** for API errors (displayed at page level)
- **ErrorBoundary** wrapping tabs for rendering errors
- **Null-safe data access** in tab components
- **Graceful empty states** when no data available

### Date Range Calculation
- Uses UTC methods to prevent timezone issues
- Calculates `start_date` (first day of month) and `end_date` (last day of month)
- Formats dates as `YYYY-MM-DD` for API calls

### Table Styling
- Consistent font sizing across all tables
- First two columns slightly larger (`text-xs` vs `text-[11px]`)
- Week columns with colored backgrounds
- Bold headers, normal-weight rows

## API Endpoints

1. **Expenditure**: `GET /api/review/getRevenue`
   - Params: `facility_id`, `start_date`, `end_date`, `page`, `limit`

2. **Unit Economics**: `GET /api/review/getRevenueInUnits`
   - Params: `city_id`, `facility_id`, `start_date`, `end_date`, `page`, `limit`

3. **EBITDA**: `GET /api/review/getEBITDA`
   - Params: `city_id`, `facility_id`, `start_date`, `end_date`, `groupByClient`

4. **Client Wise P&L**: `GET /api/review/getClientWisePL`
   - Params: `city_id`, `facility_id`, `start_date`, `end_date`, `groupByClient`

5. **Escalations**: `GET /api/ops/getEscalation`
   - Params: `cityId`, `facilityId`, `startDate`, `endDate` (camelCase)

## Dependencies

### External Libraries
- **React Query** (`@tanstack/react-query`) - Data fetching and caching
- **React Redux** (`react-redux`) - Global state management (for user data)
- **Axios** - HTTP client (via `apiService`)

### Internal Dependencies
- `src/components/ui/*` - UI components (Tabs, Table, Snackbar, etc.)
- `src/components/FacilityDropdown` - Facility dropdown component
- `src/services/pAndLApi.ts` - P&L API service
- `src/store` - Redux store (for user data)

## Related Documentation

- [Component Development Standards](../COMPONENT_DEVELOPMENT_STANDARDS.md) - Component development patterns
- [UI Components](../04-UI-Components/03-UI-Components.md) - UI component documentation
- [Dashboard](../10-Dashboard/00-Dashboard-Overview.md) - Dashboard feature (similar filter pattern)
- [Ops Dashboard](../11-Ops-Dashboard/00-Ops-Dashboard-Overview.md) - Ops Dashboard feature (similar structure)

