/**
 * Sent Transit Daily Bar Chart Wrapper
 * Transforms Sent Transit API data for generic DailyBarChart component
 */

import React from 'react';
import { DailyBarChart, DailyDataPoint } from '../../../../components/charts';
import { TransitPlanDispatchPickupSummaryResponse } from '../../../../services/opsDashboardApi';

interface SentTransitDailyBarChartProps {
	data: TransitPlanDispatchPickupSummaryResponse | null;
	cityId?: number;
}

const transformSentTransitData = (
	data: TransitPlanDispatchPickupSummaryResponse | null,
	cityId?: number
): DailyDataPoint[] => {
	if (!data?.sent?.dailyEntryStatus) return [];

	return data.sent.dailyEntryStatus
		.map(day => {
			const cityData = day.cities?.find(c => !cityId || c.city_id === cityId);
			if (!cityData) return null;

			const date = new Date(day.entry_date);
			return {
				day: date.getDate(),
				month: date.toLocaleDateString('en-US', { month: 'short' }),
				value: parseFloat(cityData.percentage || '0'),
				fullDate: day.entry_date,
			};
		})
		.filter((item): item is DailyDataPoint => item !== null);
};

export const SentTransitDailyBarChart: React.FC<SentTransitDailyBarChartProps> = ({
	data,
	cityId,
}) => {
	const chartData = transformSentTransitData(data, cityId);

	return (
		<DailyBarChart
			data={chartData}
			ariaLabel='Daily Sent Transit Plan Trend'
			tooltipFormatter={(value: number) => [`${value.toFixed(1)}%`, 'Percentage']}
			labelFormatter={(value: number) => {
				const formatted = value.toFixed(1);
				return formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted;
			}}
		/>
	);
};
