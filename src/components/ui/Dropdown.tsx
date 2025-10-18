import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface DropdownOption {
	value: string;
	label: string;
	disabled?: boolean;
}

export interface DropdownProps {
	options: DropdownOption[];
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	error?: boolean;
	errorMessage?: string;
	label?: string;
	required?: boolean;
	className?: string;
	loading?: boolean;
	searchable?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
	options,
	value,
	onChange,
	placeholder = 'Select an option',
	disabled = false,
	error = false,
	errorMessage,
	label,
	required = false,
	className,
	loading = false,
	searchable = true,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const dropdownRef = useRef<HTMLDivElement>(null);
	const searchRef = useRef<HTMLInputElement>(null);

	// Filter options based on search term
	const filteredOptions = searchable
		? options.filter(option => option.label.toLowerCase().includes(searchTerm.toLowerCase()))
		: options;

	// Get selected option
	const selectedOption = options.find(option => option.value === value);

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

	const handleOptionClick = (optionValue: string) => {
		if (!disabled) {
			onChange(optionValue);
			setIsOpen(false);
			setSearchTerm('');
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

	return (
		<div className={cn('w-full', className)} ref={dropdownRef}>
			{label && (
				<label className='block text-sm font-medium text-foreground mb-2'>
					{label}
					{required && <span className='text-red-500 ml-1'>*</span>}
				</label>
			)}

			<div className='relative'>
				{searchable && isOpen ? (
					<div className='space-y-0'>
						{/* Search Input */}
						<div className='relative'>
							<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted' />
							<input
								ref={searchRef}
								type='text'
								value={searchTerm}
								onChange={e => setSearchTerm(e.target.value)}
								placeholder='Search options...'
								className={cn(
									'w-full pl-10 pr-10 py-3 text-sm bg-background border rounded-t-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200',
									error ? 'border-red-500' : 'border-border'
								)}
							/>
							<button
								type='button'
								onClick={() => setIsOpen(false)}
								className='absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground-muted hover:text-foreground text-lg'
							>
								×
							</button>
						</div>

						{/* Options List */}
						<div className='absolute z-50 w-full bg-background border border-border border-t-0 rounded-b-lg shadow-lg max-h-64 overflow-hidden'>
							<div className='max-h-64 overflow-y-auto'>
								{filteredOptions.length === 0 ? (
									<div className='px-4 py-6 text-center text-sm text-foreground-muted'>
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
												'w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between hover:bg-background-secondary',
												option.disabled
													? 'opacity-50 cursor-not-allowed text-foreground-muted'
													: 'cursor-pointer',
												option.value === value && 'bg-primary/10 text-primary font-medium'
											)}
										>
											<span className='truncate'>{option.label}</span>
											{option.value === value && <Check className='h-4 w-4 text-primary' />}
										</button>
									))
								)}
							</div>
						</div>
					</div>
				) : (
					<button
						type='button'
						onClick={() => !disabled && setIsOpen(!isOpen)}
						onKeyDown={handleKeyDown}
						disabled={disabled || loading}
						className={cn(
							'w-full px-4 py-3 text-left bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200',
							error ? 'border-red-500' : 'border-border',
							disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50',
							isOpen && 'ring-2 ring-primary border-transparent'
						)}
					>
						<div className='flex items-center justify-between'>
							<span
								className={cn(
									'block truncate text-sm',
									selectedOption ? 'text-foreground font-medium' : 'text-foreground-muted'
								)}
							>
								{loading ? 'Loading...' : selectedOption?.label || placeholder}
							</span>
							<ChevronDown
								className={cn(
									'h-4 w-4 text-foreground-muted transition-transform duration-200',
									isOpen && 'rotate-180'
								)}
							/>
						</div>
					</button>
				)}

				{!searchable && isOpen && (
					<div className='absolute z-50 w-full mt-2 bg-background border border-border rounded-lg shadow-lg max-h-64 overflow-hidden'>
						<div className='max-h-64 overflow-y-auto'>
							{filteredOptions.length === 0 ? (
								<div className='px-4 py-6 text-center text-sm text-foreground-muted'>
									No options available
								</div>
							) : (
								filteredOptions.map(option => (
									<button
										key={option.value}
										type='button'
										onClick={() => handleOptionClick(option.value)}
										disabled={option.disabled}
										className={cn(
											'w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between hover:bg-background-secondary',
											option.disabled
												? 'opacity-50 cursor-not-allowed text-foreground-muted'
												: 'cursor-pointer',
											option.value === value && 'bg-primary/10 text-primary font-medium'
										)}
									>
										<span className='truncate'>{option.label}</span>
										{option.value === value && <Check className='h-4 w-4 text-primary' />}
									</button>
								))
							)}
						</div>
					</div>
				)}
			</div>

			{error && errorMessage && <p className='text-red-500 text-sm mt-2'>{errorMessage}</p>}
		</div>
	);
};
