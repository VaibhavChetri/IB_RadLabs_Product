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
		id?: number;
		invoice_number: string;
		invoice_date?: string;
		order_id?: string;
		order_date?: string;
		document_type?: string;
		// Seller / Ship-from
		sold_by?: string;
		sold_by_gstin?: string;
		ship_from_address?: string;
		pan_number?: string;
		seller_name?: string;
		seller_gstin?: string;
		seller_pan?: string;
		// Billing (receiver)
		billing_name?: string;
		billing_address?: string;
		billing_gstin?: string;
		// Shipping (delivery)
		shipping_name?: string;
		shipping_address?: string;
		// Financials
		subtotal?: number | string | null;
		grand_total: number | string;
		shipping_charges?: number | string | null;
		total_discount?: number | string | null;
		// Tax
		igst_rate?: number | string | null;
		igst_amount?: number | string | null;
		cgst_rate?: number | string | null;
		cgst_amount?: number | string | null;
		sgst_rate?: number | string | null;
		sgst_amount?: number | string | null;
		// Misc
		irn?: string | null;
		payment_method?: string | null;
		extraction_confidence?: number | string | null;
		parsing_warnings?: string | any[];
	};
	line_items: Array<{
		id: number;
		invoice_number?: string;
		description: string;
		asin?: string | null;
		hsn_code?: string | null;
		seller_sku?: string | null;
		quantity: number;
		unit_price: number | string;
		discount?: number | string | null;
		net_amount?: number | string | null;
		tax_rate?: number | string | null;
		tax_amount?: number | string | null;
		total_amount: number | string;
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
		return apiService.get(url) as unknown as Promise<ListInvoicesResponse>;
	}

	/**
	 * Get single invoice by invoice number
	 */
	static async getInvoiceByNumber(invoiceNumber: string): Promise<DetailResponse> {
		const encoded = encodeURIComponent(invoiceNumber);
		return apiService.get(`${BASE_PATH}/${encoded}`) as unknown as Promise<DetailResponse>;
	}

	/**
	 * Get filter options for UI (document types, sellers, date/amount range)
	 */
	static async getFilters(): Promise<FiltersResponse> {
		return apiService.get(`${BASE_PATH}/filters`) as unknown as Promise<FiltersResponse>;
	}
}
