/**
 * React Query mutations for Review Cost Type (Add/Update)
 * Includes optimistic updates for better UX
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
	ReviewCostingTypeService,
	GetReviewCostingTypeResponse,
	ReviewCostingType,
} from '../../../services/pAndLApi';

interface AddReviewCostTypeParams {
	name: string;
	reviewCategoryTypeId: number;
}

interface UpdateReviewCostTypeParams {
	id: number;
	name: string;
	reviewCategoryTypeId: number;
	status: number;
}

export const useAddReviewCostType = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: AddReviewCostTypeParams) => {
			return await ReviewCostingTypeService.addReviewCostingType(data);
		},
		onMutate: async newItem => {
			// Cancel outgoing refetches
			await queryClient.cancelQueries({ queryKey: ['reviewCostType', 'listing'] });

			// Snapshot previous value
			const previousData = queryClient.getQueriesData<GetReviewCostingTypeResponse>({
				queryKey: ['reviewCostType', 'listing'],
			});

			// Optimistically update cache
			queryClient.setQueriesData<GetReviewCostingTypeResponse>(
				{ queryKey: ['reviewCostType', 'listing'] },
				old => {
					if (!old) return old;

					// Create optimistic item (will be replaced by server response)
					const optimisticItem: ReviewCostingType = {
						id: Date.now(), // Temporary ID
						name: newItem.name,
						reviewCategoryName: '', // Will be filled by server
						status: '1',
					};

					return {
						...old,
						data: [optimisticItem, ...(old.data || [])],
						pagination: old.pagination
							? {
									...old.pagination,
									totalItems: (old.pagination.totalItems || 0) + 1,
								}
							: undefined,
					};
				}
			);

			return { previousData };
		},
		onError: (_err, _newItem, context) => {
			// Rollback on error
			if (context?.previousData) {
				context.previousData.forEach(([queryKey, data]) => {
					queryClient.setQueryData(queryKey, data);
				});
			}
		},
		onSuccess: () => {
			// Invalidate to refetch with server data
			queryClient.invalidateQueries({ queryKey: ['reviewCostType', 'listing'] });
		},
	});
};

export const useUpdateReviewCostType = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: UpdateReviewCostTypeParams) => {
			return await ReviewCostingTypeService.updateReviewCostingType(data);
		},
		onMutate: async updatedItem => {
			// Cancel outgoing refetches
			await queryClient.cancelQueries({ queryKey: ['reviewCostType', 'listing'] });

			// Snapshot previous value
			const previousData = queryClient.getQueriesData<GetReviewCostingTypeResponse>({
				queryKey: ['reviewCostType', 'listing'],
			});

			// Optimistically update cache
			queryClient.setQueriesData<GetReviewCostingTypeResponse>(
				{ queryKey: ['reviewCostType', 'listing'] },
				old => {
					if (!old) return old;

					return {
						...old,
						data: (old.data || []).map(item =>
							item.id === updatedItem.id
								? {
										...item,
										name: updatedItem.name,
										reviewCategoryTypeId: updatedItem.reviewCategoryTypeId,
										status: String(updatedItem.status),
									}
								: item
						),
					};
				}
			);

			return { previousData };
		},
		onError: (_err, _updatedItem, context) => {
			// Rollback on error
			if (context?.previousData) {
				context.previousData.forEach(([queryKey, data]) => {
					queryClient.setQueryData(queryKey, data);
				});
			}
		},
		onSuccess: () => {
			// Invalidate to refetch with server data
			queryClient.invalidateQueries({ queryKey: ['reviewCostType', 'listing'] });
		},
	});
};
