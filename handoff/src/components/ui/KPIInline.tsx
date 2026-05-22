/**
 * KPIInline — label-above-number stat that lives in a horizontal strip,
 * not a card. Used on Pulse top strip so KPIs read as a sentence, not as
 * a grid of decorations.
 */

import React from 'react';
import type { Tone } from '../../design-system/tokens.billing';

interface KPIInlineProps {
	label: string;
	value: string;
	tone?: Tone;
	sub?: string;
}

const toneClass: Record<Tone, string> = {
	ink: 'text-[color:var(--billing-ink)]',
	risk: 'text-[color:var(--billing-risk)]',
	warn: 'text-[color:var(--billing-warn)]',
	good: 'text-[color:var(--billing-good)]',
};

export const KPIInline: React.FC<KPIInlineProps> = ({ label, value, tone = 'ink', sub }) => {
	return (
		<div className="flex flex-col min-w-0">
			<span className="kicker">{label}</span>
			<span className={`ledger-num text-sm font-medium mt-1 ${toneClass[tone]}`}>{value}</span>
			{sub && <span className="text-[11px] text-[color:var(--billing-ink-3)] mt-0.5">{sub}</span>}
		</div>
	);
};
