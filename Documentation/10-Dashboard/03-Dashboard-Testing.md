# Dashboard Testing Guide

## Overview

This document explains the testing strategy and test files for the Dashboard feature. All tests follow Jest best practices and aim for >90% coverage on hooks and utility functions.

---

## Table of Contents

1. [Test Setup](#test-setup)
2. [Test Files Structure](#test-files-structure)
3. [Running Tests](#running-tests)
4. [Test Coverage](#test-coverage)
5. [Unit Tests Breakdown](#unit-tests-breakdown)
6. [Component Tests Breakdown](#component-tests-breakdown)
7. [Writing New Tests](#writing-new-tests)

---

## Test Setup

### Jest Configuration

**Location:** `jest.config.js`

Key configuration:

- **Test Environment**: `jsdom` (for DOM APIs)
- **Setup File**: `src/setupTests.ts` (global test configuration)
- **Coverage Threshold**: 80% (branches, functions, lines, statements)
- **Test Matchers**: Finds tests in `__tests__` folders or `*.test.ts` files

### Setup File

**Location:** `src/setupTests.ts`

Provides:
- `@testing-library/jest-dom` matchers (`.toBeInTheDocument()`, etc.)
- `window.matchMedia` mock for responsive hooks
- Console error suppression for expected React warnings

---

## Test Files Structure

```
src/features/dashboard/
├── components/
│   └── __tests__/
│       └── DashboardChart.test.tsx      # Component tests
├── hooks/
│   └── __tests__/
│       ├── useChartData.test.ts          # Hook tests
│       └── useDashboardDataQuery.test.ts # React Query hook tests
└── utils/
    └── __tests__/
        └── dataTransformers.test.ts      # Utility function tests
```

---

## Running Tests

### Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- DashboardChart.test.tsx

# Run tests matching a pattern
npm test -- --testNamePattern="transformToStats"
```

### Coverage Report

After running `npm run test:coverage`, check:

- **Terminal**: Summary in console
- **Coverage folder**: Detailed HTML report in `coverage/index.html`

---

## Test Coverage

### Target Coverage

- **Hooks**: >90% line coverage
- **Utilities**: >90% line coverage
- **Components**: >80% line coverage (critical paths)

### Current Coverage

Run `npm run test:coverage` to see current metrics.

---

## Unit Tests Breakdown

### 1. Data Transformers Tests

**File:** `src/features/dashboard/utils/__tests__/dataTransformers.test.ts`

**What it tests:**

- `transformToStats()` - Converts API response to dashboard stats
- `transformToMonthlyChartData()` - Converts API response to chart data points
- `calculateYAxisTicks()` - Calculates Y-axis tick marks

**Test Cases:**

```typescript
describe('transformToStats', () => {
  it('should return null when data is null');
  it('should extract stats from valid dashboard response');
  it('should return zeros when optional fields are missing');
});

describe('transformToMonthlyChartData', () => {
  it('should return empty array when data is null');
  it('should transform byDate object to sorted chart data points');
  it('should handle zero counts');
});

describe('calculateYAxisTicks', () => {
  it('should return empty array when chartData is empty');
  it('should generate ticks for simple data range');
  it('should generate ticks for large data range');
  it('should respect custom tick rounding');
});
```

**Why these tests:**

- **Edge cases**: Null data, missing fields, empty arrays
- **Data transformation**: Ensures correct mapping from API to UI
- **Business logic**: Y-axis ticks calculation is critical for chart readability

---

### 2. useChartData Hook Tests

**File:** `src/features/dashboard/hooks/__tests__/useChartData.test.ts`

**What it tests:**

- Chart data filtering by filter type (monthly, week1, week2, etc.)
- Data transformation for different views

**Test Cases:**

```typescript
describe('useChartData', () => {
  it('should return empty array when data is null');
  it('should return empty array when segResult is missing');
  it('should return monthly chart data for monthly filter');
  it('should return week 1 data for week1 filter');
  it('should return week 2 data for week2 filter');
  it('should return empty array for non-existent week');
});
```

**Why these tests:**

- **Filter logic**: Ensures correct week/month filtering
- **Edge cases**: Missing data, non-existent weeks
- **Data integrity**: Verifies correct data structure for chart rendering

---

### 3. useDashboardDataQuery Hook Tests

**File:** `src/features/dashboard/hooks/__tests__/useDashboardDataQuery.test.ts`

**What it tests:**

- React Query integration for dashboard data fetching
- Data transformation after API response
- Error handling and loading states
- Conditional fetching (enabled flag)

**Test Cases:**

```typescript
describe('useDashboardDataQuery', () => {
  it('should return loading state initially');
  it('should fetch and transform data successfully');
  it('should handle API errors');
  it('should not fetch when enabled is false');
  it('should not fetch when locationId is missing');
});
```

**Why these tests:**

- **React Query**: Ensures proper integration with caching and retries
- **Error handling**: Verifies user-friendly error messages
- **Conditional logic**: Tests that queries respect `enabled` flag

**Important Setup:**

- Mocks `InventoryApiService.getSentCountKAM`
- Uses `QueryClientProvider` wrapper for React Query context
- Creates isolated `QueryClient` per test to avoid shared state

---

## Component Tests Breakdown

### DashboardChart Component Tests

**File:** `src/features/dashboard/components/__tests__/DashboardChart.test.tsx`

**What it tests:**

- Component rendering with data
- Loading state display
- Empty state display
- Accessibility attributes (ARIA labels)
- Screen reader descriptions

**Test Cases:**

```typescript
describe('DashboardChart', () => {
  it('should render loading state');
  it('should render no data message when data is null');
  it('should render chart with data');
  it('should have proper ARIA labels');
  it('should render chart description for screen readers');
});
```

**Why these tests:**

- **User experience**: Loading and empty states must work correctly
- **Accessibility**: ARIA labels are critical for screen readers
- **Data rendering**: Ensures chart displays when data is available

**Mocking Strategy:**

- **Recharts**: Mocked to avoid SVG rendering issues in tests
- **useBreakpoint**: Mocked to return consistent responsive flags

**Example Mock:**

```typescript
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => (
    <div data-testid='responsive-container'>{children}</div>
  ),
  LineChart: ({ children }) => (
    <div data-testid='line-chart'>{children}</div>
  ),
  // ... other mocks
}));
```

---

## Writing New Tests

### Template for Utility Function Tests

```typescript
/**
 * Unit Tests for [FunctionName]
 * Tests [what it does]
 */

import { describe, it, expect } from '@testing-library/jest-dom';
import { functionToTest } from '../file';

describe('functionToTest', () => {
  it('should handle null input', () => {
    const result = functionToTest(null);
    expect(result).toBeNull();
  });

  it('should process valid input correctly', () => {
    const input = { /* valid data */ };
    const result = functionToTest(input);
    expect(result).toEqual(expectedOutput);
  });

  it('should handle edge case', () => {
    // Test edge case
  });
});
```

### Template for Hook Tests

```typescript
/**
 * Unit Tests for [HookName]
 * Tests [what it does]
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useHookName } from '../useHookName';

describe('useHookName', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useHookName());
    expect(result.current.value).toBe(expectedInitialValue);
  });

  it('should update state on action', async () => {
    const { result } = renderHook(() => useHookName());
    
    act(() => {
      result.current.action();
    });

    await waitFor(() => {
      expect(result.current.value).toBe(expectedUpdatedValue);
    });
  });
});
```

### Template for Component Tests

```typescript
/**
 * Component Tests for [ComponentName]
 * Tests [rendering, interactions, accessibility]
 */

import { render, screen } from '@testing-library/react';
import { ComponentName } from '../ComponentName';

describe('ComponentName', () => {
  it('should render with required props', () => {
    render(<ComponentName prop1='value' />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', () => {
    const handleClick = jest.fn();
    render(<ComponentName onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should have accessibility attributes', () => {
    render(<ComponentName />);
    const element = screen.getByRole('region');
    expect(element).toHaveAttribute('aria-label');
  });
});
```

---

## Testing Best Practices

### 1. Test Behavior, Not Implementation

✅ **Good:**
```typescript
it('should display error message on API failure', async () => {
  mockApi.mockRejectedValue(new Error('Network error'));
  render(<Dashboard />);
  
  await waitFor(() => {
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
  });
});
```

❌ **Bad:**
```typescript
it('should call setError with message', () => {
  const setError = jest.fn();
  // Testing internal implementation
});
```

### 2. Use Descriptive Test Names

✅ **Good:**
```typescript
it('should return empty array when chartData is empty');
it('should generate 8-10 ticks for data range 0-10000');
```

❌ **Bad:**
```typescript
it('works');
it('test1');
```

### 3. Mock External Dependencies

✅ **Good:**
```typescript
vi.mock('../../../services/inventoryApi', () => ({
  InventoryApiService: {
    getSentCountKAM: vi.fn(),
  },
}));
```

### 4. Test Edge Cases

Always test:
- Null/undefined inputs
- Empty arrays/objects
- Missing optional fields
- Boundary values (0, max, min)

### 5. Isolate Tests

Each test should:
- Be independent (no shared state)
- Clean up after itself (if needed)
- Not rely on execution order

---

## Debugging Tests

### Run Single Test

```bash
npm test -- --testNamePattern="transformToStats"
```

### Debug Mode

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open Chrome DevTools → `chrome://inspect`

### Verbose Output

```bash
npm test -- --verbose
```

---

## Continuous Integration

Tests run automatically in GitHub Actions (see `.github/workflows/code-review.yml`):

1. All tests must pass
2. Coverage must be >80%
3. No linting errors

---

## Related Documentation

- [Dashboard Overview](./00-Dashboard-Overview.md)
- [Dashboard How It Works](./01-Dashboard-How-It-Works.md)
- [Dashboard Accessibility](./02-Dashboard-Accessibility.md)

---

## Quick Reference

### Common Jest Matchers

```typescript
expect(value).toBe(expected);           // Exact equality
expect(value).toEqual(expected);       // Deep equality
expect(value).toBeNull();
expect(value).toBeDefined();
expect(array).toHaveLength(3);
expect(element).toBeInTheDocument();   // Requires @testing-library/jest-dom
expect(element).toHaveAttribute('aria-label');
```

### Common Testing Library Queries

```typescript
screen.getByRole('button');            // By ARIA role
screen.getByText(/hello/i);            // By text (regex)
screen.getByLabelText('Email');        // By label
screen.getByTestId('submit-button');   // By test ID
```

