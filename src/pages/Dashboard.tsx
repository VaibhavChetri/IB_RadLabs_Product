import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { PageHeader } from '../components/ui';
import { ErrorBoundary } from '../components/ErrorBoundary';
import {
	DashboardFilters,
	DashboardContent,
	useDashboardFilters,
	useDashboardDataQuery,
} from '../features/dashboard';

export const Dashboard: React.FC = () => {
	const { user } = useSelector((state: RootState) => state.auth);
	const {
		selectedYear,
		selectedMonth,
		selectedClient,
		selectedFacility,
		yearOptions,
		clientOptions,
		facilityOptions,
		loadingClients,
		loadingFacilities,
		setSelectedYear,
		setSelectedMonth,
		setSelectedClient,
		setSelectedFacility,
	} = useDashboardFilters();

	const showClientDropdown = user?.userTypeId !== 28;
	const clientIdForApi = showClientDropdown ? selectedClient : 'all';

	// Fetch dashboard data using React Query (with caching and automatic refetching)
	const {
		stats,
		data: chartData,
		loading,
		error,
	} = useDashboardDataQuery({
		locationId: selectedFacility,
		clientId: clientIdForApi,
		month: selectedMonth,
		year: selectedYear,
		enabled: !!selectedFacility && !!selectedMonth && !!selectedYear,
	});

	return (
		<ErrorBoundary>
			<div className='space-y-6'>
				<PageHeader
					title='Inventory Analysis'
					locationName={user?.city_name || 'City'}
					totalItems={0}
					itemType='analysis'
					icon='📊'
				/>

				<DashboardFilters
					selectedYear={selectedYear}
					selectedMonth={selectedMonth}
					selectedClient={selectedClient}
					selectedFacility={selectedFacility}
					yearOptions={yearOptions}
					clientOptions={clientOptions}
					facilityOptions={facilityOptions}
					loadingClients={loadingClients}
					loadingFacilities={loadingFacilities}
					showClientDropdown={showClientDropdown}
					onYearChange={setSelectedYear}
					onMonthChange={setSelectedMonth}
					onClientChange={setSelectedClient}
					onFacilityChange={setSelectedFacility}
				/>

				<ErrorBoundary>
					<DashboardContent stats={stats} chartData={chartData} loading={loading} error={error} />
				</ErrorBoundary>
			</div>
		</ErrorBoundary>
	);
};
