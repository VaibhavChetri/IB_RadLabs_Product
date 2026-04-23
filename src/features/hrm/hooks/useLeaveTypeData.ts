import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateLeaveTypeRequest, HrmApiService, HrmLeaveTypeFilters, UpdateLeaveTypeRequest } from '../../../services/hrmApi';

export const useLeaveTypeData = (filters?: HrmLeaveTypeFilters) =>
	useQuery({
		queryKey: ['hrm', 'leave-types', filters?.is_active, filters?.page, filters?.limit],
		queryFn: async () => {
			const response = await HrmApiService.getLeaveTypes(filters);
			return response.data;
		},
		staleTime: 0,
		gcTime: 0,
		refetchOnMount: true,
		refetchOnWindowFocus: false,
		retry: 1,
	});

export const useCreateLeaveType = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: CreateLeaveTypeRequest) => HrmApiService.createLeaveType(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'leave-types'] });
		},
	});
};

export const useUpdateLeaveType = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, data }: { id: number; data: UpdateLeaveTypeRequest }) => HrmApiService.updateLeaveType(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'leave-types'] });
		},
	});
};
