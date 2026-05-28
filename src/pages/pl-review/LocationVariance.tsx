/**
 * Location Revenue Variance — page component.
 *
 * 5 tabs (one per billing mode) + outliers card + drill-down side panel.
 * Layout mirrors PLSummary.tsx but uses location-specific filters and the
 * new bulk endpoints.
 */

import React, { useMemo, useState } from 'react';
import { PageHeader, Tabs, Snackbar } from '../../components/ui';
import type { TabItem } from '../../components/ui';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import {
	useLocationVarianceFilters,
	useTabSummary,
	useOutliers,
	VARIANCE_TABS,
	tabById,
	LocationVarianceFilters,
	OutliersCard,
	LocationVarianceTable,
	VarianceDrillPanel,
} from '../../features/location-variance';

interface DrillState {
	locationId: number;
	month: string;
}

export const LocationVariance: React.FC = () => {
	const filters = useLocationVarianceFilters();

	const [activeTabId, setActiveTabId] = useState<string>(VARIANCE_TABS[0].id);
	const activeTab = tabById(activeTabId);

	const [drill, setDrill] = useState<DrillState | null>(null);
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		type: 'error' as 'success' | 'error' | 'info',
	});

	// Convert cityIds (string[]) → numbers for API
	const cityIdsNum = useMemo(
		() => filters.selectedCityIds.map((s) => Number(s)).filter((n) => Number.isFinite(n)),
		[filters.selectedCityIds]
	);

	const filtersReady = filters.selectedMonths.length > 0;

	// Per-tab summary fetch
	const summary = useTabSummary({
		billingTypeId: activeTab?.billingTypeId ?? null,
		billingSubTypeId: activeTab?.billingSubTypeId ?? null,
		cityIds: cityIdsNum.length ? cityIdsNum : null,
		months: filters.selectedMonths,
		enabled: filtersReady,
	});

	// Outliers card fetch — uses the most recently selected month
	const outliers = useOutliers({
		month: filters.latestSelectedMonth,
		cityIds: cityIdsNum.length ? cityIdsNum : null,
		enabled: filtersReady,
	});

	// Surface errors from either hook via Snackbar
	React.useEffect(() => {
		const err = summary.error || outliers.error;
		if (err) {
			setSnackbar({ open: true, message: err, type: 'error' });
		}
	}, [summary.error, outliers.error]);

	const tabItems: TabItem[] = useMemo(
		() =>
			VARIANCE_TABS.map((t) => {
				const isActive = t.id === activeTabId;
				const count = isActive && summary.data ? summary.data.locations.length : null;
				return {
					id: t.id,
					label: count != null ? `${t.label} (${count})` : t.label,
					content: (
						<div className='p-4'>
							{!filtersReady && (
								<div className='py-12 text-center text-sm text-gray-500'>
									Pick at least one month to load data.
								</div>
							)}
							{filtersReady && isActive && (
								<LocationVarianceTable
									locations={summary.data?.locations || []}
									months={filters.selectedMonths}
									loading={summary.loading}
									searchText={filters.search}
									onRowClick={(locationId, month) => setDrill({ locationId, month })}
								/>
							)}
						</div>
					),
				};
			}),
		[activeTabId, summary.data, summary.loading, filtersReady, filters.selectedMonths, filters.search]
	);

	// Build a human label of the cities currently selected — shown in the page
	// header so users always see which slice of data is on screen.
	const selectedCityLabels = useMemo(() => {
		if (!filters.selectedCityIds.length) return 'All cities';
		const labels = filters.selectedCityIds
			.map((id) => filters.cityOptions.find((c) => c.value === id)?.label)
			.filter(Boolean) as string[];
		if (labels.length === 0) return 'All cities';
		if (labels.length === 1) return labels[0];
		if (labels.length <= 3) return labels.join(', ');
		return `${labels.slice(0, 2).join(', ')} +${labels.length - 2} more`;
	}, [filters.selectedCityIds, filters.cityOptions]);

	return (
		<ErrorBoundary>
			<div className='space-y-6'>
				<PageHeader
					title='Location Revenue Variance'
					locationName={selectedCityLabels}
					totalItems={summary.data?.locations.length || 0}
					itemType={summary.data?.locations.length === 1 ? 'location' : 'locations'}
					icon='📊'
				/>

				<LocationVarianceFilters
					year={filters.year}
					yearOptions={filters.yearOptions}
					onYearChange={filters.setYear}
					selectedMonths={filters.selectedMonths}
					onMonthToggle={filters.toggleMonth}
					showCityFilter={filters.showCityFilter}
					cityOptions={filters.cityOptions}
					selectedCityIds={filters.selectedCityIds}
					onCityChange={filters.setSelectedCityIds}
					loadingCities={filters.loadingCities}
					search={filters.search}
					onSearchChange={filters.setSearch}
				/>

				{filtersReady && (
					<OutliersCard
						data={outliers.data}
						loading={outliers.loading}
						error={outliers.error}
						month={filters.latestSelectedMonth}
						onRowClick={(locationId, month) => setDrill({ locationId, month })}
					/>
				)}

				<ErrorBoundary>
					<div className='bg-white rounded-lg shadow-sm'>
						<Tabs
							items={tabItems}
							activeTab={activeTabId}
							onTabChange={setActiveTabId}
							variant='underline'
							className='w-full'
						/>
					</div>
				</ErrorBoundary>

				<VarianceDrillPanel
					open={drill !== null}
					locationId={drill?.locationId ?? null}
					month={drill?.month ?? null}
					onClose={() => setDrill(null)}
				/>

				<Snackbar
					open={snackbar.open}
					onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
					message={snackbar.message}
					type={snackbar.type}
				/>
			</div>
		</ErrorBoundary>
	);
};

export default LocationVariance;
