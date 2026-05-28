/**
 * useLocationVarianceFilters
 *
 * Owns the page-level filter state: year, selected months (multi), selected
 * cities (multi), search text. Hydrates from localStorage on mount and
 * persists on every change.
 *
 * Cities are loaded from CommonApiService.getCities() — same source as the
 * existing P&L feature, but the user has multi-select instead of single.
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { CommonApiService } from '../../../services/commonApi';
import { getCurrentMonth, getCurrentYear } from '../../dashboard/config/constants';
import { getYearOptions } from '../../p-and-l/config/constants';
import { RootState } from '../../../store';
import { canFilterByCity } from '../../../utils/cityFilterPermissions';

const STORAGE_KEY = 'pl-location-variance-filters';

export interface CityOption {
	value: string;
	label: string;
}

interface PersistedState {
	year: string;
	months: string[]; // YYYY-MM list
	cityIds: string[];
	search: string;
}

const defaultState = (): PersistedState => {
	const year = String(getCurrentYear());
	const curMonth = getCurrentMonth();
	// Default to last 3 months ending with current month, within current year only
	const months: string[] = [];
	for (let i = 2; i >= 0; i -= 1) {
		const m = curMonth - i;
		if (m >= 1) months.push(`${year}-${String(m).padStart(2, '0')}`);
	}
	return { year, months, cityIds: [], search: '' };
};

const loadFromStorage = (): PersistedState => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return defaultState();
		const parsed = JSON.parse(raw) as Partial<PersistedState>;
		const fallback = defaultState();
		return {
			year: parsed.year ?? fallback.year,
			months: Array.isArray(parsed.months) ? parsed.months : fallback.months,
			cityIds: Array.isArray(parsed.cityIds) ? parsed.cityIds : fallback.cityIds,
			search: typeof parsed.search === 'string' ? parsed.search : fallback.search,
		};
	} catch {
		return defaultState();
	}
};

const saveToStorage = (state: PersistedState): void => {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		// Storage may be full or disabled — fail silently
	}
};

export interface UseLocationVarianceFiltersReturn {
	// State
	year: string;
	selectedMonths: string[]; // YYYY-MM list
	selectedCityIds: string[];
	search: string;
	// Options
	yearOptions: ReadonlyArray<{ value: string; label: string }>;
	cityOptions: CityOption[];
	loadingCities: boolean;
	// Permission
	showCityFilter: boolean;
	// Setters
	setYear: (y: string) => void;
	setSelectedMonths: (months: string[]) => void;
	toggleMonth: (yyyymm: string) => void;
	setSelectedCityIds: (ids: string[]) => void;
	setSearch: (s: string) => void;
	// Helpers
	latestSelectedMonth: string | null;
}

export const useLocationVarianceFilters = (): UseLocationVarianceFiltersReturn => {
	const user = useSelector((s: RootState) => s.auth.user);
	const showCityFilter = canFilterByCity(user?.userTypeId);

	// Initial state from localStorage
	const [state, setState] = useState<PersistedState>(loadFromStorage);
	const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
	const [loadingCities, setLoadingCities] = useState(false);

	// Persist on every change
	useEffect(() => {
		saveToStorage(state);
	}, [state]);

	// Load cities (only when permitted)
	useEffect(() => {
		if (!showCityFilter) return;
		let cancelled = false;
		const load = async () => {
			setLoadingCities(true);
			try {
				const res = await CommonApiService.getCities();
				const ok = res.status_code === 200 || res.statusCode === 200;
				if (ok && Array.isArray(res.data) && !cancelled) {
					setCityOptions(
						res.data.map((c) => ({ value: String(c.id), label: c.name }))
					);
				}
			} catch (e) {
				console.error('Failed to load cities for location variance:', e);
			} finally {
				if (!cancelled) setLoadingCities(false);
			}
		};
		load();
		return () => {
			cancelled = true;
		};
	}, [showCityFilter]);

	// Setters
	const setYear = useCallback((y: string) => {
		setState((prev) => {
			// When year changes, clear months — they reference the old year.
			// User will pick months for the new year.
			return { ...prev, year: y, months: [] };
		});
	}, []);

	const setSelectedMonths = useCallback((months: string[]) => {
		setState((prev) => ({ ...prev, months: [...months].sort() }));
	}, []);

	const toggleMonth = useCallback((yyyymm: string) => {
		setState((prev) => {
			const has = prev.months.includes(yyyymm);
			const next = has ? prev.months.filter((m) => m !== yyyymm) : [...prev.months, yyyymm];
			return { ...prev, months: next.sort() };
		});
	}, []);

	const setSelectedCityIds = useCallback((ids: string[]) => {
		setState((prev) => ({ ...prev, cityIds: ids }));
	}, []);

	const setSearch = useCallback((s: string) => {
		setState((prev) => ({ ...prev, search: s }));
	}, []);

	const latestSelectedMonth = useMemo(() => {
		if (state.months.length === 0) return null;
		return [...state.months].sort()[state.months.length - 1];
	}, [state.months]);

	const yearOptions = useMemo(() => getYearOptions(), []);

	return {
		year: state.year,
		selectedMonths: state.months,
		selectedCityIds: state.cityIds,
		search: state.search,
		yearOptions,
		cityOptions,
		loadingCities,
		showCityFilter,
		setYear,
		setSelectedMonths,
		toggleMonth,
		setSelectedCityIds,
		setSearch,
		latestSelectedMonth,
	};
};
