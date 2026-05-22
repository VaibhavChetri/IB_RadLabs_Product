/**
 * Stacked horizontal bar showing how the invoice cohort breaks down across
 * the five coverage classes. Pure presentational — segments are sized by share
 * and labelled with counts. Tooltips give the precise count + label.
 */

import React from 'react';
import { cn } from '../../../utils/cn';
import type { CoverageClass } from '../../../mocks/followUpTracker';
import { COVERAGE_VISUAL } from './statusConfig';

interface CoverageBarProps {
	breakdown: Record<CoverageClass, number>;
	total: number;
	/** Optional click handler to drill into a class. */
	onSelect?: (klass: CoverageClass) => void;
	/** Currently selected coverage classes (highlights segments). */
	active?: CoverageClass[];
}

const ORDER: CoverageClass[] = [
	'gmail_tracked',
	'zoho_emailed_only',
	'real_gap',
	'still_draft',
	'pre_tracking_column',
];

export const CoverageBar: React.FC<CoverageBarProps> = ({
	breakdown,
	total,
	onSelect,
	active,
}) => {
	if (total <= 0) {
		return (
			<div className='h-2.5 rounded-full bg-gray-100' aria-label='No data' />
		);
	}

	return (
		<div className='space-y-2'>
			<div className='flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100 ring-1 ring-gray-200'>
				{ORDER.map(klass => {
					const count = breakdown[klass] || 0;
					if (count === 0) return null;
					const pct = (count / total) * 100;
					const v = COVERAGE_VISUAL[klass];
					const isActive = !active || active.length === 0 || active.includes(klass);
					return (
						<button
							key={klass}
							type='button'
							onClick={() => onSelect?.(klass)}
							style={{ width: `${pct}%` }}
							title={`${v.label}: ${count} (${pct.toFixed(1)}%)`}
							className={cn(
								v.segmentBg,
								'transition-opacity hover:opacity-90',
								isActive ? 'opacity-100' : 'opacity-30',
								onSelect && 'cursor-pointer'
							)}
							aria-label={`${v.label}: ${count}`}
						/>
					);
				})}
			</div>

			<div className='flex flex-wrap gap-x-4 gap-y-1.5'>
				{ORDER.map(klass => {
					const count = breakdown[klass] || 0;
					const v = COVERAGE_VISUAL[klass];
					const isActive = !active || active.length === 0 || active.includes(klass);
					return (
						<button
							key={klass}
							type='button'
							onClick={() => onSelect?.(klass)}
							className={cn(
								'inline-flex items-center gap-1.5 text-xs transition-opacity',
								isActive ? 'opacity-100' : 'opacity-40',
								onSelect && 'hover:opacity-100 cursor-pointer'
							)}
						>
							<span className={cn('h-2 w-2 rounded-full', v.segmentBg)} />
							<span className='font-medium text-gray-700'>{v.label}</span>
							<span className='text-gray-400 tabular-nums'>{count}</span>
						</button>
					);
				})}
			</div>
		</div>
	);
};
