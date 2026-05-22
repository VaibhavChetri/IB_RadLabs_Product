/**
 * AgeDot — visual freshness indicator.
 * Solid bright = touched today/yesterday; fades to hollow as the record ages.
 * Use inline next to a client name to communicate "is this still active?"
 * without making the user read a date.
 *
 * Convention (tweak in src/utils/billing.ts if you want):
 *   0–1d   → solid ink
 *   2–4d   → solid ink-2
 *   5–10d  → solid ink-3
 *   >10d   → hollow ring
 *   null   → hollow ring (no thread)
 */

import React from 'react';

interface AgeDotProps {
	days: number | null | undefined;
	size?: number;
	className?: string;
}

export const AgeDot: React.FC<AgeDotProps> = ({ days, size = 7, className }) => {
	let color = 'var(--billing-ink-4)';
	let filled = true;
	if (days == null) { color = 'var(--billing-ink-5)'; filled = false; }
	else if (days <= 1) color = 'var(--billing-ink)';
	else if (days <= 4) color = 'var(--billing-ink-2)';
	else if (days <= 10) color = 'var(--billing-ink-3)';
	else { color = 'var(--billing-ink-4)'; filled = false; }

	return (
		<span
			className={className}
			style={{
				display: 'inline-block',
				width: size,
				height: size,
				borderRadius: '50%',
				background: filled ? color : 'transparent',
				border: filled ? 'none' : `1px solid ${color}`,
				verticalAlign: 'middle',
				flexShrink: 0,
			}}
			title={days == null ? 'no thread' : `${days}d ago`}
		/>
	);
};
