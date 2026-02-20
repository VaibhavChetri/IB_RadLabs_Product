/**
 * State machine hook for 3D Builder workflow
 * Manages transitions between upload, auditing, validation, clarification, and success states
 */

import { useState, useCallback } from 'react';
import type { BuilderState, AuditSketchResponse } from '../types';

export const useThreeDBuilderState = () => {
	const [state, setState] = useState<BuilderState>('UPLOAD');
	const [uploadedFile, setUploadedFile] = useState<File | null>(null);
	const [auditResponse, setAuditResponse] = useState<AuditSketchResponse | null>(null);
	const [validationConfirmed, setValidationConfirmed] = useState<Record<string, boolean>>({});
	const [clarificationData, setClarificationData] = useState<Record<string, string>>({});
	const [error, setError] = useState<string | null>(null);

	// Handle file upload - transition to AUDITING state
	const handleFileUpload = useCallback((file: File) => {
		setUploadedFile(file);
		setError(null);
		setState('AUDITING');
	}, []);

	// Handle audit completion - transition to VALIDATION or CLARIFICATION
	const handleAuditComplete = useCallback((response: AuditSketchResponse) => {
		setAuditResponse(response);
		setError(null);

		// Initialize validation confirmation state
		const initialConfirmed: Record<string, boolean> = {};
		response.data.findings.forEach(finding => {
			initialConfirmed[finding.id] = false;
		});
		setValidationConfirmed(initialConfirmed);

		// Go to clarification if needed, otherwise validation
		setState(response.data.requiresClarification ? 'CLARIFICATION' : 'VALIDATION');
	}, []);

	// Update confirmation for a specific finding
	const handleConfirmationChange = useCallback((id: string, confirmed: boolean) => {
		setValidationConfirmed(prev => ({ ...prev, [id]: confirmed }));
	}, []);

	// Update clarification data for a specific field
	const handleClarificationChange = useCallback((id: string, value: string) => {
		setClarificationData(prev => ({ ...prev, [id]: value }));
	}, []);

	// Check if all validation criteria are met for success state
	const checkReadyForSuccess = useCallback(() => {
		if (!auditResponse) return false;

		// All findings must be confirmed
		const allConfirmed = Object.values(validationConfirmed).every(v => v);

		// If clarification is required, all fields must be filled
		const clarificationComplete = auditResponse.data.requiresClarification
			? auditResponse.data.clarificationFields?.every(f => clarificationData[f.id]?.trim())
			: true;

		return allConfirmed && clarificationComplete;
	}, [auditResponse, validationConfirmed, clarificationData]);

	// Set error state
	const setErrorState = useCallback((errorMessage: string) => {
		setError(errorMessage);
		setState('UPLOAD');
	}, []);

	// Reset to initial upload state
	const reset = useCallback(() => {
		setState('UPLOAD');
		setUploadedFile(null);
		setAuditResponse(null);
		setValidationConfirmed({});
		setClarificationData({});
		setError(null);
	}, []);

	return {
		state,
		uploadedFile,
		auditResponse,
		validationConfirmed,
		clarificationData,
		error,
		handleFileUpload,
		handleAuditComplete,
		handleConfirmationChange,
		handleClarificationChange,
		checkReadyForSuccess,
		setErrorState,
		reset,
		setState,
	};
};
