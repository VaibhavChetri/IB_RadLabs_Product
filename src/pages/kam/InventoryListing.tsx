import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Pencil, Download, Info } from 'lucide-react';

// Small header label with an info icon carrying a plain-language explanation.
// Hover the ⓘ to read what the column means (native browser tooltip).
// The `label` doubles as the plain-text title used for CSV export / the column
// show-hide dropdown (see plainTitle below).
const HeaderInfo: React.FC<{ label: string; tip: string }> = ({ label, tip }) => (
	<span className='inline-flex items-center gap-1' data-col-label={label}>
		{label}
		<span title={tip} className='cursor-help' aria-label={tip}>
			<Info className='h-3.5 w-3.5 text-indigo-400' />
		</span>
	</span>
);

// title can now be a ReactNode (a HeaderInfo). For places that need a plain
// string (export header, column-visibility dropdown), pull the label back out.
const plainTitle = (title: React.ReactNode): string => {
	if (typeof title === 'string') return title;
	const props = (title as React.ReactElement<{ label?: string }> | undefined)?.props;
	return typeof props?.label === 'string' ? props.label : '';
};
import { RootState } from '../../store';
import {
	FloatingInput,
	FloatingDropdown,
	MultiSelectDropdown,
	Table,
	Pagination,
	PageHeader,
	Button,
} from '../../components/ui';
import { KamApiService, InventoryValueRow } from '../../services/kamApi';
import { InventoryApiService } from '../../services/inventoryApi';
import { setInventoryListing, setInventoryListingLoading } from '../../store/slices/kamSlice';
import { exportToExcel } from '../../utils/excelExport';

type DropdownOption = { label: string; value: string };

const INVENTORY_LISTING_DATES_KEY = 'kam_inventory_listing_dates';

const InventoryListing: React.FC = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { user } = useSelector((state: RootState) => state.auth);
	// Redux state is kept for compatibility but we use local state for display
	useSelector((state: RootState) => state.kam.inventoryListing);

	// Helper function to get saved dates from localStorage
	const getSavedDates = useCallback(() => {
		const saved = localStorage.getItem(INVENTORY_LISTING_DATES_KEY);
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				return {
					startDate: parsed.startDate || new Date().toISOString().split('T')[0],
					endDate: parsed.endDate || new Date().toISOString().split('T')[0],
				};
			} catch (error) {
				console.error('Error parsing saved dates:', error);
			}
		}
		return {
			startDate: new Date().toISOString().split('T')[0],
			endDate: new Date().toISOString().split('T')[0],
		};
	}, []);

	// Get dates from localStorage, default to today
	const savedDates = getSavedDates();
	const [startDate, setStartDate] = useState(savedDates.startDate);
	const [endDate, setEndDate] = useState(savedDates.endDate);

	// Load dates from localStorage on mount
	useEffect(() => {
		const saved = getSavedDates();
		if (saved.startDate !== startDate || saved.endDate !== endDate) {
			setStartDate(saved.startDate);
			setEndDate(saved.endDate);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Save dates to localStorage whenever they change
	useEffect(() => {
		if (startDate && endDate) {
			localStorage.setItem(INVENTORY_LISTING_DATES_KEY, JSON.stringify({ startDate, endDate }));
			console.log('💾 Saved dates to localStorage:', { startDate, endDate });
		}
	}, [startDate, endDate]);

	const [clients, setClients] = useState<DropdownOption[]>([]);
	const [selectedClientId, setSelectedClientId] = useState<string>('');
	const [pageNumber, setPageNumber] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	const [isExporting, setIsExporting] = useState(false);
	const [rows, setRows] = useState<InventoryValueRow[]>([]);
	const [loading, setLoading] = useState(false);
	const [totalItems, setTotalItems] = useState(0);

	const allColumns = useMemo(
		() => [
			{
				key: 'actions',
				title: 'Actions',
				width: '100px',
				sortable: false,
				render: (_: unknown, row: InventoryValueRow) => {
					// Extract date from created_at (format: "YYYY-MM-DD HH:mm:ss")
					const rowDate = row.created_at.split(' ')[0];
					return (
						<button
							className='p-1.5 rounded hover:bg-gray-100'
							title='Edit'
							onClick={() =>
								navigate(`/kam/clients/${row.clientId}/${rowDate}`, {
									state: { clientName: row.clientName },
								})
							}
						>
							<Pencil className='h-4 w-4 text-green-600' />
						</button>
					);
				},
			},
			{
				key: 'serial',
				title: '#',
				width: '80px',
				sortable: false,
				render: (_: unknown, __: InventoryValueRow, index: number) =>
					(pageNumber - 1) * itemsPerPage + index + 1,
			},
			{ key: 'clientName', title: 'Client', sortable: true, width: '200px' },
			{ key: 'containerType', title: 'Container', sortable: true, width: '150px' },
			{ key: 'openingStock', title: 'Opening', sortable: true, width: '100px' },
			{ key: 'dispatch', title: 'Dispatch', sortable: true, width: '100px' },
			{ key: 'returned', title: 'Returned', sortable: true, width: '100px' },
			{ key: 'closing', title: 'Closing', sortable: true, width: '100px' },
			{
				// ── Additive: per-SKU price from the client's active SKU map ──
				key: 'price',
				title: (
					<HeaderInfo
						label='Price (₹)'
						tip='The agreed rate per item for this SKU, from the client’s price list. Fixed-billing clients have no per-item price (they pay a flat monthly amount).'
					/>
				),
				sortable: true,
				width: '110px',
				headerClassName: 'bg-indigo-50 text-indigo-700',
				render: (_: unknown, row: InventoryValueRow) => {
					const p = row.price == null ? null : Number(row.price);
					return (
						<span className='block text-right text-gray-700'>
							{p == null || !Number.isFinite(p) ? '—' : p.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
						</span>
					);
				},
			},
			{
				// ── Additive: derived revenue = returned × price ──
				key: 'derived_revenue',
				title: (
					<HeaderInfo
						label='Derived Revenue (₹)'
						tip='Our calculated revenue for this SKU = items returned × price. It’s what the client owes based on operations, before invoicing. Blank for fixed-billing clients (they pay a flat monthly amount instead).'
					/>
				),
				sortable: true,
				width: '160px',
				headerClassName: 'bg-indigo-50 text-indigo-700',
				render: (_: unknown, row: InventoryValueRow) => {
					const billingTypeId = row.billingTypeId == null ? null : Number(row.billingTypeId);
					const price = row.price == null ? null : Number(row.price);
					const r = row.derived_revenue == null ? null : Number(row.derived_revenue);

					// Fixed billing (mode 3): per-SKU revenue doesn't apply — they pay a
					// flat monthly amount, so a 0 price here is correct, not a gap.
					if (billingTypeId === 3) {
						return (
							<span
								className='block text-right text-xs italic text-gray-500'
								title='This client is on fixed (flat monthly) billing, so per-item revenue isn’t calculated here.'
							>
								Fixed billing
							</span>
						);
					}

					// Per-unit modes with no rate configured: the 0 is a data-entry gap.
					const noPrice = price == null || !Number.isFinite(price) || price === 0;
					if (noPrice) {
						return (
							<span
								className='block text-right text-xs italic text-amber-600'
								title='No price set in this client’s SKU mapping — derived revenue cannot be computed. Set the rate in Ops Admin.'
							>
								No price set
							</span>
						);
					}
					return (
						<span className='block text-right font-medium text-indigo-700'>
							{r == null || !Number.isFinite(r) ? '—' : r.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
						</span>
					);
				},
			},
			{
				key: 'has_entered',
				title: 'Status',
				sortable: true,
				render: (_: unknown, row: InventoryValueRow) => (
					<div className='flex items-center justify-center'>
						{row.has_entered === 'Yes' ? (
							<span className='text-2xl text-green-600'>✓</span>
						) : (
							<span className='text-xl text-gray-400'>-</span>
						)}
					</div>
				),
			},
			{
				key: 'created_at',
				title: 'Date',
				sortable: true,
				render: (_: unknown, row: InventoryValueRow) => row.created_at.split(' ')[0],
			},
		],
		[pageNumber, itemsPerPage, navigate]
	);

	const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

	// Initialize visible columns when allColumns is ready
	useEffect(() => {
		if (allColumns.length > 0 && visibleColumns.length === 0) {
			setVisibleColumns(allColumns.map(col => col.key));
		}
	}, [allColumns, visibleColumns.length]);

	// Load clients dropdown.
	// Don't gate on city_id: founders have none, and the backend returns all
	// clients for them regardless of the location_id passed (0 = harmless placeholder).
	useEffect(() => {
		InventoryApiService.getClientByCity(user?.city_id ?? 0).then(res => {
			const clients = res.result || [];
			setClients([
				{ label: 'All Clients', value: '' },
				...clients.map((c: { clientName: string; clientId: number }) => ({
					label: c.clientName,
					value: String(c.clientId),
				})),
			]);
		});
	}, [user?.city_id]);

	const fetchData = useCallback(
		async (page?: number, limit?: number) => {
			setLoading(true);
			try {
				const response = await KamApiService.getEverydayClientInventoryValues({
					start_date: startDate,
					end_date: endDate,
					client_id: selectedClientId ? Number(selectedClientId) : undefined,
					page: page ?? pageNumber,
					limit: limit ?? itemsPerPage,
				});

				// API response structure:
				// {
				//   status_code: 200,
				//   status: "Success",
				//   data: InventoryValueRow[],  // Array directly
				//   totals: { totalDispatch, totalReturned },
				//   pagination: { page, limit, totalItems, totalPages }  // At root level
				// }

				// Extract data array - response.data is the array directly
				const responseData: InventoryValueRow[] = Array.isArray(response.data) ? response.data : [];

				// Extract pagination - it's at the root level, not nested in data
				// Response structure: { status_code, status, data: [], totals: {}, pagination: {} }
				const paginationData =
					'pagination' in response
						? (
								response as {
									pagination: {
										totalItems?: number;
										page?: number;
										limit?: number;
										totalPages?: number;
									};
								}
							).pagination
						: {};
				const totalItemsValue = paginationData.totalItems || 0;

				setRows(responseData);
				setTotalItems(totalItemsValue);

				// Also update Redux for compatibility
				const totals =
					'totals' in response
						? (response as { totals: { totalDispatch?: string; totalReturned?: string } }).totals
						: null;
				dispatch(
					setInventoryListing({
						data: responseData,
						totals: totals
							? {
									totalDispatch: totals.totalDispatch || '0',
									totalReturned: totals.totalReturned || '0',
								}
							: { totalDispatch: '0', totalReturned: '0' },
						pagination: {
							page: paginationData.page || 1,
							limit: paginationData.limit || itemsPerPage,
							totalItems: paginationData.totalItems || 0,
							totalPages: paginationData.totalPages || 0,
						},
						loading: false,
					})
				);
			} catch (error) {
				console.error('Error fetching inventory listing:', error);
				setRows([]);
				setTotalItems(0);
			} finally {
				setLoading(false);
				dispatch(setInventoryListingLoading(false));
			}
		},
		[dispatch, startDate, endDate, selectedClientId, pageNumber, itemsPerPage]
	);

	// Initial fetch on mount
	useEffect(() => {
		if (startDate && endDate) {
			fetchData();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Fetch data when pagination changes
	useEffect(() => {
		if (startDate && endDate) {
			fetchData();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pageNumber, itemsPerPage]);

	// Reset page to 1 and fetch when filters change
	useEffect(() => {
		if (startDate && endDate) {
			setPageNumber(1);
			fetchData(1, itemsPerPage);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [startDate, endDate, selectedClientId]);

	// Handle Excel export - fetch all data
	const handleExportToExcel = useCallback(async () => {
		setIsExporting(true);
		try {
			// Fetch all data without pagination using limit=0
			const response = await KamApiService.getEverydayClientInventoryValues({
				start_date: startDate,
				end_date: endDate,
				client_id: selectedClientId ? Number(selectedClientId) : undefined,
				page: 1,
				limit: 0, // limit=0 returns all records
			});

			const allData = response.data?.data || response.data || [];

			// Prepare columns for export (exclude actions column)
			const exportColumns = allColumns
				.filter(col => col.key !== 'actions')
				.map(col => ({
					key: col.key,
					title: plainTitle(col.title),
				}));

			// Transform data for export
			const exportData = allData.map((row: InventoryValueRow, index: number) => {
				const exportRow: Record<string, unknown> = {
					serial: index + 1,
					clientName: row.clientName || '',
					containerType: row.containerType || '',
					openingStock: row.openingStock ?? '',
					dispatch: row.dispatch ?? '',
					returned: row.returned ?? '',
					closing: row.closing ?? '',
					has_entered: row.has_entered || '',
					created_at: row.created_at ? row.created_at.split(' ')[0] : '',
				};
				return exportRow;
			});

			// Generate filename with date range
			const filename = `inventory_listing_${startDate}_to_${endDate}`;

			// Export to Excel
			exportToExcel(exportData, exportColumns, filename);
		} catch (error) {
			console.error('Error exporting to Excel:', error);
			alert('Failed to export data. Please try again.');
		} finally {
			setIsExporting(false);
		}
	}, [startDate, endDate, selectedClientId, allColumns]);

	// Column options for MultiSelectDropdown
	const columnOptions = useMemo(
		() =>
			allColumns
				.filter(col => col.key !== 'serial')
				.map(col => ({
					label: plainTitle(col.title),
					value: col.key,
				})),
		[allColumns]
	);

	const totalPages = Math.ceil(totalItems / itemsPerPage);

	return (
		<div className='space-y-6'>
			<PageHeader
				title='Inventory Client Listing'
				locationName={user?.city_name || 'City'}
				totalItems={totalItems}
				itemType='inventory entries'
				icon='📦'
			/>

			<div className='bg-white p-4 shadow-sm rounded-lg flex flex-wrap gap-4 items-center mb-6'>
				<FloatingInput
					type='date'
					label='From Date'
					value={startDate}
					onChange={setStartDate}
					className='w-44'
				/>
				<FloatingInput
					type='date'
					label='To Date'
					value={endDate}
					onChange={setEndDate}
					className='w-44'
				/>
				<FloatingDropdown
					label='Client'
					options={clients}
					value={selectedClientId}
					onChange={setSelectedClientId}
					className='w-48'
				/>
				<MultiSelectDropdown
					label='Show Columns'
					options={columnOptions}
					value={visibleColumns.filter(col => !['serial'].includes(col))}
					onChange={selectedValues => {
						// Always keep serial column visible
						setVisibleColumns(['serial', ...selectedValues]);
					}}
					className='w-52'
					searchable={true}
					showSelectedCount={true}
				/>
				<Button
					onClick={handleExportToExcel}
					disabled={isExporting || loading}
					variant='primary'
					size='md'
					loading={isExporting}
					className='ml-auto p-2'
					title={isExporting ? 'Downloading...' : 'Download'}
				>
					<Download className='h-4 w-4' />
				</Button>
			</div>

			<div className='overflow-x-auto'>
				<Table<InventoryValueRow>
					columns={allColumns.filter(col => visibleColumns.includes(col.key))}
					data={rows}
					loading={loading}
					emptyText='No inventory entries found.'
					className='bg-white'
				/>
			</div>

			<Pagination
				currentPage={pageNumber}
				totalPages={totalPages}
				totalItems={totalItems}
				itemsPerPage={itemsPerPage}
				onPageChange={setPageNumber}
				onItemsPerPageChange={setItemsPerPage}
				className='mt-4'
			/>
		</div>
	);
};

export default InventoryListing;
