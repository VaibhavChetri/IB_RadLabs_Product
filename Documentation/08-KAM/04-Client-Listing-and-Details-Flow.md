# Client Listing and Client Inventory Details Flow

This document explains how the Client Listing page and Client Inventory Details page work together. It describes the flow, logic, and code used in simple English.

---

## Overview

The KAM (Key Account Manager) feature has two main pages:
1. **Client Listing Page** - Shows a list of clients for a selected date
2. **Client Inventory Details Page** - Shows and allows editing of inventory data for one client

When you click on a client name in the listing page, you go to the details page for that client.

---

## How State is Managed

The application uses two places to store data:

1. **Redux Store** - Stores data that needs to be shared between pages
   - The selected date is stored here
   - Client listing data is stored here
   - Client inventory data is stored here
   - The date is saved to browser storage so it stays even after you refresh the page

2. **Local Storage** - Stores draft edits that you haven't submitted yet
   - Only stores drafts for the current client and date
   - Gets cleared when you submit the form
   - Gets cleared when you change the date

---

## Client Listing Page Flow

**File:** `src/pages/kam/ClientListing.tsx`

### What Happens When the Page Loads

1. **Get the selected date from Redux**
   - The page reads the date from Redux store
   - If no date exists, it uses today's date
   - The date is shown in a date input field at the top

2. **Check if date came from navigation**
   - If you came from another page with a date in the URL state, it updates Redux with that date
   - This keeps the date consistent when navigating between pages

3. **Fetch client list from the API**
   - Calls the API: `/billing/getInventoryClientPlan`
   - Sends the selected date, page number, and how many items to show
   - Shows a loading message while waiting

4. **Display the results**
   - Shows client names in a table
   - Shows statistics: total clients, completed, pending
   - Shows a progress bar for completion status
   - Each client name is a clickable link

### What Happens When You Change the Date

1. **User selects a new date in the date input**
   - The `onChange` function runs
   - It updates Redux with the new date using `dispatch(setSelectedDate(date))`
   - The date is saved to browser storage automatically

2. **The page automatically fetches new data**
   - Because the date changed, the `fetchData` function runs again
   - It calls the API with the new date
   - The table updates with clients for that date

### What Happens When You Click a Client Name

1. **Navigation happens**
   - The page navigates to `/kam/clients/{clientId}/{date}`
   - The date is included directly in the URL path
   - It passes the client name in the navigation state:
     - `clientName` - The name of the client

2. **The details page receives this information**
   - The details page reads the date directly from the URL parameter
   - The date is always in the URL, so it's always correct
   - If somehow the date is missing from URL, it defaults to today

### Code Structure

```typescript
// Get date from Redux
const selectedDate = useSelector((state: RootState) => state.kam.selectedDate);

// Update Redux if date came from navigation
useEffect(() => {
  if (dateFromNavigation && dateFromNavigation !== selectedDate) {
    dispatch(setSelectedDate(dateFromNavigation));
  }
}, [dateFromNavigation, selectedDate, dispatch]);

// Fetch data when date or page changes
const fetchData = useCallback(async () => {
  dispatch(setClientListingLoading(true));
  const response = await KamApiService.getInventoryClientPlan({
    startDate: selectedDate,
    page: pageNumber,
    limit: itemsPerPage,
  });
  dispatch(setClientListing(response));
}, [selectedDate, pageNumber, itemsPerPage]);

// Navigate to details page with date in URL
onClick={() =>
  navigate(`/kam/clients/${row.clientId}/${selectedDate}`, {
    state: { clientName: row.clientName },
  })
}
```

---

## Client Inventory Details Page Flow

**File:** `src/pages/kam/ClientInventoryDetails.tsx`

### What Happens When the Page Loads

1. **Get the client ID and date from the URL**
   - The URL looks like `/kam/clients/53/2025-12-15`
   - The number `53` is the client ID
   - The date `2025-12-15` is the selected date

2. **Use the date from URL**
   - The date comes directly from the URL parameter
   - This is the source of truth - no need to check Redux or navigation state
   - If somehow the date is missing from URL, it defaults to today's date

4. **Clear old drafts from local storage**
   - Looks for any saved drafts for this client that are NOT for the current date
   - Deletes those old drafts
   - This prevents showing data from the wrong date

5. **Load draft from local storage**
   - Creates a storage key: `kam_client_inventory_draft_{clientId}_{selectedDate}`
   - If a draft exists for this client and date, loads it
   - Shows your previous edits in the input fields
   - If no draft exists, shows empty fields

6. **Fetch inventory data from API**
   - Calls the API: `/billing/getEverydayClientInventory`
   - Sends the client ID and the selected date
   - Gets back a list of container types with their inventory values
   - Shows a loading message while waiting

7. **Display the data**
   - Shows a table with container types
   - Each row has input fields for: Opening Stock, Dispatch, Returned, Closing
   - Closing is calculated automatically and cannot be edited
   - If you had a draft, your edits are shown instead of API data

### What Happens When You Type in an Input Field

1. **User types a number in any field**
   - The `handleInputChange` function runs
   - It updates the `editedData` state with the new value

2. **Calculate closing stock**
   - Formula: `Closing = Opening Stock + Returned - Dispatch`
   - If the result is negative, it becomes 0
   - The closing field updates automatically

3. **Save to local storage**
   - Saves the entire `editedData` object to local storage
   - Uses the key: `kam_client_inventory_draft_{clientId}_{selectedDate}`
   - This saves your work so you don't lose it if you refresh the page

4. **Update the display**
   - The input field shows your new value
   - The closing field updates automatically

### What Happens When You Click Submit

1. **Prepare the data**
   - Takes the original data from the API
   - Merges it with your edits from `editedData`
   - Converts everything to numbers (handles empty values as 0)
   - Formats the data for the API (uses snake_case like `opening_stock`)

2. **Send to API**
   - Calls the API: `/billing/updateEverydayClientInventory`
   - Sends an array of all container types with their updated values
   - The API updates the database

3. **Clear local storage**
   - Deletes the draft for this client and date
   - Also clears any other drafts for this client (cleanup)
   - Clears the `editedData` state

4. **Show success message**
   - Shows a green success message
   - After 1.5 seconds, navigates back to the client listing page
   - The listing page will show updated data

### What Happens When Date Changes

If the date changes (from URL parameter):

1. **Clear old data**
   - Clears the Redux inventory data
   - This prevents showing stale data from the previous date

2. **Clear old drafts**
   - Removes any drafts for this client that are NOT for the new date
   - Loads draft for the new date if it exists

3. **Fetch new data**
   - Calls the API with the new date
   - Updates the table with data for the new date

### What Happens When You Navigate Away

When you leave the inventory details page (by clicking back or navigating to another page):

1. **Clear localStorage drafts**
   - All drafts for this client are cleared automatically when the component unmounts
   - This prevents stale data from showing when you come back with a different date
   - The cleanup happens in the `useEffect` cleanup function

2. **Fresh start on return**
   - When you come back to the same or different date, you start with fresh data from the API
   - No old drafts interfere with the new date's data

### What Happens When You Navigate Away

When you leave the inventory details page (by clicking back or navigating to another page):

1. **Clear localStorage drafts**
   - All drafts for this client are cleared automatically
   - This prevents stale data from showing when you come back with a different date
   - The cleanup happens when the component unmounts

2. **Fresh start on return**
   - When you come back to the same or different date, you start with fresh data from the API
   - No old drafts interfere with the new date's data

### Code Structure

```typescript
// Get date from URL parameter - this is the source of truth
const { clientId, date } = useParams<{ clientId: string; date: string }>();
const selectedDate = date || new Date().toISOString().split('T')[0];

// Storage key includes date to prevent cross-date contamination
const STORAGE_KEY = `kam_client_inventory_draft_${clientId}_${selectedDate}`;

// Clear old drafts when date changes
useEffect(() => {
  // Remove drafts for other dates
  // Load draft for current date
}, [clientId, selectedDate]);

// Fetch data when date changes
const fetchData = useCallback(async () => {
  const response = await KamApiService.getEverydayClientInventory({
    client_id: Number(clientId),
    start_date: selectedDate,
    end_date: selectedDate,
  });
  dispatch(setClientInventory(response.data));
}, [clientId, selectedDate]);

// Save edits to local storage
const handleInputChange = (id, field, value) => {
  // Calculate closing
  // Update editedData state
  // Save to local storage
};

// Submit form
const handleSubmit = async () => {
  // Prepare payload
  // Send to API
  // Clear local storage
  // Navigate back
};
```

---

## Redux Store Structure

**File:** `src/store/slices/kamSlice.ts`

The Redux store for KAM has these parts:

1. **selectedDate** - The currently selected date (persisted to browser storage)
2. **clientListing** - Data for the client listing page
   - `data` - Array of clients
   - `stats` - Statistics (total, pending, completed)
   - `pagination` - Page information
   - `loading` - Whether data is being fetched
3. **clientInventory** - Data for the inventory details page
   - `data` - Array of container types with inventory values
   - `loading` - Whether data is being fetched

### How Redux Persistence Works

The `selectedDate` is saved to browser storage automatically. This means:
- If you select December 15th and refresh the page, it still shows December 15th
- If you close the browser and come back, the date is still there
- The date is shared between the listing page and details page

**File:** `src/store/index.ts`

```typescript
// Redux persist configuration for KAM
const kamPersistConfig = {
  key: 'kam',
  storage,
  whitelist: ['selectedDate'], // Only save the date
};
```

---

## API Endpoints Used

**File:** `src/services/kamApi.ts`

### 1. Get Client Listing
- **Endpoint:** `GET /billing/getInventoryClientPlan`
- **Parameters:**
  - `startDate` - The date to get clients for
  - `endDate` - Same as startDate (single day)
  - `page` - Page number
  - `limit` - Items per page
- **Returns:** List of clients with statistics

### 2. Get Client Inventory
- **Endpoint:** `GET /billing/getEverydayClientInventory`
- **Parameters:**
  - `client_id` - The client ID
  - `start_date` - The date
  - `end_date` - Same as start_date (single day)
- **Returns:** List of container types with inventory values

### 3. Update Client Inventory
- **Endpoint:** `PUT /billing/updateEverydayClientInventory`
- **Body:** 
  ```json
  {
    "clients": [
      {
        "id": 123,
        "client_id": 53,
        "container_type_id": 54,
        "opening_stock": 0,
        "dispatch": 0,
        "returned": 10,
        "closing": 10
      }
    ]
  }
  ```
- **Returns:** Success or error message

---

## Common Issues and Solutions

### Issue: Clicking on a date shows data from a different date

**Cause:** The date in the URL doesn't match what you clicked.

**Solution:** 
- The date is now always in the URL path: `/kam/clients/{clientId}/{date}`
- The details page reads the date directly from the URL
- This ensures the date is always correct and matches what you clicked

### Issue: Edits are saved to the wrong date

**Cause:** The local storage key didn't include the date, so drafts from different dates overwrote each other.

**Solution:**
- The storage key now includes the date: `kam_client_inventory_draft_{clientId}_{selectedDate}`
- Old drafts for different dates are cleared when the page loads
- Each date has its own separate draft

### Issue: After submitting, old data still shows

**Cause:** Redux data wasn't cleared when the date changed.

**Solution:**
- The code now clears Redux inventory data when the date changes
- This forces a fresh fetch from the API

---

## Summary

1. **Date Management:**
   - Date is stored in Redux (for listing page) and persisted to browser storage
   - When navigating to details page, date is included in the URL: `/kam/clients/{clientId}/{date}`
   - Details page reads date directly from URL parameter (source of truth)

2. **Data Flow:**
   - Listing page fetches clients for the selected date
   - Clicking a client navigates with the date in state
   - Details page uses that date to fetch inventory data
   - Edits are saved to local storage with date in the key

3. **Draft Management:**
   - Drafts are saved per client and per date
   - Old drafts for different dates are cleared automatically
   - Drafts are cleared when you submit the form

4. **State Management:**
   - Redux stores shared data (date, listing, inventory)
   - Local storage stores unsaved drafts
   - Both are cleared appropriately to prevent stale data

