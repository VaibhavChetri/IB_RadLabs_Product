/**
 * 3D Builder API Service
 * Handles sketch upload, audit, and 3D model generation
 */

import { ApiService, ApiResponse } from './api';
import type { AuditSketchResponse } from '../features/three-d-builder/types';

const api = ApiService.getInstance();

export class ThreeDBuilderService {
	/**
	 * Upload and audit 2D sketch
	 * @param file - Image file to audit
	 * @returns Audit response with confidence and findings
	 */
	static async auditSketch(file: File): Promise<AuditSketchResponse> {
		const formData = new FormData();
		formData.append('file', file);

		return api.postFormData<any>('/ai/audit-sketch', formData) as unknown as Promise<AuditSketchResponse>;
	}

	/**
	 * Generate 3D model from validated sketch
	 * @param payload - Sketch ID, confirmed findings, and clarifications
	 * @returns URL to generated 3D model
	 */
	static async generate3DModel(payload: {
		sketchId: string;
		confirmedFindings: Record<string, boolean>;
		clarifications?: Record<string, string>;
	}): Promise<ApiResponse<{ modelUrl: string }>> {
		return api.post('/ai/generate-3d-model', payload);
	}
}
