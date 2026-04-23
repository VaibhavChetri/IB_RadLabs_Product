# Lusha Integration - Frontend Implementation Guide

This document details the backend APIs and step-by-step instructions for building the Lusha Prospecting UI.

**CRITICAL INSTRUCTION**: Implement this validation logic step-by-step. **After completing each step, PAUSE and ask the user to verify the output on the screen.** Do not proceed to the next step until the current one is confirmed working.

---

## 0. Design & UX Guidelines
**Goal**: Create a stunning, intuitive, and user-friendly interface.
*   **Repo Consistency**: Before coding, **analyze existing components** in the repository to understand the design system (colors, spacing, typography, shadow effects) and match it perfectly. The new UI must look like it belongs.
*   **Intuitiveness**: The filter mechanism (sidebar or top bar) must be easy to use. Group filters logically. The data table should clearly distinguish between 'revealed' and 'locked' contacts using visual cues (icons, badges).
*   **Feedback**: Use clear loading skeletons/spinners for search and reveal actions. Show success toasts when data is revealed.

---

## 1. API Reference

### A. Get Contact Filters
Fetches metadata for dropdowns (Departments, Seniority, etc.).
*   **Endpoint**: `GET /api/lusha/filters/contacts`
*   **Response Structure**:
    ```json
    {
      "status": "Success",
      "data": {
        "departments": { "data": ["Engineering", "Sales", ...] },
        "seniority": { "data": [{ "id": 1, "name": "C-Level" }, ...] }
      }
    }
    ```

### B. Get Company Filters
Fetches metadata for company-related filters.
*   **Endpoint**: `GET /api/lusha/filters/companies`
*   **Response Structure**:
    ```json
    {
      "status": "Success",
      "data": {
        "industries": { "data": { "main_industry": "...", "sub_industries": [...] } },
        "sizes": { "data": [{ "min": 1, "max": 10 }, ...] },
        "sic": { "data": ["1011", "7372", ...] },
        "naics": { "data": ["11", "541511", ...] }
      }
    }
    ```

### C. Search Locations (Autocomplete)
Fetches location suggestions based on text input.
*   **Endpoint**: `GET /api/lusha/filters/locations?text=New&type=contact`
*   **Query Params**:
    *   `text` (Required): Search query (e.g. "San Fran")
    *   `type` (Optional): 'contact' (default) or 'company'
*   **Response**:
    ```json
    {
      "status": "Success",
      "data": [
         { "country": "United States", "state": "California", "city": "San Francisco", ... }
      ]
    }
    ```

### D. Search Company Names (Autocomplete)
Fetches company name suggestions.
*   **Endpoint**: `GET /api/lusha/filters/companies/names?text=App`
*   **Response**: `["Apple", "AppLovin", ...]`

### E. Search Technologies (Autocomplete)
Fetches technology suggestions.
*   **Endpoint**: `GET /api/lusha/filters/companies/technologies?text=Sales`
*   **Response**: `["Salesforce", "Salesloft", ...]`

### F. Search Leads
Performs the contact search.
*   **Endpoint**: `POST /api/lusha/search`
*   **Request Body**:
    ```json
    {
      "filters": {
        "contacts": {
          "include": {
            "departments": ["Engineering"],           // Selected from Filter API
            "seniority": ["C-Level"],                 // Selected from Filter API
            "jobTitles": ["CTO"]                      // Free text input
          }
        },
        "companies": {
          "include": {
            "industries": ["Information Technology"]  // Selected from Filter API
          }
        }
      },
      "pages": { "page": 1, "size": 20 }
    }
    ```
*   **Response**:
    ```json
    {
      "leadId": 123,
      "totalResults": 500,
      "data": [
        {
           "contactId": "xyz-123",
           "name": "Jane Doe",
           "companyName": "Tech Corp",
           "jobTitle": "CTO",
           "emailAddresses": [], // Empty if not revealed
           "phoneNumbers": []    // Empty if not revealed
        }
      ]
    }
    ```

### D. Reveal Contact
Reveals the email and/or phone number for a specific contact. This costs credits.
*   **Endpoint**: `POST /api/lusha/reveal`
*   **Request Body**:
    ```json
    {
      "contactId": "xyz-123",
      "revealType": "email" // Optional: 'email', 'phone' or omit for both
    }
    ```
*   **Response**:
    ```json
    {
      "alreadyRevealed": false,
      "email": "jane@techcorp.com",
      "phone": "+15550199",
      "revealedAt": "2024-01-01T12:00:00Z"
    }
    ```

---

## 2. Implementation Steps

Follow these steps sequentially. **Verify each step before moving on.**

### Step 1: Filter Component (Sidebar/Modal)
1.  **Action**: Create a `LushaFilter` component.
2.  **Logic**:
    *   On mount, call `GET /api/lusha/filters/contacts` and `GET /api/lusha/filters/companies`.
    *   Store the results in state (e.g., `filterOptions`).
    *   Render dropdowns/multi-selects for:
        *   **Departments** (Array of strings)
        *   **Seniority** (Array of objects -> Use `name` for display)
        *   **Industry** (Nested object -> Flatten or use Main Industry for MVP)
        *   **Location** (**Async Autocomplete**):
            *   Do NOT load all locations.
            *   Use an "Async Select" component (like `react-select/async`).
            *   On typing, call `GET /api/lusha/filters/locations?text=...`.
        *   **Company Name** (**Async Autocomplete**):
            *   Use `GET /api/lusha/filters/companies/names?text=...`.
        *   **Technologies** (**Async Autocomplete**):
            *   Use `GET /api/lusha/filters/companies/technologies?text=...`.
3.  **UI**: Simple form with "Apply Filters" button.
4.  **Verification**:
    *   *Check*: Do the dropdowns populate with data from the API?
    *   **STOP & VERIFY**.

### Step 2: Search Logic & integration
1.  **Action**: Create the `SearchLeads` function/hook.
2.  **Logic**:
    *   Collect selected values from the `LushaFilter` component.
    *   Construct the JSON body matching the **Search Leads** format above (`filters.contacts.include...`).
    *   Call `POST /api/lusha/search`.
    *   Store `totalResults` and `data` (results array) in state.
3.  **Verification**:
    *   *Check*: Select "Engineering" and click Search. Check Network tab payload. Is the response 200 OK?
    *   **STOP & VERIFY**.

### Step 3: Results Table
1.  **Action**: Create `ResultsTable` component.
2.  **Columns**:
    *   **Name** (`name`)
    *   **Title** (`jobTitle`)
    *   **Company** (`companyName`)
    *   **Location** (`location`)
    *   **Contact Info** (Special Column)
3.  **Logic for Contact Info**:
    *   If `emailAddresses` or `phoneNumbers` array has data in the search response, display it.
    *   **ELSE**, display a **"Reveal Details"** button.
4.  **Verification**:
    *   *Check*: Does the table render the search results correctly? Do unrevealed contacts show the "Reveal" button?
    *   **STOP & VERIFY**.

### Step 4: Reveal Action
1.  **Action**: Implement the "Reveal Details" button click handler.
2.  **Logic**:
    *   Call `POST /api/lusha/reveal` with the `contactId`.
    *   **On Success**:
        *   Update the specific row in the local `results` state with the returned `email` and `phone`.
        *   **OR** (Simpler/Robuster): Re-fetch the current page of search results (Call Search API again). The backend is smart enough to return the revealed data this time.
    *   Replace the "Reveal" button with the actual email/phone.
3.  **Verification**:
    *   *Check*: Click Reveal on a row. Does it show a loading state? Does the email/phone appear after completion?
    *   **STOP & VERIFY**.
