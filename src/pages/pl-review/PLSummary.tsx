import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { PageHeader, Tabs, Snackbar } from '../../components/ui';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { PLFilters, usePLFilters } from '../../features/p-and-l';
import { getPLTabItems } from '../../features/p-and-l/config/tabs';
import {
	useExpenditureData,
	useUnitEconomicsData,
	useEBITDAData,
	useClientWisePLData,
	useEscalationData,
} from '../../features/p-and-l/hooks/usePLTabData';

/**
 * P&L Summary Page
 * Displays profit and loss summary data with tabbed interface
 */
export const PLSummary: React.FC = () => {
	const { user } = useSelector((state: RootState) => state.auth);
	const {
		selectedMonth,
		selectedYear,
		selectedFacility,
		monthOptions,
		yearOptions,
		setSelectedMonth,
		setSelectedYear,
		setSelectedFacility,
	} = usePLFilters();

	const [activeTab, setActiveTab] = useState<string>('ebitda');
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		type: 'error' as 'success' | 'error' | 'info',
	});

	// Determine if we should fetch - all filters must be set
	const shouldFetch = !!(selectedMonth && selectedYear && selectedFacility);

	// Call all 5 APIs at page level - regardless of active tab
	// This ensures all APIs are called when filters change, not when tabs change
	const expenditureQuery = useExpenditureData(
		selectedFacility,
		selectedMonth,
		selectedYear,
		shouldFetch
	);
	const unitEconomicsQuery = useUnitEconomicsData(
		user?.city_id,
		selectedFacility,
		selectedMonth,
		selectedYear,
		shouldFetch
	);
	const ebitdaQuery = useEBITDAData(
		user?.city_id,
		selectedFacility,
		selectedMonth,
		selectedYear,
		shouldFetch
	);
	const clientWisePLQuery = useClientWisePLData(
		user?.city_id,
		selectedFacility,
		selectedMonth,
		selectedYear,
		shouldFetch
	);
	const escalationsQuery = useEscalationData(
		user?.city_id,
		selectedFacility,
		selectedMonth,
		selectedYear,
		shouldFetch
	);

	// Handle errors from any API
	useEffect(() => {
		const errors = [
			expenditureQuery.error,
			unitEconomicsQuery.error,
			ebitdaQuery.error,
			clientWisePLQuery.error,
			escalationsQuery.error,
		].filter(Boolean);

		if (errors.length > 0 && shouldFetch) {
			const firstError = errors[0];
			if (firstError) {
				setSnackbar({
					open: true,
					message: `Failed to load data: ${firstError.message}`,
					type: 'error',
				});
			}
		}
	}, [
		expenditureQuery.error,
		unitEconomicsQuery.error,
		ebitdaQuery.error,
		clientWisePLQuery.error,
		escalationsQuery.error,
		shouldFetch,
	]);

	// Handle search - no-op since APIs auto-fetch on filter change
	const handleSearch = () => {
		// APIs are already called automatically when filters change
		// This is kept for UI consistency
	};

	// Get tab items from config - pass data directly instead of enabled flag
	const tabItems = useMemo(
		() =>
			getPLTabItems({
				cityId: user?.city_id,
				facilityId: selectedFacility,
				month: selectedMonth,
				year: selectedYear,
				enabled: true, // Always enabled since we're calling APIs at page level
				onError: (message: string) => {
					setSnackbar({
						open: true,
						message,
						type: 'error',
					});
				},
			}),
		[selectedFacility, selectedMonth, selectedYear, user?.city_id]
	);

	return (
		<ErrorBoundary>
			<div className='space-y-6'>
				<PageHeader
					title='P&L Summary'
					locationName={user?.city_name || 'City'}
					totalItems={0}
					itemType='summary'
					icon='💰'
				/>

				<PLFilters
					selectedMonth={selectedMonth}
					selectedYear={selectedYear}
					selectedFacility={selectedFacility}
					monthOptions={monthOptions}
					yearOptions={yearOptions}
					onMonthChange={setSelectedMonth}
					onYearChange={setSelectedYear}
					onFacilityChange={setSelectedFacility}
					onSearch={handleSearch}
				/>

				<ErrorBoundary>
					<div className='bg-white rounded-lg shadow-sm'>
						<Tabs
							items={tabItems}
							activeTab={activeTab}
							onTabChange={setActiveTab}
							variant='underline'
							className='w-full'
						/>
					</div>
				</ErrorBoundary>

				<Snackbar
					open={snackbar.open}
					onClose={() => setSnackbar({ ...snackbar, open: false })}
					message={snackbar.message}
					type={snackbar.type}
				/>
			</div>
		</ErrorBoundary>
	);
};

export default PLSummary;
