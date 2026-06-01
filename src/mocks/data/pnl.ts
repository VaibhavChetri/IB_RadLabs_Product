/**
 * Mock routes: P&L (LOCAL DEMO ONLY)
 * --------------------------------------------------------------------------
 * Backs every endpoint called by `src/services/pAndLApi.ts` so the P&L
 * pages (PLSummary tabs: EBITDA / Expenditure / Unit Economics / Client-wise
 * P&L / Escalations) and the Revenue monthly-estimate add/edit screens render
 * fully with NO backend.
 *
 * Note on the mock adapter: `req.path` is the path AFTER the API base URL
 * (e.g. '/review/getRevenue'), with the query string stripped — query params
 * live on `req.query`. All values are seeded off `req.path` (+ a few request
 * params) so the demo is stable across reloads.
 *
 * Realism: Indian B2B cold-chain / cloud-kitchen P&L. Weekly projected-vs-
 * actual revenue & costs in ₹, client breakdowns over COMPANIES, city/facility
 * context over CITIES. Many numeric fields are STRINGS on the wire (matching
 * the pAndLApi interfaces) — e.g. projected_value:"1234.50",
 * week1_delta_with_percentage:"+5.20(4%)".
 */

import { MockRoute, MockRequest } from '../mockTypes';
import { seeded, list, CITIES, COMPANIES, type Rng } from '../mockHelpers';

/* ------------------------------------------------------------------ *
 * Small local helpers
 * ------------------------------------------------------------------ */

const MONTH_NAMES = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December',
] as const;

/** Two-decimal string, the wire format pAndLApi expects for money fields. */
const money = (n: number): string => n.toFixed(2);

/** "1234.50(12%)" style delta string used by the expenditure/revenue tables. */
const deltaPct = (delta: number, base: number): string => {
	const pct = base === 0 ? 0 : Math.round((delta / base) * 100);
	const sign = delta > 0 ? '+' : '';
	return `${sign}${delta.toFixed(2)}(${pct}%)`;
};

/** Resolve the month NAME + numeric month/year from a request's date range. */
function monthFromQuery(q: Record<string, string>): { name: string; month: number; year: number } {
	const raw = q.start_date || q.startDate || q.date_year || '';
	const m = /^(\d{4})-(\d{2})/.exec(raw);
	if (m) {
		const year = parseInt(m[1], 10);
		const month = parseInt(m[2], 10);
		return { name: MONTH_NAMES[(month - 1 + 12) % 12], month, year };
	}
	// Demo "today" is 2026-06-01 → June 2026.
	return { name: 'June', month: 6, year: 2026 };
}

function cityFromQuery(q: Record<string, string>) {
	const id = parseInt(q.city_id || q.cityId || '1', 10);
	return CITIES.find(c => c.id === id) || CITIES[0];
}

function facilityIdFromQuery(q: Record<string, string>): number {
	return parseInt(q.facility_id || q.facilityId || '1', 10) || 1;
}

/** Stable facility name for a (city, facilityId) pair. */
function facilityName(city: { name: string }, facilityId: number): string {
	const kinds = ['Cold Hub', 'Cloud Kitchen', 'Frozen DC', 'Chiller Facility', 'Central Kitchen'];
	const kind = kinds[facilityId % kinds.length];
	return `${city.name} ${kind} ${String.fromCharCode(65 + (facilityId % 4))}`;
}

const okEnvelope = <T,>(extra: Record<string, unknown>): T =>
	({ status_code: 200, status: 'Success', message: null, ...extra }) as T;

const paginationBlock = (total: number, q: Record<string, string>) => {
	const page = Math.max(1, parseInt(q.page || '1', 10) || 1);
	const limit = Math.max(1, parseInt(q.limit || '20', 10) || 20);
	return { page, limit, totalItems: total, totalPages: Math.max(1, Math.ceil(total / limit)) };
};

/* ------------------------------------------------------------------ *
 * Cost / costing reference data — shared across endpoints
 * ------------------------------------------------------------------ */

// Variable (direct) cost heads — these drive contribution.
const VARIABLE_COST_TYPES = [
	'Manpower', 'Electricity', 'Water', 'Consumables', 'Chemicals',
	'Rental Genset', 'Diesel', 'Pest control', 'Rent of Plates and Crockery',
	'Logistics', 'On Site Manpower',
];

// Indirect (fixed/overhead) cost heads — sit below contribution, above EBITDA.
const INDIRECT_COST_TYPES = [
	'Salaries', 'Rent Of Washing Facility', 'Printing & Stationary',
	'Repairs & Maintenance', 'Misc expenses', 'Due and Subcription',
	'Staff Welfare', 'Fuel and Travelling', 'Plant & Machinery taken on Rent',
];

// Revenue cost categories (cost-category master). id is stable per index.
const COST_CATEGORIES = ['Revenue', 'Variable Cost', 'Indirect Expense', 'Manpower', 'Utilities'];

// Map a costing type name → stable id.
const ALL_COSTING_TYPES = ['Revenue', ...VARIABLE_COST_TYPES, ...INDIRECT_COST_TYPES];
const costingTypeId = (name: string): number => {
	const idx = ALL_COSTING_TYPES.indexOf(name);
	return (idx >= 0 ? idx : ALL_COSTING_TYPES.length) + 1;
};
const categoryForCostingType = (name: string): string => {
	if (name === 'Revenue') return 'Revenue';
	if (INDIRECT_COST_TYPES.includes(name)) return 'Indirect Expense';
	return 'Variable Cost';
};

/* ------------------------------------------------------------------ *
 * Weekly value generator
 * ------------------------------------------------------------------ */

interface WeeklyRow {
	projected: number;
	w1: number;
	w2: number;
	w3: number;
	w4: number;
	totalActual: number;
}

/** Generate a believable projected + 4-week-actual spend row. */
function weeklyRow(rng: Rng, projectedMin: number, projectedMax: number): WeeklyRow {
	const projected = rng.int(projectedMin, projectedMax);
	const perWeek = projected / 4;
	// Each week wobbles around the per-week projection.
	const w1 = +(perWeek * rng.float(0.8, 1.15)).toFixed(2);
	const w2 = +(perWeek * rng.float(0.85, 1.2)).toFixed(2);
	const w3 = +(perWeek * rng.float(0.82, 1.18)).toFixed(2);
	const w4 = +(perWeek * rng.float(0.78, 1.12)).toFixed(2);
	const totalActual = +(w1 + w2 + w3 + w4).toFixed(2);
	return { projected, w1, w2, w3, w4, totalActual };
}

/* ------------------------------------------------------------------ *
 * getRevenue — nested City → Facility → MonthYear → records
 * ------------------------------------------------------------------ */

interface RevenueRecordShape {
	id: number;
	costingTypeName: string;
	costingTypeId: number;
	reviewCategoryTypeId: number;
	projected_value: string;
	week1_actual_value: string;
	week1_delta_with_percentage: string;
	week2_actual_value: string;
	week2_delta_with_percentage: string;
	week3_actual_value: string;
	week3_delta_with_percentage: string;
	week4_actual_value: string;
	week4_delta_with_percentage: string;
	total_actual_value: string;
	total_delta_with_percentage: string;
	date_year: string;
	created_at: string;
	cityId: number;
	cityName: string;
	facilityName: string;
	facilityId: number;
	billing_type_id: number;
}

function buildRevenueRecords(
	rng: Rng,
	city: { id: number; name: string },
	facilityId: number,
	fName: string,
	dateYear: string,
): RevenueRecordShape[] {
	const heads = ['Revenue', ...VARIABLE_COST_TYPES, ...INDIRECT_COST_TYPES];
	return heads.map((name, i) => {
		const isRevenue = name === 'Revenue';
		const row = isRevenue
			? weeklyRow(rng, 1_800_000, 4_200_000)
			: weeklyRow(rng, 40_000, 650_000);
		const perWeekProj = row.projected / 4;
		const d1 = row.w1 - perWeekProj;
		const d2 = row.w2 - perWeekProj;
		const d3 = row.w3 - perWeekProj;
		const d4 = row.w4 - perWeekProj;
		const dTotal = row.totalActual - row.projected;
		return {
			id: city.id * 100000 + facilityId * 100 + i,
			costingTypeName: name,
			costingTypeId: costingTypeId(name),
			reviewCategoryTypeId: COST_CATEGORIES.indexOf(categoryForCostingType(name)) + 1,
			projected_value: money(row.projected),
			week1_actual_value: money(row.w1),
			week1_delta_with_percentage: deltaPct(d1, perWeekProj),
			week2_actual_value: money(row.w2),
			week2_delta_with_percentage: deltaPct(d2, perWeekProj),
			week3_actual_value: money(row.w3),
			week3_delta_with_percentage: deltaPct(d3, perWeekProj),
			week4_actual_value: money(row.w4),
			week4_delta_with_percentage: deltaPct(d4, perWeekProj),
			total_actual_value: money(row.totalActual),
			total_delta_with_percentage: deltaPct(dTotal, row.projected),
			date_year: dateYear,
			created_at: `${dateYear}T08:30:00Z`,
			cityId: city.id,
			cityName: city.name,
			facilityName: fName,
			facilityId,
			billing_type_id: 1,
		};
	});
}

function buildOnSiteManPower(
	rng: Rng,
	facilityId: number,
	fName: string,
	dateYear: string,
) {
	const clients = rng.picks(COMPANIES, 4);
	return clients.map((clientName, i) => {
		const w = weeklyRow(rng, 30_000, 140_000);
		return {
			id: facilityId * 1000 + i + 1,
			client_id: 1000 + i,
			client_name: clientName,
			costing_type_id: costingTypeId('On Site Manpower'),
			est: money(w.projected),
			costing_type_name: 'On Site Manpower',
			facility_id: facilityId,
			facility_name: fName,
			week1: money(w.w1),
			week2: money(w.w2),
			week3: money(w.w3),
			week4: money(w.w4),
			date_year: dateYear,
		};
	});
}

function handleGetRevenue(req: MockRequest) {
	const q = req.query;
	const city = cityFromQuery(q);
	const facilityId = facilityIdFromQuery(q);
	const fName = facilityName(city, facilityId);
	const { name: monthName, month, year } = monthFromQuery(q);
	const dateYear = `${year}-${String(month).padStart(2, '0')}-01`;
	const rng = seeded(`revenue:${city.id}:${facilityId}:${year}-${month}`);

	const records = buildRevenueRecords(rng, city, facilityId, fName, dateYear);
	const costingTypes = records.map(r => ({
		costingTypeId: r.costingTypeId,
		costingTypeName: r.costingTypeName,
	}));
	const onSiteManPowerDetails = buildOnSiteManPower(rng, facilityId, fName, dateYear);

	const data = [
		{
			cityId: city.id,
			cityName: city.name,
			facilities: [
				{
					facilityId,
					facilityName: fName,
					monthYearData: [
						{
							monthYear: `${monthName} ${year}`,
							weekData: { week1: true, week2: true, week3: true, week4: true },
							records,
							costingTypes,
							onSiteManPowerDetails,
						},
					],
				},
			],
		},
	];

	return okEnvelope({ data, pagination: paginationBlock(records.length, q) });
}

/* ------------------------------------------------------------------ *
 * getRevenueInUnits — unit economics
 * ------------------------------------------------------------------ */

function handleGetRevenueInUnits(req: MockRequest) {
	const q = req.query;
	const city = cityFromQuery(q);
	const facilityId = facilityIdFromQuery(q);
	const { month, year } = monthFromQuery(q);
	const rng = seeded(`units:${city.id}:${facilityId}:${year}-${month}`);

	const heads = ['Revenue', ...VARIABLE_COST_TYPES];
	let pUnitTotal = 0, w1Tot = 0, w2Tot = 0, w3Tot = 0, w4Tot = 0;
	let w1dTot = 0, w2dTot = 0, w3dTot = 0, w4dTot = 0, aggrTot = 0;

	const updateUnitEconomics = heads.map(name => {
		// Per-plate / per-unit economics: small rupee values per OPD plate.
		const projUnit = rng.float(2, 45);
		const w1 = +(projUnit * rng.float(0.85, 1.15)).toFixed(2);
		const w2 = +(projUnit * rng.float(0.85, 1.15)).toFixed(2);
		const w3 = +(projUnit * rng.float(0.85, 1.15)).toFixed(2);
		const w4 = +(projUnit * rng.float(0.85, 1.15)).toFixed(2);
		const aggr = +((w1 + w2 + w3 + w4) / 4).toFixed(2);
		const opd1 = rng.int(4000, 9000);
		const opd2 = rng.int(4000, 9000);
		const opd3 = rng.int(4000, 9000);
		const opd4 = rng.int(4000, 9000);

		pUnitTotal += projUnit;
		w1Tot += w1; w2Tot += w2; w3Tot += w3; w4Tot += w4;
		w1dTot += w1 - projUnit; w2dTot += w2 - projUnit;
		w3dTot += w3 - projUnit; w4dTot += w4 - projUnit;
		aggrTot += aggr;

		return {
			costingTypeId: costingTypeId(name),
			costingTypeName: name,
			facilityId,
			week1OpdCount: String(opd1),
			week2OpdCount: String(opd2),
			week3OpdCount: String(opd3),
			week4OpdCount: String(opd4),
			grossCosts: rng.int(200000, 900000),
			estGrossCost: money(rng.int(200000, 900000)),
			projectValue: money(projUnit),
			week1_actual_value: w1,
			week1Delta: money(w1 - projUnit),
			week2_actual_value: w2,
			week2Delta: money(w2 - projUnit),
			week3_actual_value: w3,
			week3Delta: money(w3 - projUnit),
			week4_actual_value: w4,
			week4Delta: money(w4 - projUnit),
			aggrUnit: aggr,
		};
	});

	const total = {
		projectedUnitValueTotal: money(pUnitTotal),
		week1UnitTotal: money(w1Tot),
		week2UnitTotal: money(w2Tot),
		week3UnitTotal: money(w3Tot),
		week4UnitTotal: money(w4Tot),
		week1DeltaTotal: money(w1dTot),
		week2DeltaTotal: money(w2dTot),
		week3DeltaTotal: money(w3dTot),
		week4DeltaTotal: money(w4dTot),
		aggrUnitTotal: money(aggrTot),
	};

	const startDay = (n: number) => `${year}-${String(month).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
	const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
	const weeksBreakdown = [
		{ name: 'Week 1', startDate: startDay(1), endDate: startDay(7) },
		{ name: 'Week 2', startDate: startDay(8), endDate: startDay(14) },
		{ name: 'Week 3', startDate: startDay(15), endDate: startDay(21) },
		{ name: 'Week 4', startDate: startDay(22), endDate: startDay(lastDay) },
	];

	return okEnvelope({ message: 'Revenue in units fetched', updateUnitEconomics, total, weeksBreakdown });
}

/* ------------------------------------------------------------------ *
 * getEBITDA — report keyed by month NAME
 * ------------------------------------------------------------------ */

function weekTotals(rng: Rng, projected: number) {
	const per = projected / 4;
	const week1 = +(per * rng.float(0.85, 1.15)).toFixed(2);
	const week2 = +(per * rng.float(0.85, 1.15)).toFixed(2);
	const week3 = +(per * rng.float(0.85, 1.15)).toFixed(2);
	const week4 = +(per * rng.float(0.85, 1.15)).toFixed(2);
	const total = +(week1 + week2 + week3 + week4).toFixed(2);
	return { week1, week2, week3, week4, total, projected: money(projected), totalProjectedValue: projected };
}

function buildEbitdaDetail(
	rng: Rng,
	names: string[],
	city: { id: number; name: string },
	facilityId: number,
	fName: string,
	dateYear: string,
): RevenueRecordShape[] {
	return names.map((name, i) => {
		const row = weeklyRow(rng, 40_000, 600_000);
		const perWeekProj = row.projected / 4;
		return {
			id: city.id * 200000 + facilityId * 100 + i,
			costingTypeName: name,
			costingTypeId: costingTypeId(name),
			reviewCategoryTypeId: COST_CATEGORIES.indexOf(categoryForCostingType(name)) + 1,
			projected_value: money(row.projected),
			projectedValue: money(row.projected),
			week1_actual_value: money(row.w1),
			week1_delta_with_percentage: deltaPct(row.w1 - perWeekProj, perWeekProj),
			week2_actual_value: money(row.w2),
			week2_delta_with_percentage: deltaPct(row.w2 - perWeekProj, perWeekProj),
			week3_actual_value: money(row.w3),
			week3_delta_with_percentage: deltaPct(row.w3 - perWeekProj, perWeekProj),
			week4_actual_value: money(row.w4),
			week4_delta_with_percentage: deltaPct(row.w4 - perWeekProj, perWeekProj),
			total_actual_value: money(row.totalActual),
			total_delta_with_percentage: deltaPct(row.totalActual - row.projected, row.projected),
			date_year: dateYear,
			created_at: `${dateYear}T08:30:00Z`,
			cityId: city.id,
			cityName: city.name,
			facilityName: fName,
			facilityId,
			billing_type_id: 1,
		} as RevenueRecordShape & { projectedValue: string };
	});
}

function handleGetEBITDA(req: MockRequest) {
	const q = req.query;
	const city = cityFromQuery(q);
	const facilityId = facilityIdFromQuery(q);
	const fName = facilityName(city, facilityId);
	const { name: monthName, month, year } = monthFromQuery(q);
	const dateYear = `${year}-${String(month).padStart(2, '0')}-01`;
	const rng = seeded(`ebitda:${city.id}:${facilityId}:${year}-${month}`);

	const variableCostDetails = buildEbitdaDetail(
		rng, VARIABLE_COST_TYPES, city, facilityId, fName, dateYear,
	);
	const indirectExpenseDetails = buildEbitdaDetail(
		rng, INDIRECT_COST_TYPES, city, facilityId, fName, dateYear,
	);

	const sumWeek = (rows: RevenueRecordShape[], key: 'week1_actual_value' | 'week2_actual_value' | 'week3_actual_value' | 'week4_actual_value') =>
		+rows.reduce((s, r) => s + parseFloat(r[key]), 0).toFixed(2);
	const sumProj = (rows: RevenueRecordShape[]) =>
		+rows.reduce((s, r) => s + parseFloat(r.projected_value), 0).toFixed(2);

	const revenueProjected = rng.int(2_200_000, 4_800_000);
	const totalRevenue = weekTotals(rng, revenueProjected);

	const vcW1 = sumWeek(variableCostDetails, 'week1_actual_value');
	const vcW2 = sumWeek(variableCostDetails, 'week2_actual_value');
	const vcW3 = sumWeek(variableCostDetails, 'week3_actual_value');
	const vcW4 = sumWeek(variableCostDetails, 'week4_actual_value');
	const vcProj = sumProj(variableCostDetails);
	const totalVariableCost = {
		week1: vcW1, week2: vcW2, week3: vcW3, week4: vcW4,
		total: +(vcW1 + vcW2 + vcW3 + vcW4).toFixed(2),
		projected: money(vcProj), totalProjectedValue: vcProj,
	};

	const totalContribution = {
		week1: +(totalRevenue.week1 - vcW1).toFixed(2),
		week2: +(totalRevenue.week2 - vcW2).toFixed(2),
		week3: +(totalRevenue.week3 - vcW3).toFixed(2),
		week4: +(totalRevenue.week4 - vcW4).toFixed(2),
		total: +(totalRevenue.total - totalVariableCost.total).toFixed(2),
		projected: money(revenueProjected - vcProj),
		totalProjectedValue: revenueProjected - vcProj,
	};

	const ieW1 = sumWeek(indirectExpenseDetails, 'week1_actual_value');
	const ieW2 = sumWeek(indirectExpenseDetails, 'week2_actual_value');
	const ieW3 = sumWeek(indirectExpenseDetails, 'week3_actual_value');
	const ieW4 = sumWeek(indirectExpenseDetails, 'week4_actual_value');
	const ieProj = sumProj(indirectExpenseDetails);
	const totalIndirectExpenseCost = {
		week1: ieW1, week2: ieW2, week3: ieW3, week4: ieW4,
		total: +(ieW1 + ieW2 + ieW3 + ieW4).toFixed(2),
		projected: money(ieProj), totalProjectedValue: ieProj,
	};

	const EBITDA = {
		week1: +(totalContribution.week1 - ieW1).toFixed(2),
		week2: +(totalContribution.week2 - ieW2).toFixed(2),
		week3: +(totalContribution.week3 - ieW3).toFixed(2),
		week4: +(totalContribution.week4 - ieW4).toFixed(2),
		total: +(totalContribution.total - totalIndirectExpenseCost.total).toFixed(2),
		projected: money(totalContribution.totalProjectedValue - ieProj),
		totalProjectedValue: totalContribution.totalProjectedValue - ieProj,
	};

	const report = {
		[monthName]: {
			totalRevenue,
			totalVariableCost,
			totalContribution,
			totalIndirectExpenseCost,
			EBITDA,
			variableCostDetails,
			indirectExpenseDetails,
		},
	};

	return okEnvelope({ report });
}

/* ------------------------------------------------------------------ *
 * getClientWisePL
 * ------------------------------------------------------------------ */

const NUMERIC_COST_HEADS = [
	'Manpower', 'Electricity', 'Water', 'Consumables', 'Chemicals',
	'Rental Genset', 'Diesel', 'Pest control', 'Rent of Plates and Crockery',
	'Logistics', 'Salaries', 'Rent Of Washing Facility', 'Printing & Stationary',
	'Repairs & Maintenance', 'Misc expenses', 'Due and Subcription', 'Staff Welfare',
	'Fuel and Travelling', 'Plant & Machinery taken on Rent', 'Monthly Revenue Est',
	'On Site Manpower',
];

function handleGetClientWisePL(req: MockRequest) {
	const q = req.query;
	const city = cityFromQuery(q);
	const facilityId = facilityIdFromQuery(q);
	const fName = facilityName(city, facilityId);
	const { month, year } = monthFromQuery(q);
	const dateYear = `${year}-${String(month).padStart(2, '0')}-01`;
	const rng = seeded(`clientpl:${city.id}:${facilityId}:${year}-${month}`);

	const clientNames = rng.picks(COMPANIES, 6);

	const totals = {
		totalPrice: 0, totalOpdCount: 0, manpower: 0, electricity: 0, water: 0,
		consumables: 0, chemicals: 0, rentalGenset: 0, diesel: 0, pestControl: 0,
		rentOfPlatesAndCrockery: 0, logistics: 0, salaries: 0, rentOfWashingFacility: 0,
		printingStationary: 0, repairsMaintenance: 0, miscExpenses: 0, dueAndSubcription: 0,
		staffWelfare: 0, fuelAndTravelling: 0, plantMachineryTakenOnRent: 0,
		monthlyRevenueEst: 0, onSiteManpower: 0, contribution: 0,
	};

	const clients = clientNames.map((clientName, i) => {
		const opd = rng.int(40_000, 180_000);
		const price = rng.int(800_000, 2_600_000);
		const costs: Record<string, number> = {};
		NUMERIC_COST_HEADS.forEach(h => {
			costs[h] = rng.int(8_000, 180_000);
		});
		costs['Monthly Revenue Est'] = price;
		const totalCost = NUMERIC_COST_HEADS
			.filter(h => h !== 'Monthly Revenue Est')
			.reduce((s, h) => s + costs[h], 0);
		const contribution = +(price - totalCost).toFixed(2);
		const marginPercentage = +((contribution / price) * 100).toFixed(2);
		const revPerPlate = +(price / opd).toFixed(2);

		totals.totalPrice += price;
		totals.totalOpdCount += opd;
		totals.manpower += costs['Manpower'];
		totals.electricity += costs['Electricity'];
		totals.water += costs['Water'];
		totals.consumables += costs['Consumables'];
		totals.chemicals += costs['Chemicals'];
		totals.rentalGenset += costs['Rental Genset'];
		totals.diesel += costs['Diesel'];
		totals.pestControl += costs['Pest control'];
		totals.rentOfPlatesAndCrockery += costs['Rent of Plates and Crockery'];
		totals.logistics += costs['Logistics'];
		totals.salaries += costs['Salaries'];
		totals.rentOfWashingFacility += costs['Rent Of Washing Facility'];
		totals.printingStationary += costs['Printing & Stationary'];
		totals.repairsMaintenance += costs['Repairs & Maintenance'];
		totals.miscExpenses += costs['Misc expenses'];
		totals.dueAndSubcription += costs['Due and Subcription'];
		totals.staffWelfare += costs['Staff Welfare'];
		totals.fuelAndTravelling += costs['Fuel and Travelling'];
		totals.plantMachineryTakenOnRent += costs['Plant & Machinery taken on Rent'];
		totals.monthlyRevenueEst += price;
		totals.onSiteManpower += costs['On Site Manpower'];
		totals.contribution += contribution;

		return {
			skuCount: String(rng.int(8, 60)),
			opdCount: String(opd),
			price,
			revPerPlate,
			clientName,
			clientId: 2000 + i,
			billing_type_id: 1,
			billing_sub_type_id: null,
			Manpower: costs['Manpower'],
			Electricity: costs['Electricity'],
			Water: costs['Water'],
			Consumables: costs['Consumables'],
			Chemicals: costs['Chemicals'],
			'Rental Genset': costs['Rental Genset'],
			Diesel: costs['Diesel'],
			'Pest control': costs['Pest control'],
			'Rent of Plates and Crockery': costs['Rent of Plates and Crockery'],
			Logistics: costs['Logistics'],
			Salaries: costs['Salaries'],
			'Rent Of Washing Facility': costs['Rent Of Washing Facility'],
			'Printing & Stationary': costs['Printing & Stationary'],
			'Repairs & Maintenance': costs['Repairs & Maintenance'],
			'Misc expenses': costs['Misc expenses'],
			'Due and Subcription': costs['Due and Subcription'],
			'Staff Welfare': costs['Staff Welfare'],
			'Fuel and Travelling': costs['Fuel and Travelling'],
			'Plant & Machinery taken on Rent': costs['Plant & Machinery taken on Rent'],
			'Monthly Revenue Est': price,
			'On Site Manpower': costs['On Site Manpower'],
			contribution,
			marginPercentage,
		};
	});

	const revenuePerPlate = +(totals.totalPrice / Math.max(1, totals.totalOpdCount)).toFixed(2);
	const marginPercentage = +((totals.contribution / Math.max(1, totals.totalPrice)) * 100).toFixed(2);

	const clientWiseData = {
		totalPrice: +totals.totalPrice.toFixed(2),
		totalOpdCount: totals.totalOpdCount,
		revenuePerPlate,
		contribution: +totals.contribution.toFixed(2),
		marginPercentage,
		manpower: totals.manpower,
		electricity: totals.electricity,
		water: totals.water,
		consumables: totals.consumables,
		chemicals: totals.chemicals,
		rentalGenset: totals.rentalGenset,
		diesel: totals.diesel,
		pestControl: totals.pestControl,
		rentOfPlatesAndCrockery: totals.rentOfPlatesAndCrockery,
		logistics: totals.logistics,
		salaries: totals.salaries,
		rentOfWashingFacility: totals.rentOfWashingFacility,
		printingStationary: totals.printingStationary,
		repairsMaintenance: totals.repairsMaintenance,
		miscExpenses: totals.miscExpenses,
		dueAndSubcription: totals.dueAndSubcription,
		staffWelfare: totals.staffWelfare,
		fuelAndTravelling: totals.fuelAndTravelling,
		plantMachineryTakenOnRent: totals.plantMachineryTakenOnRent,
		monthlyRevenueEst: totals.monthlyRevenueEst,
		onSiteManpower: totals.onSiteManpower,
		data: clients,
	};

	const revenueCostHeadsDetail = buildRevenueRecords(rng, city, facilityId, fName, dateYear);

	return okEnvelope({ clientWiseData, revenueCostHeadsDetail });
}

/* ------------------------------------------------------------------ *
 * getEscalation
 * ------------------------------------------------------------------ */

function handleGetEscalation(req: MockRequest) {
	const q = req.query;
	const city = cityFromQuery(q);
	const facilityId = facilityIdFromQuery(q);
	const { month, year } = monthFromQuery(q);
	const rng = seeded(`escalation:${city.id}:${facilityId}:${year}-${month}`);

	const ESCALATION_CATEGORIES = [
		'Quality', 'Delay', 'Temperature Breach', 'Damage', 'Shortage', 'Hygiene',
	];
	const clientNames = rng.picks(COMPANIES, 5);

	// Per-week max-escalation-category counts.
	const weekCategory = () => {
		const obj: Record<string, number> = {};
		ESCALATION_CATEGORIES.forEach(c => { obj[c] = rng.int(0, 6); });
		return obj;
	};
	const w1cat = weekCategory();
	const w2cat = weekCategory();
	const w3cat = weekCategory();
	const w4cat = weekCategory();

	const totalEscalationWeekWise = {
		week1: { ...w1cat, delta: rng.int(-3, 4) },
		week2: { ...w2cat, delta: rng.int(-3, 4) },
		week3: { ...w3cat, delta: rng.int(-3, 4) },
		week4: { ...w4cat, delta: rng.int(-3, 4) },
	};

	// Per-client { count, delta } per week.
	const clientWeek = (prev?: Record<string, { count: number }>) => {
		const obj: Record<string, { count: number; delta: number }> = {};
		clientNames.forEach(name => {
			const count = rng.int(0, 9);
			const delta = prev ? count - (prev[name]?.count ?? 0) : count;
			obj[name] = { count, delta };
		});
		return obj;
	};
	const cw1 = clientWeek();
	const cw2 = clientWeek(cw1);
	const cw3 = clientWeek(cw2);
	const cw4 = clientWeek(cw3);

	const totalEscalationClientWiseByWeek = { week1: cw1, week2: cw2, week3: cw3, week4: cw4 };

	const sumCounts = (cw: Record<string, { count: number }>) =>
		Object.values(cw).reduce((s, v) => s + v.count, 0);
	const totalEscalations = sumCounts(cw1) + sumCounts(cw2) + sumCounts(cw3) + sumCounts(cw4);

	// Flat escalation items list (used elsewhere / for completeness).
	const data = list(
		rng.int(4, 9),
		(i, r) => {
			const cat = r.pick(ESCALATION_CATEGORIES);
			return {
				id: i + 1,
				clientName: r.pick(clientNames),
				cityId: city.id,
				cityName: city.name,
				facilityId,
				category: cat,
				week: r.int(1, 4),
				status: r.pick(['Open', 'In Progress', 'Resolved', 'Closed']),
				count: r.int(1, 5),
				created_at: `${year}-${String(month).padStart(2, '0')}-${String(r.int(1, 28)).padStart(2, '0')}T10:00:00Z`,
			};
		},
		`escalation-items:${city.id}:${facilityId}:${year}-${month}`,
	);

	const statusCount = {
		Open: rng.int(1, 6),
		'In Progress': rng.int(1, 5),
		Resolved: rng.int(2, 8),
		Closed: rng.int(2, 9),
	};

	return okEnvelope({
		data,
		totalEscalationWeekWise,
		totalEscalationClientWiseByWeek,
		totalEscalations,
		statusCount,
		pagination: paginationBlock(data.length, q),
	});
}

/* ------------------------------------------------------------------ *
 * getCostCategories
 * ------------------------------------------------------------------ */

function handleGetCostCategories(req: MockRequest) {
	const q = req.query;
	const statusParam = q.status; // '1' | '0' | 'All'
	const all = COST_CATEGORIES.map((name, i) => ({
		id: i + 1,
		costCategories: name,
		status: i === COST_CATEGORIES.length - 1 ? '0' : '1', // last one inactive for variety
	}));
	const filtered =
		!statusParam || statusParam === 'All'
			? all
			: all.filter(c => c.status === statusParam);
	return okEnvelope({ data: filtered, pagination: paginationBlock(filtered.length, q) });
}

/* ------------------------------------------------------------------ *
 * getReviewCostingType
 * ------------------------------------------------------------------ */

function handleGetReviewCostingType(req: MockRequest) {
	const q = req.query;
	const statusParam = q.status; // '1' | '0' | undefined
	const items = ALL_COSTING_TYPES.filter(n => n !== 'Revenue').map((name, i) => ({
		id: i + 1,
		name,
		reviewCategoryName: categoryForCostingType(name),
		status: i % 7 === 6 ? '0' : '1', // sprinkle a few inactive rows
	}));
	const filtered =
		statusParam === undefined || statusParam === '' || statusParam === 'All'
			? items
			: items.filter(it => it.status === statusParam);
	return okEnvelope({ data: filtered, pagination: paginationBlock(filtered.length, q) });
}

/* ------------------------------------------------------------------ *
 * getProjectedCosting
 * ------------------------------------------------------------------ */

function handleGetProjectedCosting(req: MockRequest) {
	const q = req.query;
	const facilityId = facilityIdFromQuery(q);
	const dateYear = q.date_year || '2026-06-01';
	const m = /^(\d{4})-(\d{2})/.exec(dateYear);
	const year = m ? parseInt(m[1], 10) : 2026;
	const month = m ? parseInt(m[2], 10) : 6;
	const city = CITIES[(facilityId - 1) % CITIES.length];
	const fName = facilityName(city, facilityId);
	const rng = seeded(`projected:${facilityId}:${year}-${month}`);

	const costingResults = ALL_COSTING_TYPES.filter(n => n !== 'Revenue').map((name, i) => ({
		id: facilityId * 1000 + i + 1,
		date_year: dateYear,
		facility_id: facilityId,
		costing_type_id: costingTypeId(name),
		city_id: city.id,
		projected_value: money(rng.int(40_000, 600_000)),
		costing_type_name: name,
		city_name: city.name,
	}));

	const manPowerResults = buildOnSiteManPower(rng, facilityId, fName, dateYear).map(mp => ({
		id: mp.id,
		client_id: mp.client_id,
		client_name: mp.client_name,
		costing_type_id: mp.costing_type_id,
		est: mp.est,
		costing_type_name: mp.costing_type_name,
		facility_id: mp.facility_id,
		facility_name: mp.facility_name,
		week1: mp.week1,
		week2: mp.week2,
		week3: mp.week3,
		week4: mp.week4,
		date_year: dateYear,
	}));

	return okEnvelope({ results: { costingResults, manPowerResults } });
}

/* ------------------------------------------------------------------ *
 * getOnSiteManPowerClients
 * ------------------------------------------------------------------ */

function handleGetOnSiteManPowerClients(req: MockRequest) {
	const q = req.query;
	const facilityId = facilityIdFromQuery(q);
	const city = CITIES[(facilityId - 1) % CITIES.length];
	const fName = facilityName(city, facilityId);
	const rng = seeded(`mpclients:${facilityId}`);
	const clients = rng.picks(COMPANIES, 5).map((name, i) => ({
		id: facilityId * 100 + i + 1,
		client_id: 1000 + i,
		client_name: name,
		facility_id: facilityId,
		status: 1,
		facility_name: fName,
	}));
	// Service unwraps response.data — keep the documented shape { status, data }.
	return { status: 'Success', data: clients };
}

/* ------------------------------------------------------------------ *
 * Routes
 * ------------------------------------------------------------------ */

export const routes: MockRoute[] = [
	// --- Reads -------------------------------------------------------------
	{ method: 'GET', pattern: /^\/review\/getRevenueInUnits$/, handler: handleGetRevenueInUnits },
	{ method: 'GET', pattern: /^\/review\/getRevenue$/, handler: handleGetRevenue },
	{ method: 'GET', pattern: /^\/review\/getEBITDA$/, handler: handleGetEBITDA },
	{ method: 'GET', pattern: /^\/review\/getClientWisePL$/, handler: handleGetClientWisePL },
	{ method: 'GET', pattern: /^\/ops\/getEscalation$/, handler: handleGetEscalation },
	{ method: 'GET', pattern: /^\/review\/getCostCategories$/, handler: handleGetCostCategories },
	{ method: 'GET', pattern: /^\/review\/getReviewCostingType$/, handler: handleGetReviewCostingType },
	{ method: 'GET', pattern: /^\/review\/getProjectedCosting$/, handler: handleGetProjectedCosting },
	{ method: 'GET', pattern: /^\/review\/getOnSiteManPowerClients$/, handler: handleGetOnSiteManPowerClients },

	// --- Mutations (return success envelopes) ------------------------------
	{
		method: 'PUT',
		pattern: /^\/review\/updateRevenue$/,
		handler: () => okEnvelope({ message: 'Revenue updated successfully' }),
	},
	{
		method: 'POST',
		pattern: /^\/review\/addReviewCostingType$/,
		handler: () => okEnvelope({ message: 'Review costing type added successfully' }),
	},
	{
		method: 'PUT',
		pattern: /^\/review\/updateReviewCostingType$/,
		handler: () => okEnvelope({ message: 'Review costing type updated successfully' }),
	},
	{
		method: 'POST',
		pattern: /^\/review\/addReviewCostingCategory$/,
		handler: () => okEnvelope({ message: 'Review cost category added successfully' }),
	},
	{
		method: 'PUT',
		pattern: /^\/review\/updateReviewCostingCategories$/,
		handler: () => okEnvelope({ message: 'Review cost category updated successfully' }),
	},
	{
		method: 'POST',
		pattern: /^\/review\/addProjectedActualCosting$/,
		handler: () => okEnvelope({ message: 'Projected/actual costing saved successfully' }),
	},
];
