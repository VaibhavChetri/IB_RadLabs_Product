/**
 * Client Health — per-customer accordion of every flagged email thread.
 * Subject line + AI summary + exact evidence text from the email.
 * Designed for team review: "why does this keep happening with this client?"
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
	ChevronDown,
	ChevronRight,
	Search,
	RefreshCw,
	AlertTriangle,
	AlertCircle,
	Clock,
	IndianRupee,
	MessageSquare,
	X,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { ClientHealthApi, type HealthCustomer, type HealthThread, type ClientHealthParams } from '../../../services/clientHealthApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INR = (n: number) =>
	'₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

const fmtDate = (d: string | null) =>
	d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const daysSince = (d: string | null) =>
	d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : null;

// ─── Sentiment / Intent config ─────────────────────────────────────────────

const SENTIMENT: Record<string, { label: string; cls: string }> = {
	deteriorating:   { label: '⬇ Deteriorating', cls: 'bg-red-100 text-red-700' },
	stable_negative: { label: '⬇ Negative',       cls: 'bg-red-100 text-red-700' },
	stable_neutral:  { label: '→ Neutral',          cls: 'bg-gray-100 text-gray-600' },
	stable_positive: { label: '⬆ Positive',         cls: 'bg-green-100 text-green-700' },
	improving:       { label: '⬆ Improving',         cls: 'bg-green-100 text-green-700' },
	n_a:             { label: 'N/A',                 cls: 'bg-gray-100 text-gray-400' },
};

const INTENT: Record<string, { label: string; cls: string }> = {
	unresponsive: { label: 'Unresponsive', cls: 'text-red-600' },
	dispute:      { label: 'Disputing',    cls: 'text-red-600' },
	evasive:      { label: 'Evasive',      cls: 'text-orange-600' },
	disputed:     { label: 'Disputing',    cls: 'text-red-600' },
	cooperative:  { label: 'Cooperative',  cls: 'text-green-600' },
	committed:    { label: 'Committed',    cls: 'text-green-600' },
	unknown:      { label: 'Unknown',      cls: 'text-gray-400' },
	n_a:          { label: '—',            cls: 'text-gray-300' },
};

const RISK_LABEL: Record<string, string> = {
	silence:         '🔇 Silence',
	escalation:      '🚨 Escalation',
	dispute:         '⚠️ Dispute',
	missed_deadline: '⏰ Missed Deadline',
	tone_shift:      '📉 Tone Shift',
	other:           '⚑ Issue',
};

const PRIO_DOT: Record<string, string> = {
	high:   'bg-red-500',
	medium: 'bg-orange-400',
	low:    'bg-gray-300',
};

// ─── Thread card ───────────────────────────────────────────────────────────

const ThreadCard: React.FC<{ thread: HealthThread }> = ({ thread }) => {
	const sent = SENTIMENT[thread.sentiment] ?? SENTIMENT.n_a;
	const intent = INTENT[thread.payment_intent] ?? INTENT.unknown;
	const since = daysSince(thread.last_message_at);

	return (
		<div className={cn(
			'rounded-lg border p-4 mb-3',
			thread.priority === 'high' ? 'border-red-200 bg-red-50/40' : 'border-border bg-background'
		)}>
			{/* Subject + meta */}
			<div className="flex items-start justify-between gap-3 flex-wrap">
				<div className="flex items-start gap-2 min-w-0">
					<span className={cn('mt-1 h-2 w-2 rounded-full shrink-0', PRIO_DOT[thread.priority] ?? 'bg-gray-300')} />
					<div className="min-w-0">
						<p className="font-semibold text-sm text-foreground truncate">{thread.subject}</p>
						<p className="text-xs text-foreground-muted mt-0.5">
							{fmtDate(thread.first_message_at)}
							{thread.last_message_at !== thread.first_message_at && ` → ${fmtDate(thread.last_message_at)}`}
							{' · '}{thread.message_count} msg{thread.message_count !== 1 ? 's' : ''}
							{since != null && ` · ${since}d ago`}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2 flex-wrap shrink-0">
					<span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', sent.cls)}>{sent.label}</span>
					<span className={cn('text-xs font-medium', intent.cls)}>{intent.label}</span>
					{thread.invoice_numbers && (
						<span className="text-xs text-foreground-muted">{thread.invoice_numbers}</span>
					)}
					{thread.thread_outstanding > 0 && (
						<span className="text-xs font-bold text-red-600">{INR(thread.thread_outstanding)} due</span>
					)}
				</div>
			</div>

			{/* Summary */}
			{thread.summary && (
				<p className="text-sm text-foreground mt-3 leading-relaxed">{thread.summary}</p>
			)}

			{/* Risk signals */}
			{thread.risk_signals.length > 0 && (
				<div className="mt-3 space-y-2">
					{thread.risk_signals.map((r, i) => (
						<div key={i} className="flex gap-2 bg-red-50 border-l-2 border-red-400 rounded-r-md px-3 py-2">
							<div className="min-w-0">
								<span className="text-xs font-bold text-red-700">
									{RISK_LABEL[r.type] ?? `⚑ ${r.type}`}
								</span>
								{r.speaker_name && (
									<span className="text-xs text-gray-500 ml-1">· {r.speaker_name}</span>
								)}
								{r.temporal_context?.days_open != null && (
									<span className="text-xs text-gray-400 ml-1">· {r.temporal_context.days_open}d open</span>
								)}
								<p className="text-xs text-gray-600 mt-1 italic">"{r.evidence}"</p>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Broken commitments */}
			{thread.broken_commitments.length > 0 && (
				<div className="mt-2 space-y-2">
					{thread.broken_commitments.map((c, i) => (
						<div key={i} className="bg-orange-50 border-l-2 border-orange-400 rounded-r-md px-3 py-2">
							<span className="text-xs font-bold text-orange-700">❌ Broken Commitment</span>
							<span className="text-xs text-gray-500 ml-1">· by {c.by_party}</span>
							<p className="text-xs text-gray-600 mt-1">"{c.what}"</p>
							{c.deadline_text && <p className="text-xs text-gray-400 mt-0.5">Deadline: {c.deadline_text}</p>}
						</div>
					))}
				</div>
			)}

			{/* Pending actions */}
			{thread.pending_actions.length > 0 && (
				<div className="mt-2 space-y-1 pt-2 border-t border-border">
					{thread.pending_actions.slice(0, 3).map((a, i) => (
						<p key={i} className="text-xs text-foreground-muted">
							<span className="text-orange-500 font-bold">→ </span>
							<span className="font-semibold">{a.owner === 'infinitybox' ? 'IB:' : 'Client:'}</span>{' '}
							{a.description}
							{a.deadline_text && <span className="text-gray-400"> ({a.deadline_text})</span>}
						</p>
					))}
				</div>
			)}

			{/* Footer meta */}
			<div className="mt-2 flex gap-4 flex-wrap text-xs text-foreground-muted">
				{thread.ball_in_court && (
					<span>Ball in court: <strong className="text-foreground">{thread.ball_in_court}</strong></span>
				)}
				{thread.their_avg_response_days != null && (
					<span>Their response: <strong className="text-foreground">{thread.their_avg_response_days.toFixed(1)}d</strong></span>
				)}
				{thread.our_avg_response_days != null && (
					<span>Our response: <strong className="text-foreground">{thread.our_avg_response_days.toFixed(1)}d</strong></span>
				)}
				{thread.predicted_payment_window && thread.predicted_payment_window !== 'n_a' && (
					<span>Payment prediction: <strong className="text-green-600">{thread.predicted_payment_window}</strong></span>
				)}
			</div>
		</div>
	);
};

// ─── Customer accordion row ────────────────────────────────────────────────

const CustomerRow: React.FC<{ customer: HealthCustomer; defaultOpen?: boolean }> = ({ customer, defaultOpen }) => {
	const [open, setOpen] = useState(defaultOpen ?? false);

	return (
		<div className="rounded-xl border border-border overflow-hidden mb-3">
			{/* Header */}
			<button
				onClick={() => setOpen(o => !o)}
				className="w-full flex items-center justify-between gap-3 px-4 py-3.5 bg-primary/5 hover:bg-primary/10 transition-colors text-left"
			>
				<div className="flex items-center gap-3 min-w-0">
					{open ? <ChevronDown className="h-4 w-4 shrink-0 text-primary" /> : <ChevronRight className="h-4 w-4 shrink-0 text-foreground-muted" />}
					<span className="font-semibold text-sm text-foreground truncate">{customer.customer_name}</span>
				</div>
				<div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
					{customer.total_outstanding > 0 && (
						<span className="text-xs font-bold text-red-600 flex items-center gap-0.5">
							<IndianRupee className="h-3 w-3" />{customer.total_outstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })} due
						</span>
					)}
					{customer.overdue_balance > 0 && (
						<span className="text-xs text-orange-600">
							Overdue: {INR(customer.overdue_balance)} ({customer.overdue_count})
						</span>
					)}
					{customer.high_priority_count > 0 && (
						<span className="text-xs text-red-600 font-medium flex items-center gap-1">
							<AlertCircle className="h-3 w-3" />{customer.high_priority_count} high
						</span>
					)}
					{customer.broken_commitment_count > 0 && (
						<span className="text-xs text-orange-600">❌ {customer.broken_commitment_count} broken</span>
					)}
					<span className="text-xs text-foreground-muted flex items-center gap-1">
						<MessageSquare className="h-3 w-3" />{customer.thread_count}
					</span>
				</div>
			</button>

			{/* Threads */}
			{open && (
				<div className="px-4 py-3 bg-background border-t border-border">
					{customer.threads.map(t => (
						<ThreadCard key={t.provider_thread_id} thread={t} />
					))}
				</div>
			)}
		</div>
	);
};

// ─── Main page ─────────────────────────────────────────────────────────────

const ClientHealth: React.FC = () => {
	const [customers, setCustomers] = useState<HealthCustomer[]>([]);
	const [meta, setMeta] = useState<{ total_customers: number; total_threads: number; total_outstanding: number; total_overdue: number; total_broken_commitments: number; total_high_priority: number } | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [search, setSearch] = useState('');
	const [priorityFilter, setPriorityFilter] = useState('');
	const [sentimentFilter, setSentimentFilter] = useState('');

	const load = useCallback(() => {
		setLoading(true);
		setError(null);
		const params: ClientHealthParams = {};
		if (search)         params.q = search;
		if (priorityFilter) params.priority = priorityFilter;
		if (sentimentFilter) params.sentiment = sentimentFilter;

		ClientHealthApi.list(params)
			.then(res => {
				setCustomers(res.customers);
				setMeta(res.meta);
			})
			.catch(e => setError(e?.message ?? 'Failed to load'))
			.finally(() => setLoading(false));
	}, [search, priorityFilter, sentimentFilter]);

	useEffect(() => { load(); }, [load]);

	return (
		<div className="p-6 max-w-5xl mx-auto">
			{/* Page header */}
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-xl font-bold text-foreground">Client Health</h1>
					<p className="text-sm text-foreground-muted mt-1">
						Every flagged conversation — subject, AI summary, and exact reason. Use in team reviews.
					</p>
				</div>
				<button
					onClick={load}
					disabled={loading}
					className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-border hover:bg-primary/5 transition-colors disabled:opacity-50"
				>
					<RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
					Refresh
				</button>
			</div>

			{/* Stats */}
			{meta && (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
					{[
						{ label: 'Customers', value: meta.total_customers, icon: AlertTriangle, cls: 'text-red-600' },
						{ label: 'Flagged Threads', value: meta.total_threads, icon: MessageSquare, cls: 'text-orange-600' },
						{ label: 'High Priority', value: meta.total_high_priority, icon: AlertCircle, cls: 'text-red-600' },
						{ label: 'Broken Commits', value: meta.total_broken_commitments, icon: X, cls: 'text-orange-600' },
						{ label: 'Outstanding', value: INR(meta.total_outstanding), icon: IndianRupee, cls: 'text-red-600' },
						{ label: 'Overdue', value: INR(meta.total_overdue), icon: Clock, cls: 'text-orange-600' },
					].map(s => (
						<div key={s.label} className="rounded-xl border border-border bg-background p-3">
							<p className="text-xs text-foreground-muted">{s.label}</p>
							<p className={cn('text-lg font-bold mt-1', s.cls)}>{s.value}</p>
						</div>
					))}
				</div>
			)}

			{/* Filters */}
			<div className="flex gap-3 mb-5 flex-wrap">
				<div className="relative flex-1 min-w-48">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
					<input
						type="text"
						placeholder="Search customer..."
						value={search}
						onChange={e => setSearch(e.target.value)}
						className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
					/>
				</div>
				<select
					value={priorityFilter}
					onChange={e => setPriorityFilter(e.target.value)}
					className="text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none"
				>
					<option value="">All priorities</option>
					<option value="high">High</option>
					<option value="medium">Medium</option>
					<option value="low">Low</option>
				</select>
				<select
					value={sentimentFilter}
					onChange={e => setSentimentFilter(e.target.value)}
					className="text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none"
				>
					<option value="">All sentiment</option>
					<option value="deteriorating">Deteriorating</option>
					<option value="stable_negative">Negative</option>
					<option value="stable_neutral">Neutral</option>
					<option value="improving">Improving</option>
					<option value="stable_positive">Positive</option>
				</select>
			</div>

			{/* Content */}
			{loading && (
				<div className="flex items-center justify-center py-20 text-foreground-muted">
					<RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading...
				</div>
			)}

			{error && (
				<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
					{error}
				</div>
			)}

			{!loading && !error && customers.length === 0 && (
				<div className="text-center py-20 text-foreground-muted text-sm">No flagged threads found.</div>
			)}

			{!loading && !error && customers.map((c, i) => (
				<CustomerRow key={c.customer_name} customer={c} defaultOpen={i === 0} />
			))}
		</div>
	);
};

export default ClientHealth;
