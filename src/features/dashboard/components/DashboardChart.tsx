import React, { useMemo, useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { FloatingDropdown } from '../../../components/ui/FloatingDropdown';
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from 'recharts';
import { useChartData, ChartFilter } from '../hooks/useChartData';
import { DashboardKAMResponse } from '../../../services/inventoryApi';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import {
	CHART_DIMENSIONS,
	CHART_FONT_SIZES,
	Y_AXIS_CONFIG,
	X_AXIS_CONFIG,
	TOOLTIP_CONFIG,
	CHART_COLORS,
} from '../config/chartConstants';
import { calculateYAxisTicks } from '../utils/dataTransformers';

interface DashboardChartProps {
	data: DashboardKAMResponse | null;
	loading?: boolean;
}

const DashboardChartComponent: React.FC<DashboardChartProps> = ({ data, loading = false }) => {
	const [filter, setFilter] = useState<ChartFilter>('monthly');
	const { isMobile } = useBreakpoint();
	const chartData = useChartData({ data, filter });

	// Determine how many weeks exist in the API response (some months have only 4 full weeks)
	const weekCount = useMemo(
		() => data?.segResult?.byWeek?.length ?? 0,
		[data?.segResult?.byWeek?.length]
	);

	// Calculate Y-axis ticks based on data range for more data points
	const yAxisTicks = useMemo(() => {
		return calculateYAxisTicks(chartData);
	}, [chartData]);

	// Build filter options dynamically based on available weeks
	const filters: { key: ChartFilter; label: string }[] = useMemo(() => {
		const opts: { key: ChartFilter; label: string }[] = [{ key: 'monthly', label: 'Monthly' }];
		const maxWeeks = Math.min(5, weekCount);
		for (let i = 1; i <= maxWeeks; i++) {
			opts.push({ key: `week${i}` as ChartFilter, label: `Week ${i}` });
		}
		return opts;
	}, [weekCount]);

	// If current filter points to a non-existent week (e.g., week5 when only 4 weeks), reset to monthly
	useEffect(() => {
		if (filter.startsWith('week')) {
			const weekNum = parseInt(filter.replace('week', ''), 10);
			if (Number.isFinite(weekNum) && weekNum > weekCount) {
				setFilter('monthly');
			}
		}
	}, [filter, weekCount]);

	if (loading) {
		return (
			<Card className='p-4 sm:p-6'>
				<div className='h-80 bg-background-secondary rounded-lg flex items-center justify-center'>
					<div className='text-center'>
						<div className='animate-pulse text-foreground-muted'>Loading chart data...</div>
					</div>
				</div>
			</Card>
		);
	}

	if (!data || chartData.length === 0) {
		return (
			<Card className='p-4 sm:p-6'>
				<div className='h-80 bg-background-secondary rounded-lg flex items-center justify-center'>
					<div className='text-center text-foreground-muted'>
						<p>No data available for the selected filters</p>
					</div>
				</div>
			</Card>
		);
	}

	return (
		<Card className='p-4 sm:p-6' role='region' aria-label='SKU Count Trend Chart'>
			<div className='flex items-center justify-between mb-4 sm:mb-6 relative'>
				<h3
					id='chart-title'
					className='text-sm sm:text-h6 text-foreground absolute left-1/2 transform -translate-x-1/2'
				>
					SKU Count Trend
				</h3>
				<div className='ml-auto w-32 sm:w-40'>
					<FloatingDropdown
						label='View'
						options={filters.map(f => ({ value: f.key, label: f.label }))}
						value={filter}
						onChange={value => setFilter(value as ChartFilter)}
						placeholder='Select view'
						className='w-full [&_button]:py-2 sm:[&_button]:py-4 [&_input]:py-2 sm:[&_input]:py-4'
						aria-label='Chart view filter'
					/>
				</div>
			</div>

			<div
				className='h-64 sm:h-80'
				role='img'
				aria-labelledby='chart-title'
				aria-describedby='chart-description'
			>
				<ResponsiveContainer width='100%' height='100%'>
					<LineChart
						data={chartData}
						margin={isMobile ? CHART_DIMENSIONS.mobile.margins : CHART_DIMENSIONS.desktop.margins}
						aria-label='Line chart showing SKU count trend over time'
					>
						<CartesianGrid strokeDasharray='3 3' stroke={CHART_COLORS.grid} />
						<XAxis
							dataKey='day'
							interval={
								isMobile && filter === 'monthly'
									? X_AXIS_CONFIG.monthlyInterval.mobile
									: X_AXIS_CONFIG.monthlyInterval.desktop
							}
							label={{
								value: 'Day of Month',
								position: 'bottom',
								offset: X_AXIS_CONFIG.labelOffset,
								style: {
									fontFamily: 'Public Sans, sans-serif',
									fontSize: `${isMobile ? CHART_FONT_SIZES.mobile.label : CHART_FONT_SIZES.desktop.label}px`,
									fill: CHART_COLORS.text.primary,
								},
							}}
							stroke='#6b7280'
							tick={{
								style: {
									fontFamily: 'Public Sans, sans-serif',
									fontSize: `${isMobile ? CHART_FONT_SIZES.mobile.tick : CHART_FONT_SIZES.desktop.tick}px`,
									fill: CHART_COLORS.text.primary,
								},
							}}
						/>
						<YAxis
							label={{
								value: 'SKU Count',
								angle: -90,
								position: 'insideLeft',
								offset: isMobile
									? Y_AXIS_CONFIG.labelOffset.mobile
									: Y_AXIS_CONFIG.labelOffset.desktop,
								dy: 0,
								style: {
									fontFamily: 'Public Sans, sans-serif',
									fontSize: `${isMobile ? CHART_FONT_SIZES.mobile.label : CHART_FONT_SIZES.desktop.label}px`,
									fill: CHART_COLORS.text.primary,
									textAnchor: 'middle',
								},
							}}
							stroke='#6b7280'
							width={isMobile ? Y_AXIS_CONFIG.width.mobile : Y_AXIS_CONFIG.width.desktop}
							ticks={yAxisTicks.length > 0 ? yAxisTicks : undefined}
							tick={{
								style: {
									fontFamily: 'Public Sans, sans-serif',
									fontSize: `${isMobile ? CHART_FONT_SIZES.mobile.tick : CHART_FONT_SIZES.desktop.tick}px`,
									fill: CHART_COLORS.text.primary,
								},
								dx: isMobile ? -5 : 0,
							}}
							domain={
								yAxisTicks.length > 0
									? [yAxisTicks[0], yAxisTicks[yAxisTicks.length - 1]]
									: undefined
							}
						/>
						<Tooltip
							contentStyle={{
								backgroundColor: CHART_COLORS.background,
								border: `1px solid ${CHART_COLORS.border}`,
								borderRadius: '6px',
								fontFamily: 'Public Sans, sans-serif',
								fontSize: `${isMobile ? TOOLTIP_CONFIG.mobile.fontSize : TOOLTIP_CONFIG.desktop.fontSize}px`,
								color: CHART_COLORS.text.primary,
								padding: `${isMobile ? TOOLTIP_CONFIG.mobile.padding : TOOLTIP_CONFIG.desktop.padding}px`,
								maxWidth: `${isMobile ? TOOLTIP_CONFIG.mobile.maxWidth : TOOLTIP_CONFIG.desktop.maxWidth}px`,
							}}
							wrapperStyle={{
								zIndex: 1000,
								maxWidth: isMobile ? `${TOOLTIP_CONFIG.mobile.maxWidth}px` : 'auto',
							}}
							labelStyle={{
								fontFamily: 'Public Sans, sans-serif',
								fontSize: `${isMobile ? TOOLTIP_CONFIG.mobile.fontSize : TOOLTIP_CONFIG.desktop.fontSize}px`,
								fontWeight: '600',
								color: CHART_COLORS.text.secondary,
								marginBottom: `${isMobile ? TOOLTIP_CONFIG.mobile.marginBottom : TOOLTIP_CONFIG.desktop.marginBottom}px`,
							}}
							allowEscapeViewBox={{ x: false, y: true }}
							labelFormatter={label => `Day ${label}`}
							formatter={(value: number) => [value.toLocaleString(), 'SKU Count']}
						/>
						<Line
							type='monotone'
							dataKey='count'
							stroke={CHART_COLORS.line}
							strokeWidth={2}
							dot={{ r: 4 }}
							activeDot={{ r: 6 }}
						/>
					</LineChart>
				</ResponsiveContainer>
				<div id='chart-description' className='sr-only'>
					{`Chart showing SKU count trend for ${filter === 'monthly' ? 'the entire month' : filter.replace('week', 'Week ')}. 
					X-axis represents days of the month, Y-axis represents SKU count. 
					${chartData.length > 0 ? `Data range: ${Math.min(...chartData.map(d => d.count))} to ${Math.max(...chartData.map(d => d.count))} SKUs.` : 'No data available.'}`}
				</div>
			</div>
		</Card>
	);
};

// Memoize component to prevent unnecessary re-renders
export const DashboardChart = React.memo(DashboardChartComponent);
