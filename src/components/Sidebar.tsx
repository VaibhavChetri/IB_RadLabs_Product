import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';
import { navigation, MenuItem } from '../data/navigation';
import { secondaryNavigation } from '../data/secondaryNavigation';

interface SidebarProps {
	isOpen: boolean;
	onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
	const location = useLocation();
	const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

	const toggleMenu = (menuName: string) => {
		setExpandedMenus((prev) =>
			prev.includes(menuName)
				? prev.filter((name) => name !== menuName)
				: [...prev, menuName],
		);
	};

	const isMenuExpanded = (menuName: string) => expandedMenus.includes(menuName);

	const isActiveRoute = (href?: string) => {
		if (!href) return false;
		return location.pathname === href;
	};

	const hasActiveChild = (item: MenuItem): boolean => {
		if (item.href && isActiveRoute(item.href)) return true;
		if (item.children) {
			return item.children.some((child) => hasActiveChild(child));
		}
		return false;
	};

	const renderMenuItem = (item: MenuItem, level: number = 0) => {
		const hasChildren = item.children && item.children.length > 0;
		const isExpanded = isMenuExpanded(item.name);
		const isActive = isActiveRoute(item.href);
		const hasActiveChildMenu = hasActiveChild(item);

		const baseClasses = cn(
			'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
			level === 0 ? 'mx-1' : 'ml-4',
		);

		const activeClasses = isActive
			? 'bg-primary/10 text-primary font-semibold'
			: hasActiveChildMenu
			? 'bg-primary/5 text-primary'
			: 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary';

		const iconClasses = cn(
			'h-5 w-5 flex-shrink-0 transition-colors',
			isActive
				? 'text-primary'
				: 'text-foreground-muted group-hover:text-foreground-secondary',
		);

		return (
			<div key={item.name}>
				{hasChildren ? (
					<button
						onClick={() => toggleMenu(item.name)}
						className={cn(baseClasses, activeClasses, 'w-full justify-between')}
					>
						<div className='flex items-center'>
							<item.icon className={cn(iconClasses, 'mr-3')} />
							<span>{item.name}</span>
							{item.badge && (
								<span className='ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full'>
									{item.badge}
								</span>
							)}
						</div>
						{isExpanded ? (
							<ChevronDown className='h-4 w-4 text-foreground-muted' />
						) : (
							<ChevronRight className='h-4 w-4 text-foreground-muted' />
						)}
					</button>
				) : (
					<Link
						to={item.href || '#'}
						className={cn(baseClasses, activeClasses)}
					>
						<item.icon className={cn(iconClasses, 'mr-3')} />
						<span>{item.name}</span>
						{item.badge && (
							<span className='ml-auto px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full'>
								{item.badge}
							</span>
						)}
					</Link>
				)}

				{hasChildren && isExpanded && (
					<div className='mt-1 space-y-1'>
						{item.children?.map((child) => renderMenuItem(child, level + 1))}
					</div>
				)}
			</div>
		);
	};

	return (
		<>
			{/* Mobile backdrop */}
			{isOpen && (
				<div
					className='fixed inset-0 z-40 bg-black/50 lg:hidden'
					onClick={onClose}
				/>
			)}

			{/* Sidebar */}
			<div
				className={cn(
					'fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
					isOpen ? 'translate-x-0' : '-translate-x-full',
				)}
			>
				<div className='flex flex-col h-full'>
					{/* Logo */}
					<div className='flex items-center justify-between h-16 px-4 sm:px-6 border-b border-border'>
						<div className='flex items-center space-x-2'>
							<div className='w-8 h-8 bg-primary rounded-lg flex items-center justify-center'>
								<span className='text-primary-foreground font-bold text-sm'>
									IB
								</span>
							</div>
							<span className='text-h6 font-semibold text-foreground'>
								Dashboard
							</span>
						</div>
						<button
							onClick={onClose}
							className='lg:hidden p-1 rounded-md hover:bg-background-secondary transition-colors'
						>
							<ChevronLeft className='w-5 h-5 text-foreground-secondary' />
						</button>
					</div>

					{/* Navigation */}
					<nav className='flex-1 px-2 py-4 space-y-1 overflow-y-auto'>
						<div className='space-y-1'>
							{navigation.map((item) => renderMenuItem(item))}
						</div>

						{/* Secondary Navigation */}
						{secondaryNavigation.length > 0 && (
							<div className='pt-6'>
								<div className='px-3 mb-3'>
									<h3 className='text-xs font-semibold text-foreground-muted uppercase tracking-wider'>
										Quick Access
									</h3>
								</div>
								<div className='space-y-1'>
									{secondaryNavigation.map((item) => (
										<a
											key={item.name}
											href={item.href}
											className='group flex items-center px-3 py-2 text-sm font-medium text-foreground-secondary rounded-lg hover:text-foreground hover:bg-background-secondary transition-all duration-200 mx-1'
										>
											<item.icon className='mr-3 h-5 w-5 flex-shrink-0 text-foreground-muted group-hover:text-foreground-secondary' />
											{item.name}
										</a>
									))}
								</div>
							</div>
						)}
					</nav>

					{/* User Profile */}
					<div className='p-4 border-t border-border'>
						<div className='flex items-center space-x-3'>
							<div className='w-8 h-8 bg-primary rounded-full flex items-center justify-center'>
								<span className='text-primary-foreground text-sm font-medium'>
									JD
								</span>
							</div>
							<div className='flex-1 min-w-0'>
								<p className='text-sm font-medium text-foreground truncate'>
									John Doe
								</p>
								<p className='text-xs text-foreground-muted truncate'>
									admin@example.com
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};
