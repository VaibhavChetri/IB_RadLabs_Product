/**
 * Overdue + Behaviour Map
 * Every client with an outstanding balance, enriched with behavioural signals
 * from AI email analysis: sentiment, payment intent, response time.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
	AlertTriangle,
	RefreshCw,
	Search,
	IndianRupee,
	Clock,
	MessageSquare,
	AlertCircle,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import {
	ClientHealthApi,
	type HealthCustomer,
	type ClientHealthParams,
} from '../../../services/clientHealthApi';

const INR = (n: number) =>
	'₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

const SENTIMENT_CFG: Record<string, { label: string; dot: string; row: string }> = {
	deteriorating:   { label: 'Deteriorating', dot: 'bg-red-500',    row: 'bg-red-50/50' },
	stable_negative: { label: 'Negative',       dot: 'bg-red-400',    row: 'bg-red-50/30' },
	stable_neutral:  { label: 'Neutral',         dot: 'bg-gray-400',   row: '' },
	stable_positive: { label: 'Positive',         dot: 'bg-green-500',  row: 'bg-green-50/30' },
	improving:       { label: 'Improving',        dot: 'bg-green-400',  row: 'bg-green-50/30' },
	n_a:             { label: '—',                dot: 'bg-gray-200',   row: '' },
};

const INTENT_CFG: Record<string, { label: string; cls: string }> = {
	unresponsive: { label: 'Unresponsive', cls: 'text-red-600 bg-red-50 border-red-200' },
	dispute:      { label: 'Disputing',    cls: 'text-red-600 bg-red-50 border-red-200' },
	evasive:      { label: 'Evasive',      cls: 'text-orange-600 bg-orange-50 border-orange-200' },
	cooperative:  { label: 'Cooperative',  cls: 'text-green-700 bg-green-50 border-green-200' },
	committed:    { label: 'Committed',    cls: 'text-green-700 bg-green-50 border-green-200' },
	unknown:      { label: 'Unknown',      cls: 'text-gray-500 bg-gray-50 border-gray-200' },
	n_a:          { label: '—',            cls: 'text-gray-300 bg-gray-50 border-gray-100' },
};

type SentimentKey = keyof typeof SENTIMENT_CFG;
type IntentKey = keyof typeof INTENT_CFG;

function dominantSentiment(threads: HealthCustomer['threads']): SentimentKey {
	const order: SentimentKey[] = ['deteriorating', 'stable_negative', 'stable_neutral', 'improving', 'stable_positive'];
	for (const s of order) {
		if (threads.some(t => t.sentiment === s)) return s;
	}
	return 'n_a';
}

function dominantIntent(threads: HealthCustomer['threads']): IntentKey {
	const order: IntentKey[] = ['dispute', 'unresponsive', 'evasive', 'cooperative', 'committed'];
	for (const i of order) {
		if (threads.some(t => t.payment_intent === i)) return i;
	}
	return 'unknown';
}

function avgResponseDays(threads: HealthCustomer['threads']): number | null {
	const vals = threads.map(t => t.their_avg_response_days).filter((v): v is number => v != null);
	if (!vals.length) return null;
	return vals.reduce((a, b) => a + b, 0) / vals.length;
}

const OverdueBehaviourMap: React.FC = () => {
	const [customers, setCustomers] = useState<HealthCustomer[]>([]);
	const [meta, setMeta] = useState<{ total_outstanding: number; total_overdue: number; total_customers: number; total_broken_commitments: number } | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [search, setSearch] = useState('');
	const [intentFilter, setIntentFilter] = useState('');
	const [sentimentFilter, setSentimentFilter] = useState('');

	const load = useCallback(() => {
		setLoading(true);
		setError(null);
		const params: ClientHealthParams = { min_outstanding: 1 };
		if (search) params.q = search;
		if (sentimentFilter) params.sentiment = sentimentFilter;

		ClientHealthApi.list(params)
			.then(res => {
				setCustomers(res.customers);
				setMeta(res.meta);
			})
			.catch(e => setError(e?.message ?? 'Failed to load'))
			.finally(() => setLoading(false));
	}, [search, sentimentFilter]);

	useEffect(() => { load(); }, [load]);

	const filtered = intentFilter
		? customers.filter(c => dominantIntent(c.threads) === intentFilter)
		: customers;

	return (
		<div className="p-6 max-w-7xl mx-auto">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-xl font-bold text-foreground">Overdue + Behaviour Map</h1>
					<p className="text-sm text-foreground-muted mt-1">
						Every client with an outstanding balance — what they owe, how they're behaving, and what the email trail says.
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
			{meta && (
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
					{[
						{ label: 'Clients with Balance', value: meta.total_customers, icon: AlertTriangle, cls: 'text-red-600' },
						{ label: 'Total Outstanding',    value: INR(meta.total_outstanding), icon: IndianRupee, cls: 'text-red-700' },
						{ label: 'Total Overdue',        value: INR(meta.total_overdue),     icon: Clock,        cls: 'text-orange-600' },
						{ label: 'Broken Commitments',  value: meta.total_broken_commitments, icon: AlertCircle, cls: 'text-orange-600' },
					].map(s => (
						<div key={s.label} className="rounded-xl border border-border bg-background p-4">
							<p className="text-xs text-foreground-muted">{s.label}</p>
							<p className={cn('text-xl font-bold mt-1', s.cls)}>{s.value}</p>
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
						placeholder="Search client..."
						value={search}
						onChange={e => setSearch(e.target.value)}
						className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
					/>
				</div>
				<select
					value={intentFilter}
					onChange={e => setIntentFilter(e.target.value)}
					className="text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none"
				>
					<option value="">All payment intent</option>
					<option value="unresponsive">Unresponsive</option>
					<option value="dispute">Disputing</option>
					<option value="evasive">Evasive</option>
					<option value="cooperative">Cooperative</option>
					<option value="committed">Committed</option>
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
								<th className="text-right px-4 py-3">Outstanding</th>
								<th className="text-right px-4 py-3">Overdue</th>
								<th className="text-center px-4 py-3">Sentiment</th>
								<th className="text-center px-4 py-3">Payment Intent</th>
								<th className="text-center px-4 py-3">Avg Response</th>
								<th className="text-center px-4 py-3">Threads</th>
								<th className="text-center px-4 py-3">Broken Commits</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{filtered.length === 0 && (
								<tr>
									<td colSpan={8} className="text-center py-12 text-foreground-muted">No clients found.</td>
								</tr>
							)}
							{filtered.map(c => {
								const sent = SENTIMENT_CFG[dominantSentiment(c.threads)] ?? SENTIMENT_CFG.n_a;
								const intent = INTENT_CFG[dominantIntent(c.threads)] ?? INTENT_CFG.unknown;
								const avgResp = avgResponseDays(c.threads);

								return (
									<tr key={c.customer_name} className={cn('hover:bg-primary/5 transition-colors', sent.row)}>
										<td className="px-4 py-3">
											<div className="font-semibold text-foreground">{c.customer_name}</div>
											{c.high_priority_count > 0 && (
												<span className="text-xs text-red-600 font-medium">
													{c.high_priority_count} high-priority
												</span>
											)}
										</td>
										<td className="px-4 py-3 text-right font-bold text-red-600">
											{INR(c.total_outstanding)}
										</td>
										<td className="px-4 py-3 text-right text-orange-600">
											{c.overdue_balance > 0 ? (
												<>
													<div>{INR(c.overdue_balance)}</div>
													<div className="text-xs text-foreground-muted">{c.overdue_count} inv</div>
												</>
											) : '—'}
										</td>
										<td className="px-4 py-3 text-center">
											<span className="inline-flex items-center gap-1.5">
												<span className={cn('h-2 w-2 rounded-full', sent.dot)} />
												<span className="text-xs text-foreground">{sent.label}</span>
											</span>
										</td>
										<td className="px-4 py-3 text-center">
											<span className={cn('text-xs px-2 py-0.5 rounded border font-medium', intent.cls)}>
												{intent.label}
											</span>
										</td>
										<td className="px-4 py-3 text-center text-foreground-muted">
											{avgResp != null ? `${avgResp.toFixed(1)}d` : '—'}
										</td>
										<td className="px-4 py-3 text-center">
											<span className="inline-flex items-center gap-1 text-foreground-muted">
												<MessageSquare className="h-3.5 w-3.5" />
												{c.thread_count}
											</span>
										</td>
										<td className="px-4 py-3 text-center">
											{c.broken_commitment_count > 0 ? (
												<span className="text-orange-600 font-semibold">❌ {c.broken_commitment_count}</span>
											) : (
												<span className="text-green-600">✓</span>
											)}
										</td>
									</tr>
								);
							})}
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

export default OverdueBehaviourMap;
