/**
 * React Query mutations for HRM Designation CRUD
 */

import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
	HrmApiService,
	CreateDesignationRequest,
	UpdateDesignationRequest,
	HrmDesignationFilters,
} from '../../../services/hrmApi';

export const useDesignationData = (params?: HrmDesignationFilters) => {
	return useQuery({
		queryKey: ['hrm', 'designations', params?.q, params?.level, params?.is_active, params?.page, params?.limit],
		queryFn: async () => {
			const response = await HrmApiService.getDesignations({
				q: params?.q,
				level: params?.level,
				is_active: params?.is_active,
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

export const useCreateDesignation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: CreateDesignationRequest) => {
			return await HrmApiService.createDesignation(data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'designations'] });
			queryClient.invalidateQueries({ queryKey: ['hrm', 'designations', 'options'] });
		},
	});
};

export const useUpdateDesignation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, data }: { id: number; data: UpdateDesignationRequest }) => {
			return await HrmApiService.updateDesignation(id, data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'designations'] });
			queryClient.invalidateQueries({ queryKey: ['hrm', 'designations', 'options'] });
		},
	});
};

export const useDeleteDesignation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: number) => {
			return await HrmApiService.deleteDesignation(id);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['hrm', 'designations'] });
			queryClient.invalidateQueries({ queryKey: ['hrm', 'designations', 'options'] });
		},
	});
};
