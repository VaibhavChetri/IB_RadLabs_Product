/**
 * Async Autocomplete Component
 * For async search inputs (locations, company names, technologies)
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface AsyncAutocompleteProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
	onSelect?: (item: string | { label: string; value: any }) => void;
	placeholder?: string;
	disabled?: boolean;
	error?: boolean;
	errorMessage?: string;
	required?: boolean;
	className?: string;
	searchFn: (text: string) => Promise<string[] | Array<{ label: string; value: any }>>;
	formatItem?: (item: string | { label: string; value: any }) => string;
	minChars?: number;
	debounceMs?: number;
}

export const AsyncAutocomplete: React.FC<AsyncAutocompleteProps> = ({
	label,
	value,
	onChange,
	onSelect,
	placeholder,
	disabled = false,
	error = false,
	errorMessage,
	required = false,
	className,
	searchFn,
	formatItem = (item) => (typeof item === 'string' ? item : item.label),
	minChars = 2,
	debounceMs = 300,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isFocused, setIsFocused] = useState(false);
	const [searchTerm, setSearchTerm] = useState(value);
	const [results, setResults] = useState<string[] | Array<{ label: string; value: any }>>([]);
	const [loading, setLoading] = useState(false);
	const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
	const [isUserTyping, setIsUserTyping] = useState(false); // Track if user is actively typing
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const shouldFloat = isFocused || isOpen || !!value;

	// Sync searchTerm with value prop only when not user-typing
	useEffect(() => {
		if (!isUserTyping) {
			setSearchTerm(value);
		}
	}, [value, isUserTyping]);

	// Close on outside click
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false);
				setIsFocused(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Debounced search - only when user is actively typing
	useEffect(() => {
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}

		// Only search if user is typing (not when value is set from props)
		if (isUserTyping && searchTerm.length >= minChars) {
			setLoading(true);
			const timer = setTimeout(async () => {
				try {
					const searchResults = await searchFn(searchTerm);
					setResults(searchResults);
					setIsOpen(true);
				} catch (error) {
					console.error('Search error:', error);
					setResults([]);
				} finally {
					setLoading(false);
				}
			}, debounceMs);

			setDebounceTimer(timer);
		} else if (!isUserTyping) {
			// Clear results when not typing (e.g., when value is set from props)
			setResults([]);
			setIsOpen(false);
		}

		return () => {
			if (debounceTimer) clearTimeout(debounceTimer);
		};
	}, [searchTerm, searchFn, minChars, debounceMs, isUserTyping]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		setIsUserTyping(true); // Mark that user is actively typing
		setSearchTerm(newValue);
		onChange(newValue);
	};

	const handleSelect = (item: string | { label: string; value: any }) => {
		const displayValue = formatItem(item);
		setIsUserTyping(false); // Reset typing flag when item is selected
		setSearchTerm(displayValue);
		onChange(displayValue);
		if (onSelect) {
			onSelect(item);
		}
		setIsOpen(false);
		setIsFocused(false);
		setResults([]); // Clear results after selection
	};

	const handleClear = () => {
		setIsUserTyping(false); // Reset typing flag when cleared
		setSearchTerm('');
		onChange('');
		setResults([]);
		setIsOpen(false);
		inputRef.current?.focus();
	};

	return (
		<div className={cn('relative w-full', className)} ref={containerRef}>
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
				<div className='relative'>
					<Search className='absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
					<input
						ref={inputRef}
						type='text'
						value={searchTerm}
						onChange={handleInputChange}
						onFocus={() => {
							setIsFocused(true);
							// Only show dropdown if user was typing and we have results
							// Don't trigger search just from focus
							if (isUserTyping && searchTerm.length >= minChars && results.length > 0) {
								setIsOpen(true);
							}
						}}
						onBlur={() => {
							// Delay to allow click on results
							setTimeout(() => setIsFocused(false), 200);
						}}
						disabled={disabled}
						placeholder={placeholder || `Type to search ${label.toLowerCase()}...`}
						className={cn(
							'w-full pl-10 pr-10 py-4 text-sm bg-white border rounded-md',
							'focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-200',
							'transition-all duration-200',
							error && 'border-red-500 focus:border-red-500 focus:ring-red-200',
							disabled && 'opacity-50 cursor-not-allowed bg-gray-50'
						)}
					/>
					{searchTerm && !disabled && (
						<button
							type='button'
							onClick={handleClear}
							className='absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
						>
							<X className='h-4 w-4' />
						</button>
					)}
					{loading && (
						<div className='absolute right-4 top-1/2 -translate-y-1/2'>
							<Loader2 className='h-4 w-4 text-gray-400 animate-spin' />
						</div>
					)}
				</div>

				{/* Results Dropdown */}
				{isOpen && (results.length > 0 || loading) && (
					<div className='absolute z-[9999] w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-[200px] overflow-hidden'>
						<div className='max-h-[200px] overflow-y-auto'>
							{loading ? (
								<div className='px-4 py-6 text-center text-sm text-gray-500'>
									<Loader2 className='h-4 w-4 animate-spin mx-auto mb-2' />
									Searching...
								</div>
							) : results.length === 0 ? (
								<div className='px-4 py-6 text-center text-sm text-gray-500'>
									No results found
								</div>
							) : (
								results.map((item, index) => {
									const displayValue = formatItem(item);
									return (
										<button
											key={index}
											type='button'
											onClick={() => handleSelect(item)}
											className='w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0'
										>
											{displayValue}
										</button>
									);
								})
							)}
						</div>
					</div>
				)}
			</div>

			{error && errorMessage && <p className='mt-1 text-xs text-red-500'>{errorMessage}</p>}
		</div>
	);
};
