/**
 * Amazon Invoice Detail – single invoice with full party info, financials, and line items
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader, Button } from '../../components/ui';
import { AmazonInvoicesApiService } from '../../services/amazonInvoicesApi';
import type { AmazonInvoiceDetail as AmazonInvoiceDetailType } from '../../services/amazonInvoicesApi';
import { ArrowLeft, Loader2 } from 'lucide-react';

const fmt = (v: number | string | null | undefined) =>
	`₹${Number(v ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const AmazonInvoiceDetail: React.FC = () => {
	const { invoiceNumber } = useParams<{ invoiceNumber: string }>();
	const navigate = useNavigate();
	const [detail, setDetail] = useState<AmazonInvoiceDetailType | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!invoiceNumber) {
			setError('Invoice number is missing.');
			setLoading(false);
			return;
		}
		let cancelled = false;
		const fetchDetail = async () => {
			setLoading(true);
			setError(null);
			try {
				const res = await AmazonInvoicesApiService.getInvoiceByNumber(invoiceNumber);
				if (res?.data && !cancelled) {
					setDetail(res.data);
				} else if (!cancelled) {
					setError('Invoice not found.');
				}
			} catch (e: unknown) {
				if (!cancelled) {
					const msg = e && typeof e === 'object' && 'message' in e
						? String((e as { message: string }).message)
						: 'Failed to load invoice.';
					setError(msg);
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		fetchDetail();
		return () => { cancelled = true; };
	}, [invoiceNumber]);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[200px]">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	if (error || !detail) {
		return (
			<div className="space-y-4">
				<Button variant="outline" size="md" onClick={() => navigate('/finances/amazon-invoice')}>
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back to list
				</Button>
				<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
					{error || 'Invoice not found.'}
				</div>
			</div>
		);
	}

	const { invoice, line_items } = detail;

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between">
				<PageHeader
					title={invoice.invoice_number}
					locationName="Amazon Invoice"
					totalItems={line_items?.length ?? 0}
					itemType="line items"
				/>
				<Button variant="outline" size="md" onClick={() => navigate('/finances/amazon-invoice')}>
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back to list
				</Button>
			</div>

			{/* Parties */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div className="bg-white rounded-lg border border-gray-200 p-4">
					<p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Seller / Ship From</p>
					<p className="text-sm font-semibold text-gray-900">{invoice.sold_by || invoice.seller_name || '—'}</p>
					{invoice.sold_by_gstin && <p className="text-xs text-gray-500 mt-1">GSTIN: {invoice.sold_by_gstin}</p>}
					{invoice.pan_number && <p className="text-xs text-gray-500">PAN: {invoice.pan_number}</p>}
					{invoice.ship_from_address && <p className="text-xs text-gray-400 mt-2 leading-relaxed">{invoice.ship_from_address}</p>}
				</div>
				<div className="bg-white rounded-lg border border-gray-200 p-4">
					<p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Billed To</p>
					<p className="text-sm font-semibold text-gray-900">{invoice.billing_name || '—'}</p>
					{invoice.billing_gstin && <p className="text-xs text-gray-500 mt-1">GSTIN: {invoice.billing_gstin}</p>}
					{invoice.billing_address && <p className="text-xs text-gray-400 mt-2 leading-relaxed">{invoice.billing_address}</p>}
				</div>
				<div className="bg-white rounded-lg border border-gray-200 p-4">
					<p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Shipped To</p>
					<p className="text-sm font-semibold text-gray-900">{invoice.shipping_name || '—'}</p>
					{invoice.shipping_address && <p className="text-xs text-gray-400 mt-2 leading-relaxed">{invoice.shipping_address}</p>}
				</div>
			</div>

			{/* Invoice summary */}
			<div className="bg-white rounded-lg border border-gray-200 p-5">
				<h3 className="text-sm font-semibold text-gray-700 mb-4">Invoice Details</h3>
				<dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 text-sm">
					<dt className="text-gray-500">Invoice #</dt>
					<dd className="font-medium text-gray-900">{invoice.invoice_number}</dd>

					<dt className="text-gray-500">Order ID</dt>
					<dd className="font-medium text-gray-900">{invoice.order_id ?? '—'}</dd>

					{invoice.invoice_date && (
						<>
							<dt className="text-gray-500">Invoice Date</dt>
							<dd className="font-medium text-gray-900">{invoice.invoice_date}</dd>
						</>
					)}
					{invoice.order_date && (
						<>
							<dt className="text-gray-500">Order Date</dt>
							<dd className="font-medium text-gray-900">{invoice.order_date}</dd>
						</>
					)}
					{invoice.document_type && (
						<>
							<dt className="text-gray-500">Document Type</dt>
							<dd className="font-medium text-gray-900">{invoice.document_type}</dd>
						</>
					)}
					{invoice.payment_method && (
						<>
							<dt className="text-gray-500">Payment</dt>
							<dd className="font-medium text-gray-900">{invoice.payment_method}</dd>
						</>
					)}

					{/* Financials */}
					{invoice.subtotal != null && (
						<>
							<dt className="text-gray-500">Subtotal</dt>
							<dd className="font-medium text-gray-900">{fmt(invoice.subtotal)}</dd>
						</>
					)}
					{invoice.total_discount != null && (
						<>
							<dt className="text-gray-500">Discount</dt>
							<dd className="font-medium text-gray-900">{fmt(invoice.total_discount)}</dd>
						</>
					)}
					{invoice.shipping_charges != null && (
						<>
							<dt className="text-gray-500">Shipping</dt>
							<dd className="font-medium text-gray-900">{fmt(invoice.shipping_charges)}</dd>
						</>
					)}
					{invoice.igst_amount != null && (
						<>
							<dt className="text-gray-500">IGST{invoice.igst_rate != null ? ` (${invoice.igst_rate}%)` : ''}</dt>
							<dd className="font-medium text-gray-900">{fmt(invoice.igst_amount)}</dd>
						</>
					)}
					{invoice.cgst_amount != null && (
						<>
							<dt className="text-gray-500">CGST{invoice.cgst_rate != null ? ` (${invoice.cgst_rate}%)` : ''}</dt>
							<dd className="font-medium text-gray-900">{fmt(invoice.cgst_amount)}</dd>
						</>
					)}
					{invoice.sgst_amount != null && (
						<>
							<dt className="text-gray-500">SGST{invoice.sgst_rate != null ? ` (${invoice.sgst_rate}%)` : ''}</dt>
							<dd className="font-medium text-gray-900">{fmt(invoice.sgst_amount)}</dd>
						</>
					)}
					<dt className="text-gray-500 font-semibold">Grand Total</dt>
					<dd className="font-bold text-gray-900 text-base">{fmt(invoice.grand_total)}</dd>

					{invoice.irn && (
						<>
							<dt className="text-gray-500">IRN</dt>
							<dd className="font-medium text-gray-900 break-all text-xs col-span-3">{invoice.irn}</dd>
						</>
					)}
				</dl>
			</div>

			{/* Line items */}
			<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
				<h3 className="px-5 py-3 border-b border-gray-200 font-semibold text-sm text-gray-800">
					Line Items ({line_items?.length ?? 0})
				</h3>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="bg-gray-50 border-b border-gray-200">
								<th className="px-4 py-2.5 text-left font-semibold text-gray-600">Description</th>
								<th className="px-4 py-2.5 text-left font-semibold text-gray-600 w-32">ASIN / HSN</th>
								<th className="px-4 py-2.5 text-right font-semibold text-gray-600 w-16">Qty</th>
								<th className="px-4 py-2.5 text-right font-semibold text-gray-600 w-32">Unit Price (₹)</th>
								<th className="px-4 py-2.5 text-right font-semibold text-gray-600 w-24">Tax</th>
								<th className="px-4 py-2.5 text-right font-semibold text-gray-600 w-32">Total (₹)</th>
							</tr>
						</thead>
						<tbody>
							{(line_items ?? []).map((item) => (
								<tr key={item.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
									<td className="px-4 py-3 text-gray-900">{item.description || '—'}</td>
									<td className="px-4 py-3 text-gray-500 text-xs">
										{item.asin && <div className="font-medium">{item.asin}</div>}
										{item.hsn_code && <div>HSN: {item.hsn_code}</div>}
										{item.seller_sku && <div>SKU: {item.seller_sku}</div>}
									</td>
									<td className="px-4 py-3 text-right text-gray-700">{Number(item.quantity ?? 0).toLocaleString('en-IN')}</td>
									<td className="px-4 py-3 text-right text-gray-700">{fmt(item.unit_price)}</td>
									<td className="px-4 py-3 text-right text-gray-500 text-xs">
										{item.tax_rate != null ? `${item.tax_rate}%` : '—'}
										{item.tax_amount != null && <div>{fmt(item.tax_amount)}</div>}
									</td>
									<td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(item.total_amount)}</td>
								</tr>
							))}
						</tbody>
					</table>
					{(line_items?.length ?? 0) === 0 && (
						<div className="px-4 py-8 text-center text-gray-500">No line items.</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default AmazonInvoiceDetail;
