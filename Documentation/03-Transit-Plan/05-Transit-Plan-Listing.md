# 🚛 Transit Plan Listing Dashboard - Implementation Documentation

## 🎯 Overview
The **Transit Plan Listing Dashboard** is a comprehensive data management interface that allows users to view, filter, and manage transit plan records with advanced filtering, sorting, and pagination capabilities. The implementation uses modern React patterns with reusable UI components and efficient state management.

## ✅ Current Implementation Status
**Status:** ✅ **COMPLETED** - Fully functional with all requested features

### 🎨 UI Features Implemented
- **Standardized PageHeader**: Reusable header component with location and item count
- **Date Range Filters**: FloatingInput components for From Date and To Date
- **Dynamic Column Visibility**: MultiSelectDropdown for showing/hiding table columns
- **Advanced Pagination**: Individual page numbers with smart ellipsis logic
- **Status & Type Badges**: Color-coded badges with icons for visual distinction
- **Responsive Table**: Horizontal scroll with fixed header
- **Loading States**: Spinner and empty state handling
- **Search Integration**: Reusable SearchButton component

### 📊 Table Columns (Current Implementation)
- **Serial Number**: Auto-generated row numbers
- **Transit Date**: Date of transit
- **Time**: Transit time
- **Restaurant**: Restaurant name
- **Type**: Dispatch/Pickup with directional truck icons
- **Status**: Color-coded status badges (Scheduled, In Progress, Completed)
- **Delay**: Delay information
- **Driver**: Driver name
- **Facility**: Facility name
- **Vehicle Type**: Type of vehicle
- **Driver Phone**: Contact information
- **Vehicle Number**: Vehicle identification
- **Initiated Date**: When transit was initiated
- **Total Qty**: Quantity information
- **Signature**: Signature details
- **Created Date**: Record creation date
- **Created By**: User who created the record

### 🎨 Visual Enhancements
- **Status Badges**: 
  - ⏰ Scheduled (Blue) - for "New" status
  - ⚡ In Progress (Amber) - for active statuses
  - ✅ Completed (Green) - for finished statuses
- **Type Badges**:
  - 🚛 Dispatch (Blue) - pointing left
  - 🚚 Pickup (Purple) - pointing right (flipped with CSS transform)
- **PageHeader**: Standardized header with location and item count

## 🏗️ Technical Architecture

### 📁 File Structure
```
src/pages/TransitPlanListing.tsx          # Main component
src/services/transitPlanApi.ts           # API service layer
src/components/ui/PageHeader.tsx         # Reusable header component
src/components/ui/Badge.tsx              # Status and type badges
src/components/ui/FloatingInput.tsx      # Date input components
src/components/ui/MultiSelectDropdown.tsx # Column visibility component
src/components/ui/Pagination.tsx         # Enhanced pagination
src/design-system/tokens.ts              # Design system tokens
```

### 🔧 Component Architecture
- **TransitPlanListing**: Main page component with state management
- **TransitPlanApi**: Centralized API service with proper error handling
- **PageHeader**: Reusable header component for consistency
- **Badge**: Standardized badge component for status and type display
- **FloatingInput**: Enhanced input component with date support
- **Pagination**: Enhanced pagination with individual page numbers

### 🔄 State Management
```typescript
// Date filters
const [startDate, setStartDate] = useState<string>('');
const [endDate, setEndDate] = useState<string>('');

// Data and pagination
const [rows, setRows] = useState<TransitPlanRow[]>([]);
const [loading, setLoading] = useState(false);
const [pageNumber, setPageNumber] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);
const [totalItems, setTotalItems] = useState(0);

// Sorting state
const [sortBy, setSortBy] = useState<string>('transit_date');
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

// Column visibility state
const [visibleColumns, setVisibleColumns] = useState<string[]>([...]);
```

## 🔌 API Integration

### 📡 API Endpoint
- **URL**: `GET /transit-plan/get-transit-plan-listing`
- **Method**: GET
- **Authentication**: Bearer token required

### 📋 Query Parameters
```typescript
{
  page: number;                    // Page number (default: 1)
  limit: number;                   // Items per page (default: 10)
  start_date: string;              // Start date (YYYY-MM-DD)
  end_date: string;                // End date (YYYY-MM-DD)
  sortField: string;               // Field to sort by (e.g., "transit_date")
  sortOrder: "asc" | "desc";       // Sort order
  transit_status?: number;         // Optional: Filter by transit status
  restaurant_id?: number;          // Optional: Filter by restaurant ID
}
```

### 🌐 Example Request URL
```
GET /transit-plan/get-transit-plan-listing?page=1&limit=10&start_date=2024-01-01&end_date=2024-01-31&transit_status=1&restaurant_id=123&sortField=transit_date&sortOrder=desc
```

### 📊 Response Structure
```typescript
{
  "status_code": 200,
  "status": "Success",
  "data": {
    "rows": [
      {
        "id": 123177,
        "transit_date": "2025-10-21",
        "transit_time": "20:00:00",
        "restaurant_name": "Kotak Mahindra",
        "type": "Pickup",
        "driver_name": "Mahanthesh",
        "transit_status_label": "New",
        "facility": "Mumbai - Bhandup Facility",
        "vehicle_type": "ER-2",
        "driver_phone": "9898000003",
        "vehicle_number": null,
        "total_qty": 0,
        "signature_name": null,
        "creation_date": "2025-10-21 00:45:00",
        "created_by": "Web Admin",
        "city_name": "Mumbai",
        "delay_of": null
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 1182,
    "totalPages": 119
  }
}
```

## 🎨 UI Components Usage

### 📄 PageHeader Component
```tsx
<PageHeader
  title='Transit Plan Listing'
  locationName={rows.length > 0 ? rows[0].city_name : undefined}
  totalItems={totalItems}
  itemType='transit plans'
  icon='🚛'
/>
```

### 📅 Date Filters
```tsx
<FloatingInput 
  label='From Date' 
  type='date' 
  value={startDate} 
  onChange={setStartDate} 
/>
<FloatingInput 
  label='To Date' 
  type='date' 
  value={endDate} 
  onChange={setEndDate} 
/>
```

### 🏷️ Status Badge Component
```tsx
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const normalizedStatus = status.toLowerCase();
  
  if (normalizedStatus.includes('new') || normalizedStatus.includes('pending')) {
    return (
      <Badge variant='status' type='scheduled' icon='⏰'>
        Scheduled
      </Badge>
    );
  } else if (normalizedStatus.includes('progress')) {
    return (
      <Badge variant='status' type='inProgress' icon='⚡'>
        In Progress
      </Badge>
    );
  } else if (normalizedStatus.includes('complete')) {
    return (
      <Badge variant='status' type='completed' icon='✅'>
        Completed
      </Badge>
    );
  }
  // ... fallback
};
```

### 🚛 Type Badge Component
```tsx
const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const normalizedType = type.toLowerCase();
  
  if (normalizedType.includes('dispatch')) {
    return (
      <Badge variant='type' type='dispatch' icon='🚛'>
        Dispatch
      </Badge>
    );
  } else if (normalizedType.includes('pickup')) {
    return (
      <Badge variant='type' type='pickup' icon='🚚'>
        Pickup
      </Badge>
    );
  }
  // ... fallback
};
```

## 🎯 Key Features

### ✅ **Implemented Features**
- **Smart Date Filtering**: From Date and To Date with FloatingInput components
- **Dynamic Column Visibility**: Show/hide table columns with MultiSelectDropdown
- **Advanced Pagination**: Individual page numbers with smart ellipsis logic
- **Status Color Coding**: Visual status indicators with appropriate colors
- **Type Direction Indicators**: Dispatch (left) and Pickup (right) with truck icons
- **Standardized Header**: Consistent PageHeader across all listing pages
- **Responsive Design**: Horizontal scroll for mobile devices
- **Loading States**: Proper spinners and empty state handling
- **Search Integration**: Reusable SearchButton component

### 🔧 **Technical Details**
- **API Integration**: Complete POST endpoint integration with proper error handling
- **State Management**: Comprehensive state management for filters, pagination, and sorting
- **Component Architecture**: Modular component structure with reusable UI components
- **Performance**: Memoization and optimization strategies
- **TypeScript**: Full type safety with comprehensive interfaces

## 🚀 Usage Guide

### 📋 **For Developers**
1. **Import Required Components**:
   ```tsx
   import {
     PageHeader,
     FloatingInput,
     MultiSelectDropdown,
     Table,
     Pagination,
     SearchButton,
     Badge,
   } from '../components/ui';
   ```

2. **Set Up State Management**:
   ```tsx
   const [startDate, setStartDate] = useState<string>('');
   const [endDate, setEndDate] = useState<string>('');
   const [rows, setRows] = useState<TransitPlanRow[]>([]);
   const [totalItems, setTotalItems] = useState(0);
   ```

3. **Implement API Integration**:
   ```tsx
   const fetchData = async () => {
     const res = await TransitPlanApi.getTransitPlanListing({
       start_date: startDate,
       end_date: endDate,
       page: pageNumber,
       limit: itemsPerPage,
       sortField: sortBy,
       sortOrder: sortOrder,
       // Optional filters
       transit_status: 1,        // Filter by status
       restaurant_id: 123,       // Filter by restaurant
     });
     setRows(res.data.rows || []);
     setTotalItems(res.pagination?.totalItems || 0);
   };
   ```

### 🎨 **For UI Customization**
1. **Customize Status Colors**: Update `design-system/tokens.ts` badge variants
2. **Add New Status Types**: Extend StatusBadge component logic
3. **Modify Column Order**: Update `allColumns` array in component
4. **Change Icons**: Update icon props in Badge components

## 🔗 Related Documentation
- **Universal Listing Template**: [Universal Listing Page Template](../04-UI-Components/05-Universal-Listing-Page-Template.md)
- **UI Components**: [UI Components Guide](../04-UI-Components/README.md)
- **API Integration**: [API Integration Patterns](../01-Architecture/03-API-Integration.md)
- **Design System**: [Design System Tokens](../04-UI-Components/README.md)

## 📈 Future Enhancements
- **Export Functionality**: CSV/Excel export with filtered data
- **Bulk Operations**: Multi-select for bulk status updates
- **Real-time Updates**: WebSocket integration for live data
- **Advanced Filtering**: Additional filter options (driver, facility, etc.)
- **Mobile Optimization**: Enhanced mobile experience
- **Analytics Integration**: Transit plan analytics and reporting

## 🐛 Troubleshooting

### Common Issues
1. **No Data Loading**: Check API endpoint and authentication
2. **Date Filter Issues**: Verify date format and state management
3. **Column Visibility**: Ensure MultiSelectDropdown state is properly managed
4. **Pagination Problems**: Check totalItems calculation and page logic

### Debug Tips
- Use browser dev tools to inspect API responses
- Check console logs for state updates
- Verify component props and state values
- Test with different date ranges and filters

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
