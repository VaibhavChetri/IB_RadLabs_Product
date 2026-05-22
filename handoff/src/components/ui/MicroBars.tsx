/**
 * MicroBars — tiny inline SVG bar chart for "12-week behavior" column.
 * Bars get more opaque as values grow, which makes a rising trend visually
 * obvious even at 64px wide.
 */

import React from 'react';

interface MicroBarsProps {
	data: number[];
	width?: number;
	height?: number;
	gap?: number;
	color?: string;
	className?: string;
}

export const MicroBars: React.FC<MicroBarsProps> = ({
	data,
	width = 64,
	height = 18,
	gap = 1.5,
	color = 'currentColor',
	className,
}) => {
	const max = Math.max(...data) || 1;
	const bw = (width - gap * (data.length - 1)) / data.length;
	return (
		<svg width={width} height={height} className={className} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
			{data.map((v, i) => {
				const bh = Math.max(1, (v / max) * height);
				return (
					<rect
						key={i}
						x={i * (bw + gap)}
						y={height - bh}
						width={bw}
						height={bh}
						fill={color}
						opacity={0.35 + 0.65 * (v / max)}
					/>
				);
			})}
		</svg>
	);
};
