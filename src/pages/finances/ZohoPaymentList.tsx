/**
 * Zoho Payment Received Listing Page
 * Displays all customer payments from Zoho with filters
 * Persists filter state to localStorage for page refresh resilience
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
	PageHeader,
	Card,
	FloatingInput,
	FloatingDropdown,
	Pagination,
	Snackbar,
	Button,
} from '../../components/ui';
import { Table } from '../../components/ui/DataDisplay';
import { ZohoPaymentApi, ZohoPayment, ZohoPaymentFilters } from '../../services/zohoPaymentApi';
import { mapAxiosZohoError } from '../../services/zohoErrors';
import type { TableColumn } from '../../components/ui/DataDisplay';
import { RefreshCw } from 'lucide-react';

interface PaginationData {
	totalCount: number;
	pageSize: number;
	currentPage: number;
	totalPages: number;
}

const STORAGE_KEY = 'zoho_payment_filters';
const DEFAULT_FILTERS: ZohoPaymentFilters = {
	page: 1,
	limit: 50,
	date_start: '',
	date_end: '',
	customer_name: '',
	payment_mode: '',
};

const getStoredFilters = (): ZohoPaymentFilters => {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return { ...DEFAULT_FILTERS, ...parsed, page: 1, limit: 50 };
		}
	} catch (error) {
		console.error('Failed to parse stored filters:', error);
	}
	return DEFAULT_FILTERS;
};

const saveFilters = (filters: ZohoPaymentFilters) => {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
	} catch (error) {
		console.error('Failed to save filters to storage:', error);
	}
};

export const ZohoPaymentList: React.FC = () => {
	const [payments, setPayments] = useState<ZohoPayment[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Initialize from localStorage on mount
	const initialFilters = useRef(getStoredFilters());
	const [filters, setFilters] = useState<ZohoPaymentFilters>(initialFilters.current);

	const [pagination, setPagination] = useState<PaginationData>({
		totalCount: 0,
		pageSize: 50,
		currentPage: 1,
		totalPages: 0,
	});
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		type: 'success' as 'success' | 'error',
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

	// Fetch payments
	const fetchPayments = useCallback(async (currentFilters: ZohoPaymentFilters) => {
		setLoading(true);
		setError(null);
		try {
			const response = await ZohoPaymentApi.getCustomerPayments(currentFilters);
			if (response.statusCode === 200 && response.data) {
				setPayments(response.data);
				setPagination({
					totalCount: response.pagination.total,
					pageSize: response.pagination.limit,
					currentPage: response.pagination.page,
					totalPages: response.pagination.totalPages,
				});
			}
		} catch (err: any) {
			const errorMsg =
				err.response?.data?.message || err.message || 'Failed to fetch payments';
			setError(errorMsg);
			setSnackbar({ open: true, message: errorMsg, type: 'error' });
		} finally {
			setLoading(false);
		}
	}, []);

	// Fetch on mount with stored filters
	useEffect(() => {
		fetchPayments(initialFilters.current);
	}, [fetchPayments]);

	// Handle filter changes
	const handleFilterChange = useCallback(
		(field: keyof ZohoPaymentFilters, value: string) => {
			const updatedFilters = { ...filters, [field]: value, page: 1 };
			setFilters(updatedFilters);
			saveFilters(updatedFilters);
		},
		[filters]
	);

	// Handle search button click
	const handleSearch = useCallback(() => {
		// Filters are already updated via handleFilterChange
		// Just fetch with current filters
		fetchPayments({ ...filters, page: 1 });
	}, [filters, fetchPayments]);

	// Handle reset filters
	const handleResetFilters = useCallback(() => {
		setFilters(DEFAULT_FILTERS);
		saveFilters(DEFAULT_FILTERS);
		fetchPayments(DEFAULT_FILTERS);
	}, [fetchPayments]);

	// Handle refresh from Zoho
	const handleRefreshFromZoho = useCallback(async () => {
		if (!filters.date_start || !filters.date_end) {
			setSnackbar({
				open: true,
				message: 'Please set both Start Date and End Date filters before refreshing',
				type: 'error',
			});
			return;
		}

		setIsImporting(true);
		try {
			const importResponse = await ZohoPaymentApi.importCustomerPayments(
				filters.date_start,
				filters.date_end
			);
			if (importResponse.statusCode === 200) {
				const count = importResponse.data?.imported ?? 0;
				setSnackbar({
					open: true,
					message: count === 0 ? 'Already up to date' : `Successfully imported ${count} new payments`,
					type: 'success',
				});
				await fetchPayments({ ...filters, page: 1 });
			}
		} catch (err: any) {
			const mapped = mapAxiosZohoError(err);
			setSnackbar({ open: true, message: mapped.message, type: 'error' });
			if (mapped.kind === 'rate_limit') {
				setRefreshDisabledUntil(Date.now() + (mapped.retryAfterSec ?? 60) * 1000);
			} else if (mapped.kind === 'auth') {
				setRefreshDisabledUntil(Number.MAX_SAFE_INTEGER);
			}
		} finally {
			setIsImporting(false);
		}
	}, [filters, fetchPayments]);

	// Handle pagination
	const handlePageChange = useCallback(
		(newPage: number) => {
			const updatedFilters = { ...filters, page: newPage };
			setFilters(updatedFilters);
			saveFilters(updatedFilters);
			fetchPayments(updatedFilters);
		},
		[filters, fetchPayments]
	);

	// Payment modes for dropdown
	const paymentModes = [
		{ label: 'All', value: '' },
		{ label: 'Cash', value: 'Cash' },
		{ label: 'Check', value: 'Check' },
		{ label: 'Credit Card', value: 'Credit Card' },
		{ label: 'Debit Card', value: 'Debit Card' },
		{ label: 'Net Banking', value: 'Net Banking' },
		{ label: 'Wire Transfer', value: 'Wire Transfer' },
		{ label: 'NEFT', value: 'NEFT' },
		{ label: 'RTGS', value: 'RTGS' },
	];

	// Table columns
	const columns: TableColumn<ZohoPayment>[] = [
		{
			key: 'sno',
			title: 'S.No',
			render: (_, __, index) => index! + 1,
			width: 60,
		},
		{
			key: 'payment_date',
			title: 'Payment Date',
			dataIndex: 'payment_date',
			render: (value) => new Date(value as string).toLocaleDateString(),
		},
		{
			key: 'payment_number',
			title: 'Payment #',
			dataIndex: 'payment_number',
		},
		{
			key: 'customer_name',
			title: 'Customer',
			dataIndex: 'customer_name',
		},
		{
			key: 'amount',
			title: 'Amount',
			render: (_, record: ZohoPayment) => {
				const amount = parseFloat(String(record.amount || 0));
				return `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
			},
		},
		{
			key: 'account_name',
			title: 'Account',
			dataIndex: 'account_name',
		},
		{
			key: 'invoice_numbers',
			title: 'Invoices',
			dataIndex: 'invoice_numbers',
		},
		{
			key: 'payment_status',
			title: 'Status',
			render: (_, record: ZohoPayment) => (
				<span
					className={`inline-block px-2 py-1 rounded text-xs font-medium ${
						record.payment_status === 'paid'
							? 'bg-success-50 text-success-700'
							: 'bg-warning-50 text-warning-700'
					}`}
				>
					{record.payment_status}
				</span>
			),
		},
		{
			key: 'payment_mode',
			title: 'Mode',
			dataIndex: 'payment_mode',
		},
	];

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<PageHeader
					title='Zoho Payment Received'
					totalItems={pagination.totalCount}
					itemType='payments'
					icon='💰'
				/>
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
			</div>

			{/* Filters */}
			<Card className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
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
					label='Customer Name'
					placeholder='Search...'
					value={filters.customer_name || ''}
					onChange={(value) => handleFilterChange('customer_name', value)}
				/>

				<FloatingDropdown
					label='Payment Mode'
					options={paymentModes}
					value={filters.payment_mode || ''}
					onChange={(value) => handleFilterChange('payment_mode', value)}
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

			{/* Payments Table */}
			<Card>
				{loading ? (
					<div className='text-center py-12'>
						<p className='text-foreground-secondary'>Loading payments...</p>
					</div>
				) : error ? (
					<div className='text-center py-12'>
						<p className='text-error'>{error}</p>
					</div>
				) : payments.length === 0 ? (
					<div className='text-center py-12'>
						<p className='text-foreground-secondary'>No payments found</p>
					</div>
				) : (
					<Table
						columns={columns as any}
						data={payments as any}
						hoverable
						striped
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
