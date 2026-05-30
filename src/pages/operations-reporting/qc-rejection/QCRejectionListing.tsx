import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
	PageHeader,
	Button,
	Snackbar,
	FloatingInput,
	FloatingDropdown,
	SearchButton,
} from '../../../components/ui';
import { Table } from '../../../components/ui/DataDisplay';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { Plus, Info } from 'lucide-react';
import { useQCRejectionData } from '../../../features/qc-rejection/hooks/useQCRejectionData';
import { InventoryApiService } from '../../../services/inventoryApi';
import { QCRejectionService, type QCRejectionWoWRow } from '../../../services/transitPlanApi';
import { RootState } from '../../../store';
import type { TableColumn } from '../../../components/ui/DataDisplay';

// Header label + info icon with a plain-language tooltip (native browser tooltip).
const HeaderInfo: React.FC<{ label: string; tip: string }> = ({ label, tip }) => (
	<span className='inline-flex items-center gap-1'>
		{label}
		<span title={tip} className='cursor-help' aria-label={tip}>
			<Info className='h-3.5 w-3.5 text-indigo-400' />
		</span>
	</span>
);

export const QCRejectionListing: React.FC = () => {
	const navigate = useNavigate();
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

	// Set default date to today
	useEffect(() => {
		const today = new Date().toISOString().split('T')[0];
		setTransitDate(today);
	}, []);

	// Load clients by city
	useEffect(() => {
		const loadClients = async () => {
			// Don't gate on city_id: founders have none, and the backend returns
			// all clients for them regardless of the location_id passed. Pass 0 as
			// a harmless placeholder when there's no city.
			setLoadingClients(true);
			try {
				const response = await InventoryApiService.getClientByCity(user?.city_id ?? 0);
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

	// Fetch QC rejections
	const {
		data: listingData,
		isLoading: loading,
		error: listingError,
	} = useQCRejectionData({
		transit_date: transitDate,
		client_id: selectedClientId ? parseInt(selectedClientId, 10) : undefined,
		enabled: !!transitDate,
	});

	// Show error snackbar if API fails
	useEffect(() => {
		if (listingError) {
			setSnackbar({
				open: true,
				message: 'Failed to load QC rejections',
				type: 'error',
			});
		}
	}, [listingError]);

	// ── Additive: per-client week-over-week QC rejection map ──
	// Fetched separately from the new endpoint, keyed by clientId, so the listing
	// can show each client's this-week-vs-last-week trend without changing the
	// single-date listing query. Failures here never block the existing table.
	const [wowByClient, setWowByClient] = useState<Record<number, QCRejectionWoWRow>>({});
	useEffect(() => {
		let cancelled = false;
		const loadWoW = async () => {
			// Only a date is required. city_id is optional: founders (no city) get
			// all-cities WoW from the backend; other users get their own city.
			if (!transitDate) return;
			try {
				const resp = await QCRejectionService.getQCRejectionsWeekOverWeek({
					anchor_date: transitDate, // anchor the 2-week window on the selected date
					city_id: user?.city_id || undefined, // omit for founders → backend returns all cities
					client_id: selectedClientId ? parseInt(selectedClientId, 10) : undefined,
				});
				if (cancelled) return;
				const map: Record<number, QCRejectionWoWRow> = {};
				(resp?.data || []).forEach(row => {
					map[row.clientId] = row;
				});
				setWowByClient(map);
			} catch {
				// Non-fatal: leave the WoW column blank if this lookup fails.
				if (!cancelled) setWowByClient({});
			}
		};
		loadWoW();
		return () => {
			cancelled = true;
		};
	}, [transitDate, selectedClientId, user?.city_id]);

	const handleAdd = () => {
		navigate('/operations-reporting/qc-rejection/add');
	};

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
				key: 'transitDate',
				title: 'Transit Date',
				sortable: true,
				align: 'center',
				render: (value: unknown) => (
					<div className='text-gray-900 text-center'>{formatDate(String(value || ''))}</div>
				),
			},
			{
				key: 'transitTime',
				title: 'Time',
				sortable: true,
				align: 'center',
				render: (value: unknown) => (
					<div className='text-gray-900 text-center'>{String(value || '-')}</div>
				),
			},
			{
				key: 'clientName',
				title: 'Client Name',
				sortable: true,
				align: 'center',
				render: (value: unknown) => (
					<div className='text-gray-900 text-center'>{String(value || '-')}</div>
				),
			},
			{
				key: 'containerTypeName',
				title: 'SKU',
				sortable: true,
				align: 'center',
				render: (value: unknown) => (
					<div className='text-gray-900 text-center'>{String(value || '-')}</div>
				),
			},
			{
				key: 'reasonName',
				title: 'Reason',
				sortable: true,
				align: 'center',
				render: (value: unknown) => (
					<div className='text-gray-900 text-center'>{String(value || '-')}</div>
				),
			},
			{
				key: 'rejectedCount',
				title: 'Rejected Count',
				sortable: true,
				align: 'center',
				render: (value: unknown) => (
					<div className='text-gray-900 text-center'>{String(value ?? '-')}</div>
				),
			},
			{
				// ── Additive: this client's week-over-week rejection trend ──
				// Shows this-week vs last-week total rejected for the row's client,
				// plus the delta. Same value repeats across a client's rows (it is a
				// per-client metric), which makes client-level trends scannable.
				key: 'wow',
				title: (
					<HeaderInfo
						label='WoW (Client)'
						tip='Week over Week: this client’s total QC rejections this week vs last week (the 7 days ending on the selected date vs the 7 before). ▲ red = getting worse, ▼ green = improving.'
					/>
				),
				sortable: false,
				align: 'center',
				headerClassName: 'bg-indigo-50 text-indigo-700',
				render: (_value: unknown, row: Record<string, unknown>) => {
					const clientId = Number(row.clientId);
					const wow = Number.isFinite(clientId) ? wowByClient[clientId] : undefined;
					if (!wow) {
						return <div className='text-gray-400 text-center'>—</div>;
					}
					const up = wow.delta > 0; // more rejections this week = worse
					const flat = wow.delta === 0;
					const cls = flat ? 'text-gray-500' : up ? 'text-red-600' : 'text-green-600';
					const arrow = flat ? '→' : up ? '▲' : '▼';
					const pct = wow.deltaPct == null ? '' : ` (${wow.deltaPct > 0 ? '+' : ''}${wow.deltaPct}%)`;
					return (
						<div
							className={`text-center font-medium ${cls}`}
							title={`This week: ${wow.thisWeekRejected} · Last week: ${wow.lastWeekRejected}`}
						>
							{wow.thisWeekRejected} vs {wow.lastWeekRejected} {arrow}
							{pct}
						</div>
					);
				},
			},
			{
				key: 'updatedByName',
				title: 'Updated By',
				sortable: true,
				align: 'center',
				render: (value: unknown) => (
					<div className='text-gray-900 text-center'>{String(value || '-')}</div>
				),
			},
		],
		[wowByClient]
	);

	const tableData = (listingData?.data || []) as unknown as Record<string, unknown>[];

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-7xl mx-auto'>
				<div className='flex items-center justify-between mb-6'>
					<PageHeader
						title='QC Rejection'
						locationName={user?.city_name || 'City'}
						totalItems={tableData.length}
						itemType='QC rejections'
						icon='❌'
					/>
					<Button onClick={handleAdd} variant='primary' leftIcon={<Plus className='w-4 h-4' />}>
						Add QC Rejection
					</Button>
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
								<SearchButton onClick={handleSearch} disabled={loading || !transitDate} />
							</div>
						</div>
					</div>
				</div>

				{loading ? (
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
