import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Snackbar, Table } from '../../../components/ui';
import { PageHeader } from '../../../components/ui/PageHeader';
import { SkuApiService, ClientSkuMapping } from '../../../services/skuApi';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import {
	setClients,
	setSelectedClientId,
	setSelectedStatus,
	setMappings,
	setLoading,
} from '../../../store/slices/skuListingSlice';
import { SkuListingFilters, getSkuListingTableColumns } from '../../../features/sku-mapping';

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

	// Define functions first
	const loadClients = useCallback(async () => {
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
	}, [location_id, dispatch]);

	const [showCombineSku, setShowCombineSku] = useState(false);

	const loadMappings = useCallback(async () => {
		if (!selectedClientId) return;

		try {
			dispatch(setLoading(true));
			const response = await SkuApiService.getClientSkuMap(selectedClientId);

			if (response.status_code === 200) {
				// Extract combineSkuInfo from response
				const combineSkuInfo = response.combineSkuInfo || response.data?.combineSkuInfo;
				const shouldShowCombineSku = combineSkuInfo?.showCombineSku === true;
				
				// Also check if any mapping item has showCombineSku: true
				let itemShowCombineSku = false;
				if (response.result && Array.isArray(response.result)) {
					itemShowCombineSku = response.result.some((item: any) => item.showCombineSku === true);
				}
				
				// Show combine SKU if either combineSkuInfo.showCombineSku is true OR any item has showCombineSku: true
				setShowCombineSku(shouldShowCombineSku || itemShowCombineSku);

				if (response.result) {
					let filteredMappings = response.result;

					// Filter by status if selected
					if (selectedStatus) {
						filteredMappings = response.result.filter(
							(mapping: any) => mapping.status === selectedStatus
						);
					}

					dispatch(setMappings(filteredMappings));
				}
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
	}, [selectedClientId, selectedStatus, dispatch]);

	// useEffect hooks after function declarations
	useEffect(() => {
		loadClients();
		// Note: selectedClientId and selectedStatus are now automatically
		// persisted and rehydrated by redux-persist - no manual localStorage needed
	}, [location_id, dispatch, loadClients]);

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
	}, [location.pathname, selectedClientId, loadMappings]);

	useEffect(() => {
		if (selectedClientId) {
			loadMappings();
			// Note: selectedClientId is automatically persisted by redux-persist
		} else {
			dispatch(setMappings([]));
		}
	}, [selectedClientId, selectedStatus, loadMappings, dispatch]);

	const handleClientChange = (clientId: string) => {
		const numClientId = clientId ? Number(clientId) : null;
		dispatch(setSelectedClientId(numClientId));
		// Note: Persistence is now handled by Redux Persist automatically
	};

	const handleStatusChange = (status: string) => {
		dispatch(setSelectedStatus(status));
		// Note: Persistence is now handled by Redux Persist automatically
	};

	const handleEdit = (mapping: ClientSkuMapping) => {
		navigate(`/ops-admin/map-sku/${mapping.clientId}/edit`);
	};

	return (
		<div className='min-h-screen bg-background-default p-6'>
			<div className='max-w-7xl mx-auto'>
				<div className='mb-6'>
					<PageHeader
						title='SKU Mapping Listing'
						locationName={user?.city_name || 'City'}
						totalItems={mappings.length}
						itemType='mappings'
						icon='📦'
					/>
				</div>

				{/* Filters */}
				<SkuListingFilters
					clients={clients}
					selectedClientId={selectedClientId}
					selectedStatus={selectedStatus}
					onClientChange={handleClientChange}
					onStatusChange={handleStatusChange}
				/>

				{/* Table */}
				{selectedClientId && mappings.length > 0 ? (
					<div className='overflow-x-auto'>
						<Table
							columns={getSkuListingTableColumns(handleEdit, showCombineSku)}
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
