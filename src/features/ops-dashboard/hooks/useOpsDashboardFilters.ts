/**
 * Ops Dashboard Filters Hook
 * Manages date filters and client selection with localStorage persistence
 */

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { InventoryApiService } from '../../../services/inventoryApi';
import { DropdownOption } from '../../dashboard/hooks/useDashboardFilters';

interface UseOpsDashboardFiltersReturn {
	startDate: string;
	endDate: string;
	selectedClient: string;
	clientOptions: DropdownOption[];
	loadingClients: boolean;
	onStartDateChange: (value: string) => void;
	onEndDateChange: (value: string) => void;
	onClientChange: (value: string) => void;
}

const STORAGE_KEY = 'ops-dashboard-filters';

/**
 * Get current date in YYYY-MM-DD format
 */
const getCurrentDate = (): string => {
	return new Date().toISOString().split('T')[0];
};

/**
 * Load filters from localStorage
 */
const loadFiltersFromStorage = (): { startDate: string; endDate: string } => {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return {
				startDate: parsed.startDate || getCurrentDate(),
				endDate: parsed.endDate || getCurrentDate(),
			};
		}
	} catch (error) {
		console.error('Failed to load filters from storage:', error);
	}
	return {
		startDate: getCurrentDate(),
		endDate: getCurrentDate(),
	};
};

/**
 * Save filters to localStorage
 */
const saveFiltersToStorage = (startDate: string, endDate: string): void => {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ startDate, endDate }));
	} catch (error) {
		console.error('Failed to save filters to storage:', error);
	}
};

export const useOpsDashboardFilters = (): UseOpsDashboardFiltersReturn => {
	const { user } = useSelector((state: RootState) => state.auth);

	// Load initial dates from localStorage or use current date
	const storedFilters = loadFiltersFromStorage();
	const [startDate, setStartDate] = useState<string>(storedFilters.startDate);
	const [endDate, setEndDate] = useState<string>(storedFilters.endDate);
	const [selectedClient, setSelectedClient] = useState<string>('all');
	const [clientOptions, setClientOptions] = useState<DropdownOption[]>([
		{ value: 'all', label: 'All' },
	]);
	const [loadingClients, setLoadingClients] = useState(false);

	// Save dates to localStorage when they change
	useEffect(() => {
		if (startDate && endDate) {
			saveFiltersToStorage(startDate, endDate);
		}
	}, [startDate, endDate]);

	// Load clients from API
	useEffect(() => {
		const loadClients = async () => {
			if (!user?.city_id) return;

			setLoadingClients(true);
			try {
				const response = await InventoryApiService.getClientByCity(user.city_id);
				if (response.status_code === 200 && response.result) {
					const clientList: DropdownOption[] = response.result.map(client => ({
						value: client.clientId.toString(),
						label: client.clientName,
					}));
					setClientOptions([{ value: 'all', label: 'All' }, ...clientList]);
				}
			} catch (error) {
				console.error('Failed to load clients:', error);
			} finally {
				setLoadingClients(false);
			}
		};

		loadClients();
	}, [user?.city_id]);

	return {
		startDate,
		endDate,
		selectedClient,
		clientOptions,
		loadingClients,
		onStartDateChange: setStartDate,
		onEndDateChange: setEndDate,
		onClientChange: setSelectedClient,
	};
};
