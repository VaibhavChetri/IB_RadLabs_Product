/**
 * Ops Dashboard Filters Hook
 * Manages date filters and client selection with localStorage persistence
 */

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { InventoryApiService } from '../../../services/inventoryApi';
import { LocationApiService } from '../../../services/locationApi';
import { DropdownOption } from '../../dashboard/hooks/useDashboardFilters';

interface UseOpsDashboardFiltersReturn {
	startDate: string;
	endDate: string;
	selectedClient: string;
	selectedCity: string;
	clientOptions: DropdownOption[];
	cityOptions: DropdownOption[];
	loadingClients: boolean;
	loadingCities: boolean;
	showCityFilter: boolean;
	onStartDateChange: (value: string) => void;
	onEndDateChange: (value: string) => void;
	onClientChange: (value: string) => void;
	onCityChange: (value: string) => void;
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

	// Check if user type is 1/2/3/4 to show city filter
	const showCityFilter = user?.userTypeId !== undefined && [1, 2, 3, 4].includes(user.userTypeId);

	// Load initial dates from localStorage or use current date
	const storedFilters = loadFiltersFromStorage();
	const [startDate, setStartDate] = useState<string>(storedFilters.startDate);
	const [endDate, setEndDate] = useState<string>(storedFilters.endDate);
	const [selectedClient, setSelectedClient] = useState<string>('all');
	const [selectedCity, setSelectedCity] = useState<string>('all');
	const [clientOptions, setClientOptions] = useState<DropdownOption[]>([
		{ value: 'all', label: 'All' },
	]);
	const [cityOptions, setCityOptions] = useState<DropdownOption[]>([
		{ value: 'all', label: 'All' },
	]);
	const [loadingClients, setLoadingClients] = useState(false);
	const [loadingCities, setLoadingCities] = useState(false);

	// Save dates to localStorage when they change
	useEffect(() => {
		if (startDate && endDate) {
			saveFiltersToStorage(startDate, endDate);
		}
	}, [startDate, endDate]);

	// Load cities from API (only if user type is 1/2/3/4)
	useEffect(() => {
		const loadCities = async () => {
			if (!showCityFilter) return;

			setLoadingCities(true);
			try {
				const response = await LocationApiService.getCities();
				if (response.status_code === 200 && response.data) {
					const cityList: DropdownOption[] = response.data.map(
						(city: { id: number; name: string }) => ({
							value: city.id.toString(),
							label: city.name,
						})
					);
					setCityOptions([{ value: 'all', label: 'All' }, ...cityList]);
				}
			} catch (error) {
				console.error('Failed to load cities:', error);
			} finally {
				setLoadingCities(false);
			}
		};

		loadCities();
	}, [showCityFilter]);

	// Load clients from API
	useEffect(() => {
		const loadClients = async () => {
			// If city filter is shown and a city is selected, use that city_id
			// Otherwise, use user's city_id
			const cityId =
				showCityFilter && selectedCity !== 'all' ? parseInt(selectedCity, 10) : user?.city_id;

			if (!cityId) return;

			setLoadingClients(true);
			try {
				const response = await InventoryApiService.getClientByCity(cityId);
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
	}, [user?.city_id, selectedCity, showCityFilter]);

	return {
		startDate,
		endDate,
		selectedClient,
		selectedCity,
		clientOptions,
		cityOptions,
		loadingClients,
		loadingCities,
		showCityFilter,
		onStartDateChange: setStartDate,
		onEndDateChange: setEndDate,
		onClientChange: setSelectedClient,
		onCityChange: setSelectedCity,
	};
};
