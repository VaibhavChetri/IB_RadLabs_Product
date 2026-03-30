import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HrmApiService, HrmAttendanceStatus, HrmTeamAttendanceFilters, MarkAttendanceRequest } from '../../../services/hrmApi';

export const useMyAttendance = (params: { month: number; year: number; status?: HrmAttendanceStatus; page?: number; limit?: number | 'all' }) =>
	useQuery({
		queryKey: ['hrm', 'attendance', 'my', params.month, params.year, params.status, params.page, params.limit],
		queryFn: async () => {
			const response = await HrmApiService.getMyAttendance(params);
			return response.data;
		},
		staleTime: 0,
		gcTime: 0,
		refetchOnMount: true,
		refetchOnWindowFocus: false,
		retry: 1,
	});

export const useTeamAttendance = (params: HrmTeamAttendanceFilters) =>
	useQuery({
		queryKey: ['hrm', 'attendance', 'team', params.month, params.year, params.employee_id, params.status, params.page, params.limit],
		queryFn: async () => {
			const response = await HrmApiService.getTeamAttendance(params);
			return response.data;
		},
		staleTime: 0,
		gcTime: 0,
		refetchOnMount: true,
		refetchOnWindowFocus: false,
		retry: 1,
	});

export const useAttendanceSummary = (params?: { employee_id: number; month: number; year: number }) =>
	useQuery({
		queryKey: ['hrm', 'attendance', 'summary', params?.employee_id, params?.month, params?.year],
		queryFn: async () => {
			const response = await HrmApiService.getAttendanceSummary(params as { employee_id: number; month: number; year: number });
			return response.data;
		},
		enabled: !!params?.employee_id,
		staleTime: 0,
		gcTime: 0,
		refetchOnMount: true,
		refetchOnWindowFocus: false,
		retry: 1,
	});

export const useMarkAttendance = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: MarkAttendanceRequest) => HrmApiService.markAttendance(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'attendance'] });
		},
	});
};
