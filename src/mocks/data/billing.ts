/**
 * Mock routes: Billing & Customer Intelligence (LOCAL DEMO ONLY)
 * --------------------------------------------------------------------------
 * India-context AR / billing fake data so the Billing and Customer-Intelligence
 * menu features render fully with NO backend.
 *
 * Endpoints covered (paths are relative to the API base, e.g. /v1/api):
 *
 *   Billing report + invoice builder (services/billingApi.ts, InvoiceList / BillingDetails)
 *     GET  /billing/getFinalCumulativeBillingReport   { data: BillingReportRow[], billValue }
 *     GET  /inventory/getClientGroupMaster            ok(ClientGroup[])
 *     GET  /billing/gethsnsac                         { ...,  result: HsnSac[] }
 *     GET  /billing/getZohoSalesAccount               ok(SalesAccount[])
 *     POST /billing/createZohoInvoice                 ok(success)
 *     GET  /inventory/getClientByCity                 { status_code, result: ClientByCityItem[] }
 *
 *   Client health / Pulse / Clients ledger / Broken commitments / Overdue behaviour
 *     GET  /customers/health                          { customers[], meta }   (unwrapped)
 *
 *   Customer Intelligence
 *     GET  /customers/intelligence                    { summary, pagination, items[] } (unwrapped)
 *     POST /customers/intelligence/refresh            { status, customers_refreshed, took_ms }
 *
 *   Smart Follow-Up Tracker
 *     GET  /email/invoice-threads                     { summary, pagination, items[], customer_rollups[] } (unwrapped)
 *
 *   Pipeline Gaps / CEO overview
 *     GET  /reports/pipeline-gaps                     { fy_summary[], customers[], summary } (unwrapped)
 *
 *   Mutations (defensive — log follow-up etc.) → success envelope
 *     POST /email/invoice-threads/:id/follow-up
 *     POST /customers/health/commitments
 *     PUT/PATCH/DELETE on the above resources
 *
 * NOTE: the inventory/getClientByCity + inventory/getClientGroupMaster routes
 * are owned here because the Billing pages depend on them for dropdowns and no
 * other module supplies them; they are NOT the commonApi/locationApi cities/
 * states/facilities dropdowns (which another module owns).
 */

import { MockRoute, MockRequest } from '../mockTypes';
import {
	ok,
	seeded,
	list,
	COMPANIES,
	formatINR,
	isoDate,
	isoDateTime,
	dateAgo,
	dateAhead,
	TODAY,
	type Rng,
} from '../mockHelpers';

/* ------------------------------------------------------------------ *
 * Shared helpers
 * ------------------------------------------------------------------ */

const SWATI = 'swati@getinfinitybox.com';

/** GST-style legal suffix to make brand names read like real billing entities. */
const LEGAL_SUFFIX = [
	'PRIVATE LIMITED',
	'INDIA PVT LTD',
	'TECHNOLOGIES PVT LTD',
	'FOODS PRIVATE LIMITED',
	'RETAIL LIMITED',
	'SERVICES PRIVATE LIMITED',
] as const;

/** A stable, India-flavoured "billing customer" name from a brand. */
function legalName(brand: string, rng: Rng): string {
	return `${brand.toUpperCase()} ${rng.pick(LEGAL_SUFFIX)}`;
}

/** Deterministic GSTIN-looking string. */
function gstin(rng: Rng): string {
	const stateCode = String(rng.int(1, 37)).padStart(2, '0');
	const pan = `${rng.pick(['AABCZ', 'AAACS', 'AAFCB', 'AAGCL', 'AADCF'])}${rng.int(1000, 9999)}${rng.pick(['A', 'B', 'C', 'F', 'P'])}`;
	return `${stateCode}${pan}1Z${rng.int(1, 9)}`;
}

/** Two-decimal string of a rupee amount (billing report uses string fields). */
const money2 = (n: number): string => n.toFixed(2);

/** Indian-grouped two-decimal string, e.g. "1,14,743.79" (billValue fields). */
function moneyGrouped(n: number): string {
	const fixed = n.toFixed(2);
	const [whole, frac] = fixed.split('.');
	const last3 = whole.slice(-3);
	const rest = whole.slice(0, -3);
	const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
	return `${rest ? grouped + ',' : ''}${last3}.${frac}`;
}

const CONTAINERS = [
	{ id: 1, name: 'Insulated Box 20L' },
	{ id: 2, name: 'Gel Pack 500g' },
	{ id: 3, name: 'Thermocol Liner' },
	{ id: 4, name: 'Reusable Crate 25L' },
	{ id: 5, name: 'EPS Cooler 40L' },
	{ id: 6, name: 'Dry Ice 5kg' },
	{ id: 7, name: 'Vacuum Bag' },
	{ id: 8, name: 'Temperature Logger' },
] as const;

/* ================================================================== *
 * 1. Billing report  +  invoice builder dropdowns
 * ================================================================== */

/** GET /billing/getFinalCumulativeBillingReport — { data: rows[], billValue } */
function billingReport(req: MockRequest) {
	const rng = seeded(req.path + (req.query.client_id || '') + (req.query.groupId || ''));
	const clientFilter = req.query.client_id;

	// Pick a working set of clients for this report.
	const clientCount = clientFilter ? 1 : rng.int(6, 10);
	const brands = rng.picks(COMPANIES, clientCount);

	let subTotal = 0;
	let cgstTot = 0;
	let sgstTot = 0;
	let grandTot = 0;

	const rows = brands.flatMap((brand, ci) => {
		const clientId = rng.int(100, 999);
		const zohoId = `1010${rng.int(100000000, 999999999)}`;
		const gst = gstin(rng);
		const linesPerClient = rng.int(2, 4);

		return Array.from({ length: linesPerClient }, () => {
			const container = rng.pick(CONTAINERS);
			const qty = rng.int(40, 1800);
			const rate = rng.float(12, 240, 2);
			const amount = +(qty * rate).toFixed(2);
			const cgst = +(amount * 0.09).toFixed(2);
			const sgst = +(amount * 0.09).toFixed(2);
			const total = +(amount + cgst + sgst).toFixed(2);

			subTotal += amount;
			cgstTot += cgst;
			sgstTot += sgst;
			grandTot += total;

			return {
				clientId,
				clientName: legalName(brand, seeded(brand + ci)),
				zoho_customer_id: zohoId,
				gst,
				containerTypeId: container.id,
				containerName: container.name,
				qty: qty.toLocaleString('en-IN'),
				rate: money2(rate),
				amount: moneyGrouped(amount),
				cgst: moneyGrouped(cgst),
				sgst: moneyGrouped(sgst),
				total: moneyGrouped(total),
			};
		});
	});

	// Matches BillingReportResponse: top-level status fields + data + billValue.
	return {
		status: 'Success',
		status_code: 200,
		statusCode: 200,
		message: null,
		data: rows,
		billValue: {
			subTotal: moneyGrouped(subTotal),
			cgst: moneyGrouped(cgstTot),
			sgst: moneyGrouped(sgstTot),
			total: moneyGrouped(grandTot),
		},
	};
}

/** GET /inventory/getClientGroupMaster — ok(ClientGroup[]). */
function clientGroupMaster(req: MockRequest) {
	const groups = list(
		8,
		(i, rng) => ({ id: i + 1, name: `${rng.pick(COMPANIES)} Group` }),
		req.path
	);
	return ok(groups);
}

/** GET /billing/gethsnsac — returns rows under `result` (not `data`). */
function hsnSac(_req: MockRequest) {
	const codes = [
		{ name: 'Cold-Chain Logistics Services', code: 996713 },
		{ name: 'Packaging & Crating Services', code: 998540 },
		{ name: 'Rental of Reusable Containers', code: 997319 },
		{ name: 'Warehousing of Frozen Goods', code: 996729 },
		{ name: 'Temperature-Controlled Storage', code: 996721 },
		{ name: 'Last-Mile Cold Delivery', code: 996719 },
	];
	const result = codes.map((c, i) => ({ id: i + 1, name: c.name, code: c.code }));
	return {
		status: 'Success',
		status_code: 200,
		statusCode: 200,
		message: null,
		result,
	};
}

/** GET /billing/getZohoSalesAccount — ok(SalesAccount[]). */
function zohoSalesAccount(req: MockRequest) {
	const accounts = list(
		6,
		(_i, rng) => ({
			accountId: String(rng.int(1000000, 9999999)),
			accountName: rng.pick([
				'Sales - Cold Chain',
				'Sales - Packaging',
				'Sales - Container Rental',
				'Sales - Storage',
				'Sales - Logistics',
				'Sales - Reusables',
			]),
		}),
		req.path
	);
	return ok(accounts);
}

/** GET /inventory/getClientByCity — { status_code, result: ClientByCityItem[] }. */
function clientByCity(req: MockRequest) {
	const brands = list(
		18,
		(i, rng) => ({
			clientId: rng.int(100, 9999),
			clientName: legalName(COMPANIES[i % COMPANIES.length], rng),
		}),
		req.path
	);
	// API "already includes an All option" per the page comment.
	const result = [{ clientId: 0, clientName: 'All' }, ...brands];
	return { status_code: 200, message: 'Success', result };
}

/* ================================================================== *
 * 2. Client Health  →  /customers/health   (Pulse, Ledger, Broken,
 *    Overdue-behaviour)  — UNWRAPPED { customers[], meta }
 * ================================================================== */

const SENTIMENTS = ['positive', 'neutral', 'negative', 'frustrated', 'cooperative'] as const;
const PAYMENT_INTENTS = ['committed', 'cooperative', 'evasive', 'unresponsive', 'hostile'] as const;
const BALL = ['infinitybox', 'customer', 'internal_finance'] as const;
const PRIORITIES = ['high', 'medium', 'low'] as const;
const RISK_TYPES = ['broken_promise', 'silence', 'tone_escalation', 'dispute', 'cash_flow_hint'] as const;
const PAY_WINDOWS = ['likely_this_week', 'this_month', 'next_30_90_days', 'beyond_90', 'unlikely_without_escalation'] as const;

function invoiceNumber(rng: Rng): string {
	return `IB-2025-26/${String(rng.int(1000, 1599)).padStart(5, '0')}`;
}

function buildHealthCustomer(brand: string, idx: number) {
	const rng = seeded('health:' + brand + idx);
	const name = legalName(brand, rng);
	const threadCount = rng.int(1, 9);

	let outstanding = 0;
	let overdue = 0;
	let overdueCount = 0;
	let highPriority = 0;
	let brokenTotal = 0;

	const threads = Array.from({ length: threadCount }, (_, ti) => {
		const trng = seeded('thread:' + brand + idx + ti);
		const threadOutstanding = trng.int(18000, 1400000);
		const isOverdue = trng.bool(0.6);
		const priority = trng.pick(PRIORITIES);
		const daysOpen = trng.int(3, 200);
		const followUps = trng.int(0, 8);
		const daysSince = trng.int(0, 45);

		outstanding += threadOutstanding;
		if (isOverdue) {
			overdue += threadOutstanding;
			overdueCount += 1;
		}
		if (priority === 'high') highPriority += 1;

		const brokenCount = trng.int(0, 3);
		brokenTotal += brokenCount;

		const brokenCommitments = Array.from({ length: brokenCount }, () => ({
			kept: 'broken' as const,
			what: `release payment of ${formatINR(trng.int(40000, 600000))}`,
			by_party: 'customer',
			deadline_text: `by ${isoDate(dateAgo(trng.int(2, 40)))}`,
		}));

		const riskCount = trng.int(0, 3);
		const riskSignals = Array.from({ length: riskCount }, () => {
			const type = trng.pick(RISK_TYPES);
			return {
				type,
				said_by: trng.pick(['counterparty', 'infinitybox', 'unknown']),
				evidence:
					type === 'broken_promise'
						? `Finance promised payment ${daysSince} days ago; no UTR shared.`
						: type === 'silence'
							? `No reply to the last reminder; thread quiet for ${daysSince} days.`
							: `Customer raised a ${type.replace(/_/g, ' ')} on the invoice.`,
				severity: trng.pick(['high', 'medium', 'low']),
				speaker_name: trng.bool(0.5) ? null : `${trng.pick(['Rohan', 'Aditi', 'Naresh', 'Priya'])} ${trng.pick(['Sharma', 'Mehta', 'Reddy'])}`,
				temporal_context: {
					days_open: daysOpen,
					follow_ups_since: followUps,
					days_since_latest: daysSince,
				},
			};
		});

		const pendingActions = Array.from({ length: trng.int(0, 2) }, () => ({
			owner: trng.pick(['infinitybox', 'customer']),
			status: trng.pick(['pending', 'blocked']),
			description: trng.pick([
				'Share TDS certificate reconciliation',
				'Resend revised invoice with PO match-back',
				'Pull POD from KAM team and share',
				'Send bank confirmation letter on letterhead',
			]),
			deadline_text: trng.bool(0.5) ? `by ${isoDate(dateAhead(trng.int(1, 7)))}` : null,
		}));

		const invCount = trng.int(1, 4);
		const invoiceNumbers = Array.from({ length: invCount }, () => invoiceNumber(trng)).join(', ');

		const firstMs = dateAgo(daysOpen);
		const lastMs = dateAgo(daysSince);

		return {
			provider_thread_id: `18560323503692${String(40000 + ti * 7 + idx).slice(0, 5)}`,
			subject: `Invoice ${invoiceNumber(trng)} - ${brand}`,
			first_message_at: isoDateTime(firstMs),
			last_message_at: isoDateTime(lastMs),
			message_count: trng.int(1, 48),
			summary: trng.pick([
				'Customer acknowledged invoice and committed to a payment date that has since slipped.',
				'Dispute raised over GST treatment on two line items; awaiting our clarification.',
				'Multiple reminders sent; customer has gone silent after an auto-acknowledgement.',
				'Partial payment received; balance held pending TDS reconciliation.',
				'PO/GRN coordination gap is blocking release in the customer AP system.',
			]),
			sentiment: trng.pick(SENTIMENTS),
			payment_intent: trng.pick(PAYMENT_INTENTS),
			ball_in_court: trng.pick(BALL),
			priority,
			next_action: trng.bool(0.8)
				? trng.pick([
						'Follow up for PO and GRN reference',
						'Escalate — 30 days silent after multiple touches',
						'Share revised invoice or GST clarification this week',
						'Verify payment receipt by Friday',
					])
				: null,
			risk_signals: riskSignals,
			broken_commitments: brokenCommitments,
			pending_actions: pendingActions,
			invoice_numbers: invoiceNumbers,
			thread_outstanding: threadOutstanding,
			their_avg_response_days: trng.bool(0.85) ? trng.float(0.5, 9, 1) : null,
			our_avg_response_days: trng.bool(0.9) ? trng.float(0.2, 3, 1) : null,
			predicted_payment_window: trng.bool(0.8) ? trng.pick(PAY_WINDOWS) : null,
		};
	});

	return {
		customer_name: name,
		total_outstanding: outstanding,
		overdue_balance: overdue,
		overdue_count: overdueCount,
		thread_count: threadCount,
		high_priority_count: highPriority,
		broken_commitment_count: brokenTotal,
		threads,
	};
}

/** GET /customers/health — unwrapped { customers, meta }. */
function clientHealth(req: MockRequest) {
	const customers = COMPANIES.slice(0, 24).map((brand, i) => buildHealthCustomer(brand, i));

	// Optional server-side filters mirrored loosely so the demo reacts.
	let filtered = customers;
	const q = (req.query.q || '').toLowerCase();
	if (q) filtered = filtered.filter(c => c.customer_name.toLowerCase().includes(q));
	if (req.query.min_outstanding) {
		const min = Number(req.query.min_outstanding);
		filtered = filtered.filter(c => c.total_outstanding >= min);
	}
	if (req.query.priority) {
		filtered = filtered.filter(c => c.threads.some(t => t.priority === req.query.priority));
	}
	if (req.query.sentiment) {
		filtered = filtered.filter(c => c.threads.some(t => t.sentiment === req.query.sentiment));
	}

	const meta = {
		total_customers: filtered.length,
		total_threads: filtered.reduce((s, c) => s + c.thread_count, 0),
		total_outstanding: filtered.reduce((s, c) => s + c.total_outstanding, 0),
		total_overdue: filtered.reduce((s, c) => s + c.overdue_balance, 0),
		total_broken_commitments: filtered.reduce((s, c) => s + c.broken_commitment_count, 0),
		total_high_priority: filtered.reduce((s, c) => s + c.high_priority_count, 0),
	};

	return { customers: filtered, meta };
}

/* ================================================================== *
 * 3. Customer Intelligence  →  /customers/intelligence
 *    UNWRAPPED { summary, pagination, items[] }
 * ================================================================== */

const HEALTHS = ['healthy', 'watch', 'at_risk'] as const;

function buildIntelItem(brand: string, idx: number) {
	const rng = seeded('intel:' + brand + idx);
	const name = legalName(brand, rng);

	const count = rng.int(1, 264);
	const paid = rng.int(0, count);
	const overdue = rng.int(0, count - paid);
	const sent = rng.int(0, Math.max(0, count - paid - overdue));
	const draft = rng.int(0, 2);
	const voidC = rng.int(0, 4);
	const revenue = rng.int(120000, 145000000);
	const paidAmt = +(revenue * rng.float(0.4, 0.95)).toFixed(2);
	const outstanding = +(revenue - paidAmt).toFixed(2);
	const reliability = +((paid / Math.max(1, count)) * 100).toFixed(2);

	const health = rng.pick(HEALTHS);
	const concernsCount = health === 'at_risk' ? rng.int(2, 5) : health === 'watch' ? rng.int(0, 2) : 0;
	const broken = health === 'at_risk' ? rng.int(2, 14) : rng.int(0, 2);
	const disputes = health === 'at_risk' ? rng.int(0, 4) : 0;
	const escalations = health === 'at_risk' ? rng.int(1, 12) : 0;

	const concerns = Array.from({ length: concernsCount }, (_, ci) => {
		const crng = seeded('concern:' + brand + idx + ci);
		return {
			concern: crng.pick([
				'payment_delays_overdue_invoices',
				'po_grn_processing_gaps',
				'invoice_discrepancies_disputes',
				'communication_handoffs',
			]),
			title: crng.pick([
				'Persistent Payment Delays & Overdue Invoices',
				'PO / GRN Processing Gaps',
				'Invoice Discrepancies & Disputes',
				'Communication Hand-offs & Multiple POCs',
			]),
			description: 'Recurring friction observed across multiple threads with this customer.',
			severity: crng.pick(['high', 'medium', 'low']),
			appearances: crng.int(2, 15),
			trending: crng.pick(['escalating', 'stable', 'resolving']),
			first_seen: isoDateTime(dateAgo(crng.int(60, 120))),
			last_seen: isoDateTime(dateAgo(crng.int(1, 30))),
			representative_thread_ids: Array.from(
				{ length: crng.int(1, 3) },
				() => `18${crng.int(58101218, 64870449)}${crng.int(10000000, 99999999)}`
			),
			sample_quotes: [
				`${crng.int(3, 14)} overdue invoices totaling ${formatINR(crng.int(100000, 13000000))}`,
				'awaiting GRN from site team for the referenced PO',
			],
		};
	});

	const hasGuide = rng.bool(0.55);
	const dataDepth = concernsCount > 1 ? 'rich' : count <= 2 ? 'new' : 'sparse';
	const handlingGuide =
		hasGuide && dataDepth !== 'new'
			? {
					data_depth: dataDepth,
					communication_profile:
						dataDepth === 'rich'
							? {
									style: rng.pick(['formal', 'informal', 'transactional']),
									responsiveness: rng.pick(['fast', 'moderate', 'slow', 'erratic']),
									typical_response_days: rng.bool(0.5) ? rng.float(1, 7, 1) : null,
									primary_poc: `${rng.pick(['Aditi', 'Naresh', 'Nilima', 'Rohan'])} ${rng.pick(['Mehta', 'Kamerkar', 'Sawant', 'Sharma'])}`,
									decision_maker: `${rng.pick(['Naresh', 'Nilima'])} ${rng.pick(['Kamerkar', 'Sawant'])} (finance)`,
								}
							: null,
					what_works:
						dataDepth === 'rich'
							? [
									'Persistent and consistent follow-up on all outstanding items.',
									'Escalating internally when promised timelines are missed.',
									'Providing meticulously detailed documentation.',
								]
							: null,
					what_doesnt_work:
						dataDepth === 'rich'
							? [
									'Expecting them to meet promised timelines without follow-up.',
									'Sending invoices without a pre-approved PO/GRN.',
								]
							: null,
					psychological_notes:
						dataDepth === 'rich'
							? 'Operates within a large, bureaucratic system; reactive to persistent follow-ups and escalations.'
							: null,
					last_conversation_summary:
						'Customer confirmed receipt and requested supporting documents before processing.',
					new_lead_priority_guidance: {
						default_priority: rng.pick(PRIORITIES),
						rationale: 'Significant ongoing business with a meaningful overdue balance.',
						warnings: ['Frequent payment delays.', 'Unreliable commitments requiring persistent follow-up.'],
					},
				}
			: null;

	const refreshed = isoDateTime(dateAgo(rng.int(0, 15)));

	return {
		customer_name: name,
		account_email: SWATI,
		invoices: {
			count,
			paid,
			overdue,
			sent,
			draft,
			void: voidC,
			total_revenue: revenue,
			total_paid: paidAmt,
			total_outstanding: outstanding,
			payment_reliability_pct: reliability,
			avg_days_to_pay: null,
			oldest_overdue_days: overdue > 0 ? rng.int(1, 325) : 0,
		},
		cadence: {
			thread_count: rng.int(0, 84),
			their_avg_response_days: rng.bool(0.85) ? rng.float(0.5, 9, 1) : null,
			our_avg_response_days: rng.bool(0.9) ? rng.float(0.2, 3, 1) : null,
			last_contact_at: rng.bool(0.85) ? isoDateTime(dateAgo(rng.int(0, 40))) : null,
			longest_silence_streak_days: rng.int(0, 30),
		},
		patterns: {
			broken_commitments: broken,
			active_disputes: disputes,
			ball_in_our_court: rng.int(0, 20),
			ball_in_their_court: rng.int(0, 35),
			escalations,
		},
		ai: {
			overall_relationship_health: health,
			key_insight: hasGuide
				? `${brand} carries ${formatINR(outstanding)} outstanding with a ${reliability}% payment-reliability track record; persistence works but reliability is uneven.`
				: null,
			concerns_count: concernsCount,
			concerns,
			handling_guide: handlingGuide,
			model: hasGuide ? 'gemini-2.5-flash' : null,
			generated_at: hasGuide ? refreshed : null,
		},
		score: {
			priority_score: +(rng.float(40, 8200, 2)),
			priority_rank: idx + 1,
		},
		refreshed_at: refreshed,
	};
}

/** GET /customers/intelligence — unwrapped { summary, pagination, items }. */
function customerIntelligence(req: MockRequest) {
	let items = COMPANIES.slice(0, 26).map((brand, i) => buildIntelItem(brand, i));

	// Optional filters.
	const q = (req.query.q || '').toLowerCase();
	if (q) items = items.filter(i => i.customer_name.toLowerCase().includes(q));
	if (req.query.health) {
		const set = req.query.health.split(',');
		items = items.filter(i => set.includes(i.ai.overall_relationship_health));
	}
	if (req.query.min_outstanding) {
		const min = Number(req.query.min_outstanding);
		items = items.filter(i => i.invoices.total_outstanding >= min);
	}
	if (req.query.has_concerns === 'yes') items = items.filter(i => i.ai.concerns_count > 0);
	if (req.query.has_concerns === 'no') items = items.filter(i => i.ai.concerns_count === 0);

	// Rank by priority_score (desc) then re-rank.
	items = items
		.slice()
		.sort((a, b) => b.score.priority_score - a.score.priority_score)
		.map((it, i) => ({ ...it, score: { ...it.score, priority_rank: i + 1 } }));

	const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
	const limit = Math.max(1, parseInt(req.query.limit || '50', 10) || 50);
	const total = items.length;
	const start = (page - 1) * limit;
	const pageItems = items.slice(start, start + limit);

	const healthBreakdown = items.reduce(
		(acc, it) => {
			acc[it.ai.overall_relationship_health] += 1;
			return acc;
		},
		{ healthy: 0, watch: 0, at_risk: 0 } as Record<string, number>
	);

	return {
		summary: {
			account_email: SWATI,
			customers_total: total,
			customers_with_concerns: items.filter(i => i.ai.concerns_count > 0).length,
			customers_with_disputes: items.filter(i => i.patterns.active_disputes > 0).length,
			customers_with_escalations: items.filter(i => i.patterns.escalations > 0).length,
			health_breakdown: healthBreakdown,
			total_outstanding_all: items.reduce((s, i) => s + i.invoices.total_outstanding, 0),
			total_revenue_all: items.reduce((s, i) => s + i.invoices.total_revenue, 0),
			last_refreshed_at: isoDateTime(dateAgo(0)),
		},
		pagination: {
			page,
			limit,
			returned: pageItems.length,
			total,
			total_pages: Math.max(1, Math.ceil(total / limit)),
			has_more: start + limit < total,
		},
		items: pageItems,
	};
}

/* ================================================================== *
 * 4. Smart Follow-Up Tracker  →  /email/invoice-threads
 *    UNWRAPPED { summary, pagination, items[], customer_rollups[] }
 * ================================================================== */

const COVERAGE = ['gmail_tracked', 'zoho_emailed_only', 'still_draft', 'pre_tracking_column', 'real_gap'] as const;
const INV_STATUS = ['overdue', 'sent', 'paid', 'draft'] as const;
const THREAD_STATUS = ['promised_to_pay', 'dispute', 'no_response', 'replied', 'acknowledged', 'awaiting_internal', 'sent', 'paid', 'partial'] as const;

const gmailLink = (msgId: string) =>
	`https://mail.google.com/mail/u/0/#search/rfc822msgid:${encodeURIComponent(msgId)}`;

function buildFollowUpItem(brand: string, idx: number) {
	const rng = seeded('followup:' + brand + idx);
	const name = legalName(brand, rng);
	const coverage = rng.pick(COVERAGE);
	const hasThread = coverage === 'gmail_tracked';
	const hasAi = hasThread;

	let status = rng.pick(INV_STATUS);
	if (coverage === 'still_draft') status = 'draft';
	const amount = rng.int(28000, 1300000);
	const isOverdue = status === 'overdue';
	const balance = status === 'paid' ? 0 : amount;
	const daysOverdue = isOverdue ? rng.int(1, 98) : 0;

	const invDate = isoDate(dateAgo(rng.int(15, 130)));
	const dueDate = isoDate(dateAgo(rng.int(0, 90)));
	const emailed = coverage !== 'real_gap' && coverage !== 'still_draft';
	const reminders = emailed ? rng.int(0, 5) : 0;

	const invoice = {
		zoho_invoice_id: `11011170000051${String(80000 + idx).slice(0, 5)}`,
		invoice_number: invoiceNumber(rng),
		customer_name: name,
		amount,
		balance,
		currency: 'INR',
		invoice_date: invDate,
		due_date: dueDate,
		status,
		days_overdue: daysOverdue,
		zoho: {
			is_emailed: emailed,
			reminders_sent: reminders,
			last_reminder_sent_date: reminders > 0 ? isoDate(dateAgo(rng.int(1, 30))) : null,
			email_history:
				reminders > 0
					? Array.from({ length: Math.min(reminders + 1, 4) }, (_, k) => ({
							date: isoDate(dateAgo(rng.int(1, 100))),
							recipients: [`ap@${brand.toLowerCase().replace(/[^a-z]/g, '')}.com`],
							is_reminder: k > 0,
						}))
					: undefined,
		},
	};

	const thread = hasThread
		? {
				provider_thread_id: `18560323503692${String(42000 + idx).slice(0, 5)}`,
				subject_first: `Invoice ${invoice.invoice_number} - ${brand}`,
				message_count: rng.int(1, 47),
				last_message_at: isoDateTime(dateAgo(rng.int(0, 31))).slice(0, 19),
				days_since_last_contact: rng.int(0, 31),
				link_match_source: rng.pick(['exact_invoice_number', 'subject_fuzzy', 'customer_thread']),
				link_match_confidence: rng.pick(['1.00', '0.95', '0.82', '0.70']),
				participants: [SWATI, `ap@${brand.toLowerCase().replace(/[^a-z]/g, '')}.com`],
			}
		: null;

	const ai = hasAi
		? {
				summary_short: rng.pick([
					'Customer acknowledged invoice. Promised payment this week.',
					'Vendor disputing GST treatment on two line items.',
					'Three follow-ups sent; no human response in 30+ days.',
					'Payment scheduled; UTR to be shared after release.',
				]),
				summary_long:
					'AI-summarised thread context for the demo: status reflects the latest meaningful reply and any commitments made.',
				current_status: rng.pick(THREAD_STATUS),
				next_action: rng.pick([
					'Follow up for PO and GRN reference',
					'Send revised invoice or GST clarification this week',
					'Escalate — silent after multiple touches',
					'Verify payment receipt by Friday',
				]),
				priority: rng.pick(PRIORITIES),
				swati_role: 'initiator',
				ball_in_court: rng.pick(BALL),
				payment_intent: rng.pick(PAYMENT_INTENTS),
				sentiment_trajectory: rng.pick(['improving', 'stable_neutral', 'deteriorating']),
				predicted_payment_window: rng.pick(PAY_WINDOWS),
				prediction_confidence: rng.float(0.4, 0.95, 2),
				their_avg_response_days: rng.float(0.5, 9, 1),
				our_avg_response_days: rng.float(0.2, 3, 1),
				action_items: [
					{
						description: 'Send PO copy and GRN reference for the invoice',
						owner: rng.pick(['customer', 'infinitybox']),
						deadline_text: 'this week',
						deadline_iso_date: isoDate(dateAhead(rng.int(1, 7))),
						status: 'pending',
					},
				],
				commitments:
					isOverdue && rng.bool(0.5)
						? [
								{
									by_party: 'customer',
									what: `release payment of ${formatINR(balance)}`,
									deadline_text: `by ${isoDate(dateAgo(rng.int(1, 20)))}`,
									deadline_iso_date: isoDate(dateAgo(rng.int(1, 20))),
									kept: 'broken',
								},
							]
						: [],
				documents_required: ['Revised invoice with PO match-back'],
				documents_pending_from_them: rng.bool(0.5) ? ['PO copy', 'GRN', 'TDS certificate'] : [],
				risk_signals: isOverdue
					? [
							{
								severity: rng.pick(['mild_negative', 'severe_negative']),
								type: rng.pick(RISK_TYPES),
								evidence: 'Promised payment date has slipped; thread has gone quiet.',
								said_by: 'counterparty',
								speaker_name: rng.bool(0.5) ? null : 'Rohan Sharma',
							},
						]
					: [],
				positive_signals: rng.bool(0.4)
					? [
							{
								type: 'good_history',
								evidence: `${brand} has paid the majority of recent invoices within cycle.`,
								said_by: 'unknown',
								speaker_name: null,
							},
						]
					: [],
			}
		: null;

	return {
		invoice,
		coverage_class: coverage,
		thread,
		ai,
		deep_link: hasThread ? gmailLink(`CADx${idx}@${brand.toLowerCase().replace(/[^a-z]/g, '')}.com`) : null,
	};
}

/** GET /email/invoice-threads — unwrapped { summary, pagination, items, customer_rollups }. */
function followUpThreads(req: MockRequest) {
	const all = COMPANIES.slice(0, 28).map((brand, i) => buildFollowUpItem(brand, i));

	// Light filtering to make the page filters feel live.
	let items = all;
	if (req.query.has_email === 'yes') items = items.filter(i => i.invoice.zoho.is_emailed);
	if (req.query.has_email === 'no') items = items.filter(i => !i.invoice.zoho.is_emailed);
	if (req.query.customer) {
		const c = req.query.customer.toLowerCase();
		items = items.filter(i => i.invoice.customer_name.toLowerCase().includes(c));
	}
	if (req.query.priority) items = items.filter(i => i.ai?.priority === req.query.priority);
	if (req.query.current_status) items = items.filter(i => i.ai?.current_status === req.query.current_status);
	if (req.query.status) items = items.filter(i => i.invoice.status === req.query.status);

	const round2 = (n: number) => Math.round(n * 100) / 100;
	const cb = { gmail_tracked: 0, zoho_emailed_only: 0, still_draft: 0, pre_tracking_column: 0, real_gap: 0 };
	const sb = {
		overdue: { count: 0, balance: 0, oldest_days: 0 },
		sent: { count: 0, balance: 0 },
		paid: { count: 0, amount: 0 },
		draft: { count: 0, amount: 0 },
		void: { count: 0 },
		other: { count: 0 },
	};
	const aiCurrent: Record<string, number> = {};
	const aiPriority: Record<string, number> = {};
	const aiBall: Record<string, number> = {};

	let totalAmount = 0;
	let totalBalance = 0;
	let realGapBalance = 0;

	for (const it of items) {
		cb[it.coverage_class] += 1;
		totalAmount += it.invoice.amount;
		totalBalance += it.invoice.balance;
		if (it.coverage_class === 'real_gap') realGapBalance += it.invoice.balance;

		const s = it.invoice.status;
		if (s === 'overdue') {
			sb.overdue.count += 1;
			sb.overdue.balance += it.invoice.balance;
			if (it.invoice.days_overdue > sb.overdue.oldest_days) sb.overdue.oldest_days = it.invoice.days_overdue;
		} else if (s === 'sent') {
			sb.sent.count += 1;
			sb.sent.balance += it.invoice.balance;
		} else if (s === 'paid') {
			sb.paid.count += 1;
			sb.paid.amount += it.invoice.amount;
		} else if (s === 'draft') {
			sb.draft.count += 1;
			sb.draft.amount += it.invoice.amount;
		} else {
			sb.other.count += 1;
		}

		if (it.ai) {
			aiCurrent[it.ai.current_status] = (aiCurrent[it.ai.current_status] || 0) + 1;
			aiPriority[it.ai.priority] = (aiPriority[it.ai.priority] || 0) + 1;
			if (it.ai.ball_in_court) aiBall[it.ai.ball_in_court] = (aiBall[it.ai.ball_in_court] || 0) + 1;
		}
	}

	sb.overdue.balance = round2(sb.overdue.balance);
	sb.sent.balance = round2(sb.sent.balance);
	sb.paid.amount = round2(sb.paid.amount);
	sb.draft.amount = round2(sb.draft.amount);

	const invoicesTotal = items.length;
	const invoicesCovered = invoicesTotal - cb.real_gap;
	const coveragePct = invoicesTotal === 0 ? 100 : (invoicesCovered / invoicesTotal) * 100;

	// Per-customer rollups (full history flavour).
	const byCustomer = new Map<string, typeof items>();
	for (const it of items) {
		const arr = byCustomer.get(it.invoice.customer_name) || [];
		arr.push(it);
		byCustomer.set(it.invoice.customer_name, arr);
	}
	const customerRollups = Array.from(byCustomer.entries()).map(([customer, rows]) => {
		const counts = { paid: 0, overdue: 0, sent: 0, draft: 0, void: 0, other: 0 };
		const aiCounts = { dispute: 0, promised_to_pay: 0, no_response: 0 };
		let amt = 0;
		let bal = 0;
		let paidAmt = 0;
		let overdueBal = 0;
		let oldest = 0;
		let lastContact: string | null = null;
		const invNums: string[] = [];
		for (const r of rows) {
			const s = r.invoice.status as keyof typeof counts;
			counts[s] = (counts[s] ?? 0) + 1;
			amt += r.invoice.amount;
			bal += r.invoice.balance;
			if (r.invoice.status === 'paid') paidAmt += r.invoice.amount;
			if (r.invoice.status === 'overdue') {
				overdueBal += r.invoice.balance;
				if (r.invoice.days_overdue > oldest) oldest = r.invoice.days_overdue;
			}
			if (r.ai?.current_status === 'dispute') aiCounts.dispute += 1;
			if (r.ai?.current_status === 'promised_to_pay') aiCounts.promised_to_pay += 1;
			if (r.ai?.current_status === 'no_response') aiCounts.no_response += 1;
			if (r.thread?.last_message_at) {
				if (!lastContact || r.thread.last_message_at > lastContact) lastContact = r.thread.last_message_at;
			}
			invNums.push(r.invoice.invoice_number);
		}
		return {
			customer_name: customer,
			invoice_count: rows.length,
			counts_by_status: counts,
			counts_by_ai_status: aiCounts,
			total_amount: round2(amt),
			total_balance: round2(bal),
			paid_amount: round2(paidAmt),
			overdue_balance: round2(overdueBal),
			oldest_overdue_days: oldest,
			last_contact_at: lastContact,
			real_gap_count: rows.filter(r => r.coverage_class === 'real_gap').length,
			invoice_numbers: invNums,
		};
	});

	const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
	const limit = Math.max(1, parseInt(req.query.limit || '100', 10) || 100);
	const start = (page - 1) * limit;
	const pageItems = items.slice(start, start + limit);

	const from = isoDate(dateAgo(30));
	const to = isoDate(TODAY);

	return {
		summary: {
			account_email: SWATI,
			window: { mode: 'days', from, to, days_equivalent: 30 },
			window_days: 30,
			since_date: from,
			invoices_total: invoicesTotal,
			invoices_covered: invoicesCovered,
			invoices_real_gap: cb.real_gap,
			coverage_pct: Math.round(coveragePct * 10) / 10,
			coverage_breakdown: cb,
			total_amount: round2(totalAmount),
			total_balance: round2(totalBalance),
			real_gap_balance: round2(realGapBalance),
			status_breakdown: sb,
			ai_breakdown: { current_status: aiCurrent, priority: aiPriority, ball_in_court: aiBall },
		},
		pagination: {
			page,
			limit,
			returned: pageItems.length,
			total: invoicesTotal,
			total_pages: Math.max(1, Math.ceil(invoicesTotal / limit)),
			has_more: start + limit < invoicesTotal,
		},
		items: pageItems,
		customer_rollups: customerRollups,
	};
}

/* ================================================================== *
 * 5. Pipeline Gaps  →  /reports/pipeline-gaps
 *    UNWRAPPED { fy_summary[], customers[], summary }
 * ================================================================== */

function pipelineGaps(_req: MockRequest) {
	const customers = COMPANIES.slice(0, 26).map((brand, i) => {
		const rng = seeded('pipeline:' + brand + i);
		const invoiced = rng.int(150000, 95000000);
		const outstanding = +(invoiced * rng.float(0.05, 0.6)).toFixed(2);
		const overdue = +(outstanding * rng.float(0.3, 1)).toFixed(2);
		const hasCoverage = rng.bool(0.62);
		return {
			customer_name: legalName(brand, rng),
			total_invoiced: invoiced,
			total_outstanding: outstanding,
			overdue_balance: overdue,
			invoice_count: rng.int(1, 264),
			first_invoice_date: isoDate(dateAgo(rng.int(200, 700))),
			last_invoice_date: isoDate(dateAgo(rng.int(0, 60))),
			linked_thread_count: hasCoverage ? rng.int(1, 84) : 0,
			has_thread_coverage: hasCoverage,
		};
	});

	const withCoverage = customers.filter(c => c.has_thread_coverage);
	const without = customers.filter(c => !c.has_thread_coverage);
	const totalInvoiced = customers.reduce((s, c) => s + c.total_invoiced, 0);
	const totalOutstanding = customers.reduce((s, c) => s + c.total_outstanding, 0);
	const untracked = without.reduce((s, c) => s + c.total_outstanding, 0);

	const fy_summary = [
		{ fy: 'FY 2023-24', customers: 14, total_invoiced: 0, total_paid: 0, total_outstanding: 0 },
		{ fy: 'FY 2024-25', customers: 21, total_invoiced: 0, total_paid: 0, total_outstanding: 0 },
		{ fy: 'FY 2025-26', customers: customers.length, total_invoiced: 0, total_paid: 0, total_outstanding: 0 },
	].map(row => {
		const rng = seeded('fy:' + row.fy);
		const inv = rng.int(20000000, 160000000);
		const paid = +(inv * rng.float(0.6, 0.92)).toFixed(2);
		return {
			...row,
			total_invoiced: inv,
			total_paid: paid,
			total_outstanding: +(inv - paid).toFixed(2),
		};
	});

	return {
		fy_summary,
		customers: customers
			.slice()
			.sort((a, b) => b.total_outstanding - a.total_outstanding),
		summary: {
			total_customers: customers.length,
			customers_with_coverage: withCoverage.length,
			customers_without_coverage: without.length,
			total_invoiced: totalInvoiced,
			total_outstanding: totalOutstanding,
			untracked_revenue: untracked,
		},
	};
}

/* ================================================================== *
 * 6. Mutations — accept and acknowledge (no real persistence)
 * ================================================================== */

function genericSuccess(_req: MockRequest, extra: Record<string, unknown> = {}) {
	return ok({ success: true, ...extra }, { message: 'Operation completed successfully' });
}

/** POST /billing/createZohoInvoice — pretend the invoice was raised in Zoho. */
function createZohoInvoice(req: MockRequest) {
	const rng = seeded('zoho-invoice:' + (req.body?.account_id || 'x') + Date.now());
	return ok(
		{
			invoice_id: `1010${rng.int(100000000, 999999999)}`,
			invoice_number: `IB-2026-27/${String(rng.int(60, 999)).padStart(4, '0')}`,
			status: 'draft',
			account_id: req.body?.account_id ?? null,
			account_name: req.body?.account_name ?? null,
			line_count: Array.isArray(req.body?.finalResult) ? req.body.finalResult.length : 0,
		},
		{ message: 'Invoice created successfully' }
	);
}

/** POST /customers/intelligence/refresh — single or all. */
function refreshIntelligence(req: MockRequest) {
	const single = req.body && typeof req.body === 'object' && 'customer' in req.body;
	return {
		status: 'ok',
		customer: single ? req.body.customer : undefined,
		customers_refreshed: single ? 1 : 26,
		took_ms: 500,
	};
}

/* ================================================================== *
 * Route table — DETAIL / specific routes BEFORE list routes.
 * ================================================================== */

export const routes: MockRoute[] = [
	// ── Billing report + invoice builder dropdowns ──────────────────────────
	// (req.path has the query string already stripped, so `$` anchors cleanly.)
	{ method: 'GET', pattern: /^\/billing\/getFinalCumulativeBillingReport$/, handler: billingReport },
	{ method: 'GET', pattern: /^\/inventory\/getClientGroupMaster$/, handler: clientGroupMaster },
	{ method: 'GET', pattern: /^\/billing\/gethsnsac$/, handler: hsnSac },
	{ method: 'GET', pattern: /^\/billing\/getZohoSalesAccount$/, handler: zohoSalesAccount },
	{ method: 'GET', pattern: /^\/inventory\/getClientByCity$/, handler: clientByCity },
	{ method: 'POST', pattern: /^\/billing\/createZohoInvoice$/, handler: createZohoInvoice },

	// ── Customer Intelligence (refresh BEFORE list) ─────────────────────────
	{ method: 'POST', pattern: /^\/customers\/intelligence\/refresh$/, handler: refreshIntelligence },
	{ method: 'GET', pattern: /^\/customers\/intelligence$/, handler: customerIntelligence },

	// ── Client Health (Pulse / Ledger / Broken / Overdue) ───────────────────
	{ method: 'POST', pattern: /^\/customers\/health\/commitments$/, handler: req => genericSuccess(req) },
	{ method: 'GET', pattern: /^\/customers\/health$/, handler: clientHealth },

	// ── Smart Follow-Up Tracker ─────────────────────────────────────────────
	{
		method: 'POST',
		pattern: /^\/email\/invoice-threads\/(?<id>[^/]+)\/follow-up$/,
		handler: req => genericSuccess(req, { thread_id: req.params.id, logged_at: isoDateTime(TODAY) }),
	},
	{ method: 'GET', pattern: /^\/email\/invoice-threads$/, handler: followUpThreads },

	// ── Pipeline Gaps / CEO overview ────────────────────────────────────────
	{ method: 'GET', pattern: /^\/reports\/pipeline-gaps$/, handler: pipelineGaps },

	// ── Defensive mutation handlers (any PUT/PATCH/DELETE on these resources) ─
	{ method: 'PUT', pattern: /^\/(?:billing|customers|email)\//, handler: req => genericSuccess(req) },
	{ method: 'PATCH', pattern: /^\/(?:billing|customers|email)\//, handler: req => genericSuccess(req) },
	{ method: 'DELETE', pattern: /^\/(?:billing|customers|email)\//, handler: req => genericSuccess(req) },
];
