import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { CommonApiService } from '../../../services/commonApi';
import { MONTH_OPTIONS, getCurrentMonth } from '../../dashboard/config/constants';
import { getCurrentYear, getYearOptions } from '../config/constants';
import { RootState } from '../../../store';

export interface DropdownOption {
	value: string;
	label: string;
}

interface UsePLFiltersReturn {
	// State
	selectedMonth: string;
	selectedYear: string;
	selectedCity: string;
	selectedFacility: string;
	selectedWeek: string;
	// Options
	monthOptions: DropdownOption[];
	yearOptions: DropdownOption[];
	weekOptions: DropdownOption[];
	cityOptions: DropdownOption[];
	facilityOptions: DropdownOption[];
	// Loading states
	loadingCities: boolean;
	loadingFacilities: boolean;
	// Setters
	setSelectedMonth: (value: string) => void;
	setSelectedYear: (value: string) => void;
	setSelectedCity: (value: string) => void;
	setSelectedFacility: (value: string) => void;
	setSelectedWeek: (value: string) => void;
}

export const usePLFilters = (): UsePLFiltersReturn => {
	const user = useSelector((state: RootState) => state.auth.user);
	const userTypeId = user?.userTypeId;

	// Filter states - default to current month/year
	const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth().toString());
	const [selectedYear, setSelectedYear] = useState<string>(getCurrentYear().toString());
	const [selectedCity, setSelectedCity] = useState<string>('');
	const [selectedFacility, setSelectedFacility] = useState<string>('');
	const [selectedWeek, setSelectedWeek] = useState<string>('all');

	// Options states - reuse MONTH_OPTIONS from dashboard constants
	const monthOptions: DropdownOption[] = [...MONTH_OPTIONS];
	const yearOptions = getYearOptions();
	const weekOptions: DropdownOption[] = [
		{ value: 'all', label: 'All' },
		{ value: '1', label: 'Week 1' },
		{ value: '2', label: 'Week 2' },
		{ value: '3', label: 'Week 3' },
		{ value: '4', label: 'Week 4' },
	];
	const [cityOptions, setCityOptions] = useState<DropdownOption[]>([]);
	const [facilityOptions, setFacilityOptions] = useState<DropdownOption[]>([]);
	const [loadingCities, setLoadingCities] = useState(false);
	const [loadingFacilities, setLoadingFacilities] = useState(false);

	// Load cities (only for user_type_id = 4)
	useEffect(() => {
		if (userTypeId !== 4) return;

		const loadCities = async () => {
			setLoadingCities(true);
			try {
				const response = await CommonApiService.getCities();
				if ((response.status_code === 200 || response.statusCode === 200) && response.data) {
					const cities = response.data as Array<{
						id: number;
						name: string;
					}>;
					const cityList: DropdownOption[] = cities.map(city => ({
						value: city.id.toString(),
						label: city.name,
					}));
					setCityOptions(cityList);
					// Auto-select first city
					if (cityList.length > 0) {
						setSelectedCity(cityList[0].value);
					}
				}
			} catch (error) {
				console.error('Failed to load cities:', error);
			} finally {
				setLoadingCities(false);
			}
		};
		loadCities();
	}, [userTypeId]);

	// Load washing facilities based on selected city (for user_type_id = 4) or all facilities
	useEffect(() => {
		const loadFacilities = async () => {
			setLoadingFacilities(true);
			try {
				let response;
				if (userTypeId === 4 && selectedCity) {
					// Load facilities for specific city
					response = await CommonApiService.getFacilities(parseInt(selectedCity));
				} else {
					// Load all facilities
					response = await CommonApiService.getFacilities();
				}

				if ((response.status_code === 200 || response.statusCode === 200) && response.data) {
					const facilities = response.data as Array<{
						id: number;
						location: string;
					}>;
					const facilityList: DropdownOption[] = facilities.map(facility => ({
						value: facility.id.toString(),
						label: facility.location,
					}));
					setFacilityOptions(facilityList);
					// Auto-select first facility
					if (facilityList.length > 0) {
						setSelectedFacility(facilityList[0].value);
					}
				} else {
					console.warn('Unexpected API response format:', response);
				}
			} catch (error) {
				console.error('Failed to load washing facilities:', error);
			} finally {
				setLoadingFacilities(false);
			}
		};
		loadFacilities();
	}, [userTypeId, selectedCity]); // Reload facilities when city changes (for user_type_id = 4)

	return {
		selectedMonth,
		selectedYear,
		selectedCity,
		selectedFacility,
		selectedWeek,
		monthOptions,
		yearOptions,
		weekOptions,
		cityOptions,
		facilityOptions,
		loadingCities,
		loadingFacilities,
		setSelectedMonth,
		setSelectedYear,
		setSelectedCity,
		setSelectedFacility,
		setSelectedWeek,
	};
};
