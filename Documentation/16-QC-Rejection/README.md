# QC Rejection - Feature Documentation

**Status**: ✅ Production Ready  
**Last Updated**: 2025-01-XX  
**Owner**: Development Team

## 📋 Quick Links

- [Overview](./00-QC-Rejection-Overview.md) - What is QC Rejection and why it exists
- [How It Works](./01-QC-Rejection-How-It-Works.md) - Step-by-step execution flow
- [Pages](./02-QC-Rejection-Pages.md) - Detailed page-by-page documentation
- [API Reference](./03-QC-Rejection-API-Reference.md) - API endpoints and interfaces

## 🎯 Purpose

QC Rejection feature allows users to track and manage quality control rejections for transit runs. It includes listing rejected items, adding new rejections, and entering detailed rejection data per SKU and reason.

## 🏗️ Architecture Highlights

### Three-Page Flow

1. **Listing Page** - View all QC rejections with date and client filters
2. **Add Page** - View QC runs needing rejection entry, with adherence stats
3. **Details Page** - Enter rejection counts per SKU and reason for a specific run

### File Structure

```
src/
├── pages/
│   └── operations-reporting/
│       └── qc-rejection/
│           ├── QCRejectionListing.tsx      # Listing page
│           ├── QCRejectionAdd.tsx          # Add page (QC runs listing)
│           └── QCRejectionDetails.tsx      # Details page (form entry)
├── features/
│   └── qc-rejection/
│       └── hooks/
│           ├── useQCRejectionData.ts       # React Query hook for listing
│           ├── useQCRunsData.ts            # React Query hook for QC runs
│           └── useQCReportAdherence.ts     # React Query hook for stats
└── services/
    └── transitPlanApi.ts                   # API service methods
```

## 🚀 Key Features

### 1. Listing Page
- View all QC rejections with filters
- Date filter (required)
- Client filter (optional)
- Search button triggers API call
- Shows: Transit Date, Time, Client Name, SKU, Reason, Rejected Count, Updated By

### 2. Add Page
- View QC runs needing rejection entry
- Date filter (persisted in localStorage)
- Client filter (optional)
- Adherence stats (Total Runs, Submitted, Adherence %)
- Clickable client names navigate to Details page
- Date persistence across navigation

### 3. Details Page
- Editable table for entering rejection counts
- SKUs as rows, rejection reasons as columns
- Row-wise totals and grand total
- Form data persisted in localStorage (per runId)
- Submit button calls API
- Back button preserves date filter

## 📚 Documentation Files

1. **[00-QC-Rejection-Overview.md](./00-QC-Rejection-Overview.md)**  
   High-level overview, purpose, and key concepts

2. **[01-QC-Rejection-How-It-Works.md](./01-QC-Rejection-How-It-Works.md)**  
   Detailed execution flow, data fetching, and user interactions

3. **[02-QC-Rejection-Pages.md](./02-QC-Rejection-Pages.md)**  
   Page-by-page breakdown with code navigation

4. **[03-QC-Rejection-API-Reference.md](./03-QC-Rejection-API-Reference.md)**  
   API endpoints, request/response structures, error handling

## 🎓 Learning Path

1. **Start Here**: Read [Overview](./00-QC-Rejection-Overview.md) to understand the feature
2. **Understand Flow**: Read [How It Works](./01-QC-Rejection-How-It-Works.md) for execution details
3. **Page Details**: Read [Pages](./02-QC-Rejection-Pages.md) for page-specific information
4. **Reference APIs**: Check [API Reference](./03-QC-Rejection-API-Reference.md) when integrating

## 📝 Quick Reference

### Key Hooks

- `useQCRejectionData` - Fetch rejection listing data
- `useQCRunsData` - Fetch QC runs needing rejection entry
- `useQCReportAdherence` - Fetch adherence statistics

### Key Components

- `QCRejectionListing` - Listing page component
- `QCRejectionAdd` - Add page component
- `QCRejectionDetails` - Details page component

### Key Files

- `src/pages/operations-reporting/qc-rejection/` - All page components
- `src/features/qc-rejection/hooks/` - Data fetching hooks
- `src/services/transitPlanApi.ts` - API service methods

---

**Related Features**: Escalation Type, Client Escalation

