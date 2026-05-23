/**
 * Zoho Vendor Payment Listing Page
 * Displays all vendor payments (Payments Made) from Zoho with filters
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
import {
	ZohoVendorPaymentApi,
	ZohoVendorPayment,
	ZohoVendorPaymentFilters,
} from '../../services/zohoVendorPaymentApi';
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

const STORAGE_KEY = 'zoho_vendor_payment_filters';
const FIRST_IMPORT_KEY = 'zoho_vendor_payment_first_import_done';

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

const buildDefaultFilters = (): ZohoVendorPaymentFilters => {
	const { date_start, date_end } = getCurrentMonthRange();
	return {
		page: 1,
		limit: 50,
		date_start,
		date_end,
		vendor_name: '',
		payment_mode: '',
		paid_through: '',
	};
};

const getStoredFilters = (): ZohoVendorPaymentFilters => {
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

const saveFilters = (filters: ZohoVendorPaymentFilters) => {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
	} catch (error) {
		console.error('Failed to save filters to storage:', error);
	}
};

export const ZohoVendorPaymentList: React.FC = () => {
	const [payments, setPayments] = useState<ZohoVendorPayment[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const initialFilters = useRef(getStoredFilters());
	const [filters, setFilters] = useState<ZohoVendorPaymentFilters>(initialFilters.current);

	const [pagination, setPagination] = useState<PaginationData>({
		totalCount: 0,
		pageSize: 50,
		currentPage: 1,
		totalPages: 0,
	});
	const [facets, setFacets] = useState<{ paymentModes: string[]; paidThroughs: string[] }>({
		paymentModes: [],
		paidThroughs: [],
	});
	const [detailId, setDetailId] = useState<number | null>(null);
	const [summary, setSummary] = useState<{
		total_payments: number;
		total_amount: number;
		mismatch_count: number;
		zero_bills_count: number;
	}>({
		total_payments: 0,
		total_amount: 0,
		mismatch_count: 0,
		zero_bills_count: 0,
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

	const fetchPayments = useCallback(async (currentFilters: ZohoVendorPaymentFilters) => {
		setLoading(true);
		setError(null);
		try {
			const response = await ZohoVendorPaymentApi.getVendorPayments(currentFilters);
			if (response.statusCode === 200 && response.data) {
				setPayments(response.data);
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
						total_payments: Number(response.summary.total_payments) || 0,
						total_amount: Number(response.summary.total_amount) || 0,
						mismatch_count: Number(response.summary.mismatch_count) || 0,
						zero_bills_count: Number(response.summary.zero_bills_count) || 0,
					});
				}
			}
		} catch (err: any) {
			const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch vendor payments';
			setError(errorMsg);
			setSnackbar({ open: true, message: errorMsg, type: 'error' });
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchPayments(initialFilters.current);
	}, [fetchPayments]);

	const handleFilterChange = useCallback(
		(field: keyof ZohoVendorPaymentFilters, value: string) => {
			const updatedFilters = { ...filters, [field]: value, page: 1 };
			setFilters(updatedFilters);
			saveFilters(updatedFilters);
		},
		[filters]
	);

	const handleSearch = useCallback(() => {
		fetchPayments({ ...filters, page: 1 });
	}, [filters, fetchPayments]);

	const handleResetFilters = useCallback(() => {
		const defaults = buildDefaultFilters();
		setFilters(defaults);
		saveFilters(defaults);
		fetchPayments(defaults);
	}, [fetchPayments]);

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
			const importResponse = await ZohoVendorPaymentApi.importVendorPayments({
				force: true,
				deep: !firstImportDone,
			});
			if (importResponse.status_code === 200) {
				const count = importResponse.importedCount ?? 0;
				setSnackbar({
					open: true,
					message: count === 0 ? 'Already up to date' : `Successfully imported ${count} vendor payments`,
					type: 'success',
				});
				try {
					localStorage.setItem(FIRST_IMPORT_KEY, 'true');
				} catch {
					/* non-fatal */
				}
				await fetchPayments({ ...filters, page: 1 });
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
	}, [filters, fetchPayments]);

	const handlePageChange = useCallback(
		(newPage: number) => {
			const updatedFilters = { ...filters, page: newPage };
			setFilters(updatedFilters);
			saveFilters(updatedFilters);
			fetchPayments(updatedFilters);
		},
		[filters, fetchPayments]
	);

	const handleExportCsv = useCallback(async () => {
		try {
			setSnackbar({ open: true, message: 'Building CSV — fetching all matched rows…', type: 'info' });
			const response = await ZohoVendorPaymentApi.getVendorPayments({ ...filters, page: 1, limit: 100000 });
			downloadCsv(
				`zoho_vendor_payments_${new Date().toISOString().slice(0, 10)}.csv`,
				response.data as any[],
				[
					{ key: 'payment_number', label: 'Payment #' },
					{ key: 'payment_date', label: 'Payment Date' },
					{ key: 'vendor_name', label: 'Vendor' },
					{ key: 'amount', label: 'Amount' },
					{ key: 'payment_mode', label: 'Mode' },
					{ key: 'paid_through_account_name', label: 'Paid Through' },
					{ key: 'bills_settled_count', label: 'Bills Settled' },
					{
						key: 'mode_account_mismatch',
						label: 'Mode/Account Mismatch',
						format: (v) => (v ? 'YES' : ''),
					},
					{ key: 'reference_number', label: 'Reference' },
					{ key: 'zoho_payment_id', label: 'Zoho Payment ID' },
				]
			);
			setSnackbar({ open: true, message: `Exported ${response.data.length} payments`, type: 'success' });
		} catch (err: any) {
			setSnackbar({ open: true, message: err?.message || 'CSV export failed', type: 'error' });
		}
	}, [filters]);

	const paymentModeOptions = [
		{ label: 'All', value: '' },
		...facets.paymentModes.map(m => ({ label: m, value: m })),
	];
	const paidThroughOptions = [
		{ label: 'All', value: '' },
		...facets.paidThroughs.map(p => ({ label: p, value: p })),
	];

	const formatINR = (value: number | string | null | undefined) => {
		const n = parseFloat(String(value || 0));
		return `₹ ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	};

	const columns: TableColumn<ZohoVendorPayment>[] = [
		{
			key: 'sno',
			title: 'S.No',
			render: (_, __, index) => index! + 1,
			width: 60,
		},
		{
			key: 'payment_number',
			title: 'Payment #',
			dataIndex: 'payment_number',
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
			key: 'payment_mode',
			title: 'Mode',
			render: (_, record: ZohoVendorPayment) => (
				<span className='inline-flex items-center gap-1'>
					{record.payment_mode}
					{record.mode_account_mismatch ? (
						<span
							title='Payment mode is "Cash" but the paid-through account is a bank/digital account. Source value in Zoho is unchanged — review and fix at source.'
							className='inline-flex items-center justify-center w-4 h-4 rounded-full bg-warning-100 text-warning-700 text-[10px] font-bold cursor-help'
						>
							!
						</span>
					) : null}
				</span>
			),
		},
		{
			key: 'paid_through',
			title: 'Paid Through',
			render: (_, record: ZohoVendorPayment) =>
				record.paid_through_account_name || record.paid_through || '-',
		},
		{
			key: 'amount',
			title: 'Amount',
			render: (_, record: ZohoVendorPayment) => formatINR(record.amount),
		},
		{
			key: 'bills_settled_count',
			title: 'Bills Settled',
			render: (_, record: ZohoVendorPayment) => {
				const n = Number(record.bills_settled_count || 0);
				const tone =
					n === 0 ? 'bg-warning-50 text-warning-700' : 'bg-primary-50 text-primary-700';
				const title =
					n === 0
						? 'No bill is linked to this payment in Zoho — usually an advance/on-account payment.'
						: `Settles ${n} bill${n > 1 ? 's' : ''}`;
				return (
					<span title={title} className={`inline-block px-2 py-1 rounded text-xs font-medium ${tone}`}>
						{n}
					</span>
				);
			},
		},
		{
			key: 'zoho_link',
			title: '↗',
			width: 40,
			render: (_, record: ZohoVendorPayment) => (
				<ZohoDeepLink entity='vendor_payment' zohoId={record.zoho_payment_id} />
			),
		},
	];

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<PageHeader
					title='Zoho Vendor Payments'
					totalItems={pagination.totalCount}
					itemType='payments'
					icon='💸'
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
						Pulls all vendor payments modified in Zoho since the last refresh. Date filters above apply only to the list view.
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
					label='Payment Mode'
					options={paymentModeOptions}
					value={filters.payment_mode ? filters.payment_mode.split(',').filter(Boolean) : []}
					onChange={(values) => handleFilterChange('payment_mode', values.join(','))}
					searchable
				/>

				<MultiSelectDropdown
					label='Paid Through'
					options={paidThroughOptions}
					value={filters.paid_through ? filters.paid_through.split(',').filter(Boolean) : []}
					onChange={(values) => handleFilterChange('paid_through', values.join(','))}
					searchable
				/>

				<div className='flex gap-2'>
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
					<div className='text-xs text-gray-500'>Total Payments</div>
					<div className='text-xl font-semibold text-gray-900 mt-1'>
						{summary.total_payments.toLocaleString('en-IN')}
					</div>
				</Card>
				<Card>
					<div className='text-xs text-gray-500'>Total Amount</div>
					<div className='text-xl font-semibold text-gray-900 mt-1'>{formatINR(summary.total_amount)}</div>
				</Card>
			</div>

			{/* Data-quality banner */}
			{summary.mismatch_count > 0 && (
				<Card className='border-l-4 border-warning-500 bg-warning-50'>
					<div className='flex items-start gap-3 py-2'>
						<span className='inline-flex items-center justify-center w-7 h-7 rounded-full bg-warning-100 text-warning-700 text-base font-bold flex-shrink-0'>
							!
						</span>
						<div className='flex-1'>
							<div className='font-semibold text-warning-900'>
								{summary.mismatch_count} of {summary.total_payments} payments have a Mode/Account mismatch
							</div>
							<div className='text-sm text-warning-800 mt-1'>
								Payment mode is recorded as <strong>Cash</strong>, but the paid-through account is a
								bank/digital/credit-card account. Source data in Zoho is unchanged. Review and fix at source —
								the flag will clear automatically on the next refresh.
							</div>
							<div className='mt-2'>
								<Button
									variant='outline'
									onClick={() => {
										const updated = {
											...filters,
											mismatch_only: (filters.mismatch_only === 'true' ? '' : 'true') as 'true' | '',
											page: 1,
										};
										setFilters(updated);
										saveFilters(updated);
										fetchPayments(updated);
									}}
								>
									{filters.mismatch_only === 'true' ? 'Show all payments' : 'Show only mismatched'}
								</Button>
							</div>
						</div>
					</div>
				</Card>
			)}

			{/* Zero-bills banner */}
			{summary.zero_bills_count > 0 && (
				<Card className='border-l-4 border-info-500 bg-info-50'>
					<div className='flex items-start gap-3 py-2'>
						<span className='inline-flex items-center justify-center w-7 h-7 rounded-full bg-info-100 text-info-700 text-base font-bold flex-shrink-0'>
							i
						</span>
						<div className='flex-1'>
							<div className='font-semibold text-info-900'>
								{summary.zero_bills_count} of {summary.total_payments} payments have no bill attached
							</div>
							<div className='text-sm text-info-800 mt-1'>
								These are payments sent to vendors without a specific bill reference in Zoho — usually
								advances, retainers, or on-account payments. Review to confirm they're intentional vs missing
								bill links.
							</div>
							<div className='mt-2'>
								<Button
									variant='outline'
									onClick={() => {
										const updated = {
											...filters,
											zero_bills_only: (filters.zero_bills_only === 'true' ? '' : 'true') as 'true' | '',
											page: 1,
										};
										setFilters(updated);
										saveFilters(updated);
										fetchPayments(updated);
									}}
								>
									{filters.zero_bills_only === 'true' ? 'Show all payments' : 'Show only zero-bill'}
								</Button>
							</div>
						</div>
					</div>
				</Card>
			)}

			{/* Payments Table */}
			<Card>
				{loading ? (
					<div className='text-center py-12'>
						<p className='text-foreground-secondary'>Loading vendor payments...</p>
					</div>
				) : error ? (
					<div className='text-center py-12'>
						<p className='text-error'>{error}</p>
					</div>
				) : payments.length === 0 ? (
					<div className='text-center py-12'>
						<p className='text-foreground-secondary'>No vendor payments found</p>
					</div>
				) : (
					<Table
						columns={columns as any}
						data={payments as any}
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
				kind='vendor_payment'
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
