/**
 * Typed client for the /api/location-analytics/* endpoints.
 *
 * Mirrors the pattern at src/services/commonApi.ts — singleton ApiService
 * instance with explicit response shapes. No React Query (matching the
 * existing P&L feature's direct-service-call pattern).
 */

import { ApiService } from '../../../services/api';
import type {
	SummaryResponse,
	OutliersResponse,
	RevenueSeriesResponse,
	RevenueVarianceResponse,
} from '../types';

const api = ApiService.getInstance();

export interface SummaryParams {
	billing_type_id: number;
	billing_sub_type_id?: number | null;
	city_ids?: number[] | null;
	months: string[]; // YYYY-MM
}

export interface OutliersParams {
	month: string; // YYYY-MM
	city_ids?: number[] | null;
	threshold_pct?: number;
	limit?: number;
}

export interface SeriesParams {
	from?: string; // YYYY-MM
	to?: string;   // YYYY-MM
}

const csv = (xs: ReadonlyArray<number | string> | null | undefined): string | undefined => {
	if (!xs || xs.length === 0) return undefined;
	return xs.join(',');
};

const stripEmpty = (obj: Record<string, unknown>): Record<string, unknown> => {
	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(obj)) {
		if (v !== undefined && v !== null && v !== '') out[k] = v;
	}
	return out;
};

export class LocationAnalyticsApi {
	/** Bulk per-mode summary — powers each tab list. */
	static async getSummary(params: SummaryParams): Promise<SummaryResponse> {
		const query = stripEmpty({
			billing_type_id: params.billing_type_id,
			billing_sub_type_id: params.billing_sub_type_id,
			city_ids: csv(params.city_ids),
			months: csv(params.months),
		});
		const res = await api.get<SummaryResponse>('/location-analytics/summary', {
			params: query,
		});
		return res.data;
	}

	/** Cross-mode outliers — powers the top-of-page card. */
	static async getOutliers(params: OutliersParams): Promise<OutliersResponse> {
		const query = stripEmpty({
			month: params.month,
			city_ids: csv(params.city_ids),
			threshold_pct: params.threshold_pct,
			limit: params.limit,
		});
		const res = await api.get<OutliersResponse>('/location-analytics/outliers', {
			params: query,
		});
		return res.data;
	}

	/** Monthly series + deltas for a single location — used by drill panel chart. */
	static async getRevenueSeries(
		locationId: number,
		params: SeriesParams = {}
	): Promise<RevenueSeriesResponse> {
		const res = await api.get<RevenueSeriesResponse>(
			`/location-analytics/revenue-series/${locationId}`,
			{ params: stripEmpty({ from: params.from, to: params.to }) }
		);
		return res.data;
	}

	/** Full drill-down (SKU breakdown, rejection reasons, narrative) for one month. */
	static async getRevenueVariance(
		locationId: number,
		month: string
	): Promise<RevenueVarianceResponse> {
		const res = await api.get<RevenueVarianceResponse>(
			`/location-analytics/revenue-variance/${locationId}/${month}`
		);
		return res.data;
	}
}
