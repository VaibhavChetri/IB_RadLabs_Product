/**
 * Table column definitions for Review Category Type listing
 */

import { Edit } from 'lucide-react';
import type { TableColumn } from '../../../components/ui/DataDisplay';
import type { ReviewCategoryType } from '../../../services/pAndLApi';
import { isActiveStatus } from './constants';

interface ColumnProps {
	pagination: {
		currentPage: number;
		pageSize: number;
	};
	onEdit: (item: ReviewCategoryType) => void;
}

export const getReviewCategoryTypeColumns = ({
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
					onClick={() => onEdit(row as unknown as ReviewCategoryType)}
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
		title: 'Category Name',
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

