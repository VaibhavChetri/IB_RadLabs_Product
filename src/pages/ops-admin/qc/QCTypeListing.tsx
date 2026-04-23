import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { PageHeader, Button, Snackbar, FloatingDropdown } from '../../../components/ui';
import { Table } from '../../../components/ui/DataDisplay';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { Plus } from 'lucide-react';
import { ComplaintTypeModal } from '../../../features/complaint-type/components/ComplaintTypeModal';
import { useComplaintTypeData } from '../../../features/complaint-type/hooks/useComplaintTypeData';
import { useURLFilters } from '../../../features/complaint-type/hooks/useURLFilters';
import { useDeleteComplaintType } from '../../../features/complaint-type/hooks/useComplaintTypeMutations';
import { getComplaintTypeColumns } from '../../../features/complaint-type/config/tableColumns';
import { STATUS_OPTIONS } from '../../../features/complaint-type/config/constants';
import { useDebounce } from '../../../hooks/useDebounce';
import { RootState } from '../../../store';
import type { ComplaintType } from '../../../services/complaintTypeApi';

export const QCTypeListing: React.FC = () => {
	const { user } = useSelector((state: RootState) => state.auth);
	const { filters: urlFilters, updateFilters } = useURLFilters();
	const [showModal, setShowModal] = useState(false);
	const [editingItem, setEditingItem] = useState<ComplaintType | null>(null);
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({
		open: false,
		message: '',
		type: 'success',
	});

	// Delete mutation
	const deleteMutation = useDeleteComplaintType();

	// Debounce filters to prevent rapid filtering
	const debouncedStatus = useDebounce(urlFilters.status, 300);

	// Fetch complaint types
	const {
		data: listingData,
		isLoading: loading,
		error: listingError,
	} = useComplaintTypeData({
		status: debouncedStatus || undefined,
	});

	// Show error snackbar if API fails
	useEffect(() => {
		if (listingError) {
			setSnackbar({
				open: true,
				message: 'Failed to load QC types',
				type: 'error',
			});
		}
	}, [listingError]);

	const handleAdd = () => {
		setEditingItem(null);
		setShowModal(true);
	};

	const handleEdit = React.useCallback((item: ComplaintType) => {
		setEditingItem(item);
		setShowModal(true);
	}, []);

	const handleDelete = React.useCallback(async (item: ComplaintType) => {
		if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
			return;
		}

		try {
			await deleteMutation.mutateAsync({ id: item.id });
			setSnackbar({
				open: true,
				message: 'QC type deleted successfully',
				type: 'success',
			});
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to delete QC type';
			setSnackbar({
				open: true,
				message: errorMessage,
				type: 'error',
			});
		}
	}, [deleteMutation]);

	const handleModalClose = () => {
		setShowModal(false);
		setEditingItem(null);
	};

	const handleModalSuccess = () => {
		setSnackbar({
			open: true,
			message: editingItem
				? 'QC type updated successfully'
				: 'QC type added successfully',
			type: 'success',
		});
		setShowModal(false);
		setEditingItem(null);
	};

	const handleFilterChange = (key: 'status', value: string) => {
		updateFilters({ [key]: value });
	};

	const columns = useMemo(
		() =>
			getComplaintTypeColumns({
				onEdit: handleEdit,
				onDelete: handleDelete,
			}),
		[handleEdit, handleDelete]
	);

	const tableData = (listingData?.data || []) as unknown as Record<string, unknown>[];

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-7xl mx-auto'>
				<div className='flex items-center justify-between mb-6'>
					<PageHeader
						title='QC Type'
						locationName={user?.city_name || 'City'}
						totalItems={tableData.length}
						itemType='QC types'
						icon='📋'
					/>
					<Button onClick={handleAdd} variant='primary' leftIcon={<Plus className='w-4 h-4' />}>
						Add QC Type
					</Button>
				</div>

				{/* Filter Section */}
				<div className='mb-6 flex w-full'>
					<div className='bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-lg p-4 flex w-full gap-3'>
						<div className='flex items-center gap-4 w-full'>
							<FloatingDropdown
								label='Status'
								options={[...STATUS_OPTIONS]}
								value={urlFilters.status}
								onChange={(value: string) => handleFilterChange('status', value)}
								placeholder='All Status'
							/>
						</div>
					</div>
				</div>

				{loading ? (
					<TableSkeleton rows={10} columns={4} />
				) : (
					<Table columns={columns} data={tableData} loading={false} size='sm' />
				)}

				{showModal && (
					<ComplaintTypeModal
						open={showModal}
						onClose={handleModalClose}
						onSuccess={handleModalSuccess}
						editingItem={editingItem}
					/>
				)}



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

export default QCTypeListing;
