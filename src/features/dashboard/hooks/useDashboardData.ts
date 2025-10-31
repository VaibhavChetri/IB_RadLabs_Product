import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { InventoryApiService, DashboardKAMResponse } from '../../../services/inventoryApi';
import { getMonthDateRange } from '../utils/dateUtils';
import { transformToStats, transformToMonthlyChartData } from '../utils/dataTransformers';

export interface DashboardStats {
	totalClientSKUCount: number;
	totalClientAvgSKUCount: number;
	totalPlasticSavedKg: number;
	water: number;
	ghc: number;
}

export interface ChartDataPoint {
	day: number;
	date: string;
	count: number;
}

export interface DateSegment {
	totalCount: number;
	day: string;
}

export interface WeekDay {
	date: string;
	totalCount: number;
}

export interface WeekSegment {
	weekNumber: number;
	days: WeekDay[];
}

// Re-export DashboardKAMResponse as DashboardResponse for backwards compatibility
export type DashboardResponse = DashboardKAMResponse;

interface UseDashboardDataParams {
	locationId: string | null;
	clientId: string;
	month: string;
}

interface UseDashboardDataReturn {
	stats: DashboardStats | null;
	chartData: ChartDataPoint[];
	data: DashboardKAMResponse | null; // Full response for chart component
	loading: boolean;
	error: string | null;
	refetch: () => void;
}

export const useDashboardData = ({
	locationId,
	clientId,
	month,
}: UseDashboardDataParams): UseDashboardDataReturn => {
	const [data, setData] = useState<DashboardKAMResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);

	// Calculate date range from month
	const dateRange = useMemo(() => {
		if (!month) return null;
		return getMonthDateRange(parseInt(month, 10));
	}, [month]);

	// Fetch data function with proper memoization and cancellation
	const fetchData = useCallback(async () => {
		if (!locationId || !month || !dateRange) {
			setData(null);
			return;
		}

		// Cancel previous request if still pending
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

		// Create new AbortController for this request
		const abortController = new AbortController();
		abortControllerRef.current = abortController;

		setLoading(true);
		setError(null);

		try {
			const response = await InventoryApiService.getSentCountKAM(
				{
					location_id: parseInt(locationId, 10),
					client_id: clientId === 'all' ? 'All' : clientId,
					start_date: dateRange.start_date,
					end_date: dateRange.end_date,
				},
				abortController.signal
			);

			// Check if request was aborted
			if (abortController.signal.aborted) {
				return;
			}

			if (response.status_code === 200) {
				setData(response);
			} else {
				setError('Failed to load dashboard data');
			}
		} catch (err) {
			// Ignore abort errors
			if (err instanceof Error && err.name === 'AbortError') {
				return;
			}

			// Check if request was aborted after error
			if (abortController.signal.aborted) {
				return;
			}

			console.error('Error fetching dashboard data:', err);
			setError('Failed to load dashboard data');
		} finally {
			// Only update loading state if request wasn't aborted
			if (!abortController.signal.aborted) {
				setLoading(false);
			}
		}
	}, [locationId, clientId, month, dateRange]);

	// Fetch data when dependencies change
	useEffect(() => {
		fetchData();

		// Cleanup: abort request on unmount or dependency change
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, [fetchData]);

	// Extract stats using utility function
	const stats: DashboardStats | null = useMemo(() => {
		return transformToStats(data);
	}, [data]);

	// Default chart data (empty) using utility function
	const chartData: ChartDataPoint[] = useMemo(() => {
		return transformToMonthlyChartData(data);
	}, [data]);

	return {
		stats,
		chartData,
		data,
		loading,
		error,
		refetch: useCallback(() => {
			return fetchData();
		}, [fetchData]),
	};
};
