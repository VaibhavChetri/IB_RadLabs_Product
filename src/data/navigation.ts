import { LayoutDashboard } from 'lucide-react';

export interface MenuItem {
	name: string;
	href?: string;
	icon: React.ComponentType<any>;
	children?: MenuItem[];
	badge?: string;
}

export const navigation: MenuItem[] = [
	{ name: 'Dashboard', href: '/', icon: LayoutDashboard },
];
