/**
 * Broken Commitments
 * Every promise made and not kept — extracted from AI email analysis.
 * Per-client, per-thread, with the exact quoted evidence.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Search, AlertCircle, IndianRupee } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { ClientHealthApi, type HealthCustomer, type Commitment } from '../../../services/clientHealthApi';

const fmtDate = (d: string | null) =>
	d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

interface FlatCommitment {
	customer_name:      string;
	customer_outstanding: number;
	thread_subject:     string;
	thread_id:          string;
	last_message_at:    string;
	invoice_numbers:    string;
	commitment:         Commitment;
}

function flattenCommitments(customers: HealthCustomer[]): FlatCommitment[] {
	const out: FlatCommitment[] = [];
	for (const c of customers) {
		for (const t of c.threads) {
			for (const cm of t.broken_commitments) {
				out.push({
					customer_name:        c.customer_name,
					customer_outstanding: c.total_outstanding,
					thread_subject:       t.subject,
					thread_id:            t.provider_thread_id,
					last_message_at:      t.last_message_at,
					invoice_numbers:      t.invoice_numbers,
					commitment:           cm,
				});
			}
		}
	}
	return out;
}

const PARTY_LABEL: Record<string, string> = {
	customer:    'Client',
	infinitybox: 'IB',
	both:        'Both',
};

const BrokenCommitments: React.FC = () => {
	const [customers, setCustomers] = useState<HealthCustomer[]>([]);
	const [loading, setLoading]   = useState(true);
	const [error, setError]       = useState<string | null>(null);

	const [search, setSearch]     = useState('');
	const [partyFilter, setPartyFilter] = useState('');

	const load = useCallback(() => {
		setLoading(true);
		setError(null);
		ClientHealthApi.list({})
			.then(res => setCustomers(res.customers))
			.catch(e => setError(e?.message ?? 'Failed to load'))
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => { load(); }, [load]);

	const all = flattenCommitments(customers);
	const filtered = all.filter(fc => {
		if (search && !fc.customer_name.toLowerCase().includes(search.toLowerCase()) &&
			!fc.commitment.what.toLowerCase().includes(search.toLowerCase())) return false;
		if (partyFilter && fc.commitment.by_party !== partyFilter) return false;
		return true;
	});

	const ibCount    = all.filter(f => f.commitment.by_party === 'infinitybox').length;
	const clientCount = all.filter(f => f.commitment.by_party === 'customer').length;

	return (
		<div className="p-6 max-w-6xl mx-auto">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-xl font-bold text-foreground">Broken Commitments</h1>
					<p className="text-sm text-foreground-muted mt-1">
						Promises made in email that were not kept — extracted by AI with exact quoted evidence.
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
			{!loading && !error && (
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
					{[
						{ label: 'Total Broken',          value: all.length,                      cls: 'text-red-600' },
						{ label: 'By Client',             value: clientCount,                     cls: 'text-orange-600' },
						{ label: 'By IB',                 value: ibCount,                         cls: 'text-orange-600' },
						{ label: 'Clients Affected',      value: customers.filter(c => c.broken_commitment_count > 0).length, cls: 'text-red-600' },
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
						placeholder="Search client or commitment..."
						value={search}
						onChange={e => setSearch(e.target.value)}
						className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
					/>
				</div>
				<select
					value={partyFilter}
					onChange={e => setPartyFilter(e.target.value)}
					className="text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none"
				>
					<option value="">All parties</option>
					<option value="customer">By Client</option>
					<option value="infinitybox">By IB</option>
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

			{/* List */}
			{!loading && !error && filtered.length === 0 && (
				<div className="text-center py-20 text-foreground-muted text-sm">No broken commitments found.</div>
			)}

			{!loading && !error && filtered.length > 0 && (
				<div className="space-y-3">
					{filtered.map((fc, i) => (
						<div
							key={`${fc.thread_id}-${i}`}
							className="rounded-xl border border-orange-200 bg-background overflow-hidden"
						>
							{/* Client header */}
							<div className="flex items-center justify-between px-4 py-2.5 bg-orange-50/60 border-b border-orange-200">
								<div className="flex items-center gap-2">
									<AlertCircle className="h-3.5 w-3.5 text-orange-600 shrink-0" />
									<span className="font-semibold text-sm text-foreground">{fc.customer_name}</span>
									{fc.customer_outstanding > 0 && (
										<span className="text-xs text-red-600 flex items-center gap-0.5 ml-1">
											<IndianRupee className="h-3 w-3" />
											{fc.customer_outstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })} due
										</span>
									)}
								</div>
								<div className="flex items-center gap-3 text-xs text-foreground-muted">
									{fc.invoice_numbers && <span>{fc.invoice_numbers}</span>}
									<span>{fmtDate(fc.last_message_at)}</span>
								</div>
							</div>

							{/* Thread + commitment */}
							<div className="px-4 py-3">
								<p className="text-xs text-foreground-muted mb-2 truncate">
									Thread: <span className="text-foreground font-medium">{fc.thread_subject}</span>
								</p>
								<div className="bg-orange-50 border-l-2 border-orange-400 rounded-r-md px-3 py-2">
									<div className="flex items-center gap-2 mb-1">
										<span className="text-xs font-bold text-orange-700">❌ Broken by {PARTY_LABEL[fc.commitment.by_party] ?? fc.commitment.by_party}</span>
										{fc.commitment.deadline_text && (
											<span className="text-xs text-gray-400">· Deadline: {fc.commitment.deadline_text}</span>
										)}
									</div>
									<p className="text-sm text-gray-700">"{fc.commitment.what}"</p>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{!loading && !error && filtered.length > 0 && (
				<p className="text-xs text-foreground-muted mt-4 text-right">{filtered.length} broken commitments shown</p>
			)}
		</div>
	);
};

export default BrokenCommitments;
