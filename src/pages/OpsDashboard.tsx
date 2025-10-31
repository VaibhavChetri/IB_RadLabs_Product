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
		clientOptions,
		loadingClients,
		onStartDateChange,
		onEndDateChange,
		onClientChange,
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
		clientId: selectedClient,
		startDate,
		endDate,
		enabled: !!startDate && !!endDate && !!user?.city_id, // Auto-fetch when dates are set
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
					clientOptions={clientOptions}
					loadingClients={loadingClients}
					onStartDateChange={onStartDateChange}
					onEndDateChange={onEndDateChange}
					onClientChange={onClientChange}
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
					/>
				</ErrorBoundary>
			</div>
		</ErrorBoundary>
	);
};
