/**
 * React Query mutation hook for sketch audit
 */

import { useMutation } from '@tanstack/react-query';
import { ThreeDBuilderService } from '../../../services/threeDBuilderApi';
import type { AuditSketchResponse } from '../types';

export const useSketchAudit = () => {
	return useMutation({
		mutationFn: async (file: File): Promise<AuditSketchResponse> => {
			return await ThreeDBuilderService.auditSketch(file);
		},
		retry: 1,
	});
};
