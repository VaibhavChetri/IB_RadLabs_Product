/**
 * React Query hook for fetching QC Rejection listing data
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { QCRejectionService, GetQCRejectionsResponse } from '../../../services/transitPlanApi';

interface UseQCRejectionDataParams {
	transit_date: string;
	client_id?: number;
	enabled?: boolean;
}

export const useQCRejectionData = ({
	transit_date,
	client_id,
	enabled = true,
}: UseQCRejectionDataParams): UseQueryResult<GetQCRejectionsResponse, Error> => {
	return useQuery({
		queryKey: ['qcRejection', 'listing', transit_date, client_id || 'all'],
		queryFn: async (): Promise<GetQCRejectionsResponse> => {
			return await QCRejectionService.getQCRejections({
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

