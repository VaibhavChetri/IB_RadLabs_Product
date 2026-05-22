/**
 * Centralized status → label/color mapping for the Follow-Up Tracker.
 * Keeps colour decisions away from JSX so the visual rules are auditable.
 */

import type {
	ThreadStatus,
	Priority,
	CoverageClass,
	InvoiceStatus,
	BallInCourt,
	PaymentIntent,
	SentimentTrajectory,
	PaymentWindow,
	RiskSeverity,
	RiskType,
	CommitmentKept,
	ActionItemStatus,
	PositiveSignalType,
	SignalSpeaker,
} from '../../../mocks/followUpTracker';

export interface PillVisual {
	label: string;
	pillClasses: string;
	accentClasses: string;
	hint: string;
}

// ── AI conversation status ───────────────────────────────────────────────────

export const THREAD_STATUS_VISUAL: Record<ThreadStatus, PillVisual> = {
	dispute: {
		label: 'Dispute',
		pillClasses: 'bg-red-50 text-red-700 border-red-200',
		accentClasses: 'border-l-red-500',
		hint: 'Customer is contesting line items, GST, or PO match.',
	},
	no_response: {
		label: 'No Response',
		pillClasses: 'bg-amber-50 text-amber-800 border-amber-200',
		accentClasses: 'border-l-amber-500',
		hint: 'Reminders sent — silence beyond expected reply window.',
	},
	promised_to_pay: {
		label: 'Promised to Pay',
		pillClasses: 'bg-amber-50 text-amber-800 border-amber-200',
		accentClasses: 'border-l-amber-500',
		hint: 'Customer committed to a payment date.',
	},
	replied: {
		label: 'Replied',
		pillClasses: 'bg-emerald-50 text-emerald-700 border-emerald-200',
		accentClasses: 'border-l-emerald-500',
		hint: 'Customer sent a fresh reply — needs your turn.',
	},
	replied_recently: {
		label: 'Replied',
		pillClasses: 'bg-emerald-50 text-emerald-700 border-emerald-200',
		accentClasses: 'border-l-emerald-500',
		hint: 'Customer sent a fresh reply — needs your turn.',
	},
	acknowledged: {
		label: 'Acknowledged',
		pillClasses: 'bg-sky-50 text-sky-700 border-sky-200',
		accentClasses: 'border-l-sky-400',
		hint: 'Customer confirmed receipt; awaiting processing.',
	},
	awaiting_internal: {
		label: 'Awaiting (us)',
		pillClasses: 'bg-violet-50 text-violet-700 border-violet-200',
		accentClasses: 'border-l-violet-400',
		hint: 'Blocked on InfinityBox — KAM, GRN, or form pending from our side.',
	},
	paid: {
		label: 'Paid',
		pillClasses: 'bg-emerald-50 text-emerald-700 border-emerald-200',
		accentClasses: 'border-l-emerald-500',
		hint: 'Closed — payment received in full.',
	},
	partial: {
		label: 'Partial',
		pillClasses: 'bg-amber-50 text-amber-800 border-amber-200',
		accentClasses: 'border-l-amber-500',
		hint: 'Part of invoice paid; balance under review.',
	},
	sent: {
		label: 'Sent',
		pillClasses: 'bg-slate-100 text-slate-700 border-slate-200',
		accentClasses: 'border-l-slate-400',
		hint: 'Invoice sent, no reply expected yet.',
	},
	unknown: {
		label: 'Unknown',
		pillClasses: 'bg-slate-100 text-slate-600 border-slate-200',
		accentClasses: 'border-l-slate-300',
		hint: 'Status could not be inferred from this thread.',
	},
};

// ── Priority ──────────────────────────────────────────────────────────────────

export const PRIORITY_VISUAL: Record<
	Priority,
	{ label: string; classes: string; dot: string; stripe: string }
> = {
	high: {
		label: 'High',
		classes: 'bg-red-50 text-red-700 border-red-200',
		dot: 'bg-red-500',
		stripe: 'border-l-red-500',
	},
	medium: {
		label: 'Medium',
		classes: 'bg-amber-50 text-amber-700 border-amber-200',
		dot: 'bg-amber-500',
		stripe: 'border-l-amber-400',
	},
	low: {
		label: 'Low',
		classes: 'bg-slate-50 text-slate-600 border-slate-200',
		dot: 'bg-slate-400',
		stripe: 'border-l-slate-300',
	},
};

// ── Coverage class (where the invoice sits in our tracking pipeline) ─────────

export interface CoverageVisual extends PillVisual {
	/** Solid colour used for the breakdown segment bar (tailwind bg). */
	segmentBg: string;
	/** Short single-word label for the table chip. */
	shortLabel: string;
}

export const COVERAGE_VISUAL: Record<CoverageClass, CoverageVisual> = {
	gmail_tracked: {
		label: 'Gmail tracked',
		shortLabel: 'Gmail',
		pillClasses: 'bg-emerald-50 text-emerald-700 border-emerald-200',
		accentClasses: 'border-l-emerald-400',
		segmentBg: 'bg-emerald-500',
		hint: 'Linked to a Gmail thread — full conversation visible.',
	},
	zoho_emailed_only: {
		label: 'Zoho-sent only',
		shortLabel: 'Zoho only',
		pillClasses: 'bg-amber-50 text-amber-800 border-amber-200',
		accentClasses: 'border-l-amber-400',
		segmentBg: 'bg-amber-500',
		hint: 'Zoho sent the invoice but no Gmail thread is linked yet.',
	},
	still_draft: {
		label: 'Draft',
		shortLabel: 'Draft',
		pillClasses: 'bg-slate-100 text-slate-700 border-slate-200',
		accentClasses: 'border-l-slate-300',
		segmentBg: 'bg-slate-400',
		hint: 'Invoice exists in Zoho but has not been sent.',
	},
	pre_tracking_column: {
		label: 'Pre-tracking',
		shortLabel: 'Pre-track',
		pillClasses: 'bg-slate-100 text-slate-700 border-slate-200',
		accentClasses: 'border-l-slate-300',
		segmentBg: 'bg-slate-300',
		hint: 'Predates the email-tracking column — historical record.',
	},
	real_gap: {
		label: 'NO EMAIL',
		shortLabel: 'NO EMAIL',
		pillClasses: 'bg-red-50 text-red-700 border-red-300 font-semibold',
		accentClasses: 'border-l-red-500',
		segmentBg: 'bg-red-500',
		hint: 'No email correspondence anywhere — needs first outreach.',
	},
};

// ── Invoice status (Zoho-side) ───────────────────────────────────────────────

export const INVOICE_STATUS_VISUAL: Record<InvoiceStatus, { label: string; classes: string }> = {
	overdue: { label: 'Overdue', classes: 'bg-red-50 text-red-700 border-red-200' },
	sent: { label: 'Sent', classes: 'bg-sky-50 text-sky-700 border-sky-200' },
	paid: { label: 'Paid', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
	draft: { label: 'Draft', classes: 'bg-slate-100 text-slate-700 border-slate-200' },
	void: { label: 'Void', classes: 'bg-slate-100 text-slate-500 border-slate-200 line-through' },
};

// ── Enumerations exported for the sidebar ────────────────────────────────────

export const ALL_THREAD_STATUSES: ThreadStatus[] = [
	'dispute',
	'no_response',
	'promised_to_pay',
	'replied',
	'acknowledged',
	'awaiting_internal',
	'paid',
	'partial',
	'sent',
];

export const ALL_PRIORITIES: Priority[] = ['high', 'medium', 'low'];

export const ALL_COVERAGE_CLASSES: CoverageClass[] = [
	'gmail_tracked',
	'zoho_emailed_only',
	'real_gap',
	'still_draft',
	'pre_tracking_column',
];

export const ALL_INVOICE_STATUSES: InvoiceStatus[] = [
	'overdue',
	'sent',
	'paid',
	'draft',
	'void',
];

// ── Module 1.6: ball_in_court — who owes the next move ──────────────────────

export interface BallInCourtVisual {
	label: string;
	short: string;
	classes: string;
	dot: string;
	hint: string;
}

export const BALL_IN_COURT_VISUAL: Record<BallInCourt, BallInCourtVisual> = {
	infinitybox: {
		label: 'You (InfinityBox)',
		short: 'You',
		classes: 'bg-orange-50 text-orange-700 border-orange-200',
		dot: 'bg-orange-500',
		hint: 'InfinityBox needs to act next — share doc, send reminder, escalate.',
	},
	customer: {
		label: 'Customer',
		short: 'Customer',
		classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
		dot: 'bg-emerald-500',
		hint: 'Customer owes us a reply, document, or payment.',
	},
	internal_finance: {
		label: 'Internal finance',
		short: 'Internal',
		classes: 'bg-sky-50 text-sky-700 border-sky-200',
		dot: 'bg-sky-500',
		hint: 'Blocked on InfinityBox finance — approval, GRN, internal note.',
	},
	vendor: {
		label: 'Vendor',
		short: 'Vendor',
		classes: 'bg-violet-50 text-violet-700 border-violet-200',
		dot: 'bg-violet-500',
		hint: 'A third-party vendor needs to act.',
	},
	third_party: {
		label: 'Third party',
		short: '3rd party',
		classes: 'bg-purple-50 text-purple-700 border-purple-200',
		dot: 'bg-purple-500',
		hint: 'Bank, courier, or other external party in the loop.',
	},
	unclear: {
		label: 'Unclear',
		short: 'Unclear',
		classes: 'bg-slate-100 text-slate-600 border-slate-200',
		dot: 'bg-slate-400',
		hint: 'AI could not determine who owns the next step.',
	},
};

export const ALL_BALL_IN_COURT: BallInCourt[] = [
	'infinitybox',
	'customer',
	'internal_finance',
	'vendor',
	'third_party',
	'unclear',
];

// ── Module 1.6: payment_intent ──────────────────────────────────────────────

export const PAYMENT_INTENT_VISUAL: Record<PaymentIntent, { label: string; classes: string }> = {
	committed: {
		label: 'Committed',
		classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
	},
	cooperative: {
		label: 'Cooperative',
		classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
	},
	evasive: { label: 'Evasive', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
	hostile: { label: 'Hostile', classes: 'bg-red-50 text-red-700 border-red-200' },
	unresponsive: {
		label: 'Unresponsive',
		classes: 'bg-amber-50 text-amber-700 border-amber-200',
	},
	n_a: { label: 'N/A', classes: 'bg-slate-100 text-slate-500 border-slate-200' },
	unknown: { label: 'Unknown', classes: 'bg-slate-100 text-slate-500 border-slate-200' },
};

// ── Module 1.6: sentiment trajectory ────────────────────────────────────────

export const SENTIMENT_VISUAL: Record<SentimentTrajectory, { label: string; classes: string; arrow: string }> = {
	improving: {
		label: 'Improving',
		classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
		arrow: '↗',
	},
	stable_positive: {
		label: 'Stable (positive)',
		classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
		arrow: '→',
	},
	stable_neutral: {
		label: 'Stable',
		classes: 'bg-slate-50 text-slate-600 border-slate-200',
		arrow: '→',
	},
	stable_negative: {
		label: 'Stable (negative)',
		classes: 'bg-amber-50 text-amber-700 border-amber-200',
		arrow: '→',
	},
	deteriorating: {
		label: 'Deteriorating',
		classes: 'bg-red-50 text-red-700 border-red-200',
		arrow: '↘',
	},
	n_a: {
		label: 'N/A',
		classes: 'bg-slate-100 text-slate-500 border-slate-200',
		arrow: '—',
	},
	unknown: {
		label: 'Unknown',
		classes: 'bg-slate-100 text-slate-500 border-slate-200',
		arrow: '?',
	},
};

// ── Module 1.6: predicted payment window ────────────────────────────────────

export const PAYMENT_WINDOW_VISUAL: Record<PaymentWindow, { label: string; classes: string }> = {
	likely_this_week: {
		label: 'Likely this week',
		classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
	},
	this_month: {
		label: 'This month',
		classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
	},
	next_30_90_days: {
		label: '30–90 days',
		classes: 'bg-amber-50 text-amber-700 border-amber-200',
	},
	beyond_90: {
		label: 'Beyond 90 days',
		classes: 'bg-amber-50 text-amber-700 border-amber-200',
	},
	unlikely_without_escalation: {
		label: 'Unlikely without escalation',
		classes: 'bg-red-50 text-red-700 border-red-200',
	},
	n_a: { label: 'N/A', classes: 'bg-slate-100 text-slate-500 border-slate-200' },
	unknown: { label: 'Unknown', classes: 'bg-slate-100 text-slate-500 border-slate-200' },
};

// ── Module 1.6: risk severity + type ────────────────────────────────────────

export const RISK_SEVERITY_VISUAL: Record<RiskSeverity, { classes: string; iconColor: string }> = {
	positive: {
		classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
		iconColor: 'text-emerald-600',
	},
	mild_negative: {
		classes: 'bg-amber-50 text-amber-800 border-amber-200',
		iconColor: 'text-amber-600',
	},
	severe_negative: {
		classes: 'bg-red-50 text-red-700 border-red-300',
		iconColor: 'text-red-600',
	},
};

export const RISK_TYPE_LABEL: Record<RiskType, string> = {
	broken_promise: 'Broken promise',
	silence: 'Silence',
	tone_escalation: 'Tone escalation',
	dispute: 'Dispute',
	cash_flow_hint: 'Cash-flow signal',
	scope_creep: 'Scope creep',
	third_party_involved: 'Third party',
	other: 'Other',
};

// ── Module 1.7: positive signal types + speaker attribution ─────────────────

export const POSITIVE_SIGNAL_TYPE_LABEL: Record<PositiveSignalType, string> = {
	fast_responder: 'Fast responder',
	good_history: 'Good history',
	on_time_payment: 'On-time payment',
	cooperative_tone: 'Cooperative tone',
	proactive_communication: 'Proactive comms',
	other: 'Other',
};

export const SIGNAL_SPEAKER_LABEL: Record<SignalSpeaker, string> = {
	infinitybox: 'us',
	counterparty: 'them',
	third_party: '3rd party',
	unknown: 'unknown',
};

// ── Module 1.6: commitment / action-item status ─────────────────────────────

export const COMMITMENT_KEPT_VISUAL: Record<CommitmentKept, { label: string; classes: string }> = {
	kept: { label: 'Kept', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
	broken: { label: 'Broken', classes: 'bg-red-50 text-red-700 border-red-200' },
	too_early_to_tell: {
		label: 'Pending',
		classes: 'bg-amber-50 text-amber-700 border-amber-200',
	},
	unknown: {
		label: 'Unknown',
		classes: 'bg-slate-100 text-slate-500 border-slate-200',
	},
};

export const ACTION_STATUS_VISUAL: Record<ActionItemStatus, { label: string; classes: string }> = {
	pending: { label: 'Pending', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
	done: { label: 'Done', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
	blocked: { label: 'Blocked', classes: 'bg-red-50 text-red-700 border-red-200' },
	unknown: { label: 'Unknown', classes: 'bg-slate-100 text-slate-500 border-slate-200' },
};
