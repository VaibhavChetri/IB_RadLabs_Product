import React from 'react';
import { Card } from '../../../components/ui/Card';
import { FloatingDropdown } from '../../../components/ui/FloatingDropdown';
import { FacilityDropdown } from '../../../components/FacilityDropdown';
import { DropdownOption } from '../hooks/usePLFilters';

interface PLFiltersProps {
	selectedMonth: string;
	selectedYear: string;
	selectedFacility: string;
	monthOptions: DropdownOption[];
	yearOptions: DropdownOption[];
	onMonthChange: (value: string) => void;
	onYearChange: (value: string) => void;
	onFacilityChange: (value: string) => void;
}

export const PLFilters: React.FC<PLFiltersProps> = ({
	selectedMonth,
	selectedYear,
	selectedFacility,
	monthOptions,
	yearOptions,
	onMonthChange,
	onYearChange,
	onFacilityChange,
}) => {
	return (
		<Card className='p-4 sm:p-6'>
			<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
				<FloatingDropdown
					label='Month'
					options={monthOptions}
					value={selectedMonth}
					onChange={onMonthChange}
					placeholder='Select month'
					className='w-full'
				/>
				<FloatingDropdown
					label='Year'
					options={yearOptions}
					value={selectedYear}
					onChange={onYearChange}
					placeholder='Select year'
					className='w-full'
				/>
				<FacilityDropdown
					value={selectedFacility}
					onChange={onFacilityChange}
					autoSelectFirst={true}
					className='w-full'
				/>
			</div>
		</Card>
	);
};
