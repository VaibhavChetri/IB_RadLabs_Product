import React, { useEffect, useState } from 'react';
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
import { Download } from 'lucide-react';

const SentInventoryListing: React.FC = () => {
	// State management
	const [startDate, setStartDate] = useState<string>('');
	const [endDate, setEndDate] = useState<string>('');
	const [selectedFacility, setSelectedFacility] = useState<string>('');
	const [rows, setRows] = useState<SentInventoryRow[]>([]);
	const [loading, setLoading] = useState(false);
	const [pageNumber, setPageNumber] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	const [totalItems, setTotalItems] = useState(0);
	const [openAccordion, setOpenAccordion] = useState<string | null>(null);
	const [exporting, setExporting] = useState(false);

	// Fetch all data for export (without pagination)
	const fetchAllDataForExport = async (): Promise<SentInventoryRow[]> => {
		if (!selectedFacility) return [];

		try {
			const start = startDate || '2025-01-01';
			const end = endDate || '2025-12-31';

			const response = await InventoryApiService.getSentCount({
				location_id: parseInt(selectedFacility),
				start_date: start,
				end_date: end,
				pageNumber: 1,
				pageSize: 10000, // Get all data for export
			});

			if (response.status === 'success') {
				return transformDataForTable(response);
			}
			return [];
		} catch (error) {
			console.error('❌ Error fetching data for export:', error);
			return [];
		}
	};

	// Handle Excel export
	const handleExportToExcel = async () => {
		if (!selectedFacility || !startDate || !endDate) {
			alert('Please select facility and date range before exporting');
			return;
		}

		setExporting(true);
		try {
			const allData = await fetchAllDataForExport();

			// Flatten the data for Excel - each SKU becomes a row
			const excelData = allData.flatMap((row, index) => {
				if (row.skus.length === 0) {
					// If no SKUs, still create one row
					return [
						{
							'Sl. No': index + 1,
							Client: row.clientName,
							'Dispatch Date & Time': new Date(row.dispatchDateTime).toLocaleString(),
							SKU: 'N/A',
							Count: 0,
						},
					];
				}

				return row.skus.map(sku => ({
					'Sl. No': index + 1,
					Client: row.clientName,
					'Dispatch Date & Time': new Date(row.dispatchDateTime).toLocaleString(),
					SKU: sku.sku,
					Count: sku.count,
				}));
			});

			// Generate filename with date range
			const filename = `Sent_Inventory_${startDate}_to_${endDate}`;
			exportToExcel(excelData, filename, 'Sent Inventory');
		} catch (error) {
			console.error('❌ Error exporting to Excel:', error);
			alert('Failed to export data. Please try again.');
		} finally {
			setExporting(false);
		}
	};

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

				// Apply client-side pagination since API returns all data
				const startIndex = (pageNumber - 1) * itemsPerPage;
				const endIndex = startIndex + itemsPerPage;
				const paginatedData = transformedData.slice(startIndex, endIndex);

				setRows(paginatedData);
				setTotalItems(transformedData.length);
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

		// Type assertion: API returns array of objects, not numbers
		interface SentInventoryItem {
			clientId: number;
			clientName: string;
			dispatch_date_time: string;
			sku?: string;
			containerTypeId?: string;
			count: number;
		}

		const items = data.result as unknown as SentInventoryItem[];

		// Group by client and dispatch date/time
		interface GroupedItem {
			clientId: number;
			clientName: string;
			dispatchDateTime: string;
			skus: Array<{ sku: string; count: number }>;
		}

		const groupedData = items.reduce((acc: Record<string, GroupedItem>, item) => {
			const key = `${item.clientId}-${item.dispatch_date_time}`;
			if (!acc[key]) {
				acc[key] = {
					clientId: item.clientId,
					clientName: item.clientName,
					dispatchDateTime: item.dispatch_date_time,
					skus: [],
				};
			}
			acc[key].skus.push({
				sku: item.sku || item.containerTypeId || 'N/A',
				count: item.count || 0,
			});
			return acc;
		}, {});

		// Convert to table rows
		return Object.values(groupedData).map((group, index: number) => ({
			id: `${group.clientId}-${group.dispatchDateTime}`,
			serial: index + 1,
			clientName: group.clientName,
			dispatchDateTime: group.dispatchDateTime,
			skus: group.skus,
		}));
	};

	// Set default date range (last 30 days)
	useEffect(() => {
		const today = new Date();
		const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

		setStartDate(formatDateForInput(thirtyDaysAgo));
		setEndDate(formatDateForInput(today));
	}, []);

	// Initial load after dates are set
	useEffect(() => {
		if (startDate && endDate && selectedFacility) {
			fetchData(true);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [startDate, endDate, selectedFacility]);

	// Load data when pagination or sorting changes
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

	// Handle page change
	const handlePageChange = (page: number) => {
		setPageNumber(page);
	};

	// Handle items per page change
	const handleItemsPerPageChange = (items: number) => {
		setItemsPerPage(items);
		setPageNumber(1); // Reset to first page
	};

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
					disabled={
						loading || exporting || !startDate || !endDate || !selectedFacility || rows.length === 0
					}
					className='px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center'
					title={exporting ? 'Exporting...' : 'Download Excel'}
				>
					<Download className='w-5 h-5' />
				</Button>
			</div>

			{rows.length > 0 && (
				<div className='bg-white rounded-lg overflow-hidden'>
					{/* Table Header */}
					<div className='px-6 py-3 border-b border-gray-200'>
						<div className='grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700'>
							<div className='col-span-1'>Sl. No</div>
							<div className='col-span-5'>Client</div>
							<div className='col-span-6'>Dispatch Date & Time</div>
						</div>
					</div>

					{/* Accordion Rows */}
					<div>
						{rows.map((row, _index) => (
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
											<span className='text-sm font-medium text-gray-900'>{row.serial}</span>
										</div>
										<div className='col-span-5'>
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

					{totalPages > 1 && (
						<div className='p-4 border-t'>
							<Pagination
								currentPage={pageNumber}
								totalPages={totalPages}
								totalItems={totalItems}
								itemsPerPage={itemsPerPage}
								onPageChange={handlePageChange}
								onItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
					)}
				</div>
			)}

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
