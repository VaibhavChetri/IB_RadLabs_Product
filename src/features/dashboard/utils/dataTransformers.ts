/**
 * Data Transformation Utilities
 * Separates business logic from presentation components
 */

import {
	DashboardResponse,
	DashboardStats,
	ChartDataPoint,
	DateSegment,
} from '../hooks/useDashboardData';

/**
 * Transform API response to DashboardStats
 * Extracts summary statistics from dashboard response
 */
export const transformToStats = (data: DashboardResponse | null): DashboardStats | null => {
	if (!data) return null;

	return {
		totalClientSKUCount: data.summaryCount?.totalSummary?.totalClientSKUCount || 0,
		totalClientAvgSKUCount: data.summaryCount?.totalSummary?.totalClientAvgSKUCount || 0,
		totalPlasticSavedKg: data.total?.totalPlasticSavedKg || 0,
		water: data.total?.water || 0,
		ghc: data.total?.ghc || 0,
	};
};

/**
 * Transform API response to chart data points for monthly view
 * Converts byDate object to sorted array of chart points
 */
export const transformToMonthlyChartData = (data: DashboardResponse | null): ChartDataPoint[] => {
	if (!data?.segResult?.byDate) return [];

	return Object.entries(data.segResult.byDate)
		.map(([date, value]) => {
			const dateSegment = value as DateSegment;
			return {
				day: parseInt(date.split('-')[2], 10),
				date,
				count: dateSegment.totalCount || 0,
			};
		})
		.sort((a, b) => a.day - b.day);
};

/**
 * Calculate Y-axis ticks based on data range
 * Generates evenly spaced ticks for better readability
 */
export const calculateYAxisTicks = (
	chartData: ChartDataPoint[],
	minTicks = 8,
	maxTicks = 10,
	tickRounding = 1000
): number[] => {
	if (chartData.length === 0) return [];

	const maxCount = Math.max(...chartData.map(d => d.count));
	const minCount = Math.min(...chartData.map(d => d.count));

	// Round up to nearest thousand for max, round down for min
	const maxValue = Math.ceil(maxCount / tickRounding) * tickRounding;
	const minValue = Math.floor(minCount / tickRounding) * tickRounding;

	// Calculate step size to get desired number of ticks
	const range = maxValue - minValue;
	const idealStep = range / (minTicks + (maxTicks - minTicks) / 2);
	const step = Math.ceil(idealStep / tickRounding) * tickRounding;

	// Generate ticks
	const ticks: number[] = [];
	for (let i = minValue; i <= maxValue; i += step) {
		ticks.push(i);
	}

	// Ensure max value is included
	if (ticks.length > 0 && ticks[ticks.length - 1] < maxValue) {
		ticks.push(maxValue);
	}

	return ticks;
};
