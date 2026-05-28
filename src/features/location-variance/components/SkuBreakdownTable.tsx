/**
 * SkuBreakdownTable
 *
 * Per-SKU drill-down for the variance drill panel. Sorted by |delta| desc
 * so the biggest contributors surface first.
 */

import React from 'react';
import type { SkuBreakdownRow } from '../types';
import { formatINR, formatINRDelta, formatPct } from '../../../utils/currencyFormatter';

interface SkuBreakdownTableProps {
	rows: SkuBreakdownRow[];
}

export const SkuBreakdownTable: React.FC<SkuBreakdownTableProps> = ({ rows }) => {
	if (!rows || rows.length === 0) {
		return <div className='text-xs text-gray-500'>No per-SKU breakdown for this mode.</div>;
	}

	// Already sorted by backend, but ensure
	const sorted = [...rows].sort(
		(a, b) => Math.abs(Number(b.delta) || 0) - Math.abs(Number(a.delta) || 0)
	);

	return (
		<div className='overflow-x-auto'>
			<table className='min-w-full text-xs'>
				<thead className='bg-gray-50 text-gray-600 uppercase'>
					<tr>
						<th className='px-3 py-2 text-left font-medium'>SKU</th>
						<th className='px-3 py-2 text-right font-medium'>Prev count</th>
						<th className='px-3 py-2 text-right font-medium'>Curr count</th>
						<th className='px-3 py-2 text-right font-medium'>Δ count</th>
						<th className='px-3 py-2 text-right font-medium'>Rej % prev → curr</th>
						<th className='px-3 py-2 text-right font-medium'>Price</th>
						<th className='px-3 py-2 text-right font-medium'>Δ revenue</th>
					</tr>
				</thead>
				<tbody className='divide-y divide-gray-100'>
					{sorted.map((r) => {
						const dCls = r.delta > 0 ? 'text-green-600' : r.delta < 0 ? 'text-red-600' : 'text-gray-500';
						const countDeltaCls =
							r.count_delta > 0 ? 'text-green-600' : r.count_delta < 0 ? 'text-red-600' : 'text-gray-500';
						return (
							<tr key={r.container_type_id} className='hover:bg-gray-50'>
								<td className='px-3 py-2 text-gray-900 font-medium'>{r.sku || `#${r.container_type_id}`}</td>
								<td className='px-3 py-2 text-right font-mono text-gray-700'>{r.count_previous.toLocaleString('en-IN')}</td>
								<td className='px-3 py-2 text-right font-mono text-gray-700'>{r.count_current.toLocaleString('en-IN')}</td>
								<td className={`px-3 py-2 text-right font-mono ${countDeltaCls}`}>
									{r.count_delta > 0 ? '+' : ''}
									{r.count_delta.toLocaleString('en-IN')}
								</td>
								<td className='px-3 py-2 text-right font-mono text-gray-700'>
									{formatPct(r.rejection_pct_previous, 1)} → {formatPct(r.rejection_pct_current, 1)}
								</td>
								<td className='px-3 py-2 text-right font-mono text-gray-700'>{formatINR(r.price_current, { withPaise: true })}</td>
								<td className={`px-3 py-2 text-right font-mono ${dCls}`}>{formatINRDelta(r.delta, { compact: true })}</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
};
