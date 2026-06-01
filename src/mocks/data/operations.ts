/**
 * Mock routes: KAM & Operations Reporting (LOCAL DEMO ONLY)
 * --------------------------------------------------------------------------
 * Realistic India-context fake data so the KAM (Key Account Management) and
 * Operations-Reporting pages render fully with NO backend.
 *
 * Covers the endpoints called by:
 *   • src/services/kamApi.ts          → /billing/getInventoryClientPlan,
 *                                        /billing/getEverydayClientInventory,
 *                                        /billing/updateEverydayClientInventory,
 *                                        /billing/getEverydayClientInventoryValues
 *   • src/services/shiftApi.ts        → /shift/* , /ops/getHora
 *   • src/services/complaintTypeApi.ts→ /transit-plan/{get,create,update,delete}ComplaintType(s)
 *   • Operations-reporting features (QC rejection + client escalation) via
 *     src/services/transitPlanApi.ts  → /transit-plan/getQCRejections*,
 *                                        /transit-plan/getQcRuns,
 *                                        /transit-plan/getQcReportAdherence,
 *                                        /transit-plan/qcRejections/:runId,
 *                                        /ops/getEscalation, /ops/addClientEscalation,
 *                                        /ops/editClientEscalation,
 *                                        /ops/getEscalationType, /ops/addEscalationType,
 *                                        /ops/updateEscalationType, /ops/deleteEscalationType
 *   • QC-rejection details SKU grid    → /inventory/getClientSkuMap (skuApi)
 *
 * NOTE: client / city / facility dropdowns (commonApi, locationApi,
 * /inventory/getClientByCity) are owned by another module and are NOT defined here.
 *
 * Detail/param routes are anchored ABOVE list routes so they win during matching.
 */

import { MockRoute, MockRequest } from '../mockTypes';
import {
	ok,
	paginate,
	seeded,
	list,
	CITIES,
	COMPANIES,
	UNITS,
	SKUS,
	fullName,
	isoDate,
	isoDateTime,
	dateAgo,
	TODAY,
} from '../mockHelpers';

/* ------------------------------------------------------------------ *
 * Shared reference data
 * ------------------------------------------------------------------ */

/** Container / SKU catalogue used across KAM inventory + QC + shifts. */
const CONTAINER_TYPES: { id: number; name: string }[] = SKUS.map((name, i) => ({
	id: i + 1,
	name,
}));

/** QC rejection reasons (also surfaced as "complaint types" for the QC grid). */
const REJECTION_REASONS: { id: number; name: string }[] = [
	{ id: 1, name: 'Damaged' },
	{ id: 2, name: 'Leakage' },
	{ id: 3, name: 'Contamination' },
	{ id: 4, name: 'Wrong SKU' },
	{ id: 5, name: 'Temperature Breach' },
	{ id: 6, name: 'Expired' },
	{ id: 7, name: 'Dirty / Unwashed' },
	{ id: 8, name: 'Missing Lid' },
];

/** Escalation / complaint categories raised by clients. */
const ESCALATION_TYPES: { id: number; name: string }[] = [
	{ id: 1, name: 'Late Delivery' },
	{ id: 2, name: 'Damaged Containers' },
	{ id: 3, name: 'Short Quantity' },
	{ id: 4, name: 'Hygiene Concern' },
	{ id: 5, name: 'Billing Dispute' },
	{ id: 6, name: 'Temperature Excursion' },
	{ id: 7, name: 'Documentation Error' },
];

const RESOLUTION_STATUSES = ['Open', 'In Progress', 'Resolved'] as const;

const SHIFT_TIMES = ['Morning (6 AM - 2 PM)', 'Evening (2 PM - 10 PM)', 'Night (10 PM - 6 AM)'];
const OPS_STATUSES = ['Available', 'Functional', 'Shortage', 'Non-Functional'];

/** Resolve a city by id (falls back to the first city). */
function cityById(id: number) {
	return CITIES.find(c => c.id === id) || CITIES[0];
}

/** "YYYY-MM-DD HH:mm:ss" timestamp (backend created_at style). */
function timestamp(d: Date): string {
	return `${isoDate(d)} ${String(d.getUTCHours()).padStart(2, '0')}:${String(
		d.getUTCMinutes()
	).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')}`;
}

/** Stable list of clients for a given city (clientId, clientName). */
function clientsForCity(cityId: number): { clientId: number; clientName: string }[] {
	const rng = seeded(`kam-clients-${cityId}`);
	const picks = rng.picks(COMPANIES, rng.int(8, 14));
	return picks.map((clientName, i) => ({
		clientId: cityId * 100 + i + 1,
		clientName,
	}));
}

/* ================================================================== *
 * KAM — Client / Inventory (kamApi.ts → /billing/*)
 * ================================================================== */

/** GET /billing/getInventoryClientPlan — Client Listing page. */
function getInventoryClientPlan(req: MockRequest) {
	const cityId = parseInt(req.query.city_id || '1', 10) || 1;
	const all = clientsForCity(cityId).map(c => ({ ...c }));
	const { slice, page, limit, total } = paginate(all, req.query);

	const rng = seeded(`client-plan-${req.query.startDate || ''}-${cityId}`);
	const pending = rng.int(0, Math.min(4, total));

	return ok(slice, {
		stats: {
			pending,
			total,
			display: `${total - pending}/${total}`,
		},
		pagination: {
			page,
			limit,
			totalItems: total,
			totalPages: Math.max(1, Math.ceil(total / limit)),
		},
	});
}

/** GET /billing/getEverydayClientInventory — per-client container rows (detail/edit grid). */
function getEverydayClientInventory(req: MockRequest) {
	const clientId = parseInt(req.query.client_id || '0', 10) || 0;
	const cityId = Math.max(1, Math.floor(clientId / 100));
	const client =
		clientsForCity(cityId).find(c => c.clientId === clientId) ||
		clientsForCity(1)[0] || { clientId, clientName: 'Demo Client' };

	const rng = seeded(`everyday-inv-${clientId}-${req.query.start_date || ''}`);
	const n = rng.int(4, CONTAINER_TYPES.length);
	const types = rng.picks(CONTAINER_TYPES, n);

	const rows = types.map((ct, i) => {
		const opening = rng.int(50, 800);
		const dispatch = rng.int(0, 200);
		const returned = rng.int(0, dispatch);
		const closing = Math.max(0, opening + dispatch - returned);
		return {
			id: clientId * 1000 + ct.id,
			clientId: client.clientId,
			clientName: client.clientName,
			openingStock: opening,
			dispatch,
			returned,
			closing,
			containerTypeId: ct.id,
			containerType: ct.name,
			_idx: i, // harmless ordering helper
		};
	});

	return ok(rows);
}

/** GET /billing/getEverydayClientInventoryValues — Inventory Listing table. */
function getEverydayClientInventoryValues(req: MockRequest) {
	const cityId = parseInt(req.query.city_id || '1', 10) || 1;
	const filterClientId = req.query.client_id ? parseInt(req.query.client_id, 10) : undefined;
	const city = cityById(cityId);

	const rng = seeded(
		`inv-values-${req.query.start_date || ''}-${req.query.end_date || ''}-${cityId}-${
			filterClientId ?? 'all'
		}`
	);

	let clients = clientsForCity(cityId);
	if (filterClientId) {
		const found = clients.find(c => c.clientId === filterClientId);
		clients = found ? [found] : [{ clientId: filterClientId, clientName: 'Demo Client' }];
	}

	// One row per (client × container type) — generous, scannable dataset.
	const rows: Record<string, unknown>[] = [];
	let idSeq = 1;
	for (const c of clients) {
		const types = rng.picks(CONTAINER_TYPES, rng.int(2, 5));
		for (const ct of types) {
			const opening = rng.int(50, 800);
			const dispatch = rng.int(0, 200);
			const returned = rng.int(0, dispatch);
			const closing = Math.max(0, opening + dispatch - returned);
			const hasEntered = rng.bool(0.7);

			// Billing mode: 3 = Fixed (flat monthly → price intentionally 0), else per-unit.
			const billingTypeId = rng.bool(0.25) ? 3 : rng.pick([1, 2]);
			const price: number | null =
				billingTypeId === 3 ? 0 : rng.bool(0.85) ? rng.int(8, 45) : null;
			const derivedRevenue: number | null =
				billingTypeId === 3 || price == null ? null : returned * price;

			const startDate = req.query.start_date || isoDate(dateAgo(1));
			const createdAt = timestamp(
				new Date(
					`${startDate}T${String(rng.int(6, 21)).padStart(2, '0')}:${String(
						rng.int(0, 59)
					).padStart(2, '0')}:00Z`
				)
			);

			rows.push({
				id: idSeq++,
				clientId: c.clientId,
				clientName: c.clientName,
				cityId: city.id,
				cityName: city.name,
				containerTypeId: ct.id,
				containerType: ct.name,
				openingStock: opening,
				dispatch,
				returned,
				closing,
				has_entered: hasEntered ? 'Yes' : 'No',
				price,
				derived_revenue: derivedRevenue,
				billingTypeId,
				created_at: createdAt,
			});
		}
	}

	// limit=0 means "return everything" (used by the Excel export path).
	const wantAll = req.query.limit === '0';
	const { slice, page, limit, total } = wantAll
		? { slice: rows, page: 1, limit: rows.length || 1, total: rows.length }
		: paginate(rows, req.query);

	const totalDispatch = rows.reduce((s, r) => s + (Number(r.dispatch) || 0), 0);
	const totalReturned = rows.reduce((s, r) => s + (Number(r.returned) || 0), 0);

	return ok(slice, {
		totals: {
			totalDispatch: String(totalDispatch),
			totalReturned: String(totalReturned),
		},
		pagination: {
			page,
			limit,
			totalItems: total,
			totalPages: Math.max(1, Math.ceil(total / (limit || 1))),
		},
	});
}

/* ================================================================== *
 * Shift Reporting (shiftApi.ts → /shift/*, /ops/getHora)
 * ================================================================== */

/** GET /shift/getFullShiftDetails — Shift Reporting Listing accordion. */
function getFullShiftDetails(req: MockRequest) {
	const cityId = parseInt(req.query.city_id || '1', 10) || 1;
	const city = cityById(cityId);
	const shiftDate = req.query.shift_date || isoDate(TODAY);

	const rng = seeded(`shift-full-${cityId}-${shiftDate}`);
	const count = rng.int(2, 3);

	const data = Array.from({ length: count }, (_, i) => {
		const shiftTime = SHIFT_TIMES[i % SHIFT_TIMES.length];
		const checkedIn = rng.bool(0.9);
		const checkedOut = checkedIn && rng.bool(0.6);

		const checkInDate = new Date(`${shiftDate}T${String(6 + i * 8).padStart(2, '0')}:05:00Z`);
		const checkOutDate = new Date(`${shiftDate}T${String(14 + i * 8).padStart(2, '0')}:10:00Z`);

		const resourceCount = rng.int(3, 6);
		const resourcesInfo = Array.from({ length: resourceCount }, (__, r) => {
			const status = rng.pick(OPS_STATUSES);
			const needsEscalation = status === 'Shortage' || status === 'Non-Functional';
			return {
				shiftResourceId: r + 1,
				shiftResourceName: rng.pick([
					'Washing Line A',
					'Washing Line B',
					'Sorting Station',
					'Loading Bay',
					'Cold Room',
					'Drying Rack',
					'Conveyor 1',
					'Conveyor 2',
				]),
				resourceStatusId: OPS_STATUSES.indexOf(status) + 1,
				resourceStatus: status,
				escalationManagerId: needsEscalation ? rng.int(1, 4) : null,
				escalationManager: needsEscalation ? fullName(rng) : null,
			};
		});

		const manpower = checkedOut ? rng.int(8, 25) : null;
		const shiftHours = checkedOut ? 8 : null;
		const otHours = checkedOut ? rng.int(0, 3) : null;
		const manHours =
			checkedOut && manpower != null ? manpower * (shiftHours! + (otHours || 0)) : null;
		const washedSku = checkedOut ? rng.int(2000, 9000) : null;
		const efficiency =
			checkedOut && washedSku != null && manHours != null && manHours > 0
				? +(washedSku / manHours).toFixed(2)
				: null;

		const containerCount = rng.int(3, CONTAINER_TYPES.length);
		const containerTypes = rng.picks(CONTAINER_TYPES, containerCount);
		const containersInfo = checkedOut
			? containerTypes.map(ct => {
					const cnt = rng.int(100, 2500);
					const weight = rng.float(0.2, 2.5, 2);
					return {
						container_type_id: ct.id,
						sku: ct.name,
						count: cnt,
						containerWeight: weight.toFixed(2),
						weightedCount: (cnt * weight).toFixed(2),
					};
				})
			: [];

		return {
			shiftId: cityId * 100 + i + 1,
			city: city.name,
			facility: `${city.name} ${rng.pick(['Central', 'North', 'East', 'Hub'])} Facility`,
			shiftTime,
			supervisor: fullName(rng),
			checkInTime: checkedIn ? isoDateTime(checkInDate) : null,
			checkOutTime: checkedOut ? isoDateTime(checkOutDate) : null,
			shiftDate,
			resourcesInfo,
			checkout: {
				manpowerCount: manpower,
				shiftHours,
				OTHours: otHours,
				manHours,
				washedSkuCount: washedSku,
				washingEfficiency: efficiency,
				totalCount: containersInfo.reduce((s, c) => s + c.count, 0),
				weightedCount: +containersInfo
					.reduce((s, c) => s + parseFloat(c.weightedCount), 0)
					.toFixed(2),
			},
			containersInfo,
		};
	});

	return ok(data);
}

/** GET /ops/getHora — time-slot (Hora) options for Add Shift. */
function getHora() {
	return {
		status_code: 200,
		status: 'Success',
		message: 'Success',
		result: [
			{ id: 1, name: 'Morning (6 AM - 2 PM)' },
			{ id: 2, name: 'Evening (2 PM - 10 PM)' },
			{ id: 3, name: 'Night (10 PM - 6 AM)' },
		],
	};
}

/** GET /shift/getShiftStatusByDate — check-in/out status for a date+hora. */
function getShiftStatusByDate(req: MockRequest) {
	const horaId = parseInt(req.query.hora_id || '1', 10) || 1;
	const shiftDate = req.query.shift_date || isoDate(TODAY);
	const rng = seeded(`shift-status-${shiftDate}-${horaId}`);

	// Mix of states so the Add flow can exercise new / check-out-pending paths.
	const roll = rng.int(0, 2);
	let shifts: Array<Record<string, unknown>> = [];
	if (roll === 0) {
		shifts = []; // brand-new shift → check-in mode
	} else {
		const checkIn = `${shiftDate} ${String(6 + (horaId - 1) * 8).padStart(2, '0')}:05:00`;
		const completed = roll === 2;
		shifts = [
			{
				shift_id: 5000 + horaId,
				hora_id: horaId,
				shift_type: SHIFT_TIMES[(horaId - 1) % SHIFT_TIMES.length],
				check_in: checkIn,
				check_out: completed
					? `${shiftDate} ${String(14 + (horaId - 1) * 8).padStart(2, '0')}:10:00`
					: null,
				status: completed ? 'Completed' : 'In Progress',
			},
		];
	}

	return { status: 'Success', status_code: 200, message: 'Success', shifts };
}

/** GET /shift/getFacilityResources — paginated facility resources. */
function getFacilityResources(req: MockRequest) {
	const cityId = parseInt(req.query.city_id || '1', 10) || 1;
	const all = list(
		14,
		(i, rng) => {
			const name = rng.pick([
				'Washing Line A',
				'Washing Line B',
				'Sorting Station',
				'Loading Bay',
				'Cold Room',
				'Drying Rack',
				'Conveyor 1',
				'Conveyor 2',
				'Steam Unit',
				'RO Plant',
				'Forklift 1',
				'Packing Table',
				'QC Bench',
				'Dispatch Dock',
			]);
			const creator = fullName(rng);
			const created = dateAgo(rng.int(30, 400));
			return {
				id: cityId * 100 + i + 1,
				name: `${name} ${i + 1}`,
				city_id: cityId,
				created_by: rng.int(1, 50),
				updated_by: rng.int(1, 50),
				status: rng.bool(0.85) ? 'Active' : 'Inactive',
				created_by_name: creator,
				updated_by_name: fullName(rng),
				created_at: timestamp(created),
				updated_at: timestamp(dateAgo(rng.int(0, 20))),
			};
		},
		`facility-resources-${cityId}`
	);

	const { slice, page, limit, total } = paginate(all, req.query);
	return {
		status: 'Success',
		status_code: 200,
		data: slice,
		pagination: {
			page,
			limit,
			totalItems: total,
			totalPages: Math.max(1, Math.ceil(total / limit)),
		},
	};
}

/** GET /shift/getOpsStatusValues — resource ops-status options. */
function getOpsStatusValues() {
	return {
		status: 'Success',
		status_code: 200,
		data: OPS_STATUSES.map((name, i) => ({
			id: i + 1,
			name,
			created_by_name: 'System',
			updated_by_name: 'System',
			created_at: timestamp(dateAgo(200)),
			updated_at: timestamp(dateAgo(10)),
		})),
	};
}

/** GET /shift/getEscalationManagers — escalation manager options. */
function getEscalationManagers() {
	return {
		status: 'Success',
		status_code: 200,
		data: list(
			6,
			(i, rng) => ({
				id: i + 1,
				name: fullName(rng),
				created_by_name: 'System',
				updated_by_name: 'System',
				created_at: timestamp(dateAgo(200)),
				updated_at: timestamp(dateAgo(15)),
			}),
			'escalation-managers'
		),
	};
}

/* ================================================================== *
 * Complaint Types (complaintTypeApi.ts → /transit-plan/*ComplaintType*)
 * Also surfaced as QC rejection reasons.
 * ================================================================== */

function getComplaintTypes(req: MockRequest) {
	const statusFilter = req.query.status; // '1' active, '0' inactive
	let items = REJECTION_REASONS.map((r, i) => ({
		id: r.id,
		name: r.name,
		status: i % 7 === 6 ? 'Inactive' : 'Active',
		created_by: 1,
		updated_by: 1,
		created_at: timestamp(dateAgo(180 - i)),
		updated_at: timestamp(dateAgo(20)),
	}));

	if (statusFilter === '1') items = items.filter(i => i.status === 'Active');
	else if (statusFilter === '0') items = items.filter(i => i.status === 'Inactive');

	const { slice, page, limit, total } = paginate(items, req.query);
	return {
		status_code: 200,
		status: 'Success',
		data: slice,
		pagination: {
			page,
			limit,
			totalItems: total,
			totalPages: Math.max(1, Math.ceil(total / limit)),
		},
	};
}

function getComplaintTypeById(req: MockRequest) {
	const id = parseInt(req.params.id || '1', 10) || 1;
	const base = REJECTION_REASONS.find(r => r.id === id) || REJECTION_REASONS[0];
	return {
		status_code: 200,
		status: 'Success',
		data: {
			id: base.id,
			name: base.name,
			status: 'Active',
			created_by: 1,
			updated_by: 1,
			created_at: timestamp(dateAgo(120)),
			updated_at: timestamp(dateAgo(10)),
		},
	};
}

/* ================================================================== *
 * QC Rejection (transitPlanApi.ts → /transit-plan/*, /inventory/getClientSkuMap)
 * ================================================================== */

/** GET /transit-plan/getQCRejections — QC Rejection listing for a transit date. */
function getQCRejections(req: MockRequest) {
	const transitDate = req.query.transit_date || isoDate(TODAY);
	const filterClientId = req.query.client_id ? parseInt(req.query.client_id, 10) : undefined;
	const rng = seeded(`qc-rej-${transitDate}-${filterClientId ?? 'all'}`);

	let clients = clientsForCity(1);
	if (filterClientId) {
		const found = clients.find(c => c.clientId === filterClientId);
		clients = found ? [found] : [{ clientId: filterClientId, clientName: 'Demo Client' }];
	} else {
		clients = clients.slice(0, rng.int(6, 10));
	}

	const data: Record<string, unknown>[] = [];
	let idSeq = 1;
	for (const c of clients) {
		const lines = rng.int(1, 4);
		for (let l = 0; l < lines; l++) {
			const ct = rng.pick(CONTAINER_TYPES);
			const reason = rng.pick(REJECTION_REASONS);
			const updatedBy = fullName(rng);
			data.push({
				id: idSeq,
				runId: 9000 + idSeq,
				transitId: `TR-${transitDate.replace(/-/g, '')}-${String(idSeq).padStart(3, '0')}`,
				transitDate,
				transitTime: rng.pick(['08:30', '11:00', '14:15', '18:45', '21:30']),
				containerTypeId: ct.id,
				containerTypeName: ct.name,
				reasonId: reason.id,
				reasonName: reason.name,
				rejectedCount: rng.int(1, 60),
				createdBy: rng.int(1, 50),
				createdByName: updatedBy,
				updatedBy: rng.int(1, 50),
				updatedByName: updatedBy,
				createdAt: timestamp(dateAgo(rng.int(0, 3))),
				updatedAt: timestamp(dateAgo(rng.int(0, 2))),
				hasEntered: 'Yes',
				clientId: c.clientId,
				clientName: c.clientName,
			});
			idSeq++;
		}
	}

	return { status: 'Success', status_code: 200, data };
}

/** GET /transit-plan/getQCRejectionsWeekOverWeek — per-client WoW trend. */
function getQCRejectionsWeekOverWeek(req: MockRequest) {
	const cityId = req.query.city_id ? parseInt(req.query.city_id, 10) : 1;
	const filterClientId = req.query.client_id ? parseInt(req.query.client_id, 10) : undefined;
	const rng = seeded(`qc-wow-${req.query.anchor_date || ''}-${cityId}-${filterClientId ?? 'all'}`);

	let clients = clientsForCity(cityId);
	if (filterClientId) {
		const found = clients.find(c => c.clientId === filterClientId);
		clients = found ? [found] : [{ clientId: filterClientId, clientName: 'Demo Client' }];
	}

	const data = clients.map(c => {
		const thisWeek = rng.int(0, 120);
		const lastWeek = rng.int(0, 120);
		const delta = thisWeek - lastWeek;
		const deltaPct: number | null =
			lastWeek === 0 ? null : +((delta / lastWeek) * 100).toFixed(1);
		return {
			clientId: c.clientId,
			clientName: c.clientName,
			cityId,
			thisWeekRejected: thisWeek,
			lastWeekRejected: lastWeek,
			delta,
			deltaPct,
		};
	});

	return { status: 'Success', status_code: 200, data };
}

/** GET /transit-plan/getQcRuns — QC runs for the Add page. */
function getQcRuns(req: MockRequest) {
	const transitDate = req.query.transit_date || isoDate(TODAY);
	const filterClientId = req.query.client_id ? parseInt(req.query.client_id, 10) : undefined;
	const rng = seeded(`qc-runs-${transitDate}-${filterClientId ?? 'all'}`);
	const city = cityById(1);

	let clients = clientsForCity(1);
	if (filterClientId) {
		const found = clients.find(c => c.clientId === filterClientId);
		clients = found ? [found] : [{ clientId: filterClientId, clientName: 'Demo Client' }];
	}

	const data: Record<string, unknown>[] = [];
	let idSeq = 1;
	for (const c of clients) {
		const runs = rng.int(1, 3);
		for (let r = 0; r < runs; r++) {
			data.push({
				id: 9000 + idSeq,
				transit_id: `TR-${transitDate.replace(/-/g, '')}-${String(idSeq).padStart(3, '0')}`,
				transit_date: transitDate,
				transit_time: rng.pick(['08:30', '11:00', '14:15', '18:45', '21:30']),
				client_id: c.clientId,
				clientName: c.clientName,
				city_id: city.id,
				cityName: city.name,
				hasEntered: rng.bool(0.5) ? 'Yes' : 'No',
			});
			idSeq++;
		}
	}

	return { status: 'Success', status_code: 200, data };
}

/** GET /transit-plan/getQcReportAdherence — adherence summary stats. */
function getQcReportAdherence(req: MockRequest) {
	const startDate = req.query.start_date || isoDate(dateAgo(6));
	const endDate = req.query.end_date || isoDate(TODAY);
	const rng = seeded(`qc-adherence-${startDate}-${endDate}`);

	// Build a daily series across the (typically single-day) range.
	const start = new Date(`${startDate}T00:00:00Z`);
	const end = new Date(`${endDate}T00:00:00Z`);
	const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);

	const daily = Array.from({ length: days }, (_, i) => {
		const d = new Date(start);
		d.setUTCDate(d.getUTCDate() + i);
		const total = rng.int(10, 40);
		const submitted = rng.int(Math.floor(total * 0.5), total);
		return {
			date: isoDate(d),
			submitted,
			total,
			adherence: +((submitted / total) * 100).toFixed(2),
		};
	});

	const totalRuns = daily.reduce((s, d) => s + d.total, 0);
	const totalSubmitted = daily.reduce((s, d) => s + d.submitted, 0);

	return {
		status: 'Success',
		status_code: 200,
		data: {
			cityId: 1,
			startDate,
			endDate,
			daily,
			total: {
				total: totalRuns,
				submitted: totalSubmitted,
				adherence: +((totalSubmitted / Math.max(1, totalRuns)) * 100).toFixed(2),
			},
		},
	};
}

/** GET /inventory/getClientSkuMap — SKU rows for the QC rejection details grid. */
function getClientSkuMap(req: MockRequest) {
	const clientId = parseInt(req.query.clientId || '0', 10) || 0;
	const cityId = Math.max(1, Math.floor(clientId / 100));
	const client =
		clientsForCity(cityId).find(c => c.clientId === clientId) || {
			clientId,
			clientName: 'Demo Client',
		};

	const rng = seeded(`client-sku-map-${clientId}`);
	const types = rng.picks(CONTAINER_TYPES, rng.int(4, CONTAINER_TYPES.length));

	const result = types.map(ct => ({
		clientName: client.clientName,
		price: String(rng.int(8, 45)),
		clientId: client.clientId,
		containerType: ct.name,
		containerTypeId: ct.id,
		status: 'Active',
		platesWashedPerCycleByClient: rng.int(20, 60),
		distanceFromWarehouse: rng.int(2, 40),
		srcingDistance: rng.int(2, 40),
		weight_bagasse: String(rng.float(0.1, 0.5, 2)),
		srcQtyTransportedOneTripEv: rng.int(200, 800),
		qtyTransportedOneTrip: rng.int(200, 800),
		numberOfClamshell: rng.int(1, 4),
		electricityConsumedPerCycle: String(rng.float(0.5, 3, 2)),
		waterConsumedPerCycle: rng.int(2, 10),
		disposableWeight: rng.int(1, 5),
		combine_sku: 0,
		impactId: rng.int(1, 5),
		impactName: rng.pick(UNITS),
	}));

	return { status: 'Success', status_code: 200, result };
}

/* ================================================================== *
 * Escalation Type (transitPlanApi.ts → /ops/*EscalationType*)
 * ================================================================== */

function getEscalationType(req: MockRequest) {
	const statusFilter = req.query.status; // '1' active, '0' inactive
	let items = ESCALATION_TYPES.map((e, i) => {
		const active = !(i % 6 === 5);
		return {
			id: e.id,
			name: e.name,
			status: active ? 1 : 0,
			status_name: active ? 'Active' : 'Inactive',
			created_by: 1,
			updated_by: 1,
			created_at: timestamp(dateAgo(160 - i)),
			updated_at: timestamp(dateAgo(15)),
		};
	});

	if (statusFilter === '1') items = items.filter(i => i.status === 1);
	else if (statusFilter === '0') items = items.filter(i => i.status === 0);

	const { slice, page, limit, total } = paginate(items, req.query);
	return {
		status_code: 200,
		status: 'Success',
		data: slice,
		pagination: {
			page,
			limit,
			totalItems: total,
			totalPages: Math.max(1, Math.ceil(total / limit)),
		},
	};
}

/* ================================================================== *
 * Client Escalation (transitPlanApi.ts → /ops/getEscalation, add/edit)
 * ================================================================== */

function getEscalation(req: MockRequest) {
	const startDate = req.query.startDate || isoDate(dateAgo(30));
	const endDate = req.query.endDate || isoDate(TODAY);
	const facilityId = req.query.facility_id ? parseInt(req.query.facility_id, 10) : undefined;
	const cityId = 1;
	const city = cityById(cityId);
	const clients = clientsForCity(cityId);

	const all = list(
		28,
		(i, r) => {
			const client = r.pick(clients);
			const etype = r.pick(ESCALATION_TYPES);
			const status = r.pick(RESOLUTION_STATUSES);
			const ct = r.pick(CONTAINER_TYPES);
			const escDate = dateAgo(r.int(0, 28));
			const isResolved = status === 'Resolved';
			const fid = facilityId || r.int(1, 5);
			return {
				id: 7000 + i + 1,
				escalation_date: isoDate(escDate),
				client_id: client.clientId,
				client_name: client.clientName,
				containerTypeId: ct.id,
				containerType: ct.name,
				escalation_type_id: etype.id,
				escalation_type: etype.name,
				resolution: isResolved
					? r.pick(['Replaced batch', 'Credit note issued', 'Driver counselled', 'Process fixed'])
					: null,
				resolution_status: status,
				resolutionStatusId: RESOLUTION_STATUSES.indexOf(status) + 1,
				details: r.pick([
					'Client reported damaged crates on morning delivery.',
					'Short by 12 units against the dispatch challan.',
					'Temperature log showed a 20-minute excursion in transit.',
					'Hygiene complaint on returned containers.',
					'Invoice mismatch flagged by client finance team.',
				]),
				raised_by: fullName(r),
				client_designation: r.pick([
					'Ops Manager',
					'Procurement Lead',
					'Store Incharge',
					'QC Head',
				]),
				facility_id: fid,
				facility: `${city.name} ${r.pick(['Central', 'North', 'East', 'Hub'])} Facility`,
				created_by_name: fullName(r),
				updated_by_name: fullName(r),
				created_date: timestamp(escDate),
				updated_date: timestamp(dateAgo(r.int(0, 5))),
				sku: ct.id,
			};
		},
		`escalations-list-${startDate}-${endDate}-${facilityId ?? 'all'}`
	);

	const filtered = facilityId ? all.filter(e => e.facility_id === facilityId) : all;
	const { slice, page, limit, total } = paginate(filtered, req.query);

	// Aggregates the listing header consumes.
	const statusCount = filtered.reduce<Record<string, number>>((acc, e) => {
		const key = e.resolution_status;
		acc[key] = (acc[key] || 0) + 1;
		return acc;
	}, {});

	return {
		status_code: 200,
		status: 'Success',
		data: slice,
		totalEscalations: total,
		statusCount,
		totalEscalationWeekWise: {},
		totalEscalationClientWiseByWeek: {},
		pagination: {
			page,
			limit,
			totalItems: total,
			totalPages: Math.max(1, Math.ceil(total / limit)),
		},
	};
}

/* ================================================================== *
 * Generic mutation success envelopes (POST / PUT / PATCH / DELETE)
 * ================================================================== */

/** Standard success envelope for mutating endpoints (matches multiple service shapes). */
function mutationOk(message: string, data?: Record<string, unknown>) {
	return {
		status_code: 200,
		statusCode: 200,
		status: 'Success',
		message,
		...(data ? { data } : {}),
	};
}

/* ================================================================== *
 * Route table — detail/param routes ABOVE list routes.
 * ================================================================== */

export const routes: MockRoute[] = [
	/* ---- KAM inventory (kamApi /billing/*) ---- */
	{
		method: 'GET',
		pattern: /^\/billing\/getInventoryClientPlan$/,
		handler: getInventoryClientPlan,
	},
	{
		method: 'GET',
		pattern: /^\/billing\/getEverydayClientInventoryValues$/,
		handler: getEverydayClientInventoryValues,
	},
	{
		method: 'GET',
		pattern: /^\/billing\/getEverydayClientInventory$/,
		handler: getEverydayClientInventory,
	},
	{
		method: 'PUT',
		pattern: /^\/billing\/updateEverydayClientInventory$/,
		handler: () => mutationOk('Inventory updated successfully'),
	},

	/* ---- Shift reporting (shiftApi /shift/*, /ops/getHora) ---- */
	{ method: 'GET', pattern: /^\/shift\/getFullShiftDetails$/, handler: getFullShiftDetails },
	{ method: 'GET', pattern: /^\/shift\/getShiftStatusByDate$/, handler: getShiftStatusByDate },
	{ method: 'GET', pattern: /^\/shift\/getFacilityResources$/, handler: getFacilityResources },
	{ method: 'GET', pattern: /^\/shift\/getOpsStatusValues$/, handler: getOpsStatusValues },
	{ method: 'GET', pattern: /^\/shift\/getEscalationManagers$/, handler: getEscalationManagers },
	{ method: 'GET', pattern: /^\/ops\/getHora$/, handler: getHora },
	{
		method: 'POST',
		pattern: /^\/shift\/checkInShiftOpsStatus$/,
		handler: () => mutationOk('Shift and resources inserted successfully'),
	},
	{
		method: 'POST',
		pattern: /^\/shift\/checkOutShiftOpsStatus$/,
		handler: () => mutationOk('Shift checkout recorded successfully'),
	},
	{
		method: 'POST',
		pattern: /^\/shift\/addFacilityResource$/,
		handler: (req: MockRequest) =>
			mutationOk('Facility resource added successfully', {
				id: seeded(JSON.stringify(req.body || {})).id(),
				name: (req.body && req.body.name) || 'New Resource',
			}),
	},
	{
		method: 'PUT',
		pattern: /^\/shift\/updateFacilityResource$/,
		handler: () => mutationOk('Facility resource updated successfully'),
	},

	/* ---- Complaint types (complaintTypeApi /transit-plan/*ComplaintType*) ---- */
	{ method: 'GET', pattern: /^\/transit-plan\/getComplaintTypes$/, handler: getComplaintTypes },
	{
		method: 'GET',
		pattern: /^\/transit-plan\/getComplaintType\/(?<id>\d+)$/,
		handler: getComplaintTypeById,
	},
	{
		method: 'POST',
		pattern: /^\/transit-plan\/createComplaintType$/,
		handler: (req: MockRequest) =>
			mutationOk('Complaint type created successfully', {
				id: seeded(JSON.stringify(req.body || {})).id(),
			}),
	},
	{
		method: 'PUT',
		pattern: /^\/transit-plan\/updateComplaintType\/(?<id>\d+)$/,
		handler: () => mutationOk('Complaint type updated successfully'),
	},
	{
		method: 'DELETE',
		pattern: /^\/transit-plan\/deleteComplaintType\/(?<id>\d+)$/,
		handler: () => mutationOk('Complaint type deleted successfully'),
	},

	/* ---- QC rejection (transitPlanApi /transit-plan/*) ---- */
	{
		method: 'GET',
		pattern: /^\/transit-plan\/getQCRejectionsWeekOverWeek$/,
		handler: getQCRejectionsWeekOverWeek,
	},
	{ method: 'GET', pattern: /^\/transit-plan\/getQCRejections$/, handler: getQCRejections },
	{ method: 'GET', pattern: /^\/transit-plan\/getQcRuns$/, handler: getQcRuns },
	{ method: 'GET', pattern: /^\/transit-plan\/getQcReportAdherence$/, handler: getQcReportAdherence },
	{
		method: 'POST',
		pattern: /^\/transit-plan\/qcRejections\/(?<runId>\d+)$/,
		handler: () => mutationOk('QC Rejection data submitted successfully'),
	},

	/* ---- Client SKU map (skuApi, used by QC details grid) ---- */
	{ method: 'GET', pattern: /^\/inventory\/getClientSkuMap$/, handler: getClientSkuMap },

	/* ---- Escalation types (transitPlanApi /ops/*EscalationType*) ---- */
	{ method: 'GET', pattern: /^\/ops\/getEscalationType$/, handler: getEscalationType },
	{
		method: 'POST',
		pattern: /^\/ops\/addEscalationType$/,
		handler: () => mutationOk('Escalation type created successfully'),
	},
	{
		method: 'PUT',
		pattern: /^\/ops\/updateEscalationType$/,
		handler: () => mutationOk('Escalation type updated successfully'),
	},
	{
		method: 'DELETE',
		pattern: /^\/ops\/deleteEscalationType$/,
		handler: () => mutationOk('Escalation type deleted successfully'),
	},

	/* ---- Client escalation (transitPlanApi /ops/getEscalation, add/edit) ---- */
	{ method: 'GET', pattern: /^\/ops\/getEscalation$/, handler: getEscalation },
	{
		method: 'POST',
		pattern: /^\/ops\/addClientEscalation$/,
		handler: () => mutationOk('Client escalation added successfully'),
	},
	{
		method: 'PUT',
		pattern: /^\/ops\/editClientEscalation$/,
		handler: () => mutationOk('Client escalation updated successfully'),
	},
];
