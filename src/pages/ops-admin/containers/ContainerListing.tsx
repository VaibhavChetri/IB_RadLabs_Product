/**
 * Container Type Listing Page
 * Displays all container types in a table with Add/Edit/Delete functionality
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Plus } from 'lucide-react';
import { PageHeader, Button, Snackbar, Table, FloatingInput } from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import {
	ContainerModal,
	DeleteConfirmationModal,
	useContainerData,
	useDeleteContainerType,
	getContainerColumns,
} from '../../../features/container';
import { RootState } from '../../../store';
import type { ContainerType } from '../../../services/containerApi';

export const ContainerListing: React.FC = () => {
	const { user } = useSelector((state: RootState) => state.auth);
	const [showModal, setShowModal] = useState(false);
	const [editingItem, setEditingItem] = useState<ContainerType | null>(null);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [deletingItem, setDeletingItem] = useState<ContainerType | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({
		open: false,
		message: '',
		type: 'success',
	});

	// Fetch container types
	const {
		data: listingData,
		isLoading: loading,
		error: listingError,
	} = useContainerData({
		all: true, // Get both active and inactive
	});

	// Delete mutation
	const deleteMutation = useDeleteContainerType();

	// Show error snackbar if API fails
	React.useEffect(() => {
		if (listingError) {
			setSnackbar({
				open: true,
				message: 'Failed to load container types',
				type: 'error',
			});
		}
	}, [listingError]);

	const handleAdd = () => {
		setEditingItem(null);
		setShowModal(true);
	};

	const handleEdit = useCallback((item: ContainerType) => {
		setEditingItem(item);
		setShowModal(true);
	}, []);

	const handleDelete = useCallback((item: ContainerType) => {
		setDeletingItem(item);
		setShowDeleteModal(true);
	}, []);

	const handleDeleteConfirm = useCallback(async () => {
		if (!deletingItem) return;

		try {
			await deleteMutation.mutateAsync({ id: deletingItem.id!, status: 0 });
			setSnackbar({
				open: true,
				message: 'Container type deleted successfully',
				type: 'success',
			});
			setShowDeleteModal(false);
			setDeletingItem(null);
		} catch {
			setSnackbar({
				open: true,
				message: 'Failed to delete container type',
				type: 'error',
			});
		}
	}, [deletingItem, deleteMutation]);

	const handleDeleteModalClose = useCallback(() => {
		if (!deleteMutation.isPending) {
			setShowDeleteModal(false);
			setDeletingItem(null);
		}
	}, [deleteMutation.isPending]);

	const handleModalClose = () => {
		setShowModal(false);
		setEditingItem(null);
	};

	const handleModalSuccess = () => {
		setSnackbar({
			open: true,
			message: editingItem ? 'Container type updated successfully' : 'Container type added successfully',
			type: 'success',
		});
		setShowModal(false);
		setEditingItem(null);
	};

	const columns = useMemo(
		() =>
			getContainerColumns({
				onEdit: handleEdit,
				onDelete: handleDelete,
			}),
		[handleEdit, handleDelete]
	);

	const allTableData = (listingData?.data || []) as unknown as Record<string, unknown>[];

	// Filter table data based on search term
	const filteredTableData = useMemo(() => {
		if (!searchTerm.trim()) {
			return allTableData;
		}

		const searchLower = searchTerm.toLowerCase().trim();
		return allTableData.filter((item: Record<string, unknown>) => {
			const sku = String(item.sku || '').toLowerCase();
			const container = String(item.container || '').toLowerCase();
			const cityName = String(item.name || '').toLowerCase();
			const weight = String(item.weight || '').toLowerCase();
			const weightInGms = String(item.weightInGms || '').toLowerCase();

			return (
				sku.includes(searchLower) ||
				container.includes(searchLower) ||
				cityName.includes(searchLower) ||
				weight.includes(searchLower) ||
				weightInGms.includes(searchLower)
			);
		});
	}, [allTableData, searchTerm]);

	const tableData = filteredTableData;

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-7xl mx-auto'>
				<div className='flex items-center justify-between mb-6'>
					<PageHeader
						title='Container Types'
						locationName={user?.city_name || 'City'}
						totalItems={tableData.length}
						itemType='container types'
						icon='📦'
					/>
					<Button onClick={handleAdd} variant='primary' leftIcon={<Plus className='w-4 h-4' />}>
						Add Container Type
					</Button>
				</div>

				<div className='bg-white p-4 shadow-sm rounded-lg mb-6'>
					<FloatingInput
						label='Search'
						type='text'
						value={searchTerm}
						onChange={setSearchTerm}
						placeholder='Search by container name, SKU, city, weight...'
						className='w-full max-w-md'
					/>
				</div>

				{loading ? (
					<TableSkeleton rows={10} columns={10} />
				) : (
					<Table columns={columns} data={tableData} loading={false} size='sm' />
				)}

				{showModal && (
					<ContainerModal
						open={showModal}
						onClose={handleModalClose}
						onSuccess={handleModalSuccess}
						editingItem={editingItem}
					/>
				)}

				{showDeleteModal && deletingItem && (
					<DeleteConfirmationModal
						open={showDeleteModal}
						onClose={handleDeleteModalClose}
						onConfirm={handleDeleteConfirm}
						title='Delete Container Type'
						message={`Are you sure you want to delete container type "${deletingItem.sku || deletingItem.container}"? This action cannot be undone.`}
						isDeleting={deleteMutation.isPending}
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

export default ContainerListing;

