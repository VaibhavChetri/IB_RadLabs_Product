/**
 * Table column definitions for Vehicle listing
 */

import { Edit, Trash2 } from 'lucide-react';
import type { TableColumn } from '../../../components/ui/DataDisplay';
import type { Vehicle } from '../../../services/vehicleApi';
import { isActiveStatus, getStatusLabel } from './constants';

interface ColumnProps {
	onEdit: (item: Vehicle) => void;
	onDelete: (item: Vehicle) => void;
}

export const getVehicleColumns = ({
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
						onClick={() => onEdit(row as unknown as Vehicle)}
						className='p-2 text-green-600 hover:bg-green-50 rounded transition-colors'
						title='Edit'
					>
						<Edit className='w-4 h-4' />
					</button>
					<button
						onClick={() => onDelete(row as unknown as Vehicle)}
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
		key: 'name',
		title: 'Name',
		sortable: true,
		align: 'center',
		render: (value: unknown) => (
			<div className='font-semibold text-gray-900 text-center'>{String(value || '')}</div>
		),
	},
	{
		key: 'driver_name',
		title: 'Driver Name',
		sortable: true,
		align: 'center',
		render: (value: unknown) => (
			<div className='text-gray-700 text-center'>{String(value || '')}</div>
		),
	},
	{
		key: 'driver_phone',
		title: 'Driver Phone',
		sortable: true,
		align: 'center',
		render: (value: unknown) => (
			<div className='text-gray-700 text-center'>{String(value || '')}</div>
		),
	},
	{
		key: 'vehicle_number',
		title: 'Vehicle Number',
		sortable: true,
		align: 'center',
		render: (value: unknown) => (
			<div className='text-gray-700 text-center'>{String(value || 'N/A')}</div>
		),
	},
	{
		key: 'status',
		title: 'Status',
		sortable: true,
		align: 'center',
		render: (_value: unknown, row: Record<string, unknown>) => {
			const status = Number(row.status || 0);
			const isActive = isActiveStatus(status);
			return (
				<span
					className={`px-2 py-1 rounded text-xs font-medium ${
						isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
					}`}
				>
					{getStatusLabel(status)}
				</span>
			);
		},
	},
	{
		key: 'created_at',
		title: 'Created At',
		sortable: true,
		align: 'center',
		render: (value: unknown) => {
			if (!value) return <div className='text-gray-500 text-center'>N/A</div>;
			const date = new Date(String(value));
			return (
				<div className='text-gray-600 text-center text-sm'>
					{date.toLocaleDateString('en-US', {
						year: 'numeric',
						month: 'short',
						day: 'numeric',
					})}
				</div>
			);
		},
	},
];


