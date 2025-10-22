# Edit Page Implementation Guide

## 🎯 What This Guide Teaches You
Learn how to create edit pages that:
- ✅ Work reliably without bugs
- ✅ Save data when you refresh the page
- ✅ Are easy to understand and maintain
- ✅ Follow the same pattern every time

## 🤔 Why Do We Need This Approach?

### The Problem with Regular Forms
```typescript
// ❌ BAD: This approach causes problems
const [formData, setFormData] = useState({});
// Problem 1: Data disappears when you refresh
// Problem 2: Hard to share data between components
// Problem 3: Complex state management
```

### Our Solution: Redux + localStorage
```typescript
// ✅ GOOD: Our approach
const { editData } = useSelector(state => state.myFeature);
// Benefit 1: Data survives page refresh
// Benefit 2: Easy to share between components
// Benefit 3: Simple state management
```

## 📋 Glossary (Important Terms)

| Term | What It Means | Example |
|------|---------------|---------|
| **Redux Slice** | A piece of Redux that manages one feature's data | `transitPlanSlice` manages all transit plan data |
| **localStorage** | Browser storage that survives page refresh | Like saving a file on your computer |
| **useCallback** | Prevents unnecessary re-renders | Makes your app faster |
| **Non-null assertion (!)** | Tells TypeScript "I know this value exists" | `data.id!` means "data.id definitely has a value" |

## 🔄 How Data Flows (Simple Version)

```
1. User clicks "Edit" button
   ↓
2. We save the row data to Redux
   ↓
3. User goes to edit page
   ↓
4. Edit page reads data from Redux
   ↓
5. User makes changes
   ↓
6. Changes update Redux automatically
   ↓
7. User clicks "Save"
   ↓
8. We send data to API
   ↓
9. Success! Clear Redux and go back
```

## 🛠️ Step-by-Step Implementation

### Step 1: Create Your Redux Slice (The Data Manager)

**What this does:** Creates a "data manager" for your feature that remembers edit data.

**File:** `src/store/slices/[yourFeature]Slice.ts`

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Step 1a: Define what your data looks like
export interface YourData {
  id: number;
  name: string;
  email: string;
  // Add other fields your API needs
}

// Step 1b: Define what your slice stores
export interface YourState {
  items: YourData[];           // List of all items
  editData: YourData | null;   // The item being edited
  loading: boolean;            // Is something loading?
  submitting: boolean;         // Is form being submitted?
  error: string | null;       // Any error messages?
}

// Step 1c: Set starting values
const initialState: YourState = {
  items: [],
  editData: null,    // No item being edited yet
  loading: false,    // Not loading
  submitting: false, // Not submitting
  error: null,      // No errors
};

// Step 1d: Create the slice (this is the magic part)
export const yourSlice = createSlice({
  name: 'yourFeature',
  initialState,
  reducers: {
    // Action 1: Store data for editing
    setEditData: (state, action: PayloadAction<YourData>) => {
      state.editData = action.payload;
    },
    
    // Action 2: Update a field in the edit data
    updateEditData: (state, action: PayloadAction<{ field: string; value: any }>) => {
      if (state.editData) {
        state.editData = {
          ...state.editData,
          [action.payload.field]: action.payload.value,
        };
      }
    },
    
    // Action 3: Clear edit data (when done editing)
    clearEditData: (state) => {
      state.editData = null;
    },
    
    // Action 4: Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    // Action 5: Set submitting state
    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.submitting = action.payload;
    },
  },
});

// Step 1e: Export the actions (these are what you'll use in components)
export const {
  setEditData,
  updateEditData,
  clearEditData,
  setLoading,
  setSubmitting,
} = yourSlice.actions;

export default yourSlice.reducer;
```

**💡 What just happened?**
- Created a "data manager" that can store, update, and clear edit data
- Defined what your data looks like
- Created actions to control the data

### Step 2: Connect Your Slice to the Store

**What this does:** Tells Redux about your new slice so it can manage the data.

**File:** `src/store/index.ts`

```typescript
import { configureStore } from '@reduxjs/toolkit';
import yourReducer from './slices/yourSlice'; // Import your new slice

export const store = configureStore({
  reducer: {
    // ... existing reducers
    yourFeature: yourReducer, // Add your slice here
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**💡 What just happened?**
- Connected your slice to the main Redux store
- Now Redux knows about your data manager

### Step 3: Create the Edit Page Component

**What this does:** Creates the actual edit page that users see.

**File:** `src/pages/EditYourFeature.tsx`

```typescript
import React, { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { clearEditData, updateEditData, setEditData, setSubmitting } from '../store/slices/yourSlice';
import { Button, Snackbar } from '../components/ui';
import { useNavigate } from 'react-router-dom';

const EditYourFeature: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Step 3a: Get data from Redux
  const { editData, submitting } = useSelector((state: RootState) => state.yourFeature);
  
  // Step 3b: Set up success/error messages
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'info',
  });

  // Step 3c: Restore data if page is refreshed
  useEffect(() => {
    if (!editData) {
      const savedData = localStorage.getItem('editYourFeatureData');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          dispatch(setEditData(parsedData));
        } catch (error) {
          console.error('Error parsing saved edit data:', error);
        }
      }
    }
  }, [dispatch, editData]);

  // Step 3d: Save data to localStorage whenever it changes
  useEffect(() => {
    if (editData) {
      localStorage.setItem('editYourFeatureData', JSON.stringify(editData));
    }
  }, [editData]);

  // Step 3e: Create function to update form fields
  const handleFieldUpdate = useCallback(
    (field: string, value: any) => {
      dispatch(updateEditData({ field, value }));
    },
    [dispatch]
  );

  // Step 3f: Handle form submission
  const handleSave = async () => {
    dispatch(setSubmitting(true));
    try {
      // Create the data to send to API
      const payload = {
        id: editData!.id,
        name: editData!.name,
        email: editData!.email,
        // Add other fields your API needs
      };

      // Call your API service
      const response = await YourApiService.updateItem(payload);
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Item updated successfully!',
        type: 'success',
      });

      // Clear data and go back after 1.5 seconds
      setTimeout(() => {
        dispatch(clearEditData());
        localStorage.removeItem('editYourFeatureData');
        navigate('/your-feature/listing');
      }, 1500);
    } catch (error: any) {
      // Show error message
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update item',
        type: 'error',
      });
    } finally {
      dispatch(setSubmitting(false));
    }
  };

  // Step 3g: Show message if no data to edit
  if (!editData) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>No Data to Edit</h2>
          <p className='text-gray-600 mb-4'>Please select an item to edit from the listing page.</p>
          <Button
            onClick={() => navigate('/your-feature/listing')}
            className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700'
          >
            Go to Listing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Step 3h: Your form goes here */}
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700'>Name</label>
            <input
              type='text'
              value={editData.name}
              onChange={(e) => handleFieldUpdate('name', e.target.value)}
              className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2'
            />
          </div>
          
          <div>
            <label className='block text-sm font-medium text-gray-700'>Email</label>
            <input
              type='email'
              value={editData.email}
              onChange={(e) => handleFieldUpdate('email', e.target.value)}
              className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2'
            />
          </div>
        </div>
        
        {/* Step 3i: Action buttons */}
        <div className='flex justify-end gap-4 mt-6'>
          <Button
            onClick={() => {
              dispatch(clearEditData());
              localStorage.removeItem('editYourFeatureData');
              navigate('/your-feature/listing');
            }}
            className='px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400'
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={submitting}
            className={`px-6 py-2 rounded-md font-medium ${
              submitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Step 3j: Success/Error message */}
      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
};

export default EditYourFeature;
```

**💡 What just happened?**
- Created a complete edit page that reads from Redux
- Added localStorage persistence (survives page refresh)
- Created form fields that update Redux automatically
- Added save/cancel functionality

### Step 4: Add Edit Button to Listing Page

**What this does:** Makes the "Edit" button work by storing data in Redux.

**File:** `src/pages/YourFeatureListing.tsx`

```typescript
import { setEditData } from '../store/slices/yourSlice';

// In your table row, add this to the edit button:
<button
  onClick={() => {
    // Store the row data in Redux for editing
    dispatch(setEditData(row));
    // Go to edit page
    navigate('/your-feature/edit');
  }}
  className='text-blue-600 hover:text-blue-800'
>
  Edit
</button>
```

**💡 What just happened?**
- When user clicks "Edit", we save the row data to Redux
- Then navigate to the edit page
- The edit page will read this data from Redux

### Step 5: Add Route to App

**What this does:** Tells React Router about your new edit page.

**File:** `src/App.tsx`

```typescript
import EditYourFeature from './pages/EditYourFeature';

// Add this route (no ID needed - we use Redux instead):
<Route path='/your-feature/edit' element={<EditYourFeature />} />
```

**💡 What just happened?**
- Added a route so users can navigate to your edit page
- No ID in URL because we use Redux to pass data

## 🎉 You're Done! Here's What You Built

### ✅ What Works Now:
1. **Click "Edit"** → Data goes to Redux → Navigate to edit page
2. **Edit form fields** → Updates Redux automatically
3. **Refresh page** → Data is restored from localStorage
4. **Click "Save"** → Sends data to API → Shows success message
5. **Click "Cancel"** → Clears data → Goes back to listing

### 🔧 Common Patterns You'll Use

#### Pattern 1: Simple Field Update
```typescript
// For basic text inputs
<input
  value={editData.name}
  onChange={(e) => handleFieldUpdate('name', e.target.value)}
/>
```

#### Pattern 2: Dropdown with Related Fields
```typescript
// When selecting a vehicle, also update driver info
const handleVehicleChange = useCallback(
  (vehicleId: string) => {
    const selectedVehicle = vehicles.find(v => v.id === vehicleId);
    if (selectedVehicle) {
      dispatch(updateEditData({ field: 'vehicle_id', value: selectedVehicle.id }));
      dispatch(updateEditData({ field: 'driver_name', value: selectedVehicle.driver_name }));
      dispatch(updateEditData({ field: 'driver_phone', value: selectedVehicle.driver_phone }));
    }
  },
  [dispatch, vehicles]
);
```

#### Pattern 3: Date/Time Fields
```typescript
// For date inputs
<input
  type='date'
  value={editData.date}
  onChange={(e) => handleFieldUpdate('date', e.target.value)}
/>

// For time inputs (if you have a custom TimeInput component)
<TimeInput
  value={editData.time}
  onChange={(time) => handleFieldUpdate('time', time)}
/>
```

## 🚨 Common Mistakes to Avoid

### ❌ Don't Do This:
```typescript
// Don't use local state for edit data
const [formData, setFormData] = useState({});

// Don't forget to clear localStorage
// localStorage will keep old data forever

// Don't use useEffect for simple updates
useEffect(() => {
  setFormData(editData); // This causes infinite loops
}, [editData]);
```

### ✅ Do This Instead:
```typescript
// Use Redux state directly
const { editData } = useSelector(state => state.yourFeature);

// Always clear localStorage on cancel/success
localStorage.removeItem('editYourFeatureData');

// Use useCallback for event handlers
const handleUpdate = useCallback((field, value) => {
  dispatch(updateEditData({ field, value }));
}, [dispatch]);
```

## 🆘 Troubleshooting Guide

### Problem: "Data disappears when I refresh"
**Solution:** Check your localStorage key name matches in both save and restore

### Problem: "Form doesn't update when I type"
**Solution:** Make sure you're using `handleFieldUpdate` in your onChange handlers

### Problem: "Infinite loops in console"
**Solution:** Remove `onChange` from useEffect dependencies in custom components

### Problem: "Edit button doesn't work"
**Solution:** Make sure you're dispatching `setEditData(row)` in your edit button

## 🎯 Quick Checklist

Before you finish, make sure you have:
- [ ] Created your Redux slice
- [ ] Added slice to store
- [ ] Created edit page component
- [ ] Added edit button to listing page
- [ ] Added route to App.tsx
- [ ] Tested: Edit → Change data → Save
- [ ] Tested: Edit → Refresh page → Data still there
- [ ] Tested: Edit → Cancel → Goes back to listing

## 🏆 Congratulations!

You now have a working edit page that:
- ✅ Follows best practices
- ✅ Handles edge cases
- ✅ Is easy to maintain
- ✅ Can be copied for other features

**Remember:** This pattern works for ANY edit page. Just change the feature name and data structure!
