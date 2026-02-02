import React from 'react';
import { Card } from '../../../components/ui/Card';
import { FloatingDropdown } from '../../../components/ui/FloatingDropdown';
import { MONTH_OPTIONS } from '../config/constants';
import { DropdownOption } from '../hooks/useDashboardFilters';

interface DashboardFiltersProps {
	selectedYear: string;
	selectedMonth: string;
	selectedClient: string;
	selectedFacility: string;
	yearOptions: DropdownOption[];
	clientOptions: DropdownOption[];
	facilityOptions: DropdownOption[];
	loadingClients: boolean;
	loadingFacilities: boolean;
	showClientDropdown?: boolean;
	onYearChange: (value: string) => void;
	onMonthChange: (value: string) => void;
	onClientChange: (value: string) => void;
	onFacilityChange: (value: string) => void;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
	selectedYear,
	selectedMonth,
	selectedClient,
	selectedFacility,
	yearOptions,
	clientOptions,
	facilityOptions,
	loadingClients,
	loadingFacilities,
	showClientDropdown = true,
	onYearChange,
	onMonthChange,
	onClientChange,
	onFacilityChange,
}) => {
	return (
		<Card className='p-4 sm:p-6'>
			<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
				<FloatingDropdown
					label='Year'
					options={yearOptions}
					value={selectedYear}
					onChange={onYearChange}
					placeholder='Select year'
					className='w-full'
				/>
				<FloatingDropdown
					label='Month'
					options={[...MONTH_OPTIONS]}
					value={selectedMonth}
					onChange={onMonthChange}
					placeholder='Select month'
					className='w-full'
				/>
				{showClientDropdown && (
					<FloatingDropdown
						label='Client'
						options={clientOptions}
						value={selectedClient}
						onChange={onClientChange}
						placeholder='Select client'
						loading={loadingClients}
						className='w-full'
						searchable
					/>
				)}
				<FloatingDropdown
					label='Washing Facility'
					options={facilityOptions}
					value={selectedFacility}
					onChange={onFacilityChange}
					placeholder='Select facility'
					loading={loadingFacilities}
					className='w-full'
					searchable
				/>
			</div>
		</Card>
	);
};
