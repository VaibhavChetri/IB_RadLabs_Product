import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { LocationApiService, ImpactApiService, BillingApiService } from '../services/locationApi';
import { DropdownOption } from '../components/ui/Dropdown';

// Custom hook for countries
export const useCountries = () => {
	const countriesApi = useApi('countries', LocationApiService.getCountries);
	const [countries, setCountries] = useState<DropdownOption[]>([]);

	const loadCountries = useCallback(async () => {
		try {
			const response = await countriesApi.execute({});
			if (response.status_code === 200 && response.data) {
				const countryOptions: DropdownOption[] = response.data.map((country: any) => ({
					value: country.id.toString(),
					label: country.name,
				}));
				setCountries(countryOptions);
			}
		} catch (error) {
			console.error('Failed to load countries:', error);
		}
	}, []); // Remove dependency to prevent infinite loop

	useEffect(() => {
		loadCountries();
	}, []); // Run only once

	return {
		countries,
		loading: countriesApi.loading,
		error: countriesApi.error,
		refetch: loadCountries,
	};
};

// Custom hook for states
export const useStates = () => {
	const statesApi = useApi('states', LocationApiService.getStates);
	const [states, setStates] = useState<DropdownOption[]>([]);

	const loadStates = useCallback(async () => {
		try {
			const response = await statesApi.execute({});
			if (response.status_code === 200 && response.data) {
				const stateOptions: DropdownOption[] = response.data.map((state: any) => ({
					value: state.id.toString(),
					label: state.name,
				}));
				setStates(stateOptions);
			}
		} catch (error) {
			console.error('Failed to load states:', error);
		}
	}, []); // Remove dependency to prevent infinite loop

	useEffect(() => {
		loadStates();
	}, []); // Run only once

	return {
		states,
		loading: statesApi.loading,
		error: statesApi.error,
		refetch: loadStates,
	};
};

// Custom hook for cities
export const useCities = () => {
	const citiesApi = useApi('cities', LocationApiService.getCities);
	const [cities, setCities] = useState<DropdownOption[]>([]);

	const loadCities = useCallback(async () => {
		try {
			const response = await citiesApi.execute({});
			if (response.status_code === 200 && response.data) {
				const cityOptions: DropdownOption[] = response.data.map((city: any) => ({
					value: city.id.toString(),
					label: city.name,
				}));
				setCities(cityOptions);
			}
		} catch (error) {
			console.error('Failed to load cities:', error);
		}
	}, []); // Remove dependency to prevent infinite loop

	useEffect(() => {
		loadCities();
	}, []); // Run only once

	return {
		cities,
		loading: citiesApi.loading,
		error: citiesApi.error,
		refetch: loadCities,
	};
};

// Custom hook for location types
export const useLocationTypes = () => {
	const locationTypesApi = useApi('locationTypes', LocationApiService.getLocationTypes);
	const [locationTypes, setLocationTypes] = useState<DropdownOption[]>([]);

	const loadLocationTypes = useCallback(async () => {
		try {
			const response = await locationTypesApi.execute({});
			if (response.status_code === 200 && response.data) {
				const locationTypeOptions: DropdownOption[] = response.data.map((locationType: any) => ({
					value: locationType.id.toString(),
					label: locationType.name,
				}));
				setLocationTypes(locationTypeOptions);
			}
		} catch (error) {
			console.error('Failed to load location types:', error);
		}
	}, []); // Remove dependency to prevent infinite loop

	useEffect(() => {
		loadLocationTypes();
	}, []); // Run only once

	return {
		locationTypes,
		loading: locationTypesApi.loading,
		error: locationTypesApi.error,
		refetch: loadLocationTypes,
	};
};

// Custom hook for impact types
export const useImpactTypes = () => {
	const impactTypesApi = useApi('impactTypes', () => ImpactApiService.getImpactTypes(1, 10));
	const [impactTypes, setImpactTypes] = useState<DropdownOption[]>([]);

	const loadImpactTypes = useCallback(async () => {
		try {
			const response = await impactTypesApi.execute({});
			if (response.status_code === 200) {
				// Handle both response.data and response.result (API inconsistency)
				const responseData = (response as any).result || response.data;
				if (responseData) {
					// Handle both direct array and paginated response
					const result = responseData as { data?: any[] } | any[];
					const data = Array.isArray(result) ? result : result.data || [];
					const impactTypeOptions: DropdownOption[] = data.map((impactType: any) => ({
						value: impactType.id.toString(),
						label: impactType.name,
					}));
					setImpactTypes(impactTypeOptions);
				}
			}
		} catch (error: unknown) {
			const err = error as { response?: { data?: unknown; status?: number }; message?: string };
			console.error('Failed to load impact types:', error);
			console.error('Error details:', err.response?.data || err.message);
			console.error('Error status:', err.response?.status);
		}
	}, []); // Remove dependency to prevent infinite loop

	useEffect(() => {
		loadImpactTypes();
	}, []); // Run only once

	return {
		impactTypes,
		loading: impactTypesApi.loading,
		error: impactTypesApi.error,
		refetch: loadImpactTypes,
	};
};

// Custom hook for billing types
export const useBillingTypes = () => {
	const billingTypesApi = useApi('billingTypes', () => BillingApiService.getBillingTypes(1, 10));
	const [billingTypes, setBillingTypes] = useState<DropdownOption[]>([]);

	const loadBillingTypes = useCallback(async () => {
		try {
			const response = await billingTypesApi.execute({});
			if (response.status_code === 200) {
				// Handle both response.data and response.result (API inconsistency)
				const responseData = (response as any).result || response.data;
				if (responseData) {
					// Handle both direct array and paginated response
					const result = responseData as { data?: any[] } | any[];
					const data = Array.isArray(result) ? result : result.data || [];
					const billingTypeOptions: DropdownOption[] = data.map((billingType: any) => ({
						value: billingType.id.toString(),
						label: billingType.name,
					}));
					setBillingTypes(billingTypeOptions);
				}
			}
		} catch (error: unknown) {
			const err = error as { response?: { data?: unknown; status?: number }; message?: string };
			console.error('Failed to load billing types:', error);
			console.error('Error details:', err.response?.data || err.message);
			console.error('Error status:', err.response?.status);
		}
	}, []); // Remove dependency to prevent infinite loop

	useEffect(() => {
		loadBillingTypes();
	}, []); // Run only once

	return {
		billingTypes,
		loading: billingTypesApi.loading,
		error: billingTypesApi.error,
		refetch: loadBillingTypes,
	};
};

// Custom hook for billing sub types
export const useBillingSubTypes = (billingTypeId?: string | number) => {
	const billingSubTypesApi = useApi('billingSubTypes', () =>
		BillingApiService.getBillingSubTypes(1, 10)
	);
	const [billingSubTypes, setBillingSubTypes] = useState<DropdownOption[]>([]);

	const loadBillingSubTypes = useCallback(async () => {
		try {
			const response = await billingSubTypesApi.execute({});
			if (response.status_code === 200) {
				// Handle both response.result and response.data (API inconsistency)
				const responseData = (response as any).result || response.data;
				if (responseData) {
					// Handle both direct array and paginated response
					const result = Array.isArray(responseData) ? responseData : responseData.data || [];
					
					// Filter by billing_type_id if provided
					let filteredResult = result;
					if (billingTypeId !== undefined && billingTypeId !== null && billingTypeId !== '') {
						const billingTypeIdNum = typeof billingTypeId === 'string' ? parseInt(billingTypeId) : billingTypeId;
						filteredResult = result.filter((item: any) => item.billing_type_id === billingTypeIdNum);
					}
					
					const billingSubTypeOptions: DropdownOption[] = filteredResult.map((billingSubType: any) => ({
						value: billingSubType.id.toString(),
						label: billingSubType.name,
					}));
					setBillingSubTypes(billingSubTypeOptions);
				}
			}
		} catch (error) {
			console.error('Failed to load billing sub types:', error);
		}
	}, [billingTypeId]); // Include billingTypeId in dependencies

	useEffect(() => {
		loadBillingSubTypes();
	}, [loadBillingSubTypes]);

	return {
		billingSubTypes,
		loading: billingSubTypesApi.loading,
		error: billingSubTypesApi.error,
		refetch: loadBillingSubTypes,
	};
};
