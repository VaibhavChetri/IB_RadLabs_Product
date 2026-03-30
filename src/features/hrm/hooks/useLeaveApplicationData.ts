import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	CancelLeaveApplicationRequest,
	CreateLeaveApplicationRequest,
	HrmApiService,
	HrmLeaveApplicationFilters,
	ReviewLeaveApplicationRequest,
	RevertLopRequest,
} from '../../../services/hrmApi';

export const useLeaveApplicationData = (filters?: HrmLeaveApplicationFilters) =>
	useQuery({
		queryKey: ['hrm', 'leave-applications', filters?.status, filters?.employee_id, filters?.leave_type_id, filters?.month, filters?.year, filters?.page, filters?.limit],
		queryFn: async () => {
			const response = await HrmApiService.getLeaveApplications(filters);
			return response.data;
		},
		staleTime: 0,
		gcTime: 0,
		refetchOnMount: true,
		refetchOnWindowFocus: false,
		retry: 1,
	});

export const useCreateLeaveApplication = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: CreateLeaveApplicationRequest) => HrmApiService.createLeaveApplication(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'leave-applications'] });
			queryClient.invalidateQueries({ queryKey: ['hrm', 'leave-balances'] });
		},
	});
};

export const useReviewLeaveApplication = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, data }: { id: number; data: ReviewLeaveApplicationRequest }) => HrmApiService.reviewLeaveApplication(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'leave-applications'] });
			queryClient.invalidateQueries({ queryKey: ['hrm', 'leave-balances'] });
		},
	});
};

export const useCancelLeaveApplication = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, data }: { id: number; data: CancelLeaveApplicationRequest }) => HrmApiService.cancelLeaveApplication(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'leave-applications'] });
			queryClient.invalidateQueries({ queryKey: ['hrm', 'leave-balances'] });
		},
	});
};

export const useRevertLopLeaveApplication = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, data }: { id: number; data: RevertLopRequest }) => HrmApiService.revertLopLeaveApplication(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'leave-applications'] });
			queryClient.invalidateQueries({ queryKey: ['hrm', 'leave-balances'] });
		},
	});
};
