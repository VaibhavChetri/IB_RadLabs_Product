import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { FloatingInput, Pagination, PageHeader, SearchButton, Table } from '../components/ui';
import { KamApiService, ClientPlanRow } from '../services/kamApi';
import { setClientListing, setClientListingLoading } from '../store/slices/kamSlice';

const ClientListing: React.FC = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { user } = useSelector((state: RootState) => state.auth);
	const { data, stats, pagination, loading } = useSelector(
		(state: RootState) => state.kam.clientListing
	);

	// Load selected date from localStorage, default to today
	const [selectedDate, setSelectedDate] = useState(() => {
		const savedDate = localStorage.getItem('clientListing_selectedDate');
		return savedDate || new Date().toISOString().split('T')[0];
	});
	const [pageNumber, setPageNumber] = useState(1);
	const [itemsPerPage] = useState(10);

	// Save selected date to localStorage whenever it changes
	useEffect(() => {
		localStorage.setItem('clientListing_selectedDate', selectedDate);
	}, [selectedDate]);

	const fetchData = useCallback(async () => {
		dispatch(setClientListingLoading(true));
		try {
			const response = await KamApiService.getInventoryClientPlan({
				startDate: selectedDate,
				page: pageNumber,
				limit: itemsPerPage,
			});

			dispatch(
				setClientListing({
					data: response.data,
					stats: response.stats,
					pagination: response.pagination,
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
							navigate(`/kam/clients/${row.clientId}`, {
								state: { clientName: row.clientName, selectedDate },
							})
						}
					>
						{row.clientName}
					</button>
				),
			},
		],
		[navigate, pageNumber, itemsPerPage]
	);

	const visibleColumns = useMemo(() => allColumns, [allColumns]);

	const totalItems = pagination?.totalItems || 0;
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
					onChange={setSelectedDate}
					className='w-48'
				/>
				<SearchButton onClick={fetchData} disabled={loading} />
			</div>

			{loading ? (
				<div className='text-center py-8'>Loading...</div>
			) : (
				<Table columns={visibleColumns} data={data} className='bg-white' />
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
