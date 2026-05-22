/**
 * ClientsLedger — unified table replacing 4 of the 5 old report pages.
 *
 * REPLACES (folds into one view with filter chips):
 *   - src/pages/billing/broken-commitments/BrokenCommitments.tsx
 *   - src/pages/billing/overdue-behaviour/OverdueBehaviourMap.tsx
 *   - src/pages/billing/pipeline-gaps/PipelineGaps.tsx
 *   - parts of src/pages/billing/client-health/ClientHealth.tsx (list view)
 *
 * Data: useClientHealth() (existing service)
 * Sort: composite riskScore() descending by default; URL ?sort= can override
 * Filter: URL ?filter= drives chip state (all|at-risk|watch|healthy|broken|disputing|untracked|frequent)
 *
 * Components used:
 *   from ../../components/ui: AgeDot, Pill, MicroBars, ImpactBar, Skeleton
 *   from ./components:        LedgerRow, LedgerRowExpansion
 */

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { useClientHealth } from '../../../hooks/useClientHealth';
import { riskScore, isFrequentBreaker, daysAgo } from '../../../utils/billing';
import { LedgerRow } from './components/LedgerRow';
import { LedgerRowExpansion } from './components/LedgerRowExpansion';
import type { HealthCustomer } from '../../../services/clientHealthApi';

type FilterKey = 'all' | 'at-risk' | 'watch' | 'healthy' | 'broken' | 'disputing' | 'untracked' | 'frequent';

const FILTER_CHIPS: Array<{ key: FilterKey; label: string }> = [
	{ key: 'all',       label: 'All' },
	{ key: 'at-risk',   label: 'At risk' },
	{ key: 'watch',     label: 'Watch' },
	{ key: 'healthy',   label: 'Healthy' },
	{ key: 'broken',    label: 'Broken commits' },
	{ key: 'disputing', label: 'Disputing' },
	{ key: 'untracked', label: 'Untracked' },
	{ key: 'frequent',  label: 'Frequent breaker' },
];

function matchesFilter(c: HealthCustomer, score: number, f: FilterKey): boolean {
	switch (f) {
		case 'at-risk':   return score >= 80;
		case 'watch':     return score >= 60 && score < 80;
		case 'healthy':   return score < 60;
		case 'broken':    return c.broken_commitment_count > 0;
		case 'disputing': return c.threads.some(t => t.payment_intent === 'disputing');
		case 'untracked': return c.thread_count === 0 && c.total_outstanding > 0;
		case 'frequent':  return isFrequentBreaker(c);
		case 'all':
		default:          return true;
	}
}

const ClientsLedger: React.FC = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const filterKey = (searchParams.get('filter') as FilterKey | null) ?? 'all';
	const { data, isLoading, error, refresh } = useClientHealth();
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [search, setSearch] = useState('');

	const ranked = useMemo(() => {
		return data.customers
			.map(c => ({ c, score: riskScore(c), lastTouch: daysAgo(c.threads[0]?.last_message_at) }))
			.sort((a, b) => b.score - a.score);
	}, [data.customers]);

	const filtered = useMemo(() => {
		return ranked.filter(({ c, score }) => {
			if (!matchesFilter(c, score, filterKey)) return false;
			if (search && !c.customer_name.toLowerCase().includes(search.toLowerCase())) return false;
			return true;
		});
	}, [ranked, filterKey, search]);

	const atRisk = ranked.filter(r => r.score >= 80).length;
	const watch = ranked.filter(r => r.score >= 60 && r.score < 80).length;
	const healthy = ranked.filter(r => r.score < 60).length;

	const setFilter = (key: FilterKey) => {
		const next = new URLSearchParams(searchParams);
		if (key === 'all') next.delete('filter');
		else next.set('filter', key);
		setSearchParams(next);
	};

	return (
		<div className="h-full overflow-auto px-7 py-6">

			{/* ─── Header ──────────────────────────────────────────── */}
			<header className="rule-top-ink pt-4 pb-5">
				<div className="flex items-end justify-between gap-4 flex-wrap">
					<div>
						<span className="kicker">The Ledger · {data.customers.length} active clients</span>
						<h1 className="editorial-num text-[38px] leading-[1.05] tracking-tight m-0 mt-1">
							Clients, by <span className="editorial-em">composite risk</span>.
						</h1>
						<p className="text-[12.5px] text-[color:var(--billing-ink-2)] mt-2 max-w-[720px] leading-relaxed">
							Outstanding × overdue-age × sentiment trajectory × broken-commit cadence.
							Higher score = more attention warranted today.
						</p>
					</div>
					<div className="flex gap-4 items-baseline">
						<HeaderStat label="At risk"    value={atRisk}   tone="risk" />
						<HeaderStat label="Watch"      value={watch}    tone="warn" />
						<HeaderStat label="Monitored"  value={healthy}  tone="good" />
					</div>
				</div>
			</header>

			{/* ─── Filter / search bar ─────────────────────────────── */}
			<div className="flex items-center gap-1.5 py-3 border-y border-[color:var(--billing-rule)] flex-wrap">
				{FILTER_CHIPS.map(({ key, label }) => (
					<button
						key={key}
						onClick={() => setFilter(key)}
						className={
							'text-[11.5px] px-2.5 py-1 rounded border cursor-pointer ' +
							(filterKey === key
								? 'bg-[color:var(--billing-ink)] text-[color:var(--billing-bg)] border-[color:var(--billing-ink)]'
								: 'bg-transparent text-[color:var(--billing-ink-2)] border-[color:var(--billing-rule)]')
						}
					>
						{label}
					</button>
				))}
				<div className="flex-1" />
				<div className="flex items-center gap-1.5 px-2.5 py-1 border border-[color:var(--billing-rule)] rounded text-[11.5px] text-[color:var(--billing-ink-3)] min-w-[220px]">
					<Search size={12} />
					<input
						value={search}
						onChange={e => setSearch(e.target.value)}
						placeholder="Search client, invoice, quote…"
						className="bg-transparent outline-none flex-1 text-[color:var(--billing-ink)] placeholder:text-[color:var(--billing-ink-3)]"
					/>
					<span className="ledger-num text-[10px]">⌘K</span>
				</div>
				<button className="text-[11.5px] px-2.5 py-1 bg-transparent border border-[color:var(--billing-rule)] rounded text-[color:var(--billing-ink-2)] inline-flex items-center gap-1.5 cursor-pointer">
					<Filter size={12} /> Sort: Risk ▾
				</button>
				<button
					onClick={refresh}
					disabled={isLoading}
					className="text-[11.5px] px-2.5 py-1 bg-transparent border border-[color:var(--billing-rule)] rounded text-[color:var(--billing-ink-2)] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
				>
					<RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
				</button>
			</div>

			{/* ─── Column headers ──────────────────────────────────── */}
			<div className="grid gap-3 py-2 px-0 border-b border-[color:var(--billing-ink)]" style={{ gridTemplateColumns: LEDGER_COLS }}>
				{['#', 'Client · status · last touched', 'Outstanding', 'Overdue · inv', 'Behavior', 'Sentiment · intent', 'Broken', 'Risk'].map((h, i) => (
					<div key={i} className="kicker" style={{ textAlign: i >= 2 && i !== 4 && i !== 5 ? 'right' : 'left' }}>{h}</div>
				))}
			</div>

			{/* ─── Rows ────────────────────────────────────────────── */}
			{filtered.map(({ c, score, lastTouch }, i) => (
				<React.Fragment key={c.customer_name}>
					<LedgerRow
						customer={c}
						rank={i + 1}
						score={score}
						lastTouch={lastTouch}
						expanded={expandedId === c.customer_name}
						onToggle={() => setExpandedId(expandedId === c.customer_name ? null : c.customer_name)}
					/>
					{expandedId === c.customer_name && <LedgerRowExpansion customer={c} />}
				</React.Fragment>
			))}

			{/* ─── Empty / error states ────────────────────────────── */}
			{!isLoading && filtered.length === 0 && (
				<div className="text-center py-16 text-sm text-[color:var(--billing-ink-3)]">
					No clients match the current filter.
				</div>
			)}
			{error && (
				<div className="mt-6 rounded border border-[color:var(--billing-risk-rule)] bg-[color:var(--billing-risk-bg)] p-3 text-sm text-[color:var(--billing-risk)]">
					{error}
				</div>
			)}

			<div className="flex justify-between items-center py-3 text-[11px] text-[color:var(--billing-ink-3)]">
				<span>Showing {filtered.length} of {ranked.length} · sorted by risk descending</span>
			</div>
		</div>
	);
};

// Grid template shared by header + rows. Exported so LedgerRow stays in sync.
export const LEDGER_COLS = '36px 2.4fr 1.1fr 1.1fr 1fr 0.95fr 0.7fr 0.7fr';

const HeaderStat: React.FC<{ label: string; value: number; tone: 'risk' | 'warn' | 'good' }> = ({ label, value, tone }) => (
	<div className="text-right">
		<div className="kicker">{label}</div>
		<div
			className="editorial-num ledger-num text-[30px] leading-none mt-1"
			style={{
				color: tone === 'risk' ? 'var(--billing-risk)'
				     : tone === 'warn' ? 'var(--billing-warn)'
				     : 'var(--billing-good)',
			}}
		>
			{value}
		</div>
	</div>
);

export default ClientsLedger;
