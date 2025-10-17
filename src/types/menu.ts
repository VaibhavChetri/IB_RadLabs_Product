/**
 * Menu Permission Types
 * Defines the structure for hierarchical menu permissions
 */

import React from 'react';

// Menu permission structure
export interface MenuPermission {
	access: boolean;
	children: Record<string, MenuPermission>;
}

// Menu item structure
export interface MenuItem {
	id: string;
	name: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	href?: string;
	children?: MenuItem[];
	badge?: string;
}

// User menu permissions response from API
export interface UserMenuPermissions {
	user_type: string;
	user_type_id: number;
	allowedMenus: Record<string, MenuPermission>;
}

// Menu permission check result
export interface MenuAccessResult {
	hasAccess: boolean;
	allowedChildren: string[];
}
