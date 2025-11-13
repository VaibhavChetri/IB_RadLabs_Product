import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader, Button, Pagination, Snackbar, FloatingDropdown } from '../../../components/ui';
import { Table } from '../../../components/ui/DataDisplay';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { Plus } from 'lucide-react';
import { ReviewCategoryTypeModal } from '../../../features/review-category-type/components/ReviewCategoryTypeModal';
import { useReviewCategoryTypeData } from '../../../features/review-category-type/hooks/useReviewCategoryTypeData';
import { useURLFilters } from '../../../features/review-category-type/hooks/useURLFilters';
import { getReviewCategoryTypeColumns } from '../../../features/review-category-type/config/tableColumns';
import { STATUS_OPTIONS } from '../../../features/review-category-type/config/constants';
import { useDebounce } from '../../../hooks/useDebounce';
import type { ReviewCategoryType } from '../../../services/pAndLApi';

export const ReviewCategoryType: React.FC = () => {
	const { filters: urlFilters, updateFilters } = useURLFilters();
	const [pagination, setPagination] = useState({
		currentPage: urlFilters.page,
		totalPages: 1,
		totalItems: 0,
		pageSize: urlFilters.pageSize,
	});
	const [showModal, setShowModal] = useState(false);
	const [editingItem, setEditingItem] = useState<ReviewCategoryType | null>(null);
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({
		open: false,
		message: '',
		type: 'success',
	});

	// Debounce filters to prevent rapid API calls
	const debouncedStatus = useDebounce(urlFilters.status, 300);

	// Fetch review category types
	const {
		data: listingData,
		isLoading: loading,
		error: listingError,
	} = useReviewCategoryTypeData({
		page: pagination.currentPage,
		limit: pagination.pageSize,
		status: debouncedStatus ? parseInt(debouncedStatus) : undefined,
		enabled: true,
	});

	// Sync pagination from URL on mount
	useEffect(() => {
		setPagination(prev => ({
			...prev,
			currentPage: urlFilters.page,
			pageSize: urlFilters.pageSize,
		}));
	}, [urlFilters.page, urlFilters.pageSize]);

	// Update pagination when data changes
	useEffect(() => {
		if (listingData?.pagination) {
			setPagination(prev => ({
				...prev,
				totalPages: listingData.pagination!.totalPages,
				totalItems: listingData.pagination!.totalItems,
			}));
		}
	}, [listingData?.pagination]);

	// Show error snackbar if API fails
	useEffect(() => {
		if (listingError) {
			setSnackbar({
				open: true,
				message: 'Failed to load review category types',
				type: 'error',
			});
		}
	}, [listingError]);

	const handleAdd = () => {
		setEditingItem(null);
		setShowModal(true);
	};

	const handleEdit = React.useCallback((item: ReviewCategoryType) => {
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
			message: editingItem ? 'Category type updated successfully' : 'Category type added successfully',
			type: 'success',
		});
		setShowModal(false);
		setEditingItem(null);
		// React Query mutations handle optimistic updates and refetch automatically
	};

	const handlePageChange = (page: number) => {
		setPagination(prev => ({ ...prev, currentPage: page }));
		updateFilters({ page });
	};

	const handleItemsPerPageChange = (itemsPerPage: number) => {
		setPagination(prev => ({ ...prev, pageSize: itemsPerPage, currentPage: 1 }));
		updateFilters({ pageSize: itemsPerPage, page: 1 });
	};

	const handleFilterChange = (key: 'status', value: string) => {
		updateFilters({ [key]: value, page: 1 });
		setPagination(prev => ({ ...prev, currentPage: 1 }));
	};

	const columns = useMemo(
		() =>
			getReviewCategoryTypeColumns({
				pagination,
				onEdit: handleEdit,
			}),
		[pagination, handleEdit]
	);

	const tableData = (listingData?.data || []) as unknown as Record<string, unknown>[];

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-7xl mx-auto'>
				<div className='flex items-center justify-between mb-6'>
					<PageHeader
						title='Review Category Type'
						totalItems={pagination.totalItems}
						itemType='category types'
						icon='📋'
					/>
					<Button
						onClick={handleAdd}
						className='px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors'
					>
						<Plus className='w-4 h-4 mr-2' />
						Add Category Type
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
					<TableSkeleton rows={pagination.pageSize} columns={4} />
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

				{showModal && (
					<ReviewCategoryTypeModal
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

