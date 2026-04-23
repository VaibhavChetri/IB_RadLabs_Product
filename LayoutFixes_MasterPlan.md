# 🧩 Master Plan Page – Layout Fix Instructions

This document describes the **visual and structural layout issues** observed on the new Master Plan page (Dispatch / Pickup sections), along with **specific fixes Cursor must apply** in the front-end code.

---

## 🎯 Objective
Fix the layout alignment, overflow, and spacing issues across `Dispatch` and `Pickup` sections, especially around the table, dropdowns, and section cards.

---

## 🧠 Observed Issues

### 1️⃣ Table Overflowing the Card
**Symptoms:**
- Table headers and rows are extending beyond the card's rounded corners.
- The shadow and border radius of the parent card are visually broken.

**Root Cause:**
`table` has `width: 100%` inside a flex container with no overflow clipping.

**Fix:**
```tsx
<div className="overflow-x-auto rounded-lg border border-gray-200">
  <table className="min-w-full text-sm text-gray-700">
    ...
  </table>
</div>
```

> This ensures the table stays inside the card with consistent padding and border radius.

---

### 2️⃣ Dropdown Overlapping Other Sections

**Symptoms:**

* The "Vehicle Type" dropdown opens over the next section (`Pickup`).
* Dropdown options are visible outside the card boundaries.

**Root Cause:**
The dropdown is likely rendered absolutely with no `relative` parent or proper z-index isolation.

**Fix:**

* Add `relative` to the card container.
* Ensure dropdown uses `absolute` positioning **within that parent**.
* Set z-index layers:

| Element                           | Z-index |
| --------------------------------- | ------- |
| Dropdown                          | `z-50`  |
| Card container                    | `z-10`  |
| Section headers (Dispatch/Pickup) | `z-20`  |

If the dropdown component supports a `portalTarget` prop, pass a **local container ref** instead of mounting globally.

---

### 3️⃣ Inconsistent Section Padding

**Symptoms:**

* The `Dispatch` and `Pickup` cards have uneven top and bottom spacing.
* The label chips appear detached from their content.

**Fix:**
Ensure consistent padding structure:

```tsx
<section className="bg-white rounded-lg shadow-sm p-4 mb-6 relative">
  <div className="flex items-center justify-between mb-3">
    <Chip color="green">Dispatch</Chip>
    <Button variant="outline" icon="+">Add</Button>
  </div>
  <div className="overflow-x-auto rounded-md border border-gray-200">
    ...
  </div>
</section>
```

> Use `p-4` for consistent padding inside each section and `mb-6` spacing between sections.

---

### 4️⃣ Misaligned Chips and Buttons

**Symptoms:**

* "Dispatch" and "Pickup" chips are not vertically aligned with their respective "+ Add" buttons.

**Fix:**
Wrap header area in a flex container:

```tsx
<div className="flex items-center justify-between mb-3">
  <Chip color="green">Dispatch</Chip>
  <Button variant="outline" icon="+">Add</Button>
</div>
```

---

### 5️⃣ Table and Content Alignment

**Symptoms:**

* The text inside rows is vertically cramped.
* Columns for "Time" and "Vehicle Type" are not aligned evenly across sections.

**Fix:**
Apply consistent column widths and vertical centering:

```tsx
<table className="min-w-full text-sm text-gray-700">
  <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
    <tr>
      <th className="px-3 py-2 w-[80px] text-left">Sl. No</th>
      <th className="px-3 py-2 w-[100px]">Actions</th>
      <th className="px-3 py-2 w-[150px]">Date</th>
      <th className="px-3 py-2 w-[200px]">Time</th>
      <th className="px-3 py-2 w-[250px]">Vehicle Type</th>
    </tr>
  </thead>
  ...
</table>
```

---

## 🎨 Visual Hierarchy Rules

| Element       | Background                                                                 | Border Radius  | Shadow      | Spacing           |
| ------------- | -------------------------------------------------------------------------- | -------------- | ----------- | ----------------- |
| Card          | `bg-white`                                                                 | `rounded-lg`   | `shadow-sm` | `p-4`             |
| Header Row    | `flex justify-between items-center`                                        | none           | none        | `mb-3`            |
| Table Wrapper | `border border-gray-200 rounded-md`                                        | yes            | none        | `overflow-x-auto` |
| Add Button    | `rounded-md border border-green-400 text-green-600 hover:bg-green-50`      | small          | subtle      | small padding     |
| Chip          | Dispatch: `bg-green-50 text-green-600`; Pickup: `bg-blue-50 text-blue-600` | `rounded-full` | none        | `px-3 py-1`       |

---

## 🧭 Behavioral Rules

1. **Dropdown z-index Context**

   * Dropdown menus must not escape their card's bounds.
   * Each section (`Dispatch`, `Pickup`) creates its own stacking context with `relative` and `z-10`.

2. **Add / Remove Row Animation**

   * Add row → fade-in + slight upward motion.
   * Remove row → fade-out + collapse (use Framer Motion or Tailwind `transition-all`).

3. **Uniform Table Columns**

   * Align headers and body columns with fixed width classes.

4. **Mobile Responsiveness**

   * Each section should collapse into a scrollable table on smaller screens.
   * `overflow-x-auto` ensures horizontal scroll without breaking layout.

---

## ✅ Acceptance Criteria (for Layout Fix)

* [x] Tables no longer overflow card boundaries.
* [x] Dropdown menus appear **inside** their respective cards only.
* [x] Chips and buttons are aligned horizontally.
* [x] Section padding (`p-4`) consistent across Dispatch & Pickup.
* [x] Table rows have equal column widths and vertical alignment.
* [x] Overflow, border-radius, and shadows appear visually contained.
* [x] Dropdown z-index no longer overlaps with next section.
* [x] Layout adapts cleanly on mobile.

---

## 📐 Implementation Tips

* Apply `overflow-hidden` and `rounded-md` at card level to maintain contained corners.
* Always ensure each section container (`Dispatch`, `Pickup`) is `relative` — it helps isolate z-index context.
* Use Tailwind utilities consistently — avoid inline CSS.
* Test dropdown expansion at multiple viewport widths.

---

## 🧠 Design Philosophy

* **Contain everything visually** → no element should "bleed" outside its logical card.
* **Align through intention** → consistent gaps, equal paddings, fixed column widths.
* **Z-index hierarchy clarity** → dropdowns, headers, and modals never interfere.
* **Readability over density** → compact but breathable layout spacing.

---

> 💡 *After implementing, visually verify that opening any dropdown doesn't overlap the next section, and each card's rounded border remains intact.*
