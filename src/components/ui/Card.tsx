/**
 * Enhanced Card Component
 * Comprehensive card system with multiple variants and layouts
 */

import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: 'default' | 'elevated' | 'outlined' | 'filled';
	padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
	hover?: boolean;
	interactive?: boolean;
}

const cardVariants = {
	default: 'bg-background border-border',
	elevated: 'bg-background border-border shadow-z4',
	outlined: 'bg-background border-2 border-border',
	filled: 'bg-background-secondary border-border',
};

const cardPadding = {
	none: 'p-0',
	sm: 'p-3',
	md: 'p-4',
	lg: 'p-6',
	xl: 'p-8',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
	(
		{
			className,
			variant = 'default',
			padding = 'md',
			hover = false,
			interactive = false,
			...props
		},
		ref
	) => {
		return (
			<div
				ref={ref}
				className={cn(
					// Base styles
					'rounded-lg border transition-all duration-200',

					// Variant styles
					cardVariants[variant],

					// Padding styles
					cardPadding[padding],

					// Interactive styles
					interactive && 'cursor-pointer hover:shadow-z8 active:scale-98',
					hover && 'hover:shadow-z8',

					className
				)}
				{...props}
			/>
		);
	}
);

Card.displayName = 'Card';

// Card Header Component
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
	title?: string;
	subtitle?: string;
	action?: React.ReactNode;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
	({ className, title, subtitle, action, children, ...props }, ref) => {
		return (
			<div ref={ref} className={cn('flex flex-col space-y-1.5 pb-4', className)} {...props}>
				{(title || subtitle || action) && (
					<div className='flex items-center justify-between'>
						<div className='space-y-1'>
							{title && <h3 className='text-lg font-semibold text-foreground'>{title}</h3>}
							{subtitle && <p className='text-sm text-foreground-muted'>{subtitle}</p>}
						</div>
						{action && <div>{action}</div>}
					</div>
				)}
				{children}
			</div>
		);
	}
);

CardHeader.displayName = 'CardHeader';

// Card Content Component
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
	noPadding?: boolean;
}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
	({ className, noPadding = false, ...props }, ref) => {
		return <div ref={ref} className={cn(!noPadding && 'pt-0', className)} {...props} />;
	}
);

CardContent.displayName = 'CardContent';

// Card Footer Component
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
	align?: 'left' | 'center' | 'right' | 'between';
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
	({ className, align = 'left', ...props }, ref) => {
		const alignClasses = {
			left: 'justify-start',
			center: 'justify-center',
			right: 'justify-end',
			between: 'justify-between',
		};

		return (
			<div
				ref={ref}
				className={cn('flex items-center pt-4', alignClasses[align], className)}
				{...props}
			/>
		);
	}
);

CardFooter.displayName = 'CardFooter';

// Card Title Component
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
	as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
	({ className, as: Component = 'h3', ...props }, ref) => {
		return (
			<Component
				ref={ref}
				className={cn('text-lg font-semibold text-foreground', className)}
				{...props}
			/>
		);
	}
);

CardTitle.displayName = 'CardTitle';

// Card Description Component
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
	children?: React.ReactNode;
}

export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
	({ className, ...props }, ref) => {
		return <p ref={ref} className={cn('text-sm text-foreground-muted', className)} {...props} />;
	}
);

CardDescription.displayName = 'CardDescription';

// Stats Card Component
export interface StatsCardProps extends CardProps {
	title: string;
	value: string | number;
	change?: {
		value: string | number;
		type: 'positive' | 'negative' | 'neutral';
	};
	icon?: React.ReactNode;
	trend?: 'up' | 'down' | 'stable';
}

export const StatsCard: React.FC<StatsCardProps> = ({
	title,
	value,
	change,
	icon,
	trend,
	...props
}) => {
	const trendColors = {
		up: 'text-success',
		down: 'text-error',
		stable: 'text-foreground-muted',
	};

	const changeColors = {
		positive: 'text-success',
		negative: 'text-error',
		neutral: 'text-foreground-muted',
	};

	return (
		<Card {...props}>
			<div className='flex items-center justify-between'>
				<div className='space-y-1'>
					<p className='text-sm font-medium text-foreground-muted'>{title}</p>
					<p className='text-2xl font-bold text-foreground'>{value}</p>
					{change && (
						<p className={cn('text-sm font-medium', changeColors[change.type])}>
							{change.type === 'positive' && '+'}
							{change.value}
						</p>
					)}
				</div>
				{icon && <div className={cn('p-2 rounded-lg', trendColors[trend || 'stable'])}>{icon}</div>}
			</div>
		</Card>
	);
};
