/**
 * Menu Management API Service
 * Handles CRUD operations for menus and menu permissions
 */

import { apiService, ApiResponse } from './api';

// Types
export interface Menu {
	id: number;
	name: string;
	slug: string;
	parent_id: number | null;
	sort_order: number;
	level: number;
	badge: string | null;
	status: number;
	created_at: string | null;
	updated_at: string | null;
	parent_name: string | null;
	children?: Menu[];
	permissions?: MenuPermission[];
	has_children?: boolean;
}

export interface MenuPermission {
	id: number;
	user_type_id: number;
	menu_id: number;
	access: number; // 1 or 0
	created_by: number;
	updated_by: number;
	created_at: string;
	updated_at: string;
}

export interface UserType {
	id: number;
	name: string;
	description: string | null;
	priority: number;
	status: number;
}

export interface CreateMenuRequest {
	name: string;
	slug: string;
	parent_id?: number | null;
	sort_order?: number;
	badge?: string | null;
	status?: number;
}

export interface UpdateMenuRequest {
	name?: string;
	slug?: string;
	parent_id?: number | null;
	sort_order?: number;
	badge?: string | null;
	status?: number;
}

export interface AssignPermissionRequest {
	user_type_ids: number[];
	menu_id: number;
	grant_access_to_children?: boolean;
	custom_permissions?: {
		[menu_id: string]: boolean;
	};
}

// Menu Management API Service
export class MenuManagementApiService {
	/**
	 * Get all menus
	 */
	static async getMenus(): Promise<ApiResponse<{ menus: Menu[] }>> {
		return apiService.get('/menus');
	}

	/**
	 * Get menu by ID
	 */
	static async getMenu(id: number): Promise<ApiResponse<Menu>> {
		return apiService.get(`/menus/${id}`);
	}

	/**
	 * Create new menu
	 */
	static async createMenu(data: CreateMenuRequest): Promise<ApiResponse<Menu>> {
		return apiService.post('/menus', data);
	}

	/**
	 * Update menu
	 */
	static async updateMenu(id: number, data: UpdateMenuRequest): Promise<ApiResponse<Menu>> {
		return apiService.put(`/menus/${id}`, data);
	}

	/**
	 * Delete menu
	 */
	static async deleteMenu(id: number): Promise<ApiResponse<void>> {
		return apiService.delete(`/menus/${id}`);
	}

	/**
	 * Get all user types
	 */
	static async getUserTypes(): Promise<ApiResponse<UserType[]>> {
		return apiService.get('/users/getUserTypes', {
			params: {
				filter: {},
				sortField: 'name',
				sortOrder: 'asc',
				pageNumber: 1,
				pageSize: 10,
				showAll: true,
			},
		});
	}

	/**
	 * Get menu permissions
	 */
	static async getMenuPermissions(menuId: number): Promise<
		ApiResponse<{
			menu: Menu & { permissions: MenuPermission[] };
			descendants: Array<
				Menu & { permissions: MenuPermission[]; has_children: boolean; children: any[] }
			>;
			user_types: UserType[];
		}>
	> {
		return apiService.get(`/menus/${menuId}/permissions`);
	}

	/**
	 * Bulk update menu permissions for multiple menus
	 */
	static async bulkUpdateMenuPermissions(
		menuPermissions: Array<{
			menu_id: number;
			permissions: { user_type_id: number; access: boolean }[];
		}>
	): Promise<ApiResponse<any>> {
		return apiService.post('/menus/permissions/bulk', { menu_permissions: menuPermissions });
	}

	/**
	 * Update menu permissions
	 */
	static async updateMenuPermissions(
		menuId: number,
		permissions: { user_type_id: number; access: boolean }[]
	): Promise<ApiResponse<any>> {
		return apiService.put(`/menus/${menuId}/permissions`, { permissions });
	}

	/**
	 * Assign permissions to user types for a menu
	 */
	static async assignPermissions(data: AssignPermissionRequest): Promise<ApiResponse<void>> {
		return apiService.post('/menu-permissions/assign', data);
	}

	/**
	 * Get permissions for all menus (admin view)
	 */
	static async getAllPermissions(): Promise<ApiResponse<MenuPermission[]>> {
		return apiService.get('/menu-permissions');
	}

	/**
	 * Bulk update permissions
	 */
	static async bulkUpdatePermissions(
		permissions: {
			user_type_id: number;
			menu_id: number;
			access: number;
		}[]
	): Promise<ApiResponse<void>> {
		return apiService.post('/menu-permissions/bulk-update', { permissions });
	}
}
