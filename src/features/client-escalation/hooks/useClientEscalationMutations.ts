/**
 * React Query mutations for Client Escalation (Add/Update)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
	ClientEscalationService,
	AddClientEscalationRequest,
	UpdateClientEscalationRequest,
} from '../../../services/transitPlanApi';

export const useAddClientEscalation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: AddClientEscalationRequest) => {
			return await ClientEscalationService.addClientEscalation(data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['clientEscalation', 'listing'] });
		},
	});
};

export const useUpdateClientEscalation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: UpdateClientEscalationRequest) => {
			return await ClientEscalationService.updateClientEscalation(data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['clientEscalation', 'listing'] });
		},
	});
};

