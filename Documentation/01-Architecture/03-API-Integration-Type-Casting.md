# Understanding Type Casting in API Services

> **Root Cause:** Backend APIs return inconsistent response structures — some wrap data in `data` field, others return data at root level. This requires type casting on the frontend.

## The Problem: Inconsistent API Response Structures

### Base API Service Returns

```typescript
// From src/services/api.ts
export interface ApiResponse<T = any> {
  status_code: number;
  status: string;
  message: string | null;
  data: T;  // ← Data is wrapped in a "data" field
}

// apiService.get() always returns Promise<ApiResponse<T>>
public async get<T = any>(url: string): Promise<ApiResponse<T>> {
  const response = await this.client.get(url);
  return response.data;
}
```

### But Some APIs Return Different Structures

**Example 1: KAM EOD Report (NO data wrapper)**
```typescript
// Actual API response structure:
{
  status: string;
  status_code: number;
  message: string;
  totalDays: number;           // ← Data at root level
  dailyEntryStatus: [...],     // ← Not wrapped in "data"
  overallEntryPercentage: string,
  citySummary: [...]
}

// TypeScript interface:
export interface KAMEodReportResponse {
  status: string;
  status_code: number;
  message: string;
  totalDays: number;
  dailyEntryStatus: Array<...>;
  overallEntryPercentage: string;
  citySummary: Array<...>;
}
```

**Example 2: Client By City (WITH result wrapper)**
```typescript
// Actual API response structure:
{
  status_code: number;
  result: [...],  // ← Uses "result" instead of "data"
  message?: string;
}

// TypeScript interface:
export interface ClientByCityResponse {
  status_code: number;
  result?: ClientByCityItem[];
  message?: string;
}
```

## Why We Need Type Casting

TypeScript sees:
- `apiService.get()` returns `Promise<ApiResponse<T>>` = `Promise<{ status, status_code, message, data: T }>`
- But `KAMEodReportResponse` = `{ status, status_code, message, totalDays, ... }` (no `data` field)

**TypeScript Error:**
```
Type 'Promise<ApiResponse<any>>' is not assignable to type 'Promise<KAMEodReportResponse>'
Type 'ApiResponse<any>' is missing properties: totalDays, dailyEntryStatus, overallEntryPercentage, citySummary
```

## The Solution: Double Type Assertion

```typescript
// ❌ Direct cast doesn't work (types don't overlap enough)
return apiService.get(...) as Promise<KAMEodReportResponse>;  // ERROR!

// ✅ Double cast works (cast to unknown first, then to target)
return apiService.get(...) as unknown as Promise<KAMEodReportResponse>;  // OK!
```

### Why `as unknown` First?

`unknown` is TypeScript's top type (everything can be cast to it). The pattern:
1. Cast to `unknown` (bypasses type checking)
2. Cast from `unknown` to target type (TypeScript trusts you)

```typescript
Promise<ApiResponse<T>> → unknown → Promise<ResponseType>
   ↑                           ↑              ↑
  Source                    Safe              Target
                          bridge
```

## When to Use Each Pattern

### Pattern 1: APIs That Match `ApiResponse<T>` Structure

```typescript
// API returns: { status_code, status, message, data: T }
static async getExample(): Promise<ApiResponse<ExampleData>> {
  return apiService.get('/example');  // ✅ No casting needed
}
```

### Pattern 2: APIs With Different Wrapper Fields

```typescript
// API returns: { status_code, status, message, result: T }
static async getClientByCity(): Promise<ClientByCityResponse> {
  return apiService.get('/inventory/getClientByCity') 
    as Promise<ClientByCityResponse>;  // ✅ Single cast (close enough)
}
```

### Pattern 3: APIs With No Wrapper (Data at Root)

```typescript
// API returns: { status, status_code, message, totalDays, dailyEntryStatus, ... }
static async getKAMEodReport(): Promise<KAMEodReportResponse> {
  return apiService.get('/inventory/getKAMEodReport')
    as unknown as Promise<KAMEodReportResponse>;  // ✅ Double cast needed
}
```

## The "Unknown" Type Explained

`unknown` in TypeScript:
- Top type (supertype of all types)
- Forces you to check type before using
- Safer than `any` (can't use without type narrowing)

```typescript
// unknown forces type checking
function process(value: unknown) {
  // value.length  // ❌ Error: can't use unknown directly
  if (typeof value === 'string') {
    value.length  // ✅ OK after type check
  }
}

// any bypasses all checks
function process(value: any) {
  value.length  // ⚠️ No error, but might crash at runtime
}
```

## Best Practices

### ✅ Good: Document Why Casting Is Needed

```typescript
/**
 * Get KAM EOD Report
 * Note: Uses type casting because API response doesn't match ApiResponse<T> structure
 * (data is at root level, not wrapped in "data" field)
 */
static async getKAMEodReport(...): Promise<KAMEodReportResponse> {
  return apiService.get(...) as unknown as Promise<KAMEodReportResponse>;
}
```

### ❌ Bad: Casting Without Reason

```typescript
// Don't cast if API actually returns ApiResponse<T>
static async getExample(): Promise<ApiResponse<ExampleData>> {
  return apiService.get('/example') as unknown as Promise<ApiResponse<ExampleData>>;
  // ^ Unnecessary! apiService.get() already returns this type
}
```

### ✅ Better: Fix at Source (If Possible)

**This is a backend inconsistency issue.** If backend standardizes all responses to `ApiResponse<T>` format, no casting needed:
```typescript
// Backend returns consistent ApiResponse<T> format
return apiService.get('/example');  // No casting needed
```

**Until backend is fixed:** Use type casting as documented above.

## Summary

**The "unknown" in `as unknown as Promise<Type>` is:**
1. TypeScript's top type (`unknown`)
2. A safe bridge between incompatible types
3. Needed because backend APIs have inconsistent response structures
4. Better than `any` because it forces intentional type assertions

**When you see `as unknown as`:**
- It means the API response structure doesn't match `ApiResponse<T>`
- Usually APIs where data is at root level (not wrapped in `data` field)
- TypeScript can't directly cast, so we use `unknown` as an intermediate step

