/**
 * Pulse — billing module home. Morning briefing answering
 * "what needs me today?"
 *
 * REPLACES: src/pages/billing/ceo-overview/CeoOverview.tsx
 *
 * Data: useClientHealth() → ClientHealthApi.list({}) (existing service)
 * Derives Act-today, Needs-decision, Untracked, and This-week-broken
 * lists client-side via riskScore() and filter predicates.
 *
 * Components used:
 *   from ../../components/ui:  Pill, AgeDot, Sparkline, Skeleton, Button
 *   from ./components:         ActionColumn, ActCard, DecideCard, UntrackedCard, BrokenCard
 *   from ../../hooks:          useClientHealth
 *   from ../../utils/billing:  fmtINR, daysAgo, riskScore, isFrequentBreaker, slug
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { Sparkline } from '../../../components/ui/Sparkline';
import { useClientHealth } from '../../../hooks/useClientHealth';
import { fmtINR, daysAgo, riskScore, isFrequentBreaker, slug } from '../../../utils/billing';
import { ActionColumn } from './components/ActionColumn';
import { ActCard } from './components/ActCard';
import { DecideCard } from './components/DecideCard';
import { UntrackedCard } from './components/UntrackedCard';
import { BrokenCard } from './components/BrokenCard';

const Pulse: React.FC = () => {
	const { data, isLoading, error, refresh } = useClientHealth();

	const today = new Date().toLocaleDateString('en-IN', {
		weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
	});

	// ── Derive the three action lists from existing data ───────────────
	const ranked = data.customers
		.map(c => ({ c, score: riskScore(c) }))
		.sort((a, b) => b.score - a.score);

	const act = ranked
		.filter(({ c }) => c.threads.some(t => t.ball_in_court === 'infinitybox' || t.next_action))
		.slice(0, 5)
		.map(({ c }) => {
			const t = c.threads.find(t => t.ball_in_court === 'infinitybox' || t.next_action) ?? c.threads[0];
			return {
				customer: c,
				thread: t,
				action: t?.next_action ?? 'Follow up',
				lastTouchDays: daysAgo(t?.last_message_at) ?? null,
				frequentBreaker: isFrequentBreaker(c),
			};
		});

	const decide = ranked
		.filter(({ c }) => c.threads.some(t => t.priority === 'high' && t.broken_commitments.length > 0))
		.slice(0, 3);

	const untracked = data.customers
		.filter(c => c.thread_count === 0 && c.total_outstanding > 0)
		.slice(0, 5);

	const brokenThisWeek = data.customers.flatMap(c =>
		c.threads.flatMap(t =>
			t.broken_commitments.map(bc => ({
				customer: c, thread: t, commitment: bc,
				ageDays: daysAgo(t.last_message_at),
			}))
		)
	)
	.filter(x => x.ageDays != null && x.ageDays <= 7)
	.sort((a, b) => (a.ageDays ?? 0) - (b.ageDays ?? 0))
	.slice(0, 6);

	const untrackedTotal = untracked.reduce((s, c) => s + c.total_outstanding, 0);

	// ── 12-week sparkline (placeholder until backend provides series) ──
	// Replace this with a real time series once /customers/health adds it.
	const trend12w = [3, 5, 4, 6, 8, 7, 9, 11, 10, 12, 14, 15];

	return (
		<div className="h-full overflow-auto px-7 py-6">
			{/* ─── Editorial dek ──────────────────────────────────────── */}
			<section className="rule-top-ink pt-4">
				<div className="flex items-baseline gap-4 mb-2">
					<span className="kicker">Pulse · {today}</span>
					<span className="text-[11px] text-[color:var(--billing-ink-3)] ledger-num">
						FY 25–26
					</span>
					<div className="flex-1" />
					<button
						onClick={refresh}
						disabled={isLoading}
						className="text-[11px] px-2.5 py-1 border border-[color:var(--billing-rule)] rounded text-[color:var(--billing-ink-2)] inline-flex items-center gap-1.5 disabled:opacity-50"
					>
						<RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} /> Refresh
					</button>
				</div>

				<h1 className="editorial-num text-[44px] leading-[1.1] tracking-tight m-0 text-[color:var(--billing-ink)] max-w-[1080px]">
					<span className="ledger-num text-[color:var(--billing-risk)]">{fmtINR(data.meta.total_overdue, 'short')}</span>{' '}
					overdue across {data.customers.filter(c => c.overdue_count > 0).length} clients.{' '}
					<span className="editorial-em">{brokenThisWeek.length} of your top ten broke a promise</span> this week,
					and <span className="ledger-num">{fmtINR(untrackedTotal, 'short')}</span> is moving without an email trail.
				</h1>

				{/* Inline KPI strip — sentence-feel, not card grid */}
				<div className="flex items-center gap-6 mt-4 pt-3 border-t border-[color:var(--billing-rule)] flex-wrap">
					<InlineStat label="Outstanding"    value={fmtINR(data.meta.total_outstanding)} />
					<InlineStat label="Overdue"        value={fmtINR(data.meta.total_overdue)} tone="risk" />
					<InlineStat label="Broken commits" value={String(data.meta.total_broken_commitments)} tone="risk" />
					<InlineStat label="High-priority"  value={String(data.meta.total_high_priority)} />
					<InlineStat label="Untracked rev." value={fmtINR(untrackedTotal, 'short')} tone="warn" />
					<InlineStat label="Clients flagged" value={`${data.meta.total_customers} / ${data.customers.length}`} />
					<div className="flex-1" />
					<div className="text-right">
						<div className="kicker">12-week trend</div>
						<div className="flex items-center gap-1.5 mt-0.5">
							<Sparkline data={trend12w} width={90} height={20} stroke="var(--billing-risk)" />
							<span className="ledger-num text-[11px] text-[color:var(--billing-risk)]">▲ 4×</span>
						</div>
					</div>
				</div>
			</section>

			{/* ─── Three column action board ──────────────────────────── */}
			<section className="grid grid-cols-[1.15fr_1fr_1fr] gap-4 mt-6">
				<ActionColumn title="Act today" count={act.length} sub="Ball in your court" tone="ink">
					{act.map(({ customer, thread, action, lastTouchDays, frequentBreaker }) => (
						<ActCard
							key={customer.customer_name}
							slug={slug(customer.customer_name)}
							name={customer.customer_name}
							action={action}
							why={thread?.summary ?? ''}
							lastTouchDays={lastTouchDays}
							amount={thread?.thread_outstanding ?? customer.total_outstanding}
							invoiceRef={thread?.invoice_numbers ?? null}
							frequentBreaker={frequentBreaker}
						/>
					))}
				</ActionColumn>

				<ActionColumn title="Needs decision" count={decide.length} sub="Awaiting you to break tie" tone="warn">
					{decide.map(({ c }) => {
						const hi = c.threads.find(t => t.priority === 'high') ?? c.threads[0];
						return (
							<DecideCard
								key={c.customer_name}
								slug={slug(c.customer_name)}
								name={c.customer_name}
								action={`Review ${c.broken_commitment_count} broken commits`}
								why={hi?.summary ?? ''}
								amount={c.overdue_balance || c.total_outstanding}
							/>
						);
					})}
				</ActionColumn>

				<ActionColumn
					title="Untracked revenue"
					count={untracked.length}
					sub="Invoiced — zero email coverage"
					tone="risk"
					totalAmount={fmtINR(untrackedTotal, 'short')}
				>
					{untracked.map(c => (
						<UntrackedCard
							key={c.customer_name}
							slug={slug(c.customer_name)}
							name={c.customer_name}
							amount={c.total_outstanding}
							invoices={c.overdue_count || 1}
						/>
					))}
				</ActionColumn>
			</section>

			{/* ─── This week's broken promises ─────────────────────────── */}
			<section className="mt-6 pt-4 rule-top-ink">
				<div className="flex items-baseline gap-3 mb-3.5">
					<h2 className="editorial-num text-[24px] m-0 tracking-tight">This week&apos;s broken promises</h2>
					<span className="ledger-num text-xs text-[color:var(--billing-ink-3)]">
						{brokenThisWeek.length} total
					</span>
					<div className="flex-1" />
					<Link to="/billing/clients?filter=broken" className="text-xs text-[color:var(--billing-ink)] border-b border-[color:var(--billing-ink-4)] hover:border-[color:var(--billing-ink)]">
						Open all in Clients →
					</Link>
				</div>
				<div className="grid grid-cols-3 gap-4">
					{brokenThisWeek.slice(0, 3).map((b, i) => (
						<BrokenCard
							key={i}
							client={b.customer.customer_name}
							who={b.commitment.by_party === 'infinitybox' ? 'Broken by IB' : 'Broken by client'}
							ageDays={b.ageDays}
							promise={b.commitment.what}
							sub={b.thread.summary}
							invoiceRef={b.thread.invoice_numbers}
							amount={fmtINR(b.thread.thread_outstanding, 'short') + ' outstanding'}
						/>
					))}
				</div>
			</section>

			{error && (
				<div className="mt-6 rounded border border-[color:var(--billing-risk-rule)] bg-[color:var(--billing-risk-bg)] p-3 text-sm text-[color:var(--billing-risk)]">
					{error}
				</div>
			)}

			<div className="h-8" />
		</div>
	);
};

// ── Inline KPI stat (sentence-feel, lives in the dek strip) ───────────
const InlineStat: React.FC<{ label: string; value: string; tone?: 'ink' | 'risk' | 'warn' }> = ({ label, value, tone = 'ink' }) => (
	<div className="flex flex-col min-w-0">
		<span className="kicker">{label}</span>
		<span
			className="ledger-num text-[14px] font-medium mt-0.5"
			style={{
				color:
					tone === 'risk' ? 'var(--billing-risk)'
					: tone === 'warn' ? 'var(--billing-warn)'
					: 'var(--billing-ink)',
			}}
		>
			{value}
		</span>
	</div>
);

export default Pulse;
