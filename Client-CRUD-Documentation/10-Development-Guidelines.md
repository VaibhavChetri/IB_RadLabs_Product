# Development Guidelines

This document provides comprehensive development guidelines, best practices, coding standards, and patterns used in the Client CRUD system.

## 🎯 Development Principles

### 1. **Code Quality Standards**
- **Type Safety**: Comprehensive TypeScript usage with strict type checking
- **Consistency**: Consistent naming conventions and code structure
- **Readability**: Clear, self-documenting code with meaningful names
- **Maintainability**: Modular, reusable components and functions
- **Performance**: Optimized rendering and efficient data handling

### 2. **Architecture Principles**
- **Separation of Concerns**: Clear separation between UI, business logic, and data
- **Single Responsibility**: Each component/function has one clear purpose
- **Composition over Inheritance**: Build complex components from simple ones
- **Dependency Injection**: Use props and hooks for dependency management
- **Immutability**: Prefer immutable data structures and state updates

## 📁 Project Structure Guidelines

### Directory Organization
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Generic UI components
│   ├── layout/          # Layout components
│   └── forms/           # Form-specific components
├── pages/               # Page-level components
├── hooks/               # Custom React hooks
├── services/            # API services and external integrations
├── store/               # Redux store and slices
├── utils/               # Utility functions and helpers
├── types/               # TypeScript type definitions
└── constants/           # Application constants
```

### File Naming Conventions
- **Components**: PascalCase (e.g., `FloatingInput.tsx`)
- **Hooks**: camelCase starting with 'use' (e.g., `useApi.ts`)
- **Services**: PascalCase with 'Service' suffix (e.g., `AuthApiService.ts`)
- **Utils**: camelCase (e.g., `tokenManager.ts`)
- **Types**: PascalCase (e.g., `User.ts`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)

## 🎨 Component Development Guidelines

### 1. **Component Structure**

#### Standard Component Template
```typescript
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';

// Types
interface ComponentProps {
  // Props interface
}

// Component
export const ComponentName: React.FC<ComponentProps> = ({
  // Destructured props
}) => {
  // 1. Redux state
  const { user } = useSelector((state: RootState) => state.auth);
  
  // 2. Local state
  const [localState, setLocalState] = useState<StateType>(initialValue);
  
  // 3. Custom hooks
  const { data, loading, error } = useCustomHook();
  
  // 4. Memoized values
  const memoizedValue = useMemo(() => {
    return expensiveCalculation(data);
  }, [data]);
  
  // 5. Event handlers
  const handleEvent = useCallback((param: ParamType) => {
    // Handler logic
  }, [dependencies]);
  
  // 6. Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // 7. Render
  return (
    <div className="component-container">
      {/* Component JSX */}
    </div>
  );
};

export default ComponentName;
```

### 2. **Component Design Patterns**

#### Composition Pattern
```typescript
// Build complex components from simple ones
<Card className="p-8">
  <div className="flex items-center gap-3 mb-6">
    <Building className="w-6 h-6 text-green-600" />
    <h2 className="text-xl font-semibold text-gray-900">Client Information</h2>
  </div>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <FloatingInput {...nameProps} />
    <FloatingInput {...addressProps} />
    <FloatingDropdown {...locationProps} />
    <FloatingDropdown {...billingProps} />
  </div>
</Card>
```

#### Render Props Pattern
```typescript
// Custom rendering in table columns
{
  key: 'billing',
  label: 'Billing',
  sortable: true,
  render: (value: unknown, row: Record<string, unknown>) => (
    <div className="text-gray-900">
      <div className="font-medium">{String(value)}</div>
      {(row.subTypeName as string) && (
        <div className="text-xs text-gray-500 mt-1">{String(row.subTypeName)}</div>
      )}
    </div>
  ),
}
```

#### Higher-Order Component Pattern
```typescript
// ProtectedRoute wraps other components
<ProtectedRoute>
  <ManageClients />
</ProtectedRoute>
```

### 3. **Props Design Guidelines**

#### Props Interface Design
```typescript
// Good: Clear, specific props
interface FloatingInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  type?: 'text' | 'email' | 'password' | 'number';
}

// Avoid: Generic, unclear props
interface BadProps {
  data: any;
  config: object;
  options: any[];
}
```

#### Props Validation
```typescript
// Use TypeScript for compile-time validation
const Component: React.FC<Props> = ({ required, optional = 'default' }) => {
  // Props are validated at compile time
};

// Use PropTypes for runtime validation (if needed)
Component.propTypes = {
  required: PropTypes.string.isRequired,
  optional: PropTypes.string,
};
```

## 🔧 State Management Guidelines

### 1. **Redux State Design**

#### State Structure
```typescript
// Keep state flat and normalized
interface RootState {
  auth: {
    user: User | null;
    isAuthenticated: boolean;
    isInitialized: boolean;
  };
  client: {
    locations: ClientLocation[];
    selectedLocation: ClientLocation | null;
  };
  ui: {
    loading: boolean;
    error: string | null;
  };
}
```

#### Action Design
```typescript
// Use descriptive action names
export const loginSuccess = createAction<User>('auth/loginSuccess');
export const setSelectedLocation = createAction<ClientLocation>('client/setSelectedLocation');

// Avoid generic action names
// ❌ Bad
export const setData = createAction<any>('setData');
export const update = createAction<any>('update');
```

#### Reducer Patterns
```typescript
// Always return new state objects
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
  },
});
```

### 2. **Local State Guidelines**

#### When to Use Local State
- **Form data**: Temporary form state
- **UI state**: Loading, error, modal states
- **Component-specific data**: Data that doesn't need to be shared

#### When to Use Redux State
- **User data**: Authentication and user profile
- **Shared data**: Data used across multiple components
- **Persistent data**: Data that should survive component unmounting

#### State Update Patterns
```typescript
// Good: Immutable updates
setFormData(prev => ({ ...prev, [field]: value }));

// Good: Functional updates
setState(prevState => {
  const newState = { ...prevState };
  newState.nestedProperty = newValue;
  return newState;
});

// Avoid: Direct mutation
// ❌ Bad
formData[field] = value;
setFormData(formData);
```

## 🌐 API Integration Guidelines

### 1. **API Service Design**

#### Service Structure
```typescript
class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL,
      timeout: 10000,
    });
    
    this.setupInterceptors();
  }

  // Public methods
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.api.get(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.api.post(url, data);
    return response.data;
  }

  // Private methods
  private setupInterceptors(): void {
    // Interceptor logic
  }
}
```

#### Error Handling
```typescript
// Consistent error handling
try {
  const result = await apiCall();
  return result;
} catch (error) {
  console.error('API Error:', error);
  
  if (error instanceof AxiosError) {
    throw new Error(error.response?.data?.message || 'API call failed');
  }
  
  throw new Error('An unexpected error occurred');
}
```

### 2. **Custom Hooks for API Integration**

#### Hook Design Pattern
```typescript
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
      const result = await apiCall(params);
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      const errorMessage = (error as Error).message || 'An error occurred';
      setState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, [apiCall]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}
```

## 🎨 Styling Guidelines

### 1. **TailwindCSS Best Practices**

#### Class Organization
```typescript
// Good: Logical grouping
className="w-full px-4 pt-6 pb-2 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"

// Group by: layout, spacing, appearance, states
className="
  w-full px-4 pt-6 pb-2
  border rounded-lg
  transition-all duration-200
  focus:outline-none focus:ring-2 focus:ring-green-500
"
```

#### Responsive Design
```typescript
// Mobile-first approach
className="
  grid grid-cols-1
  md:grid-cols-2
  lg:grid-cols-3
  gap-4 md:gap-6
"
```

#### Conditional Styling
```typescript
// Use template literals for conditional classes
className={`
  base-classes
  ${condition ? 'conditional-classes' : 'alternative-classes'}
  ${error ? 'error-classes' : ''}
`}
```

### 2. **Component Styling Patterns**

#### Styling Props
```typescript
interface ComponentProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Component: React.FC<ComponentProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  className = '' 
}) => {
  const baseClasses = 'base-styling';
  const variantClasses = {
    primary: 'primary-styling',
    secondary: 'secondary-styling',
    ghost: 'ghost-styling',
  };
  const sizeClasses = {
    sm: 'small-styling',
    md: 'medium-styling',
    lg: 'large-styling',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {/* Component content */}
    </div>
  );
};
```

## 🚀 Performance Guidelines

### 1. **React Performance Optimization**

#### Memoization
```typescript
// Memoize expensive computations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// Memoize callback functions
const handleClick = useCallback((id: string) => {
  onItemClick(id);
}, [onItemClick]);

// Memoize components
const MemoizedComponent = React.memo(Component);
```

#### Effect Dependencies
```typescript
// Always include all dependencies
useEffect(() => {
  fetchData(userId, filters);
}, [userId, filters]); // Include all dependencies

// Use useCallback for stable references
const fetchData = useCallback(async (userId: string, filters: Filters) => {
  // Fetch logic
}, []);

useEffect(() => {
  fetchData(userId, filters);
}, [fetchData, userId, filters]);
```

### 2. **Bundle Optimization**

#### Code Splitting
```typescript
// Lazy load routes
const AddClient = lazy(() => import('./pages/AddClient'));
const EditClient = lazy(() => import('./pages/EditClient'));

// Use Suspense for lazy components
<Suspense fallback={<LoadingSpinner />}>
  <AddClient />
</Suspense>
```

#### Dynamic Imports
```typescript
// Dynamic imports for heavy libraries
const loadChartLibrary = async () => {
  const { Chart } = await import('chart.js');
  return Chart;
};
```

## 🔒 Security Guidelines

### 1. **Input Validation**

#### Client-Side Validation
```typescript
const validateForm = (formData: FormData): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  // Required field validation
  if (!formData.name.trim()) {
    errors.name = 'Name is required';
  }
  
  // Format validation
  if (formData.email && !isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  // Range validation
  if (formData.age && (formData.age < 0 || formData.age > 120)) {
    errors.age = 'Age must be between 0 and 120';
  }
  
  return errors;
};
```

#### Sanitization
```typescript
// Sanitize user input
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
};
```

### 2. **Authentication Security**

#### Token Management
```typescript
// Secure token storage
class TokenManager {
  static setToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }
  
  static getToken(): string | null {
    return localStorage.getItem('accessToken');
  }
  
  static clearToken(): void {
    localStorage.removeItem('accessToken');
  }
}
```

#### Route Protection
```typescript
// Always protect sensitive routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};
```

## 🧪 Testing Guidelines

### 1. **Component Testing**

#### Test Structure
```typescript
describe('FloatingInput', () => {
  it('renders with label', () => {
    render(<FloatingInput label="Test Label" value="" onChange={jest.fn()} />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });
  
  it('calls onChange when input changes', () => {
    const onChange = jest.fn();
    render(<FloatingInput label="Test" value="" onChange={onChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(onChange).toHaveBeenCalledWith('test value');
  });
  
  it('shows error message when error prop is provided', () => {
    render(
      <FloatingInput 
        label="Test" 
        value="" 
        onChange={jest.fn()} 
        error="Test error" 
      />
    );
    
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });
});
```

### 2. **API Testing**

#### Mock API Calls
```typescript
// Mock API service
jest.mock('../services/api', () => ({
  apiService: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Test API integration
it('loads data on mount', async () => {
  const mockData = [{ id: 1, name: 'Test' }];
  (apiService.get as jest.Mock).mockResolvedValue(mockData);
  
  render(<Component />);
  
  await waitFor(() => {
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

## 📝 Documentation Guidelines

### 1. **Code Documentation**

#### Component Documentation
```typescript
/**
 * FloatingInput - A Material UI-style input component with floating labels
 * 
 * @param label - The label text to display
 * @param value - The current input value
 * @param onChange - Callback function called when input changes
 * @param error - Optional error message to display
 * @param required - Whether the field is required
 * @param disabled - Whether the input is disabled
 * @param type - The input type (text, email, password, etc.)
 */
export const FloatingInput: React.FC<FloatingInputProps> = ({
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  type = 'text',
}) => {
  // Implementation
};
```

#### Function Documentation
```typescript
/**
 * Validates form data and returns validation errors
 * 
 * @param formData - The form data to validate
 * @returns Object containing validation errors for each field
 * 
 * @example
 * const errors = validateForm({ name: '', email: 'invalid' });
 * // Returns: { name: 'Name is required', email: 'Invalid email format' }
 */
const validateForm = (formData: FormData): ValidationErrors => {
  // Implementation
};
```

### 2. **README Documentation**

#### Component README Template
```markdown
# ComponentName

Brief description of the component's purpose and functionality.

## Usage

```typescript
import { ComponentName } from './ComponentName';

<ComponentName
  prop1="value1"
  prop2="value2"
  onEvent={handleEvent}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| prop1 | string | - | Description of prop1 |
| prop2 | boolean | false | Description of prop2 |

## Examples

### Basic Usage
```typescript
<ComponentName prop1="hello" />
```

### Advanced Usage
```typescript
<ComponentName
  prop1="hello"
  prop2={true}
  onEvent={(value) => console.log(value)}
/>
```
```

## 🔄 Git Workflow Guidelines

### 1. **Branch Naming**
- `feature/component-name` - New features
- `bugfix/issue-description` - Bug fixes
- `hotfix/critical-issue` - Critical fixes
- `refactor/component-name` - Code refactoring

### 2. **Commit Messages**
```
feat: add FloatingInput component
fix: resolve pagination display issue
docs: update API documentation
refactor: simplify form validation logic
test: add unit tests for Table component
```

### 3. **Code Review Checklist**
- [ ] Code follows project conventions
- [ ] TypeScript types are properly defined
- [ ] Components are properly tested
- [ ] Performance considerations are addressed
- [ ] Security best practices are followed
- [ ] Documentation is updated

## 🚀 Deployment Guidelines

### 1. **Build Optimization**
```json
// package.json scripts
{
  "scripts": {
    "build": "tsc && vite build",
    "build:analyze": "tsc && vite build --mode analyze",
    "preview": "vite preview"
  }
}
```

### 2. **Environment Configuration**
```typescript
// Environment variables
const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3099/v1/api',
  environment: process.env.NODE_ENV || 'development',
  debug: process.env.REACT_APP_DEBUG === 'true',
};
```

### 3. **Performance Monitoring**
```typescript
// Performance monitoring
if (process.env.NODE_ENV === 'production') {
  // Add performance monitoring
  import('./utils/performance').then(({ initPerformanceMonitoring }) => {
    initPerformanceMonitoring();
  });
}
```

---

This comprehensive documentation provides all the technical details needed for developers to understand, maintain, and extend the Client CRUD system. Each section includes practical examples, best practices, and implementation patterns that ensure code quality, maintainability, and scalability.
