import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { RootState } from '../../store';
import {
	FloatingInput,
	FloatingDropdown,
	MultiSelectDropdown,
	Table,
	Pagination,
	PageHeader,
} from '../../components/ui';
import { KamApiService, InventoryValueRow } from '../../services/kamApi';
import { InventoryApiService } from '../../services/inventoryApi';
import { setInventoryListing, setInventoryListingLoading } from '../../store/slices/kamSlice';

type DropdownOption = { label: string; value: string };

const INVENTORY_LISTING_DATES_KEY = 'kam_inventory_listing_dates';

const InventoryListing: React.FC = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { user } = useSelector((state: RootState) => state.auth);
	const { data, pagination, loading } = useSelector(
		(state: RootState) => state.kam.inventoryListing
	);

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

	// Load clients dropdown
	useEffect(() => {
		if (user?.city_id) {
			InventoryApiService.getClientByCity(user.city_id).then(res => {
				const clients = res.result || [];
				setClients([
					{ label: 'All Clients', value: '' },
					...clients.map((c: any) => ({ label: c.clientName, value: String(c.clientId) })),
				]);
			});
		}
	}, [user?.city_id]);

	const fetchData = useCallback(async () => {
		dispatch(setInventoryListingLoading(true));
		try {
			const response = await KamApiService.getEverydayClientInventoryValues({
				start_date: startDate,
				end_date: endDate,
				client_id: selectedClientId ? Number(selectedClientId) : undefined,
				page: pageNumber,
				limit: itemsPerPage,
			});

			dispatch(
				setInventoryListing({
					data: response.data?.data || response.data || [],
					totals: response.data?.totals || { totalDispatch: '0', totalReturned: '0' },
					pagination: response.data?.pagination || {},
					loading: false,
				})
			);
		} catch (error) {
			console.error('Error fetching inventory listing:', error);
		} finally {
			dispatch(setInventoryListingLoading(false));
		}
	}, [dispatch, startDate, endDate, selectedClientId, pageNumber, itemsPerPage]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// No need to filter client-side since API now handles it
	const filteredData = data;

	// Column options for MultiSelectDropdown
	const columnOptions = useMemo(
		() =>
			allColumns
				.filter(col => col.key !== 'serial')
				.map(col => ({
					label: col.title,
					value: col.key,
				})),
		[allColumns]
	);

	const totalItems = pagination?.totalItems || 0;
	const totalPages = pagination?.totalPages || 0;

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
			</div>

			{loading ? (
				<div className='text-center py-8'>Loading...</div>
			) : (
				<Table<InventoryValueRow>
					columns={allColumns.filter(col => visibleColumns.includes(col.key))}
					data={filteredData}
					className='bg-white'
				/>
			)}

			{totalPages > 1 && (
				<Pagination
					currentPage={pageNumber}
					totalPages={totalPages}
					totalItems={totalItems}
					itemsPerPage={itemsPerPage}
					onPageChange={setPageNumber}
					onItemsPerPageChange={setItemsPerPage}
				/>
			)}
		</div>
	);
};

export default InventoryListing;
