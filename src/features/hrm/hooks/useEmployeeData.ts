/**
 * React Query hook for fetching HRM Employee listing data
 */

import { useQuery } from '@tanstack/react-query';
import { HrmApiService, HrmEmployeeFilters } from '../../../services/hrmApi';

export const useEmployeeData = (params?: HrmEmployeeFilters) => {
	return useQuery({
		queryKey: [
			'hrm',
			'employees',
			params?.q,
			params?.department_id,
			params?.designation_id,
			params?.status,
			params?.employment_type,
			params?.is_active,
			params?.page,
			params?.limit,
		],
		queryFn: async () => {
			const response = await HrmApiService.getEmployees({
				q: params?.q,
				department_id: params?.department_id,
				designation_id: params?.designation_id,
				status: params?.status,
				employment_type: params?.employment_type,
				is_active: params?.is_active,
				page: params?.page || 1,
				limit: params?.limit || 20,
			});
			// apiService.get() returns the raw server body (axios response.data)
			// HRM list APIs return: { success, data: [...], pagination: {...} }
			// But apiService wraps as ApiResponse: { status_code, status, message, data: { success, data, pagination } }
			// Return the full body so the page can access .data (array) and .pagination
			const body = response as any;
			// Handle both shapes: if body has .data that contains .data (double wrapped), unwrap once
			if (body?.data && Array.isArray(body.data?.data)) {
				return body.data; // { success, data: [...], pagination }
			}
			if (body?.data && Array.isArray(body.data)) {
				return body; // { success/status, data: [...], pagination }
			}
			return body;
		},
		staleTime: 0,
		gcTime: 0,
		refetchOnMount: true,
		refetchOnWindowFocus: false,
		retry: 1,
	});
};

export const useDepartmentOptions = () => {
	return useQuery({
		queryKey: ['hrm', 'departments', 'options'],
		queryFn: async () => {
			const response = await HrmApiService.getDepartments({ is_active: true, limit: 200 });
			return response.data;
		},
		staleTime: 5 * 60 * 1000, // 5 minutes
		refetchOnWindowFocus: false,
	});
};

export const useDesignationOptions = () => {
	return useQuery({
		queryKey: ['hrm', 'designations', 'options'],
		queryFn: async () => {
			const response = await HrmApiService.getDesignations({ is_active: true, limit: 200 });
			return response.data;
		},
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
	});
};
