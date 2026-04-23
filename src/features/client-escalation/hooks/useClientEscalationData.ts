/**
 * React Query hook for fetching Client Escalation listing data
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
	ClientEscalationService,
	GetClientEscalationsResponse,
} from '../../../services/transitPlanApi';

interface UseClientEscalationDataParams {
	startDate?: string;
	endDate?: string;
	facility_id?: number;
	page?: number;
	limit?: number;
}

export const useClientEscalationData = (
	params?: UseClientEscalationDataParams
): UseQueryResult<GetClientEscalationsResponse, Error> => {
	const queryResult = useQuery({
		queryKey: ['clientEscalation', 'listing', params?.startDate, params?.endDate, params?.facility_id, params?.page, params?.limit],
		queryFn: async (): Promise<GetClientEscalationsResponse> => {
			return await ClientEscalationService.getClientEscalations({
				startDate: params?.startDate,
				endDate: params?.endDate,
				facility_id: params?.facility_id,
				page: params?.page,
				limit: params?.limit,
			});
		},
		enabled: !!params?.startDate && !!params?.endDate, // Only fetch when dates are provided
		staleTime: 0,
		gcTime: 0,
		refetchOnMount: true,
		refetchOnWindowFocus: false,
		retry: 1,
	});

	return queryResult as UseQueryResult<GetClientEscalationsResponse, Error>;
};


