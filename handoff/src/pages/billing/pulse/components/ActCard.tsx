/**
 * ActCard — single row inside the "Act today" column on Pulse.
 * Renders client + AI-suggested next action + outstanding + linkage chip.
 * Whole card is clickable → navigates to /billing/clients/:slug.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, Link2, Mail } from 'lucide-react';
import { AgeDot } from '../../../../components/ui/AgeDot';
import { Pill } from '../../../../components/ui/Pill';
import { fmtINR } from '../../../../utils/billing';

interface ActCardProps {
	slug: string;
	name: string;
	action: string;
	why: string;
	lastTouchDays: number | null;
	amount: number;
	invoiceRef: string | null;
	frequentBreaker?: boolean;
}

export const ActCard: React.FC<ActCardProps> = ({
	slug, name, action, why, lastTouchDays, amount, invoiceRef, frequentBreaker,
}) => {
	return (
		<Link
			to={`/billing/clients/${slug}`}
			className="block py-3 border-b border-[color:var(--billing-rule)] no-underline text-inherit hover:bg-[color:var(--billing-bg-tinted)]"
		>
			<div className="flex items-start gap-2.5">
				<AgeDot days={lastTouchDays} />
				<div className="flex-1 min-w-0">
					<div className="flex items-baseline gap-1.5">
						<span className="text-[12px] font-semibold tracking-wide text-[color:var(--billing-ink)] uppercase">
							{name}
						</span>
						{frequentBreaker && <Flame size={10} className="text-[color:var(--billing-risk)]" />}
						<div className="flex-1" />
						<span className="ledger-num text-[11px] text-[color:var(--billing-risk)]">
							{fmtINR(amount, 'short')}
						</span>
					</div>
					<div className="text-[13px] font-medium text-[color:var(--billing-ink)] mt-1 tracking-tight">
						{action}
					</div>
					<div className="text-[11.5px] text-[color:var(--billing-ink-2)] mt-0.5 leading-relaxed line-clamp-2">
						{why}
					</div>
					<div className="flex items-center gap-2 mt-2">
						{invoiceRef && <Pill icon={<Link2 size={10} />}>{invoiceRef}</Pill>}
						<Pill icon={<Mail size={10} />}>Open thread</Pill>
						<div className="flex-1" />
						{lastTouchDays != null && (
							<span className="ledger-num text-[10px] text-[color:var(--billing-ink-3)]">
								{lastTouchDays}d
							</span>
						)}
					</div>
				</div>
			</div>
		</Link>
	);
};
