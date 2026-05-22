/**
 * UntrackedCard — row inside "Untracked revenue" column on Pulse.
 * Tiny, single-line. The warning icon + amount is the whole story.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { fmtINR } from '../../../../utils/billing';

interface UntrackedCardProps {
	slug: string;
	name: string;
	amount: number;
	invoices: number;
}

export const UntrackedCard: React.FC<UntrackedCardProps> = ({ slug, name, amount, invoices }) => {
	return (
		<Link
			to={`/billing/clients/${slug}`}
			className="flex items-center gap-2.5 py-2.5 border-b border-[color:var(--billing-rule)] no-underline text-inherit hover:bg-[color:var(--billing-bg-tinted)]"
		>
			<AlertTriangle size={13} className="text-[color:var(--billing-warn)] flex-shrink-0" />
			<div className="flex-1 min-w-0">
				<div className="text-[11.5px] font-medium text-[color:var(--billing-ink)] truncate">
					{name}
				</div>
				<div className="ledger-num text-[10px] text-[color:var(--billing-ink-3)] mt-0.5">
					{invoices} inv · no thread
				</div>
			</div>
			<span className="ledger-num text-[12px] font-medium text-[color:var(--billing-ink)]">
				{fmtINR(amount, 'short')}
			</span>
		</Link>
	);
};
