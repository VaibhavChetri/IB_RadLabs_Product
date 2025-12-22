/**
 * React Query mutations for Container Type (Add/Update/Delete)
 * Includes optimistic updates for better UX
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
	ContainerApiService,
	GetContainerTypesResponse,
	AddContainerTypeRequest,
	UpdateContainerTypeRequest,
	DeleteContainerTypeRequest,
} from '../../../services/containerApi';

export const useAddContainerType = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: AddContainerTypeRequest) => {
			return await ContainerApiService.addContainerType(data);
		},
		onSuccess: () => {
			// Invalidate to refetch with server data
			queryClient.invalidateQueries({ queryKey: ['container', 'listing'] });
		},
	});
};

export const useUpdateContainerType = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: UpdateContainerTypeRequest) => {
			return await ContainerApiService.updateContainerType(data);
		},
		onSuccess: () => {
			// Invalidate to refetch with server data
			queryClient.invalidateQueries({ queryKey: ['container', 'listing'] });
		},
	});
};

export const useDeleteContainerType = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: DeleteContainerTypeRequest) => {
			return await ContainerApiService.deleteContainerType(data);
		},
		onMutate: async deletedItem => {
			// Cancel outgoing refetches
			await queryClient.cancelQueries({ queryKey: ['container', 'listing'] });

			// Snapshot previous value
			const previousData = queryClient.getQueriesData<GetContainerTypesResponse>({
				queryKey: ['container', 'listing'],
			});

			// Optimistically update cache
			queryClient.setQueriesData<GetContainerTypesResponse>(
				{ queryKey: ['container', 'listing'] },
				old => {
					if (!old) return old;

					return {
						...old,
						data: (old.data || []).filter(item => item.id !== deletedItem.id),
					};
				}
			);

			return { previousData };
		},
		onError: (_err, _deletedItem, context) => {
			// Rollback on error
			if (context?.previousData) {
				context.previousData.forEach(([queryKey, data]) => {
					queryClient.setQueryData(queryKey, data);
				});
			}
		},
		onSuccess: () => {
			// Invalidate to refetch with server data
			queryClient.invalidateQueries({ queryKey: ['container', 'listing'] });
		},
	});
};










