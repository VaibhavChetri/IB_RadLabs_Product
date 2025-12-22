import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { PageHeader, Button, Snackbar, FloatingInput, FloatingDropdown, Pagination } from '../../../components/ui';
import { Table } from '../../../components/ui/DataDisplay';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { Plus } from 'lucide-react';
import { ClientEscalationModal } from '../../../features/client-escalation/components/ClientEscalationModal';
import { useClientEscalationData } from '../../../features/client-escalation/hooks/useClientEscalationData';
import { useURLFilters } from '../../../features/client-escalation/hooks/useURLFilters';
import { getClientEscalationColumns } from '../../../features/client-escalation/config/tableColumns';
import { useDebounce } from '../../../hooks/useDebounce';
import { RootState } from '../../../store';
import type { ClientEscalation } from '../../../services/transitPlanApi';
import { CommonApiService } from '../../../services/commonApi';

export const ClientEscalationListing: React.FC = () => {
	const { user } = useSelector((state: RootState) => state.auth);
	const { filters: urlFilters, updateFilters } = useURLFilters();
	const [showModal, setShowModal] = useState(false);
	const [editingItem, setEditingItem] = useState<ClientEscalation | null>(null);
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({
		open: false,
		message: '',
		type: 'success',
	});

	// Facility dropdown
	const [facilities, setFacilities] = useState<Array<{ value: string; label: string }>>([]);
	const [loadingFacilities, setLoadingFacilities] = useState(false);

	// Debounce filters
	const debouncedStartDate = useDebounce(urlFilters.startDate, 300);
	const debouncedEndDate = useDebounce(urlFilters.endDate, 300);
	const debouncedFacility = useDebounce(urlFilters.facility, 300);

	// Set default dates to today if not in URL
	useEffect(() => {
		if (!urlFilters.startDate || !urlFilters.endDate) {
			const today = new Date().toISOString().split('T')[0];
			updateFilters({
				startDate: urlFilters.startDate || today,
				endDate: urlFilters.endDate || today,
			});
		}
	}, []);

	// Fetch facilities for filter
	useEffect(() => {
		setLoadingFacilities(true);
		CommonApiService.getFacilities()
			.then(response => {
				// Handle both status_code and statusCode (API inconsistency)
				const isSuccess = response.status_code === 200 || (response as any).statusCode === 200 || response.status === 'Success';
				if (isSuccess && response.data && Array.isArray(response.data)) {
					setFacilities([
						{ value: '', label: 'All Facilities' },
						...response.data.map((f: any) => ({
							value: f.id?.toString() || '',
							label: f.location || f.name || '',
						})).filter(f => f.value), // Filter out invalid entries
					]);
				} else {
					console.warn('Unexpected facilities response:', response);
				}
			})
			.catch(err => {
				console.error('Error loading facilities:', err);
				setFacilities([{ value: '', label: 'All Facilities' }]);
			})
			.finally(() => setLoadingFacilities(false));
	}, []);

	// Fetch client escalations
	const {
		data: listingData,
		isLoading: loading,
		error: listingError,
	} = useClientEscalationData({
		startDate: debouncedStartDate || undefined,
		endDate: debouncedEndDate || undefined,
		facility_id: debouncedFacility ? parseInt(debouncedFacility) : undefined,
		page: parseInt(urlFilters.page) || 1,
		limit: parseInt(urlFilters.limit) || 10,
	});

	// Show error snackbar if API fails
	useEffect(() => {
		if (listingError) {
			setSnackbar({
				open: true,
				message: 'Failed to load client escalations',
				type: 'error',
			});
		}
	}, [listingError]);

	const handleAdd = () => {
		setEditingItem(null);
		setShowModal(true);
	};

	const handleEdit = React.useCallback((item: ClientEscalation) => {
		setEditingItem(item);
		setShowModal(true);
	}, []);

	const handleModalClose = () => {
		setShowModal(false);
		setEditingItem(null);
	};

	const handleModalSuccess = () => {
		setSnackbar({
			open: true,
			message: editingItem
				? 'Client escalation updated successfully'
				: 'Client escalation added successfully',
			type: 'success',
		});
		setShowModal(false);
		setEditingItem(null);
	};

	const handleFilterChange = (key: 'startDate' | 'endDate' | 'facility', value: string) => {
		updateFilters({ [key]: value });
	};

	const handlePageChange = (page: number) => {
		updateFilters({ page: page.toString() });
	};

	const handleItemsPerPageChange = (itemsPerPage: number) => {
		updateFilters({ limit: itemsPerPage.toString(), page: '1' });
	};

	const columns = useMemo(
		() =>
			getClientEscalationColumns({
				onEdit: handleEdit,
				pageNumber: parseInt(urlFilters.page) || 1,
				itemsPerPage: parseInt(urlFilters.limit) || 10,
			}),
		[handleEdit, urlFilters.page, urlFilters.limit]
	);

	const tableData = (listingData?.data || []) as unknown as Record<string, unknown>[];
	const pagination = listingData?.pagination || {
		page: 1,
		limit: 10,
		totalItems: 0,
		totalPages: 0,
	};

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-7xl mx-auto'>
				<div className='flex items-center justify-between mb-6'>
					<PageHeader
						title='Client Escalation'
						locationName={user?.city_name || 'City'}
						totalItems={pagination.totalItems}
						itemType='client escalations'
						icon='⚠️'
					/>
					<Button onClick={handleAdd} variant='primary' leftIcon={<Plus className='w-4 h-4' />}>
						Add Escalation
					</Button>
				</div>

				{/* Filter Section */}
				<div className='mb-6 flex w-full'>
					<div className='bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-lg p-4 flex w-full gap-3'>
						<div className='flex items-center gap-4 w-full'>
							<FloatingInput
								label='Start Date'
								type='date'
								value={urlFilters.startDate}
								onChange={(value: string) => handleFilterChange('startDate', value)}
								className='w-48'
							/>
							<FloatingInput
								label='End Date'
								type='date'
								value={urlFilters.endDate}
								onChange={(value: string) => handleFilterChange('endDate', value)}
								className='w-48'
							/>
							<FloatingDropdown
								label='Facility'
								options={facilities}
								value={urlFilters.facility}
								onChange={(value: string) => handleFilterChange('facility', value)}
								loading={loadingFacilities}
								placeholder='All Facilities'
								className='w-56'
							/>
						</div>
					</div>
				</div>

				{loading ? (
					<TableSkeleton rows={parseInt(urlFilters.limit) || 10} columns={12} />
				) : (
					<>
						<Table columns={columns} data={tableData} loading={false} size='sm' />
						{pagination.totalPages > 0 && (
							<div className='mt-6'>
								<Pagination
									currentPage={pagination.page}
									totalPages={pagination.totalPages}
									totalItems={pagination.totalItems}
									itemsPerPage={pagination.limit}
									onPageChange={handlePageChange}
									onItemsPerPageChange={handleItemsPerPageChange}
								/>
							</div>
						)}
					</>
				)}

				{showModal && (
					<ClientEscalationModal
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
