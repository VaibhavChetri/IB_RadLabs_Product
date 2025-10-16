/**
 * Navigation Components
 * Breadcrumb and Tabs components for navigation
 */

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../utils/cn';

// Breadcrumb Component
export interface BreadcrumbItem {
	label: string;
	href?: string;
	icon?: React.ReactNode;
}

export interface BreadcrumbProps {
	items: BreadcrumbItem[];
	separator?: React.ReactNode;
	showHome?: boolean;
	homeHref?: string;
	size?: 'sm' | 'md' | 'lg';
	className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
	items,
	separator = <ChevronRight className='h-4 w-4 text-foreground-muted' />,
	showHome = true,
	homeHref = '/',
	size = 'md',
	className,
}) => {
	const sizeClasses = {
		sm: 'text-xs',
		md: 'text-sm',
		lg: 'text-base',
	};

	const allItems = showHome
		? [
				{ label: 'Home', href: homeHref, icon: <Home className='h-4 w-4' /> },
				...items,
		  ]
		: items;

	return (
		<nav
			className={cn('flex items-center space-x-1', className)}
			aria-label='Breadcrumb'
		>
			<ol className='flex items-center space-x-1'>
				{allItems.map((item, index) => (
					<li key={index} className='flex items-center'>
						{index > 0 && (
							<span className='mx-2' aria-hidden='true'>
								{separator}
							</span>
						)}

						{item.href ? (
							<a
								href={item.href}
								className={cn(
									'flex items-center space-x-1 text-foreground-secondary hover:text-foreground transition-colors',
									sizeClasses[size],
									index === allItems.length - 1 &&
										'text-foreground font-medium',
								)}
							>
								{item.icon && <span>{item.icon}</span>}
								<span>{item.label}</span>
							</a>
						) : (
							<span
								className={cn(
									'flex items-center space-x-1',
									sizeClasses[size],
									index === allItems.length - 1
										? 'text-foreground font-medium'
										: 'text-foreground-secondary',
								)}
								aria-current={
									index === allItems.length - 1 ? 'page' : undefined
								}
							>
								{item.icon && <span>{item.icon}</span>}
								<span>{item.label}</span>
							</span>
						)}
					</li>
				))}
			</ol>
		</nav>
	);
};

// Tabs Component
export interface TabItem {
	id: string;
	label: string;
	content: React.ReactNode;
	disabled?: boolean;
	icon?: React.ReactNode;
	badge?: string | number;
}

export interface TabsProps {
	items: TabItem[];
	activeTab?: string;
	onTabChange?: (tabId: string) => void;
	variant?: 'default' | 'pills' | 'underline';
	size?: 'sm' | 'md' | 'lg';
	fullWidth?: boolean;
	className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
	items,
	activeTab,
	onTabChange,
	variant = 'default',
	size = 'md',
	fullWidth = false,
	className,
}) => {
	const [internalActiveTab, setInternalActiveTab] = React.useState(
		activeTab || items[0]?.id,
	);
	const currentActiveTab = activeTab || internalActiveTab;

	const handleTabChange = (tabId: string) => {
		setInternalActiveTab(tabId);
		onTabChange?.(tabId);
	};

	const sizeClasses = {
		sm: 'px-3 py-2 text-sm',
		md: 'px-4 py-3 text-sm',
		lg: 'px-6 py-4 text-base',
	};

	const variantClasses = {
		default: {
			tab: 'border-b-2 border-transparent hover:border-border hover:text-foreground',
			active: 'border-primary text-primary',
			inactive: 'text-foreground-secondary',
		},
		pills: {
			tab: 'rounded-lg hover:bg-background-secondary',
			active: 'bg-primary text-primary-foreground',
			inactive: 'text-foreground-secondary hover:text-foreground',
		},
		underline: {
			tab: 'border-b-2 border-transparent hover:border-border hover:text-foreground',
			active: 'border-primary text-primary',
			inactive: 'text-foreground-secondary',
		},
	};

	const currentVariant = variantClasses[variant];

	return (
		<div className={cn('w-full', className)}>
			{/* Tab Headers */}
			<div
				className={cn(
					'flex',
					variant === 'pills'
						? 'space-x-1 p-1 bg-background-secondary rounded-lg'
						: 'border-b border-border',
					fullWidth && 'w-full',
				)}
			>
				{items.map((item) => (
					<button
						key={item.id}
						onClick={() => !item.disabled && handleTabChange(item.id)}
						disabled={item.disabled}
						className={cn(
							'flex items-center space-x-2 font-medium transition-all duration-200',
							'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
							'disabled:opacity-50 disabled:pointer-events-none',
							sizeClasses[size],
							currentVariant.tab,
							currentActiveTab === item.id
								? currentVariant.active
								: currentVariant.inactive,
							fullWidth && 'flex-1 justify-center',
						)}
					>
						{item.icon && <span>{item.icon}</span>}
						<span>{item.label}</span>
						{item.badge && (
							<span
								className={cn(
									'px-2 py-0.5 text-xs rounded-full',
									currentActiveTab === item.id
										? 'bg-primary-foreground/20 text-primary-foreground'
										: 'bg-primary/10 text-primary',
								)}
							>
								{item.badge}
							</span>
						)}
					</button>
				))}
			</div>

			{/* Tab Content */}
			<div className='mt-4'>
				{items.find((item) => item.id === currentActiveTab)?.content}
			</div>
		</div>
	);
};

// Pagination Component
export interface PaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	showFirstLast?: boolean;
	showPrevNext?: boolean;
	maxVisiblePages?: number;
	size?: 'sm' | 'md' | 'lg';
	className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
	currentPage,
	totalPages,
	onPageChange,
	showFirstLast = true,
	showPrevNext = true,
	maxVisiblePages = 5,
	size = 'md',
	className,
}) => {
	const sizeClasses = {
		sm: 'h-8 w-8 text-sm',
		md: 'h-10 w-10 text-sm',
		lg: 'h-12 w-12 text-base',
	};

	const getVisiblePages = () => {
		const half = Math.floor(maxVisiblePages / 2);
		let start = Math.max(1, currentPage - half);
		let end = Math.min(totalPages, start + maxVisiblePages - 1);

		if (end - start + 1 < maxVisiblePages) {
			start = Math.max(1, end - maxVisiblePages + 1);
		}

		return Array.from({ length: end - start + 1 }, (_, i) => start + i);
	};

	const visiblePages = getVisiblePages();

	return (
		<nav
			className={cn('flex items-center justify-center space-x-1', className)}
			aria-label='Pagination'
		>
			{/* First Page */}
			{showFirstLast && currentPage > 1 && (
				<button
					onClick={() => onPageChange(1)}
					className={cn(
						'flex items-center justify-center rounded-lg border border-border bg-background text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors',
						sizeClasses[size],
					)}
				>
					First
				</button>
			)}

			{/* Previous Page */}
			{showPrevNext && currentPage > 1 && (
				<button
					onClick={() => onPageChange(currentPage - 1)}
					className={cn(
						'flex items-center justify-center rounded-lg border border-border bg-background text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors',
						sizeClasses[size],
					)}
				>
					Previous
				</button>
			)}

			{/* Page Numbers */}
			{visiblePages.map((page) => (
				<button
					key={page}
					onClick={() => onPageChange(page)}
					className={cn(
						'flex items-center justify-center rounded-lg border transition-colors',
						sizeClasses[size],
						page === currentPage
							? 'border-primary bg-primary text-primary-foreground'
							: 'border-border bg-background text-foreground-secondary hover:text-foreground hover:bg-background-secondary',
					)}
				>
					{page}
				</button>
			))}

			{/* Next Page */}
			{showPrevNext && currentPage < totalPages && (
				<button
					onClick={() => onPageChange(currentPage + 1)}
					className={cn(
						'flex items-center justify-center rounded-lg border border-border bg-background text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors',
						sizeClasses[size],
					)}
				>
					Next
				</button>
			)}

			{/* Last Page */}
			{showFirstLast && currentPage < totalPages && (
				<button
					onClick={() => onPageChange(totalPages)}
					className={cn(
						'flex items-center justify-center rounded-lg border border-border bg-background text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors',
						sizeClasses[size],
					)}
				>
					Last
				</button>
			)}
		</nav>
	);
};
