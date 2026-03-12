/**
 * Amazon Invoice List – Finances > Amazon Invoice
 * Lists Amazon invoices with filters, sort, pagination. Row click expands accordion with summary + line items.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
	FloatingInput,
	FloatingDropdown,
	PageHeader,
	Button,
	Pagination,
} from '../../components/ui';
import { AmazonInvoicesApiService } from '../../services/amazonInvoicesApi';
import type {
	AmazonInvoiceListItem,
	AmazonInvoiceFiltersData,
	ListInvoicesParams,
	PaginationMeta,
	AmazonInvoiceDetail,
} from '../../services/amazonInvoicesApi';
import { exportToExcel } from '../../utils/excelExport';
import { Search, Loader2, Download, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../../utils/cn';

const DEFAULT_PAGE = 1;
const EXPORT_PAGE_LIMIT = 10000;

/** Format ISO or date string to DD/MM/YYYY for display and export */
function formatInvoiceDate(value: string | null | undefined): string {
	if (!value) return '—';
	try {
		const d = new Date(value);
		if (Number.isNaN(d.getTime())) return value;
		const day = String(d.getDate()).padStart(2, '0');
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const year = d.getFullYear();
		return `${day}/${month}/${year}`;
	} catch {
		return value;
	}
}
const DEFAULT_LIMIT = 20;

const AmazonInvoiceList: React.FC = () => {
	const [invoices, setInvoices] = useState<AmazonInvoiceListItem[]>([]);
	const [pagination, setPagination] = useState<PaginationMeta | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [filterOptions, setFilterOptions] = useState<AmazonInvoiceFiltersData | null>(null);
	const [loadingFilters, setLoadingFilters] = useState(true);

	const [page, setPage] = useState(DEFAULT_PAGE);
	const [pageSize, setPageSize] = useState(DEFAULT_LIMIT);
	const [search, setSearch] = useState('');
	const [sortBy, setSortBy] = useState<string>('invoice_date');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	const [dateFrom, setDateFrom] = useState('');
	const [dateTo, setDateTo] = useState('');
	const [sellerGstin, setSellerGstin] = useState('');
	const [documentType, setDocumentType] = useState('');
	const [minTotal, setMinTotal] = useState<number | ''>('');
	const [maxTotal, setMaxTotal] = useState<number | ''>('');
	const [exporting, setExporting] = useState(false);

	/** Expanded row: invoice_number or null. Detail is fetched and cached. */
	const [openAccordion, setOpenAccordion] = useState<string | null>(null);
	const [detailCache, setDetailCache] = useState<Record<string, AmazonInvoiceDetail | null>>({});
	const [detailLoading, setDetailLoading] = useState<string | null>(null);

	// Load filter options once
	useEffect(() => {
		let cancelled = false;
		const loadFilters = async () => {
			setLoadingFilters(true);
			try {
				const res = await AmazonInvoicesApiService.getFilters();
				if (res?.data && !cancelled) {
					setFilterOptions(res.data);
					if (res.data.range) {
						if (!dateFrom && res.data.range.min_invoice_date)
							setDateFrom(res.data.range.min_invoice_date);
						if (!dateTo && res.data.range.max_invoice_date)
							setDateTo(res.data.range.max_invoice_date);
					}
				}
			} catch (e) {
				if (!cancelled) setError('Failed to load filter options.');
			} finally {
				if (!cancelled) setLoadingFilters(false);
			}
		};
		loadFilters();
		return () => {
			cancelled = true;
		};
	}, []);

	const fetchInvoices = useCallback(
		async (overrides: Partial<ListInvoicesParams> = {}) => {
			setLoading(true);
			setError(null);
			try {
				const params: ListInvoicesParams = {
					page: overrides.page ?? page,
					limit: overrides.limit ?? pageSize,
					sort_by: overrides.sort_by ?? sortBy,
					sort_order: overrides.sort_order ?? sortOrder,
					search: search || undefined,
					invoice_date_from: dateFrom || undefined,
					invoice_date_to: dateTo || undefined,
					sold_by_gstin: sellerGstin || undefined,
					document_type: documentType || undefined,
					min_total: minTotal !== '' ? Number(minTotal) : undefined,
					max_total: maxTotal !== '' ? Number(maxTotal) : undefined,
					...overrides,
				};
				const res = await AmazonInvoicesApiService.listInvoices(params);
				if (res?.data) {
					setInvoices(res.data);
					if (res.pagination) setPagination(res.pagination);
				} else {
					setInvoices([]);
					setPagination(null);
				}
			} catch (e: unknown) {
				const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to load invoices.';
				setError(msg);
				setInvoices([]);
				setPagination(null);
			} finally {
				setLoading(false);
			}
		},
		[page, pageSize, sortBy, sortOrder, search, dateFrom, dateTo, sellerGstin, documentType, minTotal, maxTotal]
	);

	useEffect(() => {
		fetchInvoices();
	}, [fetchInvoices]);

	// Fetch invoice detail when a row is expanded (cache key = invoice_number)
	useEffect(() => {
		if (!openAccordion) return;
		if (detailCache[openAccordion]) {
			setDetailLoading(null);
			return;
		}
		setDetailLoading(openAccordion);
		let cancelled = false;
		AmazonInvoicesApiService.getInvoiceByNumber(openAccordion)
			.then(res => {
				if (!cancelled && res?.data) {
					setDetailCache(prev => ({ ...prev, [openAccordion]: res.data }));
				}
			})
			.catch(() => {
				if (!cancelled) {
					setDetailCache(prev => ({ ...prev, [openAccordion]: null }));
				}
			})
			.finally(() => {
				if (!cancelled) setDetailLoading(null);
			});
		return () => {
			cancelled = true;
		};
	}, [openAccordion, detailCache]);

	const handleSearch = () => {
		setPage(1);
		fetchInvoices({ page: 1 });
	};

	const handleSort = (key: string, order: 'asc' | 'desc') => {
		setSortBy(key);
		setSortOrder(order);
		setPage(1);
	};

	// Export to Excel: one row per line item (invoice fields repeated); includes Order ID and item description
	const handleExportToExcel = useCallback(async () => {
		setExporting(true);
		try {
			const params: ListInvoicesParams = {
				page: 1,
				limit: EXPORT_PAGE_LIMIT,
				sort_by: sortBy,
				sort_order: sortOrder,
				search: search || undefined,
				invoice_date_from: dateFrom || undefined,
				invoice_date_to: dateTo || undefined,
				sold_by_gstin: sellerGstin || undefined,
				document_type: documentType || undefined,
				min_total: minTotal !== '' ? Number(minTotal) : undefined,
				max_total: maxTotal !== '' ? Number(maxTotal) : undefined,
			};
			const res = await AmazonInvoicesApiService.listInvoices(params);
			const invoiceList = res?.data ?? [];

			// Fetch detail for each invoice (order_id + line_items); batch 5 at a time
			const BATCH = 5;
			const details: Array<{ invoice: AmazonInvoiceListItem; detail: AmazonInvoiceDetail | null }> = [];
			for (let i = 0; i < invoiceList.length; i += BATCH) {
				const batch = invoiceList.slice(i, i + BATCH);
				const results = await Promise.all(
					batch.map(inv =>
						AmazonInvoicesApiService.getInvoiceByNumber(inv.invoice_number).then(
							r => (r?.data ? r.data : null),
							() => null
						)
					)
				);
				batch.forEach((inv, j) => details.push({ invoice: inv, detail: results[j] }));
			}

			const exportColumns = [
				{ key: 'id', title: 'ID' },
				{ key: 'invoice_number', title: 'Invoice #' },
				{ key: 'order_id', title: 'Order ID' },
				{ key: 'invoice_date', title: 'Date' },
				{ key: 'sold_by', title: 'Sold By' },
				{ key: 'document_type', title: 'Type' },
				{ key: 'item_count', title: 'Items' },
				{ key: 'grand_total', title: 'Grand Total (₹)' },
				{ key: 'description', title: 'Description' },
				{ key: 'qty', title: 'Qty' },
				{ key: 'unit_price', title: 'Unit Price (₹)' },
				{ key: 'line_total', title: 'Line Total (₹)' },
			];

			let rowId = 0;
			const exportData: Record<string, string | number>[] = [];

			for (const { invoice, detail } of details) {
				const orderId = detail?.invoice?.order_id ?? '';
				const lineItems = detail?.line_items ?? [];
				const invoiceDate = formatInvoiceDate(invoice.invoice_date);
				const grandTotal = Number(invoice.grand_total ?? 0);
				const itemCount = invoice.item_count ?? '';

				if (lineItems.length === 0) {
					exportData.push({
						id: ++rowId,
						invoice_number: invoice.invoice_number ?? '',
						order_id: orderId,
						invoice_date: invoiceDate,
						sold_by: invoice.sold_by ?? '',
						document_type: invoice.document_type ?? '',
						item_count: itemCount,
						grand_total: grandTotal,
						description: '',
						qty: '',
						unit_price: '',
						line_total: '',
					});
				} else {
					for (const item of lineItems) {
						exportData.push({
							id: ++rowId,
							invoice_number: invoice.invoice_number ?? '',
							order_id: orderId,
							invoice_date: invoiceDate,
							sold_by: invoice.sold_by ?? '',
							document_type: invoice.document_type ?? '',
							item_count: itemCount,
							grand_total: grandTotal,
							description: item.description ?? '',
							qty: Number(item.quantity ?? 0),
							unit_price: Number(item.unit_price ?? 0),
							line_total: Number(item.total_amount ?? 0),
						});
					}
				}
			}

			const filename = `amazon_invoices${dateFrom || dateTo ? `_${dateFrom || ''}_to_${dateTo || ''}` : ''}`;
			exportToExcel(exportData, exportColumns, filename);
		} catch (e: unknown) {
			const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Export failed.';
			alert(msg);
		} finally {
			setExporting(false);
		}
	}, [sortBy, sortOrder, search, dateFrom, dateTo, sellerGstin, documentType, minTotal, maxTotal]);

	const sellerOptions = useMemo(() => {
		if (!filterOptions?.sellers) return [];
		return filterOptions.sellers.map(s => ({
			label: s.name,
			value: s.gstin,
		}));
	}, [filterOptions]);

	const documentTypeOptions = useMemo(() => {
		if (!filterOptions?.document_types) return [];
		return filterOptions.document_types.map(d => ({ label: d, value: d }));
	}, [filterOptions]);

	const totalItems = pagination?.total ?? 0;
	const totalPages = pagination?.total_pages ?? 1;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Amazon Invoice"
				locationName="Finances"
				totalItems={totalItems}
				itemType="invoices"
			/>

			{/* Filters */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
				<div className="flex flex-wrap gap-4 items-end">
					<FloatingInput
						label="Search"
						value={search}
						onChange={setSearch}
						placeholder="Invoice number..."
						className="w-48"
					/>
					<FloatingInput
						label="Date From"
						type="date"
						value={dateFrom}
						onChange={setDateFrom}
						className="w-40"
					/>
					<FloatingInput
						label="Date To"
						type="date"
						value={dateTo}
						onChange={setDateTo}
						className="w-40"
					/>
					<FloatingDropdown
						label="Seller"
						options={sellerOptions}
						value={sellerGstin}
						onChange={setSellerGstin}
						loading={loadingFilters}
						className="w-56"
						placeholder="All sellers"
					/>
					<FloatingDropdown
						label="Document Type"
						options={documentTypeOptions}
						value={documentType}
						onChange={setDocumentType}
						loading={loadingFilters}
						className="w-40"
						placeholder="All types"
					/>
					{filterOptions?.range && (
						<>
							<FloatingInput
								label="Min Total (₹)"
								type="number"
								value={minTotal === '' ? '' : String(minTotal)}
								onChange={v => setMinTotal(v === '' ? '' : Number(v))}
								placeholder={String(filterOptions.range.min_grand_total)}
								className="w-32"
							/>
							<FloatingInput
								label="Max Total (₹)"
								type="number"
								value={maxTotal === '' ? '' : String(maxTotal)}
								onChange={v => setMaxTotal(v === '' ? '' : Number(v))}
								placeholder={String(filterOptions.range.max_grand_total)}
								className="w-32"
							/>
						</>
					)}
					<Button variant="primary" size="md" onClick={handleSearch} disabled={loading}>
						{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
						<span className="ml-2">Search</span>
					</Button>
					<Button
						variant="outline"
						size="md"
						onClick={handleExportToExcel}
						disabled={exporting || loading}
						title="Export current filter results to Excel"
					>
						{exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
						<span className="ml-2">Export to Excel</span>
					</Button>
				</div>
			</div>

			{error && (
				<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
					{error}
				</div>
			)}

			{/* Accordion Table */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
				{loading ? (
					<div className="px-6 py-12 flex items-center justify-center text-gray-500">
						<Loader2 className="h-8 w-8 animate-spin mr-2" />
						Loading invoices…
					</div>
				) : invoices.length === 0 ? (
					<div className="px-6 py-12 text-center text-gray-500">
						No invoices found. Adjust filters or run a search.
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full border-collapse">
							<thead>
								<tr className="border-b border-gray-200 bg-gray-50">
									<th className="w-10 px-3 py-2.5 text-left text-xs font-semibold text-gray-600" />
									<th
										className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:text-gray-900 w-[140px]"
										onClick={() => handleSort('invoice_number', sortBy === 'invoice_number' && sortOrder === 'asc' ? 'desc' : 'asc')}
									>
										<span className="inline-flex items-center gap-1">
											Invoice #
											{sortBy === 'invoice_number' && (sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
										</span>
									</th>
									<th
										className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:text-gray-900 w-[120px]"
										onClick={() => handleSort('invoice_date', sortBy === 'invoice_date' && sortOrder === 'asc' ? 'desc' : 'asc')}
									>
										<span className="inline-flex items-center gap-1">
											Date
											{sortBy === 'invoice_date' && (sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
										</span>
									</th>
									<th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 w-[200px]">Sold By</th>
									<th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 w-[120px]">Type</th>
									<th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-600 w-[80px]">Items</th>
									<th
										className="px-3 py-2.5 text-right text-xs font-semibold text-gray-600 cursor-pointer hover:text-gray-900 w-[120px]"
										onClick={() => handleSort('grand_total', sortBy === 'grand_total' && sortOrder === 'asc' ? 'desc' : 'asc')}
									>
										<span className="inline-flex items-center gap-1">
											Grand Total
											{sortBy === 'grand_total' && (sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
										</span>
									</th>
								</tr>
							</thead>
							<tbody>
								{invoices.map((row) => {
									const isOpen = openAccordion === row.invoice_number;
									const detail = detailCache[row.invoice_number];
									const isLoadingDetail = detailLoading === row.invoice_number;
									return (
										<React.Fragment key={row.id ?? row.invoice_number}>
											<tr
												className={cn(
													'border-b border-gray-200 transition-colors',
													isOpen && 'border-l-4 border-l-green-500 bg-green-50/30',
													!isOpen && 'hover:bg-gray-50 cursor-pointer'
												)}
												onClick={() => setOpenAccordion(isOpen ? null : row.invoice_number)}
											>
												<td className="px-3 py-2 w-10">
													<ChevronDown
														className={cn('h-5 w-5 text-gray-400 transition-transform', isOpen && 'rotate-180')}
													/>
												</td>
												<td className="px-3 py-2 text-sm font-medium text-gray-900">{row.invoice_number}</td>
												<td className="px-3 py-2 text-sm text-gray-700">{formatInvoiceDate(row.invoice_date)}</td>
												<td className="px-3 py-2 text-sm text-gray-700">{row.sold_by || '—'}</td>
												<td className="px-3 py-2 text-sm text-gray-700">{row.document_type || '—'}</td>
												<td className="px-3 py-2 text-sm text-gray-700 text-right">{row.item_count ?? '—'}</td>
												<td className="px-3 py-2 text-sm font-medium text-gray-900 text-right">
													₹{Number(row.grand_total ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
												</td>
											</tr>
											{isOpen && (
												<tr className="bg-gray-50/50">
													<td colSpan={7} className="px-0 py-0 align-top">
														<div className="px-6 pb-4 pt-2">
															{isLoadingDetail ? (
																<div className="flex items-center justify-center py-8 text-gray-500">
																	<Loader2 className="h-6 w-6 animate-spin mr-2" />
																	Loading invoice details…
																</div>
															) : detail?.invoice ? (
																<>
																	{/* Invoice summary */}
																	<div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
																		<h4 className="text-sm font-semibold text-gray-800 mb-3">Invoice summary</h4>
																		<dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-sm">
																			<dt className="text-gray-500">Order ID</dt>
																			<dd className="font-medium text-gray-900">{detail.invoice.order_id ?? '—'}</dd>
																			<dt className="text-gray-500">Grand Total</dt>
																			<dd className="font-medium text-gray-900">
																				₹{Number(detail.invoice.grand_total ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
																			</dd>
																			{detail.invoice.igst_amount != null && (
																				<>
																					<dt className="text-gray-500">IGST</dt>
																					<dd className="font-medium text-gray-900">
																						₹{Number(detail.invoice.igst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
																					</dd>
																				</>
																			)}
																			{detail.invoice.shipping_charges != null && (
																				<>
																					<dt className="text-gray-500">Shipping</dt>
																					<dd className="font-medium text-gray-900">
																						₹{Number(detail.invoice.shipping_charges).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
																					</dd>
																				</>
																			)}
																		</dl>
																	</div>
																	{/* Line items */}
																	<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
																		<h4 className="px-4 py-3 border-b border-gray-200 text-sm font-semibold text-gray-800">Line items</h4>
																		<table className="w-full text-sm">
																			<thead>
																				<tr className="bg-gray-50 border-b border-gray-200">
																					<th className="px-4 py-2 text-left font-semibold text-gray-600">Description</th>
																					<th className="px-4 py-2 text-right font-semibold text-gray-600 w-20">Qty</th>
																					<th className="px-4 py-2 text-right font-semibold text-gray-600 w-32">Unit Price (₹)</th>
																					<th className="px-4 py-2 text-right font-semibold text-gray-600 w-32">Total (₹)</th>
																				</tr>
																			</thead>
																			<tbody>
																				{(detail.line_items ?? []).map((item) => (
																					<tr key={item.id} className="border-b border-gray-100 last:border-b-0">
																						<td className="px-4 py-2 text-gray-900">{item.description || '—'}</td>
																						<td className="px-4 py-2 text-right text-gray-700">{Number(item.quantity ?? 0).toLocaleString('en-IN')}</td>
																						<td className="px-4 py-2 text-right text-gray-700">
																							₹{Number(item.unit_price ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
																						</td>
																						<td className="px-4 py-2 text-right font-medium text-gray-900">
																							₹{Number(item.total_amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
																						</td>
																					</tr>
																				))}
																			</tbody>
																		</table>
																		{(detail.line_items?.length ?? 0) === 0 && (
																			<div className="px-4 py-6 text-center text-gray-500">No line items.</div>
																		)}
																	</div>
																</>
															) : (
																<div className="py-6 text-center text-gray-500">Failed to load invoice details.</div>
															)}
														</div>
													</td>
												</tr>
											)}
										</React.Fragment>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{pagination && totalPages > 1 && (
				<Pagination
					currentPage={page}
					totalPages={totalPages}
					totalItems={totalItems}
					itemsPerPage={pageSize}
					onPageChange={setPage}
					onItemsPerPageChange={newSize => {
						setPageSize(newSize);
						setPage(1);
					}}
				/>
			)}
		</div>
	);
};

export default AmazonInvoiceList;
