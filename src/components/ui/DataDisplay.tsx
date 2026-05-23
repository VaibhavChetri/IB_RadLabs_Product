/**
 * Data Display Components
 * Table, List, and Accordion components for displaying data
 */

import React from 'react';
import { ChevronDown, ChevronUp, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../../utils/cn';

// Table Component
export interface TableColumn<T = Record<string, unknown>> {
	key: string;
	title: string;
	dataIndex?: keyof T;
	render?: (value: unknown, record: T, index: number) => React.ReactNode;
	sortable?: boolean;
	width?: string | number;
	align?: 'left' | 'center' | 'right';
	fixed?: 'left' | 'right';
	headerClassName?: string; // Custom className for header cell
	cellClassName?: string; // Custom className for cell content
}

export interface TableProps<T = Record<string, unknown>> {
	columns: TableColumn<T>[];
	data: T[];
	loading?: boolean;
	emptyText?: string;
	size?: 'sm' | 'md' | 'lg';
	striped?: boolean;
	hoverable?: boolean;
	bordered?: boolean;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
	onSort?: (key: string, order: 'asc' | 'desc') => void;
	/** Fires when a row is clicked. The event target check filters out clicks
	 *  that landed on interactive elements inside the row (links, buttons, etc.)
	 *  so the per-row deep-link icon doesn't open the drawer. */
	onRowClick?: (record: T, index: number) => void;
	className?: string;
}

export const Table = <T extends Record<string, unknown>>({
	columns,
	data,
	loading = false,
	emptyText = 'No data available',
	size = 'md',
	striped = false,
	hoverable = true,
	sortBy,
	sortOrder,
	onSort,
	onRowClick,
	className,
}: TableProps<T>) => {
	const sizeClasses = {
		sm: 'text-xs',
		md: 'text-sm',
		lg: 'text-base',
	};

	const cellSizeClasses = {
		sm: 'text-[11px]', // Slightly smaller than text-xs (12px)
		md: 'text-xs',
		lg: 'text-sm',
	};

	const handleSort = (key: string) => {
		if (!onSort) return;

		const newOrder = sortBy === key && sortOrder === 'asc' ? 'desc' : 'asc';
		onSort(key, newOrder);
	};

	const getSortIcon = (key: string) => {
		if (sortBy !== key) return <ArrowUpDown className='h-4 w-4 text-foreground-muted' />;
		return sortOrder === 'asc' ? (
			<ArrowUp className='h-4 w-4 text-primary' />
		) : (
			<ArrowDown className='h-4 w-4 text-primary' />
		);
	};

	if (loading) {
		return (
			<div className={cn('w-full', className)}>
				<div className='animate-pulse'>
					<div className='bg-background-secondary rounded-lg p-8'>
						<div className='space-y-4'>
							<div className='h-4 bg-border rounded w-3/4'></div>
							<div className='h-4 bg-border rounded w-1/2'></div>
							<div className='h-4 bg-border rounded w-5/6'></div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className={cn('w-full', className)}>
			<div className='overflow-x-auto'>
				<table className='w-full border-collapse'>
					<thead>
						<tr className='border-b border-gray-200'>
							{columns.map(column => (
								<th
									key={column.key}
									className={cn(
										'px-3 py-2 text-left font-bold text-gray-700 whitespace-nowrap', // Changed to font-bold
										sizeClasses[size],
										column.align === 'center' && 'text-center',
										column.align === 'right' && 'text-right',
										column.sortable && 'cursor-pointer hover:bg-gray-50 select-none',
										column.fixed === 'left' && 'sticky left-0 bg-white z-10',
										column.fixed === 'right' && 'sticky right-0 bg-white z-10',
										column.headerClassName // Add custom header className
									)}
									style={{ width: column.width }}
									onClick={() => column.sortable && handleSort(column.key)}
								>
									<div
										className={cn(
											'flex items-center space-x-2',
											column.align === 'center' && 'justify-center',
											column.align === 'right' && 'justify-end'
										)}
									>
										<span>{column.title}</span>
										{column.sortable && (
											<span className='flex-shrink-0'>{getSortIcon(column.key)}</span>
										)}
									</div>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{!data || data.length === 0 ? (
							<tr>
								<td
									colSpan={columns.length}
									className='px-4 py-8 text-center text-foreground-muted'
								>
									{emptyText}
								</td>
							</tr>
						) : (
							data.map((record, index) => (
								<tr
									key={index}
									onClick={(e) => {
										if (!onRowClick) return;
										// Ignore clicks on links/buttons inside the row so per-row actions
										// (Open in Zoho, etc.) work without also opening the drawer.
										const target = e.target as HTMLElement;
										if (target.closest('a,button,input,select')) return;
										onRowClick(record, index);
									}}
									className={cn(
										'border-b border-gray-200 transition-colors',
										striped && index % 2 === 1 && 'bg-gray-50',
										hoverable && 'hover:bg-gray-50',
										onRowClick && 'cursor-pointer'
									)}
								>
									{columns.map(column => {
										const value = column.dataIndex ? record[column.dataIndex] : record[column.key];
										const renderedValue = column.render
											? column.render(value, record, index)
											: value;

										return (
											<td
												key={column.key}
												className={cn(
													'px-3 py-2 font-normal text-gray-900',
													column.cellClassName || cellSizeClasses[size], // Use custom cellClassName if provided, otherwise use default size
													column.align === 'center' && 'text-center',
													column.align === 'right' && 'text-right',
													column.fixed === 'left' && 'sticky left-0 bg-white z-10',
													column.fixed === 'right' && 'sticky right-0 bg-white z-10'
												)}
												style={{ width: column.width, minWidth: column.width }}
											>
												{renderedValue as React.ReactNode}
											</td>
										);
									})}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};

// List Component
export interface ListItem {
	id: string;
	title: string;
	description?: string;
	icon?: React.ReactNode;
	avatar?: string;
	badge?: string | number;
	action?: React.ReactNode;
	onClick?: () => void;
}

export interface ListProps {
	items: ListItem[];
	size?: 'sm' | 'md' | 'lg';
	variant?: 'default' | 'bordered' | 'striped';
	hoverable?: boolean;
	className?: string;
}

export const List: React.FC<ListProps> = ({
	items,
	size = 'md',
	variant = 'default',
	hoverable = true,
	className,
}) => {
	const sizeClasses = {
		sm: 'p-2',
		md: 'p-3',
		lg: 'p-4',
	};

	const variantClasses = {
		default: 'bg-background',
		bordered: 'bg-background border border-border',
		striped: 'bg-background',
	};

	return (
		<div className={cn('rounded-lg', variantClasses[variant], className)}>
			{items.map((item, index) => (
				<div
					key={item.id}
					className={cn(
						'flex items-center space-x-3 transition-colors',
						sizeClasses[size],
						variant === 'striped' && index % 2 === 1 && 'bg-background-secondary',
						hoverable && 'hover:bg-background-secondary cursor-pointer',
						index < items.length - 1 && variant !== 'bordered' && 'border-b border-border'
					)}
					onClick={item.onClick}
				>
					{/* Avatar or Icon */}
					{(item.avatar || item.icon) && (
						<div className='flex-shrink-0'>
							{item.avatar ? (
								<img
									src={item.avatar}
									alt={item.title}
									className='h-8 w-8 rounded-full object-cover'
								/>
							) : (
								<div className='h-8 w-8 flex items-center justify-center text-foreground-muted'>
									{item.icon}
								</div>
							)}
						</div>
					)}

					{/* Content */}
					<div className='flex-1 min-w-0'>
						<div className='flex items-center justify-between'>
							<h3 className='text-sm font-medium text-foreground truncate'>{item.title}</h3>
							{item.badge && (
								<span className='ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full'>
									{item.badge}
								</span>
							)}
						</div>
						{item.description && (
							<p className='text-sm text-foreground-muted truncate'>{item.description}</p>
						)}
					</div>

					{/* Action */}
					{item.action && <div className='flex-shrink-0'>{item.action}</div>}
				</div>
			))}
		</div>
	);
};

// Accordion Component
export interface AccordionItem {
	id: string;
	title: string;
	content: React.ReactNode;
	icon?: React.ReactNode;
	disabled?: boolean;
}

export interface AccordionProps {
	items: AccordionItem[];
	allowMultiple?: boolean;
	defaultOpen?: string[];
	size?: 'sm' | 'md' | 'lg';
	variant?: 'default' | 'bordered' | 'filled';
	className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
	items,
	allowMultiple = false,
	defaultOpen = [],
	size = 'md',
	variant = 'default',
	className,
}) => {
	const [openItems, setOpenItems] = React.useState<string[]>(defaultOpen);

	const sizeClasses = {
		sm: 'p-3 text-sm',
		md: 'p-4 text-sm',
		lg: 'p-6 text-base',
	};

	const variantClasses = {
		default: 'bg-background border border-border',
		bordered: 'bg-background border border-border',
		filled: 'bg-background-secondary border border-border',
	};

	const toggleItem = (itemId: string) => {
		setOpenItems(prev => {
			if (allowMultiple) {
				return prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId];
			} else {
				return prev.includes(itemId) ? [] : [itemId];
			}
		});
	};

	return (
		<div className={cn('space-y-2', className)}>
			{items.map(item => {
				const isOpen = openItems.includes(item.id);

				return (
					<div
						key={item.id}
						className={cn('rounded-lg transition-all duration-200', variantClasses[variant])}
					>
						<button
							onClick={() => !item.disabled && toggleItem(item.id)}
							disabled={item.disabled}
							className={cn(
								'w-full flex items-center justify-between transition-colors',
								'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
								'disabled:opacity-50 disabled:pointer-events-none',
								sizeClasses[size],
								isOpen && 'text-primary'
							)}
						>
							<div className='flex items-center space-x-3'>
								{item.icon && <span className='text-foreground-muted'>{item.icon}</span>}
								<span className='font-medium text-left'>{item.title}</span>
							</div>

							<div className='flex-shrink-0'>
								{isOpen ? (
									<ChevronUp className='h-4 w-4 text-foreground-muted' />
								) : (
									<ChevronDown className='h-4 w-4 text-foreground-muted' />
								)}
							</div>
						</button>

						{isOpen && (
							<div
								className={cn(
									'px-4 pb-4 text-foreground-secondary',
									size === 'sm' ? 'pt-2' : size === 'md' ? 'pt-3' : 'pt-4'
								)}
							>
								{item.content}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
};
