# Sent Transit Plan Listing

## Overview

The Sent Transit Plan Listing page (`SentTransitPlanListing.tsx`) displays all dispatched transit plans with comprehensive filtering, sorting, and delivery challan generation capabilities.

## Page Location
- **File**: `src/pages/SentTransitPlanListing.tsx`
- **Route**: `/transit-plan/sent/plan`
- **Menu**: Transit Plan → Sent Transit Plan

## Features

### 🔍 Filtering & Search
- **Date Range Filter**: Start and end date selection using `FloatingInput` components
- **Client Dropdown**: Dynamic client list loaded from `api/restaurants/getRestaurants?cityId=3`
- **Column Selection**: Multi-select dropdown to show/hide table columns
- **Local Storage Persistence**: All filter selections are saved and restored on page reload

### 📊 Data Display
- **Dynamic Table**: Responsive table with sortable columns
- **Status Icons**: Visual indicators (✅ completed, ⏰ scheduled, ⚡ in progress)
- **Client Hyperlinks**: Conditional links based on `transit_status` (only for status 0)
- **DC Download Button**: Compact download button for completed dispatches

### 📄 PDF Generation
- **Delivery Challan**: Professional PDF generation with 3 layout types
- **Dynamic Layouts**: Compact, Concentric (A4), and Piramal (Extended) formats
- **Brand Integration**: InfinityBox logo and company information
- **Zero Quantity Filtering**: Removes items with 0 quantity from PDF

## API Integration

### Authentication
```typescript
// Credentials
username: 'ch-mumbai'
password: 'ch-mumbai'
```

### Key API Endpoints

#### 1. Get Restaurants (Client Dropdown)
```typescript
GET /api/restaurants/getRestaurants?cityId=3
```
**Response Structure**:
```typescript
{
  status: "Success",
  status_code: 200,
  message: "Restaurants fetched successfully",
  result: Array<{
    id: number;
    restaurantName: string;
    cityId: number;
    // ... other fields
  }>
}
```

#### 2. Get Current Plan Details (Main Data)
```typescript
GET /api/transit-plan/getCurrentPlanDetails?start_date=2025-10-24&end_date=2025-10-24&location_id=&facility_id=115&transit_type_id=1&page=1&limit=10
```
**Response Structure**:
```typescript
{
  status: "Success",
  status_code: 200,
  message: "Current plan details fetched successfully",
  result: Array<SentTransitPlanRow>,
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  }
}
```

#### 3. Get Sent Count (DC Download)
```typescript
GET /api/inventory/getSentCount?location_id=115&client_id=101&start_date=2025-10-14&end_date=2025-10-14&transit_time=15:00:00&transit_type_id=1
```
**Response Structure**:
```typescript
{
  status: "Success",
  status_code: 200,
  message: "Sent count fetched successfully",
  result: Array<{
    id: number;
    clientId: number;
    facilityId: number;
    clientName: string;
    sku: string;
    count: number;
    facilityName: string;
    dispatch_date_time: string;
  }>
}
```

## Data Structure

### SentTransitPlanRow Interface
```typescript
interface SentTransitPlanRow {
  id: number;
  vehicle_id: number;
  restaurant_id: number;
  city_id: number;
  restaurant_location_id: number | null;
  transit_type_id: number;
  vehicle_number: string | null;
  driver_name: string;
  driver_phone: string;
  total_qty: number;
  signature_name: string | null;
  email: string | null;
  transit_status: number;
  facility_id: number;
  clientId: number;
  transit_status_label: string;
  transit_date: string;
  transit_time: string;
  creation_date: string;
  creation_at: string;
  initiated_date: string | null;
  initiated_at: string | null;
  vehicle_type: string;
  restaurant_name: string;
  city_name: string;
  facility: string;
  type: string;
  dc: string | null;
  created_by: string;
  initiated_by: string | null;
  dispatch_images: string | null;
  pickup_images: string | null;
  delivery_images: string | null;
  delay_of: string | null;
  clientLocationId: number;
  facilityId: number;
  transit_type_id: number;
}
```

## UI Components Used

### Core Components
- **`FloatingInput`**: Date range inputs
- **`FloatingDropdown`**: Client selection dropdown
- **`MultiSelectDropdown`**: Column visibility control
- **`Table`**: Data display with sorting
- **`Pagination`**: Page navigation
- **`Badge`**: Status indicators
- **`PageHeader`**: Standardized page header

### Custom Components
- **`StatusBadge`**: Custom status display with icons
- **`SearchButton`**: Filter application trigger

## State Management

### Local State
```typescript
const [data, setData] = useState<SentTransitPlanRow[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [totalItems, setTotalItems] = useState(0);
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);
const [sortField, setSortField] = useState<string>('transit_date');
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
const [startDate, setStartDate] = useState<string>('');
const [endDate, setEndDate] = useState<string>('');
const [selectedClient, setSelectedClient] = useState<string>('');
const [clients, setClients] = useState<RestaurantOption[]>([]);
const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns);
```

### Local Storage Keys
- `sent-transit-plan-filters`: Filter selections persistence
- `sent-transit-plan-columns`: Column visibility preferences

## Key Functions

### Data Fetching
```typescript
const fetchData = useCallback(async () => {
  // API call with current filters and pagination
  // Client-side sorting implementation
  // Error handling and loading states
}, [currentPage, itemsPerPage, sortField, sortOrder, startDate, endDate, selectedClient]);
```

### DC Download
```typescript
const handleDCDownload = async (row: SentTransitPlanRow) => {
  // Call getSentCount API
  // Convert API response to PDF data
  // Generate and download PDF
};
```

### Filter Management
```typescript
const saveFiltersToStorage = useCallback(() => {
  // Save current filter state to localStorage
}, [startDate, endDate, selectedClient, visibleColumns, currentPage, itemsPerPage, sortField, sortOrder]);

const loadFiltersFromStorage = useCallback(() => {
  // Restore filter state from localStorage
}, []);
```

## Styling & Layout

### Design System Integration
- **Colors**: Primary, secondary, success, warning, info variants
- **Typography**: Consistent font sizes and weights
- **Spacing**: Standardized margins and padding
- **Components**: Reusable UI component library

### Responsive Design
- **Mobile**: Stacked layout for filters
- **Tablet**: Optimized table display
- **Desktop**: Full feature set with side-by-side filters

## Error Handling

### API Errors
- **401 Unauthorized**: Automatic token refresh attempt
- **Network Errors**: User-friendly error messages
- **Data Validation**: Input validation and sanitization

### User Feedback
- **Loading States**: Spinner indicators during API calls
- **Success Messages**: Confirmation for successful operations
- **Error Messages**: Clear error descriptions with recovery suggestions

## Performance Optimizations

### Client-Side Sorting
- **Efficient Algorithms**: Optimized sorting for large datasets
- **Memory Management**: Proper cleanup of event listeners
- **Debounced Updates**: Reduced unnecessary re-renders

### Local Storage Management
- **Selective Persistence**: Only essential data saved
- **Size Limits**: Prevent excessive storage usage
- **Cleanup**: Automatic cleanup of old data

## Future Enhancements

### Planned Features
1. **Bulk Operations**: Multi-select for batch actions
2. **Export Functionality**: CSV/Excel export options
3. **Advanced Filtering**: More filter criteria
4. **Real-time Updates**: WebSocket integration for live data
5. **Audit Trail**: Change tracking and history

### Technical Improvements
1. **Virtual Scrolling**: For large datasets
2. **Caching**: API response caching
3. **Offline Support**: Service worker implementation
4. **Accessibility**: WCAG compliance improvements
