import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store';
import { FloatingInput, Pagination, PageHeader, SearchButton, Table } from '../../components/ui';
import { KamApiService, ClientPlanRow } from '../../services/kamApi';
import { setClientListing, setClientListingLoading } from '../../store/slices/kamSlice';

const CLIENT_LISTING_DATE_KEY = 'kam_client_listing_selected_date';

const ClientListing: React.FC = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	// const location = useLocation();
	const { user } = useSelector((state: RootState) => state.auth);
	const { data, stats, pagination, loading } = useSelector(
		(state: RootState) => state.kam.clientListing
	);

	// Helper function to get saved date from localStorage
	const getSavedDate = useCallback(() => {
		// Check new key first
		let savedDate = localStorage.getItem(CLIENT_LISTING_DATE_KEY);

		// If not found, check old key and migrate
		if (!savedDate) {
			const oldKey = 'clientListing_selectedDate';
			const oldDate = localStorage.getItem(oldKey);
			if (oldDate) {
				console.log(
					'🔄 Migrating date from old key:',
					oldKey,
					'to new key:',
					CLIENT_LISTING_DATE_KEY
				);
				localStorage.setItem(CLIENT_LISTING_DATE_KEY, oldDate);
				localStorage.removeItem(oldKey); // Remove old key
				savedDate = oldDate;
			}
		}

		return savedDate || new Date().toISOString().split('T')[0];
	}, []);

	// Get date from localStorage, default to today
	const [selectedDate, setSelectedDate] = useState(() => getSavedDate());

	// Load date from localStorage on mount to ensure it's persisted
	useEffect(() => {
		const savedDate = getSavedDate();
		if (savedDate && savedDate !== selectedDate) {
			console.log('📅 Loading saved date from localStorage:', savedDate);
			setSelectedDate(savedDate);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Save date to localStorage whenever it changes
	useEffect(() => {
		if (selectedDate) {
			localStorage.setItem(CLIENT_LISTING_DATE_KEY, selectedDate);
			console.log('💾 Saved date to localStorage:', CLIENT_LISTING_DATE_KEY, selectedDate);

			// Clean up old key if it still exists
			const oldKey = 'clientListing_selectedDate';
			if (localStorage.getItem(oldKey)) {
				console.log('🧹 Removing old localStorage key:', oldKey);
				localStorage.removeItem(oldKey);
			}
		}
	}, [selectedDate]);

	const [pageNumber, setPageNumber] = useState(1);
	const [itemsPerPage] = useState(10);

	const fetchData = useCallback(async () => {
		dispatch(setClientListingLoading(true));
		try {
			const response = await KamApiService.getInventoryClientPlan({
				startDate: selectedDate,
				page: pageNumber,
				limit: itemsPerPage,
			});

			const responseData = response as {
				data?: ClientPlanRow[];
				stats?: { pending: number; total: number; display: string };
				pagination?: { page: number; limit: number; totalItems: number; totalPages: number };
			};

			dispatch(
				setClientListing({
					data: responseData.data || [],
					stats: responseData.stats || { pending: 0, total: 0, display: '0/0' },
					pagination: responseData.pagination || {
						page: pageNumber,
						limit: itemsPerPage,
						totalItems: 0,
						totalPages: 0,
					},
					loading: false,
				})
			);
		} catch (error) {
			console.error('Error fetching client listing:', error);
		} finally {
			dispatch(setClientListingLoading(false));
		}
	}, [dispatch, selectedDate, pageNumber, itemsPerPage]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const allColumns = useMemo(
		() => [
			{
				key: 'serial',
				title: '#',
				width: '80px',
				sortable: false,
				render: (_: unknown, __: ClientPlanRow, index: number) =>
					(pageNumber - 1) * itemsPerPage + index + 1,
			},
			{
				key: 'clientName',
				title: 'Client Name',
				sortable: true,
				render: (_: unknown, row: ClientPlanRow) => (
					<button
						className='text-blue-600 hover:text-blue-800 underline cursor-pointer font-medium'
						onClick={() =>
							navigate(`/kam/clients/${row.clientId}/${selectedDate}`, {
								state: { clientName: row.clientName },
							})
						}
					>
						{row.clientName}
					</button>
				),
			},
		],
		[navigate, pageNumber, itemsPerPage, selectedDate]
	);

	const visibleColumns = useMemo(() => allColumns, [allColumns]);

	const totalItems = stats?.total || pagination?.totalItems || 0;
	const totalPages = pagination?.totalPages || 0;

	return (
		<div className='space-y-4'>
			{/* Modern Dashboard Header with Integrated Stats */}
			<div className='bg-white rounded-xl shadow-lg p-6 border border-gray-100'>
				<div className='flex items-center justify-between mb-4'>
					<div className='flex items-center gap-4'>
						<PageHeader
							title='Client Listing'
							locationName={user?.city_name || 'City'}
							totalItems={totalItems}
							itemType='clients'
							icon='👥'
						/>
					</div>
					{stats && stats.total > 0 && (
						<div className='inline-flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-gray-200 shadow-sm'>
							<div className='flex items-center gap-2'>
								<div className='w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold'>
									{stats.total}
								</div>
								<div>
									<div className='text-xs text-gray-500'>Total Clients</div>
								</div>
							</div>
							<div className='w-px h-8 bg-gray-300' />
							<div className='flex items-center gap-2'>
								<div className='w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold'>
									{stats.total - stats.pending}
								</div>
								<div>
									<div className='text-xs text-gray-500'>Completed</div>
								</div>
							</div>
							<div className='w-px h-8 bg-gray-300' />
							<div className='flex items-center gap-2'>
								<div
									className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
										stats.pending > 0
											? 'bg-gradient-to-br from-orange-500 to-red-500'
											: 'bg-gray-300'
									}`}
								>
									{stats.pending}
								</div>
								<div>
									<div className='text-xs text-gray-500'>Pending</div>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Progress Bar & Success Message */}
				{stats && stats.total > 0 && (
					<div className='mt-4'>
						{stats.pending === 0 && (
							<div className='bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl p-4 mb-4 flex items-center justify-center gap-3 shadow-md'>
								<span className='text-2xl animate-bounce'>🎉</span>
								<div className='text-center'>
									<div className='text-lg font-bold text-green-700'>All Done!</div>
									<div className='text-sm text-green-600'>All {stats.total} clients completed</div>
								</div>
								<span className='text-2xl animate-bounce'>✅</span>
							</div>
						)}
						<div className='flex items-center justify-between text-xs text-gray-600 mb-2'>
							<span>Completion Status</span>
							<span>{Math.round(((stats.total - stats.pending) / stats.total) * 100)}%</span>
						</div>
						<div className='w-full bg-gray-200 rounded-full h-2 overflow-hidden'>
							<div
								className='bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out'
								style={{
									width: `${((stats.total - stats.pending) / stats.total) * 100}%`,
								}}
							/>
						</div>
					</div>
				)}
			</div>

			<div className='bg-white p-4 shadow-sm rounded-lg flex flex-wrap gap-4 items-center'>
				<FloatingInput
					type='date'
					label='Date'
					value={selectedDate}
					onChange={date => {
						console.log('📅 Date changed in listing:', date);
						setSelectedDate(date);
					}}
					className='w-48'
				/>
				<SearchButton onClick={fetchData} disabled={loading} />
			</div>

			{loading ? (
				<div className='text-center py-8'>Loading...</div>
			) : (
				<Table<ClientPlanRow> columns={visibleColumns} data={data} className='bg-white' />
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

export default ClientListing;
