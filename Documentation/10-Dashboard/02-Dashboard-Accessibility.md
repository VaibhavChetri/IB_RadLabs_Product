# Dashboard Accessibility Guide

## Overview

This document explains the accessibility (a11y) features implemented in the Dashboard feature. All Dashboard components follow WCAG 2.1 Level AA standards for accessibility.

---

## Table of Contents

1. [ARIA Labels & Semantics](#aria-labels--semantics)
2. [Keyboard Navigation](#keyboard-navigation)
3. [Screen Reader Support](#screen-reader-support)
4. [Focus Management](#focus-management)
5. [Implementation Examples](#implementation-examples)

---

## ARIA Labels & Semantics

### DashboardChart Component

**Location:** `src/features/dashboard/components/DashboardChart.tsx`

The chart component uses semantic HTML and ARIA attributes to describe its purpose and content to assistive technologies.

#### Key Features:

1. **Region Role**
   ```tsx
   <Card role='region' aria-label='SKU Count Trend Chart'>
   ```
   - Marks the chart as a distinct content area
   - Provides a descriptive label for screen readers

2. **Chart Title**
   ```tsx
   <h3 id='chart-title'>SKU Count Trend</h3>
   ```
   - Uses semantic `<h3>` heading
   - Has `id` attribute for reference

3. **Image Role with Descriptions**
   ```tsx
   <div
     role='img'
     aria-labelledby='chart-title'
     aria-describedby='chart-description'
   >
   ```
   - Uses `role='img'` to indicate the chart is an image/graphic
   - Links to title and description for context

4. **Screen Reader Description**
   ```tsx
   <div id='chart-description' className='sr-only'>
     {`Chart showing SKU count trend for ${filter}...`}
   </div>
   ```
   - Provides detailed context about the chart
   - Hidden visually but accessible to screen readers
   - Updates dynamically based on filter selection

#### Why This Matters:

- Screen readers announce the chart as a distinct content region
- Users understand what the chart represents before navigating through it
- Descriptive text explains axes, data range, and filter context

---

### DashboardStats Component

**Location:** `src/features/dashboard/components/DashboardStats.tsx`

Stat cards are structured as accessible articles with clear labels.

#### Key Features:

1. **Container Region**
   ```tsx
   <div
     role='region'
     aria-label='Dashboard statistics'
   >
   ```
   - Groups all stat cards as a cohesive section

2. **Individual Stat Cards**
   ```tsx
   <div
     role='article'
     aria-label={`${stat.title}: ${stat.value} ${stat.suffix}`}
     tabIndex={0}
   >
   ```
   - Each card is a semantic article
   - ARIA label includes title, value, and unit
   - Keyboard accessible with `tabIndex={0}`

3. **Focus Indicators**
   ```tsx
   className='... focus-within:ring-2 focus-within:ring-primary'
   ```
   - Visible focus ring when navigating with keyboard
   - High contrast for visibility

#### Why This Matters:

- Screen readers can navigate stat cards individually
- Each stat announces its complete value (e.g., "Total Container Units: 1000 units")
- Keyboard users can focus and explore each card

---

## Keyboard Navigation

### Stat Cards

**How it works:**

1. **Tab Navigation**
   - Each stat card is focusable with `tabIndex={0}`
   - Users can tab through stat cards sequentially
   - Focus ring provides visual feedback

2. **Screen Reader Announcements**
   - When a card receives focus, screen reader announces:
     - Card title
     - Value
     - Unit/suffix

**Example Flow:**
```
User presses Tab
→ Focus moves to "Total Container Units: 1000 units"
→ Screen reader announces: "Total Container Units: 1000 units"
→ Focus ring appears around the card
```

### Chart Filter Dropdown

The `FloatingDropdown` component used for chart filters already includes keyboard navigation:

- **Enter/Space**: Opens/closes dropdown
- **Escape**: Closes dropdown
- **Arrow Keys**: Navigate options (handled by FloatingDropdown)
- **Tab**: Moves to next focusable element

---

## Screen Reader Support

### Chart Description

The chart includes a dynamic description that updates based on:

1. **Filter Selection**
   - "Monthly" → "Chart showing SKU count trend for the entire month"
   - "Week 1" → "Chart showing SKU count trend for Week 1"

2. **Data Context**
   - Explains X-axis (days of month)
   - Explains Y-axis (SKU count)
   - Provides data range (min to max SKUs)

3. **Empty States**
   - "No data available" when chart has no data

**Example Screen Reader Output:**
```
"SKU Count Trend Chart, region. Image. 
Chart showing SKU count trend for the entire month. 
X-axis represents days of the month, Y-axis represents SKU count. 
Data range: 100 to 500 SKUs."
```

### Stat Cards

Each stat card announces:
- **Label**: What the metric represents
- **Value**: The actual number
- **Unit**: Context (e.g., "kg", "Liters", "units")

**Example:**
```
"Total Container Units: 1000 units, article"
```

---

## Focus Management

### Visual Focus Indicators

All interactive elements have visible focus states:

```css
focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2
```

This ensures:
- High contrast focus rings
- Clear indication of focused element
- Meets WCAG 2.1 Level AA contrast requirements

### Tab Order

The logical tab order flows as:

1. Chart filter dropdown
2. First stat card (Total Container Units)
3. Second stat card (Average Container Units)
4. ... (and so on)

This matches the visual reading order (left to right, top to bottom).

---

## Implementation Examples

### Adding ARIA Labels to a New Component

```tsx
export const MyComponent = () => {
  return (
    <div
      role='region'
      aria-label='Descriptive region name'
    >
      <h2 id='section-title'>Section Title</h2>
      
      <div
        role='article'
        aria-labelledby='section-title'
        aria-describedby='section-description'
      >
        Content here...
        
        <div id='section-description' className='sr-only'>
          Detailed description for screen readers
        </div>
      </div>
    </div>
  );
};
```

### Making Components Keyboard Accessible

```tsx
export const ClickableCard = () => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role='button'
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label='Card description and action'
      className='focus:ring-2 focus:ring-primary'
    >
      Card content
    </div>
  );
};
```

---

## Accessibility Utilities

### Screen Reader Only Class

**Location:** `src/index.css`

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

**Usage:**
```tsx
<div className='sr-only'>
  Hidden text that screen readers can access
</div>
```

**When to use:**
- Additional context for screen readers
- Explanations of complex visuals
- Labels for icon-only buttons

---

## Testing Accessibility

### Manual Testing

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Verify focus indicators are visible
   - Ensure logical tab order

2. **Screen Reader Testing**
   - Use NVDA (Windows) or VoiceOver (Mac)
   - Navigate the Dashboard
   - Verify all content is announced
   - Check that descriptions are meaningful

3. **Color Contrast**
   - Use browser DevTools or aXe DevTools
   - Verify all text meets WCAG AA standards (4.5:1 ratio)

### Automated Testing

The unit tests include accessibility checks (see Testing documentation).

---

## Best Practices

1. **Always provide ARIA labels** for non-text content (charts, icons)
2. **Use semantic HTML** (`<h1>`, `<nav>`, `<article>`) when possible
3. **Test with screen readers** to verify descriptions make sense
4. **Maintain keyboard focus order** that matches visual flow
5. **Provide visible focus indicators** for all interactive elements
6. **Update descriptions dynamically** when content changes (e.g., filters)

---

## Related Documentation

- [Dashboard Overview](./00-Dashboard-Overview.md)
- [Dashboard How It Works](./01-Dashboard-How-It-Works.md)
- [Dashboard Testing Guide](./03-Dashboard-Testing.md)

