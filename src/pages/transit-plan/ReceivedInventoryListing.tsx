import React, { useEffect, useState } from 'react';
import {
	Pagination,
	SearchButton,
	FloatingInput,
	FloatingDropdown,
	PageHeader,
} from '../../components/ui';
import {
	InventoryApiService,
	WashingFacility,
	SentInventoryResponse,
	SentInventoryRow,
} from '../../services/inventoryApi';
import { TransitPlanApi } from '../../services/transitPlanApi';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const ReceivedInventoryListing: React.FC = () => {
	const { user } = useSelector((state: RootState) => state.auth);
	const cityId = user?.city_id ?? 3;

	// State management
	const [selectedDate, setSelectedDate] = useState<string>('');
	const [facilities, setFacilities] = useState<WashingFacility[]>([]);
	const [selectedFacility, setSelectedFacility] = useState<string>('');
	const [clients, setClients] = useState<Array<{ label: string; value: string }>>([]);
	const [selectedClientId, setSelectedClientId] = useState<string>('');
	const [rows, setRows] = useState<SentInventoryRow[]>([]);
	const [loading, setLoading] = useState(false);
	const [pageNumber, setPageNumber] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	const [totalItems, setTotalItems] = useState(0);
	const [sortBy] = useState<string>('date');
	const [sortOrder] = useState<'asc' | 'desc'>('desc');
	const [openAccordion, setOpenAccordion] = useState<string | null>(null);

	// Load washing facilities on component mount
	useEffect(() => {
		const loadFacilities = async () => {
			try {
				const response = await InventoryApiService.getWashingFacilities();
				if (response.status === 'Success') {
					setFacilities(response.data);

					// Auto-select first facility if none selected
					if (!selectedFacility && response.data.length > 0) {
						const firstFacility = response.data[0];
						setSelectedFacility(String(firstFacility.id));
						console.log('🔍 Auto-selected facility:', firstFacility.location);
					}
				}
			} catch (err) {
				console.error('❌ Error loading facilities:', err);
			}
		};
		loadFacilities();
	}, [selectedFacility]);

	// Load clients dropdown
	useEffect(() => {
		const loadClients = async () => {
			try {
				console.log('🔍 Loading clients for cityId:', cityId);
				const res = await TransitPlanApi.getRestaurants(cityId);
				console.log('🔍 Clients API response:', res);
				setClients([
					{ label: 'All Clients', value: '' },
					...res.result.map((r: any) => ({
						label: r.clientName,
						value: String(r.clientId),
					})),
				]);
				console.log('🔍 Clients loaded:', res.result.length);
			} catch (error) {
				console.error('❌ Error loading clients:', error);
			}
		};
		loadClients();
	}, [cityId]);

	// Fetch data from API
	const fetchData = async (_useFilters = true) => {
		if (!selectedFacility || !selectedDate) return;

		setLoading(true);
		try {
			console.log('🔍 Fetching received inventory data with:', {
				location_id: selectedFacility,
				date: selectedDate,
				pageNumber: pageNumber,
				pageSize: itemsPerPage,
			});

			const response = await InventoryApiService.getReceivedCount({
				location_id: parseInt(selectedFacility),
				date: selectedDate,
				pageNumber: pageNumber,
				pageSize: itemsPerPage,
			});

			console.log('🔍 API Response:', response);

			if (response.status === 'success') {
				// Transform data for table display
				const transformedData = transformDataForTable(response, selectedClientId);

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
			console.error('❌ Error fetching received inventory data:', error);
			setRows([]);
			setTotalItems(0);
		} finally {
			setLoading(false);
		}
	};

	// Transform data for table display - group by client and received date/time
	const transformDataForTable = (
		data: SentInventoryResponse,
		selectedClientId: string
	): SentInventoryRow[] => {
		if (!data || !data.result) return [];

		// Filter by client if selected
		const filteredData = selectedClientId
			? data.result.filter((item: any) => String(item.clientId) === selectedClientId)
			: data.result;

		// Group by client and received date/time
		const groupedData = filteredData.reduce((acc: any, item: any) => {
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
		return Object.values(groupedData).map((group: any, index: number) => ({
			id: `${group.clientId}-${group.dispatchDateTime}`,
			serial: index + 1,
			clientName: group.clientName,
			dispatchDateTime: group.dispatchDateTime,
			skus: group.skus,
		}));
	};

	// Set default date (today)
	useEffect(() => {
		const today = new Date();
		setSelectedDate(formatDateForInput(today));
	}, []);

	// Initial load after date is set
	useEffect(() => {
		if (selectedDate && selectedFacility) {
			fetchData(true);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedDate, selectedFacility, selectedClientId]);

	// Load data when pagination or sorting changes
	useEffect(() => {
		if (selectedDate && selectedFacility) {
			fetchData(true);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pageNumber, itemsPerPage, sortBy, sortOrder]);

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
				title='Received Inventory Listing'
				locationName='Mumbai'
				totalItems={totalItems}
				itemType='containers'
				icon='📥'
			/>

			<div className='bg-white p-4 shadow-sm rounded-lg flex flex-wrap gap-4 items-center mb-6'>
				<div className='w-56'>
					<FloatingInput label='Date' type='date' value={selectedDate} onChange={setSelectedDate} />
				</div>
				<FloatingDropdown
					label='Client'
					options={clients}
					value={selectedClientId}
					onChange={setSelectedClientId}
					className='w-56'
				/>
				<FloatingDropdown
					label='Washing Facility'
					options={facilities.map(facility => ({
						value: facility.id.toString(),
						label: facility.location,
					}))}
					value={selectedFacility}
					onChange={setSelectedFacility}
					className='w-56'
				/>
				<SearchButton
					onClick={() => {
						setPageNumber(1);
						fetchData(true);
					}}
					disabled={loading || !selectedDate || !selectedFacility}
				/>
			</div>

			{rows.length > 0 && (
				<div className='bg-white rounded-lg overflow-hidden'>
					{/* Table Header */}
					<div className='px-6 py-3 border-b border-gray-200'>
						<div className='grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700'>
							<div className='col-span-1'>Sl. No</div>
							<div className='col-span-5'>Client</div>
							<div className='col-span-6'>Pickup Date & Time</div>
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

			{!loading && rows.length === 0 && selectedDate && selectedFacility && (
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
						No containers were received at the selected washing facility for the specified date.
					</p>
				</div>
			)}
		</div>
	);
};

export default ReceivedInventoryListing;
