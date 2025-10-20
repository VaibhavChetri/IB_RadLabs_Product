/**
 * User Type Mapping
 * Maps user type IDs to their display names
 */

export const USER_TYPE_MAPPING: Record<number, string> = {
	1: 'Super Admin',
	2: 'Admin',
	3: 'Manager',
	4: 'Supervisor',
	5: 'City Head',
	6: 'Facility Manager',
	7: 'Operations Manager',
	8: 'Field Executive',
	9: 'Driver',
	10: 'Helper',
	11: 'Customer Service',
	12: 'Account Manager',
	13: 'Sales Executive',
	14: 'Marketing Manager',
	15: 'HR Manager',
	16: 'Finance Manager',
	17: 'City Head', // Based on your observation
	18: 'Regional Manager',
	19: 'Area Manager',
	20: 'Branch Manager',
};

/**
 * Get user type name by ID
 * @param userTypeId - The user type ID
 * @returns The user type name or 'Unknown' if not found
 */
export const getUserTypeName = (userTypeId?: number): string => {
	if (!userTypeId) return 'Unknown';
	return USER_TYPE_MAPPING[userTypeId] || `User Type ${userTypeId}`;
};

/**
 * Get user type name for display (shorter version)
 * @param userTypeId - The user type ID
 * @returns The user type name for display
 */
export const getUserTypeDisplayName = (userTypeId?: number): string => {
	const fullName = getUserTypeName(userTypeId);
	
	// Return shorter versions for common types
	const shortNames: Record<string, string> = {
		'Super Admin': 'Super Admin',
		'Admin': 'Admin',
		'Manager': 'Manager',
		'Supervisor': 'Supervisor',
		'City Head': 'City Head',
		'Facility Manager': 'Facility Mgr',
		'Operations Manager': 'Ops Manager',
		'Field Executive': 'Field Exec',
		'Driver': 'Driver',
		'Helper': 'Helper',
		'Customer Service': 'Customer Service',
		'Account Manager': 'Account Mgr',
		'Sales Executive': 'Sales Exec',
		'Marketing Manager': 'Marketing Mgr',
		'HR Manager': 'HR Manager',
		'Finance Manager': 'Finance Mgr',
		'Regional Manager': 'Regional Mgr',
		'Area Manager': 'Area Mgr',
		'Branch Manager': 'Branch Mgr',
	};
	
	return shortNames[fullName] || fullName;
};
