/**
 * Zoho Vendor Payment API Service
 * Handles all requests for Zoho vendor payments (Payments Made / AP settlements)
 */

import { apiService } from './api';

export interface ZohoVendorPayment {
	id: number;
	organization_id?: string;
	zoho_payment_id?: string;
	payment_number: string;
	vendor_name: string;
	vendor_id?: string;
	date: string;
	payment_date?: string;
	amount: number;
	payment_mode?: string;
	paid_through?: string;
	paid_through_account_id?: string;
	paid_through_account_name?: string;
	reference_number?: string;
	description?: string;
	bills_settled_count?: number;
	currency_code?: string;
	currency_symbol?: string;
	created_time?: string;
	last_modified_time?: string;
	created_at?: string;
	updated_at?: string;
	// Derived (computed by backend at read time, source data unchanged):
	mode_account_mismatch?: number;
}

export interface ZohoVendorPaymentFilters {
	date_start?: string;
	date_end?: string;
	vendor_name?: string;
	payment_mode?: string;
	paid_through?: string;
	mismatch_only?: 'true' | '';
	zero_bills_only?: 'true' | '';
	page?: number;
	limit?: number;
}

export interface ZohoVendorPaymentPagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface ZohoVendorPaymentFacets {
	paymentModes: string[];
	paidThroughs: string[];
}

export interface ZohoVendorPaymentSummary {
	total_payments: number;
	total_amount: number;
	mismatch_count?: number | string;
	zero_bills_count?: number | string;
}

export interface GetZohoVendorPaymentsResponse {
	status: boolean;
	statusCode: number;
	message: string;
	data: ZohoVendorPayment[];
	pagination: ZohoVendorPaymentPagination;
	summary: ZohoVendorPaymentSummary;
	facets: ZohoVendorPaymentFacets;
}

export interface ImportZohoVendorPaymentsResponse {
	status_code: number;
	status: string;
	message: string;
	importedCount: number;
}

export class ZohoVendorPaymentApi {
	/**
	 * Get list of Zoho vendor payments with filters
	 * GET /v1/api/billing/zoho/vendor-payments
	 */
	static async getVendorPayments(
		filters: ZohoVendorPaymentFilters
	): Promise<GetZohoVendorPaymentsResponse> {
		const params = new URLSearchParams();

		if (filters.date_start) params.append('date_start', filters.date_start);
		if (filters.date_end) params.append('date_end', filters.date_end);
		if (filters.vendor_name) params.append('vendor_name', filters.vendor_name);
		if (filters.payment_mode) params.append('payment_mode', filters.payment_mode);
		if (filters.paid_through) params.append('paid_through', filters.paid_through);
		if (filters.mismatch_only === 'true') params.append('mismatch_only', 'true');
		if (filters.zero_bills_only === 'true') params.append('zero_bills_only', 'true');
		if (filters.page) params.append('page', filters.page.toString());
		if (filters.limit) params.append('limit', filters.limit.toString());

		return apiService.get(
			`/billing/zoho/vendor-payments?${params.toString()}`
		) as unknown as Promise<GetZohoVendorPaymentsResponse>;
	}

	/**
	 * Import all vendor payments modified in Zoho since the last refresh.
	 * POST /v1/api/billing/zoho/vendor-payments/import
	 *
	 * @param opts.force  Bypass the per-scope cooldown gate.
	 * @param opts.deep   Full historic backfill — use only for first import.
	 */
	static async importVendorPayments(
		opts: { force?: boolean; deep?: boolean } = {}
	): Promise<ImportZohoVendorPaymentsResponse> {
		const params = new URLSearchParams();
		if (opts.force) params.append('force', 'true');
		if (opts.deep) params.append('deep', 'true');
		const qs = params.toString();
		return apiService.post(
			`/billing/zoho/vendor-payments/import${qs ? `?${qs}` : ''}`,
			{}
		) as unknown as Promise<ImportZohoVendorPaymentsResponse>;
	}

	/** Detail view: payment + bills settled + attachments */
	static async getVendorPaymentDetail(id: number | string): Promise<{
		status: boolean;
		statusCode: number;
		data: {
			payment: ZohoVendorPayment;
			settled_bills: any[];
			attachments: any[];
		};
	}> {
		return apiService.get(`/billing/zoho/vendor-payments/${id}/detail`) as any;
	}
}
