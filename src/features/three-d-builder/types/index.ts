/**
 * Type definitions for 3D Builder feature
 */

export interface AuditFinding {
	id: string;
	label: string; // e.g., "Detected Length"
	value: string; // e.g., "6ft"
	confidence: number; // 0-100
	confirmed: boolean;
}

export interface ClarificationField {
	id: string;
	label: string;
	placeholder: string;
}

export interface AuditSketchData {
	confidence: number; // Overall confidence (0-100)
	findings: AuditFinding[];
	requiresClarification: boolean;
	clarificationFields?: ClarificationField[];
}

export interface AuditSketchResponse {
	status_code: number;
	status: string;
	message: string;
	data: AuditSketchData;
}

export type BuilderState = 'UPLOAD' | 'AUDITING' | 'VALIDATION' | 'CLARIFICATION' | 'SUCCESS';

export interface ThreeDBuilderState {
	currentState: BuilderState;
	uploadedFile: File | null;
	auditResponse: AuditSketchResponse | null;
	validationConfirmed: Record<string, boolean>;
	clarificationData: Record<string, string>;
	error: string | null;
}
