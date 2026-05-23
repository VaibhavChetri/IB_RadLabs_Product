/**
 * Slide-over detail view for any Zoho finance record.
 *
 * Three variants:
 *   <ZohoDetailDrawer kind="bill"            id={...} open={...} onClose={...} />
 *   <ZohoDetailDrawer kind="vendor_payment"  id={...} open={...} onClose={...} />
 *   <ZohoDetailDrawer kind="expense"         id={...} open={...} onClose={...} />
 *
 * Renders related records inline (line items, applied payments / settled bills,
 * attachment URLs). Attachments link directly to Zoho Books — we don't store
 * the file bytes.
 */

import React, { useEffect, useState } from 'react';
import { SlideOver, Button } from '../ui';
import { ZohoBillApi } from '../../services/zohoBillApi';
import { ZohoVendorPaymentApi } from '../../services/zohoVendorPaymentApi';
import { ZohoExpenseApi } from '../../services/zohoExpenseApi';
import { ZohoDeepLink, zohoLinkFor } from './financeUtils';
import { ExternalLink, FileText } from 'lucide-react';

type Kind = 'bill' | 'vendor_payment' | 'expense';

interface Props {
	kind: Kind;
	id: number | string | null;
	open: boolean;
	onClose: () => void;
}

const formatINR = (v: any) => {
	const n = parseFloat(String(v ?? 0));
	if (Number.isNaN(n)) return '—';
	return `₹ ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (v: any) => {
	if (!v) return '—';
	try {
		return new Date(v).toLocaleDateString();
	} catch {
		return String(v);
	}
};

export const ZohoDetailDrawer: React.FC<Props> = ({ kind, id, open, onClose }) => {
	const [data, setData] = useState<any | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!open || !id) {
			setData(null);
			setError(null);
			return;
		}
		setLoading(true);
		setError(null);
		const fetcher =
			kind === 'bill'
				? ZohoBillApi.getBillDetail(id)
				: kind === 'vendor_payment'
					? ZohoVendorPaymentApi.getVendorPaymentDetail(id)
					: ZohoExpenseApi.getExpenseDetail(id);

		fetcher
			.then((resp) => setData((resp as any).data))
			.catch((err) => setError(err?.message || 'Failed to load detail'))
			.finally(() => setLoading(false));
	}, [kind, id, open]);

	const title =
		kind === 'bill'
			? 'Bill Detail'
			: kind === 'vendor_payment'
				? 'Vendor Payment Detail'
				: 'Expense Detail';

	return (
		<SlideOver open={open} onClose={onClose} title={title} width='xl'>
			{loading && <div className='py-12 text-center text-gray-500'>Loading…</div>}
			{error && (
				<div className='py-6 text-center text-error'>
					{error}
					<div className='mt-3'>
						<Button variant='outline' onClick={onClose}>
							Close
						</Button>
					</div>
				</div>
			)}
			{!loading && !error && data && kind === 'bill' && <BillDetail data={data} />}
			{!loading && !error && data && kind === 'vendor_payment' && <VendorPaymentDetail data={data} />}
			{!loading && !error && data && kind === 'expense' && <ExpenseDetail data={data} />}
		</SlideOver>
	);
};

// ===========================================================================
// Bill detail
// ===========================================================================
const BillDetail: React.FC<{ data: any }> = ({ data }) => {
	const { bill, line_items, attachments, settled_by_payments } = data;
	return (
		<div className='space-y-6'>
			<HeaderBlock
				title={`Bill ${bill.bill_number || '—'}`}
				subtitle={bill.vendor_name}
				rightLink={zohoLinkFor('bill', bill.zoho_bill_id)}
			/>
			<DefinitionGrid
				rows={[
					['Date', formatDate(bill.date)],
					['Due Date', formatDate(bill.due_date)],
					['Status', bill.status],
					['Total', formatINR(bill.total)],
					['Outstanding', formatINR(bill.balance)],
					['City', bill.cf_city || '—'],
					['Facility', bill.cf_facility || '—'],
					['Facility Type', bill.facility_type || '—'],
					['Business Unit', bill.cf_business_unit || '—'],
					['Nature', bill.cf_nature_of_expense || '—'],
					['Approver', bill.cf_approver || '—'],
					['Reference', bill.reference_number || '—'],
				]}
			/>

			<SectionTitle>Line items ({line_items.length})</SectionTitle>
			{line_items.length === 0 ? (
				<EmptyState>No line items captured (older bill, not enriched).</EmptyState>
			) : (
				<table className='w-full text-sm border border-gray-200 rounded overflow-hidden'>
					<thead className='bg-gray-50 text-left text-gray-600'>
						<tr>
							<th className='px-2 py-2'>Account</th>
							<th className='px-2 py-2'>Category</th>
							<th className='px-2 py-2 text-right'>Qty</th>
							<th className='px-2 py-2 text-right'>Rate</th>
							<th className='px-2 py-2 text-right'>Tax</th>
							<th className='px-2 py-2 text-right'>Total</th>
						</tr>
					</thead>
					<tbody>
						{line_items.map((li: any) => (
							<tr key={li.id} className='border-t border-gray-100'>
								<td className='px-2 py-2'>{li.account_name || li.name || '—'}</td>
								<td className='px-2 py-2 text-gray-500 text-xs'>{li.expense_category || '—'}</td>
								<td className='px-2 py-2 text-right'>{li.quantity ?? '—'}</td>
								<td className='px-2 py-2 text-right'>{formatINR(li.rate)}</td>
								<td className='px-2 py-2 text-right'>{formatINR(li.tax_amount)}</td>
								<td className='px-2 py-2 text-right font-medium'>{formatINR(li.item_total)}</td>
							</tr>
						))}
					</tbody>
				</table>
			)}

			<SectionTitle>Payments that settled this bill ({settled_by_payments.length})</SectionTitle>
			{settled_by_payments.length === 0 ? (
				<EmptyState>No payment has been applied to this bill yet.</EmptyState>
			) : (
				<table className='w-full text-sm border border-gray-200 rounded overflow-hidden'>
					<thead className='bg-gray-50 text-left text-gray-600'>
						<tr>
							<th className='px-2 py-2'>Payment #</th>
							<th className='px-2 py-2'>Date</th>
							<th className='px-2 py-2'>Mode</th>
							<th className='px-2 py-2'>Paid Through</th>
							<th className='px-2 py-2 text-right'>Applied</th>
							<th className='px-2 py-2'></th>
						</tr>
					</thead>
					<tbody>
						{settled_by_payments.map((p: any) => (
							<tr key={p.id} className='border-t border-gray-100'>
								<td className='px-2 py-2 font-medium'>{p.payment_number}</td>
								<td className='px-2 py-2'>{formatDate(p.payment_date)}</td>
								<td className='px-2 py-2'>{p.payment_mode || '—'}</td>
								<td className='px-2 py-2 text-gray-500 text-xs'>{p.paid_through_account_name || '—'}</td>
								<td className='px-2 py-2 text-right'>{formatINR(p.amount_applied)}</td>
								<td className='px-2 py-2'>
									<ZohoDeepLink entity='vendor_payment' zohoId={p.zoho_payment_id} />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}

			<AttachmentsBlock attachments={attachments} />
		</div>
	);
};

// ===========================================================================
// Vendor payment detail
// ===========================================================================
const VendorPaymentDetail: React.FC<{ data: any }> = ({ data }) => {
	const { payment, settled_bills, attachments } = data;
	return (
		<div className='space-y-6'>
			<HeaderBlock
				title={`Payment ${payment.payment_number || '—'}`}
				subtitle={payment.vendor_name}
				rightLink={zohoLinkFor('vendor_payment', payment.zoho_payment_id)}
			/>
			<DefinitionGrid
				rows={[
					['Date', formatDate(payment.payment_date)],
					['Amount', formatINR(payment.amount)],
					['Mode', payment.payment_mode || '—'],
					['Paid Through', payment.paid_through_account_name || '—'],
					['Unused', formatINR(payment.unused_amount)],
					['Reference', payment.reference_number || '—'],
				]}
			/>

			<SectionTitle>Bills settled ({settled_bills.length})</SectionTitle>
			{settled_bills.length === 0 ? (
				<EmptyState>
					No bill is linked to this payment in Zoho — usually an advance / on-account payment.
				</EmptyState>
			) : (
				<table className='w-full text-sm border border-gray-200 rounded overflow-hidden'>
					<thead className='bg-gray-50 text-left text-gray-600'>
						<tr>
							<th className='px-2 py-2'>Bill #</th>
							<th className='px-2 py-2'>Date</th>
							<th className='px-2 py-2'>Vendor</th>
							<th className='px-2 py-2 text-right'>Bill Total</th>
							<th className='px-2 py-2 text-right'>Applied</th>
							<th className='px-2 py-2'></th>
						</tr>
					</thead>
					<tbody>
						{settled_bills.map((b: any) => (
							<tr key={b.junction_id} className='border-t border-gray-100'>
								<td className='px-2 py-2 font-medium'>{b.bill_number}</td>
								<td className='px-2 py-2'>{formatDate(b.date)}</td>
								<td className='px-2 py-2 text-xs'>{b.vendor_name || '—'}</td>
								<td className='px-2 py-2 text-right'>{formatINR(b.total)}</td>
								<td className='px-2 py-2 text-right'>{formatINR(b.amount_applied)}</td>
								<td className='px-2 py-2'>
									<ZohoDeepLink entity='bill' zohoId={b.zoho_bill_id} />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}

			<AttachmentsBlock attachments={attachments} />
		</div>
	);
};

// ===========================================================================
// Expense detail
// ===========================================================================
const ExpenseDetail: React.FC<{ data: any }> = ({ data }) => {
	const { expense, line_items, attachments } = data;
	return (
		<div className='space-y-6'>
			<HeaderBlock
				title={expense.expense_account_name || 'Expense'}
				subtitle={expense.vendor_name || expense.customer_name || '—'}
				rightLink={zohoLinkFor('expense', expense.zoho_expense_id)}
			/>
			<DefinitionGrid
				rows={[
					['Date', formatDate(expense.date)],
					['Amount', formatINR(expense.total)],
					['Category', expense.expense_category || '—'],
					['Account', expense.expense_account_name || '—'],
					['Paid Through', expense.paid_through_account_name || '—'],
					['City', expense.cf_city || expense.derived_city || '—'],
					['Facility', expense.cf_facility || '—'],
					['Facility Type', expense.facility_type || expense.derived_facility_type || '—'],
					['Business Unit', expense.cf_business_unit || '—'],
					['Submitter', expense.cf_submitter || '—'],
					['Description', expense.description || '—'],
				]}
			/>

			{line_items.length > 0 && (
				<>
					<SectionTitle>Line items ({line_items.length})</SectionTitle>
					<table className='w-full text-sm border border-gray-200 rounded overflow-hidden'>
						<thead className='bg-gray-50 text-left text-gray-600'>
							<tr>
								<th className='px-2 py-2'>Account</th>
								<th className='px-2 py-2'>Description</th>
								<th className='px-2 py-2 text-right'>Tax</th>
								<th className='px-2 py-2 text-right'>Amount</th>
							</tr>
						</thead>
						<tbody>
							{line_items.map((li: any) => (
								<tr key={li.id} className='border-t border-gray-100'>
									<td className='px-2 py-2'>{li.account_name || '—'}</td>
									<td className='px-2 py-2 text-gray-500 text-xs'>{li.description || '—'}</td>
									<td className='px-2 py-2 text-right'>{formatINR(li.tax_amount)}</td>
									<td className='px-2 py-2 text-right font-medium'>{formatINR(li.amount)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</>
			)}

			<AttachmentsBlock attachments={attachments} />
		</div>
	);
};

// ===========================================================================
// Shared sub-blocks
// ===========================================================================

const HeaderBlock: React.FC<{ title: string; subtitle?: string; rightLink?: string | null }> = ({
	title,
	subtitle,
	rightLink,
}) => (
	<div className='flex items-start justify-between'>
		<div>
			<div className='text-xl font-semibold text-gray-900'>{title}</div>
			{subtitle && <div className='text-sm text-gray-600 mt-0.5'>{subtitle}</div>}
		</div>
		{rightLink && (
			<a
				href={rightLink}
				target='_blank'
				rel='noopener noreferrer'
				className='text-sm text-success-700 inline-flex items-center gap-1 hover:underline'
			>
				Open in Zoho <ExternalLink className='w-3.5 h-3.5' />
			</a>
		)}
	</div>
);

const DefinitionGrid: React.FC<{ rows: Array<[string, React.ReactNode]> }> = ({ rows }) => (
	<dl className='grid grid-cols-2 gap-x-6 gap-y-2 text-sm border border-gray-200 rounded p-3'>
		{rows.map(([k, v], i) => (
			<div key={i} className='flex justify-between gap-2'>
				<dt className='text-gray-500'>{k}</dt>
				<dd className='text-gray-900 text-right break-words'>{v}</dd>
			</div>
		))}
	</dl>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<div className='text-sm font-semibold text-gray-900 mt-4'>{children}</div>
);

const EmptyState: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<div className='text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded p-4 text-center'>
		{children}
	</div>
);

const AttachmentsBlock: React.FC<{ attachments: any[] }> = ({ attachments }) => {
	if (!attachments || attachments.length === 0) {
		return (
			<>
				<SectionTitle>Attachments (0)</SectionTitle>
				<EmptyState>No attachments referenced in Zoho for this record.</EmptyState>
			</>
		);
	}
	return (
		<>
			<SectionTitle>Attachments ({attachments.length})</SectionTitle>
			<ul className='space-y-1 text-sm'>
				{attachments.map((a) => (
					<li key={a.id} className='flex items-center gap-2'>
						<FileText className='w-4 h-4 text-gray-400 flex-shrink-0' />
						<span className='truncate flex-1'>{a.file_name || '(unnamed)'}</span>
						{a.file_size ? (
							<span className='text-xs text-gray-400 flex-shrink-0'>
								{Math.round(Number(a.file_size) / 1024)} KB
							</span>
						) : null}
						<span className='text-xs text-gray-400 flex-shrink-0'>
							{a.zoho_download_path ? `(fetch via ${a.zoho_download_path})` : ''}
						</span>
					</li>
				))}
			</ul>
			<div className='text-xs text-gray-500 mt-2'>
				We don't store the file bytes — to view the actual document, open the record in Zoho Books via the
				"Open in Zoho" link above.
			</div>
		</>
	);
};
