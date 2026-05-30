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
import { Info } from 'lucide-react';
import type { SummaryLocation, ZohoLinkage } from '../types';
import { formatINR, formatINRDelta, formatPct, formatMonthLabel } from '../../../utils/currencyFormatter';

type SortKey = 'name' | 'city' | 'latest_delta_pct' | 'latest_delta';

// Inline info icon for a column header — hover for a plain-language explanation.
const InfoTip: React.FC<{ tip: string }> = ({ tip }) => (
	<span title={tip} aria-label={tip} className='cursor-help ml-1 inline-flex align-middle'>
		<Info className='h-3 w-3 text-indigo-400' />
	</span>
);

// ── Additive "Revenue Intelligence" columns ────────────────────────────────
// New columns surface the analyzer's derived-vs-billed gap and the Zoho linkage
// quality. They are appended alongside the existing columns — nothing existing
// is removed. Grouped under a tinted header so it's clear what's new.

const ZOHO_LINKAGE_BADGE: Record<ZohoLinkage, { label: string; cls: string; title: string }> = {
	strict_customer_id: {
		label: 'Strict',
		cls: 'bg-green-100 text-green-800',
		title: 'Matched to a single Zoho customer by customer_id — billed figure is reliable.',
	},
	fuzzy_customer_name: {
		label: 'Fuzzy',
		cls: 'bg-yellow-100 text-yellow-800',
		title: 'Matched by customer name (stored zoho_customer_id did not resolve). Billed figure is approximate.',
	},
	ambiguous: {
		label: 'Ambiguous',
		cls: 'bg-red-100 text-red-800',
		title: 'Name matches multiple Zoho customers — billed figure is hidden to avoid a misleading total. Set this location’s zoho_customer_id.',
	},
	none: {
		label: 'None',
		cls: 'bg-gray-100 text-gray-500',
		title: 'No Zoho invoices matched this location by id or name — billed figure is unavailable.',
	},
};

// Latest-month derived/billed for a location, plus the gap (derived − billed).
const latestMonthRevenue = (loc: SummaryLocation, latestMonth: string) => {
	const m = loc.monthly.find((mm) => mm.month === latestMonth);
	const derived = m?.derived_revenue ?? null;
	const billed = m?.billed_revenue ?? null;
	const gap = derived != null && billed != null ? derived - billed : null;
	return { derived, billed, gap };
};

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
						{/* ── Additive: Revenue Intelligence group (derived/billed gap + Zoho linkage) ── */}
						<th className='px-4 py-3 text-right font-medium bg-indigo-50 text-indigo-700 border-l border-indigo-100'>
							Derived
							<InfoTip tip='Revenue our system calculates from operations (units returned × agreed price) for the latest month. What the client owes based on usage, before invoicing.' />
						</th>
						<th className='px-4 py-3 text-right font-medium bg-indigo-50 text-indigo-700'>
							Billed
							<InfoTip tip='Revenue actually invoiced in Zoho for the latest month. Blank when we can’t reliably match this client to a Zoho customer (see the Zoho column).' />
						</th>
						<th className='px-4 py-3 text-right font-medium bg-indigo-50 text-indigo-700'>
							Gap
							<InfoTip tip='Derived minus Billed. A non-zero gap means our calculated revenue and what was invoiced disagree — worth checking for under- or over-billing.' />
						</th>
						<th className='px-4 py-3 text-center font-medium bg-indigo-50 text-indigo-700 border-r border-indigo-100'>
							Zoho
							<InfoTip tip='How reliably we matched this client to a Zoho customer: Strict = matched by ID (reliable); Fuzzy = matched by name (approximate); Ambiguous = name matches several customers (billed hidden); None = no match found.' />
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
								{/* ── Additive: Revenue Intelligence cells ── */}
								{(() => {
									const { derived, billed, gap } = latestMonthRevenue(loc, latestMonth);
									const gapCls = gap == null
										? 'text-gray-400'
										: Math.abs(gap) < 1
											? 'text-gray-500'
											: gap > 0
												? 'text-amber-600'
												: 'text-blue-600';
									const badge = ZOHO_LINKAGE_BADGE[loc.zoho_linkage] || ZOHO_LINKAGE_BADGE.none;
									return (
										<>
											<td className='px-4 py-3 text-right font-mono text-xs text-gray-700 bg-indigo-50/40 border-l border-indigo-100'>
												{formatINR(derived, { compact: true })}
											</td>
											<td className='px-4 py-3 text-right font-mono text-xs text-gray-700 bg-indigo-50/40'>
												{formatINR(billed, { compact: true })}
											</td>
											<td className={`px-4 py-3 text-right font-mono text-xs bg-indigo-50/40 ${gapCls}`}>
												{formatINRDelta(gap, { compact: true })}
											</td>
											<td className='px-4 py-3 text-center bg-indigo-50/40 border-r border-indigo-100'>
												<span
													className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}
													title={badge.title}
												>
													{badge.label}
												</span>
											</td>
										</>
									);
								})()}
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
