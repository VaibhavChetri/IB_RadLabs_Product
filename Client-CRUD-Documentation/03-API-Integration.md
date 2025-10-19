# API Integration

This document covers the comprehensive API integration architecture, including service layers, custom hooks, error handling, and data flow patterns used in the Client CRUD system.

## 🌐 API Service Architecture

### Base API Service (`src/services/api.ts`)

```typescript
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { TokenManager } from '../utils/tokenManager';

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
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle errors and token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, redirect to login
          TokenManager.logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.api.get(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.api.post(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.api.put(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.api.delete(url);
    return response.data;
  }
}

export const apiService = new ApiService();
```

## 🔐 Authentication API Service (`src/services/authApi.ts`)

### Service Implementation

```typescript
import { apiService } from './api';
import { TokenManager } from '../utils/tokenManager';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    gender: number;
    contact: string;
    avatar: string;
    status: number;
    user_type_id: number;
    city_id: number;
    facility_id: number;
    created_at: string | null;
    updated_at: string | null;
  };
  access_token: string;
  refresh_token: string;
  menu_permissions: Record<string, MenuPermission>;
}

export class AuthApiService {
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('🔍 authApi: Starting login process');
      
      const response = await apiService.post<LoginResponse>('/auth/login', credentials);
      
      console.log('🔍 authApi: Full API response:', response);
      console.log('🔍 authApi: User object from API:', response.user);
      console.log('🔍 authApi: city_id in response:', response.user.city_id);
      console.log('🔍 authApi: state_id in response:', (response.user as unknown as { state_id: number }).state_id);
      
      // Store tokens
      TokenManager.setToken(response.access_token);
      TokenManager.setRefreshToken(response.refresh_token);
      
      // Store user data
      const userData = {
        id: response.user.id.toString(),
        name: `${response.user.first_name} ${response.user.last_name}`.trim(),
        email: response.user.email,
        role: `User Type ${response.user.user_type_id}`,
        userTypeId: response.user.user_type_id,
        city_id: response.user.city_id,
        state_id: (response.user as unknown as { state_id: number }).state_id,
      };
      
      TokenManager.setUserData(userData);
      TokenManager.setMenuPermissions(response.menu_permissions || {});
      
      console.log('✅ authApi: User data stored from API response:', userData);
      console.log('✅ authApi: city_id:', userData.city_id, 'state_id:', userData.state_id);
      
      return response;
    } catch (error) {
      console.error('❌ authApi: Login failed:', error);
      throw error;
    }
  }

  static async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      TokenManager.logout();
    }
  }

  static async getUserProfile(): Promise<ApiResponse<unknown>> {
    try {
      const response = await apiService.get('/user/profile');
      console.log('User profile response:', response);
      return response;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw error;
    }
  }
}
```

## 👥 Client API Service (`src/services/clientApi.ts`)

### Service Implementation

```typescript
import { apiService } from './api';

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

export interface ClientLocationFilters {
  page?: number;
  limit?: number;
  city_id?: number;
  location_type?: number;
  client_id?: number;
}

export interface ClientLocationResponse {
  data: ClientLocation[];
  pagination: {
    totalCount: number;
    pageSize: number;
    currentPage: number;
    totalPages: number;
  };
}

export interface UpdateClientRequest {
  location_id: number;
  restaurant_id: number;
  country_id: number;
  state_id: number;
  city_id: number;
  latitude: string;
  longitude: string;
  landmark: string;
  zipcode: string;
  location: string;
  address_1: string;
  address_2: string;
  location_type: number;
  impact_type_ids: number[];
  billing_type_id: number;
  onSiteManPower: number;
  fixed_price?: string;
  fixed_pricing_id?: number;
}

export class ClientApiService {
  static async getLocations(filters: ClientLocationFilters = {}): Promise<ClientLocationResponse> {
    try {
      console.log('🔍 ClientApiService: Fetching locations with filters:', filters);
      
      const params = new URLSearchParams();
      
      // Set default values
      params.append('page', (filters.page || 1).toString());
      params.append('limit', (filters.limit || 10).toString());
      
      // Add optional filters
      if (filters.city_id) params.append('city_id', filters.city_id.toString());
      if (filters.location_type) params.append('location_type', filters.location_type.toString());
      if (filters.client_id) params.append('client_id', filters.client_id.toString());
      
      const response = await apiService.get<ClientLocationResponse>(
        `/locations/getLocations?${params.toString()}`
      );
      
      console.log('✅ ClientApiService: Locations fetched successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ ClientApiService: Failed to fetch locations:', error);
      throw error;
    }
  }

  static async createLocation(locationData: Partial<ClientLocation>): Promise<ClientLocation> {
    try {
      console.log('🔍 ClientApiService: Creating location:', locationData);
      
      const response = await apiService.post<ClientLocation>('/locations/create', locationData);
      
      console.log('✅ ClientApiService: Location created successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ ClientApiService: Failed to create location:', error);
      throw error;
    }
  }

  static async updateLocation(id: number, locationData: Partial<ClientLocation>): Promise<ClientLocation> {
    try {
      console.log('🔍 ClientApiService: Updating location:', id, locationData);
      
      const response = await apiService.put<ClientLocation>(`/locations/update/${id}`, locationData);
      
      console.log('✅ ClientApiService: Location updated successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ ClientApiService: Failed to update location:', error);
      throw error;
    }
  }

  static async updateClient(data: UpdateClientRequest): Promise<ApiResponse<unknown>> {
    try {
      console.log('🔍 ClientApiService: Updating client:', data);
      
      const response = await apiService.put<ApiResponse<unknown>>('/restaurants/updateClient', data);
      
      console.log('✅ ClientApiService: Client updated successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ ClientApiService: Failed to update client:', error);
      throw error;
    }
  }

  static async deleteLocation(id: number): Promise<void> {
    try {
      console.log('🔍 ClientApiService: Deleting location:', id);
      
      await apiService.delete(`/locations/delete/${id}`);
      
      console.log('✅ ClientApiService: Location deleted successfully');
    } catch (error) {
      console.error('❌ ClientApiService: Failed to delete location:', error);
      throw error;
    }
  }

  static async getAllLocations(locationType: number): Promise<ApiResponse<unknown[]>> {
    try {
      console.log('🔍 ClientApiService: Fetching all locations for type:', locationType);
      
      const response = await apiService.get<ApiResponse<unknown[]>>(
        `/locations/getAllLocations?location_type=${locationType}`
      );
      
      console.log('✅ ClientApiService: All locations fetched successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ ClientApiService: Failed to fetch all locations:', error);
      throw error;
    }
  }

  static async updateClientStatus(clientId: number, status: number): Promise<ApiResponse<unknown>> {
    try {
      console.log('🔍 ClientApiService: Updating client status:', { clientId, status });
      
      const response = await apiService.put<ApiResponse<unknown>>(
        '/restaurants/updateClientStatus',
        { id: clientId, status }
      );
      
      console.log('✅ ClientApiService: Client status updated successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ ClientApiService: Failed to update client status:', error);
      throw error;
    }
  }
}
```

## 🔄 Update Client API Implementation

### API Endpoint Details

**Endpoint**: `PUT /restaurants/updateClient`

**Purpose**: Updates an existing client location with new information

**Request Format**:
```typescript
interface UpdateClientRequest {
  location_id: number;        // Required: Location ID to update
  restaurant_id: number;     // Required: Restaurant ID
  country_id: number;        // Required: Country ID
  state_id: number;          // Required: State ID
  city_id: number;           // Required: City ID
  latitude: string;          // Required: Latitude coordinate
  longitude: string;         // Required: Longitude coordinate
  landmark: string;          // Required: Landmark information
  zipcode: string;           // Required: Postal code
  location: string;          // Required: Location name
  address_1: string;         // Required: Primary address
  address_2: string;          // Required: Secondary address
  location_type: number;     // Required: Location type ID
  impact_type_ids: number[]; // Required: Array of impact type IDs
  billing_type_id: number;   // Required: Billing type ID
  onSiteManPower: number;    // Required: 0 or 1 for on-site manpower
  fixed_price?: string;      // Optional: Fixed price (for Fixed billing type)
  fixed_pricing_id?: number; // Optional: Fixed pricing ID
}
```

**Response Format**:
```json
{
  "status": "Success",
  "status_code": 200,
  "message": "Client updated successfully"
}
```

### Usage Example

```typescript
// Example: Update client with Fixed billing type
const updateData: UpdateClientRequest = {
  location_id: 95,
  restaurant_id: 94,
  country_id: 82,
  state_id: 15,
  city_id: 3,
  latitude: "19.084409",
  longitude: "72.887045",
  landmark: "Mumbai",
  zipcode: "400070",
  location: "Piramal Agastya Offices Private Limited",
  address_1: "109A, 109A/1 to 109/21A, 111 and 110, 110/1 to 110/3, Sunder Bung Lane, Kamani Junction, Kurla West",
  address_2: "Mumbai",
  location_type: 3,
  impact_type_ids: [3],
  billing_type_id: 3,  // Fixed billing type
  onSiteManPower: 1,
  fixed_price: "180000.00",
  fixed_pricing_id: 1
};

// Example: Update client without Fixed pricing
const updateDataSimple: UpdateClientRequest = {
  location_id: 76,
  restaurant_id: 75,
  country_id: 82,
  state_id: 15,
  city_id: 3,
  latitude: "18.9995625",
  longitude: "72.82542229999436",
  landmark: "Mumbai",
  zipcode: "400013",
  location: "Piramal Tower Lower Parel",
  address_1: "PENINSULA TOWERS, Lower Parel West, Lower Parel, Mumbai, Maharashtra 400013",
  address_2: "Mumbai",
  location_type: 3,
  impact_type_ids: [1],
  billing_type_id: 1,  // On return count billing type
  onSiteManPower: 0
};

// Execute the update
const result = await ClientApiService.updateClient(updateData);

if (result.status === 'Success' && result.status_code === 200) {
  console.log('✅ Client updated successfully!');
} else {
  console.error('❌ Update failed:', result.message);
}
```

### Field Mapping Logic

**From Form Data to API Request**:
```typescript
const updateData: UpdateClientRequest = {
  location_id: selectedLocation.id,
  restaurant_id: selectedLocation.restaurant_id,
  country_id: parseInt(formData.country),
  state_id: parseInt(formData.state),
  city_id: parseInt(formData.city),
  latitude: formData.latitude,
  longitude: formData.longitude,
  landmark: formData.landmark,
  zipcode: formData.zipcode,
  location: formData.location,
  address_1: formData.address1,
  address_2: formData.address2,
  location_type: parseInt(formData.locationType),
  impact_type_ids: formData.impactType.map(id => parseInt(id)),
  billing_type_id: parseInt(formData.billingType),
  onSiteManPower: formData.onSiteManpower ? 1 : 0,
  // Conditional fields based on billing type
  ...(formData.billingType === '3' && {
    fixed_price: formData.fixedPrice,
    fixed_pricing_id: parseInt(formData.fixedPricingId)
  })
};
```

### Error Handling

```typescript
try {
  const result = await ClientApiService.updateClient(updateData);
  
  if (result.status === 'Success' && result.status_code === 200) {
    // Success: Show snackbar and navigate
    setSnackbar({
      open: true,
      message: result.message || 'Client updated successfully!',
      type: 'success',
    });
    
    setTimeout(() => {
      navigate('/clients/manage');
    }, 800);
  } else {
    // API returned error status
    setSnackbar({
      open: true,
      message: result.message || 'Failed to update client. Please try again.',
      type: 'error',
    });
  }
} catch (error) {
  // Network or other errors
  console.error('Update failed:', error);
  setSnackbar({
    open: true,
    message: 'Network error. Please check your connection and try again.',
    type: 'error',
  });
}
```

## 🎣 Custom API Hook (`src/hooks/useApi.ts`)

### Hook Implementation

```typescript
import { useState, useCallback } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (params?: unknown) => Promise<T>;
  reset: () => void;
}

export function useApi<T = unknown>(
  key: string,
  apiCall: (params?: unknown) => Promise<T>
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (params?: unknown): Promise<T> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log(`🔍 useApi[${key}]: Executing API call with params:`, params);
      
      const result = await apiCall(params);
      
      console.log(`✅ useApi[${key}]: API call successful:`, result);
      
      setState({
        data: result,
        loading: false,
        error: null,
      });
      
      return result;
    } catch (error) {
      console.error(`❌ useApi[${key}]: API call failed:`, error);
      
      const errorMessage = (error as Error).message || 'An error occurred';
      
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
      
      throw error;
    }
  }, [apiCall, key]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}
```

### Usage Examples

#### 1. **In ManageClients Component**
```typescript
// API hook for client locations
const clientLocationsApi = useApi('clientLocations', async (filters: ClientLocationFilters) => {
  return await ClientApiService.getLocations(filters);
});

// Usage in component
const loadClientLocations = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    
    const response = await clientLocationsApi.execute(filtersToUse);
    
    if (response.statusCode === 200) {
      const locations = (response.data as unknown as ClientLocation[]) || [];
      const paginationData = (response as unknown as { pagination: PaginationData }).pagination || {};
      
      setClientLocations(locations);
      setPagination({
        currentPage: paginationData.currentPage || 1,
        pageSize: paginationData.pageSize || 10,
        totalCount: paginationData.totalCount || 0,
        totalPages: paginationData.totalPages || 1,
      });
      
      dispatch(setLocations(locations));
    }
  } catch (error) {
    setError('Failed to load client locations');
  } finally {
    setLoading(false);
  }
}, [clientLocationsApi, filtersToUse, dispatch]);
```

#### 2. **In AddClient Component**
```typescript
// Facility API hook
const facilitiesApi = useApi('facilities', async () => {
  const params = new URLSearchParams();
  params.append('location_type', '2');
  if (user?.city_id) {
    params.append('city_id', user.city_id.toString());
  }
  
  console.log('🏢 AddClient: Fetching facilities with params:', params.toString());
  const response = await apiService.get(`/locations/getLocations?${params.toString()}`);
  console.log('🏢 AddClient: Facilities API response:', response);
  return response;
});

// Usage in component
useEffect(() => {
  if (formData.onSiteManpower && user?.city_id) {
    console.log('🏢 AddClient useEffect: Fetching facilities for city_id:', user.city_id);
    facilitiesApi.execute({}).then(response => {
      if (response.data) {
        setFacilities(response.data);
        console.log('🏢 AddClient Facilities stored:', response.data);
      }
    });
  }
}, [formData.onSiteManpower, user?.city_id, facilitiesApi]);
```

## 📍 Location Data Hooks (`src/hooks/useLocationData.ts`)

### Hook Implementation

```typescript
import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface LocationOption {
  value: string;
  label: string;
}

export function useCountries() {
  const [countries, setCountries] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoading(true);
        const response = await apiService.get('/countries');
        
        const countryOptions = response.data.map((country: any) => ({
          value: country.id.toString(),
          label: country.name,
        }));
        
        setCountries(countryOptions);
        setError(null);
      } catch (err) {
        setError('Failed to fetch countries');
        console.error('Error fetching countries:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  return { countries, loading, error };
}

export function useStates(countryId?: string) {
  const [states, setStates] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!countryId) {
      setStates([]);
      return;
    }

    const fetchStates = async () => {
      try {
        setLoading(true);
        const response = await apiService.get(`/states?country_id=${countryId}`);
        
        const stateOptions = response.data.map((state: any) => ({
          value: state.id.toString(),
          label: state.name,
        }));
        
        setStates(stateOptions);
        setError(null);
      } catch (err) {
        setError('Failed to fetch states');
        console.error('Error fetching states:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStates();
  }, [countryId]);

  return { states, loading, error };
}

export function useCities(stateId?: string) {
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stateId) {
      setCities([]);
      return;
    }

    const fetchCities = async () => {
      try {
        setLoading(true);
        const response = await apiService.get(`/cities?state_id=${stateId}`);
        
        const cityOptions = response.data.map((city: any) => ({
          value: city.id.toString(),
          label: city.name,
        }));
        
        setCities(cityOptions);
        setError(null);
      } catch (err) {
        setError('Failed to fetch cities');
        console.error('Error fetching cities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, [stateId]);

  return { cities, loading, error };
}
```

## 🔄 Data Flow Patterns

### 1. **API Call Flow**
```
Component Action → Custom Hook → API Service → Axios → Backend API
     ↓
Response → API Service → Custom Hook → Component State → UI Update
```

### 2. **Error Handling Flow**
```
API Error → Axios Interceptor → Custom Hook → Component Error State
     ↓
User Feedback → Error Message Display → Retry Option
```

### 3. **Loading State Flow**
```
API Call Initiated → Loading State True → UI Shows Spinner
     ↓
API Response → Loading State False → UI Shows Data
```

## 🛡️ Error Handling Strategies

### 1. **Global Error Handling**
```typescript
// Axios response interceptor
this.api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired
      TokenManager.logout();
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Permission denied
      console.error('Permission denied');
    } else if (error.response?.status >= 500) {
      // Server error
      console.error('Server error:', error.response.data);
    }
    return Promise.reject(error);
  }
);
```

### 2. **Component-Level Error Handling**
```typescript
// In components
const handleApiError = (error: unknown) => {
  console.error('API Error:', error);
  
  if (error instanceof Error) {
    setError(error.message);
  } else {
    setError('An unexpected error occurred');
  }
};

// Usage
try {
  const result = await apiCall();
  // Handle success
} catch (error) {
  handleApiError(error);
}
```

### 3. **Retry Logic**
```typescript
const retryApiCall = async (apiCall: () => Promise<any>, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

## 📊 API Response Standardization

### Standard Response Format
```typescript
interface ApiResponse<T> {
  status: 'success' | 'error';
  statusCode: number;
  message: string;
  data: T;
  pagination?: {
    totalCount: number;
    pageSize: number;
    currentPage: number;
    totalPages: number;
  };
}
```

### Response Handling
```typescript
const handleApiResponse = <T>(response: ApiResponse<T>) => {
  if (response.statusCode === 200) {
    return response.data;
  } else {
    throw new Error(response.message || 'API call failed');
  }
};
```

## 🚀 Performance Optimizations

### 1. **Request Debouncing**
```typescript
import { debounce } from 'lodash';

const debouncedSearch = debounce(async (searchTerm: string) => {
  try {
    const results = await searchApi(searchTerm);
    setSearchResults(results);
  } catch (error) {
    console.error('Search error:', error);
  }
}, 300);
```

### 2. **Request Cancellation**
```typescript
import { CancelTokenSource } from 'axios';

const cancelTokenSource = axios.CancelToken.source();

const apiCall = async () => {
  try {
    const response = await apiService.get('/endpoint', {
      cancelToken: cancelTokenSource.token
    });
    return response;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request cancelled');
    } else {
      throw error;
    }
  }
};

// Cancel request on component unmount
useEffect(() => {
  return () => {
    cancelTokenSource.cancel();
  };
}, []);
```

### 3. **Caching Strategy**
```typescript
// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
};
```

---

**Next**: [Component Architecture](./04-Component-Architecture.md) - Reusable vs specific components
