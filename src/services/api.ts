/**
 * API Configuration and Axios Setup
 * Industry-standard API client with interceptors, error handling, and token management
 */

import axios, {
	AxiosInstance,
	AxiosRequestConfig,
	AxiosResponse,
	AxiosError,
	InternalAxiosRequestConfig,
} from 'axios';
import TokenManager from '../utils/tokenManager';

// Environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3099/v1/api';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 10000;

// API Response Types
export interface ApiResponse<T = any> {
	status_code: number;
	statusCode?: number; // Alternative format for some APIs
	status: string;
	message: string | null;
	data: T;
}

export interface ApiError {
	message: string;
	status: number;
	code?: string;
	details?: any;
}

// Create Axios instance
const apiClient: AxiosInstance = axios.create({
	baseURL: API_BASE_URL,
	timeout: API_TIMEOUT,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Request interceptor
apiClient.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		// Add Bearer token to requests
		const accessToken = TokenManager.getAccessToken();
		const tokenData = TokenManager.getTokenData();
		const bearerToken = accessToken ? `Bearer ${accessToken}` : null;
		
		// Check if token is expired
		let tokenExpired = false;
		if (tokenData && tokenData.access_expires) {
			const expiryDate = new Date(tokenData.access_expires);
			tokenExpired = expiryDate <= new Date();
		}
		
		// Log token source and details
		console.log('=== TOKEN SOURCE INFO ===');
		console.log('localStorage key used: "auth_token"');
		console.log('Token retrieved from:', localStorage.getItem('auth_token') ? 'localStorage["auth_token"]' : 'NOT FOUND');
		console.log('Access token (raw):', accessToken);
		console.log('Bearer token (formatted):', bearerToken);
		console.log('Token data exists:', !!tokenData);
		if (tokenData) {
			console.log('Token expiry:', tokenData.access_expires);
			console.log('Token expired?', tokenExpired);
		}
		console.log('========================');
		
		if (bearerToken && config.headers) {
			config.headers.Authorization = bearerToken;
		}

		// Update user activity on each request
		TokenManager.updateUserActivity();

		// Add request timestamp for debugging
		(config as any).metadata = { startTime: new Date() };
		
		// Preserve skipAuthRedirect flag from config to request object
		// This allows the response interceptor to check it
		if ((config as any).skipAuthRedirect !== undefined) {
			(config as any).skipAuthRedirect = (config as any).skipAuthRedirect;
		}

		return config;
	},
	(error: AxiosError) => {
		return Promise.reject(error);
	}
);

// Response interceptor
apiClient.interceptors.response.use(
	(response: AxiosResponse) => {
		// Log response time for debugging
		if ((response.config as any).metadata?.startTime) {
			const endTime = new Date();
			const duration = endTime.getTime() - (response.config as any).metadata.startTime.getTime();
			console.log(`API Request to ${response.config.url} took ${duration}ms`);
		}

		return response;
	},
	async (error: AxiosError) => {
		const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

		// Handle 401 Unauthorized - Token refresh
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				const refreshToken = TokenManager.getRefreshToken();
				
				if (refreshToken) {
					// Attempt to refresh token - Use correct endpoint: /oauth/refresh (not /auth/refresh)
					const refreshResponse = await axios.post(`${API_BASE_URL}/oauth/refresh`, {
						refresh_token: refreshToken,
					});

					const { access_token, refresh_token: newRefreshToken } = refreshResponse.data;

					// Update token data in TokenManager
					const currentTokenData = TokenManager.getTokenData();
					if (currentTokenData) {
						TokenManager.setTokenData({
							...currentTokenData,
							access_token,
							refresh_token: newRefreshToken || currentTokenData.refresh_token,
						});
					}

					// Retry original request with new token
					if (originalRequest.headers) {
						originalRequest.headers.Authorization = `Bearer ${access_token}`;
					}

					return apiClient(originalRequest);
				}
			} catch (refreshError) {
				// Refresh failed - check if we should skip redirect
				// Check both config.skipAuthRedirect and the request object itself
				const skipRedirect = 
					(originalRequest as any)?.skipAuthRedirect === true ||
					(originalRequest as any)?.config?.skipAuthRedirect === true ||
					(originalRequest as any)?.skipAuthRedirect === true;
				
				if (!skipRedirect) {
					// Only redirect if not explicitly skipped
					// Add a small delay to allow error handlers to catch the error first
					setTimeout(() => {
						TokenManager.clearTokens();
						window.location.href = '/login';
					}, 100);
				}
				return Promise.reject(refreshError);
			}
		}

		// Handle other errors
		const apiError: ApiError = {
			message: (error.response?.data as any)?.message || error.message || 'An error occurred',
			status: error.response?.status || 500,
			code: error.code,
			details: error.response?.data,
		};

		return Promise.reject(apiError);
	}
);

// API Service Class
export class ApiService {
	private static instance: ApiService;
	private client: AxiosInstance;

	private constructor() {
		this.client = apiClient;
	}

	public static getInstance(): ApiService {
		if (!ApiService.instance) {
			ApiService.instance = new ApiService();
		}
		return ApiService.instance;
	}

	// Generic HTTP methods
	public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
		const response = await this.client.get(url, config);
		return response.data;
	}

	public async post<T = any>(
		url: string,
		data?: any,
		config?: AxiosRequestConfig
	): Promise<ApiResponse<T>> {
		const response = await this.client.post(url, data, config);
		return response.data;
	}

	public async put<T = any>(
		url: string,
		data?: any,
		config?: AxiosRequestConfig
	): Promise<ApiResponse<T>> {
		const response = await this.client.put(url, data, config);
		return response.data;
	}

	public async patch<T = any>(
		url: string,
		data?: any,
		config?: AxiosRequestConfig
	): Promise<ApiResponse<T>> {
		const response = await this.client.patch(url, data, config);
		return response.data;
	}

	public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
		const response = await this.client.delete(url, config);
		return response.data;
	}

	// Form data methods
	public async postFormData<T = any>(
		url: string,
		formData: FormData,
		config?: AxiosRequestConfig
	): Promise<ApiResponse<T>> {
		const response = await this.client.post(url, formData, {
			...config,
			headers: {
				...config?.headers,
				'Content-Type': 'multipart/form-data',
			},
		});
		return response.data;
	}

	// URL encoded data methods
	public async postUrlEncoded<T = any>(
		url: string,
		data: any,
		config?: AxiosRequestConfig
	): Promise<ApiResponse<T>> {
		const response = await this.client.post(url, data, {
			...config,
			headers: {
				...config?.headers,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		});
		return response.data;
	}

	// Upload with progress
	public async uploadWithProgress<T = any>(
		url: string,
		formData: FormData,
		onProgress?: (progressEvent: any) => void,
		config?: AxiosRequestConfig
	): Promise<ApiResponse<T>> {
		const response = await this.client.post(url, formData, {
			...config,
			headers: {
				...config?.headers,
				'Content-Type': 'multipart/form-data',
			},
			onUploadProgress: onProgress,
		});
		return response.data;
	}

	// Set base URL dynamically
	public setBaseURL(baseURL: string): void {
		this.client.defaults.baseURL = baseURL;
	}

	// Set default headers
	public setDefaultHeader(key: string, value: string): void {
		this.client.defaults.headers.common[key] = value;
	}

	// Remove default header
	public removeDefaultHeader(key: string): void {
		delete this.client.defaults.headers.common[key];
	}
}

// Export singleton instance
export const apiService = ApiService.getInstance();

// Export the axios instance for advanced usage
export { apiClient };

// Export types
export type { AxiosRequestConfig, AxiosResponse, AxiosError };
