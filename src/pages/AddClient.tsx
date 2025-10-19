import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FloatingInput, FloatingDropdown } from '../components/ui';
import { ArrowLeft, DollarSign, Target, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import TokenManager from '../utils/tokenManager';
import {
	useCountries,
	useStates,
	useCities,
	useLocationTypes,
	useImpactTypes,
	useBillingTypes,
	useBillingSubTypes,
} from '../hooks/useLocationData';
import { useApi } from '../hooks/useApi';
import { apiService } from '../services/api';

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

export const AddClient: React.FC = () => {
	const navigate = useNavigate();
	const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

	// Debug authentication
	useEffect(() => {
		console.log('AddClient Auth Debug:');
		console.log('- Is Authenticated:', isAuthenticated);
		console.log('- User:', user);
		console.log('- Token exists:', !!TokenManager.getBearerToken());
		console.log('- Token data:', TokenManager.getTokenData());
	}, [isAuthenticated, user]);

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
		console.log('🏢 Fetching facilities with params:', params.toString());
		const response = await apiService.get(`/locations/getLocations?${params.toString()}`);
		console.log('🏢 Facilities API response:', response);
		return response;
	});

	const [facilities, setFacilities] = useState<unknown[]>([]);

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
		country: '82', // India's ID from the API
		state: '',
		city: '',
		billingType: '',
		fixedPrice: '',
		billingSubType: '',
		impactType: '',
		facility: '',
	});

	// Trigger facilities API when onSiteManpower is checked
	useEffect(() => {
		if (formData.onSiteManpower && user?.city_id) {
			console.log('🏢 useEffect: Fetching facilities for city_id:', user.city_id);
			facilitiesApi.execute({}).then(response => {
				if (response.data) {
					setFacilities(response.data);
					console.log('🏢 Facilities stored:', response.data);
				}
			});
		}
	}, [formData.onSiteManpower, user?.city_id, facilitiesApi]);

	const [errors, setErrors] = useState<Partial<ClientFormData>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Set India as default country
	useEffect(() => {
		if (countries.length > 0 && !formData.country) {
			const indiaCountry = countries.find(country => country.label.toLowerCase().includes('india'));
			if (indiaCountry) {
				setFormData(prev => ({ ...prev, country: indiaCountry.value }));
			}
		}
	}, [countries, formData.country]);

	// Debug: Check localStorage data
	useEffect(() => {
		const storedUserData = localStorage.getItem('user_data');
		const parsedData = storedUserData ? JSON.parse(storedUserData) : null;
		console.log('💾 AddClient: Stored user data in localStorage:', parsedData);
		console.log('💾 AddClient: city_id in localStorage:', parsedData?.city_id);
		console.log('💾 AddClient: state_id in localStorage:', parsedData?.state_id);
		console.log('💾 AddClient: userTypeId in localStorage:', parsedData?.userTypeId);

		// Also check what's in Redux
		console.log('🔍 AddClient: Redux user object:', user);
		console.log('🔍 AddClient: Redux user.city_id:', user?.city_id);
		console.log('🔍 AddClient: Redux user.state_id:', user?.state_id);
		console.log('🔍 AddClient: Redux user.userTypeId:', user?.userTypeId);
	}, [user]);

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

	const handleInputChange = (field: keyof ClientFormData, value: string | boolean) => {
		setFormData(prev => ({ ...prev, [field]: value }));
		// Clear error when user starts typing
		if (errors[field]) {
			setErrors(prev => ({ ...prev, [field]: undefined }));
		}

		// Trigger facilities API when onSiteManpower is checked
		if (field === 'onSiteManpower' && value === true) {
			console.log('🏢 On-site Manpower checked, fetching facilities...');
			facilitiesApi.execute({}).then(response => {
				if (response.data) {
					setFacilities(response.data);
					console.log('🏢 Facilities stored from handleInputChange:', response.data);
				}
			});
		}
	};

	const validateForm = (): boolean => {
		const newErrors: Partial<ClientFormData> = {};

		// Required fields validation
		if (!formData.name.trim()) newErrors.name = 'Name is required';
		if (!formData.address1.trim()) newErrors.address1 = 'Address 1 is required';
		if (!formData.locationType) newErrors.locationType = 'Location Type is required';
		if (!formData.billingType) newErrors.billingType = 'Billing Type is required';
		if (!formData.impactType) newErrors.impactType = 'Impact Type is required';
		if (!formData.country) newErrors.country = 'Country is required';
		if (!formData.state) newErrors.state = 'State is required';
		if (!formData.city) newErrors.city = 'City is required';
		if (!formData.landmark.trim()) newErrors.landmark = 'Landmark is required';
		if (!formData.latitude.trim()) newErrors.latitude = 'Latitude is required';
		if (!formData.longitude.trim()) newErrors.longitude = 'Longitude is required';

		// Conditional validation for Fixed Price
		if (formData.billingType === '3' && !formData.fixedPrice?.trim()) {
			newErrors.fixedPrice = 'Fixed Price is required';
		}

		// Conditional validation for Billing Sub Type
		if (formData.billingType === '4' && !formData.billingSubType) {
			newErrors.billingSubType = 'Billing Sub Type is required';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setIsSubmitting(true);
		try {
			// TODO: Implement API call when APIs are provided
			console.log('Submitting client data:', formData);

			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));

			// Navigate back to clients list or show success message
			navigate('/clients');
		} catch (error) {
			console.error('Failed to add client:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className='min-h-screen bg-background-secondary p-4'>
			<div className='max-w-7xl mx-auto'>
				{/* Header */}
				<div className='flex items-center gap-4 mb-6'>
					<Button variant='ghost' size='sm' onClick={() => navigate('/clients')} className='p-2'>
						<ArrowLeft className='w-4 h-4' />
					</Button>
					<div>
						<h1 className='text-3xl font-bold text-foreground'>Add A Client</h1>
						<p className='text-foreground-muted mt-1'>Fill required details</p>
					</div>
				</div>

				<form onSubmit={handleSubmit} className='space-y-6'>
					{/* Client Information Section */}
					<Card className='p-4'>
						<div className='flex items-center gap-3 mb-4'>
							<Building className='w-5 h-5 text-primary' />
							<h2 className='text-xl font-semibold text-foreground'>Client Information</h2>
						</div>

						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
							{/* Basic Information Row */}
							<FloatingInput
								label='Name'
								value={formData.name}
								onChange={value => handleInputChange('name', value)}
								required
								error={!!errors.name}
								errorMessage={errors.name}
							/>

							<FloatingInput
								label='Address 1'
								value={formData.address1}
								onChange={value => handleInputChange('address1', value)}
								required
								error={!!errors.address1}
								errorMessage={errors.address1}
							/>

							<FloatingInput
								label='Address 2'
								value={formData.address2}
								onChange={value => handleInputChange('address2', value)}
							/>

							<FloatingInput
								label='Landmark'
								value={formData.landmark}
								onChange={value => handleInputChange('landmark', value)}
								required
								error={!!errors.landmark}
								errorMessage={errors.landmark}
							/>

							<FloatingInput
								label='Latitude'
								value={formData.latitude}
								onChange={value => handleInputChange('latitude', value)}
							/>

							<FloatingInput
								label='Longitude'
								value={formData.longitude}
								onChange={value => handleInputChange('longitude', value)}
							/>

							{/* Location Hierarchy Row */}
							<FloatingDropdown
								label='Select City'
								options={cities}
								value={formData.city}
								onChange={(value: string) => handleInputChange('city', value)}
								loading={citiesLoading}
								required
								error={!!errors.city}
								errorMessage={errors.city}
								disabled={user?.userTypeId ? user.userTypeId > 4 : false}
							/>

							<FloatingDropdown
								label='Select State'
								options={states}
								value={formData.state}
								onChange={(value: string) => handleInputChange('state', value)}
								loading={statesLoading}
								required
								error={!!errors.state}
								errorMessage={errors.state}
								disabled={user?.userTypeId ? user.userTypeId > 4 : false}
							/>

							<FloatingDropdown
								label='Select Country'
								options={countries}
								value={formData.country}
								onChange={(value: string) => handleInputChange('country', value)}
								loading={countriesLoading}
								required
								error={!!errors.country}
								errorMessage={errors.country}
								disabled={user?.userTypeId ? user.userTypeId > 4 : false}
							/>

							{/* Location Type */}
							<FloatingDropdown
								label='Select Location Type'
								options={locationTypes}
								value={formData.locationType}
								onChange={(value: string) => handleInputChange('locationType', value)}
								loading={locationTypesLoading}
								required
								error={!!errors.locationType}
								errorMessage={errors.locationType}
							/>

							<FloatingInput
								label='Zipcode'
								value={formData.zipcode}
								onChange={value => handleInputChange('zipcode', value)}
							/>
						</div>

						{/* On-site Manpower Checkbox */}
						<div className='mt-6'>
							<label className='flex items-center gap-3 cursor-pointer'>
								<input
									type='checkbox'
									checked={formData.onSiteManpower}
									onChange={e => handleInputChange('onSiteManpower', e.target.checked)}
									className='w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary'
								/>
								<span className='text-sm font-medium text-foreground'>On-site Manpower</span>
							</label>
						</div>

						{/* Facility Dropdown (when onSiteManpower is true) */}
						{formData.onSiteManpower && (
							<div className='mt-4'>
								{/* Debug log for facility dropdown */}
								<FloatingDropdown
									label='Facility'
									options={facilities.map((facility: unknown) => ({
										// eslint-disable-next-line @typescript-eslint/no-explicit-any
										value: (facility as any).id.toString(),
										// eslint-disable-next-line @typescript-eslint/no-explicit-any
										label: (facility as any).location || `Facility ${(facility as any).id}`,
									}))}
									value={formData.facility || ''}
									onChange={(value: string) => handleInputChange('facility', value)}
									loading={facilitiesApi.loading}
									placeholder='Select Facility'
									required
								/>
							</div>
						)}
					</Card>

					{/* Billing Type Section */}
					<Card className='p-4'>
						<div className='flex items-center gap-3 mb-4'>
							<DollarSign className='w-5 h-5 text-primary' />
							<h2 className='text-xl font-semibold text-foreground'>Billing Type</h2>
						</div>

						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
							<FloatingDropdown
								label='Select Billing Type'
								options={billingTypes}
								value={formData.billingType}
								onChange={(value: string) => handleInputChange('billingType', value)}
								loading={billingTypesLoading}
								required
								error={!!errors.billingType}
								errorMessage={errors.billingType}
							/>

							{/* Dynamic Fields based on Billing Type */}
							{formData.billingType === '3' && (
								<FloatingInput
									label='Fixed Price'
									value={formData.fixedPrice || ''}
									onChange={value => handleInputChange('fixedPrice', value)}
									type='number'
									required
									error={!!errors.fixedPrice}
									errorMessage={errors.fixedPrice}
								/>
							)}

							{formData.billingType === '4' && (
								<FloatingDropdown
									label='Billing Sub Type'
									options={billingSubTypes}
									value={formData.billingSubType || ''}
									onChange={(value: string) => handleInputChange('billingSubType', value)}
									loading={billingSubTypesLoading}
									required
									error={!!errors.billingSubType}
									errorMessage={errors.billingSubType}
								/>
							)}
						</div>
					</Card>

					{/* Impact Type Section */}
					<Card className='p-4'>
						<div className='flex items-center gap-3 mb-4'>
							<Target className='w-5 h-5 text-primary' />
							<h2 className='text-xl font-semibold text-foreground'>Impact Type</h2>
						</div>

						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
							<FloatingDropdown
								label='Select Client Impact Types'
								options={impactTypes}
								value={formData.impactType}
								onChange={(value: string) => handleInputChange('impactType', value)}
								loading={impactTypesLoading}
								required
								error={!!errors.impactType}
								errorMessage={errors.impactType}
							/>
						</div>
					</Card>

					{/* Submit Button */}
					{/* Submit Button */}
					<div className='flex justify-end'>
						<Button
							type='submit'
							disabled={isSubmitting}
							className='px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors'
						>
							{isSubmitting ? 'Adding Client...' : 'Add Client'}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default AddClient;
