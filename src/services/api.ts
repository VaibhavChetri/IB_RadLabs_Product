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

// Environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3099/v1/api';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 10000;
const AUTH_TOKEN_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY || 'auth_token';
const REFRESH_TOKEN_KEY = import.meta.env.VITE_REFRESH_TOKEN_KEY || 'refresh_token';

// API Response Types
export interface ApiResponse<T = any> {
	data: T;
	message?: string;
	statusCode?: number;
	success?: boolean;
}

export interface ApiError {
	message: string;
	status: number;
	code?: string;
	details?: any;
}

// Token Management
export class TokenManager {
	static getToken(): string | null {
		return localStorage.getItem(AUTH_TOKEN_KEY);
	}

	static setToken(token: string): void {
		localStorage.setItem(AUTH_TOKEN_KEY, token);
	}

	static removeToken(): void {
		localStorage.removeItem(AUTH_TOKEN_KEY);
	}

	static getRefreshToken(): string | null {
		return localStorage.getItem(REFRESH_TOKEN_KEY);
	}

	static setRefreshToken(token: string): void {
		localStorage.setItem(REFRESH_TOKEN_KEY, token);
	}

	static removeRefreshToken(): void {
		localStorage.removeItem(REFRESH_TOKEN_KEY);
	}

	static clearTokens(): void {
		this.removeToken();
		this.removeRefreshToken();
	}
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
		// Add auth token to requests
		const token = TokenManager.getToken();
		if (token && config.headers) {
			config.headers.Authorization = `Bearer ${token}`;
		}

		// Add request timestamp for debugging
		(config as any).metadata = { startTime: new Date() };

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
					// Attempt to refresh token
					const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
						refresh_token: refreshToken,
					});

					const { access_token, refresh_token: newRefreshToken } = refreshResponse.data;

					TokenManager.setToken(access_token);
					if (newRefreshToken) {
						TokenManager.setRefreshToken(newRefreshToken);
					}

					// Retry original request with new token
					if (originalRequest.headers) {
						originalRequest.headers.Authorization = `Bearer ${access_token}`;
					}

					return apiClient(originalRequest);
				}
			} catch (refreshError) {
				// Refresh failed, redirect to login
				TokenManager.clearTokens();
				window.location.href = '/login';
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
		return {
			data: response.data,
			message: response.data.message,
			statusCode: response.status,
			success: true,
		};
	}

	public async post<T = any>(
		url: string,
		data?: any,
		config?: AxiosRequestConfig
	): Promise<ApiResponse<T>> {
		const response = await this.client.post(url, data, config);
		return {
			data: response.data,
			message: response.data.message,
			statusCode: response.status,
			success: true,
		};
	}

	public async put<T = any>(
		url: string,
		data?: any,
		config?: AxiosRequestConfig
	): Promise<ApiResponse<T>> {
		const response = await this.client.put(url, data, config);
		return {
			data: response.data,
			message: response.data.message,
			statusCode: response.status,
			success: true,
		};
	}

	public async patch<T = any>(
		url: string,
		data?: any,
		config?: AxiosRequestConfig
	): Promise<ApiResponse<T>> {
		const response = await this.client.patch(url, data, config);
		return {
			data: response.data,
			message: response.data.message,
			statusCode: response.status,
			success: true,
		};
	}

	public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
		const response = await this.client.delete(url, config);
		return {
			data: response.data,
			message: response.data.message,
			statusCode: response.status,
			success: true,
		};
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
