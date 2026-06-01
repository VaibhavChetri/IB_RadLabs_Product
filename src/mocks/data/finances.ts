/**
 * Mock routes: FINANCES (LOCAL DEMO ONLY)
 * --------------------------------------------------------------------------
 * India-context fake data so the Finances pages render with NO backend.
 * Covers the Zoho Books surfaces (invoices / bills / customer-payments /
 * vendor-payments / expenses) and the Amazon Invoices surfaces.
 *
 * Path note: the shared API client base URL ends in `/v1/api`, so service
 * calls like `/billing/zoho/invoices` and `/amazon-invoices` arrive here as
 * `req.path` WITHOUT that prefix.
 *
 * Each Zoho list endpoint has its OWN top-level envelope (data + pagination +
 * facets + summary siblings, with `status: boolean` + `statusCode: number`),
 * so we return the exact literal object rather than the generic `ok(...)`.
 *
 * BYPASS WARNING: AmazonInvoiceUpload.tsx posts via a raw `fetch()` to
 * VITE_AMAZON_INVOICE_UPLOAD_URL (default http://127.0.0.1:8000/invoices/upload),
 * NOT through the shared axios apiService — so it cannot be intercepted here.
 */

import { MockRoute, MockRequest } from '../mockTypes';
import {
	seeded,
	paginate,
	CITIES,
	STATES,
	COMPANIES,
	VENDORS,
	UNITS,
	isoDate,
	isoDateTime,
	dateAgo,
	dateAhead,
	Rng,
} from '../mockHelpers';

/* ------------------------------------------------------------------ *
 * Shared reference vocab (kept consistent across the finance modules)
 * ------------------------------------------------------------------ */

const BRANCHES = CITIES.map(c => c.name);
const PLACES_OF_SUPPLY = [...STATES];
const BUSINESS_UNITS = ['Cold Chain', 'Quick Commerce', 'Last Mile', 'Warehousing', 'B2B Distribution'];
const FACILITY_TYPES = ['hub', 'mrf', 'customer'];
const EXPENSE_CATEGORIES = [
	'Fuel & Transport', 'Packaging Material', 'Electricity', 'Rent', 'Repairs & Maintenance',
	'Housekeeping', 'Security', 'Refrigerant / Gas', 'Office Supplies', 'Travel',
];
const NATURES_OF_EXPENSE = ['OPEX', 'CAPEX', 'Logistics', 'Utilities', 'Manpower', 'Consumables'];
const CLIENT_HINTS = ['Zomato', 'Swiggy', 'BigBasket', 'Licious', 'Zepto', 'Blinkit', 'Unmapped'];
const KAMS = [
	'Rahul Sharma', 'Priya Nair', 'Vikram Reddy', 'Sneha Iyer', 'Amit Gupta', 'Pooja Mehta',
];
const SUBMITTERS = [
	'Deepak Singh', 'Asha Rao', 'Karan Malhotra', 'Swati Desai', 'Nikhil Joshi', 'Meera Pillai',
];
const PAYMENT_MODES = ['Cash', 'NEFT', 'RTGS', 'Net Banking', 'Cheque', 'UPI', 'Credit Card'];
const BANK_ACCOUNTS = [
	'HDFC Bank - Current 50200', 'ICICI Bank - Current 0042', 'Axis Bank - Current 9913',
	'Razorpay Settlement', 'Kotak Bank - Escrow', 'Petty Cash',
];

const ORG_ID = '60018228627';

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */

const rng2 = (path: string, query: Record<string, string>): Rng =>
	seeded(path + '|' + (query.page || '1'));

/** Round to 2 dp the way Zoho amounts come through. */
const money = (n: number) => Math.round(n * 100) / 100;

/** GST-style sequential doc number, e.g. "INV-2026-000123". */
const docNumber = (prefix: string, rng: Rng, i: number) =>
	`${prefix}-2026-${String(rng.int(1, 9000) + i).padStart(6, '0')}`;

const gstin = (rng: Rng) => {
	const stateCode = String(rng.int(1, 37)).padStart(2, '0');
	const pan = `${rng.pick(['AAA', 'AAB', 'AAC', 'AAD'])}${rng.pick(['C', 'F', 'P'])}${rng.pick(['A', 'B', 'S', 'T'])}${rng.int(1000, 9999)}${rng.pick(['A', 'B', 'C', 'D'])}`;
	return `${stateCode}${pan}1Z${rng.int(1, 9)}`;
};

/* ================================================================== *
 * 1. ZOHO INVOICES   GET /billing/zoho/invoices
 * ================================================================== */

const INVOICE_STATUSES = ['paid', 'sent', 'overdue', 'draft', 'void'] as const;

function buildInvoices(req: MockRequest) {
	const rng = rng2(req.path, req.query);
	const n = rng.int(28, 38);
	const rows = Array.from({ length: n }, (_, i) => {
		const invDate = dateAgo(rng.int(1, 120));
		const dueDate = dateAhead(rng.int(-30, 30));
		const status = rng.pick(INVOICE_STATUSES);
		const total = money(rng.int(8_000, 950_000));
		const balance =
			status === 'paid' ? 0 :
			status === 'void' || status === 'draft' ? total :
			money(total * rng.float(0.2, 1));
		const city = rng.pick(CITIES);
		const dueDays = status === 'overdue' ? String(rng.int(1, 60)) : '0';
		const customer = rng.pick(COMPANIES);
		return {
			id: 100000 + i,
			organization_id: ORG_ID,
			zoho_invoice_id: String(rng.int(1, 9e8) + i),
			invoice_number: docNumber('INV', rng, i),
			customer_id: String(rng.int(1, 9e7)),
			customer_name: customer,
			location_id: city.id,
			zoho_location_id: String(20000 + city.id),
			branch_id: String(city.id),
			branch_name: city.name,
			status,
			type: 'invoice',
			project_name: '',
			email: `accounts@${customer.toLowerCase().replace(/[^a-z]/g, '')}.example.com`,
			invoice_date: isoDate(invDate),
			due_date: isoDate(dueDate),
			issued_date: isoDate(invDate),
			due_days: dueDays,
			total,
			balance,
			currency_code: 'INR',
			currency_symbol: '₹',
			reference_number: `PO-${rng.int(10000, 99999)}`,
			country: 'India',
			billing_city: city.name,
			billing_state: city.state,
			billing_zipcode: String(rng.int(100000, 899999)),
			cf_branch_of_invoice: city.name,
			cf_business_unit: rng.pick(BUSINESS_UNITS),
			cf_key_account_manager_owner_of_invoice: rng.pick(KAMS),
			cf_place_of_service_supply: city.state,
			payment_expected_date: isoDate(dueDate),
			created_time: isoDateTime(invDate),
			last_modified_time: isoDateTime(dateAgo(rng.int(0, 30))),
			custom_fields_json: null,
			created_at: isoDateTime(invDate),
			updated_at: isoDateTime(dateAgo(rng.int(0, 30))),
			key_account_manager: rng.pick(KAMS),
			place_of_service_supply: city.state,
		};
	});

	const { slice, page, limit, total } = paginate(rows, req.query);
	const totalInvoiceAmount = money(rows.reduce((s, r) => s + r.balance, 0));

	return {
		status: true,
		statusCode: 200,
		message: 'Invoices fetched successfully',
		data: slice,
		pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
		facets: {
			branches: BRANCHES,
			businessUnits: BUSINESS_UNITS,
			placesOfSupply: PLACES_OF_SUPPLY,
		},
		summary: { totalInvoiceAmount },
	};
}

/* ================================================================== *
 * 2. ZOHO BILLS   GET /billing/zoho/bills   (+ /:id/detail)
 * ================================================================== */

const BILL_STATUSES = ['paid', 'open', 'overdue', 'partially_paid', 'draft'] as const;

function buildBillRow(i: number, rng: Rng) {
	const billDate = dateAgo(rng.int(1, 120));
	const dueDate = dateAhead(rng.int(-25, 25));
	const status = rng.pick(BILL_STATUSES);
	const total = money(rng.int(3_000, 600_000));
	const balance =
		status === 'paid' ? 0 :
		status === 'partially_paid' ? money(total * rng.float(0.3, 0.7)) :
		total;
	const city = rng.pick(CITIES);
	return {
		id: 200000 + i,
		organization_id: ORG_ID,
		zoho_bill_id: String(rng.int(1, 9e8) + i),
		bill_number: docNumber('BILL', rng, i),
		vendor_name: rng.pick(VENDORS),
		vendor_id: String(rng.int(1, 9e7)),
		total,
		balance,
		status,
		date: isoDate(billDate),
		due_date: isoDate(dueDate),
		cf_city: city.name,
		cf_facility: `${city.name} ${rng.pick(['Hub', 'MRF', 'DC'])}`,
		facility_type: rng.pick(FACILITY_TYPES),
		cf_nature_of_expense: rng.pick(NATURES_OF_EXPENSE),
		cf_business_unit: rng.pick(BUSINESS_UNITS),
		cf_approver: rng.pick(KAMS),
		has_attachment: rng.bool(0.5) ? 1 : 0,
		reference_number: `GRN-${rng.int(10000, 99999)}`,
		currency_code: 'INR',
		currency_symbol: '₹',
		created_time: isoDateTime(billDate),
		last_modified_time: isoDateTime(dateAgo(rng.int(0, 30))),
		created_at: isoDateTime(billDate),
		updated_at: isoDateTime(dateAgo(rng.int(0, 30))),
	};
}

function buildBills(req: MockRequest) {
	const rng = rng2(req.path, req.query);
	const n = rng.int(30, 40);
	const rows = Array.from({ length: n }, (_, i) => buildBillRow(i, rng));

	const { slice, page, limit, total } = paginate(rows, req.query);
	const total_amount = money(rows.reduce((s, r) => s + r.total, 0));
	const total_outstanding = money(rows.reduce((s, r) => s + r.balance, 0));

	return {
		status: true,
		statusCode: 200,
		message: 'Bills fetched successfully',
		data: slice,
		pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
		summary: { total_bills: total, total_amount, total_outstanding },
		facets: {
			cities: BRANCHES,
			facilityTypes: FACILITY_TYPES,
			businessUnits: BUSINESS_UNITS,
			statuses: [...BILL_STATUSES],
			categories: EXPENSE_CATEGORIES,
			clientHints: CLIENT_HINTS,
			naturesOfExpense: NATURES_OF_EXPENSE,
		},
	};
}

function buildBillDetail(req: MockRequest) {
	const id = Number(req.params.id) || 200000;
	const rng = seeded('bill-detail-' + id);
	const bill = buildBillRow(id - 200000, rng);
	bill.id = id;

	const lineCount = rng.int(1, 4);
	const line_items = Array.from({ length: lineCount }, (_, i) => {
		const qty = rng.int(1, 50);
		const rate = money(rng.int(200, 8000));
		const taxAmount = money(qty * rate * 0.18);
		return {
			id: id * 10 + i,
			account_name: rng.pick(['Packaging A/c', 'Freight A/c', 'Power & Fuel A/c', 'Repairs A/c']),
			name: rng.pick(UNITS),
			expense_category: rng.pick(EXPENSE_CATEGORIES),
			quantity: qty,
			rate,
			tax_amount: taxAmount,
			item_total: money(qty * rate + taxAmount),
		};
	});

	const settledCount = bill.status === 'paid' || bill.status === 'partially_paid' ? rng.int(1, 2) : 0;
	const settled_by_payments = Array.from({ length: settledCount }, (_, i) => ({
		id: id * 100 + i,
		payment_number: `PYM-${rng.int(100000, 999999)}`,
		payment_date: isoDate(dateAgo(rng.int(1, 40))),
		payment_mode: rng.pick(PAYMENT_MODES),
		paid_through_account_name: rng.pick(BANK_ACCOUNTS),
		amount_applied: money(bill.total - bill.balance || bill.total),
		zoho_payment_id: String(rng.int(1, 9e8)),
	}));

	const attachments = rng.bool(0.5)
		? [{
			id: id,
			file_name: `${bill.bill_number}.pdf`,
			file_size: rng.int(40_000, 400_000),
			zoho_download_path: `/api/v1/bills/${bill.zoho_bill_id}/attachment`,
		}]
		: [];

	return {
		status: true,
		statusCode: 200,
		message: 'Bill detail fetched',
		data: { bill, line_items, attachments, settled_by_payments },
	};
}

/* ================================================================== *
 * 3. ZOHO CUSTOMER PAYMENTS   GET /billing/zoho/customer-payments
 * ================================================================== */

function buildCustomerPayments(req: MockRequest) {
	const rng = rng2(req.path, req.query);
	const n = rng.int(28, 38);
	const rows = Array.from({ length: n }, (_, i) => {
		const payDate = dateAgo(rng.int(1, 120));
		const amount = money(rng.int(5_000, 850_000));
		const mode = rng.pick(PAYMENT_MODES);
		const account = rng.pick(BANK_ACCOUNTS);
		// mismatch: mode is Cash but account is a bank/digital account
		const isCash = mode === 'Cash';
		const isBankAcct = account !== 'Petty Cash';
		const mismatch = isCash && isBankAcct ? 1 : 0;
		const city = rng.pick(CITIES);
		const customer = rng.pick(COMPANIES);
		return {
			id: 300000 + i,
			organization_id: ORG_ID,
			zoho_payment_id: String(rng.int(1, 9e8) + i),
			payment_number: docNumber('PAY', rng, i),
			payment_date: isoDate(payDate),
			created_time: isoDateTime(payDate),
			last_modified_time: isoDateTime(dateAgo(rng.int(0, 30))),
			amount,
			bcy_amount: amount,
			unused_amount: rng.bool(0.2) ? money(amount * rng.float(0.1, 0.4)) : 0,
			bcy_unused_amount: 0,
			bcy_refunded_amount: 0,
			tax_amount_withheld: 0,
			payment_mode: mode,
			payment_mode_formatted: mode,
			payment_type: 'invoice',
			payment_status: rng.bool(0.85) ? 'paid' : 'pending',
			settlement_status: 'settled',
			account_id: String(rng.int(1, 9e7)),
			account_name: account,
			tax_account_id: '',
			tax_account_name: '',
			zoho_customer_id: String(rng.int(1, 9e7)),
			customer_name: customer,
			zoho_branch_id: String(city.id),
			branch_name: city.name,
			zoho_location_id: String(20000 + city.id),
			location_id: city.id,
			sales_account_id: null,
			invoice_numbers: `INV-2026-${String(rng.int(1, 9000)).padStart(6, '0')}`,
			description: '',
			product_description: '',
			reference_number: `UTR${rng.int(100000000, 999999999)}`,
			last_four_digits: mode === 'Credit Card' ? String(rng.int(1000, 9999)) : '',
			gateway_transaction_id: account.includes('Razorpay') ? `pay_${rng.uuid()}` : '',
			payment_gateway: account.includes('Razorpay') ? 'Razorpay' : '',
			documents: '',
			custom_fields_json: '',
			created_at: isoDateTime(payDate),
			updated_at: isoDateTime(dateAgo(rng.int(0, 30))),
			mode_account_mismatch: mismatch,
		};
	});

	const { slice, page, limit, total } = paginate(rows, req.query);
	const total_amount = money(rows.reduce((s, r) => s + r.amount, 0));
	const mismatch_count = rows.filter(r => r.mode_account_mismatch).length;

	return {
		status: true,
		statusCode: 200,
		message: 'Customer payments fetched successfully',
		data: slice,
		pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
		summary: { total_payments: total, total_amount, mismatch_count },
	};
}

/* ================================================================== *
 * 4. ZOHO VENDOR PAYMENTS   GET /billing/zoho/vendor-payments (+ /:id/detail)
 * ================================================================== */

function buildVendorPaymentRow(i: number, rng: Rng) {
	const payDate = dateAgo(rng.int(1, 120));
	const amount = money(rng.int(4_000, 700_000));
	const mode = rng.pick(PAYMENT_MODES);
	const account = rng.pick(BANK_ACCOUNTS);
	const isCash = mode === 'Cash';
	const isBankAcct = account !== 'Petty Cash';
	const mismatch = isCash && isBankAcct ? 1 : 0;
	const billsSettled = rng.bool(0.25) ? 0 : rng.int(1, 4);
	return {
		id: 400000 + i,
		organization_id: ORG_ID,
		zoho_payment_id: String(rng.int(1, 9e8) + i),
		payment_number: docNumber('VPM', rng, i),
		vendor_name: rng.pick(VENDORS),
		vendor_id: String(rng.int(1, 9e7)),
		date: isoDate(payDate),
		payment_date: isoDate(payDate),
		amount,
		payment_mode: mode,
		paid_through: account,
		paid_through_account_id: String(rng.int(1, 9e7)),
		paid_through_account_name: account,
		reference_number: `UTR${rng.int(100000000, 999999999)}`,
		description: '',
		bills_settled_count: billsSettled,
		unused_amount: billsSettled === 0 ? amount : 0,
		currency_code: 'INR',
		currency_symbol: '₹',
		created_time: isoDateTime(payDate),
		last_modified_time: isoDateTime(dateAgo(rng.int(0, 30))),
		created_at: isoDateTime(payDate),
		updated_at: isoDateTime(dateAgo(rng.int(0, 30))),
		mode_account_mismatch: mismatch,
	};
}

function buildVendorPayments(req: MockRequest) {
	const rng = rng2(req.path, req.query);
	const n = rng.int(28, 38);
	const rows = Array.from({ length: n }, (_, i) => buildVendorPaymentRow(i, rng));

	const { slice, page, limit, total } = paginate(rows, req.query);
	const total_amount = money(rows.reduce((s, r) => s + r.amount, 0));
	const mismatch_count = rows.filter(r => r.mode_account_mismatch).length;
	const zero_bills_count = rows.filter(r => r.bills_settled_count === 0).length;

	return {
		status: true,
		statusCode: 200,
		message: 'Vendor payments fetched successfully',
		data: slice,
		pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
		summary: { total_payments: total, total_amount, mismatch_count, zero_bills_count },
		facets: {
			paymentModes: PAYMENT_MODES,
			paidThroughs: BANK_ACCOUNTS,
		},
	};
}

function buildVendorPaymentDetail(req: MockRequest) {
	const id = Number(req.params.id) || 400000;
	const rng = seeded('vp-detail-' + id);
	const payment = buildVendorPaymentRow(id - 400000, rng);
	payment.id = id;

	const settledCount = payment.bills_settled_count;
	const settled_bills = Array.from({ length: settledCount }, (_, i) => {
		const total = money(rng.int(5_000, 300_000));
		return {
			junction_id: id * 100 + i,
			bill_number: docNumber('BILL', rng, i),
			date: isoDate(dateAgo(rng.int(10, 90))),
			vendor_name: payment.vendor_name,
			total,
			amount_applied: money(Math.min(total, payment.amount)),
			zoho_bill_id: String(rng.int(1, 9e8)),
		};
	});

	const attachments = rng.bool(0.4)
		? [{
			id,
			file_name: `${payment.payment_number}.pdf`,
			file_size: rng.int(30_000, 250_000),
			zoho_download_path: `/api/v1/vendorpayments/${payment.zoho_payment_id}/attachment`,
		}]
		: [];

	return {
		status: true,
		statusCode: 200,
		message: 'Vendor payment detail fetched',
		data: { payment, settled_bills, attachments },
	};
}

/* ================================================================== *
 * 5. ZOHO EXPENSES   GET /billing/zoho/expenses   (+ /:id/detail)
 * ================================================================== */

const EXPENSE_STATUSES = ['paid', 'unpaid', 'reimbursed', 'pending', 'rejected'] as const;

function buildExpenseRow(i: number, rng: Rng) {
	const expDate = dateAgo(rng.int(1, 120));
	const total = money(rng.int(500, 180_000));
	const city = rng.pick(CITIES);
	const hasVendor = rng.bool(0.7);
	const ft = rng.pick(FACILITY_TYPES);
	return {
		id: 500000 + i,
		organization_id: ORG_ID,
		zoho_expense_id: String(rng.int(1, 9e8) + i),
		date: isoDate(expDate),
		total,
		expense_account_name: rng.pick(['Fuel A/c', 'Packaging A/c', 'Electricity A/c', 'Travel A/c', 'Repairs A/c']),
		vendor_name: hasVendor ? rng.pick(VENDORS) : '',
		customer_name: hasVendor ? '' : rng.pick(COMPANIES),
		status: rng.pick(EXPENSE_STATUSES),
		payment_mode: rng.pick(PAYMENT_MODES),
		expense_category: rng.pick(EXPENSE_CATEGORIES),
		cf_city: city.name,
		derived_city: city.name,
		cf_facility: `${city.name} ${rng.pick(['Hub', 'MRF', 'DC'])}`,
		facility_type: ft,
		derived_facility_type: ft,
		cf_business_unit: rng.pick(BUSINESS_UNITS),
		client_hint: rng.pick(CLIENT_HINTS),
		has_attachment: rng.bool(0.5) ? 1 : 0,
		submitter: rng.pick(SUBMITTERS),
		cf_submitter: rng.pick(SUBMITTERS),
		reference_number: `EXP-${rng.int(10000, 99999)}`,
		description: rng.pick(['Monthly fuel reimbursement', 'Site consumables', 'Local conveyance', 'Diesel for DG set', 'Pantry & housekeeping']),
		paid_through_account_name: rng.pick(BANK_ACCOUNTS),
		currency_code: 'INR',
		currency_symbol: '₹',
		created_time: isoDateTime(expDate),
		last_modified_time: isoDateTime(dateAgo(rng.int(0, 30))),
		created_at: isoDateTime(expDate),
		updated_at: isoDateTime(dateAgo(rng.int(0, 30))),
	};
}

function buildExpenses(req: MockRequest) {
	const rng = rng2(req.path, req.query);
	const n = rng.int(30, 40);
	const rows = Array.from({ length: n }, (_, i) => buildExpenseRow(i, rng));

	const { slice, page, limit, total } = paginate(rows, req.query);
	const total_amount = money(rows.reduce((s, r) => s + r.total, 0));

	return {
		status: true,
		statusCode: 200,
		message: 'Expenses fetched successfully',
		data: slice,
		pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
		summary: { total_expenses: total, total_amount },
		facets: {
			cities: BRANCHES,
			facilityTypes: FACILITY_TYPES,
			businessUnits: BUSINESS_UNITS,
			categories: EXPENSE_CATEGORIES,
			clientHints: CLIENT_HINTS,
			statuses: [...EXPENSE_STATUSES],
		},
	};
}

function buildExpenseDetail(req: MockRequest) {
	const id = Number(req.params.id) || 500000;
	const rng = seeded('exp-detail-' + id);
	const expense = buildExpenseRow(id - 500000, rng);
	expense.id = id;

	const lineCount = rng.int(1, 3);
	const line_items = Array.from({ length: lineCount }, (_, i) => {
		const amount = money(rng.int(300, 60_000));
		return {
			id: id * 10 + i,
			account_name: expense.expense_account_name,
			description: rng.pick(['Diesel', 'Stretch wrap', 'DG maintenance', 'Pantry supplies', 'Toll & parking']),
			tax_amount: money(amount * 0.18),
			amount,
		};
	});

	const attachments = expense.has_attachment
		? [{
			id,
			file_name: `${expense.reference_number}.pdf`,
			file_size: rng.int(20_000, 200_000),
			zoho_download_path: `/api/v1/expenses/${expense.zoho_expense_id}/attachment`,
		}]
		: [];

	return {
		status: true,
		statusCode: 200,
		message: 'Expense detail fetched',
		data: { expense, line_items, attachments },
	};
}

/* ================================================================== *
 * 6. AMAZON INVOICES   GET /amazon-invoices  (+ /filters, /:invoiceNumber)
 * ================================================================== */

const AMAZON_SELLERS = [
	{ name: 'Cloudtail India Private Limited', city: 'Bengaluru', state: 'Karnataka' },
	{ name: 'Appario Retail Private Ltd', city: 'Mumbai', state: 'Maharashtra' },
	{ name: 'Western Retail Limited', city: 'Gurugram', state: 'Haryana' },
	{ name: 'RK World Infocom Pvt Ltd', city: 'Ahmedabad', state: 'Gujarat' },
	{ name: 'Darshita Southern India Retail', city: 'Chennai', state: 'Tamil Nadu' },
];
const AMAZON_DOC_TYPES = ['Tax Invoice', 'Credit Note', 'Bill of Supply'];
const AMAZON_PRODUCTS = [
	{ d: 'Insulated Thermocol Box 20L (Pack of 5)', hsn: '39231090' },
	{ d: 'Gel Ice Pack 500g (Pack of 10)', hsn: '38249900' },
	{ d: 'Corrugated Shipping Carton Medium', hsn: '48191010' },
	{ d: 'Digital Temperature Data Logger', hsn: '90251910' },
	{ d: 'Stretch Pallet Wrap Film 500mm', hsn: '39202020' },
	{ d: 'Reusable Cold Chain Crate 25L', hsn: '39231090' },
	{ d: 'Dry Ice Cooler EPS 40L', hsn: '39261000' },
	{ d: 'Vacuum Seal Storage Bags (50 pc)', hsn: '39232100' },
];

/** Deterministic per-seller GSTIN so filters & rows agree. */
function sellerGstinFor(name: string): string {
	const r = seeded('amazon-seller-' + name);
	return gstin(r);
}

function buildAmazonInvoiceRow(i: number, rng: Rng) {
	const seller = rng.pick(AMAZON_SELLERS);
	const invDate = dateAgo(rng.int(1, 200));
	const itemCount = rng.int(1, 5);
	const grand = money(rng.int(1_200, 240_000));
	return {
		id: 600000 + i,
		invoice_number: `AMZ-${invDate.getUTCFullYear()}-${String(rng.int(1, 999999) + i).padStart(7, '0')}`,
		invoice_date: isoDate(invDate),
		sold_by: seller.name,
		grand_total: grand,
		item_count: itemCount,
		document_type: rng.pick(AMAZON_DOC_TYPES),
	};
}

function buildAmazonList(req: MockRequest) {
	const rng = rng2(req.path, req.query);
	const n = rng.int(28, 40);
	const rows = Array.from({ length: n }, (_, i) => buildAmazonInvoiceRow(i, rng));

	const { slice, page, limit, total } = paginate(rows, req.query);
	const totalPages = Math.max(1, Math.ceil(total / limit));

	return {
		status: true,
		statusCode: 200,
		message: 'Amazon invoices fetched',
		data: slice,
		pagination: {
			page,
			limit,
			total,
			total_pages: totalPages,
			has_next_page: page < totalPages,
			has_prev_page: page > 1,
		},
	};
}

function buildAmazonFilters() {
	const rng = seeded('amazon-filters');
	return {
		status: true,
		statusCode: 200,
		data: {
			document_types: AMAZON_DOC_TYPES,
			sellers: AMAZON_SELLERS.map(s => ({ gstin: sellerGstinFor(s.name), name: s.name })),
			popular_asins: Array.from({ length: 6 }, () => ({
				asin: `B0${rng.pick(['7', '8', '9', 'A', 'B'])}${rng.uuid().slice(0, 7).toUpperCase()}`,
				usage_count: rng.int(3, 120),
			})),
			range: {
				min_invoice_date: isoDate(dateAgo(200)),
				max_invoice_date: isoDate(dateAgo(1)),
				min_grand_total: 1200,
				max_grand_total: 240000,
			},
		},
	};
}

function buildAmazonDetail(req: MockRequest) {
	const invoiceNumber = decodeURIComponent(req.params.invoiceNumber || 'AMZ-2026-0000001');
	const rng = seeded('amazon-detail-' + invoiceNumber);
	const seller = rng.pick(AMAZON_SELLERS);
	const buyerCity = rng.pick(CITIES);
	const invDate = dateAgo(rng.int(1, 200));
	const orderDate = dateAgo(rng.int(200, 210));

	const lineCount = rng.int(1, 5);
	let subtotal = 0;
	const line_items = Array.from({ length: lineCount }, (_, i) => {
		const product = rng.pick(AMAZON_PRODUCTS);
		const qty = rng.int(1, 8);
		const unit = money(rng.int(150, 9000));
		const net = money(qty * unit);
		const taxRate = rng.pick([5, 12, 18]);
		const taxAmount = money(net * (taxRate / 100));
		subtotal += net;
		return {
			id: 700000 + i,
			invoice_number: invoiceNumber,
			description: product.d,
			asin: `B0${rng.pick(['7', '8', '9'])}${rng.uuid().slice(0, 7).toUpperCase()}`,
			hsn_code: product.hsn,
			seller_sku: `SKU-${rng.int(10000, 99999)}`,
			quantity: qty,
			unit_price: unit,
			discount: rng.bool(0.3) ? money(net * rng.float(0.02, 0.1)) : 0,
			net_amount: net,
			tax_rate: taxRate,
			tax_amount: taxAmount,
			total_amount: money(net + taxAmount),
		};
	});

	subtotal = money(subtotal);
	const sameState = seller.state === buyerCity.state;
	const totalTax = money(line_items.reduce((s, li) => s + li.tax_amount, 0));
	const shipping = rng.bool(0.4) ? money(rng.int(0, 500)) : 0;
	const discount = money(line_items.reduce((s, li) => s + (li.discount || 0), 0));
	const grand = money(subtotal + totalTax + shipping - discount);

	const invoice = {
		id: rng.int(600000, 640000),
		invoice_number: invoiceNumber,
		invoice_date: isoDate(invDate),
		order_id: `${rng.int(100, 999)}-${rng.int(1000000, 9999999)}-${rng.int(1000000, 9999999)}`,
		order_date: isoDate(orderDate),
		document_type: rng.pick(AMAZON_DOC_TYPES),
		sold_by: seller.name,
		sold_by_gstin: sellerGstinFor(seller.name),
		ship_from_address: `${seller.name}, Plot ${rng.int(1, 99)}, Industrial Area, ${seller.city}, ${seller.state}`,
		pan_number: sellerGstinFor(seller.name).slice(2, 12),
		seller_name: seller.name,
		seller_gstin: sellerGstinFor(seller.name),
		seller_pan: sellerGstinFor(seller.name).slice(2, 12),
		billing_name: 'Radlabs Logistics Pvt Ltd',
		billing_address: `${buyerCity.name} Hub, Warehouse Lane, ${buyerCity.name}, ${buyerCity.state}`,
		billing_gstin: gstin(seeded('radlabs-' + buyerCity.name)),
		shipping_name: `Radlabs ${buyerCity.name} DC`,
		shipping_address: `${buyerCity.name} Distribution Centre, ${buyerCity.state}`,
		subtotal,
		grand_total: grand,
		shipping_charges: shipping,
		total_discount: discount,
		igst_rate: sameState ? null : 18,
		igst_amount: sameState ? null : totalTax,
		cgst_rate: sameState ? 9 : null,
		cgst_amount: sameState ? money(totalTax / 2) : null,
		sgst_rate: sameState ? 9 : null,
		sgst_amount: sameState ? money(totalTax / 2) : null,
		irn: rng.bool(0.7) ? rng.uuid() + rng.uuid() : null,
		payment_method: rng.pick(['Prepaid', 'Credit Card', 'Net Banking', 'Amazon Pay']),
		extraction_confidence: rng.float(0.82, 0.99),
		parsing_warnings: [],
	};

	return {
		status: true,
		statusCode: 200,
		data: { invoice, line_items },
	};
}

/* ================================================================== *
 * Generic import / mutation responses
 * ================================================================== */

// invoices / bills / vendor-payments / expenses import → { status_code, status, message, importedCount }
const importStdResponse = (req: MockRequest) => {
	const rng = seeded('import' + req.path + Date.now());
	return {
		status_code: 200,
		statusCode: 200,
		status: 'Success',
		message: 'Import completed',
		importedCount: rng.int(0, 25),
	};
};

// customer-payments import → { status, statusCode, message, data:{ imported, updated } }
const importPaymentsResponse = (req: MockRequest) => {
	const rng = seeded('import-pay' + req.path + Date.now());
	return {
		status: true,
		statusCode: 200,
		message: 'Customer payments import completed',
		data: { imported: rng.int(0, 20), updated: rng.int(0, 10) },
	};
};

/* ================================================================== *
 * Route registry — DETAIL / sub-resources BEFORE list patterns.
 * ================================================================== */

export const routes: MockRoute[] = [
	/* ---- imports (POST) ---- */
	{ method: 'POST', pattern: /^\/billing\/zoho\/invoices\/import$/, handler: importStdResponse },
	{ method: 'POST', pattern: /^\/billing\/zoho\/bills\/import$/, handler: importStdResponse },
	{ method: 'POST', pattern: /^\/billing\/zoho\/customer-payments\/import$/, handler: importPaymentsResponse },
	{ method: 'POST', pattern: /^\/billing\/zoho\/vendor-payments\/import$/, handler: importStdResponse },
	{ method: 'POST', pattern: /^\/billing\/zoho\/expenses\/import$/, handler: importStdResponse },

	/* ---- detail routes (GET) ---- */
	{ method: 'GET', pattern: /^\/billing\/zoho\/bills\/(?<id>\d+)\/detail$/, handler: buildBillDetail },
	{ method: 'GET', pattern: /^\/billing\/zoho\/vendor-payments\/(?<id>\d+)\/detail$/, handler: buildVendorPaymentDetail },
	{ method: 'GET', pattern: /^\/billing\/zoho\/expenses\/(?<id>\d+)\/detail$/, handler: buildExpenseDetail },

	/* ---- list routes (GET) ---- */
	{ method: 'GET', pattern: /^\/billing\/zoho\/invoices$/, handler: buildInvoices },
	{ method: 'GET', pattern: /^\/billing\/zoho\/bills$/, handler: buildBills },
	{ method: 'GET', pattern: /^\/billing\/zoho\/customer-payments$/, handler: buildCustomerPayments },
	{ method: 'GET', pattern: /^\/billing\/zoho\/vendor-payments$/, handler: buildVendorPayments },
	{ method: 'GET', pattern: /^\/billing\/zoho\/expenses$/, handler: buildExpenses },

	/* ---- Amazon invoices: filters & detail BEFORE list ---- */
	{ method: 'GET', pattern: /^\/amazon-invoices\/filters$/, handler: buildAmazonFilters },
	{ method: 'GET', pattern: /^\/amazon-invoices\/(?<invoiceNumber>.+)$/, handler: buildAmazonDetail },
	{ method: 'GET', pattern: /^\/amazon-invoices$/, handler: buildAmazonList },

	/* ---- generic mutation fallbacks for the finance surfaces ---- */
	{
		method: 'POST',
		pattern: /^\/billing\/zoho\//,
		handler: () => ({ status: true, statusCode: 200, status_code: 200, message: 'OK', data: { success: true } }),
	},
	{
		method: 'PUT',
		pattern: /^\/billing\/zoho\//,
		handler: () => ({ status: true, statusCode: 200, status_code: 200, message: 'Updated', data: { success: true } }),
	},
	{
		method: 'PATCH',
		pattern: /^\/billing\/zoho\//,
		handler: () => ({ status: true, statusCode: 200, status_code: 200, message: 'Patched', data: { success: true } }),
	},
	{
		method: 'DELETE',
		pattern: /^\/billing\/zoho\//,
		handler: () => ({ status: true, statusCode: 200, status_code: 200, message: 'Deleted', data: { success: true } }),
	},
];
