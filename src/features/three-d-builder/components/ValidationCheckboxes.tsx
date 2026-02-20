/**
 * Validation Checkboxes Component
 * Allows users to confirm AI findings
 */

import React from 'react';
import { Checkbox } from '../../../components/ui/Form';
import type { AuditFinding } from '../types';

interface ValidationCheckboxesProps {
	findings: AuditFinding[];
	confirmed: Record<string, boolean>;
	onConfirmationChange: (id: string, confirmed: boolean) => void;
}

export const ValidationCheckboxes: React.FC<ValidationCheckboxesProps> = ({
	findings,
	confirmed,
	onConfirmationChange,
}) => {
	const allConfirmed = Object.values(confirmed).every(v => v);

	return (
		<div className='space-y-4'>
			<h3 className='text-base font-semibold text-foreground'>Confirm Findings</h3>

			<p className='text-sm text-foreground-secondary'>
				Please review and confirm each AI finding below
			</p>

			<div className='space-y-3'>
				{findings.map(finding => (
					<div
						key={finding.id}
						className='flex items-start gap-3 p-3 rounded-lg border border-border bg-background-secondary hover:bg-background-muted transition-colors duration-200'
					>
						<Checkbox
							checked={confirmed[finding.id] ?? false}
							onChange={e => onConfirmationChange(finding.id, e.target.checked)}
							className='mt-1 flex-shrink-0'
						/>
						<div className='flex-1 min-w-0'>
							<label className='block text-sm font-medium text-foreground cursor-pointer'>
								Confirming {finding.label}
							</label>
							<p className='text-xs text-foreground-secondary mt-1'>
								Value: <span className='font-semibold text-primary'>{finding.value}</span>
							</p>
						</div>
					</div>
				))}
			</div>

			{/* Summary */}
			<div className='pt-2'>
				<p className='text-xs text-foreground-secondary'>
					<span className='font-medium'>
						{Object.values(confirmed).filter(Boolean).length}/{findings.length}
					</span>{' '}
					findings confirmed
				</p>
			</div>

			{/* Info message */}
			{!allConfirmed && (
				<div className='rounded-lg bg-info-50 border border-info-200 p-3'>
					<p className='text-xs font-medium text-info-700'>
						Please confirm all findings to proceed
					</p>
				</div>
			)}
		</div>
	);
};
