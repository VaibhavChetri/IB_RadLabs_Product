# Menu Creation Payload for Postman

## How to Use

1. Get Ops Admin menu ID - Call `GET /menus` and find the menu with name "Ops Admin"
2. Use the API endpoint `/menus/hierarchy` (POST method)
3. Replace `<OPS_ADMIN_MENU_ID>` in the payload below with the actual ID
4. Send the request

## Payload

```json
{
  "parent": {
    "name": "SKU Mapping",
    "slug": "sku-mapping",
    "parent_id": <OPS_ADMIN_MENU_ID>,
    "sort_order": 2,
    "level": 1,
    "badge": null,
    "status": 1
  },
  "children": [
    {
      "name": "Add Mapping",
      "slug": "add-sku-mapping",
      "parent_id": null,
      "sort_order": 1,
      "level": 2,
      "badge": null,
      "status": 1
    },
    {
      "name": "SKU Listing",
      "slug": "sku-listing",
      "parent_id": null,
      "sort_order": 2,
      "level": 2,
      "badge": null,
      "status": 1
    }
  ]
}
```

## After Creating Menus

Update `src/config/menuConfig.ts` to add these menu items under `ops-admin`:

```typescript
{
  id: 'container-sku-mapping',
  name: 'Container SKU Mapping',
  icon: Package,
  children: [
    {
      id: 'add-client-sku-mapping',
      name: 'Add Client SKU Mapping',
      icon: Link,
      href: '/ops-admin/map-sku/add'
    },
    {
      id: 'sku-mapping-listing',
      name: 'SKU Mapping Listing',
      icon: List,
      href: '/ops-admin/map-sku/listing'
    }
  ]
}
```
