/**
 * Customer Intelligence — Module 2.
 *
 * One CUSTOMER per row (vs Module 1's one-invoice-per-row), ranked by who
 * deserves attention this week. Driven by the AI-derived `handling_guide`
 * and `concerns` plus rule-based invoice/cadence/patterns counters.
 *
 * Cross-module link from M1's CustomerRollupCard lands here pre-filtered to
 * a single customer (?customer=NAME).
 */

import React, { useEffect, useState } from 'react';
import {
	Search,
	Filter,
	Users,
	RefreshCw,
	ChevronDown,
	ChevronRight,
	AlertTriangle,
	CheckCircle2,
	Clock,
	IndianRupee,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	X,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import {
	type CustomerIntelligenceResponse,
	type CustomerIntelligenceItem,
	type RelationshipHealth,
	type SortKey,
} from '../../../mocks/customerIntelligence';
import { CustomerIntelligenceApiService } from '../../../services/customerIntelligenceApi';
import {
	HEALTH_VISUAL,
	ALL_HEALTH,
} from './visualConfig';
import { formatINR, formatINRCompact, formatRelativeContact } from '../follow-up-tracker/utils';

type SortOrder = 'asc' | 'desc';

const CustomerIntelligence: React.FC = () => {
	const [data, setData] = useState<CustomerIntelligenceResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [refreshingAll, setRefreshingAll] = useState(false);

	// Filter state
	const [searchQuery, setSearchQuery] = useState('');
	const [healthFilter, setHealthFilter] = useState<RelationshipHealth[]>([]);
	const [hasConcernsFilter, setHasConcernsFilter] = useState<'all' | 'yes' | 'no'>('all');
	const [minOutstanding, setMinOutstanding] = useState<number | null>(null);
	const [sortKey, setSortKey] = useState<SortKey>('priority');
	const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
	const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

	// Consume ?customer= deep link from Module 1
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const target = params.get('customer');
		if (target) setSearchQuery(target);
	}, []);

	const fetchList = () => {
		setLoading(true);
		setLoadError(null);
		CustomerIntelligenceApiService.list({
			q: searchQuery || undefined,
			health: healthFilter.length > 0 ? healthFilter.join(',') : undefined,
			has_concerns: hasConcernsFilter !== 'all' ? hasConcernsFilter : undefined,
			min_outstanding: minOutstanding ?? undefined,
			sort: sortKey,
			order: sortOrder,
			limit: 50,
		})
			.then(res => {
				setData(res);
				setLoading(false);
			})
			.catch(err => {
				setLoadError(err?.message || 'Failed to load customer intelligence');
				setLoading(false);
			});
	};

	useEffect(() => {
		fetchList();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchQuery, healthFilter, hasConcernsFilter, minOutstanding, sortKey, sortOrder]);

	const handleRefreshAll = async () => {
		if (refreshingAll) return;
		const ok = window.confirm(
			'Refresh ALL customer intelligence? This re-runs the AI pipeline across ~125 customers and takes ~50 seconds.'
		);
		if (!ok) return;
		setRefreshingAll(true);
		try {
			await CustomerIntelligenceApiService.refresh({ concurrency: 50, use_ai: true });
			fetchList();
		} catch (err) {
			setLoadError(
				(err as { message?: string })?.message || 'Refresh failed — see console.'
			);
		} finally {
			setRefreshingAll(false);
		}
	};

	const handleSort = (key: SortKey) => {
		if (sortKey === key) {
			setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
		} else {
			setSortKey(key);
			setSortOrder(key === 'reliability' ? 'asc' : 'desc');
		}
	};

	const clearFilters = () => {
		setSearchQuery('');
		setHealthFilter([]);
		setHasConcernsFilter('all');
		setMinOutstanding(null);
	};

	const hasActiveFilters =
		searchQuery.trim().length > 0 ||
		healthFilter.length > 0 ||
		hasConcernsFilter !== 'all' ||
		minOutstanding !== null;

	const summary = data?.summary;
	const items = data?.items ?? [];

	const sortIcon = (key: SortKey) => {
		if (sortKey !== key) return <ArrowUpDown className='h-3.5 w-3.5 text-gray-400' />;
		return sortOrder === 'asc' ? (
			<ArrowUp className='h-3.5 w-3.5 text-emerald-600' />
		) : (
			<ArrowDown className='h-3.5 w-3.5 text-emerald-600' />
		);
	};

	return (
		<div className='space-y-5 pb-10'>
			{/* Page header */}
			<div className='flex items-start justify-between gap-4 flex-wrap'>
				<div className='flex items-center gap-3'>
					<div className='h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center'>
						<Users className='h-5 w-5 text-emerald-600' />
					</div>
					<div>
						<h1 className='text-2xl font-semibold text-gray-900'>Customer Intelligence</h1>
						<p className='text-sm text-gray-500 mt-0.5'>
							{summary
								? `${summary.customers_total} customers · ranked by priority · ${summary.account_email}`
								: 'Loading…'}
							{summary?.last_refreshed_at && (
								<>
									{' · '}
									<span className='text-gray-400'>
										Last refreshed{' '}
										{formatRelativeContact(
											summary.last_refreshed_at,
											daysSinceIso(summary.last_refreshed_at)
										)}
									</span>
								</>
							)}
						</p>
					</div>
				</div>
				<div className='flex items-center gap-2'>
					<div className='text-xs text-gray-400 inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full'>
						<span
							className={cn(
								'h-1.5 w-1.5 rounded-full',
								import.meta.env.VITE_CUSTOMER_INTEL_USE_MOCK === 'true'
									? 'bg-amber-400 animate-pulse'
									: 'bg-emerald-500'
							)}
						/>
						{import.meta.env.VITE_CUSTOMER_INTEL_USE_MOCK === 'true'
							? 'Mock data'
							: 'Live · /v1/api/customers/intelligence'}
					</div>
					<button
						type='button'
						onClick={handleRefreshAll}
						disabled={refreshingAll}
						className={cn(
							'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors',
							refreshingAll
								? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
								: 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
						)}
					>
						<RefreshCw
							className={cn('h-3.5 w-3.5', refreshingAll && 'animate-spin')}
						/>
						{refreshingAll ? 'Refreshing…' : 'Refresh all'}
					</button>
				</div>
			</div>

			{loadError && (
				<div className='rounded-lg border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-700 flex items-start gap-3'>
					<AlertTriangle className='h-4 w-4 mt-0.5 shrink-0' />
					<div className='flex-1'>
						<div className='font-semibold'>Could not load customer intelligence</div>
						<div className='text-xs text-red-600 mt-0.5'>{loadError}</div>
						<div className='text-[11px] text-red-500 mt-1'>
							Check the backend is up and you have <span className='font-mono'>transitPlan</span>{' '}
							permission. For offline dev, set{' '}
							<span className='font-mono'>VITE_CUSTOMER_INTEL_USE_MOCK=true</span> in .env.
						</div>
					</div>
				</div>
			)}

			{/* Summary stat row */}
			{summary && (
				<div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
					<StatTile
						tone='neutral'
						label='Total customers'
						value={summary.customers_total.toString()}
					/>
					<StatTile
						tone='danger'
						label='At risk'
						value={summary.health_breakdown.at_risk.toString()}
						sub={
							summary.customers_with_disputes > 0
								? `${summary.customers_with_disputes} active disputes`
								: undefined
						}
					/>
					<StatTile
						tone='warning'
						label='Watch'
						value={summary.health_breakdown.watch.toString()}
					/>
					<StatTile
						tone='neutral'
						label='Outstanding (all)'
						value={formatINRCompact(summary.total_outstanding_all)}
						sub={formatINR(summary.total_outstanding_all)}
						highlight
					/>
				</div>
			)}

			{/* Filter bar */}
			<div className='bg-white rounded-xl border border-gray-200 shadow-sm p-3'>
				<div className='flex items-center gap-2 flex-wrap'>
					<div className='relative flex-1 min-w-[220px]'>
						<Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400' />
						<input
							type='text'
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
							placeholder='Search customer…'
							className='w-full pl-8 pr-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400'
						/>
					</div>

					{/* Health filter — pill toggles */}
					<div className='inline-flex items-center gap-1'>
						<Filter className='h-3.5 w-3.5 text-gray-400 mr-0.5' />
						{ALL_HEALTH.map(h => {
							const active = healthFilter.includes(h);
							const v = HEALTH_VISUAL[h];
							return (
								<button
									key={h}
									onClick={() =>
										setHealthFilter(prev =>
											prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]
										)
									}
									className={cn(
										'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-all',
										active
											? v.pill + ' ring-2 ring-offset-1 ring-emerald-300 font-medium'
											: 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
									)}
								>
									<span className={cn('h-1.5 w-1.5 rounded-full', v.dot)} />
									{v.label}
								</button>
							);
						})}
					</div>

					{/* Has concerns */}
					<div className='inline-flex items-center text-xs rounded-md border border-gray-200 overflow-hidden'>
						{(['all', 'yes', 'no'] as const).map(opt => (
							<button
								key={opt}
								onClick={() => setHasConcernsFilter(opt)}
								className={cn(
									'px-2 py-1 transition-colors border-l first:border-l-0 border-gray-200',
									hasConcernsFilter === opt
										? 'bg-emerald-600 text-white'
										: 'bg-white text-gray-600 hover:bg-gray-50'
								)}
							>
								{opt === 'all' ? 'All' : opt === 'yes' ? 'Has concerns' : 'No concerns'}
							</button>
						))}
					</div>

					{/* Min outstanding — quick chip */}
					<button
						onClick={() => setMinOutstanding(minOutstanding === 500000 ? null : 500000)}
						className={cn(
							'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-all',
							minOutstanding === 500000
								? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium ring-2 ring-offset-1 ring-emerald-300'
								: 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
						)}
					>
						<IndianRupee className='h-3 w-3' />
						Over ₹5L
					</button>

					{hasActiveFilters && (
						<button
							onClick={clearFilters}
							className='inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700'
						>
							<X className='h-3 w-3' />
							Clear
						</button>
					)}
				</div>
			</div>

			{/* Table */}
			<section className='bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden'>
				<div className='flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-emerald-50/40 to-white'>
					<div className='flex items-center gap-2 text-sm'>
						<span className='font-semibold text-gray-900'>{items.length}</span>
						<span className='text-gray-500'>
							customer{items.length === 1 ? '' : 's'}
							{data?.pagination?.has_more && ` of ${data.pagination.total}`}
						</span>
					</div>
					<div className='text-xs text-gray-400'>
						Sorted by{' '}
						<span className='text-gray-600 font-medium'>
							{sortKeyLabel(sortKey)}
						</span>{' '}
						{sortOrder === 'desc' ? '↓' : '↑'}
					</div>
				</div>

				{loading ? (
					<TableLoadingState />
				) : items.length === 0 ? (
					<EmptyState onClear={hasActiveFilters ? clearFilters : undefined} />
				) : (
					<div className='overflow-x-auto'>
						<table className='w-full'>
							<thead className='bg-gray-50 border-b border-gray-200'>
								<tr>
									<th className='w-8'></th>
									<th className='text-left px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide w-12'>
										#
									</th>
									<th className='text-left px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide'>
										Customer
									</th>
									<th className='text-left px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide'>
										Health
									</th>
									<SortHeader
										label='Outstanding'
										align='right'
										onClick={() => handleSort('outstanding')}
										icon={sortIcon('outstanding')}
									/>
									<SortHeader
										label='Reliability'
										align='right'
										onClick={() => handleSort('reliability')}
										icon={sortIcon('reliability')}
									/>
									<SortHeader
										label='Overdue'
										align='center'
										onClick={() => handleSort('overdue')}
										icon={sortIcon('overdue')}
									/>
									<SortHeader
										label='Concerns'
										align='center'
										onClick={() => handleSort('concerns')}
										icon={sortIcon('concerns')}
									/>
									<SortHeader
										label='Last contact'
										align='left'
										onClick={() => handleSort('last_contact')}
										icon={sortIcon('last_contact')}
									/>
								</tr>
							</thead>
							<tbody className='divide-y divide-gray-100'>
								{items.map(item => (
									<CustomerRow
										key={item.customer_name}
										item={item}
										expanded={expandedCustomer === item.customer_name}
										onToggle={() =>
											setExpandedCustomer(prev =>
												prev === item.customer_name ? null : item.customer_name
											)
										}
									/>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>
		</div>
	);
};

// ─────────────────────────────────────────────────────────────────────────────
// Customer row
// ─────────────────────────────────────────────────────────────────────────────

interface CustomerRowProps {
	item: CustomerIntelligenceItem;
	expanded: boolean;
	onToggle: () => void;
}

const CustomerRow: React.FC<CustomerRowProps> = ({ item, expanded, onToggle }) => {
	const healthV = HEALTH_VISUAL[item.ai.overall_relationship_health];
	const lastContact = item.cadence.last_contact_at;
	const lastContactDays = daysSinceIso(lastContact);

	return (
		<>
			<tr
				className={cn(
					'transition-colors cursor-pointer hover:bg-gray-50/70 border-l-4',
					healthV.stripe,
					expanded && healthV.bgSoft
				)}
				onClick={onToggle}
			>
				<td className='pl-3 py-3 align-top'>
					{expanded ? (
						<ChevronDown className='h-4 w-4 text-gray-500' />
					) : (
						<ChevronRight className='h-4 w-4 text-gray-400' />
					)}
				</td>
				<td className='px-3 py-3 align-top'>
					<span className='font-mono text-xs font-semibold text-gray-700 tabular-nums'>
						#{item.score.priority_rank}
					</span>
				</td>
				<td className='px-3 py-3 align-top'>
					<div className='text-sm font-semibold text-gray-900 leading-tight line-clamp-1'>
						{item.customer_name}
					</div>
					<div className='text-[11px] text-gray-500 mt-0.5'>
						{item.invoices.count} invoice{item.invoices.count === 1 ? '' : 's'} ·{' '}
						{item.cadence.thread_count} thread{item.cadence.thread_count === 1 ? '' : 's'}
					</div>
				</td>
				<td className='px-3 py-3 align-top'>
					<span
						className={cn(
							'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap',
							healthV.pill
						)}
					>
						{healthV.label}
					</span>
				</td>
				<td className='px-3 py-3 text-right align-top'>
					<div className='text-sm font-semibold text-gray-900 tabular-nums'>
						{formatINRCompact(item.invoices.total_outstanding)}
					</div>
					{item.invoices.total_revenue > 0 && (
						<div className='text-[10px] text-gray-400 mt-0.5'>
							of {formatINRCompact(item.invoices.total_revenue)} lifetime
						</div>
					)}
				</td>
				<td className='px-3 py-3 text-right align-top'>
					<div
						className={cn(
							'text-sm font-semibold tabular-nums',
							item.invoices.payment_reliability_pct >= 80
								? 'text-emerald-700'
								: item.invoices.payment_reliability_pct >= 60
									? 'text-amber-700'
									: 'text-red-700'
						)}
					>
						{item.invoices.payment_reliability_pct.toFixed(0)}%
					</div>
				</td>
				<td className='px-3 py-3 text-center align-top'>
					{item.invoices.overdue > 0 ? (
						<div>
							<div className='text-sm font-semibold text-gray-900 tabular-nums'>
								{item.invoices.overdue}
							</div>
							{item.invoices.oldest_overdue_days > 0 && (
								<div
									className={cn(
										'text-[10px] tabular-nums',
										item.invoices.oldest_overdue_days > 60
											? 'text-red-700'
											: item.invoices.oldest_overdue_days > 30
												? 'text-orange-700'
												: 'text-amber-700'
									)}
								>
									oldest {item.invoices.oldest_overdue_days}d
								</div>
							)}
						</div>
					) : (
						<span className='text-xs text-gray-400'>—</span>
					)}
				</td>
				<td className='px-3 py-3 text-center align-top'>
					{item.ai.concerns_count > 0 ? (
						<span className='inline-flex items-center justify-center min-w-[1.5rem] px-1.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-50 text-amber-800 border-amber-200 tabular-nums'>
							{item.ai.concerns_count}
						</span>
					) : (
						<span className='text-xs text-gray-400'>—</span>
					)}
				</td>
				<td className='px-3 py-3 align-top'>
					{lastContact ? (
						<div className='flex items-center gap-1.5 text-xs text-gray-700'>
							<Clock className='h-3.5 w-3.5 text-gray-400' />
							{formatRelativeContact(lastContact, lastContactDays)}
						</div>
					) : (
						<span className='text-xs text-gray-400 italic'>No contact yet</span>
					)}
				</td>
			</tr>

			{expanded && (
				<tr className='bg-gradient-to-br from-emerald-50/20 to-white border-l-4 border-l-emerald-200'>
					<td colSpan={9} className='px-6 py-5'>
						<ExpandStub item={item} />
					</td>
				</tr>
			)}
		</>
	);
};

/** Step 4 will replace this. For now, a placeholder that proves the wiring works. */
const ExpandStub: React.FC<{ item: CustomerIntelligenceItem }> = ({ item }) => (
	<div className='rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600'>
		<div className='flex items-center gap-2 mb-2 font-semibold text-gray-700'>
			<CheckCircle2 className='h-4 w-4 text-emerald-600' />
			Row expand placeholder — full Facts + Intelligence drawer ships in step 4.
		</div>
		<div className='text-xs text-gray-500 leading-relaxed'>
			Will show: invoice / cadence / patterns counters · key insight banner · concern cards
			with sample quotes and thread deep-links · handling guide (rich / sparse / null
			branches) · {'"new lead priority"'} callout.
		</div>
		<div className='mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs'>
			<KV label='Priority rank' value={`#${item.score.priority_rank}`} />
			<KV label='Concerns' value={item.ai.concerns_count} />
			<KV
				label='Broken commitments'
				value={item.patterns.broken_commitments}
			/>
			<KV label='Active disputes' value={item.patterns.active_disputes} />
		</div>
		{item.ai.key_insight && (
			<div className='mt-3 text-xs italic text-gray-600 border-l-2 border-emerald-200 pl-3'>
				{item.ai.key_insight}
			</div>
		)}
	</div>
);

const KV: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
	<div className='bg-gray-50 rounded p-2'>
		<div className='text-[10px] text-gray-500 uppercase tracking-wide'>{label}</div>
		<div className='text-sm font-semibold text-gray-900 tabular-nums'>{value}</div>
	</div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Small presentational helpers
// ─────────────────────────────────────────────────────────────────────────────

interface StatTileProps {
	tone: 'neutral' | 'danger' | 'warning' | 'success';
	label: string;
	value: string;
	sub?: string;
	highlight?: boolean;
}

const StatTile: React.FC<StatTileProps> = ({ tone, label, value, sub, highlight }) => {
	const toneClasses: Record<StatTileProps['tone'], string> = {
		neutral: 'bg-white border-gray-200',
		danger: 'bg-red-50/60 border-red-100',
		warning: 'bg-amber-50/60 border-amber-100',
		success: 'bg-emerald-50/60 border-emerald-100',
	};
	return (
		<div
			className={cn(
				'rounded-xl border p-3 shadow-sm',
				toneClasses[tone],
				highlight && 'ring-1 ring-emerald-200'
			)}
		>
			<div className='text-[11px] font-medium text-gray-500 uppercase tracking-wide'>
				{label}
			</div>
			<div className='text-xl font-bold text-gray-900 tabular-nums mt-0.5'>{value}</div>
			{sub && <div className='text-[11px] text-gray-500 mt-0.5 truncate'>{sub}</div>}
		</div>
	);
};

interface SortHeaderProps {
	label: string;
	align?: 'left' | 'center' | 'right';
	onClick: () => void;
	icon: React.ReactNode;
}

const SortHeader: React.FC<SortHeaderProps> = ({ label, align = 'left', onClick, icon }) => (
	<th
		className={cn(
			'px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100 select-none',
			align === 'right' && 'text-right',
			align === 'center' && 'text-center'
		)}
		onClick={onClick}
	>
		<span
			className={cn(
				'inline-flex items-center gap-1',
				align === 'right' && 'justify-end',
				align === 'center' && 'justify-center'
			)}
		>
			{label}
			{icon}
		</span>
	</th>
);

const TableLoadingState: React.FC = () => (
	<div className='p-10 flex flex-col items-center justify-center gap-3'>
		<div className='animate-pulse space-y-2 w-full max-w-2xl'>
			{Array.from({ length: 6 }).map((_, i) => (
				<div key={i} className='flex gap-3 items-center'>
					<div className='h-2 w-2 rounded-full bg-gray-200' />
					<div className='h-4 bg-gray-100 rounded flex-1' />
					<div className='h-4 w-20 bg-gray-100 rounded' />
				</div>
			))}
		</div>
		<p className='text-xs text-gray-400 mt-2'>Loading customers…</p>
	</div>
);

const EmptyState: React.FC<{ onClear?: () => void }> = ({ onClear }) => (
	<div className='p-12 text-center'>
		<div className='inline-flex h-12 w-12 rounded-full bg-gray-50 items-center justify-center mb-3'>
			<Users className='h-6 w-6 text-gray-400' />
		</div>
		<h3 className='text-sm font-semibold text-gray-900'>No customers match these filters</h3>
		<p className='text-xs text-gray-500 mt-1'>
			Try clearing one or more filters to see more results.
		</p>
		{onClear && (
			<button
				onClick={onClear}
				className='mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100'
			>
				<X className='h-3.5 w-3.5' />
				Clear all filters
			</button>
		)}
	</div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Local helpers
// ─────────────────────────────────────────────────────────────────────────────

const sortKeyLabel = (key: SortKey): string => {
	const map: Record<SortKey, string> = {
		priority: 'Priority',
		outstanding: 'Outstanding',
		overdue: 'Overdue',
		reliability: 'Reliability',
		thread_count: 'Thread count',
		last_contact: 'Last contact',
		invoice_count: 'Invoice count',
		concerns: 'Concerns',
	};
	return map[key];
};

const daysSinceIso = (iso: string | null): number | null => {
	if (!iso) return null;
	const t = new Date(iso).getTime();
	if (Number.isNaN(t)) return null;
	return Math.floor((Date.now() - t) / 86400000);
};

export default CustomerIntelligence;
