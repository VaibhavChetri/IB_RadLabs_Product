# TypeScript Interfaces

This document provides comprehensive TypeScript interfaces, type definitions, and type safety patterns used throughout the Client CRUD system.

## 🏗️ Core Type Definitions

### User and Authentication Types

#### User Interface
```typescript
// src/store/slices/authSlice.ts
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
  isInitialized: boolean;
}
```

#### Authentication API Types
```typescript
// src/services/authApi.ts
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
```

### Client and Location Types

#### Client Location Interface
```typescript
// src/services/clientApi.ts
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

export interface ImpactType {
  id: number;
  name: string;
}

export interface Client {
  id: number;
  name: string;
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
```

#### Client State Interface
```typescript
// src/store/slices/clientSlice.ts
export interface ClientState {
  locations: ClientLocation[];
  selectedLocation: ClientLocation | null;
}
```

### Form Data Types

#### Client Form Data Interface
```typescript
// src/pages/AddClient.tsx & EditClient.tsx
interface ClientFormData {
  // Basic Information
  name: string;
  address1: string;
  address2: string;
  zipcode: string;
  landmark: string;
  latitude: string;
  longitude: string;
  onSiteManpower: boolean;

  // Location
  locationType: string;
  country: string;
  state: string;
  city: string;

  // Billing Type
  billingType: string;
  fixedPrice?: string;
  billingSubType?: string;

  // Impact Type
  impactType: string;

  // Facility (when onSiteManpower is true)
  facility?: string;
}
```

## 🎨 UI Component Types

### Form Component Types

#### FloatingInput Props
```typescript
// src/components/ui/FloatingInput.tsx
export interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
}
```

#### FloatingDropdown Props
```typescript
// src/components/ui/FloatingDropdown.tsx
export interface DropdownOption {
  value: string;
  label: string;
}

export interface FloatingDropdownProps {
  label: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  searchable?: boolean;
}
```

### Data Display Component Types

#### Table Component Types
```typescript
// src/components/ui/DataDisplay.tsx
export interface TableColumn<T = unknown> {
  key: string;
  label: string;
  title?: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

export interface TableProps<T = unknown> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  className?: string;
}
```

#### Pagination Component Types
```typescript
// src/components/ui/Pagination.tsx
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  showItemsPerPage?: boolean;
  className?: string;
}
```

#### Button Component Types
```typescript
// src/components/ui/Button.tsx
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}
```

#### Card Component Types
```typescript
// src/components/ui/Card.tsx
export interface CardProps {
  children: React.ReactNode;
  className?: string;
}
```

## 🔧 API and Service Types

### API Response Types
```typescript
// src/services/api.ts
export interface ApiResponse<T> {
  status: 'success' | 'error';
  statusCode: number;
  message: string;
  data: T;
  pagination?: PaginationData;
}

export interface PaginationData {
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
}
```

### Custom Hook Types

#### useApi Hook Types
```typescript
// src/hooks/useApi.ts
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
): UseApiReturn<T>;
```

#### Location Data Hook Types
```typescript
// src/hooks/useLocationData.ts
interface LocationOption {
  value: string;
  label: string;
}

export function useCountries(): {
  countries: LocationOption[];
  loading: boolean;
  error: string | null;
};

export function useStates(countryId?: string): {
  states: LocationOption[];
  loading: boolean;
  error: string | null;
};

export function useCities(stateId?: string): {
  cities: LocationOption[];
  loading: boolean;
  error: string | null;
};
```

## 🏪 Redux Store Types

### Root State Type
```typescript
// src/store/index.ts
export interface RootState {
  auth: AuthState;
  client: ClientState;
}

export type AppDispatch = typeof store.dispatch;
```

### Typed Hooks
```typescript
// Custom typed hooks for Redux
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (state: RootState) => T) => 
  useSelector<RootState, T>(selector);
```

## 🎯 Type Safety Patterns

### 1. **Type Assertions for API Responses**

#### Safe Type Assertions
```typescript
// Safe type assertion pattern
const locations = (response.data as unknown as ClientLocation[]) || [];
const paginationData = (response as unknown as { pagination: PaginationData }).pagination || {};

// For dynamic API data
const facility = (facilityData as any).id.toString();
const label = (facilityData as any).location || `Facility ${(facilityData as any).id}`;
```

#### ESLint Suppression for Necessary Any Types
```typescript
// When any is necessary for dynamic API data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const facilityId = (facility as any).id.toString();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const facilityName = (facility as any).location || `Facility ${(facility as any).id}`;
```

### 2. **Generic Type Constraints**

#### Generic Table Component
```typescript
export const Table = <T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  sortBy,
  sortOrder,
  onSort,
  className = '',
}: TableProps<T>) => {
  // Implementation
};
```

#### Generic API Hook
```typescript
export function useApi<T = unknown>(
  key: string,
  apiCall: (params?: unknown) => Promise<T>
): UseApiReturn<T> {
  // Implementation
}
```

### 3. **Union Types for Component Variants**

#### Button Variants
```typescript
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}
```

#### Input Types
```typescript
export interface FloatingInputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
}
```

### 4. **Optional Properties and Default Values**

#### Optional Properties Pattern
```typescript
export interface ClientLocation {
  id: number;
  restaurant_name: string;
  // ... required properties
  
  // Optional properties
  billing_sub_type_id?: number;
  subTypeName?: string;
  fixedPrice?: number;
  facilityId?: number;
  facilityName?: string;
}
```

#### Default Values Pattern
```typescript
export const FloatingDropdown: React.FC<FloatingDropdownProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option',  // Default value
  loading = false,                   // Default value
  error,
  required = false,                  // Default value
  disabled = false,                  // Default value
  searchable = true,                 // Default value
}) => {
  // Implementation
};
```

### 5. **Type Guards and Runtime Checks**

#### Type Guard Functions
```typescript
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isClientLocation = (obj: unknown): obj is ClientLocation => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'restaurant_name' in obj &&
    'address_1' in obj
  );
};
```

#### Runtime Type Checking
```typescript
const handleApiResponse = <T>(response: unknown): T => {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid API response');
  }
  
  return response as T;
};
```

## 🔍 Advanced Type Patterns

### 1. **Mapped Types for Form Validation**

#### Form Error Types
```typescript
type FormErrors<T> = {
  [K in keyof T]?: string;
};

// Usage
const [errors, setErrors] = useState<FormErrors<ClientFormData>>({});
```

### 2. **Conditional Types**

#### Conditional Rendering Types
```typescript
type ConditionalProps<T> = T extends { required: true } 
  ? { required: true; error?: string }
  : { required?: false; error?: string };
```

### 3. **Template Literal Types**

#### Dynamic Class Names
```typescript
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonClass = `btn-${ButtonVariant}-${ButtonSize}`;
```

### 4. **Utility Types**

#### Partial and Required Types
```typescript
// Make all properties optional for form updates
type PartialClientLocation = Partial<ClientLocation>;

// Make specific properties required
type RequiredClientLocation = Required<Pick<ClientLocation, 'id' | 'restaurant_name'>>;
```

## 🚀 Type Safety Best Practices

### 1. **Strict Type Checking**
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### 2. **Type Imports and Exports**
```typescript
// Export types separately from implementations
export type { User, AuthState, MenuPermission } from './authSlice';
export type { ClientLocation, ClientLocationFilters } from './clientApi';

// Import types with type keyword
import type { User } from '../store/slices/authSlice';
import type { ClientLocation } from '../services/clientApi';
```

### 3. **Interface vs Type Aliases**
```typescript
// Use interfaces for object shapes
interface User {
  id: string;
  name: string;
}

// Use type aliases for unions and computed types
type UserRole = 'admin' | 'user' | 'guest';
type UserWithRole = User & { role: UserRole };
```

### 4. **Generic Constraints**
```typescript
// Constrain generics to specific shapes
interface ApiResponse<T extends Record<string, unknown>> {
  data: T;
  status: 'success' | 'error';
}

// Use extends for type constraints
function processData<T extends { id: number }>(data: T[]): T[] {
  return data.filter(item => item.id > 0);
}
```

### 5. **Error Handling Types**
```typescript
// Result type for error handling
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Usage
const result: Result<ClientLocation[]> = await fetchClients();
if (result.success) {
  // result.data is available
  console.log(result.data);
} else {
  // result.error is available
  console.error(result.error);
}
```

## 🔧 TypeScript Configuration

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### ESLint TypeScript Rules
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-non-null-assertion": "warn"
  }
}
```

---

**Next**: [Development Guidelines](./10-Development-Guidelines.md) - Best practices and development patterns
