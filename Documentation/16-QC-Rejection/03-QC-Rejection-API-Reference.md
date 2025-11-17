# QC Rejection - API Reference

## Base URL

All APIs use base URL: `localhost:3099/v1/api`

## Authentication

All API calls require:
- **Authorization Header**: `Bearer {access_token}`
- **Cookie**: `refreshToken={refresh_token}`

## API Endpoints

### 1. Get QC Rejections (Listing)

**Endpoint**: `GET /api/transit-plan/getQCRejections`

**Description**: Fetches all QC rejection records

**Query Parameters**:
- `transit_date` (required): Date in format `YYYY-MM-DD`
- `client_id` (optional): Client ID (number)

**Example Requests**:
```
GET /api/transit-plan/getQCRejections?transit_date=2025-11-14
GET /api/transit-plan/getQCRejections?transit_date=2025-11-14&client_id=243
```

**Response Structure**:
```typescript
{
  status: string;
  status_code: number;
  data: Array<{
    id: number;
    transit_date: string;
    transit_time: string;
    clientName: string;
    containerTypeName: string;
    reasonName: string;
    rejectedCount: number;
    updatedByName: string;
  }>;
}
```

**Service Method**: `QCRejectionService.getQCRejections()`

**Hook**: `useQCRejectionData()`

---

### 2. Get QC Runs (Add Page)

**Endpoint**: `GET /api/transit-plan/getQcRuns`

**Description**: Fetches QC runs that need rejection entry

**Query Parameters**:
- `transit_date` (required): Date in format `YYYY-MM-DD`
- `client_id` (optional): Client ID (number)

**Example Requests**:
```
GET /api/transit-plan/getQcRuns?transit_date=2025-11-10
GET /api/transit-plan/getQcRuns?transit_date=2025-11-10&client_id=243
```

**Response Structure**:
```typescript
{
  status: string;
  status_code: number;
  data: Array<{
    id: number;
    client_id: number;
    transit_id: number;
    clientName: string;
    transit_date: string;
    transit_time: string;
  }>;
}
```

**Service Method**: `QCRejectionService.getQCRuns()`

**Hook**: `useQCRunsData()`

---

### 3. Get QC Report Adherence (Stats)

**Endpoint**: `GET /api/transit-plan/getQcReportAdherence`

**Description**: Fetches adherence statistics for QC report submission

**Query Parameters**:
- `start_date` (required): Start date in format `YYYY-MM-DD`
- `end_date` (required): End date in format `YYYY-MM-DD`

**Example Request**:
```
GET /api/transit-plan/getQcReportAdherence?start_date=2025-06-24&end_date=2025-06-24
```

**Response Structure**:
```typescript
{
  status: string;
  status_code: number;
  data: {
    total: {
      total: number;
      submitted: number;
      adherence: number; // Percentage
    };
    daily: Array<{
      date: string;
      total: number;
      submitted: number;
      adherence: number;
    }>;
  };
}
```

**Service Method**: `QCRejectionService.getQCReportAdherence()`

**Hook**: `useQCReportAdherence()`

---

### 4. Get Client SKU Map (Details Page)

**Endpoint**: `GET /api/inventory/getClientSkuMap`

**Description**: Fetches SKUs (container types) for a specific client

**Query Parameters**:
- `clientId` (required): Client ID (number)

**Example Request**:
```
GET /api/inventory/getClientSkuMap?clientId=101
```

**Response Structure**:
```typescript
{
  status_code: number;
  result: Array<{
    containerTypeId: number;
    containerType: string;
  }>;
}
```

**Service Method**: `SkuApiService.getClientSkuMap()`

**Used In**: `QCRejectionDetails.tsx`

---

### 5. Get Escalation Types (Rejection Reasons)

**Endpoint**: `GET /api/transit-plan/getComplaintTypes`

**Description**: Fetches all escalation/complaint types (used as rejection reasons)

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
  }>;
}
```

**Service Method**: `EscalationTypeService.getEscalationTypes()`

**Used In**: `QCRejectionDetails.tsx` (filtered to Active only)

---

### 6. Submit QC Rejections (Details Page)

**Endpoint**: `POST /api/transit-plan/qcRejections/{runId}`

**Description**: Submits rejection counts for a QC run

**Path Parameters**:
- `runId`: QC run ID (number)

**Request Body**:
```typescript
{
  details: Array<{
    containerTypeId: number;
    reasonId: number;
    rejectedCount: number;
  }>;
}
```

**Example Request**:
```json
{
  "details": [
    {
      "containerTypeId": 78,
      "reasonId": 4,
      "rejectedCount": 20
    },
    {
      "containerTypeId": 85,
      "reasonId": 4,
      "rejectedCount": 40
    },
    {
      "containerTypeId": 78,
      "reasonId": 5,
      "rejectedCount": 10
    }
  ]
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

**Service Method**: `QCRejectionService.submitQCRejections()`

**Used In**: `QCRejectionDetails.tsx` submit handler

---

### 7. Get Clients by City (Filter Dropdown)

**Endpoint**: `GET /api/inventory/getClientByCity`

**Description**: Fetches clients for a specific city (used in filters)

**Query Parameters**:
- `location_id` (required): City ID (number) - uses user's `city_id`

**Example Request**:
```
GET /api/inventory/getClientByCity?location_id=3
```

**Response Structure**:
```typescript
{
  status_code: number;
  result: Array<{
    clientId: number;
    clientName: string;
  }>;
}
```

**Service Method**: `InventoryApiService.getClientByCity()`

**Used In**: `QCRejectionListing.tsx`, `QCRejectionAdd.tsx`

---

## TypeScript Interfaces

### QCRejection (Listing Item)

```typescript
interface QCRejection {
  id: number;
  transit_date: string;
  transit_time: string;
  clientName: string;
  containerTypeName: string;
  reasonName: string;
  rejectedCount: number;
  updatedByName: string;
}
```

### QCRun (Add Page Item)

```typescript
interface QCRun {
  id: number;
  client_id: number;
  transit_id: number;
  clientName: string;
  transit_date: string;
  transit_time: string;
}
```

### QCReportAdherence

```typescript
interface QCReportAdherence {
  total: {
    total: number;
    submitted: number;
    adherence: number;
  };
  daily: Array<{
    date: string;
    total: number;
    submitted: number;
    adherence: number;
  }>;
}
```

### SubmitQCRejectionsRequest

```typescript
interface SubmitQCRejectionsRequest {
  details: Array<{
    containerTypeId: number;
    reasonId: number;
    rejectedCount: number;
  }>;
}
```

---

## Error Handling

### Common Errors

1. **400 Bad Request**: Invalid request body or missing required fields
2. **401 Unauthorized**: Missing or invalid authentication token
3. **404 Not Found**: Run ID not found (for submit)
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

## Service Implementation

### QCRejectionService Class

Located in: `src/services/transitPlanApi.ts`

**Methods**:
- `static async getQCRejections(params: { transit_date: string; client_id?: number; }): Promise<GetQCRejectionsResponse>`
- `static async getQCRuns(params: { transit_date: string; client_id?: number; }): Promise<GetQCRunsResponse>`
- `static async getQCReportAdherence(params: { start_date: string; end_date: string; }): Promise<GetQCReportAdherenceResponse>`
- `static async submitQCRejections(runId: number, payload: SubmitQCRejectionsRequest): Promise<ApiResponse>`

---

## Testing

### Test API Calls

**Get QC Rejections**:
```bash
curl --location 'localhost:3099/v1/api/transit-plan/getQCRejections?transit_date=2025-11-14' \
--header 'Authorization: Bearer YOUR_TOKEN' \
--header 'Cookie: refreshToken=YOUR_REFRESH_TOKEN'
```

**Get QC Runs**:
```bash
curl --location 'localhost:3099/v1/api/transit-plan/getQcRuns?transit_date=2025-11-10&client_id=243' \
--header 'Authorization: Bearer YOUR_TOKEN' \
--header 'Cookie: refreshToken=YOUR_REFRESH_TOKEN'
```

**Get QC Report Adherence**:
```bash
curl --location 'localhost:3099/v1/api/transit-plan/getQcReportAdherence?start_date=2025-06-24&end_date=2025-06-24' \
--header 'Authorization: Bearer YOUR_TOKEN' \
--header 'Cookie: refreshToken=YOUR_REFRESH_TOKEN'
```

**Submit QC Rejections**:
```bash
curl --location --request POST 'localhost:3099/v1/api/transit-plan/qcRejections/25' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_TOKEN' \
--header 'Cookie: refreshToken=YOUR_REFRESH_TOKEN' \
--data '{
  "details": [
    {
      "containerTypeId": 78,
      "reasonId": 4,
      "rejectedCount": 20
    }
  ]
}'
```

---

**Related Documentation**: [How It Works](./01-QC-Rejection-How-It-Works.md) | [Pages](./02-QC-Rejection-Pages.md)

