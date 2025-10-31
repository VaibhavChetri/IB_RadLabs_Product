/**
 * Dashboard Feature Exports
 *
 * Centralized exports for the dashboard/inventory analysis feature
 */

export { DashboardFilters } from './components/DashboardFilters';
export { DashboardContent } from './components/DashboardContent';
export { DashboardStats } from './components/DashboardStats';
export { DashboardChart } from './components/DashboardChart';
export { useDashboardFilters } from './hooks/useDashboardFilters';
export { useDashboardData } from './hooks/useDashboardData';
export { useDashboardDataQuery } from './hooks/useDashboardDataQuery';
export { useChartData } from './hooks/useChartData';
export type { DropdownOption } from './hooks/useDashboardFilters';
export type {
	DashboardStats as DashboardStatsType,
	ChartDataPoint,
	DashboardResponse,
} from './hooks/useDashboardData';
export type { ChartFilter } from './hooks/useChartData';
export { MONTH_OPTIONS, CLIENT_ALL_OPTION, getCurrentMonth } from './config/constants';
export { getMonthDateRange, getDayFromDate } from './utils/dateUtils';
