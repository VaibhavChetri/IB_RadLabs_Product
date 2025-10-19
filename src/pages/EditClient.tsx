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
}

export const EditClient: React.FC = () => {
	const navigate = useNavigate();
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

	// Redirect if no selected location
	useEffect(() => {
		if (!selectedLocation) {
			console.log('❌ No selected location, redirecting to manage clients');
			navigate('/clients/manage');
		}
	}, [selectedLocation, navigate]);

	// API hooks
	const { countries, loading: countriesLoading } = useCountries();
	const { states, loading: statesLoading } = useStates();
	const { cities, loading: citiesLoading } = useCities();
	const { locationTypes, loading: locationTypesLoading } = useLocationTypes();
	const { impactTypes, loading: impactTypesLoading } = useImpactTypes();
	const { billingTypes, loading: billingTypesLoading } = useBillingTypes();
	const { billingSubTypes, loading: billingSubTypesLoading } = useBillingSubTypes();

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
		country: selectedLocation?.country_name || '',
		state: selectedLocation?.state_name || '',
		city: selectedLocation?.city_id?.toString() || '',

		// Billing Type - prefilled from selectedLocation
		billingType: selectedLocation?.billing_type_id?.toString() || '',
		fixedPrice: selectedLocation?.fixedPrice?.toString() || '',
		billingSubType: selectedLocation?.billing_sub_type_id?.toString() || '',

		// Impact Type - prefilled from selectedLocation (first impact type if multiple)
		impactType: selectedLocation?.impactTypes?.[0]?.id?.toString() || '',
	});

	// Dynamic fields state
	const [showFixedPrice, setShowFixedPrice] = useState(false);
	const [showBillingSubType, setShowBillingSubType] = useState(false);

	// Update form data when selectedLocation changes
	useEffect(() => {
		if (selectedLocation) {
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
				country: selectedLocation.country_name || '',
				state: selectedLocation.state_name || '',
				city: selectedLocation.city_id?.toString() || '',
				billingType: selectedLocation.billing_type_id?.toString() || '',
				fixedPrice: selectedLocation.fixedPrice?.toString() || '',
				billingSubType: selectedLocation.billing_sub_type_id?.toString() || '',
				impactType: selectedLocation.impactTypes?.[0]?.id?.toString() || '',
			});
		}
	}, [selectedLocation]);

	// Handle form field changes
	const handleInputChange = (field: keyof ClientFormData, value: string | boolean) => {
		setFormData(prev => ({ ...prev, [field]: value }));

		// Show/hide dynamic fields based on billing type
		if (field === 'billingType') {
			const billingTypeId = parseInt(value as string);
			setShowFixedPrice(billingTypeId === 1); // Fixed Price billing type
			setShowBillingSubType(billingTypeId === 2); // Other billing types that need sub-type
		}
	};

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		console.log('📝 Form submitted:', formData);

		// TODO: Implement update API call
		// For now, just show success message
		alert('Client updated successfully!');
		navigate('/clients/manage');
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
			<div className='max-w-4xl mx-auto'>
				{/* Header */}
				<div className='flex items-center gap-4 mb-8'>
					<Button
						variant='ghost'
						size='sm'
						onClick={handleBack}
						className='text-gray-600 hover:text-gray-800'
					>
						<ArrowLeft className='w-4 h-4 mr-2' />
						Back to Manage Clients
					</Button>
					<div>
						<h1 className='text-3xl font-bold text-foreground'>Edit Client</h1>
						<p className='text-foreground-muted mt-1'>Update client location information</p>
					</div>
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
								step='any'
							/>

							<FloatingInput
								label='Longitude'
								value={formData.longitude}
								onChange={(value: string) => handleInputChange('longitude', value)}
								type='number'
								step='any'
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
							/>

							<FloatingDropdown
								label='State'
								options={states.map(state => ({ value: state.value, label: state.label }))}
								value={formData.state}
								onChange={(value: string) => handleInputChange('state', value)}
								loading={statesLoading}
								placeholder='Select State'
								required
							/>

							<FloatingDropdown
								label='City'
								options={cities.map(city => ({ value: city.value, label: city.label }))}
								value={formData.city}
								onChange={(value: string) => handleInputChange('city', value)}
								loading={citiesLoading}
								placeholder='Select City'
								required
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

							{showFixedPrice && (
								<FloatingInput
									label='Fixed Price'
									value={formData.fixedPrice || ''}
									onChange={(value: string) => handleInputChange('fixedPrice', value)}
									type='number'
									step='0.01'
									required
								/>
							)}

							{showBillingSubType && (
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
