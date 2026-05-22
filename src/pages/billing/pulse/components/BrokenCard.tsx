/**
 * BrokenCard — narrative card in the "Broken promises this week" section
 * on Pulse. The quote (extracted by AI) is the hero. Editorial serif italic.
 */

import React from 'react';
import { Pill } from '../../../../components/ui/Pill';
import { fmtRelativeDate } from '../../../../utils/billing';

interface BrokenCardProps {
	client: string;
	who: 'Broken by client' | 'Broken by IB';
	ageDays: number | null | undefined;
	promise: string;
	sub: string;
	invoiceRef: string | null;
	amount: string;
}

export const BrokenCard: React.FC<BrokenCardProps> = ({
	client, who, ageDays, promise, sub, invoiceRef, amount,
}) => {
	const brokenByIB = who.includes('IB');
	return (
		<article
			className="pl-3.5 pr-1 py-0.5"
			style={{ borderLeft: `3px solid ${brokenByIB ? 'var(--billing-warn)' : 'var(--billing-risk)'}` }}
		>
			<div className="flex items-baseline gap-2">
				<span className="text-xs font-semibold">{client}</span>
				<div className="flex-1" />
				<span className="ledger-num text-[10px] text-[color:var(--billing-ink-3)]">
					{ageDays != null ? `${ageDays}d ago` : fmtRelativeDate(null)}
				</span>
			</div>
			<div className="editorial-em mt-2 text-[19px] leading-snug text-[color:var(--billing-ink)] tracking-tight">
				{'"'}{promise}{'"'}
			</div>
			<div className="text-[11.5px] text-[color:var(--billing-ink-2)] mt-1.5 leading-relaxed line-clamp-2">{sub}</div>
			<div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-[color:var(--billing-rule)]">
				<Pill tone={brokenByIB ? 'warn' : 'risk'}>{who}</Pill>
				{invoiceRef && <Pill>{invoiceRef}</Pill>}
				<div className="flex-1" />
				<span className="ledger-num text-[11px] text-[color:var(--billing-risk)]">{amount}</span>
			</div>
		</article>
	);
};
