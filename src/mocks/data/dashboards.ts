/**
 * Mock routes: dashboards (LOCAL DEMO ONLY)
 * --------------------------------------------------------------------------
 * Covers the three dashboard-family service layers so the React/Vite demo
 * renders fully with NO backend:
 *
 *   1. dashboardApi.ts        -> /dashboard/*            (standard `ok()` envelope)
 *   2. opsDashboardApi.ts     -> /inventory/*, /transit-plan/*, /shift/*
 *                                (FLAT shape: status_code/totalDays at top level)
 *   3. cityKpiApi.ts          -> /city-kpi/*             (FLAT { status, status_code, data })
 *
 * All numbers use an Indian cold-chain / logistics B2B SaaS context (revenue in
 * ₹, city-wise breakdowns from CITIES, sensible percentages and trends).
 *
 * NOTE: the mock adapter strips the query string before matching, so paths like
 * `/inventory/getKAMEodReport?city_ids=3&...` are matched as `/inventory/getKAMEodReport`.
 * The original query params remain available via `req.query`.
 */

import { MockRoute, MockRequest } from '../mockTypes';
import {
	ok,
	seeded,
	list,
	CITIES,
	CityRef,
	COMPANIES,
	fullName,
	company,
	isoDate,
	isoDateTime,
	dateAgo,
	lastNDates,
	lastNMonths,
	TODAY,
} from '../mockHelpers';

/* ------------------------------------------------------------------ *
 * Shared helpers
 * ------------------------------------------------------------------ */

const pct = (num: number, den: number): string =>
	`${den > 0 ? ((num / den) * 100).toFixed(2) : '0.00'}%`;

/**
 * Resolve which cities a request targets from `city_ids` (comma-separated or
 * single). Absent / empty => "All" cities.
 */
function citiesFromQuery(query: Record<string, string>): CityRef[] {
	const raw = (query.city_ids ?? '').trim();
	if (!raw) return [...CITIES];
	const ids = raw
		.split(',')
		.map(s => parseInt(s.trim(), 10))
		.filter(n => Number.isFinite(n));
	const picked = CITIES.filter(c => ids.includes(c.id));
	return picked.length ? picked : [...CITIES];
}

/** Days (oldest-first ISO) covered by the request, defaulting to the last 7. */
function rangeDates(query: Record<string, string>, fallbackN = 7): string[] {
	const start = query.start_date;
	const end = query.end_date;
	if (start && end) {
		const s = new Date(start + 'T00:00:00Z');
		const e = new Date(end + 'T00:00:00Z');
		if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime())) {
			const out: string[] = [];
			const cur = new Date(s);
			// cap at 31 days so the demo stays snappy
			for (let i = 0; i < 31 && cur.getTime() <= e.getTime(); i++) {
				out.push(isoDate(new Date(cur)));
				cur.setUTCDate(cur.getUTCDate() + 1);
			}
			if (out.length) return out;
		}
	}
	return lastNDates(fallbackN);
}

/* ================================================================== *
 * 1) dashboardApi.ts  ->  /dashboard/*   (standard `ok()` envelope)
 * ================================================================== */

function dashboardStats(req: MockRequest) {
	const rng = seeded(req.path);
	const totalUsers = rng.int(4200, 9800);
	return ok({
		totalUsers,
		activeUsers: Math.round(totalUsers * rng.float(0.55, 0.78)),
		totalRevenue: rng.int(48_00_00_000, 72_00_00_000), // ₹48Cr–₹72Cr
		monthlyRevenue: rng.int(4_20_00_000, 6_80_00_000), // ₹4.2Cr–₹6.8Cr
		growthRate: rng.float(6.5, 24.5, 1),
		conversionRate: rng.float(2.1, 7.8, 1),
	});
}

function revenueChart(req: MockRequest) {
	const months = lastNMonths(12);
	const rng = seeded(req.path);
	let base = rng.int(3_60_00_000, 4_40_00_000);
	const data = months.map(() => {
		base = Math.round(base * rng.float(0.94, 1.16));
		return base;
	});
	return ok({
		labels: months.map(m => m.label),
		datasets: [
			{
				label: 'Revenue (₹)',
				data,
				backgroundColor: 'rgba(59, 130, 246, 0.2)',
				borderColor: '#3b82f6',
				fill: true,
			},
		],
	});
}

function userGrowthChart(req: MockRequest) {
	const months = lastNMonths(12);
	const rng = seeded(req.path);
	let active = rng.int(2800, 3600);
	let churned = rng.int(120, 240);
	const newUsers = months.map(() => rng.int(180, 620));
	const activeSeries = months.map(() => {
		active = Math.round(active * rng.float(1.01, 1.09));
		return active;
	});
	const churnSeries = months.map(() => {
		churned = Math.round(churned * rng.float(0.85, 1.12));
		return churned;
	});
	return ok({
		labels: months.map(m => m.label),
		datasets: [
			{
				label: 'New Clients',
				data: newUsers,
				borderColor: '#22c55e',
				backgroundColor: 'rgba(34,197,94,0.2)',
				fill: false,
			},
			{
				label: 'Active Clients',
				data: activeSeries,
				borderColor: '#3b82f6',
				backgroundColor: 'rgba(59,130,246,0.2)',
				fill: false,
			},
			{
				label: 'Churned',
				data: churnSeries,
				borderColor: '#ef4444',
				backgroundColor: 'rgba(239,68,68,0.2)',
				fill: false,
			},
		],
	});
}

function conversionFunnel(req: MockRequest) {
	const rng = seeded(req.path);
	const visitors = rng.int(9000, 14000);
	const leads = Math.round(visitors * rng.float(0.28, 0.4));
	const trials = Math.round(leads * rng.float(0.4, 0.55));
	const onboarded = Math.round(trials * rng.float(0.45, 0.65));
	const active = Math.round(onboarded * rng.float(0.6, 0.8));
	return ok({
		labels: ['Enquiries', 'Qualified Leads', 'Pilot Trials', 'Onboarded', 'Active Clients'],
		datasets: [
			{
				label: 'Clients',
				data: [visitors, leads, trials, onboarded, active],
				backgroundColor: '#6366f1',
				borderColor: '#4f46e5',
			},
		],
	});
}

function recentActivities(req: MockRequest) {
	const limit = Math.max(1, parseInt(req.query.limit || '10', 10) || 10);
	const types = ['user_registration', 'payment', 'login', 'system_event'] as const;
	const activities = list(
		limit,
		(_i, rng) => {
			const type = rng.pick(types);
			const cl = company(rng);
			const titleMap: Record<(typeof types)[number], string> = {
				user_registration: 'New client onboarded',
				payment: 'Invoice payment received',
				login: 'KAM signed in',
				system_event: 'Transit plan auto-generated',
			};
			const descMap: Record<(typeof types)[number], string> = {
				user_registration: `${cl} completed onboarding for cold-chain crates`,
				payment: `${cl} paid invoice of ₹${rng.int(40, 320)},000`,
				login: `${fullName(rng)} accessed the ops dashboard`,
				system_event: `${rng.int(4, 18)} dispatch plans generated for ${rng.pick(CITIES).name}`,
			};
			return {
				id: rng.uuid(),
				type,
				title: titleMap[type],
				description: descMap[type],
				timestamp: isoDateTime(TODAY),
				userId: rng.id(),
				metadata: { city: rng.pick(CITIES).name },
			};
		},
		req.path
	).map((a, i) => ({
		// spread timestamps across the last few hours so the feed looks live
		...a,
		timestamp: isoDateTime(new Date(TODAY.getTime() - i * 5 * 3600 * 1000)),
	}));
	return ok(activities);
}

function topMetrics(req: MockRequest) {
	const names = [
		'Plastic Saved (kg)',
		'Crates Cycled',
		'On-time Dispatch %',
		'Avg Transit Delay (hrs)',
		'QC Pass Rate %',
		'Water Efficiency (L/crate)',
	];
	const metrics = list(
		6,
		(i, rng) => ({
			id: i + 1,
			name: names[i % names.length],
			value: rng.int(1200, 98000),
			change: rng.float(-8, 22, 1),
			changeType: rng.bool(0.7) ? 'increase' : 'decrease',
			period: 'vs last month',
		}),
		req.path
	);
	return ok(metrics);
}

function geographicData(req: MockRequest) {
	const data = CITIES.map(c => {
		const rng = seeded(`${req.path}:${c.id}`);
		return {
			id: c.id,
			city: c.name,
			state: c.state,
			region: c.state,
			clients: rng.int(8, 64),
			revenue: rng.int(35_00_000, 1_60_00_000),
			cratesCycled: rng.int(4200, 38000),
			share: rng.float(2.5, 18.5, 1),
			lat: 0,
			lng: 0,
		};
	});
	return ok(data);
}

function realTimeMetrics(req: MockRequest) {
	const rng = seeded(`${req.path}:rt`);
	return ok({
		activeShifts: rng.int(6, 18),
		dispatchesInTransit: rng.int(40, 180),
		cratesOnRoad: rng.int(900, 4200),
		liveTemperatureBreaches: rng.int(0, 4),
		onlineKAMs: rng.int(12, 48),
		throughputLastHour: rng.int(120, 640),
		timestamp: isoDateTime(TODAY),
	});
}

/* ================================================================== *
 * 2) opsDashboardApi.ts  ->  FLAT responses
 * ================================================================== */

function kamEodReport(req: MockRequest) {
	const cities = citiesFromQuery(req.query);
	const dates = rangeDates(req.query);
	const totalDays = dates.length;

	const dailyEntryStatus = dates.map(entry_date => ({
		entry_date,
		cities: cities.map(c => {
			const rng = seeded(`kam:${entry_date}:${c.id}`);
			const totalClients = rng.int(8, 28);
			const enteredClients = rng.int(Math.floor(totalClients * 0.45), totalClients);
			return {
				city_id: c.id,
				cityName: c.name,
				totalClients,
				enteredClients,
				percentage: pct(enteredClients, totalClients),
			};
		}),
	}));

	const citySummary = cities.map(c => {
		const rng = seeded(`kam-sum:${c.id}`);
		const daysEntered = rng.int(Math.max(1, totalDays - 2), totalDays);
		const avg = rng.float(62, 98, 2);
		return {
			city_id: c.id,
			cityName: c.name,
			totalDays,
			daysEntered,
			avgPercentage: `${avg.toFixed(2)}%`,
		};
	});

	const overallAvg =
		citySummary.reduce((s, c) => s + parseFloat(c.avgPercentage), 0) / (citySummary.length || 1);

	return {
		status: 'Success',
		status_code: 200,
		message: 'KAM EOD report fetched successfully',
		totalDays,
		dailyEntryStatus,
		overallEntryPercentage: `${overallAvg.toFixed(2)}%`,
		citySummary,
	};
}

function transitPlanSummary(req: MockRequest) {
	const cities = citiesFromQuery(req.query);
	const dates = rangeDates(req.query);
	const totalDays = dates.length;

	const buildBlock = (kind: 'sent' | 'received') => {
		const dailyEntryStatus = dates.map(entry_date => ({
			entry_date,
			cities: cities.map(c => {
				const rng = seeded(`tp-${kind}:${entry_date}:${c.id}`);
				const totalPlans = rng.int(6, 24);
				const donePlans = rng.int(Math.floor(totalPlans * 0.4), totalPlans);
				return {
					city_id: c.id,
					cityName: c.name,
					totalPlans,
					donePlans,
					percentage: pct(donePlans, totalPlans),
				};
			}),
		}));

		const citySummary = cities.map(c => {
			const rng = seeded(`tp-${kind}-sum:${c.id}`);
			const daysEntered = rng.int(Math.max(1, totalDays - 3), totalDays);
			const avg = rng.float(40, 96, 2);
			return {
				city_id: c.id,
				cityName: c.name,
				totalDays,
				daysEntered,
				avgPercentage: `${avg.toFixed(2)}%`,
			};
		});

		const overall =
			citySummary.reduce((s, c) => s + parseFloat(c.avgPercentage), 0) /
			(citySummary.length || 1);

		return {
			dailyEntryStatus,
			overallEntryPercentage: `${overall.toFixed(2)}%`,
			citySummary,
		};
	};

	return {
		status: 'Success',
		status_code: 200,
		message: 'Transit plan dispatch/pickup summary fetched successfully',
		sent: buildBlock('sent'),
		received: buildBlock('received'),
	};
}

function qcEodReport(req: MockRequest) {
	const cities = citiesFromQuery(req.query);
	const dates = rangeDates(req.query);
	const totalDays = dates.length;

	const dailyEntryStatus = dates.map(entry_date => ({
		entry_date,
		cities: cities.map(c => {
			const rng = seeded(`qc:${entry_date}:${c.id}`);
			const totalClients = rng.int(8, 26);
			const enteredClients = rng.int(Math.floor(totalClients * 0.5), totalClients);
			const b2bCount = rng.int(120, 640);
			const b2bRejected = rng.int(0, Math.floor(b2bCount * 0.08));
			return {
				city_id: c.id,
				cityName: c.name,
				totalClients,
				enteredClients,
				percentage: pct(enteredClients, totalClients),
				b2bCount,
				b2bRejected,
				b2bRejectedPercentage: pct(b2bRejected, b2bCount),
			};
		}),
	}));

	const citySummary = cities.map(c => {
		const rng = seeded(`qc-sum:${c.id}`);
		const daysEntered = rng.int(Math.max(1, totalDays - 2), totalDays);
		const avg = rng.float(70, 99, 2);
		const b2bCount = rng.int(900, 4200);
		const b2bRejected = rng.int(10, Math.floor(b2bCount * 0.06));
		return {
			city_id: c.id,
			cityName: c.name,
			totalDays,
			daysEntered,
			avgPercentage: `${avg.toFixed(2)}%`,
			totalRejected: b2bRejected,
			b2bCount,
			b2bRejected,
			b2bRejectedPercentage: pct(b2bRejected, b2bCount),
		};
	});

	const overall =
		citySummary.reduce((s, c) => s + parseFloat(c.avgPercentage), 0) / (citySummary.length || 1);

	return {
		status: 'Success',
		status_code: 200,
		message: 'QC EOD report fetched successfully',
		totalDays,
		overallEntryPercentage: `${overall.toFixed(2)}%`,
		dailyEntryStatus,
		citySummary,
	};
}

function dispatchDelayReport(req: MockRequest) {
	const cities = citiesFromQuery(req.query);
	const dates = rangeDates(req.query);
	const totalDays = dates.length;

	const dailyDelayResults = dates.map(entry_date => ({
		entry_date,
		cities: cities.map(c => {
			const rng = seeded(`dd:${entry_date}:${c.id}`);
			const clientCount = rng.int(2, 6);
			const clients = list(
				clientCount,
				(_ci, r) => {
					const recCount = r.int(1, 3);
					let clientDelay = 0;
					const records = Array.from({ length: recCount }, (_, idx) => {
						const delayHours = r.float(0.2, 9.5, 2);
						clientDelay += delayHours;
						const createdAt = isoDateTime(new Date(entry_date + 'T06:30:00Z'));
						return {
							facility_id: r.int(100, 480),
							facilityName: `${c.name} Hub ${idx + 1}`,
							transit_id: `TR-${c.id}${r.int(10000, 99999)}`,
							first_created_at: createdAt,
							avg_transit_time: r.float(3, 14, 2).toFixed(2),
							delayHours,
						};
					});
					return {
						client_id: r.id(),
						clientName: company(r),
						records,
						totalDelay: clientDelay.toFixed(2),
					};
				},
				`dd-clients:${entry_date}:${c.id}`
			);
			const totalDelayForAllClients = clients
				.reduce((s, cl) => s + parseFloat(cl.totalDelay), 0)
				.toFixed(2);
			const avgDelay = (parseFloat(totalDelayForAllClients) / (clients.length || 1)).toFixed(2);
			return {
				city_id: c.id,
				cityName: c.name,
				clients,
				totalClients: clients.length,
				totalDelayForAllClients,
				avgDelay,
			};
		}),
	}));

	const citySummary = cities.map(c => {
		const rng = seeded(`dd-sum:${c.id}`);
		const totalClients = rng.int(10, 40);
		const totalDelay = rng.float(40, 260, 2);
		return {
			city_id: c.id,
			cityName: c.name,
			totalClients,
			totalDelayForAllClients: totalDelay.toFixed(2),
			avgDelay: (totalDelay / totalClients).toFixed(2),
		};
	});

	return {
		status: 'Success',
		status_code: 200,
		message: 'Dispatch delay report fetched successfully',
		dailyDelayResults,
		citySummary,
		totalDays,
	};
}

interface MockShiftDay {
	shift: string;
	check_in: string | null;
	check_out: string | null;
	status: number;
	status_label: string;
	total_weight: number;
	total_count: number;
	man_hours: number;
	water_efficiency: number | null;
}

function shiftStatusReport(req: MockRequest) {
	const dates = rangeDates(req.query);
	const totalDays = dates.length;
	const shiftLabels = ['Pending', 'In Progress', 'Completed'];

	const mkShift = (kind: 'Day' | 'Night', date: string): MockShiftDay => {
		const rng = seeded(`shift:${kind}:${date}`);
		const filled = rng.bool(kind === 'Day' ? 0.82 : 0.64);
		const statusIdx = filled ? rng.int(1, 2) : 0;
		const checkIn = filled
			? `${kind === 'Day' ? '07' : '19'}:${String(rng.int(0, 59)).padStart(2, '0')}`
			: null;
		const checkOut =
			filled && statusIdx === 2
				? `${kind === 'Day' ? '15' : '03'}:${String(rng.int(0, 59)).padStart(2, '0')}`
				: null;
		return {
			shift: kind,
			check_in: checkIn,
			check_out: checkOut,
			status: statusIdx,
			status_label: shiftLabels[statusIdx],
			total_weight: filled ? rng.int(800, 4200) : 0,
			total_count: filled ? rng.int(120, 640) : 0,
			man_hours: filled ? rng.float(6, 9.5, 1) : 0,
			water_efficiency: filled ? rng.float(1.2, 3.8, 2) : null,
		};
	};

	const shift_report: Record<string, { Day: MockShiftDay; Night: MockShiftDay }> = {};
	let filledDay = 0;
	let filledNight = 0;
	let completedDay = 0;
	let completedNight = 0;
	let checkinOnly = 0;
	let checkoutOnly = 0;
	let both = 0;
	let dayWaterSum = 0;
	let dayWaterCount = 0;

	for (const date of dates) {
		const Day = mkShift('Day', date);
		const Night = mkShift('Night', date);
		shift_report[date] = { Day, Night };

		if (Day.status > 0) filledDay += 1;
		if (Night.status > 0) filledNight += 1;
		if (Day.status === 2) completedDay += 1;
		if (Night.status === 2) completedNight += 1;

		for (const s of [Day, Night]) {
			if (s.check_in && s.check_out) both += 1;
			else if (s.check_in) checkinOnly += 1;
			else if (s.check_out) checkoutOnly += 1;
		}
		if (Day.water_efficiency != null) {
			dayWaterSum += Day.water_efficiency;
			dayWaterCount += 1;
		}
	}

	const dayWaterEff = dayWaterCount ? +(dayWaterSum / dayWaterCount).toFixed(2) : 0;

	return {
		status: 'Success',
		status_code: 200,
		data: {
			summary: {
				total_days: totalDays,
				filled_day_shifts: filledDay,
				filled_night_shifts: filledNight,
				completeted_day_shifts: completedDay,
				completeted_night_shifts: completedNight,
				day_avg_fill_rate: totalDays ? +((filledDay / totalDays) * 100).toFixed(2) : 0,
				night_avg_fill_rate: totalDays ? +((filledNight / totalDays) * 100).toFixed(2) : 0,
				checkin_only: checkinOnly,
				checkout_only: checkoutOnly,
				both_checkin_and_checkout: both,
				cumulative_water_efficiency: dayWaterEff,
				day_water_efficiency: dayWaterEff,
				night_water_efficiency: null,
			},
			shift_report,
		},
	};
}

/* ================================================================== *
 * 3) cityKpiApi.ts  ->  /city-kpi/*   (FLAT { status, status_code, data })
 * ================================================================== */

function resolveKpiCity(query: Record<string, string>): CityRef {
	const cityId = parseInt(query.city_id || '', 10);
	const facilityId = parseInt(query.facility_id || '', 10);
	const byCity = CITIES.find(c => c.id === cityId);
	if (byCity) return byCity;
	if (Number.isFinite(facilityId)) {
		const byFac = CITIES.find(c => c.id === ((facilityId - 100) % CITIES.length) + 1);
		if (byFac) return byFac;
	}
	return CITIES[0];
}

/** Resolve the requested month (YYYY-MM) or default to the current month. */
function resolveMonth(query: Record<string, string>): {
	month: string;
	year: number;
	monthIdx: number;
	daysInMonth: number;
} {
	const raw = (query.month || '').trim();
	let year = TODAY.getUTCFullYear();
	let monthIdx = TODAY.getUTCMonth(); // 0-based
	const m = /^(\d{4})-(\d{2})$/.exec(raw);
	if (m) {
		year = parseInt(m[1], 10);
		monthIdx = parseInt(m[2], 10) - 1;
	}
	const daysInMonth = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();
	return {
		month: `${year}-${String(monthIdx + 1).padStart(2, '0')}`,
		year,
		monthIdx,
		daysInMonth,
	};
}

function cityKpiSummary(req: MockRequest) {
	const city = resolveKpiCity(req.query);
	const { month, year, monthIdx, daysInMonth } = resolveMonth(req.query);
	const facilityId = parseInt(req.query.facility_id || '', 10) || 100 + city.id;
	const rng = seeded(`citykpi:${city.id}:${month}`);

	// Is this the current (in-progress) month? Drives "to date" partial figures.
	const isCurrentMonth = year === TODAY.getUTCFullYear() && monthIdx === TODAY.getUTCMonth();
	const dayOfMonth = isCurrentMonth ? TODAY.getUTCDate() : daysInMonth;
	const monthFraction = dayOfMonth / daysInMonth;

	// Revenue vs target
	const target = rng.int(80_00_000, 1_60_00_000); // ₹80L–₹1.6Cr monthly
	const fullActual = Math.round(target * rng.float(0.82, 1.18));
	const actualToDate = Math.round(fullActual * monthFraction);
	const attainmentPct = target > 0 ? +((actualToDate / target) * 100).toFixed(1) : null;

	// Budget
	const hasBudget = rng.bool(0.85);
	const budget = hasBudget ? rng.int(55_00_000, 1_20_00_000) : 0;
	const actualSpend = hasBudget ? Math.round(budget * monthFraction * rng.float(0.85, 1.12)) : 0;
	const budgetUsedPct = hasBudget && budget > 0 ? +((actualSpend / budget) * 100).toFixed(1) : null;

	// EBITDA
	const ebitdaRevenue = actualToDate;
	const ebitdaPct = +rng.float(8, 26, 1);
	const ebitdaValue = Math.round((ebitdaRevenue * ebitdaPct) / 100);
	const targetIsDefault = rng.bool(0.5);
	const targetPct = targetIsDefault ? 15 : rng.int(12, 22);
	const gapPct = +(ebitdaPct - targetPct).toFixed(1);

	// QC week-over-week
	const thisWeekRejected = rng.int(20, 140);
	const lastWeekRejected = rng.int(20, 140);
	const qcDeltaPct =
		lastWeekRejected > 0
			? +(((thisWeekRejected - lastWeekRejected) / lastWeekRejected) * 100).toFixed(1)
			: null;
	const topClients = list(
		rng.int(4, 7),
		(_i, r) => {
			const tw = r.int(0, 40);
			const lw = r.int(0, 40);
			const delta = tw - lw;
			return {
				clientId: r.id(),
				clientName: r.pick(COMPANIES),
				thisWeekRejected: tw,
				lastWeekRejected: lw,
				delta,
				deltaPct: lw > 0 ? +(((tw - lw) / lw) * 100).toFixed(1) : null,
			};
		},
		`citykpi-qc:${city.id}:${month}`
	).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

	// Consistency (on-time data entry)
	const fyTotal = TODAY.getUTCMonth() + 1; // months elapsed (calendar proxy)
	const consistency = {
		thisMonth: { bucket: month, filled_pct: +rng.float(60, 100, 1) },
		last3Months: { onTime: rng.int(2, 3), total: 3 },
		fyToDate: { onTime: rng.int(Math.max(1, fyTotal - 3), fyTotal), total: fyTotal },
	};

	// Data freshness
	const daysStale = rng.int(0, 4);
	const lastEntryDate = isoDateTime(dateAgo(daysStale));

	const data = {
		city: { city_id: city.id, city_name: city.name, facility_id: facilityId },
		month,
		revenue: { target, actualToDate, attainmentPct },
		budget: { budget, actualSpend, budgetUsedPct, hasBudget },
		ebitda: {
			value: ebitdaValue,
			revenue: ebitdaRevenue,
			ebitdaPct,
			targetPct,
			targetIsDefault,
			gapPct,
		},
		qc: {
			thisWeekRejected,
			lastWeekRejected,
			deltaPct: qcDeltaPct,
			topClients,
		},
		consistency,
		dataFreshness: { lastEntryDate, daysStale },
		recommendations: [] as unknown[],
	};

	return { status: 'Success', status_code: 200, data };
}

function cityKpiRevenueBurnup(req: MockRequest) {
	const city = resolveKpiCity(req.query);
	const { month, year, monthIdx, daysInMonth } = resolveMonth(req.query);
	const rng = seeded(`burnup:${city.id}:${month}`);

	const target = rng.int(80_00_000, 1_60_00_000);
	const isCurrentMonth = year === TODAY.getUTCFullYear() && monthIdx === TODAY.getUTCMonth();
	const lastFilledDay = isCurrentMonth ? TODAY.getUTCDate() : daysInMonth;

	const targetPerDay = target / daysInMonth;
	let cumulative = 0;
	const series = Array.from({ length: daysInMonth }, (_, i) => {
		const dayNum = i + 1;
		const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
		const filled = dayNum <= lastFilledDay;
		// weekends a touch lighter
		const dow = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
		const weekendFactor = dow === 0 || dow === 6 ? 0.6 : 1;
		const dailyRevenue = filled ? Math.round(targetPerDay * rng.float(0.6, 1.4) * weekendFactor) : 0;
		if (filled) cumulative += dailyRevenue;
		return {
			day: dateStr,
			dailyRevenue,
			cumulativeRevenue: filled ? cumulative : 0,
			targetPaceCumulative: Math.round(targetPerDay * dayNum),
		};
	});

	const daysStale = isCurrentMonth ? Math.max(0, TODAY.getUTCDate() - lastFilledDay) : 0;

	return {
		status: 'Success',
		status_code: 200,
		data: {
			month,
			target,
			daysInMonth,
			series,
			dataFreshness: {
				lastEntryDate: isoDateTime(dateAgo(daysStale)),
				daysStale,
			},
		},
	};
}

/* ------------------------------------------------------------------ *
 * Route table  (param/detail routes before list routes; lists anchored $)
 * ------------------------------------------------------------------ */

export const routes: MockRoute[] = [
	// ---- dashboardApi.ts -> /dashboard/* ----
	{ method: 'GET', pattern: /^\/dashboard\/stats\/?$/, handler: dashboardStats },
	{ method: 'GET', pattern: /^\/dashboard\/revenue-chart\/?$/, handler: revenueChart },
	{ method: 'GET', pattern: /^\/dashboard\/user-growth-chart\/?$/, handler: userGrowthChart },
	{ method: 'GET', pattern: /^\/dashboard\/conversion-funnel\/?$/, handler: conversionFunnel },
	{ method: 'GET', pattern: /^\/dashboard\/recent-activities\/?$/, handler: recentActivities },
	{ method: 'GET', pattern: /^\/dashboard\/top-metrics\/?$/, handler: topMetrics },
	{ method: 'GET', pattern: /^\/dashboard\/geographic-data\/?$/, handler: geographicData },
	{ method: 'GET', pattern: /^\/dashboard\/real-time\/?$/, handler: realTimeMetrics },
	// export returns a Blob in the app; a small JSON payload is harmless for the demo
	{
		method: 'GET',
		pattern: /^\/dashboard\/export\/?$/,
		handler: () => ok({ exported: true, format: 'csv', rows: 0 }),
	},

	// ---- opsDashboardApi.ts -> FLAT responses ----
	{ method: 'GET', pattern: /^\/inventory\/getKAMEodReport\/?$/, handler: kamEodReport },
	{ method: 'GET', pattern: /^\/inventory\/getQCEodReport\/?$/, handler: qcEodReport },
	{ method: 'GET', pattern: /^\/inventory\/getDispatchDelayReport\/?$/, handler: dispatchDelayReport },
	{
		method: 'GET',
		pattern: /^\/transit-plan\/getTransitPlanDispatchPickupSummary\/?$/,
		handler: transitPlanSummary,
	},
	{ method: 'GET', pattern: /^\/shift\/getShiftStatusReport\/?$/, handler: shiftStatusReport },

	// ---- cityKpiApi.ts -> /city-kpi/* ----
	{ method: 'GET', pattern: /^\/city-kpi\/summary\/?$/, handler: cityKpiSummary },
	{ method: 'GET', pattern: /^\/city-kpi\/revenue-burnup\/?$/, handler: cityKpiRevenueBurnup },
	{
		method: 'POST',
		pattern: /^\/city-kpi\/ebitda-target\/?$/,
		handler: (req: MockRequest) => ({
			status: 'Success',
			status_code: 200,
			data: {
				facility_id: req.body?.facility_id ?? null,
				target_pct: req.body?.target_pct ?? null,
				effective_from: req.body?.effective_from ?? isoDate(TODAY),
			},
		}),
	},
];
