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

interface UseOpsDashboardDataParams {
	cityId?: number;
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
	clientId: _clientId,
	startDate,
	endDate,
	enabled = true,
}: UseOpsDashboardDataParams): UseOpsDashboardDataReturn => {
	// Only fetch if we have required params
	const shouldFetch = enabled && !!cityId && !!startDate && !!endDate;

	// KAM EOD Report Query
	const kamEodQuery: UseQueryResult<KAMEodReportResponse, Error> = useQuery({
		queryKey: ['ops-dashboard', 'kam-eod', cityId, startDate, endDate],
		queryFn: async (): Promise<KAMEodReportResponse> => {
			if (!cityId || !startDate || !endDate) {
				throw new Error('Missing required parameters');
			}
			return await OpsDashboardApiService.getKAMEodReport(cityId, startDate, endDate);
		},
		enabled: shouldFetch,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});

	// Transit Plan Summary Query
	const transitPlanQuery: UseQueryResult<TransitPlanDispatchPickupSummaryResponse, Error> =
		useQuery({
			queryKey: ['ops-dashboard', 'transit-plan', cityId, startDate, endDate],
			queryFn: async (): Promise<TransitPlanDispatchPickupSummaryResponse> => {
				if (!cityId || !startDate || !endDate) {
					throw new Error('Missing required parameters');
				}
				return await OpsDashboardApiService.getTransitPlanDispatchPickupSummary(
					cityId,
					startDate,
					endDate
				);
			},
			enabled: shouldFetch,
			staleTime: 5 * 60 * 1000,
			gcTime: 10 * 60 * 1000,
		});

	// QC EOD Report Query
	const qcEodQuery: UseQueryResult<QCEodReportResponse, Error> = useQuery({
		queryKey: ['ops-dashboard', 'qc-eod', cityId, startDate, endDate],
		queryFn: async (): Promise<QCEodReportResponse> => {
			if (!cityId || !startDate || !endDate) {
				throw new Error('Missing required parameters');
			}
			return await OpsDashboardApiService.getQCEodReport(cityId, startDate, endDate);
		},
		enabled: shouldFetch,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});

	// Dispatch Delay Report Query
	const dispatchDelayQuery: UseQueryResult<DispatchDelayReportResponse, Error> = useQuery({
		queryKey: ['ops-dashboard', 'dispatch-delay', cityId, startDate, endDate],
		queryFn: async (): Promise<DispatchDelayReportResponse> => {
			if (!cityId || !startDate || !endDate) {
				throw new Error('Missing required parameters');
			}
			return await OpsDashboardApiService.getDispatchDelayReport(cityId, startDate, endDate);
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
