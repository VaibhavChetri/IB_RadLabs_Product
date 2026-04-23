import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { HrmApiService } from '../../../services/hrmApi';

export const useHolidayConfig = () => {
	return useQuery({
		queryKey: ['hrm', 'config'],
		queryFn: async () => {
			const response = await HrmApiService.getConfig();
			return response.data;
		},
		staleTime: 0,
		gcTime: 0,
		refetchOnMount: true,
		refetchOnWindowFocus: false,
		retry: 1,
	});
};

export const useUpdateHolidayConfig = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ key, value }: { key: string; value: string }) => {
			return await HrmApiService.updateConfig(key, value);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'config'] });
		},
	});
};
