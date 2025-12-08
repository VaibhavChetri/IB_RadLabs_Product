import { useState, useEffect, useCallback } from 'react';
import { SkuApiService, ClientWithImpactTypes } from '../../../services/skuApi';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { setSelectedClient as setSelectedClientRedux } from '../../../store/slices/skuMappingSlice';

export const useClientSkuMapping = (clientId?: string) => {
	const { user } = useSelector((state: RootState) => state.auth);
	const location_id = user?.city_id;
	const dispatch = useDispatch<AppDispatch>();

	const isEditMode = !!clientId;

	// Get client info from Redux (persisted)
	const reduxClientId = useSelector((state: RootState) => state.skuMapping.selectedClientId);
	const reduxClient = useSelector((state: RootState) => state.skuMapping.selectedClient);

	const [clients, setClients] = useState<ClientWithImpactTypes[]>([]);
	// In add mode, always start with null (fresh start)
	// In edit mode, initialize from Redux if available
	const [selectedClientId, setSelectedClientId] = useState<number | null>(
		isEditMode ? reduxClientId : null
	);
	const [selectedClient, setSelectedClient] = useState<ClientWithImpactTypes | null>(
		isEditMode ? reduxClient : null
	);
	const [isClientLocked, setIsClientLocked] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string>('');

	useEffect(() => {
		// Don't restore selected client from Redux Persist in add mode
		// Add page should always start fresh - client selection is cleared on navigation
		// Only restore in edit mode where client is required
		if (isEditMode && reduxClientId && reduxClient) {
			setSelectedClientId(reduxClientId);
			setSelectedClient(reduxClient);
		}

		loadClients();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location_id, isEditMode, reduxClientId, reduxClient]);

	useEffect(() => {
		if (isEditMode && clientId && clients.length > 0) {
			const client = clients.find(c => c.clientId.toString() === clientId);
			if (client) {
				setSelectedClient(client);
				setSelectedClientId(client.clientId);
				setIsClientLocked(true);
			}
		} else if (!isEditMode) {
			// In add mode, don't restore client - Add page should always start fresh
			// Client must be explicitly selected by user
			setIsClientLocked(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [clientId, isEditMode, clients.length]);

	const loadClients = async () => {
		if (!location_id) return;
		try {
			setLoading(true);
			// In add mode, pass clientMap=true; in edit mode, don't pass it
			const response = await SkuApiService.getClientByCity(location_id, !isEditMode);
			if (response.status_code === 200 && response.result) {
				setClients(response.result);
			}
		} catch (error) {
			console.error('Failed to load clients:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleClientChange = useCallback(
		async (clientIdStr: string, onClientSelect: (client: ClientWithImpactTypes) => void) => {
			const numClientId = clientIdStr ? Number(clientIdStr) : null;
			if (!numClientId) {
				setSelectedClientId(null);
				setSelectedClient(null);
				return;
			}

			const client = clients.find(c => c.clientId === numClientId);
			if (!client) return;

			try {
				const response = await SkuApiService.getClientSkuMap(numClientId);
				if (response.status_code === 200 && response.result && response.result.length > 0) {
					setError(`${client.clientName} already has existing mappings.`);
					return;
				}

				// Update both local state AND Redux
				setSelectedClient(client);
				setSelectedClientId(numClientId);
				dispatch(setSelectedClientRedux({ client, clientId: numClientId }));
				onClientSelect(client);
			} catch (error) {
				console.error('Failed to check client mappings:', error);
			}
		},
		[clients, dispatch]
	);

	return {
		clients,
		selectedClientId,
		setSelectedClientId,
		selectedClient,
		setSelectedClient,
		isClientLocked,
		setIsClientLocked,
		loading,
		error,
		setError,
		handleClientChange,
		location_id,
	};
};
