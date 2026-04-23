import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateCompOffRequest, HrmApiService, HrmCompOffFilters } from '../../../services/hrmApi';

export const useCompOffData = (filters?: HrmCompOffFilters) =>
	useQuery({
		queryKey: ['hrm', 'comp-off', filters?.status, filters?.employee_id, filters?.page, filters?.limit],
		queryFn: async () => {
			const response = await HrmApiService.getCompOffs(filters);
			return response.data;
		},
		staleTime: 0,
		gcTime: 0,
		refetchOnMount: true,
		refetchOnWindowFocus: false,
		retry: 1,
	});

export const useCreateCompOff = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: CreateCompOffRequest) => HrmApiService.createCompOff(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'comp-off'] });
		},
	});
};
