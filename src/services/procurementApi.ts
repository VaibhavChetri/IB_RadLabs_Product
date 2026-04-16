/**
 * Procurement API Service
 * Vendor invoice approval workflow — admin/approver view
 */

import { apiService } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VendorInvoiceApproval {
	approverId: number;
	approverLoginIds: number[]; // all login IDs that map to this approver (handles multi-account users)
	approverName: string;
	approverEmail: string;
	approverRole: 'default_approver' | 'senior_approver';
	decision: 'pending' | 'approved' | 'rejected';
	decidedAt: string | null;
	rejectionReason: string | null;
}

export interface VendorInvoiceApprovalStatus {
	id: number;
	vendor_name: string;
	invoice_amount: number | null;
	invoice_status: string;
	approval_status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
	approval_submitted_at: string | null;
	approved_at: string | null;
	rejected_at: string | null;
	// Invoice details
	invoice_number: string | null;
	invoice_date: string | null;
	invoice_file_url: string | null;
	invoice_remarks: string | null;
	contact_person: string | null;
	contact_number: string | null;
	notes: string | null;
	approvals: VendorInvoiceApproval[];
}

export interface VendorInvoiceDashboardItem {
	vendorInvoiceId: number;
	leadId: number;
	vendor_name: string;
	invoice_amount: number | null;
	invoice_status: string;
	approval_status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
	approval_submitted_at: string | null;
	approved_at: string | null;
	rejected_at: string | null;
	totalPaid: number | null;
	approvals_total: number;
	approvals_done: number;
	// May include client/lead info from dashboard
	clientName?: string;
	leadName?: string;
	client?: string;
}

export interface DashboardFilters {
	page?: number;
	perPage?: number;
	approvalStatus?: string;
	leadStatus?: string;
	search?: string;
}

export interface PaginationMeta {
	page: number;
	perPage: number;
	total: number;
	pages: number;
}

export interface ApprovalDecisionPayload {
	decision: 'approved' | 'rejected';
	rejectionReason?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

const BASE = '/procurement';

export class ProcurementApiService {
	/**
	 * GET /procurement/vendor-invoices/dashboard
	 * Full list of vendor invoices across all leads (summary only, no approvals[])
	 */
	static async getVendorInvoiceDashboard(filters: DashboardFilters = {}): Promise<{
		status: boolean;
		data: VendorInvoiceDashboardItem[];
		pagination: PaginationMeta;
	}> {
		const params = new URLSearchParams();
		if (filters.page) params.append('page', String(filters.page));
		if (filters.perPage) params.append('perPage', String(filters.perPage));
		if (filters.approvalStatus) params.append('approvalStatus', filters.approvalStatus);
		if (filters.leadStatus) params.append('leadStatus', filters.leadStatus ?? 'won');
		if (filters.search) params.append('search', filters.search);
		const query = params.toString();
		return apiService.get(`${BASE}/vendor-invoices/dashboard${query ? `?${query}` : ''}`) as any;
	}

	/**
	 * GET /procurement/leads-tracker/:leadId/vendor-invoices/approval-status
	 * Per-vendor approval details including approvals[] array — used for accordion
	 */
	static async getVendorInvoiceApprovalStatus(leadId: number): Promise<{
		status: boolean;
		data: VendorInvoiceApprovalStatus[];
	}> {
		return apiService.get(`${BASE}/leads-tracker/${leadId}/vendor-invoices/approval-status`) as any;
	}

	/**
	 * GET /procurement/vendor-invoices/pending-my-approval
	 * Invoices where the current logged-in admin has a pending decision
	 */
	static async getMyPendingApprovals(page = 1, perPage = 20): Promise<{
		status: boolean;
		data: VendorInvoiceDashboardItem[];
		pagination: PaginationMeta;
	}> {
		return apiService.get(`${BASE}/vendor-invoices/pending-my-approval?page=${page}&perPage=${perPage}`) as any;
	}

	/**
	 * POST /procurement/leads-tracker/:leadId/vendors/:vendorId/approval-decision
	 * Submit approve or reject decision
	 */
	static async submitApprovalDecision(
		leadId: number,
		vendorId: number,
		payload: ApprovalDecisionPayload
	): Promise<{
		status: boolean;
		data: { vendor: { id: number; approval_status: string; approved_at: string | null } };
	}> {
		return apiService.post(
			`${BASE}/leads-tracker/${leadId}/vendors/${vendorId}/approval-decision`,
			payload
		) as any;
	}
}
