/**
 * Amazon Invoices API Service
 * Handles listing, detail, and filter options for Amazon invoices
 * @see FRONTEND_SETUP.md for API contract
 */

import { apiService } from './api';

export interface AmazonInvoiceListItem {
	id: number;
	invoice_number: string;
	invoice_date: string;
	sold_by: string;
	grand_total: number;
	item_count: number;
	document_type: string;
}

export interface AmazonInvoiceDetail {
	invoice: {
		invoice_number: string;
		order_id?: string;
		grand_total: number;
		igst_amount?: number;
		shipping_charges?: number;
	};
	line_items: Array<{
		id: number;
		description: string;
		quantity: number;
		unit_price: number;
		total_amount: number;
	}>;
}

export interface AmazonInvoiceFiltersData {
	document_types: string[];
	sellers: Array<{ gstin: string; name: string }>;
	popular_asins?: Array<{ asin: string; usage_count: number }>;
	range: {
		min_invoice_date: string;
		max_invoice_date: string;
		min_grand_total: number;
		max_grand_total: number;
	};
}

export interface PaginationMeta {
	page: number;
	limit: number;
	total: number;
	total_pages: number;
	has_next_page: boolean;
	has_prev_page: boolean;
}

export interface ListInvoicesResponse {
	status: boolean;
	statusCode?: number;
	message?: string;
	data: AmazonInvoiceListItem[];
	pagination: PaginationMeta;
}

export interface FiltersResponse {
	status: boolean;
	data: AmazonInvoiceFiltersData;
}

export interface DetailResponse {
	status: boolean;
	data: AmazonInvoiceDetail;
}

export interface ListInvoicesParams {
	page?: number;
	limit?: number;
	sort_by?: string;
	sort_order?: 'asc' | 'desc';
	search?: string;
	sold_by_gstin?: string;
	invoice_date_from?: string;
	invoice_date_to?: string;
	min_total?: number;
	max_total?: number;
	document_type?: string;
}

const BASE_PATH = '/amazon-invoices';

export class AmazonInvoicesApiService {
	/**
	 * List invoices with optional filters and pagination
	 */
	static async listInvoices(
		params: ListInvoicesParams = {}
	): Promise<ListInvoicesResponse> {
		const searchParams = new URLSearchParams();
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== '' && value !== null) {
				searchParams.append(key, String(value));
			}
		});
		const query = searchParams.toString();
		const url = query ? `${BASE_PATH}?${query}` : BASE_PATH;
		return apiService.get(url) as Promise<ListInvoicesResponse>;
	}

	/**
	 * Get single invoice by invoice number
	 */
	static async getInvoiceByNumber(invoiceNumber: string): Promise<DetailResponse> {
		const encoded = encodeURIComponent(invoiceNumber);
		return apiService.get(`${BASE_PATH}/${encoded}`) as Promise<DetailResponse>;
	}

	/**
	 * Get filter options for UI (document types, sellers, date/amount range)
	 */
	static async getFilters(): Promise<FiltersResponse> {
		return apiService.get(`${BASE_PATH}/filters`) as Promise<FiltersResponse>;
	}
}
