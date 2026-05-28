/**
 * useTabSummary
 *
 * Fetches /location-analytics/summary for the currently active tab.
 * Re-fires whenever billing_type / sub_type / city_ids / months change.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { LocationAnalyticsApi } from '../api/locationAnalyticsApi';
import type { SummaryResponse } from '../types';

interface UseTabSummaryArgs {
	billingTypeId: number | null;
	billingSubTypeId: number | null;
	cityIds: number[] | null;
	months: string[];
	enabled: boolean;
}

interface UseTabSummaryReturn {
	data: SummaryResponse | null;
	loading: boolean;
	error: string | null;
	refetch: () => void;
}

export const useTabSummary = ({
	billingTypeId,
	billingSubTypeId,
	cityIds,
	months,
	enabled,
}: UseTabSummaryArgs): UseTabSummaryReturn => {
	const [data, setData] = useState<SummaryResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [refetchKey, setRefetchKey] = useState(0);

	// Track in-flight request so a stale response can't overwrite a fresh one.
	const reqIdRef = useRef(0);

	// Stable string keys for the array-shaped deps (ESLint complains about
	// inline JSON.stringify in the deps array — pre-compute them).
	const cityIdsKey = useMemo(() => (cityIds ?? []).join(','), [cityIds]);
	const monthsKey = useMemo(() => months.join(','), [months]);

	useEffect(() => {
		if (!enabled || billingTypeId == null || months.length === 0) {
			setData(null);
			return;
		}
		const reqId = ++reqIdRef.current;
		let cancelled = false;
		setLoading(true);
		setError(null);

		LocationAnalyticsApi.getSummary({
			billing_type_id: billingTypeId,
			billing_sub_type_id: billingSubTypeId,
			city_ids: cityIds && cityIds.length ? cityIds : null,
			months,
		})
			.then((res) => {
				if (cancelled || reqId !== reqIdRef.current) return;
				setData(res);
			})
			.catch((e: { message?: string }) => {
				if (cancelled || reqId !== reqIdRef.current) return;
				setError(e?.message || 'Failed to load tab summary');
			})
			.finally(() => {
				if (!cancelled && reqId === reqIdRef.current) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
		// cityIds + months arrays are tracked via stable key strings; safe to
		// omit them from the deps list directly.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [billingTypeId, billingSubTypeId, cityIdsKey, monthsKey, enabled, refetchKey]);

	return {
		data,
		loading,
		error,
		refetch: () => setRefetchKey((k) => k + 1),
	};
};
