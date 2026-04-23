# ✨ Master Plan Creation - Implementation Documentation

## 🎯 Overview
The **Master Plan Creation** feature allows users to create transit plans with dynamic dispatch and pickup schedules. The implementation uses modern React patterns with reusable UI components, custom hooks for state management, and comprehensive API integration.

## ✅ Current Implementation Status
**Status:** ✅ **COMPLETED** - Fully functional with all requested features

### 🎨 UI Features Implemented
- **Dynamic Form Sections**: Separate dispatch and pickup sections with add/remove capabilities
- **Custom Time Input**: 12-hour format with AM/PM toggle and auto-conversion
- **Inline Dropdowns**: Borderless dropdowns for vehicle selection
- **Date Picker Integration**: Clickable date inputs with calendar icons
- **Real-time Validation**: Form validation with visual feedback
- **Success/Error Notifications**: Snackbar notifications for user feedback
- **Data Persistence**: LocalStorage integration to prevent data loss
- **Responsive Design**: Mobile-friendly table layout with horizontal scroll

### 📊 Form Structure (Current Implementation)
- **Header Section**: Facility and Client selection dropdowns
- **Dispatch Section**: Dynamic dispatch transit entries
- **Pickup Section**: Dynamic pickup transit entries
- **Summary Section**: Entry counts and submit button
- **Notification System**: Success/error snackbar messages

### 🔧 Dynamic Entry Management
- **Add/Remove Rows**: Users can add multiple dispatch/pickup entries
- **Single Row Protection**: Delete button disabled for single entries
- **Serial Numbering**: Auto-generated row numbers
- **Real-time Updates**: Form updates immediately on field changes
- **Validation**: All fields required before submission

## 🏗️ Technical Architecture

### 📁 File Structure
```
src/pages/CreateMasterPlan.tsx              # Main page component
src/components/MasterPlanForm.tsx           # Header form component
src/components/TransitSection.tsx           # Dispatch/pickup container
src/components/TransitRow.tsx               # Individual transit row
src/hooks/useMasterPlanData.ts              # Custom state management hook
src/services/transitPlanApi.ts              # API service layer
src/components/ui/TimeInput.tsx             # Custom time input component
src/components/ui/BorderlessDropdown.tsx    # Inline dropdown component
src/components/ui/Snackbar.tsx              # Notification component
```

### 🔧 Component Architecture
- **CreateMasterPlan**: Main page orchestration and submission logic
- **MasterPlanForm**: Facility and client selection header
- **TransitSection**: Container for dispatch/pickup entries
- **TransitRow**: Individual transit entry with date/time/vehicle
- **useMasterPlanData**: Centralized state management and API calls
- **TimeInput**: Custom time input with 12-hour to 24-hour conversion
- **BorderlessDropdown**: Inline dropdown for vehicle selection

### 📊 State Management
```typescript
// Main form state
interface MasterPlanData {
  facilityId: string;
  clientId: string;
  dispatchTransits: TransitEntry[];
  pickupTransits: TransitEntry[];
}

// Individual transit entry
interface TransitEntry {
  id: string;
  date: string;
  time: string;
  vehicleType: string;
}

// Custom hook state
const {
  loading,
  facilities,
  clients,
  vehicles,
  transitTypes,
  data,
  updateData,
  addTransit,
  removeTransit,
  updateTransit,
  isFormValid,
  getSubmitPayload,
  clearSavedData,
} = useMasterPlanData();
```

## 🔌 API Integration

### 📡 API Endpoints Used
| Endpoint | Purpose | Method |
|----------|---------|---------|
| `/locations/getLocations?location_type=2` | Get washing facilities | GET |
| `/transit-plan/get-citywise-restaurants` | Get clients by city | GET |
| `/vehicle/getVehicles` | Get vehicles with driver info | GET |
| `/transit-plan/get-transit-types` | Get transit types (Dispatch/Pickup) | GET |
| `/transit-plan/create-master-transit-plan` | Create master plan | POST |

### 🔄 API Service Implementation
```typescript
// TransitPlanApi service
export const TransitPlanApi = {
  async createMasterPlan(payload: {
    restaurantId: number;
    cityId: number;
    facilityId: number;
    input: Array<{
      transitTypeId: number;
      data: Array<{
        vehicleId: number;
        transitDate: string;
        transitTime: string;
        driverName: string;
        driverPhone: string;
      }>;
    }>;
  }): Promise<ApiResponse<any>> {
    return api.post('/transit-plan/create-master-transit-plan', payload);
  },
};

// CommonApiService for dropdown data
export const CommonApiService = {
  async getFacilities(cityId?: number): Promise<ApiResponse<FacilityOption[]>> {
    const url = cityId 
      ? `/locations/getLocations?location_type=2&city_id=${cityId}&limit=1000`
      : `/locations/getLocations?location_type=2&limit=1000`;
    return api.get(url);
  },

  async getClientsByCity(): Promise<ApiResponse<ClientByCityOption[]>> {
    return api.get('/transit-plan/get-citywise-restaurants');
  },

  async getVehicles(): Promise<ApiResponse<VehicleOption[]>> {
    return api.get('/vehicle/getVehicles');
  },

  async getTransitTypes(): Promise<ApiResponse<TransitTypeOption[]>> {
    return api.get('/transit-plan/get-transit-types');
  },
};
```

## 🎨 UI Components Used

### 📝 Form Components
- **FloatingDropdown**: For facility and client selection
- **TimeInput**: Custom time input with AM/PM toggle
- **BorderlessDropdown**: Inline vehicle selection dropdown
- **Date Input**: HTML5 date input with calendar icon

### 📊 Data Display Components
- **Table**: Responsive table layout for transit entries
- **Card**: Section containers for dispatch/pickup
- **Button**: Add/remove and submit buttons
- **Snackbar**: Success/error notifications

## 🚀 Key Features

### ✅ Implemented Features
1. **Dynamic Form Management**: Add/remove dispatch and pickup entries
2. **Time Input Conversion**: 12-hour to 24-hour format conversion
3. **Data Persistence**: LocalStorage integration for form data
4. **Real-time Validation**: Form validation with visual feedback
5. **API Integration**: Complete CRUD operations for master plans
6. **Responsive Design**: Mobile-friendly table with horizontal scroll
7. **Error Handling**: Comprehensive error handling with user feedback
8. **Success Notifications**: Snackbar notifications for user actions

### 🎯 Performance Optimizations
- **Custom Hook**: Centralized state management with useMasterPlanData
- **Component Splitting**: Smaller, focused components for better performance
- **Memoization**: Optimized re-renders with React.memo
- **LocalStorage**: Efficient data persistence without API calls
- **State Management**: Batched updates to prevent unnecessary re-renders

## 🔧 Usage Examples

### Basic Implementation
```tsx
import { CreateMasterPlan } from './pages/CreateMasterPlan';

// In your routing
<Route path="/transit-plan/master-plan/create" element={<CreateMasterPlan />} />
```

### Custom Hook Usage
```typescript
// Using the custom hook
const {
  loading,
  facilities,
  clients,
  vehicles,
  data,
  updateData,
  addTransit,
  removeTransit,
  isFormValid,
  getSubmitPayload,
} = useMasterPlanData();

// Adding a new dispatch entry
const handleAddDispatch = () => {
  addTransit('dispatch');
};

// Updating a transit entry
const handleUpdateTransit = (id: string, field: string, value: string) => {
  updateTransit('dispatch', id, field, value);
};
```

### Time Format Conversion
```typescript
// Convert 12-hour to 24-hour format
const convertTimeFormat = (timeString: string): string => {
  if (!timeString) return '00:00:00';
  
  const [time, period] = timeString.split(' ');
  const [hours, minutes] = time.split(':');
  
  let hour24 = parseInt(hours, 10);
  
  if (period === 'PM' && hour24 !== 12) {
    hour24 += 12;
  } else if (period === 'AM' && hour24 === 12) {
    hour24 = 0;
  }
  
  return `${hour24.toString().padStart(2, '0')}:${minutes}:00`;
};
```

## 🐛 Troubleshooting

### Common Issues
1. **Time Input Not Working**: Check browser compatibility and time format conversion
2. **Form Not Submitting**: Verify all required fields are filled and API endpoint is correct
3. **Data Not Persisting**: Check localStorage availability and data serialization
4. **Dropdown Not Showing**: Verify API responses and data mapping
5. **Validation Errors**: Check form validation logic and required field checks

### Debug Tips
- Use console logs in handleSubmit for debugging form data
- Check Network tab for API calls and responses
- Inspect localStorage for saved form data
- Use React DevTools for component state inspection
- Verify Redux state for user data (city_id, user_type)

### API Debugging
```typescript
// Debug API calls
console.log('🚀 Submit button clicked');
console.log('📋 Form valid:', isFormValid());
console.log('📊 Current data:', data);
console.log('📤 Submitting Master Plan Payload:', payload);
console.log('📥 API Response:', response);
```
