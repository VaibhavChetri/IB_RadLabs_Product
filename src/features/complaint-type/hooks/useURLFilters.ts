/**
 * Hook for managing URL query parameters for filters
 */

import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

interface Filters {
	status: string;
}

interface UseURLFiltersReturn {
	filters: Filters;
	updateFilters: (newFilters: Partial<Filters>) => void;
	resetFilters: () => void;
}

export const useURLFilters = (): UseURLFiltersReturn => {
	const [searchParams, setSearchParams] = useSearchParams();

	const filters = useMemo<Filters>(
		() => ({
			status: searchParams.get('status') || '',
		}),
		[searchParams]
	);

	const updateFilters = useCallback(
		(newFilters: Partial<Filters>) => {
			const updated = new URLSearchParams(searchParams);

			Object.entries(newFilters).forEach(([key, value]) => {
				if (value === '' || value === undefined || value === null) {
					updated.delete(key);
				} else {
					updated.set(key, String(value));
				}
			});

			setSearchParams(updated, { replace: true });
		},
		[searchParams, setSearchParams]
	);

	const resetFilters = useCallback(() => {
		setSearchParams(new URLSearchParams(), { replace: true });
	}, [setSearchParams]);

	return {
		filters,
		updateFilters,
		resetFilters,
	};
};
