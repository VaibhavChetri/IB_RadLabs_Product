/**
 * Revenue Listing Hook
 * React Query hook for fetching revenue listing data
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { PAndLApiService, GetRevenueParams, RevenueResponse } from '../../../services/pAndLApi';

// Helper to format date range from month/year
const getDateRangeFromMonthYear = (
	month: string,
	year: string
): { start_date: string; end_date: string } => {
	const monthNum = parseInt(month, 10);
	const yearNum = parseInt(year, 10);

	// Use UTC to avoid timezone conversion issues
	const startDate = new Date(Date.UTC(yearNum, monthNum - 1, 1));
	const endDate = new Date(Date.UTC(yearNum, monthNum, 0)); // Last day of the month

	// Format as YYYY-MM-DD using UTC methods to avoid timezone shifts
	const formatDate = (date: Date): string => {
		const year = date.getUTCFullYear();
		const month = String(date.getUTCMonth() + 1).padStart(2, '0');
		const day = String(date.getUTCDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	return {
		start_date: formatDate(startDate),
		end_date: formatDate(endDate),
	};
};

/**
 * Hook for Revenue Listing
 */
export const useRevenueListingData = (
	cityId: number | undefined,
	facilityId: string,
	month: string,
	year: string,
	costCategoryId: string | undefined,
	enabled: boolean = true
): UseQueryResult<RevenueResponse, Error> => {
	const dateRange = getDateRangeFromMonthYear(month, year);

	// Cost category is optional - API can be called without it to show all data
	const isEnabled = enabled && !!facilityId && !!month && !!year && !!cityId;

	console.log('useRevenueListingData - Enabled check:', {
		enabled,
		facilityId,
		month,
		year,
		cityId,
		costCategoryId,
		isEnabled,
	});

	return useQuery({
		queryKey: ['revenue', 'listing', 'edit', cityId, facilityId, month, year, costCategoryId || 'all'], // Separate edit queries from listing queries
		queryFn: async (): Promise<RevenueResponse> => {
			console.log('useRevenueListingData - queryFn executing');
			console.log('useRevenueListingData - Parameters:', {
				facilityId,
				month,
				year,
				cityId,
				dateRange,
			});
			
			if (!facilityId || !month || !year || !cityId) {
				const errorMsg = `Missing required parameters: facilityId=${facilityId}, month=${month}, year=${year}, cityId=${cityId}`;
				console.error('useRevenueListingData - Error:', errorMsg);
				throw new Error(errorMsg);
			}

			const params: GetRevenueParams = {
				city_id: cityId,
				facility_id: parseInt(facilityId, 10),
				start_date: dateRange.start_date,
				end_date: dateRange.end_date,
				page: 1,
				limit: 100,
				allResults: true, // Always fetch all results for edit page
			};

			// Add reviewCategoryTypeId only if costCategoryId is selected
			if (costCategoryId) {
				params.reviewCategoryTypeId = parseInt(costCategoryId, 10);
			}

			console.log('useRevenueListingData - Calling API with params:', params);
			console.log('useRevenueListingData - Full API URL will be:', `/review/getRevenue?city_id=${params.city_id}&facility_id=${params.facility_id}&start_date=${params.start_date}&end_date=${params.end_date}&page=${params.page}&limit=${params.limit}&allResults=true`);
			
			const response = await PAndLApiService.getRevenue(params);
			console.log('useRevenueListingData - API response received:', response);
			return response;
		},
		enabled: isEnabled,
		staleTime: 0, // Always consider data stale
		gcTime: 0, // Don't cache - immediately remove from cache after unmount
		refetchOnMount: true, // Refetch if data is stale (which it always is with staleTime: 0)
		refetchOnWindowFocus: false,
		retry: 1, // Retry once on failure
	});
};

