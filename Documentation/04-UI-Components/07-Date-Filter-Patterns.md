# Date Filter Patterns Documentation

## Overview

This document provides comprehensive guidance for implementing date filters in the IB Dashboard application. Date filters are essential for data filtering and are used across multiple listing pages.

## 🎯 Date Filter Components

### FloatingInput with Date Type

The primary component for date filtering is `FloatingInput` with `type='date'`.

#### Interface Definition
```typescript
export interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date';
}
```

#### Basic Implementation
```tsx
import { FloatingInput } from '../components/ui/FloatingInput';

const DateFilterExample = () => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  return (
    <div className='flex gap-4'>
      <div className='w-56'>
        <FloatingInput 
          label='From Date' 
          type='date' 
          value={startDate} 
          onChange={setStartDate} 
        />
      </div>
      <div className='w-56'>
        <FloatingInput 
          label='To Date' 
          type='date' 
          value={endDate} 
          onChange={setEndDate} 
        />
      </div>
    </div>
  );
};
```

## 📅 Date Filter Patterns

### 1. **Date Range Filter (Most Common)**

Used for filtering data between two dates.

```tsx
const DateRangeFilter = () => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const handleSearch = () => {
    if (startDate && endDate) {
      // API call with date range
      fetchData({ start_date: startDate, end_date: endDate });
    }
  };

  return (
    <div className='bg-white p-4 shadow-sm rounded-lg flex flex-wrap gap-4 items-center mb-6'>
      <div className='w-56'>
        <FloatingInput 
          label='From Date' 
          type='date' 
          value={startDate} 
          onChange={setStartDate} 
        />
      </div>
      <div className='w-56'>
        <FloatingInput 
          label='To Date' 
          type='date' 
          value={endDate} 
          onChange={setEndDate} 
        />
      </div>
      <div className='ml-auto'>
        <SearchButton 
          onClick={handleSearch} 
          disabled={!startDate || !endDate}
        />
      </div>
    </div>
  );
};
```

### 2. **Single Date Filter**

Used for filtering data on a specific date.

```tsx
const SingleDateFilter = () => {
  const [selectedDate, setSelectedDate] = useState<string>('');

  const handleSearch = () => {
    if (selectedDate) {
      // API call with single date
      fetchData({ date: selectedDate });
    }
  };

  return (
    <div className='bg-white p-4 shadow-sm rounded-lg flex flex-wrap gap-4 items-center mb-6'>
      <div className='w-56'>
        <FloatingInput 
          label='Select Date' 
          type='date' 
          value={selectedDate} 
          onChange={setSelectedDate} 
        />
      </div>
      <div className='ml-auto'>
        <SearchButton 
          onClick={handleSearch} 
          disabled={!selectedDate}
        />
      </div>
    </div>
  );
};
```

### 3. **Date Range with Presets**

Combines date inputs with preset options for common ranges.

```tsx
const DateRangeWithPresets = () => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [preset, setPreset] = useState<string>('');

  const presets = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'thismonth', label: 'This Month' },
    { value: 'lastmonth', label: 'Last Month' }
  ];

  const handlePresetChange = (presetValue: string) => {
    setPreset(presetValue);
    
    const today = new Date();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    
    switch (presetValue) {
      case 'today':
        setStartDate(formatDate(today));
        setEndDate(formatDate(today));
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        setStartDate(formatDate(yesterday));
        setEndDate(formatDate(yesterday));
        break;
      case 'last7days':
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 7);
        setStartDate(formatDate(last7Days));
        setEndDate(formatDate(today));
        break;
      case 'last30days':
        const last30Days = new Date(today);
        last30Days.setDate(last30Days.getDate() - 30);
        setStartDate(formatDate(last30Days));
        setEndDate(formatDate(today));
        break;
      // Add more presets as needed
    }
  };

  return (
    <div className='bg-white p-4 shadow-sm rounded-lg flex flex-wrap gap-4 items-center mb-6'>
      <div className='w-56'>
        <FloatingDropdown
          label='Quick Select'
          options={presets}
          value={preset}
          onChange={handlePresetChange}
          placeholder='Select preset'
        />
      </div>
      <div className='w-56'>
        <FloatingInput 
          label='From Date' 
          type='date' 
          value={startDate} 
          onChange={setStartDate} 
        />
      </div>
      <div className='w-56'>
        <FloatingInput 
          label='To Date' 
          type='date' 
          value={endDate} 
          onChange={setEndDate} 
        />
      </div>
      <div className='ml-auto'>
        <SearchButton 
          onClick={() => fetchData({ start_date: startDate, end_date: endDate })}
          disabled={!startDate || !endDate}
        />
      </div>
    </div>
  );
};
```

## 🔧 State Management Patterns

### 1. **Local State Management**

For simple date filters without complex state requirements.

```tsx
const useDateFilter = () => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = startDate || endDate;

  return {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    resetFilters,
    hasActiveFilters
  };
};
```

### 2. **Redux State Management**

For complex applications with multiple filters and shared state.

```tsx
// Redux slice for date filters
interface DateFilterState {
  startDate: string;
  endDate: string;
  preset: string;
}

const dateFilterSlice = createSlice({
  name: 'dateFilter',
  initialState: {
    startDate: '',
    endDate: '',
    preset: ''
  } as DateFilterState,
  reducers: {
    setStartDate: (state, action: PayloadAction<string>) => {
      state.startDate = action.payload;
    },
    setEndDate: (state, action: PayloadAction<string>) => {
      state.endDate = action.payload;
    },
    setPreset: (state, action: PayloadAction<string>) => {
      state.preset = action.payload;
    },
    resetDateFilters: (state) => {
      state.startDate = '';
      state.endDate = '';
      state.preset = '';
    }
  }
});
```

### 3. **URL State Management**

For bookmarkable filters and browser history support.

```tsx
const useDateFilterURL = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const startDate = searchParams.get('start_date') || '';
  const endDate = searchParams.get('end_date') || '';

  const updateDateFilter = (start: string, end: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (start) newParams.set('start_date', start);
    else newParams.delete('start_date');
    if (end) newParams.set('end_date', end);
    else newParams.delete('end_date');
    
    setSearchParams(newParams);
  };

  return { startDate, endDate, updateDateFilter };
};
```

## 📊 API Integration Patterns

### 1. **Basic API Integration**

```tsx
const fetchDataWithDateFilter = async (startDate: string, endDate: string) => {
  try {
    setLoading(true);
    
    const response = await apiService.get('/data', {
      params: {
        start_date: startDate,
        end_date: endDate,
        page: 1,
        limit: 10
      }
    });
    
    setData(response.data);
  } catch (error) {
    console.error('Error fetching data:', error);
    setSnackbar({
      message: 'Failed to fetch data',
      type: 'error'
    });
  } finally {
    setLoading(false);
  }
};
```

### 2. **Debounced API Integration**

For real-time filtering with debounced API calls.

```tsx
import { useDebounce } from '../hooks/useDebounce';

const useDebouncedDateFilter = () => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  const debouncedStartDate = useDebounce(startDate, 500);
  const debouncedEndDate = useDebounce(endDate, 500);

  useEffect(() => {
    if (debouncedStartDate && debouncedEndDate) {
      fetchDataWithDateFilter(debouncedStartDate, debouncedEndDate);
    }
  }, [debouncedStartDate, debouncedEndDate]);

  return { startDate, endDate, setStartDate, setEndDate };
};
```

### 3. **Batch API Integration**

For multiple filters including date ranges.

```tsx
const fetchDataWithFilters = async (filters: {
  startDate: string;
  endDate: string;
  status?: string;
  category?: string;
}) => {
  const params = new URLSearchParams();
  
  if (filters.startDate) params.set('start_date', filters.startDate);
  if (filters.endDate) params.set('end_date', filters.endDate);
  if (filters.status) params.set('status', filters.status);
  if (filters.category) params.set('category', filters.category);
  
  const response = await apiService.get(`/data?${params.toString()}`);
  return response.data;
};
```

## 🎨 Styling Guidelines

### 1. **Consistent Layout**

```tsx
// Standard filter section layout
<div className='bg-white p-4 shadow-sm rounded-lg flex flex-wrap gap-4 items-center mb-6'>
  {/* Date inputs */}
  <div className='w-56'>
    <FloatingInput label='From Date' type='date' value={startDate} onChange={setStartDate} />
  </div>
  <div className='w-56'>
    <FloatingInput label='To Date' type='date' value={endDate} onChange={setEndDate} />
  </div>
  
  {/* Other filters */}
  <div className='w-56'>
    <FloatingDropdown label='Status' options={statusOptions} value={status} onChange={setStatus} />
  </div>
  
  {/* Search button */}
  <div className='ml-auto'>
    <SearchButton onClick={handleSearch} disabled={!startDate || !endDate} />
  </div>
</div>
```

### 2. **Responsive Design**

```tsx
// Responsive date filter layout
<div className='bg-white p-4 shadow-sm rounded-lg mb-6'>
  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end'>
    <div>
      <FloatingInput label='From Date' type='date' value={startDate} onChange={setStartDate} />
    </div>
    <div>
      <FloatingInput label='To Date' type='date' value={endDate} onChange={setEndDate} />
    </div>
    <div>
      <FloatingDropdown label='Status' options={statusOptions} value={status} onChange={setStatus} />
    </div>
    <div>
      <SearchButton onClick={handleSearch} disabled={!startDate || !endDate} />
    </div>
  </div>
</div>
```

## ✅ Validation Patterns

### 1. **Date Range Validation**

```tsx
const validateDateRange = (startDate: string, endDate: string): string | null => {
  if (!startDate || !endDate) return null;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start > end) {
    return 'Start date must be before end date';
  }
  
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > 365) {
    return 'Date range cannot exceed 365 days';
  }
  
  return null;
};
```

### 2. **Required Field Validation**

```tsx
const DateFilterWithValidation = () => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [errors, setErrors] = useState<{startDate?: string; endDate?: string}>({});

  const validateAndSearch = () => {
    const newErrors: {startDate?: string; endDate?: string} = {};
    
    if (!startDate) newErrors.startDate = 'Start date is required';
    if (!endDate) newErrors.endDate = 'End date is required';
    
    const rangeError = validateDateRange(startDate, endDate);
    if (rangeError) {
      newErrors.endDate = rangeError;
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      handleSearch();
    }
  };

  return (
    <div className='flex gap-4'>
      <div className='w-56'>
        <FloatingInput 
          label='From Date' 
          type='date' 
          value={startDate} 
          onChange={setStartDate}
          error={errors.startDate}
          required
        />
      </div>
      <div className='w-56'>
        <FloatingInput 
          label='To Date' 
          type='date' 
          value={endDate} 
          onChange={setEndDate}
          error={errors.endDate}
          required
        />
      </div>
    </div>
  );
};
```

## 🔄 Default Date Patterns

### 1. **Default to Today**

```tsx
const useDefaultToday = () => {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  
  return { startDate, endDate, setStartDate, setEndDate };
};
```

### 2. **Default to Last 30 Days**

```tsx
const useDefaultLast30Days = () => {
  const today = new Date();
  const last30Days = new Date(today);
  last30Days.setDate(last30Days.getDate() - 30);
  
  const [startDate, setStartDate] = useState<string>(last30Days.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(today.toISOString().split('T')[0]);
  
  return { startDate, endDate, setStartDate, setEndDate };
};
```

### 3. **Default to Current Month**

```tsx
const useDefaultCurrentMonth = () => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [startDate, setStartDate] = useState<string>(firstDayOfMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(today.toISOString().split('T')[0]);
  
  return { startDate, endDate, setStartDate, setEndDate };
};
```

## 🎯 Common Use Cases

### 1. **Transaction History**
- Filter transactions by date range
- Default to last 30 days
- Include preset options (Today, Yesterday, Last 7 Days, etc.)

### 2. **Report Generation**
- Date range selection for reports
- Validation for maximum range (e.g., 1 year)
- Export functionality with selected dates

### 3. **Analytics Dashboard**
- Date range for chart data
- Real-time updates with date changes
- Multiple date ranges for comparison

### 4. **Audit Logs**
- Filter logs by date range
- Default to current month
- Include time-based presets

## 🚀 Best Practices

### 1. **User Experience**
- Always provide default dates
- Include preset options for common ranges
- Show validation errors clearly
- Disable search button when dates are invalid

### 2. **Performance**
- Use debouncing for real-time filtering
- Implement proper loading states
- Cache API responses when possible
- Optimize date calculations

### 3. **Accessibility**
- Provide clear labels for date inputs
- Support keyboard navigation
- Include proper ARIA attributes
- Ensure sufficient color contrast

### 4. **Data Handling**
- Use consistent date formats (YYYY-MM-DD)
- Handle timezone considerations
- Validate date ranges on both client and server
- Provide meaningful error messages

## 🔗 Related Documentation

- **Form Components**: [01-Form-Components.md](./01-Form-Components.md) - FloatingInput component details
- **Universal Listing Template**: [05-Universal-Listing-Page-Template.md](./05-Universal-Listing-Page-Template.md) - Complete listing page patterns
- **API Integration**: [03-API-Integration.md](../01-Architecture/03-API-Integration.md) - API service patterns

## 📝 Migration Guide

When implementing date filters in existing components:

1. **Identify the data source** and determine date field names
2. **Choose the appropriate pattern** (single date, date range, with presets)
3. **Implement state management** (local, Redux, or URL-based)
4. **Add validation** for date ranges and required fields
5. **Integrate with API** using proper parameter formatting
6. **Test with different date ranges** and edge cases
7. **Add accessibility features** for screen readers
8. **Implement responsive design** for mobile devices

This comprehensive guide ensures consistent and effective date filtering across the IB Dashboard application.
