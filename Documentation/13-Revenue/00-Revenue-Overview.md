# Revenue Overview

## What is Revenue?

The Revenue feature provides monthly revenue estimation and tracking functionality for washing facilities. It allows users to create, view, and edit revenue estimates with weekly actuals, helping track projected vs actual revenue performance.

## Why Do We Need It?

- **Revenue Planning**: Create monthly revenue estimates for budgeting and planning
- **Performance Tracking**: Compare projected vs actual revenue by week
- **Cost Management**: Track various costing types (Manpower, Electricity, Water, etc.)
- **Client-Level Tracking**: Monitor on-site manpower costs per client
- **Data Persistence**: Save work in progress and resume later
- **Historical Analysis**: View and edit past revenue estimates

## How It Works

The Revenue feature consists of **three pages** that work together:

1. **Add Page** - Create new monthly revenue estimates
2. **List Page** - View all revenue estimates in a table format
3. **Edit Page** - Edit existing revenue estimates with weekly actuals

### High-Level Flow

#### Add Page Flow
1. User selects **Month**, **Year**, and **Facility** from filters
2. System loads costing types and on-site manpower clients
3. If data exists for selected month/year/facility, it's pre-populated
4. User enters budget values and on-site manpower estimates
5. Data is saved to Redux (persisted to localStorage)
6. On submit, data is sent to API
7. User is redirected to List page

#### List Page Flow
1. User selects **Month**, **Year**, **Facility**, and optionally **Cost Category**
2. System fetches revenue listing data
3. Data is displayed in a table with columns for each week
4. User can click "Edit" button on any row
5. User is redirected to Edit page with URL parameters

#### Edit Page Flow
1. Page reads `month`, `year`, `facility_id` from URL parameters
2. System fetches revenue data from API (always fresh)
3. Data is displayed in two editable tables:
   - Budget table (weekly actuals for each costing type)
   - On-site manpower table (weekly actuals for each client)
4. User edits values
5. Changes are saved to Redux (persisted to localStorage)
6. On submit, updates are sent to API
7. User is redirected back to List page

## Pages

### MonthlyEstimateAdd (`src/pages/MonthlyEstimateAdd.tsx`)
**Purpose**: Create new monthly revenue estimates

**Sections**:
1. **Page Header** - "Add Monthly Estimate" title
2. **Filters** - Month, Year, Facility dropdowns + Search button
3. **Costing Budget Table** - 2-column table (Costing Type, Budget)
4. **On-Site Manpower Table** - Client listing with estimates
5. **Submit Button** - Saves data to API

**Key Features**:
- Redux persistence (survives page refresh)
- Auto-populates from existing data if available
- Validates all required fields before submit

### MonthlyEstimateList (`src/pages/MonthlyEstimateList.tsx`)
**Purpose**: View all revenue estimates in a table

**Sections**:
1. **Page Header** - "Monthly Estimate Listing" title
2. **Filters** - Month, Year, Facility, Cost Category dropdowns + Search button
3. **Revenue Table** - Shows all revenue records with weekly columns
4. **Edit Button** - On each row, navigates to Edit page

**Key Features**:
- Filterable by cost category
- Color-coded week columns
- Summary columns (Total Actual, Total Delta)
- Edit functionality

### MonthlyEstimateEdit (`src/pages/MonthlyEstimateEdit.tsx`)
**Purpose**: Edit existing revenue estimates with weekly actuals

**Sections**:
1. **Page Header** - "Monthly Actuals" title
2. **Budget Table** - Editable weekly actuals for each costing type
3. **On-Site Manpower Table** - Editable weekly actuals for each client
4. **Submit Button** - Updates data via API

**Key Features**:
- Always loads fresh data from API (no cached data)
- Redux persistence for user edits (survives page refresh)
- Two separate editable tables
- Validates data before submit

## File Locations

### Main Pages
- `src/pages/MonthlyEstimateAdd.tsx` - Add page component
- `src/pages/MonthlyEstimateList.tsx` - List page component
- `src/pages/MonthlyEstimateEdit.tsx` - Edit page component

### Feature Code
- `src/features/revenue/components/RevenueFilters.tsx` - List page filters
- `src/features/revenue/components/RevenueAddFilters.tsx` - Add page filters
- `src/features/revenue/components/CostingBudgetTable.tsx` - Budget table (Add page)
- `src/features/revenue/components/OnSiteManPowerTable.tsx` - Manpower table (Add page)
- `src/features/revenue/components/EditableBudgetTable.tsx` - Editable budget table (Edit page)
- `src/features/revenue/components/EditableOnSiteManPowerTable.tsx` - Editable manpower table (Edit page)
- `src/features/revenue/hooks/useRevenueFilters.ts` - Filter management hook
- `src/features/revenue/hooks/useRevenueListingData.ts` - Listing data hook
- `src/features/revenue/hooks/useReviewCostingTypes.ts` - Costing types hook
- `src/features/revenue/hooks/useProjectedCosting.ts` - Projected costing hook
- `src/features/revenue/hooks/useOnSiteManPowerClients.ts` - Manpower clients hook

### API Service
- `src/services/pAndLApi.ts` - Revenue API service methods

### Redux Store
- `src/store/slices/revenueSlice.ts` - Redux slice with persistence logic
- `src/store/index.ts` - Redux Persist configuration

## Key Components

### RevenueFilters Component
**Location**: `src/features/revenue/components/RevenueFilters.tsx`

**Purpose**: Filter inputs for List page

**Filters**:
- Month dropdown
- Year dropdown
- Facility dropdown (auto-selects first)
- Cost Category dropdown (optional, includes "All" option)
- Search button

### RevenueAddFilters Component
**Location**: `src/features/revenue/components/RevenueAddFilters.tsx`

**Purpose**: Filter inputs for Add page

**Filters**:
- Month dropdown
- Year dropdown
- Facility dropdown (auto-selects first)
- Search button
- **Note**: No Cost Category filter (not needed for Add page)

### CostingBudgetTable Component
**Location**: `src/features/revenue/components/CostingBudgetTable.tsx`

**Purpose**: Display and edit budget values for each costing type

**Columns**:
- Costing Type (left-aligned)
- Budget (right-aligned, editable input)
- Total row at bottom

### OnSiteManPowerTable Component
**Location**: `src/features/revenue/components/OnSiteManPowerTable.tsx`

**Purpose**: Display and edit on-site manpower estimates per client

**Columns**:
- Client Name (left-aligned)
- Estimate (right-aligned, editable input)
- Total row at bottom

### EditableBudgetTable Component
**Location**: `src/features/revenue/components/EditableBudgetTable.tsx`

**Purpose**: Display and edit weekly actuals for budget items

**Columns**:
- Budget (Costing Type name)
- Estimate (read-only)
- W1, W2, W3, W4 (editable inputs, center-aligned headers)
- Total row at bottom

### EditableOnSiteManPowerTable Component
**Location**: `src/features/revenue/components/EditableOnSiteManPowerTable.tsx`

**Purpose**: Display and edit weekly actuals for on-site manpower

**Columns**:
- Client (client name)
- Estimate (read-only)
- W1, W2, W3, W4 (editable inputs, center-aligned headers)
- Total row at bottom

## Redux State Structure

### Revenue Slice State
```typescript
{
  budgets: Record<number, string>;  // costing_type_id -> budget value
  onSiteManPowerEstimates: Record<number, string>;  // client_id -> estimate value
  lastUpdated: {
    date_year: string | null;
    facility_id: number | null;
  };
  editBudgetWeekValues: Record<number, { week1: string; week2: string; week3: string; week4: string }>;  // record_id -> week values
  editManPowerWeekValues: Record<number, { week1: string; week2: string; week3: string; week4: string }>;  // client_id -> week values
  editLastUpdated: {
    month: string | null;
    year: string | null;
    facility_id: string | null;
  };
}
```

### Persisted Fields
All fields are persisted to localStorage via Redux Persist:
- `budgets` - For Add page
- `onSiteManPowerEstimates` - For Add page
- `lastUpdated` - For Add page (tracks when data was fetched)
- `editBudgetWeekValues` - For Edit page
- `editManPowerWeekValues` - For Edit page
- `editLastUpdated` - For Edit page (tracks filters for persisted data)

## API Endpoints

### 1. Get Cost Categories
**Endpoint**: `GET /api/review/getCostCategories?status=1`
**Used in**: List page filter
**Response**: Array of cost category objects

### 2. Get Review Costing Types
**Endpoint**: `GET /api/review/getReviewCostingType?page=1&limit=22&showAll=true`
**Used in**: Add page (populates budget table)
**Response**: Array of costing type objects

### 3. Get Projected Costing
**Endpoint**: `GET /api/review/getProjectedCosting?date_year=YYYY-MM-01&facility_id=ID`
**Used in**: Add page (pre-populates existing data)
**Response**: Array of projected costing items + on-site manpower results

### 4. Get On-Site Manpower Clients
**Endpoint**: `GET /api/review/getOnSiteManPowerClients?facility_id=ID`
**Used in**: Add page (populates manpower table)
**Response**: Array of client objects

### 5. Get Revenue Listing
**Endpoint**: `GET /api/review/getRevenue?city_id=ID&facility_id=ID&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&page=1&limit=100&allResults=true`
**Used in**: List page and Edit page
**Response**: Nested structure with cities, facilities, monthYearData, records, and onSiteManPowerDetails

### 6. Add Projected Actual Costing
**Endpoint**: `POST /api/review/addProjectedActualCosting`
**Used in**: Add page submit
**Request Body**: `{ projectedValues: [...], date_year: "YYYY-MM-01", facility_id: ID, onSiteManPower_clients: [...] }`

### 7. Update Revenue
**Endpoint**: `PUT /api/review/updateRevenue`
**Used in**: Edit page submit
**Request Body**: `{ weeklyValue: [...], onSiteManPowerDetails: [...] }`
**Note**: Week values can be `number | null` (null for empty/zero values)

## Navigation Flow

1. **User navigates to Add page** → `/revenue/monthly-estimate/add`
2. **User fills form and submits** → Redirects to List page
3. **User clicks Edit button** → Navigates to Edit page with URL params: `/revenue/monthly-estimate/edit?month=X&year=Y&facility_id=Z`
4. **User edits and submits** → Redirects back to List page

## Data Flow

### Add Page Data Flow
1. Page loads → Fetch costing types and clients
2. Filters change → Fetch projected costing (if exists)
3. User enters data → Save to Redux state (persisted)
4. User submits → Send to API → Clear persisted data → Navigate to List

### List Page Data Flow
1. Page loads → Fetch revenue listing
2. Filters change → Refetch revenue listing
3. User clicks Edit → Navigate with URL params

### Edit Page Data Flow
1. Page loads → Read URL params → Fetch revenue data (always fresh)
2. API data arrives → Populate form fields
3. User edits → Save to Redux state (persisted)
4. User submits → Send updates to API → Clear persisted data → Navigate to List

