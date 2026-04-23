/**
 * Circular Progress Component
 * Displays percentage/value in a circular progress indicator
 * Apple Watch style - elegant and simple
 * Generic and reusable across the application
 */

import React from 'react';

interface CircularProgressProps {
	label: string; // Label displayed below the circle (e.g., city name)
	percentage: number; // Percentage value (0-100)
	color?: string; // Optional color. If not provided, calculated from percentage
	displayValue?: string; // Optional custom display value (e.g., "1.91" instead of "4%")
	displayUnit?: string; // Optional unit for display value (e.g., "hrs" or "")
	daysEntered?: number; // Optional days entered count
	totalDays?: number; // Optional total days count
}

/**
 * Get color based on percentage threshold
 */
const getColorFromPercentage = (percentage: number): string => {
	if (percentage >= 80) return '#22c55e'; // green-500
	if (percentage >= 60) return '#eab308'; // yellow-500
	if (percentage >= 40) return '#f97316'; // orange-500
	return '#ef4444'; // red-500
};

export const CircularProgress: React.FC<CircularProgressProps> = ({
	label,
	percentage,
	color,
	displayValue,
	displayUnit = '',
	daysEntered,
	totalDays,
}) => {
	// Use provided color or calculate from percentage
	const progressColor = color || getColorFromPercentage(percentage);
	const circumference = 2 * Math.PI * 45; // radius = 45
	const offset = circumference - (percentage / 100) * circumference;

	// Use displayValue if provided, otherwise show percentage
	const displayText =
		displayValue !== undefined
			? `${displayValue}${displayUnit ? ` ${displayUnit}` : ''}`
			: `${percentage.toFixed(0)}%`;

	return (
		<div className='flex flex-col items-center justify-center'>
			{/* Circular Progress */}
			<div className='relative w-32 h-32 mb-4'>
				<svg className='transform -rotate-90' width='128' height='128'>
					{/* Background circle */}
					<circle cx='64' cy='64' r='45' stroke='#e5e7eb' strokeWidth='8' fill='transparent' />
					{/* Progress circle */}
					<circle
						cx='64'
						cy='64'
						r='45'
						stroke={progressColor}
						strokeWidth='8'
						fill='transparent'
						strokeDasharray={circumference}
						strokeDashoffset={offset}
						strokeLinecap='round'
						className='transition-all duration-500'
					/>
				</svg>
				{/* Center content */}
				<div className='absolute inset-0 flex flex-col items-center justify-center'>
					<span className='text-[1rem] font-bold text-gray-900'>{displayText}</span>
					<span className='text-xs text-gray-500 mt-0.5'>{label}</span>
				</div>
			</div>
			{/* Stats */}
			{daysEntered !== undefined && totalDays !== undefined && (
				<div className='text-center'>
					<div className='text-xs text-gray-600'>
						{daysEntered}/{totalDays} days entered
					</div>
				</div>
			)}
		</div>
	);
};
