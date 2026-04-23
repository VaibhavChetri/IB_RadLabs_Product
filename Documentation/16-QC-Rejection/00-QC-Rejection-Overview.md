# QC Rejection - Overview

## What is QC Rejection?

QC Rejection is a feature that allows users to track and manage quality control rejections for transit runs. It provides a workflow for viewing rejected items, identifying runs that need rejection entry, and entering detailed rejection data per SKU and rejection reason.

## Why Does It Exist?

- **Quality Tracking**: Track QC rejections across transit runs
- **Detailed Reporting**: Record rejection counts per SKU and reason
- **Adherence Monitoring**: Track QC report submission adherence
- **Data Integrity**: Ensure accurate rejection data entry

## Key Features

1. **Listing Page** - View all QC rejections with date and client filters
2. **Add Page** - View QC runs needing rejection entry, with adherence stats
3. **Details Page** - Enter rejection counts per SKU and reason for a specific run
4. **Date Persistence** - Filter dates persist across navigation
5. **Form Persistence** - Entered data saved in localStorage per run

## Page Flow

```
Listing Page
    ↓ (Click "Add QC Rejection")
Add Page (QC Runs Listing)
    ↓ (Click Client Name)
Details Page (Form Entry)
    ↓ (Click Submit)
Back to Listing Page
```

## Page Sections

### 1. Listing Page (`QCRejectionListing.tsx`)

**Purpose**: View all recorded QC rejections

**Sections**:
- **Header**: Title, location, total count, "Add QC Rejection" button
- **Filters**: Transit Date (required), Client (optional), Search button
- **Table**: Transit Date, Time, Client Name, SKU, Reason, Rejected Count, Updated By

**Key Features**:
- Date filter defaults to today
- Client filter optional (shows all if not selected)
- Search button triggers API call
- Navigate to Add page via button

### 2. Add Page (`QCRejectionAdd.tsx`)

**Purpose**: View QC runs that need rejection entry

**Sections**:
- **Header**: Title, location, QC runs count, adherence stats (Total Runs, Submitted, Adherence %)
- **Filters**: Transit Date (persisted), Client (optional), Search button
- **Table**: Client Name (clickable), Transit Date, Transit Time

**Key Features**:
- Date filter persisted in localStorage
- Adherence stats displayed inline with header
- Clickable client names navigate to Details page
- Date filter preserved when navigating back

### 3. Details Page (`QCRejectionDetails.tsx`)

**Purpose**: Enter rejection counts for a specific QC run

**Sections**:
- **Header**: Back button, title, client info
- **Table**: SKUs as rows, rejection reasons as columns, editable inputs
- **Totals**: Row-wise totals and grand total row
- **Submit Button**: Saves rejection data

**Key Features**:
- Form data persisted in localStorage (key: `qcRejectionFormData_{runId}`)
- Data restored on page refresh
- Back button preserves date filter
- Submit clears localStorage on success

## File Locations

### Pages
- **Listing Page**: `src/pages/operations-reporting/qc-rejection/QCRejectionListing.tsx`
- **Add Page**: `src/pages/operations-reporting/qc-rejection/QCRejectionAdd.tsx`
- **Details Page**: `src/pages/operations-reporting/qc-rejection/QCRejectionDetails.tsx`

### Features
- **Feature Code**: `src/features/qc-rejection/`
- **Listing Hook**: `src/features/qc-rejection/hooks/useQCRejectionData.ts`
- **Runs Hook**: `src/features/qc-rejection/hooks/useQCRunsData.ts`
- **Adherence Hook**: `src/features/qc-rejection/hooks/useQCReportAdherence.ts`

### Services
- **API Service**: `src/services/transitPlanApi.ts` (QCRejectionService class)
- **Inventory API**: `src/services/inventoryApi.ts` (getClientByCity)
- **SKU API**: `src/services/skuApi.ts` (getClientSkuMap)
- **Escalation Type API**: `src/services/transitPlanApi.ts` (EscalationTypeService)

## Key Concepts

### Date Persistence
- Add page date filter saved to `localStorage` key: `qcRejectionFilterDate`
- Restored from `location.state` or `localStorage` on mount
- Preserved when navigating back from Details page

### Form Data Persistence
- Details page form data saved to `localStorage` key: `qcRejectionFormData_{runId}`
- Unique key per run ensures data isolation
- Cleared on successful submit

### Navigation Flow
- Listing → Add: Via "Add QC Rejection" button
- Add → Details: Via clickable client name
- Details → Add: Via back button (preserves date filter)
- Details → Listing: After successful submit

### API Dependencies
- **QC Rejection Listing**: `getQCRejections` (date + optional client_id)
- **QC Runs**: `getQcRuns` (date + optional client_id)
- **Adherence Stats**: `getQcReportAdherence` (start_date + end_date)
- **Client SKUs**: `getClientSkuMap` (clientId)
- **Rejection Reasons**: `getComplaintTypes` (all active types)
- **Submit Rejections**: `submitQCRejections` (runId + details array)

## Related Features

- **Escalation Type**: Provides rejection reason options
- **Client Escalation**: Uses similar escalation type structure

