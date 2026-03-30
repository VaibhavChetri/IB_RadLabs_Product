/**
 * Salary Structure Listing Page
 * Displays salary structures with employee details and CTC info
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { PageHeader, Button, Snackbar, Table, FloatingInput, FloatingDropdown, Pagination } from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { Card } from '../../../components/ui/Card';
import {
	useSalaryStructureData,
	useCreateSalaryStructure,
	useUpdateSalaryStructure,
	useDeleteSalaryStructure,
	useEmployeeManagerOptions,
	formatCurrency,
} from '../../../features/hrm';
import { HrIconTooltip } from '../../../features/hrm/components/HrIconTooltip';
import type { TableColumn } from '../../../components/ui/DataDisplay';
import type { HrmSalaryStructure, CreateSalaryStructureRequest } from '../../../services/hrmApi';

export const SalaryStructureListing: React.FC = () => {
	const [page, setPage] = useState(1);
	const [limit] = useState(20);
	const [employeeIdFilter, setEmployeeIdFilter] = useState('');
	const [showModal, setShowModal] = useState(false);
	const [showDetailModal, setShowDetailModal] = useState(false);
	const [editingItem, setEditingItem] = useState<HrmSalaryStructure | null>(null);
	const [viewingItem, setViewingItem] = useState<HrmSalaryStructure | null>(null);
	const [formLoading, setFormLoading] = useState(false);
	const [formData, setFormData] = useState<Partial<CreateSalaryStructureRequest>>({
		employee_id: 0,
		effective_from: '',
		ctc_annual: 0,
		basic_monthly: 0,
		hra_monthly: 0,
		da_monthly: 0,
		special_allowance_monthly: 0,
		conveyance_monthly: 0,
		medical_allowance_monthly: 0,
		other_allowance_monthly: 0,
		is_pf_applicable: true,
		is_esi_applicable: false,
		is_pt_applicable: true,
		is_tds_applicable: true,
	});
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({ open: false, message: '', type: 'success' });

	const {
		data: listingData,
		isLoading: loading,
		error: listingError,
	} = useSalaryStructureData({
		employee_id: employeeIdFilter ? parseInt(employeeIdFilter, 10) : undefined,
		page,
		limit,
	});

	// Fetch employees for name lookup and dropdown (paginated, respects HRM max limit)
	const { data: employeeListData } = useEmployeeManagerOptions();
	const employeeRaw = employeeListData as any;
	const employeeList = employeeRaw?.data?.data || employeeRaw?.data || employeeRaw || [];
	const employees = Array.isArray(employeeList) ? employeeList : [];

	const employeeMap = useMemo(() => {
		const map: Record<number, { name: string; code: string }> = {};
		employees.forEach((emp: any) => {
			map[emp.id] = {
				name: emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
				code: emp.employee_code || '',
			};
		});
		return map;
	}, [employees]);

	const employeeDropdownOptions = useMemo(() => {
		return employees.map((emp: any) => ({
			value: String(emp.id),
			label: `${emp.employee_code || ''} - ${emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim()}`,
		}));
	}, [employees]);

	const employeeFilterOptions = useMemo(() => {
		return [
			{ value: '', label: 'All Employees' },
			...employeeDropdownOptions,
		];
	}, [employeeDropdownOptions]);

	const createMutation = useCreateSalaryStructure();
	const updateMutation = useUpdateSalaryStructure();
	const deleteMutation = useDeleteSalaryStructure();

	React.useEffect(() => {
		if (listingError) {
			setSnackbar({ open: true, message: 'Failed to load salary structures', type: 'error' });
		}
	}, [listingError]);

	const handleAdd = () => {
		setEditingItem(null);
		setFormData({
			employee_id: 0,
			effective_from: '',
			ctc_annual: 0,
			basic_monthly: 0,
			hra_monthly: 0,
			da_monthly: 0,
			special_allowance_monthly: 0,
			conveyance_monthly: 0,
			medical_allowance_monthly: 0,
			other_allowance_monthly: 0,
			is_pf_applicable: true,
			is_esi_applicable: false,
			is_pt_applicable: true,
			is_tds_applicable: true,
		});
		setShowModal(true);
	};

	const handleEdit = useCallback((item: HrmSalaryStructure) => {
		setEditingItem(item);
		setFormData({
			employee_id: item.employee_id,
			effective_from: item.effective_from ? item.effective_from.split('T')[0] : '',
			effective_to: item.effective_to ? item.effective_to.split('T')[0] : undefined,
			ctc_annual: item.ctc_annual,
			basic_monthly: item.basic_monthly,
			hra_monthly: item.hra_monthly,
			da_monthly: item.da_monthly,
			special_allowance_monthly: item.special_allowance_monthly,
			conveyance_monthly: item.conveyance_monthly,
			medical_allowance_monthly: item.medical_allowance_monthly,
			other_allowance_monthly: item.other_allowance_monthly,
			is_pf_applicable: item.is_pf_applicable,
			is_esi_applicable: item.is_esi_applicable,
			is_pt_applicable: item.is_pt_applicable,
			is_tds_applicable: item.is_tds_applicable,
		});
		setShowModal(true);
	}, []);

	const handleView = useCallback((item: HrmSalaryStructure) => {
		setViewingItem(item);
		setShowDetailModal(true);
	}, []);

	const handleDelete = useCallback(
		async (item: HrmSalaryStructure) => {
			if (!window.confirm('Delete this salary structure?')) return;
			try {
				await deleteMutation.mutateAsync(item.id);
				setSnackbar({ open: true, message: 'Salary structure deleted', type: 'success' });
			} catch {
				setSnackbar({ open: true, message: 'Failed to delete', type: 'error' });
			}
		},
		[deleteMutation]
	);

	const [formErrors, setFormErrors] = useState<string[]>([]);

	const handleSubmit = async () => {
		const errors: string[] = [];
		if (!formData.employee_id) errors.push('Employee ID is required');
		if (!formData.effective_from) errors.push('Effective From date is required');
		if (!formData.ctc_annual) errors.push('CTC Annual is required');
		if (!formData.basic_monthly) errors.push('Basic Monthly is required');
		if (errors.length > 0) {
			setFormErrors(errors);
			return;
		}
		setFormErrors([]);
		setFormLoading(true);
		try {
			if (editingItem) {
				await updateMutation.mutateAsync({ id: editingItem.id, data: formData });
				setSnackbar({ open: true, message: 'Salary structure updated', type: 'success' });
			} else {
				await createMutation.mutateAsync(formData as CreateSalaryStructureRequest);
				setSnackbar({ open: true, message: 'Salary structure created', type: 'success' });
			}
			setShowModal(false);
		} catch (err: any) {
			setSnackbar({ open: true, message: err?.message || 'Operation failed', type: 'error' });
		} finally {
			setFormLoading(false);
		}
	};

	const columns: TableColumn<Record<string, unknown>>[] = useMemo(
		() => [
			{
				key: 'actions',
				title: 'Actions',
				sortable: false,
				align: 'center' as const,
				render: (_value: unknown, row: Record<string, unknown>) => (
					<div className='flex items-center justify-center gap-1'>
						<HrIconTooltip label='View'>
							<button
								type='button'
								onClick={() => handleView(row as unknown as HrmSalaryStructure)}
								className='p-1.5 text-blue-600 hover:bg-blue-50 rounded'
							>
								<Eye className='w-4 h-4' />
							</button>
						</HrIconTooltip>
						<HrIconTooltip label='Edit'>
							<button
								type='button'
								onClick={() => handleEdit(row as unknown as HrmSalaryStructure)}
								className='p-1.5 text-green-600 hover:bg-green-50 rounded'
							>
								<Edit className='w-4 h-4' />
							</button>
						</HrIconTooltip>
						<HrIconTooltip label='Delete'>
							<button
								type='button'
								onClick={() => handleDelete(row as unknown as HrmSalaryStructure)}
								className='p-1.5 text-red-600 hover:bg-red-50 rounded'
							>
								<Trash2 className='w-4 h-4' />
							</button>
						</HrIconTooltip>
					</div>
				),
			},
			{
				key: 'serial',
				title: '#',
				sortable: false,
				align: 'center' as const,
				render: (_v: unknown, _r: Record<string, unknown>, idx: number) => (
					<div className='font-semibold text-gray-600 text-center'>{(page - 1) * limit + idx + 1}</div>
				),
			},
			{
				key: 'employee_id',
				title: 'Employee',
				sortable: true,
				align: 'left' as const,
				render: (value: unknown) => {
					const empId = Number(value);
					const emp = employeeMap[empId];
					return (
						<div>
							<div className='font-semibold text-gray-900'>{emp?.name || `Employee #${empId}`}</div>
							{emp?.code && <div className='text-xs text-gray-500 font-mono'>{emp.code}</div>}
						</div>
					);
				},
			},
			{
				key: 'ctc_annual',
				title: 'CTC (Annual)',
				sortable: true,
				align: 'center' as const,
				render: (value: unknown) => <div className='font-semibold text-center'>{formatCurrency(Number(value) || 0)}</div>,
			},
			{
				key: 'basic_monthly',
				title: 'Basic (Monthly)',
				sortable: true,
				align: 'center' as const,
				render: (value: unknown) => <div className='text-center'>{formatCurrency(Number(value) || 0)}</div>,
			},
			{
				key: 'hra_monthly',
				title: 'HRA',
				sortable: false,
				align: 'center' as const,
				render: (value: unknown) => <div className='text-center'>{formatCurrency(Number(value) || 0)}</div>,
			},
			{
				key: 'effective_from',
				title: 'Effective From',
				sortable: true,
				align: 'center' as const,
				render: (value: unknown) => {
					if (!value) return <div className='text-gray-500 text-center'>N/A</div>;
					return <div className='text-sm text-center'>{new Date(String(value)).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</div>;
				},
			},
			{
				key: 'is_pf_applicable',
				title: 'PF',
				sortable: false,
				align: 'center' as const,
				render: (value: unknown) => (
					<span className={`text-xs font-medium ${value ? 'text-green-600' : 'text-gray-400'}`}>
						{value ? 'Yes' : 'No'}
					</span>
				),
			},
		],
		[page, limit, handleEdit, handleDelete, handleView, employeeMap]
	);

	const raw = listingData as any;
	const innerData = raw?.data?.data || raw?.data || raw || [];
	const tableData = (Array.isArray(innerData) ? innerData : []) as unknown as Record<string, unknown>[];
	const pagination = raw?.pagination || raw?.data?.pagination;
	const totalItems = pagination?.total || pagination?.totalRecords || tableData.length;
	const totalPages = pagination?.totalPages || 0;

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-7xl mx-auto'>
				<div className='flex items-center justify-between mb-6'>
					<PageHeader title='Salary Structures' totalItems={totalItems} itemType='structures' icon='💰' />
					<Button onClick={handleAdd} variant='primary' leftIcon={<Plus className='w-4 h-4' />}>
						Add Structure
					</Button>
				</div>

				<div className='mb-6 flex w-full'>
					<div className='bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-lg p-4 flex w-full gap-3'>
						<FloatingDropdown
							label='Employee'
							options={employeeFilterOptions}
							value={employeeIdFilter}
							onChange={setEmployeeIdFilter}
							placeholder='All Employees'
							className='w-64'
						/>
					</div>
				</div>

				{loading ? (
					<TableSkeleton rows={8} columns={8} />
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

				{/* Add/Edit Modal */}
				{showModal && (
					<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto'>
						<div className='bg-white rounded-lg p-6 max-w-2xl w-full mx-4 my-8'>
							<h3 className='text-lg font-semibold mb-4'>
								{editingItem ? 'Edit Salary Structure' : 'Add Salary Structure'}
							</h3>
							<div className='grid grid-cols-2 gap-4'>
								<FloatingDropdown
									label='Employee *'
									options={employeeDropdownOptions}
									value={String(formData.employee_id || '')}
									onChange={(v: string) => setFormData(prev => ({ ...prev, employee_id: parseInt(v, 10) || 0 }))}
									placeholder='Select employee'
								/>
								<FloatingInput
									label='Effective From *'
									value={formData.effective_from || ''}
									onChange={(v: string) => setFormData(prev => ({ ...prev, effective_from: v }))}
									type='date'
								/>
								<FloatingInput
									label='CTC Annual *'
									value={String(formData.ctc_annual || '')}
									onChange={(v: string) => setFormData(prev => ({ ...prev, ctc_annual: parseFloat(v) || 0 }))}
									type='number'
								/>
								<FloatingInput
									label='Basic Monthly *'
									value={String(formData.basic_monthly || '')}
									onChange={(v: string) => setFormData(prev => ({ ...prev, basic_monthly: parseFloat(v) || 0 }))}
									type='number'
								/>
								<FloatingInput
									label='HRA Monthly'
									value={String(formData.hra_monthly || '')}
									onChange={(v: string) => setFormData(prev => ({ ...prev, hra_monthly: parseFloat(v) || 0 }))}
									type='number'
								/>
								<FloatingInput
									label='DA Monthly'
									value={String(formData.da_monthly || '')}
									onChange={(v: string) => setFormData(prev => ({ ...prev, da_monthly: parseFloat(v) || 0 }))}
									type='number'
								/>
								<FloatingInput
									label='Special Allowance'
									value={String(formData.special_allowance_monthly || '')}
									onChange={(v: string) => setFormData(prev => ({ ...prev, special_allowance_monthly: parseFloat(v) || 0 }))}
									type='number'
								/>
								<FloatingInput
									label='Conveyance'
									value={String(formData.conveyance_monthly || '')}
									onChange={(v: string) => setFormData(prev => ({ ...prev, conveyance_monthly: parseFloat(v) || 0 }))}
									type='number'
								/>
								<FloatingInput
									label='Medical Allowance'
									value={String(formData.medical_allowance_monthly || '')}
									onChange={(v: string) => setFormData(prev => ({ ...prev, medical_allowance_monthly: parseFloat(v) || 0 }))}
									type='number'
								/>
								<FloatingInput
									label='Other Allowance'
									value={String(formData.other_allowance_monthly || '')}
									onChange={(v: string) => setFormData(prev => ({ ...prev, other_allowance_monthly: parseFloat(v) || 0 }))}
									type='number'
								/>
							</div>
							{formErrors.length > 0 && (
								<div className='mt-4 p-3 bg-red-50 border border-red-200 rounded-lg'>
									{formErrors.map((err, i) => (
										<div key={i} className='text-sm text-red-600'>{err}</div>
									))}
								</div>
							)}
							<div className='flex justify-end gap-3 mt-6'>
								<Button variant='secondary' onClick={() => { setShowModal(false); setFormErrors([]); }}>Cancel</Button>
								<Button variant='primary' onClick={handleSubmit} disabled={formLoading}>
									{formLoading ? 'Saving...' : editingItem ? 'Update' : 'Create'}
								</Button>
							</div>
						</div>
					</div>
				)}

				{/* Detail Modal */}
				{showDetailModal && viewingItem && (
					<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
						<div className='bg-white rounded-lg p-6 max-w-lg w-full mx-4'>
							<h3 className='text-lg font-semibold mb-4'>Salary Structure Detail</h3>
							<Card className='p-4'>
								<div className='space-y-2 text-sm'>
									<div className='flex justify-between'><span className='text-gray-500'>Employee:</span><span className='font-medium'>{employeeMap[viewingItem.employee_id]?.name || `#${viewingItem.employee_id}`} <span className='text-xs text-gray-400 font-mono'>{employeeMap[viewingItem.employee_id]?.code}</span></span></div>
									<div className='flex justify-between'><span className='text-gray-500'>CTC Annual:</span><span className='font-semibold text-green-600'>{formatCurrency(viewingItem.ctc_annual)}</span></div>
									<hr />
									<div className='flex justify-between'><span className='text-gray-500'>Basic:</span><span>{formatCurrency(viewingItem.basic_monthly)}</span></div>
									<div className='flex justify-between'><span className='text-gray-500'>HRA:</span><span>{formatCurrency(viewingItem.hra_monthly)}</span></div>
									<div className='flex justify-between'><span className='text-gray-500'>DA:</span><span>{formatCurrency(viewingItem.da_monthly)}</span></div>
									<div className='flex justify-between'><span className='text-gray-500'>Special Allowance:</span><span>{formatCurrency(viewingItem.special_allowance_monthly)}</span></div>
									<div className='flex justify-between'><span className='text-gray-500'>Conveyance:</span><span>{formatCurrency(viewingItem.conveyance_monthly)}</span></div>
									<div className='flex justify-between'><span className='text-gray-500'>Medical:</span><span>{formatCurrency(viewingItem.medical_allowance_monthly)}</span></div>
									<div className='flex justify-between'><span className='text-gray-500'>Other:</span><span>{formatCurrency(viewingItem.other_allowance_monthly)}</span></div>
									<hr />
									<div className='flex justify-between'><span className='text-gray-500'>PF:</span><span>{viewingItem.is_pf_applicable ? 'Yes' : 'No'}</span></div>
									<div className='flex justify-between'><span className='text-gray-500'>ESI:</span><span>{viewingItem.is_esi_applicable ? 'Yes' : 'No'}</span></div>
									<div className='flex justify-between'><span className='text-gray-500'>PT:</span><span>{viewingItem.is_pt_applicable ? 'Yes' : 'No'}</span></div>
									<div className='flex justify-between'><span className='text-gray-500'>TDS:</span><span>{viewingItem.is_tds_applicable ? 'Yes' : 'No'}</span></div>
								</div>
							</Card>
							<div className='flex justify-end mt-4'>
								<Button variant='secondary' onClick={() => setShowDetailModal(false)}>Close</Button>
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

export default SalaryStructureListing;
