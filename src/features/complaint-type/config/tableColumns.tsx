/**
 * Table column definitions for Complaint Type listing
 */

import { Edit, Trash2 } from 'lucide-react';
import type { TableColumn } from '../../../components/ui/DataDisplay';
import type { ComplaintType } from '../../../services/complaintTypeApi';

interface ColumnProps {
	onEdit: (item: ComplaintType) => void;
	onDelete?: (item: ComplaintType) => void;
}

export const getComplaintTypeColumns = ({
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
						onClick={() => onEdit(row as unknown as ComplaintType)}
						className='p-2 text-green-600 hover:bg-green-50 rounded transition-colors'
						title='Edit'
					>
						<Edit className='w-4 h-4' />
					</button>
					{onDelete && (
						<button
							onClick={() => onDelete(row as unknown as ComplaintType)}
							className='p-2 text-red-600 hover:bg-red-50 rounded transition-colors'
							title='Delete'
						>
							<Trash2 className='w-4 h-4' />
						</button>
					)}
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
		title: 'QC Type Name',
		sortable: true,
		align: 'center',
		render: (value: unknown) => (
			<div className='font-semibold text-gray-900 text-center'>{String(value || '')}</div>
		),
	},
	{
		key: 'status',
		title: 'Status',
		sortable: true,
		align: 'center',
		render: (_value: unknown, row: Record<string, unknown>) => {
			// API returns status as string ('Active' or 'Inactive')
			const status = String(row.status || '');
			const isActive = status === 'Active';
			return (
				<span
					className={`px-2 py-1 rounded text-xs font-medium ${
						isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
					}`}
				>
					{status}
				</span>
			);
		},
	},
];
