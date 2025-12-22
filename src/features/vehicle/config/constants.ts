/**
 * Constants for Vehicle feature
 */

export const VEHICLE_STATUS = {
	ACTIVE: 1,
	INACTIVE: 0,
} as const;

export type VehicleStatus = (typeof VEHICLE_STATUS)[keyof typeof VEHICLE_STATUS];

/**
 * Helper to check if status is active
 */
export const isActiveStatus = (status: number): boolean => {
	return status === VEHICLE_STATUS.ACTIVE;
};

/**
 * Helper to get status display label
 */
export const getStatusLabel = (status: number): string => {
	return status === VEHICLE_STATUS.ACTIVE ? 'Active' : 'Inactive';
};

/**
 * Status filter options for dropdown
 */
export const STATUS_OPTIONS = [
	{ value: '', label: 'All' },
	{ value: '1', label: 'Active' },
	{ value: '0', label: 'Inactive' },
];









