import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

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
	const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
	const endItem = totalItems > 0 ? Math.min(currentPage * itemsPerPage, totalItems) : 0;

	// Generate items per page options
	// Include common page sizes, and "All" only if totalItems is reasonable
	const baseOptions = [5, 10, 20, 25, 50, 100];
	const itemsPerPageOptions = totalItems > 100 
		? baseOptions 
		: [...baseOptions.filter(opt => opt <= totalItems), totalItems].filter((v, i, a) => a.indexOf(v) === i);

	// Generate page numbers with ellipsis logic
	const generatePageNumbers = () => {
		const pages: (number | string)[] = [];
		const maxVisiblePages = 7; // Show up to 7 page numbers

		if (totalPages <= maxVisiblePages) {
			// Show all pages if total is small
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			// Smart pagination with ellipsis
			pages.push(1); // Always show first page

			if (currentPage <= 4) {
				// Near the beginning
				for (let i = 2; i <= 5; i++) {
					pages.push(i);
				}
				pages.push('...');
				pages.push(totalPages);
			} else if (currentPage >= totalPages - 3) {
				// Near the end
				pages.push('...');
				for (let i = totalPages - 4; i <= totalPages; i++) {
					pages.push(i);
				}
			} else {
				// In the middle
				pages.push('...');
				for (let i = currentPage - 1; i <= currentPage + 1; i++) {
					pages.push(i);
				}
				pages.push('...');
				pages.push(totalPages);
			}
		}

		return pages;
	};

	const pageNumbers = generatePageNumbers();

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
				{totalItems === 0
					? '0-0 of 0'
					: itemsPerPage === totalItems
						? `All ${totalItems} items`
						: `${startItem}-${endItem} of ${totalItems}`}
			</div>

			{/* Navigation - only show when there are multiple pages */}
			{totalPages > 1 && (
				<div className='flex items-center gap-1'>
					{/* Previous button */}
					<button
						onClick={() => onPageChange(currentPage - 1)}
						disabled={currentPage === 1}
						className={`p-2 rounded-md transition-colors ${
							currentPage === 1
								? 'text-gray-300 cursor-not-allowed'
								: 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
						}`}
						title='Previous page'
					>
						<ChevronLeft className='w-4 h-4' />
					</button>

					{/* Page numbers */}
					<div className='flex items-center gap-1'>
						{pageNumbers.map((page, index) => (
							<React.Fragment key={index}>
								{page === '...' ? (
									<span className='px-2 py-1 text-gray-500'>
										<MoreHorizontal className='w-4 h-4' />
									</span>
								) : (
									<button
										onClick={() => onPageChange(page as number)}
										className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
											currentPage === page
												? 'bg-green-600 text-white'
												: 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
										}`}
									>
										{page}
									</button>
								)}
							</React.Fragment>
						))}
					</div>

					{/* Next button */}
					<button
						onClick={() => onPageChange(currentPage + 1)}
						disabled={currentPage === totalPages}
						className={`p-2 rounded-md transition-colors ${
							currentPage === totalPages
								? 'text-gray-300 cursor-not-allowed'
								: 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
						}`}
						title='Next page'
					>
						<ChevronRight className='w-4 h-4' />
					</button>
				</div>
			)}
		</div>
	);
};
