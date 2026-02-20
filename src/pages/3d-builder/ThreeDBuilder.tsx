/**
 * 3D Builder Page
 * Main page orchestrating the sketch upload, audit, validation, and 3D model generation workflow
 */

import React, { useState } from 'react';
import { PageHeader, Card, Snackbar } from '../../components/ui';
import { UploadZone } from '../../features/three-d-builder/components/UploadZone';
import { AuditChecklist } from '../../features/three-d-builder/components/AuditChecklist';
import { ValidationCheckboxes } from '../../features/three-d-builder/components/ValidationCheckboxes';
import { ClarificationForm } from '../../features/three-d-builder/components/ClarificationForm';
import { SuccessState } from '../../features/three-d-builder/components/SuccessState';
import { useThreeDBuilderState } from '../../features/three-d-builder/hooks/useThreeDBuilderState';
import { useSketchAudit } from '../../features/three-d-builder/hooks/useSketchAudit';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export const ThreeDBuilder: React.FC = () => {
	const builderState = useThreeDBuilderState();
	const auditMutation = useSketchAudit();
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({ open: false, message: '', type: 'success' });
	const [isTransitioning, setIsTransitioning] = useState(false);

	// Handle file upload - trigger audit
	const handleFileUploadClick = async (file: File) => {
		builderState.handleFileUpload(file);

		try {
			const result = await auditMutation.mutateAsync(file);
			builderState.handleAuditComplete(result);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to audit sketch. Please try again.';
			builderState.setErrorState(errorMessage);
			setSnackbar({ open: true, message: errorMessage, type: 'error' });
		}
	};

	// Handle generate 3D model
	const handleGenerate3DModel = () => {
		// TODO: Implement actual 3D model generation call
		console.log('Generate 3D Model', {
			confirmedFindings: builderState.validationConfirmed,
			clarifications: builderState.clarificationData,
		});
		setSnackbar({
			open: true,
			message: '3D Model generation started! (Demo - not yet implemented)',
			type: 'success',
		});
	};

	// Fade transition animation
	const fadeTransitionClass = cn(
		'transition-all duration-300',
		isTransitioning ? 'opacity-0' : 'opacity-100'
	);

	return (
		<div className='space-y-6'>
			{/* Page Header */}
			<PageHeader
				title='3D Builder'
				totalItems={0}
				itemType='builder'
				icon='🏗️'
			/>

			{/* Main Content Card */}
			<Card className='max-w-4xl mx-auto'>
				<div className={fadeTransitionClass}>
					{/* UPLOAD STATE */}
					{builderState.state === 'UPLOAD' && (
						<div className='space-y-6'>
							<div>
								<h2 className='text-lg font-semibold text-foreground mb-2'>
									Upload Your Sketch
								</h2>
								<p className='text-sm text-foreground-secondary'>
									Start by uploading a 2D sketch image. Our AI will analyze it and extract key
									dimensions and features.
								</p>
							</div>
							<UploadZone onFileSelect={handleFileUploadClick} />
						</div>
					)}

					{/* AUDITING STATE */}
					{builderState.state === 'AUDITING' && (
						<div className='flex flex-col items-center justify-center py-16 sm:py-20'>
							<Loader2 className='w-12 h-12 text-primary animate-spin mb-4' />
							<p className='text-base font-medium text-foreground'>Analyzing your sketch...</p>
							<p className='text-sm text-foreground-secondary mt-2'>
								This may take a moment
							</p>
						</div>
					)}

					{/* VALIDATION STATE */}
					{(builderState.state === 'VALIDATION' || builderState.state === 'CLARIFICATION') &&
						builderState.auditResponse && (
							<div className='space-y-8'>
								{/* Audit Findings */}
								<div>
									<h2 className='text-lg font-semibold text-foreground mb-4'>
										AI Audit Results
									</h2>
									<AuditChecklist
										findings={builderState.auditResponse.data.findings}
										overallConfidence={builderState.auditResponse.data.confidence}
									/>
								</div>

								{/* Confirmation Checkboxes */}
								<div>
									<ValidationCheckboxes
										findings={builderState.auditResponse.data.findings}
										confirmed={builderState.validationConfirmed}
										onConfirmationChange={builderState.handleConfirmationChange}
									/>
								</div>

								{/* Clarification Form (if needed) */}
								{builderState.state === 'CLARIFICATION' &&
									builderState.auditResponse.data.requiresClarification &&
									builderState.auditResponse.data.clarificationFields && (
										<div className='border-t border-border pt-8'>
											<ClarificationForm
												fields={builderState.auditResponse.data.clarificationFields}
												data={builderState.clarificationData}
												onChange={builderState.handleClarificationChange}
												confidence={builderState.auditResponse.data.confidence}
											/>
										</div>
									)}

								{/* Action Buttons */}
								{builderState.checkReadyForSuccess() && (
									<div className='border-t border-border pt-8 flex gap-3 justify-end'>
										<button
											onClick={() => {
												setIsTransitioning(true);
												setTimeout(() => {
													builderState.reset();
													setIsTransitioning(false);
												}, 300);
											}}
											className='px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-background-secondary transition-colors duration-200'
										>
											Start Over
										</button>
										<button
											onClick={() => {
												setIsTransitioning(true);
												setTimeout(() => {
													builderState.setState('SUCCESS');
													setIsTransitioning(false);
												}, 300);
											}}
											className='px-6 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors duration-200'
										>
											Continue
										</button>
									</div>
								)}
							</div>
						)}

					{/* SUCCESS STATE */}
					{builderState.state === 'SUCCESS' && (
						<SuccessState
							onGenerate3DModel={handleGenerate3DModel}
							isLoading={false}
						/>
					)}
				</div>
			</Card>

			{/* Snackbar for notifications */}
			<Snackbar
				open={snackbar.open}
				message={snackbar.message}
				type={snackbar.type}
				autoHideDuration={5000}
				onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
			/>
		</div>
	);
};
