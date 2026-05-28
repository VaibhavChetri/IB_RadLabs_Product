/**
 * MonthChips
 *
 * 12-month chip strip for the selected year. Click any chip to toggle.
 * Months in the future (for current year) are disabled.
 *
 * Renders inline-friendly — drop into a flex row with the other filters.
 */

import React from 'react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface MonthChipsProps {
	year: string;
	selected: string[]; // YYYY-MM list
	onToggle: (yyyymm: string) => void;
}

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export const MonthChips: React.FC<MonthChipsProps> = ({ year, selected, onToggle }) => {
	const yearNum = Number(year);
	const isCurrentYear = yearNum === currentYear;

	return (
		<div className='flex flex-wrap items-center gap-2'>
			<span className='text-xs font-medium text-gray-500 uppercase mr-1'>Months</span>
			{MONTHS.map((label, idx) => {
				const monthNum = idx + 1;
				const yyyymm = `${year}-${String(monthNum).padStart(2, '0')}`;
				const isSelected = selected.includes(yyyymm);
				const isDisabled = isCurrentYear && monthNum > currentMonth;
				const base =
					'h-8 px-3 rounded-full text-xs font-medium border transition-colors select-none';
				const visual = isDisabled
					? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
					: isSelected
						? 'border-blue-600 bg-blue-600 text-white cursor-pointer'
						: 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50 cursor-pointer';
				return (
					<button
						key={yyyymm}
						type='button'
						disabled={isDisabled}
						onClick={() => onToggle(yyyymm)}
						className={`${base} ${visual}`}
						aria-pressed={isSelected}
						title={isDisabled ? 'Future month' : `${label} ${year}`}
					>
						{label}
					</button>
				);
			})}
		</div>
	);
};
