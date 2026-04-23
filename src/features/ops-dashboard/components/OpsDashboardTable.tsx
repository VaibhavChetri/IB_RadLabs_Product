/**
 * Ops Dashboard Table Component
 * Displays operational metrics by city in an elegant table format
 * Uses reusable Table component from DataDisplay
 */

import React, { useMemo } from 'react';
import { Table, TableColumn } from '../../../components/ui/DataDisplay';
import { OpsDashboardTableRow } from '../utils/tableDataTransformers';

interface OpsDashboardTableProps {
	rows: OpsDashboardTableRow[];
}

/**
 * Parse percentage from string like "2/5" or "2/5 (40.00%)"
 * Falls back to calculating from fraction if percentage not in string
 */
const parsePercentage = (value: string): number => {
	if (value === '--' || value === '-') return 0;

	// Try to extract percentage from string first (for backward compatibility)
	const match = value.match(/\(([\d.]+)%\)/);
	if (match) return parseFloat(match[1]);

	// Otherwise calculate from fraction like "2/5"
	const fractionMatch = value.match(/(\d+)\/(\d+)/);
	if (fractionMatch) {
		const numerator = parseFloat(fractionMatch[1]);
		const denominator = parseFloat(fractionMatch[2]);
		if (denominator > 0) {
			return (numerator / denominator) * 100;
		}
	}

	return 0;
};

/**
 * Get color based on percentage threshold
 */
const getBarColor = (percentage: number): string => {
	if (percentage >= 80) return 'bg-green-500';
	if (percentage >= 60) return 'bg-yellow-500';
	if (percentage >= 40) return 'bg-orange-500';
	return 'bg-red-500';
};

/**
 * Day/Night Metrics Grid - 3 columns, 2 rows for perfect alignment
 */
const DayNightMetricsGrid: React.FC<{
	dayValue: string;
	nightValue: string;
}> = ({ dayValue, nightValue }) => {
	const dayPercentage = parsePercentage(dayValue);
	const nightPercentage = parsePercentage(nightValue);
	const dayBarColor = getBarColor(dayPercentage);
	const nightBarColor = getBarColor(nightPercentage);

	return (
		<div className='grid grid-cols-[auto_auto_1fr] gap-x-2 gap-y-2 text-xs sm:text-sm justify-items-end'>
			{/* Row 1: Day */}
			<span className='text-gray-500 text-right'>Day:</span>
			<span className='text-gray-900 font-medium text-right'>
				{dayValue === '-' || dayValue === '--' ? '--' : dayValue}
			</span>
			{dayValue !== '-' && dayValue !== '--' ? (
				<div className='flex flex-col gap-0.5 items-end'>
					<div className='w-full bg-gray-100 rounded-full h-1 sm:h-1.5 overflow-hidden max-w-[60px] sm:max-w-[80px]'>
						<div
							className={`h-full ${dayBarColor} transition-all duration-300`}
							style={{ width: `${Math.min(dayPercentage, 100)}%` }}
						/>
					</div>
					<span className='text-[10px] sm:text-xs text-gray-500'>{dayPercentage.toFixed(0)}%</span>
				</div>
			) : (
				<span className='text-gray-400 text-right'>--</span>
			)}

			{/* Row 2: Night */}
			<span className='text-gray-500 text-right'>Night:</span>
			<span className='text-gray-900 font-medium text-right'>
				{nightValue === '-' || nightValue === '--' ? '--' : nightValue}
			</span>
			{nightValue !== '-' && nightValue !== '--' ? (
				<div className='flex flex-col gap-0.5 items-end'>
					<div className='w-full bg-gray-100 rounded-full h-1 sm:h-1.5 overflow-hidden max-w-[60px] sm:max-w-[80px]'>
						<div
							className={`h-full ${nightBarColor} transition-all duration-300`}
							style={{ width: `${Math.min(nightPercentage, 100)}%` }}
						/>
					</div>
					<span className='text-[10px] sm:text-xs text-gray-500'>
						{nightPercentage.toFixed(0)}%
					</span>
				</div>
			) : (
				<span className='text-gray-400 text-right'>--</span>
			)}
		</div>
	);
};

export const OpsDashboardTable: React.FC<OpsDashboardTableProps> = ({ rows }) => {
	const columns: TableColumn<OpsDashboardTableRow>[] = useMemo(
		() => [
			{
				key: 'cityName',
				title: 'Cities',
				dataIndex: 'cityName',
				render: (_: unknown, row: OpsDashboardTableRow) => (
					<div className='font-medium text-sm sm:text-base text-gray-900'>{row.cityName}</div>
				),
			},
			{
				key: 'facilityReport',
				title: 'Facility Report',
				render: (_: unknown, row: OpsDashboardTableRow) => (
					<DayNightMetricsGrid
						dayValue={row.facilityReport.day}
						nightValue={row.facilityReport.night}
					/>
				),
			},
			{
				key: 'qcRejection',
				title: 'QC Rejection',
				render: () => <span className='text-xs sm:text-sm text-gray-400'>--</span>,
			},
			{
				key: 'transitDelay',
				title: 'Transit Delay',
				render: (_: unknown, row: OpsDashboardTableRow) => (
					<DayNightMetricsGrid
						dayValue={row.transitDelay.day}
						nightValue={row.transitDelay.night}
					/>
				),
			},
			{
				key: 'washingEfficiency',
				title: 'Washing Efficiency',
				render: (_: unknown, row: OpsDashboardTableRow) => (
					<div className='grid grid-cols-[auto_auto_1fr] gap-x-2 text-xs sm:text-sm justify-items-end'>
						<span className='text-gray-500 text-right'>Sent:</span>
						<span className='text-gray-900 font-medium text-right'>
							{row.washingEfficiency.sent === '-' || row.washingEfficiency.sent === '--'
								? '--'
								: row.washingEfficiency.sent}
						</span>
						{row.washingEfficiency.sent !== '-' && row.washingEfficiency.sent !== '--' ? (
							<div className='flex flex-col gap-0.5 items-end'>
								<div className='w-full bg-gray-100 rounded-full h-1 sm:h-1.5 overflow-hidden max-w-[60px] sm:max-w-[80px]'>
									<div
										className={`h-full ${getBarColor(parsePercentage(row.washingEfficiency.sent))} transition-all duration-300`}
										style={{
											width: `${Math.min(parsePercentage(row.washingEfficiency.sent), 100)}%`,
										}}
									/>
								</div>
								<span className='text-[10px] sm:text-xs text-gray-500'>
									{parsePercentage(row.washingEfficiency.sent).toFixed(0)}%
								</span>
							</div>
						) : (
							<span className='text-gray-400 text-right'>--</span>
						)}
					</div>
				),
			},
			{
				key: 'transitPlanFilled',
				title: 'Transit Plan Filled',
				render: (_: unknown, row: OpsDashboardTableRow) => (
					<div>
						<span className='text-base sm:text-lg font-semibold text-gray-900'>
							{row.transitPlanFilled}
						</span>
						<div className='text-[10px] sm:text-xs text-gray-500 mt-0.5'>avg delay</div>
					</div>
				),
			},
			{
				key: 'driverCheckin',
				title: 'Driver Checkin',
				render: () => <span className='text-xs sm:text-sm text-gray-400'>--</span>,
			},
			{
				key: 'kamEodReport',
				title: 'KAM EOD Report',
				render: (_: unknown, row: OpsDashboardTableRow) => (
					<div className='grid grid-cols-[auto_auto_1fr] gap-x-2 text-xs sm:text-sm justify-items-end'>
						<span className='text-gray-500 text-right'>Days:</span>
						<span className='text-gray-900 font-medium text-right'>
							{row.kamEodReport === '-' || row.kamEodReport === '--' ? '--' : row.kamEodReport}
						</span>
						{row.kamEodReport !== '-' && row.kamEodReport !== '--' ? (
							<div className='flex flex-col gap-0.5 items-end'>
								<div className='w-full bg-gray-100 rounded-full h-1 sm:h-1.5 overflow-hidden max-w-[60px] sm:max-w-[80px]'>
									<div
										className={`h-full ${getBarColor(parsePercentage(row.kamEodReport))} transition-all duration-300`}
										style={{
											width: `${Math.min(parsePercentage(row.kamEodReport), 100)}%`,
										}}
									/>
								</div>
								<span className='text-[10px] sm:text-xs text-gray-500'>
									{parsePercentage(row.kamEodReport).toFixed(0)}%
								</span>
							</div>
						) : (
							<span className='text-gray-400 text-right'>--</span>
						)}
					</div>
				),
			},
		],
		[]
	);

	return (
		<Table<OpsDashboardTableRow>
			columns={columns}
			data={rows}
			emptyText='No data available'
			hoverable
			striped
			size='sm'
		/>
	);
};
