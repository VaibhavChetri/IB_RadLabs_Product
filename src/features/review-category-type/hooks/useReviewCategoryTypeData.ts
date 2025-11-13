/**
 * React Query hook for fetching Review Category Type listing data
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { ReviewCategoryTypeService, GetReviewCategoryTypeResponse } from '../../../services/pAndLApi';

interface UseReviewCategoryTypeDataParams {
	page: number;
	limit: number;
	status?: number | string;
	enabled?: boolean;
}

export const useReviewCategoryTypeData = ({
	page,
	limit,
	status,
	enabled = true,
}: UseReviewCategoryTypeDataParams): UseQueryResult<GetReviewCategoryTypeResponse, Error> => {
	return useQuery({
		queryKey: ['reviewCategoryType', 'listing', page, limit, status ?? 'all'],
		queryFn: async (): Promise<GetReviewCategoryTypeResponse> => {
			return await ReviewCategoryTypeService.getReviewCategoryTypes(page, limit, false, status);
		},
		enabled,
		staleTime: 0, // Always refetch on mount for fresh data
		gcTime: 0, // Don't cache
		refetchOnMount: true,
		refetchOnWindowFocus: false,
		retry: 1,
	});
};

