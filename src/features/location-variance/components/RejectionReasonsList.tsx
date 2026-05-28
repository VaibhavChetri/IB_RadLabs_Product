/**
 * RejectionReasonsList
 *
 * Compact list of (SKU × reason × count) for the drilled month.
 */

import React from 'react';
import type { RejectionReason } from '../types';

interface RejectionReasonsListProps {
	rows: RejectionReason[];
}

export const RejectionReasonsList: React.FC<RejectionReasonsListProps> = ({ rows }) => {
	if (!rows || rows.length === 0) {
		return <div className='text-xs text-gray-500'>No rejection reasons logged for this month.</div>;
	}
	const sorted = [...rows].sort((a, b) => b.rejected_count - a.rejected_count);
	return (
		<ul className='text-xs space-y-1'>
			{sorted.map((r, i) => (
				<li key={`${r.container_type_id}-${r.reason ?? 'unknown'}-${i}`} className='flex items-center justify-between gap-3'>
					<span className='text-gray-700'>
						<span className='font-medium'>{r.sku || `#${r.container_type_id}`}</span>
						<span className='text-gray-400 mx-1.5'>·</span>
						<span>{r.reason || 'unspecified'}</span>
					</span>
					<span className='font-mono text-red-600'>{r.rejected_count.toLocaleString('en-IN')}</span>
				</li>
			))}
		</ul>
	);
};
