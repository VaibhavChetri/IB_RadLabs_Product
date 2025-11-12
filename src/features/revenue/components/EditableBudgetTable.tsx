import React from 'react';
import { Table } from '../../../components/ui/DataDisplay';
import { TableColumn } from '../../../components/ui/DataDisplay';
import { RevenueRecord } from '../../../services/pAndLApi';

interface EditableBudgetRow extends Record<string, unknown> {
	id: number;
	costingTypeName: string;
	projected_value: string;
	week1_actual_value: string;
	week2_actual_value: string;
	week3_actual_value: string;
	week4_actual_value: string;
}

interface EditableBudgetTableProps {
	records: RevenueRecord[];
	onWeekChange: (recordId: number, week: 'week1' | 'week2' | 'week3' | 'week4', value: string) => void;
	isLoading?: boolean;
}

/**
 * Format number as Indian Rupee currency
 */
const formatCurrency = (value: string | number | null | undefined): string => {
	if (value === null || value === undefined || value === '') return '₹0.00';
	const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
	if (isNaN(num)) return '₹0.00';
	return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const EditableBudgetTable: React.FC<EditableBudgetTableProps> = ({
	records,
	onWeekChange,
	isLoading = false,
}) => {
	// Transform records into table rows
	const tableData: EditableBudgetRow[] = React.useMemo(() => {
		const rows = records.map(record => ({
			id: record.id,
			costingTypeName: record.costingTypeName,
			projected_value: record.projected_value || '0',
			week1_actual_value: record.week1_actual_value || '0',
			week2_actual_value: record.week2_actual_value || '0',
			week3_actual_value: record.week3_actual_value || '0',
			week4_actual_value: record.week4_actual_value || '0',
		}));

		// Calculate total row
		const total = rows.reduce(
			(acc, row) => {
				acc.projected_value += parseFloat(row.projected_value) || 0;
				acc.week1_actual_value += parseFloat(row.week1_actual_value) || 0;
				acc.week2_actual_value += parseFloat(row.week2_actual_value) || 0;
				acc.week3_actual_value += parseFloat(row.week3_actual_value) || 0;
				acc.week4_actual_value += parseFloat(row.week4_actual_value) || 0;
				return acc;
			},
			{
				projected_value: 0,
				week1_actual_value: 0,
				week2_actual_value: 0,
				week3_actual_value: 0,
				week4_actual_value: 0,
			}
		);

		// Add total row
		rows.push({
			id: -1, // Special ID for total row
			costingTypeName: 'Total',
			projected_value: total.projected_value.toString(),
			week1_actual_value: total.week1_actual_value.toString(),
			week2_actual_value: total.week2_actual_value.toString(),
			week3_actual_value: total.week3_actual_value.toString(),
			week4_actual_value: total.week4_actual_value.toString(),
		});

		return rows;
	}, [records]);

	const columns: TableColumn<EditableBudgetRow>[] = React.useMemo(
		() => [
			{
				key: 'costingTypeName',
				title: 'Budget',
				align: 'left',
				width: '250px',
				sortable: true,
				cellClassName: 'text-xs',
			},
			{
				key: 'projected_value',
				title: 'Estimate',
				align: 'right',
				width: '150px',
				sortable: false,
				cellClassName: 'text-xs',
				render: (_value: unknown, record: EditableBudgetRow) => {
					const isTotal = record.id === -1;
					return (
						<div className={`text-right ${isTotal ? 'font-semibold' : ''}`}>
							{formatCurrency(record.projected_value)}
						</div>
					);
				},
			},
			{
				key: 'week1_actual_value',
				title: 'W1',
				align: 'center',
				width: '150px',
				sortable: false,
				render: (_value: unknown, record: EditableBudgetRow) => {
					const isTotal = record.id === -1;
					if (isTotal) {
						return (
							<div className='text-right font-semibold'>
								{formatCurrency(record.week1_actual_value)}
							</div>
						);
					}
					return (
						<input
							type='number'
							value={record.week1_actual_value}
							onChange={e => onWeekChange(record.id, 'week1', e.target.value)}
							className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-right focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200'
						/>
					);
				},
			},
			{
				key: 'week2_actual_value',
				title: 'W2',
				align: 'center',
				width: '150px',
				sortable: false,
				render: (_value: unknown, record: EditableBudgetRow) => {
					const isTotal = record.id === -1;
					if (isTotal) {
						return (
							<div className='text-right font-semibold'>
								{formatCurrency(record.week2_actual_value)}
							</div>
						);
					}
					return (
						<input
							type='number'
							value={record.week2_actual_value}
							onChange={e => onWeekChange(record.id, 'week2', e.target.value)}
							className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-right focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200'
						/>
					);
				},
			},
			{
				key: 'week3_actual_value',
				title: 'W3',
				align: 'center',
				width: '150px',
				sortable: false,
				render: (_value: unknown, record: EditableBudgetRow) => {
					const isTotal = record.id === -1;
					if (isTotal) {
						return (
							<div className='text-right font-semibold'>
								{formatCurrency(record.week3_actual_value)}
							</div>
						);
					}
					return (
						<input
							type='number'
							value={record.week3_actual_value}
							onChange={e => onWeekChange(record.id, 'week3', e.target.value)}
							className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-right focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200'
						/>
					);
				},
			},
			{
				key: 'week4_actual_value',
				title: 'W4',
				align: 'center',
				width: '150px',
				sortable: false,
				render: (_value: unknown, record: EditableBudgetRow) => {
					const isTotal = record.id === -1;
					if (isTotal) {
						return (
							<div className='text-right font-semibold'>
								{formatCurrency(record.week4_actual_value)}
							</div>
						);
					}
					return (
						<input
							type='number'
							value={record.week4_actual_value}
							onChange={e => onWeekChange(record.id, 'week4', e.target.value)}
							className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-right focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200'
						/>
					);
				},
			},
		],
		[onWeekChange]
	);

	if (isLoading) {
		return (
			<div className='bg-white rounded-lg border border-gray-200 p-6'>
				<div className='text-center text-gray-500'>Loading budget data...</div>
			</div>
		);
	}

	if (tableData.length === 0) {
		return (
			<div className='bg-white rounded-lg border border-gray-200 p-6'>
				<div className='text-center text-gray-500'>No budget data available</div>
			</div>
		);
	}

	return (
		<div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
			<Table<EditableBudgetRow>
				data={tableData}
				columns={columns}
				size='sm'
				emptyText='No budget data found'
			/>
		</div>
	);
};

