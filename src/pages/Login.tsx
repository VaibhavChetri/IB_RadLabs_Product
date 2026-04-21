import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch } from '../store';
import { loginSuccess } from '../store/slices/authSlice';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { AuthApiService } from '../services/authApi';
import { useFormApi } from '../hooks/useApi';
import { apiService } from '../services/api';
import TokenManager from '../utils/tokenManager';

export const Login: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');

	// Use the form API hook for login
	const loginApi = useFormApi('login', AuthApiService.login);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		try {
			const result = await loginApi.submit({
				username,
				password,
			});

			// Handle successful login
			if (result.status_code === 200 && result.data && result.data.access_token) {
				// Dispatch login success with user data from the response
				// Fetch approver status before navigating
				let isApprover = false;
				let isDirectApprover = false;
				let proxyEligible = false;
				try {
					const approverRes = await apiService.get('/procurement/me/is-approver');
					isApprover = approverRes?.data?.isApprover ?? false;
					isDirectApprover = approverRes?.data?.isDirectApprover ?? false;
					proxyEligible = approverRes?.data?.proxy?.eligible ?? false;
				} catch {
					isApprover = false;
					isDirectApprover = false;
					proxyEligible = false;
				}

				dispatch(
					loginSuccess({
						id: result.data.user.id.toString(),
						name: `${result.data.user.first_name} ${result.data.user.last_name}`.trim(),
						email: result.data.user.email,
						role: result.data.user.user_type_name, // Use backend-provided user type name
						userTypeId: result.data.user.user_type_id,
						userTypeName: result.data.user.user_type_name, // Use backend-provided user type name
						city_id: result.data.user.city_id,
						city_name: result.data.user.city_name, // Use backend-provided city name
						state_id: result.data.user.state_id,
						state_name: result.data.user.state_name, // Use backend-provided state name
						menuPermissions: result.data.menu_permissions || {},
						isApprover,
						isDirectApprover,
						proxyEligible,
					})
				);

				// Persist approver flags so they survive page refresh
				const storedUserData = TokenManager.getUserData();
				if (storedUserData) {
					TokenManager.setUserData({
						...storedUserData,
						isApprover,
						isDirectApprover,
						proxyEligible,
					});
				}

				navigate('/');
			} else {
				setError('Login failed: Invalid response from server');
			}
		} catch (error: unknown) {
			console.error('Login error:', error);
			setError((error as Error).message || 'Login failed. Please check your credentials.');
		}
	};

	return (
		<div className='min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8'>
			<div className='max-w-md w-full space-y-8'>
				<div className='text-center'>
					<div className='mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center'>
						<span className='text-primary-foreground font-bold text-lg'>IB</span>
					</div>
					<h2 className='mt-6 text-h3 text-foreground'>Sign in to your account</h2>
					<p className='mt-2 text-body2 text-foreground-secondary'>
						Welcome back! Please sign in to continue.
					</p>
				</div>

				<Card className='p-8'>
					<form className='space-y-6' onSubmit={handleLogin}>
						{error && (
							<div className='p-3 bg-error/10 border border-error/20 rounded-lg'>
								<p className='text-sm text-error'>{error}</p>
							</div>
						)}

						<Input
							label='Username'
							type='text'
							placeholder='Enter your username'
							value={username}
							onChange={e => setUsername(e.target.value)}
							required
						/>
						<Input
							label='Password'
							type='password'
							placeholder='Enter your password'
							value={password}
							onChange={e => setPassword(e.target.value)}
							required
						/>

						<div className='flex items-center justify-between'>
							<div className='flex items-center'>
								<input
									id='remember-me'
									name='remember-me'
									type='checkbox'
									className='h-4 w-4 text-primary focus:ring-primary border-border rounded'
								/>
								<label
									htmlFor='remember-me'
									className='ml-2 block text-sm text-foreground-secondary'
								>
									Remember me
								</label>
							</div>

							<div className='text-sm'>
								<a href='#' className='font-medium text-primary hover:text-primary/80'>
									Forgot your password?
								</a>
							</div>
						</div>

						<Button type='submit' className='w-full' disabled={loginApi.isSubmitting}>
							{loginApi.isSubmitting ? 'Signing in...' : 'Sign in'}
						</Button>
					</form>
				</Card>
			</div>
		</div>
	);
};
