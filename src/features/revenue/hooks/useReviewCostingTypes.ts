import { useQuery } from '@tanstack/react-query';
import { ReviewCostingTypeService, ReviewCostingType } from '../../../services/pAndLApi';

interface UseReviewCostingTypesReturn {
	data: ReviewCostingType[] | undefined;
	isLoading: boolean;
	error: Error | null;
}

/**
 * Hook to fetch review costing types
 */
export const useReviewCostingTypes = (): UseReviewCostingTypesReturn => {
	const { data, isLoading, error } = useQuery({
		queryKey: ['reviewCostingTypes'],
		queryFn: async () => {
			const response = await ReviewCostingTypeService.getReviewCostingType(1, 22, true);
			return response.data;
		},
		staleTime: 5 * 60 * 1000, // 5 minutes
		refetchOnMount: false,
		refetchOnWindowFocus: false,
	});

	return {
		data,
		isLoading,
		error: error as Error | null,
	};
};

