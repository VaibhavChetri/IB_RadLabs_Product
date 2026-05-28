/**
 * PerSkuMonthlyTable
 *
 * Pivot table: one row per SKU, one column per month in the series. Each
 * cell shows the returned count AND the delta vs the prior month, so the
 * user can see at a glance which SKUs are climbing / falling over time.
 *
 * SKUs are gathered as the union across all months (a SKU that exists in
 * one month but not another shows 0 in the missing month). Rows are
 * sorted by total revenue desc across the window.
 */

import React, { useMemo } from 'react';
import type { RevenueSeriesResponse, SeriesPerSku } from '../types';
import { formatMonthLabel } from '../../../utils/currencyFormatter';

interface PerSkuMonthlyTableProps {
	series: RevenueSeriesResponse | null;
}

interface PivotRow {
	container_type_id: number;
	sku: string;
	totalRevenue: number; // for sorting
	byMonth: Record<string, SeriesPerSku | undefined>;
}

const fmtCount = (n: number) =>
	n === 0 ? '—' : n.toLocaleString('en-IN');

const fmtDelta = (curr: number, prev: number | undefined): string => {
	if (prev == null) return '';
	const d = curr - prev;
	if (d === 0) return '±0';
	const sign = d > 0 ? '+' : '';
	return `${sign}${d.toLocaleString('en-IN')}`;
};

export const PerSkuMonthlyTable: React.FC<PerSkuMonthlyTableProps> = ({ series }) => {
	const { rows, months } = useMemo(() => {
		if (!series || series.series.length === 0) return { rows: [], months: [] as string[] };

		// Collect months from the series (already sorted ascending)
		const monthsList = series.series.map((s) => s.month);

		// Union of all SKUs across all months
		const skuMap = new Map<number, PivotRow>();
		for (const s of series.series) {
			for (const ps of s.per_sku || []) {
				if (!skuMap.has(ps.container_type_id)) {
					skuMap.set(ps.container_type_id, {
						container_type_id: ps.container_type_id,
						sku: ps.sku || `SKU#${ps.container_type_id}`,
						totalRevenue: 0,
						byMonth: {},
					});
				}
				const row = skuMap.get(ps.container_type_id)!;
				row.byMonth[s.month] = ps;
				row.totalRevenue += Number(ps.revenue || 0);
			}
		}

		const pivotRows = Array.from(skuMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
		return { rows: pivotRows, months: monthsList };
	}, [series]);

	if (!series || rows.length === 0) {
		return <div className='text-xs text-gray-500'>No per-SKU data to pivot.</div>;
	}

	return (
		<div className='overflow-x-auto'>
			<table className='min-w-full text-xs'>
				<thead className='bg-gray-50 text-gray-600 uppercase sticky top-0'>
					<tr>
						<th className='px-3 py-2 text-left font-medium whitespace-nowrap'>SKU</th>
						{months.map((m) => (
							<th
								key={m}
								className='px-3 py-2 text-right font-medium whitespace-nowrap'
							>
								{formatMonthLabel(m)}
							</th>
						))}
					</tr>
				</thead>
				<tbody className='divide-y divide-gray-100'>
					{rows.map((row) => (
						<tr key={row.container_type_id} className='hover:bg-gray-50'>
							<td className='px-3 py-2 font-medium text-gray-900'>{row.sku}</td>
							{months.map((m, i) => {
								const cell = row.byMonth[m];
								const currCount = Number(cell?.returned_count || 0);
								const prevMonth = i > 0 ? months[i - 1] : undefined;
								const prevCount = prevMonth
									? Number(row.byMonth[prevMonth]?.returned_count || 0)
									: undefined;
								const delta = prevMonth != null ? currCount - (prevCount || 0) : null;
								const deltaCls =
									delta == null || delta === 0
										? 'text-gray-400'
										: delta > 0
											? 'text-green-600'
											: 'text-red-600';
								return (
									<td key={m} className='px-3 py-2 text-right whitespace-nowrap'>
										<div className='font-mono text-gray-700'>{fmtCount(currCount)}</div>
										{prevMonth != null && (
											<div className={`font-mono text-[10px] ${deltaCls} mt-0.5`}>
												{fmtDelta(currCount, prevCount)}
											</div>
										)}
									</td>
								);
							})}
						</tr>
					))}
				</tbody>
			</table>
			<div className='text-[11px] text-gray-500 mt-2'>
				Counts are returned plates. Δ shown below each cell is vs the prior month in this window.
			</div>
		</div>
	);
};
