# Escalation Type - API Reference

## Base URL

All APIs use base URL: `localhost:3099/v1/api`

## Authentication

All API calls require:
- **Authorization Header**: `Bearer {access_token}`
- **Cookie**: `refreshToken={refresh_token}`

## API Endpoints

### 1. Get Escalation Types

**Endpoint**: `GET /api/transit-plan/getComplaintTypes`

**Description**: Fetches all escalation/complaint types

**Query Parameters**: None

**Response Structure**:
```typescript
{
  status: string;
  status_code: number;
  data: Array<{
    id: number;
    name: string;
    status: 'Active' | 'Inactive';
    created_at: string | null;
    updated_at: string | null;
  }>;
}
```

**Example Response**:
```json
{
  "status": "success",
  "status_code": 200,
  "data": [
    {
      "id": 1,
      "name": "Damaged Container",
      "status": "Active",
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": null
    },
    {
      "id": 2,
      "name": "Wrong SKU",
      "status": "Active",
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": null
    }
  ]
}
```

**Service Method**: `EscalationTypeService.getEscalationTypes()`

**Hook**: `useEscalationTypeData()`

---

### 2. Create Escalation Type

**Endpoint**: `POST /api/transit-plan/createComplaintType`

**Description**: Creates a new escalation/complaint type

**Request Body**:
```typescript
{
  name: string;
  status: number; // 1 = Active, 0 = Inactive
}
```

**Example Request**:
```json
{
  "name": "Missing Items",
  "status": 1
}
```

**Response Structure**:
```typescript
{
  status: string;
  status_code: number;
  message?: string;
  data?: {
    id: number;
    name: string;
    status: number;
  };
}
```

**Service Method**: `EscalationTypeService.createEscalationType()`

**Hook**: `useEscalationTypeMutations().addMutation`

---

### 3. Update Escalation Type

**Endpoint**: `PUT /api/transit-plan/updateComplaintType/{id}`

**Description**: Updates an existing escalation/complaint type

**Path Parameters**:
- `id`: Escalation type ID (number)

**Request Body**:
```typescript
{
  name: string;
  status: number; // 1 = Active, 0 = Inactive
}
```

**Example Request**:
```json
{
  "name": "Damaged Container - Updated",
  "status": 0
}
```

**Response Structure**:
```typescript
{
  status: string;
  status_code: number;
  message?: string;
}
```

**Service Method**: `EscalationTypeService.updateEscalationType()`

**Hook**: `useEscalationTypeMutations().updateMutation`

---

## TypeScript Interfaces

### EscalationType

```typescript
interface EscalationType {
  id: number;
  name: string;
  status: 'Active' | 'Inactive';
  created_at: string | null;
  updated_at: string | null;
}
```

### GetEscalationTypesResponse

```typescript
interface GetEscalationTypesResponse {
  status: string;
  status_code: number;
  data: EscalationType[];
}
```

### CreateEscalationTypeRequest

```typescript
interface CreateEscalationTypeRequest {
  name: string;
  status: number; // 1 = Active, 0 = Inactive
}
```

### UpdateEscalationTypeRequest

```typescript
interface UpdateEscalationTypeRequest {
  name: string;
  status: number; // 1 = Active, 0 = Inactive
}
```

---

## Error Handling

### Common Errors

1. **400 Bad Request**: Invalid request body or missing required fields
2. **401 Unauthorized**: Missing or invalid authentication token
3. **404 Not Found**: Escalation type ID not found (for update)
4. **500 Internal Server Error**: Server-side error

### Error Response Structure

```typescript
{
  status: string;
  status_code: number;
  message: string;
  error?: string;
}
```

---

## Status Conversion

### Frontend → Backend

- `'Active'` → `1`
- `'Inactive'` → `0`

### Backend → Frontend

- `1` → `'Active'`
- `0` → `'Inactive'`

**Conversion Location**: `useEscalationTypeMutations.ts`

---

## Service Implementation

### EscalationTypeService Class

Located in: `src/services/transitPlanApi.ts`

**Methods**:
- `static async getEscalationTypes(): Promise<GetEscalationTypesResponse>`
- `static async createEscalationType(data: CreateEscalationTypeRequest): Promise<ApiResponse>`
- `static async updateEscalationType(id: number, data: UpdateEscalationTypeRequest): Promise<ApiResponse>`

---

## Testing

### Test API Calls

Use these curl commands to test APIs:

**Get Escalation Types**:
```bash
curl --location 'localhost:3099/v1/api/transit-plan/getComplaintTypes' \
--header 'Authorization: Bearer YOUR_TOKEN' \
--header 'Cookie: refreshToken=YOUR_REFRESH_TOKEN'
```

**Create Escalation Type**:
```bash
curl --location --request POST 'localhost:3099/v1/api/transit-plan/createComplaintType' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_TOKEN' \
--header 'Cookie: refreshToken=YOUR_REFRESH_TOKEN' \
--data '{
  "name": "Test Escalation Type",
  "status": 1
}'
```

**Update Escalation Type**:
```bash
curl --location --request PUT 'localhost:3099/v1/api/transit-plan/updateComplaintType/1' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_TOKEN' \
--header 'Cookie: refreshToken=YOUR_REFRESH_TOKEN' \
--data '{
  "name": "Updated Escalation Type",
  "status": 0
}'
```

---

**Related Documentation**: [How It Works](./01-Escalation-Type-How-It-Works.md)

