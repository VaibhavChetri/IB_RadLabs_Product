# Dashboard (Inventory Analysis) Overview

## What is This?

The Dashboard shows inventory analysis data. Users can see statistics and reports about inventory based on filters they choose.

## Why Do We Need This?

Users need to see:
- How much inventory they have
- Trends over time
- Data filtered by month, client, and facility

This helps them make better decisions about inventory management.

## How It Works

1. User opens Dashboard page
2. Page shows filters at top (Month, Client, Facility)
3. User can change filters
4. Page shows analysis data below:
   - 5 stat cards showing key metrics (Total Container Units, Average Container Units, Plastic Saved, Water Saved, GHG Emissions Reduced)
   - Chart showing SKU count trend over time (can view by week or month)
5. When filters change, data automatically refreshes

## What Pages Are There?

### Dashboard Page
- Shows "Inventory Analysis" as the title
- Has three filters: Month, Client, Washing Facility
- Shows body content (chart/statistics) below filters
- Month is set to current month by default
- Client defaults to "All" to show all clients

## Where Does Data Go?

- **Page**: Shows the filters and content
- **Custom Hook**: Handles all the logic (loading data, managing filters)
- **API**: Gets client and facility lists from server
- **Redux Store**: Stores user information (which city they belong to)

## Files in Code

### Main Page File
- `src/pages/Dashboard.tsx` - The main page that shows everything

### Feature Folder
- `src/features/dashboard/` - All dashboard code organized here

### Components
- `src/features/dashboard/components/DashboardFilters.tsx` - The three filter dropdowns
- `src/features/dashboard/components/DashboardContent.tsx` - Container for stats and chart
- `src/features/dashboard/components/DashboardStats.tsx` - The 5 stat cards
- `src/features/dashboard/components/DashboardChart.tsx` - The SKU count trend chart

### Hooks
- `src/features/dashboard/hooks/useDashboardFilters.ts` - Filter logic (loading clients, facilities)
- `src/features/dashboard/hooks/useDashboardDataQuery.ts` - Fetches dashboard data (stats + chart) using React Query
- `src/features/dashboard/hooks/useChartData.ts` - Transforms chart data for weekly/monthly views

### Config & Utils
- `src/features/dashboard/config/constants.ts` - Fixed values like month names
- `src/features/dashboard/config/chartConstants.ts` - Chart styling constants (margins, fonts, colors)
- `src/features/dashboard/utils/dateUtils.ts` - Date calculation helpers (month ranges, day extraction)
- `src/features/dashboard/utils/dataTransformers.ts` - Data transformation functions (API → stats, API → chart data)

### Exports
- `src/features/dashboard/index.ts` - Makes it easy to import things

