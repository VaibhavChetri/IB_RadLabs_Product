/**
 * BillingLayout — wraps every route under /billing/* so the editorial
 * sub-theme tokens declared in src/index.css apply.
 *
 * Place inside your existing app shell (Sidebar + Header) — this layout
 * only sets the .billing-module class on the route content, not the chrome.
 *
 * Register in src/App.tsx (or wherever your Routes live):
 *
 *   <Route path="/billing" element={<BillingLayout />}>
 *     <Route index element={<Navigate to="pulse" replace />} />
 *     <Route path="pulse" element={<Pulse />} />
 *     <Route path="clients" element={<ClientsLedger />} />
 *     <Route path="clients/:customerId" element={<ClientDetail />} />
 *     // legacy redirects — see BILLING_REDESIGN_PLAN.md §6
 *   </Route>
 */

import React from 'react';
import { Outlet } from 'react-router-dom';

export const BillingLayout: React.FC = () => {
	return (
		<div className="billing-module min-h-full">
			<Outlet />
		</div>
	);
};

export default BillingLayout;
