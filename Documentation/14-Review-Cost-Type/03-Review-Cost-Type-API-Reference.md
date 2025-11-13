# Review Cost Type - API Reference

## Base URL

All endpoints are prefixed with `/v1/api`

## Endpoints

### 1. Get Review Cost Types (Listing)

**Endpoint**: `GET /review/getReviewCostingType`

**Query Parameters**:
- `page` (number, required) - Page number (default: 1)
- `limit` (number, required) - Items per page (default: 10)
- `showAll` (boolean, optional) - Show all results without pagination (default: false)
- `reviewCategoryTypeId` (number, optional) - Filter by cost category ID
- `status` (number, optional) - Filter by status (1 = Active, 0 = Inactive)

**Example Request**:
```bash
GET /v1/api/review/getReviewCostingType?page=1&limit=10&showAll=false&reviewCategoryTypeId=1&status=1
```

**Response Structure**:
```typescript
interface GetReviewCostingTypeResponse {
  status_code: number;
  status: string;
  data: ReviewCostingType[];
  pagination?: {
    totalPages: number;
    totalItems: number;
    currentPage: number;
    pageSize: number;
  };
}

interface ReviewCostingType {
  id: number;
  name: string;
  reviewCategoryName: string;
  status: string; // '1' = Active, '0' = Inactive
}
```

**Example Response**:
```json
{
  "status_code": 200,
  "status": "Success",
  "data": [
    {
      "id": 1,
      "name": "Manpower",
      "reviewCategoryName": "Direct Costs",
      "status": "1"
    },
    {
      "id": 2,
      "name": "Electricity",
      "reviewCategoryName": "Direct Costs",
      "status": "1"
    }
  ],
  "pagination": {
    "totalPages": 5,
    "totalItems": 50,
    "currentPage": 1,
    "pageSize": 10
  }
}
```

**Error Responses**:
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized
- `500` - Internal Server Error

---

### 2. Add Review Cost Type

**Endpoint**: `POST /review/addReviewCostingType`

**Headers**:
- `Content-Type: application/json`
- `Authorization: Bearer <token>`

**Request Body**:
```typescript
interface AddReviewCostTypeRequest {
  name: string;
  reviewCategoryTypeId: number;
}
```

**Example Request**:
```json
{
  "name": "New Cost Type",
  "reviewCategoryTypeId": 1
}
```

**Response Structure**:
```typescript
interface AddReviewCostTypeResponse {
  status_code: number;
  status: string;
  message?: string;
}
```

**Example Response**:
```json
{
  "status_code": 200,
  "status": "Success",
  "message": "Cost type added successfully"
}
```

**Error Responses**:
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `409` - Conflict (duplicate name)
- `500` - Internal Server Error

---

### 3. Update Review Cost Type

**Endpoint**: `PUT /review/updateReviewCostingType`

**Headers**:
- `Content-Type: application/json`
- `Authorization: Bearer <token>`

**Request Body**:
```typescript
interface UpdateReviewCostTypeRequest {
  id: number;
  name: string;
  reviewCategoryTypeId: number;
  status: number; // 1 = Active, 0 = Inactive
}
```

**Example Request**:
```json
{
  "id": 1,
  "name": "Updated Cost Type",
  "reviewCategoryTypeId": 2,
  "status": 1
}
```

**Response Structure**:
```typescript
interface UpdateReviewCostTypeResponse {
  status_code: number;
  status: string;
  message?: string;
}
```

**Example Response**:
```json
{
  "status_code": 200,
  "status": "Success",
  "message": "Cost type updated successfully"
}
```

**Error Responses**:
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `404` - Not Found (ID doesn't exist)
- `409` - Conflict (duplicate name)
- `500` - Internal Server Error

---

### 4. Get Cost Categories (for Dropdown)

**Endpoint**: `GET /review/getCostCategories`

**Query Parameters**:
- `status` (number, optional) - Filter by status (default: 1)

**Example Request**:
```bash
GET /v1/api/review/getCostCategories?status=1
```

**Response Structure**:
```typescript
interface GetCostCategoriesResponse {
  status_code: number;
  status: string;
  data: CostCategory[];
}

interface CostCategory {
  id: number;
  costCategories: string;
}
```

**Example Response**:
```json
{
  "status_code": 200,
  "status": "Success",
  "data": [
    {
      "id": 1,
      "costCategories": "Direct Costs"
    },
    {
      "id": 2,
      "costCategories": "Indirect Costs"
    }
  ]
}
```

---

## TypeScript Interfaces

**File**: `src/services/pAndLApi.ts`

```typescript
export interface ReviewCostingType {
  id: number;
  name: string;
  reviewCategoryName: string;
  status: string;
}

export interface GetReviewCostingTypeResponse {
  status_code: number;
  status: string;
  data: ReviewCostingType[];
  pagination?: {
    totalPages: number;
    totalItems: number;
    currentPage: number;
    pageSize: number;
  };
}

export interface CostCategory {
  id: number;
  costCategories: string;
}

export interface GetCostCategoriesResponse {
  status_code: number;
  status: string;
  data: CostCategory[];
}
```

## API Service Methods

**File**: `src/services/pAndLApi.ts`

```typescript
export class ReviewCostingTypeService {
  static async getReviewCostingType(
    page: number = 1,
    limit: number = 22,
    showAll: boolean = false,
    reviewCategoryTypeId?: number,
    status?: number
  ): Promise<GetReviewCostingTypeResponse> {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    params.set('showAll', showAll.toString());
    if (reviewCategoryTypeId !== undefined) {
      params.set('reviewCategoryTypeId', reviewCategoryTypeId.toString());
    }
    if (status !== undefined) {
      params.set('status', status.toString());
    }
    const response = await apiService.get<GetReviewCostingTypeResponse>(
      `/review/getReviewCostingType?${params.toString()}`
    );
    return response as unknown as GetReviewCostingTypeResponse;
  }

  static async addReviewCostingType(data: {
    name: string;
    reviewCategoryTypeId: number;
  }): Promise<{ status_code: number; status: string; message?: string }> {
    const response = await apiService.post<{
      status_code: number;
      status: string;
      message?: string;
    }>('/review/addReviewCostingType', data);
    return response as unknown as { status_code: number; status: string; message?: string };
  }

  static async updateReviewCostingType(data: {
    id: number;
    name: string;
    reviewCategoryTypeId: number;
    status: number;
  }): Promise<{ status_code: number; status: string; message?: string }> {
    const response = await apiService.put<{
      status_code: number;
      status: string;
      message?: string;
    }>('/review/updateReviewCostingType', data);
    return response as unknown as { status_code: number; status: string; message?: string };
  }
}
```

## Error Handling

### Standard Error Response

```typescript
interface ErrorResponse {
  code: number;
  message: string;
  stack?: string;
}
```

### Common Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

### Error Handling in Code

```typescript
try {
  const response = await ReviewCostingTypeService.addReviewCostingType(data);
  if (response.status_code === 200) {
    // Success
  } else {
    // Handle error
    setError(response.message || 'Failed to add cost type');
  }
} catch (err: unknown) {
  const errorMessage = err instanceof Error ? err.message : 'Failed to add cost type';
  setError(errorMessage);
}
```

## Authentication

All endpoints require authentication via Bearer token:

```
Authorization: Bearer <access_token>
```

Token is automatically added by `apiService` interceptor.

---

**Reference**: See [Implementation Guide](./02-Review-Cost-Type-Implementation-Guide.md) for usage examples.

