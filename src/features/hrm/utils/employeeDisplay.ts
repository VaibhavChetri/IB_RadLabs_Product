export const getEmployeeDisplayName = (employee: Record<string, any> | null | undefined) => {
	if (!employee) return 'Employee';

	const fullName = String(employee.full_name || '').trim();
	if (fullName) return fullName;

	const firstName = String(employee.first_name || '').trim();
	const lastName = String(employee.last_name || '').trim();
	const combined = `${firstName} ${lastName}`.trim();

	return combined || String(employee.employee_name || '').trim() || 'Employee';
};

export const getEmployeeOptionLabel = (employee: Record<string, any> | null | undefined) => {
	if (!employee) return 'Employee';

	const name = getEmployeeDisplayName(employee);
	const code = String(employee.employee_code || '').trim();

	return code ? `${name} (${code})` : name;
};
