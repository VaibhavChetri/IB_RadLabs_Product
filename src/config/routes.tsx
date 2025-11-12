import React from 'react';
import { Dashboard } from '../pages/Dashboard';
import { MenuManagement } from '../pages/MenuManagement';
import { AddClient } from '../pages/AddClient';
import { EditClient } from '../pages/EditClient';
import { ManageClients } from '../pages/ManageClients';
import DisableClients from '../pages/DisableClients';
import MasterPlanListing from '../pages/MasterPlanListing';
import TransitPlanListing from '../pages/TransitPlanListing';
import SentTransitPlanListing from '../pages/SentTransitPlanListing';
import SentInventoryListing from '../pages/SentInventoryListing';
import ClientDispatchDetails from '../pages/ClientDispatchDetails';
import ReceivedTransitPlanListing from '../pages/ReceivedTransitPlanListing';
import ReceivedInventoryListing from '../pages/ReceivedInventoryListing';
import ClientPickupDetails from '../pages/ClientPickupDetails';
import CreateMasterPlan from '../pages/CreateMasterPlan';
import EditMasterPlan from '../pages/EditMasterPlan';
import FloatingLabelDemo from '../pages/FloatingLabelDemo';
import ClientListing from '../pages/ClientListing';
import ClientInventoryDetails from '../pages/ClientInventoryDetails';
import InventoryListing from '../pages/InventoryListing';
import { AddClientSkuMapping } from '../pages/AddClientSkuMapping';
import EditClientSkuMapping from '../pages/EditClientSkuMapping';
import { SkuMapListing } from '../pages/SkuMapListing';
import { OpsDashboard } from '../pages/OpsDashboard';
import { PLSummary } from '../pages/PLSummary';
import { PLGraphs } from '../pages/PLGraphs';
import { MonthlyEstimateAdd } from '../pages/MonthlyEstimateAdd';
import { MonthlyEstimateList } from '../pages/MonthlyEstimateList';
import { MonthlyEstimateEdit } from '../pages/MonthlyEstimateEdit';

export interface RouteConfig {
	path: string;
	component: React.ComponentType;
}

export const routes: RouteConfig[] = [
	{ path: '/', component: Dashboard },
	{ path: '/ops-dashboard', component: OpsDashboard },
	{ path: '/menu-management', component: MenuManagement },
	{ path: '/clients/add', component: AddClient },
	{ path: '/clients/edit', component: EditClient },
	{ path: '/clients/manage', component: ManageClients },
	{ path: '/clients/disable', component: DisableClients },
	{ path: '/transit-plan/master-plan/listing', component: MasterPlanListing },
	{ path: '/transit-plan/listing', component: TransitPlanListing },
	{ path: '/transit-plan/sent/plan', component: SentTransitPlanListing },
	{ path: '/transit-plan/sent/inventory', component: SentInventoryListing },
	{
		path: '/transit-plan/sent/client-details/:clientLocationId/:facilityId',
		component: ClientDispatchDetails,
	},
	{ path: '/transit-plan/received/plan', component: ReceivedTransitPlanListing },
	{ path: '/transit-plan/received/listing', component: ReceivedInventoryListing },
	{
		path: '/transit-plan/received/details/:clientLocationId/:facilityId',
		component: ClientPickupDetails,
	},
	{ path: '/transit-plan/master-plan/create', component: CreateMasterPlan },
	{ path: '/transit-plan/master-plan/edit', component: EditMasterPlan },
	{ path: '/floating-demo', component: FloatingLabelDemo },
	{ path: '/kam/clients', component: ClientListing },
	{ path: '/kam/clients/:clientId', component: ClientInventoryDetails },
	{ path: '/kam/inventory', component: InventoryListing },
	{ path: '/ops-admin/map-sku/listing', component: SkuMapListing },
	{ path: '/ops-admin/map-sku/add', component: AddClientSkuMapping },
	{ path: '/ops-admin/map-sku/:clientId/edit', component: EditClientSkuMapping },
	{ path: '/p-and-l/summary', component: PLSummary },
	{ path: '/p-and-l/graphs', component: PLGraphs },
	{ path: '/revenue/monthly-estimate/add', component: MonthlyEstimateAdd },
	{ path: '/revenue/monthly-estimate/list', component: MonthlyEstimateList },
	{ path: '/revenue/monthly-estimate/edit', component: MonthlyEstimateEdit },
];
