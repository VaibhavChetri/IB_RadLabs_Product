/* APPEND to src/data/navigation.ts (or wherever your sidebar config lives)
   Replaces the current "Invoice" sub-items. Old items are demoted to
   sub-shortcuts that hit the new Clients ledger with a saved filter.
   ──────────────────────────────────────────────────────────────────── */

export const billingNavSection = {
	id: 'billing',
	label: 'Invoice',
	icon: 'FileText', // matches your existing icon naming convention (lucide-react)
	children: [
		// New primary destinations
		{ id: 'pulse',    label: 'Pulse',    path: '/billing/pulse',    icon: 'Zap',   badge: 'NEW' },
		{ id: 'clients',  label: 'Clients',  path: '/billing/clients',  icon: 'Users' },

		// Saved-view shortcuts — hit ClientsLedger with ?filter=
		{ id: 'sv-broken',    label: 'Broken commits',     path: '/billing/clients?filter=broken',    icon: 'AlertTriangle', subItem: true },
		{ id: 'sv-disputing', label: 'Disputing',          path: '/billing/clients?filter=disputing', icon: 'XCircle',       subItem: true },
		{ id: 'sv-untracked', label: 'Untracked revenue',  path: '/billing/clients?filter=untracked', icon: 'EyeOff',        subItem: true },
		{ id: 'sv-frequent',  label: 'Frequent breakers',  path: '/billing/clients?filter=frequent',  icon: 'Flame',         subItem: true },

		// Existing items that should stay (transactional)
		{ id: 'invoice-listing', label: 'Invoice Listing', path: '/billing/invoices', icon: 'FileText' },
		{ id: 'billing-details', label: 'Billing Details', path: '/billing/details',  icon: 'Receipt' },
	],
};

/* Replace the existing 'billing' / 'invoice' entry in navigation.ts with
   the above. */
