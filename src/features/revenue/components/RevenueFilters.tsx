import React from 'react';
import { Card } from '../../../components/ui/Card';
import { FloatingDropdown, SearchButton } from '../../../components/ui';
import { FacilityDropdown } from '../../../components/FacilityDropdown';
import { DropdownOption } from '../hooks/useRevenueFilters';

interface RevenueFiltersProps {
	selectedMonth: string;
	selectedYear: string;
	selectedFacility: string;
	selectedCostCategory: string;
	monthOptions: DropdownOption[];
	yearOptions: DropdownOption[];
	costCategoryOptions: DropdownOption[];
	onMonthChange: (value: string) => void;
	onYearChange: (value: string) => void;
	onFacilityChange: (value: string) => void;
	onCostCategoryChange: (value: string) => void;
	onSearch: () => void;
}

export const RevenueFilters: React.FC<RevenueFiltersProps> = ({
	selectedMonth,
	selectedYear,
	selectedFacility,
	selectedCostCategory,
	monthOptions,
	yearOptions,
	costCategoryOptions,
	onMonthChange,
	onYearChange,
	onFacilityChange,
	onCostCategoryChange,
	onSearch,
}) => {
	// Cost category is optional - search is enabled when month, year, and facility are selected
	const isSearchDisabled = !selectedMonth || !selectedYear || !selectedFacility;

	return (
		<Card className='p-4 sm:p-6'>
			<div className='flex flex-wrap gap-4 items-end'>
				<div className='w-56'>
					<FloatingDropdown
						label='Month'
						options={monthOptions}
						value={selectedMonth}
						onChange={onMonthChange}
						placeholder='Select month'
						className='w-full'
					/>
				</div>
				<div className='w-56'>
					<FloatingDropdown
						label='Year'
						options={yearOptions}
						value={selectedYear}
						onChange={onYearChange}
						placeholder='Select year'
						className='w-full'
					/>
				</div>
				<div className='w-56'>
					<FacilityDropdown
						value={selectedFacility}
						onChange={onFacilityChange}
						autoSelectFirst={true}
						className='w-full'
					/>
				</div>
				<div className='w-56'>
					<FloatingDropdown
						label='Cost Category'
						options={[
							{ value: '', label: 'All' },
							...costCategoryOptions,
						]}
						value={selectedCostCategory}
						onChange={onCostCategoryChange}
						placeholder='Select cost category'
						className='w-full'
					/>
				</div>
				<div>
					<SearchButton onClick={onSearch} disabled={isSearchDisabled} />
				</div>
			</div>
		</Card>
	);
};

