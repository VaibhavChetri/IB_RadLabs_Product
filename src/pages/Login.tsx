import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch } from '../store';
import { loginSuccess } from '../store/slices/authSlice';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export const Login: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();
	const [email, setEmail] = useState('admin@example.com');
	const [password, setPassword] = useState('password123');
	const [error, setError] = useState('');

	const handleLogin = (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		// Demo credentials
		if (email === 'admin@example.com' && password === 'password123') {
			dispatch(
				loginSuccess({
					id: '1',
					name: 'John Doe',
					email: 'admin@example.com',
					role: 'Administrator',
				}),
			);
			navigate('/');
		} else {
			setError('Invalid credentials. Use admin@example.com / password123');
		}
	};

	return (
		<div className='min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8'>
			<div className='max-w-md w-full space-y-8'>
				<div className='text-center'>
					<div className='mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center'>
						<span className='text-primary-foreground font-bold text-lg'>
							IB
						</span>
					</div>
					<h2 className='mt-6 text-h3 text-foreground'>
						Sign in to your account
					</h2>
					<p className='mt-2 text-body2 text-foreground-secondary'>
						Welcome back! Please sign in to continue.
					</p>
					<div className='mt-4 p-3 bg-background-secondary rounded-lg'>
						<p className='text-sm text-foreground-muted'>
							<strong>Demo Credentials:</strong>
						</p>
						<p className='text-sm text-foreground-muted'>
							Email: admin@example.com
						</p>
						<p className='text-sm text-foreground-muted'>
							Password: password123
						</p>
					</div>
				</div>

				<Card className='p-8'>
					<form className='space-y-6' onSubmit={handleLogin}>
						{error && (
							<div className='p-3 bg-error/10 border border-error/20 rounded-lg'>
								<p className='text-sm text-error'>{error}</p>
							</div>
						)}

						<Input
							label='Email address'
							type='email'
							placeholder='Enter your email'
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
						<Input
							label='Password'
							type='password'
							placeholder='Enter your password'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
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
								<a
									href='#'
									className='font-medium text-primary hover:text-primary/80'
								>
									Forgot your password?
								</a>
							</div>
						</div>

						<Button type='submit' className='w-full'>
							Sign in
						</Button>
					</form>
				</Card>
			</div>
		</div>
	);
};
