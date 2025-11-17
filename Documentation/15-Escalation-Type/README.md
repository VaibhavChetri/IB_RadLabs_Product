# Escalation Type - Admin Page Documentation

**Status**: ✅ Production Ready  
**Last Updated**: 2025-01-XX  
**Owner**: Development Team

## 📋 Quick Links

- [Overview](./00-Escalation-Type-Overview.md) - What is Escalation Type and why it exists
- [How It Works](./01-Escalation-Type-How-It-Works.md) - Step-by-step execution flow
- [API Reference](./02-Escalation-Type-API-Reference.md) - API endpoints and interfaces

## 🎯 Purpose

Escalation Type is an admin feature that allows users to manage escalation/complaint types used in QC Rejection and Client Escalation features. It provides CRUD operations with filtering and status management.

## 🏗️ Architecture Highlights

### Modern React Patterns Used

1. **React Query** - Server state management with caching and automatic refetching
2. **URL State Sync** - Filters stored in URL for shareable/bookmarkable state
3. **Debounced Filters** - Prevents rapid API calls while user is changing filters
4. **Optimistic Updates** - Instant UI feedback with automatic rollback on error
5. **Loading Skeletons** - Better UX than generic spinners
6. **Custom Hooks** - Separation of concerns, reusability, testability

### File Structure

```
src/
├── pages/
│   └── ops-admin/
│       └── escalations/
│           └── EscalationType.tsx              # Main page component
├── features/
│   └── escalation-type/
│       ├── components/
│       │   └── EscalationTypeModal.tsx         # Add/Edit modal
│       ├── hooks/
│       │   ├── useEscalationTypeData.ts        # React Query hook for listing
│       │   ├── useEscalationTypeMutations.ts   # React Query mutations (add/edit)
│       │   └── useURLFilters.ts                # URL state management hook
│       ├── config/
│       │   ├── constants.ts                     # Status options, constants
│       │   └── tableColumns.tsx                 # Table column definitions
│       └── index.ts                             # Barrel exports
└── services/
    └── transitPlanApi.ts                        # API service methods
```

## 🚀 Key Features

### 1. Auto-Triggering Filters
- No "Search" button needed
- Filters automatically trigger API calls via React Query dependencies
- Debounced to prevent excessive calls (300ms delay)
- Filters stored in URL for shareability

### 2. Table Implementation
- Uses generic `Table` component from `src/components/ui/DataDisplay.tsx`
- Column definitions extracted to `tableColumns.tsx` for maintainability
- Memoized columns to prevent unnecessary re-renders
- Loading skeletons (`TableSkeleton`) instead of generic spinners
- Center-aligned columns for consistent styling
- Status badges with color coding

### 3. Filter Patterns
- **Status Filter**: `FloatingDropdown` component
- **"All" Option**: Always included to clear filters
- **Static Options**: From constants (`STATUS_OPTIONS`)
- **Client-Side Filtering**: Status filter applied after API response

### 4. URL State Management
- All filters stored in URL params
- Shareable links (e.g., `/ops-admin/escalations/escalation-type?status=Active`)
- Browser back/forward navigation works correctly
- Filters persist across page refreshes

### 5. Optimistic Updates
- UI updates immediately on add/edit
- Automatic rollback if API call fails
- Better perceived performance

## 📚 Documentation Files

1. **[00-Escalation-Type-Overview.md](./00-Escalation-Type-Overview.md)**  
   High-level overview, purpose, and key concepts

2. **[01-Escalation-Type-How-It-Works.md](./01-Escalation-Type-How-It-Works.md)**  
   Detailed execution flow, data fetching, and user interactions

3. **[02-Escalation-Type-API-Reference.md](./02-Escalation-Type-API-Reference.md)**  
   API endpoints, request/response structures, error handling

## 🎓 Learning Path

1. **Start Here**: Read [Overview](./00-Escalation-Type-Overview.md) to understand the feature
2. **Understand Flow**: Read [How It Works](./01-Escalation-Type-How-It-Works.md) for execution details
3. **Reference APIs**: Check [API Reference](./02-Escalation-Type-API-Reference.md) when integrating

## 📝 Quick Reference

### Key Hooks

- `useEscalationTypeData` - Fetch listing data with filters
- `useEscalationTypeMutations` - Add/Update operations with optimistic updates
- `useURLFilters` - URL state management
- `useDebounce` - Debounce filter changes

### Key Components

- `EscalationType` - Main page component
- `EscalationTypeModal` - Add/Edit modal
- `TableSkeleton` - Loading skeleton for tables

### Key Files

- `constants.ts` - Status options, constants
- `tableColumns.tsx` - Table column definitions
- `useURLFilters.ts` - URL state sync logic

---

**Related Features**: QC Rejection, Client Escalation

