import { useQuery } from '@tanstack/react-query';
import {
	ProjectedCostingService,
	GetProjectedCostingParams,
	ProjectedCostingItem,
	OnSiteManPowerItem,
	GetProjectedCostingResponse,
} from '../../../services/pAndLApi';

interface UseProjectedCostingReturn {
	data: ProjectedCostingItem[] | undefined;
	manPowerResults: OnSiteManPowerItem[] | undefined;
	fullResponse: GetProjectedCostingResponse | undefined;
	isLoading: boolean;
	error: Error | null;
}

/**
 * Hook to fetch projected costing data
 */
export const useProjectedCosting = (
	params: GetProjectedCostingParams | null,
	enabled: boolean = true
): UseProjectedCostingReturn => {
	const { data, isLoading, error } = useQuery({
		queryKey: ['projectedCosting', params?.date_year, params?.facility_id],
		queryFn: async () => {
			if (!params) return null;
			const response = await ProjectedCostingService.getProjectedCosting(params);
			return response;
		},
		enabled: enabled && !!params && !!params.date_year && !!params.facility_id,
		staleTime: 2 * 60 * 1000, // 2 minutes
		refetchOnMount: false,
		refetchOnWindowFocus: false,
	});

	return {
		data: data?.results?.costingResults || undefined,
		manPowerResults: data?.results?.manPowerResults || undefined,
		fullResponse: data || undefined,
		isLoading,
		error: error as Error | null,
	};
};

