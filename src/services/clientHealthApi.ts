import { apiService } from './api';

export interface RiskSignal {
	type: string;
	said_by: string;
	evidence: string;
	severity: string;
	speaker_name: string | null;
	temporal_context?: {
		days_open: number;
		follow_ups_since: number;
		days_since_latest: number;
	};
}

export interface Commitment {
	kept: 'kept' | 'broken' | 'pending';
	what: string;
	by_party: string;
	deadline_text: string | null;
}

export interface ActionItem {
	owner: string;
	status: string;
	description: string;
	deadline_text: string | null;
}

export interface HealthThread {
	provider_thread_id: string;
	subject: string;
	first_message_at: string;
	last_message_at: string;
	message_count: number;
	summary: string;
	sentiment: string;
	payment_intent: string;
	ball_in_court: string;
	priority: 'high' | 'medium' | 'low';
	next_action: string | null;
	risk_signals: RiskSignal[];
	broken_commitments: Commitment[];
	pending_actions: ActionItem[];
	invoice_numbers: string;
	thread_outstanding: number;
	their_avg_response_days: number | null;
	our_avg_response_days: number | null;
	predicted_payment_window: string | null;
}

export interface HealthCustomer {
	customer_name: string;
	total_outstanding: number;
	overdue_balance: number;
	overdue_count: number;
	thread_count: number;
	high_priority_count: number;
	broken_commitment_count: number;
	threads: HealthThread[];
}

export interface HealthMeta {
	total_customers: number;
	total_threads: number;
	total_outstanding: number;
	total_overdue: number;
	total_broken_commitments: number;
	total_high_priority: number;
}

export interface ClientHealthResponse {
	customers: HealthCustomer[];
	meta: HealthMeta;
}

export interface ClientHealthParams {
	q?: string;
	min_outstanding?: number;
	priority?: string;
	sentiment?: string;
}

export class ClientHealthApi {
	static async list(params: ClientHealthParams = {}): Promise<ClientHealthResponse> {
		const query = new URLSearchParams();
		if (params.q)               query.set('q', params.q);
		if (params.min_outstanding) query.set('min_outstanding', String(params.min_outstanding));
		if (params.priority)        query.set('priority', params.priority);
		if (params.sentiment)       query.set('sentiment', params.sentiment);

		const qs = query.toString();
		const url = `/customers/health${qs ? `?${qs}` : ''}`;
		const res = await apiService.get<ClientHealthResponse>(url);
		return res.data;
	}
}
