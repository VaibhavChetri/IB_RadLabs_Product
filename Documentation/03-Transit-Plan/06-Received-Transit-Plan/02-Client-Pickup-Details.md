# Client Pickup Details Page

## Overview

The Client Pickup Details page (`ClientPickupDetails.tsx`) provides a comprehensive pickup form for individual clients, including container management, image upload, and delivery challan generation. This page mirrors the Client Dispatch Details page but focuses on pickup operations.

## Page Location
- **File**: `src/pages/ClientPickupDetails.tsx`
- **Route**: `/transit-plan/received/details/:clientLocationId/:facilityId`
- **Navigation**: Accessed via client name hyperlink from Received Transit Plan Listing

## Features

### 📦 Container Management
- **Dynamic Container Types**: Loaded from `api/inventory/getClientSkuMap`
- **Count Input Fields**: `FloatingInput` components for each container type
- **Zero Quantity Filtering**: Only containers with count > 0 are processed
- **Local Storage Persistence**: Container counts saved across page refreshes

### 📸 Image Upload & Preview
- **Dual Upload Options**: "Take Picture" (camera) and "Choose File" (gallery)
- **Immediate Upload**: Images uploaded to S3 upon selection
- **Local Preview**: Base64 preview for all image formats (JPG, PNG, SVG, WebP)
- **SVG Sanitization**: DOMPurify integration for safe SVG rendering
- **Loading States**: Upload progress indicators

### 📋 Pickup Form
- **Adhoc Transportation**: Toggle switch for special transport needs
- **Vehicle Number**: Text input for pickup vehicle identification
- **Signature Name**: Pre-filled with user's first name, editable

### 💾 Data Persistence
- **Local Storage**: All form data persisted across page refreshes
- **Auto-save**: Real-time saving of form changes
- **Data Restoration**: Complete form state restoration on page load

## API Integration

### Key API Endpoints

#### 1. Get Client SKU Map (Container Types)
```typescript
GET /inventory/getClientSkuMap?clientId=101&facilityId=115
```

**Response Structure**:
```typescript
[
  {
    containerTypeId: number;
    containerType: string;
    sku: string;
    price: number;
    status: string;
  }
]
```

#### 2. Submit Received Inventory
```typescript
POST /inventory/receivedB2BInventory
```

**Payload**:
```typescript
{
  containers: Array<{ container_type_id: number; count: number }>;
  facility_id: number;
  transit_date: string;
  client_location_id: number;
  transit_id: string;
  adhoc: number;
}
```

#### 3. Initiate Transit Plan (Pickup)
```typescript
POST /transit-plan/initiate-transit-plan
```

**Payload**:
```typescript
{
  transitId: number;
  vehicleNumber: string;
  signatureName: string;
  dispatchConditionIds: string;
  dispatchImages: null;
  pickupImages: {
    challanPic: [];
    signaturePic: '';
    loadedVehiclePic: [{ path: string }];
  };
  containerTypes: [];
}
```

## Component Structure

### Main Components
1. **ContainerTypesSection**: Displays and manages container counts
2. **PickupFormSection**: Handles pickup form inputs and image upload

### Layout
- **Grid Layout**: 5-column grid on large screens, stacked on mobile
- **Container Types**: Left section (2 columns)
- **Pickup Form**: Right section (3 columns)

## Form Fields

### Container Types Section
- **Label**: Container type name
- **Input**: Count (default "0" disappears on focus)
- **Layout**: One below the other in FloatingInput format

### Pickup Form Section

#### Adhoc Transportation
- **Type**: Toggle checkbox
- **Label**: "Adhoc Transportation"

#### Pickup Vehicle Number
- **Type**: Text input
- **Label**: "Pickup Vehicle Number*"
- **Required**: Yes
- **Placeholder**: "Enter vehicle number"

#### Signature Name
- **Type**: Text input
- **Label**: "Signature Name"
- **Default**: User's first name
- **Editable**: Yes
- **Placeholder**: "Enter signature name"

#### Photo Upload
- **Label**: "Photo After Unloading Containers From Vehicle"
- **Options**:
  - 📸 Take Picture (camera)
  - 📁 Choose File (gallery)
- **Accepted Formats**: JPG, PNG, SVG, WebP
- **Upload**: Automatic on file selection
- **Preview**: Local preview with base64 encoding

## User Flow

1. **Navigation**: User clicks client name from Received Transit Plan Listing
2. **Load Data**: SKU map and saved form data loaded
3. **Input**: User enters container counts and pickup details
4. **Photo**: User takes/selects photo after unloading
5. **Submit**: User submits form
6. **Success**: Redirects back to Received Transit Plan Listing

## Local Storage

### Storage Key
```typescript
`client-receive-details-${clientLocationId}-${facilityId}`
```

### Stored Data
```typescript
{
  adhocTransportation: boolean;
  pickupVehicleNumber: string;
  signatureName: string;
  containerCounts: Record<number, number>;
  uploadedImageUrl: string;
  fileBase64: string;
  photographName: string;
}
```

## Differences from Dispatch Version

| Feature | Dispatch | Pickup |
|---------|----------|--------|
| Component | `DispatchFormSection` | `PickupFormSection` |
| Vehicle Label | "Dispatch Vehicle Number*" | "Pickup Vehicle Number*" |
| Photo Label | "After Loading Containers Into Vehicle" | "After Unloading Containers From Vehicle" |
| Submit API | `sendB2BInventory` | `receivedB2BInventory` |
| Storage Key | `client-details-` | `client-receive-details-` |
| Navigation Route | `/transit-plan/sent/client-details` | `/transit-plan/received/details` |
| Redirect After Submit | `/transit-plan/sent/plan` | `/transit-plan/received/plan` |
