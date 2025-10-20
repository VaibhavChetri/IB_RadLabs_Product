import React, { useState } from 'react';
import { Search, Plus, X, Filter } from 'lucide-react';
import { cn } from '../../utils/cn';
import { SearchButton } from './SearchButton';

export interface FilterOption {
	id: string;
	label: string;
	value: string;
	type: 'dropdown' | 'multiselect';
	options: Array<{ label: string; value: string }>;
}

export interface ActiveFilter {
	id: string;
	label: string;
	value: string;
	displayValue: string;
}

interface ModernFilterProps {
	filters: FilterOption[];
	activeFilters: ActiveFilter[];
	onFilterAdd: (filterId: string, value: string) => void;
	onFilterRemove: (filterId: string) => void;
	onClearAll: () => void;
	onSearch: () => void;
	searchPlaceholder?: string;
	className?: string;
}

export const ModernFilter: React.FC<ModernFilterProps> = ({
	filters,
	activeFilters,
	onFilterAdd,
	onFilterRemove,
	onClearAll,
	onSearch,
	searchPlaceholder = 'Search clients, facilities, or types...',
	className,
}) => {
	const [showAddFilter, setShowAddFilter] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');

	const handleAddFilter = (filterId: string, value: string) => {
		onFilterAdd(filterId, value);
		setShowAddFilter(false);
	};

	const filteredFilters = filters.filter(
		filter =>
			filter.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
			filter.options.some(option => option.label.toLowerCase().includes(searchTerm.toLowerCase()))
	);

	return (
		<div
			className={cn(
				'bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-lg p-6 mb-8',
				className
			)}
		>
			{/* Smart Search Bar */}
			<div className='relative mb-4'>
				<Search className='absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400' />
				<input
					type='text'
					placeholder={searchPlaceholder}
					value={searchTerm}
					onChange={e => setSearchTerm(e.target.value)}
					className='w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white/80'
				/>
			</div>

			{/* Active Filter Pills */}
			<div className='flex flex-wrap gap-2 mb-4'>
				{activeFilters.map(filter => (
					<div
						key={filter.id}
						className='flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1.5 animate-in slide-in-from-left'
					>
						<span className='text-green-800 text-sm font-medium'>
							{filter.label}: {filter.displayValue}
						</span>
						<button
							onClick={() => onFilterRemove(filter.id)}
							className='text-green-600 hover:text-green-800 transition-colors'
						>
							<X className='h-3 w-3' />
						</button>
					</div>
				))}

				{/* Add Filter Button */}
				<button
					onClick={() => setShowAddFilter(!showAddFilter)}
					className='flex items-center gap-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-full px-3 py-1.5 text-sm text-gray-700 transition-all'
				>
					<Plus className='h-3 w-3' />
					Add Filter
				</button>
			</div>

			{/* Filter Dropdown */}
			{showAddFilter && (
				<div className='mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200'>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
						{filters.map(filter => (
							<div key={filter.id} className='space-y-2'>
								<label className='text-sm font-medium text-gray-700'>{filter.label}</label>
								<select
									onChange={e => {
										if (e.target.value) {
											handleAddFilter(filter.id, e.target.value);
										}
									}}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent'
								>
									<option value=''>Select {filter.label}</option>
									{filter.options.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Quick Actions */}
			<div className='flex items-center justify-between pt-4 border-t border-gray-200'>
				<div className='flex items-center gap-2 text-sm text-gray-600'>
					<Filter className='h-4 w-4' />
					<span>{activeFilters.length} filters applied</span>
				</div>

				<div className='flex items-center gap-3'>
					{activeFilters.length > 0 && (
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
