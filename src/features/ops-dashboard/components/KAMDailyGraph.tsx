/**
 * KAM Daily Graph Component
 * Displays daily KAM data entry trend
 * Apple Watch style - simple line chart
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
} from 'recharts';
import { Card } from '../../../components/ui';
import { KAMEodReportResponse } from '../../../services/opsDashboardApi';
import { useBreakpoint } from '../../../hooks/useBreakpoint';

interface KAMDailyGraphProps {
	data: KAMEodReportResponse | null;
	cityId?: number;
}

interface DailyDataPoint {
	day: number;
	month: string;
	percentage: number;
	fullDate: string;
}

/**
 * Transform API data to chart format
 */
const transformDailyData = (
	data: KAMEodReportResponse | null,
	cityId?: number
): DailyDataPoint[] => {
	if (!data?.dailyEntryStatus) return [];

	return data.dailyEntryStatus
		.map(day => {
			const cityData = day.cities?.find(c => !cityId || c.city_id === cityId);
			if (!cityData) return null;

			const date = new Date(day.entry_date);
			return {
				day: date.getDate(),
				month: date.toLocaleDateString('en-US', { month: 'short' }),
				percentage: parseFloat(cityData.percentage || '0'),
				fullDate: day.entry_date,
			};
		})
		.filter((item): item is DailyDataPoint => item !== null);
};

/**
 * Get unique months from data for display
 */
const getUniqueMonths = (data: DailyDataPoint[]): string[] => {
	const months = Array.from(new Set(data.map(d => d.month)));
	return months;
};

export const KAMDailyGraph: React.FC<KAMDailyGraphProps> = ({ data, cityId }) => {
	const chartData = transformDailyData(data, cityId);
	const { isMobile } = useBreakpoint();

	const uniqueMonths = useMemo(() => getUniqueMonths(chartData), [chartData]);

	if (chartData.length === 0) {
		return (
			<Card className='p-6'>
				<div className='text-center text-gray-500'>No daily data available</div>
			</Card>
		);
	}

	// Get color based on percentage
	const getBarColor = (percentage: number): string => {
		if (percentage >= 80) return '#22c55e'; // green-500
		if (percentage >= 60) return '#eab308'; // yellow-500
		if (percentage >= 40) return '#f97316'; // orange-500
		return '#ef4444'; // red-500
	};

	return (
		<Card className='p-6' role='region' aria-label='KAM Daily Entry Trend'>
			<div className='mb-4'>
				<h3 className='text-sm font-semibold text-gray-700 mb-1'>Daily Entry Trend</h3>
			</div>
			<ResponsiveContainer width='100%' height={isMobile ? 200 : 250}>
				<BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
					<CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' vertical={false} />
					<XAxis
						dataKey='day'
						stroke='#6b7280'
						fontSize={isMobile ? 10 : 12}
						tick={{ fill: '#6b7280' }}
						interval={isMobile ? Math.ceil(chartData.length / 10) : 0}
						label={{
							value: uniqueMonths.join(' / '),
							position: 'insideBottom',
							offset: -5,
							fontSize: isMobile ? 10 : 12,
							fill: '#6b7280',
						}}
					/>
					<YAxis
						domain={[0, 100]}
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
						formatter={(value: number) => [`${value.toFixed(0)}%`, 'Entry %']}
					/>
					<Bar dataKey='percentage' radius={[4, 4, 0, 0]}>
						{chartData.map((entry, index) => (
							<Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
						))}
					</Bar>
				</BarChart>
			</ResponsiveContainer>
		</Card>
	);
};
