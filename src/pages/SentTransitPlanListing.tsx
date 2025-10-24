import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import {
	FloatingDropdown,
	MultiSelectDropdown,
	Table,
	Pagination,
	SearchButton,
	FloatingInput,
	Badge,
	PageHeader,
} from '../components/ui';
import { TransitPlanApi, SentTransitPlanRow, RestaurantOption } from '../services/transitPlanApi';

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

const SentTransitPlanListing: React.FC = () => {
	const { user } = useSelector((state: RootState) => state.auth);
	const cityId = user?.city_id ?? 3;
	const navigate = useNavigate();

	const [startDate, setStartDate] = useState<string>('');
	const [endDate, setEndDate] = useState<string>('');
	const [restaurants, setRestaurants] = useState<DropdownOption[]>([]);
	const [selectedClientId, setSelectedClientId] = useState<string>('');
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
		'transitType',
		'driver_name',
		'driver_phone',
		'facilityName',
		'transit_status_label',
	]);

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

	// Handle sorting
	const handleSort = (key: string, order: 'asc' | 'desc') => {
		setSortBy(key);
		setSortOrder(order);
		setPageNumber(1);
		fetchData();
	};

	// Set default date range
	useEffect(() => {
		const today = new Date();
		const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
		setStartDate(formatDateForInput(thirtyDaysAgo));
		setEndDate(formatDateForInput(today));
	}, []);

	const fetchData = useCallback(async () => {
		console.log('🔍 SentTransitPlanListing: Starting fetchData...');
		setLoading(true);
		try {
			const start = startDate || '2025-01-01';
			const end = endDate || '2025-12-31';

			const res = await TransitPlanApi.getCurrentPlanDetails({
				start_date: start,
				end_date: end,
				location_id: selectedClientId || undefined,
				facility_id: 115, // Default facility
				transit_type_id: 1, // Default to dispatch
				page: pageNumber,
				limit: itemsPerPage,
			});

			console.log('🔍 SentTransitPlanListing: API Response:', res);
			console.log('🔍 SentTransitPlanListing: Rows received:', res.result?.length || 0);
			console.log('🔍 SentTransitPlanListing: Total items:', res.pagination?.totalItems || 0);

			setRows(res.result || []);
			setTotalItems(res.pagination?.totalItems || 0);
		} catch (error) {
			console.error('❌ SentTransitPlanListing: Error fetching sent transit plan data:', error);
			setRows([]);
			setTotalItems(0);
		} finally {
			setLoading(false);
		}
	}, [startDate, endDate, selectedClientId, pageNumber, itemsPerPage]);

	useEffect(() => {
		if (startDate && endDate) {
			fetchData();
		}
	}, [
		startDate,
		endDate,
		selectedClientId,
		pageNumber,
		itemsPerPage,
		sortBy,
		sortOrder,
		fetchData,
	]);

	// Define all available columns
	const allColumns = useMemo(
		() => [
			{
				key: 'actions',
				label: 'Actions',
				title: 'Actions',
				width: '80px',
				render: (_: unknown, row: SentTransitPlanRow) => (
					<div className='flex items-center justify-center'>
						<button
							className='p-1.5 rounded hover:bg-gray-100 text-blue-600'
							title='DC Generated'
							onClick={() => {
								console.log('DC Generated for:', row.id);
								// TODO: Implement DC generation functionality
							}}
						>
							<span className='text-sm font-bold'>DC</span>
						</button>
					</div>
				),
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
				render: (_: unknown, row: SentTransitPlanRow) => (
					<button
						className='text-blue-600 hover:text-blue-800 hover:underline cursor-pointer'
						onClick={() => {
							navigate(
								`/transit-plan/sent/client-details/${row.clientLocationId}/${row.facilityId}`,
								{
									state: {
										clientName: row.restaurantName,
										clientId: row.restaurantId,
									},
								}
							);
						}}
					>
						{row.restaurantName || '-'}
					</button>
				),
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
				title='Sent Transit Plan Listing (Dispatch)'
				locationName={user?.city_id === 3 ? 'Mumbai' : 'City'}
				totalItems={totalItems}
				itemType='sent dispatch plans'
				icon='🚛'
			/>

			<div className='bg-white p-4 shadow-sm rounded-lg flex flex-wrap gap-4 items-center mb-6'>
				<div className='w-56'>
					<FloatingInput label='From Date' type='date' value={startDate} onChange={setStartDate} />
				</div>
				<div className='w-56'>
					<FloatingInput label='To Date' type='date' value={endDate} onChange={setEndDate} />
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
					emptyText='No sent transit plans found.'
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

export default SentTransitPlanListing;
