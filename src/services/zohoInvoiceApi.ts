/**
 * Zoho Invoice API Service
 * Handles all requests for Zoho invoices
 */

import { apiService } from './api';

export interface ZohoInvoice {
	id: number;
	organization_id: string;
	zoho_invoice_id: string;
	invoice_number: string;
	customer_id: string;
	customer_name: string;
	location_id: number;
	zoho_location_id: string;
	branch_id: string;
	branch_name: string;
	status: string;
	type: string;
	project_name: string;
	email: string;
	invoice_date: string;
	due_date: string;
	issued_date: string;
	due_days: string;
	total: number;
	balance: number;
	currency_code: string;
	currency_symbol: string;
	reference_number: string;
	country: string;
	billing_city: string;
	billing_state: string;
	billing_zipcode: string;
	cf_branch_of_invoice: string;
	cf_business_unit: string;
	cf_key_account_manager_owner_of_invoice: string;
	cf_place_of_service_supply: string;
	payment_expected_date: string;
	created_time: string;
	last_modified_time: string;
	custom_fields_json: any;
	created_at: string;
	updated_at: string;
	key_account_manager?: string;
	place_of_service_supply?: string;
}

export interface ZohoInvoiceFilters {
	invoice_date?: string;
	date_start?: string;
	date_end?: string;
	customer_name?: string;
	status?: string;
	branch_code?: string;
	business_unit?: string;
	place_of_supply?: string;
	page?: number;
	limit?: number;
	sort_by?: string;
	sort_order?: 'asc' | 'desc';
}

export interface ZohoInvoicePagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface ZohoInvoiceFacets {
	branches: string[];
	businessUnits: string[];
	placesOfSupply: string[];
}

export interface ZohoInvoiceSummary {
	totalInvoiceAmount: number;
}

export interface GetZohoInvoicesResponse {
	status: boolean;
	statusCode: number;
	message: string;
	data: ZohoInvoice[];
	pagination: ZohoInvoicePagination;
	facets: ZohoInvoiceFacets;
	summary: ZohoInvoiceSummary;
}

export interface ImportZohoInvoicesResponse {
	status_code: number;
	status: string;
	message: string;
	importedCount: number;
}

export class ZohoInvoiceApi {
	/**
	 * Get list of Zoho invoices with filters
	 * GET /v1/api/billing/zoho/invoices
	 */
	static async getInvoices(filters: ZohoInvoiceFilters): Promise<GetZohoInvoicesResponse> {
		const params = new URLSearchParams();

		// If invoice_date is set, use it; otherwise use date_start and date_end
		if (filters.invoice_date) {
			params.append('invoice_date', filters.invoice_date);
		} else {
			if (filters.date_start) params.append('date_start', filters.date_start);
			if (filters.date_end) params.append('date_end', filters.date_end);
		}

		if (filters.customer_name) params.append('customer_name', filters.customer_name);
		if (filters.status) params.append('status', filters.status);
		if (filters.branch_code) params.append('branch_code', filters.branch_code);
		if (filters.business_unit) params.append('business_unit', filters.business_unit);
		if (filters.place_of_supply) params.append('place_of_supply', filters.place_of_supply);
		if (filters.page) params.append('page', filters.page.toString());
		if (filters.limit) params.append('limit', filters.limit.toString());
		if (filters.sort_by) params.append('sort_by', filters.sort_by);
		if (filters.sort_order) params.append('sort_order', filters.sort_order);

		return apiService.get(
			`/billing/zoho/invoices?${params.toString()}`
		) as unknown as Promise<GetZohoInvoicesResponse>;
	}

	/**
	 * Import Zoho invoices for a date range
	 * POST /v1/api/billing/zoho/invoices/import
	 */
	static async importInvoices(dateStart: string, dateEnd: string): Promise<ImportZohoInvoicesResponse> {
		const params = new URLSearchParams();
		params.append('date_start', dateStart);
		params.append('date_end', dateEnd);

		return apiService.post(
			`/billing/zoho/invoices/import?${params.toString()}`,
			{}
		) as unknown as Promise<ImportZohoInvoicesResponse>;
	}
}
