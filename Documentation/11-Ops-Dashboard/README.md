# Ops Dashboard Documentation

## Overview

The Ops Dashboard provides operational metrics and reports for cities, including facility reports, KAM metrics, sent transit metrics, and transit delay metrics.

## Documentation Files

### 00-Ops-Dashboard-Overview.md
Basic introduction:
- What the Ops Dashboard is
- Why we need it
- How it works at a high level
- What pages exist
- Where files are located
- Sections in the dashboard

### 01-Ops-Dashboard-How-It-Works.md
Detailed step-by-step guide:
- Exact execution flow when page loads
- Line-by-line explanation of code
- What each function does and why
- What happens when user changes filters
- What happens in each component
- Common mistakes and where to look
- Navigation guide for developers

## Quick Links

- **Main Page**: `src/pages/OpsDashboard.tsx`
- **Feature Code**: `src/features/ops-dashboard/`
- **Filters Hook**: `src/features/ops-dashboard/hooks/useOpsDashboardFilters.ts`
- **Data Hook**: `src/features/ops-dashboard/hooks/useOpsDashboardData.ts`
- **Filters Component**: `src/features/ops-dashboard/components/OpsDashboardFilters.tsx`
- **Content Component**: `src/features/ops-dashboard/components/OpsDashboardContent.tsx`
- **API Service**: `src/services/opsDashboardApi.ts`

## Key Concepts

### Custom Hooks
We use two main hooks:
- **`useOpsDashboardFilters`**: Manages filter state (dates, client, city), loads dropdown options, persists dates to localStorage
- **`useOpsDashboardData`**: Fetches all 5 APIs using React Query, handles loading/error states, provides refetch function

### Feature-Based Organization
All ops dashboard code lives in `src/features/ops-dashboard/`:
- `components/`: UI components (filters, table, metrics, charts)
- `hooks/`: Business logic hooks
- `utils/`: Helper functions (transformers, color utilities)

### Generic Chart Components
We use generic chart components from `src/components/charts/`:
- `CircularProgress.tsx`: Generic circular progress indicator
- `DailyBarChart.tsx`: Generic daily bar chart (uses Recharts)
- `StackedBarChart.tsx`: Generic stacked bar chart (uses ApexCharts)

Feature-specific wrappers transform API data and pass it to generic components.

### City Color Mapping
City colors are consistent across all charts using `cityColorUtils.ts`:
- Maps `city_id` (1-20) to predefined colors
- Ensures same city always gets same color
- Cycles through colors for `city_id > 20`

## For Developers

### When you need to:

**Add new filter**:
- Modify `useOpsDashboardFilters.ts` to add state and loading logic
- Modify `OpsDashboardFilters.tsx` to add UI component
- Pass filter value to `useOpsDashboardData.ts` if needed

**Add new API**:
- Add method in `src/services/opsDashboardApi.ts`
- Add interface for response type
- Add query in `useOpsDashboardData.ts`
- Add data to return object
- Use data in `OpsDashboardContent.tsx`

**Add new metric section**:
- Create new metrics component in `src/features/ops-dashboard/components/metrics/`
- Add API query in `useOpsDashboardData.ts`
- Transform data in feature-specific chart wrapper
- Render in `OpsDashboardContent.tsx`

**Change table columns**:
- Update `OpsDashboardTableRow` interface in `tableDataTransformers.ts`
- Update `transformToTableData` function
- Update `OpsDashboardTable.tsx` columns configuration

**Debug API issues**:
- Check browser Network tab for API calls
- Check `src/services/opsDashboardApi.ts` for API method
- Check `useOpsDashboardData.ts` for query configuration
- Check response structure matches interface

**Debug filter issues**:
- Check `useOpsDashboardFilters.ts` for filter logic
- Check `OpsDashboardFilters.tsx` for UI rendering
- Check localStorage for persisted values
- Check Redux store for user data

## File Structure

```
src/
├── pages/
│   └── OpsDashboard.tsx                    # Main page component
├── features/
│   └── ops-dashboard/
│       ├── components/
│       │   ├── OpsDashboardFilters.tsx     # Filter inputs
│       │   ├── OpsDashboardContent.tsx     # Content container
│       │   ├── OpsDashboardTable.tsx       # Facility report table
│       │   ├── metrics/
│       │   │   ├── KAMMetrics.tsx          # KAM metrics section
│       │   │   ├── SentTransitMetrics.tsx # Sent transit metrics
│       │   │   └── TransitDelayMetrics.tsx # Transit delay metrics
│       │   └── charts/
│       │       ├── KAMDailyBarChart.tsx    # KAM daily chart wrapper
│       │       ├── KAMStackedBarChart.tsx   # KAM stacked chart wrapper
│       │       ├── SentTransitDailyBarChart.tsx
│       │       ├── SentTransitStackedBarChart.tsx
│       │       ├── TransitDelayDailyBarChart.tsx
│       │       └── TransitDelayStackedBarChart.tsx
│       ├── hooks/
│       │   ├── useOpsDashboardFilters.ts   # Filter management hook
│       │   └── useOpsDashboardData.ts      # Data fetching hook
│       ├── utils/
│       │   ├── tableDataTransformers.ts     # API → table format
│       │   └── cityColorUtils.ts            # City color mapping
│       └── index.ts                         # Feature exports
└── components/
    └── charts/
        ├── CircularProgress.tsx             # Generic circular progress
        ├── DailyBarChart.tsx                # Generic daily bar chart
        └── StackedBarChart.tsx              # Generic stacked bar chart
```

## API Endpoints

1. **KAM EOD Report**: `GET /api/inventory/getKAMEodReport`
2. **Transit Plan Summary**: `GET /api/transit-plan/getTransitPlanDispatchPickupSummary`
3. **QC EOD Report**: `GET /api/inventory/getQCEodReport`
4. **Dispatch Delay Report**: `GET /api/inventory/getDispatchDelayReport`
5. **Shift Status Report**: `GET /api/shift/getShiftStatusReport`

## Common Patterns

### Filter Persistence
Dates are persisted to localStorage:
- Key: `'ops-dashboard-filters'`
- Saved when dates change
- Loaded on component mount

### City Filter Visibility
City filter only shows for user types 1, 2, 3, or 4:
- Checked in `useOpsDashboardFilters.ts`
- Used to conditionally render city dropdown

### API City ID Logic
When "All" cities is selected:
- `apiCityId` is `undefined`
- API calls don't include `city_ids` parameter
- API returns data for all cities

### Dual UI Modes
Metrics sections have two modes:
- **Single City**: Circular progress + daily bar chart per city
- **All Cities**: Stacked bar chart with all cities

Determined by `showCityFilter` and `selectedCity` props.

