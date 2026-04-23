/**
 * Dashboard/Inventory Analysis Constants
 */

export const MONTH_OPTIONS = [
	{ value: '1', label: 'January' },
	{ value: '2', label: 'February' },
	{ value: '3', label: 'March' },
	{ value: '4', label: 'April' },
	{ value: '5', label: 'May' },
	{ value: '6', label: 'June' },
	{ value: '7', label: 'July' },
	{ value: '8', label: 'August' },
	{ value: '9', label: 'September' },
	{ value: '10', label: 'October' },
	{ value: '11', label: 'November' },
	{ value: '12', label: 'December' },
] as const;

export const CLIENT_ALL_OPTION = { value: 'all', label: 'All' } as const;

/**
 * Get current month (1-12)
 */
export const getCurrentMonth = (): number => new Date().getMonth() + 1;

/**
 * Get current year
 */
export const getCurrentYear = (): number => new Date().getFullYear();

/**
 * Year options: this year and last year only
 */
export const getYearOptions = (): Array<{ value: string; label: string }> => {
	const currentYear = getCurrentYear();
	return [
		{ value: currentYear.toString(), label: currentYear.toString() },
		{ value: (currentYear - 1).toString(), label: (currentYear - 1).toString() },
	];
};
