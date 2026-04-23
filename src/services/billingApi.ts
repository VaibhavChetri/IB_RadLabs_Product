import { ApiService, ApiResponse } from './api';

// Billing Report Row Interface
export interface BillingReportRow {
	clientId: number;
	clientName: string;
	zoho_customer_id: string;
	gst: string;
	containerTypeId: number;
	containerName: string;
	qty: string;
	rate: string;
	amount: string;
	cgst: string;
	sgst: string;
	total: string;
}

// Bill Value Totals Interface
export interface BillValue {
	subTotal: string;
	cgst: string;
	sgst: string;
	total: string;
}

// Billing Report Response Interface
export interface BillingReportResponse {
	status: string;
	status_code: number;
	data: BillingReportRow[];
	billValue: BillValue;
}

// Get Final Cumulative Billing Report Parameters
export interface GetBillingReportParams {
	client_id?: number | string;
	groupId?: number | string;
	hsnsac?: number;
	account_id?: number | string;
	account_name?: string;
	due_date_id?: number | string;
	generate_invoice?: boolean;
	start_date: string;
	end_date: string;
	page?: number;
	limit?: number;
}

// Client Group Interface
export interface ClientGroup {
	id: number;
	name: string;
}

// HSN/SAC Interface
export interface HsnSac {
	id: number;
	name: string;
	code: number;
}

// Sales Account Interface
export interface SalesAccount {
	accountId: string;
	accountName: string;
}

export class BillingApiService {
	private static api = ApiService.getInstance();

	/**
	 * Get Final Cumulative Billing Report
	 * GET api/billing/getFinalCumulativeBillingReport
	 */
	static async getFinalCumulativeBillingReport(
		params: GetBillingReportParams
	): Promise<BillingReportResponse> {
		const queryParams = new URLSearchParams();
		
		if (params.client_id && params.client_id !== 'All') {
			queryParams.append('client_id', params.client_id.toString());
		}
		if (params.groupId) {
			queryParams.append('groupId', params.groupId.toString());
		}
		if (params.hsnsac) {
			queryParams.append('hsnsac', params.hsnsac.toString());
		}
		if (params.account_id) {
			queryParams.append('account_id', params.account_id.toString());
		}
		if (params.account_name) {
			queryParams.append('account_name', encodeURIComponent(params.account_name));
		}
		if (params.due_date_id) {
			queryParams.append('due_date_id', params.due_date_id.toString());
		}
		if (params.generate_invoice) {
			queryParams.append('generate_invoice', 'true');
		}
		queryParams.append('start_date', params.start_date);
		queryParams.append('end_date', params.end_date);
		if (params.page) {
			queryParams.append('page', params.page.toString());
		}
		if (params.limit) {
			queryParams.append('limit', params.limit.toString());
		}

		return (this.api.get(
			`/billing/getFinalCumulativeBillingReport?${queryParams.toString()}`
		) as unknown) as Promise<BillingReportResponse>;
	}

	/**
	 * Get Client Group Master
	 * GET api/inventory/getClientGroupMaster
	 */
	static async getClientGroupMaster(): Promise<ApiResponse<ClientGroup[]>> {
		return (this.api.get('/inventory/getClientGroupMaster') as unknown) as Promise<
			ApiResponse<ClientGroup[]>
		>;
	}

	/**
	 * Get HSN/SAC
	 * GET api/billing/gethsnsac
	 * Note: This API returns data in 'result' property, not 'data'
	 */
	static async getHsnSac(): Promise<any> {
		return this.api.get('/billing/gethsnsac');
	}

	/**
	 * Get Zoho Sales Account
	 * GET api/billing/getZohoSalesAccount
	 */
	static async getZohoSalesAccount(): Promise<ApiResponse<SalesAccount[]>> {
		return (this.api.get('/billing/getZohoSalesAccount') as unknown) as Promise<
			ApiResponse<SalesAccount[]>
		>;
	}

	/**
	 * Create Zoho Invoice
	 * POST api/billing/createZohoInvoice
	 */
	static async createZohoInvoice(payload: {
		account_id: string;
		account_name: string;
		hsnsac: number;
		due_date_id: number;
		finalResult: BillingReportRow[];
	}): Promise<any> {
		return this.api.post('/billing/createZohoInvoice', payload);
	}
}

