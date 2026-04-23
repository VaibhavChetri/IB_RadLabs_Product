/**
 * P&L Constants
 * Reuses MONTH_OPTIONS from dashboard constants
 */

/**
 * Generate year options from 2023 to current year
 */
export const getYearOptions = (): Array<{ value: string; label: string }> => {
	const currentYear = new Date().getFullYear();
	const years: Array<{ value: string; label: string }> = [];
	for (let year = 2023; year <= currentYear; year++) {
		years.push({ value: year.toString(), label: year.toString() });
	}
	return years.reverse(); // Most recent year first
};

/**
 * Get current year
 */
export const getCurrentYear = (): number => new Date().getFullYear();
