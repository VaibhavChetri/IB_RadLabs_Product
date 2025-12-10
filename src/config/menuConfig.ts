/**
 * Menu Configuration
 * Defines all possible menu items with their structure
 * This is safe to expose in frontend as it contains no sensitive data
 */

import {
	LayoutDashboard,
	Users,
	UserPlus,
	Eye,
	BarChart3,
	TrendingUp,
	Server,
	Link,
	FileText,
	Database,
	HelpCircle,
	AlertCircle,
	Building2,
	Menu,
	Truck,
	MapPin,
	Package,
	ArrowRight,
	Briefcase,
	Activity,
	ClipboardList,
	Receipt,
	// ArrowLeft, // Deprecated - Received section commented out
} from 'lucide-react';

import { MenuItem } from '../types/menu';

// All possible menu items (safe to expose)
export const ALL_MENU_ITEMS: MenuItem[] = [
	// 1. DASHBOARDS (Most accessed)
	{
		id: 'dashboard',
		name: 'Dashboards',
		icon: LayoutDashboard,
		children: [
			{
				id: 'impact-home',
				name: 'Impact Home',
				icon: LayoutDashboard,
				href: '/',
			},
			{
				id: 'ops-dashboard',
				name: 'Ops Dashboard',
				icon: Activity,
				href: '/ops-dashboard',
			},
		],
	},
	// 2. CORE OPERATIONS (Daily work)
	{
		id: 'transit-plan',
		name: 'Transit Plan',
		icon: Truck,
		children: [
			{
				id: 'master-plan',
				name: 'Master Plan',
				icon: MapPin,
				children: [
					{
						id: 'create-transit-master-plan',
						name: 'Create Plan',
						icon: MapPin,
						href: '/transit-plan/master-plan/create',
					},
					{
						id: 'master-plan-listing',
						name: 'Master Plan Listing',
						icon: FileText,
						href: '/transit-plan/master-plan/listing',
					},
				],
			},
			{
				id: 'transit-plan-listing',
				name: 'Transit Plan Listing',
				icon: FileText,
				href: '/transit-plan/listing',
			},
			{
				id: 'sent-inventory',
				name: 'Sent Inventory',
				icon: ArrowRight,
				children: [
					{
						id: 'sent-transit-plan',
						name: 'Sent Transit Plan',
						icon: ArrowRight,
						href: '/transit-plan/sent/plan',
					},
					{
						id: 'sent-inventory-listing',
						name: 'Sent Inventory Listing',
						icon: Package,
						href: '/transit-plan/sent/inventory',
					},
				],
			},
			// TODO: Received section is deprecated - information will be captured elsewhere
			// {
			// 	id: 'received-inventory',
			// 	name: 'Received Inventory',
			// 	icon: ArrowLeft,
			// 	children: [
			// 		{
			// 			id: 'received-transit-plan',
			// 			name: 'Received Transit Plan',
			// 			icon: ArrowLeft,
			// 			href: '/transit-plan/received/plan',
			// 		},
			// 		{
			// 			id: 'received-inventory-listing',
			// 			name: 'Received Inventory Listing',
			// 			icon: Package,
			// 			href: '/transit-plan/received/listing',
			// 		},
			// 	],
			// },
		],
	},
	{
		id: 'operations-reporting',
		name: 'Operations Reporting',
		icon: ClipboardList,
		children: [
			{
				id: 'shift-reporting',
				name: 'Shift Reporting',
				icon: FileText,
				children: [
					{
						id: 'shift-reporting-add',
						name: 'New Shift Report',
						icon: UserPlus,
						href: '/operations-reporting/shift-reporting/add',
					},
					{
						id: 'shift-reporting-listing',
						name: 'Shift Report Listing',
						icon: FileText,
						href: '/operations-reporting/shift-reporting/listing',
					},
				],
			},
			{
				id: 'qc-rejection',
				name: 'QC Rejection',
				icon: FileText,
				children: [
					{
						id: 'qc-rejection-add',
						name: 'New QC Rejection',
						icon: UserPlus,
						href: '/operations-reporting/qc-rejection/add',
					},
					{
						id: 'qc-rejection-listing',
						name: 'QC Rejection Listing',
						icon: FileText,
						href: '/operations-reporting/qc-rejection/listing',
					},
				],
			},
			{
				id: 'client-escalation',
				name: 'Client Escalation',
				icon: FileText,
				children: [
					{
						id: 'client-escalation-add',
						name: 'New Client Escalation',
						icon: UserPlus,
						href: '/operations-reporting/client-escalation/add',
					},
					{
						id: 'client-escalation-listing',
						name: 'Client Escalation Listing',
						icon: FileText,
						href: '/operations-reporting/client-escalation/listing',
					},
				],
			},
		],
	},
	{
		id: 'kam',
		name: 'KAM',
		icon: Briefcase,
		children: [
			{
				id: 'kam-clients',
				name: 'Client List',
				icon: Users,
				href: '/kam/clients',
			},
			{
				id: 'kam-inventory',
				name: 'Client Inventory',
				icon: Package,
				href: '/kam/inventory',
			},
		],
	},
	// 3. FINANCIAL (Grouped together)
	{
		id: 'revenue',
		name: 'Revenue',
		icon: TrendingUp,
		children: [
			{
				id: 'monthly-estimate',
				name: 'Monthly Estimate',
				icon: BarChart3,
				children: [
					{
						id: 'monthly-estimate-add',
						name: 'New Monthly Estimate',
						icon: UserPlus,
						href: '/revenue/monthly-estimate/add',
					},
					{
						id: 'monthly-estimate-list',
						name: 'Monthly Estimate Listing',
						icon: FileText,
						href: '/revenue/monthly-estimate/list',
					},
				],
			},
		],
	},
	{
		id: 'p-and-l',
		name: 'P&L Review',
		icon: BarChart3,
		children: [
			{
				id: 'pl-summary',
				name: 'P&L Summary',
				icon: FileText,
				href: '/p-and-l/summary',
			},
			{
				id: 'pl-graphs',
				name: 'P&L Graphs',
				icon: BarChart3,
				href: '/p-and-l/graphs',
			},
		],
	},
	// 4. ANALYTICS & REPORTS (Combined)
	{
		id: 'analytics',
		name: 'Analytics',
		icon: BarChart3,
		children: [
			{
				id: 'analytics-revenue',
				name: 'Revenue Reports',
				icon: TrendingUp,
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
				icon: BarChart3,
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
	// 5. ADMIN & CONFIGURATION (Less frequent)
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
						id: 'clients-manage',
						name: 'Manage Clients',
						icon: Eye,
						href: '/clients/manage',
					},
				],
			},
			{
				id: 'sku-mapping',
				name: 'SKU Mapping',
				icon: Package,
				children: [
					{
						id: 'add-sku-mapping',
						name: 'New Mapping',
						icon: Link,
						href: '/ops-admin/map-sku/add',
					},
					{
						id: 'sku-listing',
						name: 'SKU Listing',
						icon: FileText,
						href: '/ops-admin/map-sku/listing',
					},
				],
			},
			{
				id: 'ops-admin-revenue',
				name: 'Revenue Setup',
				icon: TrendingUp,
				children: [
					{
						id: 'review-cost-type',
						name: 'Cost Types',
						icon: FileText,
						href: '/ops-admin/revenue/review-cost-type',
					},
					{
						id: 'review-category-type',
						name: 'Category Types',
						icon: FileText,
						href: '/ops-admin/revenue/review-category-type',
					},
				],
			},
			{
				id: 'ops-admin-escalations',
				name: 'Escalations',
				icon: AlertCircle,
				children: [
					{
						id: 'escalation-type',
						name: 'Escalation Type',
						icon: FileText,
						href: '/ops-admin/escalations/escalation-type',
					},
				],
			},
			{
				id: 'vehicles',
				name: 'Vehicles',
				icon: Truck,
				children: [
					{
						id: 'vehicle-listing',
						name: 'Vehicle Listing',
						icon: FileText,
						href: '/ops-admin/vehicles/listing',
					},
				],
			},
			{
				id: 'container-types',
				name: 'Container Types',
				icon: Package,
				children: [
					{
						id: 'container-listing',
						name: 'Container Listing',
						icon: FileText,
						href: '/ops-admin/containers/listing',
					},
				],
			},
		],
	},
	{
		id: 'menu-management',
		name: 'Menu Management',
		icon: Menu,
		href: '/menu-management',
	},
	{
		id: 'invoice-menu',
		name: 'Invoice Menu',
		icon: Receipt,
		children: [
			{
				id: 'billing-details',
				name: 'Billing Details',
				icon: FileText,
				href: '/billing-details',
			},
			{
				id: 'invoice-list',
				name: 'Invoice List',
				icon: FileText,
				href: '/invoice-list',
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
