import React, { useMemo, useState } from 'react';
import {
	Button,
	FloatingDropdown,
	PageHeader,
	Snackbar,
	Table,
} from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import type { TableColumn } from '../../../components/ui/DataDisplay';
import {
	useCreateLeaveType,
	useLeaveTypeData,
	useUpdateLeaveType,
} from '../../../features/hrm';

const STATUS_OPTIONS = [
	{ value: '', label: 'All Leave Types' },
	{ value: 'active', label: 'Active' },
	{ value: 'inactive', label: 'Inactive' },
];

const defaultForm = {
	name: '',
	code: '',
	annual_quota: '0',
	max_carry_forward: '0',
	max_consecutive_days: '',
	is_paid: true,
	requires_document: false,
	min_days_advance: '0',
	is_active: true,
};

const parseItems = (raw: any) => {
	if (Array.isArray(raw?.data)) return raw.data;
	if (Array.isArray(raw)) return raw;
	return [];
};

export const LeaveTypes: React.FC = () => {
	const [statusFilter, setStatusFilter] = useState('');
	const [showModal, setShowModal] = useState(false);
	const [editingItem, setEditingItem] = useState<any | null>(null);
	const [form, setForm] = useState(defaultForm);
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({ open: false, message: '', type: 'success' });

	const { data, isLoading } = useLeaveTypeData({ limit: 'all' });
	const createMutation = useCreateLeaveType();
	const updateMutation = useUpdateLeaveType();
	const items = parseItems(data);

	const filteredItems = useMemo(() => {
		if (!statusFilter) return items;
		return items.filter((item: any) =>
			statusFilter === 'active' ? item.is_active : !item.is_active
		);
	}, [items, statusFilter]);

	const resetForm = () => {
		setForm(defaultForm);
		setEditingItem(null);
		setShowModal(false);
	};

	const openCreate = () => {
		setEditingItem(null);
		setForm(defaultForm);
		setShowModal(true);
	};

	const openEdit = (item: any) => {
		setEditingItem(item);
		setForm({
			name: item.name || '',
			code: item.code || '',
			annual_quota: String(item.annual_quota ?? 0),
			max_carry_forward: String(item.max_carry_forward ?? 0),
			max_consecutive_days:
				item.max_consecutive_days === null ||
				item.max_consecutive_days === undefined
					? ''
					: String(item.max_consecutive_days),
			is_paid: Boolean(item.is_paid),
			requires_document: Boolean(item.requires_document),
			min_days_advance: String(item.min_days_advance ?? 0),
			is_active: Boolean(item.is_active),
		});
		setShowModal(true);
	};

	const handleSubmit = async () => {
		if (!form.name.trim() || !form.code.trim()) return;
		const payload = {
			name: form.name.trim(),
			code: form.code.trim().toUpperCase(),
			annual_quota: Number(form.annual_quota || 0),
			max_carry_forward: Number(form.max_carry_forward || 0),
			max_consecutive_days: form.max_consecutive_days
				? Number(form.max_consecutive_days)
				: null,
			is_paid: form.is_paid,
			requires_document: form.requires_document,
			min_days_advance: Number(form.min_days_advance || 0),
			is_active: form.is_active,
		};
		try {
			if (editingItem) {
				await updateMutation.mutateAsync({ id: editingItem.id, data: payload });
				setSnackbar({
					open: true,
					message: 'Leave type updated successfully',
					type: 'success',
				});
			} else {
				await createMutation.mutateAsync(payload);
				setSnackbar({
					open: true,
					message: 'Leave type created successfully',
					type: 'success',
				});
			}
			resetForm();
		} catch (error: any) {
			setSnackbar({
				open: true,
				message: error?.message || 'Failed to save leave type',
				type: 'error',
			});
		}
	};

	const columns: TableColumn<Record<string, unknown>>[] = [
		{
			key: 'code',
			title: 'Code',
			render: value => (
				<span className='font-semibold text-gray-900'>{String(value || '')}</span>
			),
		},
		{
			key: 'name',
			title: 'Leave Type',
			render: (value, row) => (
				<div>
					<div className='font-medium text-gray-900'>{String(value || '')}</div>
					<div className='text-xs text-gray-500'>
						Paid: {row.is_paid ? 'Yes' : 'No'} • Document:{' '}
						{row.requires_document ? 'Required' : 'Optional'}
					</div>
				</div>
			),
		},
		{
			key: 'annual_quota',
			title: 'Quota',
			align: 'center',
		},
		{
			key: 'max_carry_forward',
			title: 'Carry Forward',
			align: 'center',
		},
		{
			key: 'min_days_advance',
			title: 'Advance Notice',
			align: 'center',
			render: value => <span>{String(value || 0)} day(s)</span>,
		},
		{
			key: 'is_active',
			title: 'Status',
			align: 'center',
			render: value => (
				<span
					className={`px-2.5 py-1 rounded-full text-xs font-medium ${
						value
							? 'bg-green-50 text-green-700 border border-green-200'
							: 'bg-gray-100 text-gray-600 border border-gray-200'
					}`}
				>
					{value ? 'Active' : 'Inactive'}
				</span>
			),
		},
		{
			key: 'actions',
			title: 'Actions',
			align: 'center',
			render: (_value, row) => (
				<Button size='sm' variant='ghost' onClick={() => openEdit(row)}>
					Edit
				</Button>
			),
		},
	];

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-6xl mx-auto space-y-6'>
				<div className='flex items-start justify-between gap-4'>
					<PageHeader
						title='Leave Types'
						totalItems={filteredItems.length}
						itemType='types'
						icon='🏷️'
					/>
					<Button onClick={openCreate}>Add Leave Type</Button>
				</div>

				<div className='bg-white border border-gray-200 rounded-xl p-5'>
					<div className='w-52'>
						<FloatingDropdown
							label='Status'
							options={STATUS_OPTIONS}
							value={statusFilter}
							onChange={setStatusFilter}
							searchable={false}
						/>
					</div>
				</div>

				<div className='bg-white border border-gray-200 rounded-xl p-5'>
					{isLoading ? (
						<TableSkeleton rows={6} columns={6} />
					) : (
						<Table
							columns={columns}
							data={filteredItems as Record<string, unknown>[]}
							loading={false}
							size='sm'
						/>
					)}
				</div>
			</div>

			{showModal ? (
				<div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
					<div className='bg-white rounded-2xl w-full max-w-2xl p-6 space-y-4'>
						<div className='flex items-center justify-between'>
							<h2 className='text-xl font-semibold text-gray-900'>
								{editingItem ? 'Edit Leave Type' : 'Add Leave Type'}
							</h2>
						</div>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div>
								<label className='block text-xs font-medium text-gray-600 mb-1'>
									Name
								</label>
								<input
									className='w-full border border-gray-300 rounded-md px-3 py-3 text-sm'
									value={form.name}
									onChange={e =>
										setForm(prev => ({ ...prev, name: e.target.value }))
									}
								/>
							</div>
							<div>
								<label className='block text-xs font-medium text-gray-600 mb-1'>
									Code
								</label>
								<input
									className='w-full border border-gray-300 rounded-md px-3 py-3 text-sm uppercase'
									value={form.code}
									onChange={e =>
										setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))
									}
									maxLength={10}
								/>
							</div>
							<div>
								<label className='block text-xs font-medium text-gray-600 mb-1'>
									Annual Quota
								</label>
								<input
									type='number'
									className='w-full border border-gray-300 rounded-md px-3 py-3 text-sm'
									value={form.annual_quota}
									onChange={e =>
										setForm(prev => ({
											...prev,
											annual_quota: e.target.value,
										}))
									}
								/>
							</div>
							<div>
								<label className='block text-xs font-medium text-gray-600 mb-1'>
									Max Carry Forward
								</label>
								<input
									type='number'
									className='w-full border border-gray-300 rounded-md px-3 py-3 text-sm'
									value={form.max_carry_forward}
									onChange={e =>
										setForm(prev => ({
											...prev,
											max_carry_forward: e.target.value,
										}))
									}
								/>
							</div>
							<div>
								<label className='block text-xs font-medium text-gray-600 mb-1'>
									Max Consecutive Days
								</label>
								<input
									type='number'
									className='w-full border border-gray-300 rounded-md px-3 py-3 text-sm'
									value={form.max_consecutive_days}
									onChange={e =>
										setForm(prev => ({
											...prev,
											max_consecutive_days: e.target.value,
										}))
									}
								/>
							</div>
							<div>
								<label className='block text-xs font-medium text-gray-600 mb-1'>
									Advance Notice Days
								</label>
								<input
									type='number'
									className='w-full border border-gray-300 rounded-md px-3 py-3 text-sm'
									value={form.min_days_advance}
									onChange={e =>
										setForm(prev => ({
											...prev,
											min_days_advance: e.target.value,
										}))
									}
								/>
							</div>
						</div>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-700'>
							<label className='flex items-center gap-2'>
								<input
									type='checkbox'
									checked={form.is_paid}
									onChange={e =>
										setForm(prev => ({ ...prev, is_paid: e.target.checked }))
									}
								/>
								Paid leave
							</label>
							<label className='flex items-center gap-2'>
								<input
									type='checkbox'
									checked={form.requires_document}
									onChange={e =>
										setForm(prev => ({
											...prev,
											requires_document: e.target.checked,
										}))
									}
								/>
								Document required
							</label>
							<label className='flex items-center gap-2'>
								<input
									type='checkbox'
									checked={form.is_active}
									onChange={e =>
										setForm(prev => ({ ...prev, is_active: e.target.checked }))
									}
								/>
								Active
							</label>
						</div>
						<div className='flex justify-end gap-3'>
							<Button variant='secondary' onClick={resetForm}>
								Cancel
							</Button>
							<Button
								onClick={handleSubmit}
								disabled={
									createMutation.isPending ||
									updateMutation.isPending ||
									!form.name.trim() ||
									!form.code.trim()
								}
							>
								{createMutation.isPending || updateMutation.isPending
									? 'Saving...'
									: editingItem
									? 'Update'
									: 'Create'}
							</Button>
						</div>
					</div>
				</div>
			) : null}

			<Snackbar
				message={snackbar.message}
				type={snackbar.type}
				open={snackbar.open}
				onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
			/>
		</div>
	);
};

export default LeaveTypes;
