/**
 * Billing helpers — INR formatting, relative dates, composite risk score,
 * and slug for routing. Pure functions, no React.
 *
 * Used by every billing page. Import as:
 *   import { fmtINR, daysAgo, riskScore, slug } from '@/utils/billing';
 */

import type { HealthCustomer } from '../services/clientHealthApi';

// ── INR formatting ─────────────────────────────────────────────────────
// 'full' → ₹2,98,02,604 (Indian comma grouping)
// 'short' → ₹2.98 Cr / ₹86.5 L / ₹4.5k
export function fmtINR(n: number | null | undefined, mode: 'full' | 'short' = 'full'): string {
	if (n == null || isNaN(n)) return '—';
	if (mode === 'short') {
		const abs = Math.abs(n);
		if (abs >= 1e7) return '₹' + (n / 1e7).toFixed(2).replace(/\.?0+$/, '') + ' Cr';
		if (abs >= 1e5) return '₹' + (n / 1e5).toFixed(2).replace(/\.?0+$/, '') + ' L';
		if (abs >= 1e3) return '₹' + (n / 1e3).toFixed(1).replace(/\.?0+$/, '') + 'k';
		return '₹' + Math.round(n);
	}
	const s = Math.round(Math.abs(n)).toString();
	const last3 = s.slice(-3);
	const rest = s.slice(0, -3);
	const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3 : last3;
	return (n < 0 ? '-' : '') + '₹' + grouped;
}

// ── Relative dates ─────────────────────────────────────────────────────
export function daysAgo(iso: string | null | undefined): number | null {
	if (!iso) return null;
	const d = new Date(iso);
	if (isNaN(+d)) return null;
	return Math.floor((Date.now() - +d) / 86400000);
}

export function fmtRelativeDate(iso: string | null | undefined): string {
	const d = daysAgo(iso);
	if (d == null) return '—';
	if (d === 0) return 'today';
	if (d === 1) return '1d ago';
	if (d < 30) return `${d}d ago`;
	if (d < 365) return `${Math.floor(d / 30)}mo ago`;
	return `${Math.floor(d / 365)}y ago`;
}

export function fmtAbsDate(iso: string | null | undefined): string {
	if (!iso) return '—';
	const d = new Date(iso);
	if (isNaN(+d)) return '—';
	return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ── Composite risk score ───────────────────────────────────────────────
// 0–100. Tunable weights below; tweak if backend ships its own version.
// Inputs are all already on HealthCustomer.
export function riskScore(c: HealthCustomer): number {
	const overdueWeight = Math.min(50, (c.overdue_balance / 100000) * 0.5); // ₹1L = 0.5 pt, cap 50
	const brokenWeight = Math.min(30, c.broken_commitment_count * 3);       // each broken = 3 pt, cap 30
	const highPriWeight = Math.min(15, c.high_priority_count * 0.5);        // cap 15
	const responseWeight = c.threads
		.map(t => t.our_avg_response_days ?? 0)
		.reduce((s, x) => s + Math.min(2, x * 0.3), 0); // slow our-response adds up
	const noThreadPenalty = c.thread_count === 0 && c.total_outstanding > 0 ? 25 : 0;
	return Math.min(100, Math.round(
		overdueWeight + brokenWeight + highPriWeight + responseWeight + noThreadPenalty
	));
}

export function riskTone(score: number): 'risk' | 'warn' | 'ink' {
	if (score >= 80) return 'risk';
	if (score >= 60) return 'warn';
	return 'ink';
}

export function riskBucket(score: number): 'High' | 'Mid' | 'Low' {
	if (score >= 80) return 'High';
	if (score >= 60) return 'Mid';
	return 'Low';
}

// ── Frequent breaker flag ──────────────────────────────────────────────
// Returns true if the customer has crossed our threshold (≥10 broken in
// recent activity). Tune threshold here.
export function isFrequentBreaker(c: HealthCustomer): boolean {
	return c.broken_commitment_count >= 10;
}

// ── URL slug from customer name (for /billing/clients/:slug) ───────────
export function slug(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}
