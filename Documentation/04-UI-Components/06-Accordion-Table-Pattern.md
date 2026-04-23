# Accordion Table Pattern Documentation

## Overview

The Accordion Table Pattern is a reusable UI component that displays data in a collapsible table format. It's particularly useful for showing summary information in rows with expandable details. This pattern was implemented in the Sent Inventory Listing page and can be reused across the application.

## Key Features

- **Single Accordion Behavior**: Only one row can be expanded at a time
- **Smooth Animations**: CSS transitions for expand/collapse with opacity and height changes
- **Visual Connection**: Clear visual indication that expanded content belongs to the selected row
- **Responsive Design**: Adapts to different screen sizes
- **Customizable Content**: Flexible content structure for different data types

## Component Structure

### Main Container
```tsx
<div className='divide-y divide-gray-200'>
  {/* Header */}
  <div className='px-6 py-3 border-b border-gray-200'>
    <div className='grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700'>
      <div className='col-span-1'>Sl. No</div>
      <div className='col-span-5'>Client</div>
      <div className='col-span-6'>Dispatch Date & Time</div>
    </div>
  </div>

  {/* Accordion Rows */}
  {rows.map((row, index) => (
    <AccordionRow key={row.id} row={row} />
  ))}
</div>
```

### Accordion Row Component
```tsx
<div className={`group transition-colors ${
  openAccordion === row.id ? 'border-l-4 border-l-green-500' : 'hover:bg-gray-50'
}`}>
  {/* Clickable Row Header */}
  <div className='px-6 py-4 cursor-pointer' onClick={handleToggle}>
    <div className='grid grid-cols-12 gap-4 items-center'>
      {/* Row content */}
    </div>
  </div>

  {/* Expandable Content */}
  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
    openAccordion === row.id ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
  }`}>
    {/* Accordion content */}
  </div>
</div>
```

## State Management

### Required State Variables
```tsx
const [openAccordion, setOpenAccordion] = useState<string | null>(null);
```

### Toggle Handler
```tsx
const handleToggle = (rowId: string) => {
  setOpenAccordion(openAccordion === rowId ? null : rowId);
};
```

## Styling Guidelines

### Row States
- **Default**: `hover:bg-gray-50` - Subtle hover effect
- **Active**: `border-l-4 border-l-green-500` - Green left border for active row
- **Transition**: `transition-colors` - Smooth color transitions

### Animation Properties
- **Duration**: `duration-300` - 300ms transition time
- **Easing**: `ease-in-out` - Smooth acceleration/deceleration
- **Height**: `max-h-screen` when open, `max-h-0` when closed
- **Opacity**: `opacity-100` when open, `opacity-0` when closed

### Content Layout
- **Grid System**: Use CSS Grid for consistent column alignment
- **Padding**: `px-6 py-4` for row headers, `px-6 pb-4` for content
- **Spacing**: `gap-4` between grid columns

## Implementation Example

### Basic Usage
```tsx
const AccordionTable = ({ data }) => {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  return (
    <div className='bg-white rounded-lg overflow-hidden'>
      {/* Header */}
      <div className='px-6 py-3 border-b border-gray-200'>
        <div className='grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700'>
          <div className='col-span-1'>ID</div>
          <div className='col-span-5'>Name</div>
          <div className='col-span-6'>Details</div>
        </div>
      </div>

      {/* Rows */}
      <div>
        {data.map((row, index) => (
          <div
            key={row.id}
            className={`group transition-colors ${
              openAccordion === row.id ? 'border-l-4 border-l-green-500' : 'hover:bg-gray-50'
            }`}
          >
            {/* Row Header */}
            <div
              className='px-6 py-4 cursor-pointer'
              onClick={() => setOpenAccordion(openAccordion === row.id ? null : row.id)}
            >
              <div className='grid grid-cols-12 gap-4 items-center'>
                <div className='col-span-1'>
                  <span className='text-sm font-medium text-gray-900'>{index + 1}</span>
                </div>
                <div className='col-span-5'>
                  <span className='text-sm font-medium text-gray-900'>{row.name}</span>
                </div>
                <div className='col-span-6 flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>{row.summary}</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-all duration-200 ${
                      openAccordion === row.id ? 'rotate-180' : 'rotate-0'
                    }`}
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                  </svg>
                </div>
              </div>
            </div>

            {/* Expandable Content */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                openAccordion === row.id ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className='px-6 pb-4'>
                {/* Your custom content here */}
                <div className='bg-gray-50 rounded-lg p-4'>
                  <p className='text-sm text-gray-700'>{row.details}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Content Patterns

### 1. Simple Text Content
```tsx
<div className='px-6 pb-4'>
  <div className='bg-gray-50 rounded-lg p-4'>
    <p className='text-sm text-gray-700'>{row.description}</p>
  </div>
</div>
```

### 2. Two-Column Grid Content
```tsx
<div className='px-6 pb-4'>
  <div className='grid grid-cols-2 gap-4'>
    <div className='bg-white rounded-lg border border-gray-200'>
      {/* Left column content */}
    </div>
    <div className='bg-white rounded-lg border border-gray-200'>
      {/* Right column content */}
    </div>
  </div>
</div>
```

### 3. Table-like Content
```tsx
<div className='px-6 pb-4'>
  <div className='bg-white rounded-lg border border-gray-200'>
    {row.items.map((item, index) => (
      <div
        key={index}
        className='flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors'
      >
        <span className='text-sm font-medium text-gray-900'>{item.name}</span>
        <span className='px-2 py-1 bg-green-50 text-green-700 text-sm font-semibold rounded-md'>
          {item.value}
        </span>
      </div>
    ))}
  </div>
</div>
```

## Accessibility Considerations

### Keyboard Navigation
- Add `tabIndex={0}` to clickable row headers
- Implement keyboard event handlers for Enter/Space keys
- Ensure proper focus management

### Screen Reader Support
- Use `aria-expanded` attribute on row headers
- Provide `aria-controls` to link headers with content
- Add descriptive `aria-label` for expand/collapse actions

### Example with Accessibility
```tsx
<div
  className='px-6 py-4 cursor-pointer'
  onClick={handleToggle}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  }}
  tabIndex={0}
  role='button'
  aria-expanded={openAccordion === row.id}
  aria-controls={`content-${row.id}`}
>
  {/* Row content */}
</div>

<div
  id={`content-${row.id}`}
  className={`overflow-hidden transition-all duration-300 ease-in-out ${
    openAccordion === row.id ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
  }`}
>
  {/* Accordion content */}
</div>
```

## Performance Considerations

### Large Datasets
- Implement virtual scrolling for datasets with 100+ rows
- Use `React.memo` for row components to prevent unnecessary re-renders
- Consider lazy loading for accordion content

### Animation Performance
- Use `transform` and `opacity` for smooth animations
- Avoid animating `height` properties directly
- Use `will-change` CSS property for elements being animated

## Customization Options

### Color Themes
- **Primary**: `border-l-blue-500` for blue theme
- **Success**: `border-l-green-500` for green theme
- **Warning**: `border-l-yellow-500` for yellow theme
- **Danger**: `border-l-red-500` for red theme

### Animation Speeds
- **Fast**: `duration-200` (200ms)
- **Normal**: `duration-300` (300ms)
- **Slow**: `duration-500` (500ms)

### Grid Layouts
- **2 Columns**: `grid-cols-2`
- **3 Columns**: `grid-cols-3`
- **4 Columns**: `grid-cols-4`
- **Custom**: Use specific column spans like `col-span-1`, `col-span-5`, etc.

## Best Practices

1. **Consistent Spacing**: Use the same padding and margins throughout
2. **Clear Visual Hierarchy**: Make it obvious which content belongs to which row
3. **Smooth Transitions**: Always use CSS transitions for state changes
4. **Responsive Design**: Ensure the component works on all screen sizes
5. **Performance**: Avoid unnecessary re-renders with proper state management
6. **Accessibility**: Always include proper ARIA attributes and keyboard support

## Common Use Cases

1. **Data Tables with Details**: Show summary data with expandable details
2. **Order Management**: Display orders with expandable item lists
3. **User Management**: Show users with expandable profile information
4. **Inventory Tracking**: Display inventory items with expandable SKU details
5. **Report Views**: Show report summaries with expandable breakdowns

## Migration Guide

When implementing this pattern in existing components:

1. **Identify the data structure** and determine what should be in the header vs. content
2. **Set up the state management** with `openAccordion` state
3. **Implement the toggle handler** for expand/collapse functionality
4. **Apply the styling classes** for consistent appearance
5. **Add accessibility attributes** for screen reader support
6. **Test with different data sizes** to ensure performance

This pattern provides a consistent, accessible, and performant way to display hierarchical data across the application.
