/**
 * KAM Metrics Component
 * Combines circular progress and daily graph
 * Apple Watch style layout
 */

import React from 'react';
import { KAMEodReportResponse } from '../../../services/opsDashboardApi';
import { KAMCircularProgress } from './KAMCircularProgress';
import { KAMDailyGraph } from './KAMDailyGraph';

interface KAMMetricsProps {
	kamData: KAMEodReportResponse | null;
	cityId?: number;
}

export const KAMMetrics: React.FC<KAMMetricsProps> = ({ kamData, cityId }) => {
	if (!kamData?.citySummary || kamData.citySummary.length === 0) {
		return <div className='text-center text-gray-500 py-8'>No KAM data available</div>;
	}

	// If cityId provided, show data for that city, otherwise show first city
	const cityData = cityId
		? kamData.citySummary.find(c => c.city_id === cityId)
		: kamData.citySummary[0];

	if (!cityData) {
		return <div className='text-center text-gray-500 py-8'>City data not found</div>;
	}

	return (
		<div className='grid grid-cols-[minmax(0,30%)_minmax(0,70%)] gap-6 items-center'>
			{/* Left: Circular Progress - 20-30% width, centered */}
			<div className='flex justify-center'>
				<KAMCircularProgress
					cityName={cityData.cityName}
					avgPercentage={cityData.avgPercentage}
					daysEntered={cityData.daysEntered}
					totalDays={kamData.totalDays || 0}
				/>
			</div>

			{/* Right: Daily Graph - 70-80% width */}
			<KAMDailyGraph data={kamData} cityId={cityData.city_id} />
		</div>
	);
};
