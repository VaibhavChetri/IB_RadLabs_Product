/**
 * Container Type Constants
 */

export const IMPACT_ACCOUNTABLE_OPTIONS = [
	{ value: 1, label: 'Yes' },
	{ value: 0, label: 'No' },
];

export const isActiveStatus = (status: number | undefined): boolean => {
	return status === 1 || status === undefined;
};

export const getStatusLabel = (status: number | undefined): string => {
	return isActiveStatus(status) ? 'Active' : 'Inactive';
};













