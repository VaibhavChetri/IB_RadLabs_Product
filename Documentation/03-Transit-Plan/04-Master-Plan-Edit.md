# Master Plan Edit Page Documentation

## Overview
The Master Plan Edit page allows users to modify existing master plan entries. It follows the feature-based Redux slice architecture and uses localStorage for persistence.

## Implementation Details

### Files Involved
- **Page Component**: `src/pages/EditMasterPlan.tsx`
- **Redux Slice**: `src/store/slices/transitPlanSlice.ts`
- **API Service**: `src/services/transitPlanApi.ts`
- **UI Components**: `src/components/TransitSection.tsx`, `src/components/ui/`

### Data Flow
1. User clicks "Edit" in Master Plan Listing
2. Row data is stored in Redux (`setEditMasterPlanData`)
3. Navigation to `/transit-plan/master-plan/edit`
4. Edit page reads from Redux state
5. Changes update Redux state directly
6. Submit calls API with Redux data
7. Success clears Redux and localStorage

### Key Features

#### 1. **Redux State Management**
```typescript
// Store edit data in transitPlanSlice
const { editMasterPlanData } = useSelector((state: RootState) => state.transitPlan);

// Update data directly in Redux
dispatch(updateEditMasterPlanData({ field: 'transit_date', value: newDate }));
```

#### 2. **localStorage Persistence**
```typescript
// Save on every change
useEffect(() => {
  if (editMasterPlanData) {
    localStorage.setItem('editMasterPlanData', JSON.stringify(editMasterPlanData));
  }
}, [editMasterPlanData]);

// Restore on page load
useEffect(() => {
  if (!editMasterPlanData) {
    const savedData = localStorage.getItem('editMasterPlanData');
    if (savedData) {
      dispatch(setEditMasterPlanData(JSON.parse(savedData)));
    }
  }
}, [dispatch, editMasterPlanData]);
```

#### 3. **Dynamic Component Rendering**
```typescript
// Single TransitSection component handles both dispatch and pickup
<TransitSection
  type={transitType.toLowerCase().includes('dispatch') ? 'dispatch' : 'pickup'}
  transits={[transitEntry]}
  label={transitType}
  color={isDispatch ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
  vehicles={vehicles}
  onAdd={() => {}} // No-op in edit mode
  onRemove={() => {}} // No-op in edit mode
  onUpdate={handleUpdateCallback}
/>
```

#### 4. **Time Format Conversion**
```typescript
const convertTimeFormat = (time12hr: string): string => {
  if (!time12hr) return editMasterPlanData.transit_time;
  
  // If already in 24-hour format, return as-is
  if (time12hr.includes(':') && !time12hr.includes(' ')) {
    return time12hr.includes(':00') ? time12hr : `${time12hr}:00`;
  }
  
  const [time, period] = time12hr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  
  if (period?.toLowerCase() === 'pm' && hours < 12) {
    hours += 12;
  } else if (period?.toLowerCase() === 'am' && hours === 12) {
    hours = 0;
  }
  
  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  
  return `${formattedHours}:${formattedMinutes}:00`;
};
```

#### 5. **Vehicle Selection Logic**
```typescript
const handleUpdateCallback = useCallback(
  (id: string, field: string, value: string | number) => {
    if (field === 'vehicleType') {
      // When vehicle type changes, update vehicle_id, driver_name, and driver_phone
      const selectedVehicle = vehicles.find(v => String(v.id) === String(value));
      if (selectedVehicle) {
        dispatch(updateEditMasterPlanData({ field: 'vehicle_id', value: selectedVehicle.id }));
        dispatch(updateEditMasterPlanData({ field: 'driver_name', value: selectedVehicle.driver_name }));
        dispatch(updateEditMasterPlanData({ field: 'driver_phone', value: selectedVehicle.driver_phone }));
      }
    } else {
      // Map other field names from TransitEntry to Redux field names
      const fieldMapping: Record<string, string> = {
        date: 'transit_date',
        time: 'transit_time',
      };
      const reduxField = fieldMapping[field] || field;
      dispatch(updateEditMasterPlanData({ field: reduxField, value }));
    }
  },
  [dispatch, vehicles]
);
```

### API Integration

#### Update Endpoint
```typescript
// POST /v1/api/transit-plan/update-master-transit-plan
const payload = {
  id: editMasterPlanData.id,
  vehicleId: editMasterPlanData.vehicle_id!,
  driverName: editMasterPlanData.driver_name,
  driverPhone: editMasterPlanData.driver_phone,
  restaurantId: editMasterPlanData.restaurant_id!,
  cityId: String(editMasterPlanData.city_id!),
  transitTypeId: editMasterPlanData.transit_type_id!,
  transitDate: editMasterPlanData.transit_date,
  transitTime: convertTimeFormat(editMasterPlanData.transit_time),
  facilityId: editMasterPlanData.facility_id!,
};
```

### Error Handling
- Network errors show snackbar with error message
- Validation errors from API are displayed to user
- localStorage cleanup on cancel/success
- Redux state cleanup on navigation

### Navigation Flow
1. **From Listing**: Click "Edit" → Store data in Redux → Navigate to edit page
2. **On Cancel**: Clear Redux → Clear localStorage → Navigate back to listing
3. **On Success**: Clear Redux → Clear localStorage → Navigate back to listing
4. **On Refresh**: Restore from localStorage if Redux is empty

### Type Safety
- All fields use non-null assertions (`!`) for required API fields
- Redux state ensures data integrity
- TypeScript interfaces match API exactly
- No default values - rely on Redux data

## Best Practices Applied
1. **Feature-based slice organization**
2. **Direct Redux state updates**
3. **localStorage for persistence**
4. **Reusable components**
5. **Type safety throughout**
6. **Clean error handling**
7. **Proper cleanup on navigation**
