import React from 'react';
import { Table } from '../../../components/ui/DataDisplay';
import { TableColumn } from '../../../components/ui/DataDisplay';
import { ReviewCostingType } from '../../../services/pAndLApi';

interface CostingBudgetRow {
	id: number;
	costingType: string;
	budget: string;
	reviewCategoryName: string;
}

interface CostingBudgetTableProps {
	costingTypes: ReviewCostingType[];
	budgets: Record<number, string>; // Map of costing type ID to budget value
	onBudgetChange: (costingTypeId: number, value: string) => void;
	isLoading?: boolean;
}

export const CostingBudgetTable: React.FC<CostingBudgetTableProps> = ({
	costingTypes,
	budgets,
	onBudgetChange,
	isLoading = false,
}) => {
	// Transform costing types into table rows
	const tableData: CostingBudgetRow[] = React.useMemo(() => {
		const rows = costingTypes.map(costingType => ({
			id: costingType.id,
			costingType: costingType.name,
			budget: budgets[costingType.id] || '0',
			reviewCategoryName: costingType.reviewCategoryName,
		}));

		// Calculate total
		const total = rows.reduce((sum, row) => {
			const value = parseFloat(row.budget) || 0;
			return sum + value;
		}, 0);

		// Add total row
		rows.push({
			id: -1, // Special ID for total row
			costingType: 'Total',
			budget: total.toString(),
			reviewCategoryName: '',
		});

		return rows;
	}, [costingTypes, budgets]);

	const columns: TableColumn<CostingBudgetRow>[] = React.useMemo(
		() => [
			{
				key: 'costingType',
				title: 'Costing Type',
				align: 'left',
				width: '300px',
				sortable: true,
				cellClassName: 'text-xs',
			},
			{
				key: 'budget',
				title: 'Budget',
				align: 'right',
				width: '200px',
				sortable: false,
				headerClassName: '[&>div]:justify-end',
				render: (_value: unknown, record: CostingBudgetRow) => {
					const isTotal = record.id === -1;
					if (isTotal) {
						const totalValue = parseFloat(record.budget) || 0;
						return (
							<div className='text-sm font-semibold text-gray-900 text-right'>
								₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
							</div>
						);
					}
					return (
						<input
							type='number'
							value={record.budget || '0'}
							onChange={e => onBudgetChange(record.id, e.target.value)}
							placeholder='Enter budget'
							className='w-32 ml-auto px-3 py-2 border border-gray-300 rounded-md text-sm text-right focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200'
						/>
					);
				},
			},
		],
		[onBudgetChange]
	);

	if (isLoading) {
		return (
			<div className='bg-white rounded-lg border border-gray-200 p-6'>
				<div className='text-center text-gray-500'>Loading costing types...</div>
			</div>
		);
	}

	if (tableData.length === 0) {
		return (
			<div className='bg-white rounded-lg border border-gray-200 p-6'>
				<div className='text-center text-gray-500'>No costing types available</div>
			</div>
		);
	}

	return (
		<div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
			<div className='bg-gray-50 border-b border-gray-200 px-6 py-3'>
				<h3 className='text-sm font-semibold text-gray-900'>Budget</h3>
			</div>
			<Table
				data={tableData}
				columns={columns}
				size='sm'
				emptyMessage='No costing types found'
			/>
		</div>
	);
};

