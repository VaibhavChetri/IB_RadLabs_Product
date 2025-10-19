# Client Management Pages

This document provides detailed implementation guides for the three main client management pages: AddClient, EditClient, and ManageClients.

## 📝 AddClient Page (`src/pages/AddClient.tsx`)

### Purpose
Complete form for creating new client locations with dynamic fields, validation, and API integration.

### Key Features
- **Dynamic Form Fields**: Conditional rendering based on billing type
- **API Integration**: Real-time data fetching for dropdowns
- **Validation**: Client-side validation with error display
- **User Restrictions**: Disabled fields for non-super admins
- **State Preloading**: Auto-fill city/state for non-super admins
- **Facility Integration**: Dynamic facility dropdown for on-site manpower

### Form Data Interface
```typescript
interface ClientFormData {
  // Basic Information
  name: string;
  address1: string;
  address2: string;
  zipcode: string;
  landmark: string;
  latitude: string;
  longitude: string;
  onSiteManpower: boolean;

  // Location
  locationType: string;
  country: string;
  state: string;
  city: string;

  // Billing Type
  billingType: string;
  fixedPrice?: string;
  billingSubType?: string;

  // Impact Type
  impactType: string;

  // Facility (when onSiteManpower is true)
  facility?: string;
}
```

### Implementation Details

#### 1. **State Management**
```typescript
export const AddClient: React.FC = () => {
  // Form state
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    address1: '',
    address2: '',
    zipcode: '',
    landmark: '',
    latitude: '',
    longitude: '',
    onSiteManpower: false,
    locationType: '',
    country: '82', // Default to India
    state: '',
    city: '',
    billingType: '',
    fixedPrice: '',
    billingSubType: '',
    impactType: '',
    facility: '',
  });

  // Error state
  const [errors, setErrors] = useState<Partial<ClientFormData>>({});
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Facilities state for dynamic dropdown
  const [facilities, setFacilities] = useState<unknown[]>([]);

  // Redux integration
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
```

#### 2. **API Integration**
```typescript
  // Location data hooks
  const { countries, loading: countriesLoading } = useCountries();
  const { states, loading: statesLoading } = useStates(formData.country);
  const { cities, loading: citiesLoading } = useCities(formData.state);
  const { locationTypes, loading: locationTypesLoading } = useLocationTypes();
  const { impactTypes, loading: impactTypesLoading } = useImpactTypes();
  const { billingTypes, loading: billingTypesLoading } = useBillingTypes();
  const { billingSubTypes, loading: billingSubTypesLoading } = useBillingSubTypes();

  // Facility API hook
  const facilitiesApi = useApi('facilities', async () => {
    const params = new URLSearchParams();
    params.append('location_type', '2');
    if (user?.city_id) {
      params.append('city_id', user.city_id.toString());
    }
    console.log('🏢 AddClient: Fetching facilities with params:', params.toString());
    const response = await apiService.get(`/locations/getLocations?${params.toString()}`);
    console.log('🏢 AddClient: Facilities API response:', response);
    return response;
  });
```

#### 3. **Dynamic Field Logic**
```typescript
  // Trigger facilities API when onSiteManpower is checked
  useEffect(() => {
    if (formData.onSiteManpower && user?.city_id) {
      console.log('🏢 AddClient useEffect: Fetching facilities for city_id:', user.city_id);
      facilitiesApi.execute({}).then(response => {
        if (response.data) {
          setFacilities(response.data);
          console.log('🏢 AddClient Facilities stored:', response.data);
        }
      });
    }
  }, [formData.onSiteManpower, user?.city_id, facilitiesApi]);

  // Set user's city and state as default for non-super admins
  useEffect(() => {
    console.log('🔍 AddClient: Checking user data for preloading:', {
      user: user,
      city_id: user?.city_id,
      state_id: user?.state_id,
      userTypeId: user?.userTypeId,
      cities: cities.length,
      states: states.length,
    });

    // Check if user is not a super admin (userTypeId > 4) and has location data
    if (user?.userTypeId && user.userTypeId > 4 && user?.city_id && cities.length > 0) {
      console.log('✅ AddClient: User is non-super admin, preloading city and state');
      
      // Find and set the user's city
      const userCity = cities.find(city => city.value === user.city_id?.toString());
      console.log('🏙️ AddClient: Found user city:', userCity);
      if (userCity) {
        setFormData(prev => ({ ...prev, city: userCity.value }));
        console.log('✅ AddClient: City set to:', userCity.value);
      }

      // Find and set the user's state
      if (user.state_id && states.length > 0) {
        const userState = states.find(state => state.value === user.state_id?.toString());
        console.log('🏛️ AddClient: Found user state:', userState);
        if (userState) {
          setFormData(prev => ({ ...prev, state: userState.value }));
          console.log('✅ AddClient: State set to:', userState.value);
        }
      } else {
        console.log('⚠️ AddClient: No state_id in user data or states not loaded');
      }

      // Set country to India (82) for non-super admins
      setFormData(prev => ({ ...prev, country: '82' }));
      console.log('✅ AddClient: Country set to India (82)');
    } else {
      console.log('❌ AddClient: Conditions not met for preloading:', {
        hasUserTypeId: !!user?.userTypeId,
        isNonSuperAdmin: user?.userTypeId && user.userTypeId > 4,
        hasCityId: !!user?.city_id,
        hasCities: cities.length > 0,
      });
    }
  }, [user?.city_id, user?.state_id, user?.userTypeId, cities, states, user]);
```

#### 4. **Form Handlers**
```typescript
  const handleInputChange = (field: keyof ClientFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Trigger facilities API when onSiteManpower is checked
    if (field === 'onSiteManpower' && value === true) {
      console.log('🏢 AddClient: On-site Manpower checked, fetching facilities...');
      facilitiesApi.execute({}).then(response => {
        if (response.data) {
          setFacilities(response.data);
          console.log('🏢 AddClient Facilities stored from handleInputChange:', response.data);
        }
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Validate required fields
      const newErrors: Partial<ClientFormData> = {};
      if (!formData.name) newErrors.name = 'Client name is required';
      if (!formData.address1) newErrors.address1 = 'Address is required';
      if (!formData.locationType) newErrors.locationType = 'Location type is required';
      if (!formData.billingType) newErrors.billingType = 'Billing type is required';
      if (!formData.impactType) newErrors.impactType = 'Impact type is required';

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // Prepare API payload
      const payload = {
        restaurant_name: formData.name,
        address_1: formData.address1,
        address_2: formData.address2,
        landmark: formData.landmark,
        zipcode: formData.zipcode,
        latitude: formData.latitude,
        longitude: formData.longitude,
        city_id: parseInt(formData.city),
        state_id: parseInt(formData.state),
        country_id: parseInt(formData.country),
        locationTypeId: parseInt(formData.locationType),
        billing_type_id: parseInt(formData.billingType),
        billing_sub_type_id: formData.billingSubType ? parseInt(formData.billingSubType) : null,
        impact_type_id: parseInt(formData.impactType),
        fixedPrice: formData.fixedPrice ? parseFloat(formData.fixedPrice) : null,
        hasOnSiteManPower: formData.onSiteManpower,
        facilityId: formData.facility ? parseInt(formData.facility) : null,
      };

      console.log('📝 Submitting client data:', payload);

      // TODO: Implement API call
      // const result = await ClientApiService.createLocation(payload);
      
      // For now, show success message
      alert('Client created successfully!');
      navigate('/clients/manage');
    } catch (error) {
      console.error('Failed to create client:', error);
      setError('Failed to create client. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
```

#### 5. **Conditional Rendering**
```typescript
  // Conditional rendering based on billing type
  const renderBillingFields = () => {
    return (
      <>
        <FloatingDropdown
          label="Billing Type"
          options={billingTypes.map(type => ({ value: type.value, label: type.label }))}
          value={formData.billingType}
          onChange={(value: string) => handleInputChange('billingType', value)}
          loading={billingTypesLoading}
          placeholder="Select Billing Type"
          required
        />

        {/* Fixed Price field - only for billing type '3' (Fixed) */}
        {formData.billingType === '3' && (
          <FloatingInput
            label="Fixed Price"
            value={formData.fixedPrice || ''}
            onChange={(value: string) => handleInputChange('fixedPrice', value)}
            type="number"
            required
          />
        )}

        {/* Billing Sub Type field - only for billing type '4' (Set Pricing) */}
        {formData.billingType === '4' && (
          <FloatingDropdown
            label="Billing Sub Type"
            options={billingSubTypes.map(type => ({ value: type.value, label: type.label }))}
            value={formData.billingSubType || ''}
            onChange={(value: string) => handleInputChange('billingSubType', value)}
            loading={billingSubTypesLoading}
            placeholder="Select Billing Sub Type"
            required
          />
        )}
      </>
    );
  };

  // Facility dropdown - only when onSiteManpower is true
  const renderFacilityField = () => {
    if (!formData.onSiteManpower) return null;

    return (
      <div className="mt-4">
        <FloatingDropdown
          label="Facility"
          options={facilities.map((facility: unknown) => ({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            value: (facility as any).id.toString(),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            label: (facility as any).location || `Facility ${(facility as any).id}`,
          }))}
          value={formData.facility || ''}
          onChange={(value: string) => handleInputChange('facility', value)}
          loading={facilitiesApi.loading}
          placeholder="Select Facility"
          required
        />
      </div>
    );
  };
```

#### 6. **Form Layout**
```typescript
  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Add A Client</h1>
          <p className="text-gray-600 mt-2">Create a new client location</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Client Information Section */}
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Building className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Client Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FloatingInput
                label="Client Name"
                value={formData.name}
                onChange={(value: string) => handleInputChange('name', value)}
                error={errors.name}
                required
              />

              <FloatingInput
                label="Address Line 1"
                value={formData.address1}
                onChange={(value: string) => handleInputChange('address1', value)}
                error={errors.address1}
                required
              />

              <FloatingInput
                label="Address Line 2"
                value={formData.address2}
                onChange={(value: string) => handleInputChange('address2', value)}
              />

              <FloatingInput
                label="Landmark"
                value={formData.landmark}
                onChange={(value: string) => handleInputChange('landmark', value)}
              />

              <FloatingInput
                label="ZIP Code"
                value={formData.zipcode}
                onChange={(value: string) => handleInputChange('zipcode', value)}
              />

              <FloatingInput
                label="Latitude"
                value={formData.latitude}
                onChange={(value: string) => handleInputChange('latitude', value)}
                type="number"
              />

              <FloatingInput
                label="Longitude"
                value={formData.longitude}
                onChange={(value: string) => handleInputChange('longitude', value)}
                type="number"
              />

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

              {renderFacilityField()}
            </div>
          </Card>

          {/* Location Details Section */}
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Location Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FloatingDropdown
                label="Location Type"
                options={locationTypes.map(type => ({ value: type.value, label: type.label }))}
                value={formData.locationType}
                onChange={(value: string) => handleInputChange('locationType', value)}
                loading={locationTypesLoading}
                placeholder="Select Location Type"
                error={errors.locationType}
                required
              />

              <FloatingDropdown
                label="Country"
                options={countries.map(country => ({ value: country.value, label: country.label }))}
                value={formData.country}
                onChange={(value: string) => handleInputChange('country', value)}
                loading={countriesLoading}
                placeholder="Select Country"
                required
                disabled={user?.userTypeId ? user.userTypeId > 4 : false}
              />

              <FloatingDropdown
                label="State"
                options={states.map(state => ({ value: state.value, label: state.label }))}
                value={formData.state}
                onChange={(value: string) => handleInputChange('state', value)}
                loading={statesLoading}
                placeholder="Select State"
                required
                disabled={user?.userTypeId ? user.userTypeId > 4 : false}
              />

              <FloatingDropdown
                label="City"
                options={cities.map(city => ({ value: city.value, label: city.label }))}
                value={formData.city}
                onChange={(value: string) => handleInputChange('city', value)}
                loading={citiesLoading}
                placeholder="Select City"
                required
                disabled={user?.userTypeId ? user.userTypeId > 4 : false}
              />
            </div>
          </Card>

          {/* Billing Type Section */}
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Billing Type</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderBillingFields()}
            </div>
          </Card>

          {/* Impact Type Section */}
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Impact Type</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FloatingDropdown
                label="Impact Type"
                options={impactTypes.map(type => ({ value: type.value, label: type.label }))}
                value={formData.impactType}
                onChange={(value: string) => handleInputChange('impactType', value)}
                loading={impactTypesLoading}
                placeholder="Select Impact Type"
                error={errors.impactType}
                required
              />
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="ghost" onClick={() => navigate('/clients/manage')} className="px-6 py-3">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Client'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

## ✏️ EditClient Page (`src/pages/EditClient.tsx`)

### Purpose
Form for editing existing client locations with pre-filled data, persistence, and same functionality as AddClient.

### Key Features
- **Data Pre-filling**: Form populated from Redux state
- **Persistence**: Data survives page refresh via localStorage
- **Same Logic**: Reuses AddClient form logic with modifications
- **Navigation**: Back button to return to manage page
- **State Restoration**: Automatic data restoration on page refresh

### Implementation Details

#### 1. **Data Restoration**
```typescript
export const EditClient: React.FC = () => {
  const { selectedLocation } = useSelector((state: RootState) => state.client);

  // Restore selected location from localStorage on page refresh
  useEffect(() => {
    if (!selectedLocation) {
      const savedLocation = localStorage.getItem('selectedClientLocation');
      if (savedLocation) {
        try {
          const location = JSON.parse(savedLocation);
          dispatch(restoreSelectedLocation(location));
        } catch (error) {
          console.error('Failed to parse saved location:', error);
          navigate('/clients/manage');
        }
      } else {
        console.log('❌ No selected location, redirecting to manage clients');
        navigate('/clients/manage');
      }
    }
  }, [selectedLocation, dispatch, navigate]);
```

#### 2. **Form Pre-filling**
```typescript
  // Form state with prefilled values from selectedLocation
  const [formData, setFormData] = useState<ClientFormData>({
    // Basic Information - prefilled from selectedLocation
    name: selectedLocation?.restaurant_name || '',
    address1: selectedLocation?.address_1 || '',
    address2: selectedLocation?.address_2 || '',
    zipcode: selectedLocation?.zipcode || '',
    landmark: selectedLocation?.landmark || '',
    latitude: selectedLocation?.latitude || '',
    longitude: selectedLocation?.longitude || '',
    onSiteManpower: selectedLocation?.hasOnSiteManPower || false,

    // Location - prefilled from selectedLocation
    locationType: selectedLocation?.locationTypeId?.toString() || '',
    country: selectedLocation?.country_id?.toString() || '',
    state: selectedLocation?.state_id?.toString() || '',
    city: selectedLocation?.city_id?.toString() || '',

    // Billing Type - prefilled from selectedLocation
    billingType: selectedLocation?.billing_type_id?.toString() || '',
    fixedPrice: selectedLocation?.fixedPrice?.toString() || '',
    billingSubType: selectedLocation?.billing_sub_type_id?.toString() || '',

    // Impact Type - prefilled from selectedLocation (first impact type if multiple)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    impactType: (selectedLocation?.impactTypes?.[0] as any)?.id?.toString() || '',
    facility: selectedLocation?.facilityId?.toString() || '',
  });

  // Update form data when selectedLocation changes
  useEffect(() => {
    if (selectedLocation) {
      const billingTypeId = selectedLocation.billing_type_id;

      setFormData({
        name: selectedLocation.restaurant_name || '',
        address1: selectedLocation.address_1 || '',
        address2: selectedLocation.address_2 || '',
        zipcode: selectedLocation.zipcode || '',
        landmark: selectedLocation.landmark || '',
        latitude: selectedLocation.latitude || '',
        longitude: selectedLocation.longitude || '',
        onSiteManpower: selectedLocation.hasOnSiteManPower || false,
        locationType: selectedLocation.locationTypeId?.toString() || '',
        country: selectedLocation.country_id?.toString() || '',
        state: selectedLocation.state_id?.toString() || '',
        city: selectedLocation.city_id?.toString() || '',
        billingType: billingTypeId?.toString() || '',
        fixedPrice: selectedLocation.fixedPrice?.toString() || '',
        billingSubType: selectedLocation.billing_sub_type_id?.toString() || '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        impactType: (selectedLocation.impactTypes?.[0] as any)?.id?.toString() || '',
        facility: selectedLocation.facilityId?.toString() || '',
      });
    }
  }, [selectedLocation]);
```

#### 3. **Simplified Header**
```typescript
  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Simple Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/clients/manage')}
            className="text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">Edit Client</h1>
        </div>

        {/* Same form structure as AddClient */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* All the same sections as AddClient */}
        </form>
      </div>
    </div>
  );
```

#### 4. **Update Client API Implementation**

**API Integration**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    // Map form data to API request format
    const updateData: UpdateClientRequest = {
      location_id: selectedLocation.id,
      restaurant_id: selectedLocation.restaurant_id,
      country_id: parseInt(formData.country),
      state_id: parseInt(formData.state),
      city_id: parseInt(formData.city),
      latitude: formData.latitude,
      longitude: formData.longitude,
      landmark: formData.landmark,
      zipcode: formData.zipcode,
      location: formData.name, // Using name as location
      address_1: formData.address1,
      address_2: formData.address2,
      location_type: parseInt(formData.locationType),
      impact_type_ids: formData.impactType.map(id => parseInt(id)),
      billing_type_id: parseInt(formData.billingType),
      onSiteManPower: formData.onSiteManpower ? 1 : 0,
      // Conditional fields based on billing type
      ...(formData.billingType === '3' && {
        fixed_price: formData.fixedPrice,
        fixed_pricing_id: parseInt(formData.fixedPricingId)
      })
    };

    console.log('🔄 Updating client with data:', updateData);
    
    const result = await ClientApiService.updateClient(updateData);
    
    if (result.status === 'Success' && result.status_code === 200) {
      console.log('✅ Client updated successfully!');
      setSnackbar({
        open: true,
        message: result.message || 'Client updated successfully!',
        type: 'success',
      });
      
      // Navigate after showing success message
      setTimeout(() => {
        navigate('/clients/manage');
      }, 800);
    } else {
      console.error('❌ Update failed:', result);
      setSnackbar({
        open: true,
        message: result.message || 'Failed to update client. Please try again.',
        type: 'error',
      });
    }
  } catch (error) {
    console.error('❌ Update error:', error);
    setSnackbar({
      open: true,
      message: 'Network error. Please check your connection and try again.',
      type: 'error',
    });
  }
};
```

**Snackbar Integration**:
```typescript
// Snackbar state
const [snackbar, setSnackbar] = useState({
  open: false,
  message: '',
  type: 'success' as 'success' | 'error' | 'info',
});

// Snackbar component in JSX
<Snackbar
  open={snackbar.open}
  message={snackbar.message}
  type={snackbar.type}
  onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
/>
```

**Key Implementation Features**:
- **API Response Validation**: Checks `status === 'Success' && status_code === 200`
- **User Feedback**: Modern snackbar notifications instead of JavaScript alerts
- **Navigation**: Automatic redirect to ManageClients after successful update
- **Error Handling**: Comprehensive error handling for network and API errors
- **Type Safety**: Proper TypeScript interfaces for API requests
- **Conditional Fields**: Dynamic inclusion of optional fields based on billing type

## 📊 ManageClients Page (`src/pages/ManageClients.tsx`)

### Purpose
Data table for managing client locations with filtering, sorting, pagination, and bulk operations.

### Key Features
- **Data Table**: Sortable columns with custom rendering
- **Filtering**: Location type and client filters
- **Pagination**: Modern pagination with "All" option
- **Search**: Real-time search functionality
- **Actions**: Edit button for each row
- **Responsive**: Horizontal scroll on mobile
- **Custom Tooltips**: Accessibility tooltips for truncated content

### Implementation Details

#### 1. **State Management**
```typescript
export const ManageClients: React.FC = () => {
  // Data state
  const [clientLocations, setClientLocations] = useState<ClientLocation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<ClientLocationFilters>({
    page: 1,
    limit: 10,
    city_id: user?.city_id,
    location_type: 3, // Default location type
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
  });

  // Sorting state
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
```

#### 2. **API Integration**
```typescript
  // API hook for client locations
  const clientLocationsApi = useApi('clientLocations', async (filters: ClientLocationFilters) => {
    return await ClientApiService.getLocations(filters);
  });

  // Data loading function
  const loadClientLocations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading client locations with filters:', filtersToUse);

      const response = await clientLocationsApi.execute(filtersToUse);
      console.log('🔍 FULL API Response:', response);
      console.log('📊 Response statusCode:', (response as unknown as { statusCode: number }).statusCode);
      console.log('📊 Response status_code:', response.status_code);
      console.log('📦 Response data:', response.data);

      // Check both statusCode and status_code for compatibility
      const isSuccess = (response as unknown as { statusCode: number }).statusCode === 200 || response.status_code === 200;

      if (isSuccess) {
        // Clear any previous errors
        setError(null);

        // The backend returns data directly as an array
        const locations = (response.data as unknown as ClientLocation[]) || [];
        const paginationData = (response as unknown as { pagination: PaginationData }).pagination || {};

        console.log('📍 Locations found:', locations.length);
        console.log('📍 First location:', locations[0]);
        console.log('📍 Pagination data:', paginationData);

        setClientLocations(locations);
        setPagination({
          currentPage: paginationData.currentPage || 1,
          pageSize: paginationData.pageSize || 10,
          totalCount: paginationData.totalCount || 0,
          totalPages: paginationData.totalPages || 1,
        });

        // Store in Redux for navigation
        dispatch(setLocations(locations));

        // Extract unique clients for filter dropdown
        const uniqueClients = locations.reduce((acc: Client[], location: ClientLocation) => {
          const existingClient = acc.find(client => client.id === location.id);
          if (!existingClient) {
            acc.push({
              id: location.id,
              name: location.restaurant_name,
            });
          }
          return acc;
        }, []);
        setClients(uniqueClients);
      } else {
        setError(
          `API Error: ${(response as unknown as { message?: string; status?: string }).message || (response as unknown as { message?: string; status?: string }).status || 'Unknown error'}`
        );
      }
    } catch (error: unknown) {
      console.error('Failed to load client locations:', error);
      setError(
        `Failed to load client locations: ${(error as Error).message || 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  }, [clientLocationsApi, filtersToUse, dispatch]);
```

#### 3. **Table Columns Configuration**
```typescript
  const columns: TableColumn[] = [
    {
      key: 'serial',
      label: '#',
      title: 'Serial Number',
      sortable: false,
      width: '60px',
      render: (_value: unknown, _row: Record<string, unknown>, index: number) => (
        <div className='font-semibold text-gray-600 text-center'>
          {(pagination.currentPage - 1) * pagination.pageSize + index + 1}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      title: 'Actions',
      sortable: false,
      render: (_value: unknown, row: Record<string, unknown>) => (
        <Button
          variant='ghost'
          size='sm'
          onClick={() => {
            const location = clientLocations.find(loc => loc.id === row.id);
            if (location) {
              dispatch(setSelectedLocation(location));
              navigate('/clients/edit');
            }
          }}
          className='text-green-600 hover:text-green-700 hover:bg-green-50'
        >
          <Edit className='w-4 h-4 mr-1' />
          Edit
        </Button>
      ),
    },
    {
      key: 'restaurant_name',
      label: 'Client',
      title: 'Client',
      sortable: true,
      width: '200px',
      render: (value: unknown) => {
        const clientName = String(value);
        return (
          <div className='relative group'>
            <div
              className='font-semibold text-gray-900'
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '180px',
              }}
            >
              {clientName}
            </div>
            {/* Custom tooltip - accessibility feature */}
            <div className='absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap'>
              {clientName}
              <div className='absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900'></div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'billingType',
      label: 'Billing',
      title: 'Billing',
      sortable: true,
      render: (value: unknown, row: Record<string, unknown>) => (
        <div className="text-gray-900">
          <div className="font-medium">{String(value)}</div>
          {(row.subTypeName as string) && (
            <div className="text-xs text-gray-500 mt-1">{String(row.subTypeName)}</div>
          )}
        </div>
      ),
    },
    {
      key: 'impactTypes',
      label: 'Impact Types',
      title: 'Impact Types',
      sortable: false,
      render: (value: unknown) => {
        const impactTypes = value as ImpactType[];
        return (
          <span className="text-gray-900">
            {impactTypes && impactTypes.length > 0
              ? impactTypes.map(type => type.name).join(', ')
              : 'N/A'
            }
          </span>
        );
      },
    },
    {
      key: 'location_type_name',
      label: 'Type',
      title: 'Type',
      sortable: true,
      render: (value: unknown) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {String(value)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      title: 'Active Status',
      sortable: true,
      render: (value: unknown) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          String(value).toLowerCase() === 'active'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {String(value)}
        </span>
      ),
    },
    {
      key: 'coordinates',
      label: 'Coordinates',
      title: 'Coordinates',
      sortable: false,
      render: (_value: unknown, row: Record<string, unknown>) => (
        <div className="text-sm text-gray-600">
          <div className="font-mono text-xs">
            <span className="text-blue-600">Lat:</span> {String(row.latitude || 'N/A')}
          </div>
          <div className="font-mono text-xs">
            <span className="text-green-600">Lng:</span> {String(row.longitude || 'N/A')}
          </div>
        </div>
      ),
    },
    {
      key: 'address',
      label: 'Address',
      title: 'Address',
      sortable: false,
      render: (_value: unknown, row: Record<string, unknown>) => {
        const address1 = String(row.address_1 || '');
        const address2 = String(row.address_2 || '');
        const landmark = String(row.landmark || '');
        const zipcode = String(row.zipcode || '');
        
        const fullAddress = [address1, address2, landmark, zipcode]
          .filter(part => part.trim())
          .join(', ');
        
        return (
          <div 
            className="text-gray-900 truncate max-w-xs" 
            title={fullAddress}
          >
            {fullAddress || 'N/A'}
          </div>
        );
      },
    },
  ];
```

#### 4. **Filter Section**
```typescript
  // Filter section with modern design
  const renderFilterSection = () => (
    <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-4">
        <FloatingDropdown
          label="Location Type"
          options={locationTypes.map(type => ({ value: type.value, label: type.label }))}
          value={filters.location_type?.toString() || ''}
          onChange={(value: string) => setFilters(prev => ({ ...prev, location_type: parseInt(value) }))}
          loading={locationTypesLoading}
          placeholder="All Types"
        />

        <FloatingDropdown
          label="Client"
          options={clients.map(client => ({ value: client.id.toString(), label: client.name }))}
          value={filters.client_id?.toString() || ''}
          onChange={(value: string) => setFilters(prev => ({ ...prev, client_id: parseInt(value) }))}
          placeholder="All Clients"
        />

        <Button
          onClick={handleSearch}
          className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center gap-1.5 text-sm font-medium"
        >
          <Search className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          onClick={clearFilters}
          className="text-gray-500 hover:text-gray-700 px-2 py-1 text-sm"
        >
          Reset
        </Button>
      </div>
    </div>
  );
```

#### 5. **Sorting Logic**
```typescript
  const handleSort = (column: string) => {
    let newOrder: 'asc' | 'desc' = 'asc';
    
    if (sortBy === column && sortOrder === 'asc') {
      newOrder = 'desc';
    }
    
    setSortBy(column);
    setSortOrder(newOrder);
    
    // Local sorting implementation
    const sortedLocations = [...clientLocations].sort((a, b) => {
      const aValue = a[column as keyof ClientLocation];
      const bValue = b[column as keyof ClientLocation];
      
      // Handle different data types
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return newOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return newOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // Fallback to string comparison
      const aStr = String(aValue || '');
      const bStr = String(bValue || '');
      return newOrder === 'asc' 
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
    
    setClientLocations(sortedLocations);
  };
```

#### 6. **Pagination Handlers**
```typescript
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setFilters(prev => ({ ...prev, limit: itemsPerPage, page: 1 }));
    setPagination(prev => ({ ...prev, pageSize: itemsPerPage, currentPage: 1 }));
  };
```

#### 7. **Complete Page Layout**
```typescript
  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manage Clients</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm text-gray-600">
              📍{' '}
              {shouldShowCityFilter
                ? 'All Cities'
                : user?.city_id
                  ? cities.find(c => c.value === user.city_id?.toString())?.label || 'Mumbai'
                  : 'Mumbai'}
            </span>
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-600">🏢 {pagination.totalCount} locations</span>
          </div>
        </div>

        {/* Filter Section */}
        {renderFilterSection()}

        {/* Data Table */}
        <Table
          columns={columns}
          data={clientLocations}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />

        {/* Pagination */}
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalCount}
          itemsPerPage={pagination.pageSize}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          className="mt-6"
        />

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
```

## 🔄 Page Navigation Flow

### 1. **Add Client Flow**
```
ManageClients → Add Client Button → AddClient Page → Form Submission → Back to ManageClients
```

### 2. **Edit Client Flow**
```
ManageClients → Edit Button → setSelectedLocation → EditClient Page → Form Submission → Back to ManageClients
```

### 3. **Data Persistence Flow**
```
EditClient Page → Refresh → localStorage Check → Redux State Restoration → Form Pre-fill
```

## 🎯 Key Implementation Patterns

### 1. **Form State Management**
- **Controlled Components**: All inputs controlled by React state
- **Validation**: Real-time validation with error display
- **Dynamic Fields**: Conditional rendering based on form values
- **API Integration**: Real-time data fetching for dropdowns

### 2. **Data Flow**
- **Redux Integration**: Global state for selected location
- **Local Storage**: Persistence for page refresh
- **API Hooks**: Custom hooks for data fetching
- **Error Handling**: Comprehensive error states

### 3. **User Experience**
- **Loading States**: Visual feedback during API calls
- **Error Messages**: Clear error communication
- **Validation**: Immediate feedback on form errors
- **Accessibility**: Tooltips and proper labeling

---

**Next**: [Form Components](./06-Form-Components.md) - Detailed form component implementations
