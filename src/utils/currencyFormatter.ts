/**
 * Indian-style ₹ currency formatting.
 *
 * Examples:
 *   formatINR(123456.78)        → "₹1,23,457"
 *   formatINR(-51019.8)         → "-₹51,020"
 *   formatINR(0)                → "₹0"
 *   formatINR(null)             → "—"
 *   formatINR(123456, { withPaise: true })       → "₹1,23,456.00"
 *   formatINR(45000, { compact: true })          → "₹45.0K"
 *   formatINRDelta(-5000)       → "-₹5,000" (always signed)
 *   formatPct(-21.86)           → "-21.86%"
 *   formatPct(null)             → "—"
 *
 * Uses Intl.NumberFormat('en-IN') for the comma grouping.
 */

interface FormatINROptions {
	withPaise?: boolean;
	compact?: boolean; // K / L / Cr
}

export const formatINR = (value: number | null | undefined, opts: FormatINROptions = {}): string => {
	if (value == null || !Number.isFinite(Number(value))) return '—';
	const n = Number(value);

	if (opts.compact) {
		const abs = Math.abs(n);
		const sign = n < 0 ? '-' : '';
		if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(1)}Cr`;
		if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(1)}L`;
		if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1)}K`;
		return `${sign}₹${Math.round(abs)}`;
	}

	const formatter = new Intl.NumberFormat('en-IN', {
		minimumFractionDigits: opts.withPaise ? 2 : 0,
		maximumFractionDigits: opts.withPaise ? 2 : 0,
	});
	const abs = formatter.format(Math.abs(n));
	return n < 0 ? `-₹${abs}` : `₹${abs}`;
};

/** Like formatINR but always shows the sign (+ or -). Useful for deltas. */
export const formatINRDelta = (value: number | null | undefined, opts: FormatINROptions = {}): string => {
	if (value == null || !Number.isFinite(Number(value))) return '—';
	const n = Number(value);
	if (n === 0) return '₹0';
	const formatted = formatINR(Math.abs(n), opts);
	return n > 0 ? `+${formatted}` : `-${formatted}`;
};

export const formatPct = (value: number | null | undefined, fractionDigits = 2): string => {
	if (value == null || !Number.isFinite(Number(value))) return '—';
	const n = Number(value);
	const sign = n > 0 ? '+' : '';
	return `${sign}${n.toFixed(fractionDigits)}%`;
};

/** Format a YYYY-MM string as "Mon YYYY" — e.g. "2026-04" → "Apr 2026". */
export const formatMonthLabel = (yyyymm: string | null | undefined): string => {
	if (!yyyymm) return '';
	const parts = yyyymm.split('-');
	if (parts.length !== 2) return yyyymm;
	const [y, m] = parts.map(Number);
	const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const monthName = names[m - 1];
	if (!monthName) return yyyymm;
	return `${monthName} ${y}`;
};
