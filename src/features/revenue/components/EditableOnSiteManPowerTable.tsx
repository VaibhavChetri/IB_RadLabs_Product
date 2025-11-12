import React from 'react';
import { Table } from '../../../components/ui/DataDisplay';
import { TableColumn } from '../../../components/ui/DataDisplay';
import { OnSiteManPowerItem } from '../../../services/pAndLApi';

interface EditableOnSiteManPowerRow extends Record<string, unknown> {
	id: number;
	client_id: number;
	clientName: string;
	est: string;
	week1: string;
	week2: string;
	week3: string;
	week4: string;
}

interface EditableOnSiteManPowerTableProps {
	manPowerDetails: OnSiteManPowerItem[];
	onWeekChange: (
		clientId: number,
		week: 'week1' | 'week2' | 'week3' | 'week4',
		value: string
	) => void;
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

export const EditableOnSiteManPowerTable: React.FC<EditableOnSiteManPowerTableProps> = ({
	manPowerDetails,
	onWeekChange,
	isLoading = false,
}) => {
	// Transform manPowerDetails into table rows
	const tableData: EditableOnSiteManPowerRow[] = React.useMemo(() => {
		const rows = manPowerDetails.map(item => ({
			id: item.id,
			client_id: item.client_id,
			clientName: item.client_name,
			est: item.est || '0',
			week1: item.week1 || '0',
			week2: item.week2 || '0',
			week3: item.week3 || '0',
			week4: item.week4 || '0',
		}));

		// Calculate total row
		const total = rows.reduce(
			(acc, row) => {
				acc.est += parseFloat(row.est) || 0;
				acc.week1 += parseFloat(row.week1) || 0;
				acc.week2 += parseFloat(row.week2) || 0;
				acc.week3 += parseFloat(row.week3) || 0;
				acc.week4 += parseFloat(row.week4) || 0;
				return acc;
			},
			{ est: 0, week1: 0, week2: 0, week3: 0, week4: 0 }
		);

		// Add total row
		rows.push({
			id: -1, // Special ID for total row
			client_id: -1,
			clientName: 'Total',
			est: total.est.toString(),
			week1: total.week1.toString(),
			week2: total.week2.toString(),
			week3: total.week3.toString(),
			week4: total.week4.toString(),
		});

		return rows;
	}, [manPowerDetails]);

	const columns: TableColumn<EditableOnSiteManPowerRow>[] = React.useMemo(
		() => [
			{
				key: 'clientName',
				title: 'Client',
				align: 'left',
				width: '300px',
				sortable: true,
				cellClassName: 'text-xs',
			},
			{
				key: 'est',
				title: 'Estimate',
				align: 'right',
				width: '150px',
				sortable: false,
				cellClassName: 'text-xs',
				render: (_value: unknown, record: EditableOnSiteManPowerRow) => {
					const isTotal = record.id === -1;
					return (
						<div className={`text-right ${isTotal ? 'font-semibold' : ''}`}>
							{formatCurrency(record.est)}
						</div>
					);
				},
			},
			{
				key: 'week1',
				title: 'W1',
				align: 'center',
				width: '150px',
				sortable: false,
				render: (_value: unknown, record: EditableOnSiteManPowerRow) => {
					const isTotal = record.id === -1;
					if (isTotal) {
						return <div className='text-right font-semibold'>{formatCurrency(record.week1)}</div>;
					}
					return (
						<input
							type='number'
							value={record.week1}
							onChange={e => onWeekChange(record.client_id, 'week1', e.target.value)}
							className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-right focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200'
						/>
					);
				},
			},
			{
				key: 'week2',
				title: 'W2',
				align: 'center',
				width: '150px',
				sortable: false,
				render: (_value: unknown, record: EditableOnSiteManPowerRow) => {
					const isTotal = record.id === -1;
					if (isTotal) {
						return <div className='text-right font-semibold'>{formatCurrency(record.week2)}</div>;
					}
					return (
						<input
							type='number'
							value={record.week2}
							onChange={e => onWeekChange(record.client_id, 'week2', e.target.value)}
							className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-right focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200'
						/>
					);
				},
			},
			{
				key: 'week3',
				title: 'W3',
				align: 'center',
				width: '150px',
				sortable: false,
				render: (_value: unknown, record: EditableOnSiteManPowerRow) => {
					const isTotal = record.id === -1;
					if (isTotal) {
						return <div className='text-right font-semibold'>{formatCurrency(record.week3)}</div>;
					}
					return (
						<input
							type='number'
							value={record.week3}
							onChange={e => onWeekChange(record.client_id, 'week3', e.target.value)}
							className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-right focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200'
						/>
					);
				},
			},
			{
				key: 'week4',
				title: 'W4',
				align: 'center',
				width: '150px',
				sortable: false,
				render: (_value: unknown, record: EditableOnSiteManPowerRow) => {
					const isTotal = record.id === -1;
					if (isTotal) {
						return <div className='text-right font-semibold'>{formatCurrency(record.week4)}</div>;
					}
					return (
						<input
							type='number'
							value={record.week4}
							onChange={e => onWeekChange(record.client_id, 'week4', e.target.value)}
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
				<div className='text-center text-gray-500'>Loading on-site manpower data...</div>
			</div>
		);
	}

	if (tableData.length === 0) {
		return (
			<div className='bg-white rounded-lg border border-gray-200 p-6'>
				<div className='text-center text-gray-500'>No on-site manpower data available</div>
			</div>
		);
	}

	return (
		<div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
			<div className='bg-gray-50 border-b border-gray-200 px-6 py-3'>
				<h3 className='text-sm font-semibold text-gray-900'>On-Site Manpower Weekly Entry</h3>
			</div>
			<Table<EditableOnSiteManPowerRow>
				data={tableData}
				columns={columns}
				size='sm'
				emptyText='No on-site manpower data found'
			/>
		</div>
	);
};
