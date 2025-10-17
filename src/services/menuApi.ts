/**
 * Menu API Service
 * Handles menu permission related API calls
 */

import { apiService, ApiResponse } from '../services/api';
import { UserMenuPermissions } from '../types/menu';
import { MOCK_LOGIN_RESPONSE_WITH_MENUS } from '../mocks/menuPermissions';

export class MenuApiService {
	/**
	 * Get user's menu permissions
	 * Returns hierarchical permission structure for all menus
	 *
	 * TODO: Replace with actual API call when backend is ready
	 * For now, returns mock data for "City Head" user type
	 */
	static async getUserMenuPermissions(): Promise<ApiResponse<UserMenuPermissions>> {
		// TODO: Replace with actual API call
		// return apiService.get('/user/menu-permissions');

		// Mock response for development - extract menu permissions from login response
		return new Promise(resolve => {
			setTimeout(() => {
				const mockResponse = {
					status_code: 200,
					status: 'Success',
					message: null,
					data: {
						user_type: 'City Head',
						user_type_id: 1,
						allowedMenus: MOCK_LOGIN_RESPONSE_WITH_MENUS.data.menu_permissions,
					},
				};
				resolve(mockResponse as ApiResponse<UserMenuPermissions>);
			}, 500); // Simulate API delay
		});
	}

	/**
	 * Check if user has access to a specific menu
	 */
	static async checkMenuAccess(menuId: string): Promise<ApiResponse<{ hasAccess: boolean }>> {
		return apiService.get(`/user/menu-access/${menuId}`);
	}

	/**
	 * Get user's accessible menu IDs (flattened list)
	 */
	static async getAccessibleMenuIds(): Promise<ApiResponse<{ menuIds: string[] }>> {
		return apiService.get('/user/accessible-menus');
	}

	/**
	 * Refresh menu permissions (useful after role changes)
	 */
	static async refreshMenuPermissions(): Promise<ApiResponse<UserMenuPermissions>> {
		return apiService.post('/user/refresh-menu-permissions');
	}
}
