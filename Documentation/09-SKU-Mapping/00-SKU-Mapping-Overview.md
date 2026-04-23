# SKU Mapping Overview

## What is This?

SKU Mapping connects containers to specific clients. Each client uses different containers based on their needs.

## Why Do We Need This?

Different clients have different requirements:

- Some use reusable containers (bowls, plates) - called "Water Inefficiency"
- Some use disposable containers - called "Single use PP"  
- Some use clamshell containers

The system needs to know which containers belong to which client so it can track them properly.

## How It Works

1. Select a client
2. System shows what type of containers this client uses
3. Enter container details (prices, weights, distances)
4. Save the mapping
5. Later you can edit or view these mappings

## What Pages Are There?

### Add Page
- Map new containers to a client
- Choose client from dropdown
- Enter container details
- Click Save to store the mapping

### Listing Page  
- See all mappings for a client
- Filter by status (Enabled/Disabled)
- Click Edit to change a mapping

### Edit Page
- Change existing mapping details
- Cannot change which client it belongs to
- Updates the mapping when you click Save

## Where Does Data Go?

- **Page**: Shows the form and table
- **Redux Store**: Stores loaded data temporarily
- **API**: Sends data to server when you save
- **Database**: Stores the final mapping

## Files in Code

- API Service: `src/services/skuApi.ts`
- Add Page: `src/pages/AddClientSkuMapping.tsx`
- Edit Page: Uses same page as Add (different mode)
- Listing Page: `src/pages/SkuMapListing.tsx`
- Routes: `src/config/routes.tsx`
- Menu Config: `src/config/menuConfig.ts`

## Important Points

- Client dropdown shows all active clients
- Container type can only be added once per client
- Different tables shown based on impact type
- Empty fields become zero when saved
- Cannot change client when editing

