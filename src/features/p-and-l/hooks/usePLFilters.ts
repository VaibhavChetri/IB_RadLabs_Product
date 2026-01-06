import { useState, useEffect } from 'react';
import { CommonApiService } from '../../../services/commonApi';
import { MONTH_OPTIONS, getCurrentMonth } from '../../dashboard/config/constants';
import { getCurrentYear, getYearOptions } from '../config/constants';

export interface DropdownOption {
	value: string;
	label: string;
}

interface UsePLFiltersReturn {
	// State
	selectedMonth: string;
	selectedYear: string;
	selectedFacility: string;
	selectedWeek: string;
	// Options
	monthOptions: DropdownOption[];
	yearOptions: DropdownOption[];
	weekOptions: DropdownOption[];
	facilityOptions: DropdownOption[];
	// Loading states
	loadingFacilities: boolean;
	// Setters
	setSelectedMonth: (value: string) => void;
	setSelectedYear: (value: string) => void;
	setSelectedFacility: (value: string) => void;
	setSelectedWeek: (value: string) => void;
}

export const usePLFilters = (): UsePLFiltersReturn => {
	// Filter states - default to current month/year
	const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth().toString());
	const [selectedYear, setSelectedYear] = useState<string>(getCurrentYear().toString());
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
	const [facilityOptions, setFacilityOptions] = useState<DropdownOption[]>([]);
	const [loadingFacilities, setLoadingFacilities] = useState(false);

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

	return {
		selectedMonth,
		selectedYear,
		selectedFacility,
		selectedWeek,
		monthOptions,
		yearOptions,
		weekOptions,
		facilityOptions,
		loadingFacilities,
		setSelectedMonth,
		setSelectedYear,
		setSelectedFacility,
		setSelectedWeek,
	};
};
