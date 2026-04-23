import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
	PageHeader,
	Button,
	Snackbar,
	FloatingInput,
	FloatingDropdown,
	Pagination,
} from '../../../components/ui';
import { Table } from '../../../components/ui/DataDisplay';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { Plus } from 'lucide-react';
import { ClientEscalationModal } from '../../../features/client-escalation/components/ClientEscalationModal';
import { useClientEscalationData } from '../../../features/client-escalation/hooks/useClientEscalationData';
import { useURLFilters } from '../../../features/client-escalation/hooks/useURLFilters';
import { getClientEscalationColumns } from '../../../features/client-escalation/config/tableColumns';
import { RootState } from '../../../store';
import type { ClientEscalation } from '../../../services/transitPlanApi';
import { CommonApiService } from '../../../services/commonApi';
import { useDebounce } from '../../../hooks/useDebounce';

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

	// Set default dates to today if not in URL
	useEffect(() => {
		if (!urlFilters.startDate || !urlFilters.endDate) {
			const today = new Date().toISOString().split('T')[0];
			updateFilters({
				startDate: urlFilters.startDate || today,
				endDate: urlFilters.endDate || today,
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Only run on mount

	// Debounce filter values to avoid excessive API calls
	const debouncedStartDate = useDebounce(urlFilters.startDate, 500);
	const debouncedEndDate = useDebounce(urlFilters.endDate, 500);
	const debouncedFacility = useDebounce(urlFilters.facility, 500);

	// Fetch facilities for filter
	useEffect(() => {
		setLoadingFacilities(true);
		CommonApiService.getFacilities()
			.then(response => {
				// Handle both status_code and statusCode (API inconsistency)
				const isSuccess =
					response.status_code === 200 ||
					(response as any).statusCode === 200 ||
					response.status === 'Success';
				if (isSuccess && response.data && Array.isArray(response.data)) {
					setFacilities([
						{ value: '', label: 'All Facilities' },
						...response.data
							.map((f: any) => ({
								value: f.id?.toString() || '',
								label: f.location || f.name || '',
							}))
							.filter(f => f.value), // Filter out invalid entries
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
		updateFilters({ [key]: value, page: '1' }); // Reset to page 1 when filters change
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

	// Calculate statistics with enhanced analytics
	const stats = useMemo(() => {
		// Calculate total days between start and end date
		let totalDays = 0;
		if (urlFilters.startDate && urlFilters.endDate) {
			const start = new Date(urlFilters.startDate);
			const end = new Date(urlFilters.endDate);
			const diffTime = Math.abs(end.getTime() - start.getTime());
			totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
		}

		// Total escalations
		const totalEscalations = listingData?.totalEscalations || pagination.totalItems || 0;

		// Normalize status counts - handle different case variations and object structures
		const statusCountRaw = listingData?.statusCount || {};

		// Helper function to extract count from status value (handles both number and object)
		const getCount = (value: any): number => {
			if (typeof value === 'number') return value;
			if (typeof value === 'object' && value !== null && 'count' in value) {
				return typeof value.count === 'number' ? value.count : 0;
			}
			return 0;
		};

		// Handle case where statusCount might be an array of objects
		let statusCount: Record<string, any> = {};
		if (Array.isArray(statusCountRaw)) {
			// Convert array to object format
			statusCountRaw.forEach((item: any) => {
				if (item && typeof item === 'object') {
					// Try to find status name from common fields
					const statusName =
						item.status || item.statusName || item.resolution_status || item.name || '';
					if (statusName) {
						statusCount[statusName] = item;
					}
				}
			});
		} else if (typeof statusCountRaw === 'object' && statusCountRaw !== null) {
			statusCount = statusCountRaw;
		}

		const openCount =
			getCount(statusCount['Open']) ||
			getCount(statusCount['open']) ||
			getCount(statusCount['OPEN']) ||
			0;
		const inProgressCount =
			getCount(statusCount['InProgress']) ||
			getCount(statusCount['inprogress']) ||
			getCount(statusCount['INPROGRESS']) ||
			getCount(statusCount['In Progress']) ||
			getCount(statusCount['in progress']) ||
			getCount(statusCount['IN PROGRESS']) ||
			0;
		const resolvedCount =
			getCount(statusCount['Resolved']) ||
			getCount(statusCount['resolved']) ||
			getCount(statusCount['RESOLVED']) ||
			0;

		// Calculate percentages
		const openPercentage = totalEscalations > 0 ? (openCount / totalEscalations) * 100 : 0;
		const inProgressPercentage =
			totalEscalations > 0 ? (inProgressCount / totalEscalations) * 100 : 0;
		const resolvedPercentage = totalEscalations > 0 ? (resolvedCount / totalEscalations) * 100 : 0;

		// Calculate escalations > 5 days and not resolved
		let overdueCount = 0;
		if (listingData?.data && listingData.data.length > 0) {
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			overdueCount = listingData.data.filter((escalation: ClientEscalation) => {
				// Check if not resolved
				const isNotResolved = escalation.resolution_status?.toLowerCase() !== 'resolved';

				// Check if escalation date is more than 5 days ago
				if (escalation.escalation_date) {
					const escalationDate = new Date(escalation.escalation_date);
					escalationDate.setHours(0, 0, 0, 0);
					const daysDiff = Math.floor(
						(today.getTime() - escalationDate.getTime()) / (1000 * 60 * 60 * 24)
					);
					return isNotResolved && daysDiff > 5;
				}
				return false;
			}).length;
		}

		// Calculate resolution rate
		const resolutionRate = totalEscalations > 0 ? (resolvedCount / totalEscalations) * 100 : 0;

		return {
			totalDays,
			totalEscalations,
			openCount,
			inProgressCount,
			resolvedCount,
			openPercentage,
			inProgressPercentage,
			resolvedPercentage,
			overdueCount,
			resolutionRate,
		};
	}, [listingData, pagination.totalItems, urlFilters.startDate, urlFilters.endDate]);

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

				{/* Statistics Dashboard - Circular Design */}
				{!loading && (
					<div className='mb-6'>
						{/* Main Stats Grid */}
						<div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-3'>
							{/* Total Escalations */}
							<div className='flex flex-col items-center'>
								<div className='w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center mb-2'>
									<span className='text-2xl mb-1'>📊</span>
									<div className='text-2xl font-bold text-white'>{stats.totalEscalations}</div>
								</div>
								<div className='text-center'>
									<div className='text-sm font-semibold text-gray-900'>Total</div>
									<div className='text-xs text-gray-500'>{stats.totalDays} days</div>
								</div>
							</div>

							{/* Open */}
							<div className='flex flex-col items-center'>
								<div className='w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-full shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center mb-2'>
									<span className='text-2xl mb-1'>🔴</span>
									<div className='text-2xl font-bold text-white'>{stats.openCount}</div>
								</div>
								<div className='text-center'>
									<div className='text-sm font-semibold text-gray-900'>Open</div>
									<div className='text-xs text-red-600 font-medium'>
										{stats.openPercentage.toFixed(1)}%
									</div>
								</div>
							</div>

							{/* In Progress */}
							<div className='flex flex-col items-center'>
								<div className='w-24 h-24 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center mb-2'>
									<span className='text-2xl mb-1'>🟡</span>
									<div className='text-2xl font-bold text-white'>{stats.inProgressCount}</div>
								</div>
								<div className='text-center'>
									<div className='text-sm font-semibold text-gray-900'>In Progress</div>
									<div className='text-xs text-yellow-600 font-medium'>
										{stats.inProgressPercentage.toFixed(1)}%
									</div>
								</div>
							</div>

							{/* Resolved */}
							<div className='flex flex-col items-center'>
								<div className='w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center mb-2'>
									<span className='text-2xl mb-1'>✅</span>
									<div className='text-2xl font-bold text-white'>{stats.resolvedCount}</div>
								</div>
								<div className='text-center'>
									<div className='text-sm font-semibold text-gray-900'>Resolved</div>
									<div className='text-xs text-green-600 font-medium'>
										{stats.resolvedPercentage.toFixed(1)}%
									</div>
								</div>
							</div>
						</div>

						{/* Overdue Alert - Only show if there are overdue items */}
						{stats.overdueCount > 0 && (
							<div className='bg-gradient-to-r from-red-500 to-pink-500 rounded-lg shadow-md p-3 mb-4'>
								<div className='flex items-center justify-between'>
									<div className='flex items-center gap-2'>
										<div className='w-8 h-8 bg-white/20 rounded-md flex items-center justify-center backdrop-blur-sm'>
											<span className='text-lg'>⚠️</span>
										</div>
										<div>
											<div className='text-white text-xs font-medium mb-0.5'>
												Overdue Escalations
											</div>
											<div className='text-lg font-bold text-white'>
												{stats.overdueCount} &gt;5 days
											</div>
										</div>
									</div>
									<div className='bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full'>
										<span className='text-white text-[10px] font-semibold'>URGENT</span>
									</div>
								</div>
							</div>
						)}
					</div>
				)}

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
