/**
 * LedgerRowExpansion — inline detail revealed when a ledger row is clicked.
 *
 * Promotes the "killer linkage" view onto the ledger: shows the latest AI
 * signal (with quoted evidence), the next action, ball-in-court, response
 * stats, and 4 linkage chips that deep-link to invoices/threads/commits.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, Mail, FileText, AlertTriangle, Wallet } from 'lucide-react';
import { Pill } from '../../../../components/ui/Pill';
import { fmtINR, slug } from '../../../../utils/billing';
import type { HealthCustomer } from '../../../../services/clientHealthApi';

interface LedgerRowExpansionProps {
	customer: HealthCustomer;
}

export const LedgerRowExpansion: React.FC<LedgerRowExpansionProps> = ({ customer }) => {
	const topThread = customer.threads.find(t => t.priority === 'high') ?? customer.threads[0];
	const topSignal = topThread?.risk_signals[0];

	return (
		<div
			className="grid gap-7 py-4 pb-4 px-7 pl-[60px]"
			style={{ gridTemplateColumns: '1.4fr 1fr 1fr', background: 'var(--billing-bg-tinted)' }}
		>
			{/* Latest signal */}
			<div>
				<div className="kicker mb-2">
					Latest extracted signal{topSignal?.temporal_context?.days_open != null && ` · ${topSignal.temporal_context.days_open}d open`}
				</div>
				{topSignal ? (
					<div className="pl-3" style={{ borderLeft: '2px solid var(--billing-risk)' }}>
						<div className="editorial-em text-[19px] leading-snug text-[color:var(--billing-ink)] tracking-tight">
							"{topSignal.evidence}"
						</div>
						<div className="flex gap-3 mt-2 text-[11px] text-[color:var(--billing-ink-3)] ledger-num">
							<span>
								<span style={{ color: 'var(--billing-risk)' }}>●</span> {topSignal.type}
							</span>
							<span>·</span>
							{topSignal.speaker_name && <><span>{topSignal.speaker_name}</span><span>·</span></>}
							<span>{topSignal.severity}</span>
						</div>
						{topThread?.summary && (
							<div className="text-xs text-[color:var(--billing-ink-2)] mt-2 leading-relaxed">{topThread.summary}</div>
						)}
					</div>
				) : (
					<div className="text-xs text-[color:var(--billing-ink-3)]">No signals extracted on this client.</div>
				)}
			</div>

			{/* Next action */}
			<div>
				<div className="kicker mb-2">Next action</div>
				{topThread?.next_action ? (
					<div className="flex items-center gap-2 mb-1.5">
						<ArrowRight size={14} />
						<span className="text-sm font-medium">{topThread.next_action}</span>
					</div>
				) : (
					<div className="text-xs text-[color:var(--billing-ink-3)]">Awaiting buyer.</div>
				)}
				<div className="flex gap-3 mt-3.5 text-[11px]">
					{topThread?.ball_in_court && (
						<div>
							<div className="kicker">Ball in court</div>
							<div className="ledger-num mt-0.5 text-xs">{topThread.ball_in_court}</div>
						</div>
					)}
					{topThread?.their_avg_response_days != null && (
						<div>
							<div className="kicker">Their resp.</div>
							<div className="ledger-num mt-0.5 text-xs" style={{ color: topThread.their_avg_response_days < 2 ? 'var(--billing-good)' : 'var(--billing-warn)' }}>
								{topThread.their_avg_response_days.toFixed(1)}d
							</div>
						</div>
					)}
					{topThread?.our_avg_response_days != null && (
						<div>
							<div className="kicker">Our resp.</div>
							<div className="ledger-num mt-0.5 text-xs" style={{ color: topThread.our_avg_response_days < 2 ? 'var(--billing-good)' : 'var(--billing-warn)' }}>
								{topThread.our_avg_response_days.toFixed(1)}d
							</div>
						</div>
					)}
					{topThread?.predicted_payment_window && (
						<div>
							<div className="kicker">Predicted</div>
							<div className="ledger-num mt-0.5 text-xs text-[color:var(--billing-good)]">
								{topThread.predicted_payment_window.replace('_', ' ')}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Linkage chips */}
			<div>
				<div className="kicker mb-2">Linkage</div>
				<div className="flex flex-col gap-1.5">
					{topThread?.invoice_numbers && (
						<LinkChip icon={<FileText size={13} />} title={topThread.invoice_numbers} sub={fmtINR(topThread.thread_outstanding, 'short')} />
					)}
					<LinkChip icon={<Mail size={13} />} title={`Thread · ${topThread?.message_count ?? 0} msgs`} sub={topThread?.subject ?? '—'} />
					{customer.broken_commitment_count > 0 && (
						<LinkChip icon={<AlertTriangle size={13} />} title={`${customer.broken_commitment_count} broken commitments`} sub="Open in detail" />
					)}
					{customer.overdue_count > 0 && (
						<LinkChip icon={<Wallet size={13} />} title={`${customer.overdue_count} overdue invoices`} sub={fmtINR(customer.overdue_balance, 'short')} />
					)}
				</div>
				<div className="flex gap-1.5 mt-3">
					<Link
						to={`/billing/clients/${slug(customer.customer_name)}`}
						className="text-[11.5px] px-3 py-1.5 bg-[color:var(--billing-ink)] text-[color:var(--billing-bg)] rounded font-medium no-underline inline-flex items-center gap-1"
					>
						Open client →
					</Link>
					<button className="text-[11.5px] px-2.5 py-1.5 bg-transparent border border-[color:var(--billing-rule)] rounded text-[color:var(--billing-ink-2)] cursor-pointer">
						Open in Gmail
					</button>
				</div>
			</div>
		</div>
	);
};

const LinkChip: React.FC<{ icon: React.ReactNode; title: string; sub: string }> = ({ icon, title, sub }) => (
	<div className="flex items-center gap-2.5 px-2 py-1.5 bg-white border border-[color:var(--billing-rule)] rounded">
		<span className="text-[color:var(--billing-ink-2)]">{icon}</span>
		<div className="flex-1 min-w-0">
			<div className="text-[11.5px] font-medium truncate">{title}</div>
			<div className="ledger-num text-[10px] text-[color:var(--billing-ink-3)] truncate">{sub}</div>
		</div>
		<ExternalLink size={11} className="text-[color:var(--billing-ink-4)]" />
	</div>
);
