/**
 * StatusBadge Component
 * Displays a status badge with professional design matching the app's design system
 */

import React from 'react';

export interface StatusBadgeProps {
	status: {
		id?: number;
		status_name: string;
		status_color: string;
		status_category?: string;
	};
	className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
	// Map status category to design system colors
	const getStatusClasses = (): string => {
		// First, try to use status_category if available
		if (status.status_category) {
			switch (status.status_category.toLowerCase()) {
				case 'positive':
				case 'converted':
					return 'bg-green-100 text-green-800 border-green-200';
				case 'negative':
					return 'bg-red-100 text-red-800 border-red-200';
				case 'follow_up':
					return 'bg-blue-100 text-blue-800 border-blue-200';
				case 'pending':
					return 'bg-gray-100 text-gray-800 border-gray-200';
				default:
					break;
			}
		}

		// Fallback: Map hex color to closest design system color
		const hex = status.status_color.replace('#', '');
		if (!hex || hex.length !== 6) {
			return 'bg-gray-100 text-gray-800 border-gray-200';
		}

		const r = parseInt(hex.substring(0, 2), 16);
		const g = parseInt(hex.substring(2, 4), 16);
		const b = parseInt(hex.substring(4, 6), 16);

		// Determine dominant color
		if (g > r && g > b) {
			// Green tones - success/positive
			return 'bg-green-100 text-green-800 border-green-200';
		} else if (r > g && r > b) {
			// Red tones - error/negative
			return 'bg-red-100 text-red-800 border-red-200';
		} else if (b > r && b > g) {
			// Blue tones - info/follow_up
			return 'bg-blue-100 text-blue-800 border-blue-200';
		} else if (r === g && g === b) {
			// Grayscale - neutral/pending
			return 'bg-gray-100 text-gray-800 border-gray-200';
		} else {
			// Yellow/amber tones - warning
			return 'bg-yellow-100 text-yellow-800 border-yellow-200';
		}
	};

	return (
		<span
			className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusClasses()} ${className}`}
		>
			{status.status_name}
		</span>
	);
};
