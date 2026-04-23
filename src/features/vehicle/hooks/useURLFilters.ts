/**
 * Hook for syncing filters with URL search params
 * Enables shareable/bookmarkable filter state
 */

import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';

interface VehicleFilters {
	name: string;
	driver_name: string;
	driver_phone: string;
	status: string;
	page: number;
	limit: number;
}

const DEFAULT_FILTERS: VehicleFilters = {
	name: '',
	driver_name: '',
	driver_phone: '',
	status: '',
	page: 1,
	limit: 10,
};

export const useURLFilters = () => {
	const [searchParams, setSearchParams] = useSearchParams();

	const filters = useMemo<VehicleFilters>(() => {
		return {
			name: searchParams.get('name') || DEFAULT_FILTERS.name,
			driver_name: searchParams.get('driver_name') || DEFAULT_FILTERS.driver_name,
			driver_phone: searchParams.get('driver_phone') || DEFAULT_FILTERS.driver_phone,
			status: searchParams.get('status') || DEFAULT_FILTERS.status,
			page: parseInt(searchParams.get('page') || '1', 10),
			limit: parseInt(searchParams.get('limit') || '10', 10),
		};
	}, [searchParams]);

	const updateFilters = useCallback(
		(updates: Partial<VehicleFilters>) => {
			const newParams = new URLSearchParams(searchParams);

			if (updates.name !== undefined) {
				if (updates.name) {
					newParams.set('name', updates.name);
				} else {
					newParams.delete('name');
				}
			}

			if (updates.driver_name !== undefined) {
				if (updates.driver_name) {
					newParams.set('driver_name', updates.driver_name);
				} else {
					newParams.delete('driver_name');
				}
			}

			if (updates.driver_phone !== undefined) {
				if (updates.driver_phone) {
					newParams.set('driver_phone', updates.driver_phone);
				} else {
					newParams.delete('driver_phone');
				}
			}

			if (updates.status !== undefined) {
				if (updates.status) {
					newParams.set('status', updates.status);
				} else {
					newParams.delete('status');
				}
			}

			if (updates.page !== undefined) {
				if (updates.page === 1) {
					newParams.delete('page');
				} else {
					newParams.set('page', updates.page.toString());
				}
			}

			if (updates.limit !== undefined) {
				if (updates.limit === DEFAULT_FILTERS.limit) {
					newParams.delete('limit');
				} else {
					newParams.set('limit', updates.limit.toString());
				}
			}

			setSearchParams(newParams, { replace: true });
		},
		[searchParams, setSearchParams]
	);

	return { filters, updateFilters };
};

