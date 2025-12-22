/**
 * Table column definitions for Vehicle listing
 */

import { Edit } from 'lucide-react';
import type { TableColumn } from '../../../components/ui/DataDisplay';
import type { Vehicle } from '../../../services/vehicleApi';
import { isActiveStatus } from './constants';

// Status Toggle Component
const StatusToggle: React.FC<{
	isActive: boolean;
	onToggle: () => void;
	disabled?: boolean;
}> = ({ isActive, onToggle, disabled = false }) => {
	return (
		<div className='flex items-center justify-center'>
			<button
				onClick={onToggle}
				disabled={disabled}
				className={`
					relative inline-flex h-4 w-8 items-center justify-center rounded-full transition-all duration-200 ease-in-out focus:outline-none
					${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
					${isActive ? 'bg-green-500' : 'bg-gray-300 hover:bg-gray-400'}
				`}
			>
				<span
					className={`
						absolute h-3 w-3 transform rounded-full bg-white transition-all duration-200 ease-in-out
						${isActive ? 'translate-x-2' : '-translate-x-2'}
					`}
				/>
			</button>
			<span className={`ml-2 text-xs font-medium ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
				{isActive ? 'Active' : 'Inactive'}
			</span>
		</div>
	);
};

interface ColumnProps {
	onEdit: (item: Vehicle) => void;
	onToggleStatus: (item: Vehicle) => void;
	pageNumber?: number;
	itemsPerPage?: number;
	isToggling?: boolean;
}

export const getVehicleColumns = ({
	onEdit,
	onToggleStatus,
	pageNumber = 1,
	itemsPerPage = 10,
	isToggling = false,
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
				</div>
			);
		},
	},
	{
		key: 'serial',
		title: '#',
		sortable: false,
		align: 'center',
		render: (_value: unknown, _row: Record<string, unknown>, index: number) => {
			const serialNumber = (pageNumber - 1) * itemsPerPage + index + 1;
			return <div className='font-semibold text-gray-600 text-center'>{serialNumber}</div>;
		},
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
		key: 'city_name',
		title: 'City',
		sortable: true,
		align: 'center',
		render: (value: unknown, row: Record<string, unknown>) => (
			<div className='text-gray-700 text-center'>
				{String(value || row.city_id || 'N/A')}
			</div>
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
				<StatusToggle
					isActive={isActive}
					onToggle={() => onToggleStatus(row as unknown as Vehicle)}
					disabled={isToggling}
				/>
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










