/**
 * React Query mutations for HRM Employee (Create/Update/Delete)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
	HrmApiService,
	CreateEmployeeRequest,
	UpdateEmployeeRequest,
} from '../../../services/hrmApi';

export const useCreateEmployee = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: CreateEmployeeRequest) => {
			return await HrmApiService.createEmployee(data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'employees'] });
			queryClient.invalidateQueries({ queryKey: ['hrm', 'employees', 'manager-options'] });
		},
	});
};

export const useUpdateEmployee = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, data }: { id: number; data: UpdateEmployeeRequest }) => {
			return await HrmApiService.updateEmployee(id, data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'employees'] });
			queryClient.invalidateQueries({ queryKey: ['hrm', 'employees', 'manager-options'] });
		},
	});
};

export const useDeleteEmployee = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: number) => {
			return await HrmApiService.deleteEmployee(id);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'employees'] });
			queryClient.invalidateQueries({ queryKey: ['hrm', 'employees', 'manager-options'] });
		},
	});
};
