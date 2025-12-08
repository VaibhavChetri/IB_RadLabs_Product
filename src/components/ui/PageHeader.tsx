import React from 'react';
import { cn } from '../../utils/cn';

export interface PageHeaderProps {
	title: string;
	locationName?: string;
	totalItems: number;
	itemType: string;
	icon?: string;
	className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
	title,
	locationName,
	totalItems,
	itemType,
	icon = '🏢',
	className,
}) => {
	return (
		<div className={cn('mb-6', className)}>
			<h1 className='text-2xl font-semibold text-gray-900 mb-2'>{title}</h1>
			<div className='flex items-center gap-4'>
				{locationName && (
					<>
						<span className='text-sm text-gray-600'>📍 {locationName}</span>
						{!(totalItems === 0 && (itemType === 'analysis' || itemType === 'dashboard')) && itemType && (
							<span className='text-sm text-gray-500'>•</span>
						)}
					</>
				)}
				{!(totalItems === 0 && (itemType === 'analysis' || itemType === 'dashboard')) && itemType && (
					<span className='text-sm text-gray-600'>
						{icon} {totalItems} {itemType}
					</span>
				)}
			</div>
		</div>
	);
};
