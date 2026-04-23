/**
 * React Query hook for fetching QC Report Adherence stats
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { QCRejectionService, GetQCReportAdherenceResponse } from '../../../services/transitPlanApi';

interface UseQCReportAdherenceParams {
	start_date: string;
	end_date: string;
	enabled?: boolean;
}

export const useQCReportAdherence = ({
	start_date,
	end_date,
	enabled = true,
}: UseQCReportAdherenceParams): UseQueryResult<GetQCReportAdherenceResponse, Error> => {
	return useQuery({
		queryKey: ['qcReportAdherence', start_date, end_date],
		queryFn: async (): Promise<GetQCReportAdherenceResponse> => {
			return await QCRejectionService.getQCReportAdherence({
				start_date,
				end_date,
			});
		},
		enabled: enabled && !!start_date && !!end_date,
		staleTime: 0,
		gcTime: 0,
		refetchOnMount: true,
		refetchOnWindowFocus: false,
		retry: 1,
	});
};

