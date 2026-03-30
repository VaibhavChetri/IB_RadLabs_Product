/**
 * React Query hooks for HRM Salary Structure
 */

import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
	HrmApiService,
	HrmSalaryStructureFilters,
	CreateSalaryStructureRequest,
	UpdateSalaryStructureRequest,
} from '../../../services/hrmApi';

export const useSalaryStructureData = (params?: HrmSalaryStructureFilters) => {
	return useQuery({
		queryKey: ['hrm', 'salary-structures', params?.employee_id, params?.current_only, params?.page, params?.limit],
		queryFn: async () => {
			const response = await HrmApiService.getSalaryStructures({
				employee_id: params?.employee_id,
				current_only: params?.current_only,
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

export const useCreateSalaryStructure = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: CreateSalaryStructureRequest) => {
			return await HrmApiService.createSalaryStructure(data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'salary-structures'] });
		},
	});
};

export const useUpdateSalaryStructure = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, data }: { id: number; data: UpdateSalaryStructureRequest }) => {
			return await HrmApiService.updateSalaryStructure(id, data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'salary-structures'] });
		},
	});
};

export const useDeleteSalaryStructure = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: number) => {
			return await HrmApiService.deleteSalaryStructure(id);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'salary-structures'] });
		},
	});
};
