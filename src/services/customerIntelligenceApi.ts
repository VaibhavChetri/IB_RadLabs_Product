/**
 * Customer Intelligence API — Module 2.
 *
 *   GET  /v1/api/customers/intelligence            ranked + filterable list
 *   POST /v1/api/customers/intelligence/refresh    refresh one or all
 *
 * Auth: handled automatically — the shared `apiService` in ./api injects the
 * Bearer JWT from TokenManager via its request interceptor. The endpoint
 * enforces the `transitPlan` permission server-side (same as Module 1).
 *
 * Mock fallback: set VITE_CUSTOMER_INTEL_USE_MOCK=true in .env to bypass the
 * backend and serve the in-repo fixture — handy when the backend is offline
 * mid-demo. Default is live.
 */

import { apiService } from './api';
import {
	MOCK_CUSTOMER_INTELLIGENCE_RESPONSE,
	type CustomerIntelligenceResponse,
	type RefreshRequest,
	type SortKey,
} from '../mocks/customerIntelligence';

export interface CustomerIntelligenceListParams {
	account_email?: string;
	/** Substring match on customer_name. */
	q?: string;
	/** CSV: healthy,watch,at_risk */
	health?: string;
	/** Hide customers with less outstanding than this. */
	min_outstanding?: number;
	has_concerns?: 'yes' | 'no' | 'all';
	sort?: SortKey;
	order?: 'asc' | 'desc';
	limit?: number;
	page?: number;
}

export interface RefreshResponse {
	/** Backend echo of the request + status. Shape is currently loose on the
	 *  server side — keeping this permissive until we settle on it. */
	status?: string;
	customer?: string;
	customers_refreshed?: number;
	took_ms?: number;
	[key: string]: unknown;
}

const USE_MOCK = import.meta.env.VITE_CUSTOMER_INTEL_USE_MOCK === 'true';

const BASE_PATH = '/customers/intelligence';
const REFRESH_PATH = '/customers/intelligence/refresh';

export class CustomerIntelligenceApiService {
	/** List customers, ranked + filtered + paginated per query params. */
	static async list(
		params: CustomerIntelligenceListParams = {}
	): Promise<CustomerIntelligenceResponse> {
		if (USE_MOCK) {
			return new Promise(resolve =>
				setTimeout(() => resolve(MOCK_CUSTOMER_INTELLIGENCE_RESPONSE), 300)
			);
		}

		const search = new URLSearchParams();
		Object.entries(params).forEach(([k, v]) => {
			if (v !== undefined && v !== null && v !== '') {
				search.append(k, String(v));
			}
		});
		const qs = search.toString();
		const url = qs ? `${BASE_PATH}?${qs}` : BASE_PATH;

		// Endpoint returns the unwrapped envelope { summary, pagination, items }
		// rather than the standard ApiResponse<T>, so we cast through unknown.
		return apiService.get(url) as unknown as Promise<CustomerIntelligenceResponse>;
	}

	/**
	 * Refresh customer intelligence — for one specific customer (synchronous,
	 * ~10-30s) or all customers (~50s at default concurrency for ~125).
	 *
	 * Single-customer:  { customer: "BOTTLE LAB ..." }
	 * All:              { concurrency?: 50, use_ai?: true }
	 *
	 * Pass `use_ai: false` for a rule-based-only refresh — instant and useful
	 * for dev iteration.
	 */
	static async refresh(body: RefreshRequest): Promise<RefreshResponse> {
		if (USE_MOCK) {
			// Pretend it took a moment and report success.
			return new Promise(resolve =>
				setTimeout(
					() =>
						resolve({
							status: 'ok',
							customers_refreshed:
								'customer' in body ? 1 : MOCK_CUSTOMER_INTELLIGENCE_RESPONSE.items.length,
							took_ms: 500,
						}),
					400
				)
			);
		}
		return apiService.post(REFRESH_PATH, body) as unknown as Promise<RefreshResponse>;
	}
}
