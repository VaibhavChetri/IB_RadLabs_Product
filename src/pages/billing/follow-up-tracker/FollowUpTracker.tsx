/**
 * Smart Follow-Up Tracker — Module 1 (read-only)
 *
 * Single-pane dashboard for Swati (accounts) showing every invoice in the
 * 30-day window side-by-side with its email conversation status and a
 * coverage class indicating where the invoice sits in our tracking pipeline.
 *
 * Read-only by design — composing replies (M6), auto-followups (M3/4), and
 * inline edits live in later modules and must not appear here.
 *
 * Data source is mock today; swap `fetchFollowUpData` for the live axios call
 * when the backend ships — the row shape must not change.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
	Search,
	ExternalLink,
	ChevronDown,
	ChevronRight,
	Mail,
	Users,
	Inbox,
	Filter,
	X,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	CheckCircle2,
	MessageCircle,
	AlertTriangle,
	FileWarning,
	Send,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import {
	type FollowUpItem,
	type FollowUpResponse,
	type ThreadStatus,
	type Priority,
	type CoverageClass,
	type InvoiceStatus,
	type ZohoEmailEvent,
	type CustomerRollup,
	type BallInCourt,
} from '../../../mocks/followUpTracker';
import { EmailFollowUpApiService } from '../../../services/emailFollowUpApi';
import { CustomerRollupCard } from './CustomerRollupCard';
import {
	BallInCourtPill,
	RiskChips,
	DocumentsBlock,
	ActionItemsList,
	CommitmentsList,
	RiskSignalsList,
	PositiveSignalsList,
	PaymentPredictionTile,
} from './AISignals';
import {
	THREAD_STATUS_VISUAL,
	PRIORITY_VISUAL,
	COVERAGE_VISUAL,
	INVOICE_STATUS_VISUAL,
	BALL_IN_COURT_VISUAL,
	ALL_THREAD_STATUSES,
	ALL_PRIORITIES,
	ALL_COVERAGE_CLASSES,
	ALL_INVOICE_STATUSES,
	ALL_BALL_IN_COURT,
} from './statusConfig';
import {
	formatINR,
	formatINRCompact,
	formatDate,
	formatRelativeContact,
	formatDateTime,
	pluralize,
	extractInvoiceNumbers,
} from './utils';
import { CoverageBar } from './CoverageBar';

type DaysRange = 'all' | '7' | '15' | '30';
type SortKey = 'days_overdue' | 'amount' | 'days_since_last_contact';
type SortOrder = 'asc' | 'desc';

// ── Window helpers ──────────────────────────────────────────────────────────
// Date inputs need stable string IDs (no timezone drift) — toDateInputValue
// always returns the user's local YYYY-MM-DD, which is what <input type='date'>
// stores and what the backend expects.
const toDateInputValue = (d: Date) => {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
};
const daysAgo = (n: number) => {
	const d = new Date();
	d.setDate(d.getDate() - n);
	return toDateInputValue(d);
};
const today = () => toDateInputValue(new Date());
const startOfThisMonth = () => {
	const d = new Date();
	d.setDate(1);
	return toDateInputValue(d);
};

type DatePresetId = 'last7' | 'last30' | 'thisMonth' | 'last90' | 'ytd' | 'custom';

const DATE_PRESETS: { id: Exclude<DatePresetId, 'custom'>; label: string; from: () => string; to: () => string }[] = [
	{ id: 'last7',     label: 'Last 7 days',  from: () => daysAgo(7),   to: today },
	{ id: 'last30',    label: 'Last 30 days', from: () => daysAgo(30),  to: today },
	{ id: 'thisMonth', label: 'This month',   from: startOfThisMonth,   to: today },
	{ id: 'last90',    label: 'Last 90 days', from: () => daysAgo(90),  to: today },
	{ id: 'ytd',       label: 'All this year', from: () => `${new Date().getFullYear()}-01-01`, to: today },
];

const PAGE_SIZES = [50, 100, 200];

const FollowUpTracker: React.FC = () => {
	const [data, setData] = useState<FollowUpResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);

	// Filter state
	const [coverageFilter, setCoverageFilter] = useState<CoverageClass[]>([]);
	const [statusFilter, setStatusFilter] = useState<ThreadStatus[]>([]);
	const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<InvoiceStatus[]>([]);
	const [priorityFilter, setPriorityFilter] = useState<Priority[]>([]);
	const [ballInCourtFilter, setBallInCourtFilter] = useState<BallInCourt[]>([]);
	const [brokenPromisesOnly, setBrokenPromisesOnly] = useState(false);
	const [customerQuery, setCustomerQuery] = useState('');
	const [daysRange, setDaysRange] = useState<DaysRange>('all');

	// Sort + expand state
	const [sortKey, setSortKey] = useState<SortKey>('days_overdue');
	const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
	const [expandedId, setExpandedId] = useState<string | null>(null);

	// Window + pagination state (drives the API call). Default = last 30 days
	// matches the old behaviour. Switching presets or editing the date inputs
	// re-fetches.
	const [dateFrom, setDateFrom] = useState<string>(daysAgo(30));
	const [dateTo, setDateTo] = useState<string>(today());
	const [datePreset, setDatePreset] = useState<DatePresetId>('last30');
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [pageSize, setPageSize] = useState<number>(100);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setLoadError(null);
		EmailFollowUpApiService.listInvoiceThreads({
			from: dateFrom,
			to: dateTo,
			page: currentPage,
			limit: pageSize,
		})
			.then(res => {
				if (!cancelled) {
					setData(res);
					setLoading(false);
				}
			})
			.catch(err => {
				if (!cancelled) {
					setLoadError(err?.message || 'Failed to load follow-up data');
					setLoading(false);
				}
			});
		return () => {
			cancelled = true;
		};
	}, [dateFrom, dateTo, currentPage, pageSize]);

	// Whenever the date window changes, snap back to page 1 — otherwise the
	// UI can ask for "page 4 of 47" after switching to "Last 7 days" which
	// might only have 2 pages.
	useEffect(() => {
		setCurrentPage(1);
	}, [dateFrom, dateTo, pageSize]);

	const applyDatePreset = (id: Exclude<DatePresetId, 'custom'>) => {
		const preset = DATE_PRESETS.find(p => p.id === id);
		if (!preset) return;
		setDatePreset(id);
		setDateFrom(preset.from());
		setDateTo(preset.to());
	};

	const onCustomDateChange = (which: 'from' | 'to', value: string) => {
		setDatePreset('custom');
		if (which === 'from') setDateFrom(value);
		else setDateTo(value);
	};

	// Stabilise the items[] reference across renders so the useMemo hooks
	// below don't keep recomputing when `data` itself hasn't changed. The
	// `data?.items ?? []` expression produced a new array literal every render.
	const items = useMemo(() => data?.items ?? [], [data]);
	const summary = data?.summary;

	// Customer name → rollup. Built once per response. Keyed by lower-case name
	// so trivial casing diffs between items[] and customer_rollups[] don't miss.
	const rollupByCustomer = useMemo(() => {
		const map = new Map<string, CustomerRollup>();
		(data?.customer_rollups ?? []).forEach(r => {
			map.set(r.customer_name.toLowerCase(), r);
		});
		return map;
	}, [data]);

	// Invoice numbers loaded in the current window — chips for invoices outside
	// this set get rendered disabled because the table can't scroll to them.
	const visibleInvoiceNumbers = useMemo(
		() => new Set(items.map(i => i.invoice.invoice_number)),
		[items]
	);

	/**
	 * Lookup of full item by invoice_number for the loaded window. Used by the
	 * rollup chip strip to prioritise overdue/disputed chips above merely-visible
	 * ones when sorting (and to gracefully bucket out-of-window chips last).
	 */
	const visibleItemsByNumber = useMemo(() => {
		const m = new Map<string, FollowUpItem>();
		for (const it of items) m.set(it.invoice.invoice_number, it);
		return m;
	}, [items]);

	/**
	 * For each row, the set of OTHER invoice numbers that belong to the same
	 * conversation — derived two ways:
	 *   1) same `thread.provider_thread_id` (Gmail thread siblings)
	 *   2) invoice numbers mentioned by name in the AI summary / next_action /
	 *      action items / commitments of the row being viewed
	 *
	 * Lets the customer-rollup chip strip default to "this conversation" rather
	 * than dumping every invoice the customer ever raised.
	 */
	const relatedByInvoiceNumber = useMemo(() => {
		// Bucket invoices by thread id once.
		const byThread = new Map<string, Set<string>>();
		for (const it of items) {
			const tid = it.thread?.provider_thread_id;
			if (!tid) continue;
			if (!byThread.has(tid)) byThread.set(tid, new Set());
			byThread.get(tid)!.add(it.invoice.invoice_number);
		}

		const result = new Map<string, Set<string>>();
		for (const it of items) {
			const related = new Set<string>();
			// Self stays in the set so the toggle's count matches what the chip
			// strip actually renders (incl. the highlighted "you are here" chip).
			related.add(it.invoice.invoice_number);

			const tid = it.thread?.provider_thread_id;
			if (tid && byThread.has(tid)) {
				byThread.get(tid)!.forEach(n => related.add(n));
			}

			if (it.ai) {
				const mentioned = extractInvoiceNumbers(
					it.ai.summary_short,
					it.ai.summary_long,
					it.ai.next_action,
					...(it.ai.action_items ?? []).map(a => a.description),
					...(it.ai.commitments ?? []).map(c => c.what)
				);
				mentioned.forEach(n => related.add(n));
			}

			result.set(it.invoice.invoice_number, related);
		}
		return result;
	}, [items]);

	/**
	 * Overdue stats. Prefer the new `summary.status_breakdown.overdue` from
	 * backend (window-wide, page-independent) and fall back to items[] only on
	 * older backend builds that don't emit the field.
	 */
	const overdueStats = useMemo(() => {
		const sb = summary?.status_breakdown?.overdue;
		if (sb) {
			return { count: sb.count, balance: sb.balance, oldestDays: sb.oldest_days };
		}
		let count = 0;
		let balance = 0;
		let oldestDays = 0;
		for (const it of items) {
			if (it.invoice.status === 'overdue') {
				count++;
				balance += it.invoice.balance;
				if (it.invoice.days_overdue > oldestDays) {
					oldestDays = it.invoice.days_overdue;
				}
			}
		}
		return { count, balance, oldestDays };
	}, [summary, items]);

	// Jump-to-invoice from a customer-rollup chip: expand that row and scroll
	// it into view. We expand BEFORE scrolling so the expanded panel becomes the
	// scroll target — feels less jumpy than scrolling first then growing the row.
	const jumpToInvoice = (invoiceNumber: string) => {
		if (!visibleInvoiceNumbers.has(invoiceNumber)) return;
		const target = items.find(i => i.invoice.invoice_number === invoiceNumber);
		if (!target) return;
		setExpandedId(target.invoice.zoho_invoice_id);
		// Defer to next frame so the expanded panel has rendered before we scroll.
		requestAnimationFrame(() => {
			const el = document.getElementById(`fu-row-${target.invoice.zoho_invoice_id}`);
			el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		});
	};

	// Apply filters then sort
	const filteredRows = useMemo(() => {
		let result = items;

		if (coverageFilter.length > 0) {
			result = result.filter(r => coverageFilter.includes(r.coverage_class));
		}
		if (statusFilter.length > 0) {
			result = result.filter(
				r => r.ai && statusFilter.includes(r.ai.current_status)
			);
		}
		if (invoiceStatusFilter.length > 0) {
			result = result.filter(r => invoiceStatusFilter.includes(r.invoice.status));
		}
		if (priorityFilter.length > 0) {
			result = result.filter(r => r.ai && priorityFilter.includes(r.ai.priority));
		}
		if (ballInCourtFilter.length > 0) {
			result = result.filter(
				r => r.ai?.ball_in_court && ballInCourtFilter.includes(r.ai.ball_in_court)
			);
		}
		if (brokenPromisesOnly) {
			result = result.filter(r =>
				(r.ai?.commitments ?? []).some(c => c.kept === 'broken')
			);
		}
		if (customerQuery.trim()) {
			const q = customerQuery.trim().toLowerCase();
			result = result.filter(r => r.invoice.customer_name.toLowerCase().includes(q));
		}
		if (daysRange !== 'all') {
			const maxDays = Number(daysRange);
			result = result.filter(r => {
				const d = r.thread?.days_since_last_contact;
				return d !== undefined && d !== null && d <= maxDays;
			});
		}

		const sorted = [...result].sort((a, b) => {
			let av = 0;
			let bv = 0;
			if (sortKey === 'days_overdue') {
				av = a.invoice.days_overdue;
				bv = b.invoice.days_overdue;
			} else if (sortKey === 'amount') {
				av = a.invoice.amount;
				bv = b.invoice.amount;
			} else if (sortKey === 'days_since_last_contact') {
				const an = a.thread?.days_since_last_contact ?? null;
				const bn = b.thread?.days_since_last_contact ?? null;
				if (an === null && bn === null) return 0;
				if (an === null) return 1;
				if (bn === null) return -1;
				av = an;
				bv = bn;
			}
			return sortOrder === 'asc' ? av - bv : bv - av;
		});

		return sorted;
	}, [
		items,
		coverageFilter,
		statusFilter,
		invoiceStatusFilter,
		priorityFilter,
		ballInCourtFilter,
		brokenPromisesOnly,
		customerQuery,
		daysRange,
		sortKey,
		sortOrder,
	]);

	const toggleArrayValue = <T,>(
		setter: React.Dispatch<React.SetStateAction<T[]>>,
		value: T
	) => {
		setter(prev =>
			prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
		);
	};

	const handleSort = (key: SortKey) => {
		if (sortKey === key) {
			setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
		} else {
			setSortKey(key);
			setSortOrder('desc');
		}
	};

	const clearFilters = () => {
		setCoverageFilter([]);
		setStatusFilter([]);
		setInvoiceStatusFilter([]);
		setPriorityFilter([]);
		setBallInCourtFilter([]);
		setBrokenPromisesOnly(false);
		setCustomerQuery('');
		setDaysRange('all');
	};

	const hasActiveFilters =
		coverageFilter.length > 0 ||
		statusFilter.length > 0 ||
		invoiceStatusFilter.length > 0 ||
		priorityFilter.length > 0 ||
		ballInCourtFilter.length > 0 ||
		brokenPromisesOnly ||
		customerQuery.trim().length > 0 ||
		daysRange !== 'all';

	const sortIcon = (key: SortKey) => {
		if (sortKey !== key) return <ArrowUpDown className='h-3.5 w-3.5 text-gray-400' />;
		return sortOrder === 'asc' ? (
			<ArrowUp className='h-3.5 w-3.5 text-emerald-600' />
		) : (
			<ArrowDown className='h-3.5 w-3.5 text-emerald-600' />
		);
	};

	return (
		<div className='space-y-6 pb-10'>
			{/* Page header */}
			<div className='flex items-start justify-between flex-wrap gap-4'>
				<div className='flex items-center gap-3'>
					<div className='h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center'>
						<Inbox className='h-5 w-5 text-emerald-600' />
					</div>
					<div>
						<h1 className='text-2xl font-semibold text-gray-900'>
							Smart Follow-Up Tracker
						</h1>
						<p className='text-sm text-gray-500 mt-0.5'>
							{summary
								? (summary.window
										? `${formatDate(summary.window.from)} → ${formatDate(summary.window.to)}`
										: `${summary.window_days}-day window since ${formatDate(summary.since_date)}`)
								: 'Loading…'}
							{' · '}
							<span className='font-medium text-gray-700'>
								{summary?.account_email || 'swati@getinfinitybox.com'}
							</span>
						</p>
					</div>
				</div>
				<div className='text-xs text-gray-400 inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full'>
					<span
						className={cn(
							'h-1.5 w-1.5 rounded-full',
							import.meta.env.VITE_FOLLOW_UP_USE_MOCK === 'true'
								? 'bg-amber-400 animate-pulse'
								: 'bg-emerald-500'
						)}
					/>
					{import.meta.env.VITE_FOLLOW_UP_USE_MOCK === 'true'
						? 'Mock data (VITE_FOLLOW_UP_USE_MOCK=true)'
						: 'Live · /v1/api/email/invoice-threads'}
				</div>
			</div>

			{/* Window controls — date presets, custom range, page size. The
			    dataset spans 5+ months as of 2026-05-16, so the table is no
			    longer locked to the rolling 30-day window. */}
			<div className='bg-white rounded-xl border border-gray-200 shadow-sm p-3'>
				<div className='flex flex-wrap items-center gap-2'>
					<span className='text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1'>
						Window
					</span>
					{DATE_PRESETS.map(p => (
						<button
							key={p.id}
							type='button'
							onClick={() => applyDatePreset(p.id)}
							className={cn(
								'text-xs px-2.5 py-1 rounded-full border transition-colors',
								datePreset === p.id
									? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-semibold'
									: 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
							)}
						>
							{p.label}
						</button>
					))}
					<div className='ml-2 flex items-center gap-1.5 border-l border-gray-200 pl-3'>
						<input
							type='date'
							value={dateFrom}
							onChange={e => onCustomDateChange('from', e.target.value)}
							className='text-xs border border-gray-200 rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-300'
						/>
						<span className='text-xs text-gray-400'>→</span>
						<input
							type='date'
							value={dateTo}
							onChange={e => onCustomDateChange('to', e.target.value)}
							className='text-xs border border-gray-200 rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-300'
						/>
					</div>
					<div className='ml-auto flex items-center gap-2'>
						<label className='text-xs text-gray-500'>Page size</label>
						<select
							value={pageSize}
							onChange={e => setPageSize(Number(e.target.value))}
							className='text-xs border border-gray-200 rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-300'
						>
							{PAGE_SIZES.map(n => (
								<option key={n} value={n}>{n}</option>
							))}
						</select>
					</div>
				</div>
			</div>

			{loadError && (
				<div className='rounded-lg border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-700 flex items-start gap-3'>
					<AlertTriangle className='h-4 w-4 mt-0.5 shrink-0' />
					<div className='flex-1'>
						<div className='font-semibold'>Could not load follow-up data</div>
						<div className='text-xs text-red-600 mt-0.5'>{loadError}</div>
						<div className='text-[11px] text-red-500 mt-1'>
							Check that the backend is running and you have <span className='font-mono'>transitPlan</span> permission. To work offline, set <span className='font-mono'>VITE_FOLLOW_UP_USE_MOCK=true</span> in .env.
						</div>
					</div>
				</div>
			)}

			{/* Quick-filter pill strip — driven by summary.ai_breakdown so the
			    counts are window-wide regardless of pagination. Each pill
			    click-to-filters the table. */}
			{summary?.ai_breakdown && (
				<QuickFiltersStrip
					ai={summary.ai_breakdown}
					ballInCourtFilter={ballInCourtFilter}
					setBallInCourtFilter={setBallInCourtFilter}
					priorityFilter={priorityFilter}
					setPriorityFilter={setPriorityFilter}
					statusFilter={statusFilter}
					setStatusFilter={setStatusFilter}
				/>
			)}

			{/* Hero: attention callouts + coverage breakdown */}
			{summary && (
				<div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)] gap-4'>
					{/* Real gap callout */}
					<RealGapCallout
						count={summary.invoices_real_gap}
						balance={summary.real_gap_balance}
						onJump={() => setCoverageFilter(['real_gap'])}
						active={coverageFilter.includes('real_gap')}
					/>

					{/* Overdue callout */}
					<OverdueCallout
						count={overdueStats.count}
						balance={overdueStats.balance}
						oldestDays={overdueStats.oldestDays}
						onJump={() => setInvoiceStatusFilter(['overdue'])}
						active={invoiceStatusFilter.includes('overdue')}
					/>

					{/* Coverage breakdown card */}
					<div className='bg-white rounded-xl border border-gray-200 shadow-sm p-5'>
						<div className='flex items-start justify-between mb-3 gap-4'>
							<div>
								<div className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>
									Coverage
								</div>
								<div className='flex items-baseline gap-2 mt-1'>
									<span className='text-2xl font-bold text-emerald-600 tabular-nums'>
										{summary.coverage_pct}%
									</span>
									<span className='text-sm text-gray-500'>
										{summary.invoices_covered} of {summary.invoices_total} invoices tracked
									</span>
								</div>
							</div>
							<div className='text-right'>
								<div className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>
									Outstanding balance
								</div>
								<div className='text-xl font-bold text-gray-900 tabular-nums mt-1'>
									{formatINRCompact(summary.total_balance)}
								</div>
								<div className='text-[11px] text-gray-400 mt-0.5'>
									{formatINR(summary.total_balance)}
								</div>
							</div>
						</div>
						<CoverageBar
							breakdown={summary.coverage_breakdown}
							total={summary.invoices_total}
							active={coverageFilter}
							onSelect={klass =>
								toggleArrayValue<CoverageClass>(setCoverageFilter, klass)
							}
						/>
						<div className='mt-3 text-[11px] text-gray-400'>
							Click a segment to filter the table by coverage class.
						</div>
					</div>
				</div>
			)}

			{/* Body: sidebar + table */}
			<div className='grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5'>
				<aside className='space-y-5'>
					<div className='bg-white rounded-xl border border-gray-200 p-4 shadow-sm'>
						<div className='flex items-center justify-between mb-3'>
							<h3 className='flex items-center gap-2 text-sm font-semibold text-gray-900'>
								<Filter className='h-4 w-4 text-gray-500' />
								Filters
							</h3>
							{hasActiveFilters && (
								<button
									onClick={clearFilters}
									className='text-xs text-emerald-600 hover:text-emerald-700 hover:underline'
								>
									Clear
								</button>
							)}
						</div>

						<FilterBlock label='Customer'>
							<div className='relative'>
								<Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400' />
								<input
									type='text'
									value={customerQuery}
									onChange={e => setCustomerQuery(e.target.value)}
									placeholder='Search customer…'
									className='w-full pl-8 pr-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400'
								/>
							</div>
						</FilterBlock>

						<FilterBlock label='Coverage class'>
							<div className='flex flex-wrap gap-1.5'>
								{ALL_COVERAGE_CLASSES.map(c => {
									const active = coverageFilter.includes(c);
									const v = COVERAGE_VISUAL[c];
									return (
										<button
											key={c}
											onClick={() =>
												toggleArrayValue<CoverageClass>(setCoverageFilter, c)
											}
											className={cn(
												'text-xs px-2 py-1 rounded-full border transition-all inline-flex items-center gap-1.5',
												active
													? v.pillClasses + ' ring-2 ring-offset-1 ring-emerald-300 font-medium'
													: 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
											)}
										>
											<span className={cn('h-1.5 w-1.5 rounded-full', v.segmentBg)} />
											{v.shortLabel}
										</button>
									);
								})}
							</div>
						</FilterBlock>

						<FilterBlock label='Invoice status'>
							<div className='flex flex-wrap gap-1.5'>
								{ALL_INVOICE_STATUSES.map(s => {
									const active = invoiceStatusFilter.includes(s);
									const v = INVOICE_STATUS_VISUAL[s];
									return (
										<button
											key={s}
											onClick={() =>
												toggleArrayValue<InvoiceStatus>(setInvoiceStatusFilter, s)
											}
											className={cn(
												'text-xs px-2 py-1 rounded-full border transition-all',
												active
													? v.classes + ' font-medium ring-2 ring-offset-1 ring-emerald-300'
													: 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
											)}
										>
											{v.label}
										</button>
									);
								})}
							</div>
						</FilterBlock>

						<FilterBlock label='Thread state (AI)'>
							<div className='flex flex-wrap gap-1.5'>
								{ALL_THREAD_STATUSES.map(s => {
									const active = statusFilter.includes(s);
									const v = THREAD_STATUS_VISUAL[s];
									return (
										<button
											key={s}
											onClick={() => toggleArrayValue<ThreadStatus>(setStatusFilter, s)}
											className={cn(
												'text-xs px-2 py-1 rounded-full border transition-all',
												active
													? v.pillClasses + ' ring-2 ring-offset-1 ring-emerald-300 font-medium'
													: 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
											)}
										>
											{v.label}
										</button>
									);
								})}
							</div>
						</FilterBlock>

						<FilterBlock label='Priority'>
							<div className='flex gap-1.5'>
								{ALL_PRIORITIES.map(p => {
									const active = priorityFilter.includes(p);
									const v = PRIORITY_VISUAL[p];
									return (
										<button
											key={p}
											onClick={() => toggleArrayValue<Priority>(setPriorityFilter, p)}
											className={cn(
												'flex-1 text-xs px-2 py-1.5 rounded-md border transition-all inline-flex items-center justify-center gap-1.5',
												active
													? v.classes + ' font-semibold'
													: 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
											)}
										>
											<span className={cn('h-1.5 w-1.5 rounded-full', v.dot)} />
											{v.label}
										</button>
									);
								})}
							</div>
						</FilterBlock>

						<FilterBlock label='Ball in court (AI)'>
							<div className='flex flex-wrap gap-1.5'>
								{ALL_BALL_IN_COURT.map(b => {
									const active = ballInCourtFilter.includes(b);
									const v = BALL_IN_COURT_VISUAL[b];
									return (
										<button
											key={b}
											onClick={() => toggleArrayValue<BallInCourt>(setBallInCourtFilter, b)}
											title={v.hint}
											className={cn(
												'text-xs px-2 py-1 rounded-full border transition-all inline-flex items-center gap-1.5',
												active
													? v.classes + ' ring-2 ring-offset-1 ring-emerald-300 font-medium'
													: 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
											)}
										>
											<span className={cn('h-1.5 w-1.5 rounded-full', v.dot)} />
											{v.short}
										</button>
									);
								})}
							</div>
						</FilterBlock>

						<FilterBlock label='Quick filter'>
							<label className='flex items-center gap-2 text-xs cursor-pointer'>
								<input
									type='checkbox'
									checked={brokenPromisesOnly}
									onChange={e => setBrokenPromisesOnly(e.target.checked)}
									className='h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500'
								/>
								<span className='text-gray-700'>
									Promised but not kept
									<span className='block text-[10px] text-gray-400'>
										Rows with a broken commitment
									</span>
								</span>
							</label>
						</FilterBlock>

						<FilterBlock label='Last contact within' className='mb-0'>
							<div className='grid grid-cols-4 gap-1.5'>
								{(['all', '7', '15', '30'] as DaysRange[]).map(d => (
									<button
										key={d}
										onClick={() => setDaysRange(d)}
										className={cn(
											'text-xs py-1.5 rounded-md border transition-all',
											daysRange === d
												? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium'
												: 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
										)}
									>
										{d === 'all' ? 'All' : `${d}d`}
									</button>
								))}
							</div>
						</FilterBlock>
					</div>

					{/* Coverage legend */}
					<div className='bg-white rounded-xl border border-gray-200 p-4 shadow-sm'>
						<h3 className='text-sm font-semibold text-gray-900 mb-3'>What each label means</h3>
						<ul className='space-y-2.5'>
							{ALL_COVERAGE_CLASSES.map(c => {
								const v = COVERAGE_VISUAL[c];
								return (
									<li key={c} className='flex items-start gap-2 text-xs'>
										<span
											className={cn(
												'mt-0.5 px-2 py-0.5 rounded-full border whitespace-nowrap',
												v.pillClasses
											)}
										>
											{v.shortLabel}
										</span>
										<span className='text-gray-500 leading-snug'>{v.hint}</span>
									</li>
								);
							})}
						</ul>
					</div>
				</aside>

				{/* Table */}
				<section className='bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden'>
					<div className='flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-emerald-50/40 to-white'>
						<div className='flex items-center gap-2'>
							<span className='text-sm font-semibold text-gray-900'>
								{filteredRows.length}
							</span>
							<span className='text-sm text-gray-500'>
								{filteredRows.length === 1 ? 'invoice' : 'invoices'}
								{hasActiveFilters && ' (filtered)'}
							</span>
						</div>
						<div className='text-xs text-gray-400'>
							Sorted by{' '}
							<span className='text-gray-600 font-medium'>
								{sortKey === 'days_overdue'
									? 'Days overdue'
									: sortKey === 'amount'
										? 'Amount'
										: 'Last contact'}
							</span>{' '}
							{sortOrder === 'desc' ? '↓' : '↑'}
						</div>
					</div>

					{loading ? (
						<TableLoadingState />
					) : filteredRows.length === 0 ? (
						<EmptyState onClear={hasActiveFilters ? clearFilters : undefined} />
					) : (
						<div className='overflow-x-auto'>
							<table className='w-full'>
								<thead className='bg-gray-50 border-b border-gray-200'>
									<tr>
										<th className='w-8'></th>
										<th className='text-left px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide'>
											Customer / Invoice
										</th>
										<SortHeader
											label='Amount'
											align='right'
											onClick={() => handleSort('amount')}
											icon={sortIcon('amount')}
										/>
										<SortHeader
											label='Overdue'
											align='center'
											onClick={() => handleSort('days_overdue')}
											icon={sortIcon('days_overdue')}
										/>
										<th className='text-left px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide'>
											Coverage
										</th>
										<SortHeader
											label='Last contact'
											align='left'
											onClick={() => handleSort('days_since_last_contact')}
											icon={sortIcon('days_since_last_contact')}
										/>
										<th className='text-left px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide'>
											AI summary
										</th>
										<th
											className='text-left px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide'
											title='What the AI inferred from the email thread — independent from the Zoho ledger status shown next to each invoice number.'
										>
											Thread state
										</th>
										<th className='text-right px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide'>
											Action
										</th>
									</tr>
								</thead>
								<tbody className='divide-y divide-gray-100'>
									{filteredRows.map(row => (
										<FollowUpRowView
											key={row.invoice.zoho_invoice_id || row.invoice.invoice_number}
											row={row}
											expanded={expandedId === row.invoice.zoho_invoice_id}
											onToggle={() =>
												setExpandedId(prev =>
													prev === row.invoice.zoho_invoice_id ? null : row.invoice.zoho_invoice_id
												)
											}
											rollup={rollupByCustomer.get(row.invoice.customer_name.toLowerCase())}
											visibleInvoiceNumbers={visibleInvoiceNumbers}
											visibleItemsByNumber={visibleItemsByNumber}
											relatedInvoiceNumbers={relatedByInvoiceNumber.get(
												row.invoice.invoice_number
											)}
											onJumpToInvoice={jumpToInvoice}
										/>
									))}
								</tbody>
							</table>
						</div>
					)}

					{/* Pagination footer — driven by backend totals; only shows
					    when the backend returned the new pagination metadata. */}
					{data?.pagination?.total !== undefined && (
						<PaginationFooter
							page={data.pagination.page}
							limit={data.pagination.limit}
							returned={data.pagination.returned}
							total={data.pagination.total}
							totalPages={data.pagination.total_pages ?? 0}
							hasMore={data.pagination.has_more ?? false}
							onPageChange={setCurrentPage}
						/>
					)}
				</section>
			</div>
		</div>
	);
};

// ──────────────────────────────────────────────────────────────────────────────
// Pagination footer — sits below the table, drives page nav.
// ──────────────────────────────────────────────────────────────────────────────
const PaginationFooter: React.FC<{
	page: number;
	limit: number;
	returned: number;
	total: number;
	totalPages: number;
	hasMore: boolean;
	onPageChange: (next: number) => void;
}> = ({ page, limit, returned, total, totalPages, hasMore, onPageChange }) => {
	if (total === 0) return null;
	const firstOnPage = (page - 1) * limit + 1;
	const lastOnPage = (page - 1) * limit + returned;
	return (
		<div className='mt-3 flex items-center justify-between flex-wrap gap-2 text-xs text-gray-600 px-2 py-2 border-t border-gray-100'>
			<div>
				Showing <span className='font-semibold tabular-nums'>{firstOnPage.toLocaleString()}–{lastOnPage.toLocaleString()}</span>{' '}
				of <span className='font-semibold tabular-nums'>{total.toLocaleString()}</span> invoices
				{' · '}
				<span className='text-gray-400'>Page {page} of {totalPages}</span>
			</div>
			<div className='flex items-center gap-1'>
				<button
					type='button'
					onClick={() => onPageChange(1)}
					disabled={page <= 1}
					className='px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed'
				>
					« First
				</button>
				<button
					type='button'
					onClick={() => onPageChange(Math.max(1, page - 1))}
					disabled={page <= 1}
					className='px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed'
				>
					‹ Prev
				</button>
				<button
					type='button'
					onClick={() => onPageChange(Math.min(totalPages, page + 1))}
					disabled={!hasMore}
					className='px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed'
				>
					Next ›
				</button>
				<button
					type='button'
					onClick={() => onPageChange(totalPages)}
					disabled={page >= totalPages}
					className='px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed'
				>
					Last »
				</button>
			</div>
		</div>
	);
};

// ──────────────────────────────────────────────────────────────────────────────
// Real-gap callout — the headline number for an accountant
// ──────────────────────────────────────────────────────────────────────────────

const RealGapCallout: React.FC<{
	count: number;
	balance: number;
	onJump: () => void;
	active: boolean;
}> = ({ count, balance, onJump, active }) => {
	const isAttention = count > 0;
	return (
		<button
			type='button'
			onClick={onJump}
			disabled={!isAttention}
			className={cn(
				'text-left rounded-xl border shadow-sm p-5 transition-all',
				isAttention
					? 'bg-gradient-to-br from-red-50 to-red-50/40 border-red-200 hover:shadow-md cursor-pointer'
					: 'bg-gradient-to-br from-emerald-50 to-emerald-50/40 border-emerald-200',
				active && 'ring-2 ring-red-300'
			)}
		>
			<div className='flex items-start gap-3'>
				<div
					className={cn(
						'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
						isAttention
							? 'bg-red-100 text-red-600'
							: 'bg-emerald-100 text-emerald-600'
					)}
				>
					{isAttention ? (
						<AlertTriangle className='h-5 w-5' />
					) : (
						<CheckCircle2 className='h-5 w-5' />
					)}
				</div>
				<div className='min-w-0 flex-1'>
					<div
						className={cn(
							'text-[11px] font-semibold uppercase tracking-wide',
							isAttention ? 'text-red-600' : 'text-emerald-600'
						)}
					>
						{isAttention ? 'Needs immediate action' : 'All invoices tracked'}
					</div>
					<div className='mt-1'>
						{isAttention ? (
							<>
								<div className='text-3xl font-bold text-gray-900 tabular-nums leading-tight'>
									{count}
								</div>
								<div className='text-sm text-gray-700 mt-0.5'>
									{pluralize(count, 'invoice')} with{' '}
									<span className='font-semibold text-red-700'>no email correspondence</span>
								</div>
								<div className='text-xs text-gray-500 mt-1'>
									{formatINR(balance)} outstanding
								</div>
							</>
						) : (
							<>
								<div className='text-2xl font-bold text-gray-900'>0 gaps</div>
								<div className='text-xs text-gray-500 mt-0.5'>
									Every invoice has an email trail.
								</div>
							</>
						)}
					</div>
					{isAttention && (
						<div className='mt-3 inline-flex items-center gap-1 text-xs font-medium text-red-700'>
							View the list <ChevronRight className='h-3.5 w-3.5' />
						</div>
					)}
				</div>
			</div>
		</button>
	);
};

// ──────────────────────────────────────────────────────────────────────────────
// Quick-filter pill strip — surfaces window-wide AI counts as one-click filters
// ──────────────────────────────────────────────────────────────────────────────

interface QuickFiltersStripProps {
	ai: NonNullable<FollowUpResponse['summary']['ai_breakdown']>;
	ballInCourtFilter: BallInCourt[];
	setBallInCourtFilter: React.Dispatch<React.SetStateAction<BallInCourt[]>>;
	priorityFilter: Priority[];
	setPriorityFilter: React.Dispatch<React.SetStateAction<Priority[]>>;
	statusFilter: ThreadStatus[];
	setStatusFilter: React.Dispatch<React.SetStateAction<ThreadStatus[]>>;
}

const QuickFiltersStrip: React.FC<QuickFiltersStripProps> = ({
	ai,
	ballInCourtFilter,
	setBallInCourtFilter,
	priorityFilter,
	setPriorityFilter,
	statusFilter,
	setStatusFilter,
}) => {
	// Single-value toggle: set this filter to exactly [value], or clear it if
	// already exactly that. Keeps the strip behaving like radio buttons even
	// though the underlying state is multi-select.
	const setExclusive = <T,>(
		setter: React.Dispatch<React.SetStateAction<T[]>>,
		current: T[],
		value: T
	) => {
		const isOnlyThis = current.length === 1 && current[0] === value;
		setter(isOnlyThis ? [] : [value]);
	};

	const pills: Array<{
		count: number;
		label: string;
		tone: 'orange' | 'red' | 'amber' | 'violet' | 'sky';
		active: boolean;
		onClick: () => void;
		hint: string;
	}> = [];

	const onMe = ai.ball_in_court?.infinitybox ?? 0;
	if (onMe > 0) {
		pills.push({
			count: onMe,
			label: 'On my plate',
			tone: 'orange',
			active: ballInCourtFilter.length === 1 && ballInCourtFilter[0] === 'infinitybox',
			onClick: () =>
				setExclusive<BallInCourt>(setBallInCourtFilter, ballInCourtFilter, 'infinitybox'),
			hint: 'Ball-in-court is InfinityBox — these need a move from us.',
		});
	}

	const high = ai.priority?.high ?? 0;
	if (high > 0) {
		pills.push({
			count: high,
			label: 'High priority',
			tone: 'red',
			active: priorityFilter.length === 1 && priorityFilter[0] === 'high',
			onClick: () => setExclusive<Priority>(setPriorityFilter, priorityFilter, 'high'),
			hint: 'AI flagged as urgent.',
		});
	}

	const disputes = ai.current_status?.dispute ?? 0;
	if (disputes > 0) {
		pills.push({
			count: disputes,
			label: 'Disputes',
			tone: 'red',
			active: statusFilter.length === 1 && statusFilter[0] === 'dispute',
			onClick: () => setExclusive<ThreadStatus>(setStatusFilter, statusFilter, 'dispute'),
			hint: 'Customer contesting amounts, GST, or PO match.',
		});
	}

	const promised = ai.current_status?.promised_to_pay ?? 0;
	if (promised > 0) {
		pills.push({
			count: promised,
			label: 'Promised to pay',
			tone: 'amber',
			active: statusFilter.length === 1 && statusFilter[0] === 'promised_to_pay',
			onClick: () =>
				setExclusive<ThreadStatus>(setStatusFilter, statusFilter, 'promised_to_pay'),
			hint: 'Customer committed to a date — watch for slips.',
		});
	}

	const silent = ai.current_status?.no_response ?? 0;
	if (silent > 0) {
		pills.push({
			count: silent,
			label: 'No response',
			tone: 'amber',
			active: statusFilter.length === 1 && statusFilter[0] === 'no_response',
			onClick: () =>
				setExclusive<ThreadStatus>(setStatusFilter, statusFilter, 'no_response'),
			hint: 'Reminders sent, silence beyond expected reply window.',
		});
	}

	const awaitingUs = ai.current_status?.awaiting_internal ?? 0;
	if (awaitingUs > 0) {
		pills.push({
			count: awaitingUs,
			label: 'Awaiting us',
			tone: 'violet',
			active: statusFilter.length === 1 && statusFilter[0] === 'awaiting_internal',
			onClick: () =>
				setExclusive<ThreadStatus>(setStatusFilter, statusFilter, 'awaiting_internal'),
			hint: 'Blocked on our team — GRN, KAM, internal form.',
		});
	}

	if (pills.length === 0) return null;

	const TONE: Record<typeof pills[number]['tone'], { idle: string; active: string }> = {
		orange: {
			idle: 'bg-white border-orange-200 text-orange-700 hover:bg-orange-50',
			active: 'bg-orange-100 border-orange-400 text-orange-800 ring-2 ring-orange-200',
		},
		red: {
			idle: 'bg-white border-red-200 text-red-700 hover:bg-red-50',
			active: 'bg-red-100 border-red-400 text-red-800 ring-2 ring-red-200',
		},
		amber: {
			idle: 'bg-white border-amber-200 text-amber-700 hover:bg-amber-50',
			active: 'bg-amber-100 border-amber-400 text-amber-900 ring-2 ring-amber-200',
		},
		violet: {
			idle: 'bg-white border-violet-200 text-violet-700 hover:bg-violet-50',
			active: 'bg-violet-100 border-violet-400 text-violet-800 ring-2 ring-violet-200',
		},
		sky: {
			idle: 'bg-white border-sky-200 text-sky-700 hover:bg-sky-50',
			active: 'bg-sky-100 border-sky-400 text-sky-800 ring-2 ring-sky-200',
		},
	};

	return (
		<div className='flex items-center gap-2 flex-wrap'>
			<span className='text-[11px] font-semibold uppercase tracking-wide text-gray-500 mr-1'>
				Quick filters
			</span>
			{pills.map(p => {
				const t = TONE[p.tone];
				return (
					<button
						key={p.label}
						type='button'
						onClick={p.onClick}
						title={p.hint}
						className={cn(
							'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all',
							p.active ? t.active : t.idle
						)}
					>
						<span className='tabular-nums font-bold'>{p.count}</span>
						<span>{p.label}</span>
					</button>
				);
			})}
		</div>
	);
};

// ──────────────────────────────────────────────────────────────────────────────
// Overdue callout — count, outstanding balance, oldest invoice age
// ──────────────────────────────────────────────────────────────────────────────

const OverdueCallout: React.FC<{
	count: number;
	balance: number;
	oldestDays: number;
	onJump: () => void;
	active: boolean;
}> = ({ count, balance, oldestDays, onJump, active }) => {
	const isAttention = count > 0;
	return (
		<button
			type='button'
			onClick={onJump}
			disabled={!isAttention}
			className={cn(
				'text-left rounded-xl border shadow-sm p-5 transition-all',
				isAttention
					? 'bg-gradient-to-br from-amber-50 to-amber-50/40 border-amber-200 hover:shadow-md cursor-pointer'
					: 'bg-gradient-to-br from-emerald-50 to-emerald-50/40 border-emerald-200',
				active && 'ring-2 ring-amber-300'
			)}
		>
			<div className='flex items-start gap-3'>
				<div
					className={cn(
						'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
						isAttention
							? 'bg-amber-100 text-amber-700'
							: 'bg-emerald-100 text-emerald-600'
					)}
				>
					{isAttention ? (
						<AlertTriangle className='h-5 w-5' />
					) : (
						<CheckCircle2 className='h-5 w-5' />
					)}
				</div>
				<div className='min-w-0 flex-1'>
					<div
						className={cn(
							'text-[11px] font-semibold uppercase tracking-wide',
							isAttention ? 'text-amber-700' : 'text-emerald-600'
						)}
					>
						Overdue
					</div>
					<div className='mt-1'>
						{isAttention ? (
							<>
								<div className='flex items-baseline gap-2'>
									<div className='text-3xl font-bold text-gray-900 tabular-nums leading-tight'>
										{count}
									</div>
									<div className='text-sm text-gray-500'>
										invoice{count === 1 ? '' : 's'} past due
									</div>
								</div>
								<div className='text-sm text-gray-700 mt-1 tabular-nums'>
									<span className='font-semibold text-amber-800'>
										{formatINR(balance)}
									</span>{' '}
									outstanding
								</div>
								<div className='text-xs text-gray-500 mt-0.5'>
									Oldest{' '}
									<span
										className={cn(
											'font-semibold tabular-nums',
											oldestDays > 60
												? 'text-red-700'
												: oldestDays > 30
													? 'text-orange-700'
													: 'text-amber-700'
										)}
									>
										{oldestDays} days
									</span>
								</div>
							</>
						) : (
							<>
								<div className='text-2xl font-bold text-gray-900'>None overdue</div>
								<div className='text-xs text-gray-500 mt-0.5'>
									Everything paid or in-window.
								</div>
							</>
						)}
					</div>
					{isAttention && (
						<div className='mt-3 inline-flex items-center gap-1 text-xs font-medium text-amber-800'>
							Filter to overdue <ChevronRight className='h-3.5 w-3.5' />
						</div>
					)}
				</div>
			</div>
		</button>
	);
};

// ──────────────────────────────────────────────────────────────────────────────
// Row view
// ──────────────────────────────────────────────────────────────────────────────

interface FollowUpRowViewProps {
	row: FollowUpItem;
	expanded: boolean;
	onToggle: () => void;
	rollup?: CustomerRollup;
	visibleInvoiceNumbers: Set<string>;
	visibleItemsByNumber: Map<string, FollowUpItem>;
	relatedInvoiceNumbers?: Set<string>;
	onJumpToInvoice: (invoiceNumber: string) => void;
}

const FollowUpRowView: React.FC<FollowUpRowViewProps> = ({
	row,
	expanded,
	onToggle,
	rollup,
	visibleInvoiceNumbers,
	visibleItemsByNumber,
	relatedInvoiceNumbers,
	onJumpToInvoice,
}) => {
	const overdue = row.invoice.days_overdue;
	const coverage = COVERAGE_VISUAL[row.coverage_class];
	const aiStatus = row.ai ? THREAD_STATUS_VISUAL[row.ai.current_status] : null;
	const priority = row.ai ? PRIORITY_VISUAL[row.ai.priority] : null;

	// "Paid" is the single most important signal for an accountant scanning the
	// table — derive it once and let it override priority / overdue treatment so
	// settled invoices visually recede.
	const isPaid = row.invoice.status === 'paid' || row.invoice.balance === 0;

	// Self-audit: when Swati's avg reply is slow on this thread, surface an
	// extra amber wash so SHE notices she might be the bottleneck.
	const slowOurResponse =
		!isPaid &&
		row.ai?.our_avg_response_days != null &&
		row.ai.our_avg_response_days > 2;

	// Stripe colour: green wins when paid; otherwise priority, else coverage.
	const stripeClass = isPaid
		? 'border-l-emerald-500'
		: priority
			? priority.stripe
			: coverage.accentClasses;

	return (
		<>
			<tr
				id={`fu-row-${row.invoice.zoho_invoice_id}`}
				className={cn(
					'transition-colors cursor-pointer hover:bg-gray-50/70 border-l-4',
					stripeClass,
					expanded && 'bg-emerald-50/30',
					isPaid && !expanded && 'bg-emerald-50/10',
					slowOurResponse && !expanded && 'bg-amber-50/20'
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

				{/* Customer + invoice */}
				<td className='px-3 py-3 align-top'>
					<div className='flex items-start gap-2'>
						{priority ? (
							<span
								className={cn('mt-1 h-1.5 w-1.5 rounded-full shrink-0', priority.dot)}
								title={`${priority.label} priority`}
							/>
						) : (
							<span className='mt-1 h-1.5 w-1.5 rounded-full bg-gray-300 shrink-0' />
						)}
						<div className='min-w-0'>
							<div className='text-sm font-semibold text-gray-900 leading-tight line-clamp-1'>
								{row.invoice.customer_name}
							</div>
							<div className='text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap'>
								<span className='font-mono'>{row.invoice.invoice_number}</span>
								<span className='text-gray-300'>·</span>
								<span>Due {formatDate(row.invoice.due_date)}</span>
								<span
									className={cn(
										'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap',
										INVOICE_STATUS_VISUAL[row.invoice.status].classes
									)}
									title='Zoho ledger status — the source of truth for whether money has moved.'
								>
									{INVOICE_STATUS_VISUAL[row.invoice.status].label}
								</span>
							</div>
						</div>
					</div>
				</td>

				{/* Amount + balance */}
				<td className='px-3 py-3 text-right align-top'>
					<div className='text-sm font-semibold text-gray-900 tabular-nums'>
						{formatINR(row.invoice.amount)}
					</div>
					{isPaid ? (
						<span className='mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200'>
							<CheckCircle2 className='h-2.5 w-2.5' />
							Settled
						</span>
					) : row.invoice.balance !== row.invoice.amount ? (
						<div className='text-[11px] mt-0.5 tabular-nums text-amber-700'>
							Bal: {formatINR(row.invoice.balance)}
						</div>
					) : null}
				</td>

				{/* Days overdue — replaced by a green "Paid" pill when settled */}
				<td className='px-3 py-3 text-center align-top'>
					{isPaid ? (
						<span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200'>
							<CheckCircle2 className='h-3 w-3' />
							Paid
						</span>
					) : overdue > 0 ? (
						<span
							className={cn(
								'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border tabular-nums',
								overdue > 30
									? 'bg-red-50 text-red-700 border-red-200'
									: overdue > 7
										? 'bg-orange-50 text-orange-700 border-orange-200'
										: 'bg-amber-50 text-amber-700 border-amber-200'
							)}
						>
							{overdue}d
						</span>
					) : (
						<span className='text-xs text-gray-400'>On track</span>
					)}
				</td>

				{/* Coverage badge */}
				<td className='px-3 py-3 align-top'>
					<span
						className={cn(
							'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border whitespace-nowrap',
							coverage.pillClasses
						)}
						title={coverage.hint}
					>
						<span className={cn('h-1.5 w-1.5 rounded-full', coverage.segmentBg)} />
						{coverage.shortLabel}
					</span>
				</td>

				{/* Last contact */}
				<td className='px-3 py-3 align-top'>
					{row.thread && row.thread.message_count > 0 ? (
						<>
							<div className='flex items-center gap-1.5 text-xs text-gray-700'>
								<MessageCircle className='h-3.5 w-3.5 text-gray-400' />
								<span>
									{formatRelativeContact(
										row.thread.last_message_at,
										row.thread.days_since_last_contact
									)}
								</span>
							</div>
							<div className='text-[11px] text-gray-400 mt-0.5'>
								{pluralize(row.thread.message_count, 'message')}
							</div>
						</>
					) : (
						<span className='text-xs text-gray-400'>—</span>
					)}
				</td>

				{/* AI summary truncated (or empty-state) + risk chips */}
				<td className='px-3 py-3 align-top max-w-[320px]'>
					{row.ai ? (
						<>
							<p className='text-xs text-gray-700 leading-relaxed line-clamp-2'>
								{row.ai.summary_short}
							</p>
							<RiskChips risks={row.ai.risk_signals} />
						</>
					) : (
						<EmptyStateInline coverage={row.coverage_class} row={row} />
					)}
				</td>

				{/* Thread state + ball-in-court — independent signals, stacked */}
				<td className='px-3 py-3 align-top'>
					<div className='flex flex-col items-start gap-1'>
						{aiStatus ? (
							<span
								className={cn(
									'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap',
									aiStatus.pillClasses
								)}
								title={aiStatus.hint}
							>
								{aiStatus.label}
							</span>
						) : (
							<span className='text-xs text-gray-400'>—</span>
						)}
						<BallInCourtPill value={row.ai?.ball_in_court} />
					</div>
				</td>

				{/* Open in Gmail (hidden when no thread) */}
				<td className='px-3 py-3 text-right align-top'>
					{row.deep_link ? (
						<a
							href={row.deep_link}
							target='_blank'
							rel='noopener noreferrer'
							onClick={e => e.stopPropagation()}
							className='inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors whitespace-nowrap'
						>
							<ExternalLink className='h-3.5 w-3.5' />
							Open in Gmail
						</a>
					) : (
						<span className='text-xs text-gray-400'>—</span>
					)}
				</td>
			</tr>

			{expanded && (
				<tr className='bg-gradient-to-br from-emerald-50/20 to-white border-l-4 border-l-emerald-200'>
					<td colSpan={9} className='px-6 py-5'>
						<ExpandedDetail
							row={row}
							rollup={rollup}
							visibleInvoiceNumbers={visibleInvoiceNumbers}
							visibleItemsByNumber={visibleItemsByNumber}
							relatedInvoiceNumbers={relatedInvoiceNumbers}
							onJumpToInvoice={onJumpToInvoice}
						/>
					</td>
				</tr>
			)}
		</>
	);
};

// ──────────────────────────────────────────────────────────────────────────────
// Empty-state messaging for rows with no AI / no thread
// ──────────────────────────────────────────────────────────────────────────────

const EmptyStateInline: React.FC<{ coverage: CoverageClass; row: FollowUpItem }> = ({
	coverage,
	row,
}) => {
	if (coverage === 'real_gap') {
		const hasZohoEmail = row.invoice.zoho.is_emailed;
		return (
			<p className='text-xs text-red-700 leading-relaxed italic'>
				No email correspondence found.{' '}
				<span className='not-italic font-medium'>
					Zoho customer email:{' '}
					<span className={hasZohoEmail ? 'text-emerald-700' : 'text-red-700'}>
						{hasZohoEmail ? 'present' : 'MISSING'}
					</span>
				</span>
			</p>
		);
	}
	if (coverage === 'zoho_emailed_only') {
		const history = row.invoice.zoho.email_history;
		if (history && history.length > 0) {
			// Initial send drives the lead phrasing; any later events become
			// reminders. Sort defensively in case the backend ordering changes.
			const sorted = [...history].sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
			);
			const first = sorted[0];
			const reminders = sorted.slice(1).filter(e => e.is_reminder);
			const firstRecipient = first.recipients[0];
			const extraRecipients = first.recipients.length - 1;

			return (
				<p className='text-xs text-amber-700 leading-relaxed'>
					Zoho sent{' '}
					<span className='font-medium'>
						{new Date(first.date).toLocaleDateString('en-IN', {
							day: '2-digit',
							month: 'short',
						})}
					</span>{' '}
					to <span className='font-medium'>{firstRecipient}</span>
					{extraRecipients > 0 && (
						<span className='text-amber-600'> (+{extraRecipients} more)</span>
					)}{' '}
					·{' '}
					{reminders.length === 0 ? (
						<span className='italic'>no reminder since</span>
					) : (
						<span>
							last reminder{' '}
							<span className='font-medium'>
								{new Date(reminders[reminders.length - 1].date).toLocaleDateString('en-IN', {
									day: '2-digit',
									month: 'short',
								})}
							</span>
						</span>
					)}
				</p>
			);
		}
		// Fallback for old responses without email_history populated.
		return (
			<p className='text-xs text-amber-700 leading-relaxed italic'>
				Zoho sent the invoice ({pluralize(row.invoice.zoho.reminders_sent, 'reminder')}) but no
				Gmail thread is linked yet.
			</p>
		);
	}
	if (coverage === 'still_draft') {
		return (
			<p className='text-xs text-gray-500 leading-relaxed italic'>
				Invoice still in draft — not sent.
			</p>
		);
	}
	if (coverage === 'pre_tracking_column') {
		return (
			<p className='text-xs text-gray-500 leading-relaxed italic'>
				Predates email-tracking column.
			</p>
		);
	}
	return <span className='text-xs text-gray-400'>—</span>;
};

// ──────────────────────────────────────────────────────────────────────────────
// Expanded detail panel
// ──────────────────────────────────────────────────────────────────────────────

interface ExpandedDetailProps {
	row: FollowUpItem;
	rollup?: CustomerRollup;
	visibleInvoiceNumbers: Set<string>;
	visibleItemsByNumber: Map<string, FollowUpItem>;
	relatedInvoiceNumbers?: Set<string>;
	onJumpToInvoice: (invoiceNumber: string) => void;
}

const ExpandedDetail: React.FC<ExpandedDetailProps> = ({
	row,
	rollup,
	visibleInvoiceNumbers,
	visibleItemsByNumber,
	relatedInvoiceNumbers,
	onJumpToInvoice,
}) => {
	if (!row.ai || !row.thread) {
		return (
			<ExpandedDetailNoEmail
				row={row}
				rollup={rollup}
				visibleInvoiceNumbers={visibleInvoiceNumbers}
				visibleItemsByNumber={visibleItemsByNumber}
				relatedInvoiceNumbers={relatedInvoiceNumbers}
				onJumpToInvoice={onJumpToInvoice}
			/>
		);
	}

	const statusVisual = THREAD_STATUS_VISUAL[row.ai.current_status];
	const coverage = COVERAGE_VISUAL[row.coverage_class];

	return (
		<div className='space-y-5'>
			{/* This-invoice context strip — answers "what am I following up on?" */}
			<InvoiceContextStrip row={row} />

			{rollup && (
				<CustomerRollupCard
					rollup={rollup}
					currentInvoiceNumber={row.invoice.invoice_number}
					visibleInvoiceNumbers={visibleInvoiceNumbers}
					visibleItemsByNumber={visibleItemsByNumber}
					relatedInvoiceNumbers={relatedInvoiceNumbers}
					onJumpToInvoice={onJumpToInvoice}
				/>
			)}
			<div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
			<div className='md:col-span-2 space-y-4'>
				<div>
					<DetailLabel icon={<MessageCircle className='h-3.5 w-3.5' />}>
						AI summary
					</DetailLabel>
					<div className='bg-white border border-gray-200 rounded-lg p-3 space-y-2'>
						<p className='text-sm text-gray-900 font-medium leading-relaxed'>
							{row.ai.summary_short}
						</p>
						{row.ai.summary_long && row.ai.summary_long !== row.ai.summary_short && (
							<div className='pt-2 border-t border-gray-100'>
								<BulletSummary text={row.ai.summary_long} />
							</div>
						)}
					</div>
				</div>

				<div>
					<DetailLabel icon={<CheckCircle2 className='h-3.5 w-3.5' />}>
						Next action
					</DetailLabel>
					<div className='bg-white border border-emerald-200 rounded-lg p-3'>
						<div className='flex items-start gap-3'>
							<div className='shrink-0 h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold'>
								!
							</div>
							<p className='text-sm text-gray-900 font-medium leading-relaxed flex-1'>
								{row.ai.next_action}
							</p>
						</div>
						{/* Concrete amount-at-stake — saves Swati from re-reading the AI
						    summary to find the number she's chasing. */}
						<div className='mt-2.5 pt-2.5 border-t border-emerald-100 flex flex-wrap items-center gap-3 text-xs'>
							<span className='inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold tabular-nums'>
								Chasing {formatINR(
									row.invoice.balance > 0 ? row.invoice.balance : row.invoice.amount
								)}
							</span>
							<span className='text-gray-500'>
								on <span className='font-mono text-gray-700'>{row.invoice.invoice_number}</span>
							</span>
							{row.invoice.days_overdue > 0 && (
								<span className='text-gray-500'>
									·{' '}
									<span className='font-medium text-gray-700'>
										{row.invoice.days_overdue} days
									</span>{' '}
									past due
								</span>
							)}
						</div>
					</div>
				</div>

				{/* Module 1.6: Documents in flight (we owe / they owe) */}
				<DocumentsBlock ai={row.ai} />

				{/* Module 1.6: Commitments — broken ones tinted red */}
				<CommitmentsList commitments={row.ai.commitments} />

				{/* Module 1.6: Action items */}
				<ActionItemsList items={row.ai.action_items} />

				{/* Module 1.7: Strengths above Concerns — positive signals first
				    so the operator's brain orients to "what's working" before
				    "what's broken". Both null-safe. */}
				<PositiveSignalsList positives={row.ai.positive_signals} />
				<RiskSignalsList risks={row.ai.risk_signals} />
			</div>

			<div className='space-y-4'>
				{/* Module 1.6: AI prediction tile */}
				<PaymentPredictionTile ai={row.ai} />

				<div>
					<DetailLabel icon={<Mail className='h-3.5 w-3.5' />}>Thread</DetailLabel>
					<div className='bg-white border border-gray-200 rounded-lg p-3 text-xs space-y-2'>
						<KV
							label='Coverage'
							value={
								<span
									className={cn(
										'px-1.5 py-0.5 rounded-full border text-[11px] font-medium',
										coverage.pillClasses
									)}
								>
									{coverage.label}
								</span>
							}
						/>
						<KV
							label='Thread state'
							value={
								<span
									className={cn(
										'px-1.5 py-0.5 rounded-full border text-[11px] font-medium',
										statusVisual.pillClasses
									)}
								>
									{statusVisual.label}
								</span>
							}
						/>
						<KV label='Messages' value={row.thread.message_count} />
						<KV
							label='Last activity'
							value={formatDateTime(row.thread.last_message_at)}
						/>
						<KV label='Subject' value={<span className='truncate'>{row.thread.subject_first}</span>} />
						<KV
							label='Link match'
							value={
								<span className='text-[11px]'>
									{row.thread.link_match_source.replace(/_/g, ' ')} ·{' '}
									<span className='font-medium'>
										{(Number(row.thread.link_match_confidence) * 100).toFixed(0)}%
									</span>
								</span>
							}
						/>
						<KV label='Swati role' value={row.ai.swati_role.replace(/_/g, ' ')} />
						<KV label='Invoice issued' value={formatDate(row.invoice.invoice_date)} />
						<KV label='Due date' value={formatDate(row.invoice.due_date)} />
						<KV
							label='Zoho reminders'
							value={
								<span>
									{row.invoice.zoho.reminders_sent}
									{row.invoice.zoho.last_reminder_sent_date && (
										<span className='text-gray-400 ml-1'>
											· last {formatDate(row.invoice.zoho.last_reminder_sent_date)}
										</span>
									)}
								</span>
							}
						/>
					</div>
				</div>

				{row.thread.participants && row.thread.participants.length > 0 && (
					<div>
						<DetailLabel icon={<Users className='h-3.5 w-3.5' />}>
							Participants ({row.thread.participants.length})
						</DetailLabel>
						<ul className='bg-white border border-gray-200 rounded-lg p-3 space-y-1.5'>
							{row.thread.participants.map(p => {
								const isUs = p.endsWith('@getinfinitybox.com');
								return (
									<li
										key={p}
										className='flex items-center gap-2 text-xs text-gray-700'
									>
										<span
											className={cn(
												'h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
												isUs
													? 'bg-emerald-100 text-emerald-700'
													: 'bg-slate-100 text-slate-600'
											)}
										>
											{p.charAt(0).toUpperCase()}
										</span>
										<span className='truncate'>{p}</span>
										{isUs && (
											<span className='ml-auto text-[10px] text-emerald-600 font-medium'>
												You
											</span>
										)}
									</li>
								);
							})}
						</ul>
					</div>
				)}

				{row.invoice.zoho.email_history && row.invoice.zoho.email_history.length > 0 && (
					<div>
						<DetailLabel icon={<Send className='h-3.5 w-3.5' />}>
							Zoho send history ({row.invoice.zoho.email_history.length})
						</DetailLabel>
						<div className='bg-white border border-gray-200 rounded-lg p-3'>
							<ZohoEmailHistory events={row.invoice.zoho.email_history} tone='slate' />
						</div>
					</div>
				)}
			</div>
			</div>
		</div>
	);
};

interface ExpandedDetailNoEmailProps {
	row: FollowUpItem;
	rollup?: CustomerRollup;
	visibleInvoiceNumbers: Set<string>;
	visibleItemsByNumber: Map<string, FollowUpItem>;
	relatedInvoiceNumbers?: Set<string>;
	onJumpToInvoice: (invoiceNumber: string) => void;
}

const ExpandedDetailNoEmail: React.FC<ExpandedDetailNoEmailProps> = ({
	row,
	rollup,
	visibleInvoiceNumbers,
	visibleItemsByNumber,
	relatedInvoiceNumbers,
	onJumpToInvoice,
}) => {
	const coverage = COVERAGE_VISUAL[row.coverage_class];
	const zoho = row.invoice.zoho;

	const headline =
		row.coverage_class === 'real_gap'
			? 'No email correspondence found'
			: row.coverage_class === 'zoho_emailed_only'
				? 'Sent through Zoho — no Gmail thread linked'
				: row.coverage_class === 'still_draft'
					? 'Invoice has not been sent yet'
					: 'No tracking record before pipeline began';

	const tintBg =
		row.coverage_class === 'real_gap'
			? 'from-red-50 to-red-50/40 border-red-200'
			: row.coverage_class === 'zoho_emailed_only'
				? 'from-amber-50 to-amber-50/40 border-amber-200'
				: 'from-slate-50 to-slate-50/40 border-slate-200';

	const Icon =
		row.coverage_class === 'real_gap'
			? AlertTriangle
			: row.coverage_class === 'zoho_emailed_only'
				? Send
				: FileWarning;

	return (
		<div className='space-y-5'>
			<InvoiceContextStrip row={row} />
			{rollup && (
				<CustomerRollupCard
					rollup={rollup}
					currentInvoiceNumber={row.invoice.invoice_number}
					visibleInvoiceNumbers={visibleInvoiceNumbers}
					visibleItemsByNumber={visibleItemsByNumber}
					relatedInvoiceNumbers={relatedInvoiceNumbers}
					onJumpToInvoice={onJumpToInvoice}
				/>
			)}
			<div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
			<div
				className={cn(
					'md:col-span-2 rounded-lg border bg-gradient-to-br p-4',
					tintBg
				)}
			>
				<div className='flex items-start gap-3'>
					<div className='h-8 w-8 rounded-lg bg-white/70 flex items-center justify-center'>
						<Icon className='h-4 w-4 text-gray-700' />
					</div>
					<div className='flex-1'>
						<div className='text-xs font-semibold uppercase tracking-wide text-gray-600'>
							{coverage.label}
						</div>
						<h4 className='text-base font-semibold text-gray-900 mt-1'>{headline}</h4>
						<p className='text-sm text-gray-700 mt-2 leading-relaxed'>{coverage.hint}</p>

						{row.coverage_class === 'real_gap' && (
							<div className='mt-3 bg-white/80 rounded-md p-3 text-xs border border-red-100'>
								<div className='flex items-center justify-between'>
									<span className='text-gray-600'>Customer email on Zoho record</span>
									<span
										className={cn(
											'font-semibold px-2 py-0.5 rounded-full border',
											zoho.is_emailed
												? 'bg-emerald-50 text-emerald-700 border-emerald-200'
												: 'bg-red-50 text-red-700 border-red-200'
										)}
									>
										{zoho.is_emailed ? 'Present' : 'MISSING'}
									</span>
								</div>
								<p className='mt-2 text-gray-500 leading-relaxed'>
									{zoho.is_emailed
										? 'Customer has a billing email on file — Swati can send the first reminder directly.'
										: 'No billed_email is set on the Zoho customer record. This must be added before any reminder can go out.'}
								</p>
							</div>
						)}

						{row.coverage_class === 'zoho_emailed_only' && (
							<div className='mt-3 bg-white/80 rounded-md p-3 text-xs border border-amber-100'>
								<div className='flex items-center justify-between'>
									<span className='text-gray-600'>Zoho reminders sent</span>
									<span className='font-semibold text-amber-700'>
										{zoho.reminders_sent}
										{zoho.last_reminder_sent_date && (
											<span className='text-gray-400 font-normal ml-1'>
												· last {formatDate(zoho.last_reminder_sent_date)}
											</span>
										)}
									</span>
								</div>
								<p className='mt-2 text-gray-500 leading-relaxed'>
									The invoice and reminders were sent through Zoho. The Gmail thread linker
									has not matched them yet — either by invoice number, subject, or PDF
									attachment.
								</p>

								{zoho.email_history && zoho.email_history.length > 0 && (
									<div className='mt-3 pt-3 border-t border-amber-100'>
										<DetailLabel icon={<Send className='h-3.5 w-3.5' />}>
											Zoho send history ({zoho.email_history.length})
										</DetailLabel>
										<ZohoEmailHistory events={zoho.email_history} tone='amber' />
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>

			<div>
				<DetailLabel icon={<Mail className='h-3.5 w-3.5' />}>Invoice</DetailLabel>
				<div className='bg-white border border-gray-200 rounded-lg p-3 text-xs space-y-2'>
					<KV
						label='Status'
						value={
							<span
								className={cn(
									'px-1.5 py-0.5 rounded-full border text-[11px] font-medium',
									INVOICE_STATUS_VISUAL[row.invoice.status].classes
								)}
							>
								{INVOICE_STATUS_VISUAL[row.invoice.status].label}
							</span>
						}
					/>
					<KV label='Issued' value={formatDate(row.invoice.invoice_date)} />
					<KV label='Due' value={formatDate(row.invoice.due_date)} />
					<KV
						label='Amount'
						value={<span className='font-semibold'>{formatINR(row.invoice.amount)}</span>}
					/>
					<KV
						label='Balance'
						value={<span className='font-semibold'>{formatINR(row.invoice.balance)}</span>}
					/>
					<KV label='Zoho reminders' value={zoho.reminders_sent} />
				</div>
			</div>
			</div>
		</div>
	);
};

// ──────────────────────────────────────────────────────────────────────────────
// Small presentational helpers
// ──────────────────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────────────────────
// Zoho email_history timeline (Module 1.5)
// ──────────────────────────────────────────────────────────────────────────────

const ZohoEmailHistory: React.FC<{
	events: ZohoEmailEvent[];
	tone?: 'amber' | 'slate';
}> = ({ events, tone = 'slate' }) => {
	if (!events || events.length === 0) return null;

	// Newest first so the most recent action sits at the top of the timeline.
	const sorted = [...events].sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
	);

	const palette =
		tone === 'amber'
			? { dot: 'bg-amber-500', line: 'bg-amber-200', chip: 'bg-amber-50 text-amber-700 border-amber-200' }
			: { dot: 'bg-slate-400', line: 'bg-slate-200', chip: 'bg-slate-50 text-slate-700 border-slate-200' };

	return (
		<ul className='relative space-y-3'>
			<span
				className={cn('absolute left-[7px] top-1.5 bottom-1.5 w-px', palette.line)}
				aria-hidden='true'
			/>
			{sorted.map((ev, i) => (
				<li key={`${ev.date}-${i}`} className='relative pl-6'>
					<span
						className={cn(
							'absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white ring-1',
							palette.dot,
							tone === 'amber' ? 'ring-amber-300' : 'ring-slate-300'
						)}
					/>
					<div className='flex items-center gap-2 flex-wrap'>
						<span className='text-xs font-semibold text-gray-900 tabular-nums'>
							{formatDate(ev.date)}
						</span>
						{ev.time && (
							<span className='text-[11px] text-gray-400 tabular-nums'>{ev.time}</span>
						)}
						<span
							className={cn(
								'inline-flex items-center px-1.5 py-0 rounded-full border text-[10px] font-medium uppercase tracking-wide',
								ev.is_reminder
									? 'bg-amber-50 text-amber-700 border-amber-200'
									: 'bg-emerald-50 text-emerald-700 border-emerald-200'
							)}
						>
							{ev.is_reminder ? 'Reminder' : 'Initial send'}
						</span>
					</div>
					{ev.description && (
						<p className='mt-0.5 text-[11px] text-gray-600 leading-snug'>{ev.description}</p>
					)}
					<div className='mt-1 flex flex-wrap gap-1'>
						{ev.recipients.map(r => (
							<span
								key={r}
								className={cn(
									'inline-flex items-center px-1.5 py-0.5 rounded-md border text-[11px]',
									palette.chip
								)}
							>
								{r}
							</span>
						))}
					</div>
				</li>
			))}
		</ul>
	);
};

/**
 * The backend serialises `summary_long` as a single string of newline-separated
 * bullets ("• line 1\n• line 2..."). Rendered in a <p> the newlines collapse
 * into one wall of text, so split + render as a real list. Falls back to a
 * paragraph for any future row that's not pre-bulleted.
 */
/**
 * Compact "this invoice" strip at the top of every expanded row. Answers the
 * accountant's first question — "before I follow up, what am I asking them
 * to pay?" — without making them re-read the AI summary or scroll back to
 * the table row above the expand.
 */
const InvoiceContextStrip: React.FC<{ row: FollowUpItem }> = ({ row }) => {
	const isPaid = row.invoice.status === 'paid' || row.invoice.balance === 0;
	const overdue = row.invoice.days_overdue;
	const invStatus = INVOICE_STATUS_VISUAL[row.invoice.status];

	return (
		<div className='rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50/70 to-white p-3.5 flex flex-wrap items-center justify-between gap-4'>
			<div className='flex items-center gap-3 min-w-0'>
				<div className='text-[10px] font-semibold uppercase tracking-wide text-gray-500'>
					This invoice
				</div>
				<span className='font-mono text-sm font-semibold text-gray-900'>
					{row.invoice.invoice_number}
				</span>
				<span
					className={cn(
						'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap',
						invStatus.classes
					)}
				>
					{invStatus.label}
				</span>
			</div>

			<div className='flex items-center gap-5 text-sm'>
				<div>
					<div className='text-[10px] uppercase tracking-wide text-gray-500'>Amount</div>
					<div className='font-bold text-gray-900 tabular-nums'>
						{formatINR(row.invoice.amount)}
					</div>
				</div>

				{row.invoice.balance !== row.invoice.amount && (
					<div>
						<div className='text-[10px] uppercase tracking-wide text-gray-500'>
							Outstanding
						</div>
						<div
							className={cn(
								'font-bold tabular-nums',
								row.invoice.balance === 0 ? 'text-emerald-700' : 'text-amber-700'
							)}
						>
							{row.invoice.balance === 0 ? 'Settled' : formatINR(row.invoice.balance)}
						</div>
					</div>
				)}

				<div>
					<div className='text-[10px] uppercase tracking-wide text-gray-500'>Due</div>
					<div className='font-semibold text-gray-900'>
						{formatDate(row.invoice.due_date)}
					</div>
				</div>

				{!isPaid && overdue > 0 && (
					<span
						className={cn(
							'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border tabular-nums',
							overdue > 30
								? 'bg-red-50 text-red-700 border-red-200'
								: overdue > 7
									? 'bg-orange-50 text-orange-700 border-orange-200'
									: 'bg-amber-50 text-amber-700 border-amber-200'
						)}
					>
						{overdue} days overdue
					</span>
				)}
				{isPaid && (
					<span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200'>
						<CheckCircle2 className='h-3 w-3' />
						Paid
					</span>
				)}
			</div>
		</div>
	);
};

const BulletSummary: React.FC<{ text: string }> = ({ text }) => {
	const lines = text
		.split('\n')
		.map(l => l.trim().replace(/^[•\-*]\s+/, ''))
		.filter(Boolean);

	if (lines.length <= 1) {
		return <p className='text-sm text-gray-700 leading-relaxed'>{text}</p>;
	}

	return (
		<ul className='space-y-1.5'>
			{lines.map((line, i) => (
				<li
					key={i}
					className='flex items-start gap-2 text-sm text-gray-700 leading-relaxed'
				>
					<span className='mt-[7px] h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0' />
					<span className='flex-1'>{line}</span>
				</li>
			))}
		</ul>
	);
};

const DetailLabel: React.FC<{ icon?: React.ReactNode; children: React.ReactNode }> = ({
	icon,
	children,
}) => (
	<div className='flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5'>
		{icon}
		{children}
	</div>
);

const KV: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
	<div className='flex items-center justify-between gap-2'>
		<span className='text-gray-500 shrink-0'>{label}</span>
		<span className='text-gray-900 font-medium text-right min-w-0 truncate'>{value}</span>
	</div>
);

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
			align === 'center' && 'text-center',
			align === 'left' && 'text-left'
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

const FilterBlock: React.FC<{ label: string; className?: string; children: React.ReactNode }> = ({
	label,
	className,
	children,
}) => (
	<div className={cn('mb-4', className)}>
		<div className='text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5'>
			{label}
		</div>
		{children}
	</div>
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
		<p className='text-xs text-gray-400 mt-2'>Loading invoices…</p>
	</div>
);

const EmptyState: React.FC<{ onClear?: () => void }> = ({ onClear }) => (
	<div className='p-12 text-center'>
		<div className='inline-flex h-12 w-12 rounded-full bg-gray-50 items-center justify-center mb-3'>
			<Inbox className='h-6 w-6 text-gray-400' />
		</div>
		<h3 className='text-sm font-semibold text-gray-900'>No invoices match these filters</h3>
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

export default FollowUpTracker;
