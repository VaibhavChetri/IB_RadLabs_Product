/**
 * Mock data + types for Module 2 — Customer Intelligence.
 *
 * Backend: GET /v1/api/customers/intelligence  (ranked + filterable + paginated)
 *          POST /v1/api/customers/intelligence/refresh  (one or all customers)
 *
 * Types derived from the live response shape (verified against the running
 * backend on 2026-05-17 with `concentrix-bng` test user). Some enum values
 * are documented but not yet observed live (`low` severity, `resolving`
 * trending, `informal` style, `fast` responsiveness) — kept in the unions
 * for completeness so the UI handles them when they appear.
 *
 * IMPORTANT: handling_guide can be null entirely (~49% of customers as of
 * verification). The brief documents rich/sparse/new branches but not the
 * "AI hasn't processed yet" state. UI must defend against that fourth case.
 */

// ── Enums ────────────────────────────────────────────────────────────────────

export type RelationshipHealth = 'healthy' | 'watch' | 'at_risk';

export type ConcernSeverity = 'high' | 'medium' | 'low';

export type ConcernTrending = 'escalating' | 'stable' | 'resolving';

export type HandlingDataDepth = 'rich' | 'sparse' | 'new';

export type CommunicationStyle = 'formal' | 'informal' | 'transactional';

export type Responsiveness = 'fast' | 'moderate' | 'slow' | 'erratic';

export type LeadPriority = 'high' | 'medium' | 'low';

export type SortKey =
	| 'priority'
	| 'outstanding'
	| 'overdue'
	| 'reliability'
	| 'thread_count'
	| 'last_contact'
	| 'invoice_count'
	| 'concerns';

// ── Row blocks ───────────────────────────────────────────────────────────────

export interface CustomerInvoiceBlock {
	count: number;
	paid: number;
	overdue: number;
	sent: number;
	draft: number;
	void: number;
	total_revenue: number;
	total_paid: number;
	total_outstanding: number;
	payment_reliability_pct: number;
	/** Backend will populate later; null in current data. */
	avg_days_to_pay: number | null;
	oldest_overdue_days: number;
}

export interface CustomerCadenceBlock {
	thread_count: number;
	their_avg_response_days: number | null;
	our_avg_response_days: number | null;
	last_contact_at: string | null;
	longest_silence_streak_days: number;
}

export interface CustomerPatternsBlock {
	broken_commitments: number;
	active_disputes: number;
	ball_in_our_court: number;
	ball_in_their_court: number;
	escalations: number;
}

export interface CustomerConcern {
	concern: string; // slug
	title: string;
	description: string;
	severity: ConcernSeverity;
	appearances: number;
	trending: ConcernTrending;
	first_seen: string;
	last_seen: string;
	representative_thread_ids: string[];
	sample_quotes: string[];
}

export interface CommunicationProfile {
	style: CommunicationStyle | null;
	responsiveness: Responsiveness | null;
	typical_response_days: number | null;
	primary_poc: string | null;
	decision_maker: string | null;
}

export interface NewLeadPriorityGuidance {
	default_priority: LeadPriority;
	rationale: string;
	warnings: string[];
}

/**
 * Tactical brief for whoever interacts next. data_depth controls which sub-
 * fields are populated:
 *
 * - "rich": all fields filled
 * - "sparse": communication_profile / what_works / what_doesnt_work /
 *             psychological_notes are NULL; last_conversation_summary +
 *             new_lead_priority_guidance are populated
 * - "new": no prior interactions
 *
 * Plus the implicit fourth state where the entire HandlingGuide is null on
 * the parent (AI hasn't processed this customer yet).
 */
export interface HandlingGuide {
	data_depth: HandlingDataDepth;
	communication_profile: CommunicationProfile | null;
	what_works: string[] | null;
	what_doesnt_work: string[] | null;
	psychological_notes: string | null;
	last_conversation_summary: string | null;
	new_lead_priority_guidance: NewLeadPriorityGuidance | null;
}

export interface CustomerAIBlock {
	overall_relationship_health: RelationshipHealth;
	/** Null when the AI hasn't processed this customer yet. */
	key_insight: string | null;
	concerns_count: number;
	concerns: CustomerConcern[];
	/** NULL when AI hasn't processed yet — fourth state beyond rich/sparse/new. */
	handling_guide: HandlingGuide | null;
	model: string | null;
	generated_at: string | null;
}

export interface CustomerScore {
	priority_score: number;
	/** 1 = highest priority. */
	priority_rank: number;
}

export interface CustomerIntelligenceItem {
	customer_name: string;
	account_email: string;
	invoices: CustomerInvoiceBlock;
	cadence: CustomerCadenceBlock;
	patterns: CustomerPatternsBlock;
	ai: CustomerAIBlock;
	score: CustomerScore;
	refreshed_at: string;
}

// ── Top-level response ───────────────────────────────────────────────────────

export interface CustomerIntelligenceSummary {
	account_email: string;
	customers_total: number;
	customers_with_concerns: number;
	customers_with_disputes: number;
	customers_with_escalations: number;
	health_breakdown: Record<RelationshipHealth, number>;
	total_outstanding_all: number;
	total_revenue_all: number;
	last_refreshed_at: string;
}

export interface CustomerIntelligencePagination {
	page: number;
	limit: number;
	returned: number;
	total: number;
	total_pages: number;
	has_more: boolean;
}

export interface CustomerIntelligenceResponse {
	summary: CustomerIntelligenceSummary;
	pagination: CustomerIntelligencePagination;
	items: CustomerIntelligenceItem[];
}

export interface RefreshRequestOneCustomer {
	customer: string;
}

export interface RefreshRequestAll {
	concurrency?: number;
	use_ai?: boolean;
}

export type RefreshRequest = RefreshRequestOneCustomer | RefreshRequestAll;

// ── Mock data ────────────────────────────────────────────────────────────────

/** A "rich" customer — Sodexo BLR. Lifted from live response shape. */
const MOCK_RICH: CustomerIntelligenceItem = {
	customer_name: 'SODEXO INDIA SERVICES PRIVATE LIMITED - BLR',
	account_email: 'swati@getinfinitybox.com',
	invoices: {
		count: 264,
		paid: 195,
		overdue: 49,
		sent: 12,
		draft: 1,
		void: 7,
		total_revenue: 142890314.2,
		total_paid: 129848021.17,
		total_outstanding: 13042293.03,
		payment_reliability_pct: 79.17,
		avg_days_to_pay: null,
		oldest_overdue_days: 325,
	},
	cadence: {
		thread_count: 84,
		their_avg_response_days: 3.4,
		our_avg_response_days: 0.9,
		last_contact_at: '2026-05-12T12:15:06.000Z',
		longest_silence_streak_days: 14,
	},
	patterns: {
		broken_commitments: 12,
		active_disputes: 3,
		ball_in_our_court: 18,
		ball_in_their_court: 31,
		escalations: 11,
	},
	ai: {
		overall_relationship_health: 'at_risk',
		key_insight:
			'Sodexo is a large customer with significant outstanding (₹1.3 Cr) and a chronic pattern of payment delays driven by PO/GRN coordination gaps rather than disputes. Persistence works — they do pay eventually — but reliability is poor.',
		concerns_count: 4,
		concerns: [
			{
				concern: 'payment_delays_overdue_invoices',
				title: 'Persistent Payment Delays & Overdue Invoices',
				description:
					'Sodexo frequently delays payments, leading to a high volume and value of overdue invoices, often for several months.',
				severity: 'high',
				appearances: 15,
				trending: 'stable',
				first_seen: '2026-02-28T05:39:06.000Z',
				last_seen: '2026-05-11T08:10:18.000Z',
				representative_thread_ids: [
					'1864366817984806696',
					'1864870449058945947',
					'1864343917131807185',
				],
				sample_quotes: [
					'concerns about 4 months of pending payments',
					'14 overdue/unbooked invoices totaling ₹1.2 Cr',
					'6 overdue invoices totaling ₹1.36M; no response',
				],
			},
			{
				concern: 'po_grn_processing_gaps',
				title: 'PO / GRN Processing Gaps',
				description:
					'Invoices repeatedly stall in their AP system due to missing or pending GRNs from site teams. Customer acknowledges but cannot self-unblock.',
				severity: 'high',
				appearances: 9,
				trending: 'escalating',
				first_seen: '2026-01-12T10:00:00.000Z',
				last_seen: '2026-05-09T14:22:00.000Z',
				representative_thread_ids: ['1858101218511251780', '1858528746166302550'],
				sample_quotes: [
					'awaiting GRN from site team for PO XYZ',
					'invoice rejected because PO had not been raised at time of supply',
				],
			},
			{
				concern: 'invoice_discrepancies_disputes',
				title: 'Invoice Discrepancies & Disputes',
				description:
					'Multiple disputes over HSN codes, inventory counts, and quantity mismatches requiring revised invoices.',
				severity: 'medium',
				appearances: 6,
				trending: 'stable',
				first_seen: '2026-02-05T09:30:00.000Z',
				last_seen: '2026-04-22T11:00:00.000Z',
				representative_thread_ids: ['1859221218411251780'],
				sample_quotes: [
					'HSN code on invoice IB-2025-26/01414 needs revision',
					'inventory count mismatch — please share revised credit note',
				],
			},
			{
				concern: 'communication_handoffs',
				title: 'Communication Hand-offs & Multiple POCs',
				description:
					'Threads frequently change hands between Aditi, Naresh, Nilima, and SBS-APAC — context resets and follow-ups stall.',
				severity: 'medium',
				appearances: 5,
				trending: 'stable',
				first_seen: '2026-03-01T08:00:00.000Z',
				last_seen: '2026-05-08T16:30:00.000Z',
				representative_thread_ids: ['1860112218411251780'],
				sample_quotes: [
					'looping in Nilima from finance for this',
					'please coordinate with SBS-APAC team for processing',
				],
			},
		],
		handling_guide: {
			data_depth: 'rich',
			communication_profile: {
				style: 'formal',
				responsiveness: 'erratic',
				typical_response_days: null,
				primary_poc: 'Aditi Mehta, Naresh Kamerkar, Nilima Sawant, Aranya Roy (all Sodexo)',
				decision_maker:
					'Naresh Kamerkar, Nilima Sawant (involved in payment investigations), SBS-APAC Service Request team',
			},
			what_works: [
				'Persistent and consistent follow-up on all outstanding items.',
				'Escalating internally within Sodexo when promised timelines are missed.',
				'Providing meticulously detailed information and documentation (revised credit notes, packing slips).',
				'Scheduling direct calls for complex or long-standing disputes.',
				'Sodexo eventually processes payments, even if delayed — persistence pays off.',
			],
			what_doesnt_work: [
				'Expecting Sodexo to meet promised resolution or payment timelines without follow-up.',
				'Sending invoices without clear, pre-approved PO/GRN — consistently leads to delays.',
				'Failing to provide requested documentation (credit notes, packing slips, HSN codes) promptly.',
				'Assuming silence indicates resolution or that an issue has been forgotten.',
			],
			psychological_notes:
				"Sodexo operates within a large, bureaucratic system. While they acknowledge issues and make commitments, their internal coordination (GRN processing, site team POs) is often inefficient, leading to significant delays. They are reactive to persistent follow-ups and escalations. They are also prone to raising disputes over minor details (HSN codes, inventory counts) and requesting revisions, which further delays payment. Be meticulously organized with documentation and maintain a consistent firm follow-up schedule.",
			last_conversation_summary:
				'On May 12, 2026, Sodexo confirmed payment for 6 invoices, which are now marked as paid in the ledger, resolving a previous query about pending payments.',
			new_lead_priority_guidance: {
				default_priority: 'high',
				rationale:
					'Despite frequent payment delays and disputes, Sodexo is a large customer with significant ongoing business. The volume and value of overdue invoices indicate a critical account requiring constant attention.',
				warnings: [
					'Frequent payment delays and overdue invoices.',
					'Recurring issues with missing or delayed PO/GRN processing.',
					'Propensity for invoice disputes and requests for revisions.',
					'Unreliable commitments requiring persistent follow-up.',
				],
			},
		},
		model: 'gemini-2.5-flash',
		generated_at: '2026-05-17T03:57:48.000Z',
	},
	score: { priority_score: 8124.5, priority_rank: 1 },
	refreshed_at: '2026-05-17T03:57:48.000Z',
};

/** A "sparse" customer — only 1-2 threads, behavioural fields null. */
const MOCK_SPARSE: CustomerIntelligenceItem = {
	customer_name: 'KOTAK MAHINDRA BANK LTD',
	account_email: 'swati@getinfinitybox.com',
	invoices: {
		count: 1,
		paid: 0,
		overdue: 0,
		sent: 1,
		draft: 0,
		void: 0,
		total_revenue: 124800,
		total_paid: 0,
		total_outstanding: 124800,
		payment_reliability_pct: 0,
		avg_days_to_pay: null,
		oldest_overdue_days: 0,
	},
	cadence: {
		thread_count: 1,
		their_avg_response_days: 2.0,
		our_avg_response_days: 0.5,
		last_contact_at: '2026-05-14T10:00:00.000Z',
		longest_silence_streak_days: 0,
	},
	patterns: {
		broken_commitments: 0,
		active_disputes: 0,
		ball_in_our_court: 1,
		ball_in_their_court: 0,
		escalations: 0,
	},
	ai: {
		overall_relationship_health: 'watch',
		key_insight:
			'New customer with only 1 conversation so far. Acknowledged invoice and requested supporting documents (bill, NDC) before processing.',
		concerns_count: 0,
		concerns: [],
		handling_guide: {
			data_depth: 'sparse',
			communication_profile: null,
			what_works: null,
			what_doesnt_work: null,
			psychological_notes: null,
			last_conversation_summary:
				'The customer acknowledged invoice IB-2026-27/0076 and requested the associated bill and NDC. InfinityBox is responsible for sending these documents as the next action.',
			new_lead_priority_guidance: {
				default_priority: 'medium',
				rationale:
					'Based on the single interaction, the customer is awaiting documents from us to proceed with their internal processes.',
				warnings: ['Outstanding request for bill and NDC.'],
			},
		},
		model: 'gemini-2.5-flash',
		generated_at: '2026-05-17T04:00:00.000Z',
	},
	score: { priority_score: 612.29, priority_rank: 9 },
	refreshed_at: '2026-05-17T04:00:00.000Z',
};

/** A customer the AI hasn't fully processed — handling_guide entirely null. */
const MOCK_NULL_HANDLING: CustomerIntelligenceItem = {
	customer_name: 'Momoz Restaurant',
	account_email: 'swati@getinfinitybox.com',
	invoices: {
		count: 2,
		paid: 1,
		overdue: 0,
		sent: 1,
		draft: 0,
		void: 0,
		total_revenue: 18400,
		total_paid: 9200,
		total_outstanding: 9200,
		payment_reliability_pct: 50,
		avg_days_to_pay: null,
		oldest_overdue_days: 0,
	},
	cadence: {
		thread_count: 0,
		their_avg_response_days: null,
		our_avg_response_days: null,
		last_contact_at: null,
		longest_silence_streak_days: 0,
	},
	patterns: {
		broken_commitments: 0,
		active_disputes: 0,
		ball_in_our_court: 0,
		ball_in_their_court: 0,
		escalations: 0,
	},
	ai: {
		overall_relationship_health: 'healthy',
		key_insight: null,
		concerns_count: 0,
		concerns: [],
		handling_guide: null,
		model: null,
		generated_at: null,
	},
	score: { priority_score: 84.0, priority_rank: 87 },
	refreshed_at: '2026-05-16T22:00:00.000Z',
};

const MOCK_ITEMS: CustomerIntelligenceItem[] = [
	MOCK_RICH,
	MOCK_SPARSE,
	MOCK_NULL_HANDLING,
];

export const MOCK_CUSTOMER_INTELLIGENCE_RESPONSE: CustomerIntelligenceResponse = {
	summary: {
		account_email: 'swati@getinfinitybox.com',
		customers_total: MOCK_ITEMS.length,
		customers_with_concerns: MOCK_ITEMS.filter(i => i.ai.concerns_count > 0).length,
		customers_with_disputes: MOCK_ITEMS.filter(i => i.patterns.active_disputes > 0).length,
		customers_with_escalations: MOCK_ITEMS.filter(i => i.patterns.escalations > 0).length,
		health_breakdown: MOCK_ITEMS.reduce(
			(acc, it) => {
				acc[it.ai.overall_relationship_health] += 1;
				return acc;
			},
			{ healthy: 0, watch: 0, at_risk: 0 } as Record<RelationshipHealth, number>
		),
		total_outstanding_all: MOCK_ITEMS.reduce(
			(s, it) => s + it.invoices.total_outstanding,
			0
		),
		total_revenue_all: MOCK_ITEMS.reduce((s, it) => s + it.invoices.total_revenue, 0),
		last_refreshed_at: '2026-05-17T04:00:00.000Z',
	},
	pagination: {
		page: 1,
		limit: 50,
		returned: MOCK_ITEMS.length,
		total: MOCK_ITEMS.length,
		total_pages: 1,
		has_more: false,
	},
	items: MOCK_ITEMS,
};
