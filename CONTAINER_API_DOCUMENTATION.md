# Container API Documentation
check vehicle type on how its implemented and implement containers in the same way.

give me the postman body to create menu hirerarchy - you know this by documentation, on how to do this.
This should be under ops-admin as well

This document provides comprehensive request and response examples for the Container Type management APIs.

## Base URL

All endpoints are prefixed with `/api/containers` or `/v1/api/containers` depending on your route configuration.

---

## 1. Add Container Type

**Endpoint:** `POST /api/containers/addContainer`

**Authentication:** Required (auth middleware: `createBatch`)

**Description:** Creates a new container type in the system.

### Request Body

```json
{
  "container": "Large Plate",
  "weight": 250.5,
  "city_id": 5,
  "dishwasherCyclesPerDay": 3,
  "dishwasherOptimumCapacity": 50,
  "weightInGms": 250500,
  "impact_accountable": 1
}
```

### Request Body Schema

| Field                       | Type   | Required | Description                                                 |
| --------------------------- | ------ | -------- | ----------------------------------------------------------- |
| `container`                 | string | Yes      | Name of the container type                                  |
| `weight`                    | number | Yes      | Weight of the container (in base unit)                      |
| `city_id`                   | number | Yes      | ID of the city where this container type is available       |
| `dishwasherCyclesPerDay`    | number | Yes      | Number of dishwasher cycles per day                         |
| `dishwasherOptimumCapacity` | number | Yes      | Optimum capacity for dishwasher                             |
| `weightInGms`               | number | Yes      | Weight in grams                                             |
| `impact_accountable`        | number | Yes      | Flag indicating if container is impact accountable (0 or 1) |

### Success Response

**Status Code:** `200 OK`

```json
{
  "status": "Success",
  "status_code": 200,
  "message": "Container Large Plate added"
}
```

### Error Response

**Status Code:** `400 Bad Request`

```json
{
  "status_code": 400,
  "message": "Error message details"
}
```

---

## 2. Edit Container Type

**Endpoint:** `POST /api/containers/editContainer`

**Authentication:** Required (auth middleware: `createBatch`)

**Description:** Updates an existing container type.

### Request Body

```json
{
  "id": 123,
  "container": "Large Plate Updated",
  "weight": 260.5,
  "city_id": 5,
  "dishwasherCyclesPerDay": 4,
  "dishwasherOptimumCapacity": 60,
  "weightInGms": 260500,
  "impact_accountable": 1
}
```

### Request Body Schema

| Field                       | Type   | Required | Description                        |
| --------------------------- | ------ | -------- | ---------------------------------- |
| `id`                        | number | Yes      | ID of the container type to update |
| `container`                 | string | Yes      | Updated name of the container type |
| `weight`                    | number | Yes      | Updated weight of the container    |
| `city_id`                   | number | Yes      | Updated city ID                    |
| `dishwasherCyclesPerDay`    | number | Yes      | Updated dishwasher cycles per day  |
| `dishwasherOptimumCapacity` | number | Yes      | Updated optimum capacity           |
| `weightInGms`               | number | Yes      | Updated weight in grams            |
| `impact_accountable`        | number | Yes      | Updated impact accountable flag    |

### Success Response

**Status Code:** `200 OK`

```json
{
  "status": "Success",
  "status_code": 200,
  "message": "Container Large Plate Updated added"
}
```

### Error Response

**Status Code:** `400 Bad Request`

```json
{
  "status_code": 400,
  "message": "Error message details"
}
```

---

## 3. Delete Container Type

**Endpoint:** `POST /api/containers/delContainer`

**Authentication:** Required (auth middleware: `createBatch`)

**Description:** Soft deletes a container type by updating its status. This is a soft delete operation that sets the status field rather than removing the record.

### Request Body

```json
{
  "id": 123,
  "status": 0
}
```

### Request Body Schema

| Field    | Type   | Required | Description                                                    |
| -------- | ------ | -------- | -------------------------------------------------------------- |
| `id`     | number | Yes      | ID of the container type to delete                             |
| `status` | number | Yes      | Status to set (typically 0 for deleted/inactive, 1 for active) |

### Success Response

**Status Code:** `200 OK`

```json
{
  "status": "Success",
  "status_code": 200,
  "message": "Container deleted"
}
```

### Error Response

**Status Code:** `400 Bad Request`

```json
{
  "status_code": 400,
  "message": "Error message details"
}
```

---

## 4. Get Container Types

**Endpoint:** `GET /api/containers/getContainerTypes`

**Authentication:** Required (auth middleware: `createBatch`)

**Description:** Retrieves a list of container types with optional filtering by facility and status.

### Query Parameters

| Parameter    | Type           | Required | Description                                                                                                                                       |
| ------------ | -------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `facilityId` | number         | No       | Filter container types by facility ID. When provided, includes container count from inventory.                                                    |
| `all`        | boolean/string | No       | If true or "true", returns both active (status=1) and inactive (status=0) container types. If not provided, returns only active (status=1) types. |

### Request Examples

**Get all active container types:**

```
GET /api/containers/getContainerTypes
```

**Get all container types (active and inactive):**

```
GET /api/containers/getContainerTypes?all=true
```

**Get container types for a specific facility:**

```
GET /api/containers/getContainerTypes?facilityId=10
```

**Get all container types for a facility (including inactive):**

```
GET /api/containers/getContainerTypes?facilityId=10&all=true
```

### Success Response

**Status Code:** `200 OK`

**Response when facilityId is NOT provided:**

```json
{
  "status_code": 200,
  "status": "Success",
  "message": null,
  "data": [
    {
      "id": 1,
      "sku": "Small Plate",
      "weight": 150.5,
      "weightInGms": 150500,
      "dishwasherCyclesPerDay": 2,
      "dishwasherOptimumCapacity": 40,
      "impact_accountable": 1,
      "name": "Mumbai"
    },
    {
      "id": 2,
      "sku": "Large Plate",
      "weight": 250.5,
      "weightInGms": 250500,
      "dishwasherCyclesPerDay": 3,
      "dishwasherOptimumCapacity": 50,
      "impact_accountable": 1,
      "name": "Mumbai"
    }
  ]
}
```

**Response when facilityId IS provided:**

```json
{
  "status_code": 200,
  "status": "Success",
  "message": null,
  "data": [
    {
      "id": 1,
      "sku": "Small Plate",
      "weight": 150.5,
      "weightInGms": 150500,
      "dishwasherCyclesPerDay": 2,
      "dishwasherOptimumCapacity": 40,
      "impact_accountable": 1,
      "name": "Mumbai",
      "containerCount": 150
    },
    {
      "id": 2,
      "sku": "Large Plate",
      "weight": 250.5,
      "weightInGms": 250500,
      "dishwasherCyclesPerDay": 3,
      "dishwasherOptimumCapacity": 50,
      "impact_accountable": 1,
      "name": "Mumbai",
      "containerCount": 200
    }
  ]
}
```

### Response Data Schema

| Field                       | Type   | Description                                                                                               |
| --------------------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| `id`                        | number | Container type ID                                                                                         |
| `sku`                       | string | Container type name/SKU                                                                                   |
| `weight`                    | number | Weight of the container                                                                                   |
| `weightInGms`               | number | Weight in grams                                                                                           |
| `dishwasherCyclesPerDay`    | number | Number of dishwasher cycles per day                                                                       |
| `dishwasherOptimumCapacity` | number | Optimum capacity for dishwasher                                                                           |
| `impact_accountable`        | number | Flag indicating if container is impact accountable                                                        |
| `name`                      | string | City name (from cities table)                                                                             |
| `containerCount`            | number | (Optional) Count of containers in inventory for the facility. Only present when `facilityId` is provided. |

### Error Response

**Status Code:** `400 Bad Request`

```json
{
  "status_code": 400,
  "message": "Error message details"
}
```

**Status Code:** `404 Not Found`

```json
{
  "status_code": 404,
  "message": "Container Types not found"
}
```

---

## Database Schema Reference

### container_types Table

The container types are stored in the `container_types` table with the following structure:

- `id` (Primary Key)
- `name` - Container type name
- `weight` - Weight of container
- `weightInGms` - Weight in grams
- `dishwasherCyclesPerDay` - Number of cycles per day
- `dishwasherOptimumCapacity` - Optimum capacity
- `city_id` - Foreign key to cities table
- `created_by` - User ID who created the record
- `updated_by` - User ID who last updated the record
- `status` - Status flag (1 = active, 0 = inactive/deleted)
- `impact_accountable` - Flag for impact accountability

---

## Notes

1. **Soft Delete**: The delete operation (`delContainer`) performs a soft delete by updating the `status` field rather than removing the record from the database.

2. **User Context**: All operations require authentication, and the `user` object (from `req.user[0]`) is used to track `created_by` and `updated_by` fields.

3. **City Association**: Container types are associated with cities. The `city_id` field determines which city the container type belongs to.

4. **Facility Inventory**: When querying with `facilityId`, the API attempts to join with inventory tables to provide container counts. Note: The current implementation may have a query issue with the inventory join that needs to be addressed.

5. **Status Filtering**: By default, only active container types (status=1) are returned. Use the `all=true` query parameter to include inactive types.

---

## Implementation Notes for AI/LLM

When implementing or modifying these endpoints:

1. **Validation**: Ensure all required fields are validated before processing
2. **Error Handling**: Always wrap database operations in try-catch blocks
3. **User Context**: Extract user information from `req.user[0]` for audit fields
4. **Status Management**: Use soft deletes (status updates) rather than hard deletes
5. **Query Optimization**: The `getContainerTypes` query may need optimization for the facility inventory join
6. **Type Safety**: Convert string query parameters to appropriate types (numbers, booleans) before use
