# Ops Dashboard Overview

## What is This?

The Ops Dashboard shows operational metrics and reports for cities. It displays:
- **Facility Report Table**: Metrics by city (facility report, QC rejection, transit delay, washing efficiency, transit plan filled, driver checkin, KAM EOD report)
- **KAM Metrics**: Circular progress indicators and daily/stacked bar charts for KAM entry data
- **Sent Transit Metrics**: Circular progress indicators and daily/stacked bar charts for sent transit plan data
- **Transit Delay Metrics**: Circular progress indicators and daily/stacked bar charts for transit delay data

## Why Do We Need This?

Users need to see:
- Operational performance across cities
- Daily trends and patterns
- Data filtered by date range, city, and client
- Visual representations (circular progress, bar charts) for quick insights

This helps operations teams make better decisions about resource allocation and performance monitoring.

## How It Works

1. User opens Ops Dashboard page
2. Page shows filters at top:
   - Start Date (persisted in localStorage)
   - End Date (persisted in localStorage)
   - City dropdown (only visible for user types 1, 2, 3, or 4)
   - Client dropdown (based on selected city or user's city)
   - Search button
3. On page load, dates are loaded from localStorage (or defaults to current date)
4. When dates are set, APIs automatically fetch data (5 APIs in parallel)
5. Page shows body content:
   - **Table**: Facility report metrics by city (always at top)
   - **KAM Metrics**: Circular progress + daily/stacked bar charts
   - **Sent Transit Metrics**: Circular progress + daily/stacked bar charts
   - **Transit Delay Metrics**: Circular progress + daily/stacked bar charts
6. When "All" cities selected: Shows stacked bar charts
7. When single city selected: Shows individual circular progress + daily bar chart per city

## What Pages Are There?

### Ops Dashboard Page
- Shows "Ops Dashboard" as the title
- Has four filters: Start Date, End Date, City (conditional), Client
- Shows body content (table + metrics sections) below filters
- Dates persist in localStorage
- City filter only visible for user types 1, 2, 3, or 4

## Where Does Data Go?

- **Page**: Shows the filters and content
- **Custom Hooks**: Handle all the logic (loading data, managing filters)
- **API Service**: Gets data from 5 endpoints
- **Redux Store**: Stores user information (which city they belong to, user type)
- **localStorage**: Persists date filters

## Files in Code

### Main Page File
- `src/pages/OpsDashboard.tsx` - The main page that shows everything

### Feature Folder
- `src/features/ops-dashboard/` - All ops dashboard code organized here

### Components

#### Filter Components
- `src/features/ops-dashboard/components/OpsDashboardFilters.tsx` - The filter inputs (dates, city, client, search button)

#### Content Components
- `src/features/ops-dashboard/components/OpsDashboardContent.tsx` - Container for table and metrics sections
- `src/features/ops-dashboard/components/OpsDashboardTable.tsx` - The facility report table

#### Metrics Components (Orchestrators)
- `src/features/ops-dashboard/components/metrics/KAMMetrics.tsx` - KAM metrics section (circular progress + charts)
- `src/features/ops-dashboard/components/metrics/SentTransitMetrics.tsx` - Sent transit metrics section
- `src/features/ops-dashboard/components/metrics/TransitDelayMetrics.tsx` - Transit delay metrics section

#### Chart Components (Feature-Specific Wrappers)
- `src/features/ops-dashboard/components/charts/KAMDailyBarChart.tsx` - Transforms KAM data for generic DailyBarChart
- `src/features/ops-dashboard/components/charts/KAMStackedBarChart.tsx` - Transforms KAM data for generic StackedBarChart
- `src/features/ops-dashboard/components/charts/SentTransitDailyBarChart.tsx` - Transforms sent transit data for generic DailyBarChart
- `src/features/ops-dashboard/components/charts/SentTransitStackedBarChart.tsx` - Transforms sent transit data for generic StackedBarChart
- `src/features/ops-dashboard/components/charts/TransitDelayDailyBarChart.tsx` - Transforms transit delay data for generic DailyBarChart
- `src/features/ops-dashboard/components/charts/TransitDelayStackedBarChart.tsx` - Transforms transit delay data for generic StackedBarChart

### Generic Chart Components (Shared)
- `src/components/charts/CircularProgress.tsx` - Generic circular progress component
- `src/components/charts/DailyBarChart.tsx` - Generic daily bar chart component (uses Recharts)
- `src/components/charts/StackedBarChart.tsx` - Generic stacked bar chart component (uses ApexCharts)

**Why Generic Components?** (Industry Standard Pattern)
- ✅ **Reusability**: Generic components can be used across multiple features
- ✅ **Maintainability**: Fix bugs or add features once, benefits all features
- ✅ **Testability**: Generic components are easier to test in isolation
- ✅ **Consistency**: Same chart behavior and styling across the app
- ✅ **Separation of Concerns**: Generic components handle rendering, feature wrappers handle data transformation

**Pattern**: Generic components live in `src/components/charts/` (shared), feature-specific wrappers in `src/features/ops-dashboard/components/charts/` (transforms API data → generic format)

See: [Component Development Standards - Separation of Concerns](../COMPONENT_DEVELOPMENT_STANDARDS.md#3-separation-of-concerns) | [Detailed Pattern Explanation](./01-Ops-Dashboard-How-It-Works.md#industry-standard-chart-component-separation-pattern)

### Hooks
- `src/features/ops-dashboard/hooks/useOpsDashboardFilters.ts` - Filter logic (loading clients, cities, persisting dates)
- `src/features/ops-dashboard/hooks/useOpsDashboardData.ts` - Fetches all 5 APIs using React Query

### Utils
- `src/features/ops-dashboard/utils/tableDataTransformers.ts` - Transforms API responses into table-ready format
- `src/features/ops-dashboard/utils/cityColorUtils.ts` - Maps city_id (1-20) to predefined colors for consistent chart colors

### API Service
- `src/services/opsDashboardApi.ts` - API service for all 5 endpoints:
  - `getKAMEodReport` - KAM EOD report
  - `getTransitPlanDispatchPickupSummary` - Transit plan summary
  - `getQCEodReport` - QC EOD report
  - `getDispatchDelayReport` - Dispatch delay report
  - `getShiftStatusReport` - Shift status report

### Exports
- `src/features/ops-dashboard/index.ts` - Makes it easy to import things

## Sections in the Dashboard

1. **Filters Section** (Top)
   - Date range inputs
   - City dropdown (conditional)
   - Client dropdown
   - Search button

2. **Table Section** (Always First)
   - Facility Report (Day/Night metrics)
   - QC Rejection (shows "--")
   - Transit Delay (Day/Night metrics)
   - Washing Efficiency (Sent only)
   - Transit Plan Filled (avgDelay)
   - Driver Checkin (shows "--")
   - KAM EOD Report (Days entered)

3. **KAM Metrics Section**
   - Circular progress indicators (one per city or all cities)
   - Daily bar chart (single city) or Stacked bar chart (all cities)

4. **Sent Transit Metrics Section**
   - Circular progress indicators (one per city or all cities)
   - Daily bar chart (single city) or Stacked bar chart (all cities)

5. **Transit Delay Metrics Section**
   - Circular progress indicators (one per city or all cities)
   - Daily bar chart (single city) or Stacked bar chart (all cities)

