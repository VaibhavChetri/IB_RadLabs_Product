import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FloatingInput, FloatingDropdown, Snackbar } from '../components/ui';
import { ArrowLeft, DollarSign, Target, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { restoreSelectedLocation } from '../store/slices/clientSlice';
import { useApi } from '../hooks/useApi';
import { apiService } from '../services/api';
import {
	useCountries,
	useStates,
	useCities,
	useLocationTypes,
	useImpactTypes,
	useBillingTypes,
	useBillingSubTypes,
} from '../hooks/useLocationData';
import { ClientApiService, UpdateClientRequest } from '../services/clientApi';

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

export const EditClient: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
	const { selectedLocation } = useSelector((state: RootState) => state.client);

	// Debug authentication
	console.log('🔍 EditClient - Auth state:', { user, isAuthenticated });

	// Redirect if not authenticated
	useEffect(() => {
		if (!isAuthenticated) {
			console.log('❌ Not authenticated, redirecting to login');
			navigate('/login');
		}
	}, [isAuthenticated, navigate]);

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

	// API hooks
	const { countries, loading: countriesLoading } = useCountries();
	const { states, loading: statesLoading } = useStates();
	const { cities, loading: citiesLoading } = useCities();
	const { locationTypes, loading: locationTypesLoading } = useLocationTypes();
	const { impactTypes, loading: impactTypesLoading } = useImpactTypes();
	const { billingTypes, loading: billingTypesLoading } = useBillingTypes();
	const { billingSubTypes, loading: billingSubTypesLoading } = useBillingSubTypes();

	// Facility API
	const facilitiesApi = useApi('facilities', async () => {
		const params = new URLSearchParams();
		params.append('location_type', '2');
		if (user?.city_id) {
			params.append('city_id', user.city_id.toString());
		}
		console.log('🏢 EditClient: Fetching facilities with params:', params.toString());
		const response = await apiService.get(`/locations/getLocations?${params.toString()}`);
		console.log('🏢 EditClient: Facilities API response:', response);
		return response;
	});

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

			// Initialize dynamic fields based on billing type
			// Note: Fixed Price and Billing Sub Type are now handled by direct conditional rendering
		}
	}, [selectedLocation]);

	const [facilities, setFacilities] = useState<unknown[]>([]); // Local state for facilities

	// Snackbar state
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		type: 'success' as 'success' | 'error' | 'info',
	});

	// Trigger facilities API when onSiteManpower is checked
	useEffect(() => {
		if (formData.onSiteManpower && user?.city_id) {
			console.log('🏢 EditClient useEffect: Fetching facilities for city_id:', user.city_id);
			facilitiesApi.execute({}).then(response => {
				if (response.data) {
					setFacilities(response.data);
					console.log('🏢 EditClient Facilities stored:', response.data);
				}
			});
		}
	}, [formData.onSiteManpower, user?.city_id]); // Removed facilitiesApi from dependencies

	// Set user's city and state as default for non-super admins
	useEffect(() => {
		if (user?.city_id && user?.userTypeId && user.userTypeId > 4) {
			// Find and set the user's city
			const userCity = cities.find(city => city.value === user.city_id?.toString());
			if (userCity) {
				setFormData(prev => ({ ...prev, city: userCity.value }));
			}

			// Find and set the user's state
			if (user.state_id) {
				const userState = states.find(state => state.value === user.state_id?.toString());
				if (userState) {
					setFormData(prev => ({ ...prev, state: userState.value }));
				}
			}
		}
	}, [user?.city_id, user?.state_id, user?.userTypeId, cities, states]);

	// Handle form field changes
	const handleInputChange = (field: keyof ClientFormData, value: string | boolean) => {
		setFormData(prev => ({ ...prev, [field]: value }));

		// Trigger facilities API when onSiteManpower is checked
		if (field === 'onSiteManpower' && value === true) {
			console.log('🏢 EditClient: On-site Manpower checked, fetching facilities...');
			facilitiesApi.execute({}).then(response => {
				if (response.data) {
					setFacilities(response.data);
					console.log('🏢 EditClient Facilities stored from handleInputChange:', response.data);
				}
			});
		}
	};

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		console.log('📝 Form submitted:', formData);

		if (!selectedLocation) {
			console.error('❌ No client selected for editing');
			return;
		}

		try {
			// Map form data to API format
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
				location: formData.name,
				address_1: formData.address1,
				address_2: formData.address2,
				location_type: parseInt(formData.locationType),
				impact_type_ids: [parseInt(formData.impactType)],
				billing_type_id: parseInt(formData.billingType),
				onSiteManPower: formData.onSiteManpower ? 1 : 0,
			};

			// Add optional fields based on billing type
			if (formData.billingType === '3' && formData.fixedPrice) {
				updateData.fixed_price = formData.fixedPrice;
				updateData.fixed_pricing_id = selectedLocation.fixedPriceId || undefined;
			}

			console.log('🚀 Sending update data:', updateData);

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
				message: 'An error occurred while updating the client.',
				type: 'error',
			});
		}
	};

	// Handle back navigation
	const handleBack = () => {
		navigate('/clients/manage');
	};

	if (!isAuthenticated || !selectedLocation) {
		return null; // Will redirect via useEffect
	}

	return (
		<div className='min-h-screen bg-white p-4'>
			{/* Snackbar */}
			<Snackbar
				open={snackbar.open}
				message={snackbar.message}
				type={snackbar.type}
				onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
			/>

			<div className='max-w-4xl mx-auto'>
				{/* Simple Header */}
				<div className='mb-8'>
					<Button
						variant='ghost'
						size='sm'
						onClick={handleBack}
						className='text-gray-500 hover:text-gray-700 mb-4'
					>
						<ArrowLeft className='w-4 h-4 mr-2' />
						Back
					</Button>
					<h1 className='text-2xl font-semibold text-gray-900'>Edit Client</h1>
				</div>

				<form onSubmit={handleSubmit} className='space-y-8'>
					{/* Client Information */}
					<Card className='p-8'>
						<div className='flex items-center gap-3 mb-6'>
							<Building className='w-6 h-6 text-green-600' />
							<h2 className='text-xl font-semibold text-gray-900'>Client Information</h2>
						</div>

						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							<FloatingInput
								label='Client Name'
								value={formData.name}
								onChange={(value: string) => handleInputChange('name', value)}
								required
							/>

							<FloatingInput
								label='Address Line 1'
								value={formData.address1}
								onChange={(value: string) => handleInputChange('address1', value)}
								required
							/>

							<FloatingInput
								label='Address Line 2'
								value={formData.address2}
								onChange={(value: string) => handleInputChange('address2', value)}
							/>

							<FloatingInput
								label='Landmark'
								value={formData.landmark}
								onChange={(value: string) => handleInputChange('landmark', value)}
							/>

							<FloatingInput
								label='ZIP Code'
								value={formData.zipcode}
								onChange={(value: string) => handleInputChange('zipcode', value)}
							/>

							<FloatingInput
								label='Latitude'
								value={formData.latitude}
								onChange={(value: string) => handleInputChange('latitude', value)}
								type='number'
							/>

							<FloatingInput
								label='Longitude'
								value={formData.longitude}
								onChange={(value: string) => handleInputChange('longitude', value)}
								type='number'
							/>

							<div className='flex items-center gap-3'>
								<input
									type='checkbox'
									id='onSiteManpower'
									checked={formData.onSiteManpower}
									onChange={e => handleInputChange('onSiteManpower', e.target.checked)}
									className='w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500'
								/>
								<label htmlFor='onSiteManpower' className='text-sm font-medium text-gray-700'>
									Has On-Site Manpower
								</label>
							</div>

							{/* Facility Dropdown (when onSiteManpower is true) */}
							{formData.onSiteManpower && (
								<div className='mt-4'>
									<FloatingDropdown
										label='Facility'
										options={
											facilities.map((facility: unknown) => ({
												// eslint-disable-next-line @typescript-eslint/no-explicit-any
												value: (facility as any).id.toString(),
												// eslint-disable-next-line @typescript-eslint/no-explicit-any
												label: (facility as any).location || `Facility ${(facility as any).id}`,
											})) || []
										}
										value={formData.facility || ''}
										onChange={(value: string) => handleInputChange('facility', value)}
										loading={facilitiesApi.loading}
										placeholder='Select Facility'
										required
									/>
								</div>
							)}
						</div>
					</Card>

					{/* Location Details */}
					<Card className='p-8'>
						<div className='flex items-center gap-3 mb-6'>
							<Target className='w-6 h-6 text-blue-600' />
							<h2 className='text-xl font-semibold text-gray-900'>Location Details</h2>
						</div>

						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							<FloatingDropdown
								label='Location Type'
								options={locationTypes.map(type => ({ value: type.value, label: type.label }))}
								value={formData.locationType}
								onChange={(value: string) => handleInputChange('locationType', value)}
								loading={locationTypesLoading}
								placeholder='Select Location Type'
								required
							/>

							<FloatingDropdown
								label='Country'
								options={countries.map(country => ({ value: country.value, label: country.label }))}
								value={formData.country}
								onChange={(value: string) => handleInputChange('country', value)}
								loading={countriesLoading}
								placeholder='Select Country'
								required
								disabled={user?.userTypeId ? user.userTypeId > 4 : false}
							/>

							<FloatingDropdown
								label='State'
								options={states.map(state => ({ value: state.value, label: state.label }))}
								value={formData.state}
								onChange={(value: string) => handleInputChange('state', value)}
								loading={statesLoading}
								placeholder='Select State'
								required
								disabled={user?.userTypeId ? user.userTypeId > 4 : false}
							/>

							<FloatingDropdown
								label='City'
								options={cities.map(city => ({ value: city.value, label: city.label }))}
								value={formData.city}
								onChange={(value: string) => handleInputChange('city', value)}
								loading={citiesLoading}
								placeholder='Select City'
								required
								disabled={user?.userTypeId ? user.userTypeId > 4 : false}
							/>
						</div>
					</Card>

					{/* Billing Type */}
					<Card className='p-8'>
						<div className='flex items-center gap-3 mb-6'>
							<DollarSign className='w-6 h-6 text-green-600' />
							<h2 className='text-xl font-semibold text-gray-900'>Billing Type</h2>
						</div>

						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							<FloatingDropdown
								label='Billing Type'
								options={billingTypes.map(type => ({ value: type.value, label: type.label }))}
								value={formData.billingType}
								onChange={(value: string) => handleInputChange('billingType', value)}
								loading={billingTypesLoading}
								placeholder='Select Billing Type'
								required
							/>

							{formData.billingType === '3' && (
								<FloatingInput
									label='Fixed Price'
									value={formData.fixedPrice || ''}
									onChange={(value: string) => handleInputChange('fixedPrice', value)}
									type='number'
									required
								/>
							)}

							{formData.billingType === '4' && (
								<FloatingDropdown
									label='Billing Sub Type'
									options={billingSubTypes.map(type => ({ value: type.value, label: type.label }))}
									value={formData.billingSubType || ''}
									onChange={(value: string) => handleInputChange('billingSubType', value)}
									loading={billingSubTypesLoading}
									placeholder='Select Billing Sub Type'
									required
								/>
							)}
						</div>
					</Card>

					{/* Impact Type */}
					<Card className='p-8'>
						<div className='flex items-center gap-3 mb-6'>
							<Target className='w-6 h-6 text-purple-600' />
							<h2 className='text-xl font-semibold text-gray-900'>Impact Type</h2>
						</div>

						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							<FloatingDropdown
								label='Impact Type'
								options={impactTypes.map(type => ({ value: type.value, label: type.label }))}
								value={formData.impactType}
								onChange={(value: string) => handleInputChange('impactType', value)}
								loading={impactTypesLoading}
								placeholder='Select Impact Type'
								required
							/>
						</div>
					</Card>

					{/* Submit Button */}
					<div className='flex justify-end gap-4'>
						<Button type='button' variant='ghost' onClick={handleBack} className='px-6 py-3'>
							Cancel
						</Button>
						<Button
							type='submit'
							className='px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors'
						>
							Update Client
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default EditClient;
