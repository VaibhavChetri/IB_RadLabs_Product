/**
 * Zoho Expense API Service
 * Handles all requests for Zoho expenses (cash expenses, non-bill spend)
 */

import { apiService } from './api';

export interface ZohoExpense {
	id: number;
	organization_id?: string;
	zoho_expense_id?: string;
	date: string;
	total: number;
	expense_account_name?: string;
	vendor_name?: string;
	customer_name?: string;
	status?: string;
	payment_mode?: string;
	expense_category?: string;
	cf_city?: string;
	derived_city?: string;
	cf_facility?: string;
	facility_type?: string;
	derived_facility_type?: string;
	cf_business_unit?: string;
	client_hint?: string;
	has_attachment?: boolean | number;
	submitter?: string;
	reference_number?: string;
	description?: string;
	currency_code?: string;
	currency_symbol?: string;
	created_time?: string;
	last_modified_time?: string;
	created_at?: string;
	updated_at?: string;
}

export interface ZohoExpenseFilters {
	date_start?: string;
	date_end?: string;
	vendor_name?: string;
	customer_name?: string;
	expense_account_name?: string;
	status?: string;
	city?: string;
	facility_type?: string;
	business_unit?: string;
	expense_category?: string;
	client_hint?: string;
	submitter?: string;
	page?: number;
	limit?: number;
}

export interface ZohoExpensePagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface ZohoExpenseFacets {
	cities: string[];
	facilityTypes: string[];
	businessUnits: string[];
	categories: string[];
	clientHints: string[];
	statuses: string[];
}

export interface ZohoExpenseSummary {
	total_expenses: number;
	total_amount: number;
}

export interface GetZohoExpensesResponse {
	status: boolean;
	statusCode: number;
	message: string;
	data: ZohoExpense[];
	pagination: ZohoExpensePagination;
	summary: ZohoExpenseSummary;
	facets: ZohoExpenseFacets;
}

export interface ImportZohoExpensesResponse {
	status_code: number;
	status: string;
	message: string;
	importedCount: number;
}

export class ZohoExpenseApi {
	/**
	 * Get list of Zoho expenses with filters
	 * GET /v1/api/billing/zoho/expenses
	 */
	static async getExpenses(filters: ZohoExpenseFilters): Promise<GetZohoExpensesResponse> {
		const params = new URLSearchParams();

		if (filters.date_start) params.append('date_start', filters.date_start);
		if (filters.date_end) params.append('date_end', filters.date_end);
		if (filters.vendor_name) params.append('vendor_name', filters.vendor_name);
		if (filters.customer_name) params.append('customer_name', filters.customer_name);
		if (filters.expense_account_name) params.append('expense_account_name', filters.expense_account_name);
		if (filters.status) params.append('status', filters.status);
		if (filters.city) params.append('city', filters.city);
		if (filters.facility_type) params.append('facility_type', filters.facility_type);
		if (filters.business_unit) params.append('business_unit', filters.business_unit);
		if (filters.expense_category) params.append('expense_category', filters.expense_category);
		if (filters.client_hint) params.append('client_hint', filters.client_hint);
		if (filters.submitter) params.append('submitter', filters.submitter);
		if (filters.page) params.append('page', filters.page.toString());
		if (filters.limit) params.append('limit', filters.limit.toString());

		return apiService.get(
			`/billing/zoho/expenses?${params.toString()}`
		) as unknown as Promise<GetZohoExpensesResponse>;
	}

	/**
	 * Import all expenses modified in Zoho since the last refresh.
	 * POST /v1/api/billing/zoho/expenses/import
	 *
	 * @param opts.force  Bypass the per-scope cooldown gate.
	 * @param opts.deep   Full historic backfill — use only for first import.
	 */
	static async importExpenses(opts: { force?: boolean; deep?: boolean } = {}): Promise<ImportZohoExpensesResponse> {
		const params = new URLSearchParams();
		if (opts.force) params.append('force', 'true');
		if (opts.deep) params.append('deep', 'true');
		const qs = params.toString();
		return apiService.post(
			`/billing/zoho/expenses/import${qs ? `?${qs}` : ''}`,
			{}
		) as unknown as Promise<ImportZohoExpensesResponse>;
	}

	/** Detail view: expense + line items + attachments */
	static async getExpenseDetail(id: number | string): Promise<{
		status: boolean;
		statusCode: number;
		data: {
			expense: ZohoExpense;
			line_items: any[];
			attachments: any[];
		};
	}> {
		return apiService.get(`/billing/zoho/expenses/${id}/detail`) as any;
	}
}
