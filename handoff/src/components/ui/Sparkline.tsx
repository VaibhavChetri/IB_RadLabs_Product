/**
 * Sparkline — tiny inline SVG line chart.
 * Used on Pulse trend strip and Detail context panels.
 * Designed to read at 60–120px wide with no axis chrome.
 */

import React from 'react';

interface SparklineProps {
	data: number[];
	width?: number;
	height?: number;
	stroke?: string;
	fill?: string;
	area?: boolean;
	className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
	data,
	width = 64,
	height = 18,
	stroke = 'currentColor',
	fill,
	area = false,
	className,
}) => {
	if (!data || data.length === 0) return null;
	const max = Math.max(...data);
	const min = Math.min(...data);
	const span = max - min || 1;
	const step = width / (data.length - 1 || 1);
	const points = data.map((v, i) => [i * step, height - ((v - min) / span) * (height - 2) - 1] as const);
	const d = points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');

	return (
		<svg width={width} height={height} className={className} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
			{area && <path d={d + ` L${width} ${height} L0 ${height} Z`} fill={fill || stroke} opacity="0.15" />}
			<path d={d} fill="none" stroke={stroke} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
};
