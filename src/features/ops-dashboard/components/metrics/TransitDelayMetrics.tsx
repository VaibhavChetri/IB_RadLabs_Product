/**
 * Transit Delay Metrics Component
 * Combines circular progress and daily graph
 * Apple Watch style layout
 */

import React from 'react';
import { Card } from '../../../../components/ui';
import { CircularProgress } from '../../../../components/charts';
import { DispatchDelayReportResponse } from '../../../../services/opsDashboardApi';
import { TransitDelayStackedBarChart } from '../charts/TransitDelayStackedBarChart';
import { TransitDelayDailyBarChart } from '../charts/TransitDelayDailyBarChart';
import { getCityColorById } from '../../utils/cityColorUtils';

interface TransitDelayMetricsProps {
	dispatchDelayData: DispatchDelayReportResponse | null;
	cityId?: number;
	selectedCity?: string; // 'all' or city ID string
	showCityFilter?: boolean; // Whether city filter is available
}

export const TransitDelayMetrics: React.FC<TransitDelayMetricsProps> = ({
	dispatchDelayData,
	cityId,
	selectedCity,
	showCityFilter,
}) => {
	if (!dispatchDelayData?.citySummary || dispatchDelayData.citySummary.length === 0) {
		return <div className='text-center text-gray-500 py-8'>No Transit Delay data available</div>;
	}

	// Determine if we should show stacked chart (multiple cities) or individual charts
	const showStackedChart = showCityFilter && (selectedCity === 'all' || !selectedCity);

	// Filter cities if specific cityId is provided
	const citiesToShow = cityId
		? dispatchDelayData.citySummary.filter(c => c.city_id === cityId)
		: dispatchDelayData.citySummary;

	if (citiesToShow.length === 0) {
		return <div className='text-center text-gray-500 py-8'>City data not found</div>;
	}

	const totalDays = dispatchDelayData.totalDays || 0;

	// Find max avgDelay to normalize percentages
	const maxDelay = Math.max(
		...dispatchDelayData.citySummary.map(city => parseFloat(city.avgDelay) || 0)
	);

	// Show stacked bar chart when multiple cities are selected
	if (showStackedChart) {
		return (
			<Card className='p-6' role='region' aria-label='Transit Delay Metrics'>
				<div className='text-center mb-6'>
					<h3 className='text-lg font-semibold text-gray-900'>Transit Delay</h3>
				</div>
				{/* Circular Progress Indicators for all cities */}
				<div className='flex flex-wrap justify-between items-center gap-4 mb-6'>
					{dispatchDelayData.citySummary.map(cityData => {
						// Calculate daysEntered from dailyDelayResults
						const daysEntered =
							dispatchDelayData.dailyDelayResults?.filter(day =>
								day.cities.some(c => c.city_id === cityData.city_id && c.totalClients > 0)
							).length || 0;

						// Use avgDelay from citySummary directly, normalize to percentage (0-100%) for circle progress
						const avgDelayValue = parseFloat(cityData.avgDelay) || 0;
						const normalizedPercentage = maxDelay > 0 ? (avgDelayValue / maxDelay) * 100 : 0;

						return (
							<CircularProgress
								key={cityData.city_id}
								label={cityData.cityName}
								percentage={normalizedPercentage}
								color={getCityColorById(cityData.city_id)}
								daysEntered={daysEntered}
								totalDays={totalDays}
								displayValue={cityData.avgDelay}
								displayUnit='hrs'
							/>
						);
					})}
				</div>
				{/* Stacked Bar Chart */}
				<TransitDelayStackedBarChart data={dispatchDelayData} />
			</Card>
		);
	}

	// Show individual charts for single city or when city filter is not available
	return (
		<Card className='p-6' role='region' aria-label='Transit Delay Metrics'>
			<div className='text-center mb-6'>
				<h3 className='text-lg font-semibold text-gray-900'>Daily Transit Delay Trend</h3>
			</div>
			<div className='space-y-0'>
				{citiesToShow.map((cityData, index) => {
					// Calculate daysEntered from dailyDelayResults
					const daysEntered =
						dispatchDelayData.dailyDelayResults?.filter(day =>
							day.cities.some(c => c.city_id === cityData.city_id && c.totalClients > 0)
						).length || 0;

					// Use avgDelay from citySummary directly, normalize to percentage (0-100%) for circle progress
					const avgDelayValue = parseFloat(cityData.avgDelay) || 0;
					const normalizedPercentage = maxDelay > 0 ? (avgDelayValue / maxDelay) * 100 : 0;

					return (
						<div key={cityData.city_id}>
							<div className='grid grid-cols-[minmax(0,30%)_minmax(0,70%)] gap-6 items-center py-6'>
								{/* Left: Circular Progress - 20-30% width, centered */}
								<div className='flex justify-center'>
									<CircularProgress
										label={cityData.cityName}
										percentage={normalizedPercentage}
										daysEntered={daysEntered}
										totalDays={totalDays}
										displayValue={cityData.avgDelay}
										displayUnit='hrs'
									/>
								</div>
								{/* Right: Daily Bar Chart - 70-80% width */}
								<TransitDelayDailyBarChart data={dispatchDelayData} cityId={cityData.city_id} />
							</div>
							{/* Horizontal divider between cities */}
							{index < citiesToShow.length - 1 && <hr className='border-t border-gray-200 my-0' />}
						</div>
					);
				})}
			</div>
		</Card>
	);
};
