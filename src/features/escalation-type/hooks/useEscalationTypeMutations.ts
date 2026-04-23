/**
 * React Query mutations for Escalation Type (Add/Update)
 * Includes optimistic updates for better UX
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
	EscalationTypeService,
	GetEscalationTypesResponse,
	EscalationType,
} from '../../../services/transitPlanApi';

interface AddEscalationTypeParams {
	name: string;
	status?: number;
}

interface UpdateEscalationTypeParams {
	id: number;
	name: string;
	status?: number;
}

export const useAddEscalationType = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: AddEscalationTypeParams) => {
			return await EscalationTypeService.createEscalationType(data);
		},
		onMutate: async newItem => {
			// Cancel outgoing refetches
			await queryClient.cancelQueries({ queryKey: ['escalationType', 'listing'] });

			// Snapshot previous value
			const previousData = queryClient.getQueriesData<GetEscalationTypesResponse>({
				queryKey: ['escalationType', 'listing'],
			});

			// Optimistically update cache
			queryClient.setQueriesData<GetEscalationTypesResponse>(
				{ queryKey: ['escalationType', 'listing'] },
				old => {
					if (!old) return old;

					// Create optimistic item (will be replaced by server response)
					const optimisticItem: EscalationType = {
						id: Date.now(), // Temporary ID
						name: newItem.name,
						status: newItem.status || 1,
						status_name: newItem.status === 0 ? 'Inactive' : 'Active',
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
			queryClient.invalidateQueries({ queryKey: ['escalationType', 'listing'] });
		},
	});
};

export const useUpdateEscalationType = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: UpdateEscalationTypeParams) => {
			return await EscalationTypeService.updateEscalationType({
				id: data.id,
				name: data.name,
				status: data.status,
			});
		},
		onMutate: async updatedItem => {
			// Cancel outgoing refetches
			await queryClient.cancelQueries({ queryKey: ['escalationType', 'listing'] });

			// Snapshot previous value
			const previousData = queryClient.getQueriesData<GetEscalationTypesResponse>({
				queryKey: ['escalationType', 'listing'],
			});

			// Optimistically update cache
			queryClient.setQueriesData<GetEscalationTypesResponse>(
				{ queryKey: ['escalationType', 'listing'] },
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
										status_name: updatedItem.status === 1 ? 'Active' : updatedItem.status === 0 ? 'Inactive' : item.status_name,
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
			queryClient.invalidateQueries({ queryKey: ['escalationType', 'listing'] });
		},
	});
};
