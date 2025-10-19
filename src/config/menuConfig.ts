/**
 * Menu Configuration
 * Defines all possible menu items with their structure
 * This is safe to expose in frontend as it contains no sensitive data
 */

import {
	LayoutDashboard,
	Users,
	UserPlus,
	Edit,
	Eye,
	BarChart3,
	DollarSign,
	TrendingUp,
	Server,
	Settings,
	Shield,
	Link,
	FileText,
	Database,
	Mail,
	Bell,
	HelpCircle,
	Building2,
	UserX,
	Menu,
} from 'lucide-react';

import { MenuItem } from '../types/menu';

// All possible menu items (safe to expose)
export const ALL_MENU_ITEMS: MenuItem[] = [
	{
		id: 'dashboard',
		name: 'Dashboard',
		icon: LayoutDashboard,
		href: '/',
	},
	{
		id: 'menu-management',
		name: 'Menu Management',
		icon: Menu,
		href: '/menu-management',
	},
	{
		id: 'ops-admin',
		name: 'Ops Admin',
		icon: Building2,
		children: [
			{
				id: 'clients',
				name: 'Clients',
				icon: Users,
				children: [
					{
						id: 'clients-add',
						name: 'Add Client',
						icon: UserPlus,
						href: '/clients/add',
					},
					{
						id: 'clients-manage',
						name: 'Manage Clients',
						icon: Eye,
						href: '/clients/manage',
					},
					{
						id: 'clients-disable',
						name: 'Disable Clients',
						icon: UserX,
						href: '/clients/disable',
					},
				],
			},
		],
	},
	{
		id: 'analytics',
		name: 'Analytics',
		icon: BarChart3,
		children: [
			{
				id: 'analytics-revenue',
				name: 'Revenue Reports',
				icon: DollarSign,
				href: '/analytics/revenue',
			},
			{
				id: 'analytics-trends',
				name: 'Trend Analysis',
				icon: TrendingUp,
				href: '/analytics/trends',
			},
			{
				id: 'analytics-users',
				name: 'User Reports',
				icon: Users,
				href: '/analytics/users',
			},
			{
				id: 'analytics-system',
				name: 'System Reports',
				icon: Server,
				href: '/analytics/system',
			},
		],
	},
	{
		id: 'reports',
		name: 'Reports',
		icon: FileText,
		children: [
			{
				id: 'reports-financial',
				name: 'Financial Reports',
				icon: DollarSign,
				href: '/reports/financial',
			},
			{
				id: 'reports-operational',
				name: 'Operational Reports',
				icon: Database,
				href: '/reports/operational',
			},
			{
				id: 'reports-custom',
				name: 'Custom Reports',
				icon: FileText,
				href: '/reports/custom',
			},
		],
	},
	{
		id: 'settings',
		name: 'Settings',
		icon: Settings,
		children: [
			{
				id: 'settings-general',
				name: 'General Settings',
				icon: Settings,
				href: '/settings/general',
			},
			{
				id: 'settings-security',
				name: 'Security Settings',
				icon: Shield,
				href: '/settings/security',
			},
			{
				id: 'settings-integration',
				name: 'Integration Settings',
				icon: Link,
				href: '/settings/integration',
			},
			{
				id: 'settings-notifications',
				name: 'Notifications',
				icon: Bell,
				href: '/settings/notifications',
			},
		],
	},
	{
		id: 'communication',
		name: 'Communication',
		icon: Mail,
		children: [
			{
				id: 'communication-email',
				name: 'Email Management',
				icon: Mail,
				href: '/communication/email',
			},
			{
				id: 'communication-notifications',
				name: 'Push Notifications',
				icon: Bell,
				href: '/communication/notifications',
			},
		],
	},
	{
		id: 'help',
		name: 'Help & Support',
		icon: HelpCircle,
		href: '/help',
	},
];

// Helper function to find menu item by ID
export const findMenuItemById = (
	id: string,
	menus: MenuItem[] = ALL_MENU_ITEMS
): MenuItem | null => {
	for (const menu of menus) {
		if (menu.id === id) {
			return menu;
		}
		if (menu.children) {
			const found = findMenuItemById(id, menu.children);
			if (found) return found;
		}
	}
	return null;
};

// Helper function to get all menu IDs (for debugging)
export const getAllMenuIds = (menus: MenuItem[] = ALL_MENU_ITEMS): string[] => {
	const ids: string[] = [];

	for (const menu of menus) {
		ids.push(menu.id);
		if (menu.children) {
			ids.push(...getAllMenuIds(menu.children));
		}
	}

	return ids;
};
