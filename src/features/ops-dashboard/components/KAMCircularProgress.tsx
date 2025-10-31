/**
 * KAM Circular Progress Component
 * Displays KAM EOD Report percentage in a circular progress indicator
 * Apple Watch style - elegant and simple
 */

import React from 'react';
import { Card } from '../../../components/ui';

interface KAMCircularProgressProps {
	cityName: string;
	avgPercentage: string;
	daysEntered: number;
	totalDays: number;
}

/**
 * Parse percentage string like "100.00%" to number
 */
const parsePercentage = (percentage: string): number => {
	const match = percentage.match(/([\d.]+)/);
	return match ? parseFloat(match[1]) : 0;
};

/**
 * Get color based on percentage threshold
 */
const getColor = (percentage: number): string => {
	if (percentage >= 80) return '#22c55e'; // green-500
	if (percentage >= 60) return '#eab308'; // yellow-500
	if (percentage >= 40) return '#f97316'; // orange-500
	return '#ef4444'; // red-500
};

export const KAMCircularProgress: React.FC<KAMCircularProgressProps> = ({
	cityName,
	avgPercentage,
	daysEntered,
	totalDays,
}) => {
	const percentage = parsePercentage(avgPercentage);
	const color = getColor(percentage);
	const circumference = 2 * Math.PI * 45; // radius = 45
	const offset = circumference - (percentage / 100) * circumference;

	return (
		<Card className='p-6' role='article' aria-label={`KAM EOD Report for ${cityName}`}>
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
							stroke={color}
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
						<span className='text-2xl font-bold text-gray-900'>{percentage.toFixed(0)}%</span>
						<span className='text-xs text-gray-500 mt-0.5'>{cityName}</span>
					</div>
				</div>
				{/* Stats */}
				<div className='text-center'>
					<div className='text-sm text-gray-600'>
						{daysEntered}/{totalDays} days entered
					</div>
				</div>
			</div>
		</Card>
	);
};
