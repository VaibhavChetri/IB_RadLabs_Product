/**
 * React Query mutations for Complaint Type (Add/Update/Delete)
 * Includes optimistic updates for better UX
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
	ComplaintTypeService,
	GetComplaintTypesResponse,
	ComplaintType,
} from '../../../services/complaintTypeApi';

interface AddComplaintTypeParams {
	name: string;
	status?: string; // 'Active' or 'Inactive'
}

interface UpdateComplaintTypeParams {
	id: number;
	name: string;
	status?: string; // 'Active' or 'Inactive'
}

interface DeleteComplaintTypeParams {
	id: number;
}

export const useAddComplaintType = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: AddComplaintTypeParams) => {
			return await ComplaintTypeService.createComplaintType(data);
		},
		onMutate: async newItem => {
			// Cancel outgoing refetches
			await queryClient.cancelQueries({ queryKey: ['complaintType', 'listing'] });

			// Snapshot previous value
			const previousData = queryClient.getQueriesData<GetComplaintTypesResponse>({
				queryKey: ['complaintType', 'listing'],
			});

			// Optimistically update cache
			queryClient.setQueriesData<GetComplaintTypesResponse>(
				{ queryKey: ['complaintType', 'listing'] },
				old => {
					if (!old) return old;

					// Create optimistic item (will be replaced by server response)
					const optimisticItem: ComplaintType = {
						id: Date.now(), // Temporary ID
						name: newItem.name,
						status: newItem.status || 'Active',
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString(),
					};

					return {
						...old,
						data: [optimisticItem, ...(old.data || [])],
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
			queryClient.invalidateQueries({ queryKey: ['complaintType', 'listing'] });
		},
	});
};

export const useUpdateComplaintType = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: UpdateComplaintTypeParams) => {
			return await ComplaintTypeService.updateComplaintType({
				id: data.id,
				name: data.name,
				status: data.status,
			});
		},
		onMutate: async updatedItem => {
			// Cancel outgoing refetches
			await queryClient.cancelQueries({ queryKey: ['complaintType', 'listing'] });

			// Snapshot previous value
			const previousData = queryClient.getQueriesData<GetComplaintTypesResponse>({
				queryKey: ['complaintType', 'listing'],
			});

			// Optimistically update cache
			queryClient.setQueriesData<GetComplaintTypesResponse>(
				{ queryKey: ['complaintType', 'listing'] },
				old => {
					if (!old) return old;

					return {
						...old,
						data: (old.data || []).map(item =>
							item.id === updatedItem.id
								? {
										...item,
										name: updatedItem.name || item.name,
										status: updatedItem.status !== undefined ? updatedItem.status : item.status,
										updated_at: new Date().toISOString(),
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
			queryClient.invalidateQueries({ queryKey: ['complaintType', 'listing'] });
		},
	});
};

export const useDeleteComplaintType = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: DeleteComplaintTypeParams) => {
			return await ComplaintTypeService.deleteComplaintType(data.id);
		},
		onMutate: async deletedItem => {
			// Cancel outgoing refetches
			await queryClient.cancelQueries({ queryKey: ['complaintType', 'listing'] });

			// Snapshot previous value
			const previousData = queryClient.getQueriesData<GetComplaintTypesResponse>({
				queryKey: ['complaintType', 'listing'],
			});

			// Optimistically update cache - remove the deleted item
			queryClient.setQueriesData<GetComplaintTypesResponse>(
				{ queryKey: ['complaintType', 'listing'] },
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
			queryClient.invalidateQueries({ queryKey: ['complaintType', 'listing'] });
		},
	});
};
