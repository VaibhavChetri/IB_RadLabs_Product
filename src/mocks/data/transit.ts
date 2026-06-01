/**
 * Mock routes: TRANSIT & INVENTORY (LOCAL DEMO ONLY)
 * --------------------------------------------------------------------------
 * Realistic India-context cold-chain logistics data so the Transit Plan,
 * Master Plan, Sent/Received Inventory, Vehicle, Container and SKU-mapping
 * pages render fully with NO backend.
 *
 * Source of truth = the actual service + page source. Endpoint URLs, HTTP
 * methods and response envelopes are replicated exactly (string-vs-number,
 * `data` vs `result`, pagination sibling shapes) per the consuming interface.
 *
 * Ownership note: cities/states/facilities/clients DROPDOWNS that live under
 * commonApi / locationApi (`/locations/*`, `/transit-plan/get-citywise-restaurants`,
 * `/transit-plan/get-transit-types`) are owned by another module and are NOT
 * defined here.
 *
 * Route ordering: param/detail routes are placed BEFORE the broader list
 * routes; all list patterns are anchored with `$`.
 */

import { MockRoute, MockRequest } from '../mockTypes';
import {
	seeded,
	list,
	CITIES,
	COMPANIES,
	fullName,
	phone,
	isoDate,
	dateAgo,
	dateAhead,
	Rng,
} from '../mockHelpers';

/* ------------------------------------------------------------------ *
 * Domain reference data
 * ------------------------------------------------------------------ */

/** Indian commercial-vehicle registration, e.g. 'MH 12 AB 1234'. */
function vehicleReg(rng: Rng): string {
	const stateCodes = ['MH', 'DL', 'KA', 'TS', 'TN', 'WB', 'GJ', 'HR', 'UP', 'RJ'];
	const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ';
	return (
		`${rng.pick(stateCodes)} ${String(rng.int(1, 49)).padStart(2, '0')} ` +
		`${rng.pick(letters.split(''))}${rng.pick(letters.split(''))} ` +
		`${String(rng.int(1, 9999)).padStart(4, '0')}`
	);
}

const VEHICLE_TYPES = ['Tata Ace', 'Mahindra Bolero Pickup', 'Tata 407', 'Eicher Pro', 'EV Cargo Van'] as const;

/** Container/crate types used in the cold-chain B2B flow. */
interface ContainerDef {
	id: number;
	name: string;
	weight: number; // kg
	weightInGms: number;
}
const CONTAINER_TYPES: readonly ContainerDef[] = [
	{ id: 1, name: 'Reusable Crate 25L', weight: 1.2, weightInGms: 1200 },
	{ id: 2, name: 'Insulated Box 20L', weight: 1.8, weightInGms: 1800 },
	{ id: 3, name: 'EPS Cooler 40L', weight: 0.9, weightInGms: 900 },
	{ id: 4, name: 'Clamshell 500ml', weight: 0.05, weightInGms: 50 },
	{ id: 5, name: 'Steel Tiffin Round', weight: 0.4, weightInGms: 400 },
	{ id: 6, name: 'Gel-Pack Tote', weight: 0.6, weightInGms: 600 },
	{ id: 7, name: 'Bagasse Meal Tray', weight: 0.03, weightInGms: 30 },
	{ id: 8, name: 'Polypropylene Bowl 750ml', weight: 0.06, weightInGms: 60 },
] as const;

const TRANSIT_TYPES = [
	{ id: 1, label: 'Dispatch' },
	{ id: 2, label: 'Pickup' },
] as const;

// transit_status -> human label (page normalises via substring match)
const STATUS_LABELS = ['New', 'In Progress', 'Done'] as const;

const FACILITY_NAMES = [
	'Bhandup Wash Centre',
	'AECS Layout Hub',
	'Khandsa Cleaning Facility',
	'Gandipet Wash Unit',
	'Tulshet Pada Depot',
	'Sector 84 Hub',
] as const;

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */

const TRANSIT_TIMES = ['09:30:00', '11:00:00', '13:15:00', '15:00:00', '17:45:00', '20:30:00'] as const;

function pageOf<T>(items: T[], query: Record<string, string>, pageKey = 'page', limitKey = 'limit') {
	const page = Math.max(1, parseInt(query[pageKey] || '1', 10) || 1);
	const rawLimit = parseInt(query[limitKey] || '20', 10);
	// limit=0 / pageSize=0 means "all" in a few of the inventory export flows
	const limit = rawLimit === 0 ? items.length || 1 : Math.max(1, rawLimit || 20);
	const start = (page - 1) * limit;
	return {
		slice: items.slice(start, start + limit),
		page,
		limit,
		total: items.length,
		totalPages: Math.max(1, Math.ceil(items.length / (limit || 1))),
	};
}

function client(rng: Rng) {
	const idx = rng.int(0, COMPANIES.length - 1);
	return { clientId: 1000 + idx, clientName: COMPANIES[idx] };
}

/* ------------------------------------------------------------------ *
 * 1) MASTER PLAN listing  — GET /plan/getMasterPlanListing
 *    Consumer: MasterPlanListing.tsx  → res.data.rows / res.data.pagination.totalItems
 * ------------------------------------------------------------------ */

function masterPlanRows(seed: string) {
	return list(
		28,
		(i, rng) => {
			const c = client(rng);
			const city = rng.pick(CITIES);
			const tt = rng.pick(TRANSIT_TYPES);
			const driver = fullName(rng);
			return {
				id: 4000 + i,
				vehicle_id: 200 + rng.int(0, 40),
				vehicle_number: vehicleReg(rng),
				transit_date: isoDate(dateAhead(rng.int(0, 14))),
				transit_time: rng.pick(TRANSIT_TIMES),
				driver_name: driver,
				driver_phone: phone(rng),
				created_by: fullName(rng),
				city_name: city.name,
				vehicle_type: rng.pick(VEHICLE_TYPES),
				restaurant_name: c.clientName,
				restaurant_id: c.clientId,
				facility_id: 110 + rng.int(0, 8),
				type: tt.label,
				facility: rng.pick(FACILITY_NAMES),
				transit_type_id: tt.id,
				city_id: city.id,
				// day-of-week flags consumed by the edit transform
				sun: rng.bool(0.3) ? 1 : 0,
				mon: rng.bool(0.7) ? 1 : 0,
				tue: rng.bool(0.7) ? 1 : 0,
				wed: rng.bool(0.7) ? 1 : 0,
				thu: rng.bool(0.7) ? 1 : 0,
				fri: rng.bool(0.7) ? 1 : 0,
				sat: rng.bool(0.4) ? 1 : 0,
			};
		},
		seed
	);
}

/* ------------------------------------------------------------------ *
 * 2) TRANSIT PLAN listing — GET /transit-plan/get-transit-plan-listing
 *    Consumer: TransitPlanListing.tsx
 *      rows  -> res.data.rows
 *      totals-> res.data.totalDispatch / res.data.totalPickup
 *      page  -> res.pagination.totalItems
 * ------------------------------------------------------------------ */

function transitPlanRows(seed: string) {
	return list(
		32,
		(i, rng) => {
			const c = client(rng);
			const city = rng.pick(CITIES);
			const tt = rng.pick(TRANSIT_TYPES);
			const statusIdx = rng.int(0, 2);
			const initiated = statusIdx > 0;
			const transitDate = isoDate(dateAgo(rng.int(0, 29)));
			return {
				id: 7000 + i,
				transit_date: transitDate,
				transit_time: rng.pick(TRANSIT_TIMES),
				restaurant_name: c.clientName,
				restaurant_id: c.clientId,
				type: tt.label,
				transit_status: statusIdx,
				transit_status_label: STATUS_LABELS[statusIdx],
				delay_of: rng.bool(0.25) ? `${rng.int(10, 90)} min` : null,
				driver_name: fullName(rng),
				driver_phone: phone(rng),
				facility: rng.pick(FACILITY_NAMES),
				facility_name: rng.pick(FACILITY_NAMES),
				facility_id: 110 + rng.int(0, 8),
				vehicle_type: rng.pick(VEHICLE_TYPES),
				vehicle_number: vehicleReg(rng),
				initiated_date: initiated ? `${transitDate} ${rng.pick(TRANSIT_TIMES)}` : null,
				total_qty: rng.int(20, 480),
				signature_name: initiated ? fullName(rng) : null,
				creation_date: isoDate(dateAgo(rng.int(30, 60))),
				created_by: fullName(rng),
				city_name: city.name,
				city_id: city.id,
			};
		},
		seed
	);
}

/* ------------------------------------------------------------------ *
 * 3) CURRENT PLAN details — GET /transit-plan/getCurrentPlanDetails
 *    Consumer: SentTransitPlanListing (transit_type_id=1)
 *              ReceivedTransitPlanListing (transit_type_id=2)
 *    Shape: { status_code, status, result: SentTransitPlanRow[], pagination }
 * ------------------------------------------------------------------ */

function currentPlanRows(seed: string, transitTypeId: number) {
	const tt = TRANSIT_TYPES.find(t => t.id === transitTypeId) ?? TRANSIT_TYPES[0];
	return list(
		30,
		(i, rng) => {
			const c = client(rng);
			const statusIdx = rng.int(0, 2);
			const transitDate = isoDate(dateAgo(rng.int(0, 29)));
			return {
				id: 8000 + transitTypeId * 1000 + i,
				transit_id: `TP-${transitTypeId}-${8000 + i}`,
				transitDate,
				updated_at: `${transitDate}T${rng.pick(TRANSIT_TIMES)}Z`,
				transit_time: rng.pick(TRANSIT_TIMES),
				clientLocationName: `${c.clientName} — ${rng.pick(CITIES).name}`,
				transit_type_id: tt.id,
				transitType: tt.label,
				driver_name: fullName(rng),
				driver_phone: phone(rng),
				facilityName: rng.pick(FACILITY_NAMES),
				restaurantName: c.clientName,
				restaurantId: c.clientId,
				facilityId: 110 + rng.int(0, 8),
				clientLocationId: 5000 + rng.int(0, 60),
				transit_status: statusIdx,
				dc: statusIdx === 2 ? `IB-${110 + i}-${8000 + i}` : null,
				transit_status_label: STATUS_LABELS[statusIdx],
				signature_name: statusIdx > 0 ? fullName(rng) : null,
				vehicle_number: vehicleReg(rng),
			};
		},
		seed
	);
}

/* ------------------------------------------------------------------ *
 * 4) INVENTORY count rows — GET /inventory/getSentCount, /getReceivedCount
 *    Dual consumer:
 *      (a) Sent/Received Inventory listing pages → status:'success',
 *          result:[objects], pagination, totalCount, days
 *      (b) DC download (DCApiResponse) → result:[{id,clientId,facilityId,
 *          clientName,sku,count,facilityName,dispatch_date_time,adhoc,...}]
 *    A single rich object shape satisfies both.
 * ------------------------------------------------------------------ */

function inventoryCountRows(seed: string) {
	// 14 dispatch "events"; each event has several SKU lines.
	const events = list(
		14,
		(_e, rng) => {
			const c = client(rng);
			const facilityId = 110 + rng.int(0, 8);
			const facilityName = rng.pick(FACILITY_NAMES);
			const day = dateAgo(rng.int(0, 20));
			const dispatch = `${isoDate(day)} ${rng.pick(TRANSIT_TIMES)}`;
			const adhoc = rng.bool(0.2) ? 1 : 0;
			const lineDefs = rng.picks(CONTAINER_TYPES, rng.int(3, 6));
			return { c, facilityId, facilityName, dispatch, adhoc, lineDefs, rng };
		},
		seed
	);

	const rows: Array<Record<string, unknown>> = [];
	let rid = 90000;
	events.forEach(ev => {
		ev.lineDefs.forEach(def => {
			const count = ev.rng.int(8, 220);
			rows.push({
				id: rid++,
				clientId: ev.c.clientId,
				clientName: ev.c.clientName,
				facilityId: ev.facilityId,
				facilityName: ev.facilityName,
				containerTypeId: def.id,
				sku: def.name,
				count,
				dispatch_date_time: ev.dispatch,
				created_at: ev.dispatch,
				adhoc: ev.adhoc,
				driver_name: ev.adhoc ? fullName(ev.rng) : undefined,
				driver_phone: ev.adhoc ? phone(ev.rng) : undefined,
				vehicle_number: ev.adhoc ? vehicleReg(ev.rng) : undefined,
				// impact/export columns consumed by SentInventoryListing excel export
				water: +(count * 0.45).toFixed(2),
				chemical: +(count * 0.03).toFixed(2),
				disposable: +(count * def.weight).toFixed(2),
				co2: +(count * 0.12).toFixed(2),
				electricity: +(count * 0.08).toFixed(2),
				weightInGms: def.weightInGms,
			});
		});
	});
	return rows;
}

function inventoryDays(seed: string) {
	const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	return list(
		7,
		(i, rng) => {
			void rng;
			const d = dateAgo(6 - i);
			return { date: isoDate(d), day: names[d.getUTCDay()] };
		},
		seed
	);
}

/* ------------------------------------------------------------------ *
 * 5) CLIENT SKU MAP — GET /inventory/getClientSkuMap
 *    Consumers:
 *      TransitPlanApi.getClientSkuMap → result: ClientSkuMapItem[]
 *      SkuApiService.getClientSkuMap  → status_code:200, result:[...],
 *                                       combineSkuInfo
 * ------------------------------------------------------------------ */

const IMPACT_TYPES = [
	{ id: 1, name: 'Water Inefficiency' },
	{ id: 2, name: 'Single use PP' },
	{ id: 3, name: 'Clamshell' },
] as const;

function clientSkuMap(seed: string, clientName: string) {
	return list(
		6,
		(i, rng) => {
			const def = CONTAINER_TYPES[i % CONTAINER_TYPES.length];
			const impact = rng.pick(IMPACT_TYPES);
			return {
				clientName,
				price: String(rng.int(3, 18)),
				clientId: 1000 + (i % COMPANIES.length),
				containerType: def.name,
				containerTypeId: def.id,
				status: rng.bool(0.85) ? 'Enabled' : 'Disabled',
				platesWashedPerCycleByClient: rng.int(40, 120),
				distanceFromWarehouse: rng.int(2, 35),
				srcingDistance: rng.int(1, 20),
				weight_bagasse: String(def.weightInGms),
				srcQtyTransportedOneTripEv: rng.int(200, 900),
				qtyTransportedOneTrip: rng.int(150, 800),
				numberOfClamshell: rng.int(1, 4),
				electricityConsumedPerCycle: String(rng.float(0.4, 2.5, 2)),
				waterConsumedPerCycle: rng.float(1.5, 6, 2),
				disposableWeight: def.weight,
				combine_sku: rng.bool(0.3) ? 1 : 0,
				impactId: impact.id,
				impactName: impact.name,
				showCombineSku: false,
			};
		},
		seed
	);
}

/* ------------------------------------------------------------------ *
 * 6) VEHICLES — GET /vehicle/getVehicles
 *    Consumer: useVehicleData → response.data.result / .pagination
 *    Shape: { status_code, status, result: Vehicle[], pagination:{page,
 *             limit, totalRecords, totalPages} }
 * ------------------------------------------------------------------ */

function vehicleRows(seed: string) {
	return list(
		26,
		(i, rng) => {
			const city = rng.pick(CITIES);
			const driver = fullName(rng);
			const ph = phone(rng);
			return {
				id: 200 + i,
				name: `${rng.pick(VEHICLE_TYPES)} ${String.fromCharCode(65 + (i % 26))}`,
				driver_name: driver,
				driver_phone: ph,
				driver_number: ph,
				vehicle_number: vehicleReg(rng),
				city_id: city.id,
				city_name: city.name,
				status: rng.bool(0.9) ? 1 : 0,
				created_at: isoDate(dateAgo(rng.int(20, 400))),
			};
		},
		seed
	);
}

/* ------------------------------------------------------------------ *
 * 7) CONTAINER TYPES — GET /containers/getContainerTypes,
 *    /containers/getB2BContainersTypes, /shift/getDistinctContainerNamesBasedOnCity
 * ------------------------------------------------------------------ */

function containerTypeRows(seed: string, withCount: boolean) {
	const rng = seeded(seed);
	return CONTAINER_TYPES.map((def, i) => ({
		id: def.id,
		container_type_id: def.id,
		container_name: def.name,
		sku: def.name,
		container: def.name,
		weight: def.weight,
		weightInGms: def.weightInGms,
		dishwasherCyclesPerDay: rng.int(6, 14),
		dishwasherOptimumCapacity: rng.int(40, 120),
		impact_accountable: rng.bool(0.7) ? 1 : 0,
		city_id: CITIES[i % CITIES.length].id,
		name: CITIES[i % CITIES.length].name,
		...(withCount ? { containerCount: rng.int(50, 2000) } : {}),
		status: 1,
		created_at: isoDate(dateAgo(rng.int(30, 500))),
	}));
}

/* ------------------------------------------------------------------ *
 * Generic success envelopes for mutations
 * ------------------------------------------------------------------ */

const success = (message: string, extra: Record<string, unknown> = {}) => ({
	status_code: 200,
	statusCode: 200,
	status: 'success',
	message,
	...extra,
});

const dcNumber = (req: MockRequest) => {
	const rng = seeded(req.path + JSON.stringify(req.body ?? ''));
	return `IB-${110 + rng.int(0, 8)}-${rng.int(10000, 99999)}`;
};

/* ------------------------------------------------------------------ *
 * Routes
 * ------------------------------------------------------------------ */

export const routes: MockRoute[] = [
	/* ============================ MASTER PLAN ============================ */
	{
		method: 'GET',
		pattern: /^\/plan\/getMasterPlanListing$/,
		handler: req => {
			const rows = masterPlanRows(req.path);
			const p = pageOf(rows, req.query, 'pageNumber', 'pageSize');
			return {
				status_code: 200,
				status: 'success',
				message: null,
				data: {
					rows: p.slice,
					pagination: {
						page: p.page,
						limit: p.limit,
						totalItems: p.total,
						totalPages: p.totalPages,
					},
				},
			};
		},
	},
	{
		// param/detail route BEFORE any broad transit-plan list patterns
		method: 'GET',
		pattern: /^\/transit-plan\/get-master-plan\/(?<id>\d+)$/,
		handler: req => {
			const id = parseInt(req.params.id, 10);
			const row = masterPlanRows(`/plan/getMasterPlanListing`).find(r => r.id === id)
				?? masterPlanRows(req.path)[0];
			return { status_code: 200, status: 'success', message: null, data: { ...row, id } };
		},
	},
	{
		method: 'POST',
		pattern: /^\/transit-plan\/create-master-transit-plan$/,
		handler: req => ({
			status_code: 200,
			status: 'success',
			message: 'Master Plan created successfully',
			data: { id: seeded(JSON.stringify(req.body ?? '')).int(5000, 9999), message: 'created' },
		}),
	},
	{
		method: 'PUT',
		pattern: /^\/transit-plan\/edit-master-transit-plan$/,
		handler: req => ({
			status_code: 200,
			status: 'success',
			message: 'Master Plan updated successfully',
			data: { id: (req.body?.id as number) ?? 0, message: 'updated' },
		}),
	},

	/* ============================ TRANSIT PLAN LISTING ============================ */
	{
		method: 'GET',
		pattern: /^\/transit-plan\/get-transit-plan-listing$/,
		handler: req => {
			let rows = transitPlanRows(req.path);
			if (req.query.transit_status !== undefined && req.query.transit_status !== '') {
				const s = parseInt(req.query.transit_status, 10);
				rows = rows.filter(r => r.transit_status === s);
			}
			if (req.query.restaurant_id) {
				const rid = parseInt(req.query.restaurant_id, 10);
				const filtered = rows.filter(r => r.restaurant_id === rid);
				if (filtered.length) rows = filtered;
			}
			const totalDispatch = rows.filter(r => r.type === 'Dispatch').length;
			const totalPickup = rows.filter(r => r.type === 'Pickup').length;
			const p = pageOf(rows, req.query, 'page', 'limit');
			return {
				status_code: 200,
				status: 'success',
				data: { rows: p.slice, totalDispatch, totalPickup },
				pagination: {
					page: p.page,
					limit: p.limit,
					totalItems: p.total,
					totalPages: p.totalPages,
				},
			};
		},
	},

	/* ============================ CURRENT (sent/received) PLAN DETAILS ============================ */
	{
		method: 'GET',
		pattern: /^\/transit-plan\/getCurrentPlanDetails$/,
		handler: req => {
			const ttId = parseInt(req.query.transit_type_id || '1', 10) || 1;
			let rows = currentPlanRows(`${req.path}?tt=${ttId}`, ttId);
			if (req.query.location_id) {
				const cid = parseInt(req.query.location_id, 10);
				const filtered = rows.filter(r => r.restaurantId === cid);
				if (filtered.length) rows = filtered;
			}
			const p = pageOf(rows, req.query, 'page', 'limit');
			return {
				status_code: 200,
				status: 'success',
				result: p.slice,
				pagination: {
					page: String(p.page),
					limit: p.limit,
					totalItems: p.total,
					totalPages: p.totalPages,
				},
			};
		},
	},
	{
		method: 'POST',
		pattern: /^\/transit-plan\/initiate-transit-plan$/,
		handler: () => ({
			status: 'success',
			status_code: 200,
			message: 'Transit plan initiated',
			data: [],
		}),
	},

	/* ============================ RESTAURANTS dropdown (by city) ============================ */
	{
		method: 'GET',
		pattern: /^\/restaurants\/getRestaurants$/,
		handler: req => {
			const rows = list(
				16,
				(i, rng) => {
					void rng;
					return { clientId: 1000 + i, clientName: COMPANIES[i % COMPANIES.length] };
				},
				req.path
			);
			return { status: 'success', status_code: 200, result: rows };
		},
	},

	/* ============================ INVENTORY: sent / received counts ============================ */
	{
		method: 'GET',
		pattern: /^\/inventory\/getSentCount$/,
		handler: req => {
			const rows = inventoryCountRows(req.path);
			const p = pageOf(rows, req.query, 'pageNumber', 'pageSize');
			return {
				status: 'success',
				status_code: 200,
				message: 'OK',
				result: p.slice,
				total: [p.total],
				totalCount: p.total,
				days: inventoryDays(req.path),
				pagination: {
					page: p.page,
					limit: p.limit,
					totalItems: p.total,
					totalPages: p.totalPages,
				},
			};
		},
	},
	{
		method: 'GET',
		pattern: /^\/inventory\/getReceivedCount$/,
		handler: req => {
			const rows = inventoryCountRows(req.path);
			const p = pageOf(rows, req.query, 'pageNumber', 'pageSize');
			return {
				status: 'success',
				status_code: 200,
				message: 'OK',
				result: p.slice,
				total: [p.total],
				totalCount: p.total,
				days: inventoryDays(req.path),
				pagination: {
					page: p.page,
					limit: p.limit,
					totalItems: p.total,
					totalPages: p.totalPages,
				},
			};
		},
	},
	{
		method: 'GET',
		pattern: /^\/inventory\/getSentCountKAM$/,
		handler: req => {
			const rng = seeded(req.path);
			const byDate: Record<string, { totalCount: number; day: string }> = {};
			const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
			for (let i = 6; i >= 0; i--) {
				const d = dateAgo(i);
				byDate[isoDate(d)] = { totalCount: rng.int(40, 600), day: names[d.getUTCDay()] };
			}
			const total = Object.values(byDate).reduce((s, v) => s + v.totalCount, 0);
			return {
				status_code: 200,
				summaryCount: {
					totalSummary: {
						totalClientSKUCount: total,
						totalClientAvgSKUCount: Math.round(total / 7),
					},
				},
				total: {
					totalPlasticSavedKg: +(total * 0.05).toFixed(2),
					water: +(total * 0.45).toFixed(2),
					ghc: +(total * 0.12).toFixed(2),
				},
				segResult: { byDate },
			};
		},
	},

	/* ============================ INVENTORY: clients by city ============================ */
	{
		method: 'GET',
		pattern: /^\/inventory\/getClientByCity$/,
		handler: req => {
			const rows = list(
				18,
				(i, rng) => {
					void rng;
					return { clientId: 1000 + i, clientName: COMPANIES[i % COMPANIES.length] };
				},
				req.path
			);
			return { status_code: 200, result: rows, message: null };
		},
	},

	/* ============================ INVENTORY: client SKU map ============================ */
	{
		method: 'GET',
		pattern: /^\/inventory\/getClientSkuMap$/,
		handler: req => {
			const clientId = parseInt(req.query.clientId || '0', 10);
			const name = COMPANIES[clientId % COMPANIES.length] || 'Acme Foods';
			return {
				status_code: 200,
				status: 'success',
				result: clientSkuMap(req.path + clientId, name),
				combineSkuInfo: { showCombineSku: false },
			};
		},
	},
	{
		method: 'POST',
		pattern: /^\/inventory\/addClientSkuMap$/,
		handler: () => success('Client SKU map added successfully'),
	},
	{
		method: 'PUT',
		pattern: /^\/inventory\/updateClientSkuMap$/,
		handler: () => success('Client SKU map updated successfully'),
	},

	/* ============================ INVENTORY: B2B send / receive / update ============================ */
	{
		method: 'POST',
		pattern: /^\/inventory\/sendB2BInventory$/,
		handler: req => ({
			status: 'success',
			status_code: 200,
			message: 'Inventory dispatched',
			data: { dc_number: dcNumber(req) },
			dc_number: dcNumber(req),
		}),
	},
	{
		method: 'POST',
		pattern: /^\/inventory\/receivedB2BInventory$/,
		handler: req => ({
			status: 'success',
			status_code: 200,
			message: 'Inventory received',
			data: { dc_number: dcNumber(req) },
			dc_number: dcNumber(req),
		}),
	},
	{
		method: 'PUT',
		pattern: /^\/inventory\/updateB2BInventory$/,
		handler: () => success('Inventory updated successfully', { data: [] }),
	},

	/* ============================ IMAGE upload (transit proof) ============================ */
	{
		method: 'POST',
		pattern: /^\/image\/uploadImage$/,
		handler: req => {
			const id = seeded(req.path + Date.now()).uuid();
			return {
				status: 'success',
				status_code: 200,
				message: 'Image uploaded',
				data: { path: `/uploads/transit/${id}.jpg`, url: `/uploads/transit/${id}.jpg` },
				path: `/uploads/transit/${id}.jpg`,
			};
		},
	},

	/* ============================ VEHICLES ============================ */
	{
		method: 'GET',
		pattern: /^\/vehicle\/getVehicles$/,
		handler: req => {
			let rows = vehicleRows(`/vehicle/getVehicles`);
			if (req.query.status !== undefined && req.query.status !== '') {
				rows = rows.filter(r => r.status === parseInt(req.query.status, 10));
			}
			if (req.query.driver_name) {
				rows = rows.filter(r =>
					r.driver_name.toLowerCase().includes(req.query.driver_name.toLowerCase())
				);
			}
			if (req.query.name) {
				rows = rows.filter(r => r.name.toLowerCase().includes(req.query.name.toLowerCase()));
			}
			const p = pageOf(rows, req.query, 'page', 'limit');
			return {
				status_code: 200,
				status: 'success',
				result: p.slice,
				pagination: {
					page: p.page,
					limit: p.limit,
					totalRecords: p.total,
					totalPages: p.totalPages,
				},
			};
		},
	},
	{
		method: 'POST',
		pattern: /^\/vehicle\/addVehicle$/,
		handler: () => success('Vehicle added successfully'),
	},
	{
		method: 'PUT',
		pattern: /^\/vehicle\/updateVehicle$/,
		handler: () => success('Vehicle updated successfully', {
			result: { affectedRows: 1, changedRows: 1 },
		}),
	},
	{
		method: 'DELETE',
		pattern: /^\/vehicle\/deleteVehicle$/,
		handler: () => success('Vehicle deleted successfully', {
			result: { affectedRows: 1, changedRows: 1 },
		}),
	},

	/* ============================ CONTAINER TYPES ============================ */
	{
		method: 'GET',
		pattern: /^\/containers\/getB2BContainersTypes$/,
		handler: req => ({
			status_code: 200,
			status: 'success',
			data: containerTypeRows(req.path, false),
		}),
	},
	{
		method: 'GET',
		pattern: /^\/containers\/getContainerTypes$/,
		handler: req => ({
			status_code: 200,
			status: 'success',
			data: containerTypeRows(req.path, Boolean(req.query.facilityId)),
		}),
	},
	{
		method: 'GET',
		pattern: /^\/shift\/getDistinctContainerNamesBasedOnCity$/,
		handler: req => ({
			status_code: 200,
			status: 'success',
			data: containerTypeRows(req.path, false).map(c => ({
				container_type_id: c.container_type_id,
				container_name: c.container_name,
			})),
		}),
	},
	{
		method: 'POST',
		pattern: /^\/containers\/addContainer$/,
		handler: () => success('Container type added successfully'),
	},
	{
		method: 'POST',
		pattern: /^\/containers\/editContainer$/,
		handler: () => success('Container type updated successfully'),
	},
	{
		method: 'POST',
		pattern: /^\/containers\/delContainer$/,
		handler: () => success('Container type deleted successfully'),
	},
];
