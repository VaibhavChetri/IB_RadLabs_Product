# 📋 Quick Reference Index for Pages & Components

**Navigation guide - Points to specific documentation files for each topic.**

## 🎯 Project Rules & Standards

- **Cursor Rules**: `.cursorrules` (root directory) - Project coding standards and conventions
- **Component Standards**: [Component Development Standards](./COMPONENT_DEVELOPMENT_STANDARDS.md) - Full P0/P1/P2/P3 checklist

---

## 🚀 When Creating a New Page or Component

### Quick Checklist
- [ ] **Page Structure**: See → [Dashboard Page Structure Pattern](./10-Dashboard/04-Dashboard-Page-Structure-Pattern.md)
- [ ] **Standards**: See → [Component Development Standards](./COMPONENT_DEVELOPMENT_STANDARDS.md)
- [ ] **Feature Folder**: See → [Component Development Standards - Feature Structure](./COMPONENT_DEVELOPMENT_STANDARDS.md#separation-of-concerns) (Line 409)

---

## 📄 Page Structure Patterns

### Dashboard-Style Pages (Filters + Content)
**See**: `Documentation/10-Dashboard/04-Dashboard-Page-Structure-Pattern.md`
- Pattern used in Dashboard.tsx and OpsDashboard.tsx
- Minimal page component (70-80 lines)
- Separate Filters and Content components
- Custom hooks for logic

### Listing Pages (Table + Filters + Pagination)
**See**: `Documentation/04-UI-Components/05-Universal-Listing-Page-Template.md`
- Complete template for data tables
- Filter sections with date ranges
- Pagination patterns
- Search functionality

### Form Pages (Add/Edit)
**See**: `Documentation/01-Architecture/04-Component-Architecture.md` (Lines 793-905)
- Form structure patterns
- Validation handling
- API integration

---

## 🎨 UI Components

### Form Components
**See**: `Documentation/04-UI-Components/01-Form-Components.md`
- FloatingInput (text, date, number inputs)
- FloatingDropdown (single-select dropdowns)
- MultiSelectDropdown (multi-select with chips)

### Display Components
**See**: `Documentation/04-UI-Components/02-Data-Display-Components.md`
- Table (data tables with sorting)
- Pagination (page navigation)
- DataDisplay components

### Action Components
**See**: `Documentation/04-UI-Components/03-UI-Components.md`
- PageHeader (page titles and metadata)
- SearchButton (filter/search actions)
- Card (container components)
- Snackbar (notifications)

---

## 📅 Date Filter Patterns

**See**: `Documentation/04-UI-Components/07-Date-Filter-Patterns.md`
- Date range filters (Start/End Date)
- Single date filters
- Date presets (Today, Last 7 Days, etc.)
- localStorage persistence
- Validation patterns

---

## 🔌 API Integration

### Creating API Service Files
**See**: `Documentation/01-Architecture/03-API-Integration.md`
**Standard Pattern** (Industry Standard - Meta/Google approach):
- Import singleton: `import { apiService } from './api'`
- Static methods: `static async methodName()` using `apiService.get/post/put/delete`
- Type casting: `as unknown as Promise<ResponseType>` when needed
- TypeScript interfaces for all request/response types
- Example files: `src/services/locationApi.ts`, `src/services/clientApi.ts`

### React Query (Recommended)
**See**: `Documentation/10-Dashboard/01-Dashboard-How-It-Works.md` (Lines 534-556)
- Using `useQuery` for data fetching
- Caching and automatic refetching
- Error handling

### Request Cancellation (P0 Standard)
**See**: `Documentation/COMPONENT_DEVELOPMENT_STANDARDS.md` (Lines 61-107)
- Using AbortController
- Canceling on unmount
- Handling AbortError

---

## ✅ Component Development Standards

### Full Standards Checklist
**See**: `Documentation/COMPONENT_DEVELOPMENT_STANDARDS.md`

**Quick Reference by Priority:**

#### P0: Critical (Must Have)
- **useEffect Dependencies**: Line 30-57
- **Request Cancellation**: Line 61-107
- **No `any` Types**: Line 174-209
- **No `window.innerWidth`**: Line 136-173

#### P1: High Priority (Should Have)
- **Debounce Resize**: Line 136-173
- **Constants Extraction**: Line 344-396
- **Data Transformers**: Line 396-437
- **Memoization**: Line 210-262

#### P2: Medium Priority (Nice to Have)
- **Error Boundaries**: Line 297-341
- **Loading States**: Line 263-296
- **Error Handling**: Line 263-296

#### P3: Low Priority (Quality of Life)
- **Accessibility**: Line 439-508
- **Unit Tests**: Line 568-650

---

## 🗂️ Feature Folder Structure

**See**: `Documentation/COMPONENT_DEVELOPMENT_STANDARDS.md` (Lines 409-436)

**Standard Structure:**
```
feature/
├── components/     # UI only
├── hooks/         # Business logic
├── utils/         # Pure functions
├── config/        # Constants
└── index.ts       # Exports
```

**Example**: `src/features/dashboard/`

---

## 📊 Common Patterns by Use Case

### Creating a Dashboard Page
1. **Page Structure**: → `10-Dashboard/04-Dashboard-Page-Structure-Pattern.md`
2. **How It Works**: → `10-Dashboard/01-Dashboard-How-It-Works.md`
3. **Example Code**: → `src/pages/Dashboard.tsx`

### Creating an Ops Dashboard Page
1. **Overview**: → `11-Ops-Dashboard/00-Ops-Dashboard-Overview.md`
2. **How It Works**: → `11-Ops-Dashboard/01-Ops-Dashboard-How-It-Works.md`
3. **Example Code**: → `src/pages/OpsDashboard.tsx`
4. **All Files**: See → `11-Ops-Dashboard/README.md`
5. **Chart Component Pattern**: → `11-Ops-Dashboard/01-Ops-Dashboard-How-It-Works.md#industry-standard-chart-component-separation-pattern`

### Creating a Listing Page
1. **Template**: → `04-UI-Components/05-Universal-Listing-Page-Template.md`
2. **Date Filters**: → `04-UI-Components/07-Date-Filter-Patterns.md`
3. **Table Component**: → `04-UI-Components/02-Data-Display-Components.md`

### Creating a Form Page
1. **Component Architecture**: → `01-Architecture/04-Component-Architecture.md` (Lines 793-905)
2. **Form Components**: → `04-UI-Components/01-Form-Components.md`
3. **Validation**: → `04-UI-Components/01-Form-Components.md`

### Creating a Reusable Component
1. **Component Architecture**: → `04-UI-Components/04-Reusable-Components-Architecture.md`
2. **Standards**: → `COMPONENT_DEVELOPMENT_STANDARDS.md`
3. **Chart Pattern**: → `11-Ops-Dashboard/01-Ops-Dashboard-How-It-Works.md#industry-standard-chart-component-separation-pattern` (Generic vs Feature-Specific)
4. **Place in**: `src/components/ui/YourComponent.tsx` (generic) or `src/features/feature-name/components/` (feature-specific)

---

## 🎯 Component-Specific Documentation

### Accordion Table Pattern
**See**: `Documentation/04-UI-Components/06-Accordion-Table-Pattern.md`
- Hierarchical data display
- Single accordion behavior
- Accessibility considerations

### Reusable Components Architecture
**See**: `Documentation/04-UI-Components/04-Reusable-Components-Architecture.md`
- Component composition patterns
- Performance optimization
- State management strategies

---

## 🔗 Key Documentation Files Quick Links

| Topic | File | When to Read |
|-------|------|--------------|
| **Component Standards** | `COMPONENT_DEVELOPMENT_STANDARDS.md` | Before writing any code |
| **Dashboard Pattern** | `10-Dashboard/04-Dashboard-Page-Structure-Pattern.md` | Creating dashboard pages |
| **Ops Dashboard** | `11-Ops-Dashboard/01-Ops-Dashboard-How-It-Works.md` | Creating ops dashboard pages |
| **Listing Template** | `04-UI-Components/05-Universal-Listing-Page-Template.md` | Creating listing pages |
| **Date Filters** | `04-UI-Components/07-Date-Filter-Patterns.md` | Adding date filters |
| **Component Architecture** | `01-Architecture/04-Component-Architecture.md` | Understanding patterns |
| **API Integration** | `01-Architecture/03-API-Integration.md` | Integrating with APIs |
| **UI Components** | `04-UI-Components/README.md` | Available components overview |

---

## 📝 Import Path Reference

### From Pages to Features
```typescript
import { Component } from '../features/feature-name';
```

### From Features to Services
```typescript
import { ApiService } from '../../../services/apiService';
```

### From Features to Store
```typescript
import { RootState } from '../../../store';
```

### From Components to Utils
```typescript
import { cn } from '../../utils/cn';
```

---

## 🧪 Testing

**See**: `Documentation/10-Dashboard/03-Dashboard-Testing.md`
- Test setup and configuration
- Unit test patterns
- Component test patterns
- Coverage requirements

---

## ♿ Accessibility

**See**: `Documentation/10-Dashboard/02-Dashboard-Accessibility.md`
- ARIA labels and semantic HTML
- Keyboard navigation
- Screen reader support
- Focus management

---

## 📚 Full Documentation Index

**Main Index**: `Documentation/README.md`
- Complete documentation structure
- Module-by-module organization
- Quick navigation links

---

**Purpose**: This file serves as a navigation index. Read the referenced files for detailed information.

**Last Updated**: After Dashboard and Ops Dashboard implementations
