/**
 * Constants for Review Category Type feature
 */

export const REVIEW_CATEGORY_TYPE_STATUS = {
	ALL: '',
	ACTIVE: '1',
	INACTIVE: '0',
} as const;

export type ReviewCategoryTypeStatus = typeof REVIEW_CATEGORY_TYPE_STATUS[keyof typeof REVIEW_CATEGORY_TYPE_STATUS];

export const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
	{ value: REVIEW_CATEGORY_TYPE_STATUS.ALL, label: 'All' },
	{ value: REVIEW_CATEGORY_TYPE_STATUS.ACTIVE, label: 'Active' },
	{ value: REVIEW_CATEGORY_TYPE_STATUS.INACTIVE, label: 'Inactive' },
];

export const STATUS_DISPLAY_MAP = {
	[REVIEW_CATEGORY_TYPE_STATUS.ACTIVE]: 'Active',
	[REVIEW_CATEGORY_TYPE_STATUS.INACTIVE]: 'Inactive',
} as const;

/**
 * Helper to check if status is active
 */
export const isActiveStatus = (status: string | number): boolean => {
	return String(status) === REVIEW_CATEGORY_TYPE_STATUS.ACTIVE || status === 'Active';
};

/**
 * Helper to get status display label
 */
export const getStatusLabel = (status: string | number): string => {
	const statusStr = String(status);
	return STATUS_DISPLAY_MAP[statusStr as keyof typeof STATUS_DISPLAY_MAP] || 'Unknown';
};

