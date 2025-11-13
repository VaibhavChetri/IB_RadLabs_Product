/**
 * React Query mutations for Review Category Type (Add/Update)
 * Includes optimistic updates for better UX
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
	ReviewCategoryTypeService,
	GetReviewCategoryTypeResponse,
	ReviewCategoryType,
} from '../../../services/pAndLApi';

interface AddReviewCategoryTypeParams {
	name: string;
}

interface UpdateReviewCategoryTypeParams {
	id: number;
	name: string;
	status: number;
}

export const useAddReviewCategoryType = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: AddReviewCategoryTypeParams) => {
			return await ReviewCategoryTypeService.addReviewCategoryType(data);
		},
		onMutate: async newItem => {
			// Cancel outgoing refetches
			await queryClient.cancelQueries({ queryKey: ['reviewCategoryType', 'listing'] });

			// Snapshot previous value
			const previousData = queryClient.getQueriesData<GetReviewCategoryTypeResponse>({
				queryKey: ['reviewCategoryType', 'listing'],
			});

			// Optimistically update cache
			queryClient.setQueriesData<GetReviewCategoryTypeResponse>(
				{ queryKey: ['reviewCategoryType', 'listing'] },
				old => {
					if (!old) return old;

					// Create optimistic item (will be replaced by server response)
					const optimisticItem: ReviewCategoryType = {
						id: Date.now(), // Temporary ID
						name: newItem.name,
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
			queryClient.invalidateQueries({ queryKey: ['reviewCategoryType', 'listing'] });
		},
	});
};

export const useUpdateReviewCategoryType = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: UpdateReviewCategoryTypeParams) => {
			return await ReviewCategoryTypeService.updateReviewCategoryType(data);
		},
		onMutate: async updatedItem => {
			// Cancel outgoing refetches
			await queryClient.cancelQueries({ queryKey: ['reviewCategoryType', 'listing'] });

			// Snapshot previous value
			const previousData = queryClient.getQueriesData<GetReviewCategoryTypeResponse>({
				queryKey: ['reviewCategoryType', 'listing'],
			});

			// Optimistically update cache
			queryClient.setQueriesData<GetReviewCategoryTypeResponse>(
				{ queryKey: ['reviewCategoryType', 'listing'] },
				old => {
					if (!old) return old;

					return {
						...old,
						data: (old.data || []).map(item =>
							item.id === updatedItem.id
								? {
										...item,
										name: updatedItem.name,
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
			queryClient.invalidateQueries({ queryKey: ['reviewCategoryType', 'listing'] });
		},
	});
};

