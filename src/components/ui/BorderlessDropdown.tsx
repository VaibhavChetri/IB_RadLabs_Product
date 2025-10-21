import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

interface BorderlessDropdownProps {
	options: { label: string; value: string }[];
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
}

export const BorderlessDropdown: React.FC<BorderlessDropdownProps> = ({
	options,
	value,
	onChange,
	placeholder = 'Select...',
	className,
	disabled = false,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const selectedOption = options.find(option => option.value === value);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	const handleOptionClick = (optionValue: string) => {
		onChange(optionValue);
		setIsOpen(false);
	};

	return (
		<div ref={dropdownRef} className={cn('relative', className)}>
			<button
				type='button'
				onClick={() => !disabled && setIsOpen(!isOpen)}
				disabled={disabled}
				className={cn(
					'w-full text-left px-1 py-1 text-sm bg-transparent border-none outline-none focus:outline-none',
					'flex items-center gap-1',
					disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'
				)}
			>
				<span className={cn(selectedOption ? 'text-gray-900' : 'text-gray-500')}>
					{selectedOption ? selectedOption.label : placeholder}
				</span>
				<svg
					className={cn('w-4 h-4 text-gray-400 transition-transform', isOpen && 'rotate-180')}
					fill='none'
					stroke='currentColor'
					viewBox='0 0 24 24'
				>
					<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
				</svg>
			</button>

			{isOpen && (
				<div
					className='fixed z-[9999] bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto'
					style={{
						top: dropdownRef.current?.getBoundingClientRect().bottom + 'px',
						left: dropdownRef.current?.getBoundingClientRect().left + 'px',
						width: dropdownRef.current?.getBoundingClientRect().width + 'px',
					}}
				>
					{options.map(option => (
						<button
							key={option.value}
							type='button'
							onClick={() => handleOptionClick(option.value)}
							className={cn(
								'w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors',
								option.value === value && 'bg-green-50 text-green-800'
							)}
						>
							{option.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
};
