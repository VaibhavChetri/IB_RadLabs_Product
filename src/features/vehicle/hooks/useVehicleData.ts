/**
 * React Query hook for fetching Vehicle listing data
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { VehicleApiService, GetVehiclesResponse } from '../../../services/vehicleApi';

interface UseVehicleDataParams {
	name?: string;
	driver_name?: string;
	driver_phone?: string;
	status?: number;
	page?: number;
	limit?: number;
	sortOrder?: 'ASC' | 'DESC';
	sortBy?: string;
}

export const useVehicleData = (
	params?: UseVehicleDataParams
): UseQueryResult<GetVehiclesResponse, Error> => {
	const queryResult = useQuery({
		queryKey: ['vehicle', 'listing', params?.name, params?.driver_name, params?.driver_phone, params?.status, params?.page, params?.limit, params?.sortOrder, params?.sortBy],
		queryFn: async (): Promise<GetVehiclesResponse> => {
			const response = await VehicleApiService.getVehicles({
				name: params?.name,
				driver_name: params?.driver_name,
				driver_phone: params?.driver_phone,
				status: params?.status,
				page: params?.page || 1,
				limit: params?.limit || 10,
				sortOrder: params?.sortOrder || 'ASC',
				sortBy: params?.sortBy || 'name',
			});
			return response.data as GetVehiclesResponse;
		},
		staleTime: 0, // Always refetch on mount for fresh data
		gcTime: 0, // Don't cache
		refetchOnMount: true,
		refetchOnWindowFocus: false,
		retry: 1,
	});

	return queryResult as UseQueryResult<GetVehiclesResponse, Error>;
};










