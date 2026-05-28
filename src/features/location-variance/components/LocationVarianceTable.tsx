/**
 * LocationVarianceTable
 *
 * Per-tab table of locations. Each row shows monthly revenue cells, the
 * latest delta, and an outlier flag. Click a row to open the drill panel.
 *
 * Sorting: click a column header to sort. Default = latest_delta_pct desc
 * (worst variances first).
 */

import React, { useMemo, useState } from 'react';
import type { SummaryLocation } from '../types';
import { formatINR, formatINRDelta, formatPct, formatMonthLabel } from '../../../utils/currencyFormatter';

type SortKey = 'name' | 'city' | 'latest_delta_pct' | 'latest_delta';

interface LocationVarianceTableProps {
	locations: SummaryLocation[];
	months: string[]; // YYYY-MM list, sorted ascending
	loading: boolean;
	searchText: string;
	onRowClick: (locationId: number, month: string) => void;
}

export const LocationVarianceTable: React.FC<LocationVarianceTableProps> = ({
	locations,
	months,
	loading,
	searchText,
	onRowClick,
}) => {
	const [sortKey, setSortKey] = useState<SortKey>('latest_delta_pct');
	const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

	const handleSort = (key: SortKey) => {
		if (key === sortKey) {
			setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
		} else {
			setSortKey(key);
			// Sensible defaults: text columns asc, numeric desc
			setSortDir(key === 'name' || key === 'city' ? 'asc' : 'desc');
		}
	};

	const filtered = useMemo(() => {
		const q = searchText.trim().toLowerCase();
		const xs = q ? locations.filter((l) => l.name.toLowerCase().includes(q)) : locations;
		const sorted = [...xs].sort((a, b) => {
			let av: number | string;
			let bv: number | string;
			switch (sortKey) {
				case 'name':
					av = a.name.toLowerCase();
					bv = b.name.toLowerCase();
					break;
				case 'city':
					av = (a.city_name || '').toLowerCase();
					bv = (b.city_name || '').toLowerCase();
					break;
				case 'latest_delta':
					av = a.latest_delta ?? 0;
					bv = b.latest_delta ?? 0;
					break;
				case 'latest_delta_pct':
				default:
					av = Math.abs(a.latest_delta_pct ?? 0);
					bv = Math.abs(b.latest_delta_pct ?? 0);
					break;
			}
			if (av < bv) return sortDir === 'asc' ? -1 : 1;
			if (av > bv) return sortDir === 'asc' ? 1 : -1;
			return 0;
		});
		return sorted;
	}, [locations, sortKey, sortDir, searchText]);

	if (loading) {
		return (
			<div className='py-12 text-center text-sm text-gray-500'>Loading locations…</div>
		);
	}

	if (!locations || locations.length === 0) {
		return (
			<div className='py-12 text-center text-sm text-gray-500'>
				No locations in this billing mode for the selected filters.
			</div>
		);
	}

	const latestMonth = months[months.length - 1];

	return (
		<div className='overflow-x-auto'>
			<table className='min-w-full text-sm'>
				<thead className='bg-gray-50 text-xs text-gray-600 uppercase'>
					<tr>
						<th
							className='px-4 py-3 text-left font-medium cursor-pointer hover:text-blue-600'
							onClick={() => handleSort('name')}
						>
							Location {sortKey === 'name' && (sortDir === 'asc' ? '▲' : '▼')}
						</th>
						<th
							className='px-4 py-3 text-left font-medium cursor-pointer hover:text-blue-600'
							onClick={() => handleSort('city')}
						>
							City {sortKey === 'city' && (sortDir === 'asc' ? '▲' : '▼')}
						</th>
						{months.map((m) => (
							<th key={m} className='px-4 py-3 text-right font-medium'>
								{formatMonthLabel(m)}
							</th>
						))}
						<th
							className='px-4 py-3 text-right font-medium cursor-pointer hover:text-blue-600'
							onClick={() => handleSort('latest_delta')}
						>
							Δ {sortKey === 'latest_delta' && (sortDir === 'asc' ? '▲' : '▼')}
						</th>
						<th
							className='px-4 py-3 text-right font-medium cursor-pointer hover:text-blue-600'
							onClick={() => handleSort('latest_delta_pct')}
						>
							Δ % {sortKey === 'latest_delta_pct' && (sortDir === 'asc' ? '▲' : '▼')}
						</th>
						<th className='px-4 py-3 text-center font-medium'>Flag</th>
					</tr>
				</thead>
				<tbody className='divide-y divide-gray-100'>
					{filtered.map((loc) => {
						const deltaCls = loc.latest_delta == null
							? 'text-gray-400'
							: loc.latest_delta > 0
								? 'text-green-600'
								: loc.latest_delta < 0
									? 'text-red-600'
									: 'text-gray-500';

						return (
							<tr
								key={loc.location_id}
								className='hover:bg-blue-50 cursor-pointer transition-colors'
								onClick={() => onRowClick(loc.location_id, latestMonth)}
							>
								<td className='px-4 py-3 text-gray-900'>
									<div className='font-medium'>{loc.name}</div>
									{loc._error && (
										<div className='text-xs text-red-500 mt-0.5'>Load error: {loc._error}</div>
									)}
								</td>
								<td className='px-4 py-3 text-gray-600'>{loc.city_name || '—'}</td>
								{months.map((m) => {
									const monthly = loc.monthly.find((mm) => mm.month === m);
									const value = monthly?.billed_revenue ?? monthly?.derived_revenue ?? null;
									return (
										<td key={m} className='px-4 py-3 text-right font-mono text-xs text-gray-700'>
											{formatINR(value, { compact: true })}
										</td>
									);
								})}
								<td className={`px-4 py-3 text-right font-mono text-xs ${deltaCls}`}>
									{formatINRDelta(loc.latest_delta, { compact: true })}
								</td>
								<td className={`px-4 py-3 text-right font-mono text-xs ${deltaCls}`}>
									{formatPct(loc.latest_delta_pct)}
								</td>
								<td className='px-4 py-3 text-center'>
									{loc.outlier && (
										<span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800'>
											⚠ Outlier
										</span>
									)}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
};
