# Redux State Management

This document explains **why** we use Redux, **how** state flows through the application, and **what** each piece does in the bigger picture.

## 🤔 **Why Redux? The Problem We're Solving**

### **The Problem**: Managing complex state across multiple components
```
❌ Without Redux:
Component A needs user data
Component B needs user data  
Component C needs user data
→ Prop drilling nightmare!
→ State scattered everywhere
→ Hard to debug
→ Inconsistent data
```

### **The Solution**: Centralized state management
```
✅ With Redux:
All components get user data from same place
→ Single source of truth
→ Predictable state updates
→ Easy to debug
→ Consistent data everywhere
```

### **When to Use Redux vs React State**

#### **Use Redux For:**
- ✅ **User authentication data** (needed everywhere)
- ✅ **Client locations** (shared across pages)
- ✅ **Menu permissions** (affects navigation)
- ✅ **Any data used by multiple components**

#### **Use React State For:**
- ✅ **Form input values** (component-specific)
- ✅ **Loading spinners** (UI state)
- ✅ **Modal open/closed** (local UI state)
- ✅ **Component-specific data**

### **Decision Tree: "Should I Use Redux?"**
```
Is this data used by multiple components?
├── Yes → Use Redux
└── No → Use React State
    └── Is this data needed after component unmounts?
        ├── Yes → Use Redux
        └── No → Use React State
```

## 🎯 **State Flow Examples: "Real-World Scenarios"**

### **Scenario 1: User Logs In**

#### **The Journey**
```
1. 👤 User enters credentials in Login.tsx
   ↓
2. 🔐 Login.tsx calls authApi.login()
   ↓
3. ✅ API returns user data + JWT token
   ↓
4. 📤 Login.tsx dispatches loginSuccess(userData)
   ↓
5. 🔄 Auth reducer updates state
   ↓
6. 🧭 Sidebar reads user data from state
   ↓
7. 🎨 Sidebar shows user name and role
```

#### **Code Flow**
```typescript
// 1. Login.tsx - User action
const handleSubmit = async () => {
  const result = await AuthApiService.login(credentials);
  
  // 2. Dispatch action to Redux
  dispatch(loginSuccess({
    id: result.user.id,
    name: result.user.name,
    email: result.user.email,
    // ... other user data
  }));
};

// 3. Auth slice - State update
loginSuccess: (state, action) => {
  state.user = action.payload;
  state.isAuthenticated = true;
}

// 4. Sidebar.tsx - Read state
const { user } = useSelector(state => state.auth);
return <div>Welcome, {user.name}!</div>;
```

### **Scenario 2: User Selects a Client for Editing**

#### **The Journey**
```
1. 👤 User clicks "Edit" button in ManageClients
   ↓
2. 📤 ManageClients dispatches setSelectedLocation(location)
   ↓
3. 🔄 Client reducer updates selectedLocation
   ↓
4. 💾 Location also saved to localStorage (for page refresh)
   ↓
5. 🏠 User navigates to EditClient page
   ↓
6. 📖 EditClient reads selectedLocation from state
   ↓
7. 📝 Form pre-fills with location data
```

#### **Code Flow**
```typescript
// 1. ManageClients.tsx - User action
const handleEdit = (location) => {
  dispatch(setSelectedLocation(location));
  navigate('/clients/edit');
};

// 2. Client slice - State update
setSelectedLocation: (state, action) => {
  state.selectedLocation = action.payload;
  localStorage.setItem('selectedClientLocation', JSON.stringify(action.payload));
}

// 3. EditClient.tsx - Read state
const { selectedLocation } = useSelector(state => state.client);

// 4. Pre-fill form
useEffect(() => {
  if (selectedLocation) {
    setFormData({
      name: selectedLocation.restaurant_name,
      address: selectedLocation.address_1,
      // ... other fields
    });
  }
}, [selectedLocation]);
```

### **Scenario 3: Page Refresh (Data Persistence)**

#### **The Journey**
```
1. 🔄 User refreshes EditClient page
   ↓
2. 🚀 App.tsx runs on startup
   ↓
3. 💾 App.tsx reads user data from localStorage
   ↓
4. 📤 App.tsx dispatches restoreAuth(userData)
   ↓
5. 🔄 Auth reducer restores authentication state
   ↓
6. 🛡️ ProtectedRoute checks authentication
   ↓
7. ✅ User stays on EditClient page (not redirected to login)
```

#### **Code Flow**
```typescript
// 1. App.tsx - Startup
useEffect(() => {
  const userData = TokenManager.getUserData();
  if (userData) {
    dispatch(restoreAuth(userData));
  }
}, []);

// 2. Auth slice - Restore state
restoreAuth: (state, action) => {
  state.user = action.payload;
  state.isAuthenticated = true;
  state.isInitialized = true;
}

// 3. ProtectedRoute - Check auth
const { isAuthenticated } = useSelector(state => state.auth);
if (!isAuthenticated) {
  navigate('/login');
}
```

## 🏪 **Redux Store Configuration**

```typescript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import clientReducer from './slices/clientSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    client: clientReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

## 🔐 Authentication State (`authSlice.ts`)

### State Interface

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  userTypeId?: number;
  city_id?: number;        // User's city ID for location-based features
  state_id?: number;       // User's state ID for location-based features
  menuPermissions?: Record<string, MenuPermission>;
}

export interface MenuPermission {
  id: number;
  name: string;
  permission: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;  // Prevents premature redirects
}
```

### Actions and Reducers

#### 1. **Login Success Action**
```typescript
loginSuccess: (state, action: PayloadAction<User>) => {
  state.user = action.payload;
  state.isAuthenticated = true;
  state.isInitialized = true;
}
```

**Usage Example:**
```typescript
// In Login.tsx
dispatch(loginSuccess({
  id: result.data.user.id.toString(),
  name: `${result.data.user.first_name} ${result.data.user.last_name}`.trim(),
  email: result.data.user.email,
  role: `User Type ${result.data.user.user_type_id}`,
  userTypeId: result.data.user.user_type_id,
  city_id: result.data.user.city_id,
  state_id: (result.data.user as unknown as { state_id: number }).state_id,
  menuPermissions: result.data.menu_permissions || {},
}));
```

#### 2. **Logout Action**
```typescript
logout: (state) => {
  state.user = null;
  state.isAuthenticated = false;
  state.isInitialized = true;
}
```

#### 3. **Restore Auth Action**
```typescript
restoreAuth: (state, action: PayloadAction<User>) => {
  state.user = action.payload;
  state.isAuthenticated = true;
  state.isInitialized = true;
}
```

**Usage Example:**
```typescript
// In App.tsx - Restore auth on app initialization
useEffect(() => {
  const userData = TokenManager.getUserData();
  const menuPermissions = TokenManager.getMenuPermissions();
  
  if (userData && menuPermissions) {
    const user = {
      id: userData?.id || 'Unknown',
      name: userData?.name || 'Unknown User',
      email: userData?.email || 'unknown@example.com',
      role: userData?.role || 'Unknown Role',
      userTypeId: userData?.userTypeId || 0,
      city_id: userData?.city_id || undefined,
      state_id: userData?.state_id || undefined,
      menuPermissions: menuPermissions || {},
    };
    dispatch(restoreAuth(user));
  } else {
    dispatch(initializeAuth());
  }
}, [dispatch]);
```

#### 4. **Initialize Auth Action**
```typescript
initializeAuth: (state) => {
  state.isInitialized = true;
}
```

## 👥 Client State (`clientSlice.ts`)

### State Interface

```typescript
export interface ClientState {
  locations: ClientLocation[];
  selectedLocation: ClientLocation | null;
}

export interface ClientLocation {
  id: number;
  restaurant_name: string;
  address_1: string;
  address_2: string;
  landmark: string;
  zipcode: string;
  latitude: string;
  longitude: string;
  city_id: number;
  state_id: number;
  country_id: number;
  locationTypeId: number;
  location_type_name: string;
  billing_type_id: number;
  billingType: string;
  billing_sub_type_id?: number;
  subTypeName?: string;
  impactTypes: ImpactType[];
  fixedPrice?: number;
  hasOnSiteManPower: boolean;
  status: string;
  facilityId?: number;
  facilityName?: string;
}
```

### Actions and Reducers

#### 1. **Set Locations Action**
```typescript
setLocations: (state, action: PayloadAction<ClientLocation[]>) => {
  state.locations = action.payload;
}
```

**Usage Example:**
```typescript
// In ManageClients.tsx
dispatch(setLocations(locations));
```

#### 2. **Set Selected Location Action**
```typescript
setSelectedLocation: (state, action: PayloadAction<ClientLocation>) => {
  state.selectedLocation = action.payload;
  // Persist to localStorage for page refresh
  localStorage.setItem('selectedClientLocation', JSON.stringify(action.payload));
}
```

#### 3. **Restore Selected Location Action**
```typescript
restoreSelectedLocation: (state, action: PayloadAction<ClientLocation>) => {
  state.selectedLocation = action.payload;
}
```

**Usage Example:**
```typescript
// In EditClient.tsx - Restore on page refresh
useEffect(() => {
  if (!selectedLocation) {
    const savedLocation = localStorage.getItem('selectedClientLocation');
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);
        dispatch(restoreSelectedLocation(location));
      } catch (error) {
        console.error('Failed to parse saved location:', error);
        navigate('/clients/manage');
      }
    } else {
      navigate('/clients/manage');
    }
  }
}, [selectedLocation, dispatch, navigate]);
```

## 🎯 Redux Usage Patterns

### 1. **Component Integration**

#### Using useSelector Hook
```typescript
// In any component
const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
const { selectedLocation } = useSelector((state: RootState) => state.client);
```

#### Using useDispatch Hook
```typescript
// In any component
const dispatch = useDispatch();

// Dispatch actions
dispatch(loginSuccess(userData));
dispatch(setSelectedLocation(location));
```

### 2. **Type-Safe Redux Usage**

#### Typed Hooks
```typescript
// Custom typed hooks (recommended)
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (state: RootState) => T) => 
  useSelector<RootState, T>(selector);
```

#### Usage with Typed Hooks
```typescript
// In components
const dispatch = useAppDispatch();
const user = useAppSelector(state => state.auth.user);
const locations = useAppSelector(state => state.client.locations);
```

### 3. **State Persistence Strategy**

#### LocalStorage Integration
```typescript
// TokenManager utility handles persistence
class TokenManager {
  static setUserData(userData: User): void {
    localStorage.setItem('userData', JSON.stringify(userData));
  }
  
  static getUserData(): User | null {
    const data = localStorage.getItem('userData');
    return data ? JSON.parse(data) : null;
  }
  
  static setMenuPermissions(permissions: Record<string, MenuPermission>): void {
    localStorage.setItem('menuPermissions', JSON.stringify(permissions));
  }
  
  static getMenuPermissions(): Record<string, MenuPermission> | null {
    const data = localStorage.getItem('menuPermissions');
    return data ? JSON.parse(data) : null;
  }
}
```

## 🔄 State Flow Examples

### 1. **Login Flow**
```
User submits login form
    ↓
Login.tsx calls authApi.login()
    ↓
API returns user data + JWT token
    ↓
TokenManager stores token + user data
    ↓
dispatch(loginSuccess(userData))
    ↓
Redux updates auth state
    ↓
ProtectedRoute detects authentication
    ↓
User redirected to dashboard
```

### 2. **Client Selection Flow**
```
User clicks "Edit" button in ManageClients
    ↓
dispatch(setSelectedLocation(location))
    ↓
Redux updates client state
    ↓
localStorage saves selected location
    ↓
Navigate to EditClient page
    ↓
EditClient reads from Redux state
    ↓
Form pre-filled with location data
```

### 3. **Page Refresh Flow**
```
User refreshes EditClient page
    ↓
App.tsx useEffect runs
    ↓
TokenManager.getUserData() + getMenuPermissions()
    ↓
dispatch(restoreAuth(userData))
    ↓
Redux restores auth state
    ↓
EditClient useEffect runs
    ↓
localStorage.getItem('selectedClientLocation')
    ↓
dispatch(restoreSelectedLocation(location))
    ↓
Redux restores client state
    ↓
Form pre-filled with saved data
```

## 🛡️ State Validation and Error Handling

### 1. **State Validation**
```typescript
// In reducers, validate payload data
loginSuccess: (state, action: PayloadAction<User>) => {
  const user = action.payload;
  
  // Validate required fields
  if (!user.id || !user.email || !user.name) {
    console.error('Invalid user data received');
    return;
  }
  
  state.user = user;
  state.isAuthenticated = true;
  state.isInitialized = true;
}
```

### 2. **Error State Management**
```typescript
// API error handling in components
const handleApiError = (error: unknown) => {
  console.error('API Error:', error);
  
  // Update error state
  setError((error as Error).message || 'An error occurred');
  
  // Optionally dispatch error action to Redux
  // dispatch(setApiError(error.message));
};
```

## 📊 State Debugging

### 1. **Redux DevTools Integration**
```typescript
// Store configuration with DevTools
export const store = configureStore({
  reducer: {
    auth: authReducer,
    client: clientReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});
```

### 2. **State Logging**
```typescript
// Debug Redux state in components
useEffect(() => {
  console.log('🔍 Current Redux State:', {
    auth: { user, isAuthenticated, isInitialized },
    client: { locations: locations.length, selectedLocation }
  });
}, [user, isAuthenticated, isInitialized, locations, selectedLocation]);
```

## 🚀 Performance Optimizations

### 1. **Memoized Selectors**
```typescript
// Create memoized selectors for expensive computations
const selectUserPermissions = createSelector(
  (state: RootState) => state.auth.user?.menuPermissions,
  (permissions) => permissions || {}
);

// Use in components
const permissions = useAppSelector(selectUserPermissions);
```

### 2. **Selective Re-renders**
```typescript
// Use specific selectors to prevent unnecessary re-renders
const userTypeId = useAppSelector(state => state.auth.user?.userTypeId);
const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

// Instead of selecting entire auth state
// const auth = useAppSelector(state => state.auth);
```

## 🔧 Best Practices

### 1. **Action Naming Convention**
- Use descriptive action names: `loginSuccess`, `setSelectedLocation`
- Include the entity: `auth/loginSuccess`, `client/setSelectedLocation`
- Use present tense: `loginSuccess` not `loggedIn`

### 2. **State Structure**
- Keep state flat and normalized
- Avoid nested objects when possible
- Use arrays for lists, objects for single entities

### 3. **Reducer Patterns**
- Always return new state objects (immutability)
- Use Immer (built into Redux Toolkit) for complex updates
- Handle all action types, even if just returning current state

### 4. **Component Integration**
- Use typed hooks for better TypeScript support
- Extract complex selectors to separate files
- Avoid dispatching actions in render methods

---

**Next**: [API Integration](./03-API-Integration.md) - API services and data flow patterns
