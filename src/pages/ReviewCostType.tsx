import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader, Button, Pagination, Snackbar, FloatingDropdown } from '../components/ui';
import { Table } from '../components/ui/DataDisplay';
import { TableSkeleton, FilterSkeleton } from '../components/ui/Skeleton';
import { Plus } from 'lucide-react';
import { ReviewCostTypeModal } from '../features/review-cost-type/components/ReviewCostTypeModal';
import { useReviewCostTypeData } from '../features/review-cost-type/hooks/useReviewCostTypeData';
import { useCostCategories } from '../features/review-cost-type/hooks/useCostCategories';
import { useURLFilters } from '../features/review-cost-type/hooks/useURLFilters';
import { getReviewCostTypeColumns } from '../features/review-cost-type/config/tableColumns';
import { STATUS_OPTIONS } from '../features/review-cost-type/config/constants';
import { useDebounce } from '../hooks/useDebounce';
import type { ReviewCostingType } from '../services/pAndLApi';

export const ReviewCostType: React.FC = () => {
	const { filters: urlFilters, updateFilters } = useURLFilters();
	const [pagination, setPagination] = useState({
		currentPage: urlFilters.page,
		totalPages: 1,
		totalItems: 0,
		pageSize: urlFilters.pageSize,
	});
	const [showModal, setShowModal] = useState(false);
	const [editingItem, setEditingItem] = useState<ReviewCostingType | null>(null);
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
	const debouncedCostCategoryId = useDebounce(urlFilters.costCategoryId, 300);
	const debouncedStatus = useDebounce(urlFilters.status, 300);

	// Fetch cost categories
	const {
		data: costCategoriesData,
		isLoading: loadingCategories,
		error: categoriesError,
	} = useCostCategories(1);

	// Fetch review cost types with debounced filters
	const {
		data: listingData,
		isLoading: loading,
		error: listingError,
	} = useReviewCostTypeData({
		page: pagination.currentPage,
		limit: pagination.pageSize,
		costCategoryId: debouncedCostCategoryId ? parseInt(debouncedCostCategoryId) : undefined,
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
				message: 'Failed to load review cost types',
				type: 'error',
			});
		}
	}, [listingError]);

	const handleAdd = () => {
		setEditingItem(null);
		setShowModal(true);
	};

	const handleEdit = React.useCallback((item: ReviewCostingType) => {
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
			message: editingItem ? 'Cost type updated successfully' : 'Cost type added successfully',
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

	const handleFilterChange = (key: 'costCategoryId' | 'status', value: string) => {
		updateFilters({ [key]: value, page: 1 });
		setPagination(prev => ({ ...prev, currentPage: 1 }));
	};

	const columns = useMemo(
		() =>
			getReviewCostTypeColumns({
				pagination,
				onEdit: handleEdit,
			}),
		[pagination, handleEdit]
	);

	const costCategories = costCategoriesData?.data || [];
	const tableData = (listingData?.data || []) as unknown as Record<string, unknown>[];

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-7xl mx-auto'>
				<div className='flex items-center justify-between mb-6'>
					<PageHeader
						title='Review Cost Type'
						totalItems={pagination.totalItems}
						itemType='cost types'
						icon='💰'
					/>
					<Button
						onClick={handleAdd}
						className='px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors'
					>
						<Plus className='w-4 h-4 mr-2' />
						Add Cost Type
					</Button>
				</div>

				{/* Filter Section */}
				<div className='mb-6 flex w-full'>
					<div className='bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-lg p-4 flex w-full gap-3'>
						<div className='flex items-center gap-4 w-full'>
							{loadingCategories ? (
								<FilterSkeleton />
							) : (
								<>
									<FloatingDropdown
										label='Cost Category'
										options={[
											{ value: '', label: 'All' },
											...costCategories.map(cat => ({
												value: String(cat.id),
												label: cat.costCategories,
											})),
										]}
										value={urlFilters.costCategoryId}
										onChange={(value: string) => handleFilterChange('costCategoryId', value)}
										loading={loadingCategories}
										placeholder='All Categories'
										error={!!categoriesError}
										errorMessage={categoriesError ? 'Failed to load cost categories' : undefined}
									/>

									<FloatingDropdown
										label='Status'
										options={[...STATUS_OPTIONS]}
										value={urlFilters.status}
										onChange={(value: string) => handleFilterChange('status', value)}
										placeholder='All Status'
									/>
								</>
							)}
						</div>
					</div>
				</div>

				{loading ? (
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

				{showModal && (
					<ReviewCostTypeModal
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
