/**
 * Ops Dashboard Data Hook
 * Fetches all 5 API endpoints using React Query
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
	OpsDashboardApiService,
	KAMEodReportResponse,
	TransitPlanDispatchPickupSummaryResponse,
	QCEodReportResponse,
	DispatchDelayReportResponse,
	ShiftStatusReportResponse,
} from '../../../services/opsDashboardApi';
import { apiService } from '../../../services/api';

interface UseOpsDashboardDataParams {
	cityId?: number;
	selectedCityId?: string; // Selected city from filter ("all" or city ID)
	clientId: string;
	startDate: string;
	endDate: string;
	enabled?: boolean;
}

interface UseOpsDashboardDataReturn {
	kamEodData: KAMEodReportResponse | null;
	transitPlanData: TransitPlanDispatchPickupSummaryResponse | null;
	qcEodData: QCEodReportResponse | null;
	dispatchDelayData: DispatchDelayReportResponse | null;
	shiftStatusData: ShiftStatusReportResponse | null;
	loading: boolean;
	error: string | null;
	refetch: () => void;
}

/**
 * React Query hook for fetching Ops Dashboard data
 * Fetches all 5 APIs in parallel
 */
export const useOpsDashboardData = ({
	cityId,
	selectedCityId,
	clientId: _clientId,
	startDate,
	endDate,
	enabled = true,
}: UseOpsDashboardDataParams): UseOpsDashboardDataReturn => {
	// Determine which city_id to use in API calls
	// If selectedCityId is "all", don't pass city_ids (undefined)
	// If selectedCityId is a number, use that
	// Otherwise, fallback to user's cityId
	const apiCityId: number | undefined =
		selectedCityId && selectedCityId !== 'all'
			? parseInt(selectedCityId, 10)
			: selectedCityId === 'all'
				? undefined
				: cityId;

	// Only fetch if we have required params (cityId may be undefined if "All" is selected)
	const shouldFetch = enabled && !!startDate && !!endDate;

	// KAM EOD Report Query - only include city_ids if apiCityId is defined
	const kamEodQuery: UseQueryResult<KAMEodReportResponse, Error> = useQuery({
		queryKey: ['ops-dashboard', 'kam-eod', apiCityId, startDate, endDate],
		queryFn: async (): Promise<KAMEodReportResponse> => {
			if (!startDate || !endDate) {
				throw new Error('Missing required parameters');
			}
			// Only pass city_ids if apiCityId is defined (not "All")
			if (apiCityId !== undefined) {
				return await OpsDashboardApiService.getKAMEodReport(apiCityId, startDate, endDate);
			}
			// If "All" selected, pass empty or don't include city_ids
			const searchParams = new URLSearchParams();
			searchParams.set('start_date', startDate);
			searchParams.set('end_date', endDate);
			return apiService.get(
				`/inventory/getKAMEodReport?${searchParams.toString()}`
			) as unknown as Promise<KAMEodReportResponse>;
		},
		enabled: shouldFetch,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});

	// Transit Plan Summary Query
	const transitPlanQuery: UseQueryResult<TransitPlanDispatchPickupSummaryResponse, Error> =
		useQuery({
			queryKey: ['ops-dashboard', 'transit-plan', apiCityId, startDate, endDate],
			queryFn: async (): Promise<TransitPlanDispatchPickupSummaryResponse> => {
				if (!startDate || !endDate) {
					throw new Error('Missing required parameters');
				}
				if (apiCityId !== undefined) {
					return await OpsDashboardApiService.getTransitPlanDispatchPickupSummary(
						apiCityId,
						startDate,
						endDate
					);
				}
				const searchParams = new URLSearchParams();
				searchParams.set('start_date', startDate);
				searchParams.set('end_date', endDate);
				return apiService.get(
					`/transit-plan/getTransitPlanDispatchPickupSummary?${searchParams.toString()}`
				) as unknown as Promise<TransitPlanDispatchPickupSummaryResponse>;
			},
			enabled: shouldFetch,
			staleTime: 5 * 60 * 1000,
			gcTime: 10 * 60 * 1000,
		});

	// QC EOD Report Query
	const qcEodQuery: UseQueryResult<QCEodReportResponse, Error> = useQuery({
		queryKey: ['ops-dashboard', 'qc-eod', apiCityId, startDate, endDate],
		queryFn: async (): Promise<QCEodReportResponse> => {
			if (!startDate || !endDate) {
				throw new Error('Missing required parameters');
			}
			if (apiCityId !== undefined) {
				return await OpsDashboardApiService.getQCEodReport(apiCityId, startDate, endDate);
			}
			const searchParams = new URLSearchParams();
			searchParams.set('start_date', startDate);
			searchParams.set('end_date', endDate);
			return apiService.get(
				`/inventory/getQCEodReport?${searchParams.toString()}`
			) as unknown as Promise<QCEodReportResponse>;
		},
		enabled: shouldFetch,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});

	// Dispatch Delay Report Query
	const dispatchDelayQuery: UseQueryResult<DispatchDelayReportResponse, Error> = useQuery({
		queryKey: ['ops-dashboard', 'dispatch-delay', apiCityId, startDate, endDate],
		queryFn: async (): Promise<DispatchDelayReportResponse> => {
			if (!startDate || !endDate) {
				throw new Error('Missing required parameters');
			}
			if (apiCityId !== undefined) {
				return await OpsDashboardApiService.getDispatchDelayReport(apiCityId, startDate, endDate);
			}
			const searchParams = new URLSearchParams();
			searchParams.set('start_date', startDate);
			searchParams.set('end_date', endDate);
			return apiService.get(
				`/inventory/getDispatchDelayReport?${searchParams.toString()}`
			) as unknown as Promise<DispatchDelayReportResponse>;
		},
		enabled: shouldFetch,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});

	// Shift Status Report Query (no cityId needed)
	const shiftStatusQuery: UseQueryResult<ShiftStatusReportResponse, Error> = useQuery({
		queryKey: ['ops-dashboard', 'shift-status', startDate, endDate],
		queryFn: async (): Promise<ShiftStatusReportResponse> => {
			if (!startDate || !endDate) {
				throw new Error('Missing required parameters');
			}
			return await OpsDashboardApiService.getShiftStatusReport(startDate, endDate);
		},
		enabled: enabled && !!startDate && !!endDate,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});

	// Aggregate loading and error states
	const loading =
		kamEodQuery.isLoading ||
		transitPlanQuery.isLoading ||
		qcEodQuery.isLoading ||
		dispatchDelayQuery.isLoading ||
		shiftStatusQuery.isLoading ||
		kamEodQuery.isFetching ||
		transitPlanQuery.isFetching ||
		qcEodQuery.isFetching ||
		dispatchDelayQuery.isFetching ||
		shiftStatusQuery.isFetching;

	const error =
		kamEodQuery.error?.message ||
		transitPlanQuery.error?.message ||
		qcEodQuery.error?.message ||
		dispatchDelayQuery.error?.message ||
		shiftStatusQuery.error?.message ||
		null;

	const refetch = () => {
		kamEodQuery.refetch();
		transitPlanQuery.refetch();
		qcEodQuery.refetch();
		dispatchDelayQuery.refetch();
		shiftStatusQuery.refetch();
	};

	return {
		kamEodData: kamEodQuery.data ?? null,
		transitPlanData: transitPlanQuery.data ?? null,
		qcEodData: qcEodQuery.data ?? null,
		dispatchDelayData: dispatchDelayQuery.data ?? null,
		shiftStatusData: shiftStatusQuery.data ?? null,
		loading,
		error,
		refetch,
	};
};
