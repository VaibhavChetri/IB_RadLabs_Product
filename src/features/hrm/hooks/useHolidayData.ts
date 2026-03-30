import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { HrmApiService, HrmHolidayFilters } from '../../../services/hrmApi';

export const useHolidayData = (params?: HrmHolidayFilters) => {
	return useQuery({
		queryKey: ['hrm', 'holidays', params?.year, params?.type, params?.page, params?.limit],
		queryFn: async () => {
			const response = await HrmApiService.getHolidays({
				year: params?.year,
				type: params?.type,
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

export const useCreateHoliday = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: { name: string; date: string; type: 'national' | 'company' | 'restricted'; year: number }) => {
			return await HrmApiService.createHoliday(data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'holidays'] });
		},
	});
};

export const useUpdateHoliday = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, data }: { id: number; data: Partial<{ name: string; date: string; type: 'national' | 'company' | 'restricted'; year: number }> }) => {
			return await HrmApiService.updateHoliday(id, data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'holidays'] });
		},
	});
};

export const useDeleteHoliday = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: number) => {
			return await HrmApiService.deleteHoliday(id);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'holidays'] });
		},
	});
};
