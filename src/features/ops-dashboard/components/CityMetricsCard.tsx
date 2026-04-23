/**
 * City Metrics Card Component
 * Displays operational metrics for a single city in a card format
 */

import React from 'react';
import { Card } from '../../../components/ui';
import { OpsDashboardTableRow } from '../utils/tableDataTransformers';

interface CityMetricsCardProps {
	row: OpsDashboardTableRow;
}

/**
 * Parse percentage from string like "2/5 (40.00%)"
 */
const parsePercentage = (value: string): number => {
	const match = value.match(/\(([\d.]+)%\)/);
	return match ? parseFloat(match[1]) : 0;
};

/**
 * Get color based on percentage threshold
 */
const getPercentageColor = (percentage: number): string => {
	if (percentage >= 80) return 'bg-green-500';
	if (percentage >= 60) return 'bg-yellow-500';
	if (percentage >= 40) return 'bg-orange-500';
	return 'bg-red-500';
};

/**
 * Progress Bar Component
 */
const ProgressBar: React.FC<{ percentage: number; label: string }> = ({ percentage, label }) => {
	const color = getPercentageColor(percentage);
	return (
		<div className='space-y-1'>
			<div className='flex justify-between text-xs text-gray-600 mb-1'>
				<span>{label}</span>
				<span className='font-medium'>{percentage.toFixed(2)}%</span>
			</div>
			<div className='w-full bg-gray-200 rounded-full h-2 overflow-hidden'>
				<div
					className={`h-full ${color} transition-all duration-300`}
					style={{ width: `${Math.min(percentage, 100)}%` }}
				/>
			</div>
		</div>
	);
};

/**
 * Metric Block Component
 */
const MetricBlock: React.FC<{ title: string; children: React.ReactNode }> = ({
	title,
	children,
}) => (
	<div className='space-y-2'>
		<h4 className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>{title}</h4>
		<div className='space-y-3'>{children}</div>
	</div>
);

export const CityMetricsCard: React.FC<CityMetricsCardProps> = ({ row }) => {
	const facilityDayPercent = parsePercentage(row.facilityReport.day);
	const facilityNightPercent = parsePercentage(row.facilityReport.night);
	const transitDayPercent = parsePercentage(row.transitDelay.day);
	const transitNightPercent = parsePercentage(row.transitDelay.night);
	const washingPercent = parsePercentage(row.washingEfficiency.sent);
	const kamPercent = parsePercentage(row.kamEodReport);

	return (
		<Card
			className='p-6 hover:shadow-md transition-shadow'
			role='article'
			aria-label={row.cityName}
		>
			<div className='flex items-center justify-between mb-6 pb-4 border-b border-gray-200'>
				<h3 className='text-lg font-semibold text-gray-900'>{row.cityName}</h3>
				<span className='px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full'>
					City ID: {row.cityId}
				</span>
			</div>

			<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
				{/* Facility Report */}
				<MetricBlock title='Facility Report'>
					<ProgressBar percentage={facilityDayPercent} label={`Day: ${row.facilityReport.day}`} />
					<ProgressBar
						percentage={facilityNightPercent}
						label={`Night: ${row.facilityReport.night}`}
					/>
				</MetricBlock>

				{/* QC Rejection */}
				<MetricBlock title='QC Rejection'>
					<div className='flex items-center justify-between py-2'>
						<span className='text-sm text-gray-700'>{row.qcRejection}</span>
					</div>
				</MetricBlock>

				{/* Transit Delay */}
				<MetricBlock title='Transit Delay'>
					<ProgressBar percentage={transitDayPercent} label={`Day: ${row.transitDelay.day}`} />
					<ProgressBar
						percentage={transitNightPercent}
						label={`Night: ${row.transitDelay.night}`}
					/>
				</MetricBlock>

				{/* Washing Efficiency */}
				<MetricBlock title='Washing Efficiency'>
					<ProgressBar percentage={washingPercent} label={`Sent: ${row.washingEfficiency.sent}`} />
				</MetricBlock>

				{/* Transit Plan Filled */}
				<MetricBlock title='Transit Plan Filled'>
					<div className='flex items-center space-x-2 py-2'>
						<span className='text-2xl font-bold text-gray-900'>{row.transitPlanFilled}</span>
						<span className='text-sm text-gray-500'>avg delay</span>
					</div>
				</MetricBlock>

				{/* Driver Checkin */}
				<MetricBlock title='Driver Checkin'>
					<div className='flex items-center justify-between py-2'>
						<span className='text-sm text-gray-700'>{row.driverCheckin}</span>
					</div>
				</MetricBlock>

				{/* KAM EOD Report */}
				<MetricBlock title='KAM EOD Report'>
					<ProgressBar percentage={kamPercent} label={row.kamEodReport} />
				</MetricBlock>
			</div>
		</Card>
	);
};
