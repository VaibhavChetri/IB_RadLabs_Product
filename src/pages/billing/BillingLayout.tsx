/**
 * BillingLayout — wraps every route under /billing/* so the editorial
 * sub-theme tokens declared in src/index.css apply.
 *
 * DIVERGENCE FROM HANDOFF: the handoff's version uses `<Outlet />` because
 * it was designed for nested-route registration. This repo uses a flat
 * route array in src/config/routes.tsx — so this layout accepts `children`
 * instead. Each billing page is wrapped individually at route-registration
 * time:
 *
 *   { path: '/billing/pulse', component: () => <BillingLayout><Pulse /></BillingLayout> }
 *
 * Functionally identical for our purposes — both versions just apply the
 * `.billing-module` class so the sub-theme tokens cascade.
 */

import React from 'react';

interface BillingLayoutProps {
	children: React.ReactNode;
}

export const BillingLayout: React.FC<BillingLayoutProps> = ({ children }) => {
	return <div className='billing-module min-h-full'>{children}</div>;
};

export default BillingLayout;
