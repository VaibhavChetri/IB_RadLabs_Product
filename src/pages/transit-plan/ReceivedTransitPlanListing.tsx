import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store';
import {
	FloatingDropdown,
	MultiSelectDropdown,
	Table,
	Pagination,
	SearchButton,
	FloatingInput,
	Badge,
	PageHeader,
} from '../../components/ui';
import { FacilityDropdown } from '../../components/FacilityDropdown';
import { TransitPlanApi, SentTransitPlanRow, RestaurantOption } from '../../services/transitPlanApi';
import {
	generateDeliveryChallanPDF,
	convertApiResponseToDCData,
	DCApiResponse,
} from '../../services/deliveryChallanGenerator';

type DropdownOption = { label: string; value: string };

// Status Badge Component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
	const normalizedStatus = status.toLowerCase();

	if (normalizedStatus.includes('new')) {
		return (
			<Badge variant='status' type='scheduled' icon='⏰'>
				Scheduled
			</Badge>
		);
	} else if (normalizedStatus.includes('done') || normalizedStatus.includes('complete')) {
		return (
			<Badge variant='status' type='completed' icon='✅'>
				Completed
			</Badge>
		);
	} else if (normalizedStatus.includes('progress') || normalizedStatus.includes('ongoing')) {
		return (
			<Badge variant='status' type='inProgress' icon='⚡'>
				In Progress
			</Badge>
		);
	} else {
		return (
			<Badge variant='status' type='default'>
				{status}
			</Badge>
		);
	}
};

const ReceivedTransitPlanListing: React.FC = () => {
	const { user } = useSelector((state: RootState) => state.auth);
	const cityId = user?.city_id ?? 3;
	const navigate = useNavigate();

	// Local storage key for this page
	const storageKey = 'received-transit-plan-filters';

	const [startDate, setStartDate] = useState<string>('');
	const [endDate, setEndDate] = useState<string>('');
	const [restaurants, setRestaurants] = useState<DropdownOption[]>([]);
	const [selectedClientId, setSelectedClientId] = useState<string>('');
	const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');
	const [rows, setRows] = useState<SentTransitPlanRow[]>([]);
	const [loading, setLoading] = useState(false);
	const [pageNumber, setPageNumber] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	const [totalItems, setTotalItems] = useState(0);
	const [sortBy, setSortBy] = useState<string>('transitDate');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

	// Column visibility state
	const [visibleColumns, setVisibleColumns] = useState<string[]>([
		'actions',
		'serial',
		'restaurantName',
		'transit_time',
		'transitDate',
		'driver_name',
		'driver_phone',
		'facilityName',
		'transit_status_label',
	]);

	// Load filters from localStorage
	const loadFiltersFromStorage = useCallback(() => {
		try {
			const savedFilters = localStorage.getItem(storageKey);
			if (savedFilters) {
				const parsed = JSON.parse(savedFilters);
				console.log('📂 Loaded filters from localStorage:', parsed);

				// Only restore if data is recent (within 24 hours)
				const isRecent = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000;
				if (isRecent) {
					setStartDate(parsed.startDate || '');
					setEndDate(parsed.endDate || '');
					setSelectedClientId(parsed.selectedClientId || '');
					setSelectedFacilityId(parsed.selectedFacilityId || '');
					setVisibleColumns(
						parsed.visibleColumns || [
							'actions',
							'serial',
							'restaurantName',
							'transit_time',
							'transitDate',
							'driver_name',
							'driver_phone',
							'facilityName',
							'transit_status_label',
						]
					);
					setItemsPerPage(parsed.itemsPerPage || 10);
					setSortBy(parsed.sortBy || 'transitDate');
					setSortOrder(parsed.sortOrder || 'desc');
					console.log('✅ Filters restored from localStorage');
					return true;
				} else {
					console.log('⏰ Saved filters are too old, using defaults');
				}
			}
		} catch (error) {
			console.error('❌ Error loading filters from localStorage:', error);
		}
		return false;
	}, [storageKey]);

	// Load restaurants dropdown
	useEffect(() => {
		const loadRestaurants = async () => {
			try {
				console.log('🔍 Loading restaurants for cityId:', cityId);
				const res = await TransitPlanApi.getRestaurants(cityId);
				console.log('🔍 Restaurants API response:', res);
				setRestaurants([
					{ label: 'All Clients', value: '' },
					...res.result.map((r: RestaurantOption) => ({
						label: r.clientName,
						value: String(r.clientId),
					})),
				]);
				console.log('🔍 Restaurants loaded:', res.result.length);
			} catch (error) {
				console.error('❌ Error loading restaurants:', error);
			}
		};
		loadRestaurants();
	}, [cityId]);

	// Handle sorting - client-side sorting
	const handleSort = (key: string, order: 'asc' | 'desc') => {
		setSortBy(key);
		setSortOrder(order);
		setPageNumber(1);

		// Client-side sorting
		const sortedRows = [...rows].sort((a, b) => {
			let aValue: unknown = a[key as keyof SentTransitPlanRow];
			let bValue: unknown = b[key as keyof SentTransitPlanRow];

			// Handle different data types
			if (typeof aValue === 'string' && typeof bValue === 'string') {
				aValue = aValue.toLowerCase();
				bValue = bValue.toLowerCase();
			}

			// Type-safe comparison
			if (typeof aValue === 'number' && typeof bValue === 'number') {
				if (aValue < bValue) return order === 'asc' ? -1 : 1;
				if (aValue > bValue) return order === 'asc' ? 1 : -1;
				return 0;
			}

			if (typeof aValue === 'string' && typeof bValue === 'string') {
				if (aValue < bValue) return order === 'asc' ? -1 : 1;
				if (aValue > bValue) return order === 'asc' ? 1 : -1;
				return 0;
			}

			// Fallback: convert to string for comparison
			const aStr = String(aValue ?? '');
			const bStr = String(bValue ?? '');
			if (aStr < bStr) return order === 'asc' ? -1 : 1;
			if (aStr > bStr) return order === 'asc' ? 1 : -1;
			return 0;
		});

		setRows(sortedRows);
	};

	// Set default date range or load from localStorage
	useEffect(() => {
		const loadedFromStorage = loadFiltersFromStorage();

		// Only set default dates if no data was loaded from localStorage
		if (!loadedFromStorage) {
			const today = new Date();
			const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
			setStartDate(formatDateForInput(thirtyDaysAgo));
			setEndDate(formatDateForInput(today));
		}
	}, [loadFiltersFromStorage]);

	const fetchData = useCallback(async () => {
		console.log('🔍 ReceivedTransitPlanListing: Starting fetchData...');
		setLoading(true);
		try {
			const start = startDate || '2025-01-01';
			const end = endDate || '2025-12-31';

			const res = await TransitPlanApi.getReceivedPlanDetails({
				start_date: start,
				end_date: end,
				location_id: selectedClientId || undefined,
				facility_id: selectedFacilityId && selectedFacilityId.trim() !== '' ? Number(selectedFacilityId) : undefined,
				transit_type_id: 2, // Pickup instead of dispatch
				page: pageNumber,
				limit: itemsPerPage,
			});

			console.log('🔍 ReceivedTransitPlanListing: API Response:', res);
			console.log('🔍 ReceivedTransitPlanListing: Rows received:', res.result?.length || 0);
			console.log('🔍 ReceivedTransitPlanListing: Total items:', res.pagination?.totalItems || 0);

			setRows(res.result || []);
			setTotalItems(res.pagination?.totalItems || 0);
		} catch (error) {
			console.error(
				'❌ ReceivedTransitPlanListing: Error fetching received transit plan data:',
				error
			);
			setRows([]);
			setTotalItems(0);
		} finally {
			setLoading(false);
		}
	}, [startDate, endDate, selectedClientId, selectedFacilityId, pageNumber, itemsPerPage]);

	useEffect(() => {
		if (startDate && endDate) {
			fetchData();
		}
	}, [startDate, endDate, selectedClientId, selectedFacilityId, pageNumber, itemsPerPage, fetchData]);

	// Auto-save filters when they change
	useEffect(() => {
		if (startDate && endDate) {
			const filters = {
				startDate,
				endDate,
				selectedClientId,
				selectedFacilityId,
				visibleColumns,
				itemsPerPage,
				sortBy,
				sortOrder,
				timestamp: Date.now(),
			};
			localStorage.setItem(storageKey, JSON.stringify(filters));
			console.log('💾 Auto-saved filters to localStorage:', filters);
		}
	}, [
		startDate,
		endDate,
		selectedClientId,
		selectedFacilityId,
		visibleColumns,
		itemsPerPage,
		sortBy,
		sortOrder,
		storageKey,
	]);

	// Define all available columns
	const allColumns = useMemo(
		() => [
			{
				key: 'actions',
				label: 'Actions',
				title: 'Actions',
				width: '80px',
				render: (_: unknown, row: SentTransitPlanRow) => {
					// Only show DC button when status is completed
					const isCompleted =
						row.transit_status_label?.toLowerCase().includes('complete') ||
						row.transit_status_label?.toLowerCase().includes('done');

					if (!isCompleted) {
						return <div className='flex items-center justify-center text-gray-400'>-</div>;
					}

					return (
						<div className='flex items-center justify-center'>
							<button
								className='group px-2 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors duration-200 flex items-center gap-1 cursor-pointer'
								title='Download DC Document'
								onClick={async () => {
									try {
										console.log('📄 DC Download for:', row.id);

										// First, get the data from API
										const params = {
											location_id: row.facilityId || 115,
											client_id: row.clientLocationId,
											start_date: row.transitDate,
											end_date: row.transitDate,
											transit_time: row.transit_time || '15:00:00',
											transit_type_id: row.transit_type_id,
										};

										console.log('📄 DC API params:', params);
										const response = await TransitPlanApi.getReceivedCount(params);
										console.log('📄 DC API response:', response);

										// Convert API response to PDF data
										const apiResponse = response as DCApiResponse;
										const dcData = convertApiResponseToDCData(apiResponse, {
											id: row.id,
											facilityId: row.facilityId || 115,
											city_id: Number(row.city_id) || 3,
											restaurantName: row.restaurantName || 'Unknown Client',
											transitDate: row.transitDate || new Date().toISOString().split('T')[0],
											transit_time: row.transit_time || '15:00:00',
											signature_name: row.signature_name as string | undefined,
											vehicle_number: row.vehicle_number as string | undefined,
										});

										// Generate and download PDF
										generateDeliveryChallanPDF(dcData);
									} catch (error) {
										console.error('❌ DC Download error:', error);
									}
								}}
							>
								<span className='text-xs font-semibold'>DC</span>
								<svg
									className='w-3 h-3 group-hover:scale-110 transition-transform duration-200'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
									/>
								</svg>
							</button>
						</div>
					);
				},
			},
			{
				key: 'serial',
				label: '#',
				title: 'Sl. No',
				width: '60px',
				render: (_: unknown, __: SentTransitPlanRow, index: number) =>
					(pageNumber - 1) * itemsPerPage + index + 1,
			},
			{
				key: 'restaurantName',
				label: 'Client',
				title: 'Client',
				sortable: true,
				render: (_: unknown, row: SentTransitPlanRow) => {
					const clientName = row.restaurantName || '-';

					// Determine status icon
					const getStatusIcon = () => {
						const status = row.transit_status_label?.toLowerCase();
						if (status?.includes('complete') || status?.includes('done')) {
							return <span className='text-green-600 ml-2'>✅</span>;
						} else if (status?.includes('new') || status?.includes('scheduled')) {
							return <span className='text-blue-600 ml-2'>⏰</span>;
						} else if (status?.includes('progress') || status?.includes('ongoing')) {
							return <span className='text-orange-600 ml-2'>⚡</span>;
						}
						return null;
					};

					// Show hyperlink only if transit_status is 0
					if (row.transit_status === 0) {
						return (
							<div className='flex items-center'>
								<button
									className='text-blue-600 hover:text-blue-800 underline cursor-pointer font-medium transition-colors duration-200'
									onClick={() => {
										navigate(
											`/transit-plan/received/details/${row.clientLocationId}/${row.facilityId}`,
											{
												state: {
													clientName: row.restaurantName,
													clientId: row.restaurantId,
													transitPlanRow: row, // Pass the full row object
												},
											}
										);
									}}
								>
									{clientName}
								</button>
								{getStatusIcon()}
							</div>
						);
					}

					// Show plain text for other statuses
					return (
						<div className='flex items-center'>
							<span className='text-gray-600'>{clientName}</span>
							{getStatusIcon()}
						</div>
					);
				},
			},
			{
				key: 'transit_time',
				label: 'Transit Time',
				title: 'Transit Time',
				sortable: true,
				render: (_: unknown, row: SentTransitPlanRow) => row.transit_time || '-',
			},
			{
				key: 'transitDate',
				label: 'Date',
				title: 'Date',
				sortable: true,
				render: (_: unknown, row: SentTransitPlanRow) => row.transitDate || '-',
			},
			{
				key: 'driver_name',
				label: 'Driver',
				title: 'Driver',
				sortable: true,
				render: (_: unknown, row: SentTransitPlanRow) => row.driver_name || '-',
			},
			{
				key: 'driver_phone',
				label: 'Driver Phone',
				title: 'Driver Phone',
				sortable: false,
				render: (_: unknown, row: SentTransitPlanRow) => row.driver_phone || '-',
			},
			{
				key: 'facilityName',
				label: 'Facility',
				title: 'Facility',
				sortable: true,
				render: (_: unknown, row: SentTransitPlanRow) => row.facilityName || '-',
			},
			{
				key: 'transit_status_label',
				label: 'Status',
				title: 'Status',
				sortable: true,
				render: (_: unknown, row: SentTransitPlanRow) =>
					row.transit_status_label ? (
						<StatusBadge status={row.transit_status_label} />
					) : (
						<span className='text-gray-400'>-</span>
					),
			},
		],
		[pageNumber, itemsPerPage, navigate]
	);

	// Filter columns based on visibility
	const columns = useMemo(
		() => allColumns.filter(col => visibleColumns.includes(col.key)),
		[allColumns, visibleColumns]
	);

	// Column options for MultiSelectDropdown
	const columnOptions = useMemo(
		() =>
			allColumns
				.filter(col => !['actions', 'serial'].includes(col.key))
				.map(col => ({
					label: col.label,
					value: col.key,
				})),
		[allColumns]
	);

	const formatDateForInput = (date: Date) => {
		return date.toISOString().split('T')[0];
	};

	return (
		<>
			<PageHeader
				title='Received Transit Plan Listing (Pickup)'
				locationName={user?.city_id === 3 ? 'Mumbai' : 'City'}
				totalItems={totalItems}
				itemType='received pickup plans'
				icon='🚚'
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
						value={selectedFacilityId}
						onChange={setSelectedFacilityId}
						cityId={cityId}
						autoSelectFirst={true}
						includeAllOption={true}
						className='w-full'
					/>
				</div>
				<FloatingDropdown
					label='Client'
					options={restaurants}
					value={selectedClientId}
					onChange={setSelectedClientId}
					className='w-56'
				/>
				<MultiSelectDropdown
					label='Show Columns'
					options={columnOptions}
					value={visibleColumns.filter(col => !['actions', 'serial'].includes(col))}
					onChange={selectedValues => {
						setVisibleColumns(['actions', 'serial', ...selectedValues]);
					}}
					className='w-56'
					searchable={true}
					showSelectedCount={true}
				/>
				<SearchButton
					onClick={() => {
						setPageNumber(1);
						fetchData();
					}}
					title='Search'
					size='md'
				/>
			</div>

			<div className='overflow-x-auto'>
				<Table<SentTransitPlanRow>
					columns={columns}
					data={rows}
					loading={loading}
					emptyText='No received transit plans found.'
					className='min-w-max'
					sortBy={sortBy}
					sortOrder={sortOrder}
					onSort={handleSort}
				/>
			</div>

			<Pagination
				currentPage={pageNumber}
				totalPages={Math.ceil(totalItems / itemsPerPage)}
				totalItems={totalItems}
				itemsPerPage={itemsPerPage}
				onPageChange={page => {
					console.log('📄 Page changed to:', page);
					setPageNumber(page);
				}}
				onItemsPerPageChange={items => {
					console.log('📄 Items per page changed to:', items);
					setItemsPerPage(items);
				}}
				className='mt-4'
			/>
		</>
	);
};

export default ReceivedTransitPlanListing;
