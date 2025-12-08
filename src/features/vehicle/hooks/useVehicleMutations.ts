/**
 * React Query mutations for Vehicle (Add/Update/Delete)
 * Includes optimistic updates for better UX
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
	VehicleApiService,
	GetVehiclesResponse,
	Vehicle,
	AddVehicleRequest,
	UpdateVehicleRequest,
	DeleteVehicleRequest,
} from '../../../services/vehicleApi';

export const useAddVehicle = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: AddVehicleRequest) => {
			return await VehicleApiService.addVehicle(data);
		},
		onSuccess: () => {
			// Invalidate to refetch with server data
			queryClient.invalidateQueries({ queryKey: ['vehicle', 'listing'] });
		},
	});
};

export const useUpdateVehicle = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: UpdateVehicleRequest) => {
			return await VehicleApiService.updateVehicle(data);
		},
		onSuccess: () => {
			// Invalidate to refetch with server data
			queryClient.invalidateQueries({ queryKey: ['vehicle', 'listing'] });
		},
	});
};

export const useDeleteVehicle = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: DeleteVehicleRequest) => {
			return await VehicleApiService.deleteVehicle(data);
		},
		onMutate: async deletedItem => {
			// Cancel outgoing refetches
			await queryClient.cancelQueries({ queryKey: ['vehicle', 'listing'] });

			// Snapshot previous value
			const previousData = queryClient.getQueriesData<GetVehiclesResponse>({
				queryKey: ['vehicle', 'listing'],
			});

			// Optimistically update cache
			queryClient.setQueriesData<GetVehiclesResponse>(
				{ queryKey: ['vehicle', 'listing'] },
				old => {
					if (!old) return old;

					return {
						...old,
						result: (old.result || []).filter(item => item.id !== deletedItem.id),
						pagination: {
							...old.pagination,
							totalRecords: old.pagination.totalRecords - 1,
						},
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
			queryClient.invalidateQueries({ queryKey: ['vehicle', 'listing'] });
		},
	});
};

