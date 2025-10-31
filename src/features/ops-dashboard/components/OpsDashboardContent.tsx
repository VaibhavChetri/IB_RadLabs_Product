/**
 * Ops Dashboard Content Component
 * Renders the main dashboard content (tables and graphs)
 */

import React, { useMemo } from 'react';
import {
	KAMEodReportResponse,
	TransitPlanDispatchPickupSummaryResponse,
	QCEodReportResponse,
	DispatchDelayReportResponse,
	ShiftStatusReportResponse,
} from '../../../services/opsDashboardApi';
import { OpsDashboardTable } from './OpsDashboardTable';
import { KAMMetrics } from './metrics/KAMMetrics';
import { SentTransitMetrics } from './metrics/SentTransitMetrics';
import { TransitDelayMetrics } from './metrics/TransitDelayMetrics';
import { transformToTableData } from '../utils/tableDataTransformers';

interface OpsDashboardContentProps {
	kamEodData: KAMEodReportResponse | null;
	transitPlanData: TransitPlanDispatchPickupSummaryResponse | null;
	qcEodData: QCEodReportResponse | null;
	dispatchDelayData: DispatchDelayReportResponse | null;
	shiftStatusData: ShiftStatusReportResponse | null;
	loading: boolean;
	error: string | null;
	selectedCity?: string;
	showCityFilter?: boolean;
}

export const OpsDashboardContent: React.FC<OpsDashboardContentProps> = ({
	kamEodData,
	transitPlanData,
	qcEodData,
	dispatchDelayData,
	shiftStatusData,
	loading,
	error,
	selectedCity,
	showCityFilter,
}) => {
	const tableRows = useMemo(
		() =>
			transformToTableData(
				kamEodData,
				transitPlanData,
				qcEodData,
				dispatchDelayData,
				shiftStatusData
			),
		[kamEodData, transitPlanData, qcEodData, dispatchDelayData, shiftStatusData]
	);

	if (error) {
		return (
			<div className='bg-red-50 border border-red-200 rounded-lg p-4' role='alert'>
				<p className='text-red-800'>{error}</p>
			</div>
		);
	}

	if (loading) {
		return (
			<div className='text-center py-8'>
				<p className='text-gray-600'>Loading dashboard data...</p>
			</div>
		);
	}

	return (
		<div className='space-y-6' role='region' aria-label='Ops Dashboard Content'>
			{/* Table Section - Always at top */}
			<OpsDashboardTable rows={tableRows} />

			{/* KAM Metrics Section */}
			<KAMMetrics
				kamData={kamEodData}
				selectedCity={selectedCity}
				showCityFilter={showCityFilter}
			/>

			{/* Sent Transit Metrics Section */}
			<SentTransitMetrics
				transitPlanData={transitPlanData}
				selectedCity={selectedCity}
				showCityFilter={showCityFilter}
			/>

			{/* Transit Delay Metrics Section */}
			<TransitDelayMetrics
				dispatchDelayData={dispatchDelayData}
				selectedCity={selectedCity}
				showCityFilter={showCityFilter}
			/>
		</div>
	);
};
