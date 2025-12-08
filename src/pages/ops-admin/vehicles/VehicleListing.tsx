/**
 * Vehicle Listing Page
 * Displays all vehicles in a table with Add/Edit/Delete functionality
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Plus } from 'lucide-react';
import { PageHeader, Button, Snackbar, Table } from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import {
	VehicleModal,
	DeleteConfirmationModal,
	useVehicleData,
	useDeleteVehicle,
	getVehicleColumns,
} from '../../../features/vehicle';
import { RootState } from '../../../store';
import type { Vehicle } from '../../../services/vehicleApi';

export const VehicleListing: React.FC = () => {
	const { user } = useSelector((state: RootState) => state.auth);
	const [showModal, setShowModal] = useState(false);
	const [editingItem, setEditingItem] = useState<Vehicle | null>(null);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [deletingItem, setDeletingItem] = useState<Vehicle | null>(null);
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({
		open: false,
		message: '',
		type: 'success',
	});

	// Fetch vehicles
	const {
		data: listingData,
		isLoading: loading,
		error: listingError,
	} = useVehicleData({
		sortOrder: 'ASC',
		sortBy: 'name',
	});

	// Delete mutation
	const deleteMutation = useDeleteVehicle();

	// Show error snackbar if API fails
	React.useEffect(() => {
		if (listingError) {
			setSnackbar({
				open: true,
				message: 'Failed to load vehicles',
				type: 'error',
			});
		}
	}, [listingError]);

	const handleAdd = () => {
		setEditingItem(null);
		setShowModal(true);
	};

	const handleEdit = useCallback((item: Vehicle) => {
		setEditingItem(item);
		setShowModal(true);
	}, []);

	const handleDelete = useCallback((item: Vehicle) => {
		setDeletingItem(item);
		setShowDeleteModal(true);
	}, []);

	const handleDeleteConfirm = useCallback(async () => {
		if (!deletingItem) return;

		try {
			await deleteMutation.mutateAsync({ id: deletingItem.id });
			setSnackbar({
				open: true,
				message: 'Vehicle deleted successfully',
				type: 'success',
			});
			setShowDeleteModal(false);
			setDeletingItem(null);
		} catch {
			setSnackbar({
				open: true,
				message: 'Failed to delete vehicle',
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
			message: editingItem ? 'Vehicle updated successfully' : 'Vehicle added successfully',
			type: 'success',
		});
		setShowModal(false);
		setEditingItem(null);
	};

	const columns = useMemo(
		() =>
			getVehicleColumns({
				onEdit: handleEdit,
				onDelete: handleDelete,
			}),
		[handleEdit, handleDelete]
	);

	const tableData = (listingData?.result || []) as unknown as Record<string, unknown>[];

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-7xl mx-auto'>
				<div className='flex items-center justify-between mb-6'>
					<PageHeader
						title='Vehicles'
						locationName={user?.city_name || 'City'}
						totalItems={tableData.length}
						itemType='vehicles'
						icon='🚚'
					/>
					<Button onClick={handleAdd} variant='primary' leftIcon={<Plus className='w-4 h-4' />}>
						Add Vehicle
					</Button>
				</div>

				{loading ? (
					<TableSkeleton rows={10} columns={8} />
				) : (
					<Table columns={columns} data={tableData} loading={false} size='sm' />
				)}

				{showModal && (
					<VehicleModal
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
						title='Delete Vehicle'
						message={`Are you sure you want to delete vehicle "${deletingItem.name}"? This action cannot be undone.`}
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

export default VehicleListing;
