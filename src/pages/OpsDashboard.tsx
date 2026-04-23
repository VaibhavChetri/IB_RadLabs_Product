import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { PageHeader } from '../components/ui';
import { ErrorBoundary } from '../components/ErrorBoundary';
import {
	OpsDashboardFilters,
	OpsDashboardContent,
	useOpsDashboardFilters,
	useOpsDashboardData,
} from '../features/ops-dashboard';

export const OpsDashboard: React.FC = () => {
	const { user } = useSelector((state: RootState) => state.auth);
	const {
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
	} = useOpsDashboardFilters();

	const {
		kamEodData,
		transitPlanData,
		qcEodData,
		dispatchDelayData,
		shiftStatusData,
		loading,
		error,
		refetch,
	} = useOpsDashboardData({
		cityId: user?.city_id,
		selectedCityId: showCityFilter ? selectedCity : undefined,
		clientId: selectedClient,
		startDate,
		endDate,
		enabled: !!startDate && !!endDate, // Auto-fetch when dates are set (city_id is optional if "All" selected)
	});

	const handleSearch = () => {
		if (startDate && endDate) {
			refetch();
		}
	};

	return (
		<ErrorBoundary>
			<div className='space-y-6'>
				<PageHeader
					title='Ops Dashboard'
					locationName={user?.city_name || 'City'}
					totalItems={0}
					itemType='dashboard'
					icon='📊'
				/>

				<OpsDashboardFilters
					startDate={startDate}
					endDate={endDate}
					selectedClient={selectedClient}
					selectedCity={selectedCity}
					clientOptions={clientOptions}
					cityOptions={cityOptions}
					loadingClients={loadingClients}
					loadingCities={loadingCities}
					showCityFilter={showCityFilter}
					onStartDateChange={onStartDateChange}
					onEndDateChange={onEndDateChange}
					onClientChange={onClientChange}
					onCityChange={onCityChange}
					onSearch={handleSearch}
				/>

				<ErrorBoundary>
					<OpsDashboardContent
						kamEodData={kamEodData}
						transitPlanData={transitPlanData}
						qcEodData={qcEodData}
						dispatchDelayData={dispatchDelayData}
						shiftStatusData={shiftStatusData}
						loading={loading}
						error={error}
						selectedCity={selectedCity}
						showCityFilter={showCityFilter}
					/>
				</ErrorBoundary>
			</div>
		</ErrorBoundary>
	);
};
