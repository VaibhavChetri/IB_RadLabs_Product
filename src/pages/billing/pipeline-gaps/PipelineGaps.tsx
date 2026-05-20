/**
 * Pipeline Blindspot — FY 2025-26 invoiced clients with no email thread coverage.
 * Highlights revenue we are billing but have zero conversation trail for.
 */

import React, { useEffect, useState } from 'react';
import { RefreshCw, Eye, EyeOff, Search } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { PipelineGapsApi, type PipelineCustomer, type FySummary } from '../../../services/pipelineGapsApi';

const INR = (n: number) =>
	'₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

const fmtDate = (d: string | null) =>
	d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—';

// Simple horizontal bar proportional to maxValue
const Bar: React.FC<{ value: number; max: number; cls?: string }> = ({ value, max, cls = 'bg-primary' }) => (
	<div className="h-2 w-full bg-border rounded-full overflow-hidden">
		<div
			className={cn('h-full rounded-full transition-all', cls)}
			style={{ width: max > 0 ? `${Math.min(100, (value / max) * 100)}%` : '0%' }}
		/>
	</div>
);

const PipelineGaps: React.FC = () => {
	const [fySummary, setFySummary] = useState<FySummary[]>([]);
	const [customers, setCustomers] = useState<PipelineCustomer[]>([]);
	const [summary, setSummary] = useState<{
		total_customers: number;
		customers_with_coverage: number;
		customers_without_coverage: number;
		total_invoiced: number;
		total_outstanding: number;
		untracked_revenue: number;
	} | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [search, setSearch] = useState('');
	const [coverageFilter, setCoverageFilter] = useState<'all' | 'tracked' | 'untracked'>('all');

	const load = () => {
		setLoading(true);
		setError(null);
		PipelineGapsApi.list()
			.then(res => {
				setFySummary(res.fy_summary);
				setCustomers(res.customers);
				setSummary(res.summary);
			})
			.catch(e => setError(e?.message ?? 'Failed to load'))
			.finally(() => setLoading(false));
	};

	useEffect(() => { load(); }, []);

	const maxFyRevenue = Math.max(...fySummary.map(f => f.total_invoiced), 1);

	const filtered = customers.filter(c => {
		if (search && !c.customer_name.toLowerCase().includes(search.toLowerCase())) return false;
		if (coverageFilter === 'tracked'   && !c.has_thread_coverage) return false;
		if (coverageFilter === 'untracked' &&  c.has_thread_coverage) return false;
		return true;
	});

	return (
		<div className="p-6 max-w-7xl mx-auto">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-xl font-bold text-foreground">Pipeline Blindspot</h1>
					<p className="text-sm text-foreground-muted mt-1">
						FY 2025-26 invoiced clients — which ones have zero email thread coverage and are invisible to follow-up.
					</p>
				</div>
				<button
					onClick={load}
					disabled={loading}
					className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-border hover:bg-primary/5 disabled:opacity-50"
				>
					<RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
					Refresh
				</button>
			</div>

			{/* Stats */}
			{summary && (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
					{[
						{ label: 'FY25-26 Clients',   value: summary.total_customers,            cls: 'text-foreground' },
						{ label: 'Email Tracked',      value: summary.customers_with_coverage,    cls: 'text-green-600' },
						{ label: 'No Email Trail',     value: summary.customers_without_coverage, cls: 'text-red-600' },
						{ label: 'Total Revenue',      value: INR(summary.total_invoiced),        cls: 'text-foreground' },
						{ label: 'Outstanding',        value: INR(summary.total_outstanding),     cls: 'text-red-600' },
						{ label: 'Untracked Revenue',  value: INR(summary.untracked_revenue),     cls: 'text-orange-600' },
					].map(s => (
						<div key={s.label} className="rounded-xl border border-border bg-background p-3">
							<p className="text-xs text-foreground-muted">{s.label}</p>
							<p className={cn('text-lg font-bold mt-1', s.cls)}>{s.value}</p>
						</div>
					))}
				</div>
			)}

			{/* FY Revenue Trend */}
			{fySummary.length > 0 && (
				<div className="rounded-xl border border-border bg-background p-5 mb-6">
					<h2 className="text-sm font-semibold text-foreground mb-4">Revenue by Financial Year</h2>
					<div className="space-y-3">
						{fySummary.filter(f => f.fy !== 'Earlier').map(f => (
							<div key={f.fy} className="grid grid-cols-[80px_1fr_120px] items-center gap-3">
								<span className="text-xs font-medium text-foreground-muted">{f.fy}</span>
								<div className="space-y-1">
									<Bar value={f.total_invoiced} max={maxFyRevenue} cls="bg-primary/70" />
									<Bar value={f.total_paid}     max={maxFyRevenue} cls="bg-green-400" />
								</div>
								<div className="text-right">
									<p className="text-xs font-bold text-foreground">{INR(f.total_invoiced)}</p>
									<p className="text-xs text-green-600">Paid: {INR(f.total_paid)}</p>
									{f.total_outstanding > 0 && (
										<p className="text-xs text-red-600">Bal: {INR(f.total_outstanding)}</p>
									)}
								</div>
							</div>
						))}
					</div>
					<div className="flex items-center gap-4 mt-3 text-xs text-foreground-muted">
						<span className="flex items-center gap-1.5"><span className="inline-block h-2 w-4 rounded bg-primary/70" /> Invoiced</span>
						<span className="flex items-center gap-1.5"><span className="inline-block h-2 w-4 rounded bg-green-400" /> Paid</span>
					</div>
				</div>
			)}

			{/* Filters */}
			<div className="flex gap-3 mb-5 flex-wrap">
				<div className="relative flex-1 min-w-48">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
					<input
						type="text"
						placeholder="Search client..."
						value={search}
						onChange={e => setSearch(e.target.value)}
						className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
					/>
				</div>
				<select
					value={coverageFilter}
					onChange={e => setCoverageFilter(e.target.value as 'all' | 'tracked' | 'untracked')}
					className="text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none"
				>
					<option value="all">All clients</option>
					<option value="untracked">No email trail</option>
					<option value="tracked">Email tracked</option>
				</select>
			</div>

			{/* Loading / Error */}
			{loading && (
				<div className="flex items-center justify-center py-20 text-foreground-muted">
					<RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading...
				</div>
			)}
			{error && (
				<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
			)}

			{/* Table */}
			{!loading && !error && (
				<div className="rounded-xl border border-border overflow-hidden">
					<table className="w-full text-sm">
						<thead className="bg-primary/5 text-foreground-muted text-xs uppercase tracking-wide">
							<tr>
								<th className="text-left px-4 py-3">Client</th>
								<th className="text-right px-4 py-3">Revenue FY25-26</th>
								<th className="text-right px-4 py-3">Outstanding</th>
								<th className="text-right px-4 py-3">Overdue</th>
								<th className="text-center px-4 py-3">Invoices</th>
								<th className="text-center px-4 py-3">Email Coverage</th>
								<th className="text-left px-4 py-3">Last Invoice</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{filtered.length === 0 && (
								<tr>
									<td colSpan={7} className="text-center py-12 text-foreground-muted">No clients found.</td>
								</tr>
							)}
							{filtered.map(c => (
								<tr
									key={c.customer_name}
									className={cn(
										'hover:bg-primary/5 transition-colors',
										!c.has_thread_coverage && 'bg-orange-50/40'
									)}
								>
									<td className="px-4 py-3">
										<div className="font-semibold text-foreground">{c.customer_name}</div>
									</td>
									<td className="px-4 py-3 text-right font-medium text-foreground">
										{INR(c.total_invoiced)}
									</td>
									<td className="px-4 py-3 text-right">
										{c.total_outstanding > 0 ? (
											<span className="font-bold text-red-600">{INR(c.total_outstanding)}</span>
										) : (
											<span className="text-green-600">Cleared</span>
										)}
									</td>
									<td className="px-4 py-3 text-right text-orange-600">
										{c.overdue_balance > 0 ? INR(c.overdue_balance) : '—'}
									</td>
									<td className="px-4 py-3 text-center text-foreground-muted">
										{c.invoice_count}
									</td>
									<td className="px-4 py-3 text-center">
										{c.has_thread_coverage ? (
											<span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
												<Eye className="h-3.5 w-3.5" />
												{c.linked_thread_count} thread{c.linked_thread_count !== 1 ? 's' : ''}
											</span>
										) : (
											<span className="inline-flex items-center gap-1 text-orange-600 text-xs font-medium">
												<EyeOff className="h-3.5 w-3.5" />
												No trail
											</span>
										)}
									</td>
									<td className="px-4 py-3 text-foreground-muted text-xs">
										{fmtDate(c.last_invoice_date)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{!loading && !error && filtered.length > 0 && (
				<p className="text-xs text-foreground-muted mt-3 text-right">{filtered.length} clients shown</p>
			)}
		</div>
	);
};

export default PipelineGaps;
