/**
 * Mock Login (LOCAL DEV ONLY)
 * --------------------------------------------------------------------------
 * Lets you sign in and explore the frontend without a running backend.
 *
 * Enabled by the `VITE_USE_MOCK_AUTH=true` env flag (see .env). When enabled,
 * `AuthApiService.login` short-circuits to `buildMockLoginResponse` instead of
 * hitting `/oauth/access_token`. Any username/password is accepted.
 *
 * Note: only LOGIN is mocked. Individual dashboard pages still call the real
 * backend, so data screens will show empty/error states until a backend is
 * available — but the full app shell, navigation and routing are usable.
 *
 * To disable, set VITE_USE_MOCK_AUTH=false (or remove it) and restart the dev
 * server.
 */

import { ALL_MENU_ITEMS } from '../config/menuConfig';
import { MenuItem, MenuPermission } from '../types/menu';
import { ApiResponse } from '../services/api';
import { LoginResponse } from '../services/authApi';

/** Recursively grant `access: true` to every menu + submenu in the config. */
function buildFullMenuPermissions(items: MenuItem[]): Record<string, MenuPermission> {
	const perms: Record<string, MenuPermission> = {};
	for (const item of items) {
		perms[item.id] = {
			access: true,
			children: item.children ? buildFullMenuPermissions(item.children) : {},
		};
	}
	return perms;
}

/** Far-future expiry so the mock token never looks expired during a session. */
const FAR_FUTURE = '2099-12-31T23:59:59Z';

/** Build a fully-formed, successful login response for the given username. */
export function buildMockLoginResponse(username: string): ApiResponse<LoginResponse> {
	const displayName = username?.trim() || 'Demo User';

	return {
		status_code: 200,
		status: 'Success',
		message: null,
		data: {
			access_token: 'mock-access-token',
			refresh_token: 'mock-refresh-token',
			access_expires: FAR_FUTURE,
			refresh_expires: FAR_FUTURE,
			token_type: 'Bearer',
			expires_in: 60 * 60 * 24 * 365, // 1 year
			user: {
				id: 1,
				username: displayName,
				email: `${displayName}@example.com`,
				first_name: displayName,
				last_name: '',
				gender: 1,
				contact: '+910000000000',
				avatar: '',
				status: 1,
				user_type_id: 1,
				user_type_name: 'Admin',
				city_id: 1,
				city_name: 'Mumbai',
				state_id: 1,
				state_name: 'Maharashtra',
				facility_id: 1,
				created_at: null,
				updated_at: null,
			},
			// Grant access to the entire menu tree so the full UI is browsable.
			menu_permissions: buildFullMenuPermissions(ALL_MENU_ITEMS),
		},
	};
}

/** True when local mock auth is enabled via env. */
export const isMockAuthEnabled = (): boolean =>
	import.meta.env.VITE_USE_MOCK_AUTH === 'true';
