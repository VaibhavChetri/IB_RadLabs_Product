import React, { useState, forwardRef } from 'react';
import { cn } from '../../utils/cn';

// -----------------------
// Type Definitions
// -----------------------
export interface FloatingInputProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	type?: 'text' | 'email' | 'password' | 'number' | 'date';
	disabled?: boolean;
	error?: boolean;
	errorMessage?: string;
	required?: boolean;
	className?: string;
}

// -----------------------
// Floating Input Component
// -----------------------
export const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
	(
		{
			label,
			value,
			onChange,
			placeholder,
			type = 'text',
			disabled = false,
			error = false,
			errorMessage,
			required = false,
			className,
		},
		ref
	) => {
		const [isFocused, setIsFocused] = useState(false);

		return (
			<div className={cn('relative w-full', className)}>
				<input
					ref={ref}
					type={type}
					value={value}
					onChange={e => onChange(e.target.value)}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
					disabled={disabled}
					className={cn(
						'w-full px-4 py-4 text-sm bg-white border border-gray-300 rounded-md',
						'focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-200',
						'transition-all duration-200 ease-in-out',
						'placeholder-transparent',
						error && 'border-red-500 focus:border-red-500 focus:ring-red-200',
						disabled && 'opacity-50 cursor-not-allowed bg-gray-50'
					)}
					placeholder={placeholder || `Enter ${label.toLowerCase()}`}
				/>

				<label
					className={cn(
						'absolute left-4 bg-white px-1 pointer-events-none transition-all duration-200 ease-in-out',
						isFocused || value // float if focused or filled
							? '-top-2 text-xs text-green-600 font-medium'
							: 'top-4 text-sm text-gray-500',
						error && (isFocused || value) && 'text-red-500',
						disabled && 'text-gray-400'
					)}
				>
					{label}
					{required && <span className='text-red-500 ml-1'>*</span>}
				</label>

				{error && errorMessage && <p className='mt-1 text-xs text-red-500'>{errorMessage}</p>}
			</div>
		);
	}
);

FloatingInput.displayName = 'FloatingInput';
