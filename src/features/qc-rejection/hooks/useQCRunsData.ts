/**
 * React Query hook for fetching QC Runs data (for Add page)
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { QCRejectionService, GetQCRunsResponse } from '../../../services/transitPlanApi';

interface UseQCRunsDataParams {
	transit_date: string;
	client_id?: number;
	enabled?: boolean;
}

export const useQCRunsData = ({
	transit_date,
	client_id,
	enabled = true,
}: UseQCRunsDataParams): UseQueryResult<GetQCRunsResponse, Error> => {
	return useQuery({
		queryKey: ['qcRuns', 'listing', transit_date, client_id || 'all'],
		queryFn: async (): Promise<GetQCRunsResponse> => {
			return await QCRejectionService.getQCRuns({
				transit_date,
				client_id,
			});
		},
		enabled: enabled && !!transit_date,
		staleTime: 0,
		gcTime: 0,
		refetchOnMount: true,
		refetchOnWindowFocus: false,
		retry: 1,
	});
};

