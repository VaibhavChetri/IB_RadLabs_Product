# Review Cost Type - Admin Page Template

**Status**: ✅ Production Ready  
**Last Updated**: 2025-01-XX  
**Owner**: Development Team

## 📋 Quick Links

- [Overview](./00-Review-Cost-Type-Overview.md) - What is Review Cost Type and why it exists
- [How It Works](./01-Review-Cost-Type-How-It-Works.md) - Step-by-step execution flow
- [Implementation Guide](./02-Review-Cost-Type-Implementation-Guide.md) - **Template for future admin pages**
- [API Reference](./03-Review-Cost-Type-API-Reference.md) - API endpoints and interfaces

## 🎯 Purpose

This documentation serves as a **reference template** for implementing future admin pages (CRUD operations with listing, filters, pagination, add/edit modals).

## 🏗️ Architecture Highlights

### Modern React Patterns Used

1. **React Query** - Server state management with caching and automatic refetching
2. **URL State Sync** - Filters and pagination stored in URL for shareable/bookmarkable state
3. **Debounced Filters** - Prevents rapid API calls while user is changing filters
4. **Optimistic Updates** - Instant UI feedback with automatic rollback on error
5. **Loading Skeletons** - Better UX than generic spinners
6. **Custom Hooks** - Separation of concerns, reusability, testability

### File Structure

```
src/
├── pages/
│   └── ReviewCostType.tsx              # Main page component
├── features/
│   └── review-cost-type/
│       ├── components/
│       │   └── ReviewCostTypeModal.tsx # Add/Edit modal
│       ├── hooks/
│       │   ├── useReviewCostTypeData.ts      # React Query hook for listing
│       │   ├── useReviewCostTypeMutations.ts # React Query mutations (add/edit)
│       │   ├── useCostCategories.ts           # React Query hook for dropdown options
│       │   └── useURLFilters.ts              # URL state management hook
│       ├── config/
│       │   ├── constants.ts                  # Status options, constants
│       │   └── tableColumns.tsx              # Table column definitions
│       └── index.ts                          # Barrel exports
├── hooks/
│   └── useDebounce.ts                        # Reusable debounce hook
└── components/
    └── ui/
        └── Skeleton.tsx                      # Loading skeleton components
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
- **Dropdown Filters**: `FloatingDropdown` components
- **"All" Option**: Always included to clear filters
- **Dynamic Options**: Loaded from API (e.g., cost categories)
- **Static Options**: From constants (e.g., status options)
- **Error Handling**: Shows error state in dropdown
- **Loading States**: Shows skeleton while loading options

### 4. URL State Management
- All filters and pagination stored in URL params
- Shareable links (e.g., `/review-cost-type?status=1&page=2&costCategoryId=1`)
- Browser back/forward navigation works correctly
- Filters persist across page refreshes

### 5. Optimistic Updates
- UI updates immediately on add/edit
- Automatic rollback if API call fails
- Better perceived performance

### 6. Loading States
- Skeleton screens for better UX
- Separate skeletons for filters (`FilterSkeleton`) and table (`TableSkeleton`)
- No generic spinners

## 📚 Documentation Files

1. **[00-Review-Cost-Type-Overview.md](./00-Review-Cost-Type-Overview.md)**  
   High-level overview, purpose, and key concepts

2. **[01-Review-Cost-Type-How-It-Works.md](./01-Review-Cost-Type-How-It-Works.md)**  
   Detailed execution flow, data fetching, and user interactions

3. **[02-Review-Cost-Type-Implementation-Guide.md](./02-Review-Cost-Type-Implementation-Guide.md)**  
   **⭐ Template guide for implementing future admin pages**

4. **[03-Review-Cost-Type-API-Reference.md](./03-Review-Cost-Type-API-Reference.md)**  
   API endpoints, request/response structures, error handling

## 🎓 Learning Path

1. **Start Here**: Read [Overview](./00-Review-Cost-Type-Overview.md) to understand the feature
2. **Understand Flow**: Read [How It Works](./01-Review-Cost-Type-How-It-Works.md) for execution details
3. **Build Your Own**: Follow [Implementation Guide](./02-Review-Cost-Type-Implementation-Guide.md) as a template
4. **Reference APIs**: Check [API Reference](./03-Review-Cost-Type-API-Reference.md) when integrating

## 🔄 Reusable Patterns

This implementation provides reusable patterns for:

- ✅ CRUD operations with listing page
- ✅ Filtered and paginated tables
- ✅ Add/Edit modals
- ✅ URL state synchronization
- ✅ Optimistic updates
- ✅ Loading skeletons
- ✅ Error handling with rollback

## 📝 Quick Reference

### Key Hooks

- `useReviewCostTypeData` - Fetch listing data with filters
- `useReviewCostTypeMutations` - Add/Update operations with optimistic updates
- `useURLFilters` - URL state management
- `useDebounce` - Debounce filter changes

### Key Components

- `ReviewCostType` - Main page component
- `ReviewCostTypeModal` - Add/Edit modal
- `TableSkeleton` - Loading skeleton for tables
- `FilterSkeleton` - Loading skeleton for filters

### Key Files

- `constants.ts` - Status options, constants
- `tableColumns.tsx` - Table column definitions
- `useURLFilters.ts` - URL state sync logic

---

**Next Steps**: Read the [Implementation Guide](./02-Review-Cost-Type-Implementation-Guide.md) to start building your own admin page.

