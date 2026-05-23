/**
 * Shared utilities for the Zoho finance verification pages:
 *   - downloadCsv()   convert a list of row objects to CSV and trigger a download
 *   - zohoLinkFor()   build a "View in Zoho Books" URL for any record
 *   - FinanceBriefButton    floating-style button that opens the brief modal
 *   - ZohoDeepLink   the small inline icon used inside each table row
 */

import React, { useState } from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';
import { Button } from '../ui';
import { FinanceBriefModal, isBriefSeen } from './FinanceBriefModal';

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

const escapeCsvCell = (val: any): string => {
	if (val === null || val === undefined) return '';
	const s = typeof val === 'object' ? JSON.stringify(val) : String(val);
	// Wrap in quotes if it contains a comma / quote / newline; double up internal quotes
	if (/[",\n\r]/.test(s)) {
		return `"${s.replace(/"/g, '""')}"`;
	}
	return s;
};

/**
 * Convert a list of rows to CSV and trigger a browser download.
 *
 *   downloadCsv('zoho_bills_2026.csv', rows, [
 *     { key: 'bill_number', label: 'Bill #' },
 *     { key: 'vendor_name', label: 'Vendor' },
 *     ...
 *   ]);
 */
export const downloadCsv = <T extends Record<string, any>>(
	filename: string,
	rows: T[],
	columns: Array<{ key: string; label: string; format?: (v: any, row: T) => any }>
) => {
	const header = columns.map((c) => escapeCsvCell(c.label)).join(',');
	const lines = rows.map((row) =>
		columns
			.map((c) => {
				const raw = c.format ? c.format(row[c.key], row) : row[c.key];
				return escapeCsvCell(raw);
			})
			.join(',')
	);
	const csv = '﻿' + [header, ...lines].join('\n'); // BOM so Excel reads UTF-8
	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
};

// ---------------------------------------------------------------------------
// Zoho Books deep links
// ---------------------------------------------------------------------------

// Hardcoded org id matches what the backend uses for imports.
const ZOHO_ORG_ID = '60018228627';
const ZOHO_BASE = 'https://books.zoho.in/app/60018228627';

export type ZohoEntity = 'invoice' | 'customer_payment' | 'bill' | 'vendor_payment' | 'expense';

const ENTITY_PATH: Record<ZohoEntity, string> = {
	invoice:          'invoices',
	customer_payment: 'customerpayments',
	bill:             'bills',
	vendor_payment:   'vendorpayments',
	expense:          'expenses',
};

export const zohoLinkFor = (entity: ZohoEntity, zohoId?: string | null): string | null => {
	if (!zohoId) return null;
	return `${ZOHO_BASE}#/${ENTITY_PATH[entity]}/${zohoId}`;
};

export const ZohoDeepLink: React.FC<{ entity: ZohoEntity; zohoId?: string | null; label?: string }> = ({
	entity,
	zohoId,
	label = 'Open in Zoho',
}) => {
	const url = zohoLinkFor(entity, zohoId);
	if (!url) return null;
	return (
		<a
			href={url}
			target='_blank'
			rel='noopener noreferrer'
			title={label}
			className='inline-flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 text-gray-500 hover:text-success-600'
			onClick={(e) => e.stopPropagation()}
		>
			<ExternalLink className='w-3.5 h-3.5' />
		</a>
	);
};

// Make sure the org id is exported in case any future caller needs to construct
// a URL we haven't enumerated above.
export { ZOHO_ORG_ID };

// ---------------------------------------------------------------------------
// Finance Brief launcher
// ---------------------------------------------------------------------------

export const FinanceBriefButton: React.FC = () => {
	const [open, setOpen] = useState(false);
	const [seen, setSeen] = useState(() => isBriefSeen());

	return (
		<>
			<Button
				variant='outline'
				onClick={() => {
					setOpen(true);
					setSeen(true);
				}}
				className='relative'
			>
				<BookOpen className='w-4 h-4 mr-2' />
				Finance Brief
				{!seen && (
					<span className='absolute -top-1 -right-1 w-2.5 h-2.5 bg-warning-500 rounded-full animate-pulse' />
				)}
			</Button>
			<FinanceBriefModal open={open} onClose={() => setOpen(false)} />
		</>
	);
};
