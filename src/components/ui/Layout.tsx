/**
 * Layout Components and Responsive Utilities
 * Comprehensive layout system with containers, grids, and responsive utilities
 */

import React from 'react';
import { cn } from '../../utils/cn';

// Container Component
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
	size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
	padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
	center?: boolean;
}

const containerSizes = {
	sm: 'max-w-2xl',
	md: 'max-w-4xl',
	lg: 'max-w-6xl',
	xl: 'max-w-7xl',
	full: 'max-w-full',
};

const containerPadding = {
	none: 'px-0',
	sm: 'px-4',
	md: 'px-6',
	lg: 'px-8',
	xl: 'px-12',
};

export const Container: React.FC<ContainerProps> = ({
	children,
	size = 'lg',
	padding = 'md',
	center = true,
	className,
	...props
}) => {
	return (
		<div
			className={cn(
				'w-full',
				containerSizes[size],
				containerPadding[padding],
				center && 'mx-auto',
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
};

// Grid Component
export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
	cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
	gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
	responsive?: {
		sm?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
		md?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
		lg?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
		xl?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
	};
}

const gridCols = {
	1: 'grid-cols-1',
	2: 'grid-cols-2',
	3: 'grid-cols-3',
	4: 'grid-cols-4',
	5: 'grid-cols-5',
	6: 'grid-cols-6',
	12: 'grid-cols-12',
};

const gridGaps = {
	none: 'gap-0',
	sm: 'gap-2',
	md: 'gap-4',
	lg: 'gap-6',
	xl: 'gap-8',
};

const responsiveGridCols = {
	sm: {
		1: 'sm:grid-cols-1',
		2: 'sm:grid-cols-2',
		3: 'sm:grid-cols-3',
		4: 'sm:grid-cols-4',
		5: 'sm:grid-cols-5',
		6: 'sm:grid-cols-6',
		12: 'sm:grid-cols-12',
	},
	md: {
		1: 'md:grid-cols-1',
		2: 'md:grid-cols-2',
		3: 'md:grid-cols-3',
		4: 'md:grid-cols-4',
		5: 'md:grid-cols-5',
		6: 'md:grid-cols-6',
		12: 'md:grid-cols-12',
	},
	lg: {
		1: 'lg:grid-cols-1',
		2: 'lg:grid-cols-2',
		3: 'lg:grid-cols-3',
		4: 'lg:grid-cols-4',
		5: 'lg:grid-cols-5',
		6: 'lg:grid-cols-6',
		12: 'lg:grid-cols-12',
	},
	xl: {
		1: 'xl:grid-cols-1',
		2: 'xl:grid-cols-2',
		3: 'xl:grid-cols-3',
		4: 'xl:grid-cols-4',
		5: 'xl:grid-cols-5',
		6: 'xl:grid-cols-6',
		12: 'xl:grid-cols-12',
	},
};

export const Grid: React.FC<GridProps> = ({
	children,
	cols = 1,
	gap = 'md',
	responsive,
	className,
	...props
}) => {
	const responsiveClasses = responsive
		? Object.entries(responsive)
				.map(
					([breakpoint, cols]) =>
						responsiveGridCols[breakpoint as keyof typeof responsiveGridCols][
							cols
						],
				)
				.join(' ')
		: '';

	return (
		<div
			className={cn(
				'grid',
				gridCols[cols],
				gridGaps[gap],
				responsiveClasses,
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
};

// Flex Component
export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
	direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
	wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
	justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
	align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
	gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const flexDirections = {
	row: 'flex-row',
	column: 'flex-col',
	'row-reverse': 'flex-row-reverse',
	'column-reverse': 'flex-col-reverse',
};

const flexWraps = {
	nowrap: 'flex-nowrap',
	wrap: 'flex-wrap',
	'wrap-reverse': 'flex-wrap-reverse',
};

const flexJustify = {
	start: 'justify-start',
	end: 'justify-end',
	center: 'justify-center',
	between: 'justify-between',
	around: 'justify-around',
	evenly: 'justify-evenly',
};

const flexAlign = {
	start: 'items-start',
	end: 'items-end',
	center: 'items-center',
	baseline: 'items-baseline',
	stretch: 'items-stretch',
};

const flexGaps = {
	none: 'gap-0',
	sm: 'gap-2',
	md: 'gap-4',
	lg: 'gap-6',
	xl: 'gap-8',
};

export const Flex: React.FC<FlexProps> = ({
	children,
	direction = 'row',
	wrap = 'nowrap',
	justify = 'start',
	align = 'start',
	gap = 'md',
	className,
	...props
}) => {
	return (
		<div
			className={cn(
				'flex',
				flexDirections[direction],
				flexWraps[wrap],
				flexJustify[justify],
				flexAlign[align],
				flexGaps[gap],
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
};

// Stack Component (simplified Flex with column direction)
export interface StackProps extends Omit<FlexProps, 'direction'> {
	spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export const Stack: React.FC<StackProps> = ({
	children,
	spacing = 'md',
	...props
}) => {
	return (
		<Flex direction='column' gap={spacing} {...props}>
			{children}
		</Flex>
	);
};

// Spacer Component
export interface SpacerProps {
	size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
	axis?: 'x' | 'y' | 'both';
}

const spacerSizes = {
	xs: 'h-1 w-1',
	sm: 'h-2 w-2',
	md: 'h-4 w-4',
	lg: 'h-6 w-6',
	xl: 'h-8 w-8',
	'2xl': 'h-12 w-12',
	'3xl': 'h-16 w-16',
};

const spacerAxes = {
	x: 'w-full h-0',
	y: 'h-full w-0',
	both: 'h-full w-full',
};

export const Spacer: React.FC<SpacerProps> = ({
	size = 'md',
	axis = 'both',
}) => {
	return (
		<div
			className={cn(axis === 'both' ? spacerSizes[size] : spacerAxes[axis])}
		/>
	);
};

// Divider Component
export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
	orientation?: 'horizontal' | 'vertical';
	variant?: 'solid' | 'dashed' | 'dotted';
	thickness?: 'thin' | 'medium' | 'thick';
	color?: 'default' | 'primary' | 'secondary' | 'muted';
}

const dividerOrientations = {
	horizontal: 'w-full h-px',
	vertical: 'h-full w-px',
};

const dividerVariants = {
	solid: 'border-solid',
	dashed: 'border-dashed',
	dotted: 'border-dotted',
};

const dividerThickness = {
	thin: 'border-t border-l',
	medium: 'border-2 border-t-2 border-l-2',
	thick: 'border-4 border-t-4 border-l-4',
};

const dividerColors = {
	default: 'border-border',
	primary: 'border-primary',
	secondary: 'border-secondary',
	muted: 'border-border-muted',
};

export const Divider: React.FC<DividerProps> = ({
	orientation = 'horizontal',
	variant = 'solid',
	thickness = 'thin',
	color = 'default',
	className,
	...props
}) => {
	return (
		<div
			className={cn(
				dividerOrientations[orientation],
				dividerVariants[variant],
				dividerThickness[thickness],
				dividerColors[color],
				className,
			)}
			{...props}
		/>
	);
};

// Aspect Ratio Component
export interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
	ratio: number; // width / height
	children: React.ReactNode;
}

export const AspectRatio: React.FC<AspectRatioProps> = ({
	ratio,
	children,
	className,
	...props
}) => {
	return (
		<div
			className={cn('relative w-full', className)}
			style={{ paddingBottom: `${100 / ratio}%` }}
			{...props}
		>
			<div className='absolute inset-0'>{children}</div>
		</div>
	);
};

// Responsive Utilities Hook
export const useBreakpoint = () => {
	const [breakpoint, setBreakpoint] = React.useState<string>('sm');

	React.useEffect(() => {
		const updateBreakpoint = () => {
			const width = window.innerWidth;
			if (width >= 1536) setBreakpoint('2xl');
			else if (width >= 1280) setBreakpoint('xl');
			else if (width >= 1024) setBreakpoint('lg');
			else if (width >= 768) setBreakpoint('md');
			else if (width >= 640) setBreakpoint('sm');
			else setBreakpoint('xs');
		};

		updateBreakpoint();
		window.addEventListener('resize', updateBreakpoint);
		return () => window.removeEventListener('resize', updateBreakpoint);
	}, []);

	return breakpoint;
};

// Responsive Visibility Component
export interface ResponsiveVisibilityProps
	extends React.HTMLAttributes<HTMLDivElement> {
	show?: {
		xs?: boolean;
		sm?: boolean;
		md?: boolean;
		lg?: boolean;
		xl?: boolean;
		'2xl'?: boolean;
	};
	hide?: {
		xs?: boolean;
		sm?: boolean;
		md?: boolean;
		lg?: boolean;
		xl?: boolean;
		'2xl'?: boolean;
	};
}

export const ResponsiveVisibility: React.FC<ResponsiveVisibilityProps> = ({
	children,
	show,
	hide,
	className,
	...props
}) => {
	const getVisibilityClasses = () => {
		const classes: string[] = [];

		if (show) {
			Object.entries(show).forEach(([breakpoint, visible]) => {
				if (visible) {
					classes.push(`${breakpoint}:block`);
				} else {
					classes.push(`${breakpoint}:hidden`);
				}
			});
		}

		if (hide) {
			Object.entries(hide).forEach(([breakpoint, hidden]) => {
				if (hidden) {
					classes.push(`${breakpoint}:hidden`);
				} else {
					classes.push(`${breakpoint}:block`);
				}
			});
		}

		return classes.join(' ');
	};

	return (
		<div className={cn(getVisibilityClasses(), className)} {...props}>
			{children}
		</div>
	);
};
