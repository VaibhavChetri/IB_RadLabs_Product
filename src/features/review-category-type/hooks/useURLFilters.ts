/**
 * Hook for syncing filters with URL search params
 * Enables shareable/bookmarkable filter state
 */

import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';

interface ReviewCategoryTypeFilters {
	status: string;
	page: number;
	pageSize: number;
}

const DEFAULT_FILTERS: ReviewCategoryTypeFilters = {
	status: '',
	page: 1,
	pageSize: 10,
};

export const useURLFilters = () => {
	const [searchParams, setSearchParams] = useSearchParams();

	const filters = useMemo<ReviewCategoryTypeFilters>(() => {
		return {
			status: searchParams.get('status') || DEFAULT_FILTERS.status,
			page: parseInt(searchParams.get('page') || '1', 10),
			pageSize: parseInt(searchParams.get('pageSize') || '10', 10),
		};
	}, [searchParams]);

	const updateFilters = useCallback(
		(updates: Partial<ReviewCategoryTypeFilters>) => {
			const newParams = new URLSearchParams(searchParams);

			if (updates.status !== undefined) {
				if (updates.status) {
					newParams.set('status', updates.status);
				} else {
					newParams.delete('status');
				}
			}

			if (updates.page !== undefined) {
				if (updates.page === 1) {
					newParams.delete('page'); // Don't show page=1 in URL
				} else {
					newParams.set('page', updates.page.toString());
				}
			}

			if (updates.pageSize !== undefined) {
				if (updates.pageSize === DEFAULT_FILTERS.pageSize) {
					newParams.delete('pageSize'); // Don't show default pageSize in URL
				} else {
					newParams.set('pageSize', updates.pageSize.toString());
				}
			}

			setSearchParams(newParams, { replace: true });
		},
		[searchParams, setSearchParams]
	);

	return { filters, updateFilters };
};

