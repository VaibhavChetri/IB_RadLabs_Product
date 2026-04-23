import React from 'react';
import { useSelector } from 'react-redux';
import { Card } from '../../../components/ui/Card';
import { FloatingDropdown, SearchButton } from '../../../components/ui';
import { DropdownOption } from '../hooks/useRevenueFilters';
import { RootState } from '../../../store';

interface RevenueFiltersProps {
	selectedMonth: string;
	selectedYear: string;
	selectedCity: string;
	selectedFacility: string;
	selectedCostCategory: string;
	monthOptions: DropdownOption[];
	yearOptions: DropdownOption[];
	cityOptions: DropdownOption[];
	facilityOptions: DropdownOption[];
	costCategoryOptions: DropdownOption[];
	onMonthChange: (value: string) => void;
	onYearChange: (value: string) => void;
	onCityChange: (value: string) => void;
	onFacilityChange: (value: string) => void;
	onCostCategoryChange: (value: string) => void;
	onSearch: () => void;
}

export const RevenueFilters: React.FC<RevenueFiltersProps> = ({
	selectedMonth,
	selectedYear,
	selectedCity,
	selectedFacility,
	selectedCostCategory,
	monthOptions,
	yearOptions,
	cityOptions,
	facilityOptions,
	costCategoryOptions,
	onMonthChange,
	onYearChange,
	onCityChange,
	onFacilityChange,
	onCostCategoryChange,
	onSearch,
}) => {
	const user = useSelector((state: RootState) => state.auth.user);
	const userTypeId = user?.userTypeId;
	const showCityFilter = userTypeId === 4;

	// Cost category is optional - search is enabled when month, year, and facility are selected
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

