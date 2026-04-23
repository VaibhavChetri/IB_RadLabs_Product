/**
 * Zoho Payment API Service
 * Handles all requests for Zoho customer payments
 */

import { apiService } from './api';

export interface ZohoPayment {
	id: number;
	organization_id: string;
	zoho_payment_id: string;
	payment_number: string;
	payment_date: string;
	created_time: string;
	last_modified_time: string;
	amount: number;
	bcy_amount: number;
	unused_amount: number;
	bcy_unused_amount: number;
	bcy_refunded_amount: number;
	tax_amount_withheld: number;
	payment_mode: string;
	payment_mode_formatted: string;
	payment_type: string;
	payment_status: string;
	settlement_status: string;
	account_id: string;
	account_name: string;
	tax_account_id: string;
	tax_account_name: string;
	zoho_customer_id: string;
	customer_name: string;
	zoho_branch_id: string;
	branch_name: string;
	zoho_location_id: string;
	location_id: number | null;
	sales_account_id: number | null;
	invoice_numbers: string;
	description: string;
	product_description: string;
	reference_number: string;
	last_four_digits: string;
	gateway_transaction_id: string;
	payment_gateway: string;
	documents: string;
	custom_fields_json: string;
	created_at: string;
	updated_at: string;
}

export interface ZohoPaymentFilters {
	date_start?: string; // YYYY-MM-DD
	date_end?: string; // YYYY-MM-DD
	customer_name?: string;
	payment_mode?: string;
	page?: number;
	limit?: number;
}

export interface ZohoPaymentPagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface GetZohoPaymentsResponse {
	status: boolean;
	statusCode: number;
	message: string;
	data: ZohoPayment[];
	pagination: ZohoPaymentPagination;
}

export interface ImportZohoPaymentsResponse {
	status: boolean;
	statusCode: number;
	message: string;
	data: {
		imported: number;
		updated: number;
	};
}

export class ZohoPaymentApi {
	/**
	 * Get list of Zoho customer payments with filters
	 * GET /v1/api/billing/zoho/customer-payments
	 */
	static async getCustomerPayments(filters: ZohoPaymentFilters): Promise<GetZohoPaymentsResponse> {
		const params = new URLSearchParams();

		if (filters.date_start) params.append('date_start', filters.date_start);
		if (filters.date_end) params.append('date_end', filters.date_end);
		if (filters.customer_name) params.append('customer_name', filters.customer_name);
		if (filters.payment_mode) params.append('payment_mode', filters.payment_mode);
		if (filters.page) params.append('page', filters.page.toString());
		if (filters.limit) params.append('limit', filters.limit.toString());

		return apiService.get(
			`/billing/zoho/customer-payments?${params.toString()}`
		) as unknown as Promise<GetZohoPaymentsResponse>;
	}

	/**
	 * Import Zoho customer payments for a date range
	 * POST /v1/api/billing/zoho/customer-payments/import
	 */
	static async importCustomerPayments(dateStart: string, dateEnd: string): Promise<ImportZohoPaymentsResponse> {
		const params = new URLSearchParams();
		params.append('date_start', dateStart);
		params.append('date_end', dateEnd);

		return apiService.post(
			`/billing/zoho/customer-payments/import?${params.toString()}`,
			{}
		) as unknown as Promise<ImportZohoPaymentsResponse>;
	}
}
