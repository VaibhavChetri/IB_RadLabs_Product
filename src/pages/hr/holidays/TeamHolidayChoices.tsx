import React, { useState } from 'react';
import { PageHeader, Snackbar, Table, FloatingInput, FloatingDropdown, Pagination } from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { useTeamHolidayChoices, HOLIDAY_CHOICE_STATUS_OPTIONS } from '../../../features/hrm';
import { useDebounce } from '../../../hooks/useDebounce';
import type { TableColumn } from '../../../components/ui/DataDisplay';

const currentYear = new Date().getFullYear();

const YEAR_OPTIONS = [
	{ value: String(currentYear - 1), label: String(currentYear - 1) },
	{ value: String(currentYear), label: String(currentYear) },
	{ value: String(currentYear + 1), label: String(currentYear + 1) },
];

const getTeamChoiceColumns = (pageNumber: number, itemsPerPage: number): TableColumn<Record<string, unknown>>[] => [
	{
		key: 'serial',
		title: '#',
		sortable: false,
		align: 'center',
		render: (_value: unknown, _row: Record<string, unknown>, index: number) => {
			const serialNumber = (pageNumber - 1) * itemsPerPage + index + 1;
			return <div className='font-semibold text-gray-600 text-center'>{serialNumber}</div>;
		},
	},
	{
		key: 'employee_name',
		title: 'Employee',
		sortable: true,
		align: 'left',
		render: (value: unknown, row: Record<string, unknown>) => (
			<div>
				<div className='font-semibold text-gray-900'>{String(value || '')}</div>
				<div className='text-xs text-gray-500'>{String(row.employee_code || '')}</div>
			</div>
		),
	},
	{
		key: 'holiday_name',
		title: 'Holiday',
		sortable: true,
		align: 'left',
		render: (value: unknown) => (
			<div className='font-medium text-gray-900'>{String(value || '')}</div>
		),
	},
	{
		key: 'holiday_date',
		title: 'Date',
		sortable: true,
		align: 'center',
		render: (value: unknown) => {
			const dateStr = String(value || '');
			const formatted = dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
			return <div className='text-gray-700 text-center'>{formatted}</div>;
		},
	},
	{
		key: 'status',
		title: 'Status',
		sortable: true,
		align: 'center',
		render: (value: unknown) => {
			const status = String(value || '');
			const color = status === 'chosen' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
			return (
				<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
					{status.charAt(0).toUpperCase() + status.slice(1)}
				</span>
			);
		},
	},
];

export const TeamHolidayChoices: React.FC = () => {
	const [yearFilter, setYearFilter] = useState(String(currentYear));
	const [statusFilter, setStatusFilter] = useState('');
	const [search, setSearch] = useState('');
	const [page, setPage] = useState(1);
	const [limit] = useState(20);
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({ open: false, message: '', type: 'success' });

	const debouncedSearch = useDebounce(search, 300);

	const {
		data: listingData,
		isLoading: loading,
		error: listingError,
	} = useTeamHolidayChoices({
		year: Number(yearFilter),
		status: statusFilter || undefined,
		page,
		limit,
	});

	React.useEffect(() => {
		setPage(1);
	}, [yearFilter, statusFilter, debouncedSearch]);

	React.useEffect(() => {
		if (listingError) {
			setSnackbar({ open: true, message: 'Failed to load team choices', type: 'error' });
		}
	}, [listingError]);

	const columns = getTeamChoiceColumns(page, limit);

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
					<PageHeader title='Team Holiday Choices' totalItems={totalItems} itemType='choices' icon='👥' />
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
						<FloatingInput
							label='Search Employee'
							value={search}
							onChange={setSearch}
							placeholder='Search...'
							className='w-64'
						/>
						<FloatingDropdown
							label='Status'
							options={HOLIDAY_CHOICE_STATUS_OPTIONS}
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

				<Snackbar message={snackbar.message} type={snackbar.type} open={snackbar.open} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} />
			</div>
		</div>
	);
};

export default TeamHolidayChoices;
