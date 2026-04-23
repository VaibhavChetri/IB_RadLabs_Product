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
    const response = await apiService.post<LoginResponse>('/auth/login', credentials);
    
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
    
    return response;
  }

  static async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } finally {
      TokenManager.logout();
    }
  }

  static async getUserProfile(): Promise<ApiResponse<unknown>> {
    return apiService.get('/user/profile');
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
  static async getClientLocations(
    filters: ClientLocationFilters = {}
  ): Promise<ApiResponse<ClientLocationResponse>> {
    const params = new URLSearchParams();
    
    // Add default values
    params.append('page', (filters.page || 1).toString());
    params.append('limit', (filters.limit || 1000).toString());
    
    // Add optional filters
    if (filters.city_id) params.append('city_id', filters.city_id.toString());
    if (filters.location_type) params.append('location_type', filters.location_type.toString());
    if (filters.client_id) params.append('client_id', filters.client_id.toString());
    
    return apiService.get(`/locations/getLocations?${params.toString()}`);
  }

  static async addClient(data: AddClientRequest): Promise<ApiResponse<unknown>> {
    return apiService.post('/restaurants/addClient', data);
  }

  static async updateClient(data: UpdateClientRequest): Promise<ApiResponse<unknown>> {
    return apiService.put('/restaurants/updateClient', data);
  }

  static async getAllLocations(locationType: number): Promise<ApiResponse<ClientLocation[]>> {
    return apiService.get(`/locations/getAllLocations?location_type=${locationType}`);
  }

  static async updateClientStatus(id: number, status: number): Promise<ApiResponse<unknown>> {
    return apiService.put('/restaurants/updateClientStatus', { id, status });
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

## 📋 Industry Standard API Service Pattern

### Standard Pattern (Meta/Google Approach)

**Key Principles:**
1. **Singleton Import**: Import `apiService` singleton directly
2. **Static Methods**: Use static methods on service classes
3. **No Try-Catch**: Let base service handle errors via interceptors
4. **Type Casting**: Use `as unknown as Promise<Type>` when response types don't match
5. **AbortSignal Support**: Include `signal` parameter for request cancellation (P0 standard)

### Complete Example

```typescript
import { apiService, ApiResponse } from './api';

export interface ExampleRequest {
  id: number;
  name: string;
}

export interface ExampleResponse {
  status: string;
  status_code: number;
  message: string;
  data: {
    id: number;
    name: string;
  };
}

export class ExampleApiService {
  /**
   * Get example data with filters
   * @param id - Example ID
   * @param signal - Optional AbortSignal for request cancellation
   */
  static async getExample(
    id: number,
    signal?: AbortSignal
  ): Promise<ExampleResponse> {
    return apiService.get(`/example/get?id=${id}`, {
      signal,
    }) as unknown as Promise<ExampleResponse>;
  }

  /**
   * Create example data
   * @param data - Request payload
   */
  static async createExample(data: ExampleRequest): Promise<ApiResponse<ExampleResponse>> {
    return apiService.post('/example/create', data);
  }

  /**
   * Update example data
   * @param id - Example ID
   * @param data - Request payload
   */
  static async updateExample(
    id: number,
    data: Partial<ExampleRequest>
  ): Promise<ApiResponse<ExampleResponse>> {
    return apiService.put(`/example/update/${id}`, data);
  }

  /**
   * Delete example data
   * @param id - Example ID
   */
  static async deleteExample(id: number): Promise<ApiResponse<void>> {
    return apiService.delete(`/example/delete/${id}`);
  }
}
```

### Real Examples from Codebase

**Location API Service:**
```typescript
import { apiService, ApiResponse } from './api';

export class ImpactApiService {
  static async getImpactTypes(
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<{ data: ImpactType[]; total: number; page: number; limit: number }>> {
    return apiService.get('/impact/getImpactMenu', {
      params: { page, limit },
    });
  }
}
```

**Ops Dashboard API Service:**
```typescript
import { apiService } from './api';

export class OpsDashboardApiService {
  /**
   * Get KAM EOD Report
   * Note: Uses `as unknown as` because API response structure doesn't match ApiResponse<T>
   * (data fields like totalDays, dailyEntryStatus are at root level, not wrapped in "data" field)
   */
  static async getKAMEodReport(
    cityIds: number | string,
    startDate: string,
    endDate: string,
    signal?: AbortSignal
  ): Promise<KAMEodReportResponse> {
    const searchParams = new URLSearchParams();
    searchParams.set('city_ids', String(cityIds));
    searchParams.set('start_date', startDate);
    searchParams.set('end_date', endDate);

    return apiService.get(`/inventory/getKAMEodReport?${searchParams.toString()}`, {
      signal,
    }) as unknown as Promise<KAMEodReportResponse>;
  }
}
```

**Why `as unknown as Promise<Type>`?**

Some APIs return data at the root level instead of wrapped in a `data` field:
- `apiService.get()` returns `Promise<ApiResponse<T>>` = `Promise<{ status, status_code, message, data: T }>`
- But `KAMEodReportResponse` = `{ status, status_code, message, totalDays, dailyEntryStatus, ... }` (no `data` wrapper)

Since TypeScript can't directly cast incompatible types, we use `unknown` as an intermediate bridge:
```
Promise<ApiResponse<T>> → unknown → Promise<ResponseType>
```

See [`03-API-Integration-Type-Casting.md`](./03-API-Integration-Type-Casting.md) for detailed explanation.

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

### 2. **Request Cancellation (P0 Standard)**
```typescript
import { AbortController } from 'abort-controller';

// In hooks or components
useEffect(() => {
  const abortController = new AbortController();

  const fetchData = async () => {
    try {
      const response = await ExampleApiService.getExample(
        id,
        abortController.signal
      );
      setData(response);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      setError(error);
    }
  };

  fetchData();

  // Cancel request on unmount
  return () => {
    abortController.abort();
  };
}, [id]);
```

**In API Service:**
```typescript
export class ExampleApiService {
  static async getExample(
    id: number,
    signal?: AbortSignal
  ): Promise<ExampleResponse> {
    return apiService.get(`/example/get?id=${id}`, {
      signal,
    }) as unknown as Promise<ExampleResponse>;
  }
}
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
