import { useQuery } from '@tanstack/react-query';
import { ProjectedCostingService, OnSiteManPowerClient } from '../../../services/pAndLApi';

interface UseOnSiteManPowerClientsReturn {
	data: OnSiteManPowerClient[] | undefined;
	isLoading: boolean;
	error: Error | null;
}

/**
 * Hook to fetch on-site manpower clients
 */
export const useOnSiteManPowerClients = (
	facilityId: number | null,
	enabled: boolean = true
): UseOnSiteManPowerClientsReturn => {
	const { data, isLoading, error } = useQuery({
		queryKey: ['onSiteManPowerClients', facilityId],
		queryFn: async () => {
			if (!facilityId) return null;
			const response = await ProjectedCostingService.getOnSiteManPowerClients(facilityId);
			return response.data || [];
		},
		enabled: enabled && !!facilityId,
		staleTime: 5 * 60 * 1000, // 5 minutes
		refetchOnMount: false,
		refetchOnWindowFocus: false,
	});

	return {
		data: data || undefined,
		isLoading,
		error: error as Error | null,
	};
};

