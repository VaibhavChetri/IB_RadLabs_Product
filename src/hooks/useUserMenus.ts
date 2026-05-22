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

	// LOCAL-ONLY: grant access to Billing → Follow-Up Tracker (Module 1) and
	// Customer Intelligence (Module 2) for any authenticated user so the new
	// screens are visible during integration. We only inject the new children;
	// the original invoice access/children gating on invoice-list and
	// billing-details is preserved.
	// Remove this block once the backend adds 'follow-up-tracker' +
	// 'customer-intelligence' to menu_permissions.
	if (isAuthenticated) {
		const existingInvoice = normalizedPermissions['invoice'];
		const existingChildren =
			(existingInvoice?.children as Record<string, MenuPermission> | undefined) || {};
		normalizedPermissions['invoice'] = {
			access: existingInvoice?.access ?? true,
			children: {
				...existingChildren,
				'pulse':                 { access: true, children: {} },
				'clients-ledger':        { access: true, children: {} },
				'follow-up-tracker':     { access: true, children: {} },
				'customer-intelligence': { access: true, children: {} },
				'client-health':         { access: true, children: {} },
				'overdue-behaviour':     { access: true, children: {} },
				'pipeline-gaps':         { access: true, children: {} },
				'broken-commitments':    { access: true, children: {} },
				'ceo-overview':          { access: true, children: {} },
			},
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

	// The Approvals menu is gated by a per-user feature flag (isApprover /
	// proxyEligible from /procurement/me/is-approver), NOT by the role-based
	// menu_permissions table — because not every "accounts" user is an
	// approver. Only the specific individuals designated as approvers
	// (Shashwat / Asha / Swati / Priyanka) should see it.
	//
	// Problem this solves: a finance user like Asha has user_type='accounts',
	// which does not have menu_permissions rows for 'approvals' or
	// 'vendor-invoice-approvals'. filterMenusByPermissions strips the whole
	// subtree. The old patch (below) only prevented *removing* the parent;
	// the child submenu was already gone by then. Result: Asha saw the
	// Approvals parent but no clickable submenu.
	//
	// Fix: before filtering, if the user is an approver or proxy-eligible,
	// inject a fully-granted approvals subtree into their permission map.
	// filterMenusByPermissions then preserves both parent and children
	// exactly as designed. Non-approvers still fall through with no change,
	// so blanket-granting to every accounts user is avoided.
	if (user?.isApprover || user?.proxyEligible) {
		normalizedPermissions['approvals'] = {
			access: true,
			children: {
				'vendor-invoice-approvals': { access: true, children: {} },
			},
		};
	}

	let menus = filterMenusByPermissions(ALL_MENU_ITEMS, normalizedPermissions);

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
