/**
 * Clarification Form Component
 * Collects additional information when AI confidence is below 90%
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { FloatingInput } from '../../../components/ui/FloatingInput';
import type { ClarificationField } from '../types';

interface ClarificationFormProps {
	fields: ClarificationField[];
	data: Record<string, string>;
	onChange: (fieldId: string, value: string) => void;
	confidence: number;
}

export const ClarificationForm: React.FC<ClarificationFormProps> = ({
	fields,
	data,
	onChange,
	confidence,
}) => {
	const allFieldsFilled = fields.every(f => data[f.id]?.trim());

	return (
		<div className='space-y-4'>
			{/* Warning Section */}
			<div className='rounded-lg bg-warning-50 border border-warning-200 p-4'>
				<div className='flex items-start gap-3'>
					<AlertCircle className='w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5' />
					<div>
						<h4 className='text-sm font-semibold text-warning-900'>
							Clarification Required
						</h4>
						<p className='text-xs text-warning-700 mt-1'>
							AI confidence is {confidence}%. Please provide additional details to improve
							accuracy.
						</p>
					</div>
				</div>
			</div>

			{/* Form Fields */}
			<div className='space-y-4'>
				{fields.map((field, index) => (
					<div
						key={field.id}
						className='opacity-0 animate-[fadeIn_0.3s_ease-in-out_forwards]'
						style={{ animationDelay: `${index * 100}ms` }}
					>
						<FloatingInput
							label={field.label}
							value={data[field.id] ?? ''}
							onChange={(value: string) => onChange(field.id, value)}
							placeholder={field.placeholder}
						/>
					</div>
				))}
			</div>

			{/* Status indicator */}
			<div className='pt-2'>
				<p className='text-xs text-foreground-secondary'>
					<span className='font-medium'>
						{fields.filter(f => data[f.id]?.trim()).length}/{fields.length}
					</span>{' '}
					fields filled
				</p>
			</div>

			{/* Info message */}
			{!allFieldsFilled && (
				<div className='rounded-lg bg-info-50 border border-info-200 p-3'>
					<p className='text-xs font-medium text-info-700'>
						Please fill all required fields to continue
					</p>
				</div>
			)}
		</div>
	);
};
