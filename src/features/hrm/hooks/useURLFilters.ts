/**
 * Hook for syncing HRM Employee filters with URL search params
 */

import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';

export interface HrmEmployeeURLFilters {
	q: string;
	department_id: string;
	designation_id: string;
	status: string;
	employment_type: string;
	is_active: string;
	page: number;
	limit: number;
}

const DEFAULT_FILTERS: HrmEmployeeURLFilters = {
	q: '',
	department_id: '',
	designation_id: '',
	status: '',
	employment_type: '',
	is_active: '',
	page: 1,
	limit: 20,
};

export const useEmployeeURLFilters = () => {
	const [searchParams, setSearchParams] = useSearchParams();

	const filters = useMemo<HrmEmployeeURLFilters>(() => {
		return {
			q: searchParams.get('q') || DEFAULT_FILTERS.q,
			department_id: searchParams.get('department_id') || DEFAULT_FILTERS.department_id,
			designation_id: searchParams.get('designation_id') || DEFAULT_FILTERS.designation_id,
			status: searchParams.get('status') || DEFAULT_FILTERS.status,
			employment_type: searchParams.get('employment_type') || DEFAULT_FILTERS.employment_type,
			is_active: searchParams.get('is_active') || DEFAULT_FILTERS.is_active,
			page: parseInt(searchParams.get('page') || '1', 10),
			limit: parseInt(searchParams.get('limit') || '20', 10),
		};
	}, [searchParams]);

	const updateFilters = useCallback(
		(updates: Partial<HrmEmployeeURLFilters>) => {
			const newParams = new URLSearchParams(searchParams);

			Object.entries(updates).forEach(([key, value]) => {
				if (value === undefined) return;
				const strVal = String(value);

				if (key === 'page') {
					if (Number(value) === 1) {
						newParams.delete('page');
					} else {
						newParams.set('page', strVal);
					}
				} else if (key === 'limit') {
					if (Number(value) === DEFAULT_FILTERS.limit) {
						newParams.delete('limit');
					} else {
						newParams.set('limit', strVal);
					}
				} else {
					if (strVal) {
						newParams.set(key, strVal);
					} else {
						newParams.delete(key);
					}
				}
			});

			setSearchParams(newParams, { replace: true });
		},
		[searchParams, setSearchParams]
	);

	return { filters, updateFilters };
};
