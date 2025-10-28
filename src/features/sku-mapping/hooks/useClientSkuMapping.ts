import { useState, useEffect, useCallback } from 'react';
import { SkuApiService, ClientWithImpactTypes } from '../../../services/skuApi';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';

export const useClientSkuMapping = (clientId?: string) => {
	const { user } = useSelector((state: RootState) => state.auth);
	const location_id = user?.city_id;

	const isEditMode = !!clientId;

	const [clients, setClients] = useState<ClientWithImpactTypes[]>([]);
	const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
	const [selectedClient, setSelectedClient] = useState<ClientWithImpactTypes | null>(null);
	const [isClientLocked, setIsClientLocked] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string>('');

	useEffect(() => {
		// Restore selected client from localStorage in add mode
		if (!isEditMode) {
			const storedClientId = localStorage.getItem('sku-mapping-client');
			if (storedClientId) {
				setSelectedClientId(Number(storedClientId));
			}
		}

		loadClients();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location_id, isEditMode]);

	useEffect(() => {
		if (isEditMode && clientId && clients.length > 0) {
			const client = clients.find(c => c.clientId.toString() === clientId);
			if (client) {
				setSelectedClient(client);
				setSelectedClientId(client.clientId);
				setIsClientLocked(true);
			}
		} else if (!isEditMode) {
			// In add mode, restore client from localStorage if available
			if (selectedClientId && clients.length > 0) {
				const client = clients.find(c => c.clientId === selectedClientId);
				if (client) {
					setSelectedClient(client);
				}
			}
			setIsClientLocked(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [clientId, isEditMode, clients.length, selectedClientId]);

	const loadClients = async () => {
		if (!location_id) return;
		try {
			setLoading(true);
			const response = await SkuApiService.getClientByCity(location_id);
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

				setSelectedClient(client);
				setSelectedClientId(numClientId);
				onClientSelect(client);
				localStorage.setItem('sku-mapping-client', numClientId.toString());
			} catch (error) {
				console.error('Failed to check client mappings:', error);
			}
		},
		[clients]
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
