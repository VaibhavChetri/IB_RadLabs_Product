/**
 * Mock routes: Location Revenue Variance (LOCAL DEMO ONLY)
 * Backs src/features/location-variance (LocationVariance.tsx page).
 * Endpoints: /location-analytics/{summary,outliers,revenue-series/:id,revenue-variance/:id/:month}.
 * Each service method returns `res.data` (the envelope's data), so handlers wrap payloads in ok().
 */
import { MockRoute, MockRequest } from '../mockTypes';
import { ok, seeded, CITIES, SKUS, lastNMonths, Rng } from '../mockHelpers';
import type {
	SummaryResponse,
	SummaryLocation,
	SummaryMonthly,
	OutliersResponse,
	OutlierRow,
	RevenueSeriesResponse,
	SeriesMonth,
	SeriesDelta,
	RevenueVarianceResponse,
	SkuBreakdownRow,
	RejectionReason,
	ZohoLinkage,
	LocationMeta,
} from '../../features/location-variance/types';

const BILLING_TYPES: Record<string, string> = { '1': 'Per-Wash', '2': 'Fixed Monthly', '3': 'Hybrid' };
const LINKAGES: ZohoLinkage[] = ['strict_customer_id', 'fuzzy_customer_name', 'ambiguous', 'none'];
const LEVERS = ['Return volume', 'Rejection rate', 'Price revision', 'Fixed-fee change', 'Extras / one-offs'];

/** Locations = one facility per city (stable ids). */
function locationName(rng: Rng, cityName: string): string {
	return `${cityName} ${rng.pick(['Hub', 'Facility', 'Wash Centre', 'Cold Store', 'DC'])}`;
}

function monthsFromQuery(q: Record<string, string>): string[] {
	const raw = (q.months || '').trim();
	if (raw) return raw.split(',').map(s => s.trim()).filter(Boolean);
	return lastNMonths(6).map(m => m.key);
}

function monthlyFor(rng: Rng, months: string[]): SummaryMonthly[] {
	let dispatch = rng.int(6000, 38000);
	return months.map(month => {
		dispatch = Math.max(2000, Math.round(dispatch * rng.float(0.9, 1.12)));
		const returned = Math.round(dispatch * rng.float(0.9, 0.99));
		const rejected = Math.round(dispatch * rng.float(0.01, 0.07));
		const price = rng.float(11, 26);
		const derived = Math.round(returned * price);
		return {
			month,
			derived_revenue: derived,
			billed_revenue: Math.round(derived * rng.float(0.92, 1.08)),
			total_returned: returned,
			total_dispatch: dispatch,
			total_rejected: rejected,
		};
	});
}

function buildLocations(seed: string, months: string[], cityFilter: number[] | null): SummaryLocation[] {
	const rng = seeded(seed);
	const cities = cityFilter && cityFilter.length ? CITIES.filter(c => cityFilter.includes(c.id)) : CITIES;
	return cities.map((city, i) => {
		const monthly = monthlyFor(seeded(`${seed}:${city.id}`), months);
		const last = monthly[monthly.length - 1];
		const prev = monthly[monthly.length - 2];
		const delta = prev ? last.derived_revenue - prev.derived_revenue : 0;
		const deltaPct = prev && prev.derived_revenue ? +(100 * delta / prev.derived_revenue).toFixed(1) : null;
		return {
			location_id: 1000 + city.id,
			name: locationName(rng, city.name),
			city_id: city.id,
			city_name: city.name,
			zoho_linkage: LINKAGES[i % LINKAGES.length],
			monthly,
			latest_delta: delta,
			latest_delta_pct: deltaPct,
			outlier: deltaPct != null && Math.abs(deltaPct) >= 15,
		};
	});
}

function locationMeta(rng: Rng, locationId: number): LocationMeta {
	const city = CITIES[(locationId - 1000 + CITIES.length) % CITIES.length] || CITIES[0];
	const btId = rng.int(1, 3);
	return {
		id: locationId,
		name: locationName(rng, city.name),
		city_id: city.id,
		city_name: city.name,
		billing_type_id: btId,
		billing_type_name: BILLING_TYPES[String(btId)],
		billing_sub_type_id: rng.bool() ? rng.int(1, 4) : null,
		billing_sub_type_name: null,
		zoho_customer_id: rng.bool(0.7) ? `cust_${rng.int(100000, 999999)}` : null,
	};
}

export const routes: MockRoute[] = [
	// GET /location-analytics/summary
	{
		method: 'GET',
		pattern: /^\/location-analytics\/summary\/?$/,
		handler: (req: MockRequest) => {
			const months = monthsFromQuery(req.query);
			const cityIds = (req.query.city_ids || '')
				.split(',')
				.map(s => parseInt(s, 10))
				.filter(n => !isNaN(n));
			const btId = parseInt(req.query.billing_type_id || '1', 10) || 1;
			const subId = req.query.billing_sub_type_id ? parseInt(req.query.billing_sub_type_id, 10) : null;
			const payload: SummaryResponse = {
				billing_type: {
					id: btId,
					name: BILLING_TYPES[String(btId)] || 'Per-Wash',
					sub_type_id: subId,
					sub_type_name: subId ? `Sub-type ${subId}` : null,
				},
				filter_meta: { city_ids: cityIds.length ? cityIds : null, months },
				locations: buildLocations(`locvar-summary-${btId}`, months, cityIds.length ? cityIds : null),
			};
			return ok(payload);
		},
	},

	// GET /location-analytics/outliers
	{
		method: 'GET',
		pattern: /^\/location-analytics\/outliers\/?$/,
		handler: (req: MockRequest) => {
			const month = req.query.month || lastNMonths(1)[0].key;
			const prevDate = lastNMonths(2)[0].key;
			const threshold = parseFloat(req.query.threshold_pct || '15');
			const rng = seeded(`locvar-outliers-${month}`);
			const locs = buildLocations(`locvar-summary-1`, [prevDate, month], null);
			const rows: OutlierRow[] = locs
				.filter(l => l.latest_delta_pct != null && Math.abs(l.latest_delta_pct) >= threshold)
				.map(l => ({
					location_id: l.location_id,
					name: l.name,
					city_id: l.city_id,
					city_name: l.city_name,
					billing_type_id: 1,
					billing_type_name: 'Per-Wash',
					billing_sub_type_id: null,
					delta: l.latest_delta || 0,
					delta_pct: l.latest_delta_pct || 0,
					basis: rng.bool() ? 'billed' : 'derived',
					primary_lever: rng.pick(LEVERS),
					blurb:
						(l.latest_delta_pct || 0) < 0
							? `${l.name} revenue dipped ${Math.abs(l.latest_delta_pct || 0)}% MoM — driven by ${rng.pick(LEVERS).toLowerCase()}.`
							: `${l.name} revenue rose ${l.latest_delta_pct}% MoM on stronger ${rng.pick(LEVERS).toLowerCase()}.`,
				}));
			const payload: OutliersResponse = {
				month,
				prev_month: prevDate,
				threshold_pct: threshold,
				total_evaluated: locs.length,
				total_above_threshold: rows.length,
				outliers: rows,
			};
			return ok(payload);
		},
	},

	// GET /location-analytics/revenue-series/:id
	{
		method: 'GET',
		pattern: /^\/location-analytics\/revenue-series\/(?<id>\d+)\/?$/,
		handler: (req: MockRequest) => {
			const locationId = parseInt(req.params.id, 10);
			const rng = seeded(`locvar-series-${locationId}`);
			const months = lastNMonths(8).map(m => m.key);
			const monthly = monthlyFor(seeded(`series-${locationId}`), months);
			const series: SeriesMonth[] = monthly.map(m => ({
				month: m.month,
				derived_revenue: m.derived_revenue,
				billed_revenue: m.billed_revenue,
				derived_vs_billed_gap:
					m.billed_revenue != null ? m.derived_revenue - m.billed_revenue : null,
				total_returned: m.total_returned,
				total_dispatch: m.total_dispatch,
				total_rejected: m.total_rejected,
				per_sku: SKUS.slice(0, 4).map((sku, si) => {
					const returned = Math.round(m.total_returned / 4) + rng.int(-200, 200);
					const price = rng.float(11, 26);
					return {
						container_type_id: si + 1,
						sku,
						returned_count: returned,
						dispatch_count: returned + rng.int(50, 400),
						count_used: returned,
						rejected_count: rng.int(5, 120),
						price,
						revenue: Math.round(returned * price),
					};
				}),
			}));
			const deltas: SeriesDelta[] = series.slice(1).map((cur, i) => {
				const prev = series[i];
				const dDelta = cur.derived_revenue - prev.derived_revenue;
				return {
					month: cur.month,
					prev_month: prev.month,
					derived_delta: dDelta,
					derived_delta_pct: prev.derived_revenue ? +(100 * dDelta / prev.derived_revenue).toFixed(1) : null,
					billed_delta:
						cur.billed_revenue != null && prev.billed_revenue != null
							? cur.billed_revenue - prev.billed_revenue
							: null,
					billed_delta_pct:
						cur.billed_revenue != null && prev.billed_revenue
							? +(100 * ((cur.billed_revenue - (prev.billed_revenue || 0)) / prev.billed_revenue)).toFixed(1)
							: null,
					decomposition_summary: {
						count_lever: Math.round(dDelta * rng.float(0.3, 0.6)),
						rejection_lever: Math.round(dDelta * rng.float(-0.2, 0.1)),
						price_lever: Math.round(dDelta * rng.float(0.1, 0.4)),
						fixed_lever: 0,
						extras_lever: Math.round(dDelta * rng.float(-0.1, 0.1)),
					},
				};
			});
			const payload: RevenueSeriesResponse = {
				location: locationMeta(rng, locationId),
				range: { from: months[0], to: months[months.length - 1] },
				zoho_linkage: LINKAGES[locationId % LINKAGES.length],
				series,
				deltas,
				consistency: {
					coefficient_of_variation: rng.float(0.05, 0.35),
					label: rng.pick(['Highly consistent', 'Consistent', 'Variable', 'Volatile']),
					basis: 'derived_revenue',
				},
				outlier_months: deltas.filter(d => d.derived_delta_pct != null && Math.abs(d.derived_delta_pct) >= 15).map(d => d.month),
				notes: ['Derived revenue reconstructed from returned-container counts × per-SKU price.'],
			};
			return ok(payload);
		},
	},

	// GET /location-analytics/revenue-variance/:id/:month
	{
		method: 'GET',
		pattern: /^\/location-analytics\/revenue-variance\/(?<id>\d+)\/(?<month>[\d-]+)\/?$/,
		handler: (req: MockRequest) => {
			const locationId = parseInt(req.params.id, 10);
			const month = req.params.month;
			const rng = seeded(`locvar-variance-${locationId}-${month}`);
			const prevMonth = (() => {
				const [y, m] = month.split('-').map(Number);
				const d = new Date(Date.UTC(y, (m || 1) - 1, 1));
				d.setUTCMonth(d.getUTCMonth() - 1);
				return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
			})();
			const sku_breakdown: SkuBreakdownRow[] = SKUS.slice(0, 6).map((sku, si) => {
				const countCur = rng.int(1500, 9000);
				const countPrev = Math.round(countCur * rng.float(0.85, 1.15));
				const priceCur = rng.float(11, 26);
				const revCur = Math.round(countCur * priceCur);
				const revPrev = Math.round(countPrev * priceCur * rng.float(0.95, 1.05));
				return {
					container_type_id: si + 1,
					sku,
					count_current: countCur,
					count_previous: countPrev,
					count_delta: countCur - countPrev,
					dispatch_current: countCur + rng.int(100, 600),
					dispatch_previous: countPrev + rng.int(100, 600),
					rejected_current: rng.int(20, 250),
					rejected_previous: rng.int(20, 250),
					rejection_pct_current: rng.float(1, 7),
					rejection_pct_previous: rng.float(1, 7),
					price_current: priceCur,
					revenue_current: revCur,
					revenue_previous: revPrev,
					delta: revCur - revPrev,
					count_lever: Math.round((countCur - countPrev) * priceCur),
					rejection_lever: -rng.int(2000, 30000),
					price_lever: rng.bool() ? rng.int(-15000, 25000) : null,
				};
			});
			const rejection_reasons: RejectionReason[] = SKUS.slice(0, 4).map((sku, si) => ({
				container_type_id: si + 1,
				sku,
				reason: rng.pick(['Damaged seal', 'Temperature breach', 'Contamination', 'Late return', 'Wrong SKU']),
				rejected_count: rng.int(10, 180),
			}));
			const derivedCur = sku_breakdown.reduce((s, r) => s + r.revenue_current, 0);
			const derivedPrev = sku_breakdown.reduce((s, r) => s + r.revenue_previous, 0);
			const payload: RevenueVarianceResponse = {
				location: locationMeta(rng, locationId),
				month,
				prev_month: prevMonth,
				totals: {
					derived_current: derivedCur,
					derived_previous: derivedPrev,
					billed_current: Math.round(derivedCur * rng.float(0.93, 1.06)),
					billed_previous: Math.round(derivedPrev * rng.float(0.93, 1.06)),
					derived_delta: derivedCur - derivedPrev,
					billed_delta: Math.round((derivedCur - derivedPrev) * rng.float(0.9, 1.1)),
				},
				decomposition: {
					count_lever: sku_breakdown.reduce((s, r) => s + r.count_lever, 0),
					rejection_lever: sku_breakdown.reduce((s, r) => s + r.rejection_lever, 0),
					price_lever: sku_breakdown.reduce((s, r) => s + (r.price_lever || 0), 0),
					fixed_lever: 0,
					extras_lever: rng.int(-12000, 18000),
					extras_current: rng.int(0, 40000),
					extras_previous: rng.int(0, 40000),
				},
				sku_breakdown,
				rejection_reasons,
				narrative:
					`Derived revenue moved ₹${(derivedCur - derivedPrev).toLocaleString('en-IN')} vs ${prevMonth}, ` +
					`led by ${rng.pick(LEVERS).toLowerCase()}. Rejection drag stayed within the normal band.`,
			};
			return ok(payload);
		},
	},
];
