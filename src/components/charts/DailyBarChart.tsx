/**
 * Daily Bar Chart Component
 * Generic reusable bar chart for displaying daily trends
 */

import React, { useMemo } from 'react';
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Cell,
	LabelList,
} from 'recharts';
import { useBreakpoint } from '../../hooks/useBreakpoint';

export interface DailyDataPoint {
	day: number;
	month: string;
	value: number;
	fullDate: string;
}

interface DailyBarChartProps {
	data: DailyDataPoint[];
	ariaLabel?: string;
	yAxisDomain?: [number, number];
	tooltipFormatter?: (value: number) => [string, string];
	labelFormatter?: (value: number) => string;
	colorGetter?: (value: number) => string;
}

/**
 * Get unique months from data for display
 */
const getUniqueMonths = (data: DailyDataPoint[]): string[] => {
	const months = Array.from(new Set(data.map(d => d.month)));
	return months;
};

/**
 * Default color getter based on percentage (0-100)
 */
const getDefaultBarColor = (value: number): string => {
	if (value >= 80) return '#22c55e'; // green-500
	if (value >= 60) return '#eab308'; // yellow-500
	if (value >= 40) return '#f97316'; // orange-500
	return '#ef4444'; // red-500
};

export const DailyBarChart: React.FC<DailyBarChartProps> = ({
	data,
	ariaLabel = 'Daily Trend',
	yAxisDomain = [0, 100],
	tooltipFormatter = (value: number) => [`${value.toFixed(0)}`, 'Value'],
	labelFormatter = (value: number) => `${value.toFixed(0)}`,
	colorGetter = getDefaultBarColor,
}) => {
	const { isMobile } = useBreakpoint();
	const uniqueMonths = useMemo(() => getUniqueMonths(data), [data]);

	if (data.length === 0) {
		return <div className='text-center text-gray-500 py-8'>No daily data available</div>;
	}

	return (
		<div role='region' aria-label={ariaLabel} className='bg-white daily-bar-chart'>
			<style>
				{`
					.daily-bar-chart .recharts-wrapper {
						background-color: white !important;
					}
					.daily-bar-chart .recharts-surface {
						background-color: white !important;
						background: white !important;
						fill: white !important;
					}
					.daily-bar-chart .recharts-tooltip-wrapper {
						background-color: white !important;
					}
					.daily-bar-chart svg {
						background-color: white !important;
						background: white !important;
					}
					.daily-bar-chart .recharts-wrapper > svg {
						background-color: white !important;
						background: white !important;
					}
					.daily-bar-chart .recharts-wrapper > svg > rect {
						fill: white !important;
					}
				`}
			</style>
			<ResponsiveContainer width='100%' height={isMobile ? 200 : 250}>
				<BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 40 }}>
					<CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' vertical={false} />
					<XAxis
						dataKey='day'
						stroke='#6b7280'
						fontSize={isMobile ? 10 : 12}
						tick={{ fill: '#6b7280' }}
						interval={isMobile ? Math.ceil(data.length / 10) : 0}
						label={{
							value: uniqueMonths.join(' / '),
							position: 'insideBottom',
							offset: -5,
							fontSize: isMobile ? 10 : 12,
							fill: '#6b7280',
						}}
					/>
					<YAxis
						domain={yAxisDomain}
						stroke='#6b7280'
						fontSize={isMobile ? 10 : 12}
						tick={{ fill: '#6b7280' }}
						width={isMobile ? 30 : 40}
					/>
					<Tooltip
						contentStyle={{
							backgroundColor: 'white',
							border: '1px solid #e5e7eb',
							borderRadius: '6px',
							fontSize: isMobile ? '12px' : '14px',
						}}
						labelStyle={{ marginBottom: '4px', fontWeight: 600 }}
						formatter={tooltipFormatter}
					/>
					<Bar dataKey='value' radius={[4, 4, 0, 0]}>
						{data.map((entry, index) => (
							<Cell key={`cell-${index}`} fill={colorGetter(entry.value)} />
						))}
						<LabelList
							dataKey='value'
							position='top'
							formatter={(value: unknown) => {
								const numValue = typeof value === 'number' ? value : parseFloat(String(value));
								return labelFormatter(numValue);
							}}
							style={{
								fill: '#374151',
								fontSize: isMobile ? 11 : 13,
								fontWeight: 600,
							}}
						/>
					</Bar>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
};
