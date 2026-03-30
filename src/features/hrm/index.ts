// HRM Feature Module - Barrel Exports

// Hooks
export { useEmployeeData, useDepartmentOptions, useDesignationOptions } from './hooks/useEmployeeData';
export { useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from './hooks/useEmployeeMutations';
export { useDepartmentData, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from './hooks/useDepartmentMutations';
export { useDesignationData, useCreateDesignation, useUpdateDesignation, useDeleteDesignation } from './hooks/useDesignationMutations';
export { useSalaryStructureData, useCreateSalaryStructure, useUpdateSalaryStructure, useDeleteSalaryStructure } from './hooks/useSalaryStructureData';
export { useEmployeeURLFilters } from './hooks/useURLFilters';

// Table Columns
export { getEmployeeColumns } from './config/employeeColumns';
export { getDepartmentColumns } from './config/departmentColumns';
export { getDesignationColumns } from './config/designationColumns';

// Constants
export * from './config/constants';
