/**
 * Vehicle Listing Page
 * Displays all vehicles in a table with Add/Edit/Delete functionality
 * Similar to Escalation Type page pattern
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Plus } from 'lucide-react';
import { PageHeader, Button, Snackbar, Table, FloatingInput, FloatingDropdown, Pagination } from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import {
	VehicleModal,
	useVehicleData,
	useUpdateVehicle,
	getVehicleColumns,
	useURLFilters,
	STATUS_OPTIONS,
} from '../../../features/vehicle';
import { RootState } from '../../../store';
import { useDebounce } from '../../../hooks/useDebounce';
import type { Vehicle } from '../../../services/vehicleApi';

export const VehicleListing: React.FC = () => {
	const { user } = useSelector((state: RootState) => state.auth);
	const { filters: urlFilters, updateFilters } = useURLFilters();
	const [showModal, setShowModal] = useState(false);
	const [editingItem, setEditingItem] = useState<Vehicle | null>(null);
	const [togglingStatus, setTogglingStatus] = useState<number | null>(null);
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({
		open: false,
		message: '',
		type: 'success',
	});

	// Debounce search filters to prevent rapid API calls
	const debouncedName = useDebounce(urlFilters.name, 300);
	const debouncedDriverName = useDebounce(urlFilters.driver_name, 300);
	const debouncedDriverPhone = useDebounce(urlFilters.driver_phone, 300);

	// Fetch vehicles with filters and pagination
	const {
		data: listingData,
		isLoading: loading,
		error: listingError,
	} = useVehicleData({
		name: debouncedName || undefined,
		driver_name: debouncedDriverName || undefined,
		driver_phone: debouncedDriverPhone || undefined,
		status: urlFilters.status ? parseInt(urlFilters.status, 10) : undefined,
		page: urlFilters.page,
		limit: urlFilters.limit,
		sortOrder: 'ASC',
		sortBy: 'name',
	});

	// Update mutation for status toggle
	const updateMutation = useUpdateVehicle();

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

	const handleToggleStatus = useCallback(
		async (item: Vehicle) => {
			const newStatus = item.status === 1 ? 0 : 1;
			setTogglingStatus(item.id);

			try {
				await updateMutation.mutateAsync({
					id: item.id,
					name: item.name,
					driver_name: item.driver_name,
					driver_phone: item.driver_phone,
					vehicle_number: item.vehicle_number,
					status: newStatus,
				});
				setSnackbar({
					open: true,
					message: `Vehicle ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`,
					type: 'success',
				});
			} catch {
				setSnackbar({
					open: true,
					message: 'Failed to update vehicle status',
					type: 'error',
				});
			} finally {
				setTogglingStatus(null);
			}
		},
		[updateMutation]
	);

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
				onToggleStatus: handleToggleStatus,
				pageNumber: urlFilters.page,
				itemsPerPage: urlFilters.limit,
				isToggling: togglingStatus !== null,
			}),
		[handleEdit, handleToggleStatus, urlFilters.page, urlFilters.limit, togglingStatus]
	);

	const tableData = (listingData?.result || []) as unknown as Record<string, unknown>[];
	const pagination = listingData?.pagination;
	const totalItems = pagination?.totalRecords || 0;
	const totalPages = pagination?.totalPages || 0;

	const handleFilterChange = (key: 'name' | 'driver_name' | 'driver_phone' | 'status', value: string) => {
		updateFilters({ [key]: value, page: 1 }); // Reset to page 1 when filter changes
	};

	const handlePageChange = (page: number) => {
		updateFilters({ page });
	};

	const handleItemsPerPageChange = (limit: number) => {
		updateFilters({ limit, page: 1 }); // Reset to page 1 when items per page changes
	};

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-7xl mx-auto'>
				<div className='flex items-center justify-between mb-6'>
					<PageHeader
						title='Vehicles'
						locationName={user?.city_name || 'City'}
						totalItems={totalItems}
						itemType='vehicles'
						icon='🚚'
					/>
					<Button onClick={handleAdd} variant='primary' leftIcon={<Plus className='w-4 h-4' />}>
						Add Vehicle
					</Button>
				</div>

				{/* Filter Section */}
				<div className='mb-6 flex w-full'>
					<div className='bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-lg p-4 flex w-full gap-3'>
						<div className='flex items-center gap-3 w-full'>
							<FloatingInput
								label='Vehicle Name'
								value={urlFilters.name}
								onChange={(value: string) => handleFilterChange('name', value)}
								placeholder='Search by vehicle name'
								className='w-48'
							/>
							<FloatingInput
								label='Driver Name'
								value={urlFilters.driver_name}
								onChange={(value: string) => handleFilterChange('driver_name', value)}
								placeholder='Search by driver name'
								className='w-48'
							/>
							<FloatingInput
								label='Driver Phone'
								value={urlFilters.driver_phone}
								onChange={(value: string) => handleFilterChange('driver_phone', value)}
								placeholder='Search by driver phone'
								className='w-48'
							/>
							<FloatingDropdown
								label='Status'
								options={STATUS_OPTIONS}
								value={urlFilters.status}
								onChange={(value: string) => handleFilterChange('status', value)}
								placeholder='All Status'
								className='w-40'
							/>
						</div>
					</div>
				</div>

				{loading ? (
					<TableSkeleton rows={10} columns={8} />
				) : (
					<>
						<Table columns={columns} data={tableData} loading={false} size='sm' />
						{totalPages > 0 && (
							<Pagination
								currentPage={urlFilters.page}
								totalPages={totalPages}
								totalItems={totalItems}
								itemsPerPage={urlFilters.limit}
								onPageChange={handlePageChange}
								onItemsPerPageChange={handleItemsPerPageChange}
								className='mt-4'
							/>
						)}
					</>
				)}

				{showModal && (
					<VehicleModal
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

export default VehicleListing;
