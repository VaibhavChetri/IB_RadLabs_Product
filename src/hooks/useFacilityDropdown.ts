import { useState, useEffect } from 'react';
import { CommonApiService } from '../services/commonApi';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export interface DropdownOption {
	value: string;
	label: string;
}

interface UseFacilityDropdownReturn {
	facilityOptions: DropdownOption[];
	loadingFacilities: boolean;
	selectedFacility: string;
	setSelectedFacility: (value: string) => void;
}

export interface UseFacilityDropdownOptions {
	cityId?: number; // Optional city filter
	autoSelectFirst?: boolean; // Auto-select first facility (default: true)
	includeAllOption?: boolean; // Include "All" option (default: false)
}

/**
 * Reusable hook for washing facility dropdown
 * Handles loading facilities from API and state management
 */
export const useFacilityDropdown = (
	options: UseFacilityDropdownOptions = {}
): UseFacilityDropdownReturn => {
	const { user } = useSelector((state: RootState) => state.auth);
	const {
		cityId = options.cityId ?? user?.city_id,
		autoSelectFirst = options.autoSelectFirst ?? true,
		includeAllOption = options.includeAllOption ?? false,
	} = options;

	const [facilityOptions, setFacilityOptions] = useState<DropdownOption[]>([]);
	const [loadingFacilities, setLoadingFacilities] = useState(false);
	const [selectedFacility, setSelectedFacility] = useState<string>('');

	// Load washing facilities (location_type=2)
	useEffect(() => {
		const loadFacilities = async () => {
			setLoadingFacilities(true);
			try {
				const response = await CommonApiService.getFacilities(cityId);
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

					// Add "All" option if requested
					const finalOptions = includeAllOption
						? [{ value: '', label: 'All' }, ...facilityList]
						: facilityList;

					setFacilityOptions(finalOptions);
					console.log('Mapped Facilities:', finalOptions); // Debug log

					// Auto-select first facility if requested and available
					// Only auto-select if no facility is currently selected
					if (autoSelectFirst && facilityList.length > 0) {
						setSelectedFacility(prev => {
							// Only set if currently empty
							if (!prev) {
								return facilityList[0].value;
							}
							return prev;
						});
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cityId, autoSelectFirst, includeAllOption]); // Run when cityId changes

	return {
		facilityOptions,
		loadingFacilities,
		selectedFacility,
		setSelectedFacility,
	};
};

