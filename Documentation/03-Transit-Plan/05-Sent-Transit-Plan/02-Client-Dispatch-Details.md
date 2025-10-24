# Client Dispatch Details

## Overview

The Client Dispatch Details page (`ClientDispatchDetails.tsx`) provides a comprehensive dispatch form for individual clients, including container management, image upload, and delivery challan generation.

## Page Location
- **File**: `src/pages/ClientDispatchDetails.tsx`
- **Route**: `/client-dispatch-details/:clientLocationId/:facilityId`
- **Navigation**: Accessed via client name hyperlink from Sent Transit Plan Listing

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

### 📋 Dispatch Form
- **Adhoc Transportation**: Toggle switch for special transport needs
- **Vehicle Number**: Text input for dispatch vehicle identification
- **Signature Name**: Pre-filled with user's first name, editable
- **Form Validation**: Required field validation and error handling

### 💾 Data Persistence
- **Local Storage**: All form data persisted across page refreshes
- **Auto-save**: Real-time saving of form changes
- **Data Restoration**: Complete form state restoration on page load

## API Integration

### Authentication
```typescript
// Uses same credentials as Sent Transit Plan Listing
username: 'ch-mumbai'
password: 'ch-mumbai'
```

### Key API Endpoints

#### 1. Get Client SKU Map (Container Types)
```typescript
GET /api/inventory/getClientSkuMap?clientId={clientLocationId}&facilityId={facilityId}
```
**Response Structure**:
```typescript
{
  status: "Success",
  status_code: 200,
  message: "Client Sku Mapping",
  result: Array<{
    id: number;
    containerTypeId: number;
    containerType: string;
    sku: string;
    count: number;
    price: number;
    status: string;
    facilityId: number;
    clientId: number;
  }>
}
```

#### 2. Upload Image
```typescript
POST /api/image/uploadImage
Content-Type: multipart/form-data
```
**Request Body**:
```typescript
FormData {
  file: File
}
```
**Response Structure**:
```typescript
{
  status_code: 200,
  status: "success",
  message: "File(s) has been created successfully",
  data: {
    imgLocation: ["https://s3-url/image.webp"]
  }
}
```

#### 3. Send B2B Inventory
```typescript
POST /api/inventory/sendB2BInventory
```
**Request Body**:
```typescript
{
  clientId: number;
  facilityId: number;
  containerCounts: Record<number, number>;
  adhocTransportation: boolean;
  dispatchVehicleNumber: string;
  signatureName: string;
  uploadedImageUrl: string;
}
```

#### 4. Initiate Transit Plan
```typescript
POST /api/transit-plan/initiateTransitPlan
```
**Request Body**:
```typescript
{
  transitPlanId: number;
  dispatchVehicleNumber: string;
  signatureName: string;
  uploadedImageUrl: string;
}
```

## Component Architecture

### Main Component Structure
```typescript
// ClientDispatchDetails.tsx
├── PageHeader (Client name and navigation)
├── ContainerTypesSection (Dynamic container inputs)
├── DispatchFormSection (Form fields and controls)
├── ImagePreview (Image upload and preview)
└── Submit Button (Form submission)
```

### Refactored Components

#### 1. ContainerTypesSection
**File**: `src/components/ContainerTypesSection.tsx`
**Purpose**: Manages container type display and count inputs
**Props**:
```typescript
interface ContainerTypesSectionProps {
  containerTypes: ContainerType[];
  containerCounts: Record<number, number>;
  onCountChange: (containerTypeId: number, count: number) => void;
}
```

#### 2. DispatchFormSection
**File**: `src/components/DispatchFormSection.tsx`
**Purpose**: Handles dispatch form fields
**Props**:
```typescript
interface DispatchFormSectionProps {
  adhocTransportation: boolean;
  dispatchVehicleNumber: string;
  signatureName: string;
  onAdhocChange: (value: boolean) => void;
  onVehicleNumberChange: (value: string) => void;
  onSignatureChange: (value: string) => void;
}
```

#### 3. ImagePreview
**File**: `src/components/ImagePreview.tsx`
**Purpose**: Image upload and preview functionality
**Props**:
```typescript
interface ImagePreviewProps {
  imageUrl: string;
  uploadingImage: boolean;
  onFileSelect: (file: File) => void;
  onTakePicture: () => void;
}
```

### Custom Hooks

#### 1. useFileUpload
**File**: `src/hooks/useFileUpload.ts`
**Purpose**: Manages file upload logic and image preview
**Returns**:
```typescript
{
  imageUrl: string;
  uploadedImageUrl: string;
  uploadingImage: boolean;
  handleFileUpload: (file: File) => Promise<void>;
  restoreFromLocalStorage: (data: any) => void;
}
```

#### 2. useLocalStorage
**File**: `src/hooks/useLocalStorage.ts`
**Purpose**: Handles local storage persistence
**Returns**:
```typescript
{
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => any;
  clearLocalStorage: () => void;
}
```

## Data Flow

### 1. Page Initialization
```typescript
useEffect(() => {
  // Load saved data from localStorage
  const savedData = loadFromLocalStorage();
  
  // Fetch container types from API
  fetchContainerTypes();
  
  // Set user signature name
  setSignatureName(user?.name?.split(' ')[0] || '');
}, []);
```

### 2. Container Type Loading
```typescript
const fetchContainerTypes = async () => {
  const response = await TransitPlanApi.getClientSkuMap(clientLocationId, facilityId);
  setContainerTypes(response);
  
  // Merge with saved counts
  const savedCounts = loadFromLocalStorage()?.containerCounts || {};
  setContainerCounts({ ...savedCounts });
};
```

### 3. Image Upload Process
```typescript
const handleFileUpload = async (file: File) => {
  setUploadingImage(true);
  
  // Create local preview
  const base64 = await convertToBase64(file);
  setImageUrl(base64);
  
  // Upload to S3
  const response = await TransitPlanApi.uploadImage(file);
  setUploadedImageUrl(response.data.imgLocation[0]);
  
  setUploadingImage(false);
};
```

### 4. Form Submission
```typescript
const handleSubmit = async () => {
  // Step 1: Send B2B Inventory
  const inventoryResponse = await TransitPlanApi.sendB2BInventory({
    clientId: clientLocationId,
    facilityId: facilityId,
    containerCounts: filteredContainerCounts,
    adhocTransportation,
    dispatchVehicleNumber,
    signatureName,
    uploadedImageUrl
  });
  
  // Step 2: Initiate Transit Plan
  const transitResponse = await TransitPlanApi.initiateTransitPlan({
    transitPlanId: transitPlanRow.id,
    dispatchVehicleNumber,
    signatureName,
    uploadedImageUrl
  });
  
  // Clear localStorage and navigate back
  clearLocalStorage();
  navigate('/transit-plan/sent/plan');
};
```

## State Management

### Local State
```typescript
const [containerTypes, setContainerTypes] = useState<ContainerType[]>([]);
const [containerCounts, setContainerCounts] = useState<Record<number, number>>({});
const [adhocTransportation, setAdhocTransportation] = useState(false);
const [dispatchVehicleNumber, setDispatchVehicleNumber] = useState('');
const [signatureName, setSignatureName] = useState('');
const [imageUrl, setImageUrl] = useState('');
const [uploadedImageUrl, setUploadedImageUrl] = useState('');
const [uploadingImage, setUploadingImage] = useState(false);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### Local Storage Structure
```typescript
{
  containerCounts: Record<number, number>;
  adhocTransportation: boolean;
  dispatchVehicleNumber: string;
  signatureName: string;
  uploadedImageUrl: string;
  fileBase64: string;
  photograph: string;
  timestamp: number;
}
```

## UI Components Used

### Core Components
- **`FloatingInput`**: Container count inputs and form fields
- **`Switch`**: Adhoc transportation toggle
- **`Button`**: Submit and navigation buttons
- **`PageHeader`**: Page title and navigation
- **`Snackbar`**: Success/error notifications

### Custom Components
- **`ContainerTypesSection`**: Container management
- **`DispatchFormSection`**: Form fields
- **`ImagePreview`**: Image upload and preview

## Image Handling

### Supported Formats
- **JPG/JPEG**: Standard photo format
- **PNG**: High-quality images with transparency
- **SVG**: Vector graphics with DOMPurify sanitization
- **WebP**: Modern web image format

### Preview Implementation
```typescript
// For SVG files
if (file.type === 'image/svg+xml') {
  const svgContent = atob(base64.split(',')[1]);
  const sanitizedSvg = DOMPurify.sanitize(svgContent);
  // Render with dangerouslySetInnerHTML
} else {
  // Standard img tag for other formats
  <img src={imageUrl} alt="Preview" />
}
```

### Camera Integration
```typescript
// Take Picture button
<input
  type="file"
  accept="image/*"
  capture="environment"
  onChange={handleFileUpload}
/>
```

## Error Handling

### API Errors
- **Upload Failures**: Retry mechanism with user feedback
- **Network Issues**: Offline state handling
- **Validation Errors**: Field-specific error messages

### User Experience
- **Loading States**: Clear progress indicators
- **Success Feedback**: Confirmation messages
- **Error Recovery**: Retry options and fallbacks

## Performance Optimizations

### Image Processing
- **Base64 Conversion**: Efficient file-to-base64 conversion
- **Memory Management**: Proper cleanup of blob URLs
- **Lazy Loading**: Deferred image processing

### State Management
- **Debounced Saves**: Reduced localStorage writes
- **Selective Updates**: Only changed data persisted
- **Cleanup**: Proper component unmounting

## Security Considerations

### SVG Sanitization
- **DOMPurify**: Prevents XSS attacks in SVG content
- **Content Validation**: Safe SVG rendering
- **Input Sanitization**: All user inputs validated

### File Upload Security
- **Type Validation**: Only image files accepted
- **Size Limits**: Reasonable file size restrictions
- **S3 Integration**: Secure cloud storage

## Future Enhancements

### Planned Features
1. **Bulk Container Operations**: Multi-container management
2. **Template System**: Saved form templates
3. **Offline Support**: Service worker implementation
4. **Advanced Validation**: Real-time form validation
5. **Audit Trail**: Change tracking and history

### Technical Improvements
1. **Image Compression**: Client-side image optimization
2. **Progressive Upload**: Chunked file uploads
3. **Caching**: API response caching
4. **Accessibility**: WCAG compliance improvements
