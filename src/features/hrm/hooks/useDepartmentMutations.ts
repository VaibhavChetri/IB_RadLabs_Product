/**
 * React Query mutations for HRM Department CRUD
 */

import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
	HrmApiService,
	CreateDepartmentRequest,
	UpdateDepartmentRequest,
	HrmDepartmentFilters,
} from '../../../services/hrmApi';

export const useDepartmentData = (params?: HrmDepartmentFilters) => {
	return useQuery({
		queryKey: ['hrm', 'departments', params?.q, params?.is_active, params?.page, params?.limit],
		queryFn: async () => {
			const response = await HrmApiService.getDepartments({
				q: params?.q,
				is_active: params?.is_active,
				page: params?.page || 1,
				limit: params?.limit || 20,
			});
			return response.data;
		},
		staleTime: 0,
		gcTime: 0,
		refetchOnMount: true,
		refetchOnWindowFocus: false,
		retry: 1,
	});
};

export const useCreateDepartment = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: CreateDepartmentRequest) => {
			return await HrmApiService.createDepartment(data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'departments'] });
		},
	});
};

export const useUpdateDepartment = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, data }: { id: number; data: UpdateDepartmentRequest }) => {
			return await HrmApiService.updateDepartment(id, data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'departments'] });
		},
	});
};

export const useDeleteDepartment = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: number) => {
			return await HrmApiService.deleteDepartment(id);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'departments'] });
		},
	});
};
