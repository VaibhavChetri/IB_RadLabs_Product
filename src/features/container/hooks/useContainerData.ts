/**
 * React Query hook for fetching Container Type listing data
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { ContainerApiService, GetContainerTypesResponse } from '../../../services/containerApi';

interface UseContainerDataParams {
	facilityId?: number;
	all?: boolean;
}

export const useContainerData = (
	params?: UseContainerDataParams
): UseQueryResult<GetContainerTypesResponse, Error> => {
	const queryResult = useQuery({
		queryKey: ['container', 'listing', params?.facilityId, params?.all],
		queryFn: async (): Promise<GetContainerTypesResponse> => {
			const response = await ContainerApiService.getContainerTypes({
				facilityId: params?.facilityId,
				all: params?.all,
			});
			return response.data as GetContainerTypesResponse;
		},
		staleTime: 0, // Always refetch on mount for fresh data
		gcTime: 0, // Don't cache
		refetchOnMount: true,
		refetchOnWindowFocus: false,
		retry: 1,
	});

	return queryResult as UseQueryResult<GetContainerTypesResponse, Error>;
};
