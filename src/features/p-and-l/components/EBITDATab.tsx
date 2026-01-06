/**
 * EBITDA Tab Content Component
 * Displays Variable Cost Details and Indirect Expense Details tables
 */

import React, { useMemo, useState } from 'react';
import { useEBITDAData } from '../hooks/usePLTabData';
import { EBITDAResponse } from '../../../services/pAndLApi';
import { MultiSelectDropdown } from '../../../components/ui';

interface PLTabContentProps {
	cityId?: number;
	facilityId: string;
	month: string;
	year: string;
	enabled?: boolean;
	onError?: (message: string) => void;
}

/**
 * Format number with commas
 */
const formatNumber = (value: number | string): string => {
	const num = typeof value === 'string' ? parseFloat(value) : value;
	if (isNaN(num)) return '0';
	return num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

/**
 * Get week column background color
 */
const getWeekBgColor = (week: 'w1' | 'w2' | 'w3' | 'w4' | 'cumulative' | 'estimated'): string => {
	switch (week) {
		case 'w1':
			return 'bg-blue-50';
		case 'w2':
			return 'bg-pink-50';
		case 'w3':
			return 'bg-green-50';
		case 'w4':
		case 'cumulative':
		case 'estimated':
			return 'bg-orange-50';
		default:
			return 'bg-white';
	}
};

/**
 * Variable Cost Details Table Component
 */
const VariableCostDetailsTable: React.FC<{
	report: EBITDAResponse['report'][string];
	hiddenWeeks: string[];
}> = ({ report, hiddenWeeks }) => {
	const tableData = useMemo(() => {
		const rows: Array<{
			slNo: string | number;
			costingType: string;
			w1: number | string;
			w2: number | string;
			w3: number | string;
			w4: number | string;
			cumulative: number | string;
			estimated: number | string;
			isSummary?: boolean;
			isTotalRevenue?: boolean;
		}> = [];

		// Safely access totalRevenue with null checks
		if (report?.totalRevenue) {
			const w1 = report.totalRevenue.week1 ?? 0;
			const w2 = hiddenWeeks.includes('2') ? 0 : (report.totalRevenue.week2 ?? 0);
			const w3 = hiddenWeeks.includes('3') ? 0 : (report.totalRevenue.week3 ?? 0);
			const w4 = hiddenWeeks.includes('4') ? 0 : (report.totalRevenue.week4 ?? 0);
			const cumulative = w1 + w2 + w3 + w4;
			
			rows.push({
				slNo: '-',
				costingType: 'Total Revenue',
				w1,
				w2,
				w3,
				w4,
				cumulative,
				estimated: report.totalRevenue.projected || '',
				isTotalRevenue: true,
			});
		}

		// Variable cost detail rows
		if (report?.variableCostDetails && Array.isArray(report.variableCostDetails)) {
			report.variableCostDetails.forEach((item, index) => {
				const w1 = parseFloat(item.week1_actual_value || '0');
				const w2 = hiddenWeeks.includes('2') ? 0 : parseFloat(item.week2_actual_value || '0');
				const w3 = hiddenWeeks.includes('3') ? 0 : parseFloat(item.week3_actual_value || '0');
				const w4 = hiddenWeeks.includes('4') ? 0 : parseFloat(item.week4_actual_value || '0');
				const cumulative = w1 + w2 + w3 + w4;
				
				rows.push({
					slNo: index + 1,
					costingType: item.costingTypeName || '',
					w1,
					w2,
					w3,
					w4,
					cumulative,
					estimated: item.projected_value || item.projectedValue || '',
				});
			});

			// Find On Site Manpower from variable costs
			const onSiteManpower = report.variableCostDetails.find(
				item => item.costingTypeName === 'On Site Manpower'
			);

			// Summary rows
			if (onSiteManpower) {
				const w1 = parseFloat(onSiteManpower.week1_actual_value || '0');
				const w2 = hiddenWeeks.includes('2') ? 0 : parseFloat(onSiteManpower.week2_actual_value || '0');
				const w3 = hiddenWeeks.includes('3') ? 0 : parseFloat(onSiteManpower.week3_actual_value || '0');
				const w4 = hiddenWeeks.includes('4') ? 0 : parseFloat(onSiteManpower.week4_actual_value || '0');
				const cumulative = w1 + w2 + w3 + w4;
				
				rows.push({
					slNo: report.variableCostDetails.length + 1,
					costingType: 'On Site Manpower',
					w1,
					w2,
					w3,
					w4,
					cumulative,
					estimated: onSiteManpower.projected_value || onSiteManpower.projectedValue || '',
					isSummary: true,
				});
			}
		}

		// Total Variable Cost
		if (report?.totalVariableCost) {
			const w1 = report.totalVariableCost.week1 ?? 0;
			const w2 = hiddenWeeks.includes('2') ? 0 : (report.totalVariableCost.week2 ?? 0);
			const w3 = hiddenWeeks.includes('3') ? 0 : (report.totalVariableCost.week3 ?? 0);
			const w4 = hiddenWeeks.includes('4') ? 0 : (report.totalVariableCost.week4 ?? 0);
			const cumulative = w1 + w2 + w3 + w4;
			
			rows.push({
				slNo: '-',
				costingType: 'Total Variable Cost',
				w1,
				w2,
				w3,
				w4,
				cumulative,
				estimated:
					report.totalVariableCost.projected ||
					report.totalVariableCost.totalProjectedValue ||
					'',
				isSummary: true,
			});
		}

		// Contribution
		if (report?.totalContribution) {
			const w1 = report.totalContribution.week1 ?? 0;
			const w2 = hiddenWeeks.includes('2') ? 0 : (report.totalContribution.week2 ?? 0);
			const w3 = hiddenWeeks.includes('3') ? 0 : (report.totalContribution.week3 ?? 0);
			const w4 = hiddenWeeks.includes('4') ? 0 : (report.totalContribution.week4 ?? 0);
			const cumulative = w1 + w2 + w3 + w4;
			
			rows.push({
				slNo: '-',
				costingType: 'Contribution',
				w1,
				w2,
				w3,
				w4,
				cumulative,
				estimated: report.totalContribution.projected || '',
				isSummary: true,
			});
		}

		return rows;
	}, [report, hiddenWeeks]);

	return (
		<div className='mb-8'>
			<h3 className='text-lg font-semibold text-gray-900 mb-4'>Variable Cost Details</h3>
			<div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
				<div className='overflow-x-auto'>
					<table className='w-full border-collapse'>
						<thead>
							<tr className='bg-gray-50 border-b border-gray-200'>
								<th className='px-4 py-3 text-left text-xs font-bold text-gray-900'>Sl.No</th>
								<th className='px-4 py-3 text-left text-xs font-bold text-gray-900'>
									Costing Type
								</th>
								<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>W1</th>
								<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>W2</th>
								<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>W3</th>
								<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>W4</th>
								<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>
									cummulative
								</th>
								<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>
									estimated
								</th>
							</tr>
						</thead>
						<tbody>
							{tableData.map((row, index) => (
								<tr
									key={index}
									className={`border-b border-gray-200 ${
										row.isSummary ? 'bg-gray-50 font-semibold' : ''
									}`}
								>
									<td className='px-4 py-3 text-xs font-normal text-gray-900'>{row.slNo}</td>
									<td className='px-4 py-3 text-xs font-normal text-gray-900'>{row.costingType}</td>
									<td
										className={`px-4 py-3 text-[11px] font-normal text-gray-900 text-right ${getWeekBgColor('w1')}`}
									>
										{formatNumber(row.w1)}
									</td>
									<td
										className={`px-4 py-3 text-[11px] font-normal text-gray-900 text-right ${getWeekBgColor('w2')}`}
									>
										{formatNumber(row.w2)}
									</td>
									<td
										className={`px-4 py-3 text-[11px] font-normal text-gray-900 text-right ${getWeekBgColor('w3')}`}
									>
										{formatNumber(row.w3)}
									</td>
									<td
										className={`px-4 py-3 text-[11px] font-normal text-gray-900 text-right ${getWeekBgColor('w4')}`}
									>
										{formatNumber(row.w4)}
									</td>
									<td
										className={`px-4 py-3 text-[11px] font-normal text-gray-900 text-right ${getWeekBgColor('cumulative')}`}
									>
										{formatNumber(row.cumulative)}
									</td>
									<td
										className={`px-4 py-3 text-[11px] font-normal text-gray-900 text-right ${getWeekBgColor('estimated')}`}
									>
										{formatNumber(row.estimated)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};

/**
 * Indirect Expense Details Table Component
 */
const IndirectExpenseDetailsTable: React.FC<{
	report: EBITDAResponse['report'][string];
	hiddenWeeks: string[];
}> = ({ report, hiddenWeeks }) => {
	const tableData = useMemo(() => {
		const rows: Array<{
			slNo: string | number;
			costingType: string;
			w1: number | string;
			w2: number | string;
			w3: number | string;
			w4: number | string;
			cumulative: number | string;
			estimated: number | string;
			isSummary?: boolean;
		}> = [];

		// Indirect expense detail rows
		if (report?.indirectExpenseDetails && Array.isArray(report.indirectExpenseDetails)) {
			report.indirectExpenseDetails.forEach((item, index) => {
				const w1 = parseFloat(item.week1_actual_value || '0');
				const w2 = hiddenWeeks.includes('2') ? 0 : parseFloat(item.week2_actual_value || '0');
				const w3 = hiddenWeeks.includes('3') ? 0 : parseFloat(item.week3_actual_value || '0');
				const w4 = hiddenWeeks.includes('4') ? 0 : parseFloat(item.week4_actual_value || '0');
				const cumulative = w1 + w2 + w3 + w4;
				
				rows.push({
					slNo: index,
					costingType: item.costingTypeName || '',
					w1,
					w2,
					w3,
					w4,
					cumulative,
					estimated: item.projected_value || item.projectedValue || '',
				});
			});
		}

		// Total Indirect Expense
		if (report?.totalIndirectExpenseCost) {
			const w1 = report.totalIndirectExpenseCost.week1 ?? 0;
			const w2 = hiddenWeeks.includes('2') ? 0 : (report.totalIndirectExpenseCost.week2 ?? 0);
			const w3 = hiddenWeeks.includes('3') ? 0 : (report.totalIndirectExpenseCost.week3 ?? 0);
			const w4 = hiddenWeeks.includes('4') ? 0 : (report.totalIndirectExpenseCost.week4 ?? 0);
			const cumulative = w1 + w2 + w3 + w4;
			
			rows.push({
				slNo: '-',
				costingType: 'Total Indirect Expense',
				w1,
				w2,
				w3,
				w4,
				cumulative,
				estimated:
					report.totalIndirectExpenseCost.projected ||
					report.totalIndirectExpenseCost.totalProjectedValue ||
					'',
				isSummary: true,
			});
		}

		// EBITDA
		if (report?.EBITDA) {
			const w1 = report.EBITDA.week1 ?? 0;
			const w2 = hiddenWeeks.includes('2') ? 0 : (report.EBITDA.week2 ?? 0);
			const w3 = hiddenWeeks.includes('3') ? 0 : (report.EBITDA.week3 ?? 0);
			const w4 = hiddenWeeks.includes('4') ? 0 : (report.EBITDA.week4 ?? 0);
			const cumulative = w1 + w2 + w3 + w4;
			
			rows.push({
				slNo: '-',
				costingType: 'EBITDA',
				w1,
				w2,
				w3,
				w4,
				cumulative,
				estimated: report.EBITDA.projected || '',
				isSummary: true,
			});
		}

		return rows;
	}, [report, hiddenWeeks]);

	return (
		<div>
			<h3 className='text-lg font-semibold text-gray-900 mb-4'>Indirect Expense Details</h3>
			<div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
				<div className='overflow-x-auto'>
					<table className='w-full border-collapse'>
						<thead>
							<tr className='bg-gray-50 border-b border-gray-200'>
								<th className='px-4 py-3 text-left text-xs font-bold text-gray-900'>Sl.No</th>
								<th className='px-4 py-3 text-left text-xs font-bold text-gray-900'>
									Costing Type
								</th>
								<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>W1</th>
								<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>W2</th>
								<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>W3</th>
								<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>W4</th>
								<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>
									cummulative
								</th>
								<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>
									estimated
								</th>
							</tr>
						</thead>
						<tbody>
							{tableData.map((row, index) => (
								<tr
									key={index}
									className={`border-b border-gray-200 ${
										row.isSummary ? 'bg-gray-50 font-semibold' : ''
									}`}
								>
									<td className='px-4 py-3 text-xs font-normal text-gray-900'>{row.slNo}</td>
									<td className='px-4 py-3 text-xs font-normal text-gray-900'>{row.costingType}</td>
									<td
										className={`px-4 py-3 text-[11px] font-normal text-gray-900 text-right ${getWeekBgColor('w1')}`}
									>
										{formatNumber(row.w1)}
									</td>
									<td
										className={`px-4 py-3 text-[11px] font-normal text-gray-900 text-right ${getWeekBgColor('w2')}`}
									>
										{formatNumber(row.w2)}
									</td>
									<td
										className={`px-4 py-3 text-[11px] font-normal text-gray-900 text-right ${getWeekBgColor('w3')}`}
									>
										{formatNumber(row.w3)}
									</td>
									<td
										className={`px-4 py-3 text-[11px] font-normal text-gray-900 text-right ${getWeekBgColor('w4')}`}
									>
										{formatNumber(row.w4)}
									</td>
									<td
										className={`px-4 py-3 text-[11px] font-normal text-gray-900 text-right ${getWeekBgColor('cumulative')}`}
									>
										{formatNumber(row.cumulative)}
									</td>
									<td
										className={`px-4 py-3 text-[11px] font-normal text-gray-900 text-right ${getWeekBgColor('estimated')}`}
									>
										{formatNumber(row.estimated)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};

/**
 * EBITDA Tab Content
 */
export const EBITDATab: React.FC<PLTabContentProps> = ({
	cityId,
	facilityId,
	month,
	year,
	enabled = false,
	onError,
}) => {
	const { data, isLoading, error } = useEBITDAData(cityId, facilityId, month, year, enabled);
	
	// Hidden weeks state - load from localStorage
	const [hiddenWeeks, setHiddenWeeks] = useState<string[]>(() => {
		try {
			const saved = localStorage.getItem('ebitda-hiddenWeeks');
			if (saved) {
				const parsed = JSON.parse(saved);
				if (Array.isArray(parsed)) {
					return parsed.filter((w: string) => ['2', '3', '4'].includes(w));
				}
			}
		} catch (error) {
			console.error('Failed to load hidden weeks from localStorage:', error);
		}
		return [];
	});
	
	// Save hidden weeks to localStorage
	React.useEffect(() => {
		try {
			localStorage.setItem('ebitda-hiddenWeeks', JSON.stringify(hiddenWeeks));
		} catch (error) {
			console.error('Failed to save hidden weeks to localStorage:', error);
		}
	}, [hiddenWeeks]);
	
	// Week options for hiding (only Week 2, 3, 4 can be hidden)
	const weekOptions = useMemo(
		() => [
			{ value: '2', label: 'Week 2' },
			{ value: '3', label: 'Week 3' },
			{ value: '4', label: 'Week 4' },
		],
		[]
	);

	// Get month name from month number
	const getMonthName = (monthNum: string): string => {
		const monthNames = [
			'January',
			'February',
			'March',
			'April',
			'May',
			'June',
			'July',
			'August',
			'September',
			'October',
			'November',
			'December',
		];
		const num = parseInt(monthNum, 10);
		return monthNames[num - 1] || '';
	};

	// Handle API errors with Snackbar
	React.useEffect(() => {
		if (error && onError) {
			onError(`Failed to load EBITDA data: ${error.message}`);
		}
	}, [error, onError]);

	if (isLoading) {
		return (
			<div className='p-6 text-center'>
				<p className='text-gray-600'>Loading EBITDA data...</p>
			</div>
		);
	}

	// Always show table structure, even if no data
	if (!data || !data.report) {
		return (
			<div className='p-6'>
				<h2 className='text-xl font-semibold text-gray-900 mb-6'>Infinitybox Projected P&L</h2>
				<div className='mb-8'>
					<h3 className='text-lg font-semibold text-gray-900 mb-4'>Variable Cost Details</h3>
					<div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
						<div className='overflow-x-auto'>
							<table className='w-full border-collapse'>
								<thead>
									<tr className='bg-gray-50 border-b border-gray-200'>
										<th className='px-4 py-3 text-left text-xs font-bold text-gray-900'>Sl.No</th>
										<th className='px-4 py-3 text-left text-xs font-bold text-gray-900'>
											Costing Type
										</th>
										<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>W1</th>
										<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>W2</th>
										<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>W3</th>
										<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>W4</th>
										<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>
											cummulative
										</th>
										<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>
											estimated
										</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td colSpan={8} className='px-4 py-8 text-center text-gray-500'>
											No data available for {getMonthName(month)} {year}
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
				<div>
					<h3 className='text-lg font-semibold text-gray-900 mb-4'>Indirect Expense Details</h3>
					<div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
						<div className='overflow-x-auto'>
							<table className='w-full border-collapse'>
								<thead>
									<tr className='bg-gray-50 border-b border-gray-200'>
										<th className='px-4 py-3 text-left text-xs font-bold text-gray-900'>Sl.No</th>
										<th className='px-4 py-3 text-left text-xs font-bold text-gray-900'>
											Costing Type
										</th>
										<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>W1</th>
										<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>W2</th>
										<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>W3</th>
										<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>W4</th>
										<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>
											cummulative
										</th>
										<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>
											estimated
										</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td colSpan={8} className='px-4 py-8 text-center text-gray-500'>
											No data available for {getMonthName(month)} {year}
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Get month name from month number
	const monthName = getMonthName(month);
	const report = data.report[monthName];

	// If report doesn't exist for this month, show empty tables
	if (!report) {
		return (
			<div className='p-6'>
				<h2 className='text-xl font-semibold text-gray-900 mb-6'>Infinitybox Projected P&L</h2>
				<div className='mb-8'>
					<h3 className='text-lg font-semibold text-gray-900 mb-4'>Variable Cost Details</h3>
					<div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
						<div className='overflow-x-auto'>
							<table className='w-full border-collapse'>
								<thead>
									<tr className='bg-gray-50 border-b border-gray-200'>
										<th className='px-4 py-3 text-left text-xs font-bold text-gray-900'>Sl.No</th>
										<th className='px-4 py-3 text-left text-xs font-bold text-gray-900'>
											Costing Type
										</th>
										<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>W1</th>
										<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>W2</th>
										<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>W3</th>
										<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>W4</th>
										<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>
											cummulative
										</th>
										<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>
											estimated
										</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td colSpan={8} className='px-4 py-8 text-center text-gray-500'>
											No data available for {monthName} {year}
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
				<div>
					<h3 className='text-lg font-semibold text-gray-900 mb-4'>Indirect Expense Details</h3>
					<div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
						<div className='overflow-x-auto'>
							<table className='w-full border-collapse'>
								<thead>
									<tr className='bg-gray-50 border-b border-gray-200'>
										<th className='px-4 py-3 text-left text-xs font-bold text-gray-900'>Sl.No</th>
										<th className='px-4 py-3 text-left text-xs font-bold text-gray-900'>
											Costing Type
										</th>
										<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>W1</th>
										<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>W2</th>
										<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>W3</th>
										<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>W4</th>
										<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>
											cummulative
										</th>
										<th className='px-4 py-3 text-right text-xs font-bold text-gray-900'>
											estimated
										</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td colSpan={8} className='px-4 py-8 text-center text-gray-500'>
											No data available for {monthName} {year}
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='p-6'>
			<div className='flex justify-between items-center mb-6'>
				<h2 className='text-xl font-semibold text-gray-900'>Infinitybox Projected P&L</h2>
				<div className='w-56'>
					<MultiSelectDropdown
						label='Hide Weeks'
						options={weekOptions}
						value={hiddenWeeks}
						onChange={setHiddenWeeks}
						placeholder=''
						className='w-full'
						searchable={false}
						showSelectedCount={true}
					/>
				</div>
			</div>
			<VariableCostDetailsTable report={report} hiddenWeeks={hiddenWeeks} />
			<IndirectExpenseDetailsTable report={report} hiddenWeeks={hiddenWeeks} />
		</div>
	);
};

