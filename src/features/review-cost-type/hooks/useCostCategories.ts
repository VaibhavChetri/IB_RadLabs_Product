/**
 * React Query hook for fetching Cost Categories
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { PAndLApiService, GetCostCategoriesResponse } from '../../../services/pAndLApi';

export const useCostCategories = (
	status: number = 1
): UseQueryResult<GetCostCategoriesResponse, Error> => {
	return useQuery({
		queryKey: ['costCategories', status],
		queryFn: async (): Promise<GetCostCategoriesResponse> => {
			return await PAndLApiService.getCostCategories(status);
		},
		staleTime: 10 * 60 * 1000, // 10 minutes - categories don't change often
		gcTime: 30 * 60 * 1000, // 30 minutes cache
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		retry: 2,
	});
};
