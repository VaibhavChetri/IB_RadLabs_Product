/**
 * React Query hook for fetching Complaint Type listing data
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
	ComplaintTypeService,
	GetComplaintTypesResponse,
} from '../../../services/complaintTypeApi';
import { useMemo } from 'react';

interface UseComplaintTypeDataParams {
	status?: string; // 'Active' or 'Inactive', '' or undefined for All
	page?: number;
	limit?: number;
}

export const useComplaintTypeData = (
	params?: UseComplaintTypeDataParams
): UseQueryResult<GetComplaintTypesResponse, Error> => {
	const queryResult = useQuery({
		queryKey: ['complaintType', 'listing', params?.page, params?.limit],
		queryFn: async (): Promise<GetComplaintTypesResponse> => {
			// Fetch all data without status filter (API will return all)
			return await ComplaintTypeService.getComplaintTypes({
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

		// Filter data by status (API returns status as string 'Active' or 'Inactive')
		const filteredItems = queryResult.data.data.filter(item => {
			return item.status === params.status;
		});

		return {
			...queryResult.data,
			data: filteredItems,
		};
	}, [queryResult.data, params?.status]);

	return {
		...queryResult,
		data: filteredData,
	} as UseQueryResult<GetComplaintTypesResponse, Error>;
};
