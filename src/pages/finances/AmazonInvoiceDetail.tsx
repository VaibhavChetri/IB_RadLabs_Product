/**
 * Amazon Invoice Detail – single invoice with line items
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader, Button, Table } from '../../components/ui';
import { AmazonInvoicesApiService } from '../../services/amazonInvoicesApi';
import type { AmazonInvoiceDetail as AmazonInvoiceDetailType } from '../../services/amazonInvoicesApi';
import type { TableColumn } from '../../components/ui/DataDisplay';
import { ArrowLeft, Loader2 } from 'lucide-react';

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
		return () => {
			cancelled = true;
		};
	}, [invoiceNumber]);

	const lineItemColumns: TableColumn<Record<string, unknown>>[] = [
		{ key: 'description', title: 'Description', width: '40%', align: 'left' },
		{
			key: 'quantity',
			title: 'Qty',
			width: '80px',
			align: 'right',
			render: (_, row) => Number(row.quantity ?? 0).toLocaleString('en-IN'),
		},
		{
			key: 'unit_price',
			title: 'Unit Price (₹)',
			width: '120px',
			align: 'right',
			render: (_, row) =>
				`₹${Number(row.unit_price ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
		},
		{
			key: 'total_amount',
			title: 'Total (₹)',
			width: '120px',
			align: 'right',
			render: (_, row) =>
				`₹${Number(row.total_amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
		},
	];

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
		<div className="space-y-6">
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

			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
				<h3 className="text-sm font-semibold text-gray-700">Invoice summary</h3>
				<dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
					<dt className="text-gray-500">Order ID</dt>
					<dd className="font-medium">{invoice.order_id ?? '—'}</dd>
					<dt className="text-gray-500">Grand Total</dt>
					<dd className="font-medium">
						₹{Number(invoice.grand_total ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
					</dd>
					{invoice.igst_amount != null && (
						<>
							<dt className="text-gray-500">IGST</dt>
							<dd className="font-medium">
								₹{Number(invoice.igst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
							</dd>
						</>
					)}
					{invoice.shipping_charges != null && (
						<>
							<dt className="text-gray-500">Shipping</dt>
							<dd className="font-medium">
								₹{Number(invoice.shipping_charges).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
							</dd>
						</>
					)}
				</dl>
			</div>

			<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
				<h3 className="px-4 py-3 border-b border-gray-200 font-semibold text-gray-800">Line items</h3>
				<Table
					columns={lineItemColumns}
					data={line_items ?? []}
					loading={false}
					emptyText="No line items."
				/>
			</div>
		</div>
	);
};

export default AmazonInvoiceDetail;
