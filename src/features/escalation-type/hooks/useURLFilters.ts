/**
 * Hook for syncing filters with URL search params
 * Enables shareable/bookmarkable filter state
 */

import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';

interface EscalationTypeFilters {
	status: string;
}

const DEFAULT_FILTERS: EscalationTypeFilters = {
	status: '',
};

export const useURLFilters = () => {
	const [searchParams, setSearchParams] = useSearchParams();

	const filters = useMemo<EscalationTypeFilters>(() => {
		return {
			status: searchParams.get('status') || DEFAULT_FILTERS.status,
		};
	}, [searchParams]);

	const updateFilters = useCallback(
		(updates: Partial<EscalationTypeFilters>) => {
			const newParams = new URLSearchParams(searchParams);

			if (updates.status !== undefined) {
				if (updates.status) {
					newParams.set('status', updates.status);
				} else {
					newParams.delete('status');
				}
			}

			setSearchParams(newParams, { replace: true });
		},
		[searchParams, setSearchParams]
	);

	return { filters, updateFilters };
};

