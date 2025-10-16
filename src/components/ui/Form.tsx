/**
 * Form Components
 * Comprehensive form components including Checkbox, Radio, Switch, and Dropdown
 */

import React from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../utils/cn';

// Checkbox Component
export interface CheckboxProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
	label?: string;
	helperText?: string;
	error?: string;
	size?: 'sm' | 'md' | 'lg';
	variant?: 'default' | 'filled';
	indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
	(
		{
			className,
			label,
			helperText,
			error,
			size = 'md',
			variant = 'default',
			indeterminate = false,
			...props
		},
		ref,
	) => {
		const hasError = !!error;

		const sizeClasses = {
			sm: 'h-4 w-4',
			md: 'h-5 w-5',
			lg: 'h-6 w-6',
		};

		const variantClasses = {
			default: 'border-border bg-input',
			filled: 'border-transparent bg-input-secondary',
		};

		return (
			<div className='space-y-2'>
				<label className='flex items-start space-x-3 cursor-pointer'>
					<div className='relative'>
						<input
							ref={ref}
							type='checkbox'
							className={cn('sr-only', className)}
							{...props}
						/>
						<div
							className={cn(
								'rounded border-2 transition-all duration-200 flex items-center justify-center',
								sizeClasses[size],
								variantClasses[variant],
								hasError ? 'border-error' : 'border-border',
								props.checked && 'bg-primary border-primary',
								'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
							)}
						>
							{props.checked && (
								<Check
									className={cn(
										'text-primary-foreground',
										size === 'sm'
											? 'h-3 w-3'
											: size === 'md'
											? 'h-4 w-4'
											: 'h-5 w-5',
									)}
								/>
							)}
							{indeterminate && !props.checked && (
								<div
									className={cn(
										'bg-primary-foreground rounded-sm',
										size === 'sm'
											? 'h-1 w-2'
											: size === 'md'
											? 'h-1 w-3'
											: 'h-1 w-4',
									)}
								/>
							)}
						</div>
					</div>
					<div className='flex-1 min-w-0'>
						{label && (
							<span
								className={cn(
									'font-medium text-foreground',
									size === 'sm'
										? 'text-sm'
										: size === 'md'
										? 'text-sm'
										: 'text-base',
								)}
							>
								{label}
							</span>
						)}
						{helperText && (
							<p
								className={cn(
									'text-foreground-muted',
									size === 'sm' ? 'text-xs' : 'text-sm',
								)}
							>
								{helperText}
							</p>
						)}
					</div>
				</label>
				{error && <p className='text-sm text-error'>{error}</p>}
			</div>
		);
	},
);

Checkbox.displayName = 'Checkbox';

// Radio Component
export interface RadioProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
	label?: string;
	helperText?: string;
	error?: string;
	size?: 'sm' | 'md' | 'lg';
	variant?: 'default' | 'filled';
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
	(
		{
			className,
			label,
			helperText,
			error,
			size = 'md',
			variant = 'default',
			...props
		},
		ref,
	) => {
		const hasError = !!error;

		const sizeClasses = {
			sm: 'h-4 w-4',
			md: 'h-5 w-5',
			lg: 'h-6 w-6',
		};

		const variantClasses = {
			default: 'border-border bg-input',
			filled: 'border-transparent bg-input-secondary',
		};

		return (
			<div className='space-y-2'>
				<label className='flex items-start space-x-3 cursor-pointer'>
					<div className='relative'>
						<input
							ref={ref}
							type='radio'
							className={cn('sr-only', className)}
							{...props}
						/>
						<div
							className={cn(
								'rounded-full border-2 transition-all duration-200 flex items-center justify-center',
								sizeClasses[size],
								variantClasses[variant],
								hasError ? 'border-error' : 'border-border',
								'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
							)}
						>
							{props.checked && (
								<div
									className={cn(
										'bg-primary rounded-full',
										size === 'sm'
											? 'h-2 w-2'
											: size === 'md'
											? 'h-2.5 w-2.5'
											: 'h-3 w-3',
									)}
								/>
							)}
						</div>
					</div>
					<div className='flex-1 min-w-0'>
						{label && (
							<span
								className={cn(
									'font-medium text-foreground',
									size === 'sm'
										? 'text-sm'
										: size === 'md'
										? 'text-sm'
										: 'text-base',
								)}
							>
								{label}
							</span>
						)}
						{helperText && (
							<p
								className={cn(
									'text-foreground-muted',
									size === 'sm' ? 'text-xs' : 'text-sm',
								)}
							>
								{helperText}
							</p>
						)}
					</div>
				</label>
				{error && <p className='text-sm text-error'>{error}</p>}
			</div>
		);
	},
);

Radio.displayName = 'Radio';

// Switch Component
export interface SwitchProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
	label?: string;
	helperText?: string;
	error?: string;
	size?: 'sm' | 'md' | 'lg';
	variant?: 'default' | 'filled';
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
	(
		{
			className,
			label,
			helperText,
			error,
			size = 'md',
			variant = 'default',
			...props
		},
		ref,
	) => {
		const hasError = !!error;

		const sizeClasses = {
			sm: 'h-5 w-9',
			md: 'h-6 w-11',
			lg: 'h-7 w-13',
		};

		const thumbSizeClasses = {
			sm: 'h-4 w-4',
			md: 'h-5 w-5',
			lg: 'h-6 w-6',
		};

		const variantClasses = {
			default: 'bg-input border-border',
			filled: 'bg-input-secondary border-transparent',
		};

		return (
			<div className='space-y-2'>
				<label className='flex items-start space-x-3 cursor-pointer'>
					<div className='relative'>
						<input
							ref={ref}
							type='checkbox'
							className={cn('sr-only', className)}
							{...props}
						/>
						<div
							className={cn(
								'rounded-full border-2 transition-all duration-200 relative',
								sizeClasses[size],
								variantClasses[variant],
								hasError ? 'border-error' : 'border-border',
								props.checked && 'bg-primary border-primary',
								'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
							)}
						>
							<div
								className={cn(
									'absolute top-0.5 left-0.5 bg-background rounded-full transition-transform duration-200',
									thumbSizeClasses[size],
									props.checked && 'translate-x-5',
								)}
							/>
						</div>
					</div>
					<div className='flex-1 min-w-0'>
						{label && (
							<span
								className={cn(
									'font-medium text-foreground',
									size === 'sm'
										? 'text-sm'
										: size === 'md'
										? 'text-sm'
										: 'text-base',
								)}
							>
								{label}
							</span>
						)}
						{helperText && (
							<p
								className={cn(
									'text-foreground-muted',
									size === 'sm' ? 'text-xs' : 'text-sm',
								)}
							>
								{helperText}
							</p>
						)}
					</div>
				</label>
				{error && <p className='text-sm text-error'>{error}</p>}
			</div>
		);
	},
);

Switch.displayName = 'Switch';

// Dropdown Component
export interface DropdownOption {
	value: string;
	label: string;
	disabled?: boolean;
	icon?: React.ReactNode;
}

export interface DropdownProps {
	options: DropdownOption[];
	value?: string;
	onChange?: (value: string) => void;
	placeholder?: string;
	label?: string;
	helperText?: string;
	error?: string;
	size?: 'sm' | 'md' | 'lg';
	variant?: 'default' | 'filled';
	disabled?: boolean;
	searchable?: boolean;
	className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
	options,
	value,
	onChange,
	placeholder = 'Select an option...',
	label,
	helperText,
	error,
	size = 'md',
	variant = 'default',
	disabled = false,
	searchable = false,
	className,
}) => {
	const [isOpen, setIsOpen] = React.useState(false);
	const [searchTerm, setSearchTerm] = React.useState('');
	const dropdownRef = React.useRef<HTMLDivElement>(null);

	const hasError = !!error;

	const sizeClasses = {
		sm: 'h-8 px-3 text-sm',
		md: 'h-10 px-3 text-sm',
		lg: 'h-12 px-4 text-base',
	};

	const variantClasses = {
		default: 'border-border bg-input text-foreground',
		filled: 'border-transparent bg-input-secondary text-foreground',
	};

	const filteredOptions = options.filter((option) =>
		option.label.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const selectedOption = options.find((option) => option.value === value);

	React.useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	return (
		<div className={cn('space-y-2', className)}>
			{label && (
				<label className='text-sm font-medium text-foreground'>{label}</label>
			)}

			<div className='relative' ref={dropdownRef}>
				<button
					type='button'
					onClick={() => !disabled && setIsOpen(!isOpen)}
					disabled={disabled}
					className={cn(
						'w-full rounded-lg border transition-colors text-left',
						'focus:outline-none focus:ring-2 focus:ring-offset-0',
						'disabled:opacity-50 disabled:pointer-events-none',
						sizeClasses[size],
						variantClasses[variant],
						hasError
							? 'border-error focus:border-error focus:ring-error'
							: 'border-border focus:border-primary focus:ring-primary',
						'flex items-center justify-between',
					)}
				>
					<span
						className={cn(
							'truncate',
							!selectedOption && 'text-foreground-muted',
						)}
					>
						{selectedOption ? selectedOption.label : placeholder}
					</span>
					{isOpen ? (
						<ChevronUp className='h-4 w-4 text-foreground-muted' />
					) : (
						<ChevronDown className='h-4 w-4 text-foreground-muted' />
					)}
				</button>

				{isOpen && (
					<div className='absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-z8 max-h-60 overflow-auto'>
						{searchable && (
							<div className='p-2 border-b border-border'>
								<input
									type='text'
									placeholder='Search...'
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className='w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary'
								/>
							</div>
						)}

						<div className='py-1'>
							{filteredOptions.length > 0 ? (
								filteredOptions.map((option) => (
									<button
										key={option.value}
										type='button'
										onClick={() => {
											onChange?.(option.value);
											setIsOpen(false);
											setSearchTerm('');
										}}
										disabled={option.disabled}
										className={cn(
											'w-full px-3 py-2 text-left text-sm transition-colors',
											'hover:bg-background-secondary focus:bg-background-secondary focus:outline-none',
											option.disabled && 'opacity-50 cursor-not-allowed',
											option.value === value &&
												'bg-primary/10 text-primary font-medium',
										)}
									>
										<div className='flex items-center space-x-2'>
											{option.icon && (
												<span className='text-foreground-muted'>
													{option.icon}
												</span>
											)}
											<span>{option.label}</span>
										</div>
									</button>
								))
							) : (
								<div className='px-3 py-2 text-sm text-foreground-muted'>
									No options found
								</div>
							)}
						</div>
					</div>
				)}
			</div>

			{(helperText || error) && (
				<p
					className={cn(
						'text-sm',
						hasError ? 'text-error' : 'text-foreground-muted',
					)}
				>
					{error || helperText}
				</p>
			)}
		</div>
	);
};
