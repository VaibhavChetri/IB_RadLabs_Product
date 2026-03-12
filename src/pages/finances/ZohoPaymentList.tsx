/**
 * Zoho Payment Received Listing Page
 * Displays all customer payments from Zoho with filters
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
	PageHeader,
	Card,
	FloatingInput,
	FloatingDropdown,
	Pagination,
	Snackbar,
} from '../../components/ui';
import { Table } from '../../components/ui/DataDisplay';
import { ZohoPaymentApi, ZohoPayment, ZohoPaymentFilters } from '../../services/zohoPaymentApi';
import type { TableColumn } from '../../components/ui/DataDisplay';

interface PaginationData {
	totalCount: number;
	pageSize: number;
	currentPage: number;
	totalPages: number;
}

export const ZohoPaymentList: React.FC = () => {
	const [payments, setPayments] = useState<ZohoPayment[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [filters, setFilters] = useState<ZohoPaymentFilters>({
		page: 1,
		limit: 50,
		date_start: '',
		date_end: '',
		customer_name: '',
		payment_mode: '',
	});
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

	// Fetch payments
	const fetchPayments = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await ZohoPaymentApi.getCustomerPayments(filters);
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
	}, [filters]);

	useEffect(() => {
		fetchPayments();
	}, [fetchPayments]);

	// Handle filter changes
	const handleFilterChange = (field: keyof ZohoPaymentFilters, value: string) => {
		setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
	};

	// Handle pagination
	const handlePageChange = (newPage: number) => {
		setFilters(prev => ({ ...prev, page: newPage }));
	};

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
			key: 'payment_mode',
			title: 'Mode',
			dataIndex: 'payment_mode',
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
	];

	return (
		<div className='space-y-6'>
			<PageHeader
				title='Zoho Payment Received'
				totalItems={pagination.totalCount}
				itemType='payments'
				icon='💰'
			/>

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

				<button
					onClick={() => {
						setFilters({ page: 1, limit: 50, date_start: '', date_end: '', customer_name: '', payment_mode: '' });
					}}
					className='px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition'
				>
					Reset Filters
				</button>
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
