/**
 * Transit Delay Stacked Bar Chart Wrapper
 * Transforms Transit Delay API data for generic StackedBarChart component
 */

import React, { useMemo } from 'react';
import { StackedBarChart, StackedChartDataPoint } from '../../../../components/charts';
import { DispatchDelayReportResponse } from '../../../../services/opsDashboardApi';
import { getCityColorById } from '../../utils/cityColorUtils';

interface TransitDelayStackedBarChartProps {
	data: DispatchDelayReportResponse | null;
}

const transformTransitDelayData = (
	data: DispatchDelayReportResponse | null
): {
	chartData: StackedChartDataPoint[];
	cities: Array<{ id: number; name: string; color: string }>;
} => {
	if (!data?.dailyDelayResults || !data?.citySummary) {
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
	const chartData: StackedChartDataPoint[] = data.dailyDelayResults.map(day => {
		const date = new Date(day.entry_date);
		const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
		const month = date.toLocaleDateString('en-US', { month: 'short' });

		const dataPoint: StackedChartDataPoint = {
			date: day.entry_date,
			day: date.getDate(),
			month,
			dayOfWeek,
		};

		// Add each city's avgDelay value (in hours) and metadata
		cities.forEach(city => {
			const cityData = day.cities?.find(c => c.city_id === city.id);
			if (cityData) {
				const avgDelayValue = parseFloat(cityData.avgDelay) || 0;
				dataPoint[city.id.toString()] = avgDelayValue;
				// Add metadata for tooltip
				dataPoint[`${city.id}_metadata`] = {
					totalClients: cityData.totalClients,
					enteredClients: cityData.totalClients, // Total clients with transit data
					percentage: `${avgDelayValue.toFixed(1)} hrs avg delay`,
				};
			} else {
				dataPoint[city.id.toString()] = 0;
			}
		});

		return dataPoint;
	});

	return { chartData, cities };
};

export const TransitDelayStackedBarChart: React.FC<TransitDelayStackedBarChartProps> = ({
	data,
}) => {
	const { chartData, cities } = useMemo(() => transformTransitDelayData(data), [data]);

	return (
		<StackedBarChart
			data={chartData}
			cities={cities}
			ariaLabel='Transit Delay - Stacked Bar Chart'
			yAxisFormatter={(val: number) => `${val.toFixed(1)} hrs`}
			yAxisMax={undefined}
		/>
	);
};
