/**
 * Table column definitions for Client Escalation listing
 */

import { Edit } from 'lucide-react';
import type { TableColumn } from '../../../components/ui/DataDisplay';
import type { ClientEscalation } from '../../../services/transitPlanApi';

interface ColumnProps {
	onEdit: (item: ClientEscalation) => void;
	pageNumber: number;
	itemsPerPage: number;
}

export const getClientEscalationColumns = ({
	onEdit,
	pageNumber,
	itemsPerPage,
}: ColumnProps): TableColumn<Record<string, unknown>>[] => [
	{
		key: 'actions',
		title: 'Actions',
		sortable: false,
		align: 'center',
		render: (_value: unknown, row: Record<string, unknown>) => {
			return (
				<button
					onClick={() => onEdit(row as unknown as ClientEscalation)}
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
			<div className='font-semibold text-gray-600 text-center'>
				{(pageNumber - 1) * itemsPerPage + index + 1}
			</div>
		),
	},
	{
		key: 'escalation_date',
		title: 'Escalation Date',
		sortable: true,
		align: 'center',
		render: (value: unknown) => (
			<div className='text-gray-900 text-center'>{String(value || '')}</div>
		),
	},
	{
		key: 'client_name',
		title: 'Client',
		sortable: true,
		align: 'center',
		render: (value: unknown) => (
			<div className='font-semibold text-gray-900 text-center'>{String(value || '')}</div>
		),
	},
	{
		key: 'facility',
		title: 'Facility',
		sortable: true,
		align: 'center',
		render: (value: unknown) => (
			<div className='text-gray-700 text-center'>{String(value || '')}</div>
		),
	},
	{
		key: 'escalation_type',
		title: 'Escalation Type',
		sortable: true,
		align: 'center',
		render: (value: unknown) => (
			<div className='text-gray-700 text-center'>{String(value || '')}</div>
		),
	},
	{
		key: 'containerType',
		title: 'Container Type',
		sortable: true,
		align: 'center',
		render: (value: unknown) => (
			<div className='text-gray-700 text-center'>{String(value || '')}</div>
		),
	},
	{
		key: 'resolution_status',
		title: 'Status',
		sortable: true,
		align: 'center',
		render: (_value: unknown, row: Record<string, unknown>) => {
			const status = String(row.resolution_status || 'Open');
			const isResolved = status.toLowerCase() === 'resolved' || status.toLowerCase() === 'closed';
			return (
				<span
					className={`px-2 py-1 rounded text-xs font-medium ${
						isResolved
							? 'bg-green-100 text-green-800'
							: 'bg-yellow-100 text-yellow-800'
					}`}
				>
					{status}
				</span>
			);
		},
	},
	{
		key: 'raised_by',
		title: 'Raised By',
		sortable: true,
		align: 'center',
		render: (value: unknown) => (
			<div className='text-gray-700 text-center'>{String(value || '')}</div>
		),
	},
	{
		key: 'client_designation',
		title: 'Client Designation',
		sortable: true,
		align: 'center',
		render: (value: unknown) => (
			<div className='text-gray-700 text-center'>{String(value || '')}</div>
		),
	},
	{
		key: 'details',
		title: 'Details',
		sortable: false,
		align: 'left',
		render: (value: unknown) => (
			<div className='text-gray-700 max-w-xs truncate' title={String(value || '')}>
				{String(value || '')}
			</div>
		),
	},
	{
		key: 'resolution',
		title: 'Resolution',
		sortable: false,
		align: 'left',
		render: (value: unknown) => (
			<div className='text-gray-700 max-w-xs truncate' title={String(value || '')}>
				{String(value || 'N/A')}
			</div>
		),
	},
];

