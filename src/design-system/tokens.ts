/**
 * Design System Tokens
 * Comprehensive design tokens extracted from Figma design system
 * Fully customizable and maintainable
 */

// Color Palette
export const colors = {
	// Primary Colors
	primary: {
		50: '#f0fdf4',
		100: '#dcfce7',
		200: '#bbf7d0',
		300: '#86efac',
		400: '#4ade80',
		500: '#00a76f', // main
		600: '#007867',
		700: '#065f46',
		800: '#064e3b',
		900: '#064e3b',
		DEFAULT: '#00a76f',
		foreground: '#ffffff',
	},

	// Secondary Colors
	secondary: {
		50: '#faf5ff',
		100: '#f3e8ff',
		200: '#e9d5ff',
		300: '#d8b4fe',
		400: '#c084fc',
		500: '#8e33ff', // main
		600: '#7c3aed',
		700: '#6d28d9',
		800: '#5b21b6',
		900: '#4c1d95',
		DEFAULT: '#8e33ff',
		foreground: '#ffffff',
	},

	// Info Colors
	info: {
		50: '#f0f9ff',
		100: '#e0f2fe',
		200: '#bae6fd',
		300: '#7dd3fc',
		400: '#38bdf8',
		500: '#00b8d9', // main
		600: '#0284c7',
		700: '#0369a1',
		800: '#075985',
		900: '#0c4a6e',
		DEFAULT: '#00b8d9',
		foreground: '#ffffff',
	},

	// Success Colors
	success: {
		50: '#f0fdf4',
		100: '#dcfce7',
		200: '#bbf7d0',
		300: '#86efac',
		400: '#4ade80',
		500: '#22c55e', // main
		600: '#16a34a',
		700: '#15803d',
		800: '#166534',
		900: '#14532d',
		DEFAULT: '#22c55e',
		foreground: '#ffffff',
	},

	// Warning Colors
	warning: {
		50: '#fffbeb',
		100: '#fef3c7',
		200: '#fde68a',
		300: '#fcd34d',
		400: '#fbbf24',
		500: '#ffab00', // main
		600: '#d97706',
		700: '#b45309',
		800: '#92400e',
		900: '#78350f',
		DEFAULT: '#ffab00',
		foreground: '#ffffff',
	},

	// Error Colors
	error: {
		50: '#fef2f2',
		100: '#fee2e2',
		200: '#fecaca',
		300: '#fca5a5',
		400: '#f87171',
		500: '#ff5630', // main
		600: '#dc2626',
		700: '#b91c1c',
		800: '#991b1b',
		900: '#7f1d1d',
		DEFAULT: '#ff5630',
		foreground: '#ffffff',
	},

	// Neutral Colors
	neutral: {
		50: '#fafafa',
		100: '#f5f5f5',
		200: '#e5e5e5',
		300: '#d4d4d4',
		400: '#a3a3a3',
		500: '#737373', // main
		600: '#525252',
		700: '#404040',
		800: '#262626',
		900: '#171717',
		DEFAULT: '#737373',
		foreground: '#ffffff',
	},

	// Semantic Colors
	background: '#ffffff',
	backgroundSecondary: '#f9fafb',
	backgroundMuted: '#f4f6f8',
	backgroundAccent: '#f0f9ff',

	foreground: '#1c252e',
	foregroundSecondary: '#637381',
	foregroundMuted: '#919eab',
	foregroundAccent: '#00a76f',

	border: '#e5e7eb',
	borderSecondary: '#d1d5db',
	borderMuted: '#f3f4f6',

	input: '#ffffff',
	inputSecondary: '#f9fafb',

	ring: '#00a76f',
	ringSecondary: '#8e33ff',
} as const;

// Typography
export const typography = {
	fontFamily: {
		sans: ['Public Sans', 'sans-serif'],
		display: ['Barlow', 'sans-serif'],
	},
	fontSize: {
		h1: ['64px', { lineHeight: '80px', fontWeight: '800' }],
		h2: ['48px', { lineHeight: '64px', fontWeight: '800' }],
		h3: ['32px', { lineHeight: '48px', fontWeight: '700' }],
		h4: ['24px', { lineHeight: '36px', fontWeight: '700' }],
		h5: ['20px', { lineHeight: '30px', fontWeight: '700' }],
		h6: ['18px', { lineHeight: '28px', fontWeight: '600' }],
		body1: ['16px', { lineHeight: '24px', fontWeight: '400' }],
		body2: ['14px', { lineHeight: '22px', fontWeight: '400' }],
		subtitle1: ['16px', { lineHeight: '24px', fontWeight: '600' }],
		subtitle2: ['14px', { lineHeight: '22px', fontWeight: '600' }],
		caption: ['12px', { lineHeight: '18px', fontWeight: '400' }],
		overline: ['12px', { lineHeight: '18px', fontWeight: '700' }],
	},
	fontWeight: {
		light: '300',
		normal: '400',
		medium: '500',
		semibold: '600',
		bold: '700',
		extrabold: '800',
	},
} as const;

// Spacing (Auto-layout from Figma)
export const spacing = {
	0: '0px',
	1: '4px',
	2: '8px',
	3: '12px',
	4: '16px',
	5: '20px',
	6: '24px',
	8: '32px',
	10: '40px',
	12: '48px',
	16: '64px',
	20: '80px',
	24: '96px',
	32: '128px',
	40: '160px',
	48: '192px',
	56: '224px',
	64: '256px',
} as const;

// Border Radius
export const borderRadius = {
	none: '0px',
	sm: '4px',
	DEFAULT: '8px',
	md: '12px',
	lg: '16px',
	xl: '20px',
	'2xl': '24px',
	'3xl': '32px',
	full: '9999px',
} as const;

// Box Shadows
export const boxShadow = {
	z1: '0px 1px 2px 0px rgba(0, 0, 0, 0.12)',
	z4: '0px 4px 8px 0px rgba(0, 0, 0, 0.12)',
	z8: '0px 8px 16px 0px rgba(0, 0, 0, 0.12)',
	z12: '0px 12px 24px 0px rgba(0, 0, 0, 0.12)',
	z16: '0px 16px 32px 0px rgba(0, 0, 0, 0.12)',
	z20: '0px 20px 40px 0px rgba(0, 0, 0, 0.12)',
	z24: '0px 24px 48px 0px rgba(0, 0, 0, 0.12)',
	primary: '0px 8px 16px 0px rgba(0, 167, 111, 0.24)',
	secondary: '0px 8px 16px 0px rgba(142, 51, 255, 0.24)',
	info: '0px 8px 16px 0px rgba(0, 184, 217, 0.24)',
	success: '0px 8px 16px 0px rgba(34, 197, 94, 0.24)',
	warning: '0px 8px 16px 0px rgba(255, 171, 0, 0.24)',
	error: '0px 8px 16px 0px rgba(255, 86, 48, 0.24)',
} as const;

// Breakpoints
export const breakpoints = {
	xs: '475px',
	sm: '640px',
	md: '768px',
	lg: '1024px',
	xl: '1280px',
	'2xl': '1536px',
} as const;

// Component Variants
export const componentVariants = {
	button: {
		size: {
			sm: 'h-8 px-3 text-sm',
			md: 'h-10 px-4 text-sm',
			lg: 'h-12 px-6 text-base',
			xl: 'h-14 px-8 text-lg',
		},
		variant: {
			primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
			secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
			outline:
				'border border-border bg-background hover:bg-background-secondary',
			ghost: 'hover:bg-background-secondary',
			link: 'text-primary underline-offset-4 hover:underline',
			destructive: 'bg-error text-error-foreground hover:bg-error/90',
		},
	},
	input: {
		size: {
			sm: 'h-8 px-3 text-sm',
			md: 'h-10 px-3 text-sm',
			lg: 'h-12 px-4 text-base',
		},
		variant: {
			default: 'border-border bg-input',
			filled: 'border-transparent bg-input-secondary',
		},
	},
	card: {
		variant: {
			default: 'bg-background border-border',
			elevated: 'bg-background border-border shadow-z4',
			outlined: 'bg-background border-2 border-border',
		},
	},
} as const;

// Animation
export const animation = {
	duration: {
		fast: '150ms',
		normal: '200ms',
		slow: '300ms',
	},
	easing: {
		easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
		easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
		easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
	},
} as const;

// Z-Index Scale
export const zIndex = {
	hide: -1,
	auto: 'auto',
	base: 0,
	docked: 10,
	dropdown: 1000,
	sticky: 1100,
	banner: 1200,
	overlay: 1300,
	modal: 1400,
	popover: 1500,
	skipLink: 1600,
	toast: 1700,
	tooltip: 1800,
} as const;

export type ColorScale = typeof colors;
export type TypographyScale = typeof typography;
export type SpacingScale = typeof spacing;
export type BorderRadiusScale = typeof borderRadius;
export type BoxShadowScale = typeof boxShadow;
export type BreakpointScale = typeof breakpoints;
export type ComponentVariants = typeof componentVariants;
export type AnimationScale = typeof animation;
export type ZIndexScale = typeof zIndex;
