# Received Transit Plan Documentation

## Overview

The Received Transit Plan section manages received/pickup transit plans and their delivery challans. This section mirrors the Sent Transit Plan section but focuses on pickup operations instead of dispatch operations.

## Pages Structure

### 1. ✅ Received Transit Plan Listing (`ReceivedTransitPlanListing.tsx`)
**Status**: Implemented  
**Purpose**: Displays all received transit plans with filtering, sorting, and DC generation capabilities.

### 2. ✅ Client Pickup Details (`ClientPickupDetails.tsx`)
**Status**: Implemented  
**Purpose**: Detailed pickup form for individual clients with container management and image upload.

### 3. ✅ Received Inventory Listing (`ReceivedInventoryListing.tsx`)
**Status**: Implemented  
**Purpose**: Displays received inventory at washing facilities with accordion-style grouping.

---

## Navigation Structure

```
Transit Plan
├── Master Plan Listing
├── Transit Plan Listing  
├── Sent Transit Plan
│   ├── Sent Transit Plan Listing (✅ Implemented)
│   ├── Client Dispatch Details (✅ Implemented)
│   └── Sent Inventory Listing (✅ Implemented)
└── Received Transit Plan
    ├── Received Transit Plan Listing (✅ Implemented)
    ├── Client Pickup Details (✅ Implemented)
    └── Received Inventory Listing (✅ Implemented)
```

---

## Technical Implementation

### API Integration
- **Base URL**: `http://localhost:3099/v1/api`
- **Authentication**: JWT token-based
- **Credentials**: `ch-mumbai` / `ch-mumbai`

### Key Services
- `TransitPlanApi`: Handles all transit plan related API calls (dispatch and pickup)
- `InventoryApiService`: Manages inventory API calls for received items
- `DeliveryChallanGenerator`: Manages PDF generation for delivery challans
- `AuthApiService`: Handles authentication and token management

### State Management
- **Redux**: Global state management for user data and authentication
- **Local Storage**: Persistent storage for form data and UI preferences
- **React Hooks**: Local component state management

### Key Differences from Sent Section
- **Terminology**: "Dispatch" → "Pickup", "Sent" → "Received"
- **API**: `transit_type_id=1` (dispatch) → `transit_type_id=2` (pickup)
- **Date Filter**: Received Inventory uses single `date` parameter instead of date range
- **Submit API**: `sendB2BInventory` → `receivedB2BInventory`
- **Photo Label**: "After Loading" → "After Unloading"
- **Vehicle Label**: "Dispatch Vehicle" → "Pickup Vehicle"

---

## Next Steps

1. **Complete Documentation**: Detailed documentation for each implemented page
2. **Testing**: Comprehensive testing of all functionality
3. **Performance Optimization**: Code splitting and lazy loading

---

## Related Documentation

- [Received Transit Plan Listing](./01-Received-Transit-Plan-Listing.md)
- [Client Pickup Details](./02-Client-Pickup-Details.md)
- [API Reference](../06-API-Reference/README.md)
- [Component Architecture](../04-UI-Components/README.md)
