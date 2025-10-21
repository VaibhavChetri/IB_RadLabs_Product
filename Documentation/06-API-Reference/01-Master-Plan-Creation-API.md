# Master Plan Creation API

## Overview
This document covers the API endpoints and data structures for Master Plan Creation functionality in the IB Dashboard application.

## Endpoints

### Create Master Plan

**Endpoint**: `POST /transit-plan/create-master-transit-plan`

**Description**: Creates a new master transit plan with dispatch and pickup schedules.

**Authentication**: Required (Bearer Token)

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <access_token>
Cookie: refreshToken=<refresh_token>
```

### Request Payload

```json
{
  "restaurantId": 120,
  "cityId": 3,
  "facilityId": 1,
  "input": [
    {
      "transitTypeId": 1,
      "data": [
        {
          "vehicleId": 3,
          "transitDate": "2024-06-01",
          "transitTime": "12:00:00",
          "driverName": "Seenu Lingappa",
          "driverPhone": "1234567890"
        },
        {
          "vehicleId": 3,
          "transitDate": "2024-06-01",
          "transitTime": "13:00:00",
          "driverName": "Seenu Lingappa",
          "driverPhone": "1234567890"
        }
      ]
    },
    {
      "transitTypeId": 2,
      "data": [
        {
          "vehicleId": 3,
          "transitDate": "2024-06-01",
          "transitTime": "15:00:00",
          "driverName": "Seenu Lingappa",
          "driverPhone": "1234567890"
        }
      ]
    }
  ]
}
```

### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `restaurantId` | integer | Yes | ID of the restaurant/client |
| `cityId` | integer | Yes | ID of the city |
| `facilityId` | integer | Yes | ID of the washing facility |
| `input` | array | Yes | Array of transit type groups |

#### Input Array Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `transitTypeId` | integer | Yes | Transit type ID (1=Dispatch, 2=Pickup) |
| `data` | array | Yes | Array of transit entries |

#### Data Array Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `vehicleId` | integer | Yes | ID of the vehicle |
| `transitDate` | string | Yes | Date in YYYY-MM-DD format |
| `transitTime` | string | Yes | Time in HH:MM:SS format (24-hour) |
| `driverName` | string | Yes | Name of the driver |
| `driverPhone` | string | Yes | Phone number of the driver |

### Response Format

#### Success Response (200)
```json
{
  "status_code": 200,
  "status": "success",
  "message": "Master plan created successfully",
  "data": {
    "planId": 12345,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Error Response (400)
```json
{
  "status_code": 400,
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "transitTime",
      "message": "\"transitTime\" should be a time."
    }
  ]
}
```

#### Error Response (401)
```json
{
  "status_code": 401,
  "status": "error",
  "message": "Unauthorized access"
}
```

#### Error Response (500)
```json
{
  "status_code": 500,
  "status": "error",
  "message": "Internal server error"
}
```

## Data Validation Rules

### Time Format Validation
- **Format**: Must be in `HH:MM:SS` format (24-hour)
- **Valid Examples**: `"12:00:00"`, `"09:30:00"`, `"23:59:59"`
- **Invalid Examples**: `"12:00 PM"`, `"12:00"`, `"25:00:00"`

### Date Format Validation
- **Format**: Must be in `YYYY-MM-DD` format
- **Valid Examples**: `"2024-06-01"`, `"2024-12-31"`
- **Invalid Examples**: `"06/01/2024"`, `"2024-13-01"`

### Required Field Validation
- All fields in the request payload are required
- Empty strings or null values are not allowed
- Arrays must contain at least one element

## Error Handling

### Common Error Scenarios

#### 1. Time Format Errors
```json
{
  "status_code": 400,
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "transitTime",
      "message": "\"transitTime\" should be a time."
    }
  ]
}
```

#### 2. Missing Required Fields
```json
{
  "status_code": 400,
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "restaurantId",
      "message": "\"restaurantId\" is required."
    }
  ]
}
```

#### 3. Invalid Transit Type
```json
{
  "status_code": 400,
  "status": "error",
  "message": "Invalid transit type ID"
}
```

## Frontend Integration

### API Service Implementation

```typescript
// src/services/transitPlanApi.ts
export const TransitPlanApi = {
  async createMasterPlan(payload: {
    restaurantId: number;
    cityId: number;
    facilityId: number;
    input: Array<{
      transitTypeId: number;
      data: Array<{
        vehicleId: number;
        transitDate: string;
        transitTime: string;
        driverName: string;
        driverPhone: string;
      }>;
    }>;
  }): Promise<ApiResponse<any>> {
    return api.post('/transit-plan/create-master-transit-plan', payload);
  },
};
```

### Time Format Conversion

The frontend uses 12-hour format (`HH:MM AM/PM`) but the API expects 24-hour format (`HH:MM:SS`). Conversion is handled in the frontend:

```typescript
// Convert "12:00 PM" to "12:00:00"
const convertTimeFormat = (timeString: string): string => {
  if (!timeString) return '00:00:00';
  
  const [time, period] = timeString.split(' ');
  const [hours, minutes] = time.split(':');
  
  let hour24 = parseInt(hours, 10);
  
  if (period === 'PM' && hour24 !== 12) {
    hour24 += 12;
  } else if (period === 'AM' && hour24 === 12) {
    hour24 = 0;
  }
  
  return `${hour24.toString().padStart(2, '0')}:${minutes}:00`;
};
```

## Testing

### cURL Example

```bash
curl --location 'localhost:3099/v1/api/transit-plan/create-master-transit-plan' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
--header 'Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
--data '{
  "restaurantId": 120,
  "cityId": 3,
  "facilityId": 1,
  "input": [
    {
      "transitTypeId": 1,
      "data": [
        {
          "vehicleId": 3,
          "transitDate": "2024-06-01",
          "transitTime": "12:00:00",
          "driverName": "Seenu Lingappa",
          "driverPhone": "1234567890"
        }
      ]
    }
  ]
}'
```

### Test Cases

#### Valid Request
- All required fields present
- Correct time format (HH:MM:SS)
- Valid date format (YYYY-MM-DD)
- Valid transit type IDs (1 or 2)

#### Invalid Requests
- Missing required fields
- Invalid time format
- Invalid date format
- Invalid transit type ID
- Empty data arrays

## Related APIs

### Supporting APIs

#### Get Facilities
- **Endpoint**: `GET /locations/getLocations?location_type=2`
- **Purpose**: Populate facility dropdown

#### Get Clients
- **Endpoint**: `GET /transit-plan/get-citywise-restaurants`
- **Purpose**: Populate client dropdown

#### Get Vehicles
- **Endpoint**: `GET /vehicle/getVehicles`
- **Purpose**: Populate vehicle dropdown

#### Get Transit Types
- **Endpoint**: `GET /transit-plan/get-transit-types`
- **Purpose**: Get available transit types (Dispatch/Pickup)

## Rate Limiting

- **Requests per minute**: 60
- **Burst limit**: 10 requests per second
- **Rate limit headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

## Security Considerations

- **Authentication**: Required for all requests
- **Authorization**: User must have appropriate permissions
- **Input Validation**: All inputs are validated server-side
- **SQL Injection**: Protected by parameterized queries
- **XSS Protection**: Input sanitization implemented

## Monitoring and Logging

- **Request Logging**: All requests are logged with timestamps
- **Error Tracking**: Errors are tracked with stack traces
- **Performance Monitoring**: Response times are monitored
- **Usage Analytics**: API usage patterns are analyzed
