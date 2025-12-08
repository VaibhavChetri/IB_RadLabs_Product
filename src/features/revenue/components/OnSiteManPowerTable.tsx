import React from 'react';
import { OnSiteManPowerClient, OnSiteManPowerItem } from '../../../services/pAndLApi';
import { Table } from '../../../components/ui/DataDisplay';
import { TableColumn } from '../../../components/ui/DataDisplay';

interface OnSiteManPowerRow extends Record<string, unknown> {
	id: number;
	clientName: string;
	estimate: string;
}

interface OnSiteManPowerTableProps {
	clients: OnSiteManPowerClient[];
	estimates: Record<number, string>; // Map of client_id to estimate value
	onEstimateChange: (clientId: number, value: string) => void;
	manPowerResults?: OnSiteManPowerItem[];
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

export const OnSiteManPowerTable: React.FC<OnSiteManPowerTableProps> = ({
	clients,
	estimates,
	onEstimateChange,
	manPowerResults,
	isLoading = false,
}) => {
	// Transform clients into table rows
	const tableData: OnSiteManPowerRow[] = React.useMemo(() => {
		const rows = clients.map(client => {
			// Check if we have estimate from API (manPowerResults) or from state
			let estimateValue = estimates[client.client_id] || '0';

			// If no estimate in state, check manPowerResults
			if (!estimates[client.client_id] && manPowerResults) {
				const manPowerItem = manPowerResults.find(item => item.client_id === client.client_id);
				if (manPowerItem) {
					estimateValue = parseFloat(manPowerItem.est).toString();
				}
			}

			return {
				id: client.client_id,
				clientName: client.client_name,
				estimate: estimateValue,
			};
		});

		// Calculate total
		const total = rows.reduce((sum, row) => {
			const value = parseFloat(row.estimate) || 0;
			return sum + value;
		}, 0);

		// Add total row
		rows.push({
			id: -1, // Special ID for total row
			clientName: 'Total',
			estimate: total.toString(),
		});

		return rows;
	}, [clients, estimates, manPowerResults]);

	const columns: TableColumn<OnSiteManPowerRow>[] = React.useMemo(
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
				key: 'estimate',
				title: 'Estimate',
				align: 'right',
				width: '200px',
				sortable: false,
				headerClassName: '[&>div]:justify-end',
				render: (_value: unknown, record: OnSiteManPowerRow) => {
					const isTotal = record.id === -1;
					if (isTotal) {
						const totalValue = parseFloat(record.estimate) || 0;
						return (
							<div className='text-sm font-semibold text-gray-900 text-right'>
								{formatCurrency(totalValue)}
							</div>
						);
					}
					const estimateValue = parseFloat(record.estimate) || 0;
					const hasValue = estimateValue > 0;
					return (
						<input
							type='number'
							value={record.estimate}
							onChange={e => onEstimateChange(record.id, e.target.value)}
							placeholder='Enter estimate'
							className={`w-32 ml-auto px-3 py-2 border border-gray-300 rounded-md text-sm text-right focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 ${
								hasValue ? 'bg-white' : 'bg-gray-50'
							}`}
						/>
					);
				},
			},
		],
		[onEstimateChange]
	);

	if (isLoading) {
		return (
			<div className='bg-white rounded-lg border border-gray-200 p-6'>
				<div className='text-center text-gray-500'>Loading on-site manpower clients...</div>
			</div>
		);
	}

	if (tableData.length === 0) {
		return (
			<div className='bg-white rounded-lg border border-gray-200 p-6'>
				<div className='text-center text-gray-500'>No clients available</div>
			</div>
		);
	}

	return (
		<div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
			<div className='bg-gray-50 border-b border-gray-200 px-6 py-3'>
				<h3 className='text-sm font-semibold text-gray-900'>On-Site Manpower Budget</h3>
			</div>
			<Table<OnSiteManPowerRow>
				data={tableData}
				columns={columns}
				size='sm'
				emptyText='No clients found'
			/>
		</div>
	);
};
