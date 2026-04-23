# 🧭 Master Plan Listing Dashboard - Implementation Documentation

## 🎯 Overview
The **Master Plan Listing Dashboard** is a comprehensive data management interface that allows users to view, filter, and manage transit plan records. The implementation uses modern React patterns with reusable UI components and efficient state management.

## ✅ Current Implementation Status
**Status:** ✅ **COMPLETED** - Fully functional with all requested features

### 🎨 UI Features Implemented
- **Clean Filter Section**: Three dropdown filters with integrated search button
- **Dynamic Column Visibility**: MultiSelectDropdown for showing/hiding table columns
- **Responsive Table**: Horizontal scroll with fixed header
- **Modern Pagination**: Configurable rows per page with "All" option
- **Loading States**: Spinner and empty state handling
- **Search Integration**: Reusable SearchButton component

### 📊 Table Columns (Current Implementation)
- **Actions**: Edit/Delete buttons (always visible)
- **Serial Number**: Auto-generated row numbers
- **Time**: Transit time (renamed from "Transit Time")
- **Client**: Restaurant name (renamed from "Restaurant Name")
- **Type**: Dispatch/Pickup type
- **Driver**: Driver name (renamed from "Driver Name")
- **Vehicle**: Vehicle type (renamed from "Vehicle Type")
- **Vehicle #**: Vehicle number (renamed from "Vehicle Number")
- **Driver Phone**: Contact information
- **Created By**: User who created the record
- **City Name**: Location information
- **Facility**: Washing facility name

### 🔧 Dynamic Column Management
- **Show Columns Dropdown**: MultiSelectDropdown with search functionality
- **"X selected" Display**: Green pill badge showing selected column count
- **Always Visible**: Actions and Serial columns cannot be hidden
- **Real-time Updates**: Table columns update immediately when selection changes

## 🏗️ Technical Architecture

### 📁 File Structure
```
src/pages/MasterPlanListing.tsx          # Main component
src/services/transitPlanApi.ts           # API service layer
src/components/ui/SearchButton.tsx       # Reusable search component
src/components/ui/MultiSelectDropdown.tsx # Column visibility component
```

### 🔧 Component Architecture
- **MasterPlanListing**: Main page component with state management
- **TransitPlanApi**: Centralized API service with proper error handling
- **SearchButton**: Reusable search button with consistent styling
- **MultiSelectDropdown**: Enhanced dropdown with multi-selection and search

### 📊 State Management
```typescript
// Filter state
const [filters, setFilters] = useState<{
  facility_id?: string;
  client_id?: string;
  transit_type_id?: string;
}>({});

// Column visibility state
const [visibleColumns, setVisibleColumns] = useState<string[]>([
  'actions', 'serial', 'transit_time', 'restaurant_name', 'type',
  'driver_name', 'vehicle_type', 'vehicle_number', 'driver_phone'
]);

// Data state
const [rows, setRows] = useState<MasterPlanRow[]>([]);
const [loading, setLoading] = useState(false);
const [pageNumber, setPageNumber] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);
const [totalItems, setTotalItems] = useState(0);
```

## 🔌 API Integration

### 📡 API Endpoints Used
| Endpoint | Purpose | Method |
|----------|---------|---------|
| `/locations/getLocations?location_type=2` | Get washing facilities | GET |
| `/inventory/getClientByCity` | Get clients by city | GET |
| `/plan/getMasterPlanListing` | Get master plan data | GET |

### 🔄 API Service Implementation
```typescript
// TransitPlanApi service
export const TransitPlanApi = {
  async getFacilities(cityId: number): Promise<ApiResponse<FacilityOption[]>> {
    return api.get(`/locations/getLocations?location_type=2&city_id=${cityId}&limit=1000`);
  },

  async getClientsByCity(cityId: number): Promise<ApiResponse<ClientByCityOption[]>> {
    const response = await api.get(`/inventory/getClientByCity`);
    return {
      status_code: response.status_code,
      status: response.status,
      message: response.message,
      data: response.result || [],
    };
  },

  async getMasterPlanListing(params: {
    pageNumber: number;
    pageSize: number;
    sortOrder: 'asc' | 'desc';
    facilityId?: number;
    restaurantId?: number;
    transitTypeId?: number;
  }): Promise<ApiResponse<MasterPlanListingResponse>> {
    const searchParams = new URLSearchParams();
    searchParams.set('pageNumber', String(params.pageNumber));
    searchParams.set('pageSize', String(params.pageSize));
    searchParams.set('sortOrder', params.sortOrder);
    if (params.facilityId) searchParams.set('facilityId', String(params.facilityId));
    if (params.restaurantId) searchParams.set('restaurantId', String(params.restaurantId));
    if (params.transitTypeId) searchParams.set('transitTypeId', String(params.transitTypeId));
    return api.get(`/plan/getMasterPlanListing?${searchParams.toString()}`);
  },
};
```

## 🎨 UI Components Used

### 🔍 Filter Components
- **FloatingDropdown**: For facility, client, and transit type filters
- **SearchButton**: Reusable search button with hover effects
- **MultiSelectDropdown**: For column visibility management

### 📊 Data Display Components
- **Table**: Main data table with sorting and responsive design
- **Pagination**: Modern pagination with configurable page sizes

## 🚀 Key Features

### ✅ Implemented Features
1. **Smart Filtering**: Only API calls on search button click
2. **Dynamic Columns**: Show/hide columns with real-time updates
3. **Responsive Design**: Horizontal scroll for mobile devices
4. **Loading States**: Proper loading spinners and empty states
5. **Error Handling**: Graceful error handling with user feedback
6. **Pagination**: Configurable rows per page (10, 25, 50, 100, All)
7. **Search Integration**: Consistent search button across pages

### 🎯 Performance Optimizations
- **useMemo**: Column definitions and options memoized
- **useCallback**: Event handlers optimized
- **Lazy Loading**: Data fetched only when needed
- **State Management**: Efficient state updates

## 🔧 Usage Examples

### Basic Implementation
```tsx
import { MasterPlanListing } from './pages/MasterPlanListing';

// In your routing
<Route path="/transit-plan/master-plan/listing" element={<MasterPlanListing />} />
```

### Customizing Columns
```typescript
// Modify visible columns
const [visibleColumns, setVisibleColumns] = useState<string[]>([
  'actions', 'serial', 'transit_time', 'restaurant_name', 'type'
]);

// Add custom column
const customColumns = [
  ...allColumns,
  {
    key: 'custom_field',
    label: 'Custom Field',
    title: 'Custom Field',
    render: (value: any, row: MasterPlanRow) => (
      <span>{row.customData}</span>
    ),
  },
];
```

## 🐛 Troubleshooting

### Common Issues
1. **Empty Dropdowns**: Check API endpoints and city_id parameter
2. **Column Not Showing**: Ensure column key is in visibleColumns array
3. **Search Not Working**: Verify SearchButton onClick handler
4. **Pagination Issues**: Check totalItems and pageNumber state

### Debug Tips
- Use browser dev tools to inspect API calls
- Check Redux state for user data (city_id, user_type)
- Verify component props and state updates
