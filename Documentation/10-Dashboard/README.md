# Dashboard (Inventory Analysis) Documentation

## Overview

The Dashboard feature provides inventory analysis with filters for month, client, and washing facility. Data visualization is coming soon.

## Documentation Files

### 00-Dashboard-Overview.md
Basic introduction:
- What the Dashboard is
- Why we need it
- How it works at a high level
- What pages exist
- Where files are located

### 01-Dashboard-How-It-Works.md
Detailed step-by-step guide:
- Exact execution flow when page loads
- Line-by-line explanation of code
- What each function does and why
- What happens when user changes filters
- Why we chose this structure

### 02-Dashboard-Accessibility.md
Accessibility implementation guide:
- ARIA labels and semantic HTML
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Testing accessibility features

### 03-Dashboard-Testing.md
Testing strategy and guide:
- Test setup and configuration
- Unit test breakdowns
- Component test patterns
- Writing new tests
- Coverage requirements

## Quick Links

- **Main Page**: `src/pages/Dashboard.tsx`
- **Feature Code**: `src/features/dashboard/`
- **Filters Hook**: `src/features/dashboard/hooks/useDashboardFilters.ts`
- **Filters Component**: `src/features/dashboard/components/DashboardFilters.tsx`

## Key Concepts

### Custom Hooks
We use `useDashboardFilters` to separate business logic from UI. This makes code:
- Easier to test
- Easier to reuse
- Easier to maintain

Read `01-Dashboard-How-It-Works.md` to understand why.

### Feature-Based Organization
All dashboard code lives in `src/features/dashboard/`:
- Components: UI pieces
- Hooks: Business logic
- Config: Constants and settings

This matches the pattern used in other features like SKU Mapping.

## For Developers

When you need to:
- **Add new filter**: Modify `useDashboardFilters.ts` and `DashboardFilters.tsx`
- **Change default values**: Edit `constants.ts` or hook initialization
- **Add body content**: Modify `DashboardContent.tsx`
- **Use filters elsewhere**: Import `useDashboardFilters` hook

## Related Documentation

- See `09-SKU-Mapping/` for similar feature-based structure
- See `08-KAM/` for another example of page documentation

## Documentation Index

1. **[Overview](./00-Dashboard-Overview.md)** - Start here for basic understanding
2. **[How It Works](./01-Dashboard-How-It-Works.md)** - Deep dive into execution flow
3. **[Accessibility](./02-Dashboard-Accessibility.md)** - ARIA, keyboard nav, screen readers
4. **[Testing](./03-Dashboard-Testing.md)** - Test files, coverage, best practices

