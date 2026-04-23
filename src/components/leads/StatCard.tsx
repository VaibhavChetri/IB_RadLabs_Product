/**
 * StatCard Component
 * Displays a statistic card with title, value, and optional icon
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
	title: string;
	value: string | number;
	icon?: LucideIcon;
	color?: string;
	className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
	title,
	value,
	icon: Icon,
	color = '#3B82F6',
	className = '',
}) => {
	return (
		<div
			className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${className}`}
			style={{ borderLeftColor: color }}
		>
			<div className='flex items-center justify-between'>
				<div className='flex-1'>
					<p className='text-sm font-medium text-gray-600 mb-1'>{title}</p>
					<p className='text-2xl font-bold text-gray-900'>{value}</p>
				</div>
				{Icon && (
					<div className='ml-4' style={{ color: color }}>
						<Icon className='w-8 h-8' />
					</div>
				)}
			</div>
		</div>
	);
};
