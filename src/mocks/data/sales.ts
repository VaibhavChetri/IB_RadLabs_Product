/**
 * Mock routes: SALES, LEADS & CAREER (LOCAL DEMO ONLY)
 * --------------------------------------------------------------------------
 * Realistic, India-context fake data so the Sales (Lusha prospecting), Leads
 * (tracking / callbacks / reports) and Career (job postings) pages render fully
 * with NO backend.
 *
 * Endpoints served here (path is AFTER the `/v1/api` base):
 *
 *  LEADS  (src/services/leadApi.ts)
 *   GET    /leads/tracking
 *   GET    /leads/statuses
 *   GET    /leads/callbacks/today
 *   GET    /leads/reports
 *   GET    /leads/can-track/:contactId
 *   GET    /leads/:contactId/timeline
 *   POST   /leads/log-outreach
 *   PUT    /leads/outreach/:id
 *   POST   /leads/start-tracking
 *   POST   /leads/start-tracking/bulk
 *   POST   /leads/stop-tracking
 *   POST   /leads/callbacks/:outreachId/complete
 *   POST   /leads/send-email
 *
 *  LUSHA  (src/services/lushaApi.ts + leadApi reveal helpers)
 *   GET    /lusha/filters/contacts
 *   GET    /lusha/filters/companies
 *   GET    /lusha/filters/locations
 *   GET    /lusha/filters/companies/names
 *   GET    /lusha/filters/companies/technologies
 *   POST   /lusha/search
 *   POST   /lusha/reveal
 *   POST   /lusha/reveal/bulk
 *   POST   /lusha/company/enrich
 *   GET    /lusha/saved-filters
 *   POST   /lusha/saved-filters
 *   DELETE /lusha/saved-filters/:id
 *
 *  CAREER (src/services/careerApi.ts)
 *   GET    /career/opportunities
 *   POST   /career/opportunities
 *   GET    /career/opportunities/slug/:slug
 *   GET    /career/opportunities/:id
 *   PATCH  /career/opportunities/:id
 *   DELETE /career/opportunities/:id
 *   GET    /career/categories
 *   POST   /career/categories
 *   GET    /career/categories/:id
 *   PATCH  /career/categories/:id
 *   DELETE /career/categories/:id
 *   GET    /career/filters
 */

import { MockRoute, MockRequest } from '../mockTypes';
import {
	ok,
	paginate,
	seeded,
	list,
	CITIES,
	COMPANIES,
	fullName,
	phone as genPhone,
	email as genEmail,
	isoDateTime,
	dateAgo,
	dateAhead,
	Rng,
} from '../mockHelpers';

/* ------------------------------------------------------------------ *
 * Shared reference data
 * ------------------------------------------------------------------ */

const SALES_AGENTS = [
	{ id: 45, name: 'Priya Sharma' },
	{ id: 46, name: 'Rohan Mehta' },
	{ id: 47, name: 'Sneha Iyer' },
	{ id: 48, name: 'Karan Malhotra' },
	{ id: 49, name: 'Aditya Rao' },
] as const;

const JOB_TITLES = [
	'Head of Facilities',
	'VP Operations',
	'Procurement Manager',
	'Admin Manager',
	'General Manager',
	'Chief Operating Officer',
	'Facility & Administration Lead',
	'Supply Chain Director',
	'Workplace Experience Manager',
	'Director of Sustainability',
	'CTO',
	'Founder',
] as const;

const OUTREACH_TYPES = ['email', 'phone', 'both', 'meeting', 'other'] as const;

/** Outreach status master — drives filters, badges, distribution charts. */
const OUTREACH_STATUSES = [
	{ id: 1, status_name: 'Not Contacted Yet', status_category: 'pending', requires_callback: false, status_color: '#9CA3AF', status_order: 1 },
	{ id: 2, status_name: 'Email Sent', status_category: 'pending', requires_callback: false, status_color: '#A5B4FC', status_order: 2 },
	{ id: 3, status_name: 'Phone Not Reachable', status_category: 'follow_up', requires_callback: true, status_color: '#F59E0B', status_order: 3 },
	{ id: 4, status_name: 'Email Bounced', status_category: 'negative', requires_callback: false, status_color: '#F87171', status_order: 4 },
	{ id: 5, status_name: 'Call Later', status_category: 'follow_up', requires_callback: true, status_color: '#60A5FA', status_order: 5 },
	{ id: 6, status_name: 'Interested - Follow Up', status_category: 'positive', requires_callback: true, status_color: '#34D399', status_order: 6 },
	{ id: 7, status_name: 'Meeting Scheduled', status_category: 'positive', requires_callback: false, status_color: '#10B981', status_order: 7 },
	{ id: 8, status_name: 'Proposal Sent', status_category: 'positive', requires_callback: true, status_color: '#22C55E', status_order: 8 },
	{ id: 9, status_name: 'Not Interested', status_category: 'negative', requires_callback: false, status_color: '#EF4444', status_order: 9 },
	{ id: 10, status_name: 'Converted', status_category: 'converted', requires_callback: false, status_color: '#16A34A', status_order: 10 },
] as const;

/** A stable UUID-ish contact id derived from a seed + index. */
function contactId(rng: Rng): string {
	const hex = (n: number) => rng.uuid().slice(0, n);
	return `${hex(8)}-${hex(4)}-${hex(4)}-${hex(4)}-${rng.uuid()}`;
}

/* ------------------------------------------------------------------ *
 * LEADS — tracking list
 * ------------------------------------------------------------------ */

function buildTrackingLead(_i: number, rng: Rng) {
	const name = fullName(rng);
	const city = rng.pick(CITIES);
	const status = rng.pick(OUTREACH_STATUSES);
	const agent = rng.pick(SALES_AGENTS);
	const emailCount = rng.int(0, 6);
	const phoneCount = rng.int(0, 5);
	const total = emailCount + phoneCount + rng.int(0, 2);
	const trackedDaysAgo = rng.int(2, 60);
	const lastOutreachDaysAgo = rng.int(0, trackedDaysAgo);
	const hasCallback = status.requires_callback && rng.bool(0.6);

	return {
		contact_id: contactId(rng),
		full_name: name,
		job_title: rng.pick(JOB_TITLES),
		company_name: rng.pick(COMPANIES),
		company_id: String(rng.int(1000, 99999)),
		email: genEmail(name),
		phone: genPhone(rng),
		location: `${city.name}, ${city.state}`,
		tracking_started_at: isoDateTime(dateAgo(trackedDaysAgo)),
		last_outreach_date: total > 0 ? isoDateTime(dateAgo(lastOutreachDaysAgo)) : null,
		last_outreach_type: total > 0 ? rng.pick(OUTREACH_TYPES) : null,
		// Flat status fields (the page maps these into current_status).
		status_id: status.id,
		status_name: status.status_name,
		status_category: status.status_category,
		status_color: status.status_color,
		total_outreach_count: total,
		email_count: emailCount,
		phone_count: phoneCount,
		next_callback_at: hasCallback ? isoDateTime(dateAhead(rng.int(1, 7))) : null,
		assigned_to: agent.id,
		assigned_to_name: agent.name,
		is_active: rng.bool(0.75) ? 1 : 0,
	};
}

function trackingList(req: MockRequest) {
	let all = list(34, buildTrackingLead, 'leads/tracking');

	// Apply the filters the page sends so the demo feels interactive.
	const { status_id, assigned_to, has_callback, search } = req.query;
	if (status_id) all = all.filter(c => String(c.status_id) === String(status_id));
	if (assigned_to) all = all.filter(c => String(c.assigned_to) === String(assigned_to));
	if (has_callback === 'true') all = all.filter(c => c.next_callback_at !== null);
	if (search) {
		const q = search.toLowerCase();
		all = all.filter(
			c =>
				c.full_name.toLowerCase().includes(q) ||
				c.company_name.toLowerCase().includes(q) ||
				(c.email || '').toLowerCase().includes(q)
		);
	}

	const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
	const perPage = Math.max(1, parseInt(req.query.per_page || '25', 10) || 25);
	const start = (page - 1) * perPage;
	const slice = all.slice(start, start + perPage);

	return ok({
		current_page: page,
		per_page: perPage,
		total: all.length,
		total_pages: Math.max(1, Math.ceil(all.length / perPage)),
		contacts: slice,
	});
}

/* ------------------------------------------------------------------ *
 * LEADS — callbacks (today + overdue)
 * ------------------------------------------------------------------ */

function buildCallback(i: number, rng: Rng) {
	const name = fullName(rng);
	const isOverdue = rng.bool(0.35);
	const status = rng.pick(
		OUTREACH_STATUSES.filter(s => s.requires_callback)
	);
	// Overdue → scheduled in the past; today → later today.
	const scheduled = isOverdue
		? isoDateTime(dateAgo(rng.int(1, 5)))
		: isoDateTime(new Date(Date.UTC(2026, 5, 1, rng.int(9, 18), rng.int(0, 59), 0)));
	const agent = rng.pick(SALES_AGENTS);

	return {
		outreach_id: 5000 + i,
		contact_id: contactId(rng),
		contact_name: name,
		company_name: rng.pick(COMPANIES),
		job_title: rng.pick(JOB_TITLES),
		phone: genPhone(rng),
		email: genEmail(name),
		callback_scheduled_at: scheduled,
		is_overdue: isOverdue ? 1 : 0,
		status_name: status.status_name,
		last_notes: rng.pick([
			'Asked to call back after the board review.',
			'Interested in dishwashing-as-a-service pilot.',
			'Wants a detailed proposal with ROI numbers.',
			'Decision maker on leave till next week.',
			'Requested pricing for 3 facilities.',
			'Follow up on the kitchen design AMC quote.',
		]),
		assigned_to_name: agent.name,
	};
}

function callbacksToday() {
	const callbacks = list(14, buildCallback, 'leads/callbacks/today');
	const overdue_count = callbacks.filter(c => c.is_overdue === 1).length;
	const today_count = callbacks.length - overdue_count;
	return ok({ today_count, overdue_count, callbacks });
}

/* ------------------------------------------------------------------ *
 * LEADS — contact timeline
 * ------------------------------------------------------------------ */

function contactTimeline(req: MockRequest) {
	const cid = req.params.contactId || 'contact';
	const rng = seeded(`leads/timeline/${cid}`);
	const name = fullName(rng);
	const company = rng.pick(COMPANIES);
	const entryCount = rng.int(3, 8);

	const timeline = Array.from({ length: entryCount }, (_, i) => {
		const status = rng.pick(OUTREACH_STATUSES);
		const performer = rng.pick(SALES_AGENTS);
		const requiresCb = status.requires_callback && rng.bool(0.5);
		return {
			id: 9000 + i,
			outreach_type: rng.pick(OUTREACH_TYPES),
			// Oldest first.
			outreach_date: isoDateTime(dateAgo((entryCount - i) * rng.int(2, 6))),
			status_name: status.status_name,
			status_color: status.status_color,
			notes: rng.bool(0.7)
				? rng.pick([
						'Left a voicemail, will retry tomorrow.',
						'Shared the InfinityBox brochure over email.',
						'Spoke to assistant, decision maker unavailable.',
						'Positive call — wants a demo next week.',
						'Sent follow-up with case studies.',
					])
				: null,
			callback_scheduled_at: requiresCb ? isoDateTime(dateAhead(rng.int(1, 6))) : null,
			callback_completed: requiresCb ? (rng.bool() ? 1 : 0) : null,
			performed_by: performer.id,
			performed_by_name: performer.name,
		};
	});

	const emailCount = timeline.filter(t => t.outreach_type === 'email').length;
	const phoneCount = timeline.filter(t => t.outreach_type === 'phone').length;

	return ok({
		contact: {
			contact_id: cid,
			full_name: name,
			job_title: rng.pick(JOB_TITLES),
			company_name: company,
			email: genEmail(name),
			phone: genPhone(rng),
		},
		summary: {
			tracking_started_at: isoDateTime(dateAgo(rng.int(20, 60))),
			total_outreach_count: timeline.length,
			email_count: emailCount,
			phone_count: phoneCount,
			current_status: timeline[timeline.length - 1].status_name,
		},
		timeline,
	});
}

/* ------------------------------------------------------------------ *
 * LEADS — reports dashboard
 * ------------------------------------------------------------------ */

function leadsReports() {
	const rng = seeded('leads/reports');
	const totalTracked = 47;
	const activeLeads = 35;

	const counts = [12, 8, 6, 5, 4];
	const distSource = [
		OUTREACH_STATUSES[5], // Interested - Follow Up
		OUTREACH_STATUSES[4], // Call Later
		OUTREACH_STATUSES[6], // Meeting Scheduled
		OUTREACH_STATUSES[0], // Not Contacted Yet
		OUTREACH_STATUSES[8], // Not Interested
	];
	const distTotal = counts.reduce((a, b) => a + b, 0);
	const status_distribution = distSource.map((s, i) => ({
		status_name: s.status_name,
		status_category: s.status_category,
		status_color: s.status_color,
		count: counts[i],
		percentage: +((counts[i] / distTotal) * 100).toFixed(1),
	}));

	const user_performance = SALES_AGENTS.slice(0, 3).map(a => {
		const tracked = rng.int(10, 22);
		const outreach = rng.int(40, 80);
		const positive = rng.int(4, 12);
		return {
			user_id: a.id,
			user_name: a.name,
			contacts_tracked: tracked,
			total_outreach: outreach,
			positive_responses: positive,
			conversion_rate: +((positive / tracked) * 100).toFixed(1),
		};
	});

	return ok({
		summary: {
			total_tracked: totalTracked,
			active_leads: activeLeads,
			inactive_leads: totalTracked - activeLeads,
			total_outreach_attempts: 156,
			avg_outreach_per_lead: +(156 / totalTracked).toFixed(1),
		},
		status_distribution,
		outreach_by_type: { email: 45, phone: 89, both: 15, meeting: 7 },
		user_performance,
		callback_metrics: {
			total_scheduled: 23,
			completed: 18,
			pending: 5,
			overdue: 2,
			completion_rate: 78.3,
		},
	});
}

/* ------------------------------------------------------------------ *
 * LUSHA — search results
 * ------------------------------------------------------------------ */

const LINKEDIN_SLUGS = ['rohan-sharma', 'priya-mehta', 'aditya-rao', 'sneha-iyer', 'karan-singh'];

function buildLushaContact(_i: number, rng: Rng) {
	const name = fullName(rng);
	const city = rng.pick(CITIES);
	const companyName = rng.pick(COMPANIES);
	const companyId = rng.int(1000, 9999999);
	const hasLinkedin = rng.bool(0.6);
	const slug = `${name.toLowerCase().replace(/[^a-z]+/g, '-')}-${rng.int(100, 999)}`;

	return {
		contactId: contactId(rng),
		name,
		companyName,
		jobTitle: rng.pick(JOB_TITLES),
		location: `${city.name}, ${city.state}, India`,
		// Pre-reveal: contact details are masked (page shows "Reveal" buttons).
		emailAddresses: [] as string[],
		phoneNumbers: [] as string[],
		companyId,
		fqdn: `${companyName.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`,
		companyDescription: `${companyName} is a fast-growing India-based consumer brand operating across ${city.name} and other metros.`,
		logoUrl: `https://logo.clearbit.com/${companyName.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`,
		hasEmails: true,
		hasPhones: true,
		hasWorkEmail: rng.bool(0.8),
		hasMobilePhone: rng.bool(0.7),
		hasDirectPhone: rng.bool(0.4),
		personId: rng.int(1000000, 99999999),
		linkedinUrl: hasLinkedin ? `https://www.linkedin.com/in/${rng.pick(LINKEDIN_SLUGS)}` : null,
		smartLinkedinUrl: `https://www.linkedin.com/in/${slug}`,
		companyLinkedinUrl: `https://www.linkedin.com/company/${companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
		is_tracking: false,
		followup_sent: false,
		followup_email_count: 0,
	};
}

function lushaSearch(req: MockRequest) {
	const body = req.body || {};
	const page: number = body?.pages?.page || 1;
	const size: number = body?.pages?.size || 20;
	const requestId = seeded('lusha/search/request').uuid();
	const pageContacts = list(size, buildLushaContact, `lusha/search/page-${page}`);
	const totalResults = 695;

	// NOTE: the Leads page reads response.data.data.data for the contact array
	// and response.data.data.totalResults for the grand total, so the nesting
	// here (data -> data -> data) is intentional and must be preserved.
	return ok({
		leadId: 13,
		totalResults,
		data: {
			requestId,
			currentPage: page,
			pageLength: pageContacts.length,
			totalResults,
			data: pageContacts,
			billing: {
				creditsCharged: 0,
				resultsReturned: pageContacts.length,
			},
		},
	});
}

/* ------------------------------------------------------------------ *
 * LUSHA — reveal (single / bulk) + the leadApi camelCase reveal
 * ------------------------------------------------------------------ */

function lushaReveal(req: MockRequest) {
	const cid: string = req.body?.contactId || req.body?.contact_id || contactId(seeded('reveal'));
	const revealType: string = req.body?.revealType || req.body?.reveal_type || 'email';
	const rng = seeded(`lusha/reveal/${cid}`);
	const name = fullName(rng);
	const email = revealType === 'phone' ? '' : genEmail(name);
	const phone = revealType === 'email' ? '' : genPhone(rng);

	return ok({
		contactId: cid,
		alreadyRevealed: false,
		email,
		phone,
		creditsUsed: 1,
	});
}

function lushaBulkReveal(req: MockRequest) {
	const ids: string[] = Array.isArray(req.body?.contact_ids) ? req.body.contact_ids : [];
	const revealType: string = req.body?.reveal_type || 'email';
	const rng = seeded('lusha/reveal/bulk');

	const results = ids.map(id => {
		const name = fullName(rng);
		const success = rng.bool(0.9);
		return {
			contact_id: id,
			success,
			email: success && revealType !== 'phone' ? genEmail(name) : undefined,
			phone: success && revealType !== 'email' ? genPhone(rng) : undefined,
			error: success ? undefined : 'No data available for this contact',
		};
	});

	const revealed = results.filter(r => r.success).length;
	const failed = results.length - revealed;
	return ok({
		total_requested: ids.length,
		total_revealed: revealed,
		total_failed: failed,
		credits_used: revealed * (revealType === 'both' ? 2 : 1),
		remaining_credits: 500 - revealed,
		results,
	});
}

/* ------------------------------------------------------------------ *
 * LUSHA — company enrich
 * ------------------------------------------------------------------ */

function lushaEnrich(req: MockRequest) {
	const ids: string[] = Array.isArray(req.body?.companiesIds) ? req.body.companiesIds : [];
	const requestId: string = req.body?.requestId || seeded('enrich').uuid();

	const companies = ids.map(idStr => {
		const id = parseInt(idStr, 10) || 1000;
		const rng = seeded(`lusha/enrich/${idStr}`);
		const name = rng.pick(COMPANIES);
		const city = rng.pick(CITIES);
		const minEmp = rng.pick([50, 100, 200, 500, 1000]);
		return {
			id,
			fqdn: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`,
			name,
			social: {
				linkedin: `https://www.linkedin.com/company/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
				crunchbase: `https://www.crunchbase.com/organization/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
			},
			country: 'India',
			domains: {
				email: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`,
				homepage: `https://www.${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`,
			},
			founded: rng.int(2008, 2020),
			funding: {
				isIpo: false,
				rounds: [],
				totalRounds: rng.int(1, 5),
				lastRoundType: rng.pick(['Seed', 'Series A', 'Series B', 'Series C']),
				lastRoundAmount: rng.int(5, 200) * 1000000,
				totalRoundsAmount: rng.int(20, 500) * 1000000,
			},
			logoUrl: `https://logo.clearbit.com/${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`,
			continent: 'Asia',
			employees: `${minEmp}-${minEmp * 2}`,
			companySize: { min: minEmp, max: minEmp * 2, employees_in_linkedin: rng.int(minEmp, minEmp * 2) },
			countryIso2: 'IN',
			description: `${name} is a leading India-based consumer brand headquartered in ${city.name}.`,
			rawLocation: `${city.name}, ${city.state}, India`,
			subIndustry: rng.pick(['Food Delivery', 'Quick Commerce', 'D2C', 'HealthTech', 'Consumer Electronics']),
			mainIndustry: rng.pick(['Consumer Services', 'Retail', 'Technology', 'Food & Beverage']),
			revenueRange: [rng.int(10, 50) * 1000000, rng.int(60, 200) * 1000000],
			specialities: rng.picks(
				['Logistics', 'Cold Chain', 'Last Mile', 'D2C', 'Subscriptions', 'AI', 'Sustainability'],
				3
			),
			city: city.name,
			state: city.state,
			stateCode: city.state.slice(0, 2).toUpperCase(),
		};
	});

	return ok({
		requestId,
		companiesEnriched: companies.length,
		companiesFromCache: 0,
		companiesFromAPI: companies.length,
		creditsUsed: 0,
		data: { requestId, companies },
	});
}

/* ------------------------------------------------------------------ *
 * LUSHA — filter option lookups + autocompletes
 * ------------------------------------------------------------------ */

const DEPARTMENTS = [
	'Operations', 'Facilities', 'Procurement', 'Administration', 'Supply Chain',
	'Finance', 'Human Resources', 'Engineering', 'Sales', 'Marketing',
	'Information Technology', 'Sustainability',
];

const SENIORITY = [
	{ id: 1, name: 'owner' },
	{ id: 2, name: 'founder' },
	{ id: 3, name: 'c_level' },
	{ id: 4, name: 'vp' },
	{ id: 5, name: 'director' },
	{ id: 6, name: 'manager' },
	{ id: 7, name: 'senior' },
	{ id: 8, name: 'entry' },
];

const INDUSTRIES = [
	{
		main_industry: 'Consumer Services',
		main_industry_id: 1,
		sub_industries: [
			{ id: 101, value: 'Food Delivery' },
			{ id: 102, value: 'Quick Commerce' },
			{ id: 103, value: 'Facility Management' },
		],
	},
	{
		main_industry: 'Retail',
		main_industry_id: 2,
		sub_industries: [
			{ id: 201, value: 'D2C Brands' },
			{ id: 202, value: 'Grocery' },
			{ id: 203, value: 'Apparel' },
		],
	},
	{
		main_industry: 'Technology',
		main_industry_id: 3,
		sub_industries: [
			{ id: 301, value: 'SaaS' },
			{ id: 302, value: 'Consumer Electronics' },
			{ id: 303, value: 'HealthTech' },
		],
	},
	{
		main_industry: 'Food & Beverage',
		main_industry_id: 4,
		sub_industries: [
			{ id: 401, value: 'Cloud Kitchens' },
			{ id: 402, value: 'Packaged Foods' },
			{ id: 403, value: 'Beverages' },
		],
	},
];

const TECHNOLOGIES = [
	'Salesforce', 'HubSpot', 'AWS', 'Google Cloud', 'Azure', 'Shopify',
	'SAP', 'Oracle NetSuite', 'Zoho', 'Freshworks', 'Razorpay', 'Tally',
];

function lushaContactFilters() {
	return ok({
		departments: DEPARTMENTS,
		seniority: SENIORITY,
		dataPoints: ['email', 'phone', 'linkedin', 'jobTitle', 'location'],
	});
}

function lushaCompanyFilters() {
	return ok({
		industries: INDUSTRIES,
		revenues: [
			{ min: 0, max: 1000000 },
			{ min: 1000000, max: 10000000 },
			{ min: 10000000, max: 50000000 },
			{ min: 50000000 },
		],
		sizes: [
			{ min: 1, max: 50 },
			{ min: 51, max: 200 },
			{ min: 201, max: 1000 },
			{ min: 1001 },
		],
		intentTopics: ['Cold Chain', 'Sustainability', 'Facility Services', 'Catering'],
		sic: [
			{ code: '5812', label: 'Eating Places' },
			{ code: '7389', label: 'Business Services' },
		],
		naics: [
			{ code: '722511', label: 'Full-Service Restaurants' },
			{ code: '561210', label: 'Facilities Support Services' },
		],
	});
}

function lushaLocations(req: MockRequest) {
	const text = (req.query.text || '').toLowerCase();
	const matches = CITIES.filter(c => !text || c.name.toLowerCase().includes(text));
	const source = matches.length > 0 ? matches : CITIES;
	return ok(
		source.map(c => ({ country: 'India', state: c.state, city: c.name }))
	);
}

function lushaCompanyNames(req: MockRequest) {
	const text = (req.query.text || '').toLowerCase();
	const matches = COMPANIES.filter(c => !text || c.toLowerCase().includes(text));
	return ok((matches.length > 0 ? matches : COMPANIES).slice(0, 10));
}

function lushaTechnologies(req: MockRequest) {
	const text = (req.query.text || '').toLowerCase();
	const matches = TECHNOLOGIES.filter(t => !text || t.toLowerCase().includes(text));
	return ok(matches.length > 0 ? matches : TECHNOLOGIES);
}

/* ------------------------------------------------------------------ *
 * LUSHA — saved filters (in-memory store for the demo session)
 * ------------------------------------------------------------------ */

interface SavedFilterRecord {
	id: number;
	name: string;
	filterConfig: unknown;
	createdAt: string;
}

const savedFilters: SavedFilterRecord[] = [
	{
		id: 1,
		name: 'Facilities Heads — Bengaluru',
		filterConfig: {
			contacts: { include: { departments: ['Facilities'], jobTitles: ['Head of Facilities'] } },
		},
		createdAt: isoDateTime(dateAgo(18)),
	},
	{
		id: 2,
		name: 'Food Delivery — Decision Makers',
		filterConfig: {
			contacts: { include: { seniority: [3, 4] } },
			companies: { include: { mainIndustriesIds: [1], subIndustriesIds: [101] } },
		},
		createdAt: isoDateTime(dateAgo(9)),
	},
	{
		id: 3,
		name: 'D2C Brands — Procurement',
		filterConfig: {
			contacts: { include: { departments: ['Procurement'] } },
			companies: { include: { mainIndustriesIds: [2] } },
		},
		createdAt: isoDateTime(dateAgo(3)),
	},
];
let savedFilterSeq = 100;

/* ------------------------------------------------------------------ *
 * CAREER — categories + job listings
 * ------------------------------------------------------------------ */

const CAREER_CATEGORIES = [
	{ id: 1, name: 'Engineering', slug: 'engineering' },
	{ id: 2, name: 'Operations', slug: 'operations' },
	{ id: 3, name: 'Sales', slug: 'sales' },
	{ id: 4, name: 'Customer Success', slug: 'customer-success' },
	{ id: 5, name: 'Design', slug: 'design' },
	{ id: 6, name: 'Finance', slug: 'finance' },
	{ id: 7, name: 'Human Resources', slug: 'human-resources' },
];

function careerCategoryRecord(c: { id: number; name: string; slug: string }, i: number) {
	return {
		id: c.id,
		name: c.name,
		slug: c.slug,
		description: `${c.name} roles across InfinityBox.`,
		display_order: i + 1,
		is_active: true,
		created_at: isoDateTime(dateAgo(120 - i)),
		updated_at: isoDateTime(dateAgo(30 - i)),
	};
}

const CAREER_DEPARTMENTS = ['Engineering', 'Operations', 'Sales', 'Customer Success', 'Design', 'Finance', 'Human Resources'];
const CAREER_JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'freelance'] as const;
const CAREER_EXP_LEVELS = ['entry', 'mid', 'senior', 'executive'] as const;
const CAREER_TITLES = [
	'Senior Backend Engineer', 'Frontend Engineer', 'Operations Manager', 'Area Sales Manager',
	'Customer Success Associate', 'Product Designer', 'Finance Analyst', 'HR Business Partner',
	'Warehouse Supervisor', 'Field Sales Executive', 'Data Engineer', 'DevOps Engineer',
	'City Operations Lead', 'Key Account Manager', 'Talent Acquisition Specialist',
	'Logistics Coordinator', 'UI/UX Designer', 'Accounts Payable Executive',
	'Quality Assurance Engineer', 'Business Development Manager', 'Procurement Specialist',
	'Cold Chain Engineer', 'Demand Planning Analyst', 'Inside Sales Representative',
];

function buildJobListing(i: number, rng: Rng) {
	const title = CAREER_TITLES[i % CAREER_TITLES.length];
	const dept = rng.pick(CAREER_DEPARTMENTS);
	const jobType = rng.pick(CAREER_JOB_TYPES);
	const expLevel = rng.pick(CAREER_EXP_LEVELS);
	const city = rng.pick(CITIES);
	const isRemote = rng.bool(0.25);
	const isActive = rng.bool(0.8);
	const isFeatured = rng.bool(0.2);
	const salaryMin = rng.int(4, 18) * 100000;
	const salaryMax = salaryMin + rng.int(3, 12) * 100000;
	const cat = rng.pick(CAREER_CATEGORIES);
	const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i + 1}`;

	return {
		id: i + 1,
		title,
		slug,
		department: dept,
		job_type: jobType,
		location: isRemote ? null : `${city.name}, ${city.state}`,
		is_remote: isRemote,
		is_active: isActive,
		is_featured: isFeatured,
		published_at: isoDateTime(dateAgo(rng.int(2, 60))),
		expires_at: isoDateTime(dateAhead(rng.int(15, 90))),
		description: {
			overview: `We are hiring a ${title} to join our ${dept} team and help scale InfinityBox across India.`,
			paragraphs: [
				`As a ${title}, you will work closely with cross-functional teams to deliver impact at scale.`,
				'You will own outcomes end-to-end in a fast-paced, ownership-driven environment.',
			],
			salary: {
				min: salaryMin,
				max: salaryMax,
				currency: 'INR',
				period: 'yearly' as const,
				display: `₹${(salaryMin / 100000).toFixed(1)}L - ₹${(salaryMax / 100000).toFixed(1)}L/year`,
			},
			requirements: [
				`${rng.int(2, 8)}+ years of relevant experience`,
				'Strong communication and stakeholder management',
				'Bias for action and ownership',
			],
			responsibilities: [
				`Drive ${dept} initiatives across regions`,
				'Collaborate with leadership on quarterly goals',
				'Own metrics and report on progress',
			],
			benefits: ['Health insurance', 'Flexible work', 'Learning budget', 'ESOPs'],
			qualifications: {
				required: ["Bachelor's degree", 'Domain expertise in ' + dept],
				preferred: ['MBA / relevant certification', 'Experience in consumer/logistics'],
			},
		},
		salary_min: salaryMin,
		salary_max: salaryMax,
		salary_currency: 'INR',
		experience_level: expLevel,
		application_email: 'careers@getinfinitybox.com',
		application_url: `https://getinfinitybox.com/careers/${slug}`,
		application_deadline: isoDateTime(dateAhead(rng.int(20, 60))),
		meta_title: `${title} | InfinityBox Careers`,
		meta_description: `Apply for the ${title} role at InfinityBox in ${isRemote ? 'Remote' : city.name}.`,
		meta_keywords: `${title}, ${dept}, jobs, InfinityBox`,
		view_count: rng.int(40, 1200),
		application_count: rng.int(0, 80),
		category_ids: [cat.id],
		category_names: [cat.name],
		created_at: isoDateTime(dateAgo(rng.int(5, 90))),
		updated_at: isoDateTime(dateAgo(rng.int(0, 5))),
	};
}

function careerOpportunities(req: MockRequest) {
	let all = list(28, buildJobListing, 'career/opportunities');

	const { search, department, job_type, experience_level, is_active, is_featured, is_remote, category_id } =
		req.query;
	if (search) {
		const q = search.toLowerCase();
		all = all.filter(j => j.title.toLowerCase().includes(q) || (j.location || '').toLowerCase().includes(q));
	}
	if (department) all = all.filter(j => j.department === department);
	if (job_type) all = all.filter(j => j.job_type === job_type);
	if (experience_level) all = all.filter(j => j.experience_level === experience_level);
	if (is_active !== undefined && is_active !== '') all = all.filter(j => j.is_active === (is_active === 'true'));
	if (is_featured !== undefined && is_featured !== '') all = all.filter(j => j.is_featured === (is_featured === 'true'));
	if (is_remote !== undefined && is_remote !== '') all = all.filter(j => j.is_remote === (is_remote === 'true'));
	if (category_id) all = all.filter(j => j.category_ids.includes(parseInt(category_id, 10)));

	const { slice, page, limit, total } = paginate(all, req.query);
	return ok({
		jobs: slice,
		pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
	});
}

function careerOpportunityById(req: MockRequest) {
	const id = parseInt(req.params.id, 10) || 1;
	const all = list(28, buildJobListing, 'career/opportunities');
	const found = all.find(j => j.id === id) || all[0];
	return ok({ ...found, id });
}

function careerOpportunityBySlug(req: MockRequest) {
	const slug = req.params.slug || '';
	const all = list(28, buildJobListing, 'career/opportunities');
	const found = all.find(j => j.slug === slug) || all[0];
	return ok(found);
}

function careerFilterOptions() {
	return ok({
		jobTypes: CAREER_JOB_TYPES.map(v => ({
			value: v,
			label: v.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
		})),
		experienceLevels: [
			{ value: 'entry', label: 'Entry Level' },
			{ value: 'mid', label: 'Mid Level' },
			{ value: 'senior', label: 'Senior Level' },
			{ value: 'executive', label: 'Executive' },
		],
		applicationStatuses: [
			{ value: 'pending', label: 'Pending' },
			{ value: 'reviewing', label: 'Reviewing' },
			{ value: 'shortlisted', label: 'Shortlisted' },
			{ value: 'interviewed', label: 'Interviewed' },
			{ value: 'rejected', label: 'Rejected' },
			{ value: 'hired', label: 'Hired' },
		],
		departments: CAREER_DEPARTMENTS.map(d => ({ value: d, label: d })),
		locations: CITIES.map(c => ({ value: `${c.name}, ${c.state}`, label: `${c.name}, ${c.state}` })),
	});
}

/* ------------------------------------------------------------------ *
 * Route registry — DETAIL / specific routes BEFORE list routes.
 * ------------------------------------------------------------------ */

export const routes: MockRoute[] = [
	/* ---------------- LEADS ---------------- */
	{ method: 'GET', pattern: /^\/leads\/tracking$/, handler: trackingList },
	{ method: 'GET', pattern: /^\/leads\/statuses$/, handler: () => ok([...OUTREACH_STATUSES]) },
	{ method: 'GET', pattern: /^\/leads\/callbacks\/today$/, handler: callbacksToday },
	{ method: 'GET', pattern: /^\/leads\/reports$/, handler: leadsReports },
	{
		method: 'GET',
		pattern: /^\/leads\/can-track\/(?<contactId>[^/]+)$/,
		handler: () => ok({ can_track: true, reason: null, has_email: true, has_phone: true, is_tracking: false }),
	},
	{ method: 'GET', pattern: /^\/leads\/(?<contactId>[^/]+)\/timeline$/, handler: contactTimeline },

	// Mutations → success envelopes.
	{
		method: 'POST',
		pattern: /^\/leads\/log-outreach$/,
		handler: (req: MockRequest) => {
			const status = OUTREACH_STATUSES.find(s => s.id === req.body?.status_id) || OUTREACH_STATUSES[0];
			return ok({
				outreach_id: seeded('log-outreach').int(10000, 99999),
				contact_id: req.body?.contact_id ?? null,
				status_name: status.status_name,
				callback_scheduled_at: req.body?.callback_scheduled_at ?? null,
			});
		},
	},
	{
		method: 'PUT',
		pattern: /^\/leads\/outreach\/(?<id>\d+)$/,
		handler: () => ok({ message: 'Outreach updated successfully' }),
	},
	{
		method: 'POST',
		pattern: /^\/leads\/start-tracking\/bulk$/,
		handler: (req: MockRequest) => {
			const ids: string[] = Array.isArray(req.body?.contact_ids) ? req.body.contact_ids : [];
			return ok({
				total_requested: ids.length,
				total_tracked: ids.length,
				total_failed: 0,
				results: ids.map(id => ({ contact_id: id, success: true })),
			});
		},
	},
	{
		method: 'POST',
		pattern: /^\/leads\/start-tracking$/,
		handler: (req: MockRequest) =>
			ok({
				contact_id: req.body?.contact_id ?? null,
				is_tracking: true,
				tracking_started_at: isoDateTime(dateAgo(0)),
				assigned_to: req.body?.assign_to ?? SALES_AGENTS[0].id,
			}),
	},
	{
		method: 'POST',
		pattern: /^\/leads\/stop-tracking$/,
		handler: () => ok({ message: 'Tracking stopped successfully' }),
	},
	{
		method: 'POST',
		pattern: /^\/leads\/callbacks\/(?<outreachId>\d+)\/complete$/,
		handler: () => ok({ message: 'Callback marked as completed' }),
	},
	{
		method: 'POST',
		pattern: /^\/leads\/send-email$/,
		handler: (req: MockRequest) => {
			const ids: string[] = Array.isArray(req.body?.contact_ids) ? req.body.contact_ids : [];
			return ok({
				sent: ids.length,
				failed: 0,
				skipped_no_email: 0,
				results: ids.map(id => ({ contact_id: id, email: 'redacted@example.com', success: true, error: null })),
			});
		},
	},

	/* ---------------- LUSHA ---------------- */
	// Specific filter sub-paths before the broad reveal/search routes.
	{ method: 'GET', pattern: /^\/lusha\/filters\/contacts$/, handler: lushaContactFilters },
	{ method: 'GET', pattern: /^\/lusha\/filters\/companies\/names$/, handler: lushaCompanyNames },
	{ method: 'GET', pattern: /^\/lusha\/filters\/companies\/technologies$/, handler: lushaTechnologies },
	{ method: 'GET', pattern: /^\/lusha\/filters\/companies$/, handler: lushaCompanyFilters },
	{ method: 'GET', pattern: /^\/lusha\/filters\/locations$/, handler: lushaLocations },

	{ method: 'POST', pattern: /^\/lusha\/search$/, handler: lushaSearch },
	{ method: 'POST', pattern: /^\/lusha\/reveal\/bulk$/, handler: lushaBulkReveal },
	{ method: 'POST', pattern: /^\/lusha\/reveal$/, handler: lushaReveal },
	{ method: 'POST', pattern: /^\/lusha\/company\/enrich$/, handler: lushaEnrich },

	// Saved filters CRUD (in-memory).
	{
		method: 'DELETE',
		pattern: /^\/lusha\/saved-filters\/(?<id>\d+)$/,
		handler: (req: MockRequest) => {
			const id = parseInt(req.params.id, 10);
			const idx = savedFilters.findIndex(f => f.id === id);
			if (idx >= 0) savedFilters.splice(idx, 1);
			return ok({ message: 'Filter deleted' });
		},
	},
	{ method: 'GET', pattern: /^\/lusha\/saved-filters$/, handler: () => ok([...savedFilters]) },
	{
		method: 'POST',
		pattern: /^\/lusha\/saved-filters$/,
		handler: (req: MockRequest) => {
			const record: SavedFilterRecord = {
				id: ++savedFilterSeq,
				name: req.body?.name || 'Untitled filter',
				filterConfig: req.body?.filterConfig ?? {},
				createdAt: isoDateTime(dateAgo(0)),
			};
			savedFilters.unshift(record);
			return ok(record);
		},
	},

	/* ---------------- CAREER ---------------- */
	// Detail / specific routes before the list routes.
	{ method: 'GET', pattern: /^\/career\/opportunities\/slug\/(?<slug>[^/]+)$/, handler: careerOpportunityBySlug },
	{ method: 'GET', pattern: /^\/career\/opportunities\/(?<id>\d+)$/, handler: careerOpportunityById },
	{
		method: 'PATCH',
		pattern: /^\/career\/opportunities\/(?<id>\d+)$/,
		handler: (req: MockRequest) => {
			const id = parseInt(req.params.id, 10) || 1;
			const base = list(28, buildJobListing, 'career/opportunities').find(j => j.id === id) || list(1, buildJobListing, 'career/opportunities')[0];
			return ok({ ...base, ...(req.body || {}), id, updated_at: isoDateTime(dateAgo(0)) });
		},
	},
	{
		method: 'DELETE',
		pattern: /^\/career\/opportunities\/(?<id>\d+)$/,
		handler: (req: MockRequest) => ok({ id: parseInt(req.params.id, 10) || 0, message: 'Job listing deleted successfully' }),
	},
	{ method: 'GET', pattern: /^\/career\/opportunities$/, handler: careerOpportunities },
	{
		method: 'POST',
		pattern: /^\/career\/opportunities$/,
		handler: (req: MockRequest) => {
			const body = req.body || {};
			const id = seeded('career/create').int(100, 999);
			const title: string = body.title || 'New Role';
			return ok({
				...buildJobListing(0, seeded(`career/new/${id}`)),
				...body,
				id,
				title,
				slug: body.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
				view_count: 0,
				application_count: 0,
				category_names: CAREER_CATEGORIES.filter(c => (body.category_ids || []).includes(c.id)).map(c => c.name),
				created_at: isoDateTime(dateAgo(0)),
				updated_at: isoDateTime(dateAgo(0)),
			});
		},
	},

	{
		method: 'GET',
		pattern: /^\/career\/categories\/(?<id>\d+)$/,
		handler: (req: MockRequest) => {
			const id = parseInt(req.params.id, 10) || 1;
			const c = CAREER_CATEGORIES.find(x => x.id === id) || CAREER_CATEGORIES[0];
			return ok(careerCategoryRecord(c, id - 1));
		},
	},
	{
		method: 'PATCH',
		pattern: /^\/career\/categories\/(?<id>\d+)$/,
		handler: (req: MockRequest) => {
			const id = parseInt(req.params.id, 10) || 1;
			const c = CAREER_CATEGORIES.find(x => x.id === id) || CAREER_CATEGORIES[0];
			return ok({ ...careerCategoryRecord(c, id - 1), ...(req.body || {}), id, updated_at: isoDateTime(dateAgo(0)) });
		},
	},
	{
		method: 'DELETE',
		pattern: /^\/career\/categories\/(?<id>\d+)$/,
		handler: (req: MockRequest) => ok({ id: parseInt(req.params.id, 10) || 0, message: 'Category deleted successfully' }),
	},
	{
		method: 'GET',
		pattern: /^\/career\/categories$/,
		handler: () => ok(CAREER_CATEGORIES.map((c, i) => careerCategoryRecord(c, i))),
	},
	{
		method: 'POST',
		pattern: /^\/career\/categories$/,
		handler: (req: MockRequest) => {
			const body = req.body || {};
			const name: string = body.name || 'New Category';
			return ok({
				id: seeded('career/category/create').int(100, 999),
				name,
				slug: body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
				description: body.description ?? null,
				display_order: body.display_order ?? CAREER_CATEGORIES.length + 1,
				is_active: body.is_active ?? true,
				created_at: isoDateTime(dateAgo(0)),
				updated_at: isoDateTime(dateAgo(0)),
			});
		},
	},

	{ method: 'GET', pattern: /^\/career\/filters$/, handler: careerFilterOptions },
];
