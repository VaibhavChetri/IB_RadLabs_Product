import React from 'react';
import { Navigate } from 'react-router-dom';
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
import { LocationVariance } from '../pages/pl-review/LocationVariance';
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
// HR - HRM
import { EmployeeListing } from '../pages/hr/employees/EmployeeListing';
import { AddEmployee } from '../pages/hr/employees/AddEmployee';
import { DepartmentListing } from '../pages/hr/departments/DepartmentListing';
import { DesignationListing } from '../pages/hr/designations/DesignationListing';
import { SalaryStructureListing } from '../pages/hr/salary-structures/SalaryStructureListing';
// HR - Holidays
import { MyHolidays } from '../pages/hr/holidays/MyHolidays';
import { MyChoices } from '../pages/hr/holidays/MyChoices';
import { TeamHolidayChoices } from '../pages/hr/holidays/TeamHolidayChoices';
import { HolidayMaster } from '../pages/hr/holidays/HolidayMaster';
import { HolidayChoicesSummary } from '../pages/hr/holidays/HolidayChoicesSummary';
import { HolidayConfig } from '../pages/hr/holidays/HolidayConfig';
// HR - Leaves
import { MyLeaves } from '../pages/hr/leaves/MyLeaves';
import { MyCompOff } from '../pages/hr/leaves/MyCompOff';
import { LeaveRequests } from '../pages/hr/leaves/LeaveRequests';
import { TeamCompOff } from '../pages/hr/leaves/TeamCompOff';
import { LeaveTypes } from '../pages/hr/leaves/LeaveTypes';
import { LeaveBalances } from '../pages/hr/leaves/LeaveBalances';
// HR - Attendance
import { MyAttendance } from '../pages/hr/attendance/MyAttendance';
import { RegularizeAttendance } from '../pages/hr/attendance/RegularizeAttendance';
import { MarkAttendance } from '../pages/hr/attendance/MarkAttendance';
import { TeamAttendance } from '../pages/hr/attendance/TeamAttendance';
import { AttendanceSummary } from '../pages/hr/attendance/AttendanceSummary';
import { RegularizationRequests } from '../pages/hr/attendance/RegularizationRequests';
// Billing - Invoice
import InvoiceList from '../pages/billing/InvoiceList';
import BillingDetails from '../pages/billing/BillingDetails';
// Billing - Smart Follow-Up Tracker (Module 1)
import FollowUpTracker from '../pages/billing/follow-up-tracker/FollowUpTracker';
// Billing - Customer Intelligence (Module 2)
import CustomerIntelligence from '../pages/billing/customer-intelligence/CustomerIntelligence';
// Billing redesign (handoff/) — Pulse, Clients Ledger, and Client Detail
// all wrapped in BillingLayout so the .billing-module sub-theme tokens apply.
// The 5 legacy billing pages (client-health, overdue-behaviour, pipeline-gaps,
// broken-commitments, ceo-overview) are no longer rendered — their old URLs
// redirect to the new ledger filters below so existing bookmarks keep working.
// The page files remain in src/pages/billing/ until Phase 4 of the migration
// (delete after 2 weeks of low traffic on the legacy paths).
import BillingLayout from '../pages/billing/BillingLayout';
import Pulse from '../pages/billing/pulse/Pulse';
import ClientsLedger from '../pages/billing/clients/ClientsLedger';
import ClientDetail from '../pages/billing/clients/ClientDetail';
const PulseRoute: React.FC = () => (
	<BillingLayout>
		<Pulse />
	</BillingLayout>
);
const ClientsLedgerRoute: React.FC = () => (
	<BillingLayout>
		<ClientsLedger />
	</BillingLayout>
);
const ClientDetailRoute: React.FC = () => (
	<BillingLayout>
		<ClientDetail />
	</BillingLayout>
);
/** Factory: produces a tiny FC that performs a route-replacing redirect.
 *  Used to retire the 5 legacy billing report routes — bookmarks still work,
 *  users land on the equivalent ledger filter or new home page. */
const redirectTo = (target: string): React.FC => () => <Navigate to={target} replace />;
const RedirectBrokenCommitments = redirectTo('/billing/clients?filter=broken');
const RedirectCeoOverview       = redirectTo('/billing/pulse');
const RedirectClientHealth      = redirectTo('/billing/clients');
const RedirectOverdueBehaviour  = redirectTo('/billing/clients?filter=disputing');
const RedirectPipelineGaps      = redirectTo('/billing/clients?filter=untracked');
// 3D Builder
import { ThreeDBuilder } from '../pages/3d-builder/ThreeDBuilder';
// Approvals
import VendorInvoiceApprovals from '../pages/approvals/VendorInvoiceApprovals';
// Finances - Amazon Invoice
import AmazonInvoiceList from '../pages/finances/AmazonInvoiceList';
import AmazonInvoiceDetail from '../pages/finances/AmazonInvoiceDetail';
import AmazonInvoiceUpload from '../pages/finances/AmazonInvoiceUpload';
// Finances - Zoho Payment Received
import { ZohoPaymentList } from '../pages/finances/ZohoPaymentList';
// Finances - Zoho Invoices
import { ZohoInvoiceList } from '../pages/finances/ZohoInvoiceList';
// Finances - Zoho Bills (AP)
import { ZohoBillList } from '../pages/finances/ZohoBillList';
// Finances - Zoho Vendor Payments
import { ZohoVendorPaymentList } from '../pages/finances/ZohoVendorPaymentList';
// Finances - Zoho Expenses
import { ZohoExpenseList } from '../pages/finances/ZohoExpenseList';

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
	{ path: '/p-and-l/location-variance', component: LocationVariance },
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
	// HR - HRM
	{ path: '/hr/employees', component: EmployeeListing },
	{ path: '/hr/employees/add', component: AddEmployee },
	{ path: '/hr/employees/edit/:id', component: AddEmployee },
	{ path: '/hr/departments', component: DepartmentListing },
	{ path: '/hr/designations', component: DesignationListing },
	{ path: '/hr/salary-structures', component: SalaryStructureListing },
	// HR - Holidays
	{ path: '/hr/holidays', component: MyHolidays },
	{ path: '/hr/holidays/my-choices', component: MyChoices },
	{ path: '/hr/holidays/team-choices', component: TeamHolidayChoices },
	{ path: '/hr/holidays/master', component: HolidayMaster },
	{ path: '/hr/holidays/summary', component: HolidayChoicesSummary },
	{ path: '/hr/holidays/config', component: HolidayConfig },
	// HR - Leaves
	{ path: '/hr/leaves', component: MyLeaves },
	{ path: '/hr/comp-off', component: MyCompOff },
	{ path: '/hr/leave-requests', component: LeaveRequests },
	{ path: '/hr/team-comp-off', component: TeamCompOff },
	{ path: '/hr/leave-types', component: LeaveTypes },
	{ path: '/hr/leave-balances', component: LeaveBalances },
	// HR - Attendance
	{ path: '/hr/attendance', component: MyAttendance },
	{ path: '/hr/attendance/regularize', component: RegularizeAttendance },
	{ path: '/hr/attendance/mark', component: MarkAttendance },
	{ path: '/hr/attendance/team', component: TeamAttendance },
	{ path: '/hr/attendance/summary', component: AttendanceSummary },
	{ path: '/hr/attendance/regularization-requests', component: RegularizationRequests },
	// Billing - Invoice
	{ path: '/billing/invoice', component: InvoiceList },
	{ path: '/billing/details', component: BillingDetails },
	// Billing - Smart Follow-Up Tracker (Module 1, mock data)
	{ path: '/billing/follow-up-tracker', component: FollowUpTracker },
	// Billing - Customer Intelligence (Module 2)
	{ path: '/billing/customer-intelligence', component: CustomerIntelligence },
	// Billing redesign (handoff/) — new client-first IA. Pulse home + unified
	// ledger replace the 5 old report pages. Bookmarks to the legacy URLs
	// below redirect to the equivalent ledger filter / new home.
	{ path: '/billing/pulse', component: PulseRoute },
	{ path: '/billing/clients', component: ClientsLedgerRoute },
	{ path: '/billing/clients/:customerId', component: ClientDetailRoute },
	// Legacy bookmark redirects (Phase 3) — TSX files remain in repo until
	// Phase 4 cleanup after 2 weeks of low traffic.
	{ path: '/billing/client-health', component: RedirectClientHealth },
	{ path: '/billing/overdue-behaviour', component: RedirectOverdueBehaviour },
	{ path: '/billing/pipeline-gaps', component: RedirectPipelineGaps },
	{ path: '/billing/broken-commitments', component: RedirectBrokenCommitments },
	{ path: '/billing/ceo-overview', component: RedirectCeoOverview },
	// 3D Builder
	{ path: '/dashboard/3d-builder', component: ThreeDBuilder },
	// Approvals
	{ path: '/approvals/vendor-invoices', component: VendorInvoiceApprovals },
	// Finances - Amazon Invoice
	{ path: '/finances/amazon-invoice', component: AmazonInvoiceList },
	{ path: '/finances/amazon-invoice/upload', component: AmazonInvoiceUpload },
	{ path: '/finances/amazon-invoice/:invoiceNumber', component: AmazonInvoiceDetail },
	// Finances - Zoho Payment Received
	{ path: '/finances/zoho-payment-received', component: ZohoPaymentList },
	// Finances - Zoho Invoices
	{ path: '/finances/zoho-invoices', component: ZohoInvoiceList },
	// Finances - Zoho Bills (AP)
	{ path: '/finances/zoho-bills', component: ZohoBillList },
	// Finances - Zoho Vendor Payments
	{ path: '/finances/zoho-vendor-payments', component: ZohoVendorPaymentList },
	// Finances - Zoho Expenses
	{ path: '/finances/zoho-expenses', component: ZohoExpenseList },
];
