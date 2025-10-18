import React, { useState } from 'react';
import { FloatingInput, FloatingDropdown } from '../components/ui';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const FloatingLabelDemo: React.FC = () => {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		phone: '',
		country: '',
		state: '',
		city: '',
		message: '',
	});

	const [errors, setErrors] = useState<Record<string, string>>({});

	const countries = [
		{ value: 'us', label: 'United States' },
		{ value: 'ca', label: 'Canada' },
		{ value: 'uk', label: 'United Kingdom' },
		{ value: 'au', label: 'Australia' },
		{ value: 'in', label: 'India' },
	];

	const states = [
		{ value: 'ny', label: 'New York' },
		{ value: 'ca', label: 'California' },
		{ value: 'tx', label: 'Texas' },
		{ value: 'fl', label: 'Florida' },
		{ value: 'il', label: 'Illinois' },
	];

	const cities = [
		{ value: 'nyc', label: 'New York City' },
		{ value: 'la', label: 'Los Angeles' },
		{ value: 'chi', label: 'Chicago' },
		{ value: 'hou', label: 'Houston' },
		{ value: 'phx', label: 'Phoenix' },
	];

	const handleInputChange = (field: string, value: string) => {
		setFormData(prev => ({ ...prev, [field]: value }));
		// Clear error when user starts typing
		if (errors[field]) {
			setErrors(prev => ({ ...prev, [field]: '' }));
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const newErrors: Record<string, string> = {};

		// Basic validation
		if (!formData.name.trim()) newErrors.name = 'Name is required';
		if (!formData.email.trim()) newErrors.email = 'Email is required';
		if (!formData.country) newErrors.country = 'Country is required';

		setErrors(newErrors);

		if (Object.keys(newErrors).length === 0) {
			console.log('Form submitted:', formData);
			alert('Form submitted successfully!');
		}
	};

	return (
		<div className='min-h-screen bg-gray-50 py-8'>
			<div className='max-w-4xl mx-auto px-4'>
				<div className='mb-8'>
					<h1 className='text-3xl font-bold text-gray-900 mb-2'>Floating Label Components Demo</h1>
					<p className='text-gray-600'>
						Showcase of the new floating label input and dropdown components with smooth animations
						and modern design.
					</p>
				</div>

				<form onSubmit={handleSubmit} className='space-y-6'>
					{/* Basic Information */}
					<Card className='p-6'>
						<h2 className='text-xl font-semibold text-gray-900 mb-6'>Basic Information</h2>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<FloatingInput
								label='Full Name'
								value={formData.name}
								onChange={value => handleInputChange('name', value)}
								required
								error={!!errors.name}
								errorMessage={errors.name}
							/>

							<FloatingInput
								label='Email Address'
								value={formData.email}
								onChange={value => handleInputChange('email', value)}
								type='email'
								required
								error={!!errors.email}
								errorMessage={errors.email}
							/>

							<FloatingInput
								label='Phone Number'
								value={formData.phone}
								onChange={value => handleInputChange('phone', value)}
								type='tel'
							/>
						</div>
					</Card>

					{/* Location Information */}
					<Card className='p-6'>
						<h2 className='text-xl font-semibold text-gray-900 mb-6'>Location Information</h2>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
							<FloatingDropdown
								label='Select Country'
								options={countries}
								value={formData.country}
								onChange={value => handleInputChange('country', value)}
								required
								error={!!errors.country}
								errorMessage={errors.country}
							/>

							<FloatingDropdown
								label='Select State'
								options={states}
								value={formData.state}
								onChange={value => handleInputChange('state', value)}
							/>

							<FloatingDropdown
								label='Select City'
								options={cities}
								value={formData.city}
								onChange={value => handleInputChange('city', value)}
							/>
						</div>
					</Card>

					{/* Additional Information */}
					<Card className='p-6'>
						<h2 className='text-xl font-semibold text-gray-900 mb-6'>Additional Information</h2>
						<FloatingInput
							label='Message'
							value={formData.message}
							onChange={value => handleInputChange('message', value)}
							placeholder='Enter your message here...'
						/>
					</Card>

					{/* Submit Button */}
					<div className='flex justify-end'>
						<Button
							type='submit'
							className='px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors'
						>
							Submit Form
						</Button>
					</div>
				</form>

				{/* Features List */}
				<Card className='p-6 mt-8'>
					<h2 className='text-xl font-semibold text-gray-900 mb-4'>Features</h2>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div>
							<h3 className='font-medium text-gray-900 mb-2'>Floating Labels</h3>
							<ul className='text-sm text-gray-600 space-y-1'>
								<li>• Smooth animation when focusing/typing</li>
								<li>• Labels float above input when active</li>
								<li>• Returns to center when empty and unfocused</li>
								<li>• 200ms ease-in-out transitions</li>
							</ul>
						</div>
						<div>
							<h3 className='font-medium text-gray-900 mb-2'>Dropdown Features</h3>
							<ul className='text-sm text-gray-600 space-y-1'>
								<li>• Searchable with real-time filtering</li>
								<li>• Keyboard navigation support</li>
								<li>• Click outside to close</li>
								<li>• Max height with scroll</li>
							</ul>
						</div>
						<div>
							<h3 className='font-medium text-gray-900 mb-2'>Design System</h3>
							<ul className='text-sm text-gray-600 space-y-1'>
								<li>• Rounded corners (rounded-md)</li>
								<li>• Indigo focus states</li>
								<li>• Gray color palette</li>
								<li>• Consistent spacing (1rem)</li>
							</ul>
						</div>
						<div>
							<h3 className='font-medium text-gray-900 mb-2'>Validation</h3>
							<ul className='text-sm text-gray-600 space-y-1'>
								<li>• Required field indicators</li>
								<li>• Error states with red borders</li>
								<li>• Error messages below fields</li>
								<li>• Real-time validation feedback</li>
							</ul>
						</div>
					</div>
				</Card>
			</div>
		</div>
	);
};

export default FloatingLabelDemo;
