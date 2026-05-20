/**
 * CEO Overview
 * Single-screen executive summary combining all three data sources:
 * revenue pipeline (Zoho), behavioural risk (Gmail AI), accountability gaps.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
	RefreshCw,
	TrendingUp,
	AlertTriangle,
	AlertCircle,
	Eye,
	IndianRupee,
	MessageSquare,
	ArrowRight,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { ClientHealthApi, type HealthCustomer, type HealthMeta } from '../../../services/clientHealthApi';
import { PipelineGapsApi, type PipelineCustomer, type FySummary } from '../../../services/pipelineGapsApi';

const INR = (n: number) =>
	'₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

// ─── Mini horizontal bar chart ──────────────────────────────────────────────

const Bar: React.FC<{ value: number; max: number; paid?: number; cls?: string }> = ({
	value, max, paid, cls = 'bg-primary/60',
}) => (
	<div className="relative h-5 w-full bg-border/40 rounded overflow-hidden">
		<div
			className={cn('absolute inset-y-0 left-0 rounded', cls)}
			style={{ width: max > 0 ? `${Math.min(100, (value / max) * 100)}%` : '0%' }}
		/>
		{paid != null && (
			<div
				className="absolute inset-y-0 left-0 rounded bg-green-400/70"
				style={{ width: max > 0 ? `${Math.min(100, (paid / max) * 100)}%` : '0%' }}
			/>
		)}
	</div>
);

// ─── Health segment computation ──────────────────────────────────────────────

interface Segment {
	label:   string;
	count:   number;
	cls:     string;
	dot:     string;
}

function computeSegments(customers: HealthCustomer[]): Segment[] {
	let atRisk    = 0;
	let watch     = 0;
	let monitored = 0;

	for (const c of customers) {
		const hasCritical = c.high_priority_count > 0 || c.broken_commitment_count > 0;
		const hasBalance  = c.total_outstanding > 0;

		if (hasBalance && hasCritical)   atRisk++;
		else if (hasBalance && !hasCritical) watch++;
		else monitored++;
	}

	return [
		{ label: 'At Risk',   count: atRisk,    cls: 'text-red-600',    dot: 'bg-red-500' },
		{ label: 'Watch',     count: watch,     cls: 'text-orange-600', dot: 'bg-orange-400' },
		{ label: 'Monitored', count: monitored, cls: 'text-green-600',  dot: 'bg-green-500' },
	];
}

// ─── Main page ──────────────────────────────────────────────────────────────

const CeoOverview: React.FC = () => {
	const [healthCustomers, setHealthCustomers] = useState<HealthCustomer[]>([]);
	const [fySummary, setFySummary]     = useState<FySummary[]>([]);
	const [gapCustomers, setGapCustomers] = useState<PipelineCustomer[]>([]);
	const [gapSummary, setGapSummary]   = useState<{ total_outstanding: number; untracked_revenue: number; customers_without_coverage: number } | null>(null);
	const [loading, setLoading]         = useState(true);
	const [error, setError]             = useState<string | null>(null);

	const [healthMeta, setHealthMeta]   = useState<HealthMeta | null>(null);

	const load = () => {
		setLoading(true);
		setError(null);
		Promise.all([
			ClientHealthApi.list({}),
			PipelineGapsApi.list(),
		])
			.then(([health, gaps]) => {
				setHealthCustomers(health.customers);
				setHealthMeta(health.meta);
				setFySummary(gaps.fy_summary);
				setGapCustomers(gaps.customers);
				setGapSummary({
					total_outstanding:          gaps.summary.total_outstanding,
					untracked_revenue:          gaps.summary.untracked_revenue,
					customers_without_coverage: gaps.summary.customers_without_coverage,
				});
			})
			.catch(e => setError(e?.message ?? 'Failed to load'))
			.finally(() => setLoading(false));
	};

	useEffect(() => { load(); }, []);

	const segments     = computeSegments(healthCustomers);
	const maxFy        = Math.max(...fySummary.map(f => f.total_invoiced), 1);
	const topAtRisk    = [...healthCustomers]
		.filter(c => c.total_outstanding > 0)
		.sort((a, b) => b.total_outstanding - a.total_outstanding)
		.slice(0, 5);
	const topUntracked = [...gapCustomers]
		.filter(c => !c.has_thread_coverage)
		.sort((a, b) => b.total_invoiced - a.total_invoiced)
		.slice(0, 5);

	return (
		<div className="p-6 max-w-7xl mx-auto">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-xl font-bold text-foreground">CEO Overview</h1>
					<p className="text-sm text-foreground-muted mt-1">
						Revenue · Outstanding · Behaviour · Gaps — all three data sources in one view.
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

			{loading && (
				<div className="flex items-center justify-center py-20 text-foreground-muted">
					<RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading...
				</div>
			)}
			{error && (
				<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
			)}

			{!loading && !error && (
				<>
					{/* Hero stats */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
						{[
							{ label: 'FY25-26 Revenue',      value: INR(fySummary.find(f => f.fy === 'FY25-26')?.total_invoiced ?? 0), icon: TrendingUp,    cls: 'text-foreground' },
							{ label: 'Total Outstanding',    value: INR(gapSummary?.total_outstanding ?? 0),                           icon: IndianRupee,   cls: 'text-red-600' },
							{ label: 'High-Priority Issues', value: healthMeta?.total_high_priority ?? 0,                               icon: AlertTriangle, cls: 'text-red-600' },
							{ label: 'Broken Commitments',   value: healthMeta?.total_broken_commitments ?? 0,                          icon: AlertCircle,   cls: 'text-orange-600' },
						].map(s => (
							<div key={s.label} className="rounded-xl border border-border bg-background p-4">
								<div className="flex items-center gap-2 mb-2">
									<s.icon className={cn('h-4 w-4', s.cls)} />
									<p className="text-xs text-foreground-muted">{s.label}</p>
								</div>
								<p className={cn('text-2xl font-bold', s.cls)}>{s.value}</p>
							</div>
						))}
					</div>

					{/* Two-column layout */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
						{/* FY Revenue trend */}
						<div className="rounded-xl border border-border bg-background p-5">
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-sm font-semibold text-foreground">Revenue Trend (FY)</h2>
								<Link to="/billing/pipeline-gaps" className="text-xs text-primary flex items-center gap-1 hover:underline">
									Full view <ArrowRight className="h-3 w-3" />
								</Link>
							</div>
							<div className="space-y-3">
								{fySummary.filter(f => f.fy !== 'Earlier').map(f => (
									<div key={f.fy} className="grid grid-cols-[70px_1fr_90px] items-center gap-3">
										<span className="text-xs font-medium text-foreground-muted">{f.fy}</span>
										<Bar value={f.total_invoiced} max={maxFy} paid={f.total_paid} cls="bg-primary/50" />
										<span className="text-xs font-bold text-right text-foreground">{INR(f.total_invoiced)}</span>
									</div>
								))}
							</div>
							<div className="flex gap-4 mt-3 text-xs text-foreground-muted">
								<span className="flex items-center gap-1.5"><span className="inline-block h-2 w-4 rounded bg-primary/50" /> Invoiced</span>
								<span className="flex items-center gap-1.5"><span className="inline-block h-2 w-4 rounded bg-green-400/70" /> Paid</span>
							</div>
						</div>

						{/* Health segments */}
						<div className="rounded-xl border border-border bg-background p-5">
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-sm font-semibold text-foreground">Client Health Segments</h2>
								<Link to="/billing/client-health" className="text-xs text-primary flex items-center gap-1 hover:underline">
									Full view <ArrowRight className="h-3 w-3" />
								</Link>
							</div>
							<div className="space-y-3">
								{segments.map(s => {
									const total = healthCustomers.length || 1;
									return (
										<div key={s.label} className="grid grid-cols-[90px_1fr_40px] items-center gap-3">
											<span className={cn('text-xs font-medium flex items-center gap-1.5', s.cls)}>
												<span className={cn('h-2 w-2 rounded-full', s.dot)} />
												{s.label}
											</span>
											<div className="h-5 w-full bg-border/40 rounded overflow-hidden">
												<div
													className={cn('h-full rounded', s.dot.replace('bg-', 'bg-').replace('-500', '-400/70').replace('-400', '-300/70'))}
													style={{ width: `${Math.min(100, (s.count / total) * 100)}%` }}
												/>
											</div>
											<span className="text-xs font-bold text-right text-foreground">{s.count}</span>
										</div>
									);
								})}
							</div>
							<p className="text-xs text-foreground-muted mt-3">
								{healthMeta?.total_customers} flagged clients · {healthMeta?.total_threads ?? 0} flagged threads
							</p>
						</div>
					</div>

					{/* Two more columns: top at-risk + untracked */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Top At-Risk Clients */}
						<div className="rounded-xl border border-border bg-background p-5">
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-sm font-semibold text-foreground">Top At-Risk Clients</h2>
								<Link to="/billing/overdue-behaviour" className="text-xs text-primary flex items-center gap-1 hover:underline">
									Full map <ArrowRight className="h-3 w-3" />
								</Link>
							</div>
							{topAtRisk.length === 0 ? (
								<p className="text-sm text-foreground-muted">No clients with balance.</p>
							) : (
								<div className="space-y-2">
									{topAtRisk.map(c => (
										<div key={c.customer_name} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
											<div>
												<p className="font-medium text-foreground">{c.customer_name}</p>
												<p className="text-xs text-foreground-muted">
													{c.high_priority_count} high-pri · {c.broken_commitment_count} broken commits
												</p>
											</div>
											<div className="text-right">
												<p className="font-bold text-red-600">{INR(c.total_outstanding)}</p>
												{c.overdue_balance > 0 && (
													<p className="text-xs text-orange-600">Overdue: {INR(c.overdue_balance)}</p>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Untracked Revenue */}
						<div className="rounded-xl border border-border bg-background p-5">
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-sm font-semibold text-foreground">Untracked Revenue (No Email Trail)</h2>
								<Link to="/billing/pipeline-gaps" className="text-xs text-primary flex items-center gap-1 hover:underline">
									Full list <ArrowRight className="h-3 w-3" />
								</Link>
							</div>
							{gapSummary && (
								<div className="flex items-center gap-4 mb-3 pb-3 border-b border-border">
									<div>
										<p className="text-xs text-foreground-muted">Clients with no thread</p>
										<p className="text-lg font-bold text-orange-600">{gapSummary.customers_without_coverage}</p>
									</div>
									<div>
										<p className="text-xs text-foreground-muted">Revenue untracked</p>
										<p className="text-lg font-bold text-orange-600">{INR(gapSummary.untracked_revenue)}</p>
									</div>
								</div>
							)}
							{topUntracked.length === 0 ? (
								<p className="text-sm text-foreground-muted">All FY25-26 clients have email coverage.</p>
							) : (
								<div className="space-y-2">
									{topUntracked.map(c => (
										<div key={c.customer_name} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
											<div className="flex items-center gap-2">
												<Eye className="h-3.5 w-3.5 text-orange-400" />
												<p className="font-medium text-foreground">{c.customer_name}</p>
											</div>
											<div className="text-right">
												<p className="font-bold text-foreground">{INR(c.total_invoiced)}</p>
												{c.total_outstanding > 0 && (
													<p className="text-xs text-red-600">{INR(c.total_outstanding)} due</p>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Quick links */}
					<div className="mt-6 rounded-xl border border-border bg-primary/5 p-4">
						<p className="text-xs text-foreground-muted mb-3 font-semibold uppercase tracking-wide">Detailed Views</p>
						<div className="flex flex-wrap gap-3">
							{[
								{ label: 'Client Health',         href: '/billing/client-health',          icon: MessageSquare },
								{ label: 'Overdue + Behaviour',   href: '/billing/overdue-behaviour',      icon: AlertTriangle },
								{ label: 'Pipeline Blindspot',    href: '/billing/pipeline-gaps',          icon: Eye },
								{ label: 'Broken Commitments',    href: '/billing/broken-commitments',     icon: AlertCircle },
							].map(l => (
								<Link
									key={l.href}
									to={l.href}
									className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-border bg-background hover:bg-primary/5 transition-colors"
								>
									<l.icon className="h-3.5 w-3.5 text-primary" />
									{l.label}
								</Link>
							))}
						</div>
					</div>
				</>
			)}
		</div>
	);
};

export default CeoOverview;
