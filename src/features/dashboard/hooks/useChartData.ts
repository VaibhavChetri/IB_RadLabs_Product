import { useMemo } from 'react';
import { ChartDataPoint } from './useDashboardData';
import { DashboardKAMResponse } from '../../../services/inventoryApi';
import { getDayFromDate } from '../utils/dateUtils';

export type ChartFilter = 'monthly' | 'week1' | 'week2' | 'week3' | 'week4' | 'week5';

interface UseChartDataParams {
	data: DashboardKAMResponse | null;
	filter: ChartFilter;
}

export const useChartData = ({ data, filter }: UseChartDataParams): ChartDataPoint[] => {
	return useMemo(() => {
		if (!data?.segResult) return [];

		if (filter === 'monthly') {
			// Use byDate for monthly view
			if (!data.segResult.byDate) return [];

			return Object.entries(data.segResult.byDate)
				.map(([date, value]) => ({
					day: getDayFromDate(date),
					date,
					count: value.totalCount || 0,
				}))
				.sort((a, b) => a.day - b.day);
		}

		// Use byWeek for weekly views
		if (!data.segResult.byWeek) return [];

		const weekNumber = parseInt(filter.replace('week', ''), 10);
		const week = data.segResult.byWeek[weekNumber - 1]; // Array is 0-indexed

		if (!week || !week.days) return [];

		return week.days.map(day => ({
			day: getDayFromDate(day.date),
			date: day.date,
			count: day.totalCount || 0,
		}));
	}, [data, filter]);
};
