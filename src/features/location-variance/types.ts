/**
 * TS types for the location-analytics backend.
 * Mirrors what /api/location-analytics/* returns.
 */

export type ZohoLinkage = 'strict_customer_id' | 'fuzzy_customer_name' | 'ambiguous' | 'none';

// /summary response ─────────────────────────────────────────────────────────

export interface SummaryMonthly {
	month: string; // YYYY-MM
	derived_revenue: number;
	billed_revenue: number | null;
	total_returned: number;
	total_dispatch: number;
	total_rejected: number;
}

export interface SummaryLocation {
	location_id: number;
	name: string;
	city_id: number | null;
	city_name: string | null;
	zoho_linkage: ZohoLinkage;
	monthly: SummaryMonthly[];
	latest_delta: number | null;
	latest_delta_pct: number | null;
	outlier: boolean;
	_error?: string;
}

export interface SummaryResponse {
	billing_type: {
		id: number;
		name: string | null;
		sub_type_id: number | null;
		sub_type_name: string | null;
	};
	filter_meta: {
		city_ids: number[] | null;
		months: string[];
	};
	locations: SummaryLocation[];
}

// /outliers response ────────────────────────────────────────────────────────

export interface OutlierRow {
	location_id: number;
	name: string;
	city_id: number | null;
	city_name: string | null;
	billing_type_id: number;
	billing_type_name: string | null;
	billing_sub_type_id: number | null;
	delta: number;
	delta_pct: number;
	basis: 'billed' | 'derived';
	primary_lever: string | null;
	blurb: string;
}

export interface OutliersResponse {
	month: string;
	prev_month: string;
	threshold_pct: number;
	total_evaluated: number;
	total_above_threshold: number;
	outliers: OutlierRow[];
}

// /revenue-series response ──────────────────────────────────────────────────

export interface SeriesPerSku {
	container_type_id: number;
	sku: string | null;
	returned_count: number;
	dispatch_count: number;
	count_used: number;
	rejected_count: number;
	price: number;
	revenue: number;
}

export interface SeriesMonth {
	month: string;
	derived_revenue: number;
	billed_revenue: number | null;
	derived_vs_billed_gap: number | null;
	total_returned: number;
	total_dispatch: number;
	total_rejected: number;
	per_sku?: SeriesPerSku[]; // added in backend PR #83
}

export interface SeriesDelta {
	month: string;
	prev_month: string;
	derived_delta: number;
	derived_delta_pct: number | null;
	billed_delta: number | null;
	billed_delta_pct: number | null;
	decomposition_summary: {
		count_lever: number | null;
		rejection_lever: number | null;
		price_lever: number | null;
		fixed_lever: number | null;
		extras_lever: number | null;
	};
	_note?: string;
}

export interface LocationMeta {
	id: number;
	name: string;
	city_id: number | null;
	city_name: string | null;
	billing_type_id: number | null;
	billing_type_name: string | null;
	billing_sub_type_id: number | null;
	billing_sub_type_name: string | null;
	zoho_customer_id: string | null;
}

export interface RevenueSeriesResponse {
	location: LocationMeta;
	range: { from: string; to: string };
	zoho_linkage: ZohoLinkage;
	series: SeriesMonth[];
	deltas: SeriesDelta[];
	consistency: {
		coefficient_of_variation: number | null;
		label: string;
		basis: string;
	};
	outlier_months: string[];
	notes: string[];
}

// /revenue-variance response ───────────────────────────────────────────────

export interface SkuBreakdownRow {
	container_type_id: number;
	sku: string | null;
	count_current: number;
	count_previous: number;
	count_delta: number;
	dispatch_current: number;
	dispatch_previous: number;
	rejected_current: number;
	rejected_previous: number;
	rejection_pct_current: number;
	rejection_pct_previous: number;
	price_current: number;
	revenue_current: number;
	revenue_previous: number;
	delta: number;
	count_lever: number;
	rejection_lever: number;
	price_lever: number | null;
}

export interface RejectionReason {
	container_type_id: number;
	sku: string | null;
	reason: string | null;
	rejected_count: number;
}

export interface RevenueVarianceResponse {
	location: LocationMeta;
	month: string;
	prev_month: string;
	totals: {
		derived_current: number;
		derived_previous: number;
		billed_current: number | null;
		billed_previous: number | null;
		derived_delta: number;
		billed_delta: number | null;
	};
	decomposition: {
		count_lever: number | null;
		rejection_lever: number | null;
		price_lever: number | null;
		fixed_lever: number | null;
		extras_lever: number | null;
		extras_current: number | null;
		extras_previous: number | null;
	};
	sku_breakdown: SkuBreakdownRow[];
	rejection_reasons: RejectionReason[];
	narrative: string;
	_note?: string;
}
