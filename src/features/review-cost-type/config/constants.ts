/**
 * Constants for Review Cost Type feature
 */

export const REVIEW_COST_TYPE_STATUS = {
	ALL: '',
	ACTIVE: '1',
	INACTIVE: '0',
} as const;

export type ReviewCostTypeStatus = typeof REVIEW_COST_TYPE_STATUS[keyof typeof REVIEW_COST_TYPE_STATUS];

export const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
	{ value: REVIEW_COST_TYPE_STATUS.ALL, label: 'All' },
	{ value: REVIEW_COST_TYPE_STATUS.ACTIVE, label: 'Active' },
	{ value: REVIEW_COST_TYPE_STATUS.INACTIVE, label: 'Inactive' },
];

export const STATUS_DISPLAY_MAP = {
	[REVIEW_COST_TYPE_STATUS.ACTIVE]: 'Active',
	[REVIEW_COST_TYPE_STATUS.INACTIVE]: 'Inactive',
} as const;

/**
 * Helper to check if status is active
 */
export const isActiveStatus = (status: string | number): boolean => {
	return String(status) === REVIEW_COST_TYPE_STATUS.ACTIVE || status === 'Active';
};

/**
 * Helper to get status display label
 */
export const getStatusLabel = (status: string | number): string => {
	const statusStr = String(status);
	return STATUS_DISPLAY_MAP[statusStr as keyof typeof STATUS_DISPLAY_MAP] || 'Unknown';
};

