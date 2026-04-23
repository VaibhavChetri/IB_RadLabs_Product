# 🏗️ Master Plan Creation - Component Architecture & File Flow

## 🎯 Overview
This document provides a detailed breakdown of the Create Master Plan page components, their responsibilities, and how they work together. This helps developers understand the codebase structure and data flow.

## ✅ Current Implementation Status
**Status:** ✅ **COMPLETED** - Fully documented component architecture

### 🎨 Component Structure Overview
- **Main Page**: CreateMasterPlan.tsx - Orchestration and submission logic
- **Form Components**: MasterPlanForm, TransitSection, TransitRow - Form management
- **UI Components**: TimeInput, BorderlessDropdown, Snackbar - Reusable UI elements
- **State Management**: useMasterPlanData hook - Centralized data management
- **API Integration**: TransitPlanApi, CommonApiService - Backend communication

## 🏗️ Component Hierarchy

```
CreateMasterPlan (Main Page)
├── MasterPlanForm (Header Section)
│   ├── FloatingDropdown (Facility Selection)
│   └── FloatingDropdown (Client Selection)
├── TransitSection (Dispatch Section)
│   ├── TransitRow (Row 1)
│   │   ├── TimeInput (Time Selection)
│   │   ├── BorderlessDropdown (Vehicle Selection)
│   │   └── Date Input (Date Selection)
│   ├── TransitRow (Row 2)
│   └── Button (Add More)
├── TransitSection (Pickup Section)
│   ├── TransitRow (Row 1)
│   ├── TransitRow (Row 2)
│   └── Button (Add More)
├── Summary Section
│   └── Button (Submit)
└── Snackbar (Notifications)
```

## 📁 File Structure & Responsibilities

### 🎯 **Main Page Component**
**File**: `src/pages/CreateMasterPlan.tsx`
**Purpose**: Main container and orchestration
**Responsibilities**:
- Manages overall page state and submission logic
- Coordinates between all child components
- Handles API submission and error states
- Manages Snackbar notifications
- Orchestrates form validation

**Key Functions**:
```typescript
const handleSubmit = async () => {
  // Form validation
  // API call to createMasterPlan
  // Success/error handling
  // Snackbar notifications
}
```

### 🎛️ **Header Form Component**
**File**: `src/components/MasterPlanForm.tsx`
**Purpose**: Facility and Client selection
**Responsibilities**:
- Renders facility dropdown
- Renders client dropdown
- Handles dropdown value changes
- Passes data up to parent

**Props Interface**:
```typescript
interface MasterPlanFormProps {
  facilities: FacilityOption[];
  clients: ClientByCityOption[];
  facilityId: string;
  clientId: string;
  onFacilityChange: (value: string) => void;
  onClientChange: (value: string) => void;
}
```

### 📦 **Transit Section Component**
**File**: `src/components/TransitSection.tsx`
**Purpose**: Container for Dispatch/Pickup entries
**Responsibilities**:
- Renders section header with count
- Manages transit entries list
- Handles add/remove operations
- Renders TransitRow components
- Provides Add button functionality

**Props Interface**:
```typescript
interface TransitSectionProps {
  type: 'dispatch' | 'pickup';
  transits: TransitEntry[];
  label: string;
  color: string;
  vehicles: VehicleOption[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: keyof TransitEntry, value: string) => void;
}
```

### 📋 **Transit Row Component**
**File**: `src/components/TransitRow.tsx`
**Purpose**: Individual transit entry row
**Responsibilities**:
- Renders serial number
- Renders delete button (with disabled state for single row)
- Renders date input with picker
- Renders time input component
- Renders vehicle dropdown
- Handles individual field updates

**Props Interface**:
```typescript
interface TransitRowProps {
  transit: TransitEntry;
  index: number;
  vehicles: VehicleOption[];
  onUpdate: (field: keyof TransitEntry, value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}
```

### ⏰ **Time Input Component**
**File**: `src/components/ui/TimeInput.tsx`
**Purpose**: Custom time input with AM/PM
**Responsibilities**:
- Renders hour/minute inputs
- Handles AM/PM toggle
- Validates time format
- Converts 12-hour to 24-hour format
- Provides keyboard navigation
- Auto-advances between fields

**Props Interface**:
```typescript
interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}
```

### 🔽 **Borderless Dropdown Component**
**File**: `src/components/ui/BorderlessDropdown.tsx`
**Purpose**: Inline dropdown for vehicle selection
**Responsibilities**:
- Renders dropdown trigger
- Manages dropdown open/close state
- Handles option selection
- Provides fixed positioning to avoid clipping
- Renders dropdown options list

**Props Interface**:
```typescript
interface BorderlessDropdownProps {
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}
```

### 🍞 **Snackbar Component**
**File**: `src/components/ui/Snackbar.tsx`
**Purpose**: Success/error notifications
**Responsibilities**:
- Displays notification messages
- Handles auto-hide functionality
- Provides different types (success, error, info)
- Manages visibility state

## 🔄 Data Flow Architecture

### 📊 **State Management Hook**
**File**: `src/hooks/useMasterPlanData.ts`
**Purpose**: Centralized data management
**Responsibilities**:
- Manages all form state
- Handles API calls for dropdowns
- Provides data transformation utilities
- Manages localStorage persistence
- Handles form validation
- Generates submission payload

**Key Functions**:
```typescript
// Data fetching
const loadData = async () => {
  // Fetch facilities, clients, vehicles, transit types
}

// State management
const updateData = (newData: Partial<MasterPlanData>) => {
  // Update form state
}

// Form operations
const addTransit = (type: 'dispatch' | 'pickup') => {
  // Add new transit entry
}

const removeTransit = (type: 'dispatch' | 'pickup', id: string) => {
  // Remove transit entry
}

// Validation
const isFormValid = () => {
  // Check if form is ready for submission
}

// Submission
const getSubmitPayload = () => {
  // Transform data for API submission
}
```

### 🔗 **API Service Layer**
**File**: `src/services/transitPlanApi.ts`
**Purpose**: API communication
**Responsibilities**:
- Handles master plan creation API call
- Manages request/response transformation
- Provides error handling
- Integrates with authentication

**Key Functions**:
```typescript
export const TransitPlanApi = {
  async createMasterPlan(payload: MasterPlanPayload): Promise<ApiResponse<any>> {
    return api.post('/transit-plan/create-master-transit-plan', payload);
  }
}
```

### 🌐 **Common API Service**
**File**: `src/services/commonApi.ts`
**Purpose**: Shared API calls
**Responsibilities**:
- Provides facilities data
- Provides clients data
- Provides vehicles data
- Provides transit types data
- Handles data transformation
- Provides fallback data

## 🔄 Data Flow Sequence

### 1. **Page Initialization**
```
CreateMasterPlan mounts
    ↓
useMasterPlanData hook initializes
    ↓
loadData() fetches dropdown data
    ↓
Components render with initial state
```

### 2. **User Interaction Flow**
```
User selects facility/client
    ↓
MasterPlanForm calls onFacilityChange/onClientChange
    ↓
useMasterPlanData updates state
    ↓
localStorage saves data
    ↓
Components re-render with new data
```

### 3. **Transit Entry Management**
```
User clicks "Add" button
    ↓
TransitSection calls onAdd
    ↓
useMasterPlanData.addTransit() creates new entry
    ↓
TransitRow components render
    ↓
User fills in date/time/vehicle
    ↓
TransitRow calls onUpdate
    ↓
useMasterPlanData.updateTransit() updates state
```

### 4. **Form Submission Flow**
```
User clicks "Create Master Plan"
    ↓
CreateMasterPlan.handleSubmit() validates form
    ↓
useMasterPlanData.getSubmitPayload() transforms data
    ↓
TransitPlanApi.createMasterPlan() calls API
    ↓
Success: Snackbar shows success, form clears
    ↓
Error: Snackbar shows error message
```

## 🎨 Styling & Layout

### 📱 **Responsive Design**
- **Desktop**: Full table layout with all columns visible
- **Mobile**: Horizontal scroll with minimum widths
- **Tablet**: Optimized spacing and touch targets

### 🎯 **Component Styling**
- **MasterPlanForm**: Card layout with shadow
- **TransitSection**: Card layout with colored headers
- **TransitRow**: Table row with consistent spacing
- **TimeInput**: Inline inputs with green accent
- **BorderlessDropdown**: Transparent background, fixed positioning

## 🔧 Development Guidelines

### 📝 **Adding New Features**
1. **Identify Component**: Which component needs modification?
2. **Update Props**: Add new props to interface
3. **Update State**: Modify useMasterPlanData hook
4. **Update UI**: Modify component rendering
5. **Test Integration**: Ensure data flows correctly

### 🐛 **Debugging Tips**
1. **Check Console Logs**: Extensive logging in handleSubmit
2. **Inspect State**: Use React DevTools to see state changes
3. **Check localStorage**: Verify data persistence
4. **Network Tab**: Monitor API calls and responses
5. **Component Props**: Verify props are passed correctly

### ⚡ **Performance Considerations**
- **Memoization**: Components use React.memo where appropriate
- **State Updates**: Batched updates to prevent unnecessary re-renders
- **API Calls**: Cached dropdown data to avoid repeated requests
- **localStorage**: Debounced saves to prevent excessive writes

## 🔗 File Dependencies

### 📦 **Import Dependencies**
```
CreateMasterPlan.tsx
├── imports MasterPlanForm
├── imports TransitSection
├── imports useMasterPlanData
├── imports TransitPlanApi
└── imports Snackbar

MasterPlanForm.tsx
├── imports FloatingDropdown
└── imports FacilityOption, ClientByCityOption

TransitSection.tsx
├── imports TransitRow
├── imports Button
└── imports TransitEntry, VehicleOption

TransitRow.tsx
├── imports TimeInput
├── imports BorderlessDropdown
└── imports TransitEntry, VehicleOption

useMasterPlanData.ts
├── imports CommonApiService
├── imports useSelector (Redux)
└── imports various option types
```

### 🔄 **Data Flow Dependencies**
- **Redux State**: User city_id for API calls
- **localStorage**: Form data persistence
- **API Services**: Dropdown data and submission
- **Component Props**: Data passing between components

## 📚 Related Documentation
- [Master Plan Creation Feature Guide](./02-Master-Plan-Creation.md)
- [Master Plan Creation API Documentation](../06-API-Reference/01-Master-Plan-Creation-API.md)
- [UI Components Guide](../04-UI-Components/README.md)
- [Component Architecture](../01-Architecture/04-Component-Architecture.md)
