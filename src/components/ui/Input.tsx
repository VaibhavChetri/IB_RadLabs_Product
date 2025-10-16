/**
 * Enhanced Input Component
 * Comprehensive input system with multiple variants, sizes, and states
 */

import React from 'react';
import { Eye, EyeOff, Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
	label?: string;
	helperText?: string;
	error?: string;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
	variant?: 'default' | 'filled';
	size?: 'sm' | 'md' | 'lg';
	fullWidth?: boolean;
	clearable?: boolean;
	onClear?: () => void;
}

const inputVariants = {
	default:
		'border-border bg-input text-foreground placeholder:text-foreground-muted focus:border-primary focus:ring-primary',
	filled:
		'border-transparent bg-input-secondary text-foreground placeholder:text-foreground-muted focus:border-primary focus:ring-primary',
};

const inputSizes = {
	sm: 'h-8 px-3 text-sm',
	md: 'h-10 px-3 text-sm',
	lg: 'h-12 px-4 text-base',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
	(
		{
			className,
			label,
			helperText,
			error,
			leftIcon,
			rightIcon,
			variant = 'default',
			size = 'md',
			fullWidth = false,
			clearable = false,
			onClear,
			value,
			onChange,
			...props
		},
		ref
	) => {
		const [showPassword, setShowPassword] = React.useState(false);
		const [internalValue, setInternalValue] = React.useState(value || '');

		const isPassword = props.type === 'password';
		const hasError = !!error;
		const hasValue = value !== undefined ? value !== '' : internalValue !== '';

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			setInternalValue(e.target.value);
			onChange?.(e);
		};

		const handleClear = () => {
			setInternalValue('');
			onClear?.();
		};

		const inputType = isPassword && showPassword ? 'text' : props.type;

		return (
			<div className={cn('space-y-2', fullWidth && 'w-full')}>
				{label && (
					<label className='text-sm font-medium text-foreground'>
						{label}
						{props.required && <span className='text-error ml-1'>*</span>}
					</label>
				)}

				<div className='relative'>
					{leftIcon && (
						<div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted'>
							{leftIcon}
						</div>
					)}

					<input
						ref={ref}
						className={cn(
							// Base styles
							'w-full rounded-lg border transition-colors',
							'focus:outline-none focus:ring-2 focus:ring-offset-0',
							'disabled:opacity-50 disabled:pointer-events-none',

							// Variant styles
							inputVariants[variant],

							// Size styles
							inputSizes[size],

							// Icon padding
							leftIcon && 'pl-10',
							(rightIcon || clearable || isPassword) && 'pr-10',

							// Error state
							hasError && 'border-error focus:border-error focus:ring-error',

							className
						)}
						value={value !== undefined ? value : internalValue}
						onChange={handleChange}
						type={inputType}
						{...props}
					/>

					<div className='absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1'>
						{clearable && hasValue && (
							<button
								type='button'
								onClick={handleClear}
								className='text-foreground-muted hover:text-foreground transition-colors'
							>
								<X className='h-4 w-4' />
							</button>
						)}

						{isPassword && (
							<button
								type='button'
								onClick={() => setShowPassword(!showPassword)}
								className='text-foreground-muted hover:text-foreground transition-colors'
							>
								{showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
							</button>
						)}

						{rightIcon && !isPassword && !clearable && (
							<div className='text-foreground-muted'>{rightIcon}</div>
						)}
					</div>
				</div>

				{(helperText || error) && (
					<p className={cn('text-sm', hasError ? 'text-error' : 'text-foreground-muted')}>
						{error || helperText}
					</p>
				)}
			</div>
		);
	}
);

Input.displayName = 'Input';

// Search Input Component
export interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'type'> {
	onSearch?: (value: string) => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
	({ onSearch, onChange: _onChange, ...props }, ref) => {
		const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === 'Enter') {
				onSearch?.(e.currentTarget.value);
			}
		};

		return (
			<Input
				ref={ref}
				leftIcon={<Search className='h-4 w-4' />}
				placeholder='Search...'
				onKeyPress={handleKeyPress}
				{...props}
			/>
		);
	}
);

SearchInput.displayName = 'SearchInput';

// Textarea Component
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: string;
	helperText?: string;
	error?: string;
	variant?: 'default' | 'filled';
	size?: 'sm' | 'md' | 'lg';
	fullWidth?: boolean;
	resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
	(
		{
			className,
			label,
			helperText,
			error,
			variant = 'default',
			size = 'md',
			fullWidth = false,
			resize = 'vertical',
			...props
		},
		ref
	) => {
		const hasError = !!error;

		const textareaVariants = {
			default:
				'border-border bg-input text-foreground placeholder:text-foreground-muted focus:border-primary focus:ring-primary',
			filled:
				'border-transparent bg-input-secondary text-foreground placeholder:text-foreground-muted focus:border-primary focus:ring-primary',
		};

		const textareaSizes = {
			sm: 'px-3 py-2 text-sm min-h-[60px]',
			md: 'px-3 py-3 text-sm min-h-[80px]',
			lg: 'px-4 py-4 text-base min-h-[100px]',
		};

		const resizeClasses = {
			none: 'resize-none',
			vertical: 'resize-y',
			horizontal: 'resize-x',
			both: 'resize',
		};

		return (
			<div className={cn('space-y-2', fullWidth && 'w-full')}>
				{label && (
					<label className='text-sm font-medium text-foreground'>
						{label}
						{props.required && <span className='text-error ml-1'>*</span>}
					</label>
				)}

				<textarea
					ref={ref}
					className={cn(
						// Base styles
						'w-full rounded-lg border transition-colors',
						'focus:outline-none focus:ring-2 focus:ring-offset-0',
						'disabled:opacity-50 disabled:pointer-events-none',

						// Variant styles
						textareaVariants[variant],

						// Size styles
						textareaSizes[size],

						// Resize styles
						resizeClasses[resize],

						// Error state
						hasError && 'border-error focus:border-error focus:ring-error',

						className
					)}
					{...props}
				/>

				{(helperText || error) && (
					<p className={cn('text-sm', hasError ? 'text-error' : 'text-foreground-muted')}>
						{error || helperText}
					</p>
				)}
			</div>
		);
	}
);

Textarea.displayName = 'Textarea';
