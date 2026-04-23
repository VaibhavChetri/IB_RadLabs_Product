/**
 * Transit Delay Daily Bar Chart Wrapper
 * Transforms Transit Delay API data for generic DailyBarChart component
 */

import React from 'react';
import { DailyBarChart, DailyDataPoint } from '../../../../components/charts';
import { DispatchDelayReportResponse } from '../../../../services/opsDashboardApi';

interface TransitDelayDailyBarChartProps {
	data: DispatchDelayReportResponse | null;
	cityId?: number;
}

const transformTransitDelayData = (
	data: DispatchDelayReportResponse | null,
	cityId?: number
): DailyDataPoint[] => {
	if (!data?.dailyDelayResults) return [];

	return data.dailyDelayResults
		.map(day => {
			const cityData = day.cities?.find(c => !cityId || c.city_id === cityId);
			if (!cityData) return null;

			const date = new Date(day.entry_date);
			return {
				day: date.getDate(),
				month: date.toLocaleDateString('en-US', { month: 'short' }),
				value: parseFloat(cityData.avgDelay || '0'),
				fullDate: day.entry_date,
			};
		})
		.filter((item): item is DailyDataPoint => item !== null);
};

export const TransitDelayDailyBarChart: React.FC<TransitDelayDailyBarChartProps> = ({
	data,
	cityId,
}) => {
	const chartData = transformTransitDelayData(data, cityId);

	// Get max delay for color normalization
	const maxDelay = Math.max(...chartData.map(d => d.value), 0);

	const getBarColor = (avgDelay: number): string => {
		if (maxDelay === 0) return '#22c55e'; // green-500
		const normalized = (avgDelay / maxDelay) * 100;
		if (normalized <= 20) return '#22c55e'; // green-500
		if (normalized <= 40) return '#eab308'; // yellow-500
		if (normalized <= 60) return '#f97316'; // orange-500
		return '#ef4444'; // red-500
	};

	return (
		<DailyBarChart
			data={chartData}
			ariaLabel='Daily Transit Delay Trend'
			yAxisDomain={undefined} // Auto-scale based on data
			tooltipFormatter={(value: number) => [`${value.toFixed(2)} hrs`, 'Avg Delay']}
			labelFormatter={(value: number) => `${value.toFixed(2)}`}
			colorGetter={getBarColor}
		/>
	);
};
