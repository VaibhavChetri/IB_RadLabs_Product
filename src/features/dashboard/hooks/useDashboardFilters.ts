import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { SkuApiService } from '../../../services/skuApi';
import { CommonApiService } from '../../../services/commonApi';
import { getCurrentMonth, CLIENT_ALL_OPTION } from '../config/constants';

export interface DropdownOption {
	value: string;
	label: string;
}

interface UseDashboardFiltersReturn {
	// State
	selectedMonth: string;
	selectedClient: string;
	selectedFacility: string;
	clientOptions: DropdownOption[];
	facilityOptions: DropdownOption[];
	loadingClients: boolean;
	loadingFacilities: boolean;

	// Setters
	setSelectedMonth: (value: string) => void;
	setSelectedClient: (value: string) => void;
	setSelectedFacility: (value: string) => void;
}

export const useDashboardFilters = (): UseDashboardFiltersReturn => {
	const { user } = useSelector((state: RootState) => state.auth);

	// Filter states
	const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth().toString());
	const [selectedClient, setSelectedClient] = useState<string>(CLIENT_ALL_OPTION.value);
	const [selectedFacility, setSelectedFacility] = useState<string>('');

	// Options states
	const [clientOptions, setClientOptions] = useState<DropdownOption[]>([CLIENT_ALL_OPTION]);
	const [facilityOptions, setFacilityOptions] = useState<DropdownOption[]>([]);
	const [loadingClients, setLoadingClients] = useState(false);
	const [loadingFacilities, setLoadingFacilities] = useState(false);

	// Load clients
	useEffect(() => {
		const loadClients = async () => {
			if (user?.city_id) {
				setLoadingClients(true);
				try {
					const response = await SkuApiService.getClientByCity(user.city_id);
					if (response.status_code === 200 && response.result) {
						const clientList: DropdownOption[] = (
							response.result as Array<{
								clientId: number;
								clientName: string;
							}>
						).map(client => ({
							value: client.clientId.toString(),
							label: client.clientName,
						}));
						// Prepend "All" option to the list
						setClientOptions([CLIENT_ALL_OPTION, ...clientList]);
					}
				} catch (error) {
					console.error('Failed to load clients:', error);
				} finally {
					setLoadingClients(false);
				}
			}
		};
		loadClients();
	}, [user?.city_id]);

	// Load facilities
	useEffect(() => {
		const loadFacilities = async () => {
			setLoadingFacilities(true);
			try {
				const response = await CommonApiService.getFacilities(user?.city_id);
				if (response.statusCode === 200 && response.data) {
					const options: DropdownOption[] = (
						response.data as Array<{
							id: number;
							location: string;
						}>
					).map(facility => ({
						value: facility.id.toString(),
						label: facility.location,
					}));
					setFacilityOptions(options);
				}
			} catch (error) {
				console.error('Failed to load facilities:', error);
			} finally {
				setLoadingFacilities(false);
			}
		};
		loadFacilities();
	}, [user?.city_id]);

	// Auto-select facility if only one option
	useEffect(() => {
		if (facilityOptions.length === 1 && !selectedFacility) {
			setSelectedFacility(facilityOptions[0].value);
		}
	}, [facilityOptions, selectedFacility]);

	return {
		selectedMonth,
		selectedClient,
		selectedFacility,
		clientOptions,
		facilityOptions,
		loadingClients,
		loadingFacilities,
		setSelectedMonth,
		setSelectedClient,
		setSelectedFacility,
	};
};
