/**
 * Procurement API Service
 * Vendor invoice approval workflow — admin/approver view
 */

import { apiService } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VendorInvoiceApproval {
	approverId: number;
	approverLoginIds: number[];
	approverName: string;
	approverEmail: string;
	approverRole: 'default_approver' | 'senior_approver';
	decision: 'pending' | 'approved' | 'rejected';
	decidedAt: string | null;
	rejectionReason: string | null;
}

// Used by the approval-status endpoint (accordion in All Invoices tab)
export interface VendorInvoiceApprovalStatus {
	id: number;
	vendor_name: string;
	invoice_amount: number | null;
	invoice_status: string;
	approval_status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
	approval_submitted_at: string | null;
	approved_at: string | null;
	rejected_at: string | null;
	invoice_number: string | null;
	invoice_date: string | null;
	invoice_file_url: string | null;
	invoice_remarks: string | null;
	contact_person: string | null;
	contact_number: string | null;
	notes: string | null;
	approvals: VendorInvoiceApproval[];
}

// Used by the dashboard endpoint (All Invoices tab — flat list)
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
	client?: string;
	clientName?: string;
	leadName?: string;
}

// ─── Pending My Approval — grouped by lead ────────────────────────────────────

export interface PendingApprovalTrailEntry {
	approverName: string;
	approverRole: 'default_approver' | 'senior_approver';
	decision: 'pending' | 'approved' | 'rejected';
	decidedAt: string | null;
	rejectionReason: string | null;
}

export interface PendingApprovalVendor {
	vendorInvoiceId: number;
	vendorName: string;
	invoiceAmount: number | null;
	invoiceFileUrl: string | null;
	invoiceNumber: string | null;
	invoiceDate: string | null;
	invoiceStatus: string | null;
	invoiceRemarks: string | null;
	contactPerson: string | null;
	contactNumber: string | null;
	approvalStatus: 'draft' | 'pending_approval' | 'approved' | 'rejected';
	approvalSubmittedAt: string | null;
	myDecision: 'pending' | 'approved' | 'rejected' | null;
	approvalsTotal: number;
	approvalsDone: number;
	approvalTrail: PendingApprovalTrailEntry[];
}

export interface ClientPo {
	poNumber: string;
	totalAmount: string | null;
	s3Url: string | null;
}

export interface PendingApprovalLead {
	leadId: number;
	client: string;
	city: string | null;
	clientPos: ClientPo[];
	vendors: PendingApprovalVendor[];
}

// ─── Shared ───────────────────────────────────────────────────────────────────

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
	 * Flat list of all vendor invoices across leads (All Invoices tab)
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
	 * Per-vendor approval details — used in accordion for All Invoices tab
	 */
	static async getVendorInvoiceApprovalStatus(leadId: number): Promise<{
		status: boolean;
		data: VendorInvoiceApprovalStatus[];
	}> {
		return apiService.get(`${BASE}/leads-tracker/${leadId}/vendor-invoices/approval-status`) as any;
	}

	/**
	 * GET /procurement/vendor-invoices/pending-my-approval
	 * Grouped by lead — all vendors per lead with approvalTrail + myDecision
	 */
	static async getMyPendingApprovals(page = 1, perPage = 20): Promise<{
		status: boolean;
		data: PendingApprovalLead[];
		pagination: PaginationMeta;
	}> {
		const res: any = await apiService.get(`${BASE}/vendor-invoices/pending-my-approval?page=${page}&perPage=${perPage}`);
		// Normalize snake_case vendor fields that the backend may return
		if (res?.data && Array.isArray(res.data)) {
			res.data = res.data.map((lead: any) => ({
				...lead,
				vendors: (lead.vendors ?? []).map((v: any) => ({
					...v,
					invoiceFileUrl: v.invoiceFileUrl ?? v.invoice_file_url ?? null,
					invoiceNumber: v.invoiceNumber ?? v.invoice_number ?? null,
					invoiceDate: v.invoiceDate ?? v.invoice_date ?? null,
					invoiceStatus: v.invoiceStatus ?? v.invoice_status ?? null,
					invoiceRemarks: v.invoiceRemarks ?? v.invoice_remarks ?? null,
					contactPerson: v.contactPerson ?? v.contact_person ?? null,
					contactNumber: v.contactNumber ?? v.contact_number ?? null,
					vendorName: v.vendorName ?? v.vendor_name ?? '',
					invoiceAmount: v.invoiceAmount ?? v.invoice_amount ?? null,
					vendorInvoiceId: v.vendorInvoiceId ?? v.id ?? v.vendor_invoice_id,
					approvalStatus: v.approvalStatus ?? v.approval_status ?? 'draft',
					approvalSubmittedAt: v.approvalSubmittedAt ?? v.approval_submitted_at ?? null,
					myDecision: v.myDecision ?? v.my_decision ?? null,
					approvalsTotal: v.approvalsTotal ?? v.approvals_total ?? 0,
					approvalsDone: v.approvalsDone ?? v.approvals_done ?? 0,
					approvalTrail: v.approvalTrail ?? v.approval_trail ?? [],
				})),
			}));
		}
		return res;
	}

	/**
	 * POST /procurement/leads-tracker/:leadId/vendors/:vendorId/approval-decision
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
