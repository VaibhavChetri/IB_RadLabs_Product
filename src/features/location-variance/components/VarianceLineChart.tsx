/**
 * VarianceLineChart
 *
 * Recharts LineChart showing the location's monthly trend.
 * Two lines: derived_revenue (from ops × rate card) and billed_revenue (Zoho actuals).
 * If billed has no data the line just doesn't render.
 */

import React from 'react';
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from 'recharts';
import type { RevenueSeriesResponse } from '../types';
import { formatINR, formatMonthLabel } from '../../../utils/currencyFormatter';

interface VarianceLineChartProps {
	series: RevenueSeriesResponse | null;
}

export const VarianceLineChart: React.FC<VarianceLineChartProps> = ({ series }) => {
	if (!series || series.series.length === 0) {
		return (
			<div className='py-8 text-center text-sm text-gray-500'>No chart data.</div>
		);
	}

	const chartData = series.series.map((s) => ({
		month: formatMonthLabel(s.month),
		Derived: s.derived_revenue,
		Billed: s.billed_revenue, // null is fine; recharts skips null points
	}));

	return (
		<div className='w-full h-64'>
			<ResponsiveContainer width='100%' height='100%'>
				<LineChart data={chartData} margin={{ top: 12, right: 12, bottom: 8, left: 8 }}>
					<CartesianGrid strokeDasharray='3 3' stroke='#eef0f4' />
					<XAxis dataKey='month' tick={{ fontSize: 11 }} />
					<YAxis
						tick={{ fontSize: 11 }}
						tickFormatter={(v) => formatINR(v, { compact: true })}
						width={70}
					/>
					<Tooltip
						formatter={(value: number) => formatINR(value)}
						contentStyle={{ fontSize: 12 }}
					/>
					<Legend wrapperStyle={{ fontSize: 12 }} />
					<Line
						type='monotone'
						dataKey='Derived'
						stroke='#3b82f6'
						strokeWidth={2}
						dot={{ r: 3 }}
						activeDot={{ r: 5 }}
					/>
					<Line
						type='monotone'
						dataKey='Billed'
						stroke='#22c55e'
						strokeWidth={2}
						dot={{ r: 3 }}
						activeDot={{ r: 5 }}
						connectNulls={false}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
};
