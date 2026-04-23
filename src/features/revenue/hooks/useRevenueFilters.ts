import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { CommonApiService } from '../../../services/commonApi';
import { PAndLApiService } from '../../../services/pAndLApi';
import { MONTH_OPTIONS, getCurrentMonth } from '../../dashboard/config/constants';
import { getCurrentYear, getYearOptions } from '../../p-and-l/config/constants';
import { RootState } from '../../../store';

export interface DropdownOption {
	value: string;
	label: string;
}

interface UseRevenueFiltersReturn {
	// State
	selectedMonth: string;
	selectedYear: string;
	selectedCity: string;
	selectedFacility: string;
	selectedCostCategory: string;
	// Options
	monthOptions: DropdownOption[];
	yearOptions: DropdownOption[];
	cityOptions: DropdownOption[];
	facilityOptions: DropdownOption[];
	costCategoryOptions: DropdownOption[];
	// Loading states
	loadingCities: boolean;
	loadingFacilities: boolean;
	loadingCostCategories: boolean;
	// Setters
	setSelectedMonth: (value: string) => void;
	setSelectedYear: (value: string) => void;
	setSelectedCity: (value: string) => void;
	setSelectedFacility: (value: string) => void;
	setSelectedCostCategory: (value: string) => void;
}

export const useRevenueFilters = (): UseRevenueFiltersReturn => {
	const user = useSelector((state: RootState) => state.auth.user);
	const userTypeId = user?.userTypeId;

	// Filter states - default to current month/year
	const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth().toString());
	const [selectedYear, setSelectedYear] = useState<string>(getCurrentYear().toString());
	const [selectedCity, setSelectedCity] = useState<string>('');
	const [selectedFacility, setSelectedFacility] = useState<string>('');
	const [selectedCostCategory, setSelectedCostCategory] = useState<string>('');

	// Options states - reuse MONTH_OPTIONS from dashboard constants
	const monthOptions: DropdownOption[] = [...MONTH_OPTIONS];
	const yearOptions = getYearOptions();
	const [cityOptions, setCityOptions] = useState<DropdownOption[]>([]);
	const [facilityOptions, setFacilityOptions] = useState<DropdownOption[]>([]);
	const [costCategoryOptions, setCostCategoryOptions] = useState<DropdownOption[]>([]);
	const [loadingCities, setLoadingCities] = useState(false);
	const [loadingFacilities, setLoadingFacilities] = useState(false);
	const [loadingCostCategories, setLoadingCostCategories] = useState(false);

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
					// Auto-select Bangalore if available, otherwise first city
					const bangaloreCity = cityList.find(city => city.label.toLowerCase() === 'bangalore');
					if (bangaloreCity) {
						setSelectedCity(bangaloreCity.value);
					} else if (cityList.length > 0) {
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

	// Load washing facilities (location_type=2)
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
				console.log('Washing Facility API Response:', response); // Debug log
				// Check both status_code and statusCode for compatibility
				if ((response.status_code === 200 || response.statusCode === 200) && response.data) {
					const facilities = response.data as Array<{
						id: number;
						location: string;
					}>;
					const facilityList: DropdownOption[] = facilities.map(facility => ({
						value: facility.id.toString(),
						label: facility.location,
					}));
					console.log('Mapped Facilities:', facilityList); // Debug log
					setFacilityOptions(facilityList);
					// Auto-select first facility (always select first one by default)
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
	}, [userTypeId, selectedCity]); // Reload when city changes

	// Load cost categories
	useEffect(() => {
		const loadCostCategories = async () => {
			setLoadingCostCategories(true);
			try {
				const response = await PAndLApiService.getCostCategories(1);
				console.log('Cost Categories API Response:', response); // Debug log
				if (response.status_code === 200 && response.data) {
					const categories: DropdownOption[] = response.data.map(category => ({
						value: category.id.toString(),
						label: category.costCategories,
					}));
					console.log('Mapped Cost Categories:', categories); // Debug log
					setCostCategoryOptions(categories);
					// Don't auto-select - user can see all data when no category is selected
				} else {
					console.warn('Unexpected API response format:', response);
				}
			} catch (error) {
				console.error('Failed to load cost categories:', error);
			} finally {
				setLoadingCostCategories(false);
			}
		};
		loadCostCategories();
	}, []); // Run once on mount

	return {
		selectedMonth,
		selectedYear,
		selectedCity,
		selectedFacility,
		selectedCostCategory,
		monthOptions,
		yearOptions,
		cityOptions,
		facilityOptions,
		costCategoryOptions,
		loadingCities,
		loadingFacilities,
		loadingCostCategories,
		setSelectedMonth,
		setSelectedYear,
		setSelectedCity,
		setSelectedFacility,
		setSelectedCostCategory,
	};
};

