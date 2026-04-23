/**
 * Vendor Invoice Approvals — Approvals > Vendor Invoice Approvals
 *
 * Two tabs:
 *   - All Invoices: flat dashboard view, accordion lazy-fetches approval details
 *   - Pending My Approval: grouped by lead, data already in response (no lazy fetch)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { PageHeader, FloatingDropdown, Button, Pagination } from '../../components/ui';
import { FloatingInput } from '../../components/ui';
import { Switch } from '../../components/ui/Form';
import {
	ProcurementApiService,
	VendorInvoiceDashboardItem,
	VendorInvoiceApprovalStatus,
	VendorInvoiceApproval,
	PendingApprovalLead,
	PendingApprovalVendor,
	PendingApprovalTrailEntry,
} from '../../services/procurementApi';
import type { RootState } from '../../store';
import {
	ChevronDown,
	ChevronRight,
	Loader2,
	CheckCircle2,
	XCircle,
	Clock,
	Search,
	AlertCircle,
	FileText,
	ExternalLink,
	Download,
} from 'lucide-react';
import { cn } from '../../utils/cn';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(value: string | null | undefined): string {
	if (!value) return '—';
	try {
		const d = new Date(value);
		if (Number.isNaN(d.getTime())) return value;
		return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
	} catch {
		return value;
	}
}

function formatShortDate(value: string | null | undefined): string {
	if (!value) return '';
	try {
		const d = new Date(value);
		if (Number.isNaN(d.getTime())) return value;
		return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
	} catch {
		return value;
	}
}

function formatAmount(value: number | string | null | undefined): string {
	if (value == null || value === '') return '—';
	return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
	draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600' },
	pending_approval: { label: 'Pending Approval', className: 'bg-amber-100 text-amber-700' },
	approved: { label: 'Approved', className: 'bg-green-100 text-green-700' },
	rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
} as const;

function ApprovalStatusBadge({ status }: { status: string }) {
	const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? {
		label: status,
		className: 'bg-gray-100 text-gray-600',
	};
	return (
		<span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', cfg.className)}>
			{cfg.label}
		</span>
	);
}

// ─── Approval Trail (shared) ───────────────────────────────────────────────────

function ApprovalDecisionIcon({ decision }: { decision: string }) {
	if (decision === 'approved') return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />;
	if (decision === 'rejected') return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
	return <Clock className="h-4 w-4 text-amber-400 shrink-0" />;
}

function ApprovalTrailPanel({
	approvals,
	submittedAt,
	inProxyMode = false,
}: {
	approvals: (VendorInvoiceApproval | PendingApprovalTrailEntry)[];
	submittedAt: string | null;
	inProxyMode?: boolean;
}) {
	return (
		<div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
			<div className="flex items-center justify-between mb-3">
				<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Approval Trail</p>
				{submittedAt && (
					<p className="text-xs text-gray-400">Submitted: {formatDate(submittedAt)}</p>
				)}
			</div>
			{approvals.length === 0 ? (
				<p className="text-xs text-gray-400">No approvals submitted yet.</p>
			) : (
				<div className="space-y-2">
					{approvals.map((a, i) => {
						const isProxyTarget = inProxyMode && a.decision === 'pending';
						return (
							<div
								key={i}
								className={cn(
									'flex items-start gap-3 rounded-md px-3 py-2',
									isProxyTarget
										? 'bg-amber-50 border border-amber-200'
										: 'bg-white border border-gray-100',
								)}
							>
								<ApprovalDecisionIcon decision={a.decision} />
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 flex-wrap">
										<p className="text-sm font-medium text-gray-800">{a.approverName}</p>
										<span className="text-xs text-gray-400 capitalize">{a.approverRole.replace('_', ' ')}</span>
										{isProxyTarget && (
											<span className="text-[10px] font-semibold uppercase tracking-wide bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
												for {a.approverName}
											</span>
										)}
									</div>
									<div className="flex items-center gap-2 mt-0.5">
										<span className={cn(
											'text-xs font-medium capitalize',
											a.decision === 'approved' && 'text-green-600',
											a.decision === 'rejected' && 'text-red-600',
											a.decision === 'pending' && 'text-amber-600',
										)}>
											{a.decision}
										</span>
										{'decidedAt' in a && a.decidedAt && (
											<span className="text-xs text-gray-400">{formatDate(a.decidedAt)}</span>
										)}
									</div>
									{'rejectionReason' in a && a.rejectionReason && (
										<p className="text-xs text-red-500 mt-1 italic">"{a.rejectionReason}"</p>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────

function RejectModal({
	vendorName,
	amount,
	onConfirm,
	onCancel,
	loading,
}: {
	vendorName: string;
	amount: number | null;
	onConfirm: (reason: string) => void;
	onCancel: () => void;
	loading: boolean;
}) {
	const [reason, setReason] = useState('');
	const [error, setError] = useState('');

	const handleSubmit = () => {
		if (!reason.trim()) { setError('Rejection reason is required'); return; }
		onConfirm(reason.trim());
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
			<div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
				<h3 className="text-base font-semibold text-gray-900">Reject Invoice</h3>
				<p className="text-sm text-gray-600">
					<span className="font-medium">{vendorName}</span>
					{amount != null && <span> — {formatAmount(amount)}</span>}
				</p>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Reason for rejection <span className="text-red-500">*</span>
					</label>
					<textarea
						className={cn(
							'w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400',
							error ? 'border-red-400' : 'border-gray-300'
						)}
						rows={3}
						placeholder="e.g. Amount does not match PO value"
						value={reason}
						onChange={e => { setReason(e.target.value); setError(''); }}
					/>
					{error && <p className="text-xs text-red-500 mt-1">{error}</p>}
				</div>
				<div className="flex justify-end gap-3 pt-1">
					<Button variant="outline" size="md" onClick={onCancel} disabled={loading}>Cancel</Button>
					<Button
						variant="primary" size="md" onClick={handleSubmit} disabled={loading}
						className="bg-red-600 hover:bg-red-700 border-red-600"
					>
						{loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
						Confirm Rejection
					</Button>
				</div>
			</div>
		</div>
	);
}

// ─── Invoice Details Grid (shared) ────────────────────────────────────────────

function InvoiceDetailsGrid({
	invoiceNumber,
	invoiceDate,
	invoiceStatus,
	contactPerson,
	contactNumber,
	invoiceFileUrl,
	invoiceRemarks,
	notes,
}: {
	invoiceNumber?: string | null;
	invoiceDate?: string | null;
	invoiceStatus?: string | null;
	contactPerson?: string | null;
	contactNumber?: string | null;
	invoiceFileUrl?: string | null;
	invoiceRemarks?: string | null;
	notes?: string | null;
}) {
	const hasAny = invoiceNumber || invoiceDate || invoiceStatus || contactPerson || invoiceFileUrl || invoiceRemarks || notes;
	if (!hasAny) return null;
	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 bg-gray-50 rounded-lg border border-gray-100 px-4 py-3 text-xs">
			{invoiceNumber && (
				<div>
					<p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Invoice #</p>
					<p className="text-gray-800 font-semibold">{invoiceNumber}</p>
				</div>
			)}
			{invoiceDate && (
				<div>
					<p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Invoice Date</p>
					<p className="text-gray-800">{formatDate(invoiceDate)}</p>
				</div>
			)}
			{invoiceStatus && (
				<div>
					<p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Payment Status</p>
					<p className="text-gray-800 capitalize">{invoiceStatus.replace(/_/g, ' ')}</p>
				</div>
			)}
			{contactPerson && (
				<div>
					<p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Contact</p>
					<p className="text-gray-800">
						{contactPerson}
						{contactNumber && <span className="text-gray-500"> · {contactNumber}</span>}
					</p>
				</div>
			)}
			{invoiceFileUrl && (
				<div>
					<p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Invoice File</p>
					<a
						href={invoiceFileUrl}
						target="_blank"
						rel="noreferrer"
						onClick={e => e.stopPropagation()}
						className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
					>
						<FileText className="h-3.5 w-3.5" /> View Invoice <ExternalLink className="h-3 w-3" />
					</a>
				</div>
			)}
			{(invoiceRemarks || notes) && (
				<div className="col-span-2 sm:col-span-3">
					<p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Remarks</p>
					<p className="text-gray-700 italic">{invoiceRemarks || notes}</p>
				</div>
			)}
		</div>
	);
}

// ─── Approve / Reject Buttons ─────────────────────────────────────────────────

function ApproveRejectButtons({
	onApprove,
	onReject,
	loading,
}: {
	onApprove: () => void;
	onReject: () => void;
	loading: boolean;
}) {
	return (
		<div className="flex items-center gap-2 shrink-0">
			<button
				onClick={e => { e.stopPropagation(); onReject(); }}
				disabled={loading}
				className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
			>
				<XCircle className="h-3.5 w-3.5" /> Reject
			</button>
			<button
				onClick={e => { e.stopPropagation(); onApprove(); }}
				disabled={loading}
				className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
			>
				{loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
				Approve
			</button>
		</div>
	);
}

// ─── ALL INVOICES TAB — flat table with lazy-fetch accordion ─────────────────

function AllInvoicesRow({
	row,
	currentAdminId,
	serialNo,
	onActionDone,
}: {
	row: VendorInvoiceDashboardItem;
	currentAdminId: number | null;
	serialNo: number;
	onActionDone: () => void;
}) {
	const [open, setOpen] = useState(false);
	const [approvalData, setApprovalData] = useState<VendorInvoiceApprovalStatus[] | null>(null);
	const [loadingDetail, setLoadingDetail] = useState(false);
	const [detailError, setDetailError] = useState<string | null>(null);
	const [actionLoading, setActionLoading] = useState(false);
	const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
	const [rejectModal, setRejectModal] = useState<{ vendorId: number; vendorName: string; amount: number | null } | null>(null);
	const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const showToast = (type: 'success' | 'error', msg: string) => {
		setToast({ type, msg });
		if (toastRef.current) clearTimeout(toastRef.current);
		toastRef.current = setTimeout(() => setToast(null), 4000);
	};

	useEffect(() => {
		if (!open || approvalData !== null) return;
		let cancelled = false;
		setLoadingDetail(true);
		setDetailError(null);
		ProcurementApiService.getVendorInvoiceApprovalStatus(row.leadId)
			.then(res => { if (!cancelled) setApprovalData(res?.data ?? []); })
			.catch(() => { if (!cancelled) setDetailError('Failed to load approval details.'); })
			.finally(() => { if (!cancelled) setLoadingDetail(false); });
		return () => { cancelled = true; };
	}, [open, row.leadId, approvalData]);

	const handleApprove = async (vendorId: number) => {
		setActionLoading(true);
		try {
			await ProcurementApiService.submitApprovalDecision(row.leadId, vendorId, { decision: 'approved' });
			showToast('success', 'Invoice approved successfully');
			setApprovalData(null);
			onActionDone();
		} catch (e: any) {
			showToast('error', e?.message || 'Failed to approve invoice.');
		} finally { setActionLoading(false); }
	};

	const handleReject = async (vendorId: number, reason: string) => {
		setActionLoading(true);
		try {
			await ProcurementApiService.submitApprovalDecision(row.leadId, vendorId, { decision: 'rejected', rejectionReason: reason });
			showToast('success', 'Invoice rejected. The team has been notified.');
			setRejectModal(null);
			setApprovalData(null);
			onActionDone();
		} catch (e: any) {
			showToast('error', e?.message || 'Failed to reject invoice.');
		} finally { setActionLoading(false); }
	};

	return (
		<>
			{rejectModal && (
				<RejectModal
					vendorName={rejectModal.vendorName}
					amount={rejectModal.amount}
					loading={actionLoading}
					onCancel={() => setRejectModal(null)}
					onConfirm={reason => handleReject(rejectModal.vendorId, reason)}
				/>
			)}

			<tr
				className={cn(
					'border-b border-gray-200 transition-colors cursor-pointer',
					open ? 'border-l-4 border-l-blue-500 bg-blue-50/20' : 'hover:bg-gray-50'
				)}
				onClick={() => setOpen(v => !v)}
			>
				<td className="px-3 py-2.5 text-sm text-gray-500 w-10">{serialNo}</td>
				<td className="px-3 py-2.5 w-8">
					<ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', open && 'rotate-180')} />
				</td>
				<td className="px-3 py-2.5 text-sm text-gray-700">{row.leadId}</td>
				<td className="px-3 py-2.5 text-sm text-gray-900 font-medium">{row.client || row.clientName || row.leadName || '—'}</td>
				<td className="px-3 py-2.5 text-sm text-gray-800">{row.vendor_name}</td>
				<td className="px-3 py-2.5 text-center">
					{row.approvals_total > 0 ? (
						<span className={cn(
							'inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full',
							row.approvals_done === row.approvals_total ? 'bg-green-100 text-green-700'
								: row.approvals_done > 0 ? 'bg-amber-100 text-amber-700'
								: 'bg-gray-100 text-gray-600'
						)}>
							{row.approvals_done}/{row.approvals_total}
						</span>
					) : (
						<span className="text-xs text-gray-400">—</span>
					)}
				</td>
				<td className="px-3 py-2.5 text-sm text-gray-900 text-right">{formatAmount(row.invoice_amount)}</td>
				<td className="px-3 py-2.5"><ApprovalStatusBadge status={row.approval_status} /></td>
				<td className="px-3 py-2.5 text-sm text-gray-500">{formatDate(row.approval_submitted_at)}</td>
				<td className="px-3 py-2.5 text-sm text-gray-500">
					{row.approval_status === 'approved' ? formatDate(row.approved_at)
						: row.approval_status === 'rejected' ? formatDate(row.rejected_at)
						: '—'}
				</td>
				<td className="px-3 py-2.5 text-sm text-gray-900 text-right">{row.totalPaid != null ? formatAmount(row.totalPaid) : '—'}</td>
			</tr>

			{open && (
				<tr className="bg-gray-50/40">
					<td colSpan={11} className="px-6 py-4">
						{toast && (
							<div className={cn(
								'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm mb-3',
								toast.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
							)}>
								{toast.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
								{toast.msg}
							</div>
						)}
						{loadingDetail ? (
							<div className="flex items-center gap-2 py-4 text-gray-500 text-sm">
								<Loader2 className="h-5 w-5 animate-spin" /> Loading approval details…
							</div>
						) : detailError ? (
							<p className="text-sm text-red-500 py-2">{detailError}</p>
						) : approvalData ? (() => {
							const activeVendors = approvalData.filter(v => v.id === row.vendorInvoiceId && v.approval_status !== 'draft');
							if (activeVendors.length === 0) {
								return <p className="text-sm text-gray-400 py-2">No vendor invoices submitted for approval on this lead.</p>;
							}
							return (
								<div className="space-y-4">
									{activeVendors.map(vendor => {
										const myPending = currentAdminId != null
											? vendor.approvals.find(a =>
												a.decision === 'pending' &&
												(a.approverId === currentAdminId || a.approverLoginIds?.includes(currentAdminId))
											)
											: null;
										return (
											<div key={vendor.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
												<div className="flex items-start justify-between gap-4">
													<div>
														<p className="text-sm font-semibold text-gray-900">{vendor.vendor_name}</p>
														<div className="flex items-center gap-3 mt-1">
															<span className="text-sm text-gray-600">{formatAmount(vendor.invoice_amount)}</span>
															<ApprovalStatusBadge status={vendor.approval_status} />
														</div>
													</div>
													{myPending && (
														<ApproveRejectButtons
															loading={actionLoading}
															onApprove={() => handleApprove(vendor.id)}
															onReject={() => setRejectModal({ vendorId: vendor.id, vendorName: vendor.vendor_name, amount: vendor.invoice_amount })}
														/>
													)}
												</div>
												<InvoiceDetailsGrid
													invoiceNumber={vendor.invoice_number}
													invoiceDate={vendor.invoice_date}
													invoiceStatus={vendor.invoice_status}
													contactPerson={vendor.contact_person}
													contactNumber={vendor.contact_number}
													invoiceFileUrl={vendor.invoice_file_url}
													invoiceRemarks={vendor.invoice_remarks}
													notes={vendor.notes}
												/>
												<ApprovalTrailPanel approvals={vendor.approvals} submittedAt={vendor.approval_submitted_at} />
											</div>
										);
									})}
								</div>
							);
						})() : (
							<p className="text-sm text-gray-400 py-2">No vendor invoice data for this lead.</p>
						)}
					</td>
				</tr>
			)}
		</>
	);
}

const APPROVAL_STATUS_OPTIONS = [
	{ label: 'All Statuses', value: '' },
	{ label: 'Draft', value: 'draft' },
	{ label: 'Pending Approval', value: 'pending_approval' },
	{ label: 'Approved', value: 'approved' },
	{ label: 'Rejected', value: 'rejected' },
];

function AllInvoicesTable({
	rows, loading, currentAdminId, serialOffset, onActionDone,
}: {
	rows: VendorInvoiceDashboardItem[];
	loading: boolean;
	currentAdminId: number | null;
	serialOffset: number;
	onActionDone: () => void;
}) {
	if (loading) return <div className="flex items-center justify-center py-16 text-gray-500 gap-2"><Loader2 className="h-6 w-6 animate-spin" /> Loading…</div>;
	if (rows.length === 0) return <div className="py-16 text-center text-gray-400 text-sm">No invoices found.</div>;
	return (
		<div className="overflow-x-auto">
			<table className="w-full border-collapse text-sm">
				<thead>
					<tr className="bg-gray-50 border-b border-gray-200">
						<th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 w-10">#</th>
						<th className="px-3 py-2.5 w-8" />
						<th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Lead ID</th>
						<th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Client</th>
						<th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Vendor</th>
						<th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500">Approvals</th>
						<th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500">Amount</th>
						<th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Status</th>
						<th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Submitted</th>
						<th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Decided</th>
						<th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500">Total Paid</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row, idx) => (
						<AllInvoicesRow
							key={row.vendorInvoiceId}
							row={row}
							currentAdminId={currentAdminId}
							serialNo={serialOffset + idx + 1}
							onActionDone={onActionDone}
						/>
					))}
				</tbody>
			</table>
		</div>
	);
}

// ─── PENDING MY APPROVAL TAB — grouped by lead ───────────────────────────────

function PendingVendorCard({
	vendor,
	leadId,
	onActionDone,
	inProxyMode = false,
}: {
	vendor: PendingApprovalVendor;
	leadId: number;
	onActionDone: () => void;
	inProxyMode?: boolean;
}) {
	const [open, setOpen] = useState(false);
	const [actionLoading, setActionLoading] = useState(false);
	const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
	const [rejectModal, setRejectModal] = useState(false);
	const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const showToast = (type: 'success' | 'error', msg: string) => {
		setToast({ type, msg });
		if (toastRef.current) clearTimeout(toastRef.current);
		toastRef.current = setTimeout(() => setToast(null), 4000);
	};

	const handleApprove = async () => {
		setActionLoading(true);
		try {
			await ProcurementApiService.submitApprovalDecision(leadId, vendor.vendorInvoiceId, { decision: 'approved' });
			showToast('success', 'Invoice approved successfully');
			onActionDone();
		} catch (e: any) {
			showToast('error', e?.message || 'Failed to approve invoice.');
		} finally { setActionLoading(false); }
	};

	const handleReject = async (reason: string) => {
		setActionLoading(true);
		try {
			await ProcurementApiService.submitApprovalDecision(leadId, vendor.vendorInvoiceId, { decision: 'rejected', rejectionReason: reason });
			showToast('success', 'Invoice rejected. The team has been notified.');
			setRejectModal(false);
			onActionDone();
		} catch (e: any) {
			showToast('error', e?.message || 'Failed to reject invoice.');
		} finally { setActionLoading(false); }
	};

	const isActionable = vendor.myDecision === 'pending';

	return (
		<>
			{rejectModal && (
				<RejectModal
					vendorName={vendor.vendorName}
					amount={vendor.invoiceAmount}
					loading={actionLoading}
					onCancel={() => setRejectModal(false)}
					onConfirm={handleReject}
				/>
			)}
			<div className={cn(
				'border rounded-xl overflow-hidden',
				isActionable ? 'border-amber-200' : 'border-gray-200'
			)}>
				{/* Vendor header row */}
				<div
					className={cn(
						'flex items-center justify-between gap-4 px-4 py-3 cursor-pointer',
						isActionable ? 'bg-amber-50/50' : 'bg-white',
					)}
					onClick={() => setOpen(v => !v)}
				>
					<div className="flex items-center gap-3 min-w-0">
						<ChevronRight className={cn('h-4 w-4 text-gray-400 shrink-0 transition-transform', open && 'rotate-90')} />
						<div className="min-w-0">
							<p className="text-sm font-semibold text-gray-900 truncate">{vendor.vendorName}</p>
							<div className="flex items-center gap-2 mt-0.5 flex-wrap">
								<span className="text-sm text-gray-600">{formatAmount(vendor.invoiceAmount)}</span>
								<ApprovalStatusBadge status={vendor.approvalStatus} />
								{vendor.approvalsTotal > 0 && (
									<span className={cn(
										'text-xs font-semibold px-2 py-0.5 rounded-full',
										vendor.approvalsDone === vendor.approvalsTotal ? 'bg-green-100 text-green-700'
											: vendor.approvalsDone > 0 ? 'bg-amber-100 text-amber-700'
											: 'bg-gray-100 text-gray-600'
									)}>
										{vendor.approvalsDone}/{vendor.approvalsTotal} approved
									</span>
								)}
							</div>
						</div>
					</div>
					<div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
						{vendor.invoiceFileUrl && (
							<a
								href={vendor.invoiceFileUrl}
								target="_blank"
								rel="noreferrer"
								className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
							>
								<FileText className="h-3.5 w-3.5" /> Invoice
							</a>
						)}
						{isActionable && (
							<ApproveRejectButtons
								loading={actionLoading}
								onApprove={handleApprove}
								onReject={() => setRejectModal(true)}
							/>
						)}
					</div>
				</div>

				{/* Toast */}
				{toast && (
					<div className={cn(
						'flex items-center gap-2 px-4 py-2 text-sm',
						toast.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
					)}>
						{toast.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
						{toast.msg}
					</div>
				)}

				{/* Expanded details */}
				{open && (
					<div className="border-t border-gray-100 px-4 py-4 space-y-3 bg-white">
						<InvoiceDetailsGrid
							invoiceNumber={vendor.invoiceNumber}
							invoiceDate={vendor.invoiceDate}
							invoiceStatus={vendor.invoiceStatus}
							contactPerson={vendor.contactPerson}
							contactNumber={vendor.contactNumber}
							invoiceFileUrl={vendor.invoiceFileUrl}
							invoiceRemarks={vendor.invoiceRemarks}
						/>
						<ApprovalTrailPanel
							approvals={vendor.approvalTrail}
							submittedAt={vendor.approvalSubmittedAt}
							inProxyMode={inProxyMode}
						/>
					</div>
				)}
			</div>
		</>
	);
}

function RejectedVendorRow({ vendor }: { vendor: PendingApprovalVendor }) {
	const [open, setOpen] = useState(false);
	const shortDate = formatShortDate(vendor.rejectedAt);
	return (
		<div className="border border-red-100 rounded-lg overflow-hidden bg-red-50/30">
			<div
				className="flex items-center justify-between gap-3 px-3 py-2 cursor-pointer hover:bg-red-50/60"
				onClick={() => setOpen(v => !v)}
			>
				<div className="flex items-center gap-2 min-w-0 flex-1">
					<ChevronRight className={cn('h-3.5 w-3.5 text-gray-400 shrink-0 transition-transform', open && 'rotate-90')} />
					<p className="text-sm font-medium text-gray-800 truncate">{vendor.vendorName}</p>
					<span className="text-sm text-gray-600 shrink-0">{formatAmount(vendor.invoiceAmount)}</span>
					<ApprovalStatusBadge status="rejected" />
					<p className="text-xs text-gray-600 truncate min-w-0">
						{vendor.rejectionReason && <span className="italic">"{vendor.rejectionReason}"</span>}
						{(shortDate || vendor.rejectedBy) && (
							<span className="text-gray-400 ml-1">
								— {shortDate}{vendor.rejectedBy ? ` by ${vendor.rejectedBy}` : ''}
							</span>
						)}
					</p>
				</div>
				{vendor.invoiceFileUrl && (
					<a
						href={vendor.invoiceFileUrl}
						target="_blank"
						rel="noreferrer"
						onClick={e => e.stopPropagation()}
						className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 shrink-0"
					>
						<FileText className="h-3 w-3" /> Invoice
					</a>
				)}
			</div>
			{open && (
				<div className="border-t border-red-100 px-4 py-3 space-y-3 bg-white">
					<InvoiceDetailsGrid
						invoiceNumber={vendor.invoiceNumber}
						invoiceDate={vendor.invoiceDate}
						invoiceStatus={vendor.invoiceStatus}
						contactPerson={vendor.contactPerson}
						contactNumber={vendor.contactNumber}
						invoiceFileUrl={vendor.invoiceFileUrl}
						invoiceRemarks={vendor.invoiceRemarks}
					/>
					<ApprovalTrailPanel approvals={vendor.approvalTrail} submittedAt={vendor.approvalSubmittedAt} />
				</div>
			)}
		</div>
	);
}

function PendingLeadCard({
	lead,
	serialNo,
	onActionDone,
	inProxyMode = false,
}: {
	lead: PendingApprovalLead;
	serialNo: number;
	onActionDone: () => void;
	inProxyMode?: boolean;
}) {
	const actionableCount = lead.vendors.filter(v => v.myDecision === 'pending').length;
	const [open, setOpen] = useState(false);

	return (
		<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
			{/* Lead header — clickable accordion toggle */}
			<div
				className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-100 bg-gray-50/60 cursor-pointer select-none"
				onClick={() => setOpen(v => !v)}
			>
				<div className="flex items-start gap-3 min-w-0">
					<ChevronDown className={cn('h-4 w-4 text-gray-400 shrink-0 mt-1 transition-transform', !open && '-rotate-90')} />
					<div className="min-w-0">
						<div className="flex items-center gap-2">
							<span className="text-xs text-gray-400 font-medium">#{serialNo}</span>
							<span className="text-xs text-gray-400">Lead {lead.leadId}</span>
						</div>
						<p className="text-base font-semibold text-gray-900 mt-0.5">{lead.client}</p>
						{lead.city && <p className="text-xs text-gray-500 mt-0.5">{lead.city}</p>}
					</div>
				</div>
				<div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
					{actionableCount > 0 && (
						<span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
							{actionableCount} pending your action
						</span>
					)}
					{lead.clientPos?.some(po => po.s3Url) && (
						<div className="flex items-center gap-1.5">
							{lead.clientPos.filter(po => po.s3Url).map((po, i) => (
								<a
									key={i}
									href={po.s3Url!}
									target="_blank"
									rel="noreferrer"
									className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
								>
									<Download className="h-3 w-3" /> PO {po.poNumber}
								</a>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Vendors — collapsed when lead header is clicked */}
			{open && (
				<div className="p-4 space-y-3">
					{lead.vendors.map(vendor => (
						<PendingVendorCard
							key={vendor.vendorInvoiceId}
							vendor={vendor}
							leadId={lead.leadId}
							onActionDone={onActionDone}
							inProxyMode={inProxyMode}
						/>
					))}

					{lead.rejectedVendors?.length > 0 && (
						<div className="pt-3 mt-1 border-t border-dashed border-gray-200">
							<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
								Rejected ({lead.rejectedVendors.length})
							</p>
							<div className="space-y-2">
								{lead.rejectedVendors.map(vendor => (
									<RejectedVendorRow key={vendor.vendorInvoiceId} vendor={vendor} />
								))}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

function PendingApprovalList({
	leads,
	loading,
	serialOffset,
	onActionDone,
	inProxyMode = false,
}: {
	leads: PendingApprovalLead[];
	loading: boolean;
	serialOffset: number;
	onActionDone: () => void;
	inProxyMode?: boolean;
}) {
	if (loading) return <div className="flex items-center justify-center py-16 text-gray-500 gap-2"><Loader2 className="h-6 w-6 animate-spin" /> Loading…</div>;
	if (leads.length === 0) return <div className="py-16 text-center text-gray-400 text-sm">No pending approvals.</div>;
	return (
		<div className="space-y-4">
			{leads.map((lead, idx) => (
				<PendingLeadCard
					key={lead.leadId}
					lead={lead}
					serialNo={serialOffset + idx + 1}
					onActionDone={onActionDone}
					inProxyMode={inProxyMode}
				/>
			))}
		</div>
	);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'all' | 'pending';

const VendorInvoiceApprovals: React.FC = () => {
	const user = useSelector((s: RootState) => s.auth.user);
	const currentAdminId = user?.id ? Number(user.id) : null;

	const [activeTab, setActiveTab] = useState<Tab>('pending');

	// All Invoices tab
	const [allRows, setAllRows] = useState<VendorInvoiceDashboardItem[]>([]);
	const [allLoading, setAllLoading] = useState(false);
	const [allPage, setAllPage] = useState(1);
	const [allPerPage] = useState(20);
	const [allTotal, setAllTotal] = useState(0);
	const [allTotalPages, setAllTotalPages] = useState(1);
	const [search, setSearch] = useState('');
	const [approvalStatusFilter, setApprovalStatusFilter] = useState('');

	// Pending My Approval tab
	const [pendingLeads, setPendingLeads] = useState<PendingApprovalLead[]>([]);
	const [pendingLoading, setPendingLoading] = useState(false);
	const [pendingPage, setPendingPage] = useState(1);
	const [pendingPerPage] = useState(20);
	const [pendingTotal, setPendingTotal] = useState(0);
	const [pendingTotalPages, setPendingTotalPages] = useState(1);

	// Proxy Mode — visible only to proxy-eligible users (Swati, Priyanka, …)
	const [proxyActive, setProxyActive] = useState(false);
	const [proxyFlipping, setProxyFlipping] = useState(false);

	const fetchAll = useCallback(async (page: number) => {
		setAllLoading(true);
		try {
			const res = await ProcurementApiService.getVendorInvoiceDashboard({
				page, perPage: allPerPage,
				approvalStatus: approvalStatusFilter || undefined,
				search: search || undefined,
				leadStatus: 'won',
			});
			setAllRows(res?.data ?? []);
			if (res?.pagination) { setAllTotal(res.pagination.total); setAllTotalPages(res.pagination.pages); }
		} catch { setAllRows([]); } finally { setAllLoading(false); }
	}, [allPerPage, approvalStatusFilter, search]);

	const fetchPending = useCallback(async (page: number) => {
		setPendingLoading(true);
		try {
			const res = await ProcurementApiService.getMyPendingApprovals(page, pendingPerPage);
			setPendingLeads(res?.data ?? []);
			if (res?.pagination) { setPendingTotal(res.pagination.total); setPendingTotalPages(res.pagination.pages); }
			if (res?.proxy) setProxyActive(!!res.proxy.active);
		} catch { setPendingLeads([]); } finally { setPendingLoading(false); }
	}, [pendingPerPage]);

	const handleProxyToggle = useCallback(async (next: boolean) => {
		setProxyFlipping(true);
		try {
			const res = await ProcurementApiService.setProxyMode(next);
			const applied = res?.data?.enabled ?? next;
			setProxyActive(applied);
			// Refetch so the list expands/contracts to match the new mode.
			setPendingPage(1);
			await fetchPending(1);
		} catch {
			// Leave toggle in its previous state on failure.
		} finally {
			setProxyFlipping(false);
		}
	}, [fetchPending]);

	useEffect(() => { fetchAll(allPage); }, [fetchAll, allPage]);
	useEffect(() => { fetchPending(pendingPage); }, [fetchPending, pendingPage]);

	// Count total actionable vendors across all leads for the badge
	const pendingActionCount = pendingLeads.reduce(
		(sum, lead) => sum + lead.vendors.filter(v => v.myDecision === 'pending').length, 0
	);

	return (
		<div className="space-y-5">
			<div className="flex items-start justify-between gap-4 flex-wrap">
				<div className="flex-1 min-w-0">
					<PageHeader
						title="Vendor Invoice Approvals"
						locationName="Approvals"
						totalItems={activeTab === 'all' ? allTotal : pendingTotal}
						itemType={activeTab === 'all' ? 'invoices' : 'leads'}
					/>
					{proxyActive && (
						<p className="mt-1 text-xs text-amber-700 font-medium">
							Viewing all pending approvals (proxy mode)
						</p>
					)}
				</div>
				{user?.proxyEligible && (
					<div className="flex items-center gap-2 shrink-0 pt-1">
						<Switch
							size="sm"
							label="Proxy Mode"
							checked={proxyActive}
							disabled={proxyFlipping}
							onChange={e => handleProxyToggle(e.target.checked)}
						/>
						{proxyFlipping && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
					</div>
				)}
			</div>

			{/* Tabs */}
			<div className="flex gap-1 border-b border-gray-200">
				{([
					{ key: 'all', label: 'All Invoices' },
					{ key: 'pending', label: 'Pending My Approval', count: pendingActionCount },
				] as { key: Tab; label: string; count?: number }[]).map(tab => (
					<button
						key={tab.key}
						onClick={() => setActiveTab(tab.key)}
						className={cn(
							'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
							activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
						)}
					>
						{tab.label}
						{tab.count != null && tab.count > 0 && (
							<span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 font-semibold">
								{tab.count}
							</span>
						)}
					</button>
				))}
			</div>

			{/* All Invoices Tab */}
			{activeTab === 'all' && (
				<>
					<div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
						<div className="flex flex-wrap gap-3 items-end">
							<FloatingInput label="Search client" value={search} onChange={setSearch} className="w-52" />
							<FloatingDropdown
								label="Approval Status"
								options={APPROVAL_STATUS_OPTIONS}
								value={approvalStatusFilter}
								onChange={setApprovalStatusFilter}
								className="w-48"
							/>
							<Button variant="primary" size="md" onClick={() => { setAllPage(1); fetchAll(1); }} disabled={allLoading}>
								{allLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
								<span className="ml-2">Search</span>
							</Button>
						</div>
					</div>
					<div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
						<AllInvoicesTable
							rows={allRows}
							loading={allLoading}
							currentAdminId={currentAdminId}
							serialOffset={(allPage - 1) * allPerPage}
							onActionDone={() => fetchAll(allPage)}
						/>
					</div>
					{allTotalPages > 1 && (
						<Pagination
							currentPage={allPage} totalPages={allTotalPages}
							totalItems={allTotal} itemsPerPage={allPerPage}
							onPageChange={setAllPage} onItemsPerPageChange={() => {}}
						/>
					)}
				</>
			)}

			{/* Pending My Approval Tab */}
			{activeTab === 'pending' && (
				<>
					<PendingApprovalList
						leads={pendingLeads}
						loading={pendingLoading}
						serialOffset={(pendingPage - 1) * pendingPerPage}
						onActionDone={() => fetchPending(pendingPage)}
						inProxyMode={proxyActive}
					/>
					{pendingTotalPages > 1 && (
						<Pagination
							currentPage={pendingPage} totalPages={pendingTotalPages}
							totalItems={pendingTotal} itemsPerPage={pendingPerPage}
							onPageChange={setPendingPage} onItemsPerPageChange={() => {}}
						/>
					)}
				</>
			)}
		</div>
	);
};

export default VendorInvoiceApprovals;
