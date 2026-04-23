/**
 * Hook to manage URL-based filters for Client Escalation listing
 */

import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';

export interface ClientEscalationFilters {
	startDate: string;
	endDate: string;
	facility: string;
	page: string;
	limit: string;
}

// Get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
	return new Date().toISOString().split('T')[0];
};

const DEFAULT_FILTERS: ClientEscalationFilters = {
	startDate: getTodayDate(),
	endDate: getTodayDate(),
	facility: '',
	page: '1',
	limit: '10',
};

export const useURLFilters = () => {
	const [searchParams, setSearchParams] = useSearchParams();

	const filters = useMemo(() => {
		return {
			startDate: searchParams.get('startDate') || DEFAULT_FILTERS.startDate,
			endDate: searchParams.get('endDate') || DEFAULT_FILTERS.endDate,
			facility: searchParams.get('facility') || DEFAULT_FILTERS.facility,
			page: searchParams.get('page') || DEFAULT_FILTERS.page,
			limit: searchParams.get('limit') || DEFAULT_FILTERS.limit,
		};
	}, [searchParams]);

	const updateFilters = useCallback(
		(newFilters: Partial<ClientEscalationFilters>) => {
			const updatedParams = new URLSearchParams(searchParams);
			
			Object.entries(newFilters).forEach(([key, value]) => {
				if (value === '' || value === null || value === undefined) {
					updatedParams.delete(key);
				} else {
					updatedParams.set(key, value);
				}
			});

			// Reset to page 1 when filters change (except page/limit)
			if (newFilters.startDate !== undefined || newFilters.endDate !== undefined || newFilters.facility !== undefined) {
				updatedParams.set('page', '1');
			}

			setSearchParams(updatedParams, { replace: true });
		},
		[searchParams, setSearchParams]
	);

	return { filters, updateFilters };
};

