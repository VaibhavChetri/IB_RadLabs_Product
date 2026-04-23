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
			console.log('🔍 useOnSiteManPowerClients - Fetching for facilityId:', facilityId);
			const response = await ProjectedCostingService.getOnSiteManPowerClients(facilityId);
			console.log('🔍 useOnSiteManPowerClients - API response:', response);
			// Handle different response structures
			const clients = (response as any)?.data || (response as any)?.result || response.data || [];
			console.log('🔍 useOnSiteManPowerClients - Extracted clients:', clients);
			return Array.isArray(clients) ? clients : [];
		},
		enabled: enabled && !!facilityId,
		staleTime: 0, // Always consider stale to ensure fresh data
		refetchOnMount: true, // Always refetch on mount
		refetchOnWindowFocus: false,
		retry: 2, // Retry on failure
	});

	return {
		data: data || undefined,
		isLoading,
		error: error as Error | null,
	};
};

