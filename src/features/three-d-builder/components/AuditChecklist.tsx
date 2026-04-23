/**
 * Audit Checklist Component
 * Displays AI audit findings with confidence levels
 */

import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { AuditFinding } from '../types';

interface AuditChecklistProps {
	findings: AuditFinding[];
	overallConfidence: number;
}

export const AuditChecklist: React.FC<AuditChecklistProps> = ({
	findings,
	overallConfidence,
}) => {
	const isHighConfidence = overallConfidence >= 90;

	return (
		<div className='space-y-4'>
			{/* Overall Confidence Badge */}
			<div
				className={cn(
					'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
					isHighConfidence
						? 'bg-success-50 text-success-700'
						: 'bg-warning-50 text-warning-700'
				)}
			>
				{isHighConfidence ? (
					<CheckCircle2 className='w-4 h-4' />
				) : (
					<AlertCircle className='w-4 h-4' />
				)}
				<span>{overallConfidence}% Confidence</span>
			</div>

			{/* Findings List */}
			<div className='space-y-3'>
				{findings.map((finding, index) => {
					const findingHighConfidence = finding.confidence >= 90;

					return (
						<div
							key={finding.id}
							className={cn(
								'p-4 rounded-lg border transition-all duration-300',
								'opacity-0 animate-[fadeIn_0.3s_ease-in-out_forwards]',
								findingHighConfidence
									? 'border-success-200 bg-success-50'
									: 'border-warning-200 bg-warning-50'
							)}
							style={{ animationDelay: `${index * 100}ms` }}
						>
							<div className='flex items-start gap-3'>
								{/* Icon */}
								<div className='pt-1'>
									{findingHighConfidence ? (
										<CheckCircle2 className='w-5 h-5 text-success-600' />
									) : (
										<AlertCircle className='w-5 h-5 text-warning-600' />
									)}
								</div>

								{/* Content */}
								<div className='flex-1 min-w-0'>
									<p className='text-sm font-medium text-foreground'>
										{finding.label}
									</p>
									<p className='text-base font-semibold text-primary mt-1'>
										{finding.value}
									</p>
									<p
										className={cn(
											'text-xs font-medium mt-2',
											findingHighConfidence
												? 'text-success-700'
												: 'text-warning-700'
										)}
									>
										{finding.confidence}% Confidence
									</p>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* No findings state */}
			{findings.length === 0 && (
				<div className='text-center py-8'>
					<p className='text-sm text-foreground-secondary'>No findings detected</p>
				</div>
			)}
		</div>
	);
};
