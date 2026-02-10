/**
 * Complaint Type Feature
 * Exports all public components, hooks, and utilities
 */

export { ComplaintTypeModal } from './components/ComplaintTypeModal';
export { useComplaintTypeData } from './hooks/useComplaintTypeData';
export { useAddComplaintType, useUpdateComplaintType, useDeleteComplaintType } from './hooks/useComplaintTypeMutations';
export { getComplaintTypeColumns } from './config/tableColumns';
export * from './config/constants';
