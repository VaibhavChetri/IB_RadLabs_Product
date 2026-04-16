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

/** Flatten nested permission tree so sidebar can match by menu id (e.g. invoice under billing becomes top-level). */
function flattenPermissionTree(perms: Record<string, MenuPermission>): Record<string, MenuPermission> {
	const flat: Record<string, MenuPermission> = {};
	function walk(p: Record<string, MenuPermission>) {
		Object.entries(p).forEach(([id, perm]) => {
			if (perm && typeof perm === 'object' && 'access' in perm) {
				flat[id] = perm;
				if (perm.children && Object.keys(perm.children).length > 0) {
					walk(perm.children);
				}
			}
		});
	}
	walk(perms);
	return flat;
}

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

	// Flatten so nested menus (e.g. invoice under billing) are visible at top level for sidebar match
	const flatPermissions = flattenPermissionTree(permissions);

	// Normalize: API uses "invoice-menu" (and possibly invoices, billing, etc.); config uses "invoice"
	const normalizedPermissions = { ...flatPermissions };
	let invoicePerm: MenuPermission | undefined;
	if (flatPermissions['invoice-menu']) {
		invoicePerm = flatPermissions['invoice-menu'];
		normalizedPermissions['invoice'] = invoicePerm;
	}
	const invoiceLikeKeys = Object.keys(flatPermissions).filter(k => /invoice|billing/i.test(k));
	if (invoiceLikeKeys.length > 0 && !normalizedPermissions['invoice']) {
		const withAccess = invoiceLikeKeys.find(k => flatPermissions[k]?.access === true);
		invoicePerm = withAccess
			? flatPermissions[withAccess]
			: flatPermissions[invoiceLikeKeys[0]];
		normalizedPermissions['invoice'] = invoicePerm;
	}
	// Normalize invoice permission children so backend slugs match config ids (invoice-list, billing-details)
	if (invoicePerm?.children && typeof invoicePerm.children === 'object') {
		const ch = invoicePerm.children as Record<string, MenuPermission>;
		const normalizedChildren = { ...ch };
		if (ch['invoice-listing'] && !normalizedChildren['invoice-list']) {
			normalizedChildren['invoice-list'] = ch['invoice-listing'];
		}
		if (ch['invoice-list'] && !normalizedChildren['invoice-list']) {
			normalizedChildren['invoice-list'] = ch['invoice-list'];
		}
		if (ch['billing'] && !normalizedChildren['billing-details']) {
			normalizedChildren['billing-details'] = ch['billing'];
		}
		if (ch['billing-details'] && !normalizedChildren['billing-details']) {
			normalizedChildren['billing-details'] = ch['billing-details'];
		}
		normalizedPermissions['invoice'] = {
			...invoicePerm,
			children: Object.keys(normalizedChildren).length > 0 ? normalizedChildren : invoicePerm.children,
		};
	}


	// Update accessible menu IDs when permissions change
	useEffect(() => {
		if (permissions && Object.keys(permissions).length > 0) {
			const accessibleIds = Object.keys(permissions).filter(id => permissions[id]?.access);
			setAccessibleMenuIds(accessibleIds);
			setLoading(false);
			setError(null);
		} else if (isAuthenticated) {
			setError('No menu permissions found. Please log in again.');
			setLoading(false);
		}
	}, [permissions, isAuthenticated]);

	// Filter menus based on permissions (use normalized so invoice/invoices/billing all work)
	let menus = filterMenusByPermissions(ALL_MENU_ITEMS, normalizedPermissions);

	// Hide 'approvals' menu for non-approvers (flag comes from backend /procurement/me/is-approver)
	if (!user?.isApprover) {
		menus = menus.filter(m => m.id !== 'approvals');
	}

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
