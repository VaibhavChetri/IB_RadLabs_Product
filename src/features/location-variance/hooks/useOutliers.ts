/**
 * useOutliers
 *
 * Fetches /location-analytics/outliers for the most recently selected month.
 * Powers the cross-tab "needs attention" card at the top of the page.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { LocationAnalyticsApi } from '../api/locationAnalyticsApi';
import type { OutliersResponse } from '../types';

interface UseOutliersArgs {
	month: string | null;
	cityIds: number[] | null;
	thresholdPct?: number;
	limit?: number;
	enabled: boolean;
}

interface UseOutliersReturn {
	data: OutliersResponse | null;
	loading: boolean;
	error: string | null;
}

export const useOutliers = ({
	month,
	cityIds,
	thresholdPct = 10,
	limit = 10,
	enabled,
}: UseOutliersArgs): UseOutliersReturn => {
	const [data, setData] = useState<OutliersResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const reqIdRef = useRef(0);
	const cityIdsKey = useMemo(() => (cityIds ?? []).join(','), [cityIds]);

	useEffect(() => {
		if (!enabled || !month) {
			setData(null);
			return;
		}
		const reqId = ++reqIdRef.current;
		let cancelled = false;
		setLoading(true);
		setError(null);

		LocationAnalyticsApi.getOutliers({
			month,
			city_ids: cityIds && cityIds.length ? cityIds : null,
			threshold_pct: thresholdPct,
			limit,
		})
			.then((res) => {
				if (cancelled || reqId !== reqIdRef.current) return;
				setData(res);
			})
			.catch((e: { message?: string }) => {
				if (cancelled || reqId !== reqIdRef.current) return;
				setError(e?.message || 'Failed to load outliers');
			})
			.finally(() => {
				if (!cancelled && reqId === reqIdRef.current) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
		// cityIds tracked via cityIdsKey
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [month, cityIdsKey, thresholdPct, limit, enabled]);

	return { data, loading, error };
};
