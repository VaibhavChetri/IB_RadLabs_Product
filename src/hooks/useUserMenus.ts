/**
 * Custom Hook for Menu Management
 * Provides menu permissions and filtering functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { MenuItem, MenuPermission } from '../types/menu';
import { ALL_MENU_ITEMS } from '../config/menuConfig';
import { filterMenusByPermissions, debugMenuPermissions } from '../utils/menuPermissions';
import { RootState } from '../store/index';
import { updateUser } from '../store/slices/authSlice';

export interface UseUserMenusReturn {
	// Menu data
	menus: MenuItem[];
	permissions: Record<string, MenuPermission>;
	accessibleMenuIds: string[];
	userType: string;
	userTypeId: number;

	// Loading states
	loading: boolean;
	error: string | null;

	// Actions
	refreshPermissions: (newPermissions?: Record<string, MenuPermission>) => Promise<void>;
	checkMenuAccess: (menuId: string) => boolean;

	// Debug utilities
	debugPermissions: () => void;
}

export const useUserMenus = (): UseUserMenusReturn => {
	const dispatch = useDispatch();
	const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

	const [accessibleMenuIds, setAccessibleMenuIds] = useState<string[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	// Get permissions from Redux state
	const permissions = user?.menuPermissions || {};

	// Update accessible menu IDs when permissions change
	useEffect(() => {
		if (permissions && Object.keys(permissions).length > 0) {
			const accessibleIds = Object.keys(permissions).filter(id => permissions[id]?.access);
			setAccessibleMenuIds(accessibleIds);
			setLoading(false);
			setError(null);

			// Debug in development
			if (import.meta.env.DEV) {
				console.log('Loaded menu permissions from Redux:', permissions);
				debugMenuPermissions(permissions);
			}
		} else if (isAuthenticated) {
			console.warn('No menu permissions found in Redux state');
			setError('No menu permissions found. Please log in again.');
			setLoading(false);
		}
	}, [permissions, isAuthenticated]);

	// Filter menus based on permissions
	const menus = filterMenusByPermissions(ALL_MENU_ITEMS, permissions);

	// Check if user has access to a specific menu
	const checkMenuAccess = useCallback(
		(menuId: string): boolean => {
			return permissions[menuId]?.access === true;
		},
		[permissions]
	);

	// Refresh permissions (useful after role changes)
	const refreshPermissions = useCallback(
		async (newPermissions?: Record<string, MenuPermission>) => {
			try {
				if (newPermissions) {
					// Update Redux state with new permissions
					dispatch(updateUser({ menuPermissions: newPermissions }));
					console.log('✅ Updated Redux state with new menu permissions');
				} else {
					console.log('🔄 No new permissions provided, Redux state will be used');
				}
			} catch (error) {
				console.error('Failed to refresh menu permissions:', error);
			}
		},
		[dispatch]
	);

	// Debug utility
	const debugPermissions = useCallback(() => {
		debugMenuPermissions(permissions);
	}, [permissions]);

	return {
		menus,
		permissions,
		accessibleMenuIds,
		userType: user?.role || '', // From Redux store
		userTypeId: user?.userTypeId || 0, // From Redux store
		loading,
		error,
		refreshPermissions,
		checkMenuAccess,
		debugPermissions,
	};
};
