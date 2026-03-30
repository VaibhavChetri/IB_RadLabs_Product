/**
 * HRM Module Constants
 */

/** HRM list APIs reject `limit` above this value (e.g. stage returns 400). */
export const HRM_LIST_MAX_LIMIT = 100;

export const EMPLOYMENT_TYPE_OPTIONS = [
	{ value: '', label: 'All Types' },
	{ value: 'full_time', label: 'Full Time' },
	{ value: 'part_time', label: 'Part Time' },
	{ value: 'contract', label: 'Contract' },
	{ value: 'intern', label: 'Intern' },
	{ value: 'consultant', label: 'Consultant' },
];

export const EMPLOYEE_STATUS_OPTIONS = [
	{ value: '', label: 'All Status' },
	{ value: 'active', label: 'Active' },
	{ value: 'probation', label: 'Probation' },
	{ value: 'on_notice', label: 'Notice Period' },
	{ value: 'exited', label: 'Exited' },
];

export const ACTIVE_STATUS_OPTIONS = [
	{ value: '', label: 'All' },
	{ value: 'true', label: 'Active' },
	{ value: 'false', label: 'Inactive' },
];

export const GENDER_OPTIONS = [
	{ value: 'male', label: 'Male' },
	{ value: 'female', label: 'Female' },
	{ value: 'other', label: 'Other' },
];

export const HIERARCHY_TYPE_OPTIONS = [
	{ value: 'direct', label: 'Direct' },
	{ value: 'dotted', label: 'Dotted Line' },
	{ value: 'functional', label: 'Functional' },
];

export const getEmploymentTypeLabel = (type: string): string => {
	const option = EMPLOYMENT_TYPE_OPTIONS.find(o => o.value === type);
	return option?.label || type;
};

export const getStatusLabel = (status: string): string => {
	const option = EMPLOYEE_STATUS_OPTIONS.find(o => o.value === status);
	return option?.label || status;
};

export const getStatusColor = (status: string): string => {
	switch (status) {
		case 'active':
			return 'text-green-600 bg-green-50';
		case 'probation':
			return 'text-yellow-600 bg-yellow-50';
		case 'on_notice':
			return 'text-orange-600 bg-orange-50';
		case 'exited':
			return 'text-red-600 bg-red-50';
		default:
			return 'text-gray-600 bg-gray-50';
	}
};

export const formatCurrency = (amount: number): string => {
	return new Intl.NumberFormat('en-IN', {
		style: 'currency',
		currency: 'INR',
		maximumFractionDigits: 0,
	}).format(amount);
};

export const HOLIDAY_TYPE_OPTIONS = [
	{ value: '', label: 'All Types' },
	{ value: 'national', label: 'National' },
	{ value: 'company', label: 'Company' },
	{ value: 'restricted', label: 'Restricted' },
];

export const HOLIDAY_CHOICE_STATUS_OPTIONS = [
	{ value: '', label: 'All Status' },
	{ value: 'chosen', label: 'Chosen' },
	{ value: 'cancelled', label: 'Cancelled' },
];

export const getHolidayTypeColor = (type: string): string => {
	switch (type) {
		case 'national':
			return 'text-blue-600 bg-blue-50';
		case 'company':
			return 'text-purple-600 bg-purple-50';
		case 'restricted':
			return 'text-amber-600 bg-amber-50';
		default:
			return 'text-gray-600 bg-gray-50';
	}
};

export const getHolidayTypeLabel = (type: string): string => {
	const option = HOLIDAY_TYPE_OPTIONS.find(o => o.value === type);
	return option?.label || type;
};

export const HOLIDAY_CONFIG_LABELS: Record<string, { label: string; inputType: string }> = {
	restricted_holiday_quota: { label: 'Restricted Holiday Quota (per year)', inputType: 'number' },
	comp_off_expiry_days: { label: 'Comp-off Expiry (days)', inputType: 'number' },
	standard_work_hours: { label: 'Standard Work Hours / Day', inputType: 'number' },
	pt_state: { label: 'Professional Tax State', inputType: 'text' },
	financial_year_start_month: { label: 'Financial Year Start Month', inputType: 'number' },
	leave_year_start_month: { label: 'Leave Year Start Month', inputType: 'number' },
	pf_basic_cap: { label: 'PF Basic Salary Cap (\u20B9)', inputType: 'number' },
	esi_gross_threshold: { label: 'ESI Gross Threshold (\u20B9)', inputType: 'number' },
};
