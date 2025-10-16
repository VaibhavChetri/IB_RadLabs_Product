/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */

import { apiService, ApiResponse } from './api';

// Types
export interface LoginCredentials {
	username: string;
	password: string;
}

export interface LoginResponse {
	access_token: string;
	refresh_token?: string;
	token_type?: string;
	expires_in?: number;
	user_id?: number;
	user_name?: string;
	user_email?: string;
	user_role?: string;
	// Additional fields that might be returned
	scope?: string;
	created_at?: string;
}

export interface RefreshTokenResponse {
	access_token: string;
	refresh_token?: string;
	token_type: string;
	expires_in: number;
}

export interface UserProfile {
	id: number;
	username: string;
	email: string;
	role: string;
	firstName?: string;
	lastName?: string;
	avatar?: string;
	createdAt: string;
	updatedAt: string;
}

// Authentication API Service
export class AuthApiService {
	/**
	 * Login with username and password
	 */
	static async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
		const response = await apiService.postUrlEncoded('/oauth/access_token', {
			username: credentials.username,
			password: credentials.password,
		});

		// Store tokens if login is successful
		if (response.data && response.data.access_token) {
			localStorage.setItem(import.meta.env.VITE_AUTH_TOKEN_KEY || 'auth_token', response.data.access_token);
			
			if (response.data.refresh_token) {
				localStorage.setItem(import.meta.env.VITE_REFRESH_TOKEN_KEY || 'refresh_token', response.data.refresh_token);
			}
		}

		return response;
	}

	/**
	 * Refresh access token
	 */
	static async refreshToken(refreshToken: string): Promise<ApiResponse<RefreshTokenResponse>> {
		return apiService.post('/oauth/refresh', {
			refresh_token: refreshToken,
		});
	}

	/**
	 * Logout user
	 */
	static async logout(): Promise<ApiResponse<void>> {
		return apiService.post('/oauth/logout');
	}

	/**
	 * Get current user profile
	 */
	static async getProfile(): Promise<ApiResponse<UserProfile>> {
		return apiService.get('/user/profile');
	}

	/**
	 * Update user profile
	 */
	static async updateProfile(profileData: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
		return apiService.put('/user/profile', profileData);
	}

	/**
	 * Change password
	 */
	static async changePassword(data: {
		currentPassword: string;
		newPassword: string;
		confirmPassword: string;
	}): Promise<ApiResponse<void>> {
		return apiService.post('/user/change-password', data);
	}

	/**
	 * Request password reset
	 */
	static async requestPasswordReset(email: string): Promise<ApiResponse<void>> {
		return apiService.post('/user/forgot-password', { email });
	}

	/**
	 * Reset password with token
	 */
	static async resetPassword(data: {
		token: string;
		newPassword: string;
		confirmPassword: string;
	}): Promise<ApiResponse<void>> {
		return apiService.post('/user/reset-password', data);
	}

	/**
	 * Verify email
	 */
	static async verifyEmail(token: string): Promise<ApiResponse<void>> {
		return apiService.post('/user/verify-email', { token });
	}

	/**
	 * Resend verification email
	 */
	static async resendVerificationEmail(): Promise<ApiResponse<void>> {
		return apiService.post('/user/resend-verification');
	}
}
