/**
 * ContextPanel — Health / Activity / Money slot on Client Detail.
 * Title + right-side kicker + rows of label→value + chart at the bottom.
 */

import React from 'react';

interface ContextPanelProps {
	title: string;
	right: string;
	rows: Array<[string, React.ReactNode, 'risk' | 'warn' | 'good' | 'ink' | '']>;
	chart: React.ReactNode;
	chartLabel: string;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({ title, right, rows, chart, chartLabel }) => {
	return (
		<div>
			<div className="flex items-baseline justify-between pb-1.5 mb-3 rule-bottom-ink">
				<span className="editorial-num text-[20px] tracking-tight">{title}</span>
				<span className="kicker">{right}</span>
			</div>
			<div className="flex flex-col gap-2">
				{rows.map(([label, value, tone], i) => (
					<div key={i} className="flex items-baseline gap-2">
						<span className="text-xs text-[color:var(--billing-ink-3)]" style={{ minWidth: 130 }}>{label}</span>
						<span
							className="ledger-num text-[13px] font-medium"
							style={{
								color:
									tone === 'risk' ? 'var(--billing-risk)'
									: tone === 'warn' ? 'var(--billing-warn)'
									: tone === 'good' ? 'var(--billing-good)'
									: 'var(--billing-ink)',
							}}
						>
							{value}
						</span>
					</div>
				))}
			</div>
			<div className="mt-3.5 pt-3 border-t border-dotted border-[color:var(--billing-rule)]">
				<div className="flex justify-center">{chart}</div>
				<div className="editorial-em text-[11px] text-[color:var(--billing-ink-3)] mt-1.5">{chartLabel}</div>
			</div>
		</div>
	);
};
