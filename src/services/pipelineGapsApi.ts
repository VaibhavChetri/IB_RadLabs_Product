import { apiService } from './api';

export interface FySummary {
	fy: string;
	customers: number;
	total_invoiced: number;
	total_paid: number;
	total_outstanding: number;
}

export interface PipelineCustomer {
	customer_name: string;
	total_invoiced: number;
	total_outstanding: number;
	overdue_balance: number;
	invoice_count: number;
	first_invoice_date: string;
	last_invoice_date: string;
	linked_thread_count: number;
	has_thread_coverage: boolean;
}

export interface PipelineGapSummary {
	total_customers: number;
	customers_with_coverage: number;
	customers_without_coverage: number;
	total_invoiced: number;
	total_outstanding: number;
	untracked_revenue: number;
}

export interface PipelineGapsResponse {
	fy_summary: FySummary[];
	customers: PipelineCustomer[];
	summary: PipelineGapSummary;
}

export class PipelineGapsApi {
	static async list(): Promise<PipelineGapsResponse> {
		// Backend returns unwrapped { fy_summary, customers, summary } — not the standard ApiResponse envelope
		return apiService.get('/reports/pipeline-gaps') as unknown as Promise<PipelineGapsResponse>;
	}
}
