Got it. You want **one single Markdown file** — fully self-contained — that Cursor can read as a complete product + design + API spec, with **no missing context**.
It should include:
✅ UX + layout + interaction details
✅ Design principles
✅ Component usage rules
✅ Full API + authentication flow
✅ Payload structures
✅ Acceptance criteria
✅ Bonus summary section

Here’s the final version — **ready to drop directly into your Cursor repo** as `CreateMasterPlan.md`.
Everything Cursor needs is here, no external references required.

---

````md
# 🚛 Create Master Plan – Complete Design, UX & API Specification

## 🎯 Objective
Build a modern, structured **Create Master Plan** page that enables users to easily add multiple **Dispatch** and **Pickup** transits with guided inputs, smart defaults, and authenticated API calls.  
This page replaces the existing master plan creation flow with a cleaner and scalable card-based layout.

---

## 🧱 Layout Structure

### 1. **Header**
- Title: `Create new Master Plan` with a green circle step indicator (like `1`)
- Subheading: `Transit Operations Form` — bold, black text
- Section divider below header

---

### 2. **Top Shared Inputs**
| Field | API | Description |
|--------|-----|-------------|
| **Washing Facility** | `api/locations/getLocations?location_type=2` | Dropdown showing all washing facilities. |
| **Client** | `api/inventory/getClientByCity` | Dropdown to select client by city. |

> These fields appear side-by-side in a two-column grid.  
> Use existing shared dropdown components (`FloatingDropdown`, `Dropdown`).  
> If they don’t exist, create them with standard InfinityBox styles.

---

## 🚦 Core Sections: Dispatch & Pickup

Two collapsible card-based sections:
- 🟩 **Dispatch**
- 🟥 **Pickup**

Each section begins with **one default card** and includes a **“+ Add Another”** button to append more.

---

### 🧩 Section Header
- Label chip: 🟩 “Dispatch” or 🟥 “Pickup”
- Right-aligned “+ Add Another” button (uses shared `Button` component)
- Section divider line below header

---

### 🗂 Card Layout (for each Transit Entry)
Each card uses the common layout container.  
If a shared `Card` component exists → use it.  
Otherwise, create one:

```tsx
<div className="shadow-sm rounded-lg bg-white p-4 border border-gray-200">
  {children}
</div>
````

#### Card Fields:

| Field            | Type         | Behavior                                                               |
| ---------------- | ------------ | ---------------------------------------------------------------------- |
| **Date**         | Date Picker  | Defaults to current date                                               |
| **Time**         | Custom Input | `[HH] : [MM]` auto-colon + AM/PM toggle chips                          |
| **Vehicle Type** | Dropdown     | Populated via `api/vehicle/getVehicles` (`driver_name → vehicle_name`) |
| **Remove (-)**   | Icon Button  | Deletes the current card                                               |

#### Example:

```
-----------------------------------------
| [🟩 Dispatch 1]                [–]     |
| Date: [ 2025-10-21 ]                  |
| Time: [ 06 ] : [ 30 ] [ AM ☐ PM ☑ ]  |
| Vehicle Type: [ Srinivas → Ace ] ⬇️   |
-----------------------------------------
```

#### Time Input Rules

* User types two digits → colon auto-inserts (`06:`)
* Cursor moves automatically to minute input
* AM/PM toggled via chips or click
* Optional helper component: `TimeInput.tsx`
  with internal state `{ hour, minute, period }`

---

### 🧩 Vehicle Type Dropdown

**API:** `api/vehicle/getVehicles`

Each option format:

```
driver_name → vehicle_name
```

Example:

```
Ramesh → Mahindra Pickup
Srinivas → Ace
```

---

## ✅ Summary Preview (Bonus Feature)

Once the user adds at least one Dispatch and one Pickup:
Show a summary card at the bottom with a soft fade-in.

**Example:**

```
You’re creating:
🟩 3 Dispatch transits  
🟥 2 Pickup transits  
For: Mumbai – Bhandup Facility
```

* Uses light background (`bg-green-50 rounded-md p-3 shadow-sm`)
* Appears above the Submit button
* Animated with Framer Motion or Tailwind transitions

---

## 🔘 Submit Button

Large, green button labeled **Submit**.
Should be disabled until:

* Facility and Client selected
* At least one card in both Dispatch & Pickup sections
* All required fields valid

On click → validate, then send payload to backend.

---

## 🧠 Data Model & Submission

Two independent arrays:

```js
dispatchTransits = [{ date, time, period, vehicleType }]
pickupTransits   = [{ date, time, period, vehicleType }]
```

### Final JSON Payload

```json
{
  "facility_id": "selected_facility_id",
  "client_id": "selected_client_id",
  "dispatch": [
    { "date": "2025-10-21", "time": "06:30 AM", "vehicle_type": "Ace" }
  ],
  "pickup": [
    { "date": "2025-10-21", "time": "09:00 PM", "vehicle_type": "Mahindra" }
  ]
}
```

---

## 🔒 Authentication and API Integration

### 1️⃣ Authentication

**Endpoint:**
`auth_access`
**Method:** `POST`

**Request:**

```json
{
  "username": "ch-mumbai",
  "password": "password"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

Store the token and include it in headers:

```
Authorization: Bearer <token>
```

---

### 2️⃣ APIs and Usage

| Purpose                   | Method | Endpoint                                     | Auth | Notes                               |
| ------------------------- | ------ | -------------------------------------------- | ---- | ----------------------------------- |
| Washing Facility Dropdown | GET    | `api/locations/getLocations?location_type=2` | ✅    | Populate facility list              |
| Client Dropdown           | GET    | `api/inventory/getClientByCity`              | ✅    | Populate client list                |
| Transit Type              | GET    | `api/transit-plan/get-transit-types`         | ✅    | Used internally for type validation |
| Vehicle Type              | GET    | `api/vehicle/getVehicles`                    | ✅    | Populate vehicle dropdown           |
| Submit Plan               | POST   | `api/plan/createMasterPlan` *(or relevant)*  | ✅    | Submit JSON payload                 |

> All APIs require the `Authorization` header.
> Handle loading + error states gracefully with toasts or small inline messages.

---

## 🧩 Component Responsibilities

| Component              | Purpose                                    |
| ---------------------- | ------------------------------------------ |
| `CreateMasterPlan.tsx` | Main page component; manages both sections |
| `Card.tsx`             | Common wrapper for each transit entry      |
| `TimeInput.tsx`        | Hour/minute/AM-PM logic handler            |
| `Dropdown.tsx`         | Shared dropdown (reuse existing)           |
| `Button.tsx`           | Shared button (for Submit / Add Another)   |

---

## 💡 Design Principles

1. **Readability First**
   Each card clearly isolates one record for quick scanning.

2. **Progressive Disclosure**
   Start simple, expand as user adds more cards.

3. **Guided Interaction**
   Auto-insert colon, default date, pre-validated dropdowns.

4. **Consistency**
   Follow InfinityBox dashboard spacing, border radius, typography, and green accent color.

5. **Compact but Friendly**
   Maintain clean margins and light shadows; no heavy borders.

6. **Error Feedback**
   Red borders + helper text below invalid fields.

7. **Responsive Grid**
   Two columns on desktop → one column on mobile.

8. **Visual Hierarchy**
   Section headers distinct, cards slightly elevated.

9. **Scalability**
   Should handle up to 10 transits per section gracefully.

10. **Performance**
    Lazy-render new cards only when added to keep React light.

---

## ✅ Acceptance Criteria

* [x] Uses **card layout** per entry (Dispatch & Pickup)
* [x] Allows dynamic add/remove for each section
* [x] Facility, Client, Vehicle dropdowns fetched via APIs
* [x] Auth handled via `auth_access` with `ch-mumbai`
* [x] Time input supports auto-colon + AM/PM toggle
* [x] Responsive and stylistically consistent with InfinityBox
* [x] Summary preview card appears automatically when both sections have entries
* [x] Form submission compiles JSON exactly as specified
* [x] Error states shown visually with inline messages
* [x] Smooth UI transitions on card add/remove

---

## 🧩 Implementation Notes

* Maintain two arrays in component state:
  `dispatchTransits[]` and `pickupTransits[]`
* On `+ Add Another` → append default object `{ date: today, time: '', vehicleType: '' }`
* On remove → filter by index
* On submit → combine arrays into single payload
* Use token from `auth_access` in all GET/POST requests
* Add loading skeletons for dropdown fetches

---

## 🧭 Visual Style Guide

| Element       | Style                                      |
| ------------- | ------------------------------------------ |
| Background    | `#FFFFFF`                                  |
| Border radius | `0.5rem` (rounded-md)                      |
| Shadow        | `shadow-sm` or `shadow-md` on hover        |
| Primary color | `#16A34A` (green-600)                      |
| Error color   | `#DC2626` (red-600)                        |
| Font          | Inter / Sans-serif                         |
| Spacing       | `gap-4` between fields, `p-4` inside cards |

---

## 📁 Deliverables

| File                   | Description                         |
| ---------------------- | ----------------------------------- |
| `CreateMasterPlan.tsx` | Main UI + API logic                 |
| `TimeInput.tsx`        | Handles hour/minute + AM/PM logic   |
| `Card.tsx`             | Shared container wrapper            |
| `Button.tsx`           | Shared styled button                |
| `Dropdown.tsx`         | Shared dropdown                     |
| `CreateMasterPlan.md`  | (this file) complete reference spec |

---

## ✅ Final Reminder

> Keep the experience **minimal, structured, and visually clean.**
> The user should be able to:
>
> * Choose facility & client
> * Add multiple dispatch/pickup transits quickly
> * Review summary before submitting
> * Submit with confidence and no clutter.

Use Tailwind, existing shared components, and the InfinityBox dashboard aesthetic throughout.

```

---

This file is **ready to drop into Cursor** — it includes design, logic, API, authentication, acceptance criteria, component architecture, and visual principles in one place.  

Would you like me to generate a **corresponding payload validation schema (Joi or Zod)** section next, so Cursor can automatically validate before submission?
```
