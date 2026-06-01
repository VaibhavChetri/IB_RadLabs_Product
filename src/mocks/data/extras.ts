/**
 * Mock routes: leftover / cross-cutting endpoints not owned by a feature module
 * (LOCAL DEMO ONLY). Keep this small — most coverage lives in the other modules.
 */
import { MockRoute, MockRequest } from '../mockTypes';
import { ok, seeded, list, CITIES, COMPANIES, phone, isoDateTime, dateAgo } from '../mockHelpers';

export const routes: MockRoute[] = [
	// GET /locations/getAllLocations?location_type=3 — Ops Admin → Disable Clients list.
	// Page reads id/location/status ("Active"|"Inactive") and checks statusCode===200.
	{
		method: 'GET',
		pattern: /^\/locations\/getAllLocations\/?$/,
		handler: (_req: MockRequest) =>
			ok(
				list(
					26,
					(i, rng) => {
						const city = rng.pick(CITIES);
						const brand = COMPANIES[i % COMPANIES.length];
						return {
							id: 4000 + i,
							location: `${brand} — ${city.name}`,
							city_id: city.id,
							restaurant_id: 5000 + i,
							restaurant_name: brand,
							city_name: city.name,
							state_id: city.state_id,
							state_name: city.state,
							country_id: 1,
							country_name: 'India',
							address_1: `Unit ${rng.int(1, 80)}, ${rng.pick(['Phase 1', 'Sector 18', 'MIDC', 'Industrial Area', 'Whitefield'])}`,
							address_2: '',
							landmark: rng.pick(['Near Metro', 'Opp. Mall', 'Behind Depot', '']),
							zipcode: `${rng.int(110001, 700099)}`,
							latitude: `${rng.float(8, 28, 4)}`,
							longitude: `${rng.float(72, 88, 4)}`,
							billing_type_id: rng.int(1, 3),
							billingType: rng.pick(['Per-Wash', 'Fixed Monthly', 'Hybrid']),
							billing_sub_type_id: null,
							subTypeName: null,
							locationTypeId: 3,
							location_type_name: 'Client',
							operationalDays: rng.int(20, 30),
							impactTypes: [],
							fixedPriceId: null,
							fixedPrice: null,
							hasOnSiteManPower: rng.bool(),
							status: rng.bool(0.8) ? 'Active' : 'Inactive',
							facilityId: rng.int(1, 6),
							facilityName: `${city.name} Facility`,
							floors: [],
							clientSkuMap: [],
						};
					},
					'getAllLocations'
				)
			),
	},

	// GET /user/profile — profile read (returns the demo user). Not on a critical
	// page, but cheap to serve real-looking data.
	{
		method: 'GET',
		pattern: /^\/user\/profile\/?$/,
		handler: (_req: MockRequest) => {
			const rng = seeded('user-profile');
			return ok({
				id: 1,
				username: 'demo',
				email: 'demo@example.com',
				first_name: 'Demo',
				last_name: 'User',
				role: 'Admin',
				contact: phone(rng),
				avatar: '',
				city_id: 1,
				city_name: 'Mumbai',
				state_id: 1,
				state_name: 'Maharashtra',
				created_at: isoDateTime(dateAgo(400)),
				updated_at: isoDateTime(dateAgo(5)),
			});
		},
	},
];
