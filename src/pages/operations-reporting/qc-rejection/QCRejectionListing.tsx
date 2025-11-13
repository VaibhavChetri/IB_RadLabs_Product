import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Button, Pagination, Snackbar } from '../../../components/ui';
import { Table } from '../../../components/ui/DataDisplay';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { Plus } from 'lucide-react';

export const QCRejectionListing: React.FC = () => {
	const navigate = useNavigate();
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({
		open: false,
		message: '',
		type: 'success',
	});

	const [pagination, setPagination] = useState({
		currentPage: 1,
		totalPages: 1,
		totalItems: 0,
		pageSize: 10,
	});

	const columns = [
		{ key: 'id', label: 'ID' },
		{ key: 'rejection_date', label: 'Rejection Date' },
		{ key: 'reason', label: 'Reason' },
		{ key: 'status', label: 'Status' },
		{ key: 'actions', label: 'Actions' },
	];

	const tableData: Record<string, unknown>[] = [];

	const handleAdd = () => {
		navigate('/operations-reporting/qc-rejection/add');
	};

	const handlePageChange = (page: number) => {
		setPagination(prev => ({ ...prev, currentPage: page }));
	};

	const handleItemsPerPageChange = (itemsPerPage: number) => {
		setPagination(prev => ({ ...prev, pageSize: itemsPerPage, currentPage: 1 }));
	};

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-7xl mx-auto'>
				<div className='flex items-center justify-between mb-6'>
					<PageHeader
						title='QC Rejection'
						totalItems={pagination.totalItems}
						itemType='QC rejections'
						icon='❌'
					/>
					<Button
						onClick={handleAdd}
						className='px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors'
					>
						<Plus className='w-4 h-4 mr-2' />
						Add QC Rejection
					</Button>
				</div>

				{/* Filter Section - To be implemented */}
				<div className='mb-6 flex w-full'>
					<div className='bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-lg p-4 flex w-full gap-3'>
						<p className='text-gray-600'>Filters will be implemented here.</p>
					</div>
				</div>

				{false ? (
					<TableSkeleton rows={pagination.pageSize} columns={5} />
				) : (
					<Table columns={columns} data={tableData} loading={false} size='sm' />
				)}

				<Pagination
					currentPage={pagination.currentPage}
					totalPages={pagination.totalPages}
					totalItems={pagination.totalItems}
					itemsPerPage={pagination.pageSize}
					onPageChange={handlePageChange}
					onItemsPerPageChange={handleItemsPerPageChange}
					className='mt-6'
				/>

				<Snackbar
					message={snackbar.message}
					type={snackbar.type}
					open={snackbar.open}
					onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
				/>
			</div>
		</div>
	);
};

