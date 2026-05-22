/**
 * Smart Follow-Up Tracker API — GET /v1/api/email/invoice-threads
 *
 * Auth: handled automatically — the shared `apiService` in ./api injects the
 * Bearer JWT from TokenManager via its request interceptor. The endpoint
 * enforces the `transitPlan` permission server-side.
 *
 * Types live next to the mock for now (so swapping mock ↔ live is one import
 * change). If/when this stabilises we'll lift them up into a shared module.
 */

import { apiService } from './api';
import {
	MOCK_FOLLOW_UP_RESPONSE,
	type FollowUpResponse,
} from '../mocks/followUpTracker';

export interface InvoiceThreadsParams {
	account_email?: string;
	/** ISO YYYY-MM-DD — inclusive lower bound on invoice_date. Overrides `days`. */
	from?: string;
	/** ISO YYYY-MM-DD — inclusive upper bound on invoice_date. Overrides `days`. */
	to?: string;
	/** Legacy rolling window; ignored when `from` or `to` is set. */
	days?: number;
	status?: string;
	customer?: string;
	has_email?: 'yes' | 'no' | 'all';
	priority?: string;
	current_status?: string;
	limit?: number;
	page?: number;
}

/**
 * Set VITE_FOLLOW_UP_USE_MOCK=true in .env to bypass the backend and serve
 * the in-repo mock — handy when the backend is offline mid-demo. Default is
 * live.
 */
const USE_MOCK = import.meta.env.VITE_FOLLOW_UP_USE_MOCK === 'true';

const BASE_PATH = '/email/invoice-threads';

export class EmailFollowUpApiService {
	static async listInvoiceThreads(
		params: InvoiceThreadsParams = {}
	): Promise<FollowUpResponse> {
		if (USE_MOCK) {
			return new Promise(resolve =>
				setTimeout(() => resolve(MOCK_FOLLOW_UP_RESPONSE), 300)
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

		// The endpoint returns the unwrapped envelope { summary, pagination, items }
		// rather than the standard ApiResponse<T> shape, so cast through unknown.
		return apiService.get(url) as unknown as Promise<FollowUpResponse>;
	}
}
