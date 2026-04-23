// HRM Feature Module - Barrel Exports

// Hooks
export {
	useEmployeeData,
	useDepartmentOptions,
	useDesignationOptions,
	useEmployeeManagerOptions,
	useUserOptions,
} from './hooks/useEmployeeData';
export { useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from './hooks/useEmployeeMutations';
export { useDepartmentData, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from './hooks/useDepartmentMutations';
export { useDesignationData, useCreateDesignation, useUpdateDesignation, useDeleteDesignation } from './hooks/useDesignationMutations';
export { useSalaryStructureData, useCreateSalaryStructure, useUpdateSalaryStructure, useDeleteSalaryStructure } from './hooks/useSalaryStructureData';
export { useEmployeeURLFilters } from './hooks/useURLFilters';

// Table Columns
export { getEmployeeColumns } from './config/employeeColumns';
export { getDepartmentColumns } from './config/departmentColumns';
export { getDesignationColumns } from './config/designationColumns';

// Holiday Hooks
export { useHolidayData, useCreateHoliday, useUpdateHoliday, useDeleteHoliday } from './hooks/useHolidayData';
export { useMyHolidayChoices, useCreateHolidayChoice, useDeleteHolidayChoice, useTeamHolidayChoices, useHolidayChoicesSummary } from './hooks/useHolidayChoiceData';
export { useHolidayConfig, useUpdateHolidayConfig } from './hooks/useHolidayConfigData';
export { useLeaveTypeData, useCreateLeaveType, useUpdateLeaveType } from './hooks/useLeaveTypeData';
export { useMyLeaveBalances, useEmployeeLeaveBalances, useInitializeLeaveBalances } from './hooks/useLeaveBalanceData';
export {
	useLeaveApplicationData,
	useCreateLeaveApplication,
	useReviewLeaveApplication,
	useCancelLeaveApplication,
	useRevertLopLeaveApplication,
} from './hooks/useLeaveApplicationData';
export { useCompOffData, useCreateCompOff } from './hooks/useCompOffData';
export { useMyAttendance, useTeamAttendance, useAttendanceSummary, useMarkAttendance } from './hooks/useAttendanceData';
export {
	useAttendanceRegularizations,
	useCreateAttendanceRegularization,
	useReviewAttendanceRegularization,
} from './hooks/useAttendanceRegularizationData';

// Holiday Columns
export { getHolidayColumns } from './config/holidayColumns';

// Constants
export * from './config/constants';
