import React from 'react';
import { useSelector } from 'react-redux';
import { Card } from '../../../components/ui/Card';
import { FloatingDropdown, SearchButton } from '../../../components/ui';
import { DropdownOption } from '../hooks/useRevenueFilters';
import { RootState } from '../../../store';
import { canFilterByCity } from '../../../utils/cityFilterPermissions';

interface RevenueAddFiltersProps {
	selectedMonth: string;
	selectedYear: string;
	selectedCity: string;
	selectedFacility: string;
	monthOptions: DropdownOption[];
	yearOptions: DropdownOption[];
	cityOptions: DropdownOption[];
	facilityOptions: DropdownOption[];
	onMonthChange: (value: string) => void;
	onYearChange: (value: string) => void;
	onCityChange: (value: string) => void;
	onFacilityChange: (value: string) => void;
	onSearch: () => void;
}

export const RevenueAddFilters: React.FC<RevenueAddFiltersProps> = ({
	selectedMonth,
	selectedYear,
	selectedCity,
	selectedFacility,
	monthOptions,
	yearOptions,
	cityOptions,
	facilityOptions,
	onMonthChange,
	onYearChange,
	onCityChange,
	onFacilityChange,
	onSearch,
}) => {
	const user = useSelector((state: RootState) => state.auth.user);
	const userTypeId = user?.userTypeId;
	const showCityFilter = canFilterByCity(userTypeId);

	// Search is enabled when month, year, and facility are selected
	// For user_type_id=4, city must also be selected
	const isSearchDisabled = !selectedMonth || !selectedYear || !selectedFacility || (showCityFilter && !selectedCity);

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
				{showCityFilter && (
					<div className='w-56'>
						<FloatingDropdown
							label='City'
							options={cityOptions}
							value={selectedCity}
							onChange={onCityChange}
							placeholder='Select city'
							className='w-full'
						/>
					</div>
				)}
				<div className='w-56'>
					<FloatingDropdown
						label='Washing Facility'
						options={facilityOptions}
						value={selectedFacility}
						onChange={onFacilityChange}
						placeholder='Select facility'
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

