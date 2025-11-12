import { useState, useEffect } from 'react';
import { CommonApiService } from '../../../services/commonApi';
import { PAndLApiService } from '../../../services/pAndLApi';
import { MONTH_OPTIONS, getCurrentMonth } from '../../dashboard/config/constants';
import { getCurrentYear, getYearOptions } from '../../p-and-l/config/constants';

export interface DropdownOption {
	value: string;
	label: string;
}

interface UseRevenueFiltersReturn {
	// State
	selectedMonth: string;
	selectedYear: string;
	selectedFacility: string;
	selectedCostCategory: string;
	// Options
	monthOptions: DropdownOption[];
	yearOptions: DropdownOption[];
	facilityOptions: DropdownOption[];
	costCategoryOptions: DropdownOption[];
	// Loading states
	loadingFacilities: boolean;
	loadingCostCategories: boolean;
	// Setters
	setSelectedMonth: (value: string) => void;
	setSelectedYear: (value: string) => void;
	setSelectedFacility: (value: string) => void;
	setSelectedCostCategory: (value: string) => void;
}

export const useRevenueFilters = (): UseRevenueFiltersReturn => {
	// Filter states - default to current month/year
	const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth().toString());
	const [selectedYear, setSelectedYear] = useState<string>(getCurrentYear().toString());
	const [selectedFacility, setSelectedFacility] = useState<string>('');
	const [selectedCostCategory, setSelectedCostCategory] = useState<string>('');

	// Options states - reuse MONTH_OPTIONS from dashboard constants
	const monthOptions: DropdownOption[] = [...MONTH_OPTIONS];
	const yearOptions = getYearOptions();
	const [facilityOptions, setFacilityOptions] = useState<DropdownOption[]>([]);
	const [costCategoryOptions, setCostCategoryOptions] = useState<DropdownOption[]>([]);
	const [loadingFacilities, setLoadingFacilities] = useState(false);
	const [loadingCostCategories, setLoadingCostCategories] = useState(false);

	// Load washing facilities (location_type=2)
	useEffect(() => {
		const loadFacilities = async () => {
			setLoadingFacilities(true);
			try {
				const response = await CommonApiService.getFacilities(); // No cityId - gets all facilities
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
	}, []); // Run once on mount

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
		selectedFacility,
		selectedCostCategory,
		monthOptions,
		yearOptions,
		facilityOptions,
		costCategoryOptions,
		loadingFacilities,
		loadingCostCategories,
		setSelectedMonth,
		setSelectedYear,
		setSelectedFacility,
		setSelectedCostCategory,
	};
};

