/**
 * Enhanced Button Component
 * Comprehensive button system with multiple variants, sizes, and states
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?:
		| 'primary'
		| 'secondary'
		| 'outline'
		| 'ghost'
		| 'link'
		| 'destructive';
	size?: 'sm' | 'md' | 'lg' | 'xl';
	loading?: boolean;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
	fullWidth?: boolean;
	asChild?: boolean;
}

const buttonVariants = {
	primary:
		'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary shadow-sm',
	secondary:
		'bg-secondary text-secondary-foreground hover:bg-secondary/90 focus:ring-secondary shadow-sm',
	outline:
		'border border-border bg-background text-foreground hover:bg-background-secondary focus:ring-primary',
	ghost: 'text-foreground hover:bg-background-secondary focus:ring-primary',
	link: 'text-primary underline-offset-4 hover:underline focus:ring-primary',
	destructive:
		'bg-error text-error-foreground hover:bg-error/90 focus:ring-error shadow-sm',
};

const buttonSizes = {
	sm: 'h-8 px-3 text-sm',
	md: 'h-10 px-4 text-sm',
	lg: 'h-12 px-6 text-base',
	xl: 'h-14 px-8 text-lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant = 'primary',
			size = 'md',
			loading = false,
			leftIcon,
			rightIcon,
			fullWidth = false,
			disabled,
			children,
			...props
		},
		ref,
	) => {
		const isDisabled = disabled || loading;

		return (
			<button
				className={cn(
					// Base styles
					'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
					'focus:outline-none focus:ring-2 focus:ring-offset-2',
					'disabled:opacity-50 disabled:pointer-events-none',
					'active:scale-95',

					// Variant styles
					buttonVariants[variant],

					// Size styles
					buttonSizes[size],

					// Full width
					fullWidth && 'w-full',

					className,
				)}
				disabled={isDisabled}
				ref={ref}
				{...props}
			>
				{loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}

				{!loading && leftIcon && <span className='mr-2'>{leftIcon}</span>}

				{children}

				{!loading && rightIcon && <span className='ml-2'>{rightIcon}</span>}
			</button>
		);
	},
);

Button.displayName = 'Button';

// Button Group Component
export interface ButtonGroupProps {
	children: React.ReactNode;
	orientation?: 'horizontal' | 'vertical';
	spacing?: 'none' | 'sm' | 'md' | 'lg';
	className?: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
	children,
	orientation = 'horizontal',
	spacing = 'sm',
	className,
}) => {
	const spacingClasses = {
		none: 'gap-0',
		sm: 'gap-1',
		md: 'gap-2',
		lg: 'gap-3',
	};

	const orientationClasses = {
		horizontal: 'flex-row',
		vertical: 'flex-col',
	};

	return (
		<div
			className={cn(
				'inline-flex',
				orientationClasses[orientation],
				spacingClasses[spacing],
				className,
			)}
		>
			{children}
		</div>
	);
};

// Icon Button Component
export interface IconButtonProps
	extends Omit<ButtonProps, 'leftIcon' | 'rightIcon'> {
	icon: React.ReactNode;
	'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
	({ className, icon, size = 'md', ...props }, ref) => {
		const iconSizes = {
			sm: 'h-4 w-4',
			md: 'h-5 w-5',
			lg: 'h-6 w-6',
			xl: 'h-7 w-7',
		};

		return (
			<Button
				ref={ref}
				className={cn('p-0 aspect-square', className)}
				size={size}
				{...props}
			>
				<span className={iconSizes[size]}>{icon}</span>
			</Button>
		);
	},
);

IconButton.displayName = 'IconButton';

// Floating Action Button
export interface FABProps extends Omit<ButtonProps, 'size'> {
	position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const FAB: React.FC<FABProps> = ({
	position = 'bottom-right',
	className,
	...props
}) => {
	const positionClasses = {
		'bottom-right': 'fixed bottom-6 right-6',
		'bottom-left': 'fixed bottom-6 left-6',
		'top-right': 'fixed top-6 right-6',
		'top-left': 'fixed top-6 left-6',
	};

	return (
		<Button
			className={cn(
				'rounded-full shadow-lg z-50',
				positionClasses[position],
				className,
			)}
			size='lg'
			{...props}
		/>
	);
};
