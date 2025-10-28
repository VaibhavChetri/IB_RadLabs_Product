# Persistent Storage Design Pattern

## Overview

This document explains how we persist data across page reloads in the IB Dashboard application. We use `localStorage` to save user input, selections, and form state so users don't lose their work when they refresh the page or navigate away.

---

## Why We Need Persistent Storage

Imagine a user is filling out a long form. They accidentally refresh the page. Without persistence, all their work is lost. With persistence, their data is saved automatically and restored when they return.

**Key Benefits:**
- Users don't lose their work on refresh
- Better user experience
- Reduces frustration and support requests

---

## Current Implementation Strategy

In IB Dashboard, we use two main approaches for persistence:

1. **localStorage** — For form data, filters, and user selections
2. **Redux State** — For global app state and authentication

---

## localStorage Pattern (Current)

### How It Works

1. **Save State** — We save form data to localStorage whenever the user makes changes
2. **Load on Mount** — When the page loads, we check localStorage and restore saved data
3. **Clear on Submit** — After successful submission, we clear the saved data

### Example: Master Plan Feature

The Master Plan feature uses this pattern:

```typescript
// Load from localStorage on component mount
const initialState = loadInitialState();

const loadInitialState = () => {
  try {
    const stored = localStorage.getItem('masterPlanData');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
  }
  return defaultEmptyState;
};

// Save whenever state changes
useEffect(() => {
  localStorage.setItem('masterPlanData', JSON.stringify(data));
}, [data]);
```

### Example: SKU Mapping Feature

The SKU Mapping feature uses a similar pattern but with separate keys for add/edit modes:

```typescript
// Different keys for different modes
const storageKey = isEditMode ? 'sku-mapping-rows-edit' : 'sku-mapping-rows';

// Load from localStorage on initialization
const initialState = loadInitialState();

// Save to localStorage on every change
useEffect(() => {
  localStorage.setItem(storageKey, JSON.stringify(dataToSave));
}, [dataToSave]);
```

---

## Storage Keys Naming Convention

We follow a consistent naming pattern for localStorage keys:

| Pattern | Example | Purpose |
|---------|---------|---------|
| `sku-mapping-rows` | Add mode form data | Stores current form state |
| `sku-mapping-rows-edit` | Edit mode form data | Stores edit form state (separate from add) |
| `sku-listing-client-id` | Listing filter | Stores selected client ID in listing page |
| `sku-listing-status` | Listing filter | Stores selected status in listing page |
| `sent-transit-plan-filters` | Transit filters | Stores filter selections |

**Key Principles:**
- Use kebab-case (lowercase with hyphens)
- Include feature name (e.g., `sku-mapping`, `transit-plan`)
- Be descriptive (e.g., `rows`, `client-id`, `filters`)
- Separate modes if needed (e.g., `sku-mapping-rows` vs `sku-mapping-rows-edit`)

---

## Complete Lifecycle Example

Let's trace how SKU Mapping handles persistence:

### 1. Initial Load (Add Mode)

```
User navigates to "Add Client SKU Mapping"
  ↓
Component initializes
  ↓
Hook calls loadInitialState()
  ↓
Checks localStorage for 'sku-mapping-rows'
  ↓
If found: Restore previous data
If not found: Use empty defaults
```

### 2. User Makes Changes

```
User selects a client
  ↓
User adds rows to table
  ↓
User types in input fields
  ↓
useEffect detects state change
  ↓
Saves to localStorage automatically
```

### 3. User Refreshes Page

```
Page reloads
  ↓
Component initializes again
  ↓
loadInitialState() runs
  ↓
Finds previous data in localStorage
  ↓
Restores all fields and selections
  ↓
User continues where they left off
```

### 4. User Submits

```
User clicks "Submit"
  ↓
API call succeeds
  ↓
Clear localStorage (sku-mapping-rows)
  ↓
Navigate to listing page
```

### 5. Navigating Away

```
User clicks "Cancel" or navigates to another menu
  ↓
Data remains in localStorage
  ↓
User can return and continue later
```

---

## Separation of Concerns: Add vs Edit Mode

**Problem:** Add and Edit modes should not share the same localStorage data.

**Solution:** Use separate keys for each mode:

```typescript
// Add mode uses this key
const addKey = 'sku-mapping-rows';

// Edit mode uses this key
const editKey = 'sku-mapping-rows-edit';
```

**Why?** 
- Edit mode loads data from API (existing mapping)
- Add mode starts from scratch
- Mixing them would cause conflicts
- Each mode has its own state lifecycle

---

## Cleanup Strategy

When navigating between menus, we clean up localStorage to prevent stale data:

### In Listing Page

When user enters the SKU Listing page, we clear add/edit form data:

```typescript
useEffect(() => {
  // Clean up form data from other menus
  localStorage.removeItem('sku-mapping-client');
  localStorage.removeItem('sku-mapping-rows');
  localStorage.removeItem('sku-mapping-rows-edit');
  
  // Restore listing page state
  const storedClientId = localStorage.getItem('sku-listing-client-id');
  if (storedClientId) {
    dispatch(setSelectedClientId(Number(storedClientId)));
  }
}, []);
```

### In Add/Edit Page

When user enters Add or Edit page, we clear the opposite mode's data:

```typescript
useEffect(() => {
  // Clean up opposite mode's localStorage
  if (isEditMode) {
    localStorage.removeItem('sku-mapping-rows'); // Clear add mode
  } else {
    localStorage.removeItem('sku-mapping-rows-edit'); // Clear edit mode
  }
}, [isEditMode]);
```

**Why?**
- Prevents old data from appearing in wrong mode
- Each menu should have clean state when opened
- Avoids confusion for users

---

## Logout Cleanup

When user logs out, we clear all application-specific localStorage keys:

```typescript
export const logout = () => {
  const appKeys = [
    'auth_token',
    'refresh_token',
    'token_data',
    'user_activity',
    'expandedMenus',
    'menu_permissions',
    'user_data',
    'sku-mapping-client',
    'sku-mapping-rows',
    'sku-mapping-rows-edit',
    'sku-listing-client-id',
    'sku-listing-status',
    // ... more keys
  ];

  // Clear specific keys
  appKeys.forEach(key => {
    if (key.endsWith('-')) {
      // Handle prefix keys (like 'client-')
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith(key)) {
          localStorage.removeItem(k);
        }
      });
    } else {
      localStorage.removeItem(key);
    }
  });

  sessionStorage.clear();
};
```

**Important:** We only clear our app's keys, not keys from other applications on the same domain.

---

## Best Practices

### ✅ Do

- **Use descriptive key names** — `sku-mapping-rows` not `data1`
- **Separate add/edit modes** — Use different keys for each mode
- **Clean up on navigation** — Remove stale data when switching menus
- **Clear on successful submit** — Don't leave old data behind
- **Handle errors gracefully** — Wrap localStorage calls in try/catch
- **Log what you save** — Console logs help with debugging

### ❌ Don't

- **Don't save sensitive data** — No passwords or tokens in plain localStorage
- **Don't save large objects** — localStorage has size limits
- **Don't mix modes** — Add and Edit should never share data
- **Don't forget to clean up** — Old data can cause confusion
- **Don't block rendering** — Loading from localStorage should be fast
- **Don't store temporary state** — Only persist meaningful data

---

## Implementation Checklist

When adding persistence to a new feature:

- [ ] Define clear storage key name (use kebab-case)
- [ ] Create `loadInitialState()` function to read from localStorage
- [ ] Use `useEffect` to save state on every change
- [ ] Skip save on first render to avoid overwriting loaded data
- [ ] Clear storage on successful submission
- [ ] Add cleanup when navigating to other menus
- [ ] Test refresh behavior — data should persist
- [ ] Test logout behavior — data should clear
- [ ] Test navigation between modes — no stale data

---

## Technical Details

### Using `useRef` to Skip First Render

```typescript
const isFirstRender = React.useRef(true);

useEffect(() => {
  if (isFirstRender.current) {
    console.log('⏸️ Skipping save on first render');
    isFirstRender.current = false;
    return;
  }
  
  // Save to localStorage
  localStorage.setItem(key, JSON.stringify(data));
}, [data]);
```

**Why?** 
- First render is when we load from localStorage
- Saving immediately would overwrite with empty state
- Skip the first save, then save all changes after that

### Lazy Initialization in useState

```typescript
const loadInitialState = () => {
  const stored = localStorage.getItem('key');
  if (stored) {
    return JSON.parse(stored);
  }
  return defaultState;
};

const [data, setData] = useState(() => loadInitialState());
```

**Why?**
- Call `loadInitialState` only once (when component mounts)
- More efficient than loading in useEffect
- Follows React best practices for expensive initializations

---

## File Structure

```
src/
├── features/
│   └── sku-mapping/
│       ├── hooks/
│       │   ├── useSkuMappingForm.ts      ← Handles localStorage
│       │   ├── useClientSkuMapping.ts
│       │   └── useSkuSubmission.ts
│       ├── components/
│       │   └── SkuMappingTable.tsx
│       └── index.ts
├── pages/
│   ├── AddClientSkuMapping.tsx          ← Uses hooks
│   └── SkuMapListing.tsx
├── utils/
│   └── tokenManager.ts                  ← Logout cleanup
└── services/
    └── skuApi.ts
```

---

## Common Issues and Solutions

### Issue: Data Gets Overwritten on Refresh

**Cause:** Saving to localStorage immediately after loading

**Solution:** Use `useRef` to skip first render

```typescript
const isFirstRender = React.useRef(true);

useEffect(() => {
  if (isFirstRender.current) {
    isFirstRender.current = false;
    return; // Skip save on first render
  }
  // Save normally
}, [data]);
```

### Issue: Stale Data Appears in Wrong Mode

**Cause:** Not cleaning up when switching modes

**Solution:** Clean up opposite mode's data on mount

```typescript
useEffect(() => {
  if (isEditMode) {
    localStorage.removeItem('sku-mapping-rows');
  } else {
    localStorage.removeItem('sku-mapping-rows-edit');
  }
}, [isEditMode]);
```

### Issue: Data Persists After Logout

**Cause:** Missing keys in logout cleanup

**Solution:** Add all keys to the cleanup list

```typescript
const appKeys = [
  'sku-mapping-rows',
  'sku-mapping-rows-edit',
  // ... add all your keys
];
```

---

## Future Improvements (Redux Persist)

For larger applications, consider migrating to Redux Persist:

### Benefits

- Centralized persistence configuration
- Automatic rehydration on page load
- Encryption support for sensitive data
- Better performance for large state trees
- Built-in debugging tools

### Implementation

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['filters', 'user', 'cart'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
});
```

---

## Summary

**Current Approach:**
- Direct `localStorage` access in custom hooks
- Separate keys for each feature and mode
- Manual cleanup on navigation and logout
- Simple and lightweight

**When to Use:**
- Simple forms and filters
- Medium-sized applications
- Team comfortable with manual management

**When to Consider Redux Persist:**
- Large state trees
- Multiple developers
- Need encryption for sensitive data
- Complex rehydration logic

---

## References

- **LocalStorage API:** [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- **React useState Lazy Init:** [React Docs](https://react.dev/reference/react/useState#lazy-initial-state)
- **Redux Persist:** [GitHub](https://github.com/rt2zz/redux-persist)

---

## Questions or Issues?

If you have questions about persistence or encounter issues:

1. Check console logs for save/load messages
2. Verify storage key names match
3. Ensure cleanup happens on navigation
4. Review this document for best practices

For code examples, see:
- `src/features/sku-mapping/hooks/useSkuMappingForm.ts`
- `src/hooks/useMasterPlanData.ts`
- `src/utils/tokenManager.ts`

