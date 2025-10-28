import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Edit2 } from 'lucide-react';
import { Button, Snackbar, Table } from '../components/ui';
import { FloatingDropdown } from '../components/ui/FloatingDropdown';
import { PageHeader } from '../components/ui/PageHeader';
import { Plus } from 'lucide-react';
import { SkuApiService, ClientSkuMapping } from '../services/skuApi';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import {
	setClients,
	setSelectedClientId,
	setSelectedStatus,
	setMappings,
	setLoading,
} from '../store/slices/skuListingSlice';

export const SkuMapListing: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useDispatch();
	const { user } = useSelector((state: RootState) => state.auth);
	const { clients, selectedClientId, selectedStatus, mappings, loading } = useSelector(
		(state: RootState) => state.skuListing
	);
	const location_id = user?.city_id;

	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		type: 'success' as 'success' | 'error' | 'info',
	});

	useEffect(() => {
		// Clean up other menus' localStorage
		localStorage.removeItem('sku-mapping-client');
		localStorage.removeItem('sku-mapping-rows');
		localStorage.removeItem('sku-mapping-rows-edit');

		loadClients();
		// Restore selected client from localStorage
		const storedClientId = localStorage.getItem('sku-listing-client-id');
		if (storedClientId) {
			dispatch(setSelectedClientId(Number(storedClientId)));
		}
		const storedStatus = localStorage.getItem('sku-listing-status');
		if (storedStatus) {
			dispatch(setSelectedStatus(storedStatus));
		}
	}, [location_id, dispatch]);

	// Trigger refresh when navigating back from edit page
	useEffect(() => {
		const timestamp = localStorage.getItem('sku-listing-refresh-timestamp');
		if (timestamp) {
			localStorage.removeItem('sku-listing-refresh-timestamp');
			// Force reload mappings
			if (selectedClientId) {
				loadMappings();
			}
		}
	}, [location.pathname, selectedClientId]);

	useEffect(() => {
		if (selectedClientId) {
			loadMappings();
			localStorage.setItem('sku-listing-client-id', selectedClientId.toString());
		} else {
			dispatch(setMappings([]));
		}
	}, [selectedClientId, selectedStatus]);

	useEffect(() => {
		// Save status to localStorage when it changes
		if (selectedStatus) {
			localStorage.setItem('sku-listing-status', selectedStatus);
		}
	}, [selectedStatus]);

	const loadClients = async () => {
		if (!location_id) return;

		try {
			dispatch(setLoading(true));
			const response = await SkuApiService.getClientByCity(location_id);
			if (response.status_code === 200 && response.result) {
				dispatch(setClients(response.result));
			}
		} catch (error) {
			console.error('Failed to load clients:', error);
			setSnackbar({
				open: true,
				message: 'Failed to load clients',
				type: 'error',
			});
		} finally {
			dispatch(setLoading(false));
		}
	};

	const loadMappings = async () => {
		if (!selectedClientId) return;

		try {
			dispatch(setLoading(true));
			const response = await SkuApiService.getClientSkuMap(selectedClientId);

			if (response.status_code === 200 && response.result) {
				let filteredMappings = response.result;

				// Filter by status if selected
				if (selectedStatus) {
					filteredMappings = response.result.filter(
						(mapping: any) => mapping.status === selectedStatus
					);
				}

				dispatch(setMappings(filteredMappings));
			}
		} catch (error) {
			console.error('Failed to load mappings:', error);
			setSnackbar({
				open: true,
				message: 'Failed to load mappings',
				type: 'error',
			});
		} finally {
			dispatch(setLoading(false));
		}
	};

	const handleClientChange = (clientId: string) => {
		const numClientId = clientId ? Number(clientId) : null;
		dispatch(setSelectedClientId(numClientId));
		// Update localStorage
		if (numClientId) {
			localStorage.setItem('sku-listing-client-id', numClientId.toString());
		} else {
			localStorage.removeItem('sku-listing-client-id');
		}
	};

	const handleStatusChange = (status: string) => {
		dispatch(setSelectedStatus(status));
		// Update localStorage
		if (status) {
			localStorage.setItem('sku-listing-status', status);
		} else {
			localStorage.removeItem('sku-listing-status');
		}
	};

	const handleEdit = (mapping: ClientSkuMapping) => {
		navigate(`/ops-admin/map-sku/${mapping.clientId}/edit`);
	};

	return (
		<div className='min-h-screen bg-background-default p-6'>
			<div className='max-w-7xl mx-auto'>
				<div className='flex items-center justify-between mb-6'>
					<div className='flex-1'>
						<PageHeader
							title='SKU Mapping Listing'
							locationName={user?.city_name || 'City'}
							totalItems={mappings.length}
							itemType='mappings'
							icon='📦'
						/>
					</div>
					<Button
						onClick={() => navigate('/ops-admin/map-sku/add')}
						className='flex items-center space-x-2'
					>
						<Plus className='w-4 h-4' />
						<span>Add Mapping</span>
					</Button>
				</div>

				{/* Filters */}
				<div className='bg-background rounded-lg border border-border p-4 mb-6'>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<FloatingDropdown
							label='Select Client'
							placeholder='Choose a client'
							value={selectedClientId?.toString() || ''}
							onChange={handleClientChange}
							options={clients.map(client => ({
								value: client.clientId.toString(),
								label: client.clientName,
							}))}
						/>
						<FloatingDropdown
							label='Status'
							placeholder='Filter by status'
							value={selectedStatus}
							onChange={handleStatusChange}
							options={[
								{ value: '', label: 'All' },
								{ value: 'Enabled', label: 'Enabled' },
								{ value: 'Disabled', label: 'Disabled' },
							]}
						/>
					</div>
				</div>

				{/* Table */}
				{selectedClientId && mappings.length > 0 ? (
					<div className='overflow-x-auto'>
						<Table
							columns={[
								{
									key: 'actions',
									title: 'Actions',
									render: (value: unknown, row: any, _index: number) =>
										row ? (
											<button
												onClick={() => handleEdit(row)}
												className='p-1.5 rounded hover:bg-gray-100'
												title='Edit'
											>
												<Edit2 className='h-4 w-4 text-primary' />
											</button>
										) : null,
								},
								{
									key: 'containerType',
									title: 'Container Type',
									dataIndex: 'containerType' as keyof ClientSkuMapping,
								},
								{
									key: 'impactName',
									title: 'Impact Type',
									dataIndex: 'impactName' as keyof ClientSkuMapping,
								},
								{
									key: 'status',
									title: 'Status',
									dataIndex: 'status' as keyof ClientSkuMapping,
									render: (value: unknown, row: any, _index: number) =>
										row ? (
											<span
												className={row.status === 'Enabled' ? 'text-green-600' : 'text-red-600'}
											>
												{row.status}
											</span>
										) : (
											'-'
										),
								},
								{ key: 'price', title: 'Price', dataIndex: 'price' as keyof ClientSkuMapping },
								{
									key: 'distanceFromWarehouse',
									title: 'Distance',
									dataIndex: 'distanceFromWarehouse' as keyof ClientSkuMapping,
									render: (_value: unknown, row: any, _index: number) =>
										row ? row.distanceFromWarehouse || '-' : '-',
								},
								{
									key: 'platesWashedPerCycle',
									title: 'Plates/Cycle',
									dataIndex: 'platesWashedPerCycle' as keyof ClientSkuMapping,
									render: (_value: unknown, row: any, _index: number) =>
										row ? row.platesWashedPerCycleByClient || '-' : '-',
								},
								{
									key: 'disposableWeight',
									title: 'Weight',
									dataIndex: 'disposableWeight' as keyof ClientSkuMapping,
									render: (_value: unknown, row: any, _index: number) =>
										row ? row.disposableWeight || '-' : '-',
								},
								{
									key: 'qtyTransported',
									title: 'Qty/EV',
									dataIndex: 'qtyTransported' as keyof ClientSkuMapping,
									render: (_value: unknown, row: any, _index: number) =>
										row ? row.srcQtyTransportedOneTripEv || '-' : '-',
								},
								{
									key: 'weight',
									title: 'Weight',
									dataIndex: 'weight' as keyof ClientSkuMapping,
									render: (_value: unknown, row: any, _index: number) =>
										row ? row.weight_bagasse || '-' : '-',
								},
								{
									key: 'numberOfClamshell',
									title: 'Count',
									dataIndex: 'numberOfClamshell' as keyof ClientSkuMapping,
									render: (_value: unknown, row: any, _index: number) =>
										row ? row.numberOfClamshell || '-' : '-',
								},
							]}
							data={mappings as any[]}
							loading={loading}
							emptyText='No SKU mappings found.'
							className='min-w-max'
						/>
					</div>
				) : selectedClientId ? (
					<div className='p-8 text-center text-foreground-muted bg-white rounded-lg border border-border'>
						No mappings found for this client
					</div>
				) : (
					<div className='p-8 text-center text-foreground-muted bg-white rounded-lg border border-border'>
						Please select a client to view mappings
					</div>
				)}
			</div>

			<Snackbar
				open={snackbar.open}
				message={snackbar.message}
				type={snackbar.type}
				onClose={() => setSnackbar({ ...snackbar, open: false })}
			/>
		</div>
	);
};

export default SkuMapListing;
