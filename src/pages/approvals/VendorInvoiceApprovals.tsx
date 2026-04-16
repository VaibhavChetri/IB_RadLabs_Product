/**
 * Vendor Invoice Approvals — Approvals > Vendor Invoice Approvals
 *
 * Two tabs:
 *   - All Invoices: full dashboard view (read-only overview)
 *   - Pending My Approval: invoices where logged-in admin has a pending decision
 *
 * Accordion on each row → fetches per-vendor approval details (approvals[])
 * Approve / Reject buttons shown only when current admin has decision = 'pending'
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { PageHeader, FloatingDropdown, Button, Pagination } from '../../components/ui';
import { FloatingInput } from '../../components/ui';
import {
	ProcurementApiService,
	VendorInvoiceDashboardItem,
	VendorInvoiceApprovalStatus,
	VendorInvoiceApproval,
} from '../../services/procurementApi';
import type { RootState } from '../../store';
import {
	ChevronDown,
	Loader2,
	CheckCircle2,
	XCircle,
	Clock,
	Search,
	AlertCircle,
	FileText,
	ExternalLink,
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

function formatAmount(value: number | null | undefined): string {
	if (value == null) return '—';
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

// ─── Approvals Panel (inside accordion) ───────────────────────────────────────

function ApprovalDecisionIcon({ decision }: { decision: string }) {
	if (decision === 'approved') return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />;
	if (decision === 'rejected') return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
	return <Clock className="h-4 w-4 text-amber-400 shrink-0" />;
}

function ApprovalsPanel({
	approvals,
	submittedAt,
}: {
	approvals: VendorInvoiceApproval[];
	submittedAt: string | null;
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
					{approvals.map((a, i) => (
						<div key={i} className="flex items-start gap-3 bg-white rounded-md border border-gray-100 px-3 py-2">
							<ApprovalDecisionIcon decision={a.decision} />
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<p className="text-sm font-medium text-gray-800">{a.approverName}</p>
									<span className="text-xs text-gray-400 capitalize">{a.approverRole.replace('_', ' ')}</span>
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
									{a.decidedAt && (
										<span className="text-xs text-gray-400">{formatDate(a.decidedAt)}</span>
									)}
								</div>
								{a.rejectionReason && (
									<p className="text-xs text-red-500 mt-1 italic">"{a.rejectionReason}"</p>
								)}
							</div>
						</div>
					))}
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
		if (!reason.trim()) {
			setError('Rejection reason is required');
			return;
		}
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
					<Button variant="outline" size="md" onClick={onCancel} disabled={loading}>
						Cancel
					</Button>
					<Button
						variant="primary"
						size="md"
						onClick={handleSubmit}
						disabled={loading}
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

// ─── Accordion Row ────────────────────────────────────────────────────────────

function InvoiceRow({
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

	// Lazy fetch approval details when accordion opens
	useEffect(() => {
		if (!open) return;
		if (approvalData !== null) return; // already loaded
		let cancelled = false;
		setLoadingDetail(true);
		setDetailError(null);
		ProcurementApiService.getVendorInvoiceApprovalStatus(row.leadId)
			.then(res => {
				if (!cancelled) setApprovalData(res?.data ?? []);
			})
			.catch(() => {
				if (!cancelled) setDetailError('Failed to load approval details.');
			})
			.finally(() => {
				if (!cancelled) setLoadingDetail(false);
			});
		return () => { cancelled = true; };
	}, [open, row.leadId, approvalData]);

	const handleApprove = async (vendorId: number) => {
		setActionLoading(true);
		try {
			await ProcurementApiService.submitApprovalDecision(row.leadId, vendorId, { decision: 'approved' });
			showToast('success', 'Invoice approved successfully');
			setApprovalData(null); // reset so accordion refetches
			onActionDone();
		} catch (e: any) {
			const msg = e?.message || 'Failed to approve invoice.';
			showToast('error', msg);
		} finally {
			setActionLoading(false);
		}
	};

	const handleReject = async (vendorId: number, reason: string) => {
		setActionLoading(true);
		try {
			await ProcurementApiService.submitApprovalDecision(row.leadId, vendorId, {
				decision: 'rejected',
				rejectionReason: reason,
			});
			showToast('success', 'Invoice rejected. The team has been notified.');
			setRejectModal(null);
			setApprovalData(null);
			onActionDone();
		} catch (e: any) {
			const msg = e?.message || 'Failed to reject invoice.';
			showToast('error', msg);
		} finally {
			setActionLoading(false);
		}
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

			{/* Main row */}
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
							'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
							row.approvals_done === row.approvals_total
								? 'bg-green-100 text-green-700'
								: row.approvals_done > 0
								? 'bg-amber-100 text-amber-700'
								: 'bg-gray-100 text-gray-600'
						)}>
							{row.approvals_done}/{row.approvals_total}
						</span>
					) : (
						<span className="text-xs text-gray-400">—</span>
					)}
				</td>
				<td className="px-3 py-2.5 text-sm text-gray-900 text-right">{formatAmount(row.invoice_amount)}</td>
				<td className="px-3 py-2.5">
					<ApprovalStatusBadge status={row.approval_status} />
				</td>
				<td className="px-3 py-2.5 text-sm text-gray-500">{formatDate(row.approval_submitted_at)}</td>
				<td className="px-3 py-2.5 text-sm text-gray-500">
					{row.approval_status === 'approved'
						? formatDate(row.approved_at)
						: row.approval_status === 'rejected'
						? formatDate(row.rejected_at)
						: '—'}
				</td>
				<td className="px-3 py-2.5 text-sm text-gray-900 text-right">{row.totalPaid != null ? formatAmount(row.totalPaid) : '—'}</td>
			</tr>

			{/* Accordion */}
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
						) : approvalData ? (
							(() => {
								// Only show vendors that have been submitted for approval (not draft)
								const activeVendors = approvalData.filter(v => v.id === row.vendorInvoiceId && v.approval_status !== 'draft');
								if (activeVendors.length === 0) {
									return <p className="text-sm text-gray-400 py-2">No vendor invoices submitted for approval on this lead.</p>;
								}
								return (
									<div className="space-y-4">
										{activeVendors.map(vendor => {
											// Check if the current admin has a pending approval action on this vendor
											// approverLoginIds contains all login IDs that map to this approver
											const myPending = currentAdminId != null
												? vendor.approvals.find(a =>
													a.decision === 'pending' &&
													(a.approverId === currentAdminId ||
													 a.approverLoginIds?.includes(currentAdminId))
												  )
												: null;

											return (
												<div key={vendor.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
													{/* Vendor header */}
													<div className="flex items-start justify-between gap-4">
														<div>
															<p className="text-sm font-semibold text-gray-900">{vendor.vendor_name}</p>
															<div className="flex items-center gap-3 mt-1">
																<span className="text-sm text-gray-600">{formatAmount(vendor.invoice_amount)}</span>
																<ApprovalStatusBadge status={vendor.approval_status} />
															</div>
														</div>

														{/* Approve / Reject — only if this admin has a pending decision */}
														{myPending && (
															<div className="flex items-center gap-2 shrink-0">
																<button
																	onClick={e => { e.stopPropagation(); setRejectModal({ vendorId: vendor.id, vendorName: vendor.vendor_name, amount: vendor.invoice_amount }); }}
																	disabled={actionLoading}
																	className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
																>
																	<XCircle className="h-3.5 w-3.5" /> Reject
																</button>
																<button
																	onClick={e => { e.stopPropagation(); handleApprove(vendor.id); }}
																	disabled={actionLoading}
																	className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
																>
																	{actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
																	Approve
																</button>
															</div>
														)}
													</div>

													{/* Invoice details grid */}
													<div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 bg-gray-50 rounded-lg border border-gray-100 px-4 py-3 text-xs">
														{vendor.invoice_number && (
															<div>
																<p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Invoice #</p>
																<p className="text-gray-800 font-semibold">{vendor.invoice_number}</p>
															</div>
														)}
														{vendor.invoice_date && (
															<div>
																<p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Invoice Date</p>
																<p className="text-gray-800">{formatDate(vendor.invoice_date)}</p>
															</div>
														)}
														{vendor.invoice_status && (
															<div>
																<p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Payment Status</p>
																<p className="text-gray-800 capitalize">{vendor.invoice_status.replace(/_/g, ' ')}</p>
															</div>
														)}
														{vendor.contact_person && (
															<div>
																<p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Contact</p>
																<p className="text-gray-800">{vendor.contact_person}{vendor.contact_number && <span className="text-gray-500"> · {vendor.contact_number}</span>}</p>
															</div>
														)}
														{vendor.invoice_file_url && (
															<div>
																<p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Invoice File</p>
																<a
																	href={vendor.invoice_file_url}
																	target="_blank"
																	rel="noreferrer"
																	onClick={e => e.stopPropagation()}
																	className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
																>
																	<FileText className="h-3.5 w-3.5" /> View Invoice <ExternalLink className="h-3 w-3" />
																</a>
															</div>
														)}
														{(vendor.invoice_remarks || vendor.notes) && (
															<div className="col-span-2 sm:col-span-3">
																<p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Remarks</p>
																<p className="text-gray-700 italic">{vendor.invoice_remarks || vendor.notes}</p>
															</div>
														)}
													</div>

													{/* Approvals trail */}
													<ApprovalsPanel approvals={vendor.approvals} submittedAt={vendor.approval_submitted_at} />
												</div>
											);
										})}
									</div>
								);
							})()
						) : (
							<p className="text-sm text-gray-400 py-2">No vendor invoice data for this lead.</p>
						)}
					</td>
				</tr>
			)}
		</>
	);
}

// ─── Table ────────────────────────────────────────────────────────────────────

const APPROVAL_STATUS_OPTIONS = [
	{ label: 'All Statuses', value: '' },
	{ label: 'Draft', value: 'draft' },
	{ label: 'Pending Approval', value: 'pending_approval' },
	{ label: 'Approved', value: 'approved' },
	{ label: 'Rejected', value: 'rejected' },
];

function InvoiceTable({
	rows,
	loading,
	currentAdminId,
	serialOffset,
	onActionDone,
}: {
	rows: VendorInvoiceDashboardItem[];
	loading: boolean;
	currentAdminId: number | null;
	serialOffset: number;
	onActionDone: () => void;
}) {
	if (loading) {
		return (
			<div className="flex items-center justify-center py-16 text-gray-500 gap-2">
				<Loader2 className="h-6 w-6 animate-spin" /> Loading…
			</div>
		);
	}
	if (rows.length === 0) {
		return <div className="py-16 text-center text-gray-400 text-sm">No invoices found.</div>;
	}

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
						<InvoiceRow
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

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'all' | 'pending';

const VendorInvoiceApprovals: React.FC = () => {
	const user = useSelector((s: RootState) => s.auth.user);
	const currentAdminId = user?.id ? Number(user.id) : null;

	const [activeTab, setActiveTab] = useState<Tab>('pending');

	// All invoices tab state
	const [allRows, setAllRows] = useState<VendorInvoiceDashboardItem[]>([]);
	const [allLoading, setAllLoading] = useState(false);
	const [allPage, setAllPage] = useState(1);
	const [allPerPage] = useState(20);
	const [allTotal, setAllTotal] = useState(0);
	const [allTotalPages, setAllTotalPages] = useState(1);
	const [search, setSearch] = useState('');
	const [approvalStatusFilter, setApprovalStatusFilter] = useState('');

	// Pending my approval tab state
	const [pendingRows, setPendingRows] = useState<VendorInvoiceDashboardItem[]>([]);
	const [pendingLoading, setPendingLoading] = useState(false);
	const [pendingPage, setPendingPage] = useState(1);
	const [pendingPerPage] = useState(20);
	const [pendingTotal, setPendingTotal] = useState(0);
	const [pendingTotalPages, setPendingTotalPages] = useState(1);

	const fetchAll = useCallback(async (page: number) => {
		setAllLoading(true);
		try {
			const res = await ProcurementApiService.getVendorInvoiceDashboard({
				page,
				perPage: allPerPage,
				approvalStatus: approvalStatusFilter || undefined,
				search: search || undefined,
				leadStatus: 'won',
			});
			setAllRows(res?.data ?? []);
			if (res?.pagination) {
				setAllTotal(res.pagination.total);
				setAllTotalPages(res.pagination.pages);
			}
		} catch {
			setAllRows([]);
		} finally {
			setAllLoading(false);
		}
	}, [allPerPage, approvalStatusFilter, search]);

	const fetchPending = useCallback(async (page: number) => {
		setPendingLoading(true);
		try {
			const res = await ProcurementApiService.getMyPendingApprovals(page, pendingPerPage);
			setPendingRows(res?.data ?? []);
			if (res?.pagination) {
				setPendingTotal(res.pagination.total);
				setPendingTotalPages(res.pagination.pages);
			}
		} catch {
			setPendingRows([]);
		} finally {
			setPendingLoading(false);
		}
	}, [pendingPerPage]);

	useEffect(() => { fetchAll(allPage); }, [fetchAll, allPage]);
	useEffect(() => { if (activeTab === 'pending') fetchPending(pendingPage); }, [activeTab, fetchPending, pendingPage]);

	const handleSearch = () => {
		setAllPage(1);
		fetchAll(1);
	};

	const handleAllActionDone = () => fetchAll(allPage);
	const handlePendingActionDone = () => fetchPending(pendingPage);

	return (
		<div className="space-y-5">
			<PageHeader
				title="Vendor Invoice Approvals"
				locationName="Approvals"
				totalItems={activeTab === 'all' ? allTotal : pendingTotal}
				itemType="invoices"
			/>

			{/* Tabs */}
			<div className="flex gap-1 border-b border-gray-200">
				{([
					{ key: 'all', label: 'All Invoices' },
					{ key: 'pending', label: 'Pending My Approval', count: pendingTotal },
				] as { key: Tab; label: string; count?: number }[]).map(tab => (
					<button
						key={tab.key}
						onClick={() => setActiveTab(tab.key)}
						className={cn(
							'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
							activeTab === tab.key
								? 'border-blue-600 text-blue-600'
								: 'border-transparent text-gray-500 hover:text-gray-700'
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
					{/* Filters */}
					<div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
						<div className="flex flex-wrap gap-3 items-end">
							<FloatingInput
								label="Search client"
								value={search}
								onChange={setSearch}
								className="w-52"
							/>
							<FloatingDropdown
								label="Approval Status"
								options={APPROVAL_STATUS_OPTIONS}
								value={approvalStatusFilter}
								onChange={setApprovalStatusFilter}
								className="w-48"
							/>
							<Button variant="primary" size="md" onClick={handleSearch} disabled={allLoading}>
								{allLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
								<span className="ml-2">Search</span>
							</Button>
						</div>
					</div>

					<div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
						<InvoiceTable
							rows={allRows}
							loading={allLoading}
							currentAdminId={currentAdminId}
							serialOffset={(allPage - 1) * allPerPage}
							onActionDone={handleAllActionDone}
						/>
					</div>

					{allTotalPages > 1 && (
						<Pagination
							currentPage={allPage}
							totalPages={allTotalPages}
							totalItems={allTotal}
							itemsPerPage={allPerPage}
							onPageChange={setAllPage}
							onItemsPerPageChange={() => {}}
						/>
					)}
				</>
			)}

			{/* Pending My Approval Tab */}
			{activeTab === 'pending' && (
				<>
					<div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
						<InvoiceTable
							rows={pendingRows}
							loading={pendingLoading}
							currentAdminId={currentAdminId}
							serialOffset={(pendingPage - 1) * pendingPerPage}
							onActionDone={handlePendingActionDone}
						/>
					</div>

					{pendingTotalPages > 1 && (
						<Pagination
							currentPage={pendingPage}
							totalPages={pendingTotalPages}
							totalItems={pendingTotal}
							itemsPerPage={pendingPerPage}
							onPageChange={setPendingPage}
							onItemsPerPageChange={() => {}}
						/>
					)}
				</>
			)}
		</div>
	);
};

export default VendorInvoiceApprovals;
