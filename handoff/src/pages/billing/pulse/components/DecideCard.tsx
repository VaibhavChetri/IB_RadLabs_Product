/**
 * DecideCard — single row inside the "Needs decision" column on Pulse.
 * Hero serif heading for the decision prompt, inline action buttons.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { fmtINR } from '../../../../utils/billing';

interface DecideCardProps {
	slug: string;
	name: string;
	action: string;
	why: string;
	amount: number;
}

export const DecideCard: React.FC<DecideCardProps> = ({ slug, name, action, why, amount }) => {
	return (
		<div className="py-3 border-b border-[color:var(--billing-rule)]">
			<div className="flex items-baseline gap-2">
				<Link
					to={`/billing/clients/${slug}`}
					className="text-[12px] font-semibold text-[color:var(--billing-ink)] uppercase tracking-wide no-underline hover:underline"
				>
					{name}
				</Link>
				<div className="flex-1" />
				<span className="ledger-num text-[11px] text-[color:var(--billing-ink-2)]">{fmtINR(amount, 'short')}</span>
			</div>
			<div className="editorial-em text-[17px] text-[color:var(--billing-ink)] mt-1.5 tracking-tight leading-tight">
				{action}
			</div>
			<div className="text-[11.5px] text-[color:var(--billing-ink-2)] mt-1 leading-relaxed">{why}</div>
			<div className="flex gap-1.5 mt-2">
				<button className="text-[11px] px-2.5 py-1 bg-[color:var(--billing-ink)] text-[color:var(--billing-bg)] rounded border-0 font-medium cursor-pointer">
					Decide
				</button>
				<button className="text-[11px] px-2.5 py-1 bg-transparent border border-[color:var(--billing-rule)] rounded text-[color:var(--billing-ink-2)] cursor-pointer">
					Snooze 24h
				</button>
			</div>
		</div>
	);
};
