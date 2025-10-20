import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { SearchButton } from './SearchButton';

export interface FilterChipOption {
	id: string;
	label: string;
	value: string;
}

export interface FilterChipGroup {
	id: string;
	label: string;
	options: FilterChipOption[];
}

interface FilterChipsProps {
	filterGroups: FilterChipGroup[];
	activeFilters: Record<string, string>;
	onFilterChange: (groupId: string, value: string) => void;
	onClearAll: () => void;
	onSearch: () => void;
	searchPlaceholder?: string;
	className?: string;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
	filterGroups,
	activeFilters,
	onFilterChange,
	onClearAll,
	onSearch,
	searchPlaceholder = 'Search clients, facilities, or types...',
	className,
}) => {
	const [searchTerm, setSearchTerm] = useState('');

	const activeFilterCount = Object.values(activeFilters).filter(value => value !== '').length;

	const filteredGroups = filterGroups.map(group => ({
		...group,
		options: group.options.filter(option =>
			option.label.toLowerCase().includes(searchTerm.toLowerCase())
		),
	}));

	return (
		<div
			className={cn(
				'bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-lg p-6 mb-8',
				className
			)}
		>
			{/* Smart Search */}
			<div className='relative mb-6'>
				<Search className='absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400' />
				<input
					type='text'
					placeholder={searchPlaceholder}
					value={searchTerm}
					onChange={e => setSearchTerm(e.target.value)}
					className='w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white/80'
				/>
			</div>

			{/* Filter Groups */}
			<div className='space-y-4'>
				{filteredGroups.map(group => (
					<div key={group.id}>
						<label className='text-sm font-medium text-gray-700 mb-2 block'>{group.label}</label>
						<div className='flex flex-wrap gap-2'>
							{group.options.map(option => {
								const isActive = activeFilters[group.id] === option.value;
								return (
									<button
										key={option.value}
										onClick={() => onFilterChange(group.id, option.value)}
										className={cn(
											'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
											isActive
												? 'bg-green-500 text-white shadow-lg shadow-green-200 transform scale-105'
												: 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
										)}
									>
										{option.label}
									</button>
								);
							})}
						</div>
					</div>
				))}
			</div>

			{/* Active Filters Summary */}
			{activeFilterCount > 0 && (
				<div className='mt-4 p-3 bg-green-50 border border-green-200 rounded-lg'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-2 text-sm text-green-800'>
							<span className='font-medium'>{activeFilterCount} filters applied:</span>
							{Object.entries(activeFilters)
								.filter(([_, value]) => value !== '')
								.map(([groupId, value]) => {
									const group = filterGroups.find(g => g.id === groupId);
									const option = group?.options.find(o => o.value === value);
									return (
										<span
											key={groupId}
											className='inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs'
										>
											{group?.label}: {option?.label}
											<button
												onClick={() => onFilterChange(groupId, '')}
												className='text-green-600 hover:text-green-800'
											>
												<X className='h-3 w-3' />
											</button>
										</span>
									);
								})}
						</div>
					</div>
				</div>
			)}

			{/* Actions */}
			<div className='flex items-center justify-between mt-6 pt-4 border-t border-gray-200'>
				<div className='flex items-center gap-2 text-sm text-gray-600'>
					<span>{activeFilterCount} filters applied</span>
				</div>

				<div className='flex items-center gap-3'>
					{activeFilterCount > 0 && (
						<button
							onClick={onClearAll}
							className='px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all'
						>
							Clear All
						</button>
					)}
					<SearchButton onClick={onSearch} />
				</div>
			</div>
		</div>
	);
};
