/**
 * Mock data for Smart Follow-up Tracker (Module 1)
 * Matches contract v2:
 *   GET /v1/api/email/invoice-threads?days=30&has_email=...&priority=...
 *
 * Response is { summary, pagination, items[] }. The row SHAPE must not
 * change — swapping to live API only replaces fetchFollowUpData's body.
 */

// ── Enums ────────────────────────────────────────────────────────────────────

export type InvoiceStatus = 'overdue' | 'sent' | 'paid' | 'draft' | 'void';

export type CoverageClass =
	| 'gmail_tracked'
	| 'zoho_emailed_only'
	| 'still_draft'
	| 'pre_tracking_column'
	| 'real_gap';

export type ThreadStatus =
	| 'sent'
	| 'replied'
	| 'acknowledged'
	| 'promised_to_pay'
	| 'paid'
	| 'partial'
	| 'dispute'
	| 'no_response'
	| 'awaiting_internal'
	| 'unknown'
	// Kept for backward-compat with prior mocks where status was 'replied_recently'.
	// New backend emits 'replied' / 'acknowledged' — UI handles both.
	| 'replied_recently';

export type Priority = 'high' | 'medium' | 'low';

export type SwatiRole = 'initiator' | 'responder' | 'cc_only' | 'absent';

export type LinkMatchSource =
	| 'exact_invoice_number'
	| 'subject_fuzzy'
	| 'pdf_attachment'
	| 'customer_thread'
	| 'manual';

// ── Sub-shapes ───────────────────────────────────────────────────────────────

/** Single Zoho-side email event in the invoice's email_history. */
export interface ZohoEmailEvent {
	date: string;
	recipients: string[];
	is_reminder: boolean;
	/** Optional fields the live backend also emits. */
	time?: string;
	description?: string;
}

export interface FollowUpInvoice {
	zoho_invoice_id: string;
	invoice_number: string;
	customer_name: string;
	amount: number;
	balance: number;
	currency: string;
	invoice_date: string;
	due_date: string;
	status: InvoiceStatus;
	days_overdue: number;
	zoho: {
		is_emailed: boolean;
		reminders_sent: number;
		last_reminder_sent_date: string | null;
		/** Module 1.5 addition — optional, may be omitted on older rows. */
		email_history?: ZohoEmailEvent[];
	};
}

export interface FollowUpThread {
	provider_thread_id: string;
	subject_first: string;
	message_count: number;
	last_message_at: string | null;
	days_since_last_contact: number | null;
	link_match_source: LinkMatchSource;
	/** Backend emits as a string like "1.00"; coerce with Number() before maths. */
	link_match_confidence: number | string;
	/** Optional — live backend currently doesn't surface this; mock includes it. */
	participants?: string[];
}

// ── Module 1.6 enrichment enums ──────────────────────────────────────────────

export type BallInCourt =
	| 'infinitybox'
	| 'customer'
	| 'internal_finance'
	| 'vendor'
	| 'third_party'
	| 'unclear';

export type PaymentIntent =
	| 'committed'
	| 'cooperative'
	| 'evasive'
	| 'hostile'
	| 'unresponsive'
	| 'n_a'
	| 'unknown';

export type SentimentTrajectory =
	| 'improving'
	| 'stable_positive'
	| 'stable_neutral'
	| 'stable_negative'
	| 'deteriorating'
	| 'n_a'
	| 'unknown';

export type PaymentWindow =
	| 'likely_this_week'
	| 'this_month'
	| 'next_30_90_days'
	| 'beyond_90'
	| 'unlikely_without_escalation'
	| 'n_a'
	| 'unknown';

export type ActionItemOwner =
	| 'infinitybox'
	| 'customer'
	| 'vendor'
	| 'internal_finance'
	| 'unknown';

export type ActionItemStatus = 'pending' | 'done' | 'blocked' | 'unknown';

export interface ActionItem {
	description: string;
	owner: ActionItemOwner;
	deadline_text?: string | null;
	deadline_iso_date?: string | null;
	status: ActionItemStatus;
}

export type CommitmentParty = 'customer' | 'us' | 'vendor';

export type CommitmentKept = 'too_early_to_tell' | 'kept' | 'broken' | 'unknown';

export interface Commitment {
	by_party: CommitmentParty;
	what: string;
	deadline_text?: string | null;
	deadline_iso_date?: string | null;
	kept: CommitmentKept;
}

/**
 * Module 1.7 split: risk_signals carries only negatives now. The legacy
 * `'positive'` severity is kept in the union so any stale cached responses
 * don't crash — the UI filters those out and surfaces positives via the
 * separate positive_signals array below.
 */
export type RiskSeverity = 'mild_negative' | 'severe_negative' | 'positive';

/**
 * Negative risk types only. `fast_responder` and `good_history` previously
 * lived here pre-1.7 and have moved to PositiveSignalType.
 */
export type RiskType =
	| 'broken_promise'
	| 'silence'
	| 'tone_escalation'
	| 'dispute'
	| 'cash_flow_hint'
	| 'scope_creep'
	| 'third_party_involved'
	| 'other';

/** Who said the line that produced this signal. */
export type SignalSpeaker = 'infinitybox' | 'counterparty' | 'third_party' | 'unknown';

export interface RiskSignal {
	severity: RiskSeverity;
	type: RiskType;
	evidence: string;
	/** Module 1.7 — optional on older rows that haven't been re-enriched. */
	said_by?: SignalSpeaker;
	/** Module 1.7 — optional, null when not identifiable. */
	speaker_name?: string | null;
}

export type PositiveSignalType =
	| 'fast_responder'
	| 'good_history'
	| 'on_time_payment'
	| 'cooperative_tone'
	| 'proactive_communication'
	| 'other';

export interface PositiveSignal {
	type: PositiveSignalType;
	evidence: string;
	said_by?: SignalSpeaker;
	speaker_name?: string | null;
}

export interface FollowUpAI {
	summary_short: string;
	summary_long: string;
	current_status: ThreadStatus;
	next_action: string;
	priority: Priority;
	swati_role: SwatiRole;

	// ── Module 1.6 additions (all optional — older payloads omit them) ──
	ball_in_court?: BallInCourt | null;
	payment_intent?: PaymentIntent | null;
	sentiment_trajectory?: SentimentTrajectory | null;
	predicted_payment_window?: PaymentWindow | null;
	prediction_confidence?: number | null;
	their_avg_response_days?: number | null;
	our_avg_response_days?: number | null;
	action_items?: ActionItem[];
	commitments?: Commitment[];
	documents_required?: string[];
	documents_pending_from_them?: string[];
	risk_signals?: RiskSignal[];

	/** Module 1.7 — positive signals are a separate array from risk_signals. */
	positive_signals?: PositiveSignal[];
}

export interface FollowUpItem {
	invoice: FollowUpInvoice;
	coverage_class: CoverageClass;
	thread: FollowUpThread | null;
	ai: FollowUpAI | null;
	deep_link: string | null;
}

/**
 * Window-wide aggregates by Zoho invoice status. Authoritative across the
 * whole result set (NOT page-dependent), so UI should prefer these over
 * walking items[]. Some buckets carry balance, some carry amount — see
 * field choice per status.
 */
export interface SummaryStatusBreakdown {
	overdue: { count: number; balance: number; oldest_days: number };
	sent: { count: number; balance: number };
	paid: { count: number; amount: number };
	draft: { count: number; amount: number };
	void: { count: number };
	other: { count: number };
}

/**
 * Window-wide AI aggregates — Module 1.6 enrichment rolled up so the header
 * can surface "do today" counts without scanning items[].
 */
export interface SummaryAIBreakdown {
	current_status: Partial<Record<ThreadStatus, number>>;
	priority: Partial<Record<Priority, number>>;
	ball_in_court: Partial<Record<BallInCourt, number>>;
}

/**
 * Date-range window the API actually used. `mode: 'range'` when caller
 * passed `from`/`to`, `mode: 'days'` when the legacy days-back fallback
 * applied. UI should render `window.from → window.to` rather than
 * computing from `window_days` (which becomes meaningless once arbitrary
 * ranges are picked).
 */
export interface FollowUpWindow {
	mode: 'range' | 'days';
	from: string;
	to: string;
	days_equivalent: number;
}

export interface FollowUpSummary {
	account_email: string;
	/** Authoritative date-range info (new). Optional only because older backend builds omit it. */
	window?: FollowUpWindow;
	/** Legacy — will be removed eventually. Prefer `window.days_equivalent`. */
	window_days: number;
	/** Legacy — equals `window.from`. */
	since_date: string;
	invoices_total: number;
	invoices_covered: number;
	invoices_real_gap: number;
	coverage_pct: number;
	coverage_breakdown: {
		gmail_tracked: number;
		zoho_emailed_only: number;
		still_draft: number;
		pre_tracking_column: number;
		real_gap: number;
	};
	total_amount: number;
	total_balance: number;
	real_gap_balance: number;
	/** Window-wide Zoho status aggregates (new — backend may omit on older builds). */
	status_breakdown?: SummaryStatusBreakdown;
	/** Window-wide AI aggregates (new — backend may omit on older builds). */
	ai_breakdown?: SummaryAIBreakdown;
}

export interface FollowUpPagination {
	page: number;
	limit: number;
	/** Rows on THIS page. */
	returned: number;
	/** Matching rows across the whole window (new). Optional because older builds omit. */
	total?: number;
	/** ceil(total / limit) (new). Optional because older builds omit. */
	total_pages?: number;
	/** page < total_pages (new). Optional because older builds omit. */
	has_more?: boolean;
}

/**
 * Per-customer aggregate covering the customer's FULL history with us, not
 * just the response's 30-day window. Use this to disambiguate paid-on-this-
 * invoice vs paid-as-a-customer (e.g. Boeing has a paid row in the window but
 * ₹14L overdue across other invoices).
 */
export interface CustomerRollup {
	customer_name: string;
	invoice_count: number;
	counts_by_status: {
		paid: number;
		overdue: number;
		sent: number;
		draft: number;
		/** Cancelled invoices — record-keeping only, no balance owed. */
		void: number;
		other: number;
	};
	counts_by_ai_status: {
		dispute: number;
		promised_to_pay: number;
		no_response: number;
	};
	total_amount: number;
	total_balance: number;
	paid_amount: number;
	overdue_balance: number;
	oldest_overdue_days: number;
	last_contact_at: string | null;
	real_gap_count: number;
	invoice_numbers: string[];
}

export interface FollowUpResponse {
	summary: FollowUpSummary;
	pagination: FollowUpPagination;
	items: FollowUpItem[];
	/** Optional — older backend builds omit this field. */
	customer_rollups?: CustomerRollup[];
}

// ── Mock data ────────────────────────────────────────────────────────────────

const gmailLink = (msgId: string) =>
	`https://mail.google.com/mail/u/0/#search/rfc822msgid:${encodeURIComponent(msgId)}`;

const SWATI = 'swati@getinfinitybox.com';

const MOCK_ITEMS: FollowUpItem[] = [
	// ── real_gap: no email at all, nothing in Zoho either (the headline row) ──
	{
		invoice: {
			zoho_invoice_id: '1101117000005187003',
			invoice_number: 'IB-2026-27/0062',
			customer_name: 'Mangal Industries Limited',
			amount: 799525.6,
			balance: 799525.6,
			currency: 'INR',
			invoice_date: '2026-04-30',
			due_date: '2026-04-30',
			status: 'overdue',
			days_overdue: 16,
			zoho: { is_emailed: false, reminders_sent: 0, last_reminder_sent_date: null },
		},
		coverage_class: 'real_gap',
		thread: null,
		ai: null,
		deep_link: null,
	},

	// ── gmail_tracked: the high-priority Compass case ──────────────────────────
	{
		invoice: {
			zoho_invoice_id: '1101117000005180001',
			invoice_number: 'IB-2025-26/01201',
			customer_name: 'COMPASS INDIA FOOD SERVICES PRIVATE LIMITED',
			amount: 510093.33,
			balance: 510093.33,
			currency: 'INR',
			invoice_date: '2026-01-31',
			due_date: '2026-03-02',
			status: 'overdue',
			days_overdue: 75,
			zoho: {
				is_emailed: true,
				reminders_sent: 3,
				last_reminder_sent_date: '2026-05-10',
				email_history: [
					{
						date: '2026-01-31',
						recipients: ['rohan@compass.com'],
						is_reminder: false,
					},
					{
						date: '2026-03-15',
						recipients: ['rohan@compass.com', 'finance@compass.com'],
						is_reminder: true,
					},
					{
						date: '2026-04-22',
						recipients: ['rohan@compass.com', 'finance@compass.com'],
						is_reminder: true,
					},
					{
						date: '2026-05-10',
						recipients: ['rohan@compass.com', 'finance@compass.com'],
						is_reminder: true,
					},
				],
			},
		},
		coverage_class: 'gmail_tracked',
		thread: {
			provider_thread_id: '1856032350369242689',
			subject_first: 'Invoice - IB-2025-26/01201 from INFINITYBOX',
			message_count: 47,
			last_message_at: '2026-05-12T14:00:00',
			days_since_last_contact: 4,
			link_match_source: 'exact_invoice_number',
			link_match_confidence: 1.0,
			participants: [SWATI, 'rohan@compass.com', 'finance@compass.com'],
		},
		ai: {
			summary_short:
				'Customer acknowledged invoice. Promised payment by May 12. No payment received yet.',
			summary_long:
				'Swati sent invoice IB-2025-26/01201 on 31 Jan. Rohan at Compass acknowledged on 5 Feb and routed to finance. After three reminders, finance team committed (10 May) to release payment by 12 May. As of today payment has not been received and silence has resumed.',
			current_status: 'promised_to_pay',
			next_action: 'Follow up with Compass Group for PO and GRN for invoice IB-2025-26/01201',
			priority: 'high',
			swati_role: 'initiator',
			// Module 1.6 enrichment — used to verify the UI renders before the
			// backend's enrichment pipeline catches up on the live response.
			ball_in_court: 'customer',
			payment_intent: 'evasive',
			sentiment_trajectory: 'deteriorating',
			predicted_payment_window: 'unlikely_without_escalation',
			prediction_confidence: 0.78,
			their_avg_response_days: 5.4,
			our_avg_response_days: 0.6,
			action_items: [
				{
					description: 'Send PO copy and GRN reference for invoice IB-2025-26/01201',
					owner: 'customer',
					deadline_text: 'by 12 May',
					deadline_iso_date: '2026-05-12',
					status: 'pending',
				},
				{
					description: 'Resend revised invoice with corrected site code',
					owner: 'infinitybox',
					deadline_text: 'today',
					deadline_iso_date: '2026-05-16',
					status: 'pending',
				},
			],
			commitments: [
				{
					by_party: 'customer',
					what: 'release payment of ₹5,10,093',
					deadline_text: 'by 12 May',
					deadline_iso_date: '2026-05-12',
					kept: 'broken',
				},
			],
			documents_required: ['Revised invoice with PO match-back'],
			documents_pending_from_them: ['PO copy', 'GRN', 'TDS certificate'],
			risk_signals: [
				{
					severity: 'severe_negative',
					type: 'broken_promise',
					evidence: 'Compass finance promised payment by 12 May. Today is 16 May, no UTR shared.',
					said_by: 'counterparty',
					speaker_name: 'Rohan Sharma',
				},
				{
					severity: 'mild_negative',
					type: 'silence',
					evidence: 'No response to the 13 May reminder; thread has gone quiet for 4 days.',
					said_by: 'counterparty',
					speaker_name: null,
				},
			],
			positive_signals: [
				{
					type: 'fast_responder',
					evidence:
						'Rohan acknowledged the invoice within 4 hours of receipt and routed to finance same day.',
					said_by: 'counterparty',
					speaker_name: 'Rohan Sharma',
				},
				{
					type: 'good_history',
					evidence:
						'Compass has paid 22 of the last 24 invoices within their 30-day cycle.',
					said_by: 'unknown',
					speaker_name: null,
				},
			],
		},
		deep_link: gmailLink('CADxYz1@compass.com'),
	},
	{
		invoice: {
			zoho_invoice_id: '1101117000005180002',
			invoice_number: 'IB-2025-26/01187',
			customer_name: 'SODEXO FOOD SOLUTIONS INDIA PVT LTD',
			amount: 287450.0,
			balance: 287450.0,
			currency: 'INR',
			invoice_date: '2026-02-05',
			due_date: '2026-03-07',
			status: 'overdue',
			days_overdue: 70,
			zoho: { is_emailed: true, reminders_sent: 2, last_reminder_sent_date: '2026-05-05' },
		},
		coverage_class: 'gmail_tracked',
		thread: {
			provider_thread_id: '1856032350369242690',
			subject_first: 'Invoice IB-2025-26/01187 - Sodexo',
			message_count: 12,
			last_message_at: '2026-05-08T11:30:00',
			days_since_last_contact: 8,
			link_match_source: 'exact_invoice_number',
			link_match_confidence: 1.0,
			participants: [SWATI, 'accounts.payable@sodexo.com'],
		},
		ai: {
			summary_short:
				'Vendor disputing line items 3 and 4 — claiming GST mismatch. Awaiting clarification from our accounts team.',
			summary_long:
				'Sodexo AP raised concern about GST treatment on line items 3 and 4 of invoice IB-2025-26/01187. They have asked for a revised invoice or written clarification before processing payment. Our team has been silent for 8 days.',
			current_status: 'dispute',
			next_action: 'Send revised invoice or GST clarification within this week',
			priority: 'high',
			swati_role: 'initiator',
		},
		deep_link: gmailLink('CADxYz2@sodexo.com'),
	},
	{
		invoice: {
			zoho_invoice_id: '1101117000005180003',
			invoice_number: 'IB-2025-26/01244',
			customer_name: 'ZOMATO HYPERPURE PRIVATE LIMITED',
			amount: 156820.5,
			balance: 156820.5,
			currency: 'INR',
			invoice_date: '2026-02-20',
			due_date: '2026-03-22',
			status: 'overdue',
			days_overdue: 55,
			zoho: { is_emailed: true, reminders_sent: 3, last_reminder_sent_date: '2026-05-01' },
		},
		coverage_class: 'gmail_tracked',
		thread: {
			provider_thread_id: '1856032350369242691',
			subject_first: 'Payment reminder - IB-2025-26/01244',
			message_count: 8,
			last_message_at: '2026-04-15T09:45:00',
			days_since_last_contact: 31,
			link_match_source: 'exact_invoice_number',
			link_match_confidence: 1.0,
			participants: [SWATI, 'vendor.payments@zomato.com'],
		},
		ai: {
			summary_short:
				'Three follow-ups sent. Last reply 30+ days ago said "checking with finance". No response since.',
			summary_long:
				'Zomato Hyperpure has gone silent. The last meaningful response was 31 days ago citing a finance team review. Three subsequent reminders received no reply.',
			current_status: 'no_response',
			next_action: 'Escalate — 30 days silent after multiple touches',
			priority: 'high',
			swati_role: 'initiator',
		},
		deep_link: gmailLink('CADxYz3@zomato.com'),
	},
	{
		invoice: {
			zoho_invoice_id: '1101117000005180004',
			invoice_number: 'IB-2025-26/01298',
			customer_name: 'SWIGGY INSTAMART (BUNDL TECHNOLOGIES)',
			amount: 94320.75,
			balance: 94320.75,
			currency: 'INR',
			invoice_date: '2026-03-01',
			due_date: '2026-03-31',
			status: 'overdue',
			days_overdue: 46,
			zoho: { is_emailed: true, reminders_sent: 1, last_reminder_sent_date: '2026-05-09' },
		},
		coverage_class: 'gmail_tracked',
		thread: {
			provider_thread_id: '1856032350369242692',
			subject_first: 'Re: Invoice IB-2025-26/01298',
			message_count: 5,
			last_message_at: '2026-05-13T16:20:00',
			days_since_last_contact: 3,
			link_match_source: 'exact_invoice_number',
			link_match_confidence: 0.95,
			participants: [SWATI, 'ap.team@swiggy.in'],
		},
		ai: {
			summary_short:
				'Payment scheduled for 18 May per Swiggy AP team. UTR will be shared after release.',
			summary_long:
				'Swiggy AP confirmed the invoice is approved in their system. They have scheduled the release for 18 May and will share the UTR via email after the transfer.',
			current_status: 'promised_to_pay',
			next_action: 'Wait until 18 May, then verify UTR',
			priority: 'medium',
			swati_role: 'initiator',
		},
		deep_link: gmailLink('CADxYz4@swiggy.in'),
	},

	// ── zoho_emailed_only: Zoho sent the invoice but no thread in Gmail ────────
	{
		invoice: {
			zoho_invoice_id: '1101117000005180005',
			invoice_number: 'IB-2025-26/01312',
			customer_name: 'BLINKIT (GROFERS INDIA PVT LTD)',
			amount: 64500.0,
			balance: 64500.0,
			currency: 'INR',
			invoice_date: '2026-03-05',
			due_date: '2026-04-04',
			status: 'overdue',
			days_overdue: 42,
			zoho: {
				is_emailed: true,
				reminders_sent: 2,
				last_reminder_sent_date: '2026-05-02',
				email_history: [
					{
						date: '2026-03-05',
						recipients: ['ap@blinkit.com'],
						is_reminder: false,
					},
					{
						date: '2026-04-12',
						recipients: ['ap@blinkit.com', 'finance@blinkit.com'],
						is_reminder: true,
					},
					{
						date: '2026-05-02',
						recipients: ['ap@blinkit.com', 'finance@blinkit.com', 'escalations@blinkit.com'],
						is_reminder: true,
					},
				],
			},
		},
		coverage_class: 'zoho_emailed_only',
		thread: null,
		ai: null,
		deep_link: null,
	},
	{
		invoice: {
			zoho_invoice_id: '1101117000005180020',
			invoice_number: 'IB-2025-26/01401',
			customer_name: 'MARRIOTT HOTELS INDIA PVT LTD',
			amount: 215000.0,
			balance: 215000.0,
			currency: 'INR',
			invoice_date: '2026-03-22',
			due_date: '2026-04-21',
			status: 'overdue',
			days_overdue: 25,
			zoho: {
				is_emailed: true,
				reminders_sent: 1,
				last_reminder_sent_date: '2026-05-12',
				email_history: [
					{
						date: '2026-03-22',
						recipients: ['payables@marriott.com'],
						is_reminder: false,
					},
					{
						date: '2026-05-12',
						recipients: ['payables@marriott.com'],
						is_reminder: true,
					},
				],
			},
		},
		coverage_class: 'zoho_emailed_only',
		thread: null,
		ai: null,
		deep_link: null,
	},

	// ── gmail_tracked: more variety ────────────────────────────────────────────
	{
		invoice: {
			zoho_invoice_id: '1101117000005180006',
			invoice_number: 'IB-2025-26/01355',
			customer_name: 'BIG BASKET (SUPERMARKET GROCERY SUPPLIES PVT LTD)',
			amount: 218900.0,
			balance: 218900.0,
			currency: 'INR',
			invoice_date: '2026-03-12',
			due_date: '2026-04-11',
			status: 'overdue',
			days_overdue: 35,
			zoho: { is_emailed: true, reminders_sent: 2, last_reminder_sent_date: '2026-05-10' },
		},
		coverage_class: 'gmail_tracked',
		thread: {
			provider_thread_id: '1856032350369242694',
			subject_first: 'Re: Invoice IB-2025-26/01355 BigBasket',
			message_count: 6,
			last_message_at: '2026-05-14T10:10:00',
			days_since_last_contact: 2,
			link_match_source: 'exact_invoice_number',
			link_match_confidence: 1.0,
			participants: [SWATI, 'payables@bigbasket.com', 'finance.lead@bigbasket.com'],
		},
		ai: {
			summary_short:
				'BigBasket finance lead replied today asking for vendor bank confirmation letter on letterhead.',
			summary_long:
				'BigBasket finance has approved the invoice contingent on a bank confirmation letter. They have not raised any disputes on the amount itself.',
			current_status: 'replied',
			next_action: 'Share bank confirmation letter today',
			priority: 'medium',
			swati_role: 'initiator',
		},
		deep_link: gmailLink('CADxYz6@bigbasket.com'),
	},
	{
		invoice: {
			zoho_invoice_id: '1101117000005180007',
			invoice_number: 'IB-2025-26/01390',
			customer_name: 'DUNZO DAILY (DUNZO DIGITAL PVT LTD)',
			amount: 41200.0,
			balance: 41200.0,
			currency: 'INR',
			invoice_date: '2026-03-18',
			due_date: '2026-04-17',
			status: 'overdue',
			days_overdue: 29,
			zoho: { is_emailed: true, reminders_sent: 2, last_reminder_sent_date: '2026-05-08' },
		},
		coverage_class: 'gmail_tracked',
		thread: {
			provider_thread_id: '1856032350369242695',
			subject_first: 'Invoice IB-2025-26/01390 Dunzo',
			message_count: 3,
			last_message_at: '2026-04-20T13:40:00',
			days_since_last_contact: 26,
			link_match_source: 'subject_fuzzy',
			link_match_confidence: 0.82,
			participants: [SWATI, 'accounts@dunzo.com'],
		},
		ai: {
			summary_short:
				'Two reminders sent. Customer auto-reply said "your email has been received" — no human response since.',
			summary_long:
				'Dunzo AP only returns auto-acknowledgements. No human response has been received in 26 days. Phone follow-up recommended.',
			current_status: 'no_response',
			next_action: 'Try phone follow-up — emails not reaching team',
			priority: 'medium',
			swati_role: 'initiator',
		},
		deep_link: gmailLink('CADxYz7@dunzo.com'),
	},
	{
		invoice: {
			zoho_invoice_id: '1101117000005180008',
			invoice_number: 'IB-2025-26/01412',
			customer_name: 'LICIOUS (DELIGHTFUL GOURMET PVT LTD)',
			amount: 88750.5,
			balance: 88750.5,
			currency: 'INR',
			invoice_date: '2026-03-25',
			due_date: '2026-04-24',
			status: 'overdue',
			days_overdue: 22,
			zoho: { is_emailed: true, reminders_sent: 1, last_reminder_sent_date: '2026-05-05' },
		},
		coverage_class: 'gmail_tracked',
		thread: {
			provider_thread_id: '1856032350369242696',
			subject_first: 'Invoice IB-2025-26/01412 Licious',
			message_count: 4,
			last_message_at: '2026-05-10T17:00:00',
			days_since_last_contact: 6,
			link_match_source: 'exact_invoice_number',
			link_match_confidence: 1.0,
			participants: [SWATI, 'vendor.ops@licious.in'],
		},
		ai: {
			summary_short:
				'Customer asked for proof of delivery for 3 SKUs before processing payment.',
			summary_long:
				'Licious vendor ops requested POD for 3 SKUs in the invoice. KAM team needs to pull and share them.',
			current_status: 'dispute',
			next_action: 'Pull POD from KAM team and share',
			priority: 'medium',
			swati_role: 'initiator',
		},
		deep_link: gmailLink('CADxYz8@licious.in'),
	},
	{
		invoice: {
			zoho_invoice_id: '1101117000005180009',
			invoice_number: 'IB-2025-26/01435',
			customer_name: 'FRESHTOHOME FOODS PRIVATE LIMITED',
			amount: 32600.0,
			balance: 32600.0,
			currency: 'INR',
			invoice_date: '2026-04-01',
			due_date: '2026-05-01',
			status: 'overdue',
			days_overdue: 15,
			zoho: { is_emailed: true, reminders_sent: 1, last_reminder_sent_date: '2026-05-12' },
		},
		coverage_class: 'gmail_tracked',
		thread: {
			provider_thread_id: '1856032350369242697',
			subject_first: 'Invoice IB-2025-26/01435 FreshToHome',
			message_count: 2,
			last_message_at: '2026-05-15T09:00:00',
			days_since_last_contact: 1,
			link_match_source: 'exact_invoice_number',
			link_match_confidence: 1.0,
			participants: [SWATI, 'rajesh@freshtohome.com'],
		},
		ai: {
			summary_short:
				'Rajesh confirmed payment will be released this week. Initial PO match-back complete.',
			summary_long:
				'FreshToHome confirmed PO match. Payment expected to be released by end of this week.',
			current_status: 'promised_to_pay',
			next_action: 'Verify payment receipt by Friday',
			priority: 'low',
			swati_role: 'initiator',
		},
		deep_link: gmailLink('CADxYz9@freshtohome.com'),
	},
	{
		invoice: {
			zoho_invoice_id: '1101117000005180010',
			invoice_number: 'IB-2025-26/01468',
			customer_name: 'COUNTRY DELIGHT (NUTRITION CULTURE PVT LTD)',
			amount: 142300.0,
			balance: 142300.0,
			currency: 'INR',
			invoice_date: '2026-04-05',
			due_date: '2026-05-05',
			status: 'overdue',
			days_overdue: 11,
			zoho: { is_emailed: true, reminders_sent: 1, last_reminder_sent_date: '2026-05-06' },
		},
		coverage_class: 'gmail_tracked',
		thread: {
			provider_thread_id: '1856032350369242698',
			subject_first: 'Invoice IB-2025-26/01468',
			message_count: 1,
			last_message_at: '2026-05-06T08:30:00',
			days_since_last_contact: 10,
			link_match_source: 'exact_invoice_number',
			link_match_confidence: 1.0,
			participants: [SWATI, 'payables@countrydelight.in'],
		},
		ai: {
			summary_short:
				'One reminder sent post-due. No response received from customer yet.',
			summary_long:
				'A single reminder went out after the due date. Customer has not responded for 10 days.',
			current_status: 'no_response',
			next_action: 'Send second reminder',
			priority: 'medium',
			swati_role: 'initiator',
		},
		deep_link: gmailLink('CADxYz10@countrydelight.in'),
	},
	{
		invoice: {
			zoho_invoice_id: '1101117000005180011',
			invoice_number: 'IB-2025-26/01492',
			customer_name: 'RELIANCE RETAIL LIMITED',
			amount: 1284500.0,
			balance: 1284500.0,
			currency: 'INR',
			invoice_date: '2026-04-10',
			due_date: '2026-05-10',
			status: 'overdue',
			days_overdue: 6,
			zoho: { is_emailed: true, reminders_sent: 1, last_reminder_sent_date: '2026-05-13' },
		},
		coverage_class: 'gmail_tracked',
		thread: {
			provider_thread_id: '1856032350369242699',
			subject_first: 'GST clarification - IB-2025-26/01492',
			message_count: 9,
			last_message_at: '2026-05-15T11:25:00',
			days_since_last_contact: 1,
			link_match_source: 'exact_invoice_number',
			link_match_confidence: 1.0,
			participants: [SWATI, 'vendor.finance@ril.com', 'gst.team@ril.com'],
		},
		ai: {
			summary_short:
				'GST team flagged HSN mismatch on one line. Replied yesterday with corrected breakup. Approval pending.',
			summary_long:
				'Reliance Retail GST team flagged a single line item HSN mismatch. We sent the corrected breakup yesterday. Awaiting their approval before payment release.',
			current_status: 'acknowledged',
			next_action: 'Wait for Reliance GST team approval',
			priority: 'high',
			swati_role: 'initiator',
		},
		deep_link: gmailLink('CADxYz11@ril.com'),
	},
	{
		invoice: {
			zoho_invoice_id: '1101117000005180012',
			invoice_number: 'IB-2025-26/01510',
			customer_name: 'ZEPTO (KIRANAKART TECHNOLOGIES PVT LTD)',
			amount: 78900.0,
			balance: 78900.0,
			currency: 'INR',
			invoice_date: '2026-04-15',
			due_date: '2026-05-15',
			status: 'overdue',
			days_overdue: 1,
			zoho: { is_emailed: true, reminders_sent: 0, last_reminder_sent_date: null },
		},
		coverage_class: 'gmail_tracked',
		thread: {
			provider_thread_id: '1856032350369242700',
			subject_first: 'Invoice IB-2025-26/01510 Zepto',
			message_count: 2,
			last_message_at: '2026-05-14T15:45:00',
			days_since_last_contact: 2,
			link_match_source: 'exact_invoice_number',
			link_match_confidence: 1.0,
			participants: [SWATI, 'vendor.ap@zeptonow.com'],
		},
		ai: {
			summary_short:
				'Invoice acknowledged. Customer queued payment as per due date — expected on or before 15 May.',
			summary_long:
				'Zepto AP queued payment as per due date. Expected on or before 15 May.',
			current_status: 'acknowledged',
			next_action: 'Verify payment on due date',
			priority: 'low',
			swati_role: 'initiator',
		},
		deep_link: gmailLink('CADxYz12@zeptonow.com'),
	},
	{
		invoice: {
			zoho_invoice_id: '1101117000005180013',
			invoice_number: 'IB-2025-26/01533',
			customer_name: 'CARGILL INDIA PRIVATE LIMITED',
			amount: 365200.0,
			balance: 365200.0,
			currency: 'INR',
			invoice_date: '2026-04-20',
			due_date: '2026-05-20',
			status: 'sent',
			days_overdue: 0,
			zoho: { is_emailed: true, reminders_sent: 0, last_reminder_sent_date: null },
		},
		coverage_class: 'gmail_tracked',
		thread: {
			provider_thread_id: '1856032350369242701',
			subject_first: 'Invoice IB-2025-26/01533 Cargill',
			message_count: 1,
			last_message_at: '2026-04-21T10:00:00',
			days_since_last_contact: 25,
			link_match_source: 'exact_invoice_number',
			link_match_confidence: 1.0,
			participants: [SWATI, 'ap.in@cargill.com'],
		},
		ai: {
			summary_short:
				'Invoice sent on issue date. No follow-up needed yet — within payment cycle.',
			summary_long:
				'Sent on issue date. Within standard payment cycle — no action required yet.',
			current_status: 'sent',
			next_action: 'No action needed until due date approaches',
			priority: 'low',
			swati_role: 'initiator',
		},
		deep_link: gmailLink('CADxYz13@cargill.com'),
	},
	{
		invoice: {
			zoho_invoice_id: '1101117000005180014',
			invoice_number: 'IB-2025-26/01548',
			customer_name: 'ITC LIMITED',
			amount: 489000.0,
			balance: 489000.0,
			currency: 'INR',
			invoice_date: '2026-04-22',
			due_date: '2026-05-22',
			status: 'sent',
			days_overdue: 0,
			zoho: { is_emailed: true, reminders_sent: 0, last_reminder_sent_date: null },
		},
		coverage_class: 'gmail_tracked',
		thread: {
			provider_thread_id: '1856032350369242702',
			subject_first: 'Vendor master update - ITC',
			message_count: 3,
			last_message_at: '2026-05-13T12:00:00',
			days_since_last_contact: 3,
			link_match_source: 'customer_thread',
			link_match_confidence: 0.7,
			participants: [SWATI, 'vendor.master@itc.in'],
		},
		ai: {
			summary_short: 'ITC requested vendor master update before processing. Form submitted today.',
			summary_long:
				'ITC vendor master team requested an update before processing the new invoice. Updated form has been submitted.',
			current_status: 'awaiting_internal',
			next_action: 'Wait for vendor master confirmation',
			priority: 'medium',
			swati_role: 'initiator',
		},
		deep_link: gmailLink('CADxYz14@itc.in'),
	},

	// ── paid ──────────────────────────────────────────────────────────────────
	{
		invoice: {
			zoho_invoice_id: '1101117000005180015',
			invoice_number: 'IB-2025-26/01170',
			customer_name: 'HALDIRAMS SNACKS PRIVATE LIMITED',
			amount: 198450.0,
			balance: 0.0,
			currency: 'INR',
			invoice_date: '2026-01-25',
			due_date: '2026-02-24',
			status: 'paid',
			days_overdue: 0,
			zoho: { is_emailed: true, reminders_sent: 1, last_reminder_sent_date: '2026-04-30' },
		},
		coverage_class: 'gmail_tracked',
		thread: {
			provider_thread_id: '1856032350369242703',
			subject_first: 'Payment confirmation - IB-2025-26/01170',
			message_count: 6,
			last_message_at: '2026-05-09T18:30:00',
			days_since_last_contact: 7,
			link_match_source: 'exact_invoice_number',
			link_match_confidence: 1.0,
			participants: [SWATI, 'accounts@haldirams.com'],
		},
		ai: {
			summary_short:
				'Payment received via NEFT on 9 May. UTR HDFCN52026050912345. Closed.',
			summary_long: 'Payment received in full via NEFT on 9 May. UTR recorded. Thread closed.',
			current_status: 'paid',
			next_action: 'No action — payment closed',
			priority: 'low',
			swati_role: 'initiator',
		},
		deep_link: gmailLink('CADxYz15@haldirams.com'),
	},
	{
		invoice: {
			zoho_invoice_id: '1101117000005180016',
			invoice_number: 'IB-2025-26/01195',
			customer_name: 'PARLE PRODUCTS PRIVATE LIMITED',
			amount: 102000.0,
			balance: 0.0,
			currency: 'INR',
			invoice_date: '2026-01-30',
			due_date: '2026-03-01',
			status: 'paid',
			days_overdue: 0,
			zoho: { is_emailed: true, reminders_sent: 2, last_reminder_sent_date: '2026-04-20' },
		},
		coverage_class: 'gmail_tracked',
		thread: {
			provider_thread_id: '1856032350369242704',
			subject_first: 'Re: Invoice IB-2025-26/01195',
			message_count: 4,
			last_message_at: '2026-04-28T14:00:00',
			days_since_last_contact: 18,
			link_match_source: 'exact_invoice_number',
			link_match_confidence: 1.0,
			participants: [SWATI, 'finance@parleproducts.com'],
		},
		ai: {
			summary_short: 'Paid in full on 28 April. No outstanding queries.',
			summary_long: 'Paid in full on 28 April. Thread closed without queries.',
			current_status: 'paid',
			next_action: 'No action — payment closed',
			priority: 'low',
			swati_role: 'initiator',
		},
		deep_link: gmailLink('CADxYz16@parleproducts.com'),
	},

	// ── partial / dispute ─────────────────────────────────────────────────────
	{
		invoice: {
			zoho_invoice_id: '1101117000005180017',
			invoice_number: 'IB-2025-26/01218',
			customer_name: 'AMUL (GUJARAT COOPERATIVE MILK MARKETING FED.)',
			amount: 67400.0,
			balance: 27400.0,
			currency: 'INR',
			invoice_date: '2026-02-08',
			due_date: '2026-03-10',
			status: 'overdue',
			days_overdue: 67,
			zoho: { is_emailed: true, reminders_sent: 4, last_reminder_sent_date: '2026-05-08' },
		},
		coverage_class: 'gmail_tracked',
		thread: {
			provider_thread_id: '1856032350369242705',
			subject_first: 'TDS reconciliation - IB-2025-26/01218',
			message_count: 11,
			last_message_at: '2026-05-11T16:00:00',
			days_since_last_contact: 5,
			link_match_source: 'exact_invoice_number',
			link_match_confidence: 1.0,
			participants: [SWATI, 'vendor.payments@amul.coop'],
		},
		ai: {
			summary_short:
				'Partial payment of ₹40,000 received. Balance ₹27,400 disputed — TDS deduction mismatch under review.',
			summary_long:
				'Amul released ₹40,000 against this invoice. The remaining ₹27,400 is held pending TDS reconciliation. Customer is awaiting a TDS certificate match-back.',
			current_status: 'partial',
			next_action: 'Share TDS certificate reconciliation',
			priority: 'high',
			swati_role: 'initiator',
		},
		deep_link: gmailLink('CADxYz17@amul.coop'),
	},

	// ── still_draft: Zoho-side only, never sent ───────────────────────────────
	{
		invoice: {
			zoho_invoice_id: '1101117000005180018',
			invoice_number: 'IB-2025-26/01580',
			customer_name: 'PARAMOUNT FOOD WORKS LLP',
			amount: 54200.0,
			balance: 54200.0,
			currency: 'INR',
			invoice_date: '2026-05-10',
			due_date: '2026-06-09',
			status: 'draft',
			days_overdue: 0,
			zoho: { is_emailed: false, reminders_sent: 0, last_reminder_sent_date: null },
		},
		coverage_class: 'still_draft',
		thread: null,
		ai: null,
		deep_link: null,
	},
	{
		invoice: {
			zoho_invoice_id: '1101117000005180019',
			invoice_number: 'IB-2025-26/01581',
			customer_name: 'GREENPLY KITCHEN INDIA PVT LTD',
			amount: 38900.0,
			balance: 38900.0,
			currency: 'INR',
			invoice_date: '2026-05-12',
			due_date: '2026-06-11',
			status: 'draft',
			days_overdue: 0,
			zoho: { is_emailed: false, reminders_sent: 0, last_reminder_sent_date: null },
		},
		coverage_class: 'still_draft',
		thread: null,
		ai: null,
		deep_link: null,
	},

	// ── pre_tracking_column: invoice exists before email tracking began ───────
	{
		invoice: {
			zoho_invoice_id: '1101117000005180021',
			invoice_number: 'IB-2025-26/01092',
			customer_name: 'TATA STARBUCKS PRIVATE LIMITED',
			amount: 124800.0,
			balance: 124800.0,
			currency: 'INR',
			invoice_date: '2026-01-08',
			due_date: '2026-02-07',
			status: 'overdue',
			days_overdue: 98,
			zoho: { is_emailed: true, reminders_sent: 5, last_reminder_sent_date: '2026-04-15' },
		},
		coverage_class: 'pre_tracking_column',
		thread: null,
		ai: null,
		deep_link: null,
	},

	// ── more gmail_tracked variety ────────────────────────────────────────────
	{
		invoice: {
			zoho_invoice_id: '1101117000005180022',
			invoice_number: 'IB-2025-26/01330',
			customer_name: 'BRITANNIA INDUSTRIES LIMITED',
			amount: 318900.0,
			balance: 318900.0,
			currency: 'INR',
			invoice_date: '2026-03-10',
			due_date: '2026-04-09',
			status: 'overdue',
			days_overdue: 37,
			zoho: { is_emailed: true, reminders_sent: 2, last_reminder_sent_date: '2026-05-11' },
		},
		coverage_class: 'gmail_tracked',
		thread: {
			provider_thread_id: '1856032350369242707',
			subject_first: 'Invoice IB-2025-26/01330 Britannia',
			message_count: 7,
			last_message_at: '2026-05-13T10:50:00',
			days_since_last_contact: 3,
			link_match_source: 'exact_invoice_number',
			link_match_confidence: 1.0,
			participants: [SWATI, 'vendor.finance@britannia.co.in'],
		},
		ai: {
			summary_short:
				'Britannia confirmed approval in their system. Payment release scheduled for week of 19 May.',
			summary_long:
				'Britannia vendor finance confirmed approval. Release scheduled for the week starting 19 May.',
			current_status: 'promised_to_pay',
			next_action: 'Verify release on 19 May',
			priority: 'medium',
			swati_role: 'initiator',
		},
		deep_link: gmailLink('CADxYz19@britannia.co.in'),
	},
	{
		invoice: {
			zoho_invoice_id: '1101117000005180023',
			invoice_number: 'IB-2025-26/01378',
			customer_name: 'DABUR INDIA LIMITED',
			amount: 89500.0,
			balance: 89500.0,
			currency: 'INR',
			invoice_date: '2026-03-17',
			due_date: '2026-04-16',
			status: 'overdue',
			days_overdue: 30,
			zoho: { is_emailed: true, reminders_sent: 2, last_reminder_sent_date: '2026-05-13' },
		},
		coverage_class: 'gmail_tracked',
		thread: {
			provider_thread_id: '1856032350369242708',
			subject_first: 'Invoice IB-2025-26/01378 Dabur',
			message_count: 2,
			last_message_at: '2026-05-15T07:55:00',
			days_since_last_contact: 1,
			link_match_source: 'exact_invoice_number',
			link_match_confidence: 1.0,
			participants: [SWATI, 'sundry.creditors@dabur.com'],
		},
		ai: {
			summary_short:
				'Replied yesterday — Dabur asked for proof of supply. Will pull GRN from KAM.',
			summary_long: 'Dabur sundry creditors team asked for GRN proof. KAM follow-up needed today.',
			current_status: 'replied',
			next_action: 'Share GRN proof today',
			priority: 'medium',
			swati_role: 'initiator',
		},
		deep_link: gmailLink('CADxYz20@dabur.com'),
	},
];

// ── Summary derived from items (mirrors what real backend would produce) ──────

const computeSummary = (items: FollowUpItem[]): FollowUpSummary => {
	const cb = {
		gmail_tracked: 0,
		zoho_emailed_only: 0,
		still_draft: 0,
		pre_tracking_column: 0,
		real_gap: 0,
	};
	const sb: SummaryStatusBreakdown = {
		overdue: { count: 0, balance: 0, oldest_days: 0 },
		sent: { count: 0, balance: 0 },
		paid: { count: 0, amount: 0 },
		draft: { count: 0, amount: 0 },
		void: { count: 0 },
		other: { count: 0 },
	};
	const aiCurrent: Partial<Record<ThreadStatus, number>> = {};
	const aiPriority: Partial<Record<Priority, number>> = {};
	const aiBall: Partial<Record<BallInCourt, number>> = {};

	let totalAmount = 0;
	let totalBalance = 0;
	let realGapBalance = 0;

	for (const it of items) {
		cb[it.coverage_class] += 1;
		totalAmount += it.invoice.amount;
		totalBalance += it.invoice.balance;
		if (it.coverage_class === 'real_gap') {
			realGapBalance += it.invoice.balance;
		}

		// status_breakdown
		const s = it.invoice.status;
		if (s === 'overdue') {
			sb.overdue.count += 1;
			sb.overdue.balance += it.invoice.balance;
			if (it.invoice.days_overdue > sb.overdue.oldest_days) {
				sb.overdue.oldest_days = it.invoice.days_overdue;
			}
		} else if (s === 'sent') {
			sb.sent.count += 1;
			sb.sent.balance += it.invoice.balance;
		} else if (s === 'paid') {
			sb.paid.count += 1;
			sb.paid.amount += it.invoice.amount;
		} else if (s === 'draft') {
			sb.draft.count += 1;
			sb.draft.amount += it.invoice.amount;
		} else if (s === 'void') {
			sb.void.count += 1;
		} else {
			sb.other.count += 1;
		}

		// ai_breakdown
		if (it.ai) {
			aiCurrent[it.ai.current_status] = (aiCurrent[it.ai.current_status] || 0) + 1;
			aiPriority[it.ai.priority] = (aiPriority[it.ai.priority] || 0) + 1;
			if (it.ai.ball_in_court) {
				aiBall[it.ai.ball_in_court] = (aiBall[it.ai.ball_in_court] || 0) + 1;
			}
		}
	}

	const round2 = (n: number) => Math.round(n * 100) / 100;
	sb.overdue.balance = round2(sb.overdue.balance);
	sb.sent.balance = round2(sb.sent.balance);
	sb.paid.amount = round2(sb.paid.amount);
	sb.draft.amount = round2(sb.draft.amount);

	const invoicesTotal = items.length;
	const invoicesCovered = invoicesTotal - cb.real_gap;
	const coveragePct = invoicesTotal === 0 ? 100 : (invoicesCovered / invoicesTotal) * 100;

	return {
		account_email: SWATI,
		window_days: 30,
		since_date: '2026-04-15',
		invoices_total: invoicesTotal,
		invoices_covered: invoicesCovered,
		invoices_real_gap: cb.real_gap,
		coverage_pct: Math.round(coveragePct * 10) / 10,
		coverage_breakdown: cb,
		total_amount: round2(totalAmount),
		total_balance: round2(totalBalance),
		real_gap_balance: round2(realGapBalance),
		status_breakdown: sb,
		ai_breakdown: {
			current_status: aiCurrent,
			priority: aiPriority,
			ball_in_court: aiBall,
		},
	};
};

export const MOCK_FOLLOW_UP_RESPONSE: FollowUpResponse = {
	summary: computeSummary(MOCK_ITEMS),
	pagination: { page: 1, limit: 100, returned: MOCK_ITEMS.length },
	items: MOCK_ITEMS,
};

/**
 * Simulates the API call. When the live endpoint ships, replace the body with:
 *
 *   const { data } = await axios.get('/v1/api/email/invoice-threads', { params });
 *   return data;
 */
export const fetchFollowUpData = (
	_params: {
		account_email?: string;
		days?: number;
		status?: string;
		customer?: string;
		has_email?: 'yes' | 'no' | 'all';
		priority?: string;
		current_status?: string;
		limit?: number;
		page?: number;
	} = {}
): Promise<FollowUpResponse> => {
	return new Promise(resolve => {
		setTimeout(() => resolve(MOCK_FOLLOW_UP_RESPONSE), 400);
	});
};
