/**
 * Customer overview card — rendered at the top of every row's expanded panel.
 *
 * The window only shows 30 days of invoices, but the customer probably has
 * history outside that window. The rollup answers the question Swati can't
 * answer from the row alone: "is the overall relationship healthy?"
 *
 * Invoice-number chips at the bottom let her jump to any other invoice for
 * this customer that's also in the current view. Out-of-window invoices are
 * rendered greyed-out with a tooltip — visible so she knows they exist, but
 * not clickable because the table doesn't have them loaded.
 */

import React, { useState } from 'react';
import {
	CheckCircle2,
	AlertTriangle,
	MessageCircle,
	Clock,
	AlertOctagon,
	Building2,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { CustomerRollup, FollowUpItem } from '../../../mocks/followUpTracker';
import { formatINR, formatINRCompact, formatRelativeContact } from './utils';

interface Props {
	rollup: CustomerRollup;
	/** The invoice number being expanded — highlighted as "you are here". */
	currentInvoiceNumber: string;
	/** Invoice numbers actually present in the current items[] window. */
	visibleInvoiceNumbers: Set<string>;
	/** Full items by invoice number — drives chip-sort priority. */
	visibleItemsByNumber: Map<string, FollowUpItem>;
	/**
	 * Invoices that share a Gmail thread with the current row or are mentioned
	 * by name in its AI summary. When provided and >1, the chip strip defaults
	 * to a "Related" view (just these) with a toggle to switch to "All".
	 */
	relatedInvoiceNumbers?: Set<string>;
	onJumpToInvoice: (invoiceNumber: string) => void;
}

/** Days since an ISO datetime. Used for the last-contact relative line. */
const daysSince = (iso: string | null): number | null => {
	if (!iso) return null;
	const t = new Date(iso).getTime();
	if (Number.isNaN(t)) return null;
	return Math.floor((Date.now() - t) / 86400000);
};

export const CustomerRollupCard: React.FC<Props> = ({
	rollup,
	currentInvoiceNumber,
	visibleInvoiceNumbers,
	visibleItemsByNumber,
	relatedInvoiceNumbers,
	onJumpToInvoice,
}) => {
	const c = rollup.counts_by_status;
	const ai = rollup.counts_by_ai_status;
	const lastContactDays = daysSince(rollup.last_contact_at);
	const lastContactRel =
		rollup.last_contact_at && lastContactDays !== null
			? formatRelativeContact(rollup.last_contact_at, lastContactDays)
			: null;

	const aiFlagTotal = ai.dispute + ai.promised_to_pay + ai.no_response;

	return (
		<div className='rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 via-white to-white p-4 shadow-sm'>
			{/* Header */}
			<div className='flex items-start justify-between gap-4 flex-wrap'>
				<div className='flex items-start gap-3 min-w-0'>
					<div className='h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0'>
						<Building2 className='h-4 w-4' />
					</div>
					<div className='min-w-0'>
						<div className='text-[11px] font-semibold uppercase tracking-wide text-emerald-700'>
							Customer overview
						</div>
						<h3 className='text-base font-semibold text-gray-900 leading-tight'>
							{rollup.customer_name}
						</h3>
						<div className='text-xs text-gray-500 mt-0.5'>
							{rollup.invoice_count} invoice{rollup.invoice_count === 1 ? '' : 's'} in our system ·{' '}
							<span className='font-medium text-gray-700'>
								{formatINRCompact(rollup.total_amount)}
							</span>{' '}
							lifetime
						</div>
					</div>
				</div>

				{/* Last contact + real-gap warning */}
				<div className='flex flex-col items-end gap-1 text-right'>
					{lastContactRel && (
						<div className='inline-flex items-center gap-1 text-[11px] text-gray-600'>
							<Clock className='h-3 w-3' />
							Last contact <span className='font-medium'>{lastContactRel}</span>
						</div>
					)}
					{rollup.real_gap_count > 0 && (
						<div className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200'>
							<AlertOctagon className='h-3 w-3' />
							{rollup.real_gap_count} no-email invoice
							{rollup.real_gap_count === 1 ? '' : 's'}
						</div>
					)}
				</div>
			</div>

			{/* Counts grid — three tiles only. The backend exposes paid_amount,
			    overdue_balance and total_balance directly. There is NO per-status
			    balance field, so we don't fabricate a "Sent ₹X" amount — the
			    breakdown row below shows status counts honestly instead. */}
			<div className='mt-3 grid grid-cols-1 md:grid-cols-3 gap-2'>
				<MetricTile
					tone='success'
					icon={<CheckCircle2 className='h-3.5 w-3.5' />}
					label='Paid'
					count={c.paid}
					amount={rollup.paid_amount}
				/>
				<MetricTile
					tone='danger'
					icon={<AlertTriangle className='h-3.5 w-3.5' />}
					label='Overdue'
					count={c.overdue}
					amount={rollup.overdue_balance}
					sub={
						c.overdue > 0
							? `Oldest ${rollup.oldest_overdue_days}d`
							: undefined
					}
				/>
				<MetricTile
					tone='neutral'
					icon={<MessageCircle className='h-3.5 w-3.5' />}
					label='Outstanding'
					count={c.overdue + c.sent + c.draft + c.other}
					amount={rollup.total_balance}
					sub={c.overdue > 0 ? `incl. ${c.overdue} overdue` : 'Everything not yet paid'}
					tooltip='All non-paid invoices including overdue. Void invoices are excluded — they carry no balance.'
					emphasised
				/>
			</div>

			{/* Status breakdown — exposes every bucket so the math is auditable.
			    Void renders as a small grey strikethrough pill only when > 0,
			    since most customers don't have any. Mismatch warning persists
			    for safety but should now be silent on the live backend. */}
			{(() => {
				const sum = c.paid + c.overdue + c.sent + c.draft + c.void + c.other;
				const missing = rollup.invoice_count - sum;
				return (
					<div className='mt-2.5 flex items-center justify-between flex-wrap gap-2 text-[11px]'>
						<div className='text-gray-600'>
							<span className='font-semibold text-gray-500 uppercase tracking-wide mr-1.5'>
								Breakdown
							</span>
							<span className='tabular-nums'>
								<span className='text-emerald-700 font-medium'>{c.paid}</span> paid ·{' '}
								<span className='text-red-700 font-medium'>{c.overdue}</span> overdue ·{' '}
								<span className='text-sky-700 font-medium'>{c.sent}</span> sent ·{' '}
								<span className='text-slate-600 font-medium'>{c.draft}</span> draft
								{c.void > 0 && (
									<>
										{' · '}
										<span
											className='text-slate-500 line-through font-medium'
											title='Void / cancelled invoices — no balance owed'
										>
											{c.void} void
										</span>
									</>
								)}
								{' · '}
								<span className='text-slate-600 font-medium'>{c.other}</span> other
							</span>{' '}
							<span className='text-gray-400'>(= {sum})</span>
						</div>
						{missing !== 0 && (
							<span
								title={`Backend's invoice_count (${rollup.invoice_count}) doesn't match the sum of counts_by_status (${sum}). Flag to backend team.`}
								className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200'
							>
								⚠ {Math.abs(missing)}{' '}
								{missing > 0 ? 'not classified by backend' : 'extra classified'}
							</span>
						)}
					</div>
				);
			})()}

			{/* AI flags row */}
			{aiFlagTotal > 0 && (
				<div className='mt-3 flex flex-wrap items-center gap-2 text-xs'>
					<span className='text-[11px] font-semibold uppercase tracking-wide text-gray-500'>
						AI flags:
					</span>
					{ai.dispute > 0 && (
						<FlagPill tone='red'>
							{ai.dispute} dispute{ai.dispute === 1 ? '' : 's'}
						</FlagPill>
					)}
					{ai.promised_to_pay > 0 && (
						<FlagPill tone='amber'>
							{ai.promised_to_pay} promised
						</FlagPill>
					)}
					{ai.no_response > 0 && (
						<FlagPill tone='amber'>
							{ai.no_response} no-response
						</FlagPill>
					)}
				</div>
			)}

			{/* Invoice chips with Related/All toggle */}
			{rollup.invoice_numbers.length > 0 && (
				<ChipStrip
					allNumbers={rollup.invoice_numbers}
					currentInvoiceNumber={currentInvoiceNumber}
					visibleInvoiceNumbers={visibleInvoiceNumbers}
					visibleItemsByNumber={visibleItemsByNumber}
					relatedInvoiceNumbers={relatedInvoiceNumbers}
					onJumpToInvoice={onJumpToInvoice}
				/>
			)}
		</div>
	);
};

// ──────────────────────────────────────────────────────────────────────────────
// Chip strip with Related/All toggle
// ──────────────────────────────────────────────────────────────────────────────

interface ChipStripProps {
	allNumbers: string[];
	currentInvoiceNumber: string;
	visibleInvoiceNumbers: Set<string>;
	visibleItemsByNumber: Map<string, FollowUpItem>;
	relatedInvoiceNumbers?: Set<string>;
	onJumpToInvoice: (invoiceNumber: string) => void;
}

/** Parse IB-YYYY-YY/#### into comparable parts for recency sorting. */
const parseInvoiceForSort = (n: string): { year: string; seq: number } => {
	const m = n.match(/^IB-(\d{4}-\d{2})\/(\d+)$/);
	if (!m) return { year: '', seq: 0 };
	return { year: m[1], seq: parseInt(m[2], 10) };
};

/** Most-recent-first: newer financial year wins; within a year, higher seq wins. */
const compareRecency = (a: string, b: string): number => {
	const ap = parseInvoiceForSort(a);
	const bp = parseInvoiceForSort(b);
	if (ap.year !== bp.year) return bp.year.localeCompare(ap.year);
	return bp.seq - ap.seq;
};

/**
 * Priority bands (lower number = shown earlier). Ordering reflects what an
 * accountant cares about first when skimming a customer history.
 *   0  the row they're currently viewing
 *   1  visible + overdue or disputed (operationally interesting)
 *   2  visible + no-response / promised-to-pay (needs nudging)
 *   3  visible + any other status
 *   4  out-of-window (no data — ranked last)
 */
const chipPriority = (
	n: string,
	currentInvoiceNumber: string,
	visibleItemsByNumber: Map<string, FollowUpItem>
): number => {
	if (n === currentInvoiceNumber) return 0;
	const item = visibleItemsByNumber.get(n);
	if (!item) return 4;
	const isOverdueOrDispute =
		item.invoice.status === 'overdue' || item.ai?.current_status === 'dispute';
	if (isOverdueOrDispute) return 1;
	const ai = item.ai?.current_status;
	if (ai === 'no_response' || ai === 'promised_to_pay') return 2;
	return 3;
};

/** Above-the-fold limit when the rollup carries more than 10 invoices. */
const COLLAPSED_CHIP_COUNT = 5;

const ChipStrip: React.FC<ChipStripProps> = ({
	allNumbers,
	currentInvoiceNumber,
	visibleInvoiceNumbers,
	visibleItemsByNumber,
	relatedInvoiceNumbers,
	onJumpToInvoice,
}) => {
	// "Related" = intersection of the rollup's history and the related set, so
	// we don't accidentally show an invoice the rollup doesn't carry. Self is
	// always in the related set, so the count is always ≥ 1 when provided.
	const allSet = new Set(allNumbers);
	const relatedInRollup =
		relatedInvoiceNumbers
			? allNumbers.filter(n => relatedInvoiceNumbers.has(n))
			: [];
	const hasMeaningfulRelated = relatedInRollup.length > 1;

	// Default to Related when there's more than one related invoice — that's
	// the case where the toggle actually buys signal. Otherwise show All.
	const [mode, setMode] = useState<'related' | 'all'>(
		hasMeaningfulRelated ? 'related' : 'all'
	);
	const [showAllChips, setShowAllChips] = useState(false);

	// If the related set ever shrinks to ≤1 (e.g. due to filter changes on a
	// future row), don't keep the Related mode locked on something pointless.
	const effectiveMode = hasMeaningfulRelated ? mode : 'all';
	const rawShown = effectiveMode === 'related' ? relatedInRollup : allNumbers;

	// Sort by operational priority, then recency. Stable enough — sort puts
	// current → overdue/dispute → silent/promised → other visible → out-of-window.
	const sortedShown = [...rawShown].sort((a, b) => {
		const ap = chipPriority(a, currentInvoiceNumber, visibleItemsByNumber);
		const bp = chipPriority(b, currentInvoiceNumber, visibleItemsByNumber);
		if (ap !== bp) return ap - bp;
		return compareRecency(a, b);
	});

	// Collapse only when there's enough to make scanning painful AND we're not
	// already filtered to "Related" (the filter has done its job).
	const shouldCollapse =
		effectiveMode === 'all' && sortedShown.length > 10 && !showAllChips;
	const displayed = shouldCollapse
		? sortedShown.slice(0, COLLAPSED_CHIP_COUNT)
		: sortedShown;
	const hiddenCount = sortedShown.length - displayed.length;

	// Also note any related invoices that the rollup doesn't carry — usually
	// older invoices outside the customer's loaded history. Surface as a hint
	// so the user knows the related set is bigger than what fits here.
	const relatedNotInRollup =
		relatedInvoiceNumbers
			? Array.from(relatedInvoiceNumbers).filter(n => !allSet.has(n))
			: [];

	return (
		<div className='mt-3 pt-3 border-t border-emerald-100'>
			<div className='flex items-center justify-between gap-3 flex-wrap mb-1.5'>
				<div className='text-[11px] font-semibold uppercase tracking-wide text-gray-500'>
					{effectiveMode === 'related' ? 'Related invoices' : 'All invoices'} (
					{sortedShown.length})
					{shouldCollapse && (
						<span className='ml-1.5 normal-case text-gray-400 font-normal tracking-normal'>
							· showing top {displayed.length}
						</span>
					)}
				</div>
				{hasMeaningfulRelated && (
					<div
						role='tablist'
						aria-label='Invoice chip filter'
						className='inline-flex items-center text-[11px] rounded-md border border-gray-200 overflow-hidden'
					>
						<button
							role='tab'
							aria-selected={effectiveMode === 'related'}
							onClick={() => setMode('related')}
							className={cn(
								'px-2 py-0.5 transition-colors',
								effectiveMode === 'related'
									? 'bg-emerald-600 text-white'
									: 'bg-white text-gray-600 hover:bg-gray-50'
							)}
						>
							Related ({relatedInRollup.length})
						</button>
						<button
							role='tab'
							aria-selected={effectiveMode === 'all'}
							onClick={() => setMode('all')}
							className={cn(
								'px-2 py-0.5 border-l border-gray-200 transition-colors',
								effectiveMode === 'all'
									? 'bg-emerald-600 text-white'
									: 'bg-white text-gray-600 hover:bg-gray-50'
							)}
						>
							All ({allNumbers.length})
						</button>
					</div>
				)}
			</div>

			<div className='flex flex-wrap gap-1 items-center'>
				{displayed.map(n => {
					const isCurrent = n === currentInvoiceNumber;
					const isVisible = visibleInvoiceNumbers.has(n);
					return (
						<button
							key={n}
							type='button'
							disabled={!isVisible && !isCurrent}
							onClick={e => {
								e.stopPropagation();
								if (isVisible) onJumpToInvoice(n);
							}}
							title={
								isCurrent
									? 'Currently viewing'
									: isVisible
										? 'Jump to this invoice in the table'
										: 'Outside the current 30-day window — not loaded'
							}
							className={cn(
								'font-mono text-[11px] px-1.5 py-0.5 rounded-md border transition-all',
								isCurrent
									? 'bg-emerald-600 text-white border-emerald-600 cursor-default'
									: isVisible
										? 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50 cursor-pointer'
										: 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
							)}
						>
							{n}
						</button>
					);
				})}
				{shouldCollapse && (
					<button
						type='button'
						onClick={e => {
							e.stopPropagation();
							setShowAllChips(true);
						}}
						className='text-[11px] px-1.5 py-0.5 rounded-md border border-dashed border-emerald-300 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 transition-colors'
					>
						+ {hiddenCount} older →
					</button>
				)}
				{effectiveMode === 'all' && sortedShown.length > 10 && showAllChips && (
					<button
						type='button'
						onClick={e => {
							e.stopPropagation();
							setShowAllChips(false);
						}}
						className='text-[11px] px-1.5 py-0.5 rounded-md border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-colors'
					>
						Show less
					</button>
				)}
			</div>

			{effectiveMode === 'related' && relatedNotInRollup.length > 0 && (
				<div className='mt-2 text-[10px] text-gray-500 italic'>
					+ {relatedNotInRollup.length} more invoice
					{relatedNotInRollup.length === 1 ? '' : 's'} mentioned in this thread but
					outside this customer&apos;s loaded history.
				</div>
			)}
		</div>
	);
};

// ──────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ──────────────────────────────────────────────────────────────────────────────

interface MetricTileProps {
	tone: 'success' | 'danger' | 'info' | 'neutral';
	icon: React.ReactNode;
	label: string;
	count: number;
	amount: number;
	sub?: string;
	tooltip?: string;
	emphasised?: boolean;
}

const TONE_CLASSES: Record<MetricTileProps['tone'], { bg: string; text: string; chip: string }> = {
	success: {
		bg: 'bg-white border-emerald-100',
		text: 'text-emerald-700',
		chip: 'bg-emerald-100 text-emerald-700',
	},
	danger: {
		bg: 'bg-white border-red-100',
		text: 'text-red-700',
		chip: 'bg-red-100 text-red-700',
	},
	info: {
		bg: 'bg-white border-sky-100',
		text: 'text-sky-700',
		chip: 'bg-sky-100 text-sky-700',
	},
	neutral: {
		bg: 'bg-white border-gray-200',
		text: 'text-gray-700',
		chip: 'bg-gray-100 text-gray-700',
	},
};

const MetricTile: React.FC<MetricTileProps> = ({
	tone,
	icon,
	label,
	count,
	amount,
	sub,
	tooltip,
	emphasised,
}) => {
	const t = TONE_CLASSES[tone];
	return (
		<div
			title={tooltip}
			className={cn(
				'rounded-lg border p-2.5',
				t.bg,
				emphasised && 'ring-1 ring-emerald-200'
			)}
		>
			<div className='flex items-center justify-between gap-2'>
				<div className={cn('inline-flex items-center gap-1.5 text-[11px] font-medium', t.text)}>
					<span className={cn('h-5 w-5 rounded flex items-center justify-center', t.chip)}>
						{icon}
					</span>
					{label}
				</div>
				<span className='text-sm font-bold text-gray-900 tabular-nums'>{count}</span>
			</div>
			<div className='mt-1 text-xs text-gray-700 tabular-nums' title={formatINR(amount)}>
				{formatINRCompact(amount)}
			</div>
			{sub && <div className='text-[10px] text-gray-500 mt-0.5'>{sub}</div>}
		</div>
	);
};

const FlagPill: React.FC<{ tone: 'red' | 'amber'; children: React.ReactNode }> = ({
	tone,
	children,
}) => (
	<span
		className={cn(
			'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border',
			tone === 'red'
				? 'bg-red-50 text-red-700 border-red-200'
				: 'bg-amber-50 text-amber-700 border-amber-200'
		)}
	>
		{children}
	</span>
);
