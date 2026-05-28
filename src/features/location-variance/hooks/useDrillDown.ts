/**
 * useDrillDown
 *
 * When a row in the table is clicked, fetches BOTH:
 *   - /location-analytics/revenue-variance/:loc/:month   (decomposition + SKU + narrative)
 *   - /location-analytics/revenue-series/:loc?from=<6mo back>  (chart series)
 *
 * The chart range is independent of the page filter — always last 6 months
 * ending at the drilled-into month, so the trend context is consistent
 * regardless of which months the user has selected on the page.
 */

import { useEffect, useRef, useState } from 'react';
import { LocationAnalyticsApi } from '../api/locationAnalyticsApi';
import type { RevenueVarianceResponse, RevenueSeriesResponse } from '../types';

interface UseDrillDownArgs {
	locationId: number | null;
	month: string | null; // YYYY-MM
}

interface UseDrillDownReturn {
	variance: RevenueVarianceResponse | null;
	series: RevenueSeriesResponse | null;
	loading: boolean;
	error: string | null;
}

const subtractMonths = (yyyymm: string, n: number): string => {
	const [yStr, mStr] = yyyymm.split('-');
	const y = Number(yStr);
	const m = Number(mStr);
	let targetY = y;
	let targetM = m - n;
	while (targetM < 1) {
		targetM += 12;
		targetY -= 1;
	}
	return `${targetY}-${String(targetM).padStart(2, '0')}`;
};

export const useDrillDown = ({ locationId, month }: UseDrillDownArgs): UseDrillDownReturn => {
	const [variance, setVariance] = useState<RevenueVarianceResponse | null>(null);
	const [series, setSeries] = useState<RevenueSeriesResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const reqIdRef = useRef(0);

	useEffect(() => {
		if (locationId == null || !month) {
			setVariance(null);
			setSeries(null);
			return;
		}
		const reqId = ++reqIdRef.current;
		let cancelled = false;
		setLoading(true);
		setError(null);

		const from = subtractMonths(month, 5); // 6 months including the drilled month

		Promise.all([
			LocationAnalyticsApi.getRevenueVariance(locationId, month),
			LocationAnalyticsApi.getRevenueSeries(locationId, { from, to: month }),
		])
			.then(([v, s]) => {
				if (cancelled || reqId !== reqIdRef.current) return;
				setVariance(v);
				setSeries(s);
			})
			.catch((e: { message?: string }) => {
				if (cancelled || reqId !== reqIdRef.current) return;
				setError(e?.message || 'Failed to load drill-down data');
			})
			.finally(() => {
				if (!cancelled && reqId === reqIdRef.current) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [locationId, month]);

	return { variance, series, loading, error };
};
