/**
 * Sent Transit Metrics Component
 * Combines circular progress and daily graph
 * Apple Watch style layout
 */

import React from 'react';
import { Card } from '../../../../components/ui';
import { CircularProgress } from '../../../../components/charts';
import { TransitPlanDispatchPickupSummaryResponse } from '../../../../services/opsDashboardApi';
import { SentTransitStackedBarChart } from '../charts/SentTransitStackedBarChart';
import { SentTransitDailyBarChart } from '../charts/SentTransitDailyBarChart';
import { getCityColorById } from '../../utils/cityColorUtils';

interface SentTransitMetricsProps {
	transitPlanData: TransitPlanDispatchPickupSummaryResponse | null;
	cityId?: number;
	selectedCity?: string; // 'all' or city ID string
	showCityFilter?: boolean; // Whether city filter is available
}

export const SentTransitMetrics: React.FC<SentTransitMetricsProps> = ({
	transitPlanData,
	cityId,
	selectedCity,
	showCityFilter,
}) => {
	if (!transitPlanData?.sent?.citySummary || transitPlanData.sent.citySummary.length === 0) {
		return <div className='text-center text-gray-500 py-8'>No Sent Transit data available</div>;
	}

	// Determine if we should show stacked chart (multiple cities) or individual charts
	const showStackedChart = showCityFilter && (selectedCity === 'all' || !selectedCity);

	// Filter cities if specific cityId is provided
	const citiesToShow = cityId
		? transitPlanData.sent.citySummary.filter(c => c.city_id === cityId)
		: transitPlanData.sent.citySummary;

	if (citiesToShow.length === 0) {
		return <div className='text-center text-gray-500 py-8'>City data not found</div>;
	}

	// Calculate totalDays from dailyEntryStatus length
	const totalDays = transitPlanData.sent.dailyEntryStatus?.length || 0;

	// Show stacked bar chart when multiple cities are selected
	if (showStackedChart) {
		return (
			<Card className='p-6' role='region' aria-label='Sent Transit Plan Metrics'>
				<div className='text-center mb-6'>
					<h3 className='text-lg font-semibold text-gray-900'>Sent Transit Plan</h3>
				</div>
				{/* Circular Progress Indicators for all cities */}
				<div className='flex flex-wrap justify-between items-center gap-4 mb-6'>
					{transitPlanData.sent.citySummary.map(cityData => {
						const percentage = parseFloat(cityData.avgPercentage.replace('%', '')) || 0;
						return (
							<CircularProgress
								key={cityData.city_id}
								label={cityData.cityName}
								percentage={percentage}
								color={getCityColorById(cityData.city_id)}
								daysEntered={cityData.daysEntered}
								totalDays={totalDays}
							/>
						);
					})}
				</div>
				{/* Stacked Bar Chart */}
				<SentTransitStackedBarChart data={transitPlanData} />
			</Card>
		);
	}

	// Show individual charts for single city or when city filter is not available
	// For now, show stacked chart with single city filter applied
	return (
		<Card className='p-6' role='region' aria-label='Sent Transit Plan Metrics'>
			<div className='text-center mb-6'>
				<h3 className='text-lg font-semibold text-gray-900'>Daily Sent Transit Plan Trend</h3>
			</div>
			<div className='space-y-0'>
				{citiesToShow.map((cityData, index) => (
					<div key={cityData.city_id}>
						<div className='grid grid-cols-[minmax(0,30%)_minmax(0,70%)] gap-6 items-center py-6'>
							{/* Left: Circular Progress - 20-30% width, centered */}
							<div className='flex justify-center'>
								<CircularProgress
									label={cityData.cityName}
									percentage={parseFloat(cityData.avgPercentage.replace('%', '')) || 0}
									daysEntered={cityData.daysEntered}
									totalDays={totalDays}
								/>
							</div>
							{/* Right: Daily Bar Chart - 70-80% width */}
							<SentTransitDailyBarChart data={transitPlanData} cityId={cityData.city_id} />
						</div>
						{/* Horizontal divider between cities */}
						{index < citiesToShow.length - 1 && <hr className='border-t border-gray-200 my-0' />}
					</div>
				))}
			</div>
		</Card>
	);
};
