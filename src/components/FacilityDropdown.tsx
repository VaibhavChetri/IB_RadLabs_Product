import React, { useEffect } from 'react';
import { FloatingDropdown } from '../components/ui';
import { useFacilityDropdown, UseFacilityDropdownOptions } from '../hooks/useFacilityDropdown';

interface FacilityDropdownProps extends UseFacilityDropdownOptions {
	label?: string;
	value?: string;
	onChange?: (value: string) => void;
	className?: string;
	placeholder?: string;
	disabled?: boolean;
}

/**
 * Reusable Washing Facility Dropdown Component
 * Handles loading and displaying washing facilities from API
 */
export const FacilityDropdown: React.FC<FacilityDropdownProps> = ({
	label = 'Washing Facility',
	value,
	onChange,
	className,
	placeholder = 'Select facility',
	disabled = false,
	cityId,
	autoSelectFirst = true,
	includeAllOption = false,
}) => {
	const {
		facilityOptions,
		loadingFacilities,
		selectedFacility,
		setSelectedFacility,
	} = useFacilityDropdown({
		cityId,
		autoSelectFirst,
		includeAllOption,
	});

	// Use controlled value if provided, otherwise use internal state
	const currentValue = value !== undefined ? value : selectedFacility;

	// Auto-select first facility when options load (for controlled mode)
	useEffect(() => {
		if (
			autoSelectFirst &&
			facilityOptions.length > 0 &&
			(!currentValue || currentValue === '') &&
			onChange
		) {
			// Find first non-"All" option if includeAllOption is true, otherwise first option
			const firstOption = includeAllOption && facilityOptions[0]?.value === ''
				? facilityOptions[1]?.value
				: facilityOptions[0]?.value;
			if (firstOption) {
				onChange(firstOption);
			}
		}
	}, [facilityOptions, autoSelectFirst, currentValue, onChange, includeAllOption]);

	const handleChange = (newValue: string) => {
		if (onChange) {
			onChange(newValue);
		} else {
			setSelectedFacility(newValue);
		}
	};

	return (
		<FloatingDropdown
			label={label}
			options={facilityOptions}
			value={currentValue}
			onChange={handleChange}
			placeholder={placeholder}
			loading={loadingFacilities}
			className={className}
			searchable
			disabled={disabled}
		/>
	);
};

