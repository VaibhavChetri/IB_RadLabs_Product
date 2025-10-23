import React, { useEffect, useMemo, useState } from 'react';
import {
	MultiSelectDropdown,
	Table,
	Pagination,
	SearchButton,
	FloatingInput,
	Badge,
	PageHeader,
} from '../components/ui';
import { TransitPlanApi, TransitPlanRow } from '../services/transitPlanApi';

// Type Badge Component for Dispatch/Pickup
const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
	const normalizedType = type.toLowerCase();

	if (normalizedType.includes('dispatch')) {
		return (
			<Badge variant='type' type='dispatch' icon='🚛'>
				Dispatch
			</Badge>
		);
	} else if (normalizedType.includes('pickup')) {
		return (
			<Badge variant='type' type='pickup' icon='🚚'>
				Pickup
			</Badge>
		);
	} else {
		return (
			<Badge variant='type' type='default'>
				{type}
			</Badge>
		);
	}
};

// Status Badge Component with Creative Color Coding
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
	const normalizedStatus = status.toLowerCase();

	if (normalizedStatus.includes('new') || normalizedStatus.includes('pending')) {
		return (
			<Badge variant='status' type='scheduled' icon='⏰'>
				Scheduled
			</Badge>
		);
	} else if (
		normalizedStatus.includes('progress') ||
		normalizedStatus.includes('ongoing') ||
		normalizedStatus.includes('active')
	) {
		return (
			<Badge variant='status' type='inProgress' icon='⚡'>
				In Progress
			</Badge>
		);
	} else if (
		normalizedStatus.includes('complete') ||
		normalizedStatus.includes('done') ||
		normalizedStatus.includes('delivered') ||
		normalizedStatus.includes('finished')
	) {
		return (
			<Badge variant='status' type='completed' icon='✅'>
				Completed
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

const TransitPlanListing: React.FC = () => {
	// Date filters
	const [startDate, setStartDate] = useState<string>('');
	const [endDate, setEndDate] = useState<string>('');

	// Data and pagination
	const [rows, setRows] = useState<TransitPlanRow[]>([]);
	const [loading, setLoading] = useState(false);
	const [pageNumber, setPageNumber] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	const [totalItems, setTotalItems] = useState(0);

	// Sorting state
	const [sortBy, setSortBy] = useState<string>('transit_date');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

	// Column visibility state
	const [visibleColumns, setVisibleColumns] = useState<string[]>([
		'serial',
		'transit_date',
		'transit_time',
		'restaurant_name',
		'type',
		'transit_status_label',
		'delay_of',
		'driver_name',
		'facility',
		'vehicle_type',
		'driver_phone',
		'vehicle_number',
		'initiated_date',
		'total_qty',
		'signature_name',
		'creation_date',
		'created_by',
	]);

	// Handle column sorting
	const handleSort = (key: string, order: 'asc' | 'desc') => {
		setSortBy(key);
		setSortOrder(order);
		setPageNumber(1); // Reset to first page when sorting
		fetchData(true); // Fetch data with new sorting
	};

	// Fetch data from API
	const fetchData = async (_useFilters = true) => {
		setLoading(true);
		try {
			// Use actual date state or fallback to default dates
			const start = startDate || '2025-01-01';
			const end = endDate || '2025-12-31';

			console.log('🔍 Fetching transit plan data with:', {
				start_date: start,
				end_date: end,
				page: pageNumber,
				limit: itemsPerPage,
				sortField: sortBy,
				sortOrder: sortOrder,
			});
			console.log('📄 Pagination Request Params:');
			console.log('  - Page:', pageNumber);
			console.log('  - Limit:', itemsPerPage);

			const res = await TransitPlanApi.getTransitPlanListing({
				start_date: start,
				end_date: end,
				page: pageNumber,
				limit: itemsPerPage,
				sortField: sortBy,
				sortOrder: sortOrder,
			});

			setRows(res.data.rows || []);
			setTotalItems(res.pagination?.totalItems || 0);
		} catch (error) {
			console.error('❌ Error fetching transit plan listing:', error);
			console.error('❌ Error details:', error);
			setRows([]);
			setTotalItems(0);
		} finally {
			setLoading(false);
		}
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
		if (startDate && endDate) {
			fetchData(true);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [startDate, endDate]);

	// Load data when pagination or sorting changes
	useEffect(() => {
		if (startDate && endDate) {
			fetchData(true);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pageNumber, itemsPerPage, sortBy, sortOrder]);

	// Define all available columns
	const allColumns = useMemo(
		() => [
			{
				key: 'serial',
				label: '#',
				title: 'Sl. No',
				width: '60px',
				sortable: false,
				render: (_: unknown, __: TransitPlanRow, index: number) =>
					(pageNumber - 1) * itemsPerPage + index + 1,
			},
			{
				key: 'transit_date',
				label: 'Transit Date',
				title: 'Transit Date',
				sortable: true,
				render: (_: unknown, row: TransitPlanRow) => row.transit_date || '-',
			},
			{
				key: 'transit_time',
				label: 'Time',
				title: 'Time',
				sortable: true,
				render: (_: unknown, row: TransitPlanRow) => row.transit_time || '-',
			},
			{
				key: 'restaurant_name',
				label: 'Restaurant',
				title: 'Restaurant',
				sortable: true,
				render: (_: unknown, row: TransitPlanRow) => row.restaurant_name || '-',
			},
			{
				key: 'type',
				label: 'Type',
				title: 'Type',
				sortable: true,
				render: (_: unknown, row: TransitPlanRow) =>
					row.type ? <TypeBadge type={row.type} /> : <span className='text-gray-400'>-</span>,
			},
			{
				key: 'transit_status_label',
				label: 'Status',
				title: 'Status',
				sortable: true,
				render: (_: unknown, row: TransitPlanRow) =>
					row.transit_status_label ? (
						<StatusBadge status={row.transit_status_label} />
					) : (
						<span className='text-gray-400'>-</span>
					),
			},
			{
				key: 'delay_of',
				label: 'Delay',
				title: 'Delay',
				sortable: true,
				render: (_: unknown, row: TransitPlanRow) => row.delay_of || '-',
			},
			{
				key: 'driver_name',
				label: 'Driver',
				title: 'Driver',
				sortable: true,
				render: (_: unknown, row: TransitPlanRow) => row.driver_name || '-',
			},
			{
				key: 'facility',
				label: 'Facility',
				title: 'Facility',
				sortable: true,
				render: (_: unknown, row: TransitPlanRow) => row.facility || row.facility_name || '-',
			},
			{
				key: 'vehicle_type',
				label: 'Vehicle Type',
				title: 'Vehicle Type',
				sortable: true,
				render: (_: unknown, row: TransitPlanRow) => row.vehicle_type || '-',
			},
			{
				key: 'driver_phone',
				label: 'Driver Phone',
				title: 'Driver Phone',
				sortable: false,
				render: (_: unknown, row: TransitPlanRow) => row.driver_phone || '-',
			},
			{
				key: 'vehicle_number',
				label: 'Vehicle Number',
				title: 'Vehicle Number',
				sortable: true,
				render: (_: unknown, row: TransitPlanRow) =>
					row.vehicle_number || row.vehicle_no || row.plate_number || '-',
			},
			{
				key: 'initiated_date',
				label: 'Initiated Date',
				title: 'Initiated Date',
				sortable: true,
				render: (_: unknown, row: TransitPlanRow) => row.initiated_date || row.initiated_at || '-',
			},
			{
				key: 'total_qty',
				label: 'Total Qty',
				title: 'Total Qty',
				sortable: true,
				render: (_: unknown, row: TransitPlanRow) => row.total_qty || '-',
			},
			{
				key: 'signature_name',
				label: 'Signature',
				title: 'Signature',
				sortable: false,
				render: (_: unknown, row: TransitPlanRow) => row.signature_name || '-',
			},
			{
				key: 'delay_of',
				label: 'Delay',
				title: 'Delay',
				sortable: true,
				render: (_: unknown, row: TransitPlanRow) => row.delay_of || '-',
			},
			{
				key: 'creation_date',
				label: 'Created Date',
				title: 'Created Date',
				sortable: true,
				render: (_: unknown, row: TransitPlanRow) => row.creation_date || '-',
			},
			{
				key: 'created_by',
				label: 'Created By',
				title: 'Created By',
				sortable: true,
				render: (_: unknown, row: TransitPlanRow) => row.created_by || '-',
			},
		],
		[pageNumber, itemsPerPage]
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
				.filter(col => col.key !== 'serial')
				.map(col => ({
					label: col.label,
					value: col.key,
				})),
		[allColumns]
	);

	// Format date for input
	const formatDateForInput = (date: Date) => {
		return date.toISOString().split('T')[0];
	};

	return (
		<>
			<PageHeader
				title='Transit Plan Listing'
				locationName={rows.length > 0 ? rows[0].city_name : undefined}
				totalItems={totalItems}
				itemType='transit plans'
				icon='🚛'
			/>

			<div className='bg-white p-4 shadow-sm rounded-lg flex flex-wrap gap-4 items-center mb-6'>
				<div className='w-56'>
					<FloatingInput label='From Date' type='date' value={startDate} onChange={setStartDate} />
				</div>
				<div className='w-56'>
					<FloatingInput label='To Date' type='date' value={endDate} onChange={setEndDate} />
				</div>
				<MultiSelectDropdown
					label='Show Columns'
					options={columnOptions}
					value={visibleColumns.filter(col => col !== 'serial')}
					onChange={selectedValues => {
						// Always keep serial column visible
						setVisibleColumns(['serial', ...selectedValues]);
					}}
					className='w-56'
					searchable={true}
					showSelectedCount={true}
				/>
				<SearchButton
					onClick={() => {
						setPageNumber(1);
						fetchData(true);
					}}
					title='Search'
					size='md'
				/>
			</div>

			<div className='overflow-x-auto'>
				<Table<TransitPlanRow>
					columns={columns}
					data={rows}
					loading={loading}
					emptyText='No transit plans found.'
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

export default TransitPlanListing;
