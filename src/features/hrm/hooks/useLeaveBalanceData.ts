import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HrmApiService } from '../../../services/hrmApi';

export const useMyLeaveBalances = (financialYear?: string) =>
	useQuery({
		queryKey: ['hrm', 'leave-balances', 'my', financialYear],
		queryFn: async () => {
			const response = await HrmApiService.getMyLeaveBalances(financialYear);
			return response.data;
		},
		staleTime: 0,
		gcTime: 0,
		refetchOnMount: true,
		refetchOnWindowFocus: false,
		retry: 1,
	});

export const useEmployeeLeaveBalances = (employeeId?: number, financialYear?: string) =>
	useQuery({
		queryKey: ['hrm', 'leave-balances', employeeId, financialYear],
		queryFn: async () => {
			const response = await HrmApiService.getLeaveBalancesByEmployee(employeeId as number, financialYear);
			return response.data;
		},
		enabled: !!employeeId,
		staleTime: 0,
		gcTime: 0,
		refetchOnMount: true,
		refetchOnWindowFocus: false,
		retry: 1,
	});

export const useInitializeLeaveBalances = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ employeeId, financialYear }: { employeeId: number; financialYear: string }) =>
			HrmApiService.initializeLeaveBalances(employeeId, financialYear),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'leave-balances'] });
		},
	});
};
