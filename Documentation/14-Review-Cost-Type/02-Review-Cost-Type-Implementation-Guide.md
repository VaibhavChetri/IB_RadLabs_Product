# Review Cost Type - Implementation Guide

**⭐ This is a template guide for implementing future admin pages**

## Overview

This guide walks you through implementing an admin page with:
- ✅ Listing with filters and pagination
- ✅ Add/Edit modals
- ✅ URL state synchronization
- ✅ Debounced filters
- ✅ Optimistic updates
- ✅ Loading skeletons

## Step-by-Step Implementation

### Step 1: Create Feature Structure

```
src/features/your-feature/
├── components/
│   └── YourFeatureModal.tsx
├── hooks/
│   ├── useYourFeatureData.ts
│   ├── useYourFeatureMutations.ts
│   ├── useDropdownOptions.ts (if needed)
│   └── useURLFilters.ts
├── config/
│   ├── constants.ts
│   └── tableColumns.tsx
└── index.ts
```

### Step 2: Create Constants File

**File**: `src/features/your-feature/config/constants.ts`

```typescript
/**
 * Constants for Your Feature
 */

export const YOUR_FEATURE_STATUS = {
  ALL: '',
  ACTIVE: '1',
  INACTIVE: '0',
} as const;

export type YourFeatureStatus = typeof YOUR_FEATURE_STATUS[keyof typeof YOUR_FEATURE_STATUS];

export const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: YOUR_FEATURE_STATUS.ALL, label: 'All' },
  { value: YOUR_FEATURE_STATUS.ACTIVE, label: 'Active' },
  { value: YOUR_FEATURE_STATUS.INACTIVE, label: 'Inactive' },
];

export const STATUS_DISPLAY_MAP = {
  [YOUR_FEATURE_STATUS.ACTIVE]: 'Active',
  [YOUR_FEATURE_STATUS.INACTIVE]: 'Inactive',
} as const;

/**
 * Helper to check if status is active
 */
export const isActiveStatus = (status: string | number): boolean => {
  return String(status) === YOUR_FEATURE_STATUS.ACTIVE || status === 'Active';
};
```

### Step 3: Create URL Filters Hook

**File**: `src/features/your-feature/hooks/useURLFilters.ts`

```typescript
import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';

interface YourFeatureFilters {
  filter1: string;
  filter2: string;
  page: number;
  pageSize: number;
}

const DEFAULT_FILTERS: YourFeatureFilters = {
  filter1: '',
  filter2: '',
  page: 1,
  pageSize: 10,
};

export const useURLFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<YourFeatureFilters>(() => {
    return {
      filter1: searchParams.get('filter1') || DEFAULT_FILTERS.filter1,
      filter2: searchParams.get('filter2') || DEFAULT_FILTERS.filter2,
      page: parseInt(searchParams.get('page') || '1', 10),
      pageSize: parseInt(searchParams.get('pageSize') || '10', 10),
    };
  }, [searchParams]);

  const updateFilters = useCallback(
    (updates: Partial<YourFeatureFilters>) => {
      const newParams = new URLSearchParams(searchParams);

      // Update or remove params
      if (updates.filter1 !== undefined) {
        if (updates.filter1) {
          newParams.set('filter1', updates.filter1);
        } else {
          newParams.delete('filter1');
        }
      }

      if (updates.page !== undefined) {
        if (updates.page === 1) {
          newParams.delete('page');
        } else {
          newParams.set('page', updates.page.toString());
        }
      }

      // Add other filters similarly...

      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  return { filters, updateFilters };
};
```

### Step 4: Create Data Fetching Hook

**File**: `src/features/your-feature/hooks/useYourFeatureData.ts`

```typescript
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { YourFeatureApiService, GetYourFeatureResponse } from '../../../services/yourApi';

interface UseYourFeatureDataParams {
  page: number;
  limit: number;
  filter1?: number;
  filter2?: number;
  enabled?: boolean;
}

export const useYourFeatureData = ({
  page,
  limit,
  filter1,
  filter2,
  enabled = true,
}: UseYourFeatureDataParams): UseQueryResult<GetYourFeatureResponse, Error> => {
  return useQuery({
    queryKey: ['yourFeature', 'listing', page, limit, filter1 || 'all', filter2 ?? 'all'],
    queryFn: async (): Promise<GetYourFeatureResponse> => {
      return await YourFeatureApiService.getYourFeature(
        page,
        limit,
        false, // showAll
        filter1,
        filter2
      );
    },
    enabled,
    staleTime: 0, // Always refetch on mount for fresh data
    gcTime: 0, // Don't cache
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};
```

### Step 5: Create Mutations Hook

**File**: `src/features/your-feature/hooks/useYourFeatureMutations.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { YourFeatureApiService, GetYourFeatureResponse, YourFeatureItem } from '../../../services/yourApi';

interface AddYourFeatureParams {
  name: string;
  categoryId: number;
}

interface UpdateYourFeatureParams {
  id: number;
  name: string;
  categoryId: number;
  status: number;
}

export const useAddYourFeature = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddYourFeatureParams) => {
      return await YourFeatureApiService.addYourFeature(data);
    },
    onMutate: async newItem => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['yourFeature', 'listing'] });

      // Snapshot previous value
      const previousData = queryClient.getQueriesData<GetYourFeatureResponse>({
        queryKey: ['yourFeature', 'listing'],
      });

      // Optimistically update cache
      queryClient.setQueriesData<GetYourFeatureResponse>(
        { queryKey: ['yourFeature', 'listing'] },
        old => {
          if (!old) return old;

          const optimisticItem: YourFeatureItem = {
            id: Date.now(), // Temporary ID
            name: newItem.name,
            categoryName: '', // Will be filled by server
            status: '1',
          };

          return {
            ...old,
            data: [optimisticItem, ...(old.data || [])],
            pagination: old.pagination
              ? {
                  ...old.pagination,
                  totalItems: (old.pagination.totalItems || 0) + 1,
                }
              : undefined,
          };
        }
      );

      return { previousData };
    },
    onError: (_err, _newItem, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Invalidate to refetch with server data
      queryClient.invalidateQueries({ queryKey: ['yourFeature', 'listing'] });
    },
  });
};

export const useUpdateYourFeature = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateYourFeatureParams) => {
      return await YourFeatureApiService.updateYourFeature(data);
    },
    onMutate: async updatedItem => {
      await queryClient.cancelQueries({ queryKey: ['yourFeature', 'listing'] });

      const previousData = queryClient.getQueriesData<GetYourFeatureResponse>({
        queryKey: ['yourFeature', 'listing'],
      });

      queryClient.setQueriesData<GetYourFeatureResponse>(
        { queryKey: ['yourFeature', 'listing'] },
        old => {
          if (!old) return old;

          return {
            ...old,
            data: (old.data || []).map(item =>
              item.id === updatedItem.id
                ? {
                    ...item,
                    name: updatedItem.name,
                    categoryId: updatedItem.categoryId,
                    status: String(updatedItem.status),
                  }
                : item
            ),
          };
        }
      );

      return { previousData };
    },
    onError: (_err, _updatedItem, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yourFeature', 'listing'] });
    },
  });
};
```

### Step 6: Create Table Columns Config

**File**: `src/features/your-feature/config/tableColumns.tsx`

```typescript
import { Edit } from 'lucide-react';
import type { TableColumn } from '../../../components/ui/DataDisplay';
import type { YourFeatureItem } from '../../../services/yourApi';
import { isActiveStatus } from './constants';

interface ColumnProps {
  pagination: {
    currentPage: number;
    pageSize: number;
  };
  onEdit: (item: YourFeatureItem) => void;
}

export const getYourFeatureColumns = ({
  pagination,
  onEdit,
}: ColumnProps): TableColumn<Record<string, unknown>>[] => [
  {
    key: 'actions',
    title: 'Actions',
    sortable: false,
    align: 'center',
    render: (_value: unknown, row: Record<string, unknown>) => {
      return (
        <button
          onClick={() => onEdit(row as unknown as YourFeatureItem)}
          className='p-2 text-green-600 hover:bg-green-50 rounded transition-colors'
          title='Edit'
        >
          <Edit className='w-4 h-4' />
        </button>
      );
    },
  },
  {
    key: 'serial',
    title: '#',
    sortable: false,
    align: 'center',
    render: (_value: unknown, _row: Record<string, unknown>, index: number) => (
      <div className='font-semibold text-gray-600 text-center'>
        {(pagination.currentPage - 1) * pagination.pageSize + index + 1}
      </div>
    ),
  },
  {
    key: 'name',
    title: 'Name',
    sortable: true,
    align: 'center',
    render: (value: unknown) => (
      <div className='font-semibold text-gray-900 text-center'>{String(value || '')}</div>
    ),
  },
  {
    key: 'status',
    title: 'Status',
    sortable: true,
    align: 'center',
    render: (_value: unknown, row: Record<string, unknown>) => {
      const status = String(row.status || '');
      const isActive = isActiveStatus(status);
      return (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {isActive ? 'Active' : 'Inactive'}
        </span>
      );
    },
  },
];
```

### Step 7: Create Modal Component

**File**: `src/features/your-feature/components/YourFeatureModal.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { FloatingInput, FloatingDropdown, Button } from '../../../components/ui';
import { X } from 'lucide-react';
import { useAddYourFeature, useUpdateYourFeature } from '../hooks/useYourFeatureMutations';
import { YOUR_FEATURE_STATUS, STATUS_OPTIONS } from '../config/constants';
import type { YourFeatureItem } from '../../../services/yourApi';

interface YourFeatureModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingItem: YourFeatureItem | null;
}

export const YourFeatureModal: React.FC<YourFeatureModalProps> = ({
  open,
  onClose,
  onSuccess,
  editingItem,
}) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<string>(YOUR_FEATURE_STATUS.ACTIVE);
  const [error, setError] = useState<string | null>(null);

  const addMutation = useAddYourFeature();
  const updateMutation = useUpdateYourFeature();
  const isSubmitting = addMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      if (editingItem) {
        setName(editingItem.name || '');
        setStatus(
          editingItem.status === YOUR_FEATURE_STATUS.ACTIVE || editingItem.status === 'Active'
            ? YOUR_FEATURE_STATUS.ACTIVE
            : YOUR_FEATURE_STATUS.INACTIVE
        );
        // Set categoryId based on editingItem
      } else {
        setName('');
        setCategoryId('');
        setStatus(YOUR_FEATURE_STATUS.ACTIVE);
      }
      setError(null);
    }
  }, [open, editingItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          id: editingItem.id,
          name: name.trim(),
          categoryId: parseInt(categoryId),
          status: parseInt(status),
        });
        onSuccess();
      } else {
        await addMutation.mutateAsync({
          name: name.trim(),
          categoryId: parseInt(categoryId),
        });
        onSuccess();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save';
      setError(errorMessage);
    }
  };

  if (!open) return null;

  const statusOptions = STATUS_OPTIONS.filter(opt => opt.value !== YOUR_FEATURE_STATUS.ALL);

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50' onClick={onClose}>
      <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4' onClick={e => e.stopPropagation()}>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-xl font-semibold text-gray-900'>
            {editingItem ? 'Edit Item' : 'Add Item'}
          </h3>
          <button onClick={onClose} className='p-1 hover:bg-gray-100 rounded transition-colors'>
            <X className='w-5 h-5 text-gray-500' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <FloatingInput
            label='Name'
            value={name}
            onChange={setName}
            required
            error={!!(error && !name.trim())}
            errorMessage={error && !name.trim() ? error : undefined}
          />

          {/* Add other form fields */}

          {editingItem && (
            <FloatingDropdown
              label='Status'
              options={statusOptions}
              value={status}
              onChange={setStatus}
              required
            />
          )}

          <div className='flex justify-end space-x-3 mt-6'>
            <Button type='button' variant='outline' onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting} className='bg-green-600 hover:bg-green-700 text-white'>
              {isSubmitting ? 'Saving...' : editingItem ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

### Step 8: Create Main Page Component

**File**: `src/pages/YourFeature.tsx`

```typescript
import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader, Button, Pagination, Snackbar, FloatingDropdown } from '../components/ui';
import { Table } from '../components/ui/DataDisplay';
import { TableSkeleton, FilterSkeleton } from '../components/ui/Skeleton';
import { Plus } from 'lucide-react';
import { YourFeatureModal } from '../features/your-feature/components/YourFeatureModal';
import { useYourFeatureData } from '../features/your-feature/hooks/useYourFeatureData';
import { useURLFilters } from '../features/your-feature/hooks/useURLFilters';
import { getYourFeatureColumns } from '../features/your-feature/config/tableColumns';
import { STATUS_OPTIONS } from '../features/your-feature/config/constants';
import { useDebounce } from '../hooks/useDebounce';
import type { YourFeatureItem } from '../services/yourApi';

export const YourFeature: React.FC = () => {
  const { filters: urlFilters, updateFilters } = useURLFilters();
  const [pagination, setPagination] = useState({
    currentPage: urlFilters.page,
    totalPages: 1,
    totalItems: 0,
    pageSize: urlFilters.pageSize,
  });
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<YourFeatureItem | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    open: false,
    message: '',
    type: 'success',
  });

  // Debounce filters
  const debouncedFilter1 = useDebounce(urlFilters.filter1, 300);
  const debouncedFilter2 = useDebounce(urlFilters.filter2, 300);

  // Fetch data
  const {
    data: listingData,
    isLoading: loading,
    error: listingError,
  } = useYourFeatureData({
    page: pagination.currentPage,
    limit: pagination.pageSize,
    filter1: debouncedFilter1 ? parseInt(debouncedFilter1) : undefined,
    filter2: debouncedFilter2 ? parseInt(debouncedFilter2) : undefined,
    enabled: true,
  });

  // Sync pagination from URL
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      currentPage: urlFilters.page,
      pageSize: urlFilters.pageSize,
    }));
  }, [urlFilters.page, urlFilters.pageSize]);

  // Update pagination when data changes
  useEffect(() => {
    if (listingData?.pagination) {
      setPagination(prev => ({
        ...prev,
        totalPages: listingData.pagination!.totalPages,
        totalItems: listingData.pagination!.totalItems,
      }));
    }
  }, [listingData?.pagination]);

  // Show error snackbar
  useEffect(() => {
    if (listingError) {
      setSnackbar({
        open: true,
        message: 'Failed to load data',
        type: 'error',
      });
    }
  }, [listingError]);

  const handleAdd = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEdit = React.useCallback((item: YourFeatureItem) => {
    setEditingItem(item);
    setShowModal(true);
  }, []);

  const handleModalClose = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleModalSuccess = () => {
    setSnackbar({
      open: true,
      message: editingItem ? 'Item updated successfully' : 'Item added successfully',
      type: 'success',
    });
    setShowModal(false);
    setEditingItem(null);
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
    updateFilters({ page });
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setPagination(prev => ({ ...prev, pageSize: itemsPerPage, currentPage: 1 }));
    updateFilters({ pageSize: itemsPerPage, page: 1 });
  };

  const handleFilterChange = (key: 'filter1' | 'filter2', value: string) => {
    updateFilters({ [key]: value, page: 1 });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const columns = useMemo(
    () =>
      getYourFeatureColumns({
        pagination,
        onEdit: handleEdit,
      }),
    [pagination, handleEdit]
  );

  const tableData = (listingData?.data || []) as unknown as Record<string, unknown>[];

  return (
    <div className='min-h-screen bg-white p-4'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex items-center justify-between mb-6'>
          <PageHeader title='Your Feature' totalItems={pagination.totalItems} itemType='items' icon='📋' />
          <Button
            onClick={handleAdd}
            className='px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors'
          >
            <Plus className='w-4 h-4 mr-2' />
            Add Item
          </Button>
        </div>

        {/* Filter Section */}
        <div className='mb-6 flex w-full'>
          <div className='bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-lg p-4 flex w-full gap-3'>
            <div className='flex items-center gap-4 w-full'>
              <FloatingDropdown
                label='Filter 1'
                options={STATUS_OPTIONS}
                value={urlFilters.filter1}
                onChange={(value: string) => handleFilterChange('filter1', value)}
                placeholder='All'
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <TableSkeleton rows={pagination.pageSize} columns={4} />
        ) : (
          <Table columns={columns} data={tableData} loading={false} size='sm' />
        )}

        {/* Pagination */}
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.pageSize}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          className='mt-6'
        />

        {/* Modal */}
        {showModal && (
          <YourFeatureModal
            open={showModal}
            onClose={handleModalClose}
            onSuccess={handleModalSuccess}
            editingItem={editingItem}
          />
        )}

        {/* Snackbar */}
        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          open={snackbar.open}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        />
      </div>
    </div>
  );
};
```

### Step 9: Add Route

**File**: `src/config/routes.tsx`

```typescript
import { YourFeature } from '../pages/YourFeature';

// Add to routes array
{ path: '/your-feature', component: YourFeature },
```

### Step 10: Add Menu Item

**File**: `src/config/menuConfig.ts`

```typescript
{
  id: 'your-feature',
  name: 'Your Feature',
  icon: YourIcon,
  href: '/your-feature',
},
```

## Checklist

- [ ] Feature structure created
- [ ] Constants file with status options
- [ ] URL filters hook implemented
- [ ] Data fetching hook with React Query
- [ ] Mutations hook with optimistic updates
- [ ] Table columns config
- [ ] Modal component
- [ ] Main page component
- [ ] Route added
- [ ] Menu item added
- [ ] Debouncing applied to filters
- [ ] Loading skeletons implemented
- [ ] Error handling added

## Common Patterns

### Pattern 1: Filter with Debounce

```typescript
const debouncedFilter = useDebounce(urlFilters.filter, 300);
useYourFeatureData({ filter: debouncedFilter ? parseInt(debouncedFilter) : undefined });
```

### Pattern 2: Optimistic Update

```typescript
onMutate: async (newItem) => {
  await queryClient.cancelQueries({ queryKey: ['yourFeature', 'listing'] });
  const previousData = queryClient.getQueriesData({ queryKey: ['yourFeature', 'listing'] });
  queryClient.setQueriesData({ queryKey: ['yourFeature', 'listing'] }, (old) => {
    // Update cache optimistically
  });
  return { previousData };
},
onError: (err, newItem, context) => {
  // Rollback
  if (context?.previousData) {
    context.previousData.forEach(([queryKey, data]) => {
      queryClient.setQueryData(queryKey, data);
    });
  }
},
```

### Pattern 3: URL State Sync

```typescript
const updateFilters = useCallback((updates) => {
  const newParams = new URLSearchParams(searchParams);
  if (updates.filter) {
    if (updates.filter) {
      newParams.set('filter', updates.filter);
    } else {
      newParams.delete('filter');
    }
  }
  setSearchParams(newParams, { replace: true });
}, [searchParams, setSearchParams]);
```

## Tables and Filters Deep Dive

### Table Component Integration

The `Table` component from `src/components/ui/DataDisplay.tsx` is used for displaying data. Here's how it integrates:

**Basic Usage**:
```typescript
<Table 
  columns={columns} 
  data={tableData} 
  loading={false} 
  size='sm' 
/>
```

**Key Props**:
- `columns`: Array of column definitions (from `tableColumns.tsx`)
- `data`: Array of row data (from API response)
- `loading`: Boolean to show loading state (use skeleton instead)
- `size`: `'sm'` for compact tables

**Column Definition Structure**:
```typescript
interface TableColumn<T> {
  key: string;                    // Unique identifier
  title: string;                  // Column header text
  sortable?: boolean;             // Enable sorting
  align?: 'left' | 'center' | 'right'; // Text alignment
  width?: string;                 // Column width (e.g., '200px')
  render?: (value: unknown, record: T, index: number) => ReactNode;
  headerClassName?: string;       // Custom header styles
  cellClassName?: string;         // Custom cell styles
  fixed?: 'left' | 'right';       // Sticky column
}
```

### Filter Implementation Pattern

Filters are implemented using `FloatingDropdown` components with the following pattern:

**1. Filter State Management**:
```typescript
// Filters stored in URL via useURLFilters hook
const { filters: urlFilters, updateFilters } = useURLFilters();

// Debounce filter values to prevent rapid API calls
const debouncedFilter1 = useDebounce(urlFilters.filter1, 300);
const debouncedFilter2 = useDebounce(urlFilters.filter2, 300);
```

**2. Filter UI**:
```typescript
{/* Filter Section */}
<div className='mb-6 flex w-full'>
  <div className='bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-lg p-4 flex w-full gap-3'>
    <div className='flex items-center gap-4 w-full'>
      <FloatingDropdown
        label='Cost Category'
        options={[
          { value: '', label: 'All' },  // "All" option for clearing filter
          ...options.map(opt => ({
            value: String(opt.id),
            label: opt.name,
          })),
        ]}
        value={urlFilters.filter1}
        onChange={(value: string) => handleFilterChange('filter1', value)}
        loading={loadingOptions}
        placeholder='All Categories'
        error={!!error}
        errorMessage={error ? 'Failed to load options' : undefined}
      />
    </div>
  </div>
</div>
```

**3. Filter Change Handler**:
```typescript
const handleFilterChange = (key: 'filter1' | 'filter2', value: string) => {
  // Update URL params (triggers React Query refetch)
  updateFilters({ [key]: value, page: 1 });
  
  // Reset to page 1 when filter changes
  setPagination(prev => ({ ...prev, currentPage: 1 }));
};
```

**4. Filter Integration with API**:
```typescript
// Use debounced values in API call
const { data, isLoading } = useYourFeatureData({
  page: pagination.currentPage,
  limit: pagination.pageSize,
  filter1: debouncedFilter1 ? parseInt(debouncedFilter1) : undefined,
  filter2: debouncedFilter2 ? parseInt(debouncedFilter2) : undefined,
  enabled: true,
});

// React Query automatically refetches when queryKey changes
// queryKey includes: ['yourFeature', 'listing', page, limit, filter1 || 'all', filter2 ?? 'all']
```

### Filter Types and Patterns

#### Pattern 1: Dropdown Filter (Single Select)

**Use Case**: Status, Category, Type filters

```typescript
<FloatingDropdown
  label='Status'
  options={STATUS_OPTIONS}
  value={urlFilters.status}
  onChange={(value: string) => handleFilterChange('status', value)}
  placeholder='All Status'
/>
```

**Features**:
- Always include "All" option (`value: ''`) to clear filter
- Options come from constants or API
- Value stored in URL params

#### Pattern 2: Multi-Select Filter (Future Enhancement)

**Use Case**: Multiple categories selected at once

```typescript
// Not implemented yet, but pattern would be:
<MultiSelectDropdown
  label='Categories'
  options={categoryOptions}
  value={urlFilters.categories} // Array of IDs
  onChange={(values: string[]) => handleFilterChange('categories', values.join(','))}
/>
```

#### Pattern 3: Date Range Filter

**Use Case**: Filter by date range

```typescript
// Pattern from other features:
const [startDate, setStartDate] = useState('');
const [endDate, setEndDate] = useState('');

const debouncedStartDate = useDebounce(startDate, 300);
const debouncedEndDate = useDebounce(endDate, 300);

// Use in API call
useYourFeatureData({
  startDate: debouncedStartDate,
  endDate: debouncedEndDate,
});
```

### Table Column Patterns

#### Pattern 1: Actions Column

```typescript
{
  key: 'actions',
  title: 'Actions',
  sortable: false,
  align: 'center',
  render: (_value: unknown, row: Record<string, unknown>) => {
    return (
      <button
        onClick={() => onEdit(row as YourFeatureItem)}
        className='p-2 text-green-600 hover:bg-green-50 rounded transition-colors'
        title='Edit'
      >
        <Edit className='w-4 h-4' />
      </button>
    );
  },
}
```

#### Pattern 2: Serial Number Column

```typescript
{
  key: 'serial',
  title: '#',
  sortable: false,
  align: 'center',
  render: (_value: unknown, _row: Record<string, unknown>, index: number) => (
    <div className='font-semibold text-gray-600 text-center'>
      {(pagination.currentPage - 1) * pagination.pageSize + index + 1}
    </div>
  ),
}
```

#### Pattern 3: Status Badge Column

```typescript
{
  key: 'status',
  title: 'Status',
  sortable: true,
  align: 'center',
  render: (_value: unknown, row: Record<string, unknown>) => {
    const status = String(row.status || '');
    const isActive = isActiveStatus(status);
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${
          isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}
      >
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  },
}
```

#### Pattern 4: Formatted Number Column

```typescript
{
  key: 'amount',
  title: 'Amount',
  sortable: true,
  align: 'right',
  render: (value: unknown) => {
    const num = typeof value === 'number' ? value : parseFloat(String(value || 0));
    return (
      <div className='text-right font-medium'>
        {num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    );
  },
}
```

### Filter-to-Table Data Flow

```
User changes filter dropdown
    ↓
handleFilterChange() called
    ↓
updateFilters() updates URL params
    ↓
useDebounce() waits 300ms
    ↓
Debounced value changes
    ↓
useYourFeatureData() queryKey changes
    ↓
React Query detects queryKey change
    ↓
React Query refetches data
    ↓
Table receives new data via listingData
    ↓
Table re-renders with filtered data
```

### Filter Reset Pattern

**Reset filters to default**:
```typescript
const handleResetFilters = () => {
  updateFilters({
    filter1: '',
    filter2: '',
    page: 1,
  });
  setPagination(prev => ({ ...prev, currentPage: 1 }));
};
```

**Reset on page navigation**:
```typescript
// When navigating away and back, URL params are preserved
// Filters automatically restore from URL on mount
useEffect(() => {
  // Filters already loaded from URL via useURLFilters
  // No need to manually reset
}, []);
```

### Table Styling Patterns

**Font Sizing**:
```typescript
// First column (usually SL or Name) - slightly larger
cellClassName: 'text-xs'

// Other columns - smaller
// Applied via Table component's size='sm' prop
// Results in text-[11px] for data cells
```

**Header Styling**:
```typescript
// Headers are bold by default
// Center alignment for most columns
align: 'center'

// Custom header background colors (if needed)
headerClassName: 'bg-gray-50'
```

**Row Styling**:
```typescript
// Rows use font-normal (not bold)
// Applied via Table component
// Hover effects handled by Table component
```

### Filter Loading States

**Show skeleton while loading filter options**:
```typescript
{loadingCategories ? (
  <FilterSkeleton />
) : (
  <FloatingDropdown
    label='Cost Category'
    options={categoryOptions}
    // ...
  />
)}
```

**Show loading state on dropdown**:
```typescript
<FloatingDropdown
  label='Cost Category'
  options={categoryOptions}
  loading={loadingCategories}  // Shows spinner inside dropdown
  // ...
/>
```

### Table Loading States

**Show skeleton while loading table data**:
```typescript
{loading ? (
  <TableSkeleton rows={pagination.pageSize} columns={5} />
) : (
  <Table columns={columns} data={tableData} loading={false} size='sm' />
)}
```

**TableSkeleton Props**:
- `rows`: Number of skeleton rows to show (usually `pagination.pageSize`)
- `columns`: Number of columns (should match your column count)

### Filter Error Handling

**Show error in filter dropdown**:
```typescript
<FloatingDropdown
  label='Cost Category'
  options={categoryOptions}
  error={!!categoriesError}
  errorMessage={categoriesError ? 'Failed to load cost categories' : undefined}
  // ...
/>
```

**Show error snackbar for table data**:
```typescript
useEffect(() => {
  if (listingError) {
    setSnackbar({
      open: true,
      message: 'Failed to load data',
      type: 'error',
    });
  }
}, [listingError]);
```

## Best Practices

1. **Always use React Query** for data fetching
2. **Debounce filter changes** (300ms recommended)
3. **Store filters in URL** for shareability
4. **Use optimistic updates** for better UX
5. **Show skeletons** instead of generic spinners
6. **Extract constants** to config files
7. **Use TypeScript** for type safety
8. **Memoize expensive computations** (columns, filters)
9. **Handle errors gracefully** with rollback
10. **Follow the file structure** for consistency
11. **Always include "All" option** in filters to clear selection
12. **Reset to page 1** when filters change
13. **Use consistent column alignment** (center for most columns)
14. **Memoize column definitions** to prevent re-renders

---

**Reference**: See [Review Cost Type implementation](../14-Review-Cost-Type/) for a complete working example.

