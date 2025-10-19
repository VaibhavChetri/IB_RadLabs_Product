import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
	currentPage: number;
	totalPages: number;
	totalItems: number;
	itemsPerPage: number;
	onPageChange: (page: number) => void;
	onItemsPerPageChange?: (itemsPerPage: number) => void;
	showItemsPerPage?: boolean;
	className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
	currentPage,
	totalPages,
	totalItems,
	itemsPerPage,
	onPageChange,
	onItemsPerPageChange,
	showItemsPerPage = true,
	className = '',
}) => {
	const startItem = (currentPage - 1) * itemsPerPage + 1;
	const endItem = Math.min(currentPage * itemsPerPage, totalItems);

	const itemsPerPageOptions = [5, 10, 25, 50, totalItems];

	return (
		<div className={`flex items-center justify-between ${className}`}>
			{/* Items per page selector - always show */}
			{showItemsPerPage && onItemsPerPageChange && (
				<div className='flex items-center gap-3'>
					<span className='text-sm font-medium text-gray-700'>Rows per page:</span>
					<div className='relative'>
						<select
							value={itemsPerPage}
							onChange={e => onItemsPerPageChange(Number(e.target.value))}
							className='appearance-none bg-transparent border-none text-sm font-medium text-gray-700 cursor-pointer focus:outline-none pr-6'
						>
							{itemsPerPageOptions.map(option => (
								<option key={option} value={option}>
									{option === totalItems ? 'All' : option}
								</option>
							))}
						</select>
						<div className='absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none'>
							<svg
								className='w-3 h-3 text-gray-500'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M19 9l-7 7-7-7'
								/>
							</svg>
						</div>
					</div>
				</div>
			)}

			{/* Page info */}
			<div className='text-sm font-medium text-gray-700'>
				{itemsPerPage === totalItems
					? `All ${totalItems} items`
					: `${startItem}-${endItem} of ${totalItems}`}
			</div>

			{/* Navigation arrows - only show when there are multiple pages */}
			{totalPages > 1 && (
				<div className='flex items-center gap-2'>
					<button
						onClick={() => onPageChange(currentPage - 1)}
						disabled={currentPage === 1}
						className={`p-1 rounded transition-colors ${
							currentPage === 1
								? 'text-gray-300 cursor-not-allowed'
								: 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
						}`}
					>
						<ChevronLeft className='w-4 h-4' />
					</button>
					<button
						onClick={() => onPageChange(currentPage + 1)}
						disabled={currentPage === totalPages}
						className={`p-1 rounded transition-colors ${
							currentPage === totalPages
								? 'text-gray-300 cursor-not-allowed'
								: 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
						}`}
					>
						<ChevronRight className='w-4 h-4' />
					</button>
				</div>
			)}
		</div>
	);
};
