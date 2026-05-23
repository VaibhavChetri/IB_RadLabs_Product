/**
 * Finance Brief — walkthrough modal for the new Zoho verification pages.
 *
 * Opens when the user clicks the "📖 Finance Brief" button on any of the new
 * Zoho list pages. Has 5 tabs:
 *
 *   1. Overview         — what this section is for, why it exists
 *   2. Pages            — what each page shows + the dimensions baked in
 *   3. Data Quality     — known issues + how to read the warning badges
 *   4. What to Verify   — a checklist Finance can step through
 *   5. Feedback         — how to flag issues back to engineering
 *
 * Stores a "seen" flag in localStorage so we can show a subtle "new" pulse on
 * the brief button until each user has opened it once.
 */

import React, { useState } from 'react';
import { Modal, Button } from '../ui';
import {
	BookOpen,
	AlertTriangle,
	CheckCircle2,
	MessageSquare,
	Layers,
	ChevronRight,
} from 'lucide-react';

export const FINANCE_BRIEF_SEEN_KEY = 'finance_brief_seen_v1';

export const markBriefSeen = () => {
	try {
		localStorage.setItem(FINANCE_BRIEF_SEEN_KEY, '1');
	} catch {
		/* ignore */
	}
};

export const isBriefSeen = () => {
	try {
		return localStorage.getItem(FINANCE_BRIEF_SEEN_KEY) === '1';
	} catch {
		return false;
	}
};

type TabKey = 'overview' | 'pages' | 'quality' | 'verify' | 'feedback';

const TABS: Array<{ key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
	{ key: 'overview', label: 'Overview', icon: BookOpen },
	{ key: 'pages', label: 'Pages', icon: Layers },
	{ key: 'quality', label: 'Data Quality', icon: AlertTriangle },
	{ key: 'verify', label: 'What to Verify', icon: CheckCircle2 },
	{ key: 'feedback', label: 'Feedback', icon: MessageSquare },
];

interface FinanceBriefModalProps {
	open: boolean;
	onClose: () => void;
	startTab?: TabKey;
}

export const FinanceBriefModal: React.FC<FinanceBriefModalProps> = ({ open, onClose, startTab = 'overview' }) => {
	const [tab, setTab] = useState<TabKey>(startTab);

	React.useEffect(() => {
		if (open) markBriefSeen();
	}, [open]);

	const footer = (
		<div className='flex items-center justify-between'>
			<div className='text-xs text-gray-500'>
				This brief lives in your top-right corner under <strong>📖 Finance Brief</strong> — open it any time.
			</div>
			<Button onClick={onClose}>Got it</Button>
		</div>
	);

	return (
		<Modal open={open} onClose={onClose} title='📖 Finance Brief — Zoho Verification' size='xl' footer={footer}>
			<div className='flex gap-6'>
				{/* Side tabs */}
				<nav className='w-48 flex-shrink-0 space-y-1' aria-label='Finance Brief sections'>
					{TABS.map((t) => {
						const Icon = t.icon;
						const active = tab === t.key;
						return (
							<button
								key={t.key}
								onClick={() => setTab(t.key)}
								className={
									'w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ' +
									(active
										? 'bg-success-50 text-success-700 font-medium'
										: 'text-gray-600 hover:bg-gray-50')
								}
							>
								<Icon className='w-4 h-4' />
								{t.label}
								{active && <ChevronRight className='w-4 h-4 ml-auto' />}
							</button>
						);
					})}
				</nav>

				{/* Content */}
				<div className='flex-1 min-w-0 text-sm text-gray-700 space-y-4'>
					{tab === 'overview' && <Overview />}
					{tab === 'pages' && <Pages />}
					{tab === 'quality' && <DataQuality />}
					{tab === 'verify' && <VerifyChecklist />}
					{tab === 'feedback' && <Feedback />}
				</div>
			</div>
		</Modal>
	);
};

// ===========================================================================
// Tab content
// ===========================================================================

const Overview: React.FC = () => (
	<section className='space-y-3 leading-relaxed'>
		<h3 className='text-base font-semibold text-gray-900'>Why this section exists</h3>
		<p>
			Until now, finance data lived only in Zoho Books. To run real reporting (per-city spend, payment
			behaviour, AP reconciliation) we now mirror the relevant Zoho records into our local DB and surface them
			here — <strong>with the same numbers Zoho has</strong>, never overwritten.
		</p>
		<div className='bg-success-50 border-l-4 border-success-500 p-3 rounded'>
			<div className='font-semibold text-success-900 mb-1'>Source of truth = Zoho Books</div>
			<div className='text-sm text-success-800'>
				This dashboard is a <em>read-only</em> mirror. If something looks wrong here, fix it in Zoho — the
				correction will reflect here on the next refresh. Nothing on this page writes back to Zoho.
			</div>
		</div>
		<h3 className='text-base font-semibold text-gray-900 mt-4'>How the menu is organised</h3>
		<ul className='space-y-2 list-disc pl-5'>
			<li>
				<strong>Zoho Inflow (AR)</strong> — money coming IN: <em>Invoices</em> we raise on customers, and{' '}
				<em>Payments Received</em> against them.
			</li>
			<li>
				<strong>Zoho Outflow (AP)</strong> — money going OUT: <em>Bills</em> vendors raise on us,{' '}
				<em>Payments Made</em> to settle those bills, and <em>Expenses</em> (direct cash-out, no bill cycle).
			</li>
		</ul>
		<p className='text-xs text-gray-500 mt-2'>
			Total cash-out across all years (Payments Made + Expenses) is roughly <strong>₹82 crore</strong>. Total
			invoiced to customers is <strong>₹56 crore</strong>. Numbers update with each refresh.
		</p>
	</section>
);

const Pages: React.FC = () => (
	<section className='space-y-4 leading-relaxed'>
		<PageRow
			name='Invoices (Inflow)'
			what='Every invoice we raised on a customer in Zoho.'
			filters='Date · Customer · Status · Branch · Business Unit'
			audit='Outstanding / overdue totals should match the "AR Outstanding" tile in Zoho Dashboard.'
		/>
		<PageRow
			name='Payments Received (Inflow)'
			what='Every customer payment recorded in Zoho — which invoices each payment settled is visible inline.'
			filters='Date · Customer · Payment Mode'
			audit='Compare against Zoho "Customer Payments" report for the same date range.'
		/>
		<PageRow
			name='Bills (Outflow)'
			what='Every vendor invoice we owe. Includes line items (what was billed), the cost account it hits, and the city/facility tags.'
			filters='Date · Vendor · Status · City · Facility Type · Business Unit · Nature of Expense · Category · Client Hint'
			audit='Outstanding payable total should match Zoho "AP Outstanding".'
		/>
		<PageRow
			name='Payments Made (Outflow)'
			what='Every vendor payment we sent out. The "Bills Settled" column shows how many bills each payment cleared.'
			filters='Date · Vendor · Payment Mode · Paid Through'
			audit='Sum of all payments should match Zoho "Payments Made" total. Investigate any row with Bills Settled = 0 (these are advances / on-account payments).'
		/>
		<PageRow
			name='Expenses (Outflow)'
			what='Direct cash-out that bypasses the bill cycle — fuel, petty cash, reimbursements, statutory payments.'
			filters='Date · Vendor · Customer · Expense Account · Status · City · Facility Type · Category · Client Hint · Submitter'
			audit='Sum should match Zoho "Expenses" report for the period.'
		/>
	</section>
);

const PageRow: React.FC<{ name: string; what: string; filters: string; audit: string }> = ({
	name,
	what,
	filters,
	audit,
}) => (
	<div className='border border-gray-200 rounded p-3'>
		<div className='font-semibold text-gray-900 mb-1'>{name}</div>
		<div className='text-sm text-gray-700 mb-2'>{what}</div>
		<div className='text-xs text-gray-500'>
			<div>
				<strong>Filters:</strong> {filters}
			</div>
			<div className='mt-1'>
				<strong>How to verify:</strong> {audit}
			</div>
		</div>
	</div>
);

const DataQuality: React.FC = () => (
	<section className='space-y-4 leading-relaxed'>
		<p>
			Below are <strong>known data-entry issues in Zoho</strong> that we detect and surface but{' '}
			<strong>do not auto-correct</strong>. Finance owns the source data; we only flag.
		</p>

		<DQItem
			severity='high'
			title='Mode/Account mismatch'
			what='Payment Mode is recorded as "Cash" but the Account (or Paid-Through) is a bank/digital account.'
			where='Visible on Payments Received and Payments Made pages.'
			impact='If you query "show me cash receipts last quarter", you will get a wrong answer until these are corrected in Zoho.'
			count='~138 of 294 customer payments, ~3,405 of 4,121 vendor payments.'
		/>

		<DQItem
			severity='medium'
			title='Vendor payments with Bills Settled = 0'
			what='A vendor payment that does not reference any bill in Zoho.'
			where='Payments Made page, "Bills Settled" column.'
			impact='Could be legitimate advances/retainers, or could be data entry oversight where the bill link was not attached.'
			count='~82 vendor payments (~₹386 L total).'
		/>

		<DQItem
			severity='medium'
			title='Bills in "Suspense" category'
			what='Bills whose Expense Account does not map to any standard category in our classifier.'
			where='Bills page — filter Category = "Suspense".'
			impact='These bills do not roll up into any P&L bucket. Either reclassify in Zoho or tell us which canonical category they should map to.'
			count='~₹100 L across 27 bills in 2026.'
		/>

		<DQItem
			severity='low'
			title='Untagged city / facility (pre-2026)'
			what='Older bills lack the cf_city / cf_facility custom field — Zoho started using these tags only in 2026.'
			where='Bills page — filter City or Facility Type = "unknown".'
			impact='Per-city/facility historical reports will under-report. Future bills are well-tagged.'
			count='~80% of pre-2026 bills.'
		/>
	</section>
);

const SEV_COLORS = {
	high: 'bg-error-50 border-error-500 text-error-900',
	medium: 'bg-warning-50 border-warning-500 text-warning-900',
	low: 'bg-info-50 border-info-500 text-info-900',
} as const;

const DQItem: React.FC<{
	severity: keyof typeof SEV_COLORS;
	title: string;
	what: string;
	where: string;
	impact: string;
	count: string;
}> = ({ severity, title, what, where, impact, count }) => (
	<div className={'border-l-4 p-3 rounded ' + SEV_COLORS[severity]}>
		<div className='flex items-center gap-2 mb-1'>
			<span className='inline-block px-2 py-0.5 rounded text-xs font-semibold bg-white/60 uppercase tracking-wide'>
				{severity}
			</span>
			<div className='font-semibold'>{title}</div>
		</div>
		<div className='text-sm space-y-1 mt-2'>
			<div>
				<strong>What:</strong> {what}
			</div>
			<div>
				<strong>Where to see:</strong> {where}
			</div>
			<div>
				<strong>Impact:</strong> {impact}
			</div>
			<div className='text-xs text-gray-600 mt-1'>{count}</div>
		</div>
	</div>
);

const VerifyChecklist: React.FC = () => (
	<section className='space-y-3 leading-relaxed'>
		<p>
			Suggested 15-min sanity pass. Open Zoho Books in another tab and compare the same date range on each
			step.
		</p>
		<ol className='space-y-3 list-decimal pl-5'>
			<li>
				<strong>Outstanding AR.</strong> Invoices page → no filters → top-right "Outstanding". Should match
				Zoho Dashboard → Receivables tile.
			</li>
			<li>
				<strong>Outstanding AP.</strong> Bills page → no filters → top "Outstanding". Should match Zoho
				Dashboard → Payables tile.
			</li>
			<li>
				<strong>Cash receipt sanity.</strong> Payments Received → "Show only mismatched". Almost all should
				be ICICI Bank / RBL — confirms the mode/account issue is real, not our bug.
			</li>
			<li>
				<strong>Vendor payment reconciliation.</strong> Pick any payment with Bills Settled ≥ 2 → click it
				(detail drawer) → confirm the bill numbers + amount applied match Zoho.
			</li>
			<li>
				<strong>City-wise spend.</strong> Bills → filter City = "Bangalore" → the total should be plausible
				vs your operating-cost spreadsheet.
			</li>
			<li>
				<strong>Onsite-vs-Offsite split.</strong> Bills → filter Facility Type = "onsite" → cross-check
				against your customer-allocable expense report.
			</li>
			<li>
				<strong>Salary spend.</strong> Expenses → filter Category = "Salary" → compare against payroll.
			</li>
		</ol>
		<div className='bg-info-50 border-l-4 border-info-500 p-3 rounded mt-4'>
			<strong>Tip:</strong> Every page has a "Refresh from Zoho" button — click it once at the start of your
			session to make sure you're seeing the latest. Subsequent clicks are rate-limited so we don't burn the
			Zoho 5,000-calls/day quota.
		</div>
	</section>
);

const Feedback: React.FC = () => (
	<section className='space-y-3 leading-relaxed'>
		<p>If something looks wrong on any page, please reach out directly to one of the two engineers below:</p>
		<div className='grid grid-cols-1 md:grid-cols-2 gap-3 mt-2'>
			<div className='border border-gray-200 rounded p-3'>
				<div className='font-semibold text-gray-900'>Shreyas</div>
				<div className='text-sm text-gray-600 mt-1'>WhatsApp with a screenshot, or email.</div>
			</div>
			<div className='border border-gray-200 rounded p-3'>
				<div className='font-semibold text-gray-900'>Ayush</div>
				<div className='text-sm text-gray-600 mt-1'>WhatsApp with a screenshot, or email.</div>
			</div>
		</div>
		<p className='font-semibold text-gray-900 mt-4'>Please include for each report:</p>
		<ul className='list-disc pl-5 space-y-1'>
			<li>A screenshot of what you're seeing (most important)</li>
			<li>The page + which filter was applied</li>
			<li>The specific record number (bill #, payment #, etc.)</li>
			<li>What you expected vs what you saw</li>
		</ul>
		<div className='bg-success-50 border-l-4 border-success-500 p-3 rounded mt-4'>
			Once a Zoho-side correction is made, the next refresh (manual button or the auto-cron that runs every 4
			hours during IST workday) will surface the updated value here automatically.
		</div>
	</section>
);
