/**
 * Employee Listing Page
 * Displays all HRM employees with filters, search, and CRUD actions
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader, Button, Snackbar, Table, FloatingInput, FloatingDropdown, Pagination } from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import {
	useEmployeeData,
	useDepartmentOptions,
	useDesignationOptions,
	useDeleteEmployee,
	useEmployeeURLFilters,
	getEmployeeColumns,
	EMPLOYEE_STATUS_OPTIONS,
	EMPLOYMENT_TYPE_OPTIONS,
} from '../../../features/hrm';
import { useDebounce } from '../../../hooks/useDebounce';
import type { HrmEmployee } from '../../../services/hrmApi';

export const EmployeeListing: React.FC = () => {
	const navigate = useNavigate();
	const { filters: urlFilters, updateFilters } = useEmployeeURLFilters();
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({
		open: false,
		message: '',
		type: 'success',
	});

	// Debounce search
	const debouncedSearch = useDebounce(urlFilters.q, 300);

	// Fetch employees
	const {
		data: listingData,
		isLoading: loading,
		error: listingError,
	} = useEmployeeData({
		q: debouncedSearch || undefined,
		department_id: urlFilters.department_id ? parseInt(urlFilters.department_id, 10) : undefined,
		designation_id: urlFilters.designation_id ? parseInt(urlFilters.designation_id, 10) : undefined,
		status: urlFilters.status || undefined,
		employment_type: urlFilters.employment_type || undefined,
		is_active: urlFilters.is_active ? urlFilters.is_active === 'true' : undefined,
		page: urlFilters.page,
		limit: urlFilters.limit,
	});

	// Fetch dropdown options
	const { data: deptData } = useDepartmentOptions();
	const { data: desigData } = useDesignationOptions();

	const deleteMutation = useDeleteEmployee();

	// Show error snackbar if API fails
	React.useEffect(() => {
		if (listingError) {
			setSnackbar({
				open: true,
				message: 'Failed to load employees',
				type: 'error',
			});
		}
	}, [listingError]);

	// Build dropdown options — handle multiple response shapes
	const departmentOptions = useMemo(() => {
		const raw = deptData as any;
		const depts = raw?.data?.data || raw?.data || raw || [];
		const items = Array.isArray(depts) ? depts : [];
		return [
			{ value: '', label: 'All Departments' },
			...items.map((d: any) => ({ value: String(d.id), label: d.name })),
		];
	}, [deptData]);

	const designationOptions = useMemo(() => {
		const raw = desigData as any;
		const desigs = raw?.data?.data || raw?.data || raw || [];
		const items = Array.isArray(desigs) ? desigs : [];
		return [
			{ value: '', label: 'All Designations' },
			...items.map((d: any) => ({ value: String(d.id), label: d.title })),
		];
	}, [desigData]);

	const handleAdd = () => {
		navigate('/hr/employees/add');
	};

	const handleEdit = useCallback(
		(item: HrmEmployee) => {
			navigate(`/hr/employees/edit/${item.id}`);
		},
		[navigate]
	);

	const handleView = useCallback(
		(item: HrmEmployee) => {
			navigate(`/hr/employees/edit/${item.id}`);
		},
		[navigate]
	);

	const handleDelete = useCallback(
		async (item: HrmEmployee) => {
			if (!window.confirm(`Are you sure you want to deactivate ${item.full_name}?`)) return;

			try {
				await deleteMutation.mutateAsync(item.id);
				setSnackbar({
					open: true,
					message: `${item.full_name} deactivated successfully`,
					type: 'success',
				});
			} catch {
				setSnackbar({
					open: true,
					message: 'Failed to deactivate employee',
					type: 'error',
				});
			}
		},
		[deleteMutation]
	);

	const columns = useMemo(
		() =>
			getEmployeeColumns({
				onEdit: handleEdit,
				onDelete: handleDelete,
				onView: handleView,
				pageNumber: urlFilters.page,
				itemsPerPage: urlFilters.limit,
			}),
		[handleEdit, handleDelete, handleView, urlFilters.page, urlFilters.limit]
	);

	// Handle multiple API response shapes:
	// Shape 1: { data: [...], pagination: {...} }
	// Shape 2: { data: { data: [...], pagination: {...} } }
	// Shape 3: direct array [...]
	const raw = listingData as any;
	const innerData = raw?.data?.data || raw?.data || raw || [];
	const tableData = (Array.isArray(innerData) ? innerData : []) as unknown as Record<string, unknown>[];
	const pagination = raw?.pagination || raw?.data?.pagination;
	const totalItems = pagination?.total || pagination?.totalRecords || tableData.length;
	const totalPages = pagination?.totalPages || 0;

	const handleFilterChange = (key: string, value: string) => {
		updateFilters({ [key]: value, page: 1 });
	};

	const handlePageChange = (page: number) => {
		updateFilters({ page });
	};

	const handleItemsPerPageChange = (limit: number) => {
		updateFilters({ limit, page: 1 });
	};

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-7xl mx-auto'>
				<div className='flex items-center justify-between mb-6'>
					<PageHeader
						title='Employees'
						totalItems={totalItems}
						itemType='employees'
						icon='👥'
					/>
					<Button onClick={handleAdd} variant='primary' leftIcon={<Plus className='w-4 h-4' />}>
						Add Employee
					</Button>
				</div>

				{/* Filter Section */}
				<div className='mb-6 flex w-full'>
					<div className='bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-lg p-4 flex w-full gap-3 flex-wrap'>
						<FloatingInput
							label='Search'
							value={urlFilters.q}
							onChange={(value: string) => handleFilterChange('q', value)}
							placeholder='Name, code, email...'
							className='w-52'
						/>
						<FloatingDropdown
							label='Department'
							options={departmentOptions}
							value={urlFilters.department_id}
							onChange={(value: string) => handleFilterChange('department_id', value)}
							placeholder='All Departments'
							className='w-48'
						/>
						<FloatingDropdown
							label='Designation'
							options={designationOptions}
							value={urlFilters.designation_id}
							onChange={(value: string) => handleFilterChange('designation_id', value)}
							placeholder='All Designations'
							className='w-48'
						/>
						<FloatingDropdown
							label='Status'
							options={EMPLOYEE_STATUS_OPTIONS}
							value={urlFilters.status}
							onChange={(value: string) => handleFilterChange('status', value)}
							placeholder='All Status'
							className='w-40'
						/>
						<FloatingDropdown
							label='Type'
							options={EMPLOYMENT_TYPE_OPTIONS}
							value={urlFilters.employment_type}
							onChange={(value: string) => handleFilterChange('employment_type', value)}
							placeholder='All Types'
							className='w-40'
						/>
					</div>
				</div>

				{loading ? (
					<TableSkeleton rows={10} columns={10} />
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

export default EmployeeListing;
