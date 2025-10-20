import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SearchButtonProps {
	onClick: () => void;
	title?: string;
	className?: string;
	disabled?: boolean;
	size?: 'sm' | 'md' | 'lg';
}

export const SearchButton: React.FC<SearchButtonProps> = ({
	onClick,
	title = 'Search',
	className,
	disabled = false,
	size = 'md',
}) => {
	const sizeClasses = {
		sm: 'px-2 py-1.5 text-xs',
		md: 'px-3 py-2 text-sm',
		lg: 'px-4 py-3 text-base',
	};

	const iconSizes = {
		sm: 'h-3 w-3',
		md: 'h-5 w-5',
		lg: 'h-6 w-6',
	};

	return (
		<button
			type='button'
			onClick={e => {
				onClick();
				e.currentTarget.blur();
			}}
			disabled={disabled}
			title={title}
			className={cn(
				// --- core layout
				'inline-flex items-center justify-center rounded-[10px] relative overflow-hidden group transition-all duration-300',
				// --- improved visual
				'border border-gray-300 bg-gradient-to-br from-white to-gray-50 shadow-sm',
				'hover:from-green-50 hover:to-green-100 hover:border-green-400 hover:shadow-md',
				'focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2',
				'active:scale-95',
				'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
				sizeClasses[size],
				className
			)}
		>
			{/* subtle ripple hover circle */}
			<span className='absolute inset-0 scale-0 bg-green-100 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 rounded-full'></span>

			{/* icon with motion */}
			<Search
				className={cn(
					iconSizes[size],
					'relative text-green-600 transition-transform duration-300 group-hover:scale-110 group-hover:text-green-700'
				)}
			/>
		</button>
	);
};
