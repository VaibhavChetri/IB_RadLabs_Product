/**
 * Designation Listing Page
 * Master data management for designations with inline modal CRUD
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader, Button, Snackbar, Table, FloatingInput, Pagination } from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import {
	useDesignationData,
	useCreateDesignation,
	useUpdateDesignation,
	useDeleteDesignation,
	getDesignationColumns,
} from '../../../features/hrm';
import { useDebounce } from '../../../hooks/useDebounce';
import type { HrmDesignation, CreateDesignationRequest } from '../../../services/hrmApi';

export const DesignationListing: React.FC = () => {
	const [search, setSearch] = useState('');
	const [page, setPage] = useState(1);
	const [limit] = useState(20);
	const [showModal, setShowModal] = useState(false);
	const [editingItem, setEditingItem] = useState<HrmDesignation | null>(null);
	const [formData, setFormData] = useState<CreateDesignationRequest>({ title: '', level: 1, is_active: true });
	const [formLoading, setFormLoading] = useState(false);
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({ open: false, message: '', type: 'success' });

	const debouncedSearch = useDebounce(search, 300);

	const {
		data: listingData,
		isLoading: loading,
		error: listingError,
	} = useDesignationData({
		q: debouncedSearch || undefined,
		page,
		limit,
	});

	const createMutation = useCreateDesignation();
	const updateMutation = useUpdateDesignation();
	const deleteMutation = useDeleteDesignation();

	React.useEffect(() => {
		if (listingError) {
			setSnackbar({ open: true, message: 'Failed to load designations', type: 'error' });
		}
	}, [listingError]);

	const handleAdd = () => {
		setEditingItem(null);
		setFormData({ title: '', level: 1, is_active: true });
		setShowModal(true);
	};

	const handleEdit = useCallback((item: HrmDesignation) => {
		setEditingItem(item);
		setFormData({ title: item.title, level: item.level, is_active: item.is_active });
		setShowModal(true);
	}, []);

	const handleDelete = useCallback(
		async (item: HrmDesignation) => {
			if (!window.confirm(`Delete designation "${item.title}"?`)) return;
			try {
				await deleteMutation.mutateAsync(item.id);
				setSnackbar({ open: true, message: 'Designation deleted', type: 'success' });
			} catch {
				setSnackbar({ open: true, message: 'Failed to delete designation', type: 'error' });
			}
		},
		[deleteMutation]
	);

	const handleSubmit = async () => {
		if (!formData.title.trim()) return;
		setFormLoading(true);
		try {
			if (editingItem) {
				await updateMutation.mutateAsync({ id: editingItem.id, data: formData });
				setSnackbar({ open: true, message: 'Designation updated', type: 'success' });
			} else {
				await createMutation.mutateAsync(formData);
				setSnackbar({ open: true, message: 'Designation created', type: 'success' });
			}
			setShowModal(false);
			setEditingItem(null);
		} catch (err: any) {
			setSnackbar({ open: true, message: err?.message || 'Operation failed', type: 'error' });
		} finally {
			setFormLoading(false);
		}
	};

	const columns = useMemo(
		() =>
			getDesignationColumns({
				onEdit: handleEdit,
				onDelete: handleDelete,
				pageNumber: page,
				itemsPerPage: limit,
			}),
		[handleEdit, handleDelete, page, limit]
	);

	const raw = listingData as any;
	const innerData = raw?.data?.data || raw?.data || raw || [];
	const tableData = (Array.isArray(innerData) ? innerData : []) as unknown as Record<string, unknown>[];
	const pagination = raw?.pagination || raw?.data?.pagination;
	const totalItems = pagination?.total || pagination?.totalRecords || tableData.length;
	const totalPages = pagination?.totalPages || 0;

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-5xl mx-auto'>
				<div className='flex items-center justify-between mb-6'>
					<PageHeader title='Designations' totalItems={totalItems} itemType='designations' icon='🏷️' />
					<Button onClick={handleAdd} variant='primary' leftIcon={<Plus className='w-4 h-4' />}>
						Add Designation
					</Button>
				</div>

				<div className='mb-6 flex w-full'>
					<div className='bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-lg p-4 flex w-full gap-3'>
						<FloatingInput
							label='Search'
							value={search}
							onChange={setSearch}
							placeholder='Search designations...'
							className='w-64'
						/>
					</div>
				</div>

				{loading ? (
					<TableSkeleton rows={8} columns={5} />
				) : (
					<>
						<Table columns={columns} data={tableData} loading={false} size='sm' />
						{totalPages > 0 && (
							<Pagination
								currentPage={page}
								totalPages={totalPages}
								totalItems={totalItems}
								itemsPerPage={limit}
								onPageChange={setPage}
								onItemsPerPageChange={() => {}}
								className='mt-4'
							/>
						)}
					</>
				)}

				{/* Modal */}
				{showModal && (
					<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
						<div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
							<h3 className='text-lg font-semibold mb-4'>
								{editingItem ? 'Edit Designation' : 'Add Designation'}
							</h3>
							<div className='space-y-4'>
								<FloatingInput
									label='Designation Title *'
									value={formData.title}
									onChange={(value: string) => setFormData(prev => ({ ...prev, title: value }))}
									placeholder='e.g. Supervisor'
								/>
								<FloatingInput
									label='Level *'
									value={String(formData.level)}
									onChange={(value: string) => setFormData(prev => ({ ...prev, level: parseInt(value, 10) || 1 }))}
									placeholder='e.g. 3'
									type='number'
								/>
							</div>
							<div className='flex justify-end gap-3 mt-6'>
								<Button variant='secondary' onClick={() => setShowModal(false)}>
									Cancel
								</Button>
								<Button
									variant='primary'
									onClick={handleSubmit}
									disabled={formLoading || !formData.title.trim()}
								>
									{formLoading ? 'Saving...' : editingItem ? 'Update' : 'Create'}
								</Button>
							</div>
						</div>
					</div>
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

export default DesignationListing;
