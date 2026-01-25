import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';

// -----------------------
// Type Definitions
// -----------------------
export interface MultiSelectOption {
	value: string;
	label: string;
	disabled?: boolean;
}

export interface MultiSelectDropdownProps {
	label: string;
	options: MultiSelectOption[];
	value: string[];
	onChange: (value: string[]) => void;
	placeholder?: string;
	disabled?: boolean;
	error?: boolean;
	errorMessage?: string;
	required?: boolean;
	className?: string;
	loading?: boolean;
	searchable?: boolean;
	maxDisplayItems?: number;
	showSelectedCount?: boolean; // New prop to show "X selected" format
}

// -----------------------
// Multi Select Dropdown Component
// -----------------------
export const MultiSelectDropdown = forwardRef<HTMLDivElement, MultiSelectDropdownProps>(
	(
		{
			label,
			options,
			value,
			onChange,
			placeholder = 'Select options...',
			disabled = false,
			error = false,
			errorMessage,
			required = false,
			className,
			loading = false,
			searchable = false,
			maxDisplayItems = 3,
			showSelectedCount = false,
		},
		ref
	) => {
		const [isOpen, setIsOpen] = useState(false);
		const [isFocused, setIsFocused] = useState(false);
		const [searchTerm, setSearchTerm] = useState('');
		const internalRef = useRef<HTMLDivElement>(null);
		const dropdownRef = ref || internalRef;
		const searchRef = useRef<HTMLInputElement>(null);

		const selectedOptions = options.filter(option => value.includes(option.value));

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

		const handleOptionToggle = (optionValue: string) => {
			if (disabled) return;
			const newValue = value.includes(optionValue)
				? value.filter(v => v !== optionValue)
				: [...value, optionValue];
			onChange(newValue);
		};

		const handleRemoveOption = (optionValue: string) => {
			if (disabled) return;
			const newValue = value.filter(v => v !== optionValue);
			onChange(newValue);
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

		const shouldFloat = isFocused || isOpen || selectedOptions.length > 0;

		return (
			<div
				className={cn('relative w-full', className)}
				ref={dropdownRef as React.RefObject<HTMLDivElement>}
			>
				{/* Floating label always visible above */}
				<label
					className={cn(
						'absolute left-4 bg-background px-1 pointer-events-none transition-all duration-200 ease-in-out z-[100]',
						shouldFloat
							? '-top-2 text-xs text-primary font-medium'
							: 'top-4 text-sm text-foreground-muted',
						error && shouldFloat && 'text-red-500',
						disabled && 'text-foreground-muted'
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
										'w-full pl-10 pr-10 py-4 text-sm bg-background border rounded-t-md',
										'focus:outline-none focus:border-primary transition-all duration-200',
										error ? 'border-red-500 focus:border-red-500' : 'border-border'
									)}
								/>
								<button
									type='button'
									onClick={() => {
										setIsOpen(false);
										setSearchTerm('');
									}}
									className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
								>
									<X className='h-4 w-4' />
								</button>
							</div>

							{/* Options */}
							<div className='absolute z-[9999] w-full bg-background border border-border border-t-0 rounded-b-md shadow-lg max-h-60 overflow-hidden'>
								<div className='max-h-60 overflow-y-auto'>
									{filteredOptions.length === 0 ? (
										<div className='px-3 py-2 text-sm text-foreground-muted'>
											{searchTerm ? 'No options found' : 'No options available'}
										</div>
									) : (
										filteredOptions.map(option => (
											<button
												key={option.value}
												type='button'
												onClick={() => handleOptionToggle(option.value)}
												disabled={option.disabled}
												className={cn(
													'w-full px-3 py-2 text-left text-sm transition-colors flex items-center justify-between',
													option.disabled
														? 'opacity-50 cursor-not-allowed text-foreground-muted'
														: 'cursor-pointer hover:bg-primary/5 text-foreground',
													selectedOptions.some(selected => selected.value === option.value) &&
														'bg-primary/10'
												)}
											>
												<span className='truncate'>{option.label}</span>
												{selectedOptions.some(selected => selected.value === option.value) && (
													<Check className='h-4 w-4 text-primary flex-shrink-0' />
												)}
											</button>
										))
									)}
								</div>
							</div>
						</div>
					) : (
						<>
							<button
								type='button'
								onClick={() => !disabled && setIsOpen(!isOpen)}
								onKeyDown={handleKeyDown}
								onFocus={() => setIsFocused(true)}
								onBlur={() => setIsFocused(false)}
								disabled={disabled || loading}
								className={cn(
									'relative w-full px-4 py-4 text-left bg-background border border-border rounded-md transition-all duration-200',
									error && 'border-red-500 focus:border-red-500',
									disabled
										? 'opacity-50 cursor-not-allowed bg-background-secondary'
										: 'cursor-pointer hover:border-primary/50',
									shouldFloat && 'border-primary ring-1 ring-primary/20',
									isOpen && 'rounded-b-none'
								)}
							>
								<div className='flex  items-center justify-between'>
									<div className=' flex   min-w-0'>
										{selectedOptions.length > 0 ? (
											showSelectedCount ? (
												<span className='inline-flex px-1.5 pb-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full border border-green-200'>
													{selectedOptions.length} selected
												</span>
											) : (
												<div className='flex flex-wrap gap-1'>
													{selectedOptions.slice(0, maxDisplayItems).map(option => (
														<span
															key={option.value}
															className='inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md'
														>
															{option.label}
															<button
																type='button'
																onClick={e => {
																	e.stopPropagation();
																	handleRemoveOption(option.value);
																}}
																className='hover:text-primary/70'
															>
																<X className='h-3 w-3' />
															</button>
														</span>
													))}
													{selectedOptions.length > maxDisplayItems && (
														<span className='text-xs text-foreground-muted'>
															+{selectedOptions.length - maxDisplayItems} more
														</span>
													)}
												</div>
											)
										) : (
											<span className='text-foreground-muted'>
												{loading ? 'Loading...' : (shouldFloat ? placeholder : '') || ''}
											</span>
										)}
									</div>
									<ChevronDown
										className={cn(
											'h-4 w-4 text-foreground-muted transition-transform ml-2 flex-shrink-0',
											isOpen && 'rotate-180'
										)}
									/>
								</div>
							</button>
							{/* Options dropdown for non-searchable mode */}
							{isOpen && !searchable && (
								<div className='absolute z-[9999] w-full bg-background border border-border border-t-0 rounded-b-md shadow-lg max-h-60 overflow-hidden'>
									<div className='max-h-60 overflow-y-auto'>
										{filteredOptions.length === 0 ? (
											<div className='px-3 py-2 text-sm text-foreground-muted'>
												No options available
											</div>
										) : (
											filteredOptions.map(option => (
												<button
													key={option.value}
													type='button'
													onClick={() => handleOptionToggle(option.value)}
													disabled={option.disabled}
													className={cn(
														'w-full px-3 py-2 text-left text-sm transition-colors flex items-center justify-between',
														option.disabled
															? 'opacity-50 cursor-not-allowed text-foreground-muted'
															: 'cursor-pointer hover:bg-primary/5 text-foreground',
														selectedOptions.some(selected => selected.value === option.value) &&
															'bg-primary/10'
													)}
												>
													<span className='truncate'>{option.label}</span>
													{selectedOptions.some(selected => selected.value === option.value) && (
														<Check className='h-4 w-4 text-primary flex-shrink-0' />
													)}
												</button>
											))
										)}
									</div>
								</div>
							)}
						</>
					)}
				</div>

				{error && errorMessage && <p className='text-red-500 text-sm mt-1'>{errorMessage}</p>}
			</div>
		);
	}
);

MultiSelectDropdown.displayName = 'MultiSelectDropdown';
