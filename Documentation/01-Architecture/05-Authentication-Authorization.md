# Authentication & Authorization

This document provides comprehensive details about the authentication and authorization system, including JWT token management, role-based access control (RBAC), protected routes, and user session management.

## 🔐 Authentication System Overview

### Architecture
```
User Login → JWT Token → Redux Store → Protected Routes → API Interceptors
     ↓
Token Storage (localStorage) → Auto-refresh → User Profile → Menu Permissions
```

### Key Components
- **Login Page**: User authentication interface
- **Token Manager**: JWT token handling and storage
- **Protected Routes**: Route-level security
- **API Interceptors**: Automatic token attachment
- **Redux Auth State**: Centralized authentication state

## 🎫 JWT Token Management

### TokenManager Utility (`src/utils/tokenManager.ts`)

#### Purpose
Centralized JWT token management with automatic refresh, user activity tracking, and secure storage.

#### Implementation Details

```typescript
class TokenManager {
  private static readonly TOKEN_KEY = 'accessToken';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private static readonly USER_DATA_KEY = 'userData';
  private static readonly MENU_PERMISSIONS_KEY = 'menuPermissions';
  private static readonly ACTIVITY_KEY = 'lastActivity';
  
  private static readonly TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes
  private static readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  
  private static activityTimer: NodeJS.Timeout | null = null;
  private static refreshTimer: NodeJS.Timeout | null = null;

  // Token Management
  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.startTokenRefreshTimer();
  }

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  // User Data Management
  static setUserData(userData: User): void {
    localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
  }

  static getUserData(): User | null {
    const data = localStorage.getItem(this.USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  }

  // Menu Permissions Management
  static setMenuPermissions(permissions: Record<string, MenuPermission>): void {
    localStorage.setItem(this.MENU_PERMISSIONS_KEY, JSON.stringify(permissions));
  }

  static getMenuPermissions(): Record<string, MenuPermission> | null {
    const data = localStorage.getItem(this.MENU_PERMISSIONS_KEY);
    return data ? JSON.parse(data) : null;
  }

  // Activity Tracking
  static updateActivity(): void {
    localStorage.setItem(this.ACTIVITY_KEY, Date.now().toString());
    this.startInactivityTimer();
  }

  static getLastActivity(): number {
    const activity = localStorage.getItem(this.ACTIVITY_KEY);
    return activity ? parseInt(activity) : 0;
  }

  // Token Refresh Logic
  private static startTokenRefreshTimer(): void {
    this.clearTokenRefreshTimer();
    
    this.refreshTimer = setInterval(async () => {
      const token = this.getToken();
      if (!token) return;

      try {
        const decoded = this.decodeToken(token);
        const now = Date.now() / 1000;
        const timeUntilExpiry = decoded.exp - now;

        // Refresh if token expires within threshold
        if (timeUntilExpiry < this.TOKEN_REFRESH_THRESHOLD / 1000) {
          await this.refreshToken();
        }
      } catch (error) {
        console.error('Token refresh check failed:', error);
        this.logout();
      }
    }, 60000); // Check every minute
  }

  private static async refreshToken(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      this.setToken(data.accessToken);
      
      if (data.refreshToken) {
        this.setRefreshToken(data.refreshToken);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout();
    }
  }

  // Inactivity Management
  private static startInactivityTimer(): void {
    this.clearInactivityTimer();
    
    this.activityTimer = setInterval(() => {
      const lastActivity = this.getLastActivity();
      const now = Date.now();
      
      if (now - lastActivity > this.INACTIVITY_TIMEOUT) {
        console.log('User inactive, logging out');
        this.logout();
      }
    }, 60000); // Check every minute
  }

  // Logout Process
  static async logout(): Promise<void> {
    try {
      // Call backend logout endpoint
      const token = this.getToken();
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear all stored data
      this.clearAllData();
      this.clearTimers();
      
      // Redirect to login
      window.location.href = '/login';
    }
  }

  private static clearAllData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_DATA_KEY);
    localStorage.removeItem(this.MENU_PERMISSIONS_KEY);
    localStorage.removeItem(this.ACTIVITY_KEY);
  }

  private static clearTimers(): void {
    this.clearTokenRefreshTimer();
    this.clearInactivityTimer();
  }

  private static clearTokenRefreshTimer(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private static clearInactivityTimer(): void {
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }
  }

  // Token Decoding
  private static decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

export default TokenManager;
```

#### Key Features

##### **Token Storage**
- Secure localStorage storage
- Automatic token refresh
- Refresh token management
- Token expiration handling

##### **User Activity Tracking**
- Last activity timestamp
- Inactivity timeout (30 minutes)
- Automatic logout on inactivity
- Activity update on user interaction

##### **Session Management**
- User data persistence
- Menu permissions storage
- Automatic session restoration
- Secure logout process

## 🔑 Login Page Implementation

### File Location
`src/pages/Login.tsx`

### Implementation Details

```typescript
export const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Login: Starting login process');
      
      const result = await AuthApiService.login({
        username: formData.username,
        password: formData.password,
      });

      if (result) {
        console.log('✅ Login: Login successful, updating Redux state');
        
        // Update Redux state
        dispatch(
          loginSuccess({
            id: result.user.id.toString(),
            name: `${result.user.first_name} ${result.user.last_name}`.trim(),
            email: result.user.email,
            role: `User Type ${result.user.user_type_id}`,
            userTypeId: result.user.user_type_id,
            city_id: result.user.city_id,
            state_id: (result.user as unknown as { state_id: number }).state_id,
            menuPermissions: result.menu_permissions || {},
          })
        );
        
        // Update activity
        TokenManager.updateActivity();
        
        navigate('/');
      } else {
        setError('Login failed: Invalid response from server');
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      setError((error as Error).message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <FloatingInput
              label="Username"
              value={formData.username}
              onChange={(value) => setFormData(prev => ({ ...prev, username: value }))}
              required
              disabled={isLoading}
            />
            
            <FloatingInput
              label="Password"
              type="password"
              value={formData.password}
              onChange={(value) => setFormData(prev => ({ ...prev, password: value }))}
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
};
```

## 🛡️ Protected Routes

### ProtectedRoute Component (`src/components/ProtectedRoute.tsx`)

#### Purpose
Route protection component that ensures authentication before rendering protected pages.

#### Implementation

```typescript
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isInitialized } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isInitialized, navigate]);

  // Show loading while checking authentication
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
```

#### Usage in App Router

```typescript
// In App.tsx
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/clients/add" element={
          <ProtectedRoute>
            <AddClient />
          </ProtectedRoute>
        } />
        <Route path="/clients/edit" element={
          <ProtectedRoute>
            <EditClient />
          </ProtectedRoute>
        } />
        <Route path="/clients/manage" element={
          <ProtectedRoute>
            <ManageClients />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}
```

## 🔐 API Interceptors

### Axios Interceptor Setup (`src/services/api.ts`)

#### Implementation

```typescript
class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: 'http://localhost:3099/v1/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = TokenManager.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Update user activity on API calls
        TokenManager.updateActivity();
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle errors and token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // Attempt token refresh
            await TokenManager.refreshToken();
            
            // Retry original request
            const token = TokenManager.getToken();
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            TokenManager.logout();
            return Promise.reject(refreshError);
          }
        }
        
        // Handle other errors
        if (error.response?.status === 403) {
          console.error('Permission denied');
        } else if (error.response?.status >= 500) {
          console.error('Server error:', error.response.data);
        }
        
        return Promise.reject(error);
      }
    );
  }
}
```

## 👥 Role-Based Access Control (RBAC)

### Menu Permissions System

#### Menu Permission Interface

```typescript
export interface MenuPermission {
  id: number;
  name: string;
  permission: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  userTypeId?: number;
  city_id?: number;
  state_id?: number;
  menuPermissions?: Record<string, MenuPermission>;
}
```

#### Menu Filtering Hook

```typescript
// Custom hook for user menu permissions
export const useUserMenus = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const userMenus = useMemo(() => {
    if (!user?.menuPermissions) return [];
    
    // Filter menus based on user permissions
    return allMenus.filter(menu => {
      const permission = user.menuPermissions?.[menu.key];
      return permission?.permission === true;
    });
  }, [user?.menuPermissions]);
  
  return { userMenus };
};
```

#### Sidebar Implementation

```typescript
export const Sidebar: React.FC = () => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { userMenus } = useUserMenus();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // Restore expanded menus from localStorage
  useEffect(() => {
    const savedExpandedMenus = localStorage.getItem('expandedMenus');
    if (savedExpandedMenus) {
      try {
        const parsed = JSON.parse(savedExpandedMenus);
        setExpandedMenus(new Set(parsed));
      } catch (error) {
        console.error('Failed to parse expanded menus:', error);
      }
    }
  }, []);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      
      // Save to localStorage
      localStorage.setItem('expandedMenus', JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const handleLogout = async () => {
    await TokenManager.logout();
  };

  if (!isAuthenticated) return null;

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
            {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name || 'User'}</p>
            <p className="text-sm text-gray-500">{user?.role || 'Role'}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <MenuRenderer
          menus={userMenus}
          expandedMenus={expandedMenus}
          onToggleMenu={toggleMenu}
        />
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
};
```

### User Type Restrictions

#### Form Field Restrictions

```typescript
// In AddClient and EditClient components
const isNonSuperAdmin = user?.userTypeId && user.userTypeId > 4;

<FloatingDropdown
  label="Country"
  options={countries.map(country => ({ value: country.value, label: country.label }))}
  value={formData.country}
  onChange={(value) => handleInputChange('country', value)}
  disabled={isNonSuperAdmin}
  required
/>

<FloatingDropdown
  label="State"
  options={states.map(state => ({ value: state.value, label: state.label }))}
  value={formData.state}
  onChange={(value) => handleInputChange('state', value)}
  disabled={isNonSuperAdmin}
  required
/>

<FloatingDropdown
  label="City"
  options={cities.map(city => ({ value: city.value, label: city.label }))}
  value={formData.city}
  onChange={(value) => handleInputChange('city', value)}
  disabled={isNonSuperAdmin}
  required
/>
```

#### Filter Restrictions

```typescript
// In ManageClients component
const shouldShowCityFilter = user?.userTypeId && [1, 2, 3, 4].includes(user.userTypeId);

{shouldShowCityFilter && (
  <FloatingDropdown
    label="City"
    options={cities.map(city => ({ value: city.value, label: city.label }))}
    value={filters.city_id?.toString() || ''}
    onChange={(value) => setFilters(prev => ({ ...prev, city_id: parseInt(value) }))}
    placeholder="All Cities"
  />
)}
```

## 🔄 Authentication State Management

### Redux Auth Slice (`src/store/slices/authSlice.ts`)

#### Implementation

```typescript
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isInitialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isInitialized = true;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
    },
    restoreAuth: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isInitialized = true;
    },
    initializeAuth: (state) => {
      state.isInitialized = true;
    },
  },
});

export const { loginSuccess, logout, restoreAuth, initializeAuth } = authSlice.actions;
export default authSlice.reducer;
```

#### App Initialization (`src/App.tsx`)

```typescript
function App() {
  const dispatch = useDispatch();

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

  return (
    <Router>
      <Routes>
        {/* Route definitions */}
      </Routes>
    </Router>
  );
}
```

## 🔒 Security Best Practices

### 1. **Token Security**
- Store tokens in localStorage (consider httpOnly cookies for production)
- Implement token refresh mechanism
- Clear tokens on logout
- Handle token expiration gracefully

### 2. **Route Protection**
- Protect all sensitive routes
- Implement proper redirects
- Handle authentication state initialization
- Prevent unauthorized access

### 3. **API Security**
- Automatic token attachment
- Handle 401/403 responses
- Implement retry logic for token refresh
- Secure API endpoints

### 4. **User Session Management**
- Track user activity
- Implement inactivity timeout
- Automatic logout on inactivity
- Session restoration on page refresh

### 5. **Role-Based Access**
- Backend-driven permissions
- Frontend permission filtering
- UI element restrictions
- Data access control

## 🚀 Performance Optimizations

### 1. **Token Refresh Optimization**
```typescript
// Only refresh when necessary
const timeUntilExpiry = decoded.exp - now;
if (timeUntilExpiry < this.TOKEN_REFRESH_THRESHOLD / 1000) {
  await this.refreshToken();
}
```

### 2. **Activity Tracking Optimization**
```typescript
// Debounce activity updates
const debouncedUpdateActivity = debounce(() => {
  TokenManager.updateActivity();
}, 1000);
```

### 3. **Menu Permission Caching**
```typescript
// Cache menu permissions
const userMenus = useMemo(() => {
  return allMenus.filter(menu => {
    const permission = user.menuPermissions?.[menu.key];
    return permission?.permission === true;
  });
}, [user?.menuPermissions]);
```

---

**Next**: [TypeScript Interfaces](./09-TypeScript-Interfaces.md) - All type definitions and interfaces
