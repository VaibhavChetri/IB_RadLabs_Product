/**
 * KAM Stacked Bar Chart Wrapper
 * Transforms KAM API data for generic StackedBarChart component
 */

import React, { useMemo } from 'react';
import { StackedBarChart, StackedChartDataPoint } from '../../../../components/charts';
import { KAMEodReportResponse } from '../../../../services/opsDashboardApi';
import { getCityColorById } from '../../utils/cityColorUtils';

interface KAMStackedBarChartProps {
	data: KAMEodReportResponse | null;
	ariaLabel?: string;
}

const transformKAMData = (
	data: KAMEodReportResponse | null
): {
	chartData: StackedChartDataPoint[];
	cities: Array<{ id: number; name: string; color: string }>;
} => {
	if (!data?.dailyEntryStatus || !data?.citySummary) {
		return { chartData: [], cities: [] };
	}

	// Sort cities by city_id (ascending)
	const sortedCities = [...data.citySummary].sort((a, b) => a.city_id - b.city_id);

	// Get all cities with their colors based on city_id
	const cities = sortedCities.map(city => ({
		id: city.city_id,
		name: city.cityName,
		color: getCityColorById(city.city_id),
	}));

	// Group data by date
	const chartData: StackedChartDataPoint[] = data.dailyEntryStatus.map(day => {
		const date = new Date(day.entry_date);
		const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
		const month = date.toLocaleDateString('en-US', { month: 'short' });

		const dataPoint: StackedChartDataPoint = {
			date: day.entry_date,
			day: date.getDate(),
			month,
			dayOfWeek,
		};

		// Add each city's enteredClients (value), percentage, and metadata
		cities.forEach(city => {
			const cityData = day.cities?.find(c => c.city_id === city.id);
			if (cityData) {
				dataPoint[city.id.toString()] = cityData.enteredClients || 0;
				dataPoint[`${city.id}_percentage`] = parseFloat(cityData.percentage || '0');
				// Add metadata for tooltip
				dataPoint[`${city.id}_metadata`] = {
					totalClients: cityData.totalClients,
					enteredClients: cityData.enteredClients,
					percentage: cityData.percentage,
				};
			} else {
				dataPoint[city.id.toString()] = 0;
				dataPoint[`${city.id}_percentage`] = 0;
			}
		});

		return dataPoint;
	});

	return { chartData, cities };
};

export const KAMStackedBarChart: React.FC<KAMStackedBarChartProps> = ({ data, ariaLabel }) => {
	const { chartData, cities } = useMemo(() => transformKAMData(data), [data]);

	return <StackedBarChart data={chartData} cities={cities} ariaLabel={ariaLabel} />;
};
