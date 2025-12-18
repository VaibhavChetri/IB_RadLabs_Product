# Update Sent Inventory API

## Overview
This API endpoint is used to update existing sent inventory dispatch details from the Sent Inventory Listing edit page.

## Endpoint
```
PUT /v1/api/inventory/updateB2BInventory
```

## Request Headers
```
Content-Type: application/json
Authorization: Bearer {auth_token}
```

## Request Body Structure

### Payload Structure
```json
{
    "containers": [
        {
            "id": 79089,
            "client_id": 118,
            "container_type_id": 47,
            "count": 20,
            "facility_id": 8
        },
        {
            "id": 79090,
            "client_id": 118,
            "container_type_id": 52,
            "count": 60,
            "facility_id": 8
        }
    ]
}
```

## Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `containers` | Array | Yes | Array of container objects with all required fields |
| `containers[].id` | Integer | Yes | Record ID from the original sent inventory response (e.g., 79089, 79090) |
| `containers[].client_id` | Integer | Yes | ID of the client location |
| `containers[].container_type_id` | Integer | Yes | ID of the container type |
| `containers[].count` | Integer | Yes | Number of containers (must be > 0) |
| `containers[].facility_id` | Integer | Yes | ID of the washing facility |

## Notes

1. **Record ID**: Each container object must include the `id` field from the original API response. This ID identifies which specific record to update.
2. **Container Filtering**: Only containers with `count > 0` are included in the payload
3. **Client and Facility IDs**: Both `client_id` and `facility_id` are included in each container object
4. **New Records**: If `id` is null or missing in a container object, the backend should create a new record instead of updating

## Response Structure

### Success Response (200)
```json
{
    "status": "Success",
    "status_code": 200,
    "message": "Sent inventory updated successfully",
    "data": {
        "id": 81628,
        "updated_at": "2025-11-17 10:30:00"
    }
}
```

### Error Response (400/500)
```json
{
    "status": "Error",
    "status_code": 400,
    "message": "Validation error: Missing required field",
    "data": null
}
```

## Example Request (Postman/cURL)

### cURL
```bash
curl -X PUT "https://stage-dashboard.getinfinitybox.com/v1/api/inventory/updateB2BInventory" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "containers": [
        {
            "id": 79089,
            "client_id": 118,
            "container_type_id": 47,
            "count": 20,
            "facility_id": 8
        },
        {
            "id": 79090,
            "client_id": 118,
            "container_type_id": 52,
            "count": 60,
            "facility_id": 8
        }
    ]
}'
```

## Frontend Implementation

The payload is generated in `EditSentInventoryDetails.tsx` in the `handleSubmit` function:

```typescript
const inventoryPayload = {
    containers: Object.entries(containerCounts)
        .filter(([_, count]) => count > 0)
        .map(([containerTypeId, count]) => ({
            id: recordIds[parseInt(containerTypeId)] || null, // Include record ID if available
            client_id: Number(clientLocationId),
            container_type_id: parseInt(containerTypeId),
            count,
            facility_id: Number(facilityId),
        })),
};
```

## Related APIs

- **Create Sent Inventory**: `POST /api/inventory/sendB2BInventory` (used in create flow)
- **Get Sent Inventory**: `GET /api/inventory/getSentCount` (used in listing page)

