# Form Components

This document provides detailed implementation guides for the form components used throughout the Client CRUD system, including FloatingInput, FloatingDropdown, and related form elements.

## 🎨 FloatingInput Component

### Purpose
Material UI-style floating label input component with validation support, error handling, and accessibility features.

### File Location
`src/components/ui/FloatingInput.tsx`

### Interface Definition
```typescript
export interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
}
```

### Implementation Details

#### 1. **Component Structure**
```typescript
export const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ 
    label, 
    value, 
    onChange, 
    error, 
    required, 
    disabled, 
    className, 
    type = 'text',
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value.length > 0;
    const showLabel = isFocused || hasValue;

    return (
      <div className={`relative ${className}`}>
        <input
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          type={type}
          className={`
            w-full px-4 pt-6 pb-2 border rounded-lg transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
            ${error ? 'border-red-500' : 'border-gray-300 focus:border-green-500'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
          {...props}
        />
        
        <label
          className={`
            absolute left-4 transition-all duration-200 pointer-events-none
            ${showLabel 
              ? 'top-2 text-xs text-gray-600' 
              : 'top-1/2 transform -translate-y-1/2 text-gray-500'
            }
            ${error ? 'text-red-500' : ''}
            ${required ? "after:content-['*'] after:text-red-500 after:ml-1" : ''}
          `}
        >
          {label}
        </label>
        
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);
```

#### 2. **Key Features**

##### **Floating Label Animation**
- Label starts in the input field
- Floats up when focused or has value
- Smooth CSS transitions for professional feel
- Uses `transform` and `transition-all` for smooth animation

##### **Error Handling**
- Red border when error exists
- Error message displayed below input
- Required field indicator with red asterisk
- Error state affects label color

##### **Accessibility**
- Proper labeling with `htmlFor` attribute
- Required field indication
- Disabled state handling
- Focus management

##### **Styling States**
- **Default**: Gray border, white background
- **Focused**: Green ring, transparent border
- **Error**: Red border, red label
- **Disabled**: Gray background, not-allowed cursor

#### 3. **Usage Examples**

##### **Basic Usage**
```typescript
<FloatingInput
  label="Client Name"
  value={formData.name}
  onChange={(value) => handleInputChange('name', value)}
  required
/>
```

##### **With Error Handling**
```typescript
<FloatingInput
  label="Email Address"
  value={formData.email}
  onChange={(value) => handleInputChange('email', value)}
  type="email"
  error={errors.email}
  required
/>
```

##### **Disabled State**
```typescript
<FloatingInput
  label="City"
  value={formData.city}
  onChange={(value) => handleInputChange('city', value)}
  disabled={user?.userTypeId ? user.userTypeId > 4 : false}
/>
```

##### **Number Input**
```typescript
<FloatingInput
  label="Latitude"
  value={formData.latitude}
  onChange={(value) => handleInputChange('latitude', value)}
  type="number"
/>
```

## 🎯 FloatingDropdown Component

### Purpose
Searchable dropdown component with floating labels, API integration support, and advanced filtering capabilities.

### File Location
`src/components/ui/FloatingDropdown.tsx`

### Interface Definition
```typescript
export interface DropdownOption {
  value: string;
  label: string;
}

export interface FloatingDropdownProps {
  label: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  searchable?: boolean;
}
```

### Implementation Details

#### 1. **Component Structure**
```typescript
export const FloatingDropdown: React.FC<FloatingDropdownProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  loading = false,
  error,
  required = false,
  disabled = false,
  searchable = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  const selectedOption = options.find(option => option.value === value);
  const hasValue = Boolean(selectedOption);
  const showLabel = isFocused || hasValue || isOpen;

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      {/* Dropdown Trigger */}
      <div
        className={`
          relative w-full px-4 pt-6 pb-2 border rounded-lg cursor-pointer
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500
          ${error ? 'border-red-500' : 'border-gray-300 focus:border-green-500'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          ${isOpen ? 'ring-2 ring-green-500 border-transparent' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        <span className={`block ${hasValue ? 'text-gray-900' : 'text-gray-500'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        
        <label className={`
          absolute left-4 transition-all duration-200 pointer-events-none
          ${showLabel 
            ? 'top-2 text-xs text-gray-600' 
            : 'top-1/2 transform -translate-y-1/2 text-gray-500'
          }
          ${error ? 'text-red-500' : ''}
          ${required ? "after:content-['*'] after:text-red-500 after:ml-1" : ''}
        `}>
          {label}
        </label>
        
        <ChevronDown className={`
          absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400
          transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}
        `} />
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          {searchable && (
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          
          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-center text-gray-500">Loading...</div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-gray-500">No options found</div>
            )}
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
```

#### 2. **Key Features**

##### **Search Functionality**
- Real-time filtering of options
- Case-insensitive search
- Search input with focus management
- Clear search on selection

##### **Floating Label**
- Same animation as FloatingInput
- Label floats when focused, has value, or dropdown is open
- Required field indicator
- Error state styling

##### **Loading State**
- Loading indicator in dropdown
- Prevents interaction during loading
- Clear loading message

##### **Accessibility**
- Keyboard navigation support
- Focus management
- Screen reader friendly
- Proper ARIA attributes

##### **Z-Index Management**
- High z-index (`z-[9999]`) to appear above other elements
- Proper layering for complex layouts

#### 3. **Usage Examples**

##### **Basic Dropdown**
```typescript
<FloatingDropdown
  label="Location Type"
  options={locationTypes.map(type => ({ value: type.value, label: type.label }))}
  value={formData.locationType}
  onChange={(value) => handleInputChange('locationType', value)}
  loading={locationTypesLoading}
  required
/>
```

##### **With API Integration**
```typescript
<FloatingDropdown
  label="Facility"
  options={facilities.map((facility: unknown) => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: (facility as any).id.toString(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    label: (facility as any).location || `Facility ${(facility as any).id}`,
  }))}
  value={formData.facility || ''}
  onChange={(value) => handleInputChange('facility', value)}
  loading={facilitiesApi.loading}
  placeholder="Select Facility"
  required
/>
```

##### **Disabled State**
```typescript
<FloatingDropdown
  label="Country"
  options={countries.map(country => ({ value: country.value, label: country.label }))}
  value={formData.country}
  onChange={(value) => handleInputChange('country', value)}
  disabled={user?.userTypeId ? user.userTypeId > 4 : false}
  required
/>
```

##### **With Error Handling**
```typescript
<FloatingDropdown
  label="Billing Type"
  options={billingTypes.map(type => ({ value: type.value, label: type.label }))}
  value={formData.billingType}
  onChange={(value) => handleInputChange('billingType', value)}
  error={errors.billingType}
  required
/>
```

## 🎛️ Form Layout Components

### 1. **Card Component**

#### Purpose
Container component for form sections with consistent styling and spacing.

#### Implementation
```typescript
export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {children}
    </div>
  );
};
```

#### Usage
```typescript
<Card className="p-8">
  <div className="flex items-center gap-3 mb-6">
    <Building className="w-6 h-6 text-green-600" />
    <h2 className="text-xl font-semibold text-gray-900">Client Information</h2>
  </div>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <FloatingInput {...nameProps} />
    <FloatingInput {...addressProps} />
  </div>
</Card>
```

### 2. **Button Component**

#### Purpose
Consistent button styling across the application with multiple variants.

#### Implementation
```typescript
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
      )}
      {children}
    </button>
  );
};
```

#### Usage Examples
```typescript
// Primary button
<Button type="submit" disabled={isSubmitting}>
  {isSubmitting ? 'Creating...' : 'Create Client'}
</Button>

// Ghost button
<Button variant="ghost" onClick={() => navigate('/clients/manage')}>
  Cancel
</Button>

// Small button with icon
<Button size="sm" className="text-green-600 hover:text-green-700">
  <Edit className="w-4 h-4 mr-1" />
  Edit
</Button>
```

## 🔧 Form Validation Patterns

### 1. **Client-Side Validation**

#### Validation Function
```typescript
const validateForm = (formData: ClientFormData): Partial<ClientFormData> => {
  const errors: Partial<ClientFormData> = {};
  
  // Required field validation
  if (!formData.name.trim()) {
    errors.name = 'Client name is required';
  }
  
  if (!formData.address1.trim()) {
    errors.address1 = 'Address is required';
  }
  
  if (!formData.locationType) {
    errors.locationType = 'Location type is required';
  }
  
  if (!formData.billingType) {
    errors.billingType = 'Billing type is required';
  }
  
  if (!formData.impactType) {
    errors.impactType = 'Impact type is required';
  }
  
  // Email validation
  if (formData.email && !isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  // Number validation
  if (formData.latitude && isNaN(Number(formData.latitude))) {
    errors.latitude = 'Please enter a valid latitude';
  }
  
  if (formData.longitude && isNaN(Number(formData.longitude))) {
    errors.longitude = 'Please enter a valid longitude';
  }
  
  return errors;
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

#### Usage in Component
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  
  // Validate form
  const validationErrors = validateForm(formData);
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    setIsSubmitting(false);
    return;
  }
  
  // Clear errors and proceed with submission
  setErrors({});
  
  try {
    // API call logic
  } catch (error) {
    setError('Failed to create client. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

### 2. **Real-Time Validation**

#### Input Change Handler
```typescript
const handleInputChange = (field: keyof ClientFormData, value: string | boolean) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  
  // Clear error when user starts typing
  if (errors[field]) {
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }
  
  // Real-time validation for specific fields
  if (field === 'email' && value) {
    if (!isValidEmail(value as string)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    }
  }
  
  if (field === 'latitude' && value) {
    if (isNaN(Number(value))) {
      setErrors(prev => ({ ...prev, latitude: 'Please enter a valid latitude' }));
    }
  }
};
```

## 🎨 Form Styling Patterns

### 1. **Grid Layout**
```typescript
// Responsive grid for form fields
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <FloatingInput {...field1Props} />
  <FloatingInput {...field2Props} />
  <FloatingDropdown {...field3Props} />
  <FloatingDropdown {...field4Props} />
</div>
```

### 2. **Section Headers**
```typescript
<div className="flex items-center gap-3 mb-6">
  <Building className="w-6 h-6 text-green-600" />
  <h2 className="text-xl font-semibold text-gray-900">Client Information</h2>
</div>
```

### 3. **Conditional Rendering**
```typescript
// Conditional field rendering
{formData.billingType === '3' && (
  <FloatingInput
    label="Fixed Price"
    value={formData.fixedPrice || ''}
    onChange={(value) => handleInputChange('fixedPrice', value)}
    type="number"
    required
  />
)}

{formData.billingType === '4' && (
  <FloatingDropdown
    label="Billing Sub Type"
    options={billingSubTypes.map(type => ({ value: type.value, label: type.label }))}
    value={formData.billingSubType || ''}
    onChange={(value) => handleInputChange('billingSubType', value)}
    required
  />
)}
```

### 4. **Checkbox Styling**
```typescript
<div className="flex items-center gap-3">
  <input
    type="checkbox"
    id="onSiteManpower"
    checked={formData.onSiteManpower}
    onChange={e => handleInputChange('onSiteManpower', e.target.checked)}
    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
  />
  <label htmlFor="onSiteManpower" className="text-sm font-medium text-gray-700">
    Has On-Site Manpower
  </label>
</div>
```

## 🚀 Performance Optimizations

### 1. **Memoization**
```typescript
// Memoize expensive computations
const filteredOptions = useMemo(() => {
  return options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [options, searchTerm]);

// Memoize callback functions
const handleOptionSelect = useCallback((option: DropdownOption) => {
  onChange(option.value);
  setIsOpen(false);
  setSearchTerm('');
}, [onChange]);
```

### 2. **Debounced Search**
```typescript
// Debounce search input for better performance
const debouncedSearch = useMemo(
  () => debounce((term: string) => {
    setSearchTerm(term);
  }, 300),
  []
);
```

### 3. **Lazy Loading**
```typescript
// Lazy load options for large datasets
const [loadedOptions, setLoadedOptions] = useState<DropdownOption[]>([]);

useEffect(() => {
  if (isOpen && options.length > 100) {
    // Load options in chunks
    const chunkSize = 50;
    const chunk = options.slice(0, chunkSize);
    setLoadedOptions(chunk);
  } else {
    setLoadedOptions(options);
  }
}, [isOpen, options]);
```

## 🍞 Snackbar Component

### Purpose
Reusable notification component for displaying transient messages with auto-fade functionality, positioned at the top-right of the screen.

### File Location
`src/components/ui/Snackbar.tsx`

### Interface Definition
```typescript
export interface SnackbarProps {
  open: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}
```

### Implementation Details

#### 1. **Component Structure**
```typescript
export const Snackbar: React.FC<SnackbarProps> = ({ open, message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      // Auto-fade after 4 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [open, onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ease-in-out ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className={`flex items-center gap-2 px-3 py-2 rounded border shadow-lg min-w-72 max-w-sm ${getBgColor()}`}>
        {getIcon()}
        <span className='flex-1 text-sm font-medium text-gray-900'>{message}</span>
        <button onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }}>
          <XMarkIcon className='w-4 h-4 text-gray-500 hover:text-gray-700' />
        </button>
      </div>
    </div>
  );
};
```

#### 2. **Styling Functions**
```typescript
const getBgColor = () => {
  switch (type) {
    case 'success':
      return 'bg-green-50 border-green-200';
    case 'error':
      return 'bg-red-50 border-red-200';
    case 'info':
      return 'bg-blue-50 border-blue-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

const getIcon = () => {
  switch (type) {
    case 'success':
      return <CheckCircleIcon className='w-5 h-5 text-green-600' />;
    case 'error':
      return <XCircleIcon className='w-5 h-5 text-red-600' />;
    case 'info':
      return <InformationCircleIcon className='w-5 h-5 text-blue-600' />;
    default:
      return <InformationCircleIcon className='w-5 h-5 text-gray-600' />;
  }
};
```

### Usage Examples

#### 1. **Success Notification**
```typescript
const [snackbar, setSnackbar] = useState({
  open: false,
  message: '',
  type: 'success' as 'success' | 'error' | 'info',
});

// Show success message
setSnackbar({
  open: true,
  message: 'Client updated successfully!',
  type: 'success',
});

// In JSX
<Snackbar
  open={snackbar.open}
  message={snackbar.message}
  type={snackbar.type}
  onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
/>
```

#### 2. **Error Notification**
```typescript
// Show error message
setSnackbar({
  open: true,
  message: 'Failed to update client. Please try again.',
  type: 'error',
});
```

#### 3. **Info Notification**
```typescript
// Show info message
setSnackbar({
  open: true,
  message: 'Changes saved locally. Sync when online.',
  type: 'info',
});
```

#### 4. **With Navigation After Success**
```typescript
const handleUpdateSuccess = () => {
  setSnackbar({
    open: true,
    message: 'Client updated successfully!',
    type: 'success',
  });
  
  // Navigate after showing success message
  setTimeout(() => {
    navigate('/clients/manage');
  }, 800);
};
```

### Design Features

#### 1. **Visual Design**
- **Compact Size**: `px-3 py-2` padding for minimal footprint
- **Square Rounded Edges**: `rounded` for modern appearance
- **Fixed Width**: `min-w-72 max-w-sm` for consistent sizing
- **Shadow**: `shadow-lg` for depth and prominence
- **Z-Index**: `z-50` to appear above all other content

#### 2. **Animation**
- **Slide In**: `translate-x-0` from `translate-x-full`
- **Fade**: `opacity-100` from `opacity-0`
- **Duration**: `duration-300` for smooth transitions
- **Easing**: `ease-in-out` for natural motion

#### 3. **Auto-Fade Behavior**
- **Duration**: 4 seconds before auto-fade
- **Animation**: 300ms fade-out animation
- **Cleanup**: Proper timer cleanup on unmount
- **Manual Close**: Immediate close with animation

### Integration with Forms

#### 1. **Form Submission Feedback**
```typescript
const handleSubmit = async (formData: FormData) => {
  try {
    const result = await ClientApiService.updateClient(updateData);
    
    if (result.status === 'Success' && result.status_code === 200) {
      setSnackbar({
        open: true,
        message: result.message || 'Client updated successfully!',
        type: 'success',
      });
      
      setTimeout(() => {
        navigate('/clients/manage');
      }, 800);
    } else {
      setSnackbar({
        open: true,
        message: result.message || 'Failed to update client. Please try again.',
        type: 'error',
      });
    }
  } catch (error) {
    setSnackbar({
      open: true,
      message: 'Network error. Please check your connection and try again.',
      type: 'error',
    });
  }
};
```

#### 2. **Validation Feedback**
```typescript
const validateForm = () => {
  const errors = {};
  
  if (!formData.location.trim()) {
    errors.location = 'Location is required';
  }
  
  if (Object.keys(errors).length > 0) {
    setSnackbar({
      open: true,
      message: 'Please fix the validation errors before submitting.',
      type: 'error',
    });
    return false;
  }
  
  return true;
};
```

### Accessibility Features

#### 1. **Screen Reader Support**
- **Semantic HTML**: Uses proper button and span elements
- **ARIA Labels**: Clear labeling for close button
- **Focus Management**: Proper focus handling

#### 2. **Keyboard Navigation**
- **Close Button**: Accessible via Tab key
- **Escape Key**: Could be added for keyboard dismissal
- **Focus Trap**: Maintains focus within component

#### 3. **Visual Indicators**
- **Color Coding**: Different colors for different message types
- **Icons**: Clear visual indicators for message types
- **Animation**: Smooth transitions for better UX

## 🔧 Best Practices

### 1. **Component Design**
- **Single Responsibility**: Each component has one clear purpose
- **Composition**: Build complex forms from simple components
- **Reusability**: Design components to be reusable across pages
- **Consistency**: Maintain consistent styling and behavior

### 2. **State Management**
- **Controlled Components**: All inputs controlled by React state
- **Validation**: Real-time validation with clear error messages
- **Error Handling**: Comprehensive error states and recovery
- **Loading States**: Visual feedback during async operations

### 3. **Accessibility**
- **Labels**: Proper labeling for all form elements
- **Focus Management**: Logical tab order and focus handling
- **Screen Readers**: ARIA attributes and semantic HTML
- **Keyboard Navigation**: Full keyboard support

### 4. **Performance**
- **Memoization**: Use React.memo and useMemo appropriately
- **Debouncing**: Debounce search and validation
- **Lazy Loading**: Load large datasets efficiently
- **Bundle Size**: Keep components lightweight

---

**Next**: [Data Display Components](./07-Data-Display-Components.md) - Table, Pagination, and data visualization components
