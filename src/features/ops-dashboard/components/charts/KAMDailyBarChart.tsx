/**
 * KAM Daily Bar Chart Wrapper
 * Transforms KAM API data for generic DailyBarChart component
 */

import React from 'react';
import { DailyBarChart, DailyDataPoint } from '../../../../components/charts';
import { KAMEodReportResponse } from '../../../../services/opsDashboardApi';

interface KAMDailyBarChartProps {
	data: KAMEodReportResponse | null;
	cityId?: number;
}

const transformKAMData = (data: KAMEodReportResponse | null, cityId?: number): DailyDataPoint[] => {
	if (!data?.dailyEntryStatus) return [];

	return data.dailyEntryStatus
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

export const KAMDailyBarChart: React.FC<KAMDailyBarChartProps> = ({ data, cityId }) => {
	const chartData = transformKAMData(data, cityId);

	return (
		<DailyBarChart
			data={chartData}
			ariaLabel='Daily KAM Entry Trend'
			tooltipFormatter={(value: number) => [`${value.toFixed(0)}%`, 'Entry %']}
			labelFormatter={(value: number) => `${value.toFixed(0)}%`}
		/>
	);
};
