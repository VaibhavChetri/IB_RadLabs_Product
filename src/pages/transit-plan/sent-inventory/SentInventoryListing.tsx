import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Download } from 'lucide-react';
import {
	Pagination,
	SearchButton,
	FloatingInput,
	PageHeader,
	Button,
} from '../../../components/ui';
import { FacilityDropdown } from '../../../components/FacilityDropdown';
import {
	InventoryApiService,
	SentInventoryResponse,
	SentInventoryRow,
} from '../../../services/inventoryApi';
import { exportToExcel } from '../../../utils/excelExport';

const SentInventoryListing: React.FC = () => {
	const navigate = useNavigate();
	// Local storage key for filters
	const STORAGE_KEY = 'sent-inventory-filters';

	// State management
	const [startDate, setStartDate] = useState<string>(() => {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				return parsed.startDate || '';
			} catch {
				return '';
			}
		}
		return '';
	});
	const [endDate, setEndDate] = useState<string>(() => {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				return parsed.endDate || '';
			} catch {
				return '';
			}
		}
		return '';
	});
	const [selectedFacility, setSelectedFacility] = useState<string>('');
	const [rows, setRows] = useState<SentInventoryRow[]>([]);
	const [loading, setLoading] = useState(false);
	const [pageNumber, setPageNumber] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	const [totalItems, setTotalItems] = useState(0);
	const [openAccordion, setOpenAccordion] = useState<string | null>(null);
	const [isExporting, setIsExporting] = useState(false);

	// Fetch data from API
	const fetchData = async (_useFilters = true) => {
		if (!selectedFacility) return;

		setLoading(true);
		try {
			// Use actual date state or fallback to default dates
			const start = startDate || '2025-01-01';
			const end = endDate || '2025-12-31';

			console.log('🔍 Fetching sent inventory data with:', {
				location_id: selectedFacility,
				start_date: start,
				end_date: end,
				pageNumber: pageNumber,
				pageSize: itemsPerPage,
			});

			const response = await InventoryApiService.getSentCount({
				location_id: parseInt(selectedFacility),
				start_date: start,
				end_date: end,
				pageNumber: pageNumber,
				pageSize: itemsPerPage,
			});

			console.log('🔍 API Response:', response);

			if (response.status === 'success') {
				// Transform data for table display
				const transformedData = transformDataForTable(response);

				// API now returns pagination object: { page, limit, totalItems, totalPages }
				const paginationData = response.pagination;

				// Use pagination from API if available, otherwise fallback to totalCount
				if (paginationData) {
					setTotalItems(paginationData.totalItems);
				} else {
					// Fallback: use totalCount from API or transformed data length
					const apiTotalCount = response.totalCount || transformedData.length;
					setTotalItems(apiTotalCount);
				}

				// API now handles pagination server-side, so use transformed data directly
				setRows(transformedData);
			} else {
				setRows([]);
				setTotalItems(0);
			}
		} catch (error) {
			console.error('❌ Error fetching sent inventory data:', error);
			setRows([]);
			setTotalItems(0);
		} finally {
			setLoading(false);
		}
	};

	// Transform data for table display - group by client and dispatch date/time
	const transformDataForTable = (data: SentInventoryResponse): SentInventoryRow[] => {
		if (!data || !data.result) return [];

		// Type assertion: API returns array of objects with full data
		interface SentInventoryItem {
			id: number;
			clientId: number;
			facilityId: number;
			clientName: string;
			containerTypeId: number;
			sku: string;
			count: number;
			dispatch_date_time: string;
			adhoc?: number;
			[key: string]: unknown; // Allow other fields
		}

		const items = data.result as unknown as SentInventoryItem[];

		// Group by client and dispatch date/time
		interface GroupedItem {
			clientId: number;
			facilityId: number;
			clientName: string;
			dispatchDateTime: string;
			skus: Array<{
				sku: string;
				count: number;
				containerTypeId: number;
				id: number; // Include record ID for update
				rawItem: SentInventoryItem; // Store full item for edit page
			}>;
		}

		const groupedData = items.reduce((acc: Record<string, GroupedItem>, item) => {
			const key = `${item.clientId}-${item.dispatch_date_time}`;
			if (!acc[key]) {
				acc[key] = {
					clientId: item.clientId,
					facilityId: item.facilityId,
					clientName: item.clientName,
					dispatchDateTime: item.dispatch_date_time,
					skus: [],
				};
			}
			acc[key].skus.push({
				sku: item.sku || 'N/A',
				count: item.count || 0,
				containerTypeId: item.containerTypeId,
				id: item.id, // Include record ID
				rawItem: item, // Store full item
			});
			return acc;
		}, {});

		// Convert to table rows
		// Note: Serial numbers will be calculated in render based on current page
		return Object.values(groupedData).map(group => ({
			id: `${group.clientId}-${group.dispatchDateTime}`,
			clientId: group.clientId, // Include clientId for navigation
			clientName: group.clientName,
			dispatchDateTime: group.dispatchDateTime,
			facilityId: group.facilityId,
			skus: group.skus,
		}));
	};

	// Save filters to localStorage when they change
	useEffect(() => {
		if (startDate || endDate) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ startDate, endDate }));
		}
	}, [startDate, endDate]);

	// Set default date range (last 30 days) only if not saved in localStorage
	useEffect(() => {
		if (!startDate && !endDate) {
			const today = new Date();
			const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

			setStartDate(formatDateForInput(thirtyDaysAgo));
			setEndDate(formatDateForInput(today));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Reset page to 1 and fetch when filters change
	useEffect(() => {
		if (startDate && endDate && selectedFacility) {
			setPageNumber(1);
			fetchData(true);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [startDate, endDate, selectedFacility]);

	// Load data when pagination changes
	useEffect(() => {
		if (startDate && endDate && selectedFacility) {
			fetchData(true);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pageNumber, itemsPerPage]);

	// Format date for input
	function formatDateForInput(date: Date): string {
		return date.toISOString().split('T')[0];
	}

	// Handle Excel export - fetch all raw data
	const handleExportToExcel = useCallback(async () => {
		if (!selectedFacility) return;

		setIsExporting(true);
		try {
			const start = startDate || '2025-01-01';
			const end = endDate || '2025-12-31';

			// Fetch all data using limit=0
			const response = await InventoryApiService.getSentCount({
				location_id: parseInt(selectedFacility),
				start_date: start,
				end_date: end,
				pageNumber: 1,
				pageSize: 0, // limit=0 returns all records
			});

			if (response.status === 'success' && response.result) {
				// Use raw data from API response (response.result is array of raw items)
				// Type assertion: API returns array of objects, not numbers (interface says number[] but it's actually objects)
				const rawData = Array.isArray(response.result)
					? (response.result as unknown as Array<Record<string, unknown>>)
					: [];

				// Prepare columns for export based on raw data structure
				const exportColumns = [
					{ key: 'serial', title: '#' },
					{ key: 'clientName', title: 'Client' },
					{ key: 'facilityName', title: 'Facility' },
					{ key: 'sku', title: 'SKU' },
					{ key: 'count', title: 'Count' },
					{ key: 'dispatch_date_time', title: 'Dispatch Date & Time' },
					{ key: 'created_at', title: 'Created At' },
					{ key: 'adhoc', title: 'Adhoc' },
					{ key: 'water', title: 'Water' },
					{ key: 'chemical', title: 'Chemical' },
					{ key: 'disposable', title: 'Disposable' },
					{ key: 'co2', title: 'CO2' },
					{ key: 'electricity', title: 'Electricity' },
					{ key: 'weightInGms', title: 'Weight (gms)' },
				];

				// Transform raw data for export
				const exportData = rawData.map((item, index: number) => ({
					serial: index + 1,
					clientName: item.clientName || '',
					facilityName: item.facilityName || '',
					sku: item.sku || '',
					count: item.count || 0,
					dispatch_date_time: item.dispatch_date_time || '',
					created_at: item.created_at || '',
					adhoc: item.adhoc || 0,
					water: item.water || 0,
					chemical: item.chemical || 0,
					disposable: item.disposable || 0,
					co2: item.co2 || 0,
					electricity: item.electricity || 0,
					weightInGms: item.weightInGms || 0,
				}));

				// Generate filename with date range
				const filename = `sent_inventory_${start}_to_${end}`;

				// Export to Excel
				exportToExcel(exportData, exportColumns, filename);
			}
		} catch (error) {
			console.error('Error exporting to Excel:', error);
			alert('Failed to export data. Please try again.');
		} finally {
			setIsExporting(false);
		}
	}, [startDate, endDate, selectedFacility]);

	const totalPages = Math.ceil(totalItems / itemsPerPage);

	return (
		<div className='space-y-6'>
			<PageHeader
				title='Sent Inventory Listing'
				locationName='Mumbai'
				totalItems={totalItems}
				itemType='containers'
				icon='📦'
			/>

			<div className='bg-white p-4 shadow-sm rounded-lg flex flex-wrap gap-4 items-center mb-6'>
				<div className='w-56'>
					<FloatingInput label='From Date' type='date' value={startDate} onChange={setStartDate} />
				</div>
				<div className='w-56'>
					<FloatingInput label='To Date' type='date' value={endDate} onChange={setEndDate} />
				</div>
				<div className='w-56'>
					<FacilityDropdown
						value={selectedFacility}
						onChange={setSelectedFacility}
						autoSelectFirst={true}
						className='w-full'
					/>
				</div>
				<SearchButton
					onClick={() => {
						setPageNumber(1);
						fetchData(true);
					}}
					disabled={loading || !startDate || !endDate || !selectedFacility}
				/>
				<Button
					onClick={handleExportToExcel}
					disabled={isExporting || loading || !selectedFacility}
					variant='primary'
					size='md'
					loading={isExporting}
					className='ml-auto p-2'
					title={isExporting ? 'Downloading...' : 'Download'}
				>
					<Download className='h-4 w-4' />
				</Button>
			</div>

			{rows.length > 0 && (
				<div className='bg-white rounded-lg overflow-hidden'>
					{/* Table Header */}
					<div className='px-6 py-3 border-b border-gray-200'>
						<div className='grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700'>
							<div className='col-span-1'>Actions</div>
							<div className='col-span-1'>Sl. No</div>
							<div className='col-span-4'>Client</div>
							<div className='col-span-6'>Dispatch Date & Time</div>
						</div>
					</div>

					{/* Accordion Rows */}
					<div>
						{rows.map((row, index) => (
							<div
								key={row.id}
								className={`group transition-colors border-b border-gray-200 ${openAccordion === row.id ? 'border-l-4 border-l-green-500' : 'hover:bg-gray-50'}`}
							>
								<div
									className='px-6 py-3 cursor-pointer'
									onClick={() => {
										setOpenAccordion(openAccordion === row.id ? null : row.id);
									}}
								>
									<div className='grid grid-cols-12 gap-4 items-center'>
										<div className='col-span-1'>
											<button
												className='p-1.5 rounded hover:bg-gray-100'
												title='Edit'
												onClick={e => {
													e.stopPropagation();
													// Pass full row data including containerTypeId
													navigate(
														`/transit-plan/sent/inventory/edit/${row.clientId}/${row.facilityId}`,
														{
															state: {
																row,
																dispatchDateTime: row.dispatchDateTime,
																clientName: row.clientName,
																skus: row.skus, // This now includes containerTypeId
															},
														}
													);
												}}
											>
												<Pencil className='h-4 w-4 text-green-600' />
											</button>
										</div>
										<div className='col-span-1'>
											<span className='text-sm font-medium text-gray-900'>
												{(pageNumber - 1) * itemsPerPage + index + 1}
											</span>
										</div>
										<div className='col-span-4'>
											<h4 className='text-sm font-medium text-gray-900'>{row.clientName}</h4>
										</div>
										<div className='col-span-6 flex items-center justify-between'>
											<span className='text-sm text-gray-600'>
												{new Date(row.dispatchDateTime).toLocaleDateString()} at{' '}
												{new Date(row.dispatchDateTime).toLocaleTimeString()}
											</span>
											<div className='flex items-center space-x-2'>
												<span className='text-sm text-gray-500'>{row.skus.length} SKUs</span>
												<svg
													className={`w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-all duration-200 ${
														openAccordion === row.id ? 'rotate-180' : 'rotate-0'
													}`}
													fill='none'
													stroke='currentColor'
													viewBox='0 0 24 24'
												>
													<path
														strokeLinecap='round'
														strokeLinejoin='round'
														strokeWidth={2}
														d='M19 9l-7 7-7-7'
													/>
												</svg>
											</div>
										</div>
									</div>
								</div>
								<div
									id={`sku-details-${row.id}`}
									className={`overflow-hidden transition-all duration-300 ease-in-out ${
										openAccordion === row.id ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
									}`}
								>
									<div className='px-6 pb-4'>
										<div className='grid grid-cols-2 gap-4'>
											<div className='bg-white rounded-lg border border-gray-200'>
												{row.skus.slice(0, Math.ceil(row.skus.length / 2)).map((sku, skuIndex) => (
													<div
														key={skuIndex}
														className='flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors'
													>
														<span className='text-sm font-medium text-gray-900'>{sku.sku}</span>
														<span className='px-2 py-1 bg-green-50 text-green-700 text-sm font-semibold rounded-md'>
															{sku.count}
														</span>
													</div>
												))}
											</div>
											<div className='bg-white rounded-lg border border-gray-200'>
												{row.skus.slice(Math.ceil(row.skus.length / 2)).map((sku, skuIndex) => (
													<div
														key={skuIndex + Math.ceil(row.skus.length / 2)}
														className='flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors'
													>
														<span className='text-sm font-medium text-gray-900'>{sku.sku}</span>
														<span className='px-2 py-1 bg-green-50 text-green-700 text-sm font-semibold rounded-md'>
															{sku.count}
														</span>
													</div>
												))}
											</div>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Pagination - always show, matching master plan listing */}
			<Pagination
				currentPage={pageNumber}
				totalPages={totalPages}
				totalItems={totalItems}
				itemsPerPage={itemsPerPage}
				onPageChange={setPageNumber}
				onItemsPerPageChange={setItemsPerPage}
				className='mt-4'
			/>

			{!loading && rows.length === 0 && startDate && endDate && selectedFacility && (
				<div className='bg-gray-50 border border-gray-200 rounded-lg p-8 text-center'>
					<div className='text-gray-400 mb-4'>
						<svg
							className='w-12 h-12 mx-auto'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
							/>
						</svg>
					</div>
					<h3 className='text-lg font-medium text-gray-900 mb-2'>No Containers Found</h3>
					<p className='text-gray-600'>
						No containers were sent to the selected washing facility for the specified date range.
					</p>
				</div>
			)}
		</div>
	);
};

export default SentInventoryListing;
