/**
 * Mock API Response for Menu Permissions
 * This shows the expected structure for your backend API
 */

// Expected API endpoint: GET /user/menu-permissions
// Expected response structure:

export const MOCK_LOGIN_RESPONSE_WITH_MENUS = {
	status_code: 200,
	status: 'Success',
	message: null,
	data: {
		access_token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
		refresh_token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
		access_expires: '2024-01-15T10:30:00Z',
		refresh_expires: '2024-01-22T10:30:00Z',
		token_type: 'Bearer',
		expires_in: 3600,
		user: {
			id: 123,
			username: 'ch-mumbai',
			email: 'ch@example.com',
			first_name: 'John',
			last_name: 'Doe',
			gender: 1,
			contact: '+1234567890',
			avatar: '',
			status: 1,
			user_type_id: 1,
			city_id: 1,
			facility_id: 1,
			created_at: '2024-01-01T00:00:00Z',
			updated_at: '2024-01-01T00:00:00Z',
		},
		menu_permissions: {
			// Dashboard - always accessible
			dashboard: {
				access: true,
				children: {},
			},

			// Menu Management - City Head has access
			'menu-management': {
				access: true,
				children: {},
			},

			// Ops Admin - City Head has full access
			'ops-admin': {
				access: true,
				children: {
					clients: {
						access: true,
						children: {
							'clients-add': { access: true, children: {} },
							'clients-manage': { access: true, children: {} },
							'clients-disable': { access: true, children: {} },
						},
					},
				},
			},

			// Analytics - City Head has full access
			analytics: {
				access: true,
				children: {
					'analytics-revenue': { access: true, children: {} },
					'analytics-trends': { access: true, children: {} },
					'analytics-users': { access: true, children: {} },
					'analytics-system': { access: true, children: {} },
				},
			},

			// Settings - City Head has full access
			settings: {
				access: true,
				children: {
					'settings-general': { access: true, children: {} },
					'settings-security': { access: true, children: {} },
					'settings-integration': { access: true, children: {} },
				},
			},
		},
	},
};

// Example for other user types (for future reference):
export const MOCK_REGULAR_USER_PERMISSIONS = {
	status_code: 200,
	status: 'Success',
	message: null,
	data: {
		user_type: 'Regular User',
		user_type_id: 2,
		allowedMenus: {
			dashboard: {
				access: true,
				children: {},
			},
			users: {
				access: false, // No access to users
				children: {},
			},
			analytics: {
				access: true,
				children: {
					'analytics-revenue': { access: false }, // No revenue access
					'analytics-trends': { access: true },
					'analytics-users': { access: true },
					'analytics-system': { access: false }, // No system access
				},
			},
			settings: {
				access: false, // No settings access
				children: {},
			},
		},
	},
};
