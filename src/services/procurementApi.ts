/**
 * Procurement API Service
 * Vendor invoice approval workflow — admin/approver view
 */

import { apiService } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApproverRole = 'default_approver' | 'senior_approver' | 'first_approver' | string;

// Per-trail-entry reopen fields. Populated on the Stage 1 row that's created
// when a Stage 2 rejection loops back. Absent / all-null on regular rows.
export interface TrailReopenFields {
	reopenedFromStage2?: boolean;
	reopenedReason?: string | null;
	reopenedRejectedByAdminId?: number | null;
	reopenedRejectedByName?: string | null;
	approvalStage?: number;
}

export interface VendorInvoiceApproval extends TrailReopenFields {
	approvalRowId: number;
	batchId?: number | null;
	approverId: number;
	approverLoginIds: number[];
	approverName: string;
	approverEmail: string;
	approverRole: ApproverRole;
	approvalStage?: number;
	decision: 'pending' | 'approved' | 'rejected';
	decidedAt: string | null;
	rejectionReason: string | null;
	isAdvance?: boolean;
	advanceRequested?: number | null;
	advanceApproved?: number | null;
}

// Per-vendor payment + budget snapshot computed fresh from the DB by the
// approval-status endpoint. ap_context.amounts.total_paid is the
// authoritative paid figure (advances + final). The top-level totalPaid
// only counts the legacy proc_vendor_payments table — prefer ap_context.
export interface ApContextAmounts {
	committed: number;
	header_invoice_amount: number;
	already_billed_via_pdfs: number;
	advances_paid: number;
	final_paid: number;
	total_paid: number;
	pending_in_request: number;
	net_remaining_after_request: number;
}

export type ApRiskSeverity = 'info' | 'warn' | 'high' | 'block';

export interface ApContextRisk {
	flag: string;
	severity: ApRiskSeverity;
	reason: string;
	overrun_amount: number;
	overrun_percent: number;
}

export interface ApContext {
	vendor_invoice_id: number;
	vendor_name: string;
	procurement_vendor_id: number;
	currency: string;
	amounts: ApContextAmounts;
	counts: { pdf_files: number; advances: number; receipts?: number };
	risk: ApContextRisk;
}

// Used by the approval-status endpoint (accordion in All Invoices tab)
export interface VendorLedgerEntry {
	id: number;
	amount: number;
	paid_on: string;
	payment_mode: string | null;
	reference_number: string | null;
	receipt_file_url: string | null;
	tax_receipt_url: string | null;
	notes: string | null;
	recorded_by: string | null;
	approval_row_id: number | null;
	_source: 'advance' | 'receipt';
}

export interface VendorInvoiceApprovalStatus {
	id: number;
	vendor_po_id?: number | null;
	vendor_name: string;
	invoice_amount: number | null;
	invoice_status: string;
	approval_status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
	payment_status?: 'unpaid' | 'partially_paid' | 'paid';
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
	totalPaid?: number | null;
	balanceDue?: number | null;
	daysSinceSubmitted?: number | null;
	plannedNextStage?: { stage: string; approvers: unknown } | null;
	approvals: VendorInvoiceApproval[];
	ap_context?: ApContext | null;
	reopened?: VendorReopenInfo;
	ledger: VendorLedgerEntry[];
}

// Used by the dashboard endpoint (All Invoices tab — flat list).
// risk_severity / risk_flag are a lightweight summary of the per-row
// ap_context (the full ap_context only ships on /approval-status). Used
// to render the at-a-glance risk dot on the table row without forcing
// every list refresh to compute the full budget context.
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
	risk_severity?: ApRiskSeverity | null;
	risk_flag?: string | null;
	client?: string;
	clientName?: string;
	leadName?: string;
}

// ─── Pending My Approval — grouped by lead ────────────────────────────────────

export interface PendingApprovalTrailEntry extends TrailReopenFields {
	approvalRowId: number;
	approverName: string;
	approverRole: ApproverRole;
	decision: 'pending' | 'approved' | 'rejected';
	decidedAt: string | null;
	rejectionReason: string | null;
	// Advance fields — present when the approval was submitted as an advance request
	isAdvance?: boolean;
	advanceRequested?: number | null;
	advanceApproved?: number | null;
}

// Top-level reopen block on a vendor. If isReopened is true, the vendor is in
// a loop-back state: finance (Stage 2) rejected, a fresh Stage 1 row was created,
// procurement approver is re-deciding. The fields describe the finance rejection
// that triggered the loop-back.
export interface VendorReopenInfo {
	isReopened: boolean;
	reason: string | null;
	rejectedByAdminId: number | null;
	rejectedByName: string | null;
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
	// Present on rejectedVendors entries
	rejectedAt?: string | null;
	rejectionReason?: string | null;
	rejectedBy?: string | null;
	// Present when the invoice looped back from a Stage 2 rejection (see VendorReopenInfo).
	reopened?: VendorReopenInfo;
	// Same shape as ap_context on /approval-status — full payment + budget snapshot.
	ap_context?: ApContext | null;
	// Stage 1 advance fields — advance_requested is set by procurement on submission;
	// advance_approved is what Stage 1 (Shashwat) decides to actually release.
	advance_requested?: number | null;
	advance_approved?: number | null;
}

export interface ClientPo {
	poNumber: string;
	totalAmount: string | null;
	s3Url: string | null;
	originalFilename?: string | null;
}

export interface PendingApprovalLead {
	leadId: number;
	client: string;
	city: string | null;
	clientPos: ClientPo[];
	vendors: PendingApprovalVendor[];
	rejectedVendors: PendingApprovalVendor[];
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
	advance_approved?: number | null;
	approval_row_id?: number | null;
}

export interface ProxyState {
	eligible: boolean;
	active: boolean;
}

export interface AdvanceReceipt {
	id: number;
	amount: number;
	paidOn: string;
	fileUrl: string | null;
	paymentMode?: string | null;
	referenceNumber?: string | null;
	notes?: string | null;
}

// Shared response shape for GET /vendor-invoices/advance-payments and /vendor-invoices/payments-pending
export interface AdvancePaymentItem {
	vendorInvoiceId: number;
	approvalRowId: number;
	leadId: number;
	serialNumber: string | null;
	client: string;
	city: string | null;
	leadStatus: string;
	vendorName: string;
	invoiceNumber: string | null;
	invoiceAmount: number | null;
	approvalStatus: 'draft' | 'pending_approval' | 'approved' | 'rejected';
	paymentStatus: 'unpaid' | 'partially_paid' | 'paid' | null;
	approvalSubmittedAt: string | null;
	approvedAt: string | null;
	rejectedAt: string | null;
	// Amount columns (renamed from advanceRequested/advanceApproved)
	amountRequested: number | null;
	amountApproved: number | null;
	approvalsTotal: number;
	approvalsDone: number;
	totalPaid: number | null;
	daysSinceSubmitted: number | null;
	// Receipt tracking
	receiptUploaded: boolean;
	receipt: AdvanceReceipt | null;
	fullyPaid: boolean;
	totalReceiptsAmount: number | null;
	receiptCount: number | null;
	isAdvance: boolean;
}

export type VendorPaymentType = 'advance' | 'milestone' | 'final' | 'refund';
export type VendorPaymentMode = 'neft' | 'imps' | 'rtgs' | 'upi' | 'cheque' | 'cash' | 'other';

export interface VendorPaymentPayload {
	payment_type: VendorPaymentType;
	amount: number;
	vendor_invoice_id?: number;
	paid_on?: string;
	payment_mode?: VendorPaymentMode;
	reference_number?: string;
	receipt_file_url?: string;
	receipt_screenshot_url?: string;
	notes?: string;
	currency?: string;
}

export interface VendorPaymentResponse {
	id: number;
	vendor_po_id: number;
	vendor_invoice_id: number | null;
	payment_type: VendorPaymentType;
	amount: string;
	paid_on: string;
	payment_mode: string | null;
	reference_number: string | null;
	receipt_file_url: string | null;
	receipt_screenshot_url: string | null;
	currency: string;
	notes: string | null;
	recorded_by: string | null;
	created_at: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

const BASE = '/procurement';

// Normalizes snake_case vendor payloads to the camelCase shape the UI expects
function normalizePendingVendor(v: any): PendingApprovalVendor {
	const reopenRaw = v.reopened ?? v.reopened_block ?? null;
	const reopened: VendorReopenInfo = reopenRaw
		? {
				isReopened: !!(reopenRaw.isReopened ?? reopenRaw.is_reopened),
				reason: reopenRaw.reason ?? null,
				rejectedByAdminId: reopenRaw.rejectedByAdminId ?? reopenRaw.rejected_by_admin_id ?? null,
				rejectedByName: reopenRaw.rejectedByName ?? reopenRaw.rejected_by_name ?? null,
		  }
		: { isReopened: false, reason: null, rejectedByAdminId: null, rejectedByName: null };

	return {
		...v,
		vendorInvoiceId: v.vendorInvoiceId ?? v.id ?? v.vendor_invoice_id,
		vendorName: v.vendorName ?? v.vendor_name ?? '',
		invoiceAmount: v.invoiceAmount ?? v.invoice_amount ?? null,
		invoiceFileUrl: v.invoiceFileUrl ?? v.invoice_file_url ?? null,
		invoiceNumber: v.invoiceNumber ?? v.invoice_number ?? null,
		invoiceDate: v.invoiceDate ?? v.invoice_date ?? null,
		invoiceStatus: v.invoiceStatus ?? v.invoice_status ?? null,
		invoiceRemarks: v.invoiceRemarks ?? v.invoice_remarks ?? null,
		contactPerson: v.contactPerson ?? v.contact_person ?? null,
		contactNumber: v.contactNumber ?? v.contact_number ?? null,
		approvalStatus: v.approvalStatus ?? v.approval_status ?? 'draft',
		approvalSubmittedAt: v.approvalSubmittedAt ?? v.approval_submitted_at ?? null,
		myDecision: v.myDecision ?? v.my_decision ?? null,
		approvalsTotal: v.approvalsTotal ?? v.approvals_total ?? 0,
		approvalsDone: v.approvalsDone ?? v.approvals_done ?? 0,
		approvalTrail: (v.approvalTrail ?? v.approval_trail ?? []).map(normalizeTrailEntry),
		rejectedAt: v.rejectedAt ?? v.rejected_at ?? null,
		rejectionReason: v.rejectionReason ?? v.rejection_reason ?? null,
		rejectedBy: v.rejectedBy ?? v.rejected_by ?? null,
		reopened,
		ap_context: v.ap_context ?? v.apContext ?? null,
		advance_requested: v.advance_requested ?? v.advanceRequested ?? null,
		advance_approved: v.advance_approved ?? v.advanceApproved ?? null,
	};
}

// Normalizes snake_case trail-entry fields (including reopen-loop fields) to camelCase.
function normalizeTrailEntry(e: any): PendingApprovalTrailEntry {
	return {
		...e,
		approverName: e.approverName ?? e.approver_name ?? '',
		approverRole: e.approverRole ?? e.approver_role ?? 'default_approver',
		decision: e.decision ?? 'pending',
		decidedAt: e.decidedAt ?? e.decided_at ?? null,
		rejectionReason: e.rejectionReason ?? e.rejection_reason ?? null,
		reopenedFromStage2: !!(e.reopenedFromStage2 ?? e.reopened_from_stage_2 ?? e.reopened_from_stage2),
		reopenedReason: e.reopenedReason ?? e.reopened_reason ?? null,
		reopenedRejectedByAdminId: e.reopenedRejectedByAdminId ?? e.reopened_rejected_by_admin_id ?? null,
		reopenedRejectedByName: e.reopenedRejectedByName ?? e.reopened_rejected_by_name ?? null,
		approvalStage: e.approvalStage ?? e.approval_stage,
		isAdvance: !!(e.isAdvance ?? e.is_advance),
		advanceRequested: e.advanceRequested ?? e.advance_requested ?? null,
		advanceApproved: e.advanceApproved ?? e.advance_approved ?? null,
	};
}

export class ProcurementApiService {
	/**
	 * GET /procurement/vendor-invoices/payments-pending
	 * Non-advance approved invoices awaiting payment receipt upload.
	 * Same shape as advance-payments.
	 */
	static async getPaymentsPending(params: {
		page?: number;
		perPage?: number;
		approvalStatus?: string;
		search?: string;
	} = {}): Promise<{
		status: boolean;
		data: AdvancePaymentItem[];
		pagination: PaginationMeta;
	}> {
		const q = new URLSearchParams();
		if (params.page) q.append('page', String(params.page));
		if (params.perPage) q.append('perPage', String(params.perPage));
		if (params.approvalStatus) q.append('approvalStatus', params.approvalStatus);
		if (params.search) q.append('search', params.search);
		const qs = q.toString();
		return apiService.get(`${BASE}/vendor-invoices/payments-pending${qs ? `?${qs}` : ''}`) as any;
	}

	/**
	 * GET /procurement/vendor-invoices/advance-payments
	 * Advance-only invoice list — pre-filtered at DB level (is_advance = 1).
	 */
	static async getAdvancePayments(params: {
		page?: number;
		perPage?: number;
		approvalStatus?: string;
		search?: string;
	} = {}): Promise<{
		status: boolean;
		data: AdvancePaymentItem[];
		pagination: PaginationMeta;
	}> {
		const q = new URLSearchParams();
		if (params.page) q.append('page', String(params.page));
		if (params.perPage) q.append('perPage', String(params.perPage));
		if (params.approvalStatus) q.append('approvalStatus', params.approvalStatus);
		if (params.search) q.append('search', params.search);
		const qs = q.toString();
		return apiService.get(`${BASE}/vendor-invoices/advance-payments${qs ? `?${qs}` : ''}`) as any;
	}

	/**
	 * GET /procurement/vendor-invoices/advance-requests
	 * Grouped-by-lead advance requests — same shape as getMyPendingApprovals.
	 */
	static async getAdvanceRequests(params: { page?: number; perPage?: number } = {}): Promise<{
		status: boolean;
		data: PendingApprovalLead[];
		pagination: PaginationMeta;
	}> {
		const q = new URLSearchParams();
		if (params.page) q.append('page', String(params.page));
		if (params.perPage) q.append('perPage', String(params.perPage));
		const qs = q.toString();
		return apiService.get(`${BASE}/vendor-invoices/advance-requests${qs ? `?${qs}` : ''}`) as any;
	}

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
	 * Per-vendor approval details — used in accordion for All Invoices tab.
	 * Backend also returns the lead's client POs at the envelope level (newest first)
	 * so the UI can render a "View PO" link alongside each vendor's "View Invoice".
	 */
	static async getVendorInvoiceApprovalStatus(leadId: number): Promise<{
		status: boolean;
		data: VendorInvoiceApprovalStatus[];
		clientPos?: ClientPo[];
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
		proxy?: ProxyState;
	}> {
		const res: any = await apiService.get(`${BASE}/vendor-invoices/pending-my-approval?page=${page}&perPage=${perPage}`);
		if (res?.data && Array.isArray(res.data)) {
			res.data = res.data.map((lead: any) => ({
				...lead,
				vendors: (lead.vendors ?? []).map(normalizePendingVendor),
				rejectedVendors: (lead.rejectedVendors ?? lead.rejected_vendors ?? []).map(normalizePendingVendor),
			}));
		}
		return res;
	}

	/**
	 * POST /procurement/approval/proxy-mode
	 * Toggle proxy mode for eligible users. Persists server-side.
	 */
	static async setProxyMode(enabled: boolean): Promise<{
		status: boolean;
		data: { enabled: boolean };
	}> {
		return apiService.post(`${BASE}/approval/proxy-mode`, { enabled }) as any;
	}

	/**
	 * POST /procurement/vendor-invoices/:id/receipt
	 * Upload payment receipt — multipart/form-data.
	 * amount + paid_on are required; receipt_file, payment_mode, reference_number, notes optional.
	 */
	static async uploadAdvanceReceipt(
		vendorInvoiceId: number,
		formData: FormData
	): Promise<{ status: boolean; data: AdvanceReceipt }> {
		return apiService.postFormData(`${BASE}/vendor-invoices/${vendorInvoiceId}/receipt`, formData) as any;
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
