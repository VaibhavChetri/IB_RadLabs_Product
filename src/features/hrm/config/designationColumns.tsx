/**
 * Table column definitions for Designation listing
 */

import { Edit, Trash2 } from 'lucide-react';
import type { TableColumn } from '../../../components/ui/DataDisplay';
import type { HrmDesignation } from '../../../services/hrmApi';
import { HrIconTooltip } from '../components/HrIconTooltip';

interface ColumnProps {
	onEdit: (item: HrmDesignation) => void;
	onDelete: (item: HrmDesignation) => void;
	pageNumber?: number;
	itemsPerPage?: number;
}

export const getDesignationColumns = ({
	onEdit,
	onDelete,
	pageNumber = 1,
	itemsPerPage = 20,
}: ColumnProps): TableColumn<Record<string, unknown>>[] => [
	{
		key: 'actions',
		title: 'Actions',
		sortable: false,
		align: 'center',
		render: (_value: unknown, row: Record<string, unknown>) => {
			return (
				<div className='flex items-center justify-center gap-1'>
					<HrIconTooltip label='Edit'>
						<button
							type='button'
							onClick={() => onEdit(row as unknown as HrmDesignation)}
							className='p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors'
						>
							<Edit className='w-4 h-4' />
						</button>
					</HrIconTooltip>
					<HrIconTooltip label='Delete'>
						<button
							type='button'
							onClick={() => onDelete(row as unknown as HrmDesignation)}
							className='p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors'
						>
							<Trash2 className='w-4 h-4' />
						</button>
					</HrIconTooltip>
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
		key: 'title',
		title: 'Designation Title',
		sortable: true,
		align: 'left',
		render: (value: unknown) => (
			<div className='font-semibold text-gray-900'>{String(value || '')}</div>
		),
	},
	{
		key: 'level',
		title: 'Level',
		sortable: true,
		align: 'center',
		render: (value: unknown) => (
			<div className='text-gray-700 text-center font-medium'>{String(value ?? 'N/A')}</div>
		),
	},
	{
		key: 'is_active',
		title: 'Status',
		sortable: true,
		align: 'center',
		render: (value: unknown) => {
			const isActive = Boolean(value);
			return (
				<span
					className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
						isActive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
					}`}
				>
					{isActive ? 'Active' : 'Inactive'}
				</span>
			);
		},
	},
];
