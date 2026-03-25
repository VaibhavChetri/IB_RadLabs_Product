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
		selectedCity,
		selectedFacility,
		monthOptions,
		yearOptions,
		cityOptions,
		facilityOptions,
		setSelectedMonth,
		setSelectedYear,
		setSelectedCity,
		setSelectedFacility,
	} = usePLFilters();

	const [activeTab, setActiveTab] = useState<string>('ebitda');
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		type: 'error' as 'success' | 'error' | 'info',
	});

	// Determine if we should fetch - all filters must be set
	// For user_type_id=4, city must also be selected
	const shouldFetch = !!(
		selectedMonth &&
		selectedYear &&
		selectedFacility &&
		(user?.userTypeId !== 4 || selectedCity)
	);

	// Determine city_id to use - selected city for user_type_id=4, otherwise user's city
	const cityId = user?.userTypeId === 4 ? (selectedCity ? parseInt(selectedCity) : undefined) : user?.city_id;

	// Call APIs at page level - regardless of active tab
	// This ensures all APIs are called when filters change, not when tabs change
	// Note: ClientWisePLData is called inside the ClientWisePLTab component with its own week filter
	const expenditureQuery = useExpenditureData(
		selectedFacility,
		selectedMonth,
		selectedYear,
		shouldFetch
	);
	const unitEconomicsQuery = useUnitEconomicsData(
		cityId,
		selectedFacility,
		selectedMonth,
		selectedYear,
		shouldFetch
	);
	const ebitdaQuery = useEBITDAData(
		cityId,
		selectedFacility,
		selectedMonth,
		selectedYear,
		shouldFetch
	);
	const escalationsQuery = useEscalationData(
		cityId,
		selectedFacility,
		selectedMonth,
		selectedYear,
		shouldFetch
	);

	// Handle errors from any API
	// Note: ClientWisePL errors are handled in the tab component via onError callback
	useEffect(() => {
		const errors = [
			expenditureQuery.error,
			unitEconomicsQuery.error,
			ebitdaQuery.error,
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
		escalationsQuery.error,
		shouldFetch,
		cityId,
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
				cityId,
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
		[cityId, selectedFacility, selectedMonth, selectedYear]
	);

	return (
		<ErrorBoundary>
			<div className='space-y-6'>
				<PageHeader
					title='P&L Summary'
					locationName={user?.city_name || 'City'}
					totalItems={0}
					itemType=''
					icon='💰'
				/>

				<PLFilters
					selectedMonth={selectedMonth}
					selectedYear={selectedYear}
					selectedCity={selectedCity}
					selectedFacility={selectedFacility}
					monthOptions={monthOptions}
					yearOptions={yearOptions}
					cityOptions={cityOptions}
					facilityOptions={facilityOptions}
					onMonthChange={setSelectedMonth}
					onYearChange={setSelectedYear}
					onCityChange={setSelectedCity}
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
