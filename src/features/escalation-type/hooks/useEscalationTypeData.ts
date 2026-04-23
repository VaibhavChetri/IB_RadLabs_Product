/**
 * React Query hook for fetching Escalation Type listing data
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
	EscalationTypeService,
	GetEscalationTypesResponse,
} from '../../../services/transitPlanApi';
import { useMemo } from 'react';

interface UseEscalationTypeDataParams {
	status?: string; // '1' for Active, '0' for Inactive, '' or undefined for All
	page?: number;
	limit?: number;
}

export const useEscalationTypeData = (
	params?: UseEscalationTypeDataParams
): UseQueryResult<GetEscalationTypesResponse, Error> => {
	const queryResult = useQuery({
		queryKey: ['escalationType', 'listing', params?.page, params?.limit],
		queryFn: async (): Promise<GetEscalationTypesResponse> => {
			// Fetch all data without status filter (API will return all)
			return await EscalationTypeService.getEscalationTypes({
				page: params?.page,
				limit: params?.limit,
			});
		},
		staleTime: 0, // Always refetch on mount for fresh data
		gcTime: 0, // Don't cache
		refetchOnMount: true,
		refetchOnWindowFocus: false,
		retry: 1,
	});

	// Filter client-side if status filter is provided
	const filteredData = useMemo(() => {
		if (!queryResult.data) {
			return queryResult.data;
		}

		// If no status filter or empty string, return all data
		if (!params?.status || params.status === '') {
			return queryResult.data;
		}

		// Convert string status to number for comparison
		// '1' or 'Active' -> 1, '0' or 'Inactive' -> 0
		let statusNumber: number | null = null;
		if (params.status === '1' || params.status === 'Active') {
			statusNumber = 1;
		} else if (params.status === '0' || params.status === 'Inactive') {
			statusNumber = 0;
		}

		// If statusNumber is still null, return all data
		if (statusNumber === null) {
			return queryResult.data;
		}

		// Filter data by status
		const filteredItems = queryResult.data.data.filter(item => {
			// item.status is a number (1 = Active, 0 = Inactive)
			// Ensure strict comparison with number
			const itemStatus = typeof item.status === 'number' ? item.status : Number(item.status);
			return itemStatus === statusNumber;
		});

		return {
			...queryResult.data,
			data: filteredItems,
		};
	}, [queryResult.data, params?.status]);

	return {
		...queryResult,
		data: filteredData,
	} as UseQueryResult<GetEscalationTypesResponse, Error>;
};
