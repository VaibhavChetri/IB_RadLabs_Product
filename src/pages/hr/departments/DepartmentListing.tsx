/**
 * Department Listing Page
 * Master data management for departments with inline modal CRUD
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader, Button, Snackbar, Table, FloatingInput, FloatingDropdown, Pagination } from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import {
	useDepartmentData,
	useCreateDepartment,
	useUpdateDepartment,
	useDeleteDepartment,
	getDepartmentColumns,
	ACTIVE_STATUS_OPTIONS,
} from '../../../features/hrm';
import { Switch } from '../../../components/ui/Form';
import { useDebounce } from '../../../hooks/useDebounce';
import type { HrmDepartment, CreateDepartmentRequest } from '../../../services/hrmApi';

export const DepartmentListing: React.FC = () => {
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState('');
	const [page, setPage] = useState(1);
	const [limit] = useState(20);
	const [showModal, setShowModal] = useState(false);
	const [editingItem, setEditingItem] = useState<HrmDepartment | null>(null);
	const [formData, setFormData] = useState<CreateDepartmentRequest>({ name: '', code: '', is_active: true });
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
	} = useDepartmentData({
		q: debouncedSearch || undefined,
		is_active: statusFilter === '' ? undefined : statusFilter === 'true',
		page,
		limit,
	});

	React.useEffect(() => {
		setPage(1);
	}, [debouncedSearch, statusFilter]);

	const createMutation = useCreateDepartment();
	const updateMutation = useUpdateDepartment();
	const deleteMutation = useDeleteDepartment();

	React.useEffect(() => {
		if (listingError) {
			setSnackbar({ open: true, message: 'Failed to load departments', type: 'error' });
		}
	}, [listingError]);

	const handleAdd = () => {
		setEditingItem(null);
		setFormData({ name: '', code: '', is_active: true });
		setShowModal(true);
	};

	const handleEdit = useCallback((item: HrmDepartment) => {
		setEditingItem(item);
		setFormData({ name: item.name, code: item.code, is_active: item.is_active });
		setShowModal(true);
	}, []);

	const handleDelete = useCallback(
		async (item: HrmDepartment) => {
			if (!window.confirm(`Delete department "${item.name}"?`)) return;
			try {
				await deleteMutation.mutateAsync(item.id);
				setSnackbar({ open: true, message: 'Department deleted', type: 'success' });
			} catch {
				setSnackbar({ open: true, message: 'Failed to delete department', type: 'error' });
			}
		},
		[deleteMutation]
	);

	const handleSubmit = async () => {
		if (!formData.name.trim() || !formData.code.trim()) return;
		setFormLoading(true);
		try {
			if (editingItem) {
				await updateMutation.mutateAsync({ id: editingItem.id, data: formData });
				setSnackbar({ open: true, message: 'Department updated', type: 'success' });
			} else {
				await createMutation.mutateAsync(formData);
				setSnackbar({ open: true, message: 'Department created', type: 'success' });
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
			getDepartmentColumns({
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
					<PageHeader title='Departments' totalItems={totalItems} itemType='departments' icon='🏢' />
					<Button onClick={handleAdd} variant='primary' leftIcon={<Plus className='w-4 h-4' />}>
						Add Department
					</Button>
				</div>

				<div className='mb-6 flex w-full'>
					<div className='bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-lg p-4 flex w-full gap-3 flex-wrap'>
						<FloatingInput
							label='Search'
							value={search}
							onChange={setSearch}
							placeholder='Search departments...'
							className='w-64'
						/>
						<FloatingDropdown
							label='Status'
							options={ACTIVE_STATUS_OPTIONS}
							value={statusFilter}
							onChange={(value: string) => setStatusFilter(value)}
							placeholder='All'
							className='w-44'
							searchable={false}
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
								{editingItem ? 'Edit Department' : 'Add Department'}
							</h3>
							<div className='space-y-4'>
								<FloatingInput
									label='Department Name *'
									value={formData.name}
									onChange={(value: string) => setFormData(prev => ({ ...prev, name: value }))}
									placeholder='e.g. Operations'
								/>
								<FloatingInput
									label='Code *'
									value={formData.code}
									onChange={(value: string) => setFormData(prev => ({ ...prev, code: value.toUpperCase() }))}
									placeholder='e.g. OPS'
								/>
								<div className='flex items-center gap-3 pt-1'>
									<Switch
										checked={formData.is_active ?? true}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
											setFormData(prev => ({ ...prev, is_active: e.target.checked }))
										}
									/>
									<span className='text-sm text-gray-700'>Active</span>
								</div>
							</div>
							<div className='flex justify-end gap-3 mt-6'>
								<Button variant='secondary' onClick={() => setShowModal(false)}>
									Cancel
								</Button>
								<Button
									variant='primary'
									onClick={handleSubmit}
									disabled={formLoading || !formData.name.trim() || !formData.code.trim()}
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

export default DepartmentListing;
