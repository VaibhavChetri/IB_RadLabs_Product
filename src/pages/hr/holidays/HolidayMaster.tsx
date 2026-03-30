import React, { useState, useMemo, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader, Button, Snackbar, Table, FloatingInput, FloatingDropdown, Pagination } from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import {
	useHolidayData,
	useCreateHoliday,
	useUpdateHoliday,
	useDeleteHoliday,
	getHolidayColumns,
	HOLIDAY_TYPE_OPTIONS,
} from '../../../features/hrm';
import type { HrmHoliday, CreateHolidayRequest } from '../../../services/hrmApi';

const currentYear = new Date().getFullYear();

const YEAR_OPTIONS = [
	{ value: String(currentYear - 1), label: String(currentYear - 1) },
	{ value: String(currentYear), label: String(currentYear) },
	{ value: String(currentYear + 1), label: String(currentYear + 1) },
];

const normalizeDateForInput = (value?: string) => {
	if (!value) return '';
	const trimmed = value.trim();
	if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
	const parsed = new Date(trimmed);
	if (!Number.isNaN(parsed.getTime())) {
		const year = parsed.getFullYear();
		const month = String(parsed.getMonth() + 1).padStart(2, '0');
		const day = String(parsed.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}
	const matchedDate = trimmed.match(/\d{4}-\d{2}-\d{2}/);
	if (matchedDate) return matchedDate[0];
	return '';
};

export const HolidayMaster: React.FC = () => {
	const [yearFilter, setYearFilter] = useState(String(currentYear));
	const [typeFilter, setTypeFilter] = useState('');
	const [page, setPage] = useState(1);
	const [limit] = useState(20);
	const [showModal, setShowModal] = useState(false);
	const [editingItem, setEditingItem] = useState<HrmHoliday | null>(null);
	const [formData, setFormData] = useState<CreateHolidayRequest>({
		name: '',
		date: '',
		type: 'national',
		year: currentYear,
	});
	const [formLoading, setFormLoading] = useState(false);
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({ open: false, message: '', type: 'success' });

	const {
		data: listingData,
		isLoading: loading,
		error: listingError,
	} = useHolidayData({
		year: Number(yearFilter),
		type: typeFilter || undefined,
		page,
		limit,
	});

	React.useEffect(() => {
		setPage(1);
	}, [yearFilter, typeFilter]);

	const createMutation = useCreateHoliday();
	const updateMutation = useUpdateHoliday();
	const deleteMutation = useDeleteHoliday();

	React.useEffect(() => {
		if (listingError) {
			setSnackbar({ open: true, message: 'Failed to load holidays', type: 'error' });
		}
	}, [listingError]);

	const handleAdd = () => {
		setEditingItem(null);
		setFormData({ name: '', date: '', type: 'national', year: Number(yearFilter) });
		setShowModal(true);
	};

	const handleEdit = useCallback((item: HrmHoliday) => {
		setEditingItem(item);
		setFormData({
			name: item.name,
			date: normalizeDateForInput(item.date),
			type: item.type,
			year: item.year,
		});
		setShowModal(true);
	}, []);

	const handleDelete = useCallback(
		async (item: HrmHoliday) => {
			if (!window.confirm(`Delete holiday "${item.name}"? This will also remove all employee choices for this date. This cannot be undone.`)) return;
			try {
				await deleteMutation.mutateAsync(item.id);
				setSnackbar({ open: true, message: 'Holiday deleted', type: 'success' });
			} catch {
				setSnackbar({ open: true, message: 'Failed to delete holiday', type: 'error' });
			}
		},
		[deleteMutation]
	);

	const handleSubmit = async () => {
		if (!formData.name.trim() || !formData.date) return;
		setFormLoading(true);
		try {
			const payload = {
				...formData,
				year: new Date(formData.date).getFullYear(),
			};
			if (editingItem) {
				await updateMutation.mutateAsync({ id: editingItem.id, data: payload });
				setSnackbar({ open: true, message: 'Holiday updated', type: 'success' });
			} else {
				await createMutation.mutateAsync(payload);
				setSnackbar({ open: true, message: 'Holiday created', type: 'success' });
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
		() => getHolidayColumns({ onEdit: handleEdit, onDelete: handleDelete, pageNumber: page, itemsPerPage: limit }),
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
					<PageHeader title='Holiday Master' totalItems={totalItems} itemType='holidays' icon='📅' />
					<Button onClick={handleAdd} variant='primary' leftIcon={<Plus className='w-4 h-4' />}>
						Add Holiday
					</Button>
				</div>

				<div className='mb-6 flex w-full'>
					<div className='bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-lg p-4 flex w-full gap-3 flex-wrap'>
						<FloatingDropdown
							label='Year'
							options={YEAR_OPTIONS}
							value={yearFilter}
							onChange={(value: string) => setYearFilter(value)}
							className='w-32'
							searchable={false}
						/>
						<FloatingDropdown
							label='Type'
							options={HOLIDAY_TYPE_OPTIONS}
							value={typeFilter}
							onChange={(value: string) => setTypeFilter(value)}
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

				{showModal && (
					<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
						<div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
							<h3 className='text-lg font-semibold mb-4'>
								{editingItem ? 'Edit Holiday' : 'Add Holiday'}
							</h3>
							<div className='space-y-4'>
								<FloatingInput
									label='Holiday Name *'
									value={formData.name}
									onChange={(value: string) => setFormData(prev => ({ ...prev, name: value }))}
									placeholder='e.g. Republic Day'
								/>
								<FloatingInput
									label='Date *'
									value={formData.date}
									onChange={(value: string) => setFormData(prev => ({ ...prev, date: value }))}
									type='date'
								/>
								<FloatingDropdown
									label='Type *'
									options={HOLIDAY_TYPE_OPTIONS.filter(o => o.value !== '')}
									value={formData.type}
									onChange={(value: string) => setFormData(prev => ({ ...prev, type: value as 'national' | 'company' | 'restricted' }))}
									searchable={false}
								/>
							</div>
							<div className='flex justify-end gap-3 mt-6'>
								<Button variant='secondary' onClick={() => setShowModal(false)}>
									Cancel
								</Button>
								<Button
									variant='primary'
									onClick={handleSubmit}
									disabled={formLoading || !formData.name.trim() || !formData.date}
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

export default HolidayMaster;
