import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';

// -----------------------
// Type Definitions
// -----------------------
export interface DropdownOption {
	value: string;
	label: string;
	disabled?: boolean;
}

export interface FloatingDropdownProps {
	label: string;
	options: DropdownOption[];
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	error?: boolean;
	errorMessage?: string;
	required?: boolean;
	className?: string;
	loading?: boolean;
	searchable?: boolean;
}

// -----------------------
// Floating Dropdown Component
// -----------------------
export const FloatingDropdown = forwardRef<HTMLDivElement, FloatingDropdownProps>(
	(
		{
			label,
			options,
			value,
			onChange,
			disabled = false,
			error = false,
			errorMessage,
			required = false,
			className,
			loading = false,
			searchable = true,
		},
		_ref
	) => {
		const [isOpen, setIsOpen] = useState(false);
		const [isFocused, setIsFocused] = useState(false);
		const [searchTerm, setSearchTerm] = useState('');
		const internalRef = useRef<HTMLDivElement>(null);
		const dropdownRef = _ref || internalRef;
		const searchRef = useRef<HTMLInputElement>(null);

		const selectedOption = options.find(o => o.value === value);

		// Filter options
		const filteredOptions = searchable
			? options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
			: options;

		// Close on outside click
		useEffect(() => {
			const handleClickOutside = (e: MouseEvent) => {
				const ref = dropdownRef as React.RefObject<HTMLDivElement>;
				if (ref.current && !ref.current.contains(e.target as Node)) {
					setIsOpen(false);
					setSearchTerm('');
					setIsFocused(false);
				}
			};
			document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}, [dropdownRef]);

		// Focus search input on open
		useEffect(() => {
			if (isOpen && searchable && searchRef.current) {
				searchRef.current.focus();
			}
		}, [isOpen, searchable]);

		const handleOptionClick = (optionValue: string) => {
			if (disabled) return;
			onChange(optionValue);
			setIsOpen(false);
			setSearchTerm('');
			setIsFocused(false);
		};

		const handleKeyDown = (event: React.KeyboardEvent) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				setIsOpen(!isOpen);
				setIsFocused(true);
			} else if (event.key === 'Escape') {
				setIsOpen(false);
				setSearchTerm('');
				setIsFocused(false);
			}
		};

		const shouldFloat = isFocused || isOpen || !!selectedOption;

		return (
			<div
				className={cn('relative w-full', className)}
				ref={dropdownRef as React.RefObject<HTMLDivElement>}
			>
				{/* Floating label always visible above */}
				<label
					className={cn(
						'absolute left-4 bg-white px-1 pointer-events-none transition-all duration-200 ease-in-out',
						shouldFloat
							? '-top-2 text-xs text-green-600 font-medium z-50'
							: 'top-4 text-sm text-gray-500 z-30',
						error && shouldFloat && 'text-red-500',
						disabled && 'text-gray-400'
					)}
				>
					{label}
					{required && <span className='text-red-500 ml-1'>*</span>}
				</label>

				<div className='relative'>
					{searchable && isOpen ? (
						<div className='space-y-0 relative'>
							{/* Search box */}
							<div className='relative'>
								<Search className='absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
								<input
									ref={searchRef}
									type='text'
									value={searchTerm}
									onChange={e => setSearchTerm(e.target.value)}
									placeholder='Search options...'
									className={cn(
										'w-full pl-10 pr-10 py-4 text-sm bg-white border rounded-t-md',
										'focus:outline-none focus:border-green-400 transition-all duration-200',
										error ? 'border-red-500 focus:border-red-500' : 'border-gray-300'
									)}
								/>
								<button
									type='button'
									onClick={() => {
										setIsOpen(false);
										setIsFocused(false);
									}}
									className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
								>
									<X className='h-4 w-4' />
								</button>
							</div>

							{/* Options */}
							<div className='absolute z-[9999] w-full bg-white border border-gray-200 border-t-0 rounded-b-md shadow-md max-h-[180px] overflow-hidden'>
								<div className='max-h-[180px] overflow-y-auto'>
									{filteredOptions.length === 0 ? (
										<div className='px-4 py-6 text-center text-sm text-gray-500'>
											{searchTerm ? 'No options found' : 'No options available'}
										</div>
									) : (
										filteredOptions.map(option => (
											<button
												key={option.value}
												type='button'
												onClick={() => handleOptionClick(option.value)}
												disabled={option.disabled}
												className={cn(
													'w-full px-4 py-3 text-left text-sm flex items-center justify-between transition-colors',
													option.disabled
														? 'opacity-50 cursor-not-allowed text-gray-400'
														: 'cursor-pointer hover:bg-gray-50 text-gray-900',
													option.value === value && 'bg-green-50 text-green-600 font-medium'
												)}
											>
												<span className='truncate'>{option.label}</span>
												{option.value === value && <Check className='h-4 w-4 text-green-600' />}
											</button>
										))
									)}
								</div>
							</div>
						</div>
					) : (
						<button
							type='button'
							onClick={() => !disabled && setIsOpen(prev => !prev)}
							onKeyDown={handleKeyDown}
							onFocus={() => setIsFocused(true)}
							onBlur={() => setIsFocused(false)}
							disabled={disabled || loading}
							className={cn(
								'relative w-full px-4 py-4 text-left bg-white border border-gray-300 rounded-md transition-all duration-200',
								error && 'border-red-500 focus:border-red-500',
								disabled
									? 'opacity-50 cursor-not-allowed bg-gray-50'
									: 'cursor-pointer hover:border-gray-400',
								shouldFloat && 'border-green-400 ring-1 ring-green-200'
							)}
						>
							<div className='flex items-center justify-between'>
								<span className='block truncate text-sm text-gray-900 font-medium'>
									{loading ? 'Loading...' : selectedOption?.label || ''}
								</span>
								<ChevronDown
									className={cn(
										'h-4 w-4 text-gray-400 transition-transform duration-200',
										isOpen && 'rotate-180'
									)}
								/>
							</div>
						</button>
					)}
				</div>

				{error && errorMessage && <p className='mt-1 text-xs text-red-500'>{errorMessage}</p>}
			</div>
		);
	}
);

FloatingDropdown.displayName = 'FloatingDropdown';
