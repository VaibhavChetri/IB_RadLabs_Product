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
	VendorLedgerEntry,
	PendingApprovalLead,
	PendingApprovalVendor,
	PendingApprovalTrailEntry,
	ClientPo,
	ApContext,
	ApRiskSeverity,
	VendorPaymentMode,
	AdvancePaymentItem,
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
	AlertTriangle,
	FileText,
	ExternalLink,
	Download,
	RotateCcw,
	Upload,
	Receipt,
	Paperclip,
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

// ─── Risk Badge (driven by ap_context.risk.severity) ──────────────────────────

const RISK_CONFIG: Record<ApRiskSeverity, { label: string; className: string }> = {
	info: { label: 'Within budget', className: 'bg-green-50 text-green-700 border-green-200' },
	warn: { label: 'Caution', className: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
	high: { label: 'Review before approving', className: 'bg-orange-50 text-orange-800 border-orange-300' },
	block: { label: 'Acknowledgement needed', className: 'bg-red-50 text-red-700 border-red-300' },
};

function RiskBadge({ severity }: { severity: ApRiskSeverity }) {
	const cfg = RISK_CONFIG[severity];
	const Icon = severity === 'info' ? CheckCircle2 : AlertTriangle;
	return (
		<span className={cn(
			'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
			cfg.className,
		)}>
			<Icon className="h-3 w-3" />
			{cfg.label}
		</span>
	);
}

const RISK_DOT_CLASS: Record<ApRiskSeverity, string> = {
	info: 'bg-green-500',
	warn: 'bg-yellow-500',
	high: 'bg-orange-500',
	block: 'bg-red-500',
};

function RiskDot({ severity, flag }: { severity: ApRiskSeverity | null | undefined; flag?: string | null }) {
	if (!severity) return null;
	const tooltipBase = RISK_CONFIG[severity]?.label ?? severity;
	const tooltip = flag ? `${tooltipBase} (${flag})` : tooltipBase;
	return (
		<span
			title={tooltip}
			aria-label={tooltip}
			className={cn('inline-block h-2 w-2 rounded-full shrink-0', RISK_DOT_CLASS[severity])}
		/>
	);
}

// ─── Payment & Budget Panel ───────────────────────────────────────────────────

function MoneyRow({ label, value, emphasis }: { label: string; value: number | null | undefined; emphasis?: 'positive' | 'negative' | 'muted' }) {
	const colorClass =
		emphasis === 'positive' ? 'text-green-700'
		: emphasis === 'negative' ? 'text-red-700'
		: emphasis === 'muted' ? 'text-gray-500'
		: 'text-gray-900';
	return (
		<div className="flex items-baseline justify-between text-sm">
			<span className="text-gray-600">{label}</span>
			<span className={cn('font-medium tabular-nums', colorClass)}>{formatAmount(value)}</span>
		</div>
	);
}

function PaymentBudgetPanel({ ctx }: { ctx: ApContext }) {
	const { amounts, counts, risk } = ctx;
	const overBudget = amounts.net_remaining_after_request < 0;

	return (
		<div className="rounded-lg border border-gray-200 bg-gray-50/60 p-3 space-y-3">
			<div className="flex items-center justify-between gap-3">
				<span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Payment & Budget</span>
				<RiskBadge severity={risk.severity} />
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
				<MoneyRow label="Committed (projected)" value={amounts.committed} emphasis="muted" />
				<MoneyRow label="Header invoice amount" value={amounts.header_invoice_amount} emphasis="muted" />
				<MoneyRow label={`Advances paid${counts.advances ? ` (${counts.advances})` : ''}`} value={amounts.advances_paid} />
				<MoneyRow label={`Final paid${counts.receipts ? ` (${counts.receipts})` : ''}`} value={amounts.final_paid} />
				<MoneyRow label="Total paid" value={amounts.total_paid} />
				<MoneyRow label={`Already billed via PDFs${counts.pdf_files ? ` (${counts.pdf_files})` : ''}`} value={amounts.already_billed_via_pdfs} emphasis="muted" />
				<MoneyRow label="Pending in this request" value={amounts.pending_in_request} />
				<MoneyRow
					label="Net remaining after request"
					value={amounts.net_remaining_after_request}
					emphasis={overBudget ? 'negative' : 'positive'}
				/>
			</div>

			{risk.severity !== 'info' && (
				<p className={cn(
					'text-xs leading-snug rounded px-2.5 py-1.5 border',
					risk.severity === 'block' ? 'bg-red-50 border-red-200 text-red-800'
						: risk.severity === 'high' ? 'bg-orange-50 border-orange-200 text-orange-800'
						: 'bg-yellow-50 border-yellow-200 text-yellow-800',
				)}>
					{risk.reason}
					{risk.overrun_amount > 0 && (
						<> {' '}<span className="font-semibold">Overrun: {formatAmount(risk.overrun_amount)} ({risk.overrun_percent}%)</span></>
					)}
				</p>
			)}
		</div>
	);
}

// ─── Approval Trail (shared) ───────────────────────────────────────────────────

function ApprovalTrailPanel({
	approvals,
	submittedAt,
	inProxyMode = false,
	ledger = [],
}: {
	approvals: (VendorInvoiceApproval | PendingApprovalTrailEntry)[];
	submittedAt: string | null;
	inProxyMode?: boolean;
	ledger?: VendorLedgerEntry[];
}) {
	// Group by batch_id so all batches are visible (newest first)
	const batches: { batchId: number | null; rows: typeof approvals }[] = [];
	for (const a of approvals) {
		const bid = ('batchId' in a ? (a as any).batchId : null) ?? null;
		const existing = batches.find((b) => b.batchId === bid);
		if (existing) existing.rows.push(a);
		else batches.push({ batchId: bid, rows: [a] });
	}

	// Build a quick lookup: approval_row_id → ledger entry (receipt rows have it set)
	const ledgerByApprovalRow = new Map<number, VendorLedgerEntry>();
	for (const lr of ledger) {
		if (lr.approval_row_id != null) ledgerByApprovalRow.set(lr.approval_row_id, lr);
	}

	const stageLabel = (role: string) => role.replace('_', ' ');

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
					{batches.map((batch, bi) => {
						// Find the receipt linked to this batch (via any approval_row_id in the batch)
						const matchedReceipt = batch.rows
							.map((r) => ledgerByApprovalRow.get((r as any).approvalRowId))
							.find((x): x is VendorLedgerEntry => !!x);

						// Pull amounts/decisions for compact display — Stage 1 + Stage 2 share the same amount
						const requested = batch.rows.find((r) => 'advanceRequested' in r && r.advanceRequested != null)?.advanceRequested ?? null;
						const approved = batch.rows.find((r) => 'advanceApproved' in r && r.advanceApproved != null)?.advanceApproved ?? null;
						// "Advance" batch: only when explicitly flagged at request time
						const isAdvanceBatch = batch.rows.some((r) => 'isAdvance' in r && r.isAdvance);

						const isReopenedBatch = batch.rows.some((a) => 'reopenedFromStage2' in a && a.reopenedFromStage2 === true);
						const anyRejection = batch.rows.find((a) => a.decision === 'rejected' && 'rejectionReason' in a && a.rejectionReason);
						const anyPending = batch.rows.some((a) => a.decision === 'pending');
						const isProxyTarget = !isReopenedBatch && inProxyMode && anyPending;
						const highlighted = isReopenedBatch || isProxyTarget;

						return (
							<div
								key={batch.batchId ?? bi}
								className={cn(
									'rounded-md px-3 py-2.5 border',
									highlighted
										? 'bg-amber-50 border-amber-200'
										: 'bg-white border-gray-100',
								)}
							>
								{(batches.length > 1 || isAdvanceBatch) && (
									<div className="flex items-center gap-2 mb-1.5">
										{batches.length > 1 && (
											<span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
												Request {batches.length - bi}
											</span>
										)}
										{isAdvanceBatch && (
											<span className="text-[10px] font-semibold uppercase tracking-wide bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
												Advance
											</span>
										)}
									</div>
								)}

								{/* 2x2 layout: approvers stacked left, amounts stacked right, receipts far right */}
								<div className="flex items-start gap-4">
									{/* Column 1 — Stage 1 / Stage 2 approvers, stacked */}
									<div className="flex-1 min-w-0 space-y-1">
										{batch.rows
											.slice()
											.sort((a, b) => ((a as any).approvalStage ?? 1) - ((b as any).approvalStage ?? 1))
											.map((a, i) => (
												<div key={i} className="flex items-center gap-1.5">
													{a.decision === 'approved' && (
														<CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
													)}
													{a.decision === 'rejected' && (
														<XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
													)}
													{a.decision === 'pending' && (
														<Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
													)}
													<span className="text-sm font-medium text-gray-800">{a.approverName}</span>
													<span className="text-[11px] text-gray-400 capitalize">({stageLabel(a.approverRole)})</span>
												</div>
											))}
									</div>

									{/* Column 2 — Requested / Approved amounts, stacked. Same numbers across stages so we show once */}
									{(requested != null || approved != null) && (
										<div className="text-xs space-y-1 shrink-0 text-right">
											{requested != null && (
												<div className="text-gray-500">
													Requested: <span className="font-medium text-gray-800 tabular-nums">{formatAmount(requested)}</span>
												</div>
											)}
											{approved != null && (
												<div className="text-green-700">
													Approved: <span className="font-medium tabular-nums">{formatAmount(approved)}</span>
												</div>
											)}
										</div>
									)}

									{/* Column 3 — Receipt links (only when payment was processed for this batch) */}
									{matchedReceipt && (
										<div className="flex flex-col gap-1 shrink-0 items-end">
											{matchedReceipt.receipt_file_url && (
												<a
													href={matchedReceipt.receipt_file_url}
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 hover:underline"
													title="Payment receipt"
												>
													<Paperclip className="h-3 w-3" />
													Payment receipt
												</a>
											)}
											{matchedReceipt.tax_receipt_url ? (
												<a
													href={matchedReceipt.tax_receipt_url}
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex items-center gap-1 text-[11px] text-teal-600 hover:text-teal-700 hover:underline"
													title="Tax receipt"
												>
													<CheckCircle2 className="h-3 w-3 text-teal-500" />
													Tax receipt
												</a>
											) : (
												<span className="text-[11px] text-gray-300 italic">No tax receipt</span>
											)}
										</div>
									)}
								</div>

								{/* Decided-at footer */}
								{batch.rows.some((r) => r.decidedAt) && (
									<p className="text-[11px] text-gray-400 mt-2">
										{formatDate(batch.rows.find((r) => r.decidedAt)!.decidedAt!)}
									</p>
								)}

								{isReopenedBatch && (
									<p className="text-xs text-amber-800 mt-1">
										Reopened after rejection
										{batch.rows.find((a) => 'reopenedReason' in a && a.reopenedReason) && (
											<span className="italic">
												{' — '}
												"{batch.rows.find((a) => 'reopenedReason' in a)!['reopenedReason' as keyof typeof batch.rows[0]] as string}"
											</span>
										)}
									</p>
								)}

								{anyRejection && 'rejectionReason' in anyRejection && anyRejection.rejectionReason && (
									<p className="text-xs text-red-500 mt-1 italic">"{anyRejection.rejectionReason}"</p>
								)}
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
	clientPo,
}: {
	invoiceNumber?: string | null;
	invoiceDate?: string | null;
	invoiceStatus?: string | null;
	contactPerson?: string | null;
	contactNumber?: string | null;
	invoiceFileUrl?: string | null;
	invoiceRemarks?: string | null;
	notes?: string | null;
	clientPo?: ClientPo | null;
}) {
	const hasPoLink = !!clientPo?.s3Url;
	const hasAny = invoiceNumber || invoiceDate || invoiceStatus || contactPerson || invoiceFileUrl || invoiceRemarks || notes || hasPoLink;
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
			{hasPoLink && (
				<div>
					<p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Client PO</p>
					<a
						href={clientPo!.s3Url!}
						target="_blank"
						rel="noreferrer"
						onClick={e => e.stopPropagation()}
						className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
					>
						<Download className="h-3.5 w-3.5" />
						View PO {clientPo!.poNumber}
						<ExternalLink className="h-3 w-3" />
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
	requireOverrunAck = false,
}: {
	onApprove: () => void;
	onReject: () => void;
	loading: boolean;
	requireOverrunAck?: boolean;
}) {
	const [ackChecked, setAckChecked] = useState(false);
	const approveDisabled = loading || (requireOverrunAck && !ackChecked);
	return (
		<div className="flex flex-col items-end gap-2 shrink-0">
			{requireOverrunAck && (
				<label
					className="flex items-center gap-2 text-xs text-red-700 select-none cursor-pointer"
					onClick={e => e.stopPropagation()}
				>
					<input
						type="checkbox"
						checked={ackChecked}
						onChange={e => setAckChecked(e.target.checked)}
						className="h-3.5 w-3.5 rounded border-red-300 text-red-600 focus:ring-red-500"
					/>
					I acknowledge the budget overrun
				</label>
			)}
			<div className="flex items-center gap-2">
				<button
					onClick={e => { e.stopPropagation(); onReject(); }}
					disabled={loading}
					className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
				>
					<XCircle className="h-3.5 w-3.5" /> Reject
				</button>
				<button
					onClick={e => { e.stopPropagation(); onApprove(); }}
					disabled={approveDisabled}
					className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
					Approve
				</button>
			</div>
		</div>
	);
}

// ─── Record Payment Modal ─────────────────────────────────────────────────────

const PAYMENT_MODE_OPTIONS: { label: string; value: VendorPaymentMode }[] = [
	{ label: 'NEFT', value: 'neft' },
	{ label: 'IMPS', value: 'imps' },
	{ label: 'RTGS', value: 'rtgs' },
	{ label: 'UPI', value: 'upi' },
	{ label: 'Cheque', value: 'cheque' },
	{ label: 'Cash', value: 'cash' },
	{ label: 'Other', value: 'other' },
];

function RecordPaymentModal({
	vendorInvoiceId,
	approvalRowId,
	defaultAmount,
	vendorName,
	amountApproved,
	initialTotalReceiptsAmount,
	onSuccess,
	onCancel,
}: {
	vendorInvoiceId: number;
	approvalRowId: number;
	defaultAmount: number | null;
	vendorName: string;
	amountApproved: number | null;
	initialTotalReceiptsAmount: number | null;
	onSuccess: () => void;
	onCancel: () => void;
}) {
	const today = new Date().toISOString().split('T')[0];
	const [amount, setAmount] = useState(defaultAmount != null ? String(defaultAmount) : '');
	const [paidOn, setPaidOn] = useState(today);
	const [paymentMode, setPaymentMode] = useState<VendorPaymentMode | ''>('');
	const [referenceNumber, setReferenceNumber] = useState('');
	const [notes, setNotes] = useState('');
	const [receiptFile, setReceiptFile] = useState<File | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');
	const [runningTotal, setRunningTotal] = useState<number | null>(initialTotalReceiptsAmount);
	const [lastSaved, setLastSaved] = useState(false);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setReceiptFile(e.target.files?.[0] ?? null);
	};

	const handleSubmit = async () => {
		const parsedAmount = parseFloat(amount.replace(/,/g, ''));
		if (isNaN(parsedAmount) || parsedAmount <= 0) {
			setError('Enter a valid payment amount.');
			return;
		}
		if (!paidOn) {
			setError('Paid on date is required.');
			return;
		}
		if (!receiptFile) {
			setError('Receipt file is required — please attach a PDF or image.');
			return;
		}
		setError('');
		setSubmitting(true);
		try {
			const fd = new FormData();
			fd.append('amount', String(parsedAmount));
			fd.append('paid_on', paidOn);
			fd.append('approval_row_id', String(approvalRowId));
			if (paymentMode) fd.append('payment_mode', paymentMode);
			if (referenceNumber.trim()) fd.append('reference_number', referenceNumber.trim());
			if (notes.trim()) fd.append('notes', notes.trim());
			if (receiptFile) fd.append('receipt_file', receiptFile);

			await ProcurementApiService.uploadAdvanceReceipt(vendorInvoiceId, fd);
			const newTotal = (runningTotal ?? 0) + parsedAmount;
			setRunningTotal(newTotal);
			setLastSaved(true);
			onSuccess();
			// Reset form for next partial payment
			setAmount('');
			setPaidOn(today);
			setPaymentMode('');
			setReferenceNumber('');
			setNotes('');
			setReceiptFile(null);
		} catch (e: any) {
			setError(e?.message || 'Failed to upload receipt.');
		} finally {
			setSubmitting(false);
		}
	};

	const totalPct = amountApproved && amountApproved > 0 && runningTotal != null
		? Math.min(100, Math.round((runningTotal / amountApproved) * 100))
		: null;
	const busy = submitting;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
			<div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 space-y-4">
				<div className="flex items-center gap-2">
					<Receipt className="h-5 w-5 text-green-600" />
					<h3 className="text-base font-semibold text-gray-900">Record Payment</h3>
				</div>
				<p className="text-sm text-gray-500">{vendorName}</p>

				{/* Running total */}
				{amountApproved != null && amountApproved > 0 && (
					<div className={cn(
						'rounded-lg border px-4 py-3 space-y-1.5',
						totalPct != null && totalPct >= 100 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
					)}>
						<div className="flex items-center justify-between text-xs">
							<span className="text-gray-600 font-medium">Total paid so far</span>
							<span className={cn('font-semibold tabular-nums', totalPct != null && totalPct >= 100 ? 'text-green-700' : 'text-gray-800')}>
								{formatAmount(runningTotal ?? 0)}
								<span className="font-normal text-gray-400"> / {formatAmount(amountApproved)}</span>
							</span>
						</div>
						{totalPct != null && (
							<div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
								<div
									className={cn('h-full rounded-full', totalPct >= 100 ? 'bg-green-500' : 'bg-blue-500')}
									style={{ width: `${totalPct}%` }}
								/>
							</div>
						)}
						{lastSaved && totalPct != null && totalPct < 100 && (
							<p className="text-xs text-blue-700">Payment saved. You can record another partial payment below.</p>
						)}
					</div>
				)}

				{/* Amount + Date */}
				<div className="grid grid-cols-2 gap-3">
					<div>
						<label className="block text-xs font-medium text-gray-700 mb-1">
							Amount (₹) <span className="text-red-500">*</span>
						</label>
						<input
							type="number"
							min={0}
							value={amount}
							onChange={e => setAmount(e.target.value)}
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
							placeholder="e.g. 10000"
						/>
					</div>
					<div>
						<label className="block text-xs font-medium text-gray-700 mb-1">Paid On</label>
						<input
							type="date"
							value={paidOn}
							onChange={e => setPaidOn(e.target.value)}
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
						/>
					</div>
				</div>

				{/* Mode + Reference */}
				<div className="grid grid-cols-2 gap-3">
					<div>
						<label className="block text-xs font-medium text-gray-700 mb-1">Payment Mode</label>
						<select
							value={paymentMode}
							onChange={e => setPaymentMode(e.target.value as VendorPaymentMode | '')}
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
						>
							<option value="">— Select —</option>
							{PAYMENT_MODE_OPTIONS.map(o => (
								<option key={o.value} value={o.value}>{o.label}</option>
							))}
						</select>
					</div>
					<div>
						<label className="block text-xs font-medium text-gray-700 mb-1">UTR / Reference No.</label>
						<input
							type="text"
							value={referenceNumber}
							onChange={e => setReferenceNumber(e.target.value)}
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
							placeholder="e.g. TXN123456"
						/>
					</div>
				</div>

				{/* Receipt upload */}
				<div>
					<label className="block text-xs font-medium text-gray-700 mb-1">Receipt (PDF / Image) <span className="text-red-500">*</span></label>
					<label className={cn(
						'flex items-center gap-2 w-full border-2 border-dashed rounded-lg px-4 py-3 cursor-pointer transition-colors',
						receiptFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-gray-400'
					)}>
						<Upload className="h-4 w-4 text-gray-400 shrink-0" />
						<span className="text-sm text-gray-600 truncate">
							{receiptFile ? receiptFile.name : 'Click to upload receipt'}
						</span>
						<input
							type="file"
							accept=".pdf,.jpg,.jpeg,.png,.webp"
							className="hidden"
							onChange={handleFileChange}
						/>
					</label>
				</div>

				{/* Notes */}
				<div>
					<label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
					<textarea
						rows={2}
						value={notes}
						onChange={e => setNotes(e.target.value)}
						className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
						placeholder="Any additional notes…"
					/>
				</div>

				{error && (
					<p className="text-xs text-red-600 flex items-center gap-1.5">
						<AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
					</p>
				)}

				<div className="flex justify-end gap-3 pt-1">
					<Button variant="outline" size="md" onClick={onCancel} disabled={busy}>Close</Button>
					<Button
						variant="primary" size="md" onClick={handleSubmit} disabled={busy}
						className="bg-green-600 hover:bg-green-700 border-green-600"
					>
						{busy
							? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving…</>
							: <><Receipt className="h-4 w-4 mr-1" />Record Payment</>
						}
					</Button>
				</div>
			</div>
		</div>
	);
}

// ─── ALL INVOICES TAB — flat table with lazy-fetch accordion ─────────────────

function AllInvoicesRow({
	row,
	currentAdminId,
	serialNo,
	onActionDone,
	onReceiptUploaded,
}: {
	row: VendorInvoiceDashboardItem;
	currentAdminId: number | null;
	serialNo: number;
	onActionDone: () => void;
	onReceiptUploaded?: (vendorInvoiceId: number) => void;
}) {
	const [open, setOpen] = useState(false);
	const [approvalData, setApprovalData] = useState<VendorInvoiceApprovalStatus[] | null>(null);
	const [clientPos, setClientPos] = useState<ClientPo[]>([]);
	const [loadingDetail, setLoadingDetail] = useState(false);
	const [detailError, setDetailError] = useState<string | null>(null);
	const [actionLoading, setActionLoading] = useState(false);
	const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
	const [rejectModal, setRejectModal] = useState<{ vendorId: number; vendorName: string; amount: number | null } | null>(null);
	const [paymentModal, setPaymentModal] = useState<{ vendorInvoiceId: number; approvalRowId: number; advanceApproved: number | null; vendorName: string; totalReceiptsAmount: number | null } | null>(null);
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
			.then(res => {
				if (cancelled) return;
				setApprovalData(res?.data ?? []);
				setClientPos(res?.clientPos ?? []);
			})
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
			{paymentModal && (
				<RecordPaymentModal
					vendorInvoiceId={paymentModal.vendorInvoiceId}
					approvalRowId={paymentModal.approvalRowId}
					defaultAmount={paymentModal.advanceApproved}
					vendorName={paymentModal.vendorName}
					amountApproved={paymentModal.advanceApproved}
					initialTotalReceiptsAmount={paymentModal.totalReceiptsAmount}
					onCancel={() => setPaymentModal(null)}
					onSuccess={() => {
						setPaymentModal(null);
						setApprovalData(null);
						onActionDone();
						onReceiptUploaded?.(row.vendorInvoiceId);
					}}
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
				<td className="px-3 py-2.5">
					<div className="flex items-center gap-1.5">
						<RiskDot severity={row.risk_severity} flag={row.risk_flag} />
						<ApprovalStatusBadge status={row.approval_status} />
					</div>
				</td>
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
										const apCtx = vendor.ap_context ?? null;
										const requireAck = !!myPending && apCtx?.risk.severity === 'block';
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
													<div className="flex items-center gap-2">
														{myPending && (
															<ApproveRejectButtons
																loading={actionLoading}
																requireOverrunAck={requireAck}
																onApprove={() => handleApprove(vendor.id)}
																onReject={() => setRejectModal({ vendorId: vendor.id, vendorName: vendor.vendor_name, amount: vendor.invoice_amount })}
															/>
														)}
													</div>
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
													clientPo={clientPos[0]}
												/>
												{apCtx && <PaymentBudgetPanel ctx={apCtx} />}
												<ApprovalTrailPanel
													approvals={vendor.approvals}
													submittedAt={vendor.approval_submitted_at}
													ledger={vendor.ledger ?? []}
												/>
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
	rows, loading, currentAdminId, serialOffset, onActionDone, onReceiptUploaded,
}: {
	rows: VendorInvoiceDashboardItem[];
	loading: boolean;
	currentAdminId: number | null;
	serialOffset: number;
	onActionDone: () => void;
	onReceiptUploaded?: (vendorInvoiceId: number) => void;
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
							onReceiptUploaded={onReceiptUploaded}
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
	// Find the pending advance trail entry — used for requested amount label
	const advanceEntry = vendor.approvalTrail.find(e => e.isAdvance && e.decision === 'pending');
	// Fallback: stage 1 approved amount (in case stage 2 advance_requested wasn't propagated)
	const stage1ApprovedEntry = vendor.approvalTrail.find(e => e.isAdvance && e.decision === 'approved' && e.approvalStage === 1);
	// Stage 1 (Shashwat) sets the approved amount; Stage 2 (Asha) just confirms it
	const myPendingEntry = vendor.approvalTrail.find(e => e.decision === 'pending');
	const isStage1 = myPendingEntry?.approvalStage === 1;

	const [open, setOpen] = useState(false);
	const [actionLoading, setActionLoading] = useState(false);
	const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
	const [rejectModal, setRejectModal] = useState(false);
	const [advanceApproved, setAdvanceApproved] = useState<string>(
		vendor.advance_requested != null ? String(vendor.advance_requested)
		: myPendingEntry?.advanceRequested != null ? String(myPendingEntry.advanceRequested)
		: advanceEntry?.advanceRequested != null ? String(advanceEntry.advanceRequested)
		: ''
	);
	const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const showToast = (type: 'success' | 'error', msg: string) => {
		setToast({ type, msg });
		if (toastRef.current) clearTimeout(toastRef.current);
		toastRef.current = setTimeout(() => setToast(null), 4000);
	};

	const handleApprove = async () => {
		const payload: Parameters<typeof ProcurementApiService.submitApprovalDecision>[2] = { decision: 'approved', approval_row_id: myPendingEntry?.approvalRowId ?? null };
		if (isStage1) {
			const parsed = parseFloat(advanceApproved.replace(/,/g, ''));
			if (isNaN(parsed) || parsed <= 0) {
				showToast('error', 'Enter a valid amount before approving.');
				return;
			}
			payload.advance_approved = parsed;
		}
		setActionLoading(true);
		try {
			await ProcurementApiService.submitApprovalDecision(leadId, vendor.vendorInvoiceId, payload);
			showToast('success', 'Invoice approved successfully');
			onActionDone();
		} catch (e: any) {
			showToast('error', e?.message || 'Failed to approve invoice.');
		} finally { setActionLoading(false); }
	};

	const handleReject = async (reason: string) => {
		setActionLoading(true);
		try {
			await ProcurementApiService.submitApprovalDecision(leadId, vendor.vendorInvoiceId, { decision: 'rejected', rejectionReason: reason, approval_row_id: myPendingEntry?.approvalRowId ?? null });
			showToast('success', 'Invoice rejected. The team has been notified.');
			setRejectModal(false);
			onActionDone();
		} catch (e: any) {
			showToast('error', e?.message || 'Failed to reject invoice.');
		} finally { setActionLoading(false); }
	};

	const isActionable = vendor.myDecision === 'pending';
	const apCtx = vendor.ap_context ?? null;
	const requireAck = isActionable && apCtx?.risk.severity === 'block';

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
				vendor.reopened?.isReopened
					? 'border-amber-300'
					: isActionable ? 'border-amber-200' : 'border-gray-200'
			)}>
				{/* Reopen banner — fires when finance (Stage 2) rejected and the invoice
				    looped back to the Stage 1 approver. Visible while the card is collapsed
				    so the approver can scan their queue for re-review items at a glance. */}
				{vendor.reopened?.isReopened && (
					<div className="flex items-start gap-2.5 px-4 py-2.5 bg-amber-50 border-b border-amber-200">
						<RotateCcw className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
						<div className="flex-1 min-w-0">
							<p className="text-sm font-semibold text-amber-900">
								Reopened by {vendor.reopened.rejectedByName ?? 'finance team'}
							</p>
							{vendor.reopened.reason && (
								<p className="text-xs text-amber-800 mt-0.5 italic">
									"{vendor.reopened.reason}"
								</p>
							)}
							<p className="text-xs text-amber-700/80 mt-1">
								Review the issue, then approve (sends back to finance) or reject (terminal).
							</p>
						</div>
					</div>
				)}
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
							<div className="flex items-center gap-2">
								<RiskDot severity={apCtx?.risk.severity} flag={apCtx?.risk.flag} />
								<p className="text-sm font-semibold text-gray-900 truncate">{vendor.vendorName}</p>
							</div>
							<div className="flex items-center gap-2 mt-0.5 flex-wrap">
								<span className="text-sm text-gray-600">{formatAmount(vendor.invoiceAmount)}</span>
								{vendor.advance_requested != null && (
									<span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
										Requested: {formatAmount(vendor.advance_requested)}
									</span>
								)}
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
						{isActionable && !isStage1 && (
							<div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs" onClick={e => e.stopPropagation()}>
								<div className="flex flex-col items-center">
									<span className="text-[10px] font-semibold uppercase tracking-wide text-blue-500">Advance</span>
									<span className="font-semibold text-blue-800 tabular-nums">{formatAmount(stage1ApprovedEntry?.advanceApproved ?? advanceEntry?.advanceApproved ?? advanceEntry?.advanceRequested)}</span>
								</div>
								{apCtx && (
									<>
										<div className="w-px h-6 bg-blue-200" />
										<div className="flex flex-col items-center">
											<span className="text-[10px] font-semibold uppercase tracking-wide text-blue-500">Already Paid</span>
											<span className="font-semibold text-gray-700 tabular-nums">{formatAmount(apCtx.amounts.total_paid)}</span>
										</div>
										<div className="w-px h-6 bg-blue-200" />
										<div className="flex flex-col items-center">
											<span className="text-[10px] font-semibold uppercase tracking-wide text-blue-500">Pending</span>
											<span className="font-semibold text-amber-700 tabular-nums">{formatAmount(apCtx.amounts.pending_in_request)}</span>
										</div>
									</>
								)}
							</div>
						)}
						{isActionable && isStage1 && (
							<div
								className="flex flex-col items-end gap-0.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"
								onClick={e => e.stopPropagation()}
							>
								<div className="flex items-center gap-1.5">
									<span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">Amount approved</span>
									{advanceEntry && (
										<span className="text-[10px] text-amber-600">
											(requested: {formatAmount(advanceEntry.advanceRequested)})
										</span>
									)}
								</div>
								{isStage1 ? (() => {
									const invalid = advanceApproved !== '' && (isNaN(parseFloat(advanceApproved)) || parseFloat(advanceApproved) <= 0);
									const placeholder = advanceEntry?.advanceRequested ?? vendor.invoiceAmount ?? '';
									return (
										<div className={cn(
											'flex items-center rounded-md overflow-hidden focus-within:ring-1 bg-white',
											invalid
												? 'border border-red-400 focus-within:ring-red-400'
												: 'border border-amber-300 focus-within:ring-amber-500 focus-within:border-amber-500'
										)}>
											<span className="px-2 text-gray-500 text-xs select-none">₹</span>
											<input
												type="number"
												min={0}
												value={advanceApproved}
												onChange={e => setAdvanceApproved(e.target.value)}
												className="w-28 py-1 pr-2 text-xs text-gray-900 focus:outline-none bg-transparent"
												placeholder={String(placeholder)}
											/>
										</div>
									);
								})() : (
									<span className="text-sm font-semibold text-gray-900 tabular-nums">
										{formatAmount(vendor.advance_approved ?? advanceApproved)}
									</span>
								)}
								{isStage1 && (() => {
									const enteredVal = parseFloat(advanceApproved.replace(/,/g, ''));
									const base = vendor.invoiceAmount;
									if (base && base > 0 && !isNaN(enteredVal) && enteredVal > 0) {
										const pct = ((enteredVal / base) * 100).toFixed(1);
										return (
											<span className="text-[10px] text-amber-600">
												{pct}% of invoice ({formatAmount(base)})
											</span>
										);
									}
									return <span className="text-[10px] text-amber-600">Amount you'll approve</span>;
								})()}
							</div>
						)}
						{isActionable && (
							<ApproveRejectButtons
								loading={actionLoading}
								requireOverrunAck={requireAck}
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
						{apCtx && <PaymentBudgetPanel ctx={apCtx} />}
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

// ─── Advance Payments Table ───────────────────────────────────────────────────

function AdvancePaymentsTable({
	rows,
	loading,
	onReceiptUploaded,
	serialOffset,
	showAdvanceBadge = false,
}: {
	rows: AdvancePaymentItem[];
	loading: boolean;
	onReceiptUploaded: (vendorInvoiceId: number) => void;
	serialOffset: number;
	showAdvanceBadge?: boolean;
}) {
	const [paymentModal, setPaymentModal] = useState<{
		vendorInvoiceId: number;
		approvalRowId: number;
		amountApproved: number | null;
		vendorName: string;
		totalReceiptsAmount: number | null;
	} | null>(null);
	const [toast, setToast] = useState<{ msg: string } | null>(null);
	const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const showToast = (msg: string) => {
		setToast({ msg });
		if (toastRef.current) clearTimeout(toastRef.current);
		toastRef.current = setTimeout(() => setToast(null), 4000);
	};

	// IMPORTANT: do NOT early-return here when `loading` is true. The parent
	// re-fetches on window focus, and the native file picker briefly steals focus.
	// If we unmount the table during the refetch, the open `paymentModal` state
	// gets wiped — the user sees the modal disappear and the upload never fires.
	// Show the spinner inline instead so the modal stays mounted.

	return (
		<>
			{paymentModal && (
				<RecordPaymentModal
					vendorInvoiceId={paymentModal.vendorInvoiceId}
					approvalRowId={paymentModal.approvalRowId}
					defaultAmount={paymentModal.amountApproved}
					vendorName={paymentModal.vendorName}
					amountApproved={paymentModal.amountApproved}
					initialTotalReceiptsAmount={paymentModal.totalReceiptsAmount}
					onCancel={() => setPaymentModal(null)}
					onSuccess={() => {
						setPaymentModal(null);
						showToast('Payment recorded successfully.');
						onReceiptUploaded(paymentModal.vendorInvoiceId);
					}}
				/>
			)}
			{toast && (
				<div className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm mb-3 bg-green-50 border border-green-200 text-green-800">
					<CheckCircle2 className="h-4 w-4 shrink-0" /> {toast.msg}
				</div>
			)}
			<div className="overflow-x-auto">
				<table className="w-full border-collapse text-sm">
					<thead>
						<tr className="bg-gray-50 border-b border-gray-200">
							<th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 w-10">#</th>
							<th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Lead</th>
							<th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Client</th>
							<th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Vendor</th>
							<th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500">Requested</th>
							<th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500">Approved</th>
							<th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Progress</th>
							<th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Approved On</th>
							<th className="px-3 py-2.5" />
						</tr>
					</thead>
					<tbody>
						{loading && rows.length === 0 && (
							<tr><td colSpan={9} className="py-16 text-center text-gray-500"><span className="inline-flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</span></td></tr>
						)}
						{!loading && rows.length === 0 && (
							<tr><td colSpan={9} className="py-16 text-center text-gray-400 text-sm">No pending payment receipts.</td></tr>
						)}
						{rows.map((row, idx) => {
							const pct = row.amountApproved && row.amountApproved > 0 && row.totalReceiptsAmount != null
								? Math.min(100, Math.round((row.totalReceiptsAmount / row.amountApproved) * 100))
								: null;
							return (
								<tr key={row.vendorInvoiceId} className="border-b border-gray-100 hover:bg-gray-50">
									<td className="px-3 py-3 text-sm text-gray-500">{serialOffset + idx + 1}</td>
									<td className="px-3 py-3 text-sm text-gray-600">
										<p>{row.leadId}</p>
										{row.city && <p className="text-xs text-gray-400">{row.city}</p>}
									</td>
									<td className="px-3 py-3 text-sm text-gray-900 font-medium">
										<p>{row.client}</p>
										{showAdvanceBadge && (
											<span className="text-[10px] font-semibold uppercase tracking-wide bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
												Advance
											</span>
										)}
									</td>
									<td className="px-3 py-3 text-sm text-gray-800">{row.vendorName}</td>
									<td className="px-3 py-3 text-sm text-gray-500 text-right tabular-nums">{formatAmount(row.amountRequested)}</td>
									<td className="px-3 py-3 text-sm font-semibold text-green-700 text-right tabular-nums">{formatAmount(row.amountApproved)}</td>
									<td className="px-3 py-3 min-w-[160px]">
										{row.amountApproved != null && row.amountApproved > 0 ? (
											<div className="space-y-1">
												<div className="flex items-center justify-between text-xs">
													<span className="tabular-nums text-gray-700">
														{formatAmount(row.totalReceiptsAmount ?? 0)}
														<span className="text-gray-400"> / {formatAmount(row.amountApproved)}</span>
													</span>
													{pct != null && (
														<span className={cn('font-medium ml-1', pct >= 100 ? 'text-green-600' : 'text-gray-500')}>
															{pct}%
														</span>
													)}
												</div>
												<div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
													<div
														className={cn('h-full rounded-full', pct != null && pct >= 100 ? 'bg-green-500' : 'bg-blue-500')}
														style={{ width: `${pct ?? 0}%` }}
													/>
												</div>
												{row.receiptCount != null && row.receiptCount > 0 && (
													<p className="text-[10px] text-gray-400">{row.receiptCount} receipt{row.receiptCount > 1 ? 's' : ''}</p>
												)}
											</div>
										) : <span className="text-xs text-gray-400">—</span>}
									</td>
									<td className="px-3 py-3 text-sm text-gray-500">{formatDate(row.approvedAt)}</td>
									<td className="px-3 py-3 text-right">
										{row.approvalStatus === 'approved' && !row.fullyPaid ? (
											<button
												onClick={() => setPaymentModal({
													vendorInvoiceId: row.vendorInvoiceId,
													approvalRowId: row.approvalRowId,
													amountApproved: row.amountApproved,
													vendorName: row.vendorName,
													totalReceiptsAmount: row.totalReceiptsAmount,
												})}
												className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 border border-green-300 text-green-700 hover:bg-green-100 transition-colors whitespace-nowrap"
											>
												<Upload className="h-3.5 w-3.5" /> Upload Receipt
											</button>
										) : row.receipt?.fileUrl ? (
											<a
												href={row.receipt.fileUrl}
												target="_blank"
												rel="noreferrer"
												className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors whitespace-nowrap"
											>
												<FileText className="h-3.5 w-3.5" /> View Receipt
											</a>
										) : null}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</>
	);
}

type Tab = 'all' | 'pending' | 'advances' | 'payments';

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
	const [pmtAdvanceOnly, setPmtAdvanceOnly] = useState(false);

	// Pending My Approval tab
	const [pendingLeads, setPendingLeads] = useState<PendingApprovalLead[]>([]);
	const [pendingLoading, setPendingLoading] = useState(false);
	const [pendingPage, setPendingPage] = useState(1);
	const [pendingPerPage] = useState(20);
	const [pendingTotal, setPendingTotal] = useState(0);
	const [pendingTotalPages, setPendingTotalPages] = useState(1);

	// Advance Requests tab — all pending advance requests grouped by lead.
	const [advRows, setAdvRows] = useState<PendingApprovalLead[]>([]);
	const [advLoading, setAdvLoading] = useState(false);
	const [advPage, setAdvPage] = useState(1);
	const [advPerPage] = useState(50);
	const [advTotal, setAdvTotal] = useState(0);
	const [advTotalPages, setAdvTotalPages] = useState(1);

	// Payments Pending tab — non-advance invoices awaiting payment confirmation.
	const [pmtRows, setPmtRows] = useState<AdvancePaymentItem[]>([]);
	const [pmtLoading, setPmtLoading] = useState(false);
	const [pmtPage, setPmtPage] = useState(1);
	const [pmtPerPage] = useState(50);
	const [pmtTotal, setPmtTotal] = useState(0);
	const [pmtTotalPages, setPmtTotalPages] = useState(1);

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

	const fetchAdvances = useCallback(async (page: number) => {
		setAdvLoading(true);
		try {
			const res = await ProcurementApiService.getAdvanceRequests({ page, perPage: advPerPage });
			setAdvRows(res?.data ?? []);
			if (res?.pagination) { setAdvTotal(res.pagination.total); setAdvTotalPages(res.pagination.pages); }
		} catch { setAdvRows([]); } finally { setAdvLoading(false); }
	}, [advPerPage]);

	const fetchPaymentsPending = useCallback(async (page: number) => {
		setPmtLoading(true);
		try {
			const res = await ProcurementApiService.getPaymentsPending({ page, perPage: pmtPerPage });
			setPmtRows(res?.data ?? []);
			if (res?.pagination) { setPmtTotal(res.pagination.total); setPmtTotalPages(res.pagination.pages); }
		} catch { setPmtRows([]); } finally { setPmtLoading(false); }
	}, [pmtPerPage]);

	const handleProxyToggle = useCallback(async (next: boolean) => {
		setProxyFlipping(true);
		try {
			const res = await ProcurementApiService.setProxyMode(next);
			const applied = res?.data?.enabled ?? next;
			setProxyActive(applied);
			setPendingPage(1);
			await fetchPending(1);
		} catch {
		} finally {
			setProxyFlipping(false);
		}
	}, [fetchPending]);

	useEffect(() => { fetchAll(allPage); }, [fetchAll, allPage]);
	useEffect(() => { fetchPending(pendingPage); }, [fetchPending, pendingPage]);
	useEffect(() => { fetchAdvances(advPage); }, [fetchAdvances, advPage]);
	useEffect(() => { fetchPaymentsPending(pmtPage); }, [fetchPaymentsPending, pmtPage]);

	useEffect(() => {
		const onFocus = () => {
			void fetchAll(allPage);
			void fetchPending(pendingPage);
			void fetchAdvances(advPage);
			void fetchPaymentsPending(pmtPage);
		};
		window.addEventListener('focus', onFocus);
		return () => window.removeEventListener('focus', onFocus);
	}, [fetchAll, fetchPending, fetchAdvances, fetchPaymentsPending, allPage, pendingPage, advPage, pmtPage]);

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
						totalItems={activeTab === 'all' ? allTotal : activeTab === 'pending' ? pendingTotal : activeTab === 'advances' ? advTotal : pmtTotal}
						itemType={activeTab === 'pending' ? 'leads' : 'invoices'}
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
					{ key: 'advances', label: 'Advance Requests', count: advTotal || undefined },
					{ key: 'payments', label: 'Payment Receipts', count: pmtTotal || undefined },
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
							<span className={cn(
								'ml-2 px-1.5 py-0.5 rounded-full text-xs font-semibold',
								(tab.key === 'advances' || tab.key === 'payments') ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
							)}>
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
						onActionDone={() => { fetchPending(pendingPage); fetchPaymentsPending(pmtPage); }}
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

			{/* Advance Requests Tab — grouped by lead, accordion with approve/reject */}
			{activeTab === 'advances' && (
				<>
					<PendingApprovalList
						leads={advRows}
						loading={advLoading}
						serialOffset={(advPage - 1) * advPerPage}
						onActionDone={() => fetchAdvances(advPage)}
						inProxyMode={false}
					/>
					{advTotalPages > 1 && (
						<Pagination
							currentPage={advPage} totalPages={advTotalPages}
							totalItems={advTotal} itemsPerPage={advPerPage}
							onPageChange={setAdvPage} onItemsPerPageChange={() => {}}
						/>
					)}
				</>
			)}

			{/* Payment Receipts Tab */}
			{activeTab === 'payments' && (
				<>
					<div className="flex items-center gap-3 mb-3">
						<button
							onClick={() => setPmtAdvanceOnly(v => !v)}
							className={cn(
								'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
								pmtAdvanceOnly
									? 'bg-blue-600 border-blue-600 text-white'
									: 'bg-white border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600'
							)}
						>
							<span className={cn('w-2 h-2 rounded-full', pmtAdvanceOnly ? 'bg-white' : 'bg-blue-400')} />
							Advance Only
						</button>
						{pmtAdvanceOnly && (
							<span className="text-xs text-gray-500">
								Showing {pmtRows.filter(r => r.isAdvance).length} advance receipt{pmtRows.filter(r => r.isAdvance).length !== 1 ? 's' : ''}
							</span>
						)}
					</div>
					<div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden p-0">
						<AdvancePaymentsTable
							rows={pmtAdvanceOnly ? pmtRows.filter(r => r.isAdvance) : pmtRows}
							loading={pmtLoading}
							serialOffset={(pmtPage - 1) * pmtPerPage}
							showAdvanceBadge={pmtAdvanceOnly}
							onReceiptUploaded={() => { fetchPaymentsPending(pmtPage); fetchPending(pendingPage); }}
						/>
					</div>
					{pmtTotalPages > 1 && (
						<Pagination
							currentPage={pmtPage} totalPages={pmtTotalPages}
							totalItems={pmtTotal} itemsPerPage={pmtPerPage}
							onPageChange={setPmtPage} onItemsPerPageChange={() => {}}
						/>
					)}
				</>
			)}
		</div>
	);
};

export default VendorInvoiceApprovals;
