import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
	FloatingInput,
	FloatingDropdown,
	MultiSelectDropdown,
	Table,
	Pagination,
	SearchButton,
	PageHeader,
	Badge,
	StatCard,
} from '../components/ui';
import { KamApiService, InventoryValueRow } from '../services/kamApi';
import { InventoryApiService } from '../services/inventoryApi';
import { TransitPlanApi } from '../services/transitPlanApi';
import { setInventoryListing, setInventoryListingLoading } from '../store/slices/kamSlice';

type DropdownOption = { label: string; value: string };

const InventoryListing: React.FC = () => {
	const dispatch = useDispatch();
	const { user } = useSelector((state: RootState) => state.auth);
	const { data, totals, pagination, loading } = useSelector(
		(state: RootState) => state.kam.inventoryListing
	);

	const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
	const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
	const [clients, setClients] = useState<DropdownOption[]>([]);
	const [selectedClientId, setSelectedClientId] = useState<string>('');
	const [pageNumber, setPageNumber] = useState(1);
	const [itemsPerPage] = useState(10);

	const allColumns = useMemo(
		() => [
			{
				key: 'serial',
				title: '#',
				width: '80px',
				sortable: false,
				render: (_: unknown, __: InventoryValueRow, index: number) =>
					(pageNumber - 1) * itemsPerPage + index + 1,
			},
			{ key: 'clientName', title: 'Client', sortable: true },
			{ key: 'containerType', title: 'Container', sortable: true },
			{ key: 'openingStock', title: 'Opening', sortable: true },
			{ key: 'dispatch', title: 'Dispatch', sortable: true },
			{ key: 'returned', title: 'Returned', sortable: true },
			{ key: 'closing', title: 'Closing', sortable: true },
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
		[pageNumber, itemsPerPage]
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
				setClients([
					{ label: 'All Clients', value: '' },
					...res.result.map((c: any) => ({ label: c.clientName, value: String(c.clientId) })),
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
					data: response.data,
					totals: response.totals || { totalDispatch: '0', totalReturned: '0' },
					pagination: response.pagination,
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
			<div className='flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4'>
				<PageHeader
					title='Inventory Client Listing'
					locationName={user?.city_name || 'City'}
					totalItems={totalItems}
					itemType='inventory entries'
					icon='📦'
				/>
				<div className='flex items-center gap-6 lg:gap-8'>
					<div className='flex items-start gap-2'>
						<span className='text-2xl'>🚛</span>
						<div>
							<div className='text-xs text-gray-500 uppercase tracking-wide mb-0.5'>Dispatch</div>
							<div className='text-xl font-bold text-blue-600'>{totals?.totalDispatch || '0'}</div>
						</div>
					</div>
					<div className='w-px h-10 bg-gray-300'></div>
					<div className='flex items-start gap-2'>
						<span className='text-2xl transform scale-x-[-1]'>🚚</span>
						<div>
							<div className='text-xs text-gray-500 uppercase tracking-wide mb-0.5'>Returned</div>
							<div className='text-xl font-bold text-orange-600'>
								{totals?.totalReturned || '0'}
							</div>
						</div>
					</div>
				</div>
			</div>

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
				<Table
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
				/>
			)}
		</div>
	);
};

export default InventoryListing;
