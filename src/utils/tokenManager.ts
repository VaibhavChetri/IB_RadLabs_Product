/**
 * Token Management System
 * Handles Bearer token storage, validation, and auto-logout after inactivity
 */

import { store, persistor } from '../store';
import { logout } from '../store/slices/authSlice';
import { MenuPermission } from '../types/menu';

export interface TokenData {
	access_token: string;
	refresh_token: string;
	access_expires: string;
	refresh_expires: string;
	token_type: string;
	expires_in: number;
}

export interface UserActivity {
	lastActivity: number;
	isActive: boolean;
}

class TokenManager {
	private static readonly AUTH_TOKEN_KEY = 'auth_token';
	private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
	private static readonly TOKEN_DATA_KEY = 'token_data';
	private static readonly USER_ACTIVITY_KEY = 'user_activity';
	private static readonly INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds
	private static readonly TOKEN_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
	private static inactivityTimer: NodeJS.Timeout | null = null;
	private static tokenCheckTimer: NodeJS.Timeout | null = null;

	/**
	 * Store complete token data
	 */
	static setTokenData(tokenData: TokenData): void {
		localStorage.setItem(this.TOKEN_DATA_KEY, JSON.stringify(tokenData));
		localStorage.setItem(this.AUTH_TOKEN_KEY, tokenData.access_token);
		localStorage.setItem(this.REFRESH_TOKEN_KEY, tokenData.refresh_token);

		// Update user activity
		this.updateUserActivity();

		// Start inactivity monitoring
		this.startInactivityMonitoring();
	}

	/**
	 * Get access token
	 */
	static getAccessToken(): string | null {
		return localStorage.getItem(this.AUTH_TOKEN_KEY);
	}

	/**
	 * Get refresh token
	 */
	static getRefreshToken(): string | null {
		return localStorage.getItem(this.REFRESH_TOKEN_KEY);
	}

	/**
	 * Get complete token data
	 */
	static getTokenData(): TokenData | null {
		const tokenData = localStorage.getItem(this.TOKEN_DATA_KEY);
		return tokenData ? JSON.parse(tokenData) : null;
	}

	/**
	 * Check if token is expired
	 */
	static isTokenExpired(): boolean {
		const tokenData = this.getTokenData();
		if (!tokenData) return true;

		const now = new Date().getTime();
		const expiresAt = new Date(tokenData.access_expires).getTime();

		return now >= expiresAt;
	}

	/**
	 * Check if refresh token is expired
	 */
	static isRefreshTokenExpired(): boolean {
		const tokenData = this.getTokenData();
		if (!tokenData) return true;

		const now = new Date().getTime();
		const expiresAt = new Date(tokenData.refresh_expires).getTime();

		return now >= expiresAt;
	}

	/**
	 * Update user activity timestamp
	 */
	static updateUserActivity(): void {
		const activity: UserActivity = {
			lastActivity: Date.now(),
			isActive: true,
		};
		localStorage.setItem(this.USER_ACTIVITY_KEY, JSON.stringify(activity));
	}

	/**
	 * Get user activity data
	 */
	static getUserActivity(): UserActivity | null {
		const activity = localStorage.getItem(this.USER_ACTIVITY_KEY);
		return activity ? JSON.parse(activity) : null;
	}

	/**
	 * Check if user has been inactive for too long
	 */
	static isUserInactive(): boolean {
		const activity = this.getUserActivity();
		if (!activity) return true;

		const now = Date.now();
		const timeSinceLastActivity = now - activity.lastActivity;

		return timeSinceLastActivity > this.INACTIVITY_TIMEOUT;
	}

	/**
	 * Start monitoring for user inactivity
	 */
	static startInactivityMonitoring(): void {
		// Clear existing timer
		if (this.inactivityTimer) {
			clearInterval(this.inactivityTimer);
		}

		// Check every 5 minutes
		this.inactivityTimer = setInterval(() => {
			if (this.isUserInactive()) {
				console.log('User inactive for 1 hour, logging out...');
				this.logout();
			}
		}, this.TOKEN_CHECK_INTERVAL);
	}

	/**
	 * Start monitoring token expiration
	 */
	static startTokenMonitoring(): void {
		// Clear existing timer
		if (this.tokenCheckTimer) {
			clearInterval(this.tokenCheckTimer);
		}

		// Check token every 5 minutes
		this.tokenCheckTimer = setInterval(() => {
			if (this.isTokenExpired()) {
				console.log('Access token expired, attempting refresh...');
				this.handleTokenExpiration();
			}
		}, this.TOKEN_CHECK_INTERVAL);
	}

	/**
	 * Handle token expiration - attempt refresh or logout
	 */
	static async handleTokenExpiration(): Promise<void> {
		if (this.isRefreshTokenExpired()) {
			console.log('Refresh token also expired, logging out...');
			this.logout();
			return;
		}

		// TODO: Implement token refresh logic here
		// For now, just logout if token is expired
		this.logout();
	}

	/**
	 * Clear all tokens and logout
	 */
	static async logout(): Promise<void> {
		try {
			// Call API logout endpoint (optional - for server-side session cleanup)
			// Note: This is fire-and-forget, we don't wait for it to complete
			this.callApiLogout().catch(error => {
				console.warn('API logout failed:', error);
				// Continue with local logout even if API call fails
			});
		} catch (error) {
			console.warn('Logout error:', error);
		}

		// Clear timers
		if (this.inactivityTimer) {
			clearInterval(this.inactivityTimer);
			this.inactivityTimer = null;
		}
		if (this.tokenCheckTimer) {
			clearInterval(this.tokenCheckTimer);
			this.tokenCheckTimer = null;
		}

		// Clear all app-specific localStorage keys
		const appKeys = [
			'auth_token',
			'refresh_token',
			'token_data',
			'user_activity',
			'expandedMenus',
			'menu_permissions',
			'user_data',
			'accessToken',
			'accessTokenv2',
			'token',
			'refreshToken',
			'cityid',
			'customer',
			'iconify-count',
			'iconify-version',
			'iconify0',
			'iconify1',
			'iconify2',
			'iconify3',
			'iconify4',
			'iconify5',
			'iconify6',
			'i18nextLng',
			'masterPlanData',
			'redux-product',
			'redux-root',
			'persist:root',
			'restaurant_cart',
			'restaurantid',
			'selectedClientLocation',
			'sent-transit-plan-filters',
			'sku-listing-client-id',
			'sku-listing-status',
			'sku-mapping-client',
			'sku-mapping-rows',
			'sku-mapping-rows-edit',
			'sku-listing-refresh-timestamp',
			'uploadedImages',
			'userTypeId',
			'user_activity',
			'client-',
			'transit-plan-',
			'inventory-',
			'kam-',
		];

		// Clear specific keys
		appKeys.forEach(key => {
			if (key.endsWith('-')) {
				// Handle prefix keys (like 'client-')
				Object.keys(localStorage).forEach(k => {
					if (k.startsWith(key)) {
						localStorage.removeItem(k);
					}
				});
			} else {
				localStorage.removeItem(key);
			}
		});

		// Also clear sessionStorage
		sessionStorage.clear();

		// Purge redux-persist storage (clears all persisted Redux state)
		persistor.purge();

		// Dispatch logout action
		store.dispatch(logout());

		// Redirect to login
		window.location.href = '/login';
	}

	/**
	 * Call API logout endpoint
	 */
	private static async callApiLogout(): Promise<void> {
		const token = this.getAccessToken();
		if (!token) return;

		try {
			// Import here to avoid circular dependency
			const { apiService } = await import('../services/api');
			await apiService.post(
				'/oauth/logout',
				{},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);
		} catch (error) {
			// Ignore API errors during logout
			console.warn('API logout call failed:', error);
		}
	}

	/**
	 * Store menu permissions (received from login response)
	 */
	static setMenuPermissions(permissions: Record<string, MenuPermission>): void {
		localStorage.setItem('menu_permissions', JSON.stringify(permissions));
	}

	/**
	 * Get stored menu permissions
	 */
	static getMenuPermissions(): Record<string, MenuPermission> | null {
		const permissions = localStorage.getItem('menu_permissions');
		return permissions ? JSON.parse(permissions) : null;
	}

	/**
	 * Clear menu permissions (for logout)
	 */
	static clearMenuPermissions(): void {
		localStorage.removeItem('menu_permissions');
	}

	/**
	 * Store user data (for auth restoration)
	 */
	static setUserData(userData: any): void {
		localStorage.setItem('user_data', JSON.stringify(userData));
	}

	/**
	 * Get user data (for auth restoration)
	 */
	static getUserData(): any | null {
		try {
			const userData = localStorage.getItem('user_data');
			return userData ? JSON.parse(userData) : null;
		} catch (error) {
			console.error('Failed to parse user data:', error);
			return null;
		}
	}

	/**
	 * Clear user data (for logout)
	 */
	static clearUserData(): void {
		localStorage.removeItem('user_data');
	}

	/**
	 * Clear all tokens (for logout)
	 */
	static clearTokens(): void {
		this.logout();
	}

	/**
	 * Initialize token monitoring (call this after successful login)
	 */
	static initialize(): void {
		const tokenData = this.getTokenData();
		if (tokenData && !this.isTokenExpired()) {
			this.startInactivityMonitoring();
			this.startTokenMonitoring();
		}
	}

	/**
	 * Get Bearer token for API headers
	 */
	static getBearerToken(): string | null {
		const token = this.getAccessToken();
		return token ? `Bearer ${token}` : null;
	}

	/**
	 * Check if user is authenticated
	 */
	static isAuthenticated(): boolean {
		const token = this.getAccessToken();
		const tokenData = this.getTokenData();

		// Basic checks: token exists and not expired
		if (!token || !tokenData || this.isTokenExpired()) {
			return false;
		}

		// For page refresh, be more lenient with inactivity check
		// Only check inactivity if we have a valid activity record
		const activity = this.getUserActivity();
		if (activity && this.isUserInactive()) {
			return false;
		}

		return true;
	}
}

export default TokenManager;
