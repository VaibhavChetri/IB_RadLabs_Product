/**
 * P&L Tab Content Hooks
 * React Query hooks for fetching P&L data
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
	PAndLApiService,
	GetRevenueParams,
	GetRevenueInUnitsParams,
	GetEBITDAParams,
	GetClientWisePLParams,
	GetEscalationParams,
	RevenueResponse,
	RevenueInUnitsResponse,
	EBITDAResponse,
	ClientWisePLResponse,
	EscalationResponse,
} from '../../../services/pAndLApi';

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
 * Hook for Expenditure tab
 */
export const useExpenditureData = (
	facilityId: string,
	month: string,
	year: string,
	enabled: boolean = true
): UseQueryResult<RevenueResponse, Error> => {
	const dateRange = getDateRangeFromMonthYear(month, year);

	return useQuery({
		queryKey: ['p-and-l', 'expenditure', facilityId, month, year],
		queryFn: async (): Promise<RevenueResponse> => {
			if (!facilityId || !month || !year) {
				throw new Error('Missing required parameters');
			}

			const params: GetRevenueParams = {
				facility_id: parseInt(facilityId, 10),
				start_date: dateRange.start_date,
				end_date: dateRange.end_date,
				page: 1,
				limit: 10,
			};

			const response = await PAndLApiService.getRevenue(params);
			return response;
		},
		enabled: enabled && !!facilityId && !!month && !!year,
		staleTime: 0, // Always consider stale to ensure fresh data when facility changes
		gcTime: 10 * 60 * 1000,
		refetchOnMount: true, // Refetch when component mounts or queryKey changes
		refetchOnWindowFocus: false, // Already set globally, but explicit here
	});
};

/**
 * Hook for Unit Economics tab
 */
export const useUnitEconomicsData = (
	cityId: number | undefined,
	facilityId: string,
	month: string,
	year: string,
	enabled: boolean = true
): UseQueryResult<RevenueInUnitsResponse, Error> => {
	const dateRange = getDateRangeFromMonthYear(month, year);

	return useQuery({
		queryKey: ['p-and-l', 'unit-economics', cityId, facilityId, month, year],
		queryFn: async (): Promise<RevenueInUnitsResponse> => {
			if (!cityId || !facilityId || !month || !year) {
				throw new Error('Missing required parameters');
			}

			const params: GetRevenueInUnitsParams = {
				city_id: cityId,
				facility_id: parseInt(facilityId, 10),
				start_date: dateRange.start_date,
				end_date: dateRange.end_date,
				page: 1,
				limit: 10,
			};

			const response = await PAndLApiService.getRevenueInUnits(params);
			return response;
		},
		enabled: enabled && !!cityId && !!facilityId && !!month && !!year,
		staleTime: 0, // Always consider stale to ensure fresh data when facility changes
		gcTime: 10 * 60 * 1000,
		refetchOnMount: true, // Refetch when component mounts or queryKey changes
		refetchOnWindowFocus: false,
	});
};

/**
 * Hook for EBITDA tab
 */
export const useEBITDAData = (
	cityId: number | undefined,
	facilityId: string,
	month: string,
	year: string,
	enabled: boolean = true
): UseQueryResult<EBITDAResponse, Error> => {
	const dateRange = getDateRangeFromMonthYear(month, year);

	return useQuery({
		queryKey: ['p-and-l', 'ebitda', cityId, facilityId, month, year],
		queryFn: async (): Promise<EBITDAResponse> => {
			if (!cityId || !facilityId || !month || !year) {
				throw new Error('Missing required parameters');
			}

			const params: GetEBITDAParams = {
				city_id: cityId,
				facility_id: parseInt(facilityId, 10),
				start_date: dateRange.start_date,
				end_date: dateRange.end_date,
				groupByClient: true,
			};

			const response = await PAndLApiService.getEBITDA(params);
			return response;
		},
		enabled: enabled && !!cityId && !!facilityId && !!month && !!year,
		staleTime: 0, // Always consider stale to ensure fresh data when facility changes
		gcTime: 10 * 60 * 1000,
		refetchOnMount: true, // Refetch when component mounts or queryKey changes
		refetchOnWindowFocus: false,
	});
};

/**
 * Hook for Client Wise P&L tab
 */
export const useClientWisePLData = (
	cityId: number | undefined,
	facilityId: string,
	month: string,
	year: string,
	enabled: boolean = true
): UseQueryResult<ClientWisePLResponse, Error> => {
	const dateRange = getDateRangeFromMonthYear(month, year);

	return useQuery({
		queryKey: ['p-and-l', 'client-wise-pl', cityId, facilityId, month, year],
		queryFn: async (): Promise<ClientWisePLResponse> => {
			if (!cityId || !facilityId || !month || !year) {
				throw new Error('Missing required parameters');
			}

			const params: GetClientWisePLParams = {
				city_id: cityId,
				facility_id: parseInt(facilityId, 10),
				start_date: dateRange.start_date,
				end_date: dateRange.end_date,
				groupByClient: true,
			};

			const response = await PAndLApiService.getClientWisePL(params);
			return response;
		},
		enabled: enabled && !!cityId && !!facilityId && !!month && !!year,
		staleTime: 0, // Always consider stale to ensure fresh data when facility changes
		gcTime: 10 * 60 * 1000,
		refetchOnMount: true, // Refetch when component mounts or queryKey changes
		refetchOnWindowFocus: false,
	});
};

/**
 * Hook for Escalations tab
 */
export const useEscalationData = (
	cityId: number | undefined,
	facilityId: string,
	month: string,
	year: string,
	enabled: boolean = true
): UseQueryResult<EscalationResponse, Error> => {
	const dateRange = getDateRangeFromMonthYear(month, year);

	return useQuery({
		queryKey: ['p-and-l', 'escalations', cityId, facilityId, month, year],
		queryFn: async (): Promise<EscalationResponse> => {
			if (!cityId || !facilityId || !month || !year) {
				throw new Error('Missing required parameters');
			}

			const params: GetEscalationParams = {
				cityId: cityId,
				facilityId: parseInt(facilityId, 10),
				startDate: dateRange.start_date,
				endDate: dateRange.end_date,
			};

			const response = await PAndLApiService.getEscalation(params);
			return response;
		},
		enabled: enabled && !!cityId && !!facilityId && !!month && !!year,
		staleTime: 0, // Always consider stale to ensure fresh data when facility changes
		gcTime: 10 * 60 * 1000,
		refetchOnMount: true, // Refetch when component mounts or queryKey changes
		refetchOnWindowFocus: false,
	});
};
