/**
 * Design System Utilities
 * Utility functions for working with design tokens
 */

import { cn } from '../utils/cn';

// Color utilities
export const getColorValue = (colorPath: string): string => {
	const path = colorPath.split('.');
	// This would be implemented to traverse the color object
	// For now, return the path as a CSS custom property
	return `var(--color-${path.join('-')})`;
};

// Spacing utilities
export const getSpacing = (
	size: keyof typeof import('./tokens').spacing,
): string => {
	return `var(--spacing-${size})`;
};

// Typography utilities
export const getTypography = (
	variant: keyof typeof import('./tokens').typography.fontSize,
) => {
	const typography = {
		h1: 'text-h1',
		h2: 'text-h2',
		h3: 'text-h3',
		h4: 'text-h4',
		h5: 'text-h5',
		h6: 'text-h6',
		body1: 'text-body1',
		body2: 'text-body2',
		subtitle1: 'text-subtitle1',
		subtitle2: 'text-subtitle2',
		caption: 'text-caption',
		overline: 'text-overline',
	};
	return typography[variant];
};

// Component variant utilities
export const getButtonClasses = (
	variant:
		| 'primary'
		| 'secondary'
		| 'outline'
		| 'ghost'
		| 'link'
		| 'destructive' = 'primary',
	size: 'sm' | 'md' | 'lg' | 'xl' = 'md',
	className?: string,
) => {
	const baseClasses =
		'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

	const variantClasses = {
		primary:
			'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary',
		secondary:
			'bg-secondary text-secondary-foreground hover:bg-secondary/90 focus:ring-secondary',
		outline:
			'border border-border bg-background text-foreground hover:bg-background-secondary focus:ring-primary',
		ghost: 'text-foreground hover:bg-background-secondary focus:ring-primary',
		link: 'text-primary underline-offset-4 hover:underline focus:ring-primary',
		destructive:
			'bg-error text-error-foreground hover:bg-error/90 focus:ring-error',
	};

	const sizeClasses = {
		sm: 'h-8 px-3 text-sm',
		md: 'h-10 px-4 text-sm',
		lg: 'h-12 px-6 text-base',
		xl: 'h-14 px-8 text-lg',
	};

	return cn(baseClasses, variantClasses[variant], sizeClasses[size], className);
};

export const getInputClasses = (
	variant: 'default' | 'filled' = 'default',
	size: 'sm' | 'md' | 'lg' = 'md',
	className?: string,
) => {
	const baseClasses =
		'w-full rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:pointer-events-none';

	const variantClasses = {
		default:
			'border-border bg-input text-foreground placeholder:text-foreground-muted focus:border-primary focus:ring-primary',
		filled:
			'border-transparent bg-input-secondary text-foreground placeholder:text-foreground-muted focus:border-primary focus:ring-primary',
	};

	const sizeClasses = {
		sm: 'h-8 px-3 text-sm',
		md: 'h-10 px-3 text-sm',
		lg: 'h-12 px-4 text-base',
	};

	return cn(baseClasses, variantClasses[variant], sizeClasses[size], className);
};

export const getCardClasses = (
	variant: 'default' | 'elevated' | 'outlined' = 'default',
	className?: string,
) => {
	const baseClasses = 'rounded-lg border transition-all duration-200';

	const variantClasses = {
		default: 'bg-background border-border',
		elevated: 'bg-background border-border shadow-z4',
		outlined: 'bg-background border-2 border-border',
	};

	return cn(baseClasses, variantClasses[variant], className);
};

// Responsive utilities
export const getResponsiveClasses = (classes: Record<string, string>) => {
	return Object.entries(classes)
		.map(([breakpoint, className]) => {
			if (breakpoint === 'base') return className;
			return `${breakpoint}:${className}`;
		})
		.join(' ');
};

// Animation utilities
export const getAnimationClasses = (
	duration: 'fast' | 'normal' | 'slow' = 'normal',
	easing: 'easeInOut' | 'easeOut' | 'easeIn' = 'easeInOut',
) => {
	const durationClasses = {
		fast: 'duration-150',
		normal: 'duration-200',
		slow: 'duration-300',
	};

	const easingClasses = {
		easeInOut: 'ease-in-out',
		easeOut: 'ease-out',
		easeIn: 'ease-in',
	};

	return `${durationClasses[duration]} ${easingClasses[easing]}`;
};

// Focus utilities
export const getFocusClasses = (
	color: 'primary' | 'secondary' | 'error' = 'primary',
) => {
	const focusColors = {
		primary: 'focus:ring-primary',
		secondary: 'focus:ring-secondary',
		error: 'focus:ring-error',
	};

	return `focus:outline-none focus:ring-2 focus:ring-offset-2 ${focusColors[color]}`;
};

// State utilities
export const getStateClasses = (
	state: 'default' | 'hover' | 'active' | 'disabled' = 'default',
) => {
	const stateClasses = {
		default: '',
		hover: 'hover:opacity-90',
		active: 'active:scale-95',
		disabled: 'disabled:opacity-50 disabled:pointer-events-none',
	};

	return stateClasses[state];
};
