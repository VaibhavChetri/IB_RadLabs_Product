# Escalation Type - Overview

## What is Escalation Type?

Escalation Type is an admin feature that allows users to manage escalation/complaint types used in QC Rejection and Client Escalation features. It provides CRUD (Create, Read, Update, Delete) operations for escalation types with filtering and status management.

## Why Does It Exist?

- **Centralized Management**: Single place to manage all escalation/complaint types
- **Data Integrity**: Ensures consistent escalation type names
- **Status Control**: Enable/disable escalation types without deleting them
- **Reusability**: Used across multiple features (QC Rejection, Client Escalation)

## Key Features

1. **Listing Page** - View all escalation types with filters
2. **Add Modal** - Create new escalation types
3. **Edit Modal** - Update existing escalation types and their status
4. **Filtering** - Filter by status (All, Active, Inactive)
5. **URL State** - Shareable/bookmarkable filter state
6. **Optimistic Updates** - Instant UI feedback

## Page Sections

### 1. Header Section
- Page title with total count
- Location name (from user's city)
- "Add Escalation Type" button (opens modal)

### 2. Filter Section
- **Status dropdown**:
  - Options: "All", "Active", "Inactive"
  - Options from constants (`STATUS_OPTIONS`)
  - Auto-triggers API call when changed (debounced 300ms)
  - Value stored in URL param `status`
  - Client-side filtering applied after API response

- **No Search Button**: Filters auto-trigger via React Query dependencies

### 3. Table Section
- **Table Component**: Uses `Table` from `src/components/ui/DataDisplay.tsx`
- **Columns**:
  - **Serial Number**: Row index (1-based)
  - **Escalation Type Name**: Name of the escalation type
  - **Status**: Badge showing Active/Inactive
  - **Actions**: Edit button (opens modal)

## File Locations

### Pages
- **Main Page**: `src/pages/ops-admin/escalations/EscalationType.tsx`

### Features
- **Feature Code**: `src/features/escalation-type/`
- **Modal Component**: `src/features/escalation-type/components/EscalationTypeModal.tsx`
- **Data Hook**: `src/features/escalation-type/hooks/useEscalationTypeData.ts`
- **Mutations Hook**: `src/features/escalation-type/hooks/useEscalationTypeMutations.ts`
- **URL Filters Hook**: `src/features/escalation-type/hooks/useURLFilters.ts`
- **Table Columns**: `src/features/escalation-type/config/tableColumns.tsx`
- **Constants**: `src/features/escalation-type/config/constants.ts`

### Services
- **API Service**: `src/services/transitPlanApi.ts` (EscalationTypeService class)

## Key Concepts

### Status Management
- Status stored as string: `'Active'` or `'Inactive'`
- API expects numeric: `1` (Active) or `0` (Inactive)
- Conversion happens in mutation hooks

### Client-Side Filtering
- API returns all escalation types
- Status filter applied client-side after API response
- Prevents unnecessary API calls

### URL State Sync
- Filter values stored in URL params
- Shareable links: `/ops-admin/escalations/escalation-type?status=Active`
- Browser back/forward navigation works correctly

## Related Features

- **QC Rejection**: Uses escalation types as rejection reasons
- **Client Escalation**: Uses escalation types for escalation categorization

