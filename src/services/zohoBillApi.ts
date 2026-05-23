/**
 * Zoho Bill API Service
 * Handles all requests for Zoho bills (AP / vendor invoices)
 */

import { apiService } from './api';

export interface ZohoBill {
	id: number;
	organization_id?: string;
	zoho_bill_id?: string;
	bill_number: string;
	vendor_name: string;
	vendor_id?: string;
	total: number;
	balance: number;
	status: string;
	date: string;
	due_date: string;
	cf_city?: string;
	cf_facility?: string;
	facility_type?: string;
	cf_nature_of_expense?: string;
	cf_business_unit?: string;
	cf_approver?: string;
	has_attachment?: boolean | number;
	reference_number?: string;
	currency_code?: string;
	currency_symbol?: string;
	created_time?: string;
	last_modified_time?: string;
	created_at?: string;
	updated_at?: string;
}

export interface ZohoBillFilters {
	date_start?: string;
	date_end?: string;
	vendor_name?: string;
	status?: string;
	city?: string;
	facility_type?: string;
	business_unit?: string;
	nature_of_expense?: string;
	expense_category?: string;
	client_hint?: string;
	page?: number;
	limit?: number;
}

export interface ZohoBillPagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface ZohoBillFacets {
	cities: string[];
	facilityTypes: string[];
	businessUnits: string[];
	statuses: string[];
	categories: string[];
	clientHints: string[];
	naturesOfExpense: string[];
}

export interface ZohoBillSummary {
	total_bills: number;
	total_amount: number;
	total_outstanding: number;
}

export interface GetZohoBillsResponse {
	status: boolean;
	statusCode: number;
	message: string;
	data: ZohoBill[];
	pagination: ZohoBillPagination;
	summary: ZohoBillSummary;
	facets: ZohoBillFacets;
}

export interface ImportZohoBillsResponse {
	status_code: number;
	status: string;
	message: string;
	importedCount: number;
}

export class ZohoBillApi {
	/**
	 * Get list of Zoho bills with filters
	 * GET /v1/api/billing/zoho/bills
	 */
	static async getBills(filters: ZohoBillFilters): Promise<GetZohoBillsResponse> {
		const params = new URLSearchParams();

		if (filters.date_start) params.append('date_start', filters.date_start);
		if (filters.date_end) params.append('date_end', filters.date_end);
		if (filters.vendor_name) params.append('vendor_name', filters.vendor_name);
		if (filters.status) params.append('status', filters.status);
		if (filters.city) params.append('city', filters.city);
		if (filters.facility_type) params.append('facility_type', filters.facility_type);
		if (filters.business_unit) params.append('business_unit', filters.business_unit);
		if (filters.nature_of_expense) params.append('nature_of_expense', filters.nature_of_expense);
		if (filters.expense_category) params.append('expense_category', filters.expense_category);
		if (filters.client_hint) params.append('client_hint', filters.client_hint);
		if (filters.page) params.append('page', filters.page.toString());
		if (filters.limit) params.append('limit', filters.limit.toString());

		return apiService.get(
			`/billing/zoho/bills?${params.toString()}`
		) as unknown as Promise<GetZohoBillsResponse>;
	}

	/**
	 * Import all bills modified in Zoho since the last refresh.
	 * POST /v1/api/billing/zoho/bills/import
	 *
	 * @param opts.force  When true, bypasses the per-scope cooldown gate.
	 * @param opts.deep   When true, performs a full historic backfill — use only for the
	 *                    very first import. Subsequent clicks should leave this false.
	 */
	static async importBills(opts: { force?: boolean; deep?: boolean } = {}): Promise<ImportZohoBillsResponse> {
		const params = new URLSearchParams();
		if (opts.force) params.append('force', 'true');
		if (opts.deep) params.append('deep', 'true');
		const qs = params.toString();
		return apiService.post(
			`/billing/zoho/bills/import${qs ? `?${qs}` : ''}`,
			{}
		) as unknown as Promise<ImportZohoBillsResponse>;
	}

	/** Detail view: bill + line items + applied payments + attachments */
	static async getBillDetail(id: number | string): Promise<{
		status: boolean;
		statusCode: number;
		data: {
			bill: ZohoBill;
			line_items: any[];
			attachments: any[];
			settled_by_payments: any[];
		};
	}> {
		return apiService.get(`/billing/zoho/bills/${id}/detail`) as any;
	}
}
