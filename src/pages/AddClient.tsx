import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FloatingInput, FloatingDropdown } from '../components/ui';
import { ArrowLeft, MapPin, DollarSign, Target, Building } from 'lucide-react';
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

	// Debug logging
	useEffect(() => {
		console.log('AddClient Debug:');
		console.log('- Countries:', countries.length, countries);
		console.log('- Impact Types:', impactTypes.length, impactTypes);
		console.log('- Billing Types:', billingTypes.length, billingTypes);
		console.log('- Location Types:', locationTypes.length, locationTypes);
	}, [countries, impactTypes, billingTypes, locationTypes]);

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
	});

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

	const handleInputChange = (field: keyof ClientFormData, value: string | boolean) => {
		setFormData(prev => ({ ...prev, [field]: value }));
		// Clear error when user starts typing
		if (errors[field]) {
			setErrors(prev => ({ ...prev, [field]: undefined }));
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
		if (
			getBillingTypeName(formData.billingType).toLowerCase().includes('fixed') &&
			!formData.fixedPrice?.trim()
		) {
			newErrors.fixedPrice = 'Fixed Price is required';
		}

		// Conditional validation for Billing Sub Type
		if (
			getBillingTypeName(formData.billingType).toLowerCase().includes('set pricing') &&
			!formData.billingSubType
		) {
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

	// Helper function to get billing type name for validation
	const getBillingTypeName = (billingTypeId: string) => {
		const billingType = billingTypes.find(bt => bt.value === billingTypeId);
		return billingType?.label || '';
	};

	return (
		<div className='min-h-screen bg-background-secondary p-6'>
			<div className='max-w-4xl mx-auto'>
				{/* Header */}
				<div className='flex items-center gap-4 mb-8'>
					<Button variant='ghost' size='sm' onClick={() => navigate('/clients')} className='p-2'>
						<ArrowLeft className='w-4 h-4' />
					</Button>
					<div>
						<h1 className='text-3xl font-bold text-foreground'>Add A Client</h1>
						<p className='text-foreground-muted mt-1'>Fill required details</p>
					</div>
				</div>

				<form onSubmit={handleSubmit} className='space-y-8'>
					{/* Basic Information Section */}
					<Card className='p-6'>
						<div className='flex items-center gap-3 mb-6'>
							<Building className='w-5 h-5 text-primary' />
							<h2 className='text-xl font-semibold text-foreground'>Basic Information</h2>
						</div>

						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
								label='Zipcode'
								value={formData.zipcode}
								onChange={value => handleInputChange('zipcode', value)}
							/>
						</div>
					</Card>

					{/* Location Section */}
					<Card className='p-6'>
						<div className='flex items-center gap-3 mb-6'>
							<MapPin className='w-5 h-5 text-primary' />
							<h2 className='text-xl font-semibold text-foreground'>Location Details</h2>
						</div>

						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<FloatingDropdown
								label='Select Location Type'
								options={locationTypes}
								value={formData.locationType}
								onChange={value => handleInputChange('locationType', value)}
								loading={locationTypesLoading}
								required
								error={!!errors.locationType}
								errorMessage={errors.locationType}
							/>

							<FloatingDropdown
								label='Select Country'
								options={countries}
								value={formData.country}
								onChange={value => handleInputChange('country', value)}
								loading={countriesLoading}
								required
								error={!!errors.country}
								errorMessage={errors.country}
							/>

							<FloatingDropdown
								label='Select State'
								options={states}
								value={formData.state}
								onChange={value => handleInputChange('state', value)}
								loading={statesLoading}
								required
								error={!!errors.state}
								errorMessage={errors.state}
							/>

							<FloatingDropdown
								label='Select City'
								options={cities}
								value={formData.city}
								onChange={value => handleInputChange('city', value)}
								loading={citiesLoading}
								required
								error={!!errors.city}
								errorMessage={errors.city}
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
								required
								error={!!errors.latitude}
								errorMessage={errors.latitude}
							/>

							<FloatingInput
								label='Longitude'
								value={formData.longitude}
								onChange={value => handleInputChange('longitude', value)}
								required
								error={!!errors.longitude}
								errorMessage={errors.longitude}
							/>
						</div>

						<div className='mt-6'>
							<label className='flex items-center gap-3'>
								<input
									type='checkbox'
									checked={formData.onSiteManpower}
									onChange={e => handleInputChange('onSiteManpower', e.target.checked)}
									className='w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2'
								/>
								<span className='text-sm font-medium text-foreground'>On-site Manpower</span>
							</label>
						</div>
					</Card>

					{/* Billing Type Section */}
					<Card className='p-6'>
						<div className='flex items-center gap-3 mb-6'>
							<DollarSign className='w-5 h-5 text-primary' />
							<h2 className='text-xl font-semibold text-foreground'>Billing Type</h2>
						</div>

						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<FloatingDropdown
								label='Select Billing Type'
								options={billingTypes}
								value={formData.billingType}
								onChange={value => handleInputChange('billingType', value)}
								loading={billingTypesLoading}
								required
								error={!!errors.billingType}
								errorMessage={errors.billingType}
							/>

							{/* Dynamic Fields based on Billing Type */}
							{getBillingTypeName(formData.billingType).toLowerCase().includes('fixed') && (
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

							{getBillingTypeName(formData.billingType).toLowerCase().includes('set pricing') && (
								<FloatingDropdown
									label='Billing Sub Type'
									options={billingSubTypes}
									value={formData.billingSubType || ''}
									onChange={value => handleInputChange('billingSubType', value)}
									loading={billingSubTypesLoading}
									required
									error={!!errors.billingSubType}
									errorMessage={errors.billingSubType}
								/>
							)}
						</div>
					</Card>

					{/* Impact Type Section */}
					<Card className='p-6'>
						<div className='flex items-center gap-3 mb-6'>
							<Target className='w-5 h-5 text-primary' />
							<h2 className='text-xl font-semibold text-foreground'>Impact Type</h2>
						</div>

						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<FloatingDropdown
								label='Select Client Impact Types'
								options={impactTypes}
								value={formData.impactType}
								onChange={value => handleInputChange('impactType', value)}
								loading={impactTypesLoading}
								required
								error={!!errors.impactType}
								errorMessage={errors.impactType}
							/>
						</div>
					</Card>

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
