# Design System Documentation

A comprehensive, customizable design system built with React, TypeScript, and TailwindCSS v4. This design system provides a complete set of UI components, design tokens, and utilities for building modern web applications.

## 🎨 Design Tokens

### Colors

- **Primary**: Green-based color palette (`#00a76f`)
- **Secondary**: Purple-based color palette (`#8e33ff`)
- **Semantic Colors**: Success, Warning, Error, Info
- **Neutral Colors**: Complete grayscale palette
- **Semantic Colors**: Background, Foreground, Border, Input, Ring colors

### Typography

- **Font Families**: Public Sans (body), Barlow (headings)
- **Font Sizes**: H1-H6, Body1-Body2, Subtitle1-Subtitle2, Caption, Overline
- **Font Weights**: Light (300) to Extra Bold (800)

### Spacing

- **Auto-layout System**: 4px base unit (1 = 4px, 2 = 8px, etc.)
- **Consistent Scale**: From 0px to 256px
- **Responsive**: Adapts to different screen sizes

### Shadows

- **Elevation Levels**: z1-z24 for different depths
- **Semantic Shadows**: Primary, Secondary, Success, Warning, Error
- **Consistent**: All shadows follow the same pattern

## 🧩 Components

### Core Components

- **Alert**: Multiple variants (success, warning, error, info) with icons and actions
- **Button**: 6 variants, 4 sizes, loading states, icons, and groups
- **Input**: Text inputs with labels, validation, icons, and clear functionality
- **Card**: Flexible containers with headers, content, and footers

### Form Components

- **Checkbox**: Custom styled checkboxes with labels and validation
- **Radio**: Radio button groups with consistent styling
- **Switch**: Toggle switches with smooth animations
- **Dropdown**: Searchable dropdowns with icons and custom options

### Navigation Components

- **Breadcrumb**: Hierarchical navigation with icons and separators
- **Tabs**: Multiple variants (default, pills, underline) with badges
- **Pagination**: Complete pagination with first/last and prev/next

### Data Display Components

- **Table**: Sortable tables with hover states and responsive design
- **List**: Interactive lists with icons, badges, and actions
- **Accordion**: Collapsible content with icons and multiple selection

### Feedback Components

- **Badge**: Status indicators with multiple variants and sizes
- **Tooltip**: Contextual help with multiple triggers and placements
- **Snackbar**: Toast notifications with actions and auto-dismiss

### Layout Components

- **Container**: Responsive containers with different sizes
- **Grid**: CSS Grid system with responsive breakpoints
- **Flex**: Flexbox utilities with comprehensive options
- **Stack**: Vertical stacking with consistent spacing
- **Spacer**: Flexible spacing components
- **Divider**: Visual separators with different styles
- **AspectRatio**: Maintain aspect ratios for content

## 🛠️ Utilities

### Design System Utils

- **Color Utilities**: Get color values and create color schemes
- **Spacing Utilities**: Consistent spacing functions
- **Typography Utilities**: Font size and weight helpers
- **Component Variants**: Pre-built class combinations

### Responsive Utilities

- **Breakpoint Hook**: React hook for current breakpoint
- **Responsive Visibility**: Show/hide components at different breakpoints
- **Responsive Classes**: Utility functions for responsive design

## 📱 Responsive Design

### Breakpoints

- **xs**: 475px
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Mobile-First Approach

All components are built mobile-first and scale up to larger screens.

## 🎯 Customization

### CSS Custom Properties

The design system uses CSS custom properties for easy theming:

```css
:root {
	--color-primary-DEFAULT: #00a76f;
	--color-primary-foreground: #ffffff;
	--spacing-4: 16px;
	--radius-DEFAULT: 8px;
	/* ... more tokens */
}
```

### Component Variants

All components support multiple variants and can be easily customized:

```tsx
<Button variant='primary' size='lg' leftIcon={<Plus />}>
	Add Item
</Button>
```

## 🚀 Usage

### Installation

```bash
npm install
npm run dev
```

### Basic Usage

```tsx
import { Button, Card, Input } from './components/ui';

function App() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Welcome</CardTitle>
			</CardHeader>
			<CardContent>
				<Input label='Name' placeholder='Enter your name' />
				<Button>Submit</Button>
			</CardContent>
		</Card>
	);
}
```

### Design System Showcase

Visit `/design-system` to see all components in action with interactive examples.

## 📁 File Structure

```
src/
├── design-system/
│   ├── tokens.ts          # Design tokens and constants
│   └── utils.ts           # Design system utilities
├── components/
│   └── ui/
│       ├── Alert.tsx      # Alert components
│       ├── Button.tsx     # Button components
│       ├── Input.tsx      # Input components
│       ├── Card.tsx       # Card components
│       ├── Form.tsx       # Form components
│       ├── Navigation.tsx # Navigation components
│       ├── DataDisplay.tsx # Data display components
│       ├── Feedback.tsx   # Feedback components
│       ├── Layout.tsx     # Layout components
│       └── index.ts       # Central exports
└── pages/
    └── DesignSystemShowcase.tsx # Component showcase
```

## 🎨 Design Principles

1. **Consistency**: All components follow the same design patterns
2. **Accessibility**: Built with accessibility in mind (ARIA labels, keyboard navigation)
3. **Performance**: Optimized for performance with minimal bundle size
4. **Flexibility**: Highly customizable and extensible
5. **Developer Experience**: TypeScript support with comprehensive type definitions

## 🔧 Development

### Adding New Components

1. Create component file in `src/components/ui/`
2. Export from `src/components/ui/index.ts`
3. Add to showcase page for testing
4. Update documentation

### Customizing Themes

1. Modify CSS custom properties in `src/index.css`
2. Update design tokens in `src/design-system/tokens.ts`
3. Test across all components

## 📄 License

This design system is part of the IB Dashboard project and follows the same licensing terms.

## 🤝 Contributing

1. Follow the established patterns
2. Add TypeScript types for all props
3. Include accessibility features
4. Test across different screen sizes
5. Update documentation

---

Built with ❤️ using React, TypeScript, and TailwindCSS v4
