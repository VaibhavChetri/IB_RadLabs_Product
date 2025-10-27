# Inventory Client Listing

## Overview
This page shows all inventory data. You can see data from any date range and filter by client.

## What You See

### Page Header
- Title: "Inventory Client Listing"
- Location: Your city name (from user profile)
- Total items count
- Icon: 📦

### Stats Bar (Top Right)
Shows two numbers in a row:
- **🚛 Dispatch** (blue truck icon pointing right, blue numbers)
- **🚚 Returned** (yellow truck icon pointing left, orange numbers)

The truck icons show direction:
- Blue truck pointing right = containers going out (dispatch)
- Orange/yellow truck pointing left = containers coming back (returned)

Numbers use colors that match the truck colors.

### Filters
- **From Date**: Start date (date picker)
- **To Date**: End date (date picker)
- **Client**: Dropdown to filter by specific client
- **Show Columns**: Multi-select dropdown to show/hide columns

### Table
Columns:
- **#**: Serial number
- **Client**: Client name
- **Container**: Container type name
- **Opening**: Opening stock amount
- **Dispatch**: Dispatch amount
- **Returned**: Returned amount
- **Closing**: Closing stock amount
- **Status**: Shows ✓ if data was entered, or - if not entered
- **Date**: When the data was created

## How It Works

1. Select date range (from and to)
2. Optionally filter by client (or leave "All Clients")
3. Table shows inventory data for that date range
4. Stats bar shows total dispatch and returned amounts at the top
5. You can show/hide columns using "Show Columns" dropdown

## Mobile View

On mobile:
- Stats bar moves below the page header
- Filters stack vertically
- Everything still works the same

## API

**Endpoint**: `GET /billing/getEverydayClientInventoryValues`

**Parameters**:
- start_date: string
- end_date: string
- client_id: number (optional)
- page: number
- limit: number

**Response includes**:
- Data array
- Totals object with `totalDispatch` and `totalReturned`
- Pagination info

## Column Visibility

By default, all columns are shown. You can hide columns you don't need using the "Show Columns" dropdown.

Columns you can hide:
- Client
- Container
- Opening
- Dispatch
- Returned
- Closing
- Status
- Date

The serial number (#) column always stays visible.
