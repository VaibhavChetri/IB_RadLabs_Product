import React from 'react';

interface StatCardProps {
	icon: string;
	label: string;
	value: string | number;
	color?: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'yellow';
	flipIcon?: boolean;
}

const colorClasses = {
	blue: 'bg-blue-50 text-blue-600',
	green: 'bg-green-50 text-green-600',
	red: 'bg-red-50 text-red-600',
	orange: 'bg-orange-50 text-orange-600',
	purple: 'bg-purple-50 text-purple-600',
	yellow: 'bg-yellow-50 text-yellow-600',
};

export const StatCard: React.FC<StatCardProps> = ({
	icon,
	label,
	value,
	color = 'blue',
	flipIcon = false,
}) => {
	return (
		<div className={`p-6 rounded-lg shadow-sm border border-gray-200 ${colorClasses[color]}`}>
			<div className='flex items-center gap-3 mb-2'>
				<span className={`text-2xl ${flipIcon ? 'transform scale-x-[-1]' : ''}`}>{icon}</span>
				<div>
					<div className='text-sm font-medium opacity-80'>{label}</div>
					<div className='text-2xl font-bold'>{value.toLocaleString()}</div>
				</div>
			</div>
		</div>
	);
};
