/**
 * LocationVarianceFilters
 *
 * Year dropdown + month chip strip + city multi-select + search input.
 * Mirrors the layout convention from PLFilters.tsx (Card wrapper, flex-wrap row).
 */

import React from 'react';
import { Card, FloatingDropdown, MultiSelectDropdown } from '../../../components/ui';
import { MonthChips } from './MonthChips';

interface LocationVarianceFiltersProps {
	// Year
	year: string;
	yearOptions: ReadonlyArray<{ value: string; label: string }>;
	onYearChange: (year: string) => void;
	// Months
	selectedMonths: string[];
	onMonthToggle: (yyyymm: string) => void;
	// City
	showCityFilter: boolean;
	cityOptions: Array<{ value: string; label: string }>;
	selectedCityIds: string[];
	onCityChange: (ids: string[]) => void;
	loadingCities: boolean;
	// Search
	search: string;
	onSearchChange: (s: string) => void;
}

export const LocationVarianceFilters: React.FC<LocationVarianceFiltersProps> = ({
	year,
	yearOptions,
	onYearChange,
	selectedMonths,
	onMonthToggle,
	showCityFilter,
	cityOptions,
	selectedCityIds,
	onCityChange,
	loadingCities,
	search,
	onSearchChange,
}) => {
	return (
		<Card className='p-4 sm:p-6'>
			<div className='flex flex-col gap-4'>
				{/* Row 1: year + city + search */}
				<div className='flex flex-wrap items-end gap-4'>
					<div className='w-40'>
						<FloatingDropdown
							label='Year'
							options={[...yearOptions]}
							value={year}
							onChange={onYearChange}
							placeholder='Year'
							className='w-full'
						/>
					</div>

					{showCityFilter && (
						<div className='w-64'>
							<MultiSelectDropdown
								label='Cities'
								options={cityOptions}
								value={selectedCityIds}
								onChange={onCityChange}
								placeholder={loadingCities ? 'Loading…' : 'All cities'}
								disabled={loadingCities}
								searchable
								showSelectedCount
							/>
						</div>
					)}

					<div className='flex-1 min-w-[200px]'>
						<input
							type='text'
							value={search}
							onChange={(e) => onSearchChange(e.target.value)}
							placeholder='Search location name…'
							className='w-full h-12 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
						/>
					</div>
				</div>

				{/* Row 2: month chips */}
				<div>
					<MonthChips year={year} selected={selectedMonths} onToggle={onMonthToggle} />
					{selectedMonths.length === 0 && (
						<div className='text-xs text-amber-600 mt-2'>
							Pick at least one month to load data.
						</div>
					)}
				</div>
			</div>
		</Card>
	);
};
