/**
 * Alert System Component
 * Comprehensive alert system with multiple variants and states
 */

import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface AlertProps {
	variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
	size?: 'sm' | 'md' | 'lg';
	title?: string;
	description?: string;
	icon?: React.ReactNode;
	closable?: boolean;
	onClose?: () => void;
	className?: string;
	children?: React.ReactNode;
}

const alertVariants = {
	default: {
		container: 'bg-background border-border text-foreground',
		icon: 'text-foreground-muted',
	},
	success: {
		container: 'bg-success/10 border-success/20 text-success-foreground',
		icon: 'text-success',
	},
	warning: {
		container: 'bg-warning/10 border-warning/20 text-warning-foreground',
		icon: 'text-warning',
	},
	error: {
		container: 'bg-error/10 border-error/20 text-error-foreground',
		icon: 'text-error',
	},
	info: {
		container: 'bg-info/10 border-info/20 text-info-foreground',
		icon: 'text-info',
	},
};

const alertSizes = {
	sm: {
		container: 'p-3 text-sm',
		icon: 'h-4 w-4',
		title: 'text-sm font-medium',
		description: 'text-xs mt-1',
	},
	md: {
		container: 'p-4 text-sm',
		icon: 'h-5 w-5',
		title: 'text-sm font-medium',
		description: 'text-sm mt-1',
	},
	lg: {
		container: 'p-6 text-base',
		icon: 'h-6 w-6',
		title: 'text-base font-medium',
		description: 'text-sm mt-2',
	},
};

const defaultIcons = {
	default: Info,
	success: CheckCircle,
	warning: AlertTriangle,
	error: AlertCircle,
	info: Info,
};

export const Alert: React.FC<AlertProps> = ({
	variant = 'default',
	size = 'md',
	title,
	description,
	icon,
	closable = false,
	onClose,
	className,
	children,
}) => {
	const IconComponent = icon || defaultIcons[variant];
	const variantStyles = alertVariants[variant];
	const sizeStyles = alertSizes[size];

	return (
		<div
			className={cn(
				'rounded-lg border transition-all duration-200',
				variantStyles.container,
				sizeStyles.container,
				className,
			)}
			role='alert'
		>
			<div className='flex items-start'>
				{IconComponent && (
					<div className='flex-shrink-0 mr-3'>
						{React.isValidElement(IconComponent)
							? IconComponent
							: React.createElement(IconComponent as React.ComponentType<any>, {
									className: cn(variantStyles.icon, sizeStyles.icon),
							  })}
					</div>
				)}

				<div className='flex-1 min-w-0'>
					{title && (
						<h3 className={cn(sizeStyles.title, variantStyles.icon)}>
							{title}
						</h3>
					)}
					{description && (
						<p className={cn(sizeStyles.description, variantStyles.icon)}>
							{description}
						</p>
					)}
					{children && (
						<div className={cn(sizeStyles.description, variantStyles.icon)}>
							{children}
						</div>
					)}
				</div>

				{closable && (
					<button
						onClick={onClose}
						className={cn(
							'flex-shrink-0 ml-3 p-1 rounded-md transition-colors',
							'hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2',
							variantStyles.icon,
						)}
						aria-label='Close alert'
					>
						<X className='h-4 w-4' />
					</button>
				)}
			</div>
		</div>
	);
};

// Alert Container for managing multiple alerts
export interface AlertContainerProps {
	alerts: Array<AlertProps & { id: string }>;
	onRemove?: (id: string) => void;
	className?: string;
}

export const AlertContainer: React.FC<AlertContainerProps> = ({
	alerts,
	onRemove,
	className,
}) => {
	return (
		<div className={cn('space-y-3', className)}>
			{alerts.map((alert) => (
				<Alert
					key={alert.id}
					{...alert}
					closable={onRemove ? true : alert.closable}
					onClose={onRemove ? () => onRemove(alert.id) : alert.onClose}
				/>
			))}
		</div>
	);
};

// Toast-style alerts
export interface ToastProps extends Omit<AlertProps, 'size'> {
	duration?: number;
	position?:
		| 'top-right'
		| 'top-left'
		| 'bottom-right'
		| 'bottom-left'
		| 'top-center'
		| 'bottom-center';
}

export const Toast: React.FC<ToastProps> = ({
	duration = 5000,
	position = 'top-right',
	...props
}) => {
	const [isVisible, setIsVisible] = React.useState(true);

	React.useEffect(() => {
		if (duration > 0) {
			const timer = setTimeout(() => {
				setIsVisible(false);
			}, duration);
			return () => clearTimeout(timer);
		}
	}, [duration]);

	if (!isVisible) return null;

	const positionClasses = {
		'top-right': 'top-4 right-4',
		'top-left': 'top-4 left-4',
		'bottom-right': 'bottom-4 right-4',
		'bottom-left': 'bottom-4 left-4',
		'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
		'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
	};

	return (
		<div
			className={cn('fixed z-50 max-w-sm w-full', positionClasses[position])}
		>
			<Alert {...props} size='md' />
		</div>
	);
};
