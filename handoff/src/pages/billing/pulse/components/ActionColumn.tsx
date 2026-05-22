/**
 * ActionColumn — one of the three columns on Pulse (Act today / Needs decision / Untracked).
 * Just chrome: header with count pill + optional total, then children.
 */

import React from 'react';

interface ActionColumnProps {
	title: string;
	count: number;
	sub: string;
	tone?: 'ink' | 'risk' | 'warn';
	totalAmount?: string;
	children: React.ReactNode;
}

export const ActionColumn: React.FC<ActionColumnProps> = ({
	title, count, sub, tone = 'ink', totalAmount, children,
}) => {
	const countStyle =
		tone === 'risk'
			? { background: 'var(--billing-risk-bg)', color: 'var(--billing-risk)' }
			: tone === 'warn'
			? { background: 'var(--billing-warn-bg)', color: 'var(--billing-warn)' }
			: { background: 'var(--billing-ink)', color: 'var(--billing-bg)' };

	return (
		<div className="flex flex-col gap-2.5">
			<header className="flex items-baseline gap-2 pb-2 rule-bottom-ink">
				<span className="text-[13px] font-semibold tracking-tight">{title}</span>
				<span
					className="ledger-num text-[11px] font-semibold px-1.5 py-px rounded"
					style={countStyle}
				>
					{count}
				</span>
				<div className="flex-1" />
				{totalAmount && (
					<span className="ledger-num text-[11px] text-[color:var(--billing-risk)] font-medium">
						{totalAmount}
					</span>
				)}
			</header>
			<div className="text-[10.5px] text-[color:var(--billing-ink-3)] tracking-wider uppercase -mt-1">
				{sub}
			</div>
			<div className="flex flex-col">{children}</div>
		</div>
	);
};
