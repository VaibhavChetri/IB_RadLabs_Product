/**
 * Table column definitions for Escalation Type listing
 */

import { Edit } from 'lucide-react';
import type { TableColumn } from '../../../components/ui/DataDisplay';
import type { EscalationType } from '../../../services/transitPlanApi';

interface ColumnProps {
	onEdit: (item: EscalationType) => void;
}

export const getEscalationTypeColumns = ({
	onEdit,
}: ColumnProps): TableColumn<Record<string, unknown>>[] => [
	{
		key: 'actions',
		title: 'Actions',
		sortable: false,
		align: 'center',
		render: (_value: unknown, row: Record<string, unknown>) => {
			return (
				<button
					onClick={() => onEdit(row as unknown as EscalationType)}
					className='p-2 text-green-600 hover:bg-green-50 rounded transition-colors'
					title='Edit'
				>
					<Edit className='w-4 h-4' />
				</button>
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
		title: 'Escalation Type Name',
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
			// API returns status as number (1 = Active, 0 = Inactive) and status_name as string
			const status = row.status as number;
			const statusName = (row.status_name as string) || (status === 1 ? 'Active' : 'Inactive');
			const isActive = status === 1;
			return (
				<span
					className={`px-2 py-1 rounded text-xs font-medium ${
						isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
					}`}
				>
					{statusName}
				</span>
			);
		},
	},
];
