/**
 * Add User Page
 * Form to create a new user
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	PageHeader,
	Card,
	Button,
	FloatingInput,
	FloatingDropdown,
	Snackbar,
} from '../../../components/ui';
import { UserApiService, CreateUserRequest } from '../../../services/userApi';
import { useCities } from '../../../hooks/useLocationData';
import { ArrowLeft } from 'lucide-react';

export const AddUser: React.FC = () => {
	const navigate = useNavigate();
	const { cities, loading: citiesLoading } = useCities();

	const [formData, setFormData] = useState<CreateUserRequest>({
		username: '',
		firstName: '',
		lastName: '',
		email: '',
		contact: '',
		gender: '',
		userTypeId: undefined,
		cityId: undefined,
		facilityId: undefined,
		status: 1,
		userPassword: '',
	});

	const [confirmPassword, setConfirmPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		type: 'success' as 'success' | 'error',
	});

	const userTypeOptions = [
		{ value: '1', label: 'Admin' },
		{ value: '2', label: 'Manager' },
		{ value: '3', label: 'Supervisor' },
		{ value: '4', label: 'Operator' },
		{ value: '28', label: 'Facility Manager' },
	];

	const genderOptions = [
		{ value: 'Male', label: 'Male' },
		{ value: 'Female', label: 'Female' },
		{ value: 'Other', label: 'Other' },
	];

	const validateForm = (): boolean => {
		if (!formData.username.trim()) {
			setSnackbar({
				open: true,
				message: 'Username is required',
				type: 'error',
			});
			return false;
		}

		if (!formData.firstName.trim() || !formData.lastName.trim()) {
			setSnackbar({
				open: true,
				message: 'First and last name are required',
				type: 'error',
			});
			return false;
		}

		if (!formData.email.trim()) {
			setSnackbar({
				open: true,
				message: 'Email is required',
				type: 'error',
			});
			return false;
		}

		if (!formData.userPassword) {
			setSnackbar({
				open: true,
				message: 'Password is required',
				type: 'error',
			});
			return false;
		}

		if (formData.userPassword !== confirmPassword) {
			setSnackbar({
				open: true,
				message: 'Passwords do not match',
				type: 'error',
			});
			return false;
		}

		return true;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) return;

		setLoading(true);

		try {
			const response = await UserApiService.createUser(formData);
			if (response.status_code === 201 || response.status_code === 200) {
				setSnackbar({
					open: true,
					message: 'User created successfully',
					type: 'success',
				});

				setTimeout(() => {
					navigate('/ops-admin/users');
				}, 1000);
			}
		} catch (err: any) {
			const errorMsg =
				err.response?.data?.message || err.message || 'Failed to create user';
			setSnackbar({
				open: true,
				message: errorMsg,
				type: 'error',
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='space-y-6'>
			<div className='flex items-center gap-3'>
				<button
					onClick={() => navigate('/ops-admin/users')}
					className='p-2 hover:bg-background-secondary rounded-lg transition-colors'
					title='Back to users'
				>
					<ArrowLeft className='w-5 h-5' />
				</button>
				<PageHeader title='Add New User' totalItems={0} itemType='user' icon='👥' />
			</div>

			<Card className='max-w-2xl'>
				<form onSubmit={handleSubmit} className='space-y-6'>
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<FloatingInput
							label='Username'
							value={formData.username}
							onChange={value => setFormData(prev => ({ ...prev, username: value }))}
							placeholder='Enter username'
							required
						/>
						<FloatingInput
							label='Email'
							type='email'
							value={formData.email}
							onChange={value => setFormData(prev => ({ ...prev, email: value }))}
							placeholder='Enter email'
							required
						/>
					</div>

					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<FloatingInput
							label='First Name'
							value={formData.firstName}
							onChange={value => setFormData(prev => ({ ...prev, firstName: value }))}
							placeholder='Enter first name'
							required
						/>
						<FloatingInput
							label='Last Name'
							value={formData.lastName}
							onChange={value => setFormData(prev => ({ ...prev, lastName: value }))}
							placeholder='Enter last name'
							required
						/>
					</div>

					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<FloatingInput
							label='Contact Number'
							value={formData.contact || ''}
							onChange={value => setFormData(prev => ({ ...prev, contact: value }))}
							placeholder='Enter contact number'
						/>
						<FloatingDropdown
							label='Gender'
							value={formData.gender || ''}
							onChange={value =>
								setFormData(prev => ({
									...prev,
									gender: value || '',
								}))
							}
							options={genderOptions}
							placeholder='Select gender'
						/>
					</div>

					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<FloatingDropdown
							label='User Type'
							value={formData.userTypeId?.toString() || ''}
							onChange={value =>
								setFormData(prev => ({
									...prev,
									userTypeId: value ? Number(value) : undefined,
								}))
							}
							options={userTypeOptions}
							placeholder='Select user type'
						/>
						<FloatingDropdown
							label='City'
							value={formData.cityId?.toString() || ''}
							onChange={value =>
								setFormData(prev => ({
									...prev,
									cityId: value ? Number(value) : undefined,
								}))
							}
							options={cities}
							placeholder='Select city'
							disabled={citiesLoading}
						/>
					</div>

					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<FloatingInput
							label='Password'
							type='password'
							value={formData.userPassword || ''}
							onChange={value => setFormData(prev => ({ ...prev, userPassword: value }))}
							placeholder='Enter password'
							required
						/>
						<FloatingInput
							label='Confirm Password'
							type='password'
							value={confirmPassword}
							onChange={setConfirmPassword}
							placeholder='Confirm password'
							required
						/>
					</div>

					<div className='flex gap-3 justify-end pt-4 border-t border-border'>
						<Button
							variant='outline'
							onClick={() => navigate('/ops-admin/users')}
							disabled={loading}
						>
							Cancel
						</Button>
						<Button
							variant='primary'
							type='submit'
							loading={loading}
						>
							Create User
						</Button>
					</div>
				</form>
			</Card>

			<Snackbar
				open={snackbar.open}
				message={snackbar.message}
				type={snackbar.type}
				autoHideDuration={4000}
				onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
			/>
		</div>
	);
};
