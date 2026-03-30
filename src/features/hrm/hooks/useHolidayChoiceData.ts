import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { HrmApiService, HrmTeamChoiceFilters } from '../../../services/hrmApi';

export const useMyHolidayChoices = (year?: number) => {
	return useQuery({
		queryKey: ['hrm', 'holiday-choices', 'my', year],
		queryFn: async () => {
			const response = await HrmApiService.getMyHolidayChoices(year);
			return response.data;
		},
		staleTime: 0,
		gcTime: 0,
		refetchOnMount: true,
		refetchOnWindowFocus: false,
		retry: 1,
	});
};

export const useCreateHolidayChoice = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: { holiday_id: number; year: number }) => {
			return await HrmApiService.createHolidayChoice(data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'holiday-choices'] });
			queryClient.invalidateQueries({ queryKey: ['hrm', 'holidays'] });
		},
	});
};

export const useDeleteHolidayChoice = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (choiceId: number) => {
			return await HrmApiService.deleteHolidayChoice(choiceId);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'holiday-choices'] });
			queryClient.invalidateQueries({ queryKey: ['hrm', 'holidays'] });
		},
	});
};

export const useTeamHolidayChoices = (params?: HrmTeamChoiceFilters) => {
	return useQuery({
		queryKey: ['hrm', 'holiday-choices', 'team', params?.year, params?.employee_id, params?.holiday_id, params?.status, params?.page, params?.limit],
		queryFn: async () => {
			const response = await HrmApiService.getTeamHolidayChoices(params);
			return response.data;
		},
		staleTime: 0,
		gcTime: 0,
		refetchOnMount: true,
		refetchOnWindowFocus: false,
		retry: 1,
	});
};

export const useHolidayChoicesSummary = (year?: number) => {
	return useQuery({
		queryKey: ['hrm', 'holiday-choices', 'summary', year],
		queryFn: async () => {
			const response = await HrmApiService.getHolidayChoicesSummary(year);
			return response.data;
		},
		staleTime: 0,
		gcTime: 0,
		refetchOnMount: true,
		refetchOnWindowFocus: false,
		retry: 1,
	});
};
