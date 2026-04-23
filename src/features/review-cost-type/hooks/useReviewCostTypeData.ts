/**
 * React Query hook for fetching Review Cost Type listing data
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { ReviewCostingTypeService, GetReviewCostingTypeResponse } from '../../../services/pAndLApi';

interface UseReviewCostTypeDataParams {
	page: number;
	limit: number;
	costCategoryId?: number;
	status?: number;
	enabled?: boolean;
}

export const useReviewCostTypeData = ({
	page,
	limit,
	costCategoryId,
	status,
	enabled = true,
}: UseReviewCostTypeDataParams): UseQueryResult<GetReviewCostingTypeResponse, Error> => {
	return useQuery({
		queryKey: ['reviewCostType', 'listing', page, limit, costCategoryId || 'all', status ?? 'all'],
		queryFn: async (): Promise<GetReviewCostingTypeResponse> => {
			return await ReviewCostingTypeService.getReviewCostingType(
				page,
				limit,
				false,
				costCategoryId,
				status
			);
		},
		enabled,
		staleTime: 0, // Always refetch on mount for fresh data
		gcTime: 0, // Don't cache
		refetchOnMount: true,
		refetchOnWindowFocus: false,
		retry: 1,
	});
};
