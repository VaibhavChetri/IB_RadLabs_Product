/**
 * Table column definitions for Review Cost Type listing
 */

import { Edit } from 'lucide-react';
import type { TableColumn } from '../../../components/ui/DataDisplay';
import type { ReviewCostingType } from '../../../services/pAndLApi';
import { isActiveStatus } from './constants';

interface ColumnProps {
	pagination: {
		currentPage: number;
		pageSize: number;
	};
	onEdit: (item: ReviewCostingType) => void;
}

export const getReviewCostTypeColumns = ({
	pagination,
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
					onClick={() => onEdit(row as unknown as ReviewCostingType)}
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
				{(pagination.currentPage - 1) * pagination.pageSize + index + 1}
			</div>
		),
	},
	{
		key: 'name',
		title: 'Cost Type',
		sortable: true,
		align: 'center',
		render: (value: unknown) => (
			<div className='font-semibold text-gray-900 text-center'>{String(value || '')}</div>
		),
	},
	{
		key: 'reviewCategoryName',
		title: 'Cost Category',
		sortable: true,
		align: 'center',
		render: (value: unknown) => (
			<div className='text-gray-900 text-center'>{String(value || '')}</div>
		),
	},
	{
		key: 'status',
		title: 'Status',
		sortable: true,
		align: 'center',
		render: (_value: unknown, row: Record<string, unknown>) => {
			const status = String(row.status || '');
			const isActive = isActiveStatus(status);
			return (
				<span
					className={`px-2 py-1 rounded text-xs font-medium ${
						isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
					}`}
				>
					{isActive ? 'Active' : 'Inactive'}
				</span>
			);
		},
	},
];
