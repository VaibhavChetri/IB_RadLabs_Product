import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	CreateAttendanceRegularizationRequest,
	HrmApiService,
	HrmAttendanceRegularizationFilters,
	ReviewAttendanceRegularizationRequest,
} from '../../../services/hrmApi';

export const useAttendanceRegularizations = (filters?: HrmAttendanceRegularizationFilters) =>
	useQuery({
		queryKey: ['hrm', 'attendance', 'regularize', filters?.review_status, filters?.employee_id, filters?.month, filters?.year, filters?.page, filters?.limit],
		queryFn: async () => {
			const response = await HrmApiService.getAttendanceRegularizations(filters);
			return response.data;
		},
		staleTime: 0,
		gcTime: 0,
		refetchOnMount: true,
		refetchOnWindowFocus: false,
		retry: 1,
	});

export const useCreateAttendanceRegularization = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: CreateAttendanceRegularizationRequest) => HrmApiService.createAttendanceRegularization(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'attendance', 'regularize'] });
			queryClient.invalidateQueries({ queryKey: ['hrm', 'attendance'] });
		},
	});
};

export const useReviewAttendanceRegularization = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, data }: { id: number; data: ReviewAttendanceRegularizationRequest }) =>
			HrmApiService.reviewAttendanceRegularization(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'attendance', 'regularize'] });
			queryClient.invalidateQueries({ queryKey: ['hrm', 'attendance'] });
		},
	});
};
