/* APPEND to your routes module (e.g. src/routes/AppRoutes.tsx) ─────────
   These routes set up the new billing module with legacy redirects so
   bookmarks survive the migration. The BillingLayout wrapper applies the
   .billing-module sub-theme class to its <Outlet/>.
   ──────────────────────────────────────────────────────────────────── */

import { Route, Navigate } from 'react-router-dom';
import { BillingLayout } from '../pages/billing/BillingLayout';
import Pulse from '../pages/billing/pulse/Pulse';
import ClientsLedger from '../pages/billing/clients/ClientsLedger';
import ClientDetail from '../pages/billing/clients/ClientDetail';

export const billingRoutes = (
	<Route path="/billing" element={<BillingLayout />}>
		<Route index element={<Navigate to="pulse" replace />} />
		<Route path="pulse" element={<Pulse />} />
		<Route path="clients" element={<ClientsLedger />} />
		<Route path="clients/:customerId" element={<ClientDetail />} />

		{/* ─── Legacy redirects — preserve bookmarks during migration ──
		   Once new analytics show <5% traffic on these paths, remove. */}
		<Route path="broken-commitments"  element={<Navigate to="/billing/clients?filter=broken"     replace />} />
		<Route path="ceo-overview"        element={<Navigate to="/billing/pulse"                     replace />} />
		<Route path="client-health"       element={<Navigate to="/billing/clients"                   replace />} />
		<Route path="overdue-behaviour"   element={<Navigate to="/billing/clients?filter=disputing"  replace />} />
		<Route path="pipeline-gaps"       element={<Navigate to="/billing/clients?filter=untracked"  replace />} />
	</Route>
);

/* In your existing AppRoutes.tsx, splice in like:
   <Routes>
     ...existing routes...
     {billingRoutes}
   </Routes>
*/
