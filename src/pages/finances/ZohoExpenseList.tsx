/**
 * Zoho Expense Listing Page
 * Displays all expenses (cash spend) from Zoho with filters
 * Persists filter state to localStorage for page refresh resilience
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
	PageHeader,
	Card,
	FloatingInput,
	MultiSelectDropdown,
	Pagination,
	Snackbar,
	Button,
} from '../../components/ui';
import { Table } from '../../components/ui/DataDisplay';
import { ZohoExpenseApi, ZohoExpense, ZohoExpenseFilters } from '../../services/zohoExpenseApi';
import { mapAxiosZohoError } from '../../services/zohoErrors';
import type { TableColumn } from '../../components/ui/DataDisplay';
import { RefreshCw, Download } from 'lucide-react';
import {
	downloadCsv,
	ZohoDeepLink,
	FinanceBriefButton,
} from '../../components/finances/financeUtils';
import { ZohoDetailDrawer } from '../../components/finances/ZohoDetailDrawer';

interface PaginationData {
	totalCount: number;
	pageSize: number;
	currentPage: number;
	totalPages: number;
}

const STORAGE_KEY = 'zoho_expense_filters';
const FIRST_IMPORT_KEY = 'zoho_expense_first_import_done';

const toIsoDate = (d: Date) => {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
};

const getCurrentMonthRange = () => {
	const now = new Date();
	return {
		date_start: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
		date_end: toIsoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
	};
};

const buildDefaultFilters = (): ZohoExpenseFilters => {
	const { date_start, date_end } = getCurrentMonthRange();
	return {
		page: 1,
		limit: 50,
		date_start,
		date_end,
		vendor_name: '',
		customer_name: '',
		expense_account_name: '',
		status: '',
		city: '',
		facility_type: '',
		business_unit: '',
		expense_category: '',
		client_hint: '',
		submitter: '',
	};
};

const getStoredFilters = (): ZohoExpenseFilters => {
	const defaults = buildDefaultFilters();
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return { ...defaults, ...parsed, page: 1, limit: 50 };
		}
	} catch (error) {
		console.error('Failed to parse stored filters:', error);
	}
	return defaults;
};

const saveFilters = (filters: ZohoExpenseFilters) => {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
	} catch (error) {
		console.error('Failed to save filters to storage:', error);
	}
};

export const ZohoExpenseList: React.FC = () => {
	const [expenses, setExpenses] = useState<ZohoExpense[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const initialFilters = useRef(getStoredFilters());
	const [filters, setFilters] = useState<ZohoExpenseFilters>(initialFilters.current);

	const [pagination, setPagination] = useState<PaginationData>({
		totalCount: 0,
		pageSize: 50,
		currentPage: 1,
		totalPages: 0,
	});
	const [facets, setFacets] = useState<{
		cities: string[];
		facilityTypes: string[];
		businessUnits: string[];
		categories: string[];
		clientHints: string[];
		statuses: string[];
	}>({
		cities: [],
		facilityTypes: [],
		businessUnits: [],
		categories: [],
		clientHints: [],
		statuses: [],
	});
	const [detailId, setDetailId] = useState<number | null>(null);
	const [summary, setSummary] = useState<{ total_expenses: number; total_amount: number }>({
		total_expenses: 0,
		total_amount: 0,
	});
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		type: 'success' as 'success' | 'error' | 'info',
	});
	const [isImporting, setIsImporting] = useState(false);
	const [refreshDisabledUntil, setRefreshDisabledUntil] = useState<number | null>(null);
	const [refreshCountdown, setRefreshCountdown] = useState(0);

	useEffect(() => {
		if (!refreshDisabledUntil) {
			setRefreshCountdown(0);
			return;
		}
		const tick = () => {
			const left = Math.max(0, Math.ceil((refreshDisabledUntil - Date.now()) / 1000));
			setRefreshCountdown(left);
			if (left === 0) setRefreshDisabledUntil(null);
		};
		tick();
		const id = window.setInterval(tick, 1000);
		return () => window.clearInterval(id);
	}, [refreshDisabledUntil]);

	const fetchExpenses = useCallback(async (currentFilters: ZohoExpenseFilters) => {
		setLoading(true);
		setError(null);
		try {
			const response = await ZohoExpenseApi.getExpenses(currentFilters);
			if (response.statusCode === 200 && response.data) {
				setExpenses(response.data);
				setPagination({
					totalCount: response.pagination.total,
					pageSize: response.pagination.limit,
					currentPage: response.pagination.page,
					totalPages: response.pagination.totalPages,
				});
				if (response.facets) {
					setFacets(response.facets);
				}
				if (response.summary) {
					setSummary({
						total_expenses: Number(response.summary.total_expenses) || 0,
						total_amount: Number(response.summary.total_amount) || 0,
					});
				}
			}
		} catch (err: any) {
			const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch expenses';
			setError(errorMsg);
			setSnackbar({ open: true, message: errorMsg, type: 'error' });
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchExpenses(initialFilters.current);
	}, [fetchExpenses]);

	const handleFilterChange = useCallback(
		(field: keyof ZohoExpenseFilters, value: string) => {
			const updatedFilters = { ...filters, [field]: value, page: 1 };
			setFilters(updatedFilters);
			saveFilters(updatedFilters);
		},
		[filters]
	);

	const handleSearch = useCallback(() => {
		fetchExpenses({ ...filters, page: 1 });
	}, [filters, fetchExpenses]);

	const handleResetFilters = useCallback(() => {
		const defaults = buildDefaultFilters();
		setFilters(defaults);
		saveFilters(defaults);
		fetchExpenses(defaults);
	}, [fetchExpenses]);

	const handleRefreshFromZoho = useCallback(async () => {
		setIsImporting(true);
		const firstImportDone = (() => {
			try {
				return localStorage.getItem(FIRST_IMPORT_KEY) === 'true';
			} catch {
				return false;
			}
		})();
		try {
			const importResponse = await ZohoExpenseApi.importExpenses({
				force: true,
				deep: !firstImportDone,
			});
			if (importResponse.status_code === 200) {
				const count = importResponse.importedCount ?? 0;
				setSnackbar({
					open: true,
					message: count === 0 ? 'Already up to date' : `Successfully imported ${count} expenses`,
					type: 'success',
				});
				try {
					localStorage.setItem(FIRST_IMPORT_KEY, 'true');
				} catch {
					/* non-fatal */
				}
				await fetchExpenses({ ...filters, page: 1 });
			}
		} catch (err: any) {
			const mapped = mapAxiosZohoError(err);
			setSnackbar({
				open: true,
				message: mapped.message,
				type: mapped.kind === 'in_progress' ? 'info' : 'error',
			});
			if (mapped.kind === 'rate_limit') {
				setRefreshDisabledUntil(Date.now() + (mapped.retryAfterSec ?? 60) * 1000);
			} else if (mapped.kind === 'auth') {
				setRefreshDisabledUntil(Number.MAX_SAFE_INTEGER);
			}
		} finally {
			setIsImporting(false);
		}
	}, [filters, fetchExpenses]);

	const handlePageChange = useCallback(
		(newPage: number) => {
			const updatedFilters = { ...filters, page: newPage };
			setFilters(updatedFilters);
			saveFilters(updatedFilters);
			fetchExpenses(updatedFilters);
		},
		[filters, fetchExpenses]
	);

	const handleExportCsv = useCallback(async () => {
		try {
			setSnackbar({ open: true, message: 'Building CSV — fetching all matched rows…', type: 'info' });
			const response = await ZohoExpenseApi.getExpenses({ ...filters, page: 1, limit: 100000 });
			downloadCsv(`zoho_expenses_${new Date().toISOString().slice(0, 10)}.csv`, response.data as any[], [
				{ key: 'date', label: 'Date' },
				{ key: 'vendor_name', label: 'Vendor' },
				{ key: 'customer_name', label: 'Customer' },
				{ key: 'expense_account_name', label: 'Expense Account' },
				{ key: 'expense_category', label: 'Category' },
				{ key: 'total', label: 'Amount' },
				{ key: 'cf_city', label: 'City (Zoho)' },
				{ key: 'derived_city', label: 'City (derived)' },
				{ key: 'cf_facility', label: 'Facility' },
				{ key: 'facility_type', label: 'Facility Type' },
				{ key: 'cf_business_unit', label: 'Business Unit' },
				{ key: 'client_hint', label: 'Client Hint' },
				{ key: 'cf_submitter', label: 'Submitter' },
				{ key: 'status', label: 'Status' },
				{ key: 'reference_number', label: 'Reference' },
				{ key: 'zoho_expense_id', label: 'Zoho Expense ID' },
			]);
			setSnackbar({ open: true, message: `Exported ${response.data.length} expenses`, type: 'success' });
		} catch (err: any) {
			setSnackbar({ open: true, message: err?.message || 'CSV export failed', type: 'error' });
		}
	}, [filters]);

	const cityOptions = [{ label: 'All', value: '' }, ...facets.cities.map(c => ({ label: c, value: c }))];
	const facilityTypeOptions = [
		{ label: 'All', value: '' },
		...facets.facilityTypes.map(f => ({ label: f, value: f })),
	];
	const businessUnitOptions = [
		{ label: 'All', value: '' },
		...facets.businessUnits.map(u => ({ label: u, value: u })),
	];
	const categoryOptions = [
		{ label: 'All', value: '' },
		...facets.categories.map(c => ({ label: c, value: c })),
	];
	const clientHintOptions = [
		{ label: 'All', value: '' },
		...facets.clientHints.map(c => ({ label: c, value: c })),
	];
	const statusOptions = [
		{ label: 'All', value: '' },
		...facets.statuses.map(s => ({ label: s, value: s })),
	];

	const formatINR = (value: number | string | null | undefined) => {
		const n = parseFloat(String(value || 0));
		return `₹ ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	};

	const columns: TableColumn<ZohoExpense>[] = [
		{
			key: 'sno',
			title: 'S.No',
			render: (_, __, index) => index! + 1,
			width: 60,
		},
		{
			key: 'date',
			title: 'Date',
			dataIndex: 'date',
			render: (value) => (value ? new Date(value as string).toLocaleDateString() : '-'),
		},
		{
			key: 'vendor_customer',
			title: 'Vendor / Customer',
			render: (_, record: ZohoExpense) => record.vendor_name || record.customer_name || '-',
		},
		{
			key: 'expense_account_name',
			title: 'Expense Account',
			dataIndex: 'expense_account_name',
		},
		{
			key: 'expense_category',
			title: 'Category',
			dataIndex: 'expense_category',
		},
		{
			key: 'city',
			title: 'City',
			render: (_, record: ZohoExpense) => record.cf_city || record.derived_city || '-',
		},
		{
			key: 'facility',
			title: 'Facility',
			render: (_, record: ZohoExpense) => {
				const ft = record.facility_type || record.derived_facility_type;
				if (!ft) return record.cf_facility || '-';
				const ftColors: Record<string, string> = {
					hub: 'bg-primary-50 text-primary-700',
					mrf: 'bg-success-50 text-success-700',
					customer: 'bg-warning-50 text-warning-700',
				};
				const colorClass = ftColors[ft.toLowerCase()] || 'bg-gray-100 text-gray-600';
				return (
					<span className={`inline-block px-2 py-1 rounded text-xs font-medium ${colorClass}`}>
						{ft}
					</span>
				);
			},
		},
		{
			key: 'submitter',
			title: 'Submitter',
			dataIndex: 'submitter',
		},
		{
			key: 'status',
			title: 'Status',
			render: (_, record: ZohoExpense) => {
				if (!record.status) return '-';
				const statusColors: Record<string, string> = {
					paid: 'bg-success-50 text-success-700',
					unpaid: 'bg-warning-50 text-warning-700',
					reimbursed: 'bg-success-50 text-success-700',
					pending: 'bg-warning-50 text-warning-700',
					rejected: 'bg-error-50 text-error-700',
					draft: 'bg-gray-100 text-gray-600',
				};
				const key = record.status.toLowerCase();
				const colorClass = statusColors[key] || 'bg-gray-100 text-gray-600';
				return (
					<span className={`inline-block px-2 py-1 rounded text-xs font-medium ${colorClass}`}>
						{record.status}
					</span>
				);
			},
		},
		{
			key: 'total',
			title: 'Amount',
			render: (_, record: ZohoExpense) => formatINR(record.total),
		},
		{
			key: 'has_attachment',
			title: '📎',
			width: 40,
			render: (_, record: ZohoExpense) =>
				record.has_attachment ? <span title='Has attachment'>📎</span> : <span className='text-gray-300'>—</span>,
		},
		{
			key: 'zoho_link',
			title: '↗',
			width: 40,
			render: (_, record: ZohoExpense) => (
				<ZohoDeepLink entity='expense' zohoId={record.zoho_expense_id} />
			),
		},
	];

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<PageHeader
					title='Zoho Expenses'
					totalItems={pagination.totalCount}
					itemType='expenses'
					icon='💵'
				/>
				<div className='flex items-center gap-2'>
					<FinanceBriefButton />
					<Button
						onClick={handleExportCsv}
						disabled={loading}
						className='flex items-center gap-2'
						variant='outline'
					>
						<Download className='h-4 w-4' />
						Export CSV
					</Button>
				<div className='flex flex-col items-end gap-1'>
					<Button
						onClick={handleRefreshFromZoho}
						disabled={isImporting || refreshCountdown > 0}
						className='flex items-center gap-2'
						variant='outline'
					>
						<RefreshCw className={`h-4 w-4 ${isImporting ? 'animate-spin' : ''}`} />
						{isImporting
							? 'Refreshing...'
							: refreshCountdown > 0
								? `Retry in ${refreshCountdown}s`
								: 'Refresh from Zoho'}
					</Button>
					<p className='text-xs text-gray-500 max-w-xs text-right'>
						Pulls all expenses modified in Zoho since the last refresh. Date filters above apply only to the list view.
					</p>
				</div>
				</div>
			</div>

			{/* Filters */}
			<Card className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
				<FloatingInput
					label='Start Date'
					type='date'
					value={filters.date_start || ''}
					onChange={(value) => handleFilterChange('date_start', value)}
				/>

				<FloatingInput
					label='End Date'
					type='date'
					value={filters.date_end || ''}
					onChange={(value) => handleFilterChange('date_end', value)}
				/>

				<FloatingInput
					label='Vendor Name'
					placeholder='Search...'
					value={filters.vendor_name || ''}
					onChange={(value) => handleFilterChange('vendor_name', value)}
				/>

				<FloatingInput
					label='Customer Name'
					placeholder='Search...'
					value={filters.customer_name || ''}
					onChange={(value) => handleFilterChange('customer_name', value)}
				/>

				<FloatingInput
					label='Expense Account'
					placeholder='Search...'
					value={filters.expense_account_name || ''}
					onChange={(value) => handleFilterChange('expense_account_name', value)}
				/>

				<FloatingInput
					label='Submitter'
					placeholder='Search...'
					value={filters.submitter || ''}
					onChange={(value) => handleFilterChange('submitter', value)}
				/>

				<MultiSelectDropdown
					label='City'
					options={cityOptions}
					value={filters.city ? filters.city.split(',').filter(Boolean) : []}
					onChange={(values) => handleFilterChange('city', values.join(','))}
					searchable
				/>

				<MultiSelectDropdown
					label='Facility Type'
					options={facilityTypeOptions}
					value={filters.facility_type ? filters.facility_type.split(',').filter(Boolean) : []}
					onChange={(values) => handleFilterChange('facility_type', values.join(','))}
					searchable
				/>

				<MultiSelectDropdown
					label='Business Unit'
					options={businessUnitOptions}
					value={filters.business_unit ? filters.business_unit.split(',').filter(Boolean) : []}
					onChange={(values) => handleFilterChange('business_unit', values.join(','))}
					searchable
				/>

				<MultiSelectDropdown
					label='Category'
					options={categoryOptions}
					value={filters.expense_category ? filters.expense_category.split(',').filter(Boolean) : []}
					onChange={(values) => handleFilterChange('expense_category', values.join(','))}
					searchable
				/>

				<MultiSelectDropdown
					label='Client Hint'
					options={clientHintOptions}
					value={filters.client_hint ? filters.client_hint.split(',').filter(Boolean) : []}
					onChange={(values) => handleFilterChange('client_hint', values.join(','))}
					searchable
				/>

				<MultiSelectDropdown
					label='Status'
					options={statusOptions}
					value={filters.status ? filters.status.split(',').filter(Boolean) : []}
					onChange={(values) => handleFilterChange('status', values.join(','))}
					searchable
				/>

				<div className='flex gap-2 col-span-1 lg:col-span-3'>
					<Button onClick={handleSearch} className='flex-1'>
						Search
					</Button>
					<Button onClick={handleResetFilters} variant='outline' className='flex-1'>
						Reset
					</Button>
				</div>
			</Card>

			{/* Summary strip */}
			<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
				<Card>
					<div className='text-xs text-gray-500'>Total Expenses</div>
					<div className='text-xl font-semibold text-gray-900 mt-1'>
						{summary.total_expenses.toLocaleString('en-IN')}
					</div>
				</Card>
				<Card>
					<div className='text-xs text-gray-500'>Total Amount</div>
					<div className='text-xl font-semibold text-gray-900 mt-1'>{formatINR(summary.total_amount)}</div>
				</Card>
			</div>

			{/* Expenses Table */}
			<Card>
				{loading ? (
					<div className='text-center py-12'>
						<p className='text-foreground-secondary'>Loading expenses...</p>
					</div>
				) : error ? (
					<div className='text-center py-12'>
						<p className='text-error'>{error}</p>
					</div>
				) : expenses.length === 0 ? (
					<div className='text-center py-12'>
						<p className='text-foreground-secondary'>No expenses found</p>
					</div>
				) : (
					<Table
						columns={columns as any}
						data={expenses as any}
						hoverable
						striped
						onRowClick={(record: any) => setDetailId(record.id)}
					/>
				)}
			</Card>

			{/* Pagination */}
			{pagination.totalPages > 1 && (
				<Card className='flex justify-center'>
					<Pagination
						currentPage={pagination.currentPage}
						totalPages={pagination.totalPages}
						totalItems={pagination.totalCount}
						itemsPerPage={pagination.pageSize}
						onPageChange={handlePageChange}
					/>
				</Card>
			)}

			{/* Detail drawer */}
			<ZohoDetailDrawer
				kind='expense'
				id={detailId}
				open={detailId !== null}
				onClose={() => setDetailId(null)}
			/>

			{/* Snackbar */}
			<Snackbar
				open={snackbar.open}
				message={snackbar.message}
				type={snackbar.type}
				autoHideDuration={4000}
				onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
			/>
		</div>
	);
};
