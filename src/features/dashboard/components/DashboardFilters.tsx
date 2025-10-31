import React from 'react';
import { Card } from '../../../components/ui/Card';
import { FloatingDropdown } from '../../../components/ui/FloatingDropdown';
import { MONTH_OPTIONS } from '../config/constants';
import { DropdownOption } from '../hooks/useDashboardFilters';

interface DashboardFiltersProps {
	selectedMonth: string;
	selectedClient: string;
	selectedFacility: string;
	clientOptions: DropdownOption[];
	facilityOptions: DropdownOption[];
	loadingClients: boolean;
	loadingFacilities: boolean;
	onMonthChange: (value: string) => void;
	onClientChange: (value: string) => void;
	onFacilityChange: (value: string) => void;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
	selectedMonth,
	selectedClient,
	selectedFacility,
	clientOptions,
	facilityOptions,
	loadingClients,
	loadingFacilities,
	onMonthChange,
	onClientChange,
	onFacilityChange,
}) => {
	return (
		<Card className='p-4 sm:p-6'>
			<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
				<FloatingDropdown
					label='Month'
					options={[...MONTH_OPTIONS]}
					value={selectedMonth}
					onChange={onMonthChange}
					placeholder='Select month'
					className='w-full'
				/>
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
