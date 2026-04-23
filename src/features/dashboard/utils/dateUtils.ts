/**
 * Utility functions for date calculations
 */

/**
 * Get start and end dates for a given month
 * @param month - Month number (1-12)
 * @param year - Year (defaults to current year)
 * @returns Object with start_date and end_date in YYYY-MM-DD format
 */
export const getMonthDateRange = (
	month: number,
	year?: number
): { start_date: string; end_date: string } => {
	const now = new Date();
	const targetYear = year || now.getFullYear();
	const targetMonth = month - 1; // JavaScript months are 0-indexed

	// Start of month
	const startDate = new Date(targetYear, targetMonth, 1);
	// End of month
	const endDate = new Date(targetYear, targetMonth + 1, 0);

	const formatDate = (date: Date): string => {
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, '0');
		const d = String(date.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	};

	return {
		start_date: formatDate(startDate),
		end_date: formatDate(endDate),
	};
};

/**
 * Extract day number from date string (YYYY-MM-DD)
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Day number (1-31)
 */
export const getDayFromDate = (dateString: string): number => {
	return parseInt(dateString.split('-')[2], 10);
};
