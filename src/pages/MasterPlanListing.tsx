import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { setEditMasterPlanData } from '../store/slices/transitPlanSlice';
import {
	FloatingDropdown,
	MultiSelectDropdown,
	Table,
	Pagination,
	SearchButton,
} from '../components/ui';
import {
	TransitPlanApi,
	FacilityOption,
	ClientByCityOption,
	MasterPlanRow,
} from '../services/transitPlanApi';
import { CommonApiService, TransitTypeOption } from '../services/commonApi';
import { Pencil, Trash2 } from 'lucide-react';

type DropdownOption = { label: string; value: string };

// Transit types will be loaded from API

const MasterPlanListing: React.FC = () => {
	const { user } = useSelector((s: RootState) => s.auth);
	const cityId = user?.city_id ?? 3;
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const [facilities, setFacilities] = useState<DropdownOption[]>([]);
	const [clients, setClients] = useState<DropdownOption[]>([]);
	const [transitTypes, setTransitTypes] = useState<DropdownOption[]>([]);
	const [filters, setFilters] = useState<{
		facility_id?: string;
		client_id?: string;
		transit_type_id?: string;
	}>({});
	const [rows, setRows] = useState<MasterPlanRow[]>([]);
	const [loading, setLoading] = useState(false);
	const [pageNumber, setPageNumber] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	const [totalItems, setTotalItems] = useState(0);

	// Column visibility state
	const [visibleColumns, setVisibleColumns] = useState<string[]>([
		'actions',
		'serial',
		'transit_time',
		'restaurant_name',
		'type',
		'driver_name',
		'vehicle_type',
		'vehicle_number',
		'driver_phone',
	]);

	// Filter change handler - only updates state, no API calls
	const handleFilterChange = (name: string, value: string) => {
		setFilters(prev => ({ ...prev, [name]: value }));
		console.log('🔍 Filter updated:', { name, value });
	};

	// Load dropdowns
	useEffect(() => {
		(async () => {
			const [facRes, cliRes, transitRes] = await Promise.all([
				TransitPlanApi.getFacilities(cityId),
				TransitPlanApi.getClientsByCity(), // Remove cityId parameter
				CommonApiService.getTransitTypes(),
			]);
			setFacilities([
				{ label: 'All', value: '' },
				...facRes.data.map((f: FacilityOption) => ({ label: f.location, value: String(f.id) })),
			]);
			setClients([
				{ label: 'All', value: '' },
				...cliRes.data.map((c: ClientByCityOption) => ({
					label: c.clientName,
					value: String(c.clientId),
				})),
			]);
			setTransitTypes([
				{ label: 'All', value: '' },
				...transitRes.data.map((t: TransitTypeOption) => ({
					label: t.name,
					value: String(t.id),
				})),
			]);
		})();
	}, [cityId]);

	const fetchListing = async (useFilters = true) => {
		setLoading(true);
		try {
			const res = await TransitPlanApi.getMasterPlanListing({
				pageNumber,
				pageSize: itemsPerPage,
				sortOrder: 'asc',
				facilityId: useFilters && filters.facility_id ? parseInt(filters.facility_id) : undefined,
				restaurantId: useFilters && filters.client_id ? parseInt(filters.client_id) : undefined,
				transitTypeId:
					useFilters && filters.transit_type_id ? parseInt(filters.transit_type_id) : undefined,
			});
			setRows(res.data.rows);
			setTotalItems(res.data.pagination.totalItems);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchListing(false); // Initial load without filters
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pageNumber, itemsPerPage]);

	// Define all available columns
	const allColumns = useMemo(
		() => [
			{
				key: 'actions',
				label: 'Actions',
				title: 'Actions',
				width: '110px',
				render: (_: unknown, row: MasterPlanRow) => (
					<div className='flex items-center gap-2'>
						<button
							className='p-1.5 rounded hover:bg-gray-100'
							title='Edit'
							onClick={() => {
								// Store raw row data in Redux for editing
								dispatch(setEditMasterPlanData(row));
								navigate('/transit-plan/master-plan/edit');
							}}
						>
							<Pencil className='h-4 w-4 text-green-600' />
						</button>
						<button className='p-1.5 rounded hover:bg-gray-100' title='Delete'>
							<Trash2 className='h-4 w-4 text-red-600' />
						</button>
					</div>
				),
			},
			{
				key: 'serial',
				label: '#',
				title: 'Sl. No',
				width: '60px',
				render: (_: unknown, __: MasterPlanRow, index: number) =>
					(pageNumber - 1) * itemsPerPage + index + 1,
			},
			{ key: 'transit_time', label: 'Time', title: 'Time' },
			{ key: 'restaurant_name', label: 'Client', title: 'Client' },
			{ key: 'type', label: 'Type', title: 'Type' },
			{ key: 'driver_name', label: 'Driver', title: 'Driver' },
			{ key: 'vehicle_type', label: 'Vehicle', title: 'Vehicle' },
			{ key: 'vehicle_number', label: 'Vehicle #', title: 'Vehicle #' },
			{ key: 'driver_phone', label: 'Driver Phone', title: 'Driver Phone' },
			{ key: 'created_by', label: 'Created By', title: 'Created By' },
			{ key: 'city_name', label: 'City Name', title: 'City Name' },
			{ key: 'facility', label: 'Facility', title: 'Facility' },
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
				.filter(col => !['actions', 'serial'].includes(col.key))
				.map(col => ({
					label: col.label,
					value: col.key,
				})),
		[allColumns]
	);

	return (
		<>
			<div className='mb-6'>
				<h1 className='text-2xl font-semibold text-gray-900 mb-2'>
					Master Plan Listing - {user?.city_id === 3 ? 'Mumbai' : 'City'}
				</h1>
				<p className='text-sm text-gray-600'>{totalItems} master plans found</p>
			</div>

			<div className='bg-white p-4 shadow-sm rounded-lg flex flex-wrap gap-4 items-center mb-6'>
				<FloatingDropdown
					label='Washing Facility'
					options={facilities}
					value={filters.facility_id ?? ''}
					onChange={v => handleFilterChange('facility_id', v)}
					className='w-56'
				/>
				<FloatingDropdown
					label='Client'
					options={clients}
					value={filters.client_id ?? ''}
					onChange={v => handleFilterChange('client_id', v)}
					className='w-56'
				/>
				<FloatingDropdown
					label='Transit Type'
					options={transitTypes}
					value={filters.transit_type_id ?? ''}
					onChange={v => handleFilterChange('transit_type_id', v)}
					className='w-56'
				/>
				<MultiSelectDropdown
					label='Show Columns'
					options={columnOptions}
					value={visibleColumns.filter(col => !['actions', 'serial'].includes(col))}
					onChange={selectedValues => {
						// Always keep actions and serial columns visible
						setVisibleColumns(['actions', 'serial', ...selectedValues]);
					}}
					className='w-56'
					searchable={true}
					showSelectedCount={true}
				/>
				<SearchButton
					onClick={() => {
						setPageNumber(1);
						fetchListing(true);
					}}
					title='Search'
					size='md'
				/>
			</div>

			<div className='overflow-x-auto'>
				<Table
					columns={columns as any}
					data={rows as any}
					loading={loading}
					emptyText='No master plans found.'
					className='min-w-max'
				/>
			</div>

			<Pagination
				currentPage={pageNumber}
				totalPages={Math.ceil(totalItems / itemsPerPage)}
				totalItems={totalItems}
				itemsPerPage={itemsPerPage}
				onPageChange={setPageNumber}
				onItemsPerPageChange={setItemsPerPage}
				className='mt-4'
			/>
		</>
	);
};

export default MasterPlanListing;
