import { useState, useEffect } from 'react';

/**
 * Tailwind CSS breakpoints aligned with design system
 * xs: 475px
 * sm: 640px
 * md: 768px
 * lg: 1024px
 * xl: 1280px
 * 2xl: 1536px
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface BreakpointState {
	breakpoint: Breakpoint;
	isMobile: boolean;
	isTablet: boolean;
	isDesktop: boolean;
	width: number;
}

const breakpoints: Record<Breakpoint, number> = {
	xs: 475,
	sm: 640,
	md: 768,
	lg: 1024,
	xl: 1280,
	'2xl': 1536,
};

/**
 * Custom hook to detect current Tailwind breakpoint
 * Uses matchMedia API for efficient breakpoint detection
 *
 * @returns Current breakpoint state with width and device type flags
 *
 * @example
 * ```tsx
 * const { breakpoint, isMobile, width } = useBreakpoint();
 *
 * if (isMobile) {
 *   return <MobileComponent />;
 * }
 * ```
 */
export const useBreakpoint = (): BreakpointState => {
	const [state, setState] = useState<BreakpointState>(() => {
		// Initial state calculation (SSR safe)
		if (typeof window === 'undefined') {
			return {
				breakpoint: 'md',
				isMobile: false,
				isTablet: false,
				isDesktop: true,
				width: 1024,
			};
		}

		const width = window.innerWidth;
		return calculateBreakpoint(width);
	});

	useEffect(() => {
		// Create media queries for all breakpoints
		const mediaQueries = Object.entries(breakpoints)
			.sort(([, a], [, b]) => b - a) // Sort descending
			.map(([breakpoint, width]) => ({
				breakpoint: breakpoint as Breakpoint,
				mq: window.matchMedia(`(max-width: ${width - 1}px)`),
			}));

		const updateBreakpoint = () => {
			const width = window.innerWidth;
			setState(calculateBreakpoint(width));
		};

		// Debounce resize events for performance
		let timeoutId: NodeJS.Timeout;
		const handleResize = () => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(updateBreakpoint, 150);
		};

		// Initial check
		updateBreakpoint();

		// Listen to resize events
		window.addEventListener('resize', handleResize, { passive: true });

		// Cleanup
		return () => {
			window.removeEventListener('resize', handleResize);
			clearTimeout(timeoutId);
		};
	}, []);

	return state;
};

/**
 * Calculate breakpoint state from window width
 */
function calculateBreakpoint(width: number): BreakpointState {
	let breakpoint: Breakpoint = 'xs';
	let isMobile = false;
	let isTablet = false;
	let isDesktop = false;

	if (width >= breakpoints['2xl']) {
		breakpoint = '2xl';
		isDesktop = true;
	} else if (width >= breakpoints.xl) {
		breakpoint = 'xl';
		isDesktop = true;
	} else if (width >= breakpoints.lg) {
		breakpoint = 'lg';
		isDesktop = true;
	} else if (width >= breakpoints.md) {
		breakpoint = 'md';
		isTablet = true;
	} else if (width >= breakpoints.sm) {
		breakpoint = 'sm';
		isMobile = true;
	} else {
		breakpoint = 'xs';
		isMobile = true;
	}

	return {
		breakpoint,
		isMobile,
		isTablet,
		isDesktop,
		width,
	};
}
