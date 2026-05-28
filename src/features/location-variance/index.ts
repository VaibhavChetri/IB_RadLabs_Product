/**
 * Barrel exports for the location-variance feature.
 */

export { useLocationVarianceFilters } from './hooks/useLocationVarianceFilters';
export { useTabSummary } from './hooks/useTabSummary';
export { useOutliers } from './hooks/useOutliers';
export { useDrillDown } from './hooks/useDrillDown';

export { LocationAnalyticsApi } from './api/locationAnalyticsApi';
export { VARIANCE_TABS, tabById } from './config/tabs';
export type { VarianceTabDef } from './config/tabs';

export { LocationVarianceFilters } from './components/LocationVarianceFilters';
export { MonthChips } from './components/MonthChips';
export { OutliersCard } from './components/OutliersCard';
export { LocationVarianceTable } from './components/LocationVarianceTable';
export { VarianceDrillPanel } from './components/VarianceDrillPanel';

export type * from './types';
