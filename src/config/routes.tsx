import React from 'react';
import { Dashboard } from '../pages/Dashboard';
import { MenuManagement } from '../pages/MenuManagement';
import { OpsDashboard } from '../pages/OpsDashboard';
import FloatingLabelDemo from '../pages/FloatingLabelDemo';
// Ops Admin - Clients
import { AddClient } from '../pages/ops-admin/clients/AddClient';
import { EditClient } from '../pages/ops-admin/clients/EditClient';
import { ManageClients } from '../pages/ops-admin/clients/ManageClients';
import DisableClients from '../pages/ops-admin/clients/DisableClients';
// Ops Admin - SKU Mapping
import { AddClientSkuMapping } from '../pages/ops-admin/sku-mapping/AddClientSkuMapping';
import EditClientSkuMapping from '../pages/ops-admin/sku-mapping/EditClientSkuMapping';
import { SkuMapListing } from '../pages/ops-admin/sku-mapping/SkuMapListing';
// Ops Admin - Revenue
import { ReviewCostType } from '../pages/ops-admin/revenue/ReviewCostType';
import { ReviewCategoryType } from '../pages/ops-admin/revenue/ReviewCategoryType';
// Ops Admin - Escalations
import { EscalationType } from '../pages/ops-admin/escalations/EscalationType';
// Ops Admin - QC
import { QCTypeListing } from '../pages/ops-admin/qc/QCTypeListing';
// Ops Admin - Facility Resources
import FacilityResourceListing from '../pages/ops-admin/facility-resources/FacilityResourceListing';
// Ops Admin - Vehicles
import { VehicleListing } from '../pages/ops-admin/vehicles/VehicleListing';
// Ops Admin - Containers
import ContainerListing from '../pages/ops-admin/containers/ContainerListing';
// Ops Admin - Users
import { ManageUsers } from '../pages/ops-admin/users/ManageUsers';
import { AddUser } from '../pages/ops-admin/users/AddUser';
import { EditUser } from '../pages/ops-admin/users/EditUser';
// Transit Plan - Master Plan
import CreateMasterPlan from '../pages/transit-plan/master-plan/CreateMasterPlan';
import EditMasterPlan from '../pages/transit-plan/master-plan/EditMasterPlan';
import MasterPlanListing from '../pages/transit-plan/master-plan/MasterPlanListing';
// Transit Plan
import TransitPlanListing from '../pages/transit-plan/TransitPlanListing';
import ReceivedTransitPlanListing from '../pages/transit-plan/ReceivedTransitPlanListing';
import ReceivedInventoryListing from '../pages/transit-plan/ReceivedInventoryListing';
import ClientPickupDetails from '../pages/transit-plan/ClientPickupDetails';
// Transit Plan - Sent Inventory
import SentTransitPlanListing from '../pages/transit-plan/sent-inventory/SentTransitPlanListing';
import SentInventoryListing from '../pages/transit-plan/sent-inventory/SentInventoryListing';
import ClientDispatchDetails from '../pages/transit-plan/sent-inventory/ClientDispatchDetails';
import EditSentInventoryDetails from '../pages/transit-plan/sent-inventory/EditSentInventoryDetails';
// KAM
import ClientListing from '../pages/kam/ClientListing';
import ClientInventoryDetails from '../pages/kam/ClientInventoryDetails';
import InventoryListing from '../pages/kam/InventoryListing';
// P&L Review
import { PLSummary } from '../pages/pl-review/PLSummary';
import { PLGraphs } from '../pages/pl-review/PLGraphs';
// Revenue - Monthly Estimate
import { MonthlyEstimateAdd } from '../pages/revenue/monthly-estimate/MonthlyEstimateAdd';
import { MonthlyEstimateList } from '../pages/revenue/monthly-estimate/MonthlyEstimateList';
import { MonthlyEstimateEdit } from '../pages/revenue/monthly-estimate/MonthlyEstimateEdit';
// Operations Reporting - Shift Reporting
import { ShiftReportingAdd } from '../pages/operations-reporting/shift-reporting/ShiftReportingAdd';
import { ShiftReportingListing } from '../pages/operations-reporting/shift-reporting/ShiftReportingListing';
// Operations Reporting - QC Rejection
import { QCRejectionAdd } from '../pages/operations-reporting/qc-rejection/QCRejectionAdd';
import { QCRejectionListing } from '../pages/operations-reporting/qc-rejection/QCRejectionListing';
import { QCRejectionDetails } from '../pages/operations-reporting/qc-rejection/QCRejectionDetails';
// Operations Reporting - Client Escalation
import { ClientEscalationAdd } from '../pages/operations-reporting/client-escalation/ClientEscalationAdd';
import { ClientEscalationListing } from '../pages/operations-reporting/client-escalation/ClientEscalationListing';
// Sales - Leads
import { Leads } from '../pages/sales/Leads';
// Leads - Tracking
import { TrackingList } from '../pages/leads/TrackingList';
import { CallbacksList } from '../pages/leads/CallbacksList';
import { ReportsDashboard } from '../pages/leads/ReportsDashboard';
// HR - Job Posting
import { AddJobPosting } from '../pages/hr/job-posting/AddJobPosting';
import { JobPostingListing } from '../pages/hr/job-posting/JobPostingListing';
// Billing - Invoice
import InvoiceList from '../pages/billing/InvoiceList';
import BillingDetails from '../pages/billing/BillingDetails';
// 3D Builder
import { ThreeDBuilder } from '../pages/3d-builder/ThreeDBuilder';
// Finances - Amazon Invoice
import AmazonInvoiceList from '../pages/finances/AmazonInvoiceList';
import AmazonInvoiceDetail from '../pages/finances/AmazonInvoiceDetail';
// Finances - Zoho Payment Received
import { ZohoPaymentList } from '../pages/finances/ZohoPaymentList';
// Finances - Zoho Invoices
import { ZohoInvoiceList } from '../pages/finances/ZohoInvoiceList';

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
	{
		path: '/transit-plan/sent/inventory/edit/:clientLocationId/:facilityId',
		component: EditSentInventoryDetails,
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
	{ path: '/kam/clients/:clientId/:date', component: ClientInventoryDetails },
	{ path: '/kam/inventory', component: InventoryListing },
	{ path: '/ops-admin/map-sku/listing', component: SkuMapListing },
	{ path: '/ops-admin/map-sku/add', component: AddClientSkuMapping },
	{ path: '/ops-admin/map-sku/:clientId/edit', component: EditClientSkuMapping },
	{ path: '/ops-admin/revenue/review-cost-type', component: ReviewCostType },
	{ path: '/ops-admin/revenue/review-category-type', component: ReviewCategoryType },
	{ path: '/ops-admin/escalations/escalation-type', component: EscalationType },
	{ path: '/ops-admin/qc/qc-type', component: QCTypeListing },
	{ path: '/ops-admin/client-escalations/escalation-type', component: EscalationType },
	{ path: '/ops-admin/facility-resources', component: FacilityResourceListing },
	{ path: '/ops-admin/vehicles/listing', component: VehicleListing },
	{ path: '/ops-admin/containers/listing', component: ContainerListing },
	// Ops Admin - Users
	{ path: '/ops-admin/users', component: ManageUsers },
	{ path: '/ops-admin/users/add', component: AddUser },
	{ path: '/ops-admin/users/:userId', component: EditUser },
	{ path: '/p-and-l/summary', component: PLSummary },
	{ path: '/p-and-l/graphs', component: PLGraphs },
	{ path: '/revenue/monthly-estimate/add', component: MonthlyEstimateAdd },
	{ path: '/revenue/monthly-estimate/list', component: MonthlyEstimateList },
	{ path: '/revenue/monthly-estimate/edit', component: MonthlyEstimateEdit },
	{ path: '/operations-reporting/shift-reporting/add', component: ShiftReportingAdd },
	{ path: '/operations-reporting/shift-reporting/listing', component: ShiftReportingListing },
	{ path: '/operations-reporting/qc-rejection/add', component: QCRejectionAdd },
	{ path: '/operations-reporting/qc-rejection/listing', component: QCRejectionListing },
	{
		path: '/operations-reporting/qc-rejection/details/:clientId/:transitId',
		component: QCRejectionDetails,
	},
	{ path: '/operations-reporting/client-escalation/add', component: ClientEscalationAdd },
	{ path: '/operations-reporting/client-escalation/listing', component: ClientEscalationListing },
	// Sales - Leads (Search Lusha)
	{ path: '/sales/leads', component: Leads },
	// Leads - Tracking
	{ path: '/leads/tracking', component: TrackingList },
	{ path: '/leads/callbacks', component: CallbacksList },
	{ path: '/leads/reports', component: ReportsDashboard },
	// HR - Job Posting
	{ path: '/hr/job-posting', component: JobPostingListing },
	{ path: '/hr/job-posting/add', component: AddJobPosting },
	{ path: '/hr/job-posting/edit/:id', component: AddJobPosting },
	// Billing - Invoice
	{ path: '/billing/invoice', component: InvoiceList },
	{ path: '/billing/details', component: BillingDetails },
	// 3D Builder
	{ path: '/dashboard/3d-builder', component: ThreeDBuilder },
	// Finances - Amazon Invoice
	{ path: '/finances/amazon-invoice', component: AmazonInvoiceList },
	{ path: '/finances/amazon-invoice/:invoiceNumber', component: AmazonInvoiceDetail },
	// Finances - Zoho Payment Received
	{ path: '/finances/zoho-payment-received', component: ZohoPaymentList },
	// Finances - Zoho Invoices
	{ path: '/finances/zoho-invoices', component: ZohoInvoiceList },
];
