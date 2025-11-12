import React from 'react';
import { Card } from '../../../components/ui/Card';
import { FloatingDropdown, SearchButton } from '../../../components/ui';
import { FacilityDropdown } from '../../../components/FacilityDropdown';
import { DropdownOption } from '../hooks/useRevenueFilters';

interface RevenueAddFiltersProps {
	selectedMonth: string;
	selectedYear: string;
	selectedFacility: string;
	monthOptions: DropdownOption[];
	yearOptions: DropdownOption[];
	onMonthChange: (value: string) => void;
	onYearChange: (value: string) => void;
	onFacilityChange: (value: string) => void;
	onSearch: () => void;
}

export const RevenueAddFilters: React.FC<RevenueAddFiltersProps> = ({
	selectedMonth,
	selectedYear,
	selectedFacility,
	monthOptions,
	yearOptions,
	onMonthChange,
	onYearChange,
	onFacilityChange,
	onSearch,
}) => {
	// Search is enabled when month, year, and facility are selected
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
				<div>
					<SearchButton onClick={onSearch} disabled={isSearchDisabled} />
				</div>
			</div>
		</Card>
	);
};

