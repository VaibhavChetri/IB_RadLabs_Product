/**
 * Zoho Invoice Listing Page
 * Displays all invoices from Zoho with filters
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
import { ZohoInvoiceApi, ZohoInvoice, ZohoInvoiceFilters } from '../../services/zohoInvoiceApi';
import type { TableColumn } from '../../components/ui/DataDisplay';
import { RefreshCw } from 'lucide-react';

interface PaginationData {
	totalCount: number;
	pageSize: number;
	currentPage: number;
	totalPages: number;
}

const STORAGE_KEY = 'zoho_invoice_filters';

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

const buildDefaultFilters = (): ZohoInvoiceFilters => {
	const { date_start, date_end } = getCurrentMonthRange();
	return {
		page: 1,
		limit: 50,
		invoice_date: '',
		date_start,
		date_end,
		customer_name: '',
		status: '',
		branch_code: '',
		business_unit: '',
		place_of_supply: '',
	};
};

const getStoredFilters = (): ZohoInvoiceFilters => {
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

const saveFilters = (filters: ZohoInvoiceFilters) => {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
	} catch (error) {
		console.error('Failed to save filters to storage:', error);
	}
};

export const ZohoInvoiceList: React.FC = () => {
	const [invoices, setInvoices] = useState<ZohoInvoice[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Initialize from localStorage on mount
	const initialFilters = useRef(getStoredFilters());
	const [filters, setFilters] = useState<ZohoInvoiceFilters>(initialFilters.current);

	const [pagination, setPagination] = useState<PaginationData>({
		totalCount: 0,
		pageSize: 50,
		currentPage: 1,
		totalPages: 0,
	});
	const [facets, setFacets] = useState<{ branches: string[]; businessUnits: string[]; placesOfSupply: string[] }>({
		branches: [],
		businessUnits: [],
		placesOfSupply: [],
	});
	const [summary, setSummary] = useState<{ totalInvoiceAmount: number }>({ totalInvoiceAmount: 0 });
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		type: 'success' as 'success' | 'error',
	});
	const [isImporting, setIsImporting] = useState(false);

	// Fetch invoices
	const fetchInvoices = useCallback(async (currentFilters: ZohoInvoiceFilters) => {
		setLoading(true);
		setError(null);
		setSelectedIds(new Set()); // Clear selection on fetch
		try {
			const response = await ZohoInvoiceApi.getInvoices(currentFilters);
			if (response.statusCode === 200 && response.data) {
				setInvoices(response.data);
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
					setSummary(response.summary);
				}
			}
		} catch (err: any) {
			const errorMsg =
				err.response?.data?.message || err.message || 'Failed to fetch invoices';
			setError(errorMsg);
			setSnackbar({ open: true, message: errorMsg, type: 'error' });
		} finally {
			setLoading(false);
		}
	}, []);

	// Fetch on mount with stored filters
	useEffect(() => {
		fetchInvoices(initialFilters.current);
	}, [fetchInvoices]);

	// Handle filter changes
	const handleFilterChange = useCallback(
		(field: keyof ZohoInvoiceFilters, value: string) => {
			const updatedFilters = { ...filters, [field]: value, page: 1 };
			setFilters(updatedFilters);
			saveFilters(updatedFilters);
		},
		[filters]
	);

	// Handle search button click
	const handleSearch = useCallback(() => {
		fetchInvoices({ ...filters, page: 1 });
	}, [filters, fetchInvoices]);

	// Handle reset filters
	const handleResetFilters = useCallback(() => {
		const defaults = buildDefaultFilters();
		setFilters(defaults);
		saveFilters(defaults);
		fetchInvoices(defaults);
	}, [fetchInvoices]);

	// Handle refresh from Zoho
	const handleRefreshFromZoho = useCallback(async () => {
		// Check if both date filters are set in current filters state
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
			// Call import API with filtered dates
			const importResponse = await ZohoInvoiceApi.importInvoices(
				filters.date_start,
				filters.date_end
			);
			if (importResponse.status_code === 200) {
				setSnackbar({
					open: true,
					message: `Successfully imported ${importResponse.importedCount} invoices`,
					type: 'success',
				});

				// Fetch the updated invoice list
				await fetchInvoices({ ...filters, page: 1 });
			}
		} catch (err: any) {
			const errorMsg =
				err.response?.data?.message || err.message || 'Failed to refresh invoices from Zoho';
			setSnackbar({ open: true, message: errorMsg, type: 'error' });
		} finally {
			setIsImporting(false);
		}
	}, [filters, fetchInvoices]);

	// Handle pagination
	const handlePageChange = useCallback(
		(newPage: number) => {
			const updatedFilters = { ...filters, page: newPage };
			setFilters(updatedFilters);
			saveFilters(updatedFilters);
			fetchInvoices(updatedFilters);
		},
		[filters, fetchInvoices]
	);

	// Status tabs configuration
	const statusTabs = [
		{ label: 'All', value: '' },
		{ label: 'Sent', value: 'sent' },
		{ label: 'Paid', value: 'paid' },
		{ label: 'Overdue', value: 'overdue' },
		{ label: 'Draft', value: 'draft' },
		{ label: 'Void', value: 'void' },
	];

	// Handle status tab click (multi-select toggle)
	const handleStatusTabClick = useCallback((statusValue: string) => {
		let newStatus: string;
		if (statusValue === '') {
			newStatus = ''; // All - clears all selections
		} else {
			const current = filters.status ? filters.status.split(',').filter(Boolean) : [];
			const idx = current.indexOf(statusValue);
			if (idx >= 0) {
				// Remove if already selected
				const next = current.filter(s => s !== statusValue);
				newStatus = next.join(',');
			} else {
				// Add if not selected
				newStatus = [...current, statusValue].join(',');
			}
		}
		const updatedFilters = { ...filters, status: newStatus, page: 1 };
		setFilters(updatedFilters);
		saveFilters(updatedFilters);
		fetchInvoices(updatedFilters);
	}, [filters, fetchInvoices]);

	// Branch code options for dropdown (dynamic from facets)
	const branchCodeOptions = [
		{ label: 'All', value: '' },
		...facets.branches.map(b => ({ label: b, value: b })),
	];

	// Business unit options for dropdown (dynamic from facets)
	const businessUnitOptions = [
		{ label: 'All', value: '' },
		...facets.businessUnits.map(u => ({ label: u, value: u })),
	];

	// Place of supply options for dropdown (dynamic from facets)
	const placeOfSupplyOptions = [
		{ label: 'All', value: '' },
		...facets.placesOfSupply.map(p => ({ label: p, value: p })),
	];

	// Compute selected total
	const selectedTotal = invoices
		.filter(inv => selectedIds.has(inv.id))
		.reduce((sum, inv) => sum + parseFloat(String(inv.total || 0)), 0);

	// Table columns
	const columns: TableColumn<ZohoInvoice>[] = [
		{
			key: 'select',
			title: '',
			render: (_, record: ZohoInvoice) => (
				<input
					type='checkbox'
					checked={selectedIds.has(record.id)}
					onChange={() => {
						setSelectedIds(prev => {
							const next = new Set(prev);
							if (next.has(record.id)) next.delete(record.id);
							else next.add(record.id);
							return next;
						});
					}}
					className='cursor-pointer'
				/>
			),
			width: 40,
		},
		{
			key: 'sno',
			title: 'S.No',
			render: (_, __, index) => index! + 1,
			width: 60,
		},
		{
			key: 'invoice_date',
			title: 'Invoice Date',
			dataIndex: 'invoice_date',
			render: (value) => new Date(value as string).toLocaleDateString(),
		},
		{
			key: 'invoice_number',
			title: 'Invoice #',
			dataIndex: 'invoice_number',
		},
		{
			key: 'customer_name',
			title: 'Customer',
			dataIndex: 'customer_name',
		},
		{
			key: 'status',
			title: 'Status',
			render: (_, record: ZohoInvoice) => {
				const statusColors: Record<string, string> = {
					paid: 'bg-success-50 text-success-700',
					sent: 'bg-primary-50 text-primary-700',
					overdue: 'bg-error-50 text-error-700',
					draft: 'bg-gray-100 text-gray-600',
					void: 'bg-gray-100 text-gray-600',
				};
				const colorClass = statusColors[record.status] || 'bg-gray-100 text-gray-600';
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
			render: (_, record: ZohoInvoice) => {
				const total = parseFloat(String(record.total || 0));
				return `₹ ${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
			},
		},
		{
			key: 'balance',
			title: 'Balance',
			render: (_, record: ZohoInvoice) => {
				const balance = parseFloat(String(record.balance || 0));
				return `₹ ${balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
			},
		},
		{
			key: 'due_date',
			title: 'Due Date',
			dataIndex: 'due_date',
			render: (value) => new Date(value as string).toLocaleDateString(),
		},
		{
			key: 'due_days',
			title: 'Due Days',
			dataIndex: 'due_days',
		},
		{
			key: 'cf_branch_of_invoice',
			title: 'Branch',
			dataIndex: 'cf_branch_of_invoice',
		},
		{
			key: 'cf_business_unit',
			title: 'Business Unit',
			dataIndex: 'cf_business_unit',
		},
		{
			key: 'key_account_manager',
			title: 'Key Account Manager',
			dataIndex: 'key_account_manager',
		},
		{
			key: 'place_of_service_supply',
			title: 'Place of Supply',
			dataIndex: 'place_of_service_supply',
		},
		{
			key: 'reference_number',
			title: 'Reference',
			dataIndex: 'reference_number',
		},
	];

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<PageHeader
					title='Zoho Invoices'
					totalItems={pagination.totalCount}
					itemType='invoices'
					icon='📄'
				/>
				<Button
					onClick={handleRefreshFromZoho}
					disabled={isImporting}
					className='flex items-center gap-2'
					variant='outline'
				>
					<RefreshCw className={`h-4 w-4 ${isImporting ? 'animate-spin' : ''}`} />
					{isImporting ? 'Refreshing...' : 'Refresh from Zoho'}
				</Button>
			</div>

			{/* Status Tabs - Multi-select */}
			<div className='flex gap-2 overflow-x-auto pb-2'>
				{statusTabs.map((tab) => {
					const activeStatuses = filters.status ? filters.status.split(',').filter(Boolean) : [];
					const isActive = tab.value === '' ? activeStatuses.length === 0 : activeStatuses.includes(tab.value);
					return (
						<button
							key={tab.value}
							onClick={() => handleStatusTabClick(tab.value)}
							className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${
								isActive
									? 'bg-primary-500 text-white'
									: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
							}`}
						>
							{tab.label}
						</button>
					);
				})}
			</div>

			{/* Filters */}
			<Card className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
				<FloatingInput
					label='Invoice Date'
					type='date'
					value={filters.invoice_date || ''}
					onChange={(value) => {
						// Clear range filters when setting single date
						const updatedFilters = { ...filters, invoice_date: value, date_start: '', date_end: '' };
						setFilters(updatedFilters);
						saveFilters(updatedFilters);
					}}
				/>

				<FloatingInput
					label='Start Date'
					type='date'
					value={filters.date_start || ''}
					onChange={(value) => {
						// Clear single date when setting range
						const updatedFilters = { ...filters, date_start: value, invoice_date: '' };
						setFilters(updatedFilters);
						saveFilters(updatedFilters);
					}}
				/>

				<FloatingInput
					label='End Date'
					type='date'
					value={filters.date_end || ''}
					onChange={(value) => {
						// Clear single date when setting range
						const updatedFilters = { ...filters, date_end: value, invoice_date: '' };
						setFilters(updatedFilters);
						saveFilters(updatedFilters);
					}}
				/>

				<FloatingInput
					label='Customer Name'
					placeholder='Search...'
					value={filters.customer_name || ''}
					onChange={(value) => handleFilterChange('customer_name', value)}
				/>

				<MultiSelectDropdown
					label='Branch Code'
					options={branchCodeOptions}
					value={filters.branch_code ? filters.branch_code.split(',').filter(Boolean) : []}
					onChange={(values) => handleFilterChange('branch_code', values.join(','))}
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
					label='Place of Supply'
					options={placeOfSupplyOptions}
					value={filters.place_of_supply ? filters.place_of_supply.split(',').filter(Boolean) : []}
					onChange={(values) => handleFilterChange('place_of_supply', values.join(','))}
					searchable
				/>

				<div className='flex gap-2 col-span-1 lg:col-span-4'>
					<Button onClick={handleSearch} className='flex-1'>
						Search
					</Button>
					<Button onClick={handleResetFilters} variant='outline' className='flex-1'>
						Reset
					</Button>
				</div>
			</Card>

			{/* Summary Cards */}
			<div className='flex justify-between items-center gap-4'>
				<div className='text-sm text-gray-500'>
					Total (filtered):
					<span className='ml-2 font-semibold text-gray-900'>
						₹ {summary.totalInvoiceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
					</span>
				</div>
				{selectedIds.size > 0 && (
					<div className='text-sm text-primary-600'>
						Selected ({selectedIds.size}):
						<span className='ml-2 font-semibold'>
							₹ {selectedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
						</span>
					</div>
				)}
			</div>

			{/* Invoices Table */}
			<Card>
				{loading ? (
					<div className='text-center py-12'>
						<p className='text-foreground-secondary'>Loading invoices...</p>
					</div>
				) : error ? (
					<div className='text-center py-12'>
						<p className='text-error'>{error}</p>
					</div>
				) : invoices.length === 0 ? (
					<div className='text-center py-12'>
						<p className='text-foreground-secondary'>No invoices found</p>
					</div>
				) : (
					<Table
						columns={columns as any}
						data={invoices as any}
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
