import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
	Snackbar,
	FloatingInput,
	FloatingDropdown,
	SearchButton,
} from '../../../components/ui';
import { Table } from '../../../components/ui/DataDisplay';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { useQCRunsData } from '../../../features/qc-rejection/hooks/useQCRunsData';
import { useQCReportAdherence } from '../../../features/qc-rejection/hooks/useQCReportAdherence';
import { InventoryApiService } from '../../../services/inventoryApi';
import { RootState } from '../../../store';
import type { TableColumn } from '../../../components/ui/DataDisplay';

export const QCRejectionAdd: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { user } = useSelector((state: RootState) => state.auth);
	const [transitDate, setTransitDate] = useState<string>('');
	const [selectedClientId, setSelectedClientId] = useState<string>('');
	const [clientOptions, setClientOptions] = useState<Array<{ value: string; label: string }>>([
		{ value: '', label: 'All Clients' },
	]);
	const [loadingClients, setLoadingClients] = useState(false);
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({
		open: false,
		message: '',
		type: 'success',
	});

	// Restore date from location state, localStorage, or set default to today
	useEffect(() => {
		const savedDate = location.state?.transitDate;
		if (savedDate) {
			setTransitDate(savedDate);
			localStorage.setItem('qcRejectionFilterDate', savedDate);
		} else {
			// Try to restore from localStorage
			const storedDate = localStorage.getItem('qcRejectionFilterDate');
			if (storedDate) {
				setTransitDate(storedDate);
			} else {
				const today = new Date().toISOString().split('T')[0];
				setTransitDate(today);
				localStorage.setItem('qcRejectionFilterDate', today);
			}
		}
	}, [location.state]);

	// Save date to localStorage whenever it changes
	useEffect(() => {
		if (transitDate) {
			localStorage.setItem('qcRejectionFilterDate', transitDate);
		}
	}, [transitDate]);

	// Load clients by city
	useEffect(() => {
		const loadClients = async () => {
			if (!user?.city_id) return;

			setLoadingClients(true);
			try {
				const response = await InventoryApiService.getClientByCity(user.city_id);
				if (response.status_code === 200 && response.result) {
					const clientList = response.result.map(client => ({
						value: client.clientId.toString(),
						label: client.clientName,
					}));
					setClientOptions([{ value: '', label: 'All Clients' }, ...clientList]);
				}
			} catch (error) {
				console.error('Failed to load clients:', error);
				setSnackbar({
					open: true,
					message: 'Failed to load clients',
					type: 'error',
				});
			} finally {
				setLoadingClients(false);
			}
		};

		loadClients();
	}, [user?.city_id]);

	// Fetch QC runs
	const {
		data: runsData,
		isLoading: loadingRuns,
		error: runsError,
	} = useQCRunsData({
		transit_date: transitDate,
		client_id: selectedClientId ? parseInt(selectedClientId, 10) : undefined,
		enabled: !!transitDate,
	});

	// Fetch adherence stats (use same date for start and end)
	const {
		data: adherenceData,
		isLoading: loadingAdherence,
		error: adherenceError,
	} = useQCReportAdherence({
		start_date: transitDate,
		end_date: transitDate,
		enabled: !!transitDate,
	});

	// Show error snackbar if API fails
	useEffect(() => {
		if (runsError || adherenceError) {
			setSnackbar({
				open: true,
				message: 'Failed to load QC data',
				type: 'error',
			});
		}
	}, [runsError, adherenceError]);

	const handleSearch = () => {
		if (!transitDate) {
			setSnackbar({
				open: true,
				message: 'Please select a date',
				type: 'error',
			});
			return;
		}
		// Data will be refetched automatically via React Query when transitDate or selectedClientId changes
	};

	const formatDate = (dateString: string): string => {
		if (!dateString) return '-';
		try {
			const date = new Date(dateString);
			const day = String(date.getDate()).padStart(2, '0');
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const year = date.getFullYear();
			return `${day}/${month}/${year}`;
		} catch {
			return dateString;
		}
	};

	const columns = useMemo<TableColumn<Record<string, unknown>>[]>(
		() => [
			{
				key: 'serial',
				title: '#',
				sortable: false,
				align: 'center',
				render: (_value: unknown, _row: Record<string, unknown>, index: number) => (
					<div className='font-semibold text-gray-600 text-center'>{index + 1}</div>
				),
			},
			{
				key: 'clientName',
				title: 'Client Name',
				sortable: true,
				align: 'center',
				render: (value: unknown, row: Record<string, unknown>) => {
					const clientName = String(value || '-');
					const clientId = row.client_id;
					const transitId = row.transit_id;

					return (
						<button
							className='text-blue-600 hover:text-blue-800 underline cursor-pointer font-medium transition-colors duration-200'
							onClick={() => {
								navigate(`/operations-reporting/qc-rejection/details/${clientId}/${transitId}`, {
									state: {
										clientName,
										clientId,
										transitId,
										transitDate: row.transit_date,
										transitTime: row.transit_time,
										filterDate: transitDate, // Pass current filter date
										runId: (row as { id?: number }).id, // Pass runId for API call
									},
								});
							}}
						>
							{clientName}
						</button>
					);
				},
			},
			{
				key: 'transit_date',
				title: 'Transit Date',
				sortable: true,
				align: 'center',
				render: (value: unknown) => (
					<div className='text-gray-900 text-center'>{formatDate(String(value || ''))}</div>
				),
			},
			{
				key: 'transit_time',
				title: 'Time',
				sortable: true,
				align: 'center',
				render: (value: unknown) => (
					<div className='text-gray-900 text-center'>{String(value || '-')}</div>
				),
			},
		],
		[navigate, transitDate]
	);

	const tableData = (runsData?.data || []) as unknown as Record<string, unknown>[];
	const adherenceStats = adherenceData?.data?.total;

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-7xl mx-auto'>
				{/* Header with Stats */}
				<div className='mb-6 flex items-start justify-between gap-6'>
					<div className='flex-1'>
						<h1 className='text-2xl font-semibold text-gray-900 mb-2'>Add QC Rejection</h1>
						<div className='flex items-center gap-4'>
							{user?.city_name && (
								<>
									<span className='text-sm text-gray-600'>📍 {user.city_name}</span>
									<span className='text-sm text-gray-500'>•</span>
								</>
							)}
							<span className='text-sm text-gray-600'>
								❌ {tableData.length} QC runs
							</span>
						</div>
					</div>
					{/* Stats Section - Right of Header */}
					{adherenceStats && (
						<div className='flex items-center gap-6 pt-1'>
							<div className='text-right'>
								<div className='text-xs text-gray-500 font-medium mb-0.5'>Total Runs</div>
								<div className='text-lg font-semibold text-gray-900'>
									{adherenceStats.total.toLocaleString()}
								</div>
							</div>
							<div className='h-8 w-px bg-gray-300' />
							<div className='text-right'>
								<div className='text-xs text-gray-500 font-medium mb-0.5'>Submitted</div>
								<div className='text-lg font-semibold text-green-600'>
									{adherenceStats.submitted.toLocaleString()}
								</div>
							</div>
							<div className='h-8 w-px bg-gray-300' />
							<div className='text-right'>
								<div className='text-xs text-gray-500 font-medium mb-0.5'>Adherence</div>
								<div className='text-lg font-semibold text-purple-600'>
									{adherenceStats.adherence.toFixed(2)}%
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Filter Section */}
				<div className='mb-6 flex w-full'>
					<div className='bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-lg p-4 flex w-full gap-3'>
						<div className='flex items-center gap-4 w-full'>
							<div className='w-56'>
								<FloatingInput
									label='Transit Date'
									type='date'
									value={transitDate}
									onChange={setTransitDate}
									required
								/>
							</div>
							<div className='w-56'>
								<FloatingDropdown
									label='Client'
									options={clientOptions}
									value={selectedClientId}
									onChange={setSelectedClientId}
									placeholder='All Clients'
									disabled={loadingClients}
								/>
							</div>
							<div className='ml-auto'>
								<SearchButton onClick={handleSearch} disabled={loadingRuns || !transitDate} />
							</div>
						</div>
					</div>
				</div>

				{/* Table Section */}
				{loadingRuns ? (
					<TableSkeleton rows={10} columns={columns.length} />
				) : (
					<Table columns={columns} data={tableData} loading={false} size='sm' />
				)}

				<Snackbar
					message={snackbar.message}
					type={snackbar.type}
					open={snackbar.open}
					onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
				/>
			</div>
		</div>
	);
};
