import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronDown, ChevronRight, LogOut } from 'lucide-react';
import TokenManager from '../utils/tokenManager';
import { cn } from '../utils/cn';
import { useUserMenus } from '../hooks/useUserMenus';
import { MenuItem } from '../types/menu';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface SidebarProps {
	isOpen: boolean;
	onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
	const location = useLocation();
	const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
		// Restore expanded menus from localStorage on component mount
		const saved = localStorage.getItem('expandedMenus');
		return saved ? JSON.parse(saved) : [];
	});

	// Use the new menu permission system
	const { menus, loading, error, userType } = useUserMenus();
	const { user } = useSelector((state: RootState) => state.auth);

	const toggleMenu = (menuName: string) => {
		setExpandedMenus(prev => {
			const newExpanded = prev.includes(menuName)
				? prev.filter(name => name !== menuName)
				: [...prev, menuName];

			// Save to localStorage
			localStorage.setItem('expandedMenus', JSON.stringify(newExpanded));
			return newExpanded;
		});
	};

	const isMenuExpanded = (menuName: string) => expandedMenus.includes(menuName);

	const isActiveRoute = (href?: string) => {
		if (!href) return false;
		return location.pathname === href;
	};

	const hasActiveChild = (item: MenuItem): boolean => {
		if (item.href && isActiveRoute(item.href)) return true;
		if (item.children) {
			return item.children.some(child => hasActiveChild(child));
		}
		return false;
	};

	const renderMenuItem = (item: MenuItem, level: number = 0) => {
		const hasChildren = item.children && item.children.length > 0;
		const isExpanded = isMenuExpanded(item.id);
		const isActive = isActiveRoute(item.href);
		const hasActiveChildMenu = hasActiveChild(item);

		const baseClasses = cn(
			'group flex items-center py-2 text-sm font-medium transition-all duration-200',
			level === 0
				? 'px-3 rounded-none'
				: level === 1
					? 'ml-6 mr-4 px-3 rounded-none'
					: 'ml-8 mr-4 px-3 rounded-none'
		);

		const activeClasses = isActive
			? 'bg-primary/10 text-primary font-semibold'
			: hasActiveChildMenu
				? 'bg-primary/5 text-primary'
				: 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary';

		const iconClasses = cn(
			'h-5 w-5 flex-shrink-0 transition-colors',
			isActive ? 'text-primary' : 'text-foreground-muted group-hover:text-foreground-secondary'
		);

		return (
			<div key={item.id}>
				{hasChildren ? (
					<button
						onClick={() => toggleMenu(item.id)}
						className={cn(baseClasses, activeClasses, 'w-full justify-between')}
						style={{ paddingRight: level === 1 ? '2.5rem' : '0.75rem' }}
					>
						<div className='flex items-center'>
							<item.icon
								className={cn(
									iconClasses,
									'mr-3',
									level === 0 ? 'h-6 w-6' : level === 1 ? 'h-5 w-5' : 'h-4 w-4'
								)}
							/>
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
					<Link to={item.href || '#'} className={cn(baseClasses, activeClasses)}>
						<item.icon
							className={cn(
								iconClasses,
								'mr-3',
								level === 0 ? 'h-6 w-6' : level === 1 ? 'h-5 w-5' : 'h-4 w-4'
							)}
						/>
						<span>{item.name}</span>
						{item.badge && (
							<span className='ml-auto px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full'>
								{item.badge}
							</span>
						)}
					</Link>
				)}

				{hasChildren && isExpanded && (
					<div className='mt-1 space-y-1 relative'>
						{/* Vertical line from parent to all children */}
						<div
							className={`absolute top-0 bottom-0 w-px bg-primary/40 ${level === 0 ? 'left-3' : 'left-6'}`}
						></div>
						{item.children?.map((child, _index) => (
							<div key={child.id} className='relative'>
								{/* Horizontal connector to each child */}
								<div
									className={`absolute top-4 w-3 h-px bg-primary/40 ${level === 0 ? 'left-3' : 'left-6'}`}
								></div>
								{renderMenuItem(child, level + 1)}
							</div>
						))}
					</div>
				)}
			</div>
		);
	};

	return (
		<>
			{/* Mobile backdrop */}
			{isOpen && <div className='fixed inset-0 z-40 bg-black/50 lg:hidden' onClick={onClose} />}

			{/* Sidebar */}
			<div
				className={cn(
					'fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
					isOpen ? 'translate-x-0' : '-translate-x-full'
				)}
			>
				<div className='flex flex-col h-full'>
					{/* Logo */}
					<div className='flex items-center justify-between h-16 px-4 sm:px-6 border-b border-border'>
						<div className='flex items-center space-x-2'>
							<div className='w-8 h-8 bg-primary rounded-lg flex items-center justify-center'>
								<span className='text-primary-foreground font-bold text-sm'>IB</span>
							</div>
							<span className='text-h6 font-semibold text-foreground'>Dashboard</span>
						</div>
						<button
							onClick={onClose}
							className='lg:hidden p-1 rounded-md hover:bg-background-secondary transition-colors'
						>
							<ChevronLeft className='w-5 h-5 text-foreground-secondary' />
						</button>
					</div>

					{/* Navigation */}
					<nav className='flex-1 py-4 space-y-1 overflow-y-auto'>
						{loading ? (
							<div className='flex items-center justify-center py-8'>
								<div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary'></div>
								<span className='ml-2 text-sm text-foreground-muted'>Loading menus...</span>
							</div>
						) : error ? (
							<div className='p-3 bg-error/10 border border-error/20 rounded-lg'>
								<p className='text-sm text-error'>Failed to load menus</p>
							</div>
						) : (
							<div className='space-y-1'>{menus.map(item => renderMenuItem(item))}</div>
						)}
					</nav>

					{/* User Profile */}
					<div className='p-4 border-t border-border'>
						<div className='flex items-center space-x-3'>
							<div className='w-8 h-8 bg-primary rounded-full flex items-center justify-center'>
								<span className='text-primary-foreground text-sm font-medium'>
									{user?.name
										? user.name
												.split(' ')
												.map(n => n[0])
												.join('')
												.toUpperCase()
										: 'U'}
								</span>
							</div>
							<div className='flex-1 min-w-0'>
								<p className='text-sm font-medium text-foreground truncate'>
									{user?.name || 'Unknown User'}
								</p>
								<p className='text-xs text-foreground-muted truncate'>{userType || 'Loading...'}</p>
							</div>
							<button
								onClick={async () => {
									await TokenManager.logout();
								}}
								className='p-1 rounded-md hover:bg-background-secondary transition-colors'
								title='Logout'
							>
								<LogOut className='w-4 h-4 text-foreground-secondary hover:text-foreground' />
							</button>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};
