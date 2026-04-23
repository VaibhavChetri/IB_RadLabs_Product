/**
 * KAM Metrics Component
 * Combines circular progress and daily graph
 * Apple Watch style layout
 */

import React from 'react';
import { Card } from '../../../components/ui';
import { KAMEodReportResponse } from '../../../services/opsDashboardApi';
import { CircularProgress } from '../../../components/charts';
import { KAMDailyBarChart, KAMStackedBarChart } from './charts';
import { getCityColorById } from '../utils/cityColorUtils';

interface KAMMetricsProps {
	kamData: KAMEodReportResponse | null;
	cityId?: number;
	selectedCity?: string; // 'all' or city ID string
	showCityFilter?: boolean; // Whether city filter is available
}

export const KAMMetrics: React.FC<KAMMetricsProps> = ({
	kamData,
	cityId,
	selectedCity,
	showCityFilter,
}) => {
	if (!kamData?.citySummary || kamData.citySummary.length === 0) {
		return <div className='text-center text-gray-500 py-8'>No KAM data available</div>;
	}

	// Determine if we should show stacked chart (multiple cities) or individual charts
	const showStackedChart = showCityFilter && (selectedCity === 'all' || !selectedCity);

	// Filter cities if specific cityId is provided
	const citiesToShow = cityId
		? kamData.citySummary.filter(c => c.city_id === cityId)
		: kamData.citySummary;

	if (citiesToShow.length === 0) {
		return <div className='text-center text-gray-500 py-8'>City data not found</div>;
	}

	// Show stacked bar chart when multiple cities are selected
	if (showStackedChart) {
		return (
			<Card className='p-6' role='region' aria-label='KAM Metrics by City'>
				<div className='text-center mb-6'>
					<h3 className='text-lg font-semibold text-gray-900'>KAM Data Filled</h3>
				</div>
				{/* Circular Progress Indicators for all cities */}
				<div className='flex flex-wrap justify-between items-center gap-4 mb-6'>
					{kamData.citySummary.map(cityData => (
						<CircularProgress
							key={cityData.city_id}
							label={cityData.cityName}
							percentage={parseFloat(cityData.avgPercentage) || 0}
							color={getCityColorById(cityData.city_id)}
							daysEntered={cityData.daysEntered}
							totalDays={kamData.totalDays || 0}
						/>
					))}
				</div>
				{/* Stacked Bar Chart */}
				<KAMStackedBarChart data={kamData} ariaLabel='KAM Data Filled - Stacked Bar Chart' />
			</Card>
		);
	}

	// Show individual charts for single city or when city filter is not available
	return (
		<Card className='p-6' role='region' aria-label='KAM Metrics by City'>
			{/* Centered heading for all graphs */}
			<div className='text-center mb-6'>
				<h3 className='text-lg font-semibold text-gray-900'>Daily KAM Entry Trend</h3>
			</div>
			<div className='space-y-0'>
				{citiesToShow.map((cityData, index) => (
					<div key={cityData.city_id}>
						<div className='grid grid-cols-[minmax(0,30%)_minmax(0,70%)] gap-6 items-center py-6'>
							{/* Left: Circular Progress - 20-30% width, centered */}
							<div className='flex justify-center'>
								<CircularProgress
									label={cityData.cityName}
									percentage={parseFloat(cityData.avgPercentage) || 0}
									color={getCityColorById(cityData.city_id)}
									daysEntered={cityData.daysEntered}
									totalDays={kamData.totalDays || 0}
								/>
							</div>

							{/* Right: Daily Graph - 70-80% width */}
							<KAMDailyBarChart data={kamData} cityId={cityData.city_id} />
						</div>
						{/* Horizontal divider between cities */}
						{index < citiesToShow.length - 1 && <hr className='border-t border-gray-200 my-0' />}
					</div>
				))}
			</div>
		</Card>
	);
};
