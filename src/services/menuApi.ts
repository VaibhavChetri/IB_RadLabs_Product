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
	 */
	static async getUserMenuPermissions(): Promise<ApiResponse<UserMenuPermissions>> {
		return apiService.get('/menus/permissions');
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
