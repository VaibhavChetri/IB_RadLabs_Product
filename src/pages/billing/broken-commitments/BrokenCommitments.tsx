/**
 * Broken Commitments — v2.
 *
 * Promises made in email that were not kept, with the exact AI-quoted
 * evidence. Restructured from the v1 flat list:
 *
 *   - Default view groups commitments under the customer that broke them,
 *     so 47 Sodexo breaks don't repeat the customer header 47 times.
 *   - Date range filter (Last 7/30/90/All) — defaults to 30d so the page
 *     reads as "what's broken right now" not "what's ever been broken."
 *   - Severity stripe per customer derived from (recency × outstanding).
 *   - The quoted promise is the visual hero of every card; everything else
 *     is supporting metadata.
 *   - Resolution filter uses the `kept` field from the AI: still broken,
 *     pending verdict, or all.
 *   - One-click "Open in Gmail" deep link per commitment.
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
	RefreshCw,
	Search,
	AlertCircle,
	ChevronDown,
	ChevronRight,
	ExternalLink,
	X,
	Clock,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import {
	ClientHealthApi,
	type HealthCustomer,
	type HealthThread,
	type Commitment,
} from '../../../services/clientHealthApi';
import { formatINR, formatINRCompact } from '../follow-up-tracker/utils';

// ── Types & helpers ──────────────────────────────────────────────────────────

type DateRange = '7' | '30' | '90' | 'all' | 'custom';

interface CustomDateRange {
	from: string; // YYYY-MM-DD inclusive
	to: string; // YYYY-MM-DD inclusive
}
type ResolutionFilter = 'broken' | 'pending' | 'all';
type PartyFilter = 'all' | 'customer' | 'infinitybox';
type SortMode = 'by_customer' | 'by_recency';

interface CommitmentRow {
	customer: HealthCustomer;
	thread: HealthThread;
	commitment: Commitment;
	/** ms since epoch on thread.last_message_at — used for sorting / filtering. */
	when: number;
}

interface CustomerGroup {
	customer: HealthCustomer;
	rows: CommitmentRow[];
	/** Most recent break in the window — drives sort + severity recency. */
	latestBreakAt: number;
}

const PARTY_LABEL: Record<string, string> = {
	customer: 'Client',
	infinitybox: 'IB',
	both: 'Both',
};

const daysSince = (ms: number): number => Math.floor((Date.now() - ms) / 86400000);

const parseISO = (iso: string | null): number => {
	if (!iso) return 0;
	const t = new Date(iso).getTime();
	return Number.isNaN(t) ? 0 : t;
};

/**
 * Gmail thread deep-link. The follow-up tracker has a backend-built link
 * using rfc822msgid; here we only have the raw Gmail thread id, so we use
 * the search form — Gmail resolves the thread when the id matches.
 */
const gmailDeepLink = (threadId: string): string =>
	`https://mail.google.com/mail/u/0/#search/${encodeURIComponent(threadId)}`;

/**
 * Severity for a customer group: red when recent break + big balance,
 * amber for older or low-value, slate for tail. Stripe colour only — the
 * detail cards inherit nothing from this (each card reads on its own).
 */
const severityForGroup = (g: CustomerGroup): 'red' | 'orange' | 'amber' | 'slate' => {
	const recencyDays = daysSince(g.latestBreakAt);
	const outstanding = g.customer.total_outstanding ?? 0;
	if (recencyDays <= 7 && outstanding >= 1_000_000) return 'red';
	if (recencyDays <= 30 || outstanding >= 500_000) return 'orange';
	if (recencyDays <= 90) return 'amber';
	return 'slate';
};

const STRIPE: Record<ReturnType<typeof severityForGroup>, string> = {
	red: 'border-l-red-500',
	orange: 'border-l-orange-500',
	amber: 'border-l-amber-400',
	slate: 'border-l-slate-300',
};

const fmtDate = (iso: string | null): string => {
	if (!iso) return '—';
	return new Date(iso).toLocaleDateString('en-IN', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	});
};

// ── Page ─────────────────────────────────────────────────────────────────────

const BrokenCommitments: React.FC = () => {
	const [customers, setCustomers] = useState<HealthCustomer[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [dateRange, setDateRange] = useState<DateRange>('30');
	const [customRange, setCustomRange] = useState<CustomDateRange | null>(null);
	const [partyFilter, setPartyFilter] = useState<PartyFilter>('all');
	const [resolutionFilter, setResolutionFilter] = useState<ResolutionFilter>('broken');
	const [search, setSearch] = useState('');
	const [sortMode, setSortMode] = useState<SortMode>('by_customer');
	const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

	const load = useCallback(() => {
		setLoading(true);
		setError(null);
		ClientHealthApi.list({})
			.then(res => setCustomers(res.customers))
			.catch(e => setError(e?.message ?? 'Failed to load'))
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	// Flatten + filter + group
	const {
		rows,
		groups,
		totalAtStake,
		clientsAffected,
		previousPeriodCount,
		weeklyBuckets,
	} = useMemo(() => {
		// 1) Flatten every broken_commitments entry across customers + threads
		const allRows: CommitmentRow[] = [];
		for (const c of customers) {
			for (const t of c.threads) {
				for (const cm of t.broken_commitments) {
					allRows.push({
						customer: c,
						thread: t,
						commitment: cm,
						when: parseISO(t.last_message_at),
					});
				}
			}
		}

		// 2) Resolve the active window into [start, end] ms bounds.
		const now = Date.now();
		let windowStart = 0;
		let windowEnd = now;
		if (dateRange === 'custom' && customRange) {
			windowStart = parseISO(customRange.from) || 0;
			// end of "to" day, inclusive
			windowEnd = (parseISO(customRange.to) || now) + 86400000 - 1;
		} else if (dateRange !== 'all' && dateRange !== 'custom') {
			windowStart = now - Number(dateRange) * 86400000;
		}
		const windowLengthMs = windowEnd - windowStart;
		const prevStart = windowStart - windowLengthMs;

		const q = search.trim().toLowerCase();

		// 3) Apply party/resolution/search filters once, then bucket into
		//    current vs previous period.
		const meetsNonDateFilters = (r: CommitmentRow) => {
			if (partyFilter !== 'all' && r.commitment.by_party !== partyFilter) return false;
			if (resolutionFilter === 'broken' && r.commitment.kept !== 'broken') return false;
			if (resolutionFilter === 'pending' && r.commitment.kept !== 'pending') return false;
			if (
				q &&
				!r.customer.customer_name.toLowerCase().includes(q) &&
				!r.commitment.what.toLowerCase().includes(q) &&
				!r.thread.subject.toLowerCase().includes(q)
			) {
				return false;
			}
			return true;
		};

		const filtered: CommitmentRow[] = [];
		let prevCount = 0;
		for (const r of allRows) {
			if (!meetsNonDateFilters(r)) continue;
			if (r.when >= windowStart && r.when <= windowEnd) {
				filtered.push(r);
			} else if (r.when >= prevStart && r.when < windowStart) {
				prevCount += 1;
			}
		}

		// 4) Group by customer
		const byCustomer = new Map<string, CustomerGroup>();
		for (const r of filtered) {
			const key = r.customer.customer_name;
			const g = byCustomer.get(key);
			if (g) {
				g.rows.push(r);
				if (r.when > g.latestBreakAt) g.latestBreakAt = r.when;
			} else {
				byCustomer.set(key, {
					customer: r.customer,
					rows: [r],
					latestBreakAt: r.when,
				});
			}
		}

		const groupsArr = Array.from(byCustomer.values());
		for (const g of groupsArr) {
			g.rows.sort((a, b) => b.when - a.when);
		}
		groupsArr.sort((a, b) => {
			if (b.latestBreakAt !== a.latestBreakAt) return b.latestBreakAt - a.latestBreakAt;
			return b.rows.length - a.rows.length;
		});

		// 5) Money at stake — sum of unique thread_outstanding values for threads
		//    that have at least one broken commitment in the filtered window.
		const uniqueThreadIds = new Set<string>();
		let atStake = 0;
		for (const r of filtered) {
			const id = r.thread.provider_thread_id;
			if (id && !uniqueThreadIds.has(id)) {
				uniqueThreadIds.add(id);
				atStake += r.thread.thread_outstanding ?? 0;
			}
		}

		// 6) Sparkline: bucket all rows that pass non-date filters into 12 ISO
		//    weeks ending today. Sparkline is FILTER-aware (party/resolution/
		//    search apply) but NOT date-window-aware — that's the whole point.
		const weeks = 12;
		const dayMs = 86400000;
		const todayMidnightUtc = new Date();
		todayMidnightUtc.setUTCHours(0, 0, 0, 0);
		const weekEndMs = todayMidnightUtc.getTime() + dayMs - 1; // end of today, UTC
		const buckets: number[] = new Array(weeks).fill(0);
		for (const r of allRows) {
			if (!meetsNonDateFilters(r)) continue;
			const daysAgo = Math.floor((weekEndMs - r.when) / dayMs);
			if (daysAgo < 0 || daysAgo >= weeks * 7) continue;
			const weekIdx = weeks - 1 - Math.floor(daysAgo / 7); // newest = last bucket
			buckets[weekIdx] += 1;
		}

		return {
			rows: filtered,
			groups: groupsArr,
			totalAtStake: atStake,
			clientsAffected: byCustomer.size,
			previousPeriodCount: prevCount,
			weeklyBuckets: buckets,
		};
	}, [customers, dateRange, customRange, partyFilter, resolutionFilter, search]);

	const flatByRecency = useMemo(() => [...rows].sort((a, b) => b.when - a.when), [rows]);

	const hasActiveFilters =
		dateRange !== '30' ||
		partyFilter !== 'all' ||
		resolutionFilter !== 'broken' ||
		search.trim().length > 0;

	const clearFilters = () => {
		setDateRange('30');
		setCustomRange(null);
		setPartyFilter('all');
		setResolutionFilter('broken');
		setSearch('');
	};

	const dateRangeLabel = (r: DateRange) =>
		r === '7'
			? 'Last 7d'
			: r === '30'
				? 'Last 30d'
				: r === '90'
					? 'Last 90d'
					: r === 'all'
						? 'All time'
						: 'Custom…';

	// Used by the trend arrow — comparison is meaningless for "all time"
	// or when the data has only just started flowing into the previous window.
	const trendEnabled = dateRange !== 'all' && customers.length > 0;

	return (
		<div className='p-6 max-w-6xl mx-auto'>
			{/* Header */}
			<div className='flex items-start justify-between gap-4 flex-wrap mb-5'>
				<div>
					<h1 className='text-xl font-bold text-foreground'>Broken Commitments</h1>
					<p className='text-sm text-foreground-muted mt-1'>
						Promises made in email that were not kept — extracted by AI with exact quoted
						evidence.
					</p>
				</div>
				<button
					onClick={load}
					disabled={loading}
					className='flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-border hover:bg-primary/5 disabled:opacity-50'
				>
					<RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
					Refresh
				</button>
			</div>

			{/* Summary bar + date tabs + sparkline */}
			{!loading && !error && (
				<div className='rounded-xl border border-border bg-background p-4 mb-5'>
					<div className='flex items-baseline justify-between gap-4 flex-wrap'>
						<div className='text-sm flex items-baseline gap-2 flex-wrap'>
							<span className='text-2xl font-bold text-foreground tabular-nums'>
								{rows.length}
							</span>
							<span className='text-foreground-muted'>
								broken {rows.length === 1 ? 'commitment' : 'commitments'}
							</span>
							{trendEnabled && (
								<TrendArrow current={rows.length} previous={previousPeriodCount} />
							)}
							<span className='text-foreground-muted'>·</span>
							<span className='font-semibold text-foreground tabular-nums'>
								{clientsAffected}
							</span>
							<span className='text-foreground-muted'>
								client{clientsAffected === 1 ? '' : 's'} affected
							</span>
							{totalAtStake > 0 && (
								<>
									<span className='text-foreground-muted'>·</span>
									<span
										className='font-semibold text-red-600 tabular-nums'
										title={formatINR(totalAtStake)}
									>
										{formatINRCompact(totalAtStake)}
									</span>
									<span className='text-foreground-muted'>at stake</span>
								</>
							)}
						</div>

						<div className='flex items-center gap-3 flex-wrap'>
							{/* 12-week sparkline */}
							<div
								className='hidden sm:flex items-center gap-2'
								title='Weekly broken commitments, last 12 weeks'
							>
								<span className='text-[10px] uppercase tracking-wide text-foreground-muted'>
									12w trend
								</span>
								<Sparkline values={weeklyBuckets} />
							</div>

							{/* Date tabs (incl. Custom) */}
							<div className='inline-flex items-center text-xs rounded-md border border-border overflow-hidden'>
								{(['7', '30', '90', 'all', 'custom'] as DateRange[]).map(r => (
									<button
										key={r}
										onClick={() => {
											setDateRange(r);
											if (r === 'custom' && !customRange) {
												// Seed with last-30 so the inputs aren't empty.
												const to = new Date();
												const from = new Date(Date.now() - 30 * 86400000);
												setCustomRange({
													from: toISODate(from),
													to: toISODate(to),
												});
											}
										}}
										className={cn(
											'px-3 py-1.5 transition-colors border-l first:border-l-0 border-border',
											dateRange === r
												? 'bg-emerald-600 text-white'
												: 'bg-background text-foreground-muted hover:bg-primary/5'
										)}
									>
										{dateRangeLabel(r)}
									</button>
								))}
							</div>
						</div>
					</div>

					{/* Custom range inputs — only when Custom tab is active */}
					{dateRange === 'custom' && customRange && (
						<div className='mt-3 flex items-center gap-2 flex-wrap text-xs'>
							<span className='text-foreground-muted'>From</span>
							<input
								type='date'
								value={customRange.from}
								max={customRange.to}
								onChange={e =>
									setCustomRange(prev =>
										prev ? { ...prev, from: e.target.value } : prev
									)
								}
								className='px-2 py-1 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-400'
							/>
							<span className='text-foreground-muted'>to</span>
							<input
								type='date'
								value={customRange.to}
								min={customRange.from}
								onChange={e =>
									setCustomRange(prev =>
										prev ? { ...prev, to: e.target.value } : prev
									)
								}
								className='px-2 py-1 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-400'
							/>
							<span className='text-foreground-muted ml-1'>
								{customRangeDays(customRange)} day window
							</span>
						</div>
					)}
				</div>
			)}

			{/* Filter row */}
			<div className='flex items-center gap-2 mb-5 flex-wrap'>
				<div className='relative flex-1 min-w-[220px]'>
					<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted' />
					<input
						type='text'
						placeholder='Search client, subject, or quote…'
						value={search}
						onChange={e => setSearch(e.target.value)}
						className='w-full pl-9 pr-3 py-1.5 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-emerald-400'
					/>
				</div>

				{/* Party */}
				<div className='inline-flex items-center text-xs rounded-md border border-border overflow-hidden'>
					{(
						[
							{ key: 'all', label: 'All parties' },
							{ key: 'customer', label: 'By client' },
							{ key: 'infinitybox', label: 'By IB' },
						] as Array<{ key: PartyFilter; label: string }>
					).map(opt => (
						<button
							key={opt.key}
							onClick={() => setPartyFilter(opt.key)}
							className={cn(
								'px-2.5 py-1.5 transition-colors border-l first:border-l-0 border-border',
								partyFilter === opt.key
									? 'bg-emerald-600 text-white'
									: 'bg-background text-foreground-muted hover:bg-primary/5'
							)}
						>
							{opt.label}
						</button>
					))}
				</div>

				{/* Resolution */}
				<div className='inline-flex items-center text-xs rounded-md border border-border overflow-hidden'>
					{(
						[
							{ key: 'broken', label: 'Still broken' },
							{ key: 'pending', label: 'Pending' },
							{ key: 'all', label: 'All' },
						] as Array<{ key: ResolutionFilter; label: string }>
					).map(opt => (
						<button
							key={opt.key}
							onClick={() => setResolutionFilter(opt.key)}
							className={cn(
								'px-2.5 py-1.5 transition-colors border-l first:border-l-0 border-border',
								resolutionFilter === opt.key
									? 'bg-emerald-600 text-white'
									: 'bg-background text-foreground-muted hover:bg-primary/5'
							)}
						>
							{opt.label}
						</button>
					))}
				</div>

				{/* Sort */}
				<div className='inline-flex items-center text-xs rounded-md border border-border overflow-hidden'>
					{(
						[
							{ key: 'by_customer', label: 'Group by client' },
							{ key: 'by_recency', label: 'Most recent' },
						] as Array<{ key: SortMode; label: string }>
					).map(opt => (
						<button
							key={opt.key}
							onClick={() => setSortMode(opt.key)}
							className={cn(
								'px-2.5 py-1.5 transition-colors border-l first:border-l-0 border-border',
								sortMode === opt.key
									? 'bg-emerald-600 text-white'
									: 'bg-background text-foreground-muted hover:bg-primary/5'
							)}
						>
							{opt.label}
						</button>
					))}
				</div>

				{hasActiveFilters && (
					<button
						onClick={clearFilters}
						className='inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700'
					>
						<X className='h-3 w-3' />
						Reset
					</button>
				)}
			</div>

			{/* Loading / Error */}
			{loading && (
				<div className='flex items-center justify-center py-20 text-foreground-muted'>
					<RefreshCw className='h-5 w-5 animate-spin mr-2' /> Loading…
				</div>
			)}
			{error && !loading && (
				<div className='rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700'>
					{error}
				</div>
			)}

			{/* Empty state */}
			{!loading && !error && rows.length === 0 && (
				<EmptyState
					dateRange={dateRange}
					hasFilters={hasActiveFilters}
					onClear={clearFilters}
				/>
			)}

			{/* Body */}
			{!loading && !error && rows.length > 0 && (
				<>
					{sortMode === 'by_customer' ? (
						<div className='space-y-2'>
							{groups.map(g => (
								<CustomerGroupBlock
									key={g.customer.customer_name}
									group={g}
									expanded={expandedCustomer === g.customer.customer_name}
									onToggle={() =>
										setExpandedCustomer(prev =>
											prev === g.customer.customer_name ? null : g.customer.customer_name
										)
									}
								/>
							))}
						</div>
					) : (
						<div className='space-y-2'>
							{flatByRecency.map((r, i) => (
								<FlatCommitmentCard
									key={`${r.thread.provider_thread_id}-${i}`}
									row={r}
								/>
							))}
						</div>
					)}
					<p className='text-xs text-foreground-muted mt-4 text-right'>
						{sortMode === 'by_customer'
							? `${groups.length} client${groups.length === 1 ? '' : 's'} · ${rows.length} broken ${
									rows.length === 1 ? 'commitment' : 'commitments'
								}`
							: `${rows.length} broken ${rows.length === 1 ? 'commitment' : 'commitments'}`}
					</p>
				</>
			)}
		</div>
	);
};

// ── Customer group (collapsed by default; click to expand) ──────────────────

const CustomerGroupBlock: React.FC<{
	group: CustomerGroup;
	expanded: boolean;
	onToggle: () => void;
}> = ({ group, expanded, onToggle }) => {
	const sev = severityForGroup(group);
	const stripe = STRIPE[sev];
	const recencyDays = daysSince(group.latestBreakAt);
	const COLLAPSED_LIMIT = 5;
	const [showAll, setShowAll] = useState(false);
	const visible = showAll ? group.rows : group.rows.slice(0, COLLAPSED_LIMIT);
	const hidden = group.rows.length - visible.length;

	return (
		<div
			className={cn(
				'rounded-xl border border-border bg-background overflow-hidden border-l-4',
				stripe
			)}
		>
			<button
				type='button'
				onClick={onToggle}
				className='w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-primary/5 transition-colors text-left'
			>
				<div className='flex items-center gap-2 min-w-0'>
					{expanded ? (
						<ChevronDown className='h-4 w-4 text-foreground-muted shrink-0' />
					) : (
						<ChevronRight className='h-4 w-4 text-foreground-muted shrink-0' />
					)}
					<AlertCircle
						className={cn(
							'h-4 w-4 shrink-0',
							sev === 'red'
								? 'text-red-600'
								: sev === 'orange'
									? 'text-orange-600'
									: sev === 'amber'
										? 'text-amber-600'
										: 'text-slate-400'
						)}
					/>
					<span className='font-semibold text-sm text-foreground truncate'>
						{group.customer.customer_name}
					</span>
					<RepeatOffenderBadge
						count={
							group.customer.broken_commitment_count ?? group.rows.length
						}
					/>
				</div>
				<div className='flex items-center gap-3 text-xs text-foreground-muted shrink-0'>
					<span className='tabular-nums'>
						<span className='font-semibold text-foreground'>{group.rows.length}</span> broken
					</span>
					{group.customer.total_outstanding > 0 && (
						<>
							<span>·</span>
							<span
								className='font-semibold text-red-600 tabular-nums'
								title={formatINR(group.customer.total_outstanding)}
							>
								{formatINRCompact(group.customer.total_outstanding)} outstanding
							</span>
						</>
					)}
					<span>·</span>
					<span>
						last {recencyDays === 0 ? 'today' : `${recencyDays}d ago`}
					</span>
				</div>
			</button>

			{expanded && (
				<div className='border-t border-border bg-primary/[0.02] px-4 py-3 space-y-2'>
					{visible.map((r, i) => (
						<CommitmentCard key={`${r.thread.provider_thread_id}-${i}`} row={r} />
					))}
					{hidden > 0 && (
						<button
							onClick={() => setShowAll(true)}
							className='text-xs text-emerald-600 hover:text-emerald-700 underline-offset-2 hover:underline'
						>
							+ {hidden} older — show all
						</button>
					)}
					{showAll && group.rows.length > COLLAPSED_LIMIT && (
						<button
							onClick={() => setShowAll(false)}
							className='text-xs text-foreground-muted hover:text-foreground'
						>
							Show less
						</button>
					)}
				</div>
			)}
		</div>
	);
};

// ── Individual commitment card (quote-as-hero) ──────────────────────────────

const CommitmentCard: React.FC<{ row: CommitmentRow }> = ({ row }) => {
	const recency = daysSince(row.when);
	const party = PARTY_LABEL[row.commitment.by_party] ?? row.commitment.by_party;
	const isPending = row.commitment.kept === 'pending';

	return (
		<div
			className={cn(
				'rounded-lg border bg-background p-3',
				isPending ? 'border-amber-200 bg-amber-50/30' : 'border-orange-200'
			)}
		>
			{/* Quote first — the visual hero */}
			<blockquote
				className={cn(
					'text-sm leading-relaxed font-medium border-l-2 pl-3 mb-2',
					isPending
						? 'border-amber-400 text-amber-900'
						: 'border-orange-400 text-gray-800'
				)}
			>
				{'"'}{row.commitment.what}{'"'}
			</blockquote>

			{/* Meta row */}
			<div className='flex items-center justify-between gap-3 flex-wrap text-xs'>
				<div className='flex items-center gap-2 flex-wrap text-foreground-muted'>
					<span
						className={cn(
							'inline-flex items-center px-1.5 py-0.5 rounded-full border text-[10px] font-semibold whitespace-nowrap',
							isPending
								? 'bg-amber-50 text-amber-800 border-amber-200'
								: 'bg-orange-50 text-orange-800 border-orange-200'
						)}
					>
						{isPending ? '⏳ Pending' : '✗ Broken'} by {party}
					</span>
					{row.commitment.deadline_text && (
						<span className='text-foreground-muted'>
							Promised: <span className='text-foreground'>{row.commitment.deadline_text}</span>
						</span>
					)}
					<span className='inline-flex items-center gap-1'>
						<Clock className='h-3 w-3' />
						{recency === 0 ? 'today' : `${recency}d ago`}
					</span>
				</div>

				<a
					href={gmailDeepLink(row.thread.provider_thread_id)}
					target='_blank'
					rel='noopener noreferrer'
					onClick={e => e.stopPropagation()}
					className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors whitespace-nowrap'
				>
					<ExternalLink className='h-3 w-3' />
					Open in Gmail
				</a>
			</div>

			{/* Thread subject + invoice numbers (smaller, supporting) */}
			<div className='mt-2 pt-2 border-t border-dashed border-border/60 flex items-center justify-between gap-3 flex-wrap text-[11px] text-foreground-muted'>
				<span className='truncate min-w-0'>
					Thread: <span className='text-foreground'>{row.thread.subject}</span>
				</span>
				<div className='flex items-center gap-2 shrink-0'>
					{row.thread.invoice_numbers && (
						<span className='font-mono text-[10px] text-foreground'>
							{row.thread.invoice_numbers}
						</span>
					)}
					<span>{fmtDate(row.thread.last_message_at)}</span>
				</div>
			</div>
		</div>
	);
};

// ── Flat-by-recency card (for the "Most recent" sort mode) ──────────────────

const FlatCommitmentCard: React.FC<{ row: CommitmentRow }> = ({ row }) => {
	const recency = daysSince(row.when);
	const party = PARTY_LABEL[row.commitment.by_party] ?? row.commitment.by_party;
	const isPending = row.commitment.kept === 'pending';
	const stripeSev = recency <= 7 ? 'red' : recency <= 30 ? 'orange' : recency <= 90 ? 'amber' : 'slate';

	return (
		<div
			className={cn(
				'rounded-xl border border-border bg-background p-3 border-l-4',
				STRIPE[stripeSev]
			)}
		>
			<div className='flex items-baseline justify-between gap-2 mb-1.5'>
				<span className='font-semibold text-sm text-foreground truncate'>
					{row.customer.customer_name}
				</span>
				<span className='text-[11px] text-foreground-muted whitespace-nowrap inline-flex items-center gap-1'>
					<Clock className='h-3 w-3' />
					{recency === 0 ? 'today' : `${recency}d ago`}
				</span>
			</div>

			<blockquote
				className={cn(
					'text-sm leading-relaxed font-medium border-l-2 pl-3 mb-2',
					isPending
						? 'border-amber-400 text-amber-900'
						: 'border-orange-400 text-gray-800'
				)}
			>
				{'"'}{row.commitment.what}{'"'}
			</blockquote>

			<div className='flex items-center justify-between gap-3 flex-wrap text-xs'>
				<div className='flex items-center gap-2 flex-wrap text-foreground-muted'>
					<span
						className={cn(
							'inline-flex items-center px-1.5 py-0.5 rounded-full border text-[10px] font-semibold whitespace-nowrap',
							isPending
								? 'bg-amber-50 text-amber-800 border-amber-200'
								: 'bg-orange-50 text-orange-800 border-orange-200'
						)}
					>
						{isPending ? '⏳ Pending' : '✗ Broken'} by {party}
					</span>
					{row.commitment.deadline_text && (
						<span>
							Promised: <span className='text-foreground'>{row.commitment.deadline_text}</span>
						</span>
					)}
					<span className='text-foreground-muted truncate min-w-0'>
						· {row.thread.subject}
					</span>
				</div>
				<a
					href={gmailDeepLink(row.thread.provider_thread_id)}
					target='_blank'
					rel='noopener noreferrer'
					className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors whitespace-nowrap'
				>
					<ExternalLink className='h-3 w-3' />
					Open in Gmail
				</a>
			</div>
		</div>
	);
};

// ── Empty state ─────────────────────────────────────────────────────────────

const EmptyState: React.FC<{
	dateRange: DateRange;
	hasFilters: boolean;
	onClear: () => void;
}> = ({ dateRange, hasFilters, onClear }) => {
	const positive = !hasFilters && dateRange !== 'all';
	const headline = positive
		? dateRange === '7'
			? 'No broken promises in the last 7 days.'
			: dateRange === '30'
				? 'No broken promises in the last 30 days.'
				: dateRange === '90'
					? 'No broken promises in the last 90 days.'
					: 'No broken promises in this window.'
		: 'No matches for these filters.';
	const sub = positive
		? dateRange === '7'
			? 'Quiet week — every promise this far has held.'
			: dateRange === '30'
				? 'Clean month so far. Worth a small celebration.'
				: dateRange === '90'
					? "Three quiet months. That's rare — well done."
					: 'Encouraging.'
		: 'Try widening the date range or clearing a filter.';
	return (
		<div className='text-center py-16'>
			<div className='inline-flex h-12 w-12 rounded-full bg-emerald-50 items-center justify-center mb-3'>
				<AlertCircle className='h-6 w-6 text-emerald-600' />
			</div>
			<h3 className='text-sm font-semibold text-foreground'>{headline}</h3>
			<p className='text-xs text-foreground-muted mt-1'>{sub}</p>
			{hasFilters && (
				<button
					onClick={onClear}
					className='mt-3 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100'
				>
					<X className='h-3 w-3' />
					Reset filters
				</button>
			)}
		</div>
	);
};

// ── Trend arrow (vs previous equal-length period) ──────────────────────────

const TrendArrow: React.FC<{ current: number; previous: number }> = ({ current, previous }) => {
	// If the previous window has no data we have nothing to compare against —
	// hide the arrow rather than fake a "+100%" jump from zero.
	if (previous === 0 && current === 0) return null;
	if (previous === 0) {
		return (
			<span
				className='inline-flex items-center gap-1 text-[11px] text-foreground-muted'
				title='Previous window had no data — comparison not meaningful'
			>
				· new in this window
			</span>
		);
	}
	const delta = current - previous;
	const pct = (delta / previous) * 100;
	// Treat ±10% as essentially flat so the arrow doesn't twitch on small swings.
	const flat = Math.abs(pct) < 10;
	const direction: 'up' | 'down' | 'flat' = flat ? 'flat' : pct > 0 ? 'up' : 'down';
	// "Up" (more breaks) is bad — colour it red. Down is good — green.
	const palette =
		direction === 'up'
			? { arrow: '↗', cls: 'text-red-600' }
			: direction === 'down'
				? { arrow: '↘', cls: 'text-emerald-600' }
				: { arrow: '→', cls: 'text-foreground-muted' };
	return (
		<span
			className={cn('inline-flex items-center gap-1 text-[11px] font-medium', palette.cls)}
			title={`Previous equal-length window: ${previous} ${
				previous === 1 ? 'commitment' : 'commitments'
			}`}
		>
			{palette.arrow}{' '}
			{direction === 'flat'
				? 'flat vs prev period'
				: `${direction === 'down' ? 'down' : 'up'} from ${previous}`}
		</span>
	);
};

// ── 12-week sparkline (inline SVG) ─────────────────────────────────────────

const Sparkline: React.FC<{ values: number[] }> = ({ values }) => {
	const max = Math.max(1, ...values);
	const width = 96;
	const height = 22;
	const barGap = 1;
	const barWidth = (width - barGap * (values.length - 1)) / values.length;

	return (
		<svg
			width={width}
			height={height}
			viewBox={`0 0 ${width} ${height}`}
			aria-label='Weekly broken commitments, last 12 weeks'
			role='img'
		>
			{values.map((v, i) => {
				const h = Math.max(v === 0 ? 1 : 2, (v / max) * (height - 2));
				const x = i * (barWidth + barGap);
				const y = height - h;
				// Most recent (rightmost) bar gets the warmer colour to draw the eye.
				const isRecent = i >= values.length - 2;
				const fill = v === 0 ? '#e5e7eb' : isRecent ? '#ea580c' : '#fbbf24';
				return (
					<rect key={i} x={x} y={y} width={barWidth} height={h} fill={fill} rx={1}>
						<title>
							{`Week -${values.length - 1 - i}: ${v} ${v === 1 ? 'break' : 'breaks'}`}
						</title>
					</rect>
				);
			})}
		</svg>
	);
};

// ── Repeat-offender badge ──────────────────────────────────────────────────

const REPEAT_OFFENDER_THRESHOLD = 5;

const RepeatOffenderBadge: React.FC<{ count: number }> = ({ count }) => {
	if (count < REPEAT_OFFENDER_THRESHOLD) return null;
	return (
		<span
			title={`${count} broken commitments across the loaded data — pattern, not incident.`}
			className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border bg-slate-100 text-slate-700 border-slate-300'
		>
			⚠ Frequent breaker
		</span>
	);
};

// ── Date helpers (custom range) ────────────────────────────────────────────

const toISODate = (d: Date): string => {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
};

const customRangeDays = (r: CustomDateRange): number => {
	const from = new Date(r.from).getTime();
	const to = new Date(r.to).getTime();
	if (Number.isNaN(from) || Number.isNaN(to) || to < from) return 0;
	return Math.floor((to - from) / 86400000) + 1;
};

export default BrokenCommitments;
