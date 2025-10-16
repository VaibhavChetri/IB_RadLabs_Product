# API Setup Documentation

This document describes the professional, industry-standard Axios setup for the IB Dashboard project.

## Overview

The API setup provides:
- ✅ Centralized API configuration
- ✅ Automatic token management
- ✅ Request/response interceptors
- ✅ Error handling with retry logic
- ✅ TypeScript support
- ✅ Environment-based configuration
- ✅ Redux integration for state management
- ✅ Custom hooks for React components

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3099/v1/api
VITE_API_TIMEOUT=10000

# Authentication
VITE_AUTH_TOKEN_KEY=auth_token
VITE_REFRESH_TOKEN_KEY=refresh_token

# Environment
VITE_APP_ENV=development
VITE_APP_NAME=IB Dashboard
VITE_APP_VERSION=1.0.0
```

### Environment Variables Explained

- `VITE_API_BASE_URL`: Base URL for all API calls (includes `/api` path)
- `VITE_API_TIMEOUT`: Request timeout in milliseconds
- `VITE_AUTH_TOKEN_KEY`: LocalStorage key for access token
- `VITE_REFRESH_TOKEN_KEY`: LocalStorage key for refresh token
- `VITE_APP_ENV`: Application environment (development/staging/production)
- `VITE_APP_NAME`: Application name
- `VITE_APP_VERSION`: Application version

## API Structure

```
src/services/
├── api.ts              # Core API client and configuration
├── authApi.ts          # Authentication API methods
├── dashboardApi.ts    # Dashboard-specific API methods
├── apiFactory.ts       # Generic CRUD service factory
└── index.ts            # Centralized exports

src/hooks/
└── useApi.ts           # Custom React hooks for API calls

src/store/slices/
└── apiSlice.ts         # Redux slice for API state management
```

## Usage Examples

### 1. Direct API Service Usage

```typescript
import { AuthApiService, DashboardApiService } from '../services';

// Login
const loginResponse = await AuthApiService.login({
  username: 'ch-mumbai',
  password: 'ch-mumbai',
});

// Get dashboard stats
const statsResponse = await DashboardApiService.getStats({
  dateRange: { start: '2024-01-01', end: '2024-12-31' },
  period: 'monthly',
});
```

### 2. Using Custom Hooks

```typescript
import { useApi, useFormApi } from '../hooks/useApi';
import { AuthApiService } from '../services';

function LoginForm() {
  const loginApi = useFormApi('login', AuthApiService.login);

  const handleSubmit = async (formData) => {
    try {
      const result = await loginApi.submit(formData);
      // Handle success
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div>
      {loginApi.loading && <div>Logging in...</div>}
      {loginApi.error && <div>Error: {loginApi.error}</div>}
      {/* Form JSX */}
    </div>
  );
}
```

### 3. Generic CRUD Operations

```typescript
import { userService } from '../services';

// Get all users
const users = await userService.getAll();

// Get user by ID
const user = await userService.getById(123);

// Create user
const newUser = await userService.create({
  name: 'John Doe',
  email: 'john@example.com',
});

// Update user
const updatedUser = await userService.update(123, {
  name: 'Jane Doe',
});

// Delete user
await userService.delete(123);
```

### 4. File Upload with Progress

```typescript
import { useFileUpload } from '../hooks/useApi';

function FileUpload() {
  const uploadApi = useFileUpload('file-upload', fileService.upload);

  const handleFileSelect = (file) => {
    uploadApi.upload(file);
  };

  return (
    <div>
      <input type="file" onChange={handleFileSelect} />
      {uploadApi.isUploading && (
        <div>Uploading... {uploadApi.uploadProgress}%</div>
      )}
    </div>
  );
}
```

## API Client Features

### Automatic Token Management

- Tokens are automatically added to request headers
- Automatic token refresh on 401 errors
- Token storage in localStorage
- Automatic logout on refresh failure

### Request Interceptors

- Automatic Authorization header injection
- Request timing for debugging
- Content-Type handling

### Response Interceptors

- Automatic error handling
- Token refresh on 401 errors
- Response timing logging
- Standardized error format

### Error Handling

All API errors follow a consistent format:

```typescript
interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}
```

## Redux Integration

The API setup includes Redux integration for managing loading states and errors:

```typescript
import { useSelector } from 'react-redux';
import { selectApiLoading, selectApiError } from '../store/slices/apiSlice';

function MyComponent() {
  const isLoading = useSelector(state => selectApiLoading(state.api, 'my-api-call'));
  const error = useSelector(state => selectApiError(state.api, 'my-api-call'));
  
  // Use loading and error states
}
```

## TypeScript Support

Full TypeScript support with:
- Generic API response types
- Type-safe API methods
- Environment variable types
- Custom hook types

## Best Practices

1. **Always use environment variables** for configuration
2. **Use the custom hooks** for React components
3. **Handle errors gracefully** with try-catch blocks
4. **Use the generic CRUD services** for standard operations
5. **Implement proper loading states** in your UI
6. **Clear errors** when appropriate

## Security Considerations

- Tokens are stored in localStorage (consider httpOnly cookies for production)
- Automatic token refresh prevents session expiration
- All API calls include proper error handling
- Environment variables prevent hardcoded secrets

## Testing

The API setup is designed to be easily testable:
- Mock the API services in tests
- Use the Redux store for testing state management
- Test error scenarios with different HTTP status codes

## Production Considerations

For production deployment:
1. Update environment variables for production URLs
2. Consider implementing request/response logging
3. Add rate limiting handling
4. Implement proper error monitoring
5. Consider using httpOnly cookies for token storage
