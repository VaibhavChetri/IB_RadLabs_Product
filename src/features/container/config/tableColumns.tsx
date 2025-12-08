/**
 * Table column definitions for Container Type listing
 */

import { Edit, Trash2 } from 'lucide-react';
import type { TableColumn } from '../../../components/ui/DataDisplay';
import type { ContainerType } from '../../../services/containerApi';

interface ColumnProps {
	onEdit: (item: ContainerType) => void;
	onDelete: (item: ContainerType) => void;
}

export const getContainerColumns = ({
	onEdit,
	onDelete,
}: ColumnProps): TableColumn<Record<string, unknown>>[] => [
	{
		key: 'actions',
		title: 'Actions',
		sortable: false,
		align: 'center',
		render: (_value: unknown, row: Record<string, unknown>) => {
			return (
				<div className='flex items-center justify-center gap-2'>
					<button
						onClick={() => onEdit(row as unknown as ContainerType)}
						className='p-2 text-green-600 hover:bg-green-50 rounded transition-colors'
						title='Edit'
					>
						<Edit className='w-4 h-4' />
					</button>
					<button
						onClick={() => onDelete(row as unknown as ContainerType)}
						className='p-2 text-red-600 hover:bg-red-50 rounded transition-colors'
						title='Delete'
					>
						<Trash2 className='w-4 h-4' />
					</button>
				</div>
			);
		},
	},
	{
		key: 'serial',
		title: '#',
		sortable: false,
		align: 'center',
		render: (_value: unknown, _row: Record<string, unknown>, index: number) => (
			<div className='font-semibold text-gray-600 text-center'>{index + 1}</div>
		),
	},
	{
		key: 'sku',
		title: 'Container Name',
		sortable: true,
		align: 'center',
		render: (value: unknown) => (
			<div className='font-semibold text-gray-900 text-center'>{String(value || '')}</div>
		),
	},
	{
		key: 'name',
		title: 'City',
		sortable: true,
		align: 'center',
		render: (value: unknown) => (
			<div className='text-gray-700 text-center'>{String(value || 'N/A')}</div>
		),
	},
	{
		key: 'weight',
		title: 'Weight',
		sortable: true,
		align: 'center',
		render: (value: unknown) => (
			<div className='text-gray-700 text-center'>{String(value || '0')}</div>
		),
	},
	{
		key: 'weightInGms',
		title: 'Weight (gms)',
		sortable: true,
		align: 'center',
		render: (value: unknown) => (
			<div className='text-gray-700 text-center'>{String(value || '0')}</div>
		),
	},
	{
		key: 'dishwasherCyclesPerDay',
		title: 'Cycles/Day',
		sortable: true,
		align: 'center',
		render: (value: unknown) => (
			<div className='text-gray-700 text-center'>{String(value || '0')}</div>
		),
	},
	{
		key: 'dishwasherOptimumCapacity',
		title: 'Optimum Capacity',
		sortable: true,
		align: 'center',
		render: (value: unknown) => (
			<div className='text-gray-700 text-center'>{String(value || '0')}</div>
		),
	},
	{
		key: 'impact_accountable',
		title: 'Impact Accountable',
		sortable: true,
		align: 'center',
		render: (value: unknown) => {
			const isAccountable = Number(value) === 1;
			return (
				<span
					className={`px-2 py-1 rounded text-xs font-medium ${
						isAccountable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
					}`}
				>
					{isAccountable ? 'Yes' : 'No'}
				</span>
			);
		},
	},
	{
		key: 'containerCount',
		title: 'Container Count',
		sortable: false,
		align: 'center',
		render: (value: unknown) => {
			if (value === undefined || value === null)
				return <div className='text-gray-500 text-center'>-</div>;
			return <div className='text-gray-700 text-center'>{String(value)}</div>;
		},
	},
];
