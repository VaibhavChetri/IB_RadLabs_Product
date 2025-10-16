/**
 * API Usage Examples
 * Demonstrates how to use the API services and hooks
 */

import { AuthApiService, DashboardApiService, userService } from '../services';
import { useApi, useFormApi, useFileUpload } from '../hooks/useApi';

// Example 1: Using API services directly
export const directApiUsage = async () => {
	try {
		// Login
		const loginResponse = await AuthApiService.login({
			username: 'ch-mumbai',
			password: 'ch-mumbai',
		});
		console.log('Login successful:', loginResponse.data);

		// Get dashboard stats
		const statsResponse = await DashboardApiService.getStats({
			dateRange: {
				start: '2024-01-01',
				end: '2024-12-31',
			},
			period: 'monthly',
		});
		console.log('Dashboard stats:', statsResponse.data);

		// Get user profile
		const profileResponse = await AuthApiService.getProfile();
		console.log('User profile:', profileResponse.data);
	} catch (error) {
		console.error('API call failed:', error);
	}
};

// Example 2: Using hooks in React components
export const LoginForm = () => {
	const loginApi = useFormApi('login', AuthApiService.login);

	// Example function - not used in this demo
	/*
	const _handleSubmit = async (_formData: { username: string; password: string }) => {
		try {
			const result = await loginApi.submit(_formData);
			console.log('Login successful:', result.data);
			// Handle successful login (redirect, store token, etc.)
		} catch (error) {
			console.error('Login failed:', error);
		}
	};
	*/

	return (
		<div>
			{loginApi.loading && <div>Logging in...</div>}
			{loginApi.error && <div>Error: {loginApi.error}</div>}
			{/* Your form JSX here */}
		</div>
	);
};

// Example 3: Using generic CRUD service
export const UserManagement = () => {
	const usersApi = useApi('users', userService.getAll);

	const loadUsers = async () => {
		try {
			const result = await usersApi.execute({});
			console.log('Users loaded:', result.data);
		} catch (error) {
			console.error('Failed to load users:', error);
		}
	};

	return (
		<div>
			{usersApi.loading && <div>Loading users...</div>}
			{usersApi.error && <div>Error: {usersApi.error}</div>}
			<button onClick={loadUsers}>Load Users</button>
		</div>
	);
};

// Example 4: File upload with progress
export const FileUploadComponent = () => {
	const uploadApi = useFileUpload('file-upload', async (file, onProgress) => {
		// This would typically use the fileService.upload method
		const formData = new FormData();
		formData.append('file', file);

		// Simulate API call with progress
		return new Promise(resolve => {
			let progress = 0;
			const interval = setInterval(() => {
				progress += 10;
				onProgress?.(progress);
				if (progress >= 100) {
					clearInterval(interval);
					resolve({
						data: { id: '123', url: '/files/123' },
						status: 200,
						success: true,
					});
				}
			}, 100);
		});
	});

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			uploadApi.upload(file);
		}
	};

	return (
		<div>
			<input type='file' onChange={handleFileSelect} />
			{uploadApi.isUploading && (
				<div>
					<div>Uploading... {uploadApi.uploadProgress}%</div>
					<div style={{ width: '100%', backgroundColor: '#f0f0f0' }}>
						<div
							style={{
								width: `${uploadApi.uploadProgress}%`,
								backgroundColor: '#007bff',
								height: '20px',
							}}
						/>
					</div>
				</div>
			)}
			{uploadApi.error && <div>Upload failed: {uploadApi.error}</div>}
		</div>
	);
};

// Example 5: Environment configuration
export const environmentExample = () => {
	// These values come from your .env file
	const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
	const apiTimeout = import.meta.env.VITE_API_TIMEOUT;
	const authTokenKey = import.meta.env.VITE_AUTH_TOKEN_KEY;

	console.log('API Base URL:', apiBaseUrl);
	console.log('API Timeout:', apiTimeout);
	console.log('Auth Token Key:', authTokenKey);

	// Example API call using environment variables
	/*
	const _makeApiCall = async () => {
		const response = await fetch(`${apiBaseUrl}/test`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${localStorage.getItem(authTokenKey)}`,
			},
		});
		return response.json();
	};
	*/
};
