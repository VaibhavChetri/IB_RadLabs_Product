/**
 * Mock data helpers (LOCAL DEMO ONLY)
 * --------------------------------------------------------------------------
 * Deterministic, India-context fake-data generators used by the mock API layer
 * (see src/mocks/mockAdapter.ts). Output is seeded so the same endpoint returns
 * the same data across reloads — a stable, professional-looking demo.
 */

/* ------------------------------------------------------------------ *
 * Seeded RNG (mulberry32 + FNV-1a string hash) — stable across reloads
 * ------------------------------------------------------------------ */

function fnv1a(str: string): number {
	let h = 2166136261;
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

function mulberry32(seed: number) {
	let s = seed >>> 0;
	return function () {
		s = (s + 0x6d2b79f5) | 0;
		let t = Math.imul(s ^ (s >>> 15), 1 | s);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export interface Rng {
	next: () => number;
	int: (min: number, max: number) => number;
	float: (min: number, max: number, dp?: number) => number;
	pick: <T>(arr: readonly T[]) => T;
	picks: <T>(arr: readonly T[], n: number) => T[];
	bool: (p?: number) => boolean;
	id: () => number;
	uuid: () => string;
}

/** Create a seeded RNG. Seed with the endpoint path for per-endpoint stability. */
export function seeded(seed: string | number): Rng {
	const rng = mulberry32(typeof seed === 'number' ? seed >>> 0 : fnv1a(seed));
	const api: Rng = {
		next: rng,
		int: (min, max) => Math.floor(rng() * (max - min + 1)) + min,
		float: (min, max, dp = 2) => +(rng() * (max - min) + min).toFixed(dp),
		pick: arr => arr[Math.floor(rng() * arr.length)],
		picks: (arr, n) => {
			const copy = [...arr];
			const out: typeof copy = [];
			for (let i = 0; i < n && copy.length; i++) {
				out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
			}
			return out;
		},
		bool: (p = 0.5) => rng() < p,
		id: () => Math.floor(rng() * 1_000_000) + 1,
		uuid: () =>
			'xxxxxxxxxxxx'.replace(/x/g, () => Math.floor(rng() * 16).toString(16)),
	};
	return api;
}

/** Build an array of `n` items via a factory that receives an index + rng. */
export function list<T>(n: number, fn: (i: number, rng: Rng) => T, seed: string): T[] {
	const rng = seeded(seed);
	return Array.from({ length: n }, (_, i) => fn(i, rng));
}

/* ------------------------------------------------------------------ *
 * Response envelope helpers
 * ------------------------------------------------------------------ */

/** Standard backend success envelope. `extra` adds sibling fields (pagination, etc.). */
export function ok<T>(data: T, extra: Record<string, unknown> = {}) {
	return {
		status_code: 200,
		statusCode: 200,
		status: 'Success',
		message: null as string | null,
		data,
		...extra,
	};
}

/** Pagination block in the common `{ page, limit, total, totalPages }` shape. */
export function pageMeta(total: number, page = 1, limit = 20) {
	return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

/** Slice an array per the request's page/limit query params. */
export function paginate<T>(items: T[], query: Record<string, string>) {
	const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
	const limit = Math.max(1, parseInt(query.limit || '20', 10) || 20);
	const start = (page - 1) * limit;
	return { slice: items.slice(start, start + limit), page, limit, total: items.length };
}

/* ------------------------------------------------------------------ *
 * India-context reference data
 * ------------------------------------------------------------------ */

export interface CityRef {
	id: number;
	name: string;
	state: string;
	state_id: number;
}

export const CITIES: readonly CityRef[] = [
	{ id: 1, name: 'Mumbai', state: 'Maharashtra', state_id: 1 },
	{ id: 2, name: 'Delhi', state: 'Delhi', state_id: 2 },
	{ id: 3, name: 'Bengaluru', state: 'Karnataka', state_id: 3 },
	{ id: 4, name: 'Hyderabad', state: 'Telangana', state_id: 4 },
	{ id: 5, name: 'Chennai', state: 'Tamil Nadu', state_id: 5 },
	{ id: 6, name: 'Pune', state: 'Maharashtra', state_id: 1 },
	{ id: 7, name: 'Kolkata', state: 'West Bengal', state_id: 6 },
	{ id: 8, name: 'Ahmedabad', state: 'Gujarat', state_id: 7 },
	{ id: 9, name: 'Gurugram', state: 'Haryana', state_id: 8 },
	{ id: 10, name: 'Noida', state: 'Uttar Pradesh', state_id: 9 },
] as const;

export const STATES: readonly string[] = [
	'Maharashtra',
	'Delhi',
	'Karnataka',
	'Telangana',
	'Tamil Nadu',
	'West Bengal',
	'Gujarat',
	'Haryana',
	'Uttar Pradesh',
	'Rajasthan',
] as const;

export const FIRST_NAMES: readonly string[] = [
	'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Reyansh', 'Ananya', 'Diya',
	'Saanvi', 'Aadhya', 'Kiara', 'Priya', 'Rohan', 'Kabir', 'Ishaan', 'Shaurya',
	'Riya', 'Neha', 'Pooja', 'Sneha', 'Rahul', 'Amit', 'Vikram', 'Sanjay',
	'Deepak', 'Karan', 'Nikhil', 'Shashwat', 'Asha', 'Swati', 'Priyanka', 'Meera',
] as const;

export const LAST_NAMES: readonly string[] = [
	'Sharma', 'Verma', 'Patel', 'Gupta', 'Mehta', 'Shah', 'Reddy', 'Nair',
	'Iyer', 'Rao', 'Kapoor', 'Malhotra', 'Joshi', 'Desai', 'Chopra', 'Banerjee',
	'Mukherjee', 'Gangwal', 'Kaplish', 'Agarwal', 'Singh', 'Kumar', 'Bose', 'Pillai',
] as const;

/** Client/customer brand names (B2B logistics context). */
export const COMPANIES: readonly string[] = [
	'Zomato', 'Swiggy', 'BigBasket', 'Licious', 'FreshToHome', 'Country Delight',
	'Zepto', 'Blinkit', 'Dunzo', 'Rebel Foods', 'Curefoods', 'Wow! Momo',
	'Mamaearth', 'boAt Lifestyle', 'Nykaa', 'Lenskart', 'FirstCry', 'Pharmeasy',
	'Apollo 24/7', 'Tata 1mg', 'Urban Company', 'Cult.fit', 'Sugar Cosmetics',
	'The Sleep Company', 'Wakefit', 'Pepperfry', 'Boult Audio', 'Noise',
] as const;

/** Vendor/supplier names (procurement / AP context). */
export const VENDORS: readonly string[] = [
	'Reliable Packaging Pvt Ltd', 'SafePack Industries', 'CoolChain Logistics',
	'ThermoCold Solutions', 'BlueDart Express', 'Delhivery Ltd', 'Gati Cargo',
	'Mahindra Logistics', 'TCI Supply Chain', 'Ecom Express', 'Crystal Cold Storage',
	'Snowman Logistics', 'IcePack Traders', 'Assetz Facilities', 'CleanPro Services',
	'PowerGrid Utilities', 'Schneider Electric India', 'Voltas Cooling',
] as const;

export const UNITS: readonly string[] = [
	'Cold Storage', 'Frozen', 'Chiller', 'Ambient', 'Dry Storage',
] as const;

export const SKUS: readonly string[] = [
	'Insulated Box 20L', 'Gel Pack 500g', 'Thermocol Liner', 'Corrugated Carton M',
	'Pallet Wrap', 'Dry Ice 5kg', 'EPS Cooler 40L', 'Reusable Crate 25L',
	'Vacuum Bag', 'Temperature Logger',
] as const;

/* ------------------------------------------------------------------ *
 * Field generators
 * ------------------------------------------------------------------ */

export const fullName = (rng: Rng): string => `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;

export const company = (rng: Rng): string => rng.pick(COMPANIES);

export const vendor = (rng: Rng): string => rng.pick(VENDORS);

export const phone = (rng: Rng): string => `+91 ${rng.int(70, 99)}${rng.int(10000000, 99999999)}`;

export const email = (name: string): string =>
	`${name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')}@example.com`;

/** Whole-rupee amount in [min, max]. */
export const rupees = (rng: Rng, min: number, max: number): number => rng.int(min, max);

/** Format a number as Indian-grouped ₹ string, e.g. 1234567 -> "₹12,34,567". */
export function formatINR(n: number): string {
	const s = Math.round(n).toString();
	const last3 = s.slice(-3);
	const rest = s.slice(0, -3);
	const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
	return `₹${rest ? grouped + ',' : ''}${last3}`;
}

/* ------------------------------------------------------------------ *
 * Dates — all relative to a fixed "today" so the demo is stable.
 * (Avoids Date.now() drift making numbers jump between reloads.)
 * ------------------------------------------------------------------ */

export const TODAY = new Date('2026-06-01T00:00:00Z');

export function dateAgo(days: number): Date {
	const d = new Date(TODAY);
	d.setUTCDate(d.getUTCDate() - days);
	return d;
}

export function dateAhead(days: number): Date {
	return dateAgo(-days);
}

/** ISO date 'YYYY-MM-DD'. */
export const isoDate = (d: Date): string => d.toISOString().slice(0, 10);

/** ISO datetime 'YYYY-MM-DDTHH:mm:ssZ'. */
export const isoDateTime = (d: Date): string => d.toISOString().slice(0, 19) + 'Z';

/** Last N day labels ending today, oldest first: ['2026-05-26', ...]. */
export function lastNDates(n: number): string[] {
	return Array.from({ length: n }, (_, i) => isoDate(dateAgo(n - 1 - i)));
}

/** Last N month labels ending this month, oldest first: ['Jan', 'Feb', ...]. */
export function lastNMonths(n: number): { label: string; key: string }[] {
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const out: { label: string; key: string }[] = [];
	for (let i = n - 1; i >= 0; i--) {
		const d = new Date(TODAY);
		d.setUTCMonth(d.getUTCMonth() - i);
		out.push({ label: months[d.getUTCMonth()], key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}` });
	}
	return out;
}
