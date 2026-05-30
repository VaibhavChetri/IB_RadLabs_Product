/**
 * City-Head KPI API service (P4).
 * Calls /v1/api/city-kpi/* (base URL is configured in apiService).
 */

import { apiService } from './api';

export interface KpiConsistencyWindow {
	onTime: number;
	total: number;
}

export interface CityKpiSummary {
	city: { city_id: number; city_name: string | null; facility_id: number };
	month: string;
	revenue: { target: number; actualToDate: number; attainmentPct: number | null };
	budget: { budget: number; actualSpend: number; budgetUsedPct: number | null; hasBudget: boolean };
	ebitda: {
		value: number | null;
		revenue: number | null;
		ebitdaPct: number | null;
		targetPct: number;
		targetIsDefault: boolean;
		gapPct: number | null;
	};
	qc: {
		thisWeekRejected: number;
		lastWeekRejected: number;
		deltaPct: number | null;
		topClients: Array<{
			clientId: number;
			clientName: string;
			thisWeekRejected: number;
			lastWeekRejected: number;
			delta: number;
			deltaPct: number | null;
		}>;
	};
	consistency: {
		thisMonth: { bucket: string; filled_pct: number | null } | null;
		last3Months: KpiConsistencyWindow;
		fyToDate: KpiConsistencyWindow;
	} | null;
	dataFreshness: { lastEntryDate: string | null; daysStale: number | null };
	recommendations: unknown[];
}

export interface CityKpiSummaryResponse {
	status: string;
	status_code: number;
	data: CityKpiSummary;
}

export interface BurnupPoint {
	day: string;
	dailyRevenue: number;
	cumulativeRevenue: number;
	targetPaceCumulative: number | null;
}

export interface RevenueBurnupResponse {
	status: string;
	status_code: number;
	data: {
		month: string;
		target: number;
		daysInMonth: number;
		series: BurnupPoint[];
		dataFreshness: { lastEntryDate: string | null; daysStale: number | null };
	};
}

const qs = (params: Record<string, string | number | undefined>): string => {
	const sp = new URLSearchParams();
	Object.entries(params).forEach(([k, v]) => {
		if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
	});
	const s = sp.toString();
	return s ? `?${s}` : '';
};

export class CityKpiApi {
	static async getSummary(params: { month?: string; city_id?: number; facility_id?: number }) {
		return apiService.get(`/city-kpi/summary${qs(params)}`) as unknown as Promise<CityKpiSummaryResponse>;
	}

	static async getRevenueBurnup(params: { month?: string; city_id?: number; facility_id?: number }) {
		return apiService.get(`/city-kpi/revenue-burnup${qs(params)}`) as unknown as Promise<RevenueBurnupResponse>;
	}

	static async setEbitdaTarget(body: { facility_id: number; target_pct: number; effective_from: string }) {
		return apiService.post('/city-kpi/ebitda-target', body) as unknown as Promise<{ status: string; status_code: number }>;
	}
}
