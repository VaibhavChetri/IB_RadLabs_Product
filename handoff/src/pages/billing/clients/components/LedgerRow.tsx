/**
 * LedgerRow — one client row in the Clients ledger.
 * Click toggles inline expansion (LedgerRowExpansion sibling).
 */

import React from 'react';
import { Flame, AlertTriangle } from 'lucide-react';
import { AgeDot } from '../../../../components/ui/AgeDot';
import { Pill } from '../../../../components/ui/Pill';
import { MicroBars } from '../../../../components/ui/MicroBars';
import { ImpactBar } from '../../../../components/ui/ImpactBar';
import { fmtINR, isFrequentBreaker, riskBucket } from '../../../../utils/billing';
import type { HealthCustomer } from '../../../../services/clientHealthApi';
import { LEDGER_COLS } from '../ClientsLedger';

interface LedgerRowProps {
	customer: HealthCustomer;
	rank: number;
	score: number;
	lastTouch: number | null;
	expanded: boolean;
	onToggle: () => void;
}

export const LedgerRow: React.FC<LedgerRowProps> = ({ customer, rank, score, lastTouch, expanded, onToggle }) => {
	const riskColor =
		score >= 80 ? 'var(--billing-risk)'
		: score >= 60 ? 'var(--billing-warn)'
		: score >= 40 ? 'var(--billing-ink)'
		: 'var(--billing-ink-3)';

	const sentiment = customer.threads[0]?.sentiment ?? '—';
	const intent = customer.threads[0]?.payment_intent ?? '—';
	const sentimentTone: 'risk' | 'good' | 'warn' | 'neutral' =
		sentiment === 'deteriorating' ? 'risk'
		: sentiment === 'cooperative' ? 'good'
		: sentiment === 'improving' ? 'good'
		: 'warn';
	const intentTone: 'risk' | 'good' | 'warn' | 'neutral' =
		intent === 'disputing' ? 'risk'
		: intent === 'pay-soon' ? 'good'
		: intent === 'untracked' ? 'warn'
		: 'neutral';

	// 12-week trend placeholder — replace with real series when backend provides it.
	const trend = Array.from({ length: 12 }, (_, i) => Math.max(0, Math.round(customer.broken_commitment_count * (i + 1) / 12)));

	const untracked = customer.thread_count === 0 && customer.total_outstanding > 0;
	// Estimated FY revenue placeholder — replace with real value when available.
	const fyRevenue = Math.max(customer.total_outstanding * 10, customer.total_outstanding);

	return (
		<div
			onClick={onToggle}
			className="grid gap-3 py-3.5 border-b border-[color:var(--billing-rule)] items-center cursor-pointer"
			style={{
				gridTemplateColumns: LEDGER_COLS,
				background: expanded ? 'var(--billing-bg-tinted)' : 'transparent',
			}}
		>
			{/* Rank */}
			<div className="editorial-em text-[18px] text-[color:var(--billing-ink-3)]">{String(rank).padStart(2, '0')}</div>

			{/* Client */}
			<div className="flex flex-col min-w-0">
				<div className="flex items-center gap-2">
					<AgeDot days={lastTouch} />
					<span className="text-[13.5px] font-semibold tracking-tight">{customer.customer_name}</span>
					{isFrequentBreaker(customer) && (
						<Pill tone="risk" icon={<Flame size={10} />}>Frequent breaker</Pill>
					)}
					{untracked && <Pill tone="warn" icon={<AlertTriangle size={10} />}>Untracked</Pill>}
				</div>
				<div className="ledger-num text-[11px] text-[color:var(--billing-ink-3)] mt-0.5 ml-[13px]">
					{customer.thread_count} threads · {lastTouch != null ? `last touched ${lastTouch}d ago` : 'no thread'}
				</div>
			</div>

			{/* Outstanding */}
			<div className="text-right">
				<div className="ledger-num text-[13px] font-medium">{fmtINR(customer.total_outstanding, 'short')}</div>
				<div className="flex justify-end mt-1">
					<ImpactBar value={customer.total_outstanding} total={fyRevenue} width={50} height={3} />
				</div>
			</div>

			{/* Overdue */}
			<div className="text-right">
				<div
					className="ledger-num text-[13px] font-medium"
					style={{ color: customer.overdue_balance > 0 ? 'var(--billing-risk)' : 'var(--billing-ink-4)' }}
				>
					{customer.overdue_balance > 0 ? fmtINR(customer.overdue_balance, 'short') : '—'}
				</div>
				<div className="ledger-num text-[10px] text-[color:var(--billing-ink-3)]">
					{customer.overdue_count > 0 ? `${customer.overdue_count} inv late` : 'on time'}
				</div>
			</div>

			{/* Behavior */}
			<div className="flex items-center gap-1.5">
				<MicroBars data={trend} width={64} height={20} color={riskColor} />
				<div className="flex flex-col">
					<span className="ledger-num text-[10px] text-[color:var(--billing-ink-3)]">12w</span>
					<span className="ledger-num text-[10px]" style={{ color: riskColor }}>
						{trend[trend.length - 1] > trend[0] ? '▲ rising' : '— flat'}
					</span>
				</div>
			</div>

			{/* Sentiment + intent */}
			<div className="flex flex-col gap-1">
				<Pill tone={sentimentTone}>{sentiment}</Pill>
				<Pill tone={intentTone}>{intent}</Pill>
			</div>

			{/* Broken */}
			<div className="text-right">
				<div
					className="ledger-num text-[13px] font-medium"
					style={{ color: customer.broken_commitment_count > 5 ? 'var(--billing-risk)' : customer.broken_commitment_count > 0 ? 'var(--billing-ink)' : 'var(--billing-ink-4)' }}
				>
					{customer.broken_commitment_count > 0 ? '×' + customer.broken_commitment_count : '—'}
				</div>
				<div className="ledger-num text-[10px] text-[color:var(--billing-ink-3)]">
					{customer.high_priority_count} hi-pri
				</div>
			</div>

			{/* Risk score */}
			<div className="text-right">
				<div className="ledger-num editorial-num text-[24px] leading-none" style={{ color: riskColor }}>
					{score}
				</div>
				<div className="kicker mt-1">{riskBucket(score)}</div>
			</div>
		</div>
	);
};
