/**
 * Zoho Bill Listing Page
 * Displays all bills (AP / vendor invoices) from Zoho with filters
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
import { ZohoBillApi, ZohoBill, ZohoBillFilters } from '../../services/zohoBillApi';
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

const STORAGE_KEY = 'zoho_bill_filters';
const FIRST_IMPORT_KEY = 'zoho_bill_first_import_done';

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

const buildDefaultFilters = (): ZohoBillFilters => {
	const { date_start, date_end } = getCurrentMonthRange();
	return {
		page: 1,
		limit: 50,
		date_start,
		date_end,
		vendor_name: '',
		status: '',
		city: '',
		facility_type: '',
		business_unit: '',
		nature_of_expense: '',
		expense_category: '',
		client_hint: '',
	};
};

const getStoredFilters = (): ZohoBillFilters => {
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

const saveFilters = (filters: ZohoBillFilters) => {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
	} catch (error) {
		console.error('Failed to save filters to storage:', error);
	}
};

export const ZohoBillList: React.FC = () => {
	const [bills, setBills] = useState<ZohoBill[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const initialFilters = useRef(getStoredFilters());
	const [filters, setFilters] = useState<ZohoBillFilters>(initialFilters.current);

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
		statuses: string[];
		categories: string[];
		clientHints: string[];
		naturesOfExpense: string[];
	}>({
		cities: [],
		facilityTypes: [],
		businessUnits: [],
		statuses: [],
		categories: [],
		clientHints: [],
		naturesOfExpense: [],
	});
	const [detailId, setDetailId] = useState<number | null>(null);
	const [summary, setSummary] = useState<{ total_bills: number; total_amount: number; total_outstanding: number }>({
		total_bills: 0,
		total_amount: 0,
		total_outstanding: 0,
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

	// Fetch bills
	const fetchBills = useCallback(async (currentFilters: ZohoBillFilters) => {
		setLoading(true);
		setError(null);
		try {
			const response = await ZohoBillApi.getBills(currentFilters);
			if (response.statusCode === 200 && response.data) {
				setBills(response.data);
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
						total_bills: Number(response.summary.total_bills) || 0,
						total_amount: Number(response.summary.total_amount) || 0,
						total_outstanding: Number(response.summary.total_outstanding) || 0,
					});
				}
			}
		} catch (err: any) {
			const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch bills';
			setError(errorMsg);
			setSnackbar({ open: true, message: errorMsg, type: 'error' });
		} finally {
			setLoading(false);
		}
	}, []);

	// Fetch on mount with stored filters
	useEffect(() => {
		fetchBills(initialFilters.current);
	}, [fetchBills]);

	// Handle filter changes
	const handleFilterChange = useCallback(
		(field: keyof ZohoBillFilters, value: string) => {
			const updatedFilters = { ...filters, [field]: value, page: 1 };
			setFilters(updatedFilters);
			saveFilters(updatedFilters);
		},
		[filters]
	);

	// Handle search button click
	const handleSearch = useCallback(() => {
		fetchBills({ ...filters, page: 1 });
	}, [filters, fetchBills]);

	// Handle reset filters
	const handleResetFilters = useCallback(() => {
		const defaults = buildDefaultFilters();
		setFilters(defaults);
		saveFilters(defaults);
		fetchBills(defaults);
	}, [fetchBills]);

	// Handle refresh from Zoho — pass ?force=true&deep=true ONLY on first import,
	// subsequent clicks default to ?force=true
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
			const importResponse = await ZohoBillApi.importBills({
				force: true,
				deep: !firstImportDone,
			});
			if (importResponse.status_code === 200) {
				const count = importResponse.importedCount ?? 0;
				setSnackbar({
					open: true,
					message: count === 0 ? 'Already up to date' : `Successfully imported ${count} bills`,
					type: 'success',
				});
				try {
					localStorage.setItem(FIRST_IMPORT_KEY, 'true');
				} catch {
					/* localStorage unavailable — non-fatal */
				}
				await fetchBills({ ...filters, page: 1 });
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
	}, [filters, fetchBills]);

	// Handle pagination
	const handlePageChange = useCallback(
		(newPage: number) => {
			const updatedFilters = { ...filters, page: newPage };
			setFilters(updatedFilters);
			saveFilters(updatedFilters);
			fetchBills(updatedFilters);
		},
		[filters, fetchBills]
	);

	// CSV export — fetch ALL rows matching the current filter (up to 100,000)
	// and stream them to a downloaded file. Does NOT change the table on screen.
	const handleExportCsv = useCallback(async () => {
		try {
			setSnackbar({ open: true, message: 'Building CSV — fetching all matched rows…', type: 'info' });
			const response = await ZohoBillApi.getBills({ ...filters, page: 1, limit: 100000 });
			downloadCsv(`zoho_bills_${new Date().toISOString().slice(0, 10)}.csv`, response.data as any[], [
				{ key: 'bill_number', label: 'Bill #' },
				{ key: 'date', label: 'Bill Date' },
				{ key: 'due_date', label: 'Due Date' },
				{ key: 'vendor_name', label: 'Vendor' },
				{ key: 'status', label: 'Status' },
				{ key: 'total', label: 'Total' },
				{ key: 'balance', label: 'Outstanding' },
				{ key: 'cf_city', label: 'City' },
				{ key: 'cf_facility', label: 'Facility' },
				{ key: 'facility_type', label: 'Facility Type' },
				{ key: 'cf_business_unit', label: 'Business Unit' },
				{ key: 'cf_nature_of_expense', label: 'Nature' },
				{ key: 'cf_approver', label: 'Approver' },
				{ key: 'reference_number', label: 'Reference' },
				{ key: 'has_attachment', label: 'Has Attachment' },
				{ key: 'zoho_bill_id', label: 'Zoho Bill ID' },
			]);
			setSnackbar({
				open: true,
				message: `Exported ${response.data.length} bills`,
				type: 'success',
			});
		} catch (err: any) {
			setSnackbar({
				open: true,
				message: err?.message || 'CSV export failed',
				type: 'error',
			});
		}
	}, [filters]);

	// Dynamic facet-driven dropdown options
	const cityOptions = [{ label: 'All', value: '' }, ...facets.cities.map(c => ({ label: c, value: c }))];
	const facilityTypeOptions = [
		{ label: 'All', value: '' },
		...facets.facilityTypes.map(f => ({ label: f, value: f })),
	];
	const businessUnitOptions = [
		{ label: 'All', value: '' },
		...facets.businessUnits.map(u => ({ label: u, value: u })),
	];
	const statusOptions = [{ label: 'All', value: '' }, ...facets.statuses.map(s => ({ label: s, value: s }))];
	const categoryOptions = [
		{ label: 'All', value: '' },
		...facets.categories.map(c => ({ label: c, value: c })),
	];
	const clientHintOptions = [
		{ label: 'All', value: '' },
		...facets.clientHints.map(c => ({ label: c, value: c })),
	];
	const natureOptions = [
		{ label: 'All', value: '' },
		...facets.naturesOfExpense.map(n => ({ label: n, value: n })),
	];

	const formatINR = (value: number | string | null | undefined) => {
		const n = parseFloat(String(value || 0));
		return `₹ ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	};

	// Table columns
	const columns: TableColumn<ZohoBill>[] = [
		{
			key: 'sno',
			title: 'S.No',
			render: (_, __, index) => index! + 1,
			width: 60,
		},
		{
			key: 'bill_number',
			title: 'Bill #',
			dataIndex: 'bill_number',
		},
		{
			key: 'vendor_name',
			title: 'Vendor',
			dataIndex: 'vendor_name',
		},
		{
			key: 'date',
			title: 'Date',
			dataIndex: 'date',
			render: (value) => (value ? new Date(value as string).toLocaleDateString() : '-'),
		},
		{
			key: 'due_date',
			title: 'Due Date',
			dataIndex: 'due_date',
			render: (value) => (value ? new Date(value as string).toLocaleDateString() : '-'),
		},
		{
			key: 'cf_city',
			title: 'City',
			dataIndex: 'cf_city',
		},
		{
			key: 'facility_type',
			title: 'Facility Type',
			render: (_, record: ZohoBill) => {
				if (!record.facility_type) return '-';
				const ftColors: Record<string, string> = {
					hub: 'bg-primary-50 text-primary-700',
					mrf: 'bg-success-50 text-success-700',
					customer: 'bg-warning-50 text-warning-700',
				};
				const key = record.facility_type.toLowerCase();
				const colorClass = ftColors[key] || 'bg-gray-100 text-gray-600';
				return (
					<span className={`inline-block px-2 py-1 rounded text-xs font-medium ${colorClass}`}>
						{record.facility_type}
					</span>
				);
			},
		},
		{
			key: 'cf_business_unit',
			title: 'Business Unit',
			dataIndex: 'cf_business_unit',
		},
		{
			key: 'status',
			title: 'Status',
			render: (_, record: ZohoBill) => {
				const statusColors: Record<string, string> = {
					paid: 'bg-success-50 text-success-700',
					open: 'bg-primary-50 text-primary-700',
					overdue: 'bg-error-50 text-error-700',
					partially_paid: 'bg-warning-50 text-warning-700',
					draft: 'bg-gray-100 text-gray-600',
					void: 'bg-gray-100 text-gray-600',
				};
				const key = (record.status || '').toLowerCase();
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
			title: 'Total',
			render: (_, record: ZohoBill) => formatINR(record.total),
		},
		{
			key: 'balance',
			title: 'Balance',
			render: (_, record: ZohoBill) => formatINR(record.balance),
		},
		{
			key: 'has_attachment',
			title: '📎',
			width: 40,
			render: (_, record: ZohoBill) =>
				record.has_attachment ? <span title='Has attachment'>📎</span> : <span className='text-gray-300'>—</span>,
		},
		{
			key: 'zoho_link',
			title: '↗',
			width: 40,
			render: (_, record: ZohoBill) => <ZohoDeepLink entity='bill' zohoId={record.zoho_bill_id} />,
		},
	];

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<PageHeader
					title='Zoho Bills'
					totalItems={pagination.totalCount}
					itemType='bills'
					icon='🧾'
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
							Pulls all bills modified in Zoho since the last refresh. Date filters above apply only to the list view.
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
					label='Status'
					options={statusOptions}
					value={filters.status ? filters.status.split(',').filter(Boolean) : []}
					onChange={(values) => handleFilterChange('status', values.join(','))}
					searchable
				/>

				<MultiSelectDropdown
					label='Expense Category'
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
					label='Nature of Expense'
					options={natureOptions}
					value={filters.nature_of_expense ? filters.nature_of_expense.split(',').filter(Boolean) : []}
					onChange={(values) => handleFilterChange('nature_of_expense', values.join(','))}
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
			<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
				<Card>
					<div className='text-xs text-gray-500'>Total Bills</div>
					<div className='text-xl font-semibold text-gray-900 mt-1'>{summary.total_bills.toLocaleString('en-IN')}</div>
				</Card>
				<Card>
					<div className='text-xs text-gray-500'>Total Amount</div>
					<div className='text-xl font-semibold text-gray-900 mt-1'>{formatINR(summary.total_amount)}</div>
				</Card>
				<Card>
					<div className='text-xs text-gray-500'>Outstanding</div>
					<div className='text-xl font-semibold text-error-700 mt-1'>{formatINR(summary.total_outstanding)}</div>
				</Card>
			</div>

			{/* Bills Table */}
			<Card>
				{loading ? (
					<div className='text-center py-12'>
						<p className='text-foreground-secondary'>Loading bills...</p>
					</div>
				) : error ? (
					<div className='text-center py-12'>
						<p className='text-error'>{error}</p>
					</div>
				) : bills.length === 0 ? (
					<div className='text-center py-12'>
						<p className='text-foreground-secondary'>No bills found</p>
					</div>
				) : (
					<Table
						columns={columns as any}
						data={bills as any}
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
			<ZohoDetailDrawer kind='bill' id={detailId} open={detailId !== null} onClose={() => setDetailId(null)} />

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
