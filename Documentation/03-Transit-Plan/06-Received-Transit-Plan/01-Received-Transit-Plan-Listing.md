# Received Transit Plan Listing Page

## Overview

The **Received Transit Plan Listing** page displays all received/pickup transit plans. This page mirrors the functionality of the Sent Transit Plan Listing but focuses on pickup operations.

## Features

### 1. **Date Range Filter**
- From Date and To Date inputs
- Default: Last 30 days
- Persisted in localStorage

### 2. **Client Dropdown**
- Filters transit plans by client
- API: `api/restaurants/getRestaurants?cityId=3`
- Option to select "All Clients"

### 3. **Column Management**
- Multi-select dropdown to show/hide columns
- Default visible columns:
  - Actions
  - Serial Number
  - Client
  - Transit Time
  - Date
  - Driver
  - Driver Phone
  - Facility
  - Status

### 4. **Status Badges**
- ✅ **Completed**: When transit is complete
- ⏰ **Scheduled**: When transit is new/scheduled
- ⚡ **In Progress**: When transit is ongoing

### 5. **Actions Column**
- DC (Download Challan) button when status is completed
- Green button with download icon

### 6. **Client Hyperlinks**
- Clickable client names (only when `transit_status === 0`)
- Navigates to `/transit-plan/received/details/:clientLocationId/:facilityId`
- Underlined blue text with hover effect

### 7. **Local Storage**
- Filters persisted for 24 hours
- Includes: dates, selected client, visible columns, pagination, sorting

## API Endpoint

```
GET /transit-plan/getCurrentPlanDetails?start_date=2025-10-27&end_date=2025-10-27&location_id=&facility_id=115&transit_type_id=2&page=1&limit=10
```

**Parameters**:
- `start_date`: Start date for filtering
- `end_date`: End date for filtering
- `location_id`: Client location ID (optional)
- `facility_id`: Facility ID (default: 115)
- `transit_type_id`: Always `2` (pickup)
- `page`: Page number
- `limit`: Items per page

## Technical Details

### File Location
`src/pages/ReceivedTransitPlanListing.tsx`

### Dependencies
```typescript
import { TransitPlanApi, SentTransitPlanRow } from '../services/transitPlanApi';
import { generateDeliveryChallanPDF } from '../services/deliveryChallanGenerator';
```

### State Management
- Local state with React hooks
- localStorage for persistence
- Redux for user authentication

### Key Methods
- `getReceivedPlanDetails()`: Fetch received transit plans
- `getReceivedCount()`: Fetch count data for DC generation
- `generateDeliveryChallanPDF()`: Generate and download PDF

## User Flow

1. User selects date range and client (optional)
2. Clicks "Search" button
3. List of received transit plans displays
4. User can:
   - Sort by any column
   - Show/hide columns
   - Click client name (if status = 0) to go to details page
   - Download DC for completed items

## Differences from Sent Version

| Feature | Sent | Received |
|---------|------|----------|
| API | `transit_type_id=1` | `transit_type_id=2` |
| Title | "Sent Transit Plan - Dispatch" | "Received Transit Plan - Pickup" |
| Navigation | `/transit-plan/sent/plan` | `/transit-plan/received/plan` |
| Details Route | `/transit-plan/sent/client-details` | `/transit-plan/received/details` |
