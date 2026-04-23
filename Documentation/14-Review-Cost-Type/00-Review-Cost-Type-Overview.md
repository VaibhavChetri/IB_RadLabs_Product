# Review Cost Type - Overview

## What is Review Cost Type?

Review Cost Type is an admin feature that allows users to manage cost types used in the Revenue module. It provides CRUD (Create, Read, Update, Delete) operations for cost types with filtering, pagination, and status management.

## Why Does It Exist?

- **Centralized Management**: Single place to manage all cost types
- **Data Integrity**: Ensures consistent cost type names and categories
- **Status Control**: Enable/disable cost types without deleting them
- **Category Organization**: Group cost types by categories

## Key Features

1. **Listing Page** - View all cost types with filters and pagination
2. **Add Modal** - Create new cost types
3. **Edit Modal** - Update existing cost types and their status
4. **Filtering** - Filter by cost category and status
5. **Pagination** - Navigate through large datasets
6. **URL State** - Shareable/bookmarkable filter state
7. **Optimistic Updates** - Instant UI feedback

## Page Sections

### 1. Header Section
- Page title with total count (`totalItems` from pagination)
- "Add Cost Type" button (opens modal)

### 2. Filter Section
- **Cost Category dropdown**:
  - Includes "All" option (value: `''`) to show all categories
  - Options loaded from API (`getCostCategories`)
  - Shows skeleton while loading
  - Auto-triggers API call when changed (debounced 300ms)
  - Value stored in URL param `costCategoryId`
  
- **Status dropdown**:
  - Options: "All", "Active", "Inactive"
  - Options from constants (`STATUS_OPTIONS`)
  - Auto-triggers API call when changed (debounced 300ms)
  - Value stored in URL param `status`

- **No Search Button**: Filters auto-trigger via React Query dependencies

### 3. Table Section
- **Table Component**: Uses `Table` from `src/components/ui/DataDisplay.tsx`
- **Columns**:
  - **Actions**: Edit button (center-aligned, green icon)
  - **Serial Number**: Calculated as `(page - 1) * pageSize + index + 1`
  - **Cost Type**: Name field (center-aligned, bold font)
  - **Cost Category**: Category name (center-aligned)
  - **Status**: Badge with color coding (green for Active, red for Inactive)
- **Loading State**: Shows `TableSkeleton` while data is loading
- **Empty State**: Handled by `Table` component
- **Styling**: `size='sm'` for compact table, center-aligned columns

### 4. Pagination Section
- **Page Navigation**: Shows current page, total pages
- **Items Per Page**: Dropdown to change page size (10, 20, 50, 100)
- **Total Items**: Displayed in header and pagination component
- **URL Sync**: Page number stored in URL param `page`

### 5. Modal (Add/Edit)
- **Add Mode**: 
  - Cost Type name input (required)
  - Cost Category dropdown (required)
  - No status dropdown (defaults to Active)
  
- **Edit Mode**:
  - Cost Type name input (pre-filled, required)
  - Cost Category dropdown (pre-filled, required)
  - Status dropdown (pre-filled, required)

- **Form Validation**: Shows inline errors for required fields
- **Submit**: Uses React Query mutations with optimistic updates

## File Locations

### Main Page
- **File**: `src/pages/ReviewCostType.tsx`
- **Purpose**: Main listing page component

### Feature Components
- **Directory**: `src/features/review-cost-type/`
- **Components**: `components/ReviewCostTypeModal.tsx`
- **Hooks**: `hooks/useReviewCostTypeData.ts`, `hooks/useReviewCostTypeMutations.ts`, `hooks/useCostCategories.ts`, `hooks/useURLFilters.ts`
- **Config**: `config/constants.ts`, `config/tableColumns.tsx`

### Shared Utilities
- **Debounce Hook**: `src/hooks/useDebounce.ts`
- **Skeleton Components**: `src/components/ui/Skeleton.tsx`

## API Endpoints

### Listing
- **GET** `/api/review/getReviewCostingType`
- **Query Params**: `page`, `limit`, `showAll`, `reviewCategoryTypeId`, `status`

### Add
- **POST** `/api/review/addReviewCostingType`
- **Body**: `{ name: string, reviewCategoryTypeId: number }`

### Update
- **PUT** `/api/review/updateReviewCostingType`
- **Body**: `{ id: number, name: string, reviewCategoryTypeId: number, status: number }`

### Cost Categories (for dropdown)
- **GET** `/api/review/getCostCategories`
- **Query Params**: `status`

## Data Flow

1. **Page Load** → Fetch cost categories → Fetch listing data
2. **Filter Change** → Debounce (300ms) → Update URL → Trigger API call
3. **Add/Edit** → Optimistic update → API call → Success/Error handling
4. **Pagination** → Update URL → Trigger API call

## Technology Stack

- **React Query** - Server state management
- **React Router** - URL state management
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Custom Hooks** - Reusable logic

## Status Values

- **Active**: `'1'` - Cost type is enabled
- **Inactive**: `'0'` - Cost type is disabled
- **All**: `''` - Show all statuses (filter option)

## Related Features

- **Revenue Module** - Uses cost types for revenue tracking
- **P&L Module** - Uses cost types for profit/loss calculations

---

**Next**: Read [How It Works](./01-Review-Cost-Type-How-It-Works.md) for detailed execution flow.

