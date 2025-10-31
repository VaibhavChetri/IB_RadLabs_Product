/**
 * Ops Dashboard Filters Component
 * Renders date filters and client dropdown
 */

import React from 'react';
import { FloatingInput, FloatingDropdown, SearchButton } from '../../../components/ui';
import { Card } from '../../../components/ui/Card';
import { DropdownOption } from '../../dashboard/hooks/useDashboardFilters';

interface OpsDashboardFiltersProps {
	startDate: string;
	endDate: string;
	selectedClient: string;
	selectedCity: string;
	clientOptions: DropdownOption[];
	cityOptions: DropdownOption[];
	loadingClients: boolean;
	loadingCities: boolean;
	showCityFilter: boolean;
	onStartDateChange: (value: string) => void;
	onEndDateChange: (value: string) => void;
	onClientChange: (value: string) => void;
	onCityChange: (value: string) => void;
	onSearch: () => void;
}

export const OpsDashboardFilters: React.FC<OpsDashboardFiltersProps> = ({
	startDate,
	endDate,
	selectedClient,
	selectedCity,
	clientOptions,
	cityOptions,
	loadingClients,
	loadingCities,
	showCityFilter,
	onStartDateChange,
	onEndDateChange,
	onClientChange,
	onCityChange,
	onSearch,
}) => {
	return (
		<Card className='p-4 sm:p-6' role='region' aria-label='Ops Dashboard Filters'>
			<div className='flex flex-wrap gap-4 items-end'>
				<div className='w-56'>
					<FloatingInput
						label='Start Date'
						type='date'
						value={startDate}
						onChange={onStartDateChange}
					/>
				</div>
				<div className='w-56'>
					<FloatingInput label='End Date' type='date' value={endDate} onChange={onEndDateChange} />
				</div>
				{showCityFilter && (
					<div className='w-56'>
						<FloatingDropdown
							label='Select City'
							options={cityOptions}
							value={selectedCity}
							onChange={onCityChange}
							placeholder='Select city'
							loading={loadingCities}
							searchable
						/>
					</div>
				)}
				<div className='w-56'>
					<FloatingDropdown
						label='Select Client'
						options={clientOptions}
						value={selectedClient}
						onChange={onClientChange}
						placeholder='Select client'
						loading={loadingClients}
						searchable
					/>
				</div>
				<div>
					<SearchButton onClick={onSearch} disabled={!startDate || !endDate} />
				</div>
			</div>
		</Card>
	);
};
