import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface MultiSelectOption {
	value: string;
	label: string;
	disabled?: boolean;
}

export interface MultiSelectDropdownProps {
	options: MultiSelectOption[];
	value: string[];
	onChange: (values: string[]) => void;
	placeholder?: string;
	disabled?: boolean;
	error?: boolean;
	errorMessage?: string;
	label?: string;
	required?: boolean;
	className?: string;
	loading?: boolean;
	searchable?: boolean;
	maxDisplayItems?: number;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
	options,
	value,
	onChange,
	placeholder = 'Select options',
	disabled = false,
	error = false,
	errorMessage,
	label,
	required = false,
	className,
	loading = false,
	searchable = false,
	maxDisplayItems = 3,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const dropdownRef = useRef<HTMLDivElement>(null);
	const searchRef = useRef<HTMLInputElement>(null);

	// Filter options based on search term
	const filteredOptions = searchable
		? options.filter(option => option.label.toLowerCase().includes(searchTerm.toLowerCase()))
		: options;

	// Get selected options
	const selectedOptions = options.filter(option => value.includes(option.value));

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
				setSearchTerm('');
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Focus search input when dropdown opens
	useEffect(() => {
		if (isOpen && searchable && searchRef.current) {
			searchRef.current.focus();
		}
	}, [isOpen, searchable]);

	const handleOptionToggle = (optionValue: string) => {
		if (!disabled) {
			const newValue = value.includes(optionValue)
				? value.filter(v => v !== optionValue)
				: [...value, optionValue];
			onChange(newValue);
		}
	};

	const handleRemoveOption = (optionValue: string) => {
		if (!disabled) {
			onChange(value.filter(v => v !== optionValue));
		}
	};

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			setIsOpen(!isOpen);
		} else if (event.key === 'Escape') {
			setIsOpen(false);
			setSearchTerm('');
		}
	};

	const getDisplayText = () => {
		if (loading) return 'Loading...';
		if (selectedOptions.length === 0) return placeholder;

		if (selectedOptions.length <= maxDisplayItems) {
			return selectedOptions.map(option => option.label).join(', ');
		}

		return `${selectedOptions
			.slice(0, maxDisplayItems)
			.map(option => option.label)
			.join(', ')} +${selectedOptions.length - maxDisplayItems} more`;
	};

	return (
		<div className={cn('w-full', className)} ref={dropdownRef}>
			{label && (
				<label className='block text-sm font-medium text-foreground mb-2'>
					{label}
					{required && <span className='text-red-500 ml-1'>*</span>}
				</label>
			)}

			<div className='relative'>
				<button
					type='button'
					onClick={() => !disabled && setIsOpen(!isOpen)}
					onKeyDown={handleKeyDown}
					disabled={disabled || loading}
					className={cn(
						'w-full px-3 py-2 text-left bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors',
						error ? 'border-red-500' : 'border-border',
						disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50',
						isOpen && 'ring-2 ring-primary border-transparent'
					)}
				>
					<div className='flex items-center justify-between'>
						<div className='flex-1 min-w-0'>
							{selectedOptions.length > 0 ? (
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
							) : (
								<span
									className={cn(
										'block truncate',
										selectedOptions.length > 0 ? 'text-foreground' : 'text-foreground-muted'
									)}
								>
									{getDisplayText()}
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

				{isOpen && (
					<div className='absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-hidden'>
						{searchable && (
							<div className='p-2 border-b border-border'>
								<input
									ref={searchRef}
									type='text'
									value={searchTerm}
									onChange={e => setSearchTerm(e.target.value)}
									placeholder='Search...'
									className='w-full px-3 py-2 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
								/>
							</div>
						)}

						<div className='max-h-48 overflow-y-auto'>
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
												: 'hover:bg-background-secondary cursor-pointer',
											value.includes(option.value) && 'bg-primary/10 text-primary'
										)}
									>
										<span className='truncate'>{option.label}</span>
										{value.includes(option.value) && <Check className='h-4 w-4 text-primary' />}
									</button>
								))
							)}
						</div>
					</div>
				)}
			</div>

			{error && errorMessage && <p className='text-red-500 text-sm mt-1'>{errorMessage}</p>}
		</div>
	);
};
