# Master Plan Creation

## Overview

The Master Plan Creation feature allows users to create transit plans with dispatch and pickup schedules. This feature includes dynamic form management, time input handling, and API integration for submitting master plans.

## Features

### Core Functionality
- **Dynamic Form Sections**: Separate dispatch and pickup sections with add/remove capabilities
- **Time Input Management**: Custom time input with 12-hour to 24-hour conversion
- **API Integration**: Submit master plans to `/transit-plan/create-master-transit-plan`
- **Data Persistence**: LocalStorage integration to prevent data loss
- **Real-time Validation**: Form validation with visual feedback
- **Success/Error Notifications**: Snackbar notifications for user feedback

### UI Components
- **MasterPlanForm**: Header form with facility and client selection
- **TransitSection**: Container for dispatch/pickup entries
- **TransitRow**: Individual transit entry with date, time, and vehicle selection
- **TimeInput**: Custom time input with AM/PM toggle
- **BorderlessDropdown**: Inline dropdown for vehicle selection

## File Structure

```
src/
├── pages/
│   └── CreateMasterPlan.tsx          # Main page component
├── components/
│   ├── MasterPlanForm.tsx           # Header form component
│   ├── TransitSection.tsx           # Dispatch/pickup section
│   └── TransitRow.tsx               # Individual transit row
├── hooks/
│   └── useMasterPlanData.ts         # Custom hook for data management
└── services/
    └── transitPlanApi.ts             # API service methods
```

## API Integration

### Endpoint
```
POST /transit-plan/create-master-transit-plan
```

### Request Payload
```json
{
  "restaurantId": 120,
  "cityId": 3,
  "facilityId": 1,
  "input": [
    {
      "transitTypeId": 1,
      "data": [
        {
          "vehicleId": 3,
          "transitDate": "2024-06-01",
          "transitTime": "12:00:00",
          "driverName": "Seenu Lingappa",
          "driverPhone": "1234567890"
        }
      ]
    }
  ]
}
```

### Response Handling
- **Success**: Show success snackbar and clear form
- **Error**: Display error message with details
- **Validation**: Client-side validation before submission

## Data Management

### State Structure
```typescript
interface MasterPlanData {
  facilityId: string;
  clientId: string;
  dispatchTransits: TransitEntry[];
  pickupTransits: TransitEntry[];
}

interface TransitEntry {
  id: string;
  date: string;
  time: string;
  vehicleType: string;
}
```

### LocalStorage Integration
- **Auto-save**: Form data saved on every change
- **Restore**: Data restored on page reload
- **Clear**: Data cleared after successful submission

## Time Input Component

### Features
- **12-Hour Format**: User-friendly AM/PM input
- **Auto-conversion**: Converts to 24-hour format for API
- **Validation**: Real-time hour/minute validation
- **Keyboard Navigation**: Arrow key support for time adjustment

### Conversion Logic
```typescript
// Input: "12:00 PM" -> Output: "12:00:00"
// Input: "01:30 AM" -> Output: "01:30:00"
// Input: "12:00 AM" -> Output: "00:00:00"
```

## Form Validation

### Required Fields
- **Facility**: Must be selected
- **Client**: Must be selected
- **Date**: Must be valid date
- **Time**: Must be valid time format
- **Vehicle**: Must be selected

### Validation Rules
- At least one dispatch or pickup entry required
- All entries must have complete data
- Time format validation (HH:MM AM/PM)

## Error Handling

### Client-Side Errors
- Form validation errors
- Time format errors
- Required field errors

### Server-Side Errors
- API validation errors
- Network errors
- Server errors

### Error Display
- **Snackbar Notifications**: Success/error messages
- **Form Validation**: Inline validation feedback
- **Console Logging**: Debug information

## Responsive Design

### Desktop Layout
- **Table Format**: Traditional table layout for entries
- **Full Width**: Utilizes available screen space
- **Hover Effects**: Interactive elements with hover states

### Mobile Layout
- **Responsive Table**: Horizontal scroll for small screens
- **Touch-Friendly**: Larger touch targets
- **Optimized Spacing**: Adjusted padding and margins

## Performance Considerations

### Optimization Strategies
- **Component Splitting**: Smaller, focused components
- **Custom Hooks**: Logic separation and reusability
- **Memoization**: Prevent unnecessary re-renders
- **Lazy Loading**: Load components as needed

### Memory Management
- **Cleanup**: Proper useEffect cleanup
- **State Management**: Efficient state updates
- **Event Handlers**: Proper event listener management

## Testing

### Unit Tests
- Component rendering tests
- Hook functionality tests
- Utility function tests

### Integration Tests
- Form submission flow
- API integration tests
- Error handling tests

### Manual Testing
- Form validation
- Time input functionality
- Responsive design
- Error scenarios

## Future Enhancements

### Planned Features
- **Bulk Import**: CSV/Excel import functionality
- **Template System**: Save and reuse common plans
- **Advanced Scheduling**: Recurring schedules
- **Conflict Detection**: Overlap prevention
- **Audit Trail**: Change tracking and history

### Technical Improvements
- **Offline Support**: PWA capabilities
- **Real-time Updates**: WebSocket integration
- **Advanced Validation**: Server-side validation
- **Performance Monitoring**: Analytics integration

## Troubleshooting

### Common Issues

#### Time Input Not Working
- Check browser compatibility
- Verify time format conversion
- Check console for errors

#### Form Not Submitting
- Verify all required fields filled
- Check API endpoint availability
- Verify authentication token

#### Data Not Persisting
- Check localStorage availability
- Verify data serialization
- Check browser storage limits

### Debug Information
- Console logs for debugging
- Network tab for API calls
- React DevTools for state inspection

## Related Documentation

- [Master Plan Listing](./01-Master-Plan-Listing.md)
- [API Reference](../06-API-Reference/README.md)
- [UI Components](../04-UI-Components/README.md)
- [Development Guidelines](../07-Development-Guidelines.md)
