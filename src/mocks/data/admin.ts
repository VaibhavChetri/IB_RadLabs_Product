/**
 * Mock routes: ADMIN / COMMON / PROCUREMENT / HRMS / USERS / MENU (LOCAL DEMO ONLY)
 * --------------------------------------------------------------------------
 * The biggest, most cross-cutting module. Owns:
 *  - Shared dropdown lookups (cities / states / countries / facilities / clients /
 *    location-types / vehicles / transit-types / impact / billing types) used by
 *    filters across the WHOLE app — no other module defines these.
 *  - Menu permissions (grants access to EVERYTHING so the demo shows all menus) +
 *    Menu Management CRUD.
 *  - Procurement vendor-invoice approvals (dashboard, pending-my-approval,
 *    advance requests/payments, approval-status, decisions, proxy mode,
 *    /procurement/me/is-approver).
 *  - HRMS: employees, departments, designations, salary structures, tax
 *    declarations, hierarchies, holidays + choices, leave types/balances/
 *    applications, comp-off, attendance (my / team / summary / regularize), config.
 *  - Users CRUD + user types.
 *
 * Response shapes match the ACTUAL services/pages (the page is the source of
 * truth): location lookups use `ok([{id,name,...}])`; HRM lists use
 * `ok(items, { pagination })`; procurement uses `{ status, data, pagination }`.
 */

import { MockRoute, MockRequest } from '../mockTypes';
import {
	ok,
	pageMeta,
	paginate,
	seeded,
	list,
	CITIES,
	STATES,
	COMPANIES,
	fullName,
	vendor,
	phone,
	email,
	isoDate,
	isoDateTime,
	dateAgo,
	dateAhead,
	TODAY,
} from '../mockHelpers';
import { ALL_MENU_ITEMS } from '../../config/menuConfig';
import type { MenuItem } from '../../types/menu';

/* ------------------------------------------------------------------ *
 * Shared reference / lookup data
 * ------------------------------------------------------------------ */

const COUNTRIES = [{ id: 1, name: 'India', code: 'IN', status: 1 }];

/** STATES → [{id, name}] with stable ids. */
const STATE_ROWS = STATES.map((name, i) => ({ id: i + 1, name, status: 1 }));

/** Facilities (locations, location_type=2) → [{id, location}].
 *  Exactly one facility per city so city-filtered dropdowns (e.g. the dashboard
 *  landing) resolve to a single option and auto-select → data shows immediately. */
const FACILITIES = list(
	CITIES.length,
	(i, rng) => {
		const city = CITIES[i];
		const unit = rng.pick(['DC', 'Cold Store', 'Fulfilment Centre']);
		return {
			id: 100 + i,
			location: `${city.name} ${unit}`,
			name: `${city.name} ${unit}`,
			location_type: 2,
			city_id: city.id,
			city_name: city.name,
			state_id: city.state_id,
			status: 1,
		};
	},
	'facilities'
);

/** Clients (locations, location_type=3) → [{id, name}]. */
const CLIENTS = COMPANIES.map((name, i) => ({
	id: 200 + i,
	name,
	location_type: 3,
	city_id: CITIES[i % CITIES.length].id,
	city_name: CITIES[i % CITIES.length].name,
	status: 1,
}));

const LOCATION_TYPES = [
	{ id: 1, name: 'Country', slug: 'country', status: 1 },
	{ id: 2, name: 'Facility', slug: 'facility', status: 1 },
	{ id: 3, name: 'Client', slug: 'client', status: 1 },
	{ id: 4, name: 'Warehouse', slug: 'warehouse', status: 1 },
];

const VEHICLES = list(
	12,
	(i, rng) => ({
		id: 300 + i,
		name: `${rng.pick(['MH', 'DL', 'KA', 'TN', 'TS'])}${rng.int(10, 49)} ${rng.pick(['AB', 'CD', 'EF', 'GH'])} ${rng.int(1000, 9999)}`,
		driver_name: fullName(rng),
		driver_phone: phone(rng),
	}),
	'vehicles'
);

const TRANSIT_TYPES = [
	{ id: 1, type: 'Dispatch' },
	{ id: 2, type: 'Pickup' },
	{ id: 3, type: 'Dispatch & Pickup' },
];

const IMPACT_TYPES = [
	{ id: 1, name: 'Cost Saving', slug: 'cost-saving', status: 1 },
	{ id: 2, name: 'Revenue Growth', slug: 'revenue-growth', status: 1 },
	{ id: 3, name: 'Efficiency', slug: 'efficiency', status: 1 },
	{ id: 4, name: 'Quality', slug: 'quality', status: 1 },
	{ id: 5, name: 'Sustainability', slug: 'sustainability', status: 1 },
];

const BILLING_TYPES = [
	{ id: 1, name: 'Fixed', slug: 'fixed', status: 1 },
	{ id: 2, name: 'Variable', slug: 'variable', status: 1 },
	{ id: 3, name: 'Per Unit', slug: 'per-unit', status: 1 },
	{ id: 4, name: 'Subscription', slug: 'subscription', status: 1 },
];

const BILLING_SUB_TYPES = [
	{ id: 1, name: 'Monthly Retainer', slug: 'monthly-retainer', billing_type_id: 1, status: 1 },
	{ id: 2, name: 'One-Time Setup', slug: 'one-time-setup', billing_type_id: 1, status: 1 },
	{ id: 3, name: 'Usage Based', slug: 'usage-based', billing_type_id: 2, status: 1 },
	{ id: 4, name: 'Per Crate', slug: 'per-crate', billing_type_id: 3, status: 1 },
	{ id: 5, name: 'Per KG', slug: 'per-kg', billing_type_id: 3, status: 1 },
	{ id: 6, name: 'Annual Plan', slug: 'annual-plan', billing_type_id: 4, status: 1 },
];

/** Generic lookup-type tables (review cost/category, complaint/escalation, QC). */
const REVIEW_COST_TYPES = [
	{ id: 1, name: 'Manpower', slug: 'manpower', status: 1 },
	{ id: 2, name: 'Consumables', slug: 'consumables', status: 1 },
	{ id: 3, name: 'Utilities', slug: 'utilities', status: 1 },
	{ id: 4, name: 'Transport', slug: 'transport', status: 1 },
	{ id: 5, name: 'Maintenance', slug: 'maintenance', status: 1 },
];

const REVIEW_CATEGORY_TYPES = [
	{ id: 1, name: 'Operational', slug: 'operational', status: 1 },
	{ id: 2, name: 'Financial', slug: 'financial', status: 1 },
	{ id: 3, name: 'Compliance', slug: 'compliance', status: 1 },
	{ id: 4, name: 'Customer', slug: 'customer', status: 1 },
];

const COMPLAINT_TYPES = [
	{ id: 1, name: 'Delay', slug: 'delay', status: 1 },
	{ id: 2, name: 'Damage', slug: 'damage', status: 1 },
	{ id: 3, name: 'Temperature Breach', slug: 'temperature-breach', status: 1 },
	{ id: 4, name: 'Short Quantity', slug: 'short-quantity', status: 1 },
	{ id: 5, name: 'Billing Dispute', slug: 'billing-dispute', status: 1 },
];

const QC_TYPES = [
	{ id: 1, name: 'Visual Inspection', slug: 'visual-inspection', status: 1 },
	{ id: 2, name: 'Weight Check', slug: 'weight-check', status: 1 },
	{ id: 3, name: 'Temperature Check', slug: 'temperature-check', status: 1 },
	{ id: 4, name: 'Packaging Integrity', slug: 'packaging-integrity', status: 1 },
];

const CONTAINER_TYPES = [
	{ id: 1, name: 'Insulated Box 20L', capacity: 20, slug: 'insulated-box-20l', status: 1 },
	{ id: 2, name: 'Reusable Crate 25L', capacity: 25, slug: 'reusable-crate-25l', status: 1 },
	{ id: 3, name: 'EPS Cooler 40L', capacity: 40, slug: 'eps-cooler-40l', status: 1 },
	{ id: 4, name: 'Pallet', capacity: 0, slug: 'pallet', status: 1 },
];

/* ------------------------------------------------------------------ *
 * User types & users
 * ------------------------------------------------------------------ */

const USER_TYPES = [
	{ id: 1, name: 'Super Admin', description: 'Full system access', priority: 1, status: 1 },
	{ id: 2, name: 'City Head', description: 'City-level head', priority: 2, status: 1 },
	{ id: 3, name: 'Operations Manager', description: 'Operations', priority: 3, status: 1 },
	{ id: 4, name: 'Finance', description: 'Accounts & finance', priority: 4, status: 1 },
	{ id: 5, name: 'KAM', description: 'Key account manager', priority: 5, status: 1 },
	{ id: 6, name: 'Facility Manager', description: 'Facility ops', priority: 6, status: 1 },
	{ id: 7, name: 'Sales Executive', description: 'Sales', priority: 7, status: 1 },
];

function buildUsers(n: number) {
	return list(
		n,
		(i, rng) => {
			const name = fullName(rng);
			const [first, last] = name.split(' ');
			const city = rng.pick(CITIES);
			const ut = rng.pick(USER_TYPES);
			return {
				id: i + 1,
				username: `${first}.${last}`.toLowerCase() + (i + 1),
				firstName: first,
				lastName: last,
				email: email(name),
				contact: phone(rng),
				gender: rng.pick(['Male', 'Female']),
				userTypeId: ut.id,
				userTypeName: ut.name,
				cityId: city.id,
				cityName: city.name,
				facilityId: rng.pick(FACILITIES).id,
				status: rng.bool(0.85) ? 1 : 0,
				createdAt: isoDateTime(dateAgo(rng.int(30, 720))),
				updatedAt: isoDateTime(dateAgo(rng.int(0, 29))),
			};
		},
		'users'
	);
}

const ALL_USERS = buildUsers(48);

/* ------------------------------------------------------------------ *
 * Menu permissions — grant access to EVERYTHING (demo)
 * ------------------------------------------------------------------ */

type PermNode = { access: boolean; children: Record<string, PermNode> };

function buildFullPermissions(items: MenuItem[]): Record<string, PermNode> {
	const out: Record<string, PermNode> = {};
	for (const item of items) {
		out[item.id] = {
			access: true,
			children: item.children ? buildFullPermissions(item.children) : {},
		};
	}
	return out;
}

const FULL_MENU_PERMISSIONS = buildFullPermissions(ALL_MENU_ITEMS);

/* ------------------------------------------------------------------ *
 * Flat menu table (Menu Management) derived from ALL_MENU_ITEMS
 * ------------------------------------------------------------------ */

interface FlatMenu {
	id: number;
	name: string;
	slug: string;
	parent_id: number | null;
	sort_order: number;
	level: number;
	badge: string | null;
	status: number;
	created_at: string | null;
	updated_at: string | null;
	parent_name: string | null;
	has_children: boolean;
}

function buildFlatMenus(): FlatMenu[] {
	const rows: FlatMenu[] = [];
	let autoId = 1;

	const walk = (items: MenuItem[], parentId: number | null, parentName: string | null, level: number) => {
		items.forEach((item, idx) => {
			const id = autoId++;
			rows.push({
				id,
				name: item.name,
				slug: item.id,
				parent_id: parentId,
				sort_order: idx + 1,
				level,
				badge: item.badge ?? null,
				status: 1,
				created_at: isoDateTime(dateAgo(400)),
				updated_at: isoDateTime(dateAgo(30)),
				parent_name: parentName,
				has_children: !!(item.children && item.children.length),
			});
			if (item.children && item.children.length) {
				walk(item.children, id, item.name, level + 1);
			}
		});
	};

	walk(ALL_MENU_ITEMS, null, null, 1);
	return rows;
}

const FLAT_MENUS = buildFlatMenus();

/** Build the per-menu permission rows the Menu Management permission editor renders. */
function menuPermissionRows(menuId: number) {
	return USER_TYPES.map(ut => ({
		id: menuId * 100 + ut.id,
		user_type_id: ut.id,
		user_type_name: ut.name,
		menu_id: menuId,
		access: true,
		created_by: 1,
		updated_by: 1,
		created_at: isoDateTime(dateAgo(400)),
		updated_at: isoDateTime(dateAgo(30)),
	}));
}

/** Recursively build the descendants tree (with permissions) for a parent menu. */
function buildMenuDescendants(parentId: number): any[] {
	return FLAT_MENUS.filter(m => m.parent_id === parentId).map(m => ({
		...m,
		permissions: menuPermissionRows(m.id),
		has_children: FLAT_MENUS.some(c => c.parent_id === m.id),
		children: buildMenuDescendants(m.id),
	}));
}

/* ------------------------------------------------------------------ *
 * HRMS data
 * ------------------------------------------------------------------ */

const DEPARTMENTS = [
	{ id: 1, name: 'Operations', code: 'OPS', parent_department_id: null, is_active: true },
	{ id: 2, name: 'Finance', code: 'FIN', parent_department_id: null, is_active: true },
	{ id: 3, name: 'Human Resources', code: 'HR', parent_department_id: null, is_active: true },
	{ id: 4, name: 'Sales', code: 'SAL', parent_department_id: null, is_active: true },
	{ id: 5, name: 'Technology', code: 'TECH', parent_department_id: null, is_active: true },
	{ id: 6, name: 'Warehouse Ops', code: 'WHO', parent_department_id: 1, is_active: true },
].map(d => ({ ...d, created_at: isoDateTime(dateAgo(500)), updated_at: isoDateTime(dateAgo(20)) }));

const DESIGNATIONS = [
	{ id: 1, title: 'Executive', level: 1, is_active: true },
	{ id: 2, title: 'Senior Executive', level: 2, is_active: true },
	{ id: 3, title: 'Team Lead', level: 3, is_active: true },
	{ id: 4, title: 'Manager', level: 4, is_active: true },
	{ id: 5, title: 'Senior Manager', level: 5, is_active: true },
	{ id: 6, title: 'Director', level: 6, is_active: true },
].map(d => ({ ...d, created_at: isoDateTime(dateAgo(500)), updated_at: isoDateTime(dateAgo(20)) }));

const EMPLOYMENT_TYPES = ['full_time', 'contract', 'intern', 'consultant'];
const EMP_STATUSES = ['active', 'on_notice', 'inactive'];

function buildEmployees(n: number) {
	return list(
		n,
		(i, rng) => {
			const name = fullName(rng);
			const [first, last] = name.split(' ');
			const dept = rng.pick(DEPARTMENTS);
			const desig = rng.pick(DESIGNATIONS);
			const city = rng.pick(CITIES);
			const ctc = rng.int(4, 36) * 100000;
			return {
				id: i + 1,
				employee_code: `EMP${String(1001 + i)}`,
				first_name: first,
				last_name: last,
				full_name: name,
				gender: rng.pick(['male', 'female']),
				email: email(name),
				personal_email: null,
				phone: phone(rng),
				whatsapp_opt_in: rng.bool(0.6),
				city: city.name,
				address: `${rng.int(1, 99)}, ${rng.pick(['MG Road', 'Linking Road', 'Brigade Road', 'Anna Salai'])}, ${city.name}`,
				team: dept.name,
				date_of_joining: isoDate(dateAgo(rng.int(60, 1500))),
				date_of_birth: isoDate(dateAgo(rng.int(8000, 16000))),
				date_of_exit: null,
				department_id: dept.id,
				department_name: dept.name,
				designation_id: desig.id,
				designation_title: desig.title,
				employment_type: rng.pick(EMPLOYMENT_TYPES),
				status: rng.pick(EMP_STATUSES),
				state_id: city.state_id,
				state_name: city.state,
				pt_state_id: city.state_id,
				pt_state_name: city.state,
				lwf_state_id: city.state_id,
				lwf_state_name: city.state,
				primary_manager_id: i > 5 ? rng.int(1, 5) : null,
				primary_manager_name: i > 5 ? fullName(rng) : null,
				admin_id: null,
				annual_ctc: ctc,
				monthly_salary: Math.round(ctc / 12),
				bonus_variable_yearly: Math.round(ctc * 0.1),
				joining_bonus: rng.bool(0.3) ? rng.int(20000, 100000) : 0,
				emergency_contact_name: fullName(rng),
				emergency_contact_number: phone(rng),
				emergency_contact_relation: rng.pick(['Spouse', 'Parent', 'Sibling']),
				pan_number: `ABCDE${rng.int(1000, 9999)}F`,
				aadhaar_number: `${rng.int(1000, 9999)} ${rng.int(1000, 9999)} ${rng.int(1000, 9999)}`,
				uan_number: `${rng.int(100000000000, 999999999999)}`,
				bank_account_number: `${rng.int(10000000000, 99999999999)}`,
				bank_ifsc: `HDFC000${rng.int(1000, 9999)}`,
				created_at: isoDateTime(dateAgo(rng.int(60, 1500))),
				updated_at: isoDateTime(dateAgo(rng.int(0, 30))),
				is_active: rng.bool(0.9),
			};
		},
		'hrm-employees'
	);
}

const EMPLOYEES = buildEmployees(36);

const LEAVE_TYPES = [
	{ id: 1, name: 'Casual Leave', code: 'CL', annual_quota: 12, max_carry_forward: 0, max_consecutive_days: 3, is_paid: true, requires_document: false, min_days_advance: 1, is_active: true },
	{ id: 2, name: 'Sick Leave', code: 'SL', annual_quota: 12, max_carry_forward: 0, max_consecutive_days: 7, is_paid: true, requires_document: true, min_days_advance: 0, is_active: true },
	{ id: 3, name: 'Earned Leave', code: 'EL', annual_quota: 18, max_carry_forward: 30, max_consecutive_days: 15, is_paid: true, requires_document: false, min_days_advance: 7, is_active: true },
	{ id: 4, name: 'Maternity Leave', code: 'ML', annual_quota: 182, max_carry_forward: 0, max_consecutive_days: 182, is_paid: true, requires_document: true, min_days_advance: 30, is_active: true },
	{ id: 5, name: 'Loss of Pay', code: 'LOP', annual_quota: 0, max_carry_forward: 0, max_consecutive_days: null, is_paid: false, requires_document: false, min_days_advance: 0, is_active: true },
].map(l => ({ ...l, created_at: isoDateTime(dateAgo(500)), updated_at: isoDateTime(dateAgo(20)) }));

function buildLeaveApplications(n: number) {
	return list(
		n,
		(i, rng) => {
			const lt = rng.pick(LEAVE_TYPES.filter(t => t.code !== 'LOP'));
			const emp = rng.pick(EMPLOYEES);
			const startAgo = rng.int(-30, 90);
			const days = rng.int(1, 4);
			const from = dateAgo(startAgo);
			const to = dateAgo(startAgo - (days - 1));
			const status = rng.pick(['pending', 'approved', 'approved', 'rejected', 'cancelled']) as
				| 'pending'
				| 'approved'
				| 'rejected'
				| 'cancelled';
			const half = rng.bool(0.15);
			return {
				id: i + 1,
				employee_id: emp.id,
				employee_name: emp.full_name,
				employee_code: emp.employee_code,
				leave_type_id: lt.id,
				leave_type_name: lt.name,
				leave_type_code: lt.code,
				from_date: isoDate(from),
				to_date: isoDate(half ? from : to),
				total_days: half ? 0.5 : days,
				is_half_day: half,
				half_day_type: half ? rng.pick(['first_half', 'second_half']) : null,
				reason: rng.pick(['Personal work', 'Family function', 'Not feeling well', 'Travel', 'Medical appointment']),
				status,
				auto_lop_converted: false,
				applied_at: isoDateTime(dateAgo(startAgo + rng.int(2, 10))),
				reviewed_by_name: status === 'pending' ? null : fullName(rng),
				reviewer_remarks: status === 'rejected' ? 'Insufficient balance' : null,
				document_url: lt.requires_document ? 'https://example.com/doc.pdf' : null,
			};
		},
		'hrm-leave-apps'
	);
}

const LEAVE_APPLICATIONS = buildLeaveApplications(40);

function leaveBalancesFor(employeeId: number) {
	const rng = seeded(`leave-bal-${employeeId}`);
	return LEAVE_TYPES.filter(t => t.code !== 'LOP').map(lt => {
		const opening = rng.int(0, 6);
		const accrued = lt.annual_quota;
		const used = rng.int(0, Math.min(8, lt.annual_quota));
		return {
			leave_type_id: lt.id,
			leave_type_name: lt.name,
			leave_type_code: lt.code,
			annual_quota: lt.annual_quota,
			opening_balance: opening,
			accrued,
			used,
			lapsed: 0,
			closing_balance: opening + accrued - used,
		};
	});
}

function buildCompOffs(n: number) {
	return list(
		n,
		(i, rng) => {
			const emp = rng.pick(EMPLOYEES);
			const earnedAgo = rng.int(5, 60);
			return {
				id: i + 1,
				employee_id: emp.id,
				employee_name: emp.full_name,
				earned_date: isoDate(dateAgo(earnedAgo)),
				expiry_date: isoDate(dateAhead(90 - earnedAgo)),
				status: rng.pick(['available', 'available', 'used', 'expired']) as 'available' | 'used' | 'expired',
				remarks: rng.bool(0.4) ? 'Worked on weekend deployment' : null,
			};
		},
		'hrm-comp-off'
	);
}

const COMP_OFFS = buildCompOffs(14);

const HOLIDAYS = [
	{ id: 1, name: 'Republic Day', date: '2026-01-26', type: 'national', is_optional: false },
	{ id: 2, name: 'Holi', date: '2026-03-04', type: 'national', is_optional: false },
	{ id: 3, name: 'Good Friday', date: '2026-04-03', type: 'restricted', is_optional: true },
	{ id: 4, name: 'Independence Day', date: '2026-08-15', type: 'national', is_optional: false },
	{ id: 5, name: 'Ganesh Chaturthi', date: '2026-09-14', type: 'restricted', is_optional: true },
	{ id: 6, name: 'Gandhi Jayanti', date: '2026-10-02', type: 'national', is_optional: false },
	{ id: 7, name: 'Diwali', date: '2026-11-08', type: 'national', is_optional: false },
	{ id: 8, name: 'Christmas', date: '2026-12-25', type: 'company', is_optional: false },
].map(h => ({ ...h, year: 2026, created_at: isoDateTime(dateAgo(300)), updated_at: isoDateTime(dateAgo(20)) }));

const HRM_CONFIG = [
	{ config_key: 'restricted_holiday_quota', config_value: '2', description: 'Number of restricted holidays an employee may choose per year' },
	{ config_key: 'leave_financial_year_start', config_value: '04-01', description: 'Leave financial year start (MM-DD)' },
	{ config_key: 'weekend_days', config_value: 'sat,sun', description: 'Configured weekend days' },
	{ config_key: 'min_attendance_for_full_pay', config_value: '90', description: 'Minimum attendance percentage for full pay' },
];

/** Attendance records for an employee for a given month/year. */
function attendanceForMonth(employeeId: number, month: number, year: number) {
	const rng = seeded(`att-${employeeId}-${month}-${year}`);
	const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
	const records: any[] = [];
	const summary = {
		employee_id: employeeId,
		month,
		year,
		total_calendar_days: daysInMonth,
		total_working_days: 0,
		present: 0,
		absent: 0,
		half_day: 0,
		on_leave: 0,
		holiday: 0,
		weekend: 0,
		comp_off: 0,
		paid_days: 0,
		lop_days: 0,
	};
	const refDate = new Date(TODAY);
	for (let day = 1; day <= daysInMonth; day++) {
		const d = new Date(Date.UTC(year, month - 1, day));
		if (d.getTime() > refDate.getTime()) break; // don't mark the future
		const dow = d.getUTCDay();
		let status: string;
		if (dow === 0 || dow === 6) {
			status = 'weekend';
			summary.weekend++;
		} else {
			summary.total_working_days++;
			const r = rng.next();
			if (r < 0.82) {
				status = 'present';
				summary.present++;
				summary.paid_days++;
			} else if (r < 0.9) {
				status = 'on_leave';
				summary.on_leave++;
				summary.paid_days++;
			} else if (r < 0.95) {
				status = 'half_day';
				summary.half_day++;
				summary.paid_days += 0.5;
			} else {
				status = 'absent';
				summary.absent++;
				summary.lop_days++;
			}
		}
		records.push({
			id: employeeId * 1000 + day,
			employee_id: employeeId,
			attendance_date: isoDate(d),
			status,
			source: 'system',
			approval_status: 'approved',
			remarks: null,
		});
	}
	return { records, summary };
}

function buildRegularizations(n: number) {
	return list(
		n,
		(i, rng) => {
			const emp = rng.pick(EMPLOYEES);
			return {
				id: i + 1,
				attendance_id: emp.id * 1000 + rng.int(1, 28),
				employee_id: emp.id,
				employee_name: emp.full_name,
				employee_code: emp.employee_code,
				attendance_date: isoDate(dateAgo(rng.int(1, 25))),
				original_status: 'absent',
				requested_status: rng.pick(['present', 'half_day']),
				reason: rng.pick(['Was on client site', 'Biometric failure', 'Worked from home', 'Network outage']),
				review_status: rng.pick(['pending', 'pending', 'approved', 'rejected']) as 'pending' | 'approved' | 'rejected',
				requested_at: isoDateTime(dateAgo(rng.int(1, 20))),
				remarks: null,
			};
		},
		'hrm-regularize'
	);
}

const REGULARIZATIONS = buildRegularizations(10);

/* ------------------------------------------------------------------ *
 * Procurement — vendor invoice approvals
 * ------------------------------------------------------------------ */

const APPROVAL_STATUSES = ['pending_approval', 'approved', 'approved', 'rejected'] as const;

const APPROVER_POOL = [
	{ id: 9001, name: 'Shashwat Gangwal', email: 'shashwat.gangwal@example.com', role: 'first_approver' },
	{ id: 9002, name: 'Asha Reddy', email: 'asha.reddy@example.com', role: 'senior_approver' },
	{ id: 9003, name: 'Swati Iyer', email: 'swati.iyer@example.com', role: 'default_approver' },
	{ id: 9004, name: 'Priyanka Nair', email: 'priyanka.nair@example.com', role: 'default_approver' },
];

interface MockVendorInvoice {
	vendorInvoiceId: number;
	leadId: number;
	vendor_name: string;
	client: string;
	city: string;
	invoice_amount: number;
	invoice_number: string;
	invoice_date: string;
	approval_status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
	approval_submitted_at: string;
	approved_at: string | null;
	rejected_at: string | null;
	totalPaid: number;
	isAdvance: boolean;
	advanceRequested: number | null;
	advanceApproved: number | null;
}

function buildVendorInvoices(n: number): MockVendorInvoice[] {
	return list(
		n,
		(i, rng) => {
			const status = rng.pick(APPROVAL_STATUSES);
			const amount = rng.int(25000, 1500000);
			const submittedAgo = rng.int(1, 45);
			const isAdvance = rng.bool(0.35);
			const advReq = isAdvance ? Math.round(amount * rng.float(0.2, 0.5)) : null;
			return {
				vendorInvoiceId: 5000 + i,
				leadId: 700 + (i % 18),
				vendor_name: vendor(rng),
				client: rng.pick(COMPANIES),
				city: rng.pick(CITIES).name,
				invoice_amount: amount,
				invoice_number: `INV-${2026}-${String(4500 + i)}`,
				invoice_date: isoDate(dateAgo(submittedAgo + 2)),
				approval_status: status,
				approval_submitted_at: isoDateTime(dateAgo(submittedAgo)),
				approved_at: status === 'approved' ? isoDateTime(dateAgo(submittedAgo - 1)) : null,
				rejected_at: status === 'rejected' ? isoDateTime(dateAgo(submittedAgo - 1)) : null,
				totalPaid: status === 'approved' ? (isAdvance ? (advReq ?? 0) : amount) : 0,
				isAdvance,
				advanceRequested: advReq,
				advanceApproved: status === 'approved' && advReq ? advReq : null,
			};
		},
		'proc-vendor-invoices'
	);
}

const VENDOR_INVOICES = buildVendorInvoices(54);

function riskFor(inv: MockVendorInvoice): { severity: 'info' | 'warn' | 'high' | 'block'; flag: string } {
	if (inv.invoice_amount > 1000000) return { severity: 'high', flag: 'high_value' };
	if (inv.invoice_amount > 500000) return { severity: 'warn', flag: 'review_budget' };
	return { severity: 'info', flag: 'ok' };
}

function buildApprovalTrail(inv: MockVendorInvoice) {
	const rng = seeded(`trail-${inv.vendorInvoiceId}`);
	const approvers = rng.picks(APPROVER_POOL, 2);
	return approvers.map((ap, idx) => {
		const decided =
			inv.approval_status === 'approved'
				? 'approved'
				: inv.approval_status === 'rejected' && idx === approvers.length - 1
					? 'rejected'
					: inv.approval_status === 'rejected'
						? 'approved'
						: idx === 0 && rng.bool(0.5)
							? 'approved'
							: 'pending';
		return {
			approvalRowId: inv.vendorInvoiceId * 10 + idx,
			batchId: inv.vendorInvoiceId,
			approverId: ap.id,
			approverLoginIds: [ap.id],
			approverName: ap.name,
			approverEmail: ap.email,
			approverRole: ap.role,
			approvalStage: idx + 1,
			decision: decided as 'pending' | 'approved' | 'rejected',
			decidedAt: decided === 'pending' ? null : isoDateTime(dateAgo(2)),
			rejectionReason: decided === 'rejected' ? 'Budget exceeded — please revise the quote.' : null,
			isAdvance: inv.isAdvance,
			advanceRequested: inv.advanceRequested,
			advanceApproved: inv.advanceApproved,
		};
	});
}

function apContextFor(inv: MockVendorInvoice) {
	const risk = riskFor(inv);
	const committed = inv.invoice_amount;
	const advances = inv.isAdvance ? (inv.advanceApproved ?? inv.advanceRequested ?? 0) : 0;
	const finalPaid = inv.isAdvance ? 0 : inv.totalPaid;
	const totalPaid = advances + finalPaid;
	return {
		vendor_invoice_id: inv.vendorInvoiceId,
		vendor_name: inv.vendor_name,
		procurement_vendor_id: 8000 + (inv.vendorInvoiceId % 50),
		currency: 'INR',
		amounts: {
			committed,
			header_invoice_amount: inv.invoice_amount,
			already_billed_via_pdfs: 0,
			advances_paid: advances,
			final_paid: finalPaid,
			total_paid: totalPaid,
			pending_in_request: inv.approval_status === 'pending_approval' ? inv.invoice_amount : 0,
			net_remaining_after_request: Math.max(0, committed - totalPaid),
		},
		counts: { pdf_files: 1, advances: inv.isAdvance ? 1 : 0, receipts: inv.totalPaid > 0 ? 1 : 0 },
		risk: {
			flag: risk.flag,
			severity: risk.severity,
			reason: risk.severity === 'info' ? 'Within budget' : 'Invoice value high relative to deal',
			overrun_amount: 0,
			overrun_percent: 0,
		},
	};
}

/** Group vendor invoices by lead for the pending-my-approval / advance-requests views. */
function buildPendingLeads(filter: (inv: MockVendorInvoice) => boolean) {
	const leadIds = [...new Set(VENDOR_INVOICES.filter(filter).map(v => v.leadId))];
	return leadIds.map(leadId => {
		const invs = VENDOR_INVOICES.filter(v => v.leadId === leadId && filter(v));
		const first = invs[0];
		const rng = seeded(`lead-${leadId}`);
		const totalVendorCost = invs.reduce((s, v) => s + v.invoice_amount, 0);
		const dealValue = totalVendorCost + rng.int(50000, 400000);
		const vendors = invs.map(inv => {
			const trail = buildApprovalTrail(inv);
			const mine = trail.find(t => t.decision === 'pending') ?? trail[0];
			return {
				vendorInvoiceId: inv.vendorInvoiceId,
				vendorName: inv.vendor_name,
				invoiceAmount: inv.invoice_amount,
				invoiceFileUrl: 'https://example.com/invoice.pdf',
				invoiceNumber: inv.invoice_number,
				invoiceDate: inv.invoice_date,
				invoiceStatus: 'received',
				invoiceRemarks: null,
				contactPerson: fullName(rng),
				contactNumber: phone(rng),
				approvalStatus: inv.approval_status,
				approvalSubmittedAt: inv.approval_submitted_at,
				myDecision: mine.decision,
				approvalsTotal: trail.length,
				approvalsDone: trail.filter(t => t.decision !== 'pending').length,
				approvalTrail: trail,
				rejectedAt: inv.rejected_at,
				rejectionReason: inv.rejected_at ? 'Budget exceeded' : null,
				rejectedBy: inv.rejected_at ? 'Asha Reddy' : null,
				reopened: { isReopened: false, reason: null, rejectedByAdminId: null, rejectedByName: null },
				ap_context: apContextFor(inv),
				advance_requested: inv.advanceRequested,
				advance_approved: inv.advanceApproved,
			};
		});
		return {
			leadId,
			client: first.client,
			city: first.city,
			clientPos: [
				{
					poNumber: `PO-${leadId}-01`,
					totalAmount: String(dealValue),
					s3Url: 'https://example.com/po.pdf',
					originalFilename: `PO-${leadId}.pdf`,
				},
			],
			vendors: vendors.filter(v => v.approvalStatus !== 'rejected'),
			rejectedVendors: vendors.filter(v => v.approvalStatus === 'rejected'),
			dealValue,
			totalVendorCost,
			profit: dealValue - totalVendorCost,
			profitPct: dealValue ? +(((dealValue - totalVendorCost) / dealValue) * 100).toFixed(1) : null,
			revenueSource: 'client_quotation' as const,
		};
	});
}

/** Advance/payment row used by advance-payments + payments-pending tabs. */
function buildPaymentRows(advanceOnly: boolean) {
	return VENDOR_INVOICES.filter(v => (advanceOnly ? v.isAdvance : !v.isAdvance) && v.approval_status === 'approved').map(
		(inv, idx) => {
			const rng = seeded(`pay-${inv.vendorInvoiceId}`);
			const trail = buildApprovalTrail(inv);
			const amountReq = advanceOnly ? inv.advanceRequested : inv.invoice_amount;
			const amountApp = advanceOnly ? inv.advanceApproved ?? inv.advanceRequested : inv.invoice_amount;
			const receiptUploaded = rng.bool(0.5);
			return {
				vendorInvoiceId: inv.vendorInvoiceId,
				approvalRowId: trail[trail.length - 1].approvalRowId,
				leadId: inv.leadId,
				serialNumber: `SN-${1000 + idx}`,
				client: inv.client,
				city: inv.city,
				leadStatus: 'won',
				vendorName: inv.vendor_name,
				invoiceNumber: inv.invoice_number,
				invoiceAmount: inv.invoice_amount,
				approvalStatus: inv.approval_status,
				paymentStatus: (receiptUploaded ? 'partially_paid' : 'unpaid') as 'unpaid' | 'partially_paid' | 'paid',
				approvalSubmittedAt: inv.approval_submitted_at,
				approvedAt: inv.approved_at,
				rejectedAt: inv.rejected_at,
				amountRequested: amountReq,
				amountApproved: amountApp,
				approvalsTotal: trail.length,
				approvalsDone: trail.filter(t => t.decision !== 'pending').length,
				totalPaid: receiptUploaded ? amountApp : 0,
				daysSinceSubmitted: Math.round((TODAY.getTime() - new Date(inv.approval_submitted_at).getTime()) / 86400000),
				receiptUploaded,
				receipt: receiptUploaded
					? {
							id: inv.vendorInvoiceId,
							amount: amountApp ?? 0,
							paidOn: isoDate(dateAgo(2)),
							fileUrl: 'https://example.com/receipt.pdf',
							paymentMode: 'neft',
							referenceNumber: `UTR${rng.int(100000000, 999999999)}`,
							notes: null,
						}
					: null,
				fullyPaid: false,
				totalReceiptsAmount: receiptUploaded ? amountApp : 0,
				receiptCount: receiptUploaded ? 1 : 0,
				isAdvance: advanceOnly,
			};
		}
	);
}

/* ------------------------------------------------------------------ *
 * Envelope helpers
 * ------------------------------------------------------------------ */

/** Procurement paginated envelope: { status, data, pagination:{page,perPage,total,pages} }. */
function procPaginated<T>(items: T[], req: MockRequest, extra: Record<string, unknown> = {}) {
	const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
	const perPage = Math.max(1, parseInt(req.query.perPage || '20', 10) || 20);
	const start = (page - 1) * perPage;
	const slice = items.slice(start, start + perPage);
	return {
		status: true,
		data: slice,
		pagination: { page, perPage, total: items.length, pages: Math.max(1, Math.ceil(items.length / perPage)) },
		...extra,
	};
}

/** HRM list envelope: ok(items, { pagination, success }). */
function hrmList<T>(items: T[], req: MockRequest) {
	const { slice, page, limit, total } = paginate(items, req.query);
	return ok(slice, { success: 'true', pagination: pageMeta(total, page, limit) });
}

const mutationOk = (data: Record<string, unknown> = {}) => ok({ success: true, ...data });

/* ================================================================== *
 * ROUTES
 * ================================================================== */

export const routes: MockRoute[] = [
	/* ----------------------------------------------------------------
	 * COMMON / LOCATION dropdowns  (base = /v1/api)
	 * ---------------------------------------------------------------- */
	{ method: 'GET', pattern: /^\/locations\/getCountries$/, handler: () => ok(COUNTRIES) },
	{ method: 'GET', pattern: /^\/locations\/getStates$/, handler: () => ok(STATE_ROWS) },
	{
		method: 'GET',
		pattern: /^\/locations\/getCities$/,
		handler: () => ok(CITIES.map(c => ({ id: c.id, name: c.name, state_id: c.state_id, status: 1 }))),
	},
	{ method: 'GET', pattern: /^\/locations\/getLocationType$/, handler: () => ok(LOCATION_TYPES) },
	{
		method: 'GET',
		pattern: /^\/locations\/getLocations$/,
		handler: (req: MockRequest) => {
			const type = req.query.location_type;
			if (type === '3') return ok(CLIENTS); // clients
			if (type === '2') {
				const cityId = req.query.city_id ? Number(req.query.city_id) : null;
				const rows = cityId ? FACILITIES.filter(f => f.city_id === cityId) : FACILITIES;
				return ok(rows);
			}
			return ok([...FACILITIES, ...CLIENTS]);
		},
	},
	{
		method: 'GET',
		pattern: /^\/vehicle\/getVehicles$/,
		handler: () => ({ status_code: 200, statusCode: 200, status: 'Success', message: null, result: VEHICLES, data: VEHICLES, pagination: pageMeta(VEHICLES.length) }),
	},
	{ method: 'GET', pattern: /^\/transit-plan\/get-transit-types$/, handler: () => ok({ result: TRANSIT_TYPES }) },
	{
		method: 'GET',
		pattern: /^\/transit-plan\/get-citywise-restaurants$/,
		handler: () => ok({ result: CLIENTS.map(c => ({ id: c.id, name: c.name })) }),
	},

	// Generic lookup tables
	{ method: 'GET', pattern: /getImpactMenu$/, handler: (req) => ok({ data: IMPACT_TYPES, total: IMPACT_TYPES.length, page: Number(req.query.page || 1), limit: Number(req.query.limit || 10) }) },
	{ method: 'GET', pattern: /^\/billing\/getBillingTypes$/, handler: (req) => ok({ data: BILLING_TYPES, total: BILLING_TYPES.length, page: Number(req.query.page || 1), limit: Number(req.query.limit || 10) }) },
	{ method: 'GET', pattern: /^\/billing\/getBillingSubTypes$/, handler: (req) => ok({ data: BILLING_SUB_TYPES, total: BILLING_SUB_TYPES.length, page: Number(req.query.page || 1), limit: Number(req.query.limit || 10) }) },
	{ method: 'GET', pattern: /reviewCostType|review-cost-type|getCostType/i, handler: () => ok(REVIEW_COST_TYPES) },
	{ method: 'GET', pattern: /reviewCategoryType|review-category-type|getCategoryType/i, handler: () => ok(REVIEW_CATEGORY_TYPES) },
	{ method: 'GET', pattern: /complaintType|complaint-type|escalationType|escalation-type/i, handler: () => ok(COMPLAINT_TYPES) },
	{ method: 'GET', pattern: /qcType|qc-type|getQcType/i, handler: () => ok(QC_TYPES) },
	{ method: 'GET', pattern: /containerType|container-type|getContainer/i, handler: () => ok(CONTAINER_TYPES) },

	/* ----------------------------------------------------------------
	 * MENU PERMISSIONS  — grant access to EVERYTHING
	 * ---------------------------------------------------------------- */
	{ method: 'GET', pattern: /^\/menus\/permissions$/, handler: () => ok({ menu_permissions: FULL_MENU_PERMISSIONS }) },
	{ method: 'GET', pattern: /^\/user\/menu-access\/[^/]+$/, handler: () => ok({ hasAccess: true }) },
	{ method: 'GET', pattern: /^\/user\/accessible-menus$/, handler: () => ok({ menuIds: Object.keys(FULL_MENU_PERMISSIONS) }) },
	{ method: 'POST', pattern: /^\/user\/refresh-menu-permissions$/, handler: () => ok({ menu_permissions: FULL_MENU_PERMISSIONS }) },

	/* ----------------------------------------------------------------
	 * MENU MANAGEMENT CRUD
	 * ---------------------------------------------------------------- */
	{ method: 'GET', pattern: /^\/users\/getUserTypes$/, handler: () => ok(USER_TYPES) },
	{ method: 'POST', pattern: /^\/menus\/permissions\/bulk$/, handler: () => mutationOk({ updated: true }) },
	{ method: 'POST', pattern: /^\/menus\/hierarchy$/, handler: (req) => ok({ created: true, parent: req.body?.parent ?? null, children: req.body?.children ?? [] }) },
	{
		method: 'GET',
		pattern: /^\/menus\/(?<id>\d+)\/permissions$/,
		handler: (req) => {
			const id = Number(req.params.id);
			const menu = FLAT_MENUS.find(m => m.id === id) ?? FLAT_MENUS[0];
			return ok({
				menu: { ...menu, permissions: menuPermissionRows(menu.id) },
				descendants: buildMenuDescendants(menu.id),
				user_types: USER_TYPES,
			});
		},
	},
	{ method: 'PUT', pattern: /^\/menus\/(?<id>\d+)\/permissions$/, handler: () => mutationOk({ updated: true }) },
	{
		method: 'GET',
		pattern: /^\/menus\/(?<id>\d+)$/,
		handler: (req) => {
			const id = Number(req.params.id);
			const menu = FLAT_MENUS.find(m => m.id === id) ?? FLAT_MENUS[0];
			return ok({ ...menu, children: FLAT_MENUS.filter(m => m.parent_id === id) });
		},
	},
	{ method: 'GET', pattern: /^\/menus$/, handler: () => ok({ menus: FLAT_MENUS }) },
	{
		method: 'POST',
		pattern: /^\/menus$/,
		handler: (req) => {
			const b = req.body || {};
			return ok({
				id: FLAT_MENUS.length + 100,
				name: b.name ?? 'New Menu',
				slug: b.slug ?? 'new-menu',
				parent_id: b.parent_id ?? null,
				sort_order: b.sort_order ?? 1,
				level: 1,
				badge: b.badge ?? null,
				status: b.status ?? 1,
				created_at: isoDateTime(TODAY),
				updated_at: isoDateTime(TODAY),
				parent_name: null,
			});
		},
	},
	{ method: 'PUT', pattern: /^\/menus\/(?<id>\d+)$/, handler: (req) => ok({ ...(FLAT_MENUS.find(m => m.id === Number(req.params.id)) ?? FLAT_MENUS[0]), ...req.body, updated_at: isoDateTime(TODAY) }) },
	{ method: 'DELETE', pattern: /^\/menus\/(?<id>\d+)$/, handler: () => mutationOk({ deleted: true }) },
	{ method: 'POST', pattern: /^\/menu-permissions\/assign$/, handler: () => mutationOk() },
	{ method: 'GET', pattern: /^\/menu-permissions$/, handler: () => ok(FLAT_MENUS.flatMap(m => menuPermissionRows(m.id))) },
	{ method: 'POST', pattern: /^\/menu-permissions\/bulk-update$/, handler: () => mutationOk() },

	/* ----------------------------------------------------------------
	 * USERS CRUD
	 * ---------------------------------------------------------------- */
	{
		method: 'GET',
		pattern: /^\/users\/(?<id>\d+)$/,
		handler: (req) => {
			const id = Number(req.params.id);
			const user = ALL_USERS.find(u => u.id === id) ?? ALL_USERS[0];
			return ok({ ...user, id });
		},
	},
	{
		method: 'GET',
		pattern: /^\/users$/,
		handler: (req) => {
			let rows = ALL_USERS;
			const { name, role, status, city_id, userTypeId } = req.query;
			if (name) rows = rows.filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(name.toLowerCase()));
			if (status !== undefined && status !== '') rows = rows.filter(u => String(u.status) === String(status));
			if (city_id) rows = rows.filter(u => u.cityId === Number(city_id));
			if (userTypeId) rows = rows.filter(u => u.userTypeId === Number(userTypeId));
			if (role) rows = rows.filter(u => (u.userTypeName || '').toLowerCase().includes(role.toLowerCase()));
			const { slice, page, limit, total } = paginate(rows, req.query);
			return {
				status_code: 200,
				statusCode: 200,
				status: 'Success',
				message: null,
				data: slice,
				pagination: { page, limit, totalItems: total, totalPages: Math.max(1, Math.ceil(total / limit)) },
			};
		},
	},
	{
		method: 'POST',
		pattern: /^\/users$/,
		handler: (req) => {
			const b = req.body || {};
			return {
				status_code: 201,
				statusCode: 201,
				status: 'Success',
				message: 'User created successfully',
				data: {
					id: ALL_USERS.length + 1,
					username: b.username ?? 'newuser',
					firstName: b.firstName ?? '',
					lastName: b.lastName ?? '',
					email: b.email ?? '',
				},
			};
		},
	},
	{ method: 'POST', pattern: /^\/users\/updatePassword$/, handler: () => ok({ updated: true }, { message: 'Password updated successfully' }) },
	{
		method: 'PATCH',
		pattern: /^\/users\/(?<id>\d+)$/,
		handler: (req) => {
			const id = Number(req.params.id);
			const user = ALL_USERS.find(u => u.id === id) ?? ALL_USERS[0];
			return ok({ ...user, ...req.body, id }, { message: 'User updated successfully' });
		},
	},
	{ method: 'DELETE', pattern: /^\/users\/(?<id>\d+)$/, handler: () => ok({ deleted: true }, { message: 'User deleted successfully' }) },

	/* ----------------------------------------------------------------
	 * PROCUREMENT — vendor invoice approvals
	 * ---------------------------------------------------------------- */
	{ method: 'GET', pattern: /^\/procurement\/me\/is-approver$/, handler: () => ok({ isApprover: true, isDirectApprover: true, proxy: { eligible: true } }) },
	{ method: 'POST', pattern: /^\/procurement\/approval\/proxy-mode$/, handler: (req) => ({ status: true, data: { enabled: !!req.body?.enabled } }) },
	{
		method: 'GET',
		pattern: /^\/procurement\/vendor-invoices\/dashboard$/,
		handler: (req) => {
			let rows = VENDOR_INVOICES;
			if (req.query.approvalStatus) rows = rows.filter(v => v.approval_status === req.query.approvalStatus);
			if (req.query.search) {
				const s = req.query.search.toLowerCase();
				rows = rows.filter(v => v.vendor_name.toLowerCase().includes(s) || v.client.toLowerCase().includes(s) || v.invoice_number.toLowerCase().includes(s));
			}
			const items = rows.map(inv => {
				const trail = buildApprovalTrail(inv);
				const risk = riskFor(inv);
				return {
					vendorInvoiceId: inv.vendorInvoiceId,
					leadId: inv.leadId,
					vendor_name: inv.vendor_name,
					invoice_amount: inv.invoice_amount,
					invoice_status: 'received',
					approval_status: inv.approval_status,
					approval_submitted_at: inv.approval_submitted_at,
					approved_at: inv.approved_at,
					rejected_at: inv.rejected_at,
					totalPaid: inv.totalPaid,
					approvals_total: trail.length,
					approvals_done: trail.filter(t => t.decision !== 'pending').length,
					risk_severity: risk.severity,
					risk_flag: risk.flag,
					client: inv.client,
					clientName: inv.client,
					leadName: `${inv.client} — ${inv.city}`,
				};
			});
			return procPaginated(items, req);
		},
	},
	{
		method: 'GET',
		pattern: /^\/procurement\/vendor-invoices\/pending-my-approval$/,
		handler: (req) =>
			procPaginated(
				buildPendingLeads(v => v.approval_status === 'pending_approval' || v.approval_status === 'rejected'),
				req,
				{ proxy: { eligible: true, active: false } }
			),
	},
	{
		method: 'GET',
		pattern: /^\/procurement\/vendor-invoices\/advance-requests$/,
		handler: (req) => procPaginated(buildPendingLeads(v => v.isAdvance), req),
	},
	{ method: 'GET', pattern: /^\/procurement\/vendor-invoices\/advance-payments$/, handler: (req) => procPaginated(buildPaymentRows(true), req) },
	{ method: 'GET', pattern: /^\/procurement\/vendor-invoices\/payments-pending$/, handler: (req) => procPaginated(buildPaymentRows(false), req) },
	{
		method: 'GET',
		pattern: /^\/procurement\/leads-tracker\/(?<leadId>\d+)\/vendor-invoices\/approval-status$/,
		handler: (req) => {
			const leadId = Number(req.params.leadId);
			const invs = VENDOR_INVOICES.filter(v => v.leadId === leadId);
			const data = invs.map(inv => {
				const trail = buildApprovalTrail(inv);
				const ctx = apContextFor(inv);
				return {
					id: inv.vendorInvoiceId,
					vendor_po_id: 8000 + (inv.vendorInvoiceId % 50),
					vendor_name: inv.vendor_name,
					invoice_amount: inv.invoice_amount,
					invoice_status: 'received',
					approval_status: inv.approval_status,
					payment_status: inv.totalPaid > 0 ? 'partially_paid' : 'unpaid',
					approval_submitted_at: inv.approval_submitted_at,
					approved_at: inv.approved_at,
					rejected_at: inv.rejected_at,
					invoice_number: inv.invoice_number,
					invoice_date: inv.invoice_date,
					invoice_file_url: 'https://example.com/invoice.pdf',
					invoice_remarks: null,
					contact_person: 'Accounts Desk',
					contact_number: '+91 80 4000 0000',
					notes: null,
					totalPaid: inv.totalPaid,
					balanceDue: Math.max(0, inv.invoice_amount - inv.totalPaid),
					daysSinceSubmitted: Math.round((TODAY.getTime() - new Date(inv.approval_submitted_at).getTime()) / 86400000),
					plannedNextStage: inv.approval_status === 'pending_approval' ? { stage: 'senior_approver', approvers: APPROVER_POOL.slice(0, 1) } : null,
					approvals: trail,
					ap_context: ctx,
					reopened: { isReopened: false, reason: null, rejectedByAdminId: null, rejectedByName: null },
					ledger:
						inv.totalPaid > 0
							? [
									{
										id: inv.vendorInvoiceId,
										amount: inv.totalPaid,
										paid_on: isoDate(dateAgo(2)),
										payment_mode: 'neft',
										reference_number: `UTR${inv.vendorInvoiceId}`,
										receipt_file_url: 'https://example.com/receipt.pdf',
										tax_receipt_url: null,
										notes: null,
										recorded_by: 'Finance Desk',
										approval_row_id: trail[trail.length - 1].approvalRowId,
										_source: inv.isAdvance ? 'advance' : 'receipt',
									},
								]
							: [],
				};
			});
			return {
				status: true,
				data,
				clientPos: [{ poNumber: `PO-${leadId}-01`, totalAmount: String(invs.reduce((s, v) => s + v.invoice_amount, 0)), s3Url: 'https://example.com/po.pdf', originalFilename: `PO-${leadId}.pdf` }],
			};
		},
	},
	{
		method: 'POST',
		pattern: /^\/procurement\/leads-tracker\/(?<leadId>\d+)\/vendors\/(?<vendorId>\d+)\/approval-decision$/,
		handler: (req) => ({
			status: true,
			data: {
				vendor: {
					id: Number(req.params.vendorId),
					approval_status: req.body?.decision === 'rejected' ? 'rejected' : 'approved',
					approved_at: req.body?.decision === 'rejected' ? null : isoDateTime(TODAY),
				},
			},
		}),
	},
	{
		method: 'POST',
		pattern: /^\/procurement\/vendor-invoices\/(?<id>\d+)\/receipt$/,
		handler: (req) => ({
			status: true,
			data: { id: Number(req.params.id), amount: 0, paidOn: isoDate(TODAY), fileUrl: 'https://example.com/receipt.pdf', paymentMode: 'neft', referenceNumber: null, notes: null },
		}),
	},

	/* ----------------------------------------------------------------
	 * HRMS
	 * ---------------------------------------------------------------- */
	// Employees
	{ method: 'GET', pattern: /^\/hrm\/employees\/(?<id>\d+)$/, handler: (req) => ok(EMPLOYEES.find(e => e.id === Number(req.params.id)) ?? EMPLOYEES[0]) },
	{
		method: 'GET',
		pattern: /^\/hrm\/employees$/,
		handler: (req) => {
			let rows = EMPLOYEES;
			if (req.query.q) {
				const s = req.query.q.toLowerCase();
				rows = rows.filter(e => e.full_name.toLowerCase().includes(s) || e.employee_code.toLowerCase().includes(s) || e.email.toLowerCase().includes(s));
			}
			if (req.query.department_id) rows = rows.filter(e => e.department_id === Number(req.query.department_id));
			if (req.query.designation_id) rows = rows.filter(e => e.designation_id === Number(req.query.designation_id));
			if (req.query.status) rows = rows.filter(e => e.status === req.query.status);
			if (req.query.employment_type) rows = rows.filter(e => e.employment_type === req.query.employment_type);
			if (req.query.is_active !== undefined) rows = rows.filter(e => String(e.is_active) === req.query.is_active);
			return hrmList(rows, req);
		},
	},
	{ method: 'POST', pattern: /^\/hrm\/employees$/, handler: (req) => ok({ id: EMPLOYEES.length + 1, ...req.body, full_name: `${req.body?.first_name ?? ''} ${req.body?.last_name ?? ''}`.trim() }) },
	{ method: 'PATCH', pattern: /^\/hrm\/employees\/(?<id>\d+)$/, handler: (req) => ok({ ...(EMPLOYEES.find(e => e.id === Number(req.params.id)) ?? EMPLOYEES[0]), ...req.body }) },
	{ method: 'DELETE', pattern: /^\/hrm\/employees\/(?<id>\d+)$/, handler: () => mutationOk({ deleted: true }) },

	// Departments
	{ method: 'GET', pattern: /^\/hrm\/departments\/(?<id>\d+)$/, handler: (req) => ok(DEPARTMENTS.find(d => d.id === Number(req.params.id)) ?? DEPARTMENTS[0]) },
	{ method: 'GET', pattern: /^\/hrm\/departments$/, handler: (req) => hrmList(DEPARTMENTS, req) },
	{ method: 'POST', pattern: /^\/hrm\/departments$/, handler: (req) => ok({ id: DEPARTMENTS.length + 1, ...req.body, is_active: req.body?.is_active ?? true }) },
	{ method: 'PATCH', pattern: /^\/hrm\/departments\/(?<id>\d+)$/, handler: (req) => ok({ ...(DEPARTMENTS.find(d => d.id === Number(req.params.id)) ?? DEPARTMENTS[0]), ...req.body }) },
	{ method: 'DELETE', pattern: /^\/hrm\/departments\/(?<id>\d+)$/, handler: () => mutationOk({ deleted: true }) },

	// Designations
	{ method: 'GET', pattern: /^\/hrm\/designations\/(?<id>\d+)$/, handler: (req) => ok(DESIGNATIONS.find(d => d.id === Number(req.params.id)) ?? DESIGNATIONS[0]) },
	{ method: 'GET', pattern: /^\/hrm\/designations$/, handler: (req) => hrmList(DESIGNATIONS, req) },
	{ method: 'POST', pattern: /^\/hrm\/designations$/, handler: (req) => ok({ id: DESIGNATIONS.length + 1, ...req.body, is_active: req.body?.is_active ?? true }) },
	{ method: 'PATCH', pattern: /^\/hrm\/designations\/(?<id>\d+)$/, handler: (req) => ok({ ...(DESIGNATIONS.find(d => d.id === Number(req.params.id)) ?? DESIGNATIONS[0]), ...req.body }) },
	{ method: 'DELETE', pattern: /^\/hrm\/designations\/(?<id>\d+)$/, handler: () => mutationOk({ deleted: true }) },

	// Salary structures
	{ method: 'GET', pattern: /^\/hrm\/salary-structures\/(?<id>\d+)$/, handler: (req) => ok(buildSalaryStructure(Number(req.params.id))) },
	{
		method: 'GET',
		pattern: /^\/hrm\/salary-structures$/,
		handler: (req) => {
			const empId = req.query.employee_id ? Number(req.query.employee_id) : null;
			const ids = empId ? [empId] : EMPLOYEES.slice(0, 20).map(e => e.id);
			return hrmList(ids.map(id => buildSalaryStructure(id)), req);
		},
	},
	{ method: 'POST', pattern: /^\/hrm\/salary-structures$/, handler: (req) => ok({ ...buildSalaryStructure(req.body?.employee_id ?? 1), ...req.body, id: 9000 }) },
	{ method: 'PATCH', pattern: /^\/hrm\/salary-structures\/(?<id>\d+)$/, handler: (req) => ok({ ...buildSalaryStructure(Number(req.params.id)), ...req.body }) },
	{ method: 'DELETE', pattern: /^\/hrm\/salary-structures\/(?<id>\d+)$/, handler: () => mutationOk({ deleted: true }) },

	// Tax declarations
	{ method: 'GET', pattern: /^\/hrm\/tax-declarations\/(?<id>\d+)$/, handler: (req) => ok(buildTaxDeclaration(Number(req.params.id))) },
	{ method: 'GET', pattern: /^\/hrm\/tax-declarations$/, handler: (req) => hrmList(EMPLOYEES.slice(0, 12).map((_e, i) => buildTaxDeclaration(i + 1)), req) },
	{ method: 'POST', pattern: /^\/hrm\/tax-declarations$/, handler: (req) => ok({ id: 5000, ...req.body }) },
	{ method: 'PATCH', pattern: /^\/hrm\/tax-declarations\/(?<id>\d+)$/, handler: (req) => ok({ ...buildTaxDeclaration(Number(req.params.id)), ...req.body }) },
	{ method: 'DELETE', pattern: /^\/hrm\/tax-declarations\/(?<id>\d+)$/, handler: () => mutationOk({ deleted: true }) },

	// Hierarchies
	{ method: 'GET', pattern: /^\/hrm\/hierarchies\/(?<id>\d+)$/, handler: (req) => ok(buildHierarchy(Number(req.params.id))) },
	{ method: 'GET', pattern: /^\/hrm\/hierarchies$/, handler: (req) => hrmList(list(16, (i) => buildHierarchy(i + 1), 'hrm-hier'), req) },
	{ method: 'POST', pattern: /^\/hrm\/hierarchies$/, handler: (req) => ok({ id: 6000, ...req.body }) },
	{ method: 'PATCH', pattern: /^\/hrm\/hierarchies\/(?<id>\d+)$/, handler: (req) => ok({ ...buildHierarchy(Number(req.params.id)), ...req.body }) },
	{ method: 'DELETE', pattern: /^\/hrm\/hierarchies\/(?<id>\d+)$/, handler: () => mutationOk({ deleted: true }) },

	// Holidays + choices (specific routes BEFORE the list)
	{ method: 'GET', pattern: /^\/hrm\/holidays\/choices\/my$/, handler: (req) => ok(buildMyHolidayChoices(Number(req.query.year || 2026))) },
	{ method: 'GET', pattern: /^\/hrm\/holidays\/choices\/team$/, handler: (req) => hrmList(buildTeamHolidayChoices(), req) },
	{ method: 'GET', pattern: /^\/hrm\/holidays\/choices\/summary$/, handler: () => ok(HOLIDAYS.filter(h => h.is_optional).map(h => ({ holiday_id: h.id, holiday_name: h.name, date: h.date, total_chosen: seeded(`hc-${h.id}`).int(2, 18) }))) },
	{ method: 'POST', pattern: /^\/hrm\/holidays\/choices$/, handler: (req) => ok({ id: 7000, holiday_id: req.body?.holiday_id, status: 'chosen', chosen_at: isoDateTime(TODAY) }) },
	{ method: 'DELETE', pattern: /^\/hrm\/holidays\/choices\/(?<id>\d+)$/, handler: () => mutationOk({ deleted: true }) },
	{ method: 'GET', pattern: /^\/hrm\/holidays$/, handler: (req) => hrmList(req.query.year ? HOLIDAYS.filter(h => String(h.year) === req.query.year) : HOLIDAYS, req) },
	{ method: 'POST', pattern: /^\/hrm\/holidays$/, handler: (req) => ok({ id: HOLIDAYS.length + 1, ...req.body }) },
	{ method: 'PATCH', pattern: /^\/hrm\/holidays\/(?<id>\d+)$/, handler: (req) => ok({ ...(HOLIDAYS.find(h => h.id === Number(req.params.id)) ?? HOLIDAYS[0]), ...req.body }) },
	{ method: 'DELETE', pattern: /^\/hrm\/holidays\/(?<id>\d+)$/, handler: () => mutationOk({ deleted: true }) },

	// Leave types
	{ method: 'GET', pattern: /^\/hrm\/leave-types\/(?<id>\d+)$/, handler: (req) => ok(LEAVE_TYPES.find(l => l.id === Number(req.params.id)) ?? LEAVE_TYPES[0]) },
	{
		method: 'GET',
		pattern: /^\/hrm\/leave-types$/,
		handler: (req) => {
			let rows = LEAVE_TYPES;
			if (req.query.is_active !== undefined) rows = rows.filter(l => String(l.is_active) === req.query.is_active);
			if (req.query.limit === 'all') return ok(rows, { success: 'true', pagination: pageMeta(rows.length, 1, rows.length) });
			return hrmList(rows, req);
		},
	},
	{ method: 'POST', pattern: /^\/hrm\/leave-types$/, handler: (req) => ok({ id: LEAVE_TYPES.length + 1, ...req.body, is_active: req.body?.is_active ?? true }) },
	{ method: 'PATCH', pattern: /^\/hrm\/leave-types\/(?<id>\d+)$/, handler: (req) => ok({ ...(LEAVE_TYPES.find(l => l.id === Number(req.params.id)) ?? LEAVE_TYPES[0]), ...req.body }) },

	// Leave balances
	{ method: 'GET', pattern: /^\/hrm\/leave-balances\/my$/, handler: () => ok({ employee_id: 1, financial_year: '2026-27', balances: leaveBalancesFor(1) }) },
	{ method: 'POST', pattern: /^\/hrm\/leave-balances\/(?<id>\d+)\/initialize$/, handler: (req) => ok({ employee_id: Number(req.params.id), financial_year: req.body?.financial_year ?? '2026-27', balances: leaveBalancesFor(Number(req.params.id)) }) },
	{ method: 'GET', pattern: /^\/hrm\/leave-balances\/(?<id>\d+)$/, handler: (req) => ok({ employee_id: Number(req.params.id), financial_year: '2026-27', balances: leaveBalancesFor(Number(req.params.id)) }) },

	// Leave applications (review/cancel/revert BEFORE generic :id)
	{ method: 'PATCH', pattern: /^\/hrm\/leave-applications\/(?<id>\d+)\/review$/, handler: (req) => ok({ id: Number(req.params.id), status: req.body?.status ?? 'approved' }) },
	{ method: 'PATCH', pattern: /^\/hrm\/leave-applications\/(?<id>\d+)\/cancel$/, handler: (req) => ok({ id: Number(req.params.id), status: 'cancelled' }) },
	{ method: 'PATCH', pattern: /^\/hrm\/leave-applications\/(?<id>\d+)\/revert-lop$/, handler: (req) => ok({ id: Number(req.params.id), auto_lop_converted: false }) },
	{ method: 'GET', pattern: /^\/hrm\/leave-applications\/(?<id>\d+)$/, handler: (req) => ok(LEAVE_APPLICATIONS.find(l => l.id === Number(req.params.id)) ?? LEAVE_APPLICATIONS[0]) },
	{
		method: 'GET',
		pattern: /^\/hrm\/leave-applications$/,
		handler: (req) => {
			let rows = LEAVE_APPLICATIONS;
			if (req.query.status) rows = rows.filter(l => l.status === req.query.status);
			if (req.query.employee_id) rows = rows.filter(l => l.employee_id === Number(req.query.employee_id));
			if (req.query.leave_type_id) rows = rows.filter(l => l.leave_type_id === Number(req.query.leave_type_id));
			if (req.query.limit === 'all') return ok(rows, { success: 'true', pagination: pageMeta(rows.length, 1, rows.length) });
			return hrmList(rows, req);
		},
	},
	{ method: 'POST', pattern: /^\/hrm\/leave-applications$/, handler: (req) => ok({ id: LEAVE_APPLICATIONS.length + 1, status: 'pending', ...req.body, total_days: 1 }) },

	// Comp-off
	{
		method: 'GET',
		pattern: /^\/hrm\/comp-off$/,
		handler: (req) => {
			let rows = COMP_OFFS;
			if (req.query.status) rows = rows.filter(c => c.status === req.query.status);
			if (req.query.employee_id) rows = rows.filter(c => c.employee_id === Number(req.query.employee_id));
			if (req.query.limit === 'all') return ok(rows, { success: 'true', pagination: pageMeta(rows.length, 1, rows.length) });
			return hrmList(rows, req);
		},
	},
	{ method: 'POST', pattern: /^\/hrm\/comp-off$/, handler: (req) => ok({ id: COMP_OFFS.length + 1, status: 'available', ...req.body }) },

	// Attendance (specific BEFORE generic :id)
	{
		method: 'GET',
		pattern: /^\/hrm\/attendance\/my$/,
		handler: (req) => {
			const month = Number(req.query.month || TODAY.getUTCMonth() + 1);
			const year = Number(req.query.year || TODAY.getUTCFullYear());
			const { records, summary } = attendanceForMonth(1, month, year);
			return ok({ data: records, summary, pagination: pageMeta(records.length, 1, records.length) });
		},
	},
	{
		method: 'GET',
		pattern: /^\/hrm\/attendance\/team$/,
		handler: (req) => {
			const month = Number(req.query.month || TODAY.getUTCMonth() + 1);
			const year = Number(req.query.year || TODAY.getUTCFullYear());
			const rows = EMPLOYEES.slice(0, 20).map(emp => {
				const { records, summary } = attendanceForMonth(emp.id, month, year);
				return {
					employee_id: emp.id,
					employee_code: emp.employee_code,
					employee_name: emp.full_name,
					records: records.map(r => ({ date: r.attendance_date, status: r.status, source: r.source })),
					summary,
				};
			});
			return ok({ data: rows, pagination: pageMeta(rows.length, 1, rows.length) });
		},
	},
	{
		method: 'GET',
		pattern: /^\/hrm\/attendance\/summary$/,
		handler: (req) => {
			const empId = Number(req.query.employee_id || 1);
			const month = Number(req.query.month || TODAY.getUTCMonth() + 1);
			const year = Number(req.query.year || TODAY.getUTCFullYear());
			return ok(attendanceForMonth(empId, month, year).summary);
		},
	},
	{ method: 'POST', pattern: /^\/hrm\/attendance\/mark$/, handler: (req) => mutationOk({ marked: req.body?.employee_ids?.length ?? 0 }) },
	{ method: 'PATCH', pattern: /^\/hrm\/attendance\/regularize\/(?<id>\d+)$/, handler: (req) => ok({ id: Number(req.params.id), review_status: req.body?.review_status ?? 'approved' }) },
	{ method: 'POST', pattern: /^\/hrm\/attendance\/regularize$/, handler: (req) => ok({ id: REGULARIZATIONS.length + 1, review_status: 'pending', ...req.body }) },
	{
		method: 'GET',
		pattern: /^\/hrm\/attendance\/regularize$/,
		handler: (req) => {
			let rows = REGULARIZATIONS;
			if (req.query.review_status) rows = rows.filter(r => r.review_status === req.query.review_status);
			if (req.query.limit === 'all') return ok(rows, { success: 'true', pagination: pageMeta(rows.length, 1, rows.length) });
			return hrmList(rows, req);
		},
	},
	{ method: 'GET', pattern: /^\/hrm\/attendance\/(?<id>\d+)$/, handler: (req) => ok({ id: Number(req.params.id), employee_id: 1, attendance_date: isoDate(dateAgo(1)), status: 'present', source: 'system', approval_status: 'approved', remarks: null }) },

	// HRM config
	{ method: 'GET', pattern: /^\/hrm\/config$/, handler: () => ok(HRM_CONFIG) },
	{ method: 'PATCH', pattern: /^\/hrm\/config\/(?<key>[^/]+)$/, handler: (req) => ok({ config_key: req.params.key, config_value: req.body?.value ?? '', description: '' }) },
];

/* ------------------------------------------------------------------ *
 * HRM record builders used by detail routes
 * ------------------------------------------------------------------ */

function buildSalaryStructure(employeeId: number) {
	const rng = seeded(`salary-${employeeId}`);
	const ctc = rng.int(4, 36) * 100000;
	const monthly = Math.round(ctc / 12);
	const basic = Math.round(monthly * 0.4);
	return {
		id: 4000 + employeeId,
		employee_id: employeeId,
		effective_from: isoDate(dateAgo(rng.int(60, 700))),
		effective_to: null,
		ctc_annual: ctc,
		basic_monthly: basic,
		hra_monthly: Math.round(basic * 0.5),
		da_monthly: 0,
		special_allowance_monthly: Math.round(monthly * 0.25),
		conveyance_monthly: 1600,
		medical_allowance_monthly: 1250,
		other_allowance_monthly: Math.round(monthly * 0.05),
		employer_pf_monthly: Math.round(basic * 0.12),
		employer_esi_monthly: 0,
		is_pf_applicable: true,
		pf_registration_status: 'registered',
		pf_wage_calculation: 'actual',
		is_esi_applicable: false,
		esic_registration_status: null,
		esic_ip_number: null,
		is_pt_applicable: true,
		is_tds_applicable: true,
		nps_enabled: false,
		pran_number: null,
		lwf_enabled: true,
		created_at: isoDateTime(dateAgo(rng.int(60, 700))),
		updated_at: isoDateTime(dateAgo(rng.int(0, 30))),
	};
}

function buildTaxDeclaration(id: number) {
	const rng = seeded(`tax-${id}`);
	const emp = EMPLOYEES[(id - 1) % EMPLOYEES.length];
	return {
		id: 5000 + id,
		employee_id: emp.id,
		employee_name: emp.full_name,
		financial_year: '2026-27',
		regime: rng.pick(['old', 'new']),
		status: rng.pick(['draft', 'submitted', 'approved']),
		total_declared: rng.int(50000, 250000),
		section_80c: rng.int(0, 150000),
		section_80d: rng.int(0, 50000),
		hra_claimed: rng.int(0, 200000),
		created_at: isoDateTime(dateAgo(60)),
		updated_at: isoDateTime(dateAgo(5)),
	};
}

function buildHierarchy(id: number) {
	const rng = seeded(`hier-${id}`);
	const emp = rng.pick(EMPLOYEES);
	const mgr = rng.pick(EMPLOYEES);
	const dept = rng.pick(DEPARTMENTS);
	return {
		id,
		employee_id: emp.id,
		manager_id: mgr.id,
		department_id: dept.id,
		hierarchy_type: 'reporting',
		is_primary: true,
		effective_from: isoDate(dateAgo(rng.int(100, 800))),
		effective_to: null,
		employee_name: emp.full_name,
		manager_name: mgr.full_name,
		department_name: dept.name,
		created_at: isoDateTime(dateAgo(rng.int(100, 800))),
		updated_at: isoDateTime(dateAgo(rng.int(0, 30))),
	};
}

function buildMyHolidayChoices(year: number) {
	const rng = seeded(`my-hc-${year}`);
	const optional = HOLIDAYS.filter(h => h.is_optional && h.year === year);
	const chosen = rng.picks(optional, Math.min(2, optional.length));
	return {
		year,
		quota: 2,
		chosen_count: chosen.length,
		remaining: Math.max(0, 2 - chosen.length),
		choices: chosen.map((h, i) => ({ id: 8000 + i, holiday_id: h.id, holiday_name: h.name, holiday_date: h.date, status: 'chosen', chosen_at: isoDateTime(dateAgo(20)) })),
	};
}

function buildTeamHolidayChoices() {
	return list(
		12,
		(i, rng) => {
			const emp = rng.pick(EMPLOYEES);
			const h = rng.pick(HOLIDAYS.filter(x => x.is_optional));
			return {
				id: 8100 + i,
				employee_id: emp.id,
				employee_name: emp.full_name,
				employee_code: emp.employee_code,
				holiday_id: h.id,
				holiday_name: h.name,
				holiday_date: h.date,
				status: rng.pick(['chosen', 'approved']),
			};
		},
		'team-hc'
	);
}
