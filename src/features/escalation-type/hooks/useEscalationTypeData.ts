/**
 * React Query hook for fetching Escalation Type listing data
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
	EscalationTypeService,
	GetEscalationTypesResponse,
} from '../../../services/transitPlanApi';
import { useMemo } from 'react';

interface UseEscalationTypeDataParams {
	status?: string;
}

export const useEscalationTypeData = (
	params?: UseEscalationTypeDataParams
): UseQueryResult<GetEscalationTypesResponse, Error> => {
	const queryResult = useQuery({
		queryKey: ['escalationType', 'listing', params?.status || 'all'],
		queryFn: async (): Promise<GetEscalationTypesResponse> => {
			return await EscalationTypeService.getEscalationTypes();
		},
		staleTime: 0, // Always refetch on mount for fresh data
		gcTime: 0, // Don't cache
		refetchOnMount: true,
		refetchOnWindowFocus: false,
		retry: 1,
	});

	// Filter client-side if status filter is provided
	const filteredData = useMemo(() => {
		if (!queryResult.data || !params?.status) {
			return queryResult.data;
		}

		return {
			...queryResult.data,
			data: queryResult.data.data.filter(item => item.status === params.status),
		};
	}, [queryResult.data, params?.status]);

	return {
		...queryResult,
		data: filteredData,
	} as UseQueryResult<GetEscalationTypesResponse, Error>;
};
