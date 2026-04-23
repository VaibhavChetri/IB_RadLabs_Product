/**
 * Constants for Complaint Type feature
 */

export const COMPLAINT_TYPE_STATUS = {
	ALL: '',
	ACTIVE: 'Active',
	INACTIVE: 'Inactive',
} as const;

export type ComplaintTypeStatus =
	(typeof COMPLAINT_TYPE_STATUS)[keyof typeof COMPLAINT_TYPE_STATUS];

export const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
	{ value: COMPLAINT_TYPE_STATUS.ALL, label: 'All' },
	{ value: COMPLAINT_TYPE_STATUS.ACTIVE, label: 'Active' },
	{ value: COMPLAINT_TYPE_STATUS.INACTIVE, label: 'Inactive' },
];

export const STATUS_DISPLAY_MAP = {
	[COMPLAINT_TYPE_STATUS.ACTIVE]: 'Active',
	[COMPLAINT_TYPE_STATUS.INACTIVE]: 'Inactive',
} as const;

/**
 * Helper to check if status is active
 */
export const isActiveStatus = (status: string): boolean => {
	return status === COMPLAINT_TYPE_STATUS.ACTIVE;
};

/**
 * Helper to get status display label
 */
export const getStatusLabel = (status: string): string => {
	return STATUS_DISPLAY_MAP[status as keyof typeof STATUS_DISPLAY_MAP] || 'Unknown';
};
