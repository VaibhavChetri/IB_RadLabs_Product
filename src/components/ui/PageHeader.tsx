import React from 'react';

interface InfoItem {
	label: string;
	value: string;
	icon?: string;
	color?: string;
}

interface PageHeaderProps {
	title: string;
	subtitle?: string;
	infoItems?: InfoItem[];
	className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
	title,
	subtitle,
	infoItems = [],
	className = '',
}) => {
	return (
		<div className={`bg-white rounded-xl shadow-lg p-6 mb-6 ${className}`}>
			<div className='flex items-center gap-3 mb-4'>
				<div>
					<h1 className='text-3xl font-bold text-gray-900'>{title}</h1>
					{subtitle && <p className='text-gray-500'>{subtitle}</p>}
				</div>
			</div>

			{infoItems.length > 0 && (
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg'>
					{infoItems.map((item, index) => (
						<div key={index} className='flex items-center gap-3'>
							<div
								className={`w-8 h-8 ${item.color || 'bg-gray-100'} rounded-full flex items-center justify-center`}
							>
								<span
									className={`${item.color?.includes('green') ? 'text-green-600' : item.color?.includes('blue') ? 'text-blue-600' : 'text-gray-600'} text-sm`}
								>
									{item.icon || '📋'}
								</span>
							</div>
							<div>
								<p className='text-sm text-gray-500'>{item.label}</p>
								<p className='font-semibold text-gray-900'>{item.value}</p>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default PageHeader;
