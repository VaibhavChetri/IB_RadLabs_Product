/**
 * Pure formatters and helpers for the Follow-Up Tracker.
 * Kept side-effect free so the table renders predictably.
 */

export const formatINR = (amount: number): string => {
	return new Intl.NumberFormat('en-IN', {
		style: 'currency',
		currency: 'INR',
		maximumFractionDigits: 0,
	}).format(amount);
};

export const formatINRCompact = (amount: number): string => {
	if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
	if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
	if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
	return `₹${amount.toFixed(0)}`;
};

export const formatDate = (iso: string): string => {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleDateString('en-IN', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	});
};

export const formatRelativeContact = (
	lastMessageAt: string | null,
	daysSince: number | null
): string => {
	if (!lastMessageAt || daysSince === null) return 'No contact yet';
	if (daysSince === 0) return 'Today';
	if (daysSince === 1) return 'Yesterday';
	if (daysSince < 7) return `${daysSince} days ago`;
	if (daysSince < 14) return `1 week ago`;
	if (daysSince < 30) return `${Math.floor(daysSince / 7)} weeks ago`;
	return `${Math.floor(daysSince / 30)} months ago`;
};

export const formatDateTime = (iso: string | null): string => {
	if (!iso) return '—';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleString('en-IN', {
		day: '2-digit',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
		hour12: true,
	});
};

/** Concise pluralizer that avoids the "1 invoices" gotcha. */
export const pluralize = (count: number, singular: string, plural?: string): string =>
	`${count} ${count === 1 ? singular : plural || singular + 's'}`;

/**
 * Pull every IB-style invoice number out of one or more text blobs. Used to
 * figure out which customer-history invoices are actually referenced in the
 * AI summary / next-action / action items of the row being expanded, so the
 * rollup chip strip can default to "related to this conversation" instead of
 * showing every invoice the customer has ever raised.
 *
 * Pattern matches our canonical Zoho number format: `IB-YYYY-YY/####`.
 * Lenient on the trailing digit count (3-6) to accommodate any future drift.
 */
export const extractInvoiceNumbers = (...texts: Array<string | null | undefined>): Set<string> => {
	const re = /IB-\d{4}-\d{2}\/\d{3,6}/g;
	const found = new Set<string>();
	for (const t of texts) {
		if (!t) continue;
		const matches = t.match(re);
		if (matches) {
			for (const m of matches) found.add(m);
		}
	}
	return found;
};
