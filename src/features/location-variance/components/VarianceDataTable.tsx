/**
 * VarianceDataTable (Option A)
 *
 * Tiny inline data table showing the same 6-month series as the line chart,
 * but as plain numbers in a row. Useful when the user just wants the
 * numbers without having to read a chart.
 */

import React from 'react';
import type { RevenueSeriesResponse } from '../types';
import { formatINR, formatMonthLabel } from '../../../utils/currencyFormatter';

interface VarianceDataTableProps {
	series: RevenueSeriesResponse | null;
}

export const VarianceDataTable: React.FC<VarianceDataTableProps> = ({ series }) => {
	if (!series || series.series.length === 0) {
		return <div className='text-xs text-gray-500'>No data to tabulate.</div>;
	}

	return (
		<div className='overflow-x-auto'>
			<table className='min-w-full text-xs'>
				<thead className='bg-gray-50 text-gray-600 uppercase'>
					<tr>
						<th className='px-3 py-2 text-left font-medium'>Series</th>
						{series.series.map((s) => (
							<th key={s.month} className='px-3 py-2 text-right font-medium whitespace-nowrap'>
								{formatMonthLabel(s.month)}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					<tr className='hover:bg-gray-50'>
						<td className='px-3 py-2 text-gray-700 font-medium'>Derived</td>
						{series.series.map((s) => (
							<td key={s.month} className='px-3 py-2 text-right font-mono text-blue-700'>
								{formatINR(s.derived_revenue, { compact: true })}
							</td>
						))}
					</tr>
					<tr className='hover:bg-gray-50'>
						<td className='px-3 py-2 text-gray-700 font-medium'>Billed</td>
						{series.series.map((s) => (
							<td key={s.month} className='px-3 py-2 text-right font-mono text-green-700'>
								{s.billed_revenue == null ? '—' : formatINR(s.billed_revenue, { compact: true })}
							</td>
						))}
					</tr>
					<tr className='hover:bg-gray-50'>
						<td className='px-3 py-2 text-gray-500'>Returned</td>
						{series.series.map((s) => (
							<td key={s.month} className='px-3 py-2 text-right font-mono text-gray-500 text-[11px]'>
								{s.total_returned.toLocaleString('en-IN')}
							</td>
						))}
					</tr>
					<tr className='hover:bg-gray-50'>
						<td className='px-3 py-2 text-gray-500'>Rejected</td>
						{series.series.map((s) => (
							<td key={s.month} className='px-3 py-2 text-right font-mono text-gray-500 text-[11px]'>
								{s.total_rejected.toLocaleString('en-IN')}
							</td>
						))}
					</tr>
				</tbody>
			</table>
		</div>
	);
};
