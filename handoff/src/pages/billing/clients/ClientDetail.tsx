/**
 * ClientDetail — the linkage view. One client, full story.
 *
 * REPLACES: src/pages/billing/client-health/ClientHealth.tsx (per-customer drilldown)
 *
 * Route: /billing/clients/:customerId  (customerId = slug of customer_name)
 * Data: useClientHealth() then filter by slug match
 *
 * Sections:
 *   1. Masthead — name + status pills + key amounts + actions
 *   2. Context strip — Health / Activity / Money panels w/ sparklines
 *   3. Timeline (left) + Open commitments + Overdue invoices (right)
 *
 * Components used:
 *   from ../../components/ui: Pill, Sparkline, MicroBars, Timeline
 *   from ./components:        ContextPanel
 */

import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Flame, AlertTriangle, Mail, MoreHorizontal, Zap } from 'lucide-react';
import { useClientHealth } from '../../../hooks/useClientHealth';
import { fmtINR, daysAgo, slug, isFrequentBreaker, riskScore } from '../../../utils/billing';
import { Pill } from '../../../components/ui/Pill';
import { Sparkline } from '../../../components/ui/Sparkline';
import { MicroBars } from '../../../components/ui/MicroBars';
import { Timeline, type TimelineEvent } from '../../../components/ui/Timeline';
import { ContextPanel } from './components/ContextPanel';

const ClientDetail: React.FC = () => {
	const { customerId } = useParams();
	const { data, isLoading, error } = useClientHealth();

	const customer = useMemo(
		() => data.customers.find(c => slug(c.customer_name) === customerId),
		[data.customers, customerId]
	);

	if (isLoading) return <div className="p-8 text-sm text-[color:var(--billing-ink-3)]">Loading…</div>;
	if (error)     return <div className="p-8 text-sm text-[color:var(--billing-risk)]">{error}</div>;
	if (!customer) return <div className="p-8 text-sm text-[color:var(--billing-ink-3)]">Client not found. <Link to="/billing/clients">Back to ledger</Link></div>;

	const score = riskScore(customer);
	const lastTouch = daysAgo(customer.threads[0]?.last_message_at);

	// Build unified timeline from thread-side events. Backend will later
	// add invoice + payment events — they slot in here without UI changes.
	const events: TimelineEvent[] = customer.threads.flatMap(t => {
		const evs: TimelineEvent[] = [];
		t.broken_commitments.forEach((bc, i) => {
			evs.push({
				id: `${t.provider_thread_id}-bc-${i}`,
				type: 'commit_broken',
				tone: 'risk',
				date: t.last_message_at,
				title: `Commitment broken by ${bc.by_party === 'infinitybox' ? 'IB' : 'client'}`,
				quote: bc.what,
				meta: bc.deadline_text ? `Promised by ${bc.deadline_text} · never followed up` : 'Never followed up',
				links: [
					{ icon: <span>📄</span>, label: t.invoice_numbers },
					{ icon: <Mail size={10} />, label: t.subject },
				],
			});
		});
		t.risk_signals.forEach((s, i) => {
			evs.push({
				id: `${t.provider_thread_id}-rs-${i}`,
				type: 'signal',
				tone: s.severity === 'high' ? 'risk' : s.severity === 'medium' ? 'warn' : 'neutral',
				date: t.last_message_at,
				title: `AI signal · ${s.type}`,
				quote: s.evidence,
				meta: s.speaker_name ? `Extracted · ${s.speaker_name}` : 'Extracted from thread',
				links: [{ icon: <Mail size={10} />, label: t.subject }],
			});
		});
		t.pending_actions.forEach((pa, i) => {
			evs.push({
				id: `${t.provider_thread_id}-pa-${i}`,
				type: 'action',
				tone: pa.status === 'open' ? 'warn' : 'good',
				date: t.last_message_at,
				title: `${pa.owner === 'infinitybox' ? 'IB to' : 'Client to'}: ${pa.description}`,
				quote: null,
				meta: pa.deadline_text ? `Deadline: ${pa.deadline_text} · ${pa.status}` : pa.status,
				links: [],
			});
		});
		return evs;
	}).sort((a, b) => +new Date(b.date) - +new Date(a.date));

	// Placeholder series — replace with real data when backend ships time series.
	const sentimentSeries = [60, 58, 55, 50, 45, 42, 38, 35, 32, 28, 26, 22];
	const responseSeries  = [2.1, 2.4, 3.0, 3.5, 4.0, 4.3, 4.5, 4.4, 4.6, 4.3, 4.3, 4.3];
	const paymentSeries   = [12, 10, 14, 8, 11, 6, 4, 7, 5, 3, 2, 1];

	const sumOurResponse = customer.threads
		.filter(t => t.our_avg_response_days != null)
		.reduce((s, t) => s + (t.our_avg_response_days ?? 0), 0);
	const avgOurResponse = sumOurResponse / Math.max(1, customer.threads.filter(t => t.our_avg_response_days != null).length);

	const sumTheirResponse = customer.threads
		.filter(t => t.their_avg_response_days != null)
		.reduce((s, t) => s + (t.their_avg_response_days ?? 0), 0);
	const avgTheirResponse = sumTheirResponse / Math.max(1, customer.threads.filter(t => t.their_avg_response_days != null).length);

	const predictedPayment = customer.threads.find(t => t.predicted_payment_window)?.predicted_payment_window;

	return (
		<div className="h-full overflow-auto">

			{/* ─── Masthead ──────────────────────────────────────────── */}
			<header className="px-9 pt-6 pb-5 rule-bottom-ink bg-[color:var(--billing-bg)]">
				<div className="flex items-baseline gap-3 flex-wrap">
					<span className="kicker">Client · {customer.thread_count} threads</span>
					{score >= 80 && <Pill tone="risk" icon={<AlertTriangle size={10} />}>At risk · {score}</Pill>}
					{isFrequentBreaker(customer) && (
						<Pill tone="risk" icon={<Flame size={10} />}>
							Frequent breaker · {customer.broken_commitment_count} broken
						</Pill>
					)}
					{customer.threads[0]?.payment_intent === 'disputing' && <Pill tone="warn">Disputing</Pill>}
					<div className="flex-1" />
					<span className="ledger-num text-[11px] text-[color:var(--billing-ink-3)]">
						Last touched {lastTouch != null ? `${lastTouch}d ago` : 'never'}
					</span>
				</div>

				<h1 className="editorial-num text-[48px] leading-[1.02] tracking-tight m-0 mt-2 mb-1.5">
					{customer.customer_name}
				</h1>

				<div className="flex items-end justify-between gap-6 mt-3.5">
					<div className="flex gap-8">
						<MastheadStat label="Outstanding" value={fmtINR(customer.total_outstanding)} />
						<Divider />
						<MastheadStat label="Overdue" value={fmtINR(customer.overdue_balance)} tone="risk" sub={`${customer.overdue_count} invoices`} />
						<Divider />
						<MastheadStat
							label="Predicted clearance"
							value={<span className="editorial-em text-[26px] text-[color:var(--billing-good)]">{predictedPayment?.replace('_', ' ') ?? '—'}</span>}
						/>
					</div>
					<div className="flex gap-1.5">
						<button className="text-xs px-3.5 py-1.5 bg-[color:var(--billing-ink)] text-[color:var(--billing-bg)] rounded border-0 font-medium cursor-pointer inline-flex items-center gap-1.5">
							<Zap size={12} /> Send follow-up
						</button>
						<button className="text-xs px-3 py-1.5 bg-transparent border border-[color:var(--billing-rule)] rounded text-[color:var(--billing-ink-2)] cursor-pointer inline-flex items-center gap-1.5">
							<Mail size={12} /> Open thread
						</button>
						<button className="text-xs px-2.5 py-1.5 bg-transparent border border-[color:var(--billing-rule)] rounded text-[color:var(--billing-ink-3)] cursor-pointer">
							<MoreHorizontal size={12} />
						</button>
					</div>
				</div>
			</header>

			{/* ─── Context strip ─────────────────────────────────────── */}
			<section className="px-9 py-5 border-b border-[color:var(--billing-rule)] grid gap-7" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
				<ContextPanel
					title="Health"
					right="12-week sentiment"
					rows={[
						['Sentiment',     customer.threads[0]?.sentiment ?? '—', 'risk'],
						['Payment intent',customer.threads[0]?.payment_intent ?? '—', 'risk'],
						['Open AI flags', `${customer.threads.reduce((s, t) => s + t.risk_signals.length, 0)} of ${customer.thread_count}`, 'warn'],
					]}
					chart={<Sparkline data={sentimentSeries} width={300} height={36} stroke="var(--billing-risk)" area />}
					chartLabel="Cooperative score declining"
				/>
				<ContextPanel
					title="Activity"
					right="12-week response time"
					rows={[
						['Avg response (theirs)', avgTheirResponse > 0 ? `${avgTheirResponse.toFixed(1)}d` : '—', 'good'],
						['Avg response (ours)',   avgOurResponse > 0 ? `${avgOurResponse.toFixed(1)}d` : '—', 'warn'],
						['Threads / hi-pri',      `${customer.thread_count} / ${customer.high_priority_count}`, 'ink'],
					]}
					chart={<Sparkline data={responseSeries} width={300} height={36} stroke="var(--billing-warn)" />}
					chartLabel="Our response degraded over 12 weeks"
				/>
				<ContextPanel
					title="Money"
					right="Weekly payments received"
					rows={[
						['Overdue',        fmtINR(customer.overdue_balance), 'risk'],
						['Outstanding',    fmtINR(customer.total_outstanding), 'ink'],
						['Predicted paid', predictedPayment?.replace('_', ' ') ?? '—', 'warn'],
					]}
					chart={<MicroBars data={paymentSeries} width={300} height={36} color="var(--billing-ink)" />}
					chartLabel="Paid velocity slowing"
				/>
			</section>

			{/* ─── Two-column body ───────────────────────────────────── */}
			<section className="px-9 py-5 grid gap-8" style={{ gridTemplateColumns: '1.55fr 1fr' }}>

				{/* Timeline */}
				<div>
					<div className="flex items-baseline gap-3 mb-4">
						<h2 className="editorial-num text-[26px] m-0 tracking-tight">Timeline</h2>
						<span className="ledger-num text-[11px] text-[color:var(--billing-ink-3)]">
							{events.length} events
						</span>
					</div>
					<Timeline events={events.slice(0, 12)} emptyText="No events on file." />
				</div>

				{/* Right rail */}
				<aside className="flex flex-col gap-6">
					<RightRailSection title="Open commitments" count={customer.broken_commitment_count}>
						{customer.threads.flatMap(t => t.broken_commitments.slice(0, 1).map((bc, i) => (
							<div
								key={t.provider_thread_id + '-' + i}
								className="pl-3 py-2 border-b border-[color:var(--billing-rule)]"
								style={{ borderLeft: `2px solid ${bc.by_party === 'infinitybox' ? 'var(--billing-warn)' : 'var(--billing-risk)'}` }}
							>
								<div className="flex justify-between gap-2 items-baseline">
									<span className="text-[11px] font-medium" style={{ color: bc.by_party === 'infinitybox' ? 'var(--billing-warn)' : 'var(--billing-risk)' }}>
										{bc.by_party === 'infinitybox' ? 'Promised by IB' : 'Promised by client'}
									</span>
									<span className="ledger-num text-[10px] text-[color:var(--billing-ink-3)]">
										{daysAgo(t.last_message_at)}d ago
									</span>
								</div>
								<div className="editorial-em text-[14px] text-[color:var(--billing-ink)] mt-1 leading-tight">"{bc.what}"</div>
								<div className="ledger-num text-[10px] text-[color:var(--billing-ink-2)] mt-1.5">
									{t.invoice_numbers} · {fmtINR(t.thread_outstanding, 'short')}
								</div>
							</div>
						))).slice(0, 4)}
					</RightRailSection>

					<RightRailSection title="Overdue invoices" count={customer.overdue_count} subRight={fmtINR(customer.overdue_balance, 'short')} subTone="risk">
						<div className="grid gap-0" style={{ gridTemplateColumns: '1fr auto auto' }}>
							{['Invoice', 'Amount', 'Status'].map((h, i) => (
								<div key={i} className="kicker py-1 border-b border-[color:var(--billing-ink)]" style={{ textAlign: i ? 'right' : 'left' }}>{h}</div>
							))}
							{customer.threads.slice(0, 7).map((t, i) => (
								<React.Fragment key={i}>
									<div className="ledger-num text-[11px] py-1.5 border-b border-dotted border-[color:var(--billing-rule)] text-[color:var(--billing-ink-2)]">
										{t.invoice_numbers || '—'}
									</div>
									<div className="ledger-num text-[11px] py-1.5 border-b border-dotted border-[color:var(--billing-rule)] text-right">
										{fmtINR(t.thread_outstanding, 'short')}
									</div>
									<div className="ledger-num text-[11px] py-1.5 pl-3 border-b border-dotted border-[color:var(--billing-rule)] text-right text-[color:var(--billing-ink-3)]">
										{t.priority}
									</div>
								</React.Fragment>
							))}
						</div>
					</RightRailSection>
				</aside>
			</section>

			<div className="h-9" />
		</div>
	);
};

const Divider = () => <div className="w-px self-stretch bg-[color:var(--billing-rule)]" />;

const MastheadStat: React.FC<{ label: string; value: React.ReactNode; tone?: 'ink' | 'risk' | 'good'; sub?: string }> = ({ label, value, tone, sub }) => (
	<div>
		<div className="kicker">{label}</div>
		<div
			className="editorial-num ledger-num text-[34px] leading-none mt-1"
			style={{ color: tone === 'risk' ? 'var(--billing-risk)' : tone === 'good' ? 'var(--billing-good)' : 'var(--billing-ink)' }}
		>
			{value}
		</div>
		{sub && <div className="ledger-num text-[10px] text-[color:var(--billing-ink-3)] mt-1">{sub}</div>}
	</div>
);

const RightRailSection: React.FC<{ title: string; count?: number; subRight?: string; subTone?: 'risk' | 'ink'; children: React.ReactNode }> = ({ title, count, subRight, subTone, children }) => (
	<div>
		<div className="flex items-baseline justify-between mb-2.5">
			<h3 className="editorial-num text-[18px] m-0 tracking-tight">{title}</h3>
			{subRight ? (
				<span className="ledger-num text-[11px]" style={{ color: subTone === 'risk' ? 'var(--billing-risk)' : 'var(--billing-ink-2)' }}>
					{count != null && `${count} · `}{subRight}
				</span>
			) : count != null && (
				<span className="ledger-num text-[11px] text-[color:var(--billing-risk)]">{count}</span>
			)}
		</div>
		{children}
	</div>
);

export default ClientDetail;
