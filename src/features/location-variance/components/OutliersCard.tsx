/**
 * OutliersCard
 *
 * Top-of-page collapsible card. Lists locations across ALL billing modes
 * whose latest delta exceeds the threshold (default 10%). Click a row to
 * open the drill panel for that location at the relevant month.
 */

import React, { useState } from 'react';
import { Card } from '../../../components/ui';
import type { OutliersResponse } from '../types';
import { formatINRDelta, formatPct, formatMonthLabel } from '../../../utils/currencyFormatter';

interface OutliersCardProps {
	data: OutliersResponse | null;
	loading: boolean;
	error: string | null;
	month: string | null;
	onRowClick: (locationId: number, month: string) => void;
}

export const OutliersCard: React.FC<OutliersCardProps> = ({ data, loading, error, month, onRowClick }) => {
	// Collapsed by default — the card header still shows the count + month context,
	// so users can decide whether the outliers warrant a look before expanding.
	const [expanded, setExpanded] = useState(false);

	if (loading) {
		return (
			<Card className='p-4'>
				<div className='text-sm text-gray-500'>Computing outliers…</div>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className='p-4'>
				<div className='text-sm text-red-600'>Outliers load failed: {error}</div>
			</Card>
		);
	}

	if (!data || data.outliers.length === 0) {
		return null; // Nothing flagged → don't take up screen space
	}

	const monthLabel = formatMonthLabel(month || data.month);
	const prevLabel = formatMonthLabel(data.prev_month);

	return (
		<Card className='p-0 overflow-hidden border-amber-200 bg-amber-50/40'>
			<button
				type='button'
				onClick={() => setExpanded((v) => !v)}
				className='w-full flex items-center justify-between px-4 py-3 hover:bg-amber-50 transition-colors'
			>
				<div className='flex items-center gap-3'>
					<span className='text-amber-600 text-lg'>⚠</span>
					<div className='text-left'>
						<div className='text-sm font-semibold text-gray-900'>
							{data.outliers.length} location{data.outliers.length === 1 ? '' : 's'} need attention
						</div>
						<div className='text-xs text-gray-600'>
							{monthLabel} vs {prevLabel} · {data.total_evaluated} evaluated · {data.threshold_pct}% threshold
						</div>
					</div>
				</div>
				<span className='text-gray-500 text-sm'>{expanded ? '▲' : '▼'}</span>
			</button>

			{expanded && (
				<div className='border-t border-amber-200 bg-white'>
					<table className='min-w-full text-sm'>
						<thead className='bg-amber-100/50 text-xs text-gray-700 uppercase'>
							<tr>
								<th className='px-4 py-2 text-left font-medium'>Location</th>
								<th className='px-4 py-2 text-left font-medium'>City</th>
								<th className='px-4 py-2 text-left font-medium'>Mode</th>
								<th className='px-4 py-2 text-right font-medium'>Δ</th>
								<th className='px-4 py-2 text-right font-medium'>Δ %</th>
								<th className='px-4 py-2 text-left font-medium'>Why (best guess)</th>
							</tr>
						</thead>
						<tbody className='divide-y divide-gray-100'>
							{data.outliers.map((o) => {
								const dCls = o.delta > 0 ? 'text-green-600' : 'text-red-600';
								return (
									<tr
										key={`${o.location_id}-${o.billing_type_id}`}
										className='hover:bg-blue-50 cursor-pointer transition-colors'
										onClick={() => onRowClick(o.location_id, data.month)}
									>
										<td className='px-4 py-2 font-medium text-gray-900'>{o.name}</td>
										<td className='px-4 py-2 text-gray-600'>{o.city_name || '—'}</td>
										<td className='px-4 py-2 text-gray-600 text-xs'>{o.billing_type_name || '—'}</td>
										<td className={`px-4 py-2 text-right font-mono text-xs ${dCls}`}>
											{formatINRDelta(o.delta, { compact: true })}
										</td>
										<td className={`px-4 py-2 text-right font-mono text-xs ${dCls}`}>
											{formatPct(o.delta_pct)}
										</td>
										<td className='px-4 py-2 text-xs text-gray-700 max-w-md'>{o.blurb}</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</Card>
	);
};
