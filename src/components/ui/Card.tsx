import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
	className?: string;
	onRemove?: () => void;
	showRemove?: boolean;
}

export const Card: React.FC<CardProps> = ({
	children,
	className,
	onRemove,
	showRemove = false,
	...props
}) => {
	return (
		<div
			className={cn('shadow-sm rounded-lg bg-white p-4 border border-gray-200 relative', className)}
			{...props}
		>
			{showRemove && onRemove && (
				<button
					type='button'
					onClick={onRemove}
					className='absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors'
					title='Remove'
				>
					<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M6 18L18 6M6 6l12 12'
						/>
					</svg>
				</button>
			)}
			{children}
		</div>
	);
};
