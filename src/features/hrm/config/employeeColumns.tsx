/**
 * Table column definitions for Employee listing
 */

import { Edit, Trash2, Eye } from 'lucide-react';
import type { TableColumn } from '../../../components/ui/DataDisplay';
import type { HrmEmployee } from '../../../services/hrmApi';
import { HrIconTooltip } from '../components/HrIconTooltip';
import { getStatusColor, getStatusLabel, getEmploymentTypeLabel } from './constants';

interface ColumnProps {
	onEdit: (item: HrmEmployee) => void;
	onDelete: (item: HrmEmployee) => void;
	onView: (item: HrmEmployee) => void;
	pageNumber?: number;
	itemsPerPage?: number;
}

export const getEmployeeColumns = ({
	onEdit,
	onDelete,
	onView,
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
					<HrIconTooltip label='View'>
						<button
							type='button'
							onClick={() => onView(row as unknown as HrmEmployee)}
							className='p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors'
						>
							<Eye className='w-4 h-4' />
						</button>
					</HrIconTooltip>
					<HrIconTooltip label='Edit'>
						<button
							type='button'
							onClick={() => onEdit(row as unknown as HrmEmployee)}
							className='p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors'
						>
							<Edit className='w-4 h-4' />
						</button>
					</HrIconTooltip>
					<HrIconTooltip label='Deactivate'>
						<button
							type='button'
							onClick={() => onDelete(row as unknown as HrmEmployee)}
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
		key: 'employee_code',
		title: 'Emp Code',
		sortable: true,
		align: 'center',
		render: (value: unknown) => (
			<div className='font-mono text-sm font-semibold text-gray-900 text-center'>
				{String(value || '')}
			</div>
		),
	},
	{
		key: 'full_name',
		title: 'Name',
		sortable: true,
		align: 'left',
		render: (_value: unknown, row: Record<string, unknown>) => (
			<div>
				<div className='font-semibold text-gray-900'>
					{String(row.full_name || `${row.first_name || ''} ${row.last_name || ''}`.trim())}
				</div>
				<div className='text-xs text-gray-500'>{String(row.email || '')}</div>
			</div>
		),
	},
	{
		key: 'department_name',
		title: 'Department',
		sortable: true,
		align: 'center',
		render: (value: unknown) => (
			<div className='text-gray-700 text-center'>{String(value || 'N/A')}</div>
		),
	},
	{
		key: 'designation_title',
		title: 'Designation',
		sortable: true,
		align: 'center',
		render: (value: unknown) => (
			<div className='text-gray-700 text-center'>{String(value || 'N/A')}</div>
		),
	},
	{
		key: 'employment_type',
		title: 'Type',
		sortable: true,
		align: 'center',
		render: (value: unknown) => (
			<div className='text-gray-700 text-center text-sm'>
				{getEmploymentTypeLabel(String(value || ''))}
			</div>
		),
	},
	{
		key: 'phone',
		title: 'Phone',
		sortable: false,
		align: 'center',
		render: (value: unknown) => (
			<div className='text-gray-700 text-center'>{String(value || 'N/A')}</div>
		),
	},
	{
		key: 'primary_manager_name',
		title: 'Manager',
		sortable: true,
		align: 'center',
		render: (value: unknown, row: Record<string, unknown>) => {
			const name = (value as string | null | undefined) ?? (row.primary_manager_name as string | undefined);
			return (
				<div className='text-gray-700 text-center'>{name && String(name).trim() ? String(name) : 'N/A'}</div>
			);
		},
	},
	{
		key: 'status',
		title: 'Status',
		sortable: true,
		align: 'center',
		render: (value: unknown) => {
			const status = String(value || 'active');
			const colorClass = getStatusColor(status);
			return (
				<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
					{getStatusLabel(status)}
				</span>
			);
		},
	},
	{
		key: 'date_of_joining',
		title: 'Joined',
		sortable: true,
		align: 'center',
		render: (value: unknown) => {
			if (!value) return <div className='text-gray-500 text-center'>N/A</div>;
			const date = new Date(String(value));
			return (
				<div className='text-gray-600 text-center text-sm'>
					{date.toLocaleDateString('en-IN', {
						year: 'numeric',
						month: 'short',
						day: 'numeric',
					})}
				</div>
			);
		},
	},
];
