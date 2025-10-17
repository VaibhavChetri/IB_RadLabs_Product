/**
 * Menu Permission Utilities
 * Handles filtering and permission checking for hierarchical menus
 */

import { MenuItem, MenuPermission } from '../types/menu';

/**
 * Recursively filter menus based on permissions
 * Only shows menus and submenus that the user has access to
 */
export const filterMenusByPermissions = (
	menus: MenuItem[],
	permissions: Record<string, MenuPermission>
): MenuItem[] => {
	return menus
		.filter(menu => {
			const permission = permissions[menu.id];
			return permission?.access === true;
		})
		.map(menu => {
			const permission = permissions[menu.id];
			
			// If menu has children, recursively filter them
			if (menu.children && permission?.children) {
				const filteredChildren = filterMenusByPermissions(
					menu.children,
					permission.children
				);
				
				// Only include the parent menu if it has accessible children
				// or if it's accessible itself (for parent-only access)
				return {
					...menu,
					children: filteredChildren.length > 0 ? filteredChildren : undefined,
				};
			}
			
			return menu;
		})
		.filter(menu => {
			// Remove parent menus that have no accessible children
			if (menu.children && menu.children.length === 0) {
				return false;
			}
			return true;
		});
};

/**
 * Check if user has access to a specific menu item
 */
export const hasMenuAccess = (
	menuId: string,
	permissions: Record<string, MenuPermission>
): boolean => {
	const permission = permissions[menuId];
	return permission?.access === true;
};

/**
 * Get all accessible menu IDs (flattened)
 */
export const getAccessibleMenuIds = (
	permissions: Record<string, MenuPermission>
): string[] => {
	const accessibleIds: string[] = [];
	
	const traversePermissions = (perms: Record<string, MenuPermission>) => {
		Object.entries(perms).forEach(([id, permission]) => {
			if (permission.access) {
				accessibleIds.push(id);
				if (Object.keys(permission.children).length > 0) {
					traversePermissions(permission.children);
				}
			}
		});
	};
	
	traversePermissions(permissions);
	return accessibleIds;
};

/**
 * Check if a menu path is accessible
 * e.g., ['users', 'users-add'] for Users > Add User
 */
export const isMenuPathAccessible = (
	menuPath: string[],
	permissions: Record<string, MenuPermission>
): boolean => {
	if (menuPath.length === 0) return false;
	
	let currentPermissions = permissions;
	
	for (let i = 0; i < menuPath.length; i++) {
		const menuId = menuPath[i];
		const permission = currentPermissions[menuId];
		
		if (!permission?.access) {
			return false;
		}
		
		// Move to children permissions for next iteration
		currentPermissions = permission.children;
	}
	
	return true;
};

/**
 * Get breadcrumb path for a menu item
 */
export const getMenuBreadcrumb = (
	menuId: string,
	menus: MenuItem[]
): string[] => {
	const findPath = (items: MenuItem[], targetId: string, path: string[] = []): string[] | null => {
		for (const item of items) {
			const currentPath = [...path, item.id];
			
			if (item.id === targetId) {
				return currentPath;
			}
			
			if (item.children) {
				const found = findPath(item.children, targetId, currentPath);
				if (found) return found;
			}
		}
		return null;
	};
	
	return findPath(menus, menuId) || [];
};

/**
 * Debug utility to log menu permissions
 */
export const debugMenuPermissions = (permissions: Record<string, MenuPermission>) => {
	console.group('🔍 Menu Permissions Debug');
	
	const logPermissions = (perms: Record<string, MenuPermission>, level = 0) => {
		Object.entries(perms).forEach(([id, permission]) => {
			const indent = '  '.repeat(level);
			const status = permission.access ? '✅' : '❌';
			console.log(`${indent}${status} ${id}`);
			
			if (Object.keys(permission.children).length > 0) {
				logPermissions(permission.children, level + 1);
			}
		});
	};
	
	logPermissions(permissions);
	console.groupEnd();
};
