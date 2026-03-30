/**
 * Feedback Components
 * Badge, Tooltip, and Snackbar components for user feedback
 */

import React from 'react';
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

// Badge Component
export interface BadgeProps {
	children: React.ReactNode;
	variant?:
		| 'default'
		| 'primary'
		| 'secondary'
		| 'success'
		| 'warning'
		| 'error'
		| 'info';
	size?: 'sm' | 'md' | 'lg';
	shape?: 'default' | 'rounded' | 'pill';
	className?: string;
}

const badgeVariants = {
	default: 'bg-background-secondary text-foreground-secondary border-border',
	primary: 'bg-primary/10 text-primary border-primary/20',
	secondary: 'bg-secondary/10 text-secondary border-secondary/20',
	success: 'bg-success/10 text-success border-success/20',
	warning: 'bg-warning/10 text-warning border-warning/20',
	error: 'bg-error/10 text-error border-error/20',
	info: 'bg-info/10 text-info border-info/20',
};

const badgeSizes = {
	sm: 'px-2 py-0.5 text-xs',
	md: 'px-2.5 py-1 text-xs',
	lg: 'px-3 py-1.5 text-sm',
};

const badgeShapes = {
	default: 'rounded',
	rounded: 'rounded-md',
	pill: 'rounded-full',
};

export const Badge: React.FC<BadgeProps> = ({
	children,
	variant = 'default',
	size = 'md',
	shape = 'default',
	className,
}) => {
	return (
		<span
			className={cn(
				'inline-flex items-center font-medium border',
				badgeVariants[variant],
				badgeSizes[size],
				badgeShapes[shape],
				className,
			)}
		>
			{children}
		</span>
	);
};

// Tooltip Component
export interface TooltipProps {
	children: React.ReactNode;
	content: React.ReactNode;
	placement?: 'top' | 'bottom' | 'left' | 'right';
	trigger?: 'hover' | 'click' | 'focus';
	delay?: number;
	className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
	children,
	content,
	placement = 'top',
	trigger = 'hover',
	delay = 200,
	className,
}) => {
	const [isVisible, setIsVisible] = React.useState(false);
	const showDelayRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
	const tooltipRef = React.useRef<HTMLDivElement>(null);

	const clearShowDelay = () => {
		if (showDelayRef.current !== null) {
			clearTimeout(showDelayRef.current);
			showDelayRef.current = null;
		}
	};

	const showTooltip = () => {
		clearShowDelay();
		if (delay <= 0) {
			setIsVisible(true);
			return;
		}
		showDelayRef.current = setTimeout(() => {
			setIsVisible(true);
			showDelayRef.current = null;
		}, delay);
	};

	const hideTooltip = () => {
		clearShowDelay();
		setIsVisible(false);
	};

	React.useEffect(() => () => clearShowDelay(), []);

	const handleMouseEnter = () => {
		if (trigger === 'hover') showTooltip();
	};

	const handleMouseLeave = () => {
		if (trigger === 'hover') hideTooltip();
	};

	const handleClick = () => {
		if (trigger === 'click') {
			setIsVisible(!isVisible);
		}
	};

	const handleFocus = () => {
		if (trigger === 'focus') showTooltip();
	};

	const handleBlur = () => {
		if (trigger === 'focus') hideTooltip();
	};

	const placementClasses = {
		top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
		bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
		left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
		right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
	};

	const arrowClasses = {
		top: 'top-full left-1/2 transform -translate-x-1/2 border-t-background-secondary',
		bottom:
			'bottom-full left-1/2 transform -translate-x-1/2 border-b-background-secondary',
		left: 'left-full top-1/2 transform -translate-y-1/2 border-l-background-secondary',
		right:
			'right-full top-1/2 transform -translate-y-1/2 border-r-background-secondary',
	};

	return (
		<div className='relative inline-block' ref={tooltipRef}>
			<div
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				onClick={handleClick}
				onFocus={handleFocus}
				onBlur={handleBlur}
				className='inline-block'
			>
				{children}
			</div>

			{isVisible && (
				<div
					className={cn(
						'absolute z-50 px-3 py-2 text-sm text-foreground-secondary bg-background-secondary border border-border rounded-lg shadow-z8 max-w-xs',
						placementClasses[placement],
						className,
					)}
					role='tooltip'
				>
					{content}
					<div
						className={cn(
							'absolute w-0 h-0 border-4 border-transparent',
							arrowClasses[placement],
						)}
					/>
				</div>
			)}
		</div>
	);
};

// Snackbar Component
export interface SnackbarProps {
	open: boolean;
	onClose: () => void;
	message: string;
	variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
	duration?: number;
	position?:
		| 'top-left'
		| 'top-center'
		| 'top-right'
		| 'bottom-left'
		| 'bottom-center'
		| 'bottom-right';
	action?: React.ReactNode;
	className?: string;
}

const snackbarVariants = {
	default: 'bg-background-secondary text-foreground border-border',
	success: 'bg-success/10 text-success border-success/20',
	warning: 'bg-warning/10 text-warning border-warning/20',
	error: 'bg-error/10 text-error border-error/20',
	info: 'bg-info/10 text-info border-info/20',
};

const snackbarIcons = {
	default: Info,
	success: CheckCircle,
	warning: AlertTriangle,
	error: AlertCircle,
	info: Info,
};

const snackbarPositions = {
	'top-left': 'top-4 left-4',
	'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
	'top-right': 'top-4 right-4',
	'bottom-left': 'bottom-4 left-4',
	'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
	'bottom-right': 'bottom-4 right-4',
};

export const Snackbar: React.FC<SnackbarProps> = ({
	open,
	onClose,
	message,
	variant = 'default',
	duration = 5000,
	position = 'bottom-right',
	action,
	className,
}) => {
	const [isVisible, setIsVisible] = React.useState(open);
	const IconComponent = snackbarIcons[variant];

	React.useEffect(() => {
		if (open) {
			setIsVisible(true);

			if (duration > 0) {
				const timer = setTimeout(() => {
					setIsVisible(false);
					setTimeout(onClose, 200); // Wait for animation to complete
				}, duration);

				return () => clearTimeout(timer);
			}
		} else {
			setIsVisible(false);
		}
	}, [open, duration, onClose]);

	if (!open && !isVisible) return null;

	return (
		<div
			className={cn(
				'fixed z-50 max-w-sm w-full transition-all duration-200',
				snackbarPositions[position],
				isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
				className,
			)}
		>
			<div
				className={cn(
					'flex items-center space-x-3 p-4 rounded-lg border shadow-z8',
					snackbarVariants[variant],
				)}
			>
				<IconComponent className='h-5 w-5 flex-shrink-0' />

				<div className='flex-1 min-w-0'>
					<p className='text-sm font-medium'>{message}</p>
				</div>

				{action && <div className='flex-shrink-0'>{action}</div>}

				<button
					onClick={onClose}
					className='flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors'
				>
					<X className='h-4 w-4' />
				</button>
			</div>
		</div>
	);
};

// Snackbar Provider for managing multiple snackbars
export interface SnackbarItem {
	id: string;
	message: string;
	variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
	duration?: number;
	action?: React.ReactNode;
}

export interface SnackbarProviderProps {
	children: React.ReactNode;
	maxSnackbars?: number;
}

export const SnackbarProvider: React.FC<SnackbarProviderProps> = ({
	children,
	maxSnackbars = 3,
}) => {
	const [snackbars, setSnackbars] = React.useState<SnackbarItem[]>([]);

	const addSnackbar = (snackbar: Omit<SnackbarItem, 'id'>) => {
		const id = Math.random().toString(36).substr(2, 9);
		const newSnackbar = { ...snackbar, id };

		setSnackbars((prev) => {
			const updated = [...prev, newSnackbar];
			return updated.slice(-maxSnackbars);
		});
	};

	const removeSnackbar = (id: string) => {
		setSnackbars((prev) => prev.filter((snackbar) => snackbar.id !== id));
	};

	const contextValue = {
		addSnackbar,
		removeSnackbar,
	};

	return (
		<SnackbarContext.Provider value={contextValue}>
			{children}
			<div className='fixed z-50 space-y-2 top-4 right-4'>
				{snackbars.map((snackbar) => (
					<Snackbar
						key={snackbar.id}
						open={true}
						onClose={() => removeSnackbar(snackbar.id)}
						message={snackbar.message}
						variant={snackbar.variant}
						duration={snackbar.duration}
						action={snackbar.action}
						position='top-right'
					/>
				))}
			</div>
		</SnackbarContext.Provider>
	);
};

const SnackbarContext = React.createContext<{
	addSnackbar: (snackbar: Omit<SnackbarItem, 'id'>) => void;
	removeSnackbar: (id: string) => void;
} | null>(null);

export const useSnackbar = () => {
	const context = React.useContext(SnackbarContext);
	if (!context) {
		throw new Error('useSnackbar must be used within a SnackbarProvider');
	}
	return context;
};
