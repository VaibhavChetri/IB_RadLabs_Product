/**
 * ImpactBar — horizontal share-of-total bar. Tiny, lives next to a number
 * to communicate "this client's outstanding is X% of their FY revenue".
 */

import React from 'react';

interface ImpactBarProps {
	value: number;
	total: number;
	width?: number;
	height?: number;
	color?: string;
	className?: string;
}

export const ImpactBar: React.FC<ImpactBarProps> = ({
	value,
	total,
	width = 70,
	height = 4,
	color = 'var(--billing-ink-2)',
	className,
}) => {
	const pct = Math.max(0, Math.min(1, value / (total || 1)));
	return (
		<div
			className={className}
			style={{
				width,
				height,
				background: 'var(--billing-rule)',
				borderRadius: 1,
				position: 'relative',
			}}
			title={`${Math.round(pct * 100)}% of total`}
		>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					width: pct * 100 + '%',
					background: color,
					borderRadius: 1,
				}}
			/>
		</div>
	);
};
