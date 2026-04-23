# SKU Mapping API Reference

## Overview

This document describes the API endpoints used for Client SKU Mapping.

All endpoints are in the `/api/inventory` namespace.

## Get Clients by City

### Endpoint
```
GET /api/inventory/getClientByCity?location_id={location_id}
```

### Purpose
Get list of all clients for a specific city/location.

### Parameters
- `location_id` (required): The location ID

### Response Format
```json
{
  "status": "Success",
  "status_code": 200,
  "result": [
    {
      "clientName": "Jiostar Pvt Ltd.",
      "clientId": 149,
      "impactTypes": [
        {
          "id": 3,
          "name": "Water Inefficiency"
        }
      ]
    }
  ]
}
```

### Fields Explained
- **clientName**: Name of the client
- **clientId**: Unique ID for the client
- **impactTypes**: Array of impact types for this client
- **id**: Impact type ID (1 = Single use PP, 2 = Clamshell, 3 = Water Inefficiency)
- **name**: Human-readable impact type name

### Use Case
Used to populate the client dropdown in Add and Listing pages.

## Get Client SKU Mapping

### Endpoint
```
GET /api/inventory/getClientSkuMap?clientId={clientId}
```

### Purpose
Get all mappings for a specific client.

### Parameters
- `clientId` (required): The client ID

### Response Format
```json
{
  "status": "Success",
  "status_code": 200,
  "message": "Client Sku Mapping",
  "result": [
    {
      "clientName": "Jiostar Pvt Ltd.",
      "price": "7.80",
      "clientId": 149,
      "containerType": "Black Bowl Melamine (530ml)",
      "containerTypeId": 82,
      "status": "Enabled",
      "platesWashedPerCycleByClient": 12,
      "distanceFromWarehouse": 60,
      "srcingDistance": 0,
      "weight_bagasse": "0.00",
      "srcQtyTransportedOneTripEv": 0,
      "qtyTransportedOneTrip": 0,
      "numberOfClamshell": 200,
      "electricityConsumedPerCycle": "0.4840",
      "waterConsumedPerCycle": 4,
      "disposableWeight": 0,
      "combine_sku": 0,
      "impactId": 3,
      "impactName": "Water Inefficiency"
    }
  ]
}
```

### Fields Explained
- **clientName**: Name of the client
- **price**: Price of the container
- **clientId**: ID of the client
- **containerType**: Name of container
- **containerTypeId**: ID of container type
- **status**: Enabled or Disabled
- **platesWashedPerCycleByClient**: Plates washed per cycle (Water Inefficiency)
- **distanceFromWarehouse**: Distance from warehouse in km (Water Inefficiency)
- **srcingDistance**: Distance from vendor in km (Single use PP, Clamshell)
- **qtyTransportedOneTrip**: Quantity transported per trip (Single use PP, Clamshell)
- **disposableWeight**: Weight of disposable container in grams (Single use PP)
- **weight_bagasse**: Weight in grams (Clamshell)
- **numberOfClamshell**: Number of clamshells (Clamshell)
- **electricityConsumedPerCycle**: Electricity used per cycle
- **waterConsumedPerCycle**: Water used per cycle
- **combine_sku**: 1 if combined SKU, 0 if not
- **impactId**: Impact type ID
- **impactName**: Impact type name

### Use Case
Used to load existing mappings in Edit page and Listing page.

## Add Client SKU Mapping

### Endpoint
```
POST /api/inventory/addClientSkuMap
```

### Purpose
Create new container mappings for a client.

### Request Format
```json
{
  "user_id": 123,
  "clients": [
    {
      "id": 101,
      "containers": [
        {
          "container_type_id": 78,
          "price": 12.50,
          "platesWashedPerCycleByClient": 100,
          "distanceFromWarehouse": 5.5,
          "srcingDistance": 3.2,
          "weight_bagasse": 50,
          "srcQtyTransportedOneTripEv": 100,
          "qtyTransportedOneTrip": 150,
          "numberOfClamshell": 10,
          "electricityConsumedPerCycle": 2.5,
          "disposableWeight": 30,
          "waterConsumedPerCycle": 15,
          "combineSku": 0,
          "impact_type_id": 1
        }
      ]
    }
  ]
}
```

### Fields Explained
- **user_id**: ID of the user making the request (from Redux)
- **clients**: Array of clients with their containers
- **id**: Client ID
- **containers**: Array of containers for this client
- **container_type_id**: ID of the container type
- **price**: Price as a number
- **combineSku**: 0 or 1 (based on checkbox)

### Impact Type Specific Fields

**Water Inefficiency (impact_type_id = 3)**:
- `platesWashedPerCycleByClient`: Number of plates washed per cycle
- `distanceFromWarehouse`: Distance in km

**Single use PP (impact_type_id = 1)**:
- `srcingDistance`: Distance from vendor in km
- `qtyTransportedOneTrip`: Quantity transported per trip
- `disposableWeight`: Weight in grams

**Clamshell (impact_type_id = 2)**:
- `srcingDistance`: Distance from vendor in km
- `qtyTransportedOneTrip`: Quantity transported per trip
- `weight_bagasse`: Weight in grams
- `numberOfClamshell`: Number of clamshells

### Common Fields
- `electricityConsumedPerCycle`: Always required
- `waterConsumedPerCycle`: Always required

### Response Format
```json
{
  "status": "Success",
  "status_code": 200,
  "message": "SKU created successfully"
}
```

### Use Case
Called when user clicks Save on Add page.

## Update Client SKU Mapping

### Endpoint
```
PUT /api/inventory/updateClientSkuMap
```

### Purpose
Update existing mappings for a client.

### Request Format
```json
{
  "containers": [
    {
      "client_id": 149,
      "status": 1,
      "containerDetails": [
        {
          "container_type_id": 82,
          "price": "0.00",
          "combine_sku": 0,
          "electricityConsumedPerCycle": 0.484,
          "waterConsumedPerCycle": 4,
          "impact_type_id": 3,
          "distanceFromWarehouse": 60,
          "platesWashedPerCycleByClient": 10
        }
      ]
    }
  ]
}
```

### Fields Explained
- **containers**: Array of container groups
- **client_id**: ID of the client
- **status**: 1 for Enabled, 0 for Disabled
- **containerDetails**: Array of container details
- **combine_sku**: 0 or 1 (based on checkbox)

### Response Format
```json
{
  "status": "Success",
  "status_code": 200,
  "message": "SKU updated/created successfully"
}
```

### Use Case
Called when user clicks Update on Edit page.

## API Service File

All API methods are in: `src/services/skuApi.ts`

```typescript
export class SkuApiService {
  static async getClientByCity(location_id: number);
  static async getClientSkuMap(clientId: number);
  static async addClientSkuMap(payload: AddClientSkuMapRequest);
  static async updateClientSkuMap(payload: UpdateClientSkuMapRequest);
}
```

## Important Notes

- All ID fields must be numbers, not strings
- Price fields can be numbers or strings (API handles both)
- Empty fields should be sent as 0, not null or undefined
- `combineSku` in add API vs `combine_sku` in update API (different naming)
- Status in update API is 1 or 0, not "Enabled" or "Disabled"

