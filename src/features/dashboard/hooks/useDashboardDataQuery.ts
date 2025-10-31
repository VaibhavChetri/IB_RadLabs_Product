/**
 * React Query-based Dashboard Data Hook
 * Provides caching, automatic refetching, and error handling
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { InventoryApiService, DashboardKAMResponse } from '../../../services/inventoryApi';
import { getMonthDateRange } from '../utils/dateUtils';
import { transformToStats, transformToMonthlyChartData } from '../utils/dataTransformers';
import { DashboardStats, ChartDataPoint } from './useDashboardData';

interface UseDashboardDataQueryParams {
	locationId: string | null;
	clientId: string;
	month: string;
	enabled?: boolean;
}

interface UseDashboardDataQueryReturn {
	stats: DashboardStats | null;
	chartData: ChartDataPoint[];
	data: DashboardKAMResponse | null;
	loading: boolean;
	error: string | null;
	refetch: () => void;
	isError: boolean;
	isFetching: boolean;
}

/**
 * React Query hook for fetching dashboard data
 * Automatically handles caching, retries, and background updates
 */
export const useDashboardDataQuery = ({
	locationId,
	clientId,
	month,
	enabled = true,
}: UseDashboardDataQueryParams): UseDashboardDataQueryReturn => {
	// Calculate date range from month
	const dateRange = month ? getMonthDateRange(parseInt(month, 10)) : null;

	// React Query hook with proper error handling and retry logic
	const queryResult: UseQueryResult<DashboardKAMResponse, Error> = useQuery({
		queryKey: ['dashboard', 'kam', locationId, clientId, month, dateRange],
		queryFn: async (): Promise<DashboardKAMResponse> => {
			if (!locationId || !month || !dateRange) {
				throw new Error('Missing required parameters');
			}

			const response = await InventoryApiService.getSentCountKAM({
				location_id: parseInt(locationId, 10),
				client_id: clientId === 'all' ? 'All' : clientId,
				start_date: dateRange.start_date,
				end_date: dateRange.end_date,
			});

			if (response.status_code !== 200) {
				throw new Error('Failed to load dashboard data');
			}

			return response;
		},
		enabled: enabled && !!locationId && !!month && !!dateRange,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
	});

	// Transform data using utility functions
	const stats = transformToStats(queryResult.data ?? null);
	const chartData = transformToMonthlyChartData(queryResult.data ?? null);

	return {
		stats,
		chartData,
		data: queryResult.data ?? null,
		loading: queryResult.isLoading || queryResult.isFetching,
		error: queryResult.error?.message ?? null,
		refetch: () => {
			queryResult.refetch();
		},
		isError: queryResult.isError,
		isFetching: queryResult.isFetching,
	};
};
