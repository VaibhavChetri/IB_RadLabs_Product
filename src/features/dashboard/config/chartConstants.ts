/**
 * Dashboard Chart Constants
 * Centralized configuration for chart styling and responsive breakpoints
 */

// Chart dimensions (in pixels)
export const CHART_DIMENSIONS = {
	mobile: {
		height: 256, // h-64
		margins: {
			top: 5,
			right: 10,
			left: 30,
			bottom: 35,
		},
	},
	desktop: {
		height: 320, // h-80
		margins: {
			top: 5,
			right: 30,
			left: 10,
			bottom: 40,
		},
	},
} as const;

// Font sizes (in pixels)
export const CHART_FONT_SIZES = {
	mobile: {
		label: 12,
		tick: 10,
	},
	desktop: {
		label: 14,
		tick: 12,
	},
} as const;

// Y-axis configuration
export const Y_AXIS_CONFIG = {
	width: {
		mobile: 40,
		desktop: 60,
	},
	labelOffset: {
		mobile: -20,
		desktop: -15,
	},
	minTicks: 8,
	maxTicks: 10,
	tickRounding: 1000, // Round to nearest thousand
} as const;

// X-axis configuration
export const X_AXIS_CONFIG = {
	labelOffset: 10,
	monthlyInterval: {
		mobile: 1, // Show alternate days on mobile
		desktop: 0, // Show all days on desktop
	},
} as const;

// Tooltip configuration
export const TOOLTIP_CONFIG = {
	mobile: {
		fontSize: 12,
		padding: 8,
		maxWidth: 140,
		marginBottom: 4,
	},
	desktop: {
		fontSize: 14,
		padding: 12,
		maxWidth: 200,
		marginBottom: 6,
	},
} as const;

// Chart colors (from design system)
export const CHART_COLORS = {
	line: '#10b981', // emerald-500
	grid: '#e5e7eb', // gray-200
	text: {
		primary: '#404040', // gray-700
		secondary: '#1c252e', // foreground
	},
	background: '#ffffff',
	border: '#e5e7eb',
} as const;
